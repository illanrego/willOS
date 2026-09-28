// Weekly minimums: the x/y on a card, and the retired daily-obligation model.
//
// A floor is one number per activity or content lane, kept in the planning layer
// (`will min`) and stamped onto the render models by the exporter. The viewer
// only draws it. A card with no floor must show a plain count, never a shortfall.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(name) {
  return fs.readFileSync(path.join(root, name), "utf8");
}

test("the skills model carries this week's count and the floor", () => {
  const source = read("skills-projection.js");
  assert.match(source, /weeklyMinimum: Number\(skill\.weekly_minimum\)/);
  assert.match(source, /week: Number\(skill\.week\)/);
  assert.match(source, /function weekQuota\(skill\)/);
  assert.match(source, /`\$\{skill\.week\}\/\$\{skill\.weeklyMinimum\}`/);
});

test("a skill with no floor shows a count, not an x/y", () => {
  const source = read("skills-projection.js");
  // The early return for a zero floor is what keeps "own pace" from reading as a miss.
  assert.match(source, /if \(!skill\.weeklyMinimum\) \{[\s\S]{0,120}?return span;/);
});

test("the content model carries a weekly floor per lane", () => {
  const core = read("projection-core.js");
  assert.match(core, /weekly\[lane\] = \{/);
  assert.match(core, /function laneQuota\(projection, lane\)/);
  assert.match(core, /laneQuota,/);

  const projection = read("content-projection.js");
  assert.match(projection, /core\.laneQuota\(projection, lane\)/);
  assert.match(projection, /content-lane-chip-quota/);
});

test("a lane with no floor keeps the plain month count only", () => {
  assert.match(read("content-projection.js"), /if \(quota\.minimum\) \{/);
});

test("the exporter stamps the floor onto both models", () => {
  const exporter = read("willcli/exporter.py");
  assert.match(exporter, /"weekly_minimum": minimums\.get\(floors, row\["code"\]\)/);
  assert.match(exporter, /"week": minimums\.count_in_week\(row\["days"\]\)/);
  assert.match(exporter, /model\["weekly"\] = \{/);
  // a lane is namespaced, so a lane floor cannot land on the same-named skill
  assert.match(exporter, /minimums\.get\(floors, minimums\.lane_code\(lane\)\)/);
});

test("the floors live in the planning layer, not in contentflow", () => {
  assert.match(read("willcli/minimums.py"), /def week_days\(/);
  assert.match(read("willcli/minimums.py"), /def count_in_week\(/);
  // contentflow stays ignorant of cadence: the exporter stamps it on afterwards.
  assert.match(
    read("willcli/exporter.py"),
    /def build_content_model[\s\S]*?\n\n\ndef export_content/,
    "build_content_model must stay pure - the floor is added in export_content",
  );
});

test("the routine window and its daily-obligation model are gone", () => {
  assert.ok(!read("index.html").includes("dailiesContainer"), "index.html still has the window");
  assert.ok(!read("willos.js").includes("routine"), "willos.js still wires the window");
  assert.ok(!read("tasks-projection.js").includes("routine"), "the projection still draws it");
  assert.ok(!read("willcli/exporter.py").includes("export_routine"), "the exporter is retired");
  assert.ok(!read("willcli/cli.py").includes("cmd_routine"), "the CLI command is retired");
});
