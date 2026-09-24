"""Argument parsing and command dispatch for `will`."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from . import content, exporter, notes, store

NOTE_ACTIONS = ("add", "list", "rm", "section", "sections", "promote", "import", "counts")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="will",
        description="willOS CLI: the terminal writes, the desktop draws.",
        epilog="Shorthand: `will note \"text\"` appends to the Inbox section.",
    )
    sub = parser.add_subparsers(dest="command")

    note = sub.add_parser("note", help="the notebook: capture, list, remove, promote")
    note.add_argument("action", nargs="?", help="add (default) | list | rm | section | sections | promote")
    note.add_argument("args", nargs="*", help="text to add, section name, or note id")
    note.add_argument("--section", "-s", default=notes.DEFAULT_SECTION, help="section to write to or read")
    note.add_argument("--lane", default="", help="lane for promote (moc, teacher, standup, comics, freela)")
    note.add_argument("--kind", default="idea", help="card kind for promote (default: idea)")
    note.add_argument("--title", default="", help="override the promoted card title")
    note.add_argument("--replace", action="store_true", help="import: replace the store instead of appending")

    content_cmd = sub.add_parser("content", help="pass through to the contentflow CLI")
    content_cmd.add_argument("args", nargs=argparse.REMAINDER)

    export = sub.add_parser("export", help="write the render models the desktop draws")
    export.add_argument("domains", nargs="*", help=f"default: all ({', '.join(exporter.EXPORTERS)})")

    where = sub.add_parser("where", help="print the store and data directories")
    where.add_argument("args", nargs="*")

    return parser


def auto_export(domains: list[str]) -> None:
    if os.environ.get("WILL_NO_AUTO_EXPORT"):
        return
    exporter.run(domains)


def cmd_note(args) -> int:
    action = args.action or "list"
    if action not in NOTE_ACTIONS:
        # `will note "something to remember"` - the ergonomic path.
        args.args = [action, *args.args]
        action = "add"

    payload = notes.load()

    if action == "add":
        text = " ".join(args.args).strip()
        entry = notes.add_line(payload, text, args.section)
        notes_path = store.save("notes", payload)
        auto_export(["notes"])
        print(f"note {entry['id']} -> {args.section}: {entry['text']}")
        print(f"saved {notes_path}")
        return 0

    if action == "list":
        rows = notes.section_lines(payload, None if args.section == notes.DEFAULT_SECTION else args.section)
        if not rows:
            print("no notes yet")
            return 0
        current = None
        for section, line in rows:
            if section["slug"] != current:
                current = section["slug"]
                print(f"\n{section['title']} ({len(section['lines'])})")
            stamp = str(line.get("at", ""))[:10]
            print(f"  {line.get('id'):>3}  {line.get('text', '')}  [{stamp}]")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will note rm <id>")
        line = notes.remove_line(payload, int(args.args[0]))
        store.save("notes", payload)
        auto_export(["notes"])
        print(f"removed note {line['id']}: {line['text']}")
        return 0

    if action == "section":
        section = notes.add_section(payload, " ".join(args.args))
        store.save("notes", payload)
        auto_export(["notes"])
        print(f"section '{section['title']}' added")
        return 0

    if action == "sections":
        for title, count in notes.counts(payload):
            print(f"{title:<24} {count}")
        return 0

    if action == "import":
        if not args.args:
            raise SystemExit("usage: will note import <file.json> [--replace]")
        path = Path(args.args[0]).expanduser()
        if not path.exists():
            raise SystemExit(f"no such file: {path}")
        with path.open(encoding="utf-8") as handle:
            payload_in = json.load(handle)
        rows = payload_in.get("sections") if isinstance(payload_in, dict) else payload_in
        added = notes.import_rows(payload, rows or [], replace=args.replace)
        store.save("notes", payload)
        auto_export(["notes"])
        print(f"imported {added} lines from {path}")
        return 0

    if action == "promote":
        if not args.args or not args.lane:
            raise SystemExit("usage: will note promote <id> --lane moc [--kind vlog] [--title ...]")
        section, line = notes.find_line(payload, int(args.args[0]))
        if not line or section is None:
            raise SystemExit(f"no note with id {args.args[0]}")
        title = args.title.strip() or line["text"]
        output = content.add_card(title, args.lane, args.kind)
        notes.remove_line(payload, int(args.args[0]))
        store.save("notes", payload)
        auto_export(["notes"])
        if output:
            print(output)
        print(f"promoted note {line['id']} -> {args.lane} card: {title}")
        return 0

    raise SystemExit(f"unknown note action: {action}")


def cmd_content(args) -> int:
    passthrough = [item for item in (args.args or []) if item != "--"]
    return content.run(passthrough)


def cmd_export(args) -> int:
    return exporter.run(args.domains or None)


def cmd_where(args) -> int:
    print(f"store: {store.store_dir()}")
    print(f"data:  {store.data_dir()}")
    return 0


COMMANDS = {
    "note": cmd_note,
    "content": cmd_content,
    "export": cmd_export,
    "where": cmd_where,
}


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv:
        build_parser().print_help()
        return 0

    args = build_parser().parse_args(argv)
    if not args.command:
        build_parser().print_help()
        return 0
    return COMMANDS[args.command](args)
