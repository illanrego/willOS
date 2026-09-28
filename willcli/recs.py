"""The Rec List: films, series and specials worth watching, one line each.

Capture happens in the terminal (`will rec add "deliverance (1972)"`); the CLI
writes ~/.local/share/will/recs.json and exports data/recs.json, and the window
only draws it. This store is the ONLY owner of the list - it used to be a notes
section while the window was retired, and `will rec import --from-notes` moves
those lines here for good.
"""

from __future__ import annotations

from . import notes as notes_store
from . import store


def blank() -> dict:
    return {"version": 1, "next_id": 1, "items": []}


def load() -> dict:
    payload = store.load("recs", blank)
    payload.setdefault("items", [])
    payload.setdefault("next_id", 1)
    return payload


def add(payload: dict, text: str) -> dict:
    text = str(text or "").strip()
    if not text:
        raise SystemExit("empty rec")
    entry = {"id": int(payload.get("next_id", 1)), "text": text, "at": store.now_iso()}
    payload["next_id"] = entry["id"] + 1
    payload["items"].append(entry)
    return entry


def find(payload: dict, rec_id) -> dict | None:
    for item in payload.get("items", []):
        if int(item.get("id", -1)) == int(rec_id):
            return item
    return None


def remove(payload: dict, rec_id) -> dict:
    item = find(payload, rec_id)
    if not item:
        raise SystemExit(f"no rec with id {rec_id}")
    payload["items"].remove(item)
    return item


def rows(payload: dict) -> list[dict]:
    return [
        {
            "id": int(item.get("id", 0)),
            "text": str(item.get("text", "")),
            "at": str(item.get("at", "")),
        }
        for item in payload.get("items", [])
        if isinstance(item, dict)
    ]


def texts(payload: dict) -> set[str]:
    return {str(item.get("text", "")).strip().lower() for item in payload.get("items", [])}


def import_rows(payload: dict, rows, replace: bool = False) -> int:
    """One-time import from the old Supabase recommendations rows."""
    if replace:
        payload["items"] = []
        payload["next_id"] = 1
    known = texts(payload)
    added = 0
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        text = str(row.get("text") or row.get("title") or "").strip()
        if not text or text.lower() in known:
            continue
        add(payload, text)
        known.add(text.lower())
        added += 1
    return added


def import_note_lines(payload: dict, notes_payload: dict, section: str = "Rec List") -> int:
    """Move the parked "Rec List" notes section into the rec list it belongs to.

    The lines were copied into the notebook when this window retired; taking them
    out of notes here keeps one owner for the list instead of two readers of one
    state. Idempotent: a rec already in the store is not added twice, and the
    section only leaves the notebook once it has been read.
    """
    parked = notes_store.find_section(notes_payload, section)
    if not parked:
        return 0
    known = texts(payload)
    moved = 0
    for line in list(parked.get("lines", [])):
        text = str(line.get("text", "")).strip()
        if text and text.lower() not in known:
            add(payload, text)
            known.add(text.lower())
        moved += 1
    notes_payload["sections"].remove(parked)
    return moved
