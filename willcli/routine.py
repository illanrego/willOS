"""Routine (the old Dailies): obligations I routinely do, one tick per day.

A routine is a code + label + the days it was done. `will done <code>` is the
whole interface; the window only shows the history.
"""

from __future__ import annotations

from . import store

DEFAULT_ROUTINES = (
    ("morning-operator", "Morning operator"),
    ("job-hunting", "Job hunting"),
)


def blank() -> dict:
    return {
        "version": 1,
        "routines": [
            {"code": code, "label": label, "days": [], "created_at": store.now_iso()}
            for code, label in DEFAULT_ROUTINES
        ],
    }


def load() -> dict:
    payload = store.load("routine", blank)
    payload.setdefault("routines", [])
    return payload


def find(payload: dict, code: str):
    wanted = store.slugify(code)
    for routine in payload["routines"]:
        if routine.get("code") == wanted:
            return routine
    return None


def ensure(payload: dict, code: str, label: str = "") -> dict:
    routine = find(payload, code)
    if routine:
        return routine
    title = str(label or code).strip()
    routine = {"code": store.slugify(code), "label": title, "days": [], "created_at": store.now_iso()}
    payload["routines"].append(routine)
    return routine


def mark(payload: dict, code: str, day: str = "", done: bool = True) -> dict:
    routine = find(payload, code)
    if not routine:
        raise SystemExit(f"no routine '{code}'. See: will routine list")
    target = day or store.today_key()
    days = routine.setdefault("days", [])
    if done and target not in days:
        days.append(target)
        days.sort()
    if not done and target in days:
        days.remove(target)
    return routine


def streak(routine: dict, today: str = "") -> int:
    """Consecutive days up to today (or yesterday, if today is not ticked yet)."""
    days = set(routine.get("days", []))
    if not days:
        return 0
    from datetime import date, timedelta

    cursor = date.fromisoformat(today or store.today_key())
    if cursor.isoformat() not in days:
        cursor = cursor - timedelta(days=1)
    count = 0
    while cursor.isoformat() in days:
        count += 1
        cursor = cursor - timedelta(days=1)
    return count


def remove(payload: dict, code: str) -> dict:
    routine = find(payload, code)
    if not routine:
        raise SystemExit(f"no routine '{code}'")
    payload["routines"].remove(routine)
    return routine


def summary(payload: dict, today: str = "") -> list[dict]:
    today = today or store.today_key()
    month_prefix = today[:7]
    rows = []
    for routine in payload["routines"]:
        days = sorted(routine.get("days", []))
        rows.append(
            {
                "code": routine.get("code", ""),
                "label": routine.get("label", ""),
                "days": days,
                "done_today": today in days,
                "streak": streak(routine, today),
                "month_count": len([day for day in days if day.startswith(month_prefix)]),
                "last_done_on": days[-1] if days else "",
            }
        )
    return rows
