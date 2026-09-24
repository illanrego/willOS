"""Skills (the old Gamify): day-keyed counts per skill.

The web face drew meters and a streak calendar from Supabase trackers; here the
terminal owns the numbers and the window only draws them.
"""

from __future__ import annotations

from . import store

DEFAULT_SKILLS = (
    ("coding", "Coding"),
    ("fitness", "Physique"),
    ("standup", "Stand Up"),
    ("meditation", "Meditation"),
    ("jobhunting", "Job Hunting"),
)


def blank() -> dict:
    return {
        "version": 1,
        "skills": [
            {"code": code, "label": label, "days": {}, "created_at": store.now_iso()}
            for code, label in DEFAULT_SKILLS
        ],
    }


def load() -> dict:
    payload = store.load("skills", blank)
    payload.setdefault("skills", [])
    return payload


def find(payload: dict, code: str):
    wanted = store.slugify(code)
    for skill in payload["skills"]:
        if skill.get("code") == wanted:
            return skill
    return None


def ensure(payload: dict, code: str, label: str = "") -> dict:
    skill = find(payload, code)
    if skill:
        return skill
    title = str(label or code).strip()
    skill = {"code": store.slugify(code), "label": title, "days": {}, "created_at": store.now_iso()}
    payload["skills"].append(skill)
    return skill


def total(skill: dict) -> int:
    return sum(int(value) for value in (skill.get("days") or {}).values())


def bump(payload: dict, code: str, amount: int = 1, day: str = "") -> tuple[dict, int]:
    skill = find(payload, code)
    if not skill:
        raise SystemExit(f"no skill '{code}'. See: will skill list")
    target = day or store.today_key()
    days = skill.setdefault("days", {})
    value = int(days.get(target, 0)) + int(amount)
    if value <= 0:
        days.pop(target, None)
        value = 0
    else:
        days[target] = value
    return skill, value


def streak(skill: dict, today: str = "") -> int:
    days = {day for day, value in (skill.get("days") or {}).items() if int(value) > 0}
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


def summary(payload: dict, today: str = "") -> list[dict]:
    today = today or store.today_key()
    month_prefix = today[:7]
    rows = []
    for skill in payload["skills"]:
        days = {day: int(value) for day, value in (skill.get("days") or {}).items()}
        rows.append(
            {
                "code": skill.get("code", ""),
                "label": skill.get("label", ""),
                "total": sum(days.values()),
                "today": days.get(today, 0),
                "streak": streak(skill, today),
                "month_total": sum(value for day, value in days.items() if day.startswith(month_prefix)),
                "days": dict(sorted(days.items())),
            }
        )
    return rows
