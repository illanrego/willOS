# willOS

The view-only desktop for my work and personal data. Retro-OS shell, draggable
windows, one window per projection.

Repo: https://github.com/illanrego/willOS

## The split (why this repo exists)

Two apps, one store, no overlap:

- **`will` - the workbench (terminal).** Capture, decisions, state changes,
  routine logs, imports. The CLI is the only writer.
- **willOS - the viewer (browser).** Graphs, boards, history. It draws. It has
  no input controls, no toggles, no add buttons, and no write path at all.

This is the correction to the old startpage, which had input bolted onto a
dashboard: a routine obligation ("morning operator") ended up logged in the same
surface as content work, so "did I do my routine" and "did content advance"
became the same question. Input lives where the decisions happen.

**Nothing in this repo writes.** `tests/shell-ui.test.js` enforces that: no
input tags in the HTML, no `localStorage.setItem`, no Supabase client in the
viewer. If a feature needs to store something, it belongs in the CLI.

## Status

Increment 1: shell + the Content projection.

- `index.html` / `willos.js` / `willos.css` - the retro-OS shell (desktop,
  icon bar, draggable + resizable windows, start menu), ported from startpage
  and stripped of every feature window and input control.
- `projection-core.js` - pure render math (Monday-first month grid, lane
  legend order, month summaries, in-flight count) with unit tests. No write
  helper exists, by design.
- Content window - a month board of per-lane posted dots, drawn from
  `data/projection.json`.
- `scripts/export_projection.py` - builds that render model from
  `~/.local/share/contentflow/board.json`. Placeholder for `will content export`.

Next: the `will` umbrella CLI (content/note/done/plan verbs), then auth +
reading the store directly, then more windows (workout import, notes backlog).

## Run it

```
npm run dev          # http://localhost:8123
npm test             # node --test
npm run export       # rebuild data/projection.json from the contentflow board
```

Opening `index.html` directly works too, except that `fetch()` of the
projection file needs the dev server.

## Data flow

```
~/.local/share/contentflow/board.json      (the ledger - contentflow owns it)
         |
         |  scripts/export_projection.py   (derives: which lane posted which day)
         v
   data/projection.json                    (render model, titles excluded by default)
         |
         |  fetch() - read only
         v
   willOS Content window
```

The rule for "this card went live on day X" lives on the CLI side, once. The
browser never derives content state and never talks to the database.

## Lane semantics

Lane codes come from contentflow: `standup`, `comics`, `moc`, `teacher`,
`freela`. This repo only styles them. `freela` is client work: it belongs in the
ledger (same pipeline, end to end) but it is not part of content strategy, so it
never enters planning or cadence talk.

A card counts as posted on the day its event log first reaches a live state:
`published` (moc/teacher), `posted` (standup/comics), `delivered` (freela).
Cards closed later still count - the transition is in the history.
