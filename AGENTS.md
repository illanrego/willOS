# AGENTS.md

willOS is a variation of Illan's startpage (fork of `illanrego/startpage`) built
around one idea: **input happens in the CLI, or in an external app that gets
imported; the desktop only visualizes.** Same shell, windows, icons and start
menu as startpage - different division of labour.

## The direction (why this fork exists)

The reference case is the **workout window**. It used to be an editable plan grid
inside the page. Today the sessions are logged in the Strong app, imported into
the store, and the window draws the charts. Every feature is heading to that
shape:

- **The `will` CLI is the only writer.** Capture, decisions, state changes,
  routine logs, imports, content advancement.
- **A migrated window only draws.** No add buttons, no toggles, no inline
  editing, no write path. "Migrated" means its inputs are gone.
- **New features start as projections.** If a feature needs input, the input goes
  to the CLI first and the window shows the result.

The failure this fixes: startpage had input bolted onto a dashboard, so a routine
obligation ("morning operator") ended up logged in the same surface as content
work, and "did I do my routine" became the same question as "did content
advance". Input belongs where the decisions happen.

## Rules (non-negotiable)

- The Content window is a projection: read-only, drawn from
  `data/projection.json`. `tests/shell-ui.test.js` pins that (no input tags in
  the window, no write calls in the projection code, no Supabase client).
- **contentflow owns content identity**: lane codes, lane ladders, card ids,
  event history. Never re-declare a lane list or a state ladder here; read it
  from the exported model. This repo owns presentation (labels, colors, layout).
- The old content board (localStorage `contentPosts_v1` + `public.content_posts`
  toggles) is retired. Do not reintroduce it; the migration file stays only as
  history.
- **Planning is not here.** The cross-lane plan (routine + rest + all lanes)
  lives above content, in the kickoff/planning layer. This app shows what
  happened and what is in flight.
- **`freela` is a lane but not content strategy.** It shares the pipeline, so it
  stays in the ledger, but it never enters planning or cadence talk.
- The other windows are not migrated yet: they still read and write their own
  localStorage and Supabase tables with the user session. Content must not join
  them, and migrating a window means deleting its inputs here, not adding a
  second write path.

## Shell conventions (inherited from startpage)

- A window = `.quadros` div + `.titleBar` (`<h2>` + close `x` button) + inner
  body, plus `draggable("<id>")` and `makeResizable("<id>", {...})` in
  `window.onload`. Add the id to `flexQuadros` in `hideQuadro` when the window
  should open as a flex column (a column window keeps the title bar on top and
  the scroll area reachable).
- CSS: the window rule needs `flex-direction: column` and `overflow: hidden`, the
  title bar `flex: none`, and the body `flex: 1 1 auto; min-height: 0`. Never
  size the body with `calc(100% - <titlebar>)`: the guess clips the bottom of the
  scroll region when it is a few pixels off.
- Every desktop icon needs its own `#<id>IconDiv` rule with `top` + a
  `left`/`right` - the icon bar is deliberately an unpositioned block, so an icon
  without coordinates floats into normal flow instead of joining a column.
- Bump `?v=YYYYMMDD-<slug>` on the local assets you touch in `index.html`; a
  stale `?v=` is the usual "my change did not show up".
- Pure logic goes in a `*-core.js` (attached to both `root` and
  `module.exports`) with a real unit test; UI modules only format and wire.
- Run `npm test`; the suite stays green.

## Data

- Ledger: `~/.local/share/contentflow/board.json` (or `CONTENTFLOW_STORE`).
  Never edit it from here.
- Render model: `data/projection.json`, written by
  `scripts/export_projection.py`. Titles are excluded by default so the file is
  safe to publish.
- Dates: the "posted day" is a LOCAL calendar day (the day Illan lived), derived
  from UTC event stamps. Never compare a UTC stamp to a local date key.

## Style

- Plain JS, no build step, no frameworks. The shell is a static page.
- Illan does his own visual checks: do not start browsers or take screenshots to
  verify UI. The deliverable is the change + `npm test` + a short report.
- Keep changes small and reversible: the point of this fork is that the page gets
  simpler over time, not that it gains features.
