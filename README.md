# willOS

A variation of my startpage, for CLI-first input: **the terminal decides, the desktop draws.**

Fork of [`illanrego/startpage`](https://github.com/illanrego/startpage) - same retro-OS
shell, windows, icons and start menu, moving to a different division of labour.

Repo: https://github.com/illanrego/willOS (local app: `npm run dev`, no deploy)

## The idea

I make things in the terminal now and look at them in the browser. The window is a
projection; the CLI is where state changes. It is the natural progression of what the
app was already doing: the workout window is the reference case - it used to be an
editable plan grid in the page, and today the sessions come from the Strong app, get
imported, and the window just draws them.

Two surfaces, one store:

- **`will` (the CLI) is the only writer.** Capture, decisions, state changes, routine
  logs, imports.
- **A migrated window only draws.** No add buttons, no toggles, no inline editing.

A window is *migrated* when its inputs are gone and it draws a render model from
`data/<window>.json`. `tests/shell-ui.test.js` holds the list of migrated windows and
enforces the contract for each of them.

## The CLI

```
will note "something to remember"          # append to Inbox
will note "a bit idea" --section Bits      # append to a named section
will note list [--section Bits]            # numbered lines with ids
will note rm 7                             # remove one
will note sections                         # sections + counts
will note section "Vagas"                  # new section
will note promote 7 --lane moc --kind vlog # turn a line into a contentflow card
will note import rows.json [--replace]     # one-time import of the old notes rows
will content <args...>                     # pass through to the contentflow CLI
will export [content notes]                # write the render models the desktop draws
will where                                 # store + data directories
```

Store: `~/.local/share/will/<domain>.json` (override with `WILL_STORE`). Render models:
`data/<domain>.json` in this repo (override with `WILL_DATA_DIR`). Every mutating note
command re-exports automatically, so a page refresh shows the change.

`will` is on PATH via `~/.local/bin/will` (a symlink into this repo).

### Migrating the old notes out of Supabase

One time, in the Supabase SQL editor:

```sql
select json_agg(json_build_object('slug', slug, 'title', title, 'body', body) order by sort_order)
from public.notes_sections;
```

Save the result as e.g. `notes-export.json`, then:

```
will note import ~/Downloads/notes-export.json --replace
```

Bullets lose their `- ` marker (a line is a line now), headings keep their `#`. The old
`notes_sections` table stays in the database as history; nothing reads it.

## Status

- **Content** - migrated. READ-ONLY month board of per-lane posted days, drawn from
  `data/content.json`, exported from the `contentflow` ledger. The old localStorage +
  Supabase toggle board is gone.
- **Notes** - migrated. READ-ONLY sections and lines from `data/notes.json`, exported
  from the will notes store. The old in-page editor is gone.
- **Workout** - the reference case: sessions are logged in Strong and imported; the
  window draws the charts.
- Everything else (Dailies, To-do, Planner, Ideas, Finance, Gamify, Rec List, Pomodoro,
  Calendar, Calculator, Wallpaper, Chat, Connections, LLM Usage) still works as it did
  in startpage: input lives in the page until it moves.

## Run it

```
npm run dev          # http://localhost:8123
npm run test:all     # node tests + python tests
./will export        # rebuild every render model
```

## Data flow

```
~/.local/share/contentflow/board.json   --\
                                           >--  will export  -->  data/<window>.json  -->  window (read only)
~/.local/share/will/notes.json          --/
```

Every exporter lives in `willcli/exporter.py`; the rule for "this card went live on day
X" (`published`/`posted`/`delivered`, local calendar day, derived from the event log)
lives there once. The browser never derives state and never talks to a database. Lane
codes come from contentflow; this repo only styles them.

## Tech

Plain JS, no build step, no frameworks, stdlib-only Python. Retro-OS styling in
`willos.css`, shell + window engine in `willos.js`, projections in `*-projection.js`
with pure math in `*-core.js`, tests via `node --test` and `unittest`.

## License

MIT, as the original.
