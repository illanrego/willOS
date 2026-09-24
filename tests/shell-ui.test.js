// Static-contract tests for the shell. These pin the architecture instead of
// the pixels: the web face is read-only, every desktop icon is positioned,
// windows are flex columns, and cache-busted assets exist on disk.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "willos.css"), "utf8");
const appJs = fs.readFileSync(path.join(root, "willos.js"), "utf8");
const coreJs = fs.readFileSync(path.join(root, "projection-core.js"), "utf8");

// Comments legitimately talk about the things the code must not do ("never call
// localStorage.setItem"), so scan code only.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const appCode = stripComments(appJs);
const coreCode = stripComments(coreJs);

test("the HTML carries no input controls at all", () => {
  ["<input", "<select", "<textarea", "<form"].forEach((tag) => {
    assert.ok(!html.includes(tag), `index.html must stay read-only, found ${tag}`);
  });
  const buttons = html.match(/<button[^>]*>/g) || [];
  assert.deepEqual(
    buttons,
    ["<button onclick=\"hideQuadro('contentContainer')\">", '<button id="startBtn" onclick="hideAppMenu(), clickStart()">'],
  );
});

test("the app script never writes anywhere", () => {
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
  forbidden.forEach((snippet) => {
    assert.ok(!appCode.includes(snippet), `willos.js must not write, found ${snippet}`);
  });
  assert.ok(!coreCode.includes("setItem"), "projection-core.js must stay pure");
});

test("in-flight data comes from the CLI, not from the browser", () => {
  assert.match(appCode, /fetch\(projectionUrl\(\), \{ cache: "no-store" \}\)/);
  assert.ok(!appCode.includes("supabase"), "the viewer reads a render model, never the live DB");
});

test("every desktop icon has absolute coordinates", () => {
  const iconIds = [...html.matchAll(/id="(\w+IconDiv)"/g)].map((match) => match[1]);
  assert.ok(iconIds.length > 0, "expected at least one desktop icon");
  iconIds.forEach((id) => {
    const rule = new RegExp(`#${id} \\{[^}]*\\}`, "m").exec(css);
    assert.ok(rule, `missing CSS rule for ${id}`);
    assert.match(rule[0], /top:\s*-?\d/, `${id} needs a top coordinate`);
    assert.match(rule[0], /(left|right):\s*-?\d/, `${id} needs a left or right coordinate`);
    assert.ok(!/position:\s*static/.test(rule[0]), `${id} must be positioned`);
  });
});

test("the icon bar stays an unpositioned block so the icons keep their slots", () => {
  const rule = /\.icon-bar \{[^}]*\}/.exec(css);
  assert.ok(rule, "missing .icon-bar rule");
  assert.ok(!/position:\s*(fixed|relative|absolute)/.test(rule[0]), ".icon-bar must not become a containing block");
});

test("windows are flex columns with a pinned title bar", () => {
  const window_ = /#contentContainer \{[^}]*\}/.exec(css);
  assert.ok(window_, "missing #contentContainer rule");
  assert.match(window_[0], /flex-direction:\s*column/);
  assert.match(window_[0], /overflow:\s*hidden/);
  const titleBar = /#contentContainer \.titleBar \{[^}]*\}/.exec(css);
  assert.ok(titleBar, "missing title bar rule");
  assert.match(titleBar[0], /flex:\s*none/);
  const body = /#contentWindowBody \{[^}]*\}/.exec(css);
  assert.ok(body, "missing window body rule");
  assert.ok(!/calc\(100% *-/.test(body[0]), "the body must not guess the title bar height");
});

test("hideQuadro opens the content window as a flex column", () => {
  assert.match(appJs, /const flexQuadros = \["contentContainer"\]/);
  assert.match(appJs, /flexQuadros\.includes\(idQuadro\) \? "flex" : "block"/);
});

test("local assets are cache-busted and exist", () => {
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

test("the start menu and the desktop icon point at the same windows", () => {
  const desktop = [...html.matchAll(/hideQuadro\('(\w+)'\)/g)].map((match) => match[1]);
  assert.ok(desktop.includes("contentContainer"));
  const menu = /<div id="appMenu"[\s\S]*?<\/div>/.exec(html);
  assert.ok(menu, "missing app menu");
  assert.match(menu[0], /hideQuadro\('contentContainer'\)/);
});
