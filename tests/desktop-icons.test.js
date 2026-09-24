const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "willos.css"), "utf8");

function iconIds() {
  return [...html.matchAll(/id="([A-Za-z]+IconDiv)"/g)].map((match) => match[1]);
}

function ruleFor(id) {
  const match = new RegExp(`#${id}\\s*\\{([^}]*)\\}`).exec(css);
  return match ? match[1] : "";
}

test("every desktop shortcut has explicit coordinates", () => {
  const ids = iconIds();
  assert.ok(ids.length >= 12, `expected the shortcut set, got ${ids.length}`);

  ids.forEach((id) => {
    const rule = ruleFor(id);
    assert.ok(rule, `${id} has no CSS rule at all`);
    assert.match(rule, /position:\s*absolute;/, `${id} is not absolutely positioned`);
    assert.match(rule, /top:\s*\d+px;/, `${id} has no top coordinate`);
    // An icon with position:absolute but no left/right stays at its static
    // spot and drifts into whatever is above it: the "unpositioned new icon".
    assert.match(rule, /\b(left|right):\s*\d+px;/, `${id} has no left/right coordinate`);
  });
});

test("the working shortcuts sit in the right-hand column", () => {
  ["todoIconDiv", "todoListIconDiv", "contentIconDiv"].forEach((id) => {
    const rule = ruleFor(id);
    assert.match(rule, /right:\s*30px;/, `${id} should be in the right column`);
    assert.doesNotMatch(rule, /left:\s*\d+px;/, `${id} must not also be pinned left`);
  });
});

test("ClickUp and Ideas shortcuts are gone, without disturbing the features", () => {
  assert.doesNotMatch(html, /clickupIconDiv/);
  assert.doesNotMatch(html, /ideasIconDiv/);
  assert.doesNotMatch(css, /#clickupIconDiv/);
  assert.doesNotMatch(css, /#ideasIconDiv/);

  // Only the shortcuts were removed: the windows and their start-menu entries remain.
  assert.match(html, /id="ideasContainer"/);
  assert.match(html, /hideQuadro\('ideasContainer'\)/);
});

test("no two shortcuts share a slot", () => {
  const taken = new Map();
  iconIds().forEach((id) => {
    const rule = ruleFor(id);
    const top = /top:\s*(\d+)px;/.exec(rule);
    const side = /\b(left|right):\s*(\d+)px;/.exec(rule);
    if (!top || !side) return;
    const slot = `${side[1]}:${side[2]}@${top[1]}`;
    assert.equal(taken.get(slot), undefined, `${id} overlaps ${taken.get(slot)} at ${slot}`);
    taken.set(slot, id);
  });
});

test("the To-do shortcut opens the To-do window", () => {
  assert.match(html, /id="todoListIconDiv"[^>]*hideQuadro\('todoContainer'\)/);
});
