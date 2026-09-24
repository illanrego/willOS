# AGENTS.md

willOS is the read-only web face of Illan's personal system. Retro-OS desktop,
one window per projection. Read this before adding a window.

## Architecture (non-negotiable)

- **One writer: the `will` CLI** (umbrella over the per-domain tools). Every
  state change in the system goes through it.
- **willOS never writes.** No input controls, no toggles, no `localStorage`
  writes, no Supabase client in the viewer, no cookie/session mutation. The
  window draws a render model and nothing else. `tests/shell-ui.test.js` pins
  this; if a feature needs input, it belongs in the CLI.
- **contentflow is the engine that owns content identity**: lane codes, lane
  state ladders, card ids, event history. Never re-declare a lane list or a
  state ladder here - read it from the engine's exported model. This repo owns
  presentation only (labels, colors, layout).
- **Planning is not here.** The cross-lane plan (routine + rest + all lanes)
  lives above content, in the kickoff/planning layer. This app shows what
  happened and what is in flight; it never decides what today is.
- **`freela` is a lane but not content strategy.** It shares the pipeline, so it
  stays in the ledger, but it never enters planning or cadence talk.

## Extending

- A new window = `.quadros` div + `.titleBar` (`<h2>` + close `x` button) +
  inner body, plus `draggable("<id>")` and `makeResizable("<id>", {...})` in
  `window.onload`. Add the id to `flexQuadros` in `hideQuadro` when the window
  should open as a flex column (a column window is what keeps the title bar on
  top and the scroll area reachable).
- CSS: the window rule needs `flex-direction: column` and `overflow: hidden`,
  the title bar `flex: none`, and the body `flex: 1 1 auto; min-height: 0`.
  Never size the body with `calc(100% - <titlebar>)`: the guess clips the bottom
  of the scroll region when it is a few pixels off.
- Every desktop icon needs its own `#<id>IconDiv` rule with `top` + a
  `left`/`right` - the icon bar is deliberately an unpositioned block, so an
  icon without coordinates floats into normal flow instead of joining a column.
- Bump `?v=YYYYMMDD-<slug>` on every local asset in `index.html` when touching
  it, and add the file to `tests/shell-ui.test.js`'s expectations if the shape
  changes (a stale `?v=` is the usual "my change did not show up").
- Pure logic goes in `projection-core.js` with a real unit test in
  `tests/projection-core.test.js`; `willos.js` only formats and wires.
- Run `npm test`; the suite stays green.

## Data

- Ledger: `~/.local/share/contentflow/board.json` (or `CONTENTFLOW_STORE`).
  Never edit it from here.
- Render model: `data/projection.json`, written by
  `scripts/export_projection.py`. Titles are excluded by default so the file is
  safe to publish.
- Dates: the "posted day" is a LOCAL calendar day (the day Illan lived), derived
  from UTC event stamps. Do not compare UTC stamps to local date keys.

## Style

- Plain JS, no build step, no frameworks. The shell is a static page.
- The user does his own visual checks: do not start browsers or take
  screenshots to verify UI. The deliverable is the change + `npm test` + a short
  report.
