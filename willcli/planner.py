"""Planner: deliberately minimal - title, start, end, one note."""

from __future__ import annotations

from . import store


def blank() -> dict:
    return {"version": 1, "next_id": 1, "plans": []}


def load() -> dict:
    payload = store.load("planner", blank)
    payload.setdefault("plans", [])
    payload.setdefault("next_id", 1)
    return payload


def add(payload: dict, title: str, start: str, end: str = "", note: str = "") -> dict:
    title = str(title or "").strip()
    if not title:
        raise SystemExit("a plan needs a title")
    start = str(start or store.today_key()).strip()
    end = str(end or start).strip()
    if end < start:
        raise SystemExit("the end date cannot be before the start date")
    plan = {
        "id": int(payload.get("next_id", 1)),
        "title": title,
        "start": start,
        "end": end,
        "note": str(note or "").strip(),
        "created_at": store.now_iso(),
    }
    payload["next_id"] = plan["id"] + 1
    payload["plans"].append(plan)
    return plan


def find(payload: dict, plan_id: int):
    for plan in payload["plans"]:
        if int(plan.get("id", -1)) == int(plan_id):
            return plan
    return None


def remove(payload: dict, plan_id: int) -> dict:
    plan = find(payload, plan_id)
    if not plan:
        raise SystemExit(f"no plan {plan_id}")
    payload["plans"].remove(plan)
    return plan


def summary(payload: dict, today: str = "") -> dict:
    today = today or store.today_key()
    plans = sorted(payload["plans"], key=lambda plan: (plan.get("start", ""), int(plan.get("id", 0))))
    current = [plan for plan in plans if plan.get("start", "") <= today <= plan.get("end", "")]
    upcoming = [plan for plan in plans if plan.get("start", "") > today]
    past = [plan for plan in plans if plan.get("end", "") < today]
    return {"plans": plans, "current": current, "upcoming": upcoming, "past": past}
