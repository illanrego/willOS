# willOS

A variation of my startpage, for CLI-first input: **the terminal decides, the desktop draws.**

Fork of [`illanrego/startpage`](https://github.com/illanrego/startpage) - same retro-OS
shell, windows, icons and start menu, with a different division of labour: input moved to
a CLI, and every window became a read-only projection.

Repo: https://github.com/illanrego/willOS (local app: `npm run dev`, no deploy)

## The idea

I make things in the terminal now and look at them in the browser. The window is a
projection; the CLI is where state changes. The reference case is the workout window: it
used to be an editable plan grid in the page, and today the sessions come from the Strong
app and the window draws the charts. Every window now follows that shape.

- **`will` (the CLI) is the only writer.** Capture, decisions, state changes, routine
  logs, imports.
- **A migrated window only draws.** No add buttons, no toggles, no inline editing.
- A window is *migrated* when its inputs are gone and it draws `data/<window>.json`.
  `tests/shell-ui.test.js` holds `MIGRATED_WINDOWS` and enforces the contract for each.

## The commands

```
# the notebook: capture cheap, promote when something is real
will note "buy cat food"                      # -> Inbox
will note "bit about uber drivers" --section Bits
will note list [--section Bits]               # ids for rm / promote
will note rm 7
will note sections | will note section "Vagas"
will note promote 7 --lane moc --kind vlog    # a line becomes a contentflow card

# routines (the old Dailies): an obligation, one tick per day
will done morning-operator
will undo morning-operator [--day 2026-09-20]
will routine [list | add "Gym" | rm gym]

# skills (the old Gamify): an occurrence, counted per day
will skill coding +2                          # or just: will skill coding
will skill list | will skill add <code> "Label"

# tasks: the To-do window and the Kanban board read the same list
will task add "swap the tui widgets" --state doing
will task done 3 | will task move 3 blocked | will task rm 3 | will task [--state done]

# plans: title, start, end, one note
will plan add "finish willOS" --start 2026-09-24 --end 2026-09-30 --note "..."
will plan list | will plan rm 1

# finance: amounts stored in cents, no float drift
will fin add "149,90" --kind expense --category course --note "guia do comediante"
will fin add 1500 --kind income --note gig
will fin list [--month 2026-08] | will fin rm 2

# content: the contentflow engine, unchanged
will content board | will content lane teacher | will content next 1

# plumbing
will export [content notes routine skills tasks planner finance]   # render models
will import legacy.json                                           # one-shot migration
will where                                                        # store + data dirs
```

`will` lives in this repo (stdlib-only Python) and is on PATH via `~/.local/bin/will`.
Every mutating command re-exports its render model, so a page refresh shows the change.

Store: `~/.local/share/will/<domain>.json` (`WILL_STORE` overrides the dir).
Render models: `data/<domain>.json` (`WILL_DATA_DIR` overrides), gitignored.

## Migrated windows

| Window | Draws | Written by |
|---|---|---|
| Content | `data/content.json` | contentflow, via `will content` |
| Notes | `data/notes.json` | `will note` |
| Routine (was Dailies) | `data/routine.json` | `will done` / `will routine` |
| To-do | `data/tasks.json` | `will task` |
| Kanban | `data/tasks.json` | `will task` |
| Gamify | `data/skills.json` | `will skill` |
| Planner | `data/planner.json` | `will plan` |
| Finance Log | `data/finance.json` | `will fin` |

Retired outright: Ideas, Rec List and Next Features (they were note-shaped, so the
notebook holds them), the old workout plan grid (Strong is the input now), and the old
local + Supabase content board.

Still input-in-page, to migrate next: Calendar, Pomodoro, Calculator, Wallpaper, Chat,
Connections, LLM Usage, ClickUp, and the Strong CSV import view inside Workout.

## Migrating the old Supabase rows

One paste in the Supabase SQL editor:

```sql
select json_build_object(
  'notes_sections', (select json_agg(json_build_object('slug', slug, 'title', title, 'body', body) order by sort_order) from public.notes_sections),
  'tasks', (select json_agg(json_build_object('text', text, 'task_type', task_type, 'daily_done_on', daily_done_on, 'completed_at', completed_at, 'skill_code', skill_code)) from public.tasks),
  'trackers', (select json_agg(json_build_object('id', id, 'code', code, 'label', label)) from public.trackers),
  'tracker_daily_values', (select json_agg(json_build_object('tracker_id', tracker_id, 'tracked_on', tracked_on, 'value', value)) from public.tracker_daily_values),
  'kanban_columns', (select json_agg(json_build_object('id', id, 'code', code, 'title', title)) from public.kanban_columns),
  'kanban_cards', (select json_agg(json_build_object('text', text, 'column_id', column_id)) from public.kanban_cards),
  'planner_plans', (select json_agg(json_build_object('title', title, 'start_date', starts_on, 'end_date', ends_on, 'note', summary)) from public.planner_plans),
  'finance_entries', (select json_agg(json_build_object('happened_on', e.happened_on, 'entry_type', e.entry_type, 'amount', e.amount, 'note', e.note, 'category', c.name))
                      from public.finance_entries e left join public.finance_categories c on c.id = e.category_id),
  'recommendations', (select json_agg(json_build_object('text', text)) from public.recommendations),
  'feature_backlog_items', (select json_agg(json_build_object('text', text)) from public.feature_backlog_items)
);
```

Save it as `legacy.json`, then:

```
will import ~/Downloads/legacy.json
```

It prints what landed where and reports tables it does not know instead of dropping them.
Dailies become routines, todos become tasks, trackers become skills, kanban cards take
their column state, plans and finance entries land in their stores, and the rec list and
feature backlog become notes sections. The old tables stay in the database as history.

## Run it

```
npm run dev          # http://localhost:8123
npm run test:all     # node tests + python tests
./will export        # rebuild every render model
```

## Data flow

```
~/.local/share/contentflow/board.json  --\
~/.local/share/will/*.json             --->  will export  -->  data/<window>.json  -->  window (read only)
```

Every rule that derives state lives on the CLI side, once, in `willcli/exporter.py`,
including "this content card went live on day X" (`published`/`posted`/`delivered`, local
calendar day, read from the event log). The browser never derives state, never writes and
never talks to a database. `skills-projection.js` also publishes its model on
`window.willOsModels`, which the chat assistant reads for its own context.

## Tech

Plain JS, no build step, no frameworks, stdlib-only Python. Retro-OS styling in
`willos.css`, shell + window engine in `willos.js` (~3k lines, down from 9.5k at the
fork), the CLI in `willcli/`, projections in `*-projection.js` with pure math in
`*-core.js`, tests via `node --test` and `unittest` (77 node + 58 python).

## License

MIT, as the original.
