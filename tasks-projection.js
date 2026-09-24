// Routine, To-do and Kanban windows: READ-ONLY projections of two render models.
//
//   data/routine.json  <- will routine store  (will done <code>, will undo, ...)
//   data/tasks.json    <- will tasks store    (will task add/done/move/rm)
//
// The three windows used to edit their own localStorage/Supabase rows; that is
// gone (see AGENTS.md: one writer, the will CLI). tests/shell-ui.test.js pins it.

const TASKS_PROJECTION_URL = "data/tasks.json";
const ROUTINE_PROJECTION_URL = "data/routine.json";

const TASK_COLUMN_ORDER = ["todo", "doing", "blocked", "done"];
const TASK_COLUMN_LABELS = { todo: "To do", doing: "In progress", blocked: "Blocked", done: "Done" };
const OPEN_STATES = ["doing", "todo", "blocked"];
const OPEN_LABELS = { doing: "doing", todo: "to do", blocked: "blocked" };

const tasksProjectionState = {
  tasks: null,
  routine: null,
  statuses: { tasks: "Ready.", routine: "Ready.", kanban: "Ready." },
  renderRaf: 0,
};

function shortDate(value) {
  return String(value || "").slice(0, 10);
}

function emptyTasksModel() {
  return { generatedAt: "", open: 0, columns: { todo: [], doing: [], blocked: [], done: [] } };
}

function emptyRoutineModel() {
  return { generatedAt: "", routines: [] };
}

function normalizeTasksModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const columns = {};
  TASK_COLUMN_ORDER.forEach((state) => {
    const rows = source.columns && Array.isArray(source.columns[state]) ? source.columns[state] : [];
    columns[state] = rows
      .filter((task) => task && typeof task === "object")
      .map((task) => ({
        id: Number(task.id) || 0,
        text: String(task.text || ""),
        lane: String(task.lane || ""),
        createdAt: String(task.created_at || ""),
        doneAt: String(task.done_at || ""),
      }));
  });
  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    open: TASK_COLUMN_ORDER.filter((state) => state !== "done").reduce(
      (total, state) => total + columns[state].length,
      0,
    ),
    columns,
  };
}

function normalizeRoutineModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const rows = Array.isArray(source.routines) ? source.routines : [];
  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    routines: rows
      .filter((routine) => routine && typeof routine === "object")
      .map((routine) => ({
        code: String(routine.code || ""),
        label: String(routine.label || ""),
        streak: Number(routine.streak) || 0,
        doneToday: Boolean(routine.done_today),
        monthCount: Number(routine.month_count) || 0,
        lastDoneOn: String(routine.last_done_on || ""),
      })),
  };
}

async function loadJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadTasksModels() {
  try {
    tasksProjectionState.tasks = normalizeTasksModel(await loadJson(TASKS_PROJECTION_URL));
    const stamp = tasksProjectionState.tasks.generatedAt
      ? ` exported ${tasksProjectionState.tasks.generatedAt}`
      : "";
    tasksProjectionState.statuses.tasks =
      `${tasksProjectionState.tasks.open} open tasks${stamp}. Read-only: will task add "..."`;
    tasksProjectionState.statuses.kanban =
      `${tasksProjectionState.tasks.columns.done.length} done, ` +
      `${tasksProjectionState.tasks.open} open. Read-only: will task move <id> <state>`;
  } catch (error) {
    tasksProjectionState.tasks = emptyTasksModel();
    tasksProjectionState.statuses.tasks = `No render model yet (${error.message}). Run: will export`;
    tasksProjectionState.statuses.kanban = tasksProjectionState.statuses.tasks;
  }

  try {
    tasksProjectionState.routine = normalizeRoutineModel(await loadJson(ROUTINE_PROJECTION_URL));
    const done = tasksProjectionState.routine.routines.filter((routine) => routine.doneToday).length;
    const stamp = tasksProjectionState.routine.generatedAt
      ? ` exported ${tasksProjectionState.routine.generatedAt}`
      : "";
    tasksProjectionState.statuses.routine =
      `${done}/${tasksProjectionState.routine.routines.length} routines done today${stamp}. ` +
      "Read-only: will done <routine>";
  } catch (error) {
    tasksProjectionState.routine = emptyRoutineModel();
    tasksProjectionState.statuses.routine = `No render model yet (${error.message}). Run: will export`;
  }
}

function setStatus(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function emptyRow(text) {
  const li = document.createElement("li");
  li.className = "projection-empty";
  li.textContent = text;
  return li;
}

// TO-DO -------------------------------------------------------------------

function renderTaskList() {
  const host = document.getElementById("taskList");
  if (!host) return;
  host.innerHTML = "";

  const model = tasksProjectionState.tasks;
  if (!model) {
    setStatus("todoStatus", tasksProjectionState.statuses.tasks);
    return;
  }

  const open = OPEN_STATES.flatMap((state) =>
    model.columns[state].map((task) => ({ ...task, state })),
  );

  if (open.length === 0) {
    host.appendChild(emptyRow('No open tasks. In the terminal: will task add "something to do"'));
    setStatus("todoStatus", tasksProjectionState.statuses.tasks);
    return;
  }

  open.forEach((task) => {
    const li = document.createElement("li");
    li.dataset.taskId = String(task.id);

    const tag = document.createElement("span");
    tag.className = `projection-tag projection-tag--${task.state}`;
    tag.textContent = OPEN_LABELS[task.state] || task.state;

    const main = document.createElement("span");
    main.className = "projection-main";
    main.textContent = task.text;

    const date = document.createElement("span");
    date.className = "projection-date";
    date.textContent = shortDate(task.createdAt);

    li.append(tag, main, date);
    host.appendChild(li);
  });

  setStatus("todoStatus", tasksProjectionState.statuses.tasks);
}

// KANBAN ------------------------------------------------------------------

function renderKanbanBoard() {
  const host = document.getElementById("kanbanBoard");
  if (!host) return;
  host.innerHTML = "";

  const model = tasksProjectionState.tasks;
  if (!model) {
    setStatus("kanbanStatus", tasksProjectionState.statuses.kanban);
    return;
  }

  TASK_COLUMN_ORDER.forEach((state) => {
    const column = document.createElement("div");
    column.className = "kanban-column";

    const heading = document.createElement("h3");
    heading.textContent = `${TASK_COLUMN_LABELS[state]} (${model.columns[state].length})`;

    const items = document.createElement("div");
    items.className = "kanban-items";

    if (model.columns[state].length === 0) {
      const empty = document.createElement("p");
      empty.className = "projection-empty";
      empty.textContent = "empty";
      items.appendChild(empty);
    } else {
      model.columns[state].forEach((task) => {
        const item = document.createElement("div");
        item.className = "kanban-item";
        item.dataset.taskId = String(task.id);
        const text = document.createElement("span");
        text.textContent = task.text;
        item.appendChild(text);
        items.appendChild(item);
      });
    }

    column.append(heading, items);
    host.appendChild(column);
  });

  setStatus("kanbanStatus", tasksProjectionState.statuses.kanban);
}

// ROUTINE -----------------------------------------------------------------

function renderRoutineList() {
  const host = document.getElementById("routineList");
  if (!host) return;
  host.innerHTML = "";

  const model = tasksProjectionState.routine;
  if (!model) {
    setStatus("dailiesStatus", tasksProjectionState.statuses.routine);
    return;
  }

  if (model.routines.length === 0) {
    const empty = document.createElement("p");
    empty.className = "projection-empty";
    empty.textContent = "No routines. In the terminal: will routine add \"Morning operator\"";
    host.appendChild(empty);
    setStatus("dailiesStatus", tasksProjectionState.statuses.routine);
    return;
  }

  model.routines.forEach((routine) => {
    const row = document.createElement("div");
    row.className = "routine-row";
    row.dataset.routine = routine.code;

    const mark = document.createElement("span");
    mark.className = "routine-mark";
    if (!routine.doneToday) mark.classList.add("routine-mark--off");
    mark.textContent = routine.doneToday ? "x" : "-";

    const label = document.createElement("span");
    label.className = "routine-label";
    label.textContent = routine.label;

    const meta = document.createElement("span");
    meta.className = "routine-meta";
    meta.textContent = `streak ${routine.streak} · this month ${routine.monthCount}`;
    meta.title = routine.lastDoneOn ? `last done ${routine.lastDoneOn}` : "never done";

    row.append(mark, label, meta);
    host.appendChild(row);
  });

  setStatus("dailiesStatus", tasksProjectionState.statuses.routine);
}

function renderTasksProjections() {
  renderTaskList();
  renderKanbanBoard();
  renderRoutineList();
}

function scheduleTasksRender() {
  if (tasksProjectionState.renderRaf) return;
  tasksProjectionState.renderRaf = requestAnimationFrame(function () {
    tasksProjectionState.renderRaf = 0;
    renderTasksProjections();
  });
}

async function initTasksProjection() {
  tasksProjectionState.tasks = emptyTasksModel();
  tasksProjectionState.routine = emptyRoutineModel();
  renderTasksProjections();
  await loadTasksModels();
  scheduleTasksRender();
}

document.addEventListener("DOMContentLoaded", initTasksProjection);
