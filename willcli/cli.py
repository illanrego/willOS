"""Argument parsing and command dispatch for `will`.

Shortcuts that matter: `will skill <code>`, `will done <code>`, `will min <code> <n>`.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
except ImportError:  # stdlib-only fallback for tests/minimal installs
    Console = Panel = Table = None

from . import (
    content,
    activities,
    exporter,
    finance,
    importer,
    notes,
    planner,
    recs,
    skills,
    store,
    tasks,
)

NOTE_ACTIONS = ("add", "list", "rm", "section", "sections", "promote", "import", "counts")
REC_ACTIONS = ("add", "list", "rm", "import")


USAGE_EXAMPLES = {
    "will": [
        'will note "buy cat food"                 capture a line',
        "will done physique                       log an occurrence",
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
    "rec": [
        'will rec add "deliverance (1972)"                one to watch',
        "will rec list                                  the whole list, with ids",
        "will rec rm 3                                  drop one",
        'will rec import legacy.json                    old Supabase recommendations rows',
        "will rec import --from-notes                   move the parked 'Rec List' notes section",
    ],
    "min": [
        "will min                                        this week's floors, and where they live",
        "will min physique 4                             a floor for an activity",
        "will min teacher 2                              ...or for a content lane",
        "will min rm physique                            drop the floor (0 does the same)",
    ],
    "done": [
        "will done physique                              log one for today",
        "will done standup --day 09-24                   backfill a day",
        "will min                                        where the weekly floors live",
    ],
    "undo": [
        "will undo physique                              clear today's log",
        "will undo physique --day 09-24",
    ],
    "skill": [
        "will skill coding +2                            count two on today",
        "will skill coding                               +1, shorthand",
        "will skill list                                 today, total, streak, month",
        'will skill add cooking "Cooking"                a new skill',
        "will skill rm meditation                        delete an activity (asks first)",
    ],
    "task": [
        'will task add "swap the tui widgets" --state doing',
        "will task                                       grouped by state (todo first)",
        "will task --state done",
        "will task doing 4                               shorthand for move",
        "will task move 4 blocked",
        "will task rm 4",
        "will task prune --keep-days 0                   drop every finished task",
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


def _root_subparsers(parser: argparse.ArgumentParser):
    return next(
        (action for action in parser._actions if hasattr(action, "choices") and action.choices),
        None,
    )


def _plain_root_help(parser: argparse.ArgumentParser, file) -> None:
    out = file or sys.stdout
    print("Usage: will [COMMAND] [OPTIONS]", file=out)
    print("\nwillOS - the terminal writes, the desktop draws.", file=out)
    print("\nACTIVITY LOG", file=out)
    print("  One occurrence ledger feeds the Gamify window; weekly floors live in `will min`.", file=out)
    print("  `will done` and `will skill` update the same activity by name.", file=out)
    print("  Dates accept YYYY-MM-DD or MM-DD (current year).\n", file=out)
    print("COMMANDS", file=out)
    sub = _root_subparsers(parser)
    for name, command in sub.choices.items():
        print(f"  {name:<10} {command.description or command.help or ''}", file=out)
    print("\nQUICK START", file=out)
    print("  will skill <name> [+N] [--day MM-DD]  log an activity", file=out)
    print("  will min <code> <n>                  set a weekly floor", file=out)
    print("  will content platform 28 youtube posted --day MM-DD", file=out)
    print("\ncommon uses:", file=out)
    for line in USAGE_EXAMPLES["will"]:
        print(f"  {line}", file=out)
    print("\nMore help: will COMMAND --help", file=out)


def _rich_root_help(parser: argparse.ArgumentParser, file) -> None:
    console = Console(file=file or sys.stdout, force_terminal=False, color_system=None, width=100)
    console.print(Panel.fit(
        "[bold cyan]willOS[/bold cyan]  [dim]the terminal writes, the desktop draws[/dim]",
        title="will", border_style="cyan",
    ))
    console.print("[bold]ACTIVITY LOG[/bold]")
    console.print("  One occurrence ledger feeds the Gamify window; weekly floors live in `will min`.")
    console.print("  `will done` and `will skill` update the same activity by name.")
    console.print("  Dates accept YYYY-MM-DD or MM-DD (current year).\n")

    table = Table(title="COMMANDS", title_style="bold cyan", show_header=True, header_style="bold")
    table.add_column("Command", style="cyan", no_wrap=True)
    table.add_column("Purpose")
    sub = _root_subparsers(parser)
    for name, command in sub.choices.items():
        table.add_row(name, command.description or command.help or "")
    console.print(table)

    console.print(Panel(
        "[cyan]will skill <name> [+N] [--day MM-DD][/cyan]  log an activity\n"
        "[cyan]will done <name> --day MM-DD[/cyan]         mark the same activity as an obligation\n"
        "[cyan]will content platform 28 youtube posted --day MM-DD[/cyan]",
        title="QUICK START", border_style="green",
    ))
    console.print("[bold]common uses:[/bold]")
    for line in USAGE_EXAMPLES["will"]:
        console.print(f"  {line}")
    console.print("\n[dim]More help: will COMMAND --help[/dim]")


class WillArgumentParser(argparse.ArgumentParser):
    def print_help(self, file=None):
        if self.prog == "will":
            if Console is not None:
                _rich_root_help(self, file)
            else:
                _plain_root_help(self, file)
            return
        super().print_help(file)


def with_examples(parser: argparse.ArgumentParser, key: str, description: str = "") -> argparse.ArgumentParser:
    """Every command carries the handful of uses worth remembering."""
    parser.description = description or parser.description
    prefix = "QUICK START\n  will skill <name> [+N] [--day MM-DD]  log an activity\n  will min <code> <n>                  set a weekly floor\n  will content platform 28 youtube posted --day MM-DD\n\n"
    parser.epilog = prefix + "common uses:\n" + "\n".join(f"  {line}" for line in USAGE_EXAMPLES[key]) if key == "will" else "common uses:\n" + "\n".join(f"  {line}" for line in USAGE_EXAMPLES[key])
    parser.formatter_class = argparse.RawDescriptionHelpFormatter
    return parser


def build_parser() -> argparse.ArgumentParser:
    parser = WillArgumentParser(
        prog="will",
        description=(
            "willOS — the terminal writes, the desktop draws.\n\n"
            "ACTIVITY LOG\n"
            "  One occurrence ledger feeds the Gamify window; weekly floors live in `will min`.\n"
            "  `will done` and `will skill` update the same activity by name.\n"
            "  Dates accept YYYY-MM-DD or MM-DD (current year)."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", title="commands", metavar="COMMAND")

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

    rec = sub.add_parser("rec", help="the rec list: films, series and specials to watch",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(rec, "rec", "the rec list: films, series and specials to watch")
    rec.add_argument("action", nargs="?", default="list", help="list (default) | add | rm | import")
    rec.add_argument("args", nargs="*", help="text to add, rec id, or a JSON file")
    rec.add_argument("--from-notes", dest="from_notes", action="store_true",
                     help="import: take the parked 'Rec List' section out of the notebook")
    rec.add_argument("--section", "-s", default="Rec List", help="import: notes section to absorb")
    rec.add_argument("--replace", action="store_true", help="import: replace the list instead of appending")

    min_cmd = sub.add_parser("min", help="weekly minimums: the floor an activity or lane owes each week",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(min_cmd, "min", "weekly minimums: the floor an activity or lane owes each week")
    min_cmd.add_argument("action", nargs="?", default="list", help="list (default) | rm")
    min_cmd.add_argument("args", nargs="*", help="code, or code + a number per week")

    done = sub.add_parser("done", help="record one activity occurrence",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(done, "done", "record one activity occurrence")
    done.add_argument("code", help="activity code, e.g. physique")
    done.add_argument("--day", type=store.parse_day, default="", help="override the day (YYYY-MM-DD, or MM-DD for the current year)")

    undo = sub.add_parser("undo", help="clear today's log for an activity",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(undo, "undo", "clear today's log for an activity")
    undo.add_argument("code")
    undo.add_argument("--day", type=store.parse_day, default="")

    skill = sub.add_parser("skill", help="Gamify view: count activity occurrences",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(skill, "skill", "Gamify view: count activity occurrences")
    skill.add_argument("action", nargs="?", default="list", help="list (default) | add | rm | <code>")
    skill.add_argument("args", nargs="*", help="[amount] for a bump, or code + label for add")
    skill.add_argument("--amount", type=int, default=1, help="how much to bump (default 1)")
    skill.add_argument("--day", type=store.parse_day, default="")
    skill.add_argument("--yes", "-y", action="store_true", help="rm: skip the confirmation prompt")

    task = sub.add_parser("task", help="tasks: the To-do list and the Kanban board",
                   formatter_class=argparse.RawDescriptionHelpFormatter)
    with_examples(task, "task", "tasks: the To-do list and the Kanban board")
    task.add_argument("action", nargs="?", default="list", help="list (default) | add | done | doing | move | rm | prune")
    task.add_argument("args", nargs="*", help="task text, or a task id")
    task.add_argument("--state", default="", help="todo | doing | blocked | done")
    task.add_argument("--lane", default="")
    task.add_argument("--keep-days", type=int, default=tasks.DONE_RETENTION_DAYS,
                      help=f"prune: how long a finished task is kept (default {tasks.DONE_RETENTION_DAYS}; 0 keeps none)")

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

    with_examples(parser, "will")
    return parser


def auto_export(domains: list[str]) -> None:
    if os.environ.get("WILL_NO_AUTO_EXPORT"):
        return
    exporter.run(domains, quiet=True)


def _describe_activity(entry: dict) -> str:
    """What a delete would actually throw away, in one line."""
    days = entry.get("days", {})
    return (
        f"'{entry['label']}' ({entry['code']}): "
        f"{activities.total(entry)} occurrences on {len(days)} days, "
        f"last {max(days, default='never')}"
    )


def _confirmed(args, what: str) -> bool:
    """Destructive commands ask first. Non-interactive input must pass --yes."""
    if getattr(args, "yes", False):
        return True
    if not sys.stdin.isatty():
        raise SystemExit(f"about to delete {what}\nrefusing to delete without --yes (no terminal to confirm on)")
    return input(f"delete {what}? [y/N] ").strip().lower() in ("y", "yes")


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


def cmd_min(args) -> int:
    """Weekly minimums: the floor a lane or activity owes each week."""
    from . import minimums

    payload = minimums.load()
    action = args.action or "list"

    if action not in ("list", "rm"):
        # `will min physique 4` - the ergonomic path, same as `will note "..."`
        args.args = [action, *args.args]
        action = "list"

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will min rm <code>")
        code, _ = minimums.set_minimum(payload, args.args[0], 0)
        store.save("minimums", payload)
        auto_export(["skills", "content"])
        print(f"cleared the weekly floor for '{code}'")
        return 0

    if args.args:
        if len(args.args) < 2:
            raise SystemExit("usage: will min <code> <n>   (0 clears the floor)")
        try:
            value = int(args.args[1])
        except ValueError:
            raise SystemExit(f"not a number: {args.args[1]}")
        code, amount = minimums.set_minimum(payload, args.args[0], value)
        store.save("minimums", payload)
        auto_export(["skills", "content"])
        print(f"'{code}' -> {amount} per week" if amount else f"cleared the weekly floor for '{code}'")
        return 0

    rows = minimums.rows(payload)
    start, end = minimums.week_days()
    if not rows:
        print("no weekly floors. Set one: will min physique 4")
        return 0
    print(f"week {start} .. {end}")
    for row in rows:
        print(f"  {row['code']:<16} {row['minimum']}/week")
    return 0


def cmd_done(args) -> int:
    payload = activities.load()
    entry, _ = activities.record(payload, args.code, amount=1, day=args.day, source="routine")
    store.save("activities", payload)
    auto_export(["skills"])
    day = args.day or store.today_key()
    print(f"done: {entry['label']} ({day}) - streak {activities.streak(entry, day)}")
    return 0


def cmd_undo(args) -> int:
    payload = activities.load()
    entry = activities.clear(payload, args.code, args.day)
    store.save("activities", payload)
    auto_export(["skills"])
    print(f"cleared: {entry['label']} ({args.day or store.today_key()})")
    return 0


def cmd_skill(args) -> int:
    payload = activities.load()
    action = args.action or "list"

    if action == "add":
        if not args.args:
            raise SystemExit('usage: will skill add coding "Coding"')
        code = args.args[0]
        label = " ".join(args.args[1:]) or code
        entry = activities.ensure(payload, code, label)
        store.save("activities", payload)
        auto_export(["skills"])
        print(f"skill '{entry['code']}' ready ({entry['label']})")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will skill rm <code>")
        entry = activities.find(payload, args.args[0])
        if entry is None:
            raise SystemExit(f"no activity '{args.args[0]}'. See: will skill list")
        if not _confirmed(args, _describe_activity(entry)):
            print("aborted; nothing deleted")
            return 1
        entry = activities.remove(payload, args.args[0])
        store.save("activities", payload)
        auto_export(["skills"])
        print(f"deleted '{entry['code']}' ({entry['label']})")
        return 0

    if action not in ("list", "add"):
        amount = args.amount
        if args.args:
            try:
                amount = int(str(args.args[0]).lstrip("+"))
            except ValueError:
                raise SystemExit(f"not an amount: {args.args[0]}")
        entry, today = activities.adjust(payload, action, amount, args.day, source="skill")
        store.save("activities", payload)
        auto_export(["skills"])
        day = args.day or store.today_key()
        print(
            f"{entry['label']}: {today} today, {activities.total(entry)} total, "
            f"streak {activities.streak(entry, day)}"
        )
        return 0

    rows = activities.skill_summary(payload)
    if not rows:
        print("no skills yet")
        return 0
    from . import minimums

    floors = minimums.load()
    start, end = minimums.week_days()
    print(f"week {start} .. {end}")
    for row in rows:
        week = minimums.count_in_week(row["days"])
        floor = minimums.get(floors, row["code"])
        quota = f"{week}/{floor}" if floor else f"{week}"
        print(
            f"{row['label']:<20} week {quota:>7}  today {row['today']:>3}  total {row['total']:>5}  "
            f"streak {row['streak']:>3}  month {row['month_total']:>4}"
        )
    return 0


def cmd_task(args) -> int:
    payload = tasks.load()
    action = args.action or "list"

    # Finished tasks must not pile up: every task command sweeps the done column
    # first, so the retention window is enforced without anyone remembering to.
    pruned = tasks.prune_done(payload, args.keep_days)
    if pruned:
        store.save("tasks", payload)
        auto_export(["tasks"])
        if action != "prune":
            print(f"pruned {len(pruned)} finished task(s) (kept {args.keep_days} day(s))")

    if action == "prune":
        if pruned:
            ids = ", ".join(str(task["id"]) for task in pruned)
            print(f"pruned {len(pruned)} finished task(s): {ids}")
        else:
            print(f"nothing to prune (no task finished {args.keep_days}+ day(s) ago)")
        return 0

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


def cmd_rec(args) -> int:
    action = args.action or "list"
    if action not in REC_ACTIONS:
        # `will rec "deliverance (1972)"` - the ergonomic path.
        args.args = [action, *args.args]
        action = "add"

    payload = recs.load()

    if action == "add":
        entry = recs.add(payload, " ".join(args.args).strip())
        store.save("recs", payload)
        auto_export(["recs"])
        print(f"rec {entry['id']}: {entry['text']}")
        return 0

    if action == "rm":
        if not args.args:
            raise SystemExit("usage: will rec rm <id>")
        entry = recs.remove(payload, int(args.args[0]))
        store.save("recs", payload)
        auto_export(["recs"])
        print(f"removed rec {entry['id']}: {entry['text']}")
        return 0

    if action == "import":
        if args.from_notes:
            notes_payload = notes.load()
            moved = recs.import_note_lines(payload, notes_payload, args.section)
            store.save("recs", payload)
            store.save("notes", notes_payload)
            auto_export(["recs", "notes"])
            print(f"moved {moved} lines out of the '{args.section}' notes section")
            return 0
        if not args.args:
            raise SystemExit("usage: will rec import <file.json> | will rec import --from-notes")
        path = Path(args.args[0]).expanduser()
        if not path.exists():
            raise SystemExit(f"no such file: {path}")
        with path.open(encoding="utf-8") as handle:
            payload_in = json.load(handle)
        rows_in = payload_in.get("recommendations") if isinstance(payload_in, dict) else payload_in
        added = recs.import_rows(payload, rows_in or [], replace=args.replace)
        store.save("recs", payload)
        auto_export(["recs"])
        print(f"imported {added} recs from {path}")
        return 0

    items = recs.rows(payload)
    if not items:
        print("no recs yet")
        return 0
    for item in items:
        print(f"  {item['id']:>3}  {item['text']}  [{item['at'][:10]}]")
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
    "rec": cmd_rec,
    "min": cmd_min,
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
