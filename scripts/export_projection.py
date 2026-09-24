#!/usr/bin/env python3
"""contentflow board.json -> data/projection.json (the render model willOS draws).

Increment 1 of willOS: the browser never derives content state, so the rule for
"this card went live on day X" lives here, on the CLI side, exactly once.

Live states are the end of each lane ladder in contentflow:
  moc/teacher publish, standup/comics post, freela delivers to the client.

Card TITLES are excluded by default: the render model is meant to be safe to
publish. Pass --with-titles to include them.

This script is a placeholder for `will content export`; when the umbrella CLI
lands, this logic moves behind that command.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

LIVE_STATES = ("published", "posted", "delivered")
TERMINAL_STATES = ("done", "skipped")
LANE_ORDER = ("standup", "comics", "moc", "teacher", "freela")
DEFAULT_STORE = Path.home() / ".local" / "share" / "contentflow" / "board.json"


def store_path() -> Path:
    return Path(os.environ.get("CONTENTFLOW_STORE", DEFAULT_STORE)).expanduser()


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


def build(cards: list[dict], with_titles: bool) -> dict:
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
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source": f"contentflow board.json ({len(cards)} cards)",
        "lanes": ordered,
        "days": {key: days[key] for key in sorted(days)},
        "cards": in_flight,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Export the contentflow board as the willOS render model.")
    parser.add_argument("--store", default=str(store_path()), help="path to board.json")
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent.parent / "data" / "projection.json"),
        help="output file",
    )
    parser.add_argument("--with-titles", action="store_true", help="include card titles")
    args = parser.parse_args()

    path = Path(args.store).expanduser()
    if not path.exists():
        parser.error(f"no board at {path}")

    cards = load_cards(path)
    projection = build(cards, args.with_titles)

    out = Path(args.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(projection, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    posted_days = len(projection["days"])
    print(
        f"{len(cards)} cards -> {out} "
        f"({posted_days} posted days, {len(projection['cards'])} in flight, "
        f"lanes: {', '.join(projection['lanes'])})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
