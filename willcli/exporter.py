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

EXPORTERS = ("content", "notes", "routine", "skills", "tasks", "planner", "finance")


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
    path = contentflow_store()
    if not path.exists():
        raise SystemExit(f"no contentflow board at {path} (set CONTENTFLOW_STORE)")
    cards = load_cards(path)
    model = build_content_model(cards, with_titles=with_titles)
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


def export_routine() -> tuple[str, int]:
    from . import routine

    payload = routine.load()
    rows = routine.summary(payload)
    days: dict[str, dict[str, int]] = {}
    for row in rows:
        for day in row["days"]:
            days.setdefault(day, {})[row["code"]] = 1
    store.write_render_model(
        "routine",
        {
            "generated_at": store.now_iso(),
            "source": "will routine store",
            "routines": [
                {
                    "code": row["code"],
                    "label": row["label"],
                    "streak": row["streak"],
                    "done_today": row["done_today"],
                    "month_count": row["month_count"],
                    "last_done_on": row["last_done_on"],
                }
                for row in rows
            ],
            "days": {key: days[key] for key in sorted(days)},
        },
    )
    return "routine", len(rows)


def export_skills() -> tuple[str, int]:
    from . import skills

    payload = skills.load()
    rows = skills.summary(payload)
    days: dict[str, dict[str, int]] = {}
    for row in rows:
        for day, value in row["days"].items():
            days.setdefault(day, {})[row["code"]] = int(value)
    store.write_render_model(
        "skills",
        {
            "generated_at": store.now_iso(),
            "source": "will skills store",
            "skills": [
                {
                    "code": row["code"],
                    "label": row["label"],
                    "total": row["total"],
                    "today": row["today"],
                    "streak": row["streak"],
                    "month_total": row["month_total"],
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
    "routine": export_routine,
    "skills": export_skills,
    "tasks": export_tasks,
    "planner": export_planner,
    "finance": export_finance,
}

UNITS = {
    "content": "cards",
    "notes": "lines",
    "routine": "routines",
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
