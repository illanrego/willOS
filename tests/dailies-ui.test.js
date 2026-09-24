const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(name) {
  return fs.readFileSync(path.join(root, name), "utf8");
}

test("Any daily can be ticked, skill or not, and the tick is dated in the database", () => {
  const app = read("willos.js");

  assert.match(app, /function isDailyDoneToday\(daily\)/);
  assert.match(app, /daily_done_on: doneOn/);
  assert.match(app, /daily_done_on, description, created_at/);

  // A daily with no skill_code is not a dead row: the old "No sync / disabled"
  // branch would have made a plain daily (e.g. Morning operator) untickable.
  const actionState = app.slice(
    app.indexOf("function getDailyActionState(daily)"),
    app.indexOf("function setDailyCompletionStateLocally"),
  );
  assert.doesNotMatch(actionState, /No sync/);
  assert.doesNotMatch(actionState, /disabled: true, stateText: "Status: no skill/);
  assert.match(actionState, /label: "Done today", disabled: false/);
});

test("A daily can state what done means, shown under its name", () => {
  const app = read("willos.js");
  const css = read("willos.css");

  assert.match(app, /function editDailyDescription\(daily\)/);
  assert.match(app, /function setDailyDescription\(daily, text\)/);
  assert.match(app, /todo-task-description/);
  assert.match(app, /todo-task-title-row/);
  assert.match(css, /\.todo-task-description \{/);
  assert.match(css, /#dailiesContainer \.todo-task-main \{\s*flex-direction: column;/);
});

test("The dailies window drops the sync button but keeps a status line", () => {
  const html = read("index.html");
  const app = read("willos.js");

  assert.match(html, /id="dailiesStatus"/);
  assert.match(html, /id="dailySkillSelect"/);
  assert.match(html, /<option value="jobhunting">Job Hunting<\/option>/);
  assert.doesNotMatch(html, /syncBtn/);
  assert.match(app, /function setDailiesStatus\(message\)/);
  assert.match(app, /getElementById\("dailiesStatus"\)/);
});
