const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(name) {
  return fs.readFileSync(path.join(root, name), "utf8");
}

test("The planner is title, dates and one note - and nothing else", () => {
  const html = read("index.html");
  const plan = html.slice(
    html.indexOf('<div id="plannerPanel">'),
    html.indexOf('<!-- REC LIST -->'),
  );

  assert.match(plan, /id="plannerTitleInput"/);
  assert.match(plan, /id="plannerStartInput"/);
  assert.match(plan, /id="plannerEndInput"/);
  assert.match(plan, /id="plannerSummaryInput"/);
  assert.match(plan, /id="plannerSaveBtn"/);
  assert.match(plan, /id="plannerSyncStatus"/);

  for (const gone of [
    "plannerReviewInput",
    "plannerPrimaryInput",
    "plannerHedgeInput",
    "plannerFloorInput",
    "plannerMilestonesList",
    "plannerSprintTitleInput",
    "plannerSprintLog",
    "plannerSendTodaySelect",
    "plannerCloseSprintBtn",
  ]) {
    assert.ok(!plan.includes(gone), `planner still renders ${gone}`);
  }
});

test("The dropped planner concepts are gone from the shell too", () => {
  const app = read("willos.js");
  const css = read("willos.css");
  const source = app + css;

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

test("A plan needs a title and an ordered date range before it saves", () => {
  const app = read("willos.js");

  assert.match(app, /function plannerValidationError\(plan\)/);
  assert.match(app, /A plan needs a title\./);
  assert.match(app, /A plan needs a start and an end date\./);
  assert.match(app, /The end date has to be on or after the start\./);
  // The payload the light planner writes: no lanes, no milestones, no sprints.
  const payload = app.slice(
    app.indexOf("function plannerStateToDbPayload"),
    app.indexOf("function isPlannerBackendActive"),
  );
  assert.match(payload, /summary: normalized\.summary/);
  assert.doesNotMatch(payload, /lane/);
  assert.doesNotMatch(payload, /milestones/);
  assert.doesNotMatch(payload, /sprints/);
});
