// Routine (old Dailies), To-do and Kanban are projections now: they draw
// data/routine.json + data/tasks.json, written by the will CLI. No inputs, no
// localStorage, no Supabase sync - tests/shell-ui.test.js enforces the contract.

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

test("the Routine window shows ticks, not an add form", () => {
  const markup = windowMarkup("dailiesContainer");
  ["<input", "<select", "<textarea", "<form"].forEach((snippet) => {
    assert.ok(!markup.includes(snippet), `#dailiesContainer must stay read-only, found ${snippet}`);
  });
  assert.match(markup, /id="routineList"/);
  assert.match(markup, /id="dailiesStatus"/);
  assert.match(markup, /<h2>Routine<\/h2>/);
});

test("the To-do and Kanban windows lost their inputs", () => {
  const todo = windowMarkup("todoContainer");
  assert.ok(!todo.includes("<input"), "#todoContainer must stay read-only");
  assert.match(todo, /id="taskList"/);
  assert.match(todo, /id="todoStatus"/);

  const kanban = windowMarkup("kanbanContainer");
  assert.ok(!kanban.includes("<input"), "#kanbanContainer must stay read-only");
  assert.ok(!kanban.includes("addKanbanTask"), "the kanban add buttons are gone");
  assert.match(kanban, /id="kanbanBoard"/);
  assert.match(kanban, /id="kanbanStatus"/);
});

test("the task/daily/kanban machinery is gone from the shell", () => {
  const app = read("willos.js");

  for (const gone of [
    "taskRemoteState",
    "kanbanRemoteState",
    "LOCAL_TASKS_STORAGE_KEY",
    "LOCAL_DAILIES_STORAGE_KEY",
    "KANBAN_STORAGE_KEY",
    "function addTask",
    "function addDaily",
    "function renderDailies",
    "function renderTaskList",
    "function renderKanbanBoard",
    "function completeDaily",
    "function syncDailyHistoryForToday",
    "isTaskBackendActive",
    "isKanbanBackendActive",
    "dailySkillSelect",
    "getElementById(\"taskInput\")",
  ]) {
    assert.ok(!app.includes(gone), `willos.js still carries ${gone}`);
  }

  assert.ok(!app.includes("todoContainer: { key:"), "To-do must not be in the sync list");
  assert.ok(!app.includes("dailiesContainer: { key:"), "Routine must not be in the sync list");
  assert.ok(!app.includes("kanbanContainer: { key:"), "Kanban must not be in the sync list");
});

test("the projections read the render models and only read", () => {
  const projection = read("tasks-projection.js");
  assert.match(projection, /const TASKS_PROJECTION_URL = "data\/tasks\.json"/);
  assert.match(projection, /const ROUTINE_PROJECTION_URL = "data\/routine\.json"/);
  assert.match(projection, /fetch\(url, \{ cache: "no-store" \}\)/);
  assert.ok(!projection.includes("supabase"), "no database in the projection");
  assert.ok(!projection.includes("localStorage.setItem"), "no writes in the projection");
});

test("the projections load before the shell runs", () => {
  const html = read("index.html");
  assert.ok(html.indexOf("tasks-projection.js") < html.indexOf("willos.js"));
});

test("both exporters exist behind the render models", () => {
  const exporter = read("willcli/exporter.py");
  assert.match(exporter, /def export_tasks\(/);
  assert.match(exporter, /def export_routine\(/);
  assert.match(exporter, /"tasks": export_tasks/);
  assert.match(exporter, /"routine": export_routine/);
});
