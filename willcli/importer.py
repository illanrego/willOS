"""One-time migration of the old Supabase rows into the will stores.

In the Supabase SQL editor (see README for the full snippet), export the tables
as one JSON object and drop it here:

    will import legacy.json

Handlers are tolerant about column names (the schema evolved) and skip anything
they cannot place, reporting what landed where.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from . import finance, notes, planner, routine, skills, store, tasks

KANBAN_STATE_HINTS = (
    ("block", "blocked"),
    ("doing", "doing"),
    ("progress", "doing"),
    ("doing/", "doing"),
    ("wip", "doing"),
    ("done", "done"),
)


def pick(row: dict, *keys, default=None):
    for key in keys:
        for candidate in (key, key.lower(), key.upper()):
            if candidate in row and row[candidate] not in (None, ""):
                return row[candidate]
    return default


def texts(value) -> str:
    return str(value or "").strip()


def day_of(value) -> str:
    return texts(value)[:10]


def import_tasks(payload: dict, rows: list) -> tuple[int, list[dict]]:
    """Dailies become routines; everything else is returned as a task row.

    Returns (routine count, [{"text", "state", "lane"}]).
    """
    count = 0
    todo_rows: list[dict] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        text = texts(pick(row, "text", "title"))
        if not text:
            continue
        if texts(pick(row, "task_type")) == "daily":
            entry = routine.ensure(payload, text, text)
            done_on = day_of(pick(row, "daily_done_on"))
            if done_on and done_on not in entry["days"]:
                entry["days"].append(done_on)
                entry["days"].sort()
            count += 1
            continue
        todo_rows.append(
            {
                "text": text,
                "state": "done" if pick(row, "completed_at") else "todo",
                "lane": texts(pick(row, "skill_code")),
            }
        )
    return count, todo_rows


def import_trackers(skill_payload: dict, trackers: list | None, values: list | None) -> int:
    codes = {}
    count = 0
    for row in trackers or []:
        if not isinstance(row, dict):
            continue
        code = texts(pick(row, "code"))
        if not code:
            continue
        skill = skills.ensure(skill_payload, code, texts(pick(row, "label", "label_text")) or code)
        codes[texts(pick(row, "id"))] = skill["code"]
        count += 1
    for row in values or []:
        if not isinstance(row, dict):
            continue
        code = codes.get(texts(pick(row, "tracker_id")))
        if not code:
            continue
        day = day_of(pick(row, "tracked_on", "day"))
        value = int(pick(row, "value") or 0)
        if not day or value <= 0:
            continue
        skill = skills.find(skill_payload, code)
        if not skill:
            continue
        skill.setdefault("days", {})[day] = value
    return count


def import_kanban(task_payload: dict, cards: list | None, columns: list | None) -> int:
    column_state = {}
    for column in columns or []:
        if not isinstance(column, dict):
            continue
        label = f"{texts(pick(column, 'code'))} {texts(pick(column, 'title'))}".lower()
        state = "todo"
        for hint, mapped in KANBAN_STATE_HINTS:
            if hint in label:
                state = mapped
                break
        column_state[texts(pick(column, "id"))] = state

    count = 0
    for card in cards or []:
        if not isinstance(card, dict):
            continue
        text = texts(pick(card, "text", "title"))
        if not text:
            continue
        state = column_state.get(texts(pick(card, "column_id")), "todo")
        tasks.add(task_payload, text, state=state)
        count += 1
    return count


def import_planner(payload: dict, rows: list) -> int:
    count = 0
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        title = texts(pick(row, "title", "name"))
        if not title:
            continue
        start = day_of(pick(row, "start_date", "start", "starts_on", "created_at"))
        end = day_of(pick(row, "end_date", "end", "ends_on", "due_on")) or start
        if not start:
            continue
        planner.add(payload, title, start, end, note=texts(pick(row, "note", "description")))
        count += 1
    return count


def import_finance(payload: dict, rows: list) -> int:
    count = 0
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        amount = pick(row, "amount", "value", default="")
        if amount in ("", None):
            continue
        day = day_of(pick(row, "happened_on", "date", "created_at")) or store.today_key()
        kind = texts(pick(row, "kind", "entry_type")) or "expense"
        finance.add(
            payload,
            amount,
            kind=kind,
            category=texts(pick(row, "category", "category_name")),
            note=texts(pick(row, "note", "description")),
            day=day,
        )
        count += 1
    return count


def import_recommendations(payload: dict, rows: list) -> int:
    count = 0
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        text = texts(pick(row, "text", "title"))
        if not text:
            continue
        notes.add_line(payload, text, "Rec List")
        count += 1
    return count


def run(source: Path, replace: bool = False) -> dict:
    payload_in = json.loads(source.read_text(encoding="utf-8"))
    if isinstance(payload_in, list):
        payload_in = {"notes_sections": payload_in}
    if not isinstance(payload_in, dict):
        raise SystemExit(f"{source} is not a JSON object or array of rows")

    report: dict[str, Any] = {}
    touched: list[str] = []

    if payload_in.get("notes_sections"):
        payload = notes.load()
        report["notes"] = notes.import_rows(payload, payload_in["notes_sections"], replace=replace)
        store.save("notes", payload)
        touched.append("notes")

    if payload_in.get("tasks"):
        payload = routine.load()
        routine_count, todo_rows = import_tasks(payload, payload_in["tasks"])
        store.save("routine", payload)
        report["routine"] = routine_count
        touched.append("routine")

        task_payload = tasks.load()
        for row in todo_rows:
            tasks.add(task_payload, row["text"], state=row["state"], lane=row["lane"])
        store.save("tasks", task_payload)
        report["tasks"] = len(todo_rows)
        touched.append("tasks")

    if payload_in.get("trackers") or payload_in.get("tracker_daily_values"):
        payload = skills.load()
        report["skills"] = import_trackers(payload, payload_in.get("trackers"), payload_in.get("tracker_daily_values"))
        store.save("skills", payload)
        touched.append("skills")

    if payload_in.get("kanban_cards"):
        payload = tasks.load()
        found = import_kanban(payload, payload_in["kanban_cards"], payload_in.get("kanban_columns"))
        store.save("tasks", payload)
        report["tasks"] = int(report.get("tasks", 0)) + found
        if "tasks" not in touched:
            touched.append("tasks")

    if payload_in.get("planner_plans"):
        payload = planner.load()
        report["planner"] = import_planner(payload, payload_in["planner_plans"])
        store.save("planner", payload)
        touched.append("planner")

    if payload_in.get("finance_entries"):
        payload = finance.load()
        report["finance"] = import_finance(payload, payload_in["finance_entries"])
        store.save("finance", payload)
        touched.append("finance")

    if payload_in.get("recommendations"):
        payload = notes.load()
        found = import_recommendations(payload, payload_in["recommendations"])
        store.save("notes", payload)
        report["notes"] = int(report.get("notes", 0)) + found
        if "notes" not in touched:
            touched.append("notes")

    report["_stores"] = touched
    report["_skipped"] = sorted(
        key for key in payload_in if key not in {
            "notes_sections", "tasks", "trackers", "tracker_daily_values",
            "kanban_cards", "kanban_columns", "planner_plans", "finance_entries", "recommendations",
        }
    )
    return report
