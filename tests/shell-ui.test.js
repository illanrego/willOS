// Static-contract tests for the willOS direction.
//
// willOS is a startpage fork moving to one shape: input happens in the CLI (or
// in an external app that gets imported), and the window only draws. The
// workout window is the reference case - Strong is the input now, the page
// draws the imported sessions.
//
// These tests pin the direction instead of the pixels: a migrated window has no
// input controls, the projection code has no write path, and the old
// local+Supabase content board cannot come back.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "willos.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "willos.js"), "utf8");
const projection = fs.readFileSync(path.join(root, "content-projection.js"), "utf8");
const core = fs.readFileSync(path.join(root, "projection-core.js"), "utf8");

// Comments legitimately name the things the code must not do, so scan code only.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const projectionCode = stripComments(projection);
const coreCode = stripComments(core);

function windowMarkup(id) {
  const anchor = html.indexOf(`id="${id}"`);
  assert.ok(anchor > -1, `window ${id} not found in index.html`);
  const start = html.lastIndexOf("<div", anchor);
  const tagRe = /<div\b[^>]*>|<\/div>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match[0] === "</div>") depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(start, match.index + match[0].length);
  }
  assert.fail(`unbalanced markup for ${id}`);
}

test("the Content window is a projection: no input controls inside it", () => {
  const markup = windowMarkup("contentContainer");
  ["<input", "<select", "<textarea", "<form"].forEach((tag) => {
    assert.ok(!markup.includes(tag), `#contentContainer must stay read-only, found ${tag}`);
  });
  const buttons = markup.match(/<button[^>]*>/g) || [];
  assert.deepEqual(buttons, ["<button onclick=\"hideQuadro('contentContainer')\">"]);
  assert.ok(markup.includes('id="contentBoardGrid"'));
  assert.ok(markup.includes('id="contentStatus"'));
});

test("the projection code never writes anywhere", () => {
  const forbidden = [
    "localStorage.setItem",
    "sessionStorage.setItem",
    ".insert(",
    ".update(",
    ".upsert(",
    ".delete(",
    "method: \"POST\"",
    "method: 'POST'",
  ];
  [projectionCode, coreCode].forEach((source) => {
    forbidden.forEach((snippet) => {
      assert.ok(!source.includes(snippet), `projection code must not write, found ${snippet}`);
    });
  });
});

test("the Content window reads a render model, never the live database", () => {
  assert.ok(projectionCode.includes('const CONTENT_PROJECTION_URL = "data/projection.json"'));
  assert.match(projectionCode, /fetch\(CONTENT_PROJECTION_URL, \{ cache: "no-store" \}\)/);
  assert.ok(!projectionCode.includes("supabase"), "no Supabase client in the projection");
  assert.ok(!coreCode.includes("supabase"), "the projection core stays pure");
});

test("the old local + Supabase content board cannot come back", () => {
  ["content_posts", "CONTENT_POSTS_STORAGE_KEY", "toggleContentPost", "persistContentPost", "ContentCore"].forEach(
    (snippet) => {
      assert.ok(!engine.includes(snippet), `willos.js still carries the old board: ${snippet}`);
    },
  );
  assert.ok(!fs.existsSync(path.join(root, "content-core.js")), "content-core.js is retired");
  assert.ok(!html.includes("content-core.js"), "index.html must not load the retired content core");
});

test("the shell still calls the projection render hooks", () => {
  assert.match(engine, /onResize: scheduleContentBoardRender/);
  assert.match(engine, /scheduleContentBoardRender\(\);/);
  assert.match(projection, /function scheduleContentBoardRender\(\)/);
  assert.match(projection, /function renderContentBoard\(\)/);
});

test("the Content window opens as a flex column with a pinned title bar", () => {
  const window_ = /#contentContainer \{([^}]*)\}/.exec(css);
  assert.ok(window_, "missing #contentContainer rule");
  assert.match(window_[1], /flex-direction:\s*column/);
  assert.match(window_[1], /overflow:\s*hidden/);
  const titleBar = /#contentContainer \.titleBar \{([^}]*)\}/.exec(css);
  assert.ok(titleBar, "missing title bar rule");
  assert.match(titleBar[1], /flex:\s*none/);
  const body = /#contentWindowBody \{([^}]*)\}/.exec(css);
  assert.ok(body, "missing window body rule");
  assert.ok(!/calc\(100% *-/.test(body[1]), "the body must not guess the title bar height");
});

test("projection scripts load before the shell runs", () => {
  assert.ok(html.indexOf("projection-core.js") < html.indexOf("content-projection.js"));
  assert.ok(html.indexOf("content-projection.js") < html.indexOf("willos.js"));
});

test("code assets are cache-busted and every local asset exists", () => {
  const refs = [...html.matchAll(/(?:src|href)="(?!https?:)([^"]+)"/g)].map((match) => match[1]);
  assert.ok(refs.length > 0);
  refs.forEach((ref) => {
    if (ref.startsWith("#")) return;
    const file = ref.split("?")[0];
    // Code assets must be cache-busted; images only need to exist.
    if (/\.(css|js)$/.test(file)) {
      assert.ok(ref.includes("?v="), `${file} is not cache-busted`);
    }
    assert.ok(fs.existsSync(path.join(root, file)), `${file} does not exist on disk`);
  });
});
