"""Argument parsing and command dispatch for `will`.

Shortcuts that matter: `will done <routine>`, `will skill <code>`, `will note "text"`.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from . import (
    content,
    exporter,
    finance,
    importer,
    notes,
    planner,
    routine,
    skills,
    store,
    tasks,
)

NOTE_ACTIONS = ("add", "list", "rm", "section", "sections", "promote", "import", "counts")


USAGE_EXAMPLES = {
    "will": [
        'will note "buy cat food"                 capture a line',
        "will done morning-operator               tick a routine",
        "will skill coding +1                     count a skill day",
        'will task add "call the vet" --state doing',
        "will content board                       the contentflow engine",
        "will export                              rebuild the render models",
    ],
    "note": [
        'will note "buy cat food"                       capture one line (Inbox)',
        'will note "bit about uber drivers" --section Bits',
        "will note list [--section Bits]                 ids, for rm and promote",
        "will note promote 7 --lane moc --kind vlog      a line becomes a content card",
        "will note sections                              sections and line counts",
        "will note rm 7",
        "will note import rows.json --replace            one-time import of old rows",
    ],
    "routine": [
        "will routine                                    what I owe, with streaks",
        'will routine add "Gym"',
        "will routine rm gym",
        "will done morning-operator                      the tick command lives in `will done`",
    ],
    "done": [
        "will done morning-operator                      tick it for today",
        "will done job-hunting --day 2026-09-20          backfill a day",
        "will routine                                    see every routine and its streak",
    ],
    "undo": [
        "will undo morning-operator                      clear today's tick",
        "will undo morning-operator --day 2026-09-20",
    ],
    "skill": [
        "will skill coding +2                            count two on today",
        "will skill coding                               +1, shorthand",
        "will skill list                                 today, total, streak, month",
        'will skill add cooking "Cooking"                a new skill',
    ],
    "task": [
        'will task add "swap the tui widgets" --state doing',
        "will task                                       grouped by state (todo first)",
        "will task --state done",
        "will task doing 4                               shorthand for move",
        "will task move 4 blocked",
        "will task rm 4",
    ],
    "plan": [
        'will plan add "finish willOS" --start 2026-09-24 --end 2026-09-30 --note "one window at a time"',
        'will plan add "week off" --start 2026-10-05     end defaults to start',
        "will plan                                       current, upcoming and past",
        "will plan rm 1",
    ],
    "fin": [
        'will fin add "149,90" --kind expense --category course --note "guia do comediante"',
        "will fin add 1500 --kind income --note gig",
        'will fin add "12,50" --date 2026-09-01          log for another day',
        "will fin list                                   this month: totals, categories, recents",
        "will fin list --month 2026-08",
        "will fin rm 2",
    ],
    "import": [
        "will import legacy.json                         routes every old Supabase table",
        "will import legacy.json --replace               wipe the stores first",
        "will import notes-export.json                   a bare notes rows array also works",
    ],
    "content": [
        "will content board                              active cards grouped by lane",
        "will content lane teacher                       one lane's stages and cards",
        "will content next 1                             advance a card one step",
        "will content show 7                             one card and its next step",
    ],
    "export": [
        "will export                                     every render model",
        "will export notes finance                       just those two",
        "will export                                     (auto-runs after every write command)",
    ],
    "where": [
        "will where                                      store dir + data dir",
    ],
}


def with_examples(parser: argparse.ArgumentParser, key: str, description: str = "") -> argparse.ArgumentParser:
    """Every command carries the handful of uses worth remembering."""
    parser.description = description or parser.description
    parser.epilog = "common uses:\n" + "\n".join(f"  {line}" for line in USAGE_EXAMPLES[key])
    parser.formatter_class = argparse.RawDescriptionHelpFormatter
    return parser


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="will",
        description="willOS CLI: the terminal writes, the desktop draws.",
    )
    sub = parser.add_subparsers(dest="command")

    note = sub.add_parser("note", help="the notebook: capture, list, remove, promote",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(note, "note", "the notebook: capture, list, remove, promote")
    note.add_argument("action", nargs="?", help="add (default) | list | rm | section | sections | promote | import")
    note.add_argument("args", nargs="*", help="text to add, section name, or note id")
    note.add_argument("--section", "-s", default=notes.DEFAULT_SECTION, help="section to write to or read")
    note.add_argument("--lane", default="", help="lane for promote (moc, teacher, standup, comics, freela)")
    note.add_argument("--kind", default="idea", help="card kind for promote (default: idea)")
    note.add_argument("--title", default="", help="override the promoted card title")
    note.add_argument("--replace", action="store_true", help="import: replace the store instead of appending")

    routine_cmd = sub.add_parser("routine", help="routines (the old Dailies): list, add, rm",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(routine_cmd, "routine", "routines (the old Dailies): list, add, rm")
    routine_cmd.add_argument("action", nargs="?", default="list", help="list (default) | add | rm")
    routine_cmd.add_argument("args", nargs="*", help="label to add, or routine code to remove")

    done = sub.add_parser("done", help="tick a routine for today",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(done, "done", "tick a routine for today")
    done.add_argument("code", help="routine code, e.g. morning-operator")
    done.add_argument("--day", default="", help="override the day (YYYY-MM-DD)")

    undo = sub.add_parser("undo", help="untick a routine for today",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(undo, "undo", "untick a routine for today")
    undo.add_argument("code")
    undo.add_argument("--day", default="")

    skill = sub.add_parser("skill", help="skills (the old Gamify): list, add, or bump",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(skill, "skill", "skills (the old Gamify): list, add, or bump")
    skill.add_argument("action", nargs="?", default="list", help="list (default) | add | <code>")
    skill.add_argument("args", nargs="*", help="[amount] for a bump, or code + label for add")
    skill.add_argument("--amount", type=int, default=1, help="how much to bump (default 1)")
    skill.add_argument("--day", default="")

    task = sub.add_parser("task", help="tasks: the To-do list and the Kanban board",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(task, "task", "tasks: the To-do list and the Kanban board")
    task.add_argument("action", nargs="?", default="list", help="list (default) | add | done | doing | move | rm")
    task.add_argument("args", nargs="*", help="task text, or a task id")
    task.add_argument("--state", default="", help="todo | doing | blocked | done")
    task.add_argument("--lane", default="")

    plan = sub.add_parser("plan", help="planner: title, start, end, one note",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(plan, "plan", "planner: title, start, end, one note")
    plan.add_argument("action", nargs="?", default="list", help="list (default) | add | rm")
    plan.add_argument("args", nargs="*", help="plan title, or plan id")
    plan.add_argument("--start", default="", help="start date (YYYY-MM-DD, default today)")
    plan.add_argument("--end", default="", help="end date (default: same as start)")
    plan.add_argument("--note", default="")

    fin = sub.add_parser("fin", help="finance: income and expense entries",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(fin, "fin", "finance: income and expense entries")
    fin.add_argument("action", nargs="?", default="list", help="list (default) | add | rm")
    fin.add_argument("args", nargs="*", help="amount (add) or entry id (rm)")
    fin.add_argument("--kind", default="expense", help="expense (default) | income")
    fin.add_argument("--category", default="")
    fin.add_argument("--note", default="")
    fin.add_argument("--date", default="")
    fin.add_argument("--month", default="", help="list: YYYY-MM")

    import_cmd = sub.add_parser("import", help="one-time import of the old Supabase rows (JSON)",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(import_cmd, "import", "one-time import of the old Supabase rows (JSON)")
    import_cmd.add_argument("file")
    import_cmd.add_argument("--replace", action="store_true")

    content_cmd = sub.add_parser("content", help="pass through to the contentflow CLI",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(content_cmd, "content", "pass through to the contentflow CLI")
    content_cmd.add_argument("args", nargs=argparse.REMAINDER)

    export = sub.add_parser("export", help="write the render models the desktop draws",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(export, "export", "write the render models the desktop draws")
    export.add_argument("domains", nargs="*", help=f"default: all ({', '.join(exporter.EXPORTERS)})")

    where = sub.add_parser("where", help="print the store and data directories",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(where, "where", "print the store and data directories")
    where.add_argument("args", nargs="*")

    with_examples(parser, "will", "willOS CLI: the terminal writes, the desktop draws.")
    return parser


def auto_export(domains: list[str]) -> None:
    if os.environ.get("WILL_NO_AUTO_EXPORT"):
        return
    exporter.run(domains, quiet=True)


def cmd_note(args) -> int:
    action = args.action or "list"
    if action not in NOTE_ACTIONS:
        # `will note "something to remember"` - the ergonomic path.
        args.args = [action, *args.args]
        action = "add"

    payload = notes.load()

    if action == "add":
        entry = notes.add_line(payload, " ".join(args.args).strip(), args.section)
        store.save("notes", payload)
        auto_export(["notes"])
        print(f"note {entry['id']} -> {args.section}: {entry['text']}")
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
            print(f"  {line.get('id'):>3}  {line.get('text', '')}  [{str(line.get('at', ''))[:10]}]")
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


def cmd_routine(args) -> int:
    payload = routine.load()
    action = args.action or "list"

    if action == "add":
        label = " ".join(args.args).strip()
        if not label:
            raise SystemExit('usage: will routine add "Morning operator"')
        entry = routine.ensure(payload, label, label)
        store.save("routine", payload)
        auto_export(["routine"])
        print(f"routine '{entry['code']}' ready ({entry['label']})")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will routine rm <code>")
        entry = routine.remove(payload, args.args[0])
        store.save("routine", payload)
        auto_export(["routine"])
        print(f"removed routine '{entry['code']}'")
        return 0

    rows = routine.summary(payload)
    if not rows:
        print("no routines yet")
        return 0
    for row in rows:
        mark = "x" if row["done_today"] else " "
        print(f"[{mark}] {row['label']:<20} streak {row['streak']:>3}  this month {row['month_count']:>2}")
    return 0


def cmd_done(args) -> int:
    payload = routine.load()
    entry = routine.mark(payload, args.code, args.day, done=True)
    store.save("routine", payload)
    auto_export(["routine"])
    day = args.day or store.today_key()
    print(f"done: {entry['label']} ({day}) - streak {routine.streak(entry, day)}")
    return 0


def cmd_undo(args) -> int:
    payload = routine.load()
    entry = routine.mark(payload, args.code, args.day, done=False)
    store.save("routine", payload)
    auto_export(["routine"])
    print(f"cleared: {entry['label']} ({args.day or store.today_key()})")
    return 0


def cmd_skill(args) -> int:
    payload = skills.load()
    action = args.action or "list"

    if action == "add":
        if not args.args:
            raise SystemExit('usage: will skill add coding "Coding"')
        code = args.args[0]
        label = " ".join(args.args[1:]) or code
        entry = skills.ensure(payload, code, label)
        store.save("skills", payload)
        auto_export(["skills"])
        print(f"skill '{entry['code']}' ready ({entry['label']})")
        return 0

    if action not in ("list", "add"):
        amount = args.amount
        if args.args:
            try:
                amount = int(str(args.args[0]).lstrip("+"))
            except ValueError:
                raise SystemExit(f"not an amount: {args.args[0]}")
        entry, today = skills.bump(payload, action, amount, args.day)
        store.save("skills", payload)
        auto_export(["skills"])
        day = args.day or store.today_key()
        print(
            f"{entry['label']}: {today} today, {skills.total(entry)} total, "
            f"streak {skills.streak(entry, day)}"
        )
        return 0

    rows = skills.summary(payload)
    if not rows:
        print("no skills yet")
        return 0
    for row in rows:
        print(
            f"{row['label']:<20} today {row['today']:>3}  total {row['total']:>5}  "
            f"streak {row['streak']:>3}  month {row['month_total']:>4}"
        )
    return 0


def cmd_task(args) -> int:
    payload = tasks.load()
    action = args.action or "list"

    if action == "add":
        text = " ".join(args.args).strip()
        task = tasks.add(payload, text, args.state or tasks.DEFAULT_STATE, args.lane)
        store.save("tasks", payload)
        auto_export(["tasks"])
        print(f"task {task['id']} [{task['state']}]: {task['text']}")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will task rm <id>")
        task = tasks.remove(payload, int(args.args[0]))
        store.save("tasks", payload)
        auto_export(["tasks"])
        print(f"removed task {task['id']}: {task['text']}")
        return 0

    if action in ("done", "doing", "blocked", "todo", "move"):
        if not args.args:
            raise SystemExit(f"usage: will task {action} <id>")
        state = args.state or ("" if action == "move" else action)
        if action == "move":
            if len(args.args) < 2:
                raise SystemExit("usage: will task move <id> <state>")
            state = args.args[1]
        task = tasks.set_state(payload, int(args.args[0]), state)
        store.save("tasks", payload)
        auto_export(["tasks"])
        print(f"task {task['id']} -> {task['state']}: {task['text']}")
        return 0

    columns = tasks.grouped(payload)
    order = [tasks.normalize_state(args.state)] if args.state else list(tasks.STATES)
    printed = False
    for name in order:
        rows = columns.get(name, [])
        if not rows:
            continue
        printed = True
        print(f"\n{name} ({len(rows)})")
        for task in rows:
            print(f"  {task['id']:>3}  {task['text']}")
    if not printed:
        print("no tasks yet")
    return 0


def cmd_plan(args) -> int:
    payload = planner.load()
    action = args.action or "list"

    if action == "add":
        title = " ".join(args.args).strip()
        plan = planner.add(payload, title, args.start, args.end, args.note)
        store.save("planner", payload)
        auto_export(["planner"])
        print(f"plan {plan['id']} {plan['start']} -> {plan['end']}: {plan['title']}")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will plan rm <id>")
        plan = planner.remove(payload, int(args.args[0]))
        store.save("planner", payload)
        auto_export(["planner"])
        print(f"removed plan {plan['id']}: {plan['title']}")
        return 0

    summary = planner.summary(payload)
    if not summary["plans"]:
        print("no plans yet")
        return 0
    for plan in summary["plans"]:
        window = f"{plan['start']} -> {plan['end']}"
        print(f"  {plan['id']:>3}  {window:<24} {plan['title']}")
    return 0


def cmd_fin(args) -> int:
    payload = finance.load()
    action = args.action or "list"

    if action == "add":
        amount = " ".join(args.args).strip()
        if not amount:
            raise SystemExit('usage: will fin add 149.90 --kind expense --category "course"')
        entry = finance.add(payload, amount, args.kind, args.category, args.note, args.date)
        store.save("finance", payload)
        auto_export(["finance"])
        print(f"{entry['kind']} {finance.from_cents(entry['amount_cents'])} on {entry['date']} (#{entry['id']})")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will fin rm <id>")
        entry = finance.remove(payload, int(args.args[0]))
        store.save("finance", payload)
        auto_export(["finance"])
        print(f"removed entry {entry['id']}")
        return 0

    summary = finance.summary(payload, args.month)
    totals = summary["totals"]
    print(
        f"{totals['month']}: income {finance.from_cents(totals['income_cents'])}  "
        f"expense {finance.from_cents(totals['expense_cents'])}  net {finance.from_cents(totals['net_cents'])}"
    )
    if summary["categories"]:
        print("  by category:")
        for name, cents in summary["categories"].items():
            print(f"    {name:<20} {finance.from_cents(cents)}")
    if summary["recent"]:
        print("  recent:")
        for entry in summary["recent"][:12]:
            print(
                f"    {entry['id']:>3}  {entry['date']}  {entry['kind']:<7} "
                f"{finance.from_cents(int(entry['amount_cents'])):>9}  "
                f"{entry.get('category', '')} {entry.get('note', '')}"
            )
    return 0


def cmd_import(args) -> int:
    path = Path(args.file).expanduser()
    if not path.exists():
        raise SystemExit(f"no such file: {path}")
    report = importer.run(path, replace=args.replace)
    for domain, count in report.items():
        if domain.startswith("_"):
            continue
        print(f"{domain:<10} {count}")
    if report.get("_skipped"):
        print(f"skipped: {', '.join(report['_skipped'])}")
    exporter.run(None, quiet=False)
    return 0


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
    "routine": cmd_routine,
    "done": cmd_done,
    "undo": cmd_undo,
    "skill": cmd_skill,
    "task": cmd_task,
    "plan": cmd_plan,
    "fin": cmd_fin,
    "import": cmd_import,
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
