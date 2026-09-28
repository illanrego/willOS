"""Render models: one exporter per migrated window.

Each exporter turns a store into data/<window>.json, which the read-only window
in the desktop fetches. Adding a migrated window means adding an entry to
EXPORTERS - nothing in the browser derives state.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from . import notes, store

# Content: the end of each lane ladder in contentflow.
LIVE_STATES = ("published", "posted", "delivered")
TERMINAL_STATES = ("done", "skipped")
LANE_ORDER = ("standup", "comics", "moc", "teacher", "freela")
CONTENTFLOW_DEFAULT_STORE = Path.home() / ".local" / "share" / "contentflow" / "board.json"

EXPORTERS = ("content", "notes", "recs", "skills", "tasks", "planner", "finance")


def contentflow_store() -> Path:
    return Path(os.environ.get("CONTENTFLOW_STORE", CONTENTFLOW_DEFAULT_STORE)).expanduser()


def load_cards(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    cards = payload.get("cards") if isinstance(payload, dict) else payload
    return [card for card in cards or [] if isinstance(card, dict)]


def local_day(stamp: str) -> str:
    """UTC ISO stamp -> the local calendar day (the day Illan actually lived)."""
    if not stamp:
        return ""
    try:
        moment = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
    except ValueError:
        return ""
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return moment.astimezone().date().isoformat()


def live_day(card: dict) -> str:
    """Day the card first reached a live state, or "" if it never did.

    Cards closed later (done/skipped) still count: the event log records the
    transition into the live state.
    """
    days = []
    for event in card.get("events") or []:
        if not isinstance(event, dict):
            continue
        detail = str(event.get("detail") or "")
        if "->" not in detail:
            continue
        target = detail.rsplit("->", 1)[1].strip()
        if target not in LIVE_STATES:
            continue
        day = local_day(event.get("at") or "")
        if day:
            days.append(day)
    if days:
        return min(days)
    if str(card.get("state") or "") in LIVE_STATES:
        return local_day(card.get("updated_at") or "")
    return ""


def lane_codes() -> list[str]:
    """The lane codes contentflow actually has, read from the board itself.

    Never re-declare a lane list: contentflow owns lane identity.
    """
    path = contentflow_store()
    if not path.exists():
        return []
    codes: list[str] = []
    for card in load_cards(path):
        lane = str(card.get("lane") or "")
        if lane and lane not in codes:
            codes.append(lane)
    return codes


def build_content_model(cards: list[dict], with_titles: bool = False) -> dict:
    days: dict[str, dict[str, int]] = {}
    lanes: list[str] = []
    in_flight = []

    for card in cards:
        lane = str(card.get("lane") or "")
        if lane and lane not in lanes:
            lanes.append(lane)

        day = live_day(card)
        if lane and day:
            days.setdefault(day, {})
            days[day][lane] = days[day].get(lane, 0) + 1

        state = str(card.get("state") or "")
        if lane and state not in TERMINAL_STATES:
            entry = {"id": card.get("id"), "lane": lane, "state": state}
            if with_titles:
                entry["title"] = str(card.get("title") or "")
            in_flight.append(entry)

    ordered = [lane for lane in LANE_ORDER if lane in lanes]
    ordered += [lane for lane in lanes if lane not in LANE_ORDER]

    return {
        "generated_at": store.now_iso(),
        "source": f"contentflow board.json ({len(cards)} cards)",
        "lanes": ordered,
        "days": {key: days[key] for key in sorted(days)},
        "cards": in_flight,
    }


def export_content(with_titles: bool = False) -> tuple[str, int]:
    from . import minimums

    path = contentflow_store()
    if not path.exists():
        raise SystemExit(f"no contentflow board at {path} (set CONTENTFLOW_STORE)")
    cards = load_cards(path)
    model = build_content_model(cards, with_titles=with_titles)

    # The weekly floor is a planning-layer number, so it is stamped on here
    # rather than owned by the board: content still never learns about cadence.
    floors = minimums.load()
    start, end = minimums.week_days()
    counts: dict[str, int] = {}
    for day, lanes in model["days"].items():
        if start <= day <= end:
            for lane, count in lanes.items():
                counts[lane] = counts.get(lane, 0) + int(count)
    model["week"] = {"start": start, "end": end}
    model["weekly"] = {
        # a lane is namespaced: `standup` the lane is not `standup` the skill
        lane: {"count": counts.get(lane, 0), "minimum": minimums.get(floors, minimums.lane_code(lane))}
        for lane in model["lanes"]
    }

    store.write_render_model("content", model)
    return "content", len(model["cards"])


def export_notes() -> tuple[str, int]:
    payload = notes.load()
    sections = []
    for section in payload["sections"]:
        sections.append(
            {
                "slug": section.get("slug", ""),
                "title": section.get("title", ""),
                "lines": [
                    {"id": line.get("id"), "text": line.get("text", ""), "at": line.get("at", "")}
                    for line in section.get("lines", [])
                ],
            }
        )
    total = sum(len(section["lines"]) for section in sections)
    store.write_render_model(
        "notes",
        {
            "generated_at": store.now_iso(),
            "source": "will notes store",
            "sections": sections,
        },
    )
    return "notes", total


def export_recs() -> tuple[str, int]:
    from . import recs

    items = recs.rows(recs.load())
    store.write_render_model(
        "recs",
        {
            "generated_at": store.now_iso(),
            "source": "will recs store",
            "count": len(items),
            "items": items,
        },
    )
    return "recs", len(items)


def export_skills() -> tuple[str, int]:
    from . import activities, minimums

    payload = activities.load()
    floors = minimums.load()
    # A hidden activity is a retired counter, not a skill: it has no card and no
    # calendar days, so it is left out of the model entirely (its history stays
    # in the store; `will skill show <code>` brings it back).
    rows = [row for row in activities.skill_summary(payload) if not row["hidden"]]
    days: dict[str, dict[str, int]] = {}
    for row in rows:
        for day, value in row["days"].items():
            days.setdefault(day, {})[row["code"]] = int(value)
    start, end = minimums.week_days()
    store.write_render_model(
        "skills",
        {
            "generated_at": store.now_iso(),
            "source": "will activities store",
            "week": {"start": start, "end": end},
            "skills": [
                {
                    "code": row["code"],
                    "label": row["label"],
                    "total": row["total"],
                    "today": row["today"],
                    "streak": row["streak"],
                    "month_total": row["month_total"],
                    # the x/y the card draws: this week's occurrences over the floor
                    "week": minimums.count_in_week(row["days"]),
                    "weekly_minimum": minimums.get(floors, row["code"]),
                }
                for row in rows
            ],
            "days": {key: days[key] for key in sorted(days)},
        },
    )
    return "skills", len(rows)


def export_tasks() -> tuple[str, int]:
    from . import tasks

    payload = tasks.load()
    summary = tasks.summary(payload)
    columns = {
        state: [
            {
                "id": task.get("id"),
                "text": task.get("text", ""),
                "lane": task.get("lane", ""),
                "created_at": task.get("created_at", ""),
                "done_at": task.get("done_at", ""),
            }
            for task in rows
        ]
        for state, rows in summary["columns"].items()
    }
    store.write_render_model(
        "tasks",
        {
            "generated_at": store.now_iso(),
            "source": "will tasks store",
            "open": summary["open"],
            "counts": summary["counts"],
            "columns": columns,
        },
    )
    return "tasks", summary["open"]


def export_planner() -> tuple[str, int]:
    from . import planner

    payload = planner.load()
    summary = planner.summary(payload)
    current_ids = {plan.get("id") for plan in summary["current"]}
    upcoming_ids = {plan.get("id") for plan in summary["upcoming"]}
    store.write_render_model(
        "planner",
        {
            "generated_at": store.now_iso(),
            "source": "will planner store",
            "plans": [
                {
                    "id": plan.get("id"),
                    "title": plan.get("title", ""),
                    "start": plan.get("start", ""),
                    "end": plan.get("end", ""),
                    "note": plan.get("note", ""),
                    "state": (
                        "current"
                        if plan.get("id") in current_ids
                        else "upcoming"
                        if plan.get("id") in upcoming_ids
                        else "past"
                    ),
                }
                for plan in summary["plans"]
            ],
        },
    )
    return "planner", len(summary["plans"])


def export_finance() -> tuple[str, int]:
    from . import finance

    payload = finance.load()
    summary = finance.summary(payload)
    store.write_render_model(
        "finance",
        {
            "generated_at": store.now_iso(),
            "source": "will finance store",
            "totals": summary["totals"],
            "months": summary["months"],
            "categories": summary["categories"],
            "recent": [
                {
                    "id": entry.get("id"),
                    "date": entry.get("date", ""),
                    "kind": entry.get("kind", ""),
                    "amount": finance.from_cents(int(entry.get("amount_cents", 0))),
                    "category": entry.get("category", ""),
                    "note": entry.get("note", ""),
                }
                for entry in summary["recent"]
            ],
        },
    )
    return "finance", summary["totals"]["count"]


DISPATCH = {
    "content": export_content,
    "notes": export_notes,
    "recs": export_recs,
    "skills": export_skills,
    "tasks": export_tasks,
    "planner": export_planner,
    "finance": export_finance,
}

UNITS = {
    "content": "cards",
    "notes": "lines",
    "recs": "recs",
    "skills": "skills",
    "tasks": "open tasks",
    "planner": "plans",
    "finance": "entries this month",
}


def run(domains: list[str] | None = None, quiet: bool = False) -> int:
    wanted = list(domains or EXPORTERS)
    unknown = [name for name in wanted if name not in EXPORTERS]
    if unknown:
        raise SystemExit(f"no exporter for: {', '.join(unknown)} (known: {', '.join(EXPORTERS)})")

    for name in wanted:
        _, count = DISPATCH[name]()
        if not quiet:
            print(f"exported {name} -> {store.data_dir() / (name + '.json')} ({count} {UNITS[name]})")
    return 0
