// The Planner window is a projection now: title, dates and one note are still the
// whole design, but they are written in the terminal (`will plan add`) and
// exported to data/planner.json. Read-only in the page, by construction.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(name) {
  return fs.readFileSync(path.join(root, name), "utf8");
}

function windowMarkup(id) {
  const html = read("index.html");
  const anchor = html.indexOf(`id="${id}"`);
  assert.ok(anchor > -1, `window ${id} not found`);
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

test("the Planner window carries no form controls", () => {
  const markup = windowMarkup("plannerContainer");
  ["<input", "<select", "<textarea", "<form", "savePlanner"].forEach((snippet) => {
    assert.ok(!markup.includes(snippet), `#plannerContainer must stay read-only, found ${snippet}`);
  });
  assert.match(markup, /id="plannerList"/);
  assert.match(markup, /id="plannerStatus"/);
});

test("the dropped planner concepts are gone from the shell too", () => {
  const source = read("willos.js") + read("willos.css");

  for (const gone of [
    "makePlannerLineList",
    "normalizePlannerMilestones",
    "renderPlannerSprintLog",
    "closePlannerSprint",
    "sendPlannerBlockToToday",
    "planner-lane",
    "planner-milestone",
    "planner-sprint",
  ]) {
    assert.ok(!source.includes(gone), `still references ${gone}`);
  }
});

test("the planner form and its save path are gone from the shell", () => {
  const app = read("willos.js");

  for (const gone of [
    "PLANNER_STORAGE_KEY",
    "plannerRemoteState",
    "savePlanner",
    "loadPlannerBackendState",
    "plannerTitleInput",
    "plannerStateToDbPayload",
  ]) {
    assert.ok(!app.includes(gone), `willos.js still carries the planner form: ${gone}`);
  }
  assert.ok(!app.includes("plannerContainer: { key:"), "Planner must not be in the backend sync list");
});

test("the projection draws data/planner.json and only reads", () => {
  const projection = read("planner-projection.js");
  assert.match(projection, /const PLANNER_PROJECTION_URL = "data\/planner\.json"/);
  assert.match(projection, /fetch\(PLANNER_PROJECTION_URL, \{ cache: "no-store" \}\)/);
  assert.ok(!projection.includes("supabase"), "no database in the projection");
  assert.ok(!projection.includes("localStorage.setItem"), "no writes in the projection");
});

test("the projection is loaded before the shell runs", () => {
  const html = read("index.html");
  assert.ok(html.indexOf("planner-projection.js") < html.indexOf("willos.js"));
});

test("the planner exporter exists behind the render model", () => {
  const exporter = read("willcli/exporter.py");
  assert.match(exporter, /def export_planner\(/);
  assert.match(exporter, /"planner": export_planner/);
});
