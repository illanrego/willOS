const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("Workout browser module is an import-driven Strong analytics companion", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(html, /workout-core\.js[^>]*defer/);
  assert.match(html, /workout-v2\.js[^>]*defer/);
  assert.ok(html.indexOf("workout-core.js") < html.indexOf("willos.js"));
  assert.ok(html.indexOf("willos.js") < html.indexOf("workout-v2.js"));

  for (const label of ["Overview", "History", "Exercises", "Import"]) {
    assert.ok(app.includes(label), `missing ${label} view`);
  }
  for (const hook of [
    "renderWorkoutV2",
    "loadWorkoutV2BackendState",
    "handleWorkoutGamifyDay",
    "getWorkoutDraftForDate",
  ]) {
    assert.match(app, new RegExp(`function ${hook}\\b`));
  }
  assert.match(app, /const WORKOUT_V2_VIEWS = \["Overview", "History", "Exercises", "Import"\]/);
  assert.match(app, /computeExerciseSeries/);
  assert.match(app, /Estimated 1RM/);
  assert.match(app, /Strong remains where you log workouts/);
  assert.match(app, /parseStrongCsv/);
  assert.match(app, /function workoutV2DeleteAllData/);
  assert.match(app, /DELETE WORKOUT DATA/);
  assert.match(app, /await workoutV2ReconcileDate\(dateKey\)/);
  assert.match(app, /recalculateGamifySkillXp\("fitness"\)/);
  assert.match(app, /Your Strong app data (?:will|was) not (?:be )?changed/);
});

test("Gamify delegates Physique dates to Workout V2", () => {
  const app = fs.readFileSync(path.join(root, "willos.js"), "utf8");

  assert.match(app, /skill === "fitness"[^\n]+handleWorkoutGamifyDay/);
  assert.match(app, /FITNESS_UNKNOWN_TRAINING/);
  assert.match(app, /loadWorkoutV2BackendState/);
});

test("Workout graphs label both axes and expose per-point tooltips", () => {
  const app = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "workout-v2.css"), "utf8");

  // Axis scaffold: nice ticks on the value axis, thinned dates on the time axis, both named.
  assert.match(app, /WorkoutCore\.niceAxisTicks\(/);
  assert.match(app, /WorkoutCore\.timeAxisTicks\(/);
  assert.match(app, /class="chart-axis-title"/);
  assert.match(app, /chart-tick-label/);
  assert.match(app, /WORKOUT_V2_METRICS/);
  assert.match(app, /Estimated 1RM \(kg\)/);
  // Hover: one hit band per session carrying the numbers, plus the shared tooltip host.
  assert.match(app, /class="chart-hit"/);
  assert.match(app, /data-tip-sets="\$\{workoutV2Escape\(workoutV2SetList\(point\.sets\)\)\}"/);
  assert.match(app, /function workoutV2SetList/);
  assert.match(app, /data-tip-rows="\$\{workoutV2Escape\(JSON\.stringify\(rows\)\)\}"/);
  assert.match(app, /function workoutV2HandleChartPointer/);
  assert.match(app, /mount\.addEventListener\("pointermove", workoutV2HandleChartPointer\)/);
  assert.match(app, /id = "workoutV2ChartTooltip"/);
  assert.match(css, /\.workout-v2-chart-tooltip \{/);
  assert.match(css, /\.workout-v2-chart \.chart-cursor\[hidden\]/);
});

test("Workout window is stretchable like the other feature windows", () => {
  const shell = fs.readFileSync(path.join(root, "willos.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "willos.css"), "utf8");
  const app = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(shell, /makeResizable\("workoutContainer", \{\s*minWidth: 560,\s*minHeight: 420,\s*onResize: scheduleWorkoutV2ChartRender,/);
  // Membership, not the whole literal: migrating a window adds ids to this list.
  const flexList = /const flexQuadros = \[([^\]]*)\]/.exec(shell);
  assert.ok(flexList, "hideQuadro has no flexQuadros list");
  assert.ok(flexList[1].includes('"workoutContainer"'), "workout must open as a flex column");
  assert.match(app, /function scheduleWorkoutV2ChartRender\(\)/);
  assert.match(css, /#workoutContainer \{[^}]*overflow: hidden;/);
  // The scroll area is a flex child, so the panel can never be clipped mid-content.
  assert.match(css, /#workoutTableDiv \{[^}]*flex: 1 1 auto;[^}]*overflow: auto;/);
  assert.doesNotMatch(css, /#workoutTableDiv \{[^}]*calc\(100% - 34px\)/);
  // The graph is drawn from the space available, so its axis stays on screen.
  assert.match(app, /function workoutV2ChartWidth\(\)/);
  assert.match(app, /function workoutV2ChartHeight\(\)/);
  assert.match(app, /const width = workoutV2ChartWidth\(\);\s*const height = workoutV2ChartHeight\(\);/);
  assert.match(app, /viewBox="0 0 \$\{width\} \$\{height\}" style="height:\$\{height\}px"/);
});

test("Exercise graph takes an exact date range, not just the presets", () => {
  const app = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(app, /progressFrom: "",\s*progressTo: "",/);
  assert.match(app, /id="workoutV2ProgressFrom" type="date"/);
  assert.match(app, /id="workoutV2ProgressTo" type="date"/);
  assert.match(app, /data-action="clear-progress-range"/);
  assert.match(app, /workoutV2UiState\.progressFrom = event\.target\.value \|\| ""/);
  assert.match(app, /workoutV2UiState\.progressTo = event\.target\.value \|\| ""/);
  // Both ends are applied to the same series the cards and the graph read.
  assert.match(app, /if \(from && dateKey < from\) return false;/);
  assert.match(app, /if \(to && dateKey > to\) return false;/);
  // The pickers can only offer dates the imported history actually covers.
  assert.match(app, /const allSeries = WorkoutCore\.computeExerciseSeries\(workoutV2Data\(\), exercise\);/);
  assert.match(app, /min="\$\{workoutV2Escape\(firstDate\)\}" max="\$\{workoutV2Escape\(lastDate\)\}"/);
});

test("Exercise graph axis spans the sessions it is showing", () => {
  const app = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(app, /function workoutV2ValueAxis\(values\)/);
  assert.match(app, /const min = Math\.min\(\.\.\.finite\);\s*const max = Math\.max\(\.\.\.finite\);/);
  assert.match(app, /return workoutV2EvenTicks\(min, max\);/);
  assert.match(app, /const axis = workoutV2ValueAxis\(valid\.map\(\(point\) => point\.value\)\);/);
});

test("Workout cloud history loads through the feature sync lifecycle", () => {
  const shell = fs.readFileSync(path.join(root, "willos.js"), "utf8");
  const workout = fs.readFileSync(path.join(root, "workout-v2.js"), "utf8");

  assert.match(shell, /workoutContainer: \{ key: "workout"/);
  assert.match(shell, /if \(key === "workout"\) \{\s*await loadWorkoutV2BackendState\(\);/);
  const renderFunction = workout.match(
    /function renderWorkoutV2\(\) \{([\s\S]*?)\n\}\n\nfunction workoutV2OpenWindow/,
  )?.[1] || "";
  assert.doesNotMatch(renderFunction, /loadWorkoutV2BackendState/);
  assert.match(workout, /function workoutV2FetchSessionEntries/);
  assert.match(workout, /\.range\(from, from \+ pageSize - 1\)/);
  assert.match(workout, /workoutV2Chunks\(sessionIds, 40\)/);
});
