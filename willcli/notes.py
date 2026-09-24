"""The notebook: one line-based stream per section.

Lines carry ids so they can be listed, removed and promoted into a contentflow
card. Sections are just headings - capture always lands in Inbox unless a
section is named.
"""

from __future__ import annotations

from . import store

DEFAULT_SECTION = "Inbox"


def blank() -> dict:
    return {
        "version": 1,
        "next_id": 1,
        "sections": [{"slug": "inbox", "title": DEFAULT_SECTION, "lines": []}],
    }


def load() -> dict:
    payload = store.load("notes", blank)
    payload.setdefault("sections", [])
    payload.setdefault("next_id", 1)
    return payload


def find_section(payload: dict, name: str) -> dict | None:
    wanted = (store.slugify(name) or store.slugify(DEFAULT_SECTION))
    for section in payload["sections"]:
        if section.get("slug") == wanted:
            return section
    return None


def ensure_section(payload: dict, name: str) -> dict:
    section = find_section(payload, name)
    if section:
        return section
    title = str(name or DEFAULT_SECTION).strip() or DEFAULT_SECTION
    section = {"slug": store.slugify(title), "title": title, "lines": []}
    payload["sections"].append(section)
    return section


def add_line(payload: dict, text: str, section_name: str = DEFAULT_SECTION) -> dict:
    text = str(text or "").strip()
    if not text:
        raise SystemExit("empty note")
    section = ensure_section(payload, section_name)
    entry = {
        "id": int(payload.get("next_id", 1)),
        "text": text,
        "at": store.now_iso(),
    }
    payload["next_id"] = entry["id"] + 1
    section["lines"].append(entry)
    return entry


def iter_lines(payload: dict):
    for section in payload["sections"]:
        for line in section.get("lines", []):
            yield section, line


def find_line(payload: dict, note_id: int):
    for section, line in iter_lines(payload):
        if int(line.get("id", -1)) == int(note_id):
            return section, line
    return None, None


def remove_line(payload: dict, note_id: int) -> dict:
    section, line = find_line(payload, note_id)
    if not line or section is None:
        raise SystemExit(f"no note with id {note_id}")
    section["lines"].remove(line)
    return line


def add_section(payload: dict, title: str) -> dict:
    title = str(title or "").strip()
    if not title:
        raise SystemExit("empty section name")
    section = find_section(payload, title)
    if section:
        raise SystemExit(f"section '{section['title']}' already exists")
    section = {"slug": store.slugify(title), "title": title, "lines": []}
    payload["sections"].append(section)
    return section


def section_lines(payload: dict, name: str | None = None):
    if not name:
        return list(iter_lines(payload))
    section = find_section(payload, name)
    if not section:
        raise SystemExit(f"no section '{name}'")
    return [(section, line) for line in section.get("lines", [])]


def counts(payload: dict) -> list[tuple[str, int]]:
    return [(section.get("title", ""), len(section.get("lines", []))) for section in payload["sections"]]


def normalize_body_line(raw: str) -> str:
    """Body text -> one stored line. Bullets lose their marker, headings keep theirs."""
    line = str(raw or "").strip()
    if not line:
        return ""
    if line.startswith("#"):
        return line
    stripped = line.lstrip("-*•").strip()
    return stripped or line


def import_rows(payload: dict, rows, replace: bool = False) -> int:
    """One-time import from the old notes_sections rows (slug, title, body)."""
    if replace:
        payload["sections"] = []
        payload["next_id"] = 1

    added = 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title") or row.get("slug") or "").strip()
        if not title:
            continue
        section = ensure_section(payload, title)
        body = str(row.get("body") or "")
        for raw in body.replace("\r\n", "\n").split("\n"):
            line = normalize_body_line(raw)
            if not line:
                continue
            add_line(payload, line, section["title"])
            added += 1
    return added
