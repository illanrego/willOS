# willOS

A variation of my startpage, for CLI-first input: **the terminal decides, the desktop draws.**

Fork of [`illanrego/startpage`](https://github.com/illanrego/startpage) - same retro-OS
shell, windows, icons and start menu, moving to a different division of labour.

Repo: https://github.com/illanrego/willOS

## The idea

I make things in the terminal now and look at them in the browser. The window is a
projection; the CLI is where state changes. It is the natural progression of what
the app was already doing: the workout window is the reference case - it used to
be an editable plan grid in the page, and today the sessions come from the Strong
app, get imported, and the window just draws them.

Two surfaces, one store:

- **The CLI is the only writer.** Capture, decisions, state changes, routine logs,
  imports.
- **The desktop only draws.** No add buttons, no toggles, no inline editing in a
  migrated window.

Anything that needs to store something belongs in the CLI. `AGENTS.md` has the
rules; `tests/shell-ui.test.js` enforces the Content window's side of them.

## Status

Windows are migrated one at a time. "Migrated" means its inputs are gone and it
only draws.

- **Content** - migrated. READ-ONLY month board of per-lane posted days, drawn from
  `data/projection.json`, exported from the `contentflow` ledger. The old
  localStorage + Supabase toggle board was removed.
- **Workout** - the reference case: sessions are logged in Strong and imported; the
  window draws the charts.
- Everything else (Dailies, To-do, Planner, Notes, Ideas, Finance, Gamify, Rec List,
  Pomodoro, Calendar, Calculator, Wallpaper, Chat, Connections, LLM Usage) still
  works as it did in startpage: input lives in the page until it moves.

## Run it

```
npm run dev          # http://localhost:8123
npm test             # node --test
npm run export       # rebuild data/projection.json from the contentflow board
```

## Content data flow

```
~/.local/share/contentflow/board.json      (the ledger - contentflow owns it)
         |
         |  scripts/export_projection.py   (derives: which lane posted which day)
         v
   data/projection.json                    (render model, titles excluded by default)
         |
         |  fetch() - read only
         v
   Content window
```

The rule for "this card went live on day X" lives on the CLI side, once
(`published` for moc/teacher, `posted` for standup/comics, `delivered` for
freela). The browser never derives content state and never talks to the database.
Lane codes come from contentflow; this repo only styles them.

## Tech

Plain JS, no build step, no frameworks. Retro-OS styling in `willos.css` (forked
from startpage's stylesheet), shell + window engine in `willos.js`, pure
projection math in `projection-core.js`, tests via `node --test`.

## License

MIT, as the original.
