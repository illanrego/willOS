"""Tasks: the To-do list and the Kanban board are the same thing here.

One list of tasks with a state; the To-do window draws the open ones, the Kanban
window draws them grouped by state.
"""

from __future__ import annotations

from . import store

STATES = ("todo", "doing", "blocked", "done")
DEFAULT_STATE = "todo"


def blank() -> dict:
    return {"version": 1, "next_id": 1, "tasks": []}


def load() -> dict:
    payload = store.load("tasks", blank)
    payload.setdefault("tasks", [])
    payload.setdefault("next_id", 1)
    return payload


def normalize_state(state: str) -> str:
    wanted = str(state or DEFAULT_STATE).strip().lower()
    return wanted if wanted in STATES else DEFAULT_STATE


def add(payload: dict, text: str, state: str = DEFAULT_STATE, lane: str = "") -> dict:
    text = str(text or "").strip()
    if not text:
        raise SystemExit("empty task")
    task = {
        "id": int(payload.get("next_id", 1)),
        "text": text,
        "state": normalize_state(state),
        "lane": str(lane or "").strip(),
        "created_at": store.now_iso(),
        "done_at": "",
    }
    payload["next_id"] = task["id"] + 1
    payload["tasks"].append(task)
    return task


def find(payload: dict, task_id: int):
    for task in payload["tasks"]:
        if int(task.get("id", -1)) == int(task_id):
            return task
    return None


def set_state(payload: dict, task_id: int, state: str) -> dict:
    task = find(payload, task_id)
    if not task:
        raise SystemExit(f"no task {task_id}")
    task["state"] = normalize_state(state)
    task["done_at"] = store.now_iso() if task["state"] == "done" else ""
    return task


def set_text(payload: dict, task_id: int, text: str) -> dict:
    task = find(payload, task_id)
    if not task:
        raise SystemExit(f"no task {task_id}")
    task["text"] = str(text or "").strip() or task["text"]
    return task


def remove(payload: dict, task_id: int) -> dict:
    task = find(payload, task_id)
    if not task:
        raise SystemExit(f"no task {task_id}")
    payload["tasks"].remove(task)
    return task


def grouped(payload: dict) -> dict[str, list[dict]]:
    columns = {state: [] for state in STATES}
    for task in payload["tasks"]:
        columns[normalize_state(task.get("state", ""))].append(task)
    return columns


def summary(payload: dict) -> dict:
    columns = grouped(payload)
    return {
        "open": len(columns["todo"]) + len(columns["doing"]) + len(columns["blocked"]),
        "counts": {state: len(rows) for state, rows in columns.items()},
        "columns": columns,
    }
