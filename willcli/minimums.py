"""Weekly minimums: the floor a lane or an activity is expected to hit each week.

Planning sits ABOVE content and above the activity ledger, so the numbers live
in this one map instead of being copied into every record. A key is either an
activity code (`physique`, `standup`, `coding`) or a contentflow lane code
(`teacher`, `moc`).

Missing or 0 means no floor: that thing runs at its own pace and its card shows
a plain count. This replaces the old per-day "obligation" flag, which forced
everything through the same daily checkbox whether or not it fitted.
"""

from __future__ import annotations

from datetime import date, timedelta

from . import store


def blank() -> dict:
    return {"version": 1, "minimums": {}}


def load() -> dict:
    payload = store.load("minimums", blank)
    payload.setdefault("minimums", {})
    return payload


def week_start(today: str = "") -> str:
    """Monday of the week the given local day belongs to."""
    day = date.fromisoformat(today or store.today_key())
    return (day - timedelta(days=day.weekday())).isoformat()


def week_days(today: str = "") -> tuple[str, str]:
    start = date.fromisoformat(week_start(today))
    return start.isoformat(), (start + timedelta(days=6)).isoformat()


def set_minimum(payload: dict, code: str, value: int) -> tuple[str, int]:
    """Set (or clear, with 0) the weekly floor for an activity or lane."""
    wanted = store.slugify(code)
    if not wanted:
        raise SystemExit("usage: will min <code> <n>   (0 clears the floor)")
    amount = max(0, int(value))
    if amount:
        payload.setdefault("minimums", {})[wanted] = amount
    else:
        payload.setdefault("minimums", {}).pop(wanted, None)
    return wanted, amount


def get(payload: dict, code: str) -> int:
    return int((payload.get("minimums") or {}).get(store.slugify(code), 0) or 0)


def rows(payload: dict) -> list[dict]:
    return [
        {"code": code, "minimum": int(value)}
        for code, value in sorted((payload.get("minimums") or {}).items())
    ]


def count_in_week(days: dict, today: str = "") -> int:
    """Occurrences inside the current Monday-Sunday week, from a {day: count} map."""
    start, end = week_days(today)
    return sum(int(value) for day, value in (days or {}).items() if start <= str(day) <= end)
