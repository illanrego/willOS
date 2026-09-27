"""One occurrence ledger behind the Routine and Gamify views.

An activity has one day->occurrence count map. Routine is the binary reading
(count > 0) for activities marked as obligations; Gamify is the counted reading.
Sources and subtypes can be attached by future importers without creating a
second counter.
"""

from __future__ import annotations

from datetime import date, timedelta

from . import store

ACTIVITY_ALIASES = {
    "skill-coding": "coding",
    "skill-content": "content",
    "skill-fitness": "physique",
    "skill-standup": "standup",
    "skill-meditation": "meditation",
    "skill-jobhunting": "jobhunting",
    "fitness": "physique",
    "job-hunting": "jobhunting",
}

DEFAULT_ACTIVITIES = (
    ("morning-operator", "Morning operator", True),
    ("jobhunting", "Job Hunting", True),
    ("coding", "Coding", False),
    ("physique", "Physique", False),
    ("standup", "Stand Up", False),
    ("meditation", "Meditation", False),
    ("content", "Content", False),
)


def canonical_code(code: str) -> str:
    wanted = store.slugify(code)
    return ACTIVITY_ALIASES.get(wanted, wanted)


def blank() -> dict:
    return {
        "version": 1,
        "activities": [
            {"code": code, "label": label, "obligation": obligation, "days": {}, "occurrences": {}, "created_at": store.now_iso()}
            for code, label, obligation in DEFAULT_ACTIVITIES
        ],
    }


def _merge_entry(payload: dict, code: str, label: str, obligation: bool = False) -> dict:
    wanted = canonical_code(code)
    entry = find(payload, wanted)
    if entry is None:
        entry = {"code": wanted, "label": label or wanted, "obligation": bool(obligation), "days": {}, "created_at": store.now_iso()}
        payload.setdefault("activities", []).append(entry)
    elif obligation:
        entry["obligation"] = True
    if label and (not entry.get("label") or entry["label"] == wanted):
        entry["label"] = label
    entry.setdefault("days", {})
    entry.setdefault("occurrences", {})
    return entry


def _append_occurrence(entry: dict, day: str, source: str = "legacy", metadata: dict | None = None) -> None:
    entry.setdefault("occurrences", {}).setdefault(day, []).append({
        "source": source,
        **(metadata or {}),
    })


def _legacy_occurrences(entry: dict, day: str, amount: int, source: str) -> None:
    existing = len(entry.setdefault("occurrences", {}).get(day, []))
    for _ in range(max(0, int(amount) - existing)):
        _append_occurrence(entry, day, source)


def migrate_legacy() -> dict:
    payload = blank()
    routine_path = store.store_path("routine")
    skills_path = store.store_path("skills")
    if routine_path.exists():
        legacy = store.load("routine", {"routines": []})
        for row in legacy.get("routines", []):
            entry = _merge_entry(payload, row.get("code", ""), row.get("label", ""), obligation=True)
            for day in row.get("days", []):
                entry["days"][day] = max(1, int(entry["days"].get(day, 0)))
                _legacy_occurrences(entry, day, entry["days"][day], "legacy-routine")
    if skills_path.exists():
        legacy = store.load("skills", {"skills": []})
        for row in legacy.get("skills", []):
            entry = _merge_entry(payload, row.get("code", ""), row.get("label", ""))
            for day, value in (row.get("days") or {}).items():
                entry["days"][day] = max(int(entry["days"].get(day, 0)), max(0, int(value)))
                _legacy_occurrences(entry, day, entry["days"][day], "legacy-skill")
    return payload


def load() -> dict:
    path = store.store_path("activities")
    if path.exists():
        payload = store.load("activities", blank)
        payload.setdefault("activities", [])
        return payload
    payload = migrate_legacy()
    store.save("activities", payload)
    return payload


def find(payload: dict, code: str):
    wanted = canonical_code(code)
    return next((item for item in payload.get("activities", []) if item.get("code") == wanted), None)


def ensure(payload: dict, code: str, label: str = "", obligation: bool = False) -> dict:
    return _merge_entry(payload, code, label or canonical_code(code), obligation)


def record(payload: dict, code: str, amount: int = 1, day: str = "", source: str = "", metadata: dict | None = None) -> tuple[dict, int]:
    if amount < 1:
        raise SystemExit("occurrence amount must be at least 1")
    entry = find(payload, code)
    if entry is None:
        entry = ensure(payload, code, code)
    target = day or store.today_key()
    days = entry.setdefault("days", {})
    days[target] = int(days.get(target, 0)) + amount
    for _ in range(amount):
        _append_occurrence(entry, target, source or "manual", metadata)
    if source:
        entry.setdefault("sources", {})[target] = source
    return entry, days[target]


def adjust(payload: dict, code: str, amount: int, day: str = "", source: str = "") -> tuple[dict, int]:
    """Add or remove occurrences, clamping removal at zero."""
    if amount == 0:
        raise SystemExit("occurrence adjustment cannot be zero")
    if amount > 0:
        return record(payload, code, amount=amount, day=day, source=source)
    entry = find(payload, code)
    if entry is None:
        raise SystemExit(f"no activity '{code}'")
    target = day or store.today_key()
    days = entry.setdefault("days", {})
    current = int(days.get(target, 0))
    remaining = max(0, current + amount)
    remove_count = current - remaining
    occurrences = entry.setdefault("occurrences", {}).get(target, [])
    if remove_count:
        del occurrences[max(0, len(occurrences) - remove_count):]
    if remaining:
        days[target] = remaining
    else:
        days.pop(target, None)
        entry.setdefault("occurrences", {}).pop(target, None)
        entry.setdefault("sources", {}).pop(target, None)
    return entry, remaining


def clear(payload: dict, code: str, day: str = "") -> dict:
    entry = find(payload, code)
    if entry is None:
        raise SystemExit(f"no activity '{code}'")
    target = day or store.today_key()
    entry.setdefault("days", {}).pop(target, None)
    entry.setdefault("occurrences", {}).pop(target, None)
    entry.setdefault("sources", {}).pop(target, None)
    return entry


def remove(payload: dict, code: str) -> dict:
    entry = find(payload, code)
    if entry is None:
        raise SystemExit(f"no activity '{code}'")
    payload["activities"].remove(entry)
    return entry


def total(entry: dict) -> int:
    return sum(max(0, int(value)) for value in entry.get("days", {}).values())


def streak(entry: dict, today: str = "") -> int:
    cursor = date.fromisoformat(today or store.today_key())
    days = {key for key, value in entry.get("days", {}).items() if int(value) > 0}
    count = 0
    while cursor.isoformat() in days:
        count += 1
        cursor -= timedelta(days=1)
    return count


def _summary(entry: dict, today: str = "") -> dict:
    target = today or store.today_key()
    return {
        "code": entry["code"],
        "label": entry["label"],
        "obligation": bool(entry.get("obligation")),
        "today": int(entry.get("days", {}).get(target, 0)),
        "done_today": int(entry.get("days", {}).get(target, 0)) > 0,
        "total": total(entry),
        "streak": streak(entry, target),
        "month_total": sum(v for k, v in entry.get("days", {}).items() if k[:7] == target[:7]),
        "month_count": sum(1 for k, v in entry.get("days", {}).items() if k[:7] == target[:7] and int(v) > 0),
        "last_done_on": max(entry.get("days", {}), default=""),
        "days": {k: int(v) for k, v in entry.get("days", {}).items()},
    }


def skill_summary(payload: dict, today: str = "") -> list[dict]:
    return [_summary(entry, today) for entry in payload.get("activities", [])]


def routine_summary(payload: dict, today: str = "") -> list[dict]:
    return [row for row in skill_summary(payload, today) if row["obligation"]]


def merge_legacy_skill(payload: dict, row: dict) -> dict:
    entry = _merge_entry(payload, row.get("code", ""), row.get("label", ""))
    for day, value in (row.get("days") or {}).items():
        entry["days"][day] = max(int(entry["days"].get(day, 0)), max(0, int(value)))
    return entry


def merge_legacy_routine(payload: dict, row: dict) -> dict:
    entry = _merge_entry(payload, row.get("code", ""), row.get("label", ""), obligation=True)
    for day in row.get("days", []):
        entry["days"][day] = max(1, int(entry["days"].get(day, 0)))
    return entry
