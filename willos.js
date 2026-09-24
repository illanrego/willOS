// Dhammapada verse of the day (from 24 Feb 2026 = 001, +1 each day)
function getDhammapadaVerseOfDay() {
  const start = new Date("2026-02-24");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const verse = Math.max(1, diffDays + 1);
  return String(verse).padStart(3, "0");
}

document.addEventListener("DOMContentLoaded", function () {
  const dhammapadaLink = document.querySelector('a[title="dhammapada"]');
  if (dhammapadaLink) {
    dhammapadaLink.href = `https://www.tipitaka.net/tipitaka/dhp/verseload.php?verse=${getDhammapadaVerseOfDay()}`;
  }
});

// GERAR MES ATUAL

document.addEventListener("DOMContentLoaded", function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  generateCalendar(year, month);
});

// BEM VINDAS PERSONALIZADAS EM RELAÇÃO A HORA E AO DIA (RESPECTIVAMENTE)

function getLocalDisplayName() {
  const name = localStorage.getItem("name");
  return name && name !== "null" ? name : "";
}

function setLocalDisplayName(name) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (cleanName) localStorage.setItem("name", cleanName);
}

function ensureLocalDisplayName() {
  const existing = getLocalDisplayName();
  if (existing) return existing;

  const name = prompt("Insira seu nome:");
  setLocalDisplayName(name);
  return getLocalDisplayName() || "i";
}

function renderGreeting(name = getLocalDisplayName() || "i") {
  const hour = new Date().getHours();
  const greeting = document.querySelector("h1");
  if (!greeting) return;

  if (hour >= 5 && hour < 12) {
    greeting.textContent = `Bom dia, ${name}!`;
  } else if (hour >= 12 && hour < 18) {
    greeting.textContent = `Boa tarde, ${name}!`;
  } else if (hour > 23 || hour < 5) {
    greeting.textContent = `Boa madrugada, ${name}!`;
  } else {
    greeting.textContent = `Boa noite, ${name}!`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderGreeting(ensureLocalDisplayName());
});

function getDefaultWallpaperValue() {
  const month = new Date().getMonth();
  const months = {
    0: "janeiro",
    1: "fevereiro",
    2: "marco",
    3: "abril",
    4: "maio",
    5: "junho",
    6: "julho",
    7: "agosto",
    8: "setembro",
    9: "outubro",
    10: "novembro",
    11: "dezembro",
  };
  return `url("./imagens/wallps/${months[month]}.jpg")`;
}

function getLocalWallpaper() {
  return localStorage.getItem("wallp") || "";
}

function setLocalWallpaper(wallpaper) {
  if (wallpaper) {
    localStorage.setItem("wallp", wallpaper);
  } else {
    localStorage.removeItem("wallp");
  }
}

function applyWallpaperValue(wallpaper) {
  const backgroundImage = document.getElementById("bgContainer");
  if (!backgroundImage) return;
  backgroundImage.style.backgroundImage = wallpaper || getDefaultWallpaperValue();
}

function applyCurrentWallpaper() {
  applyWallpaperValue(getLocalWallpaper());
}

document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const miniGreetings = document.querySelector("h3");

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const dayOfYear = today.toLocaleDateString("pt-BR", options);
  miniGreetings.textContent = `hoje é ${dayOfYear}`;
});

// PAPEL DE PAREDE GERADO DE ACORDO COM O MÊS

document.addEventListener("DOMContentLoaded", function () {
  applyCurrentWallpaper();
});

async function removeWallp() {
  setLocalWallpaper("");
  applyCurrentWallpaper();
  await saveBackendUserSettings({ wallpaper: null });
}

// RELÓGIO

function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  document.getElementById("hours").textContent = ` ${hours}:`;
  document.getElementById("minutes").textContent = `${minutes}:`;
  document.getElementById("seconds").textContent = seconds;
}

//CALL ONCE TO UPDATE WHEN PAGE LOADS
updateClock();

//CALL EVERY 20SECS TO UPDATE
setInterval(updateClock, 1000);

/*

// GERADOR DE SEMANA
document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    const currentWeek = getWeekNumber(currentDate);
    document.getElementById('currentWeek').textContent = `Week ${currentWeek}/52`;
   
	const weekGraph = document.getElementById('weekGraph');
	const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
  
    // Create table header (days of the week)
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const headerRow = document.createElement('tr');
    daysOfWeek.forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Create table body (dates of the current week)
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Get the first day of the week (Sunday)
    for (let i = 0; i < 1; i++) { // Only one row for the current week
      const tr = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        const td = document.createElement('td');
        const day = new Date(firstDayOfWeek);
        day.setDate(firstDayOfWeek.getDate() + j);
        td.textContent = day.getDate();
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    weekGraph.appendChild(table);
    
  });
*/

function getWeekNumber(date) {
  const startOfYear = new Date(date.getUTCFullYear(), 0, 1);
  const daysDifference = Math.floor((date - startOfYear) / 86400000);
  const weekNumber =
    Math.floor((daysDifference + startOfYear.getUTCDay() + 1) / 7) + 1;
  return weekNumber;
}

// TO DO LIST

const LOCAL_TASKS_STORAGE_KEY = "tasks";
const LOCAL_DAILIES_STORAGE_KEY = "dailiesList";
const TASK_IMPORT_SCOPE = "tasks_v1";
const TASK_TYPE_TODO = "todo";
const TASK_TYPE_DAILY = "daily";
const taskRemoteState = {
  loaded: false,
  todos: [],
  dailies: [],
};

function setTodoStatus(message) {
  const status = document.getElementById("todoStatus");
  if (!status) return;
  status.textContent = message;
}

function makeLocalTaskId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDailySkillCode(skillCode) {
  const value = typeof skillCode === "string" ? skillCode.trim().toLowerCase() : "";
  return value && GAMIFY_SKILLS[value] ? value : "";
}

function normalizeTaskSortOrder(sortOrder) {
  const value = Number(sortOrder);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function isTaskBackendActive() {
  return Boolean(backendState.client && backendState.session && taskRemoteState.loaded);
}

function normalizeLocalTaskEntry(task) {
  if (typeof task === "string") {
    const text = task.trim();
    if (!text) return null;
    return {
      id: makeLocalTaskId(),
      text,
      source: "local",
    };
  }

  if (!task || typeof task !== "object") return null;
  const text = typeof task.text === "string" ? task.text.trim() : "";
  if (!text) return null;

  return {
    id: typeof task.id === "string" && task.id.trim() ? task.id : makeLocalTaskId(),
    text,
    source: "local",
    createdAt:
      typeof task.createdAt === "string" && task.createdAt
        ? task.createdAt
        : new Date().toISOString(),
  };
}

function normalizeLocalDailyEntry(daily) {
  if (typeof daily === "string") {
    const text = daily.trim();
    if (!text) return null;
    return {
      id: makeLocalTaskId(),
      text,
      source: "local",
      skillCode: "",
      sortOrder: 0,
      dailyDoneOn: "",
      description: "",
      createdAt: new Date().toISOString(),
    };
  }

  if (!daily || typeof daily !== "object") return null;
  const text = typeof daily.text === "string" ? daily.text.trim() : "";
  if (!text) return null;
  return {
    id: typeof daily.id === "string" && daily.id.trim() ? daily.id : makeLocalTaskId(),
    text,
    source: "local",
    skillCode: normalizeDailySkillCode(daily.skillCode),
    sortOrder: normalizeTaskSortOrder(daily.sortOrder),
    dailyDoneOn: typeof daily.dailyDoneOn === "string" ? daily.dailyDoneOn.trim() : "",
    description: typeof daily.description === "string" ? daily.description.trim() : "",
    createdAt:
      typeof daily.createdAt === "string" && daily.createdAt
        ? daily.createdAt
        : new Date().toISOString(),
  };
}

function getLocalTaskList() {
  let rawTasks = [];
  try {
    rawTasks = JSON.parse(localStorage.getItem(LOCAL_TASKS_STORAGE_KEY)) || [];
  } catch (_error) {
    rawTasks = [];
  }

  const tasks = Array.isArray(rawTasks)
    ? rawTasks.map(normalizeLocalTaskEntry).filter(Boolean)
    : [];

  const needsRewrite =
    !Array.isArray(rawTasks) ||
    rawTasks.length !== tasks.length ||
    rawTasks.some((item) => typeof item !== "object" || item === null);

  if (needsRewrite) {
    localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }

  return tasks;
}

function setLocalTaskList(tasks) {
  localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function getLocalDailyList() {
  let rawDailies = [];
  try {
    rawDailies = JSON.parse(localStorage.getItem(LOCAL_DAILIES_STORAGE_KEY)) || [];
  } catch (_error) {
    rawDailies = [];
  }

  const dailies = Array.isArray(rawDailies)
    ? rawDailies.map(normalizeLocalDailyEntry).filter(Boolean)
    : [];

  const needsRewrite =
    !Array.isArray(rawDailies) ||
    rawDailies.length !== dailies.length ||
    rawDailies.some((item) => typeof item !== "object" || item === null);

  if (needsRewrite) {
    localStorage.setItem(LOCAL_DAILIES_STORAGE_KEY, JSON.stringify(dailies));
  }

  return dailies;
}

function setLocalDailyList(dailies) {
  localStorage.setItem(LOCAL_DAILIES_STORAGE_KEY, JSON.stringify(dailies));
}

function getTasks() {
  return isTaskBackendActive() ? taskRemoteState.todos : getLocalTaskList();
}

function setTasks(tasks) {
  if (isTaskBackendActive()) {
    taskRemoteState.todos = tasks;
    return;
  }
  setLocalTaskList(tasks);
}

function saveTodoToLocalFallback(task) {
  const normalized = normalizeLocalTaskEntry({
    ...task,
    id: task.id || makeLocalTaskId(),
  });
  if (!normalized) return null;
  const tasks = getLocalTaskList();
  tasks.push(normalized);
  setLocalTaskList(tasks);
  return normalized;
}

function getDailyTasks() {
  return isTaskBackendActive() ? taskRemoteState.dailies : getLocalDailyList();
}

function setDailyTasks(dailies) {
  if (isTaskBackendActive()) {
    taskRemoteState.dailies = dailies;
    return;
  }
  setLocalDailyList(dailies);
}

function getNextDailySortOrder(dailies = getDailyTasks()) {
  return dailies.reduce(
    (max, daily) => Math.max(max, normalizeTaskSortOrder(daily?.sortOrder)),
    -1,
  ) + 1;
}

function mapTaskRowToTodo(row) {
  return normalizeLocalTaskEntry({
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
  });
}

function mapTaskRowToDaily(row) {
  return normalizeLocalDailyEntry({
    id: row.id,
    text: row.text,
    skillCode: row.skill_code,
    sortOrder: row.sort_order,
    dailyDoneOn: row.daily_done_on || "",
    description: row.description || "",
    createdAt: row.created_at,
  });
}

async function createBackendTask(task) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");
  return throwIfSupabaseError(
    await backendState.client
      .from("tasks")
      .insert({
        user_id: userId,
        legacy_id: task.legacyId || null,
        text: task.text,
        task_type: task.taskType || TASK_TYPE_TODO,
        source: task.source || "local",
        skill_code: task.skillCode || null,
        sort_order: normalizeTaskSortOrder(task.sortOrder),
        created_at: financeTimestampForDb(task.createdAt),
      })
      .select("id, text, task_type, source, skill_code, sort_order, created_at")
      .single(),
  );
}

async function updateBackendTask(taskId, patch) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !taskId) return;
  throwIfSupabaseError(
    await backendState.client
      .from("tasks")
      .update(patch)
      .eq("id", taskId)
      .eq("user_id", userId),
  );
}

async function deleteBackendTask(taskId) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !taskId) return;
  throwIfSupabaseError(
    await backendState.client
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId),
  );
}

async function loadTaskBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    taskRemoteState.loaded = false;
    return;
  }

  const taskRows = throwIfSupabaseError(
    await backendState.client
      .from("tasks")
      .select("id, text, task_type, source, skill_code, sort_order, daily_done_on, description, created_at")
      .eq("user_id", userId)
      .is("completed_at", null)
      .in("task_type", [TASK_TYPE_TODO, TASK_TYPE_DAILY])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  );

  taskRemoteState.todos = (taskRows || [])
    .filter((row) => row.task_type === TASK_TYPE_TODO)
    .map((row) => mapTaskRowToTodo(row))
    .filter(Boolean);
  taskRemoteState.dailies = (taskRows || [])
    .filter((row) => row.task_type === TASK_TYPE_DAILY)
    .map((row) => mapTaskRowToDaily(row))
    .filter(Boolean);
  taskRemoteState.loaded = true;
}

async function refreshTaskBackendState() {
  await loadTaskBackendState();
  renderTaskList();
  renderDailies();
}

async function importTaskLocalDataOnce() {
  if (hasBackendImportCompleted(TASK_IMPORT_SCOPE)) return;
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  const localTasks = getLocalTaskList();
  const localDailies = getLocalDailyList();
  if (localTasks.length === 0 && localDailies.length === 0) {
    markBackendImportCompleted(TASK_IMPORT_SCOPE);
    return;
  }

  setTodoStatus("Importing local todos/dailies...");
  for (const task of localTasks) {
    throwIfSupabaseError(
      await backendState.client
        .from("tasks")
        .upsert(
          {
            user_id: userId,
            legacy_id: task.id,
            text: task.text,
            task_type: TASK_TYPE_TODO,
            source: "local",
            created_at: financeTimestampForDb(task.createdAt),
          },
          { onConflict: "user_id,legacy_id" },
        )
        .select("id")
        .single(),
    );
  }

  for (const daily of localDailies) {
    throwIfSupabaseError(
      await backendState.client.from("tasks").upsert(
        {
          user_id: userId,
          legacy_id: daily.id,
          text: daily.text,
          task_type: TASK_TYPE_DAILY,
          source: "local",
          skill_code: daily.skillCode || null,
          sort_order: normalizeTaskSortOrder(daily.sortOrder),
          created_at: financeTimestampForDb(daily.createdAt),
        },
        { onConflict: "user_id,legacy_id" },
      ),
    );
  }

  markBackendImportCompleted(TASK_IMPORT_SCOPE);
}

async function removeTask(taskId) {
  const task = getTasks().find((item) => item.id === taskId);
  if (!task) return;

  if (isTaskBackendActive()) {
    try {
      await deleteBackendTask(taskId);
      taskRemoteState.todos = taskRemoteState.todos.filter((item) => item.id !== taskId);
      renderTaskList();
      setTodoStatus(`Removed "${task.text}".`);
    } catch (error) {
      console.error("Todo delete error:", error);
      setTodoStatus(`Delete failed: ${describeBackendError(error)}`);
    }
    return;
  }

  const tasks = getLocalTaskList().filter((item) => item.id !== taskId);
  setLocalTaskList(tasks);
  renderTaskList();
  setTodoStatus(`Removed "${task.text}".`);
}

function renderTaskList() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = "";
  const tasks = getTasks();

  tasks.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "todo-task-item";

    const main = document.createElement("div");
    main.className = "todo-task-main";

    const text = document.createElement("span");
    text.className = "todo-task-text";
    text.textContent = task.text;
    main.appendChild(text);

    const actions = document.createElement("div");
    actions.className = "todo-task-actions";

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "todo-task-done";
    doneButton.textContent = "done";
    doneButton.addEventListener("click", function () {
      void completeTask(task.id, doneButton);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-task-remove";
    deleteButton.textContent = "x";
    deleteButton.onclick = function () {
      void removeTask(task.id);
    };

    actions.appendChild(doneButton);
    actions.appendChild(deleteButton);
    li.appendChild(main);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

async function completeTask(taskId, buttonEl) {
  const task = getTasks().find((item) => item.id === taskId);
  if (!task) return;

  if (buttonEl) buttonEl.disabled = true;

  try {
    if (isTaskBackendActive()) {
      try {
        await updateBackendTask(taskId, { completed_at: new Date().toISOString() });
        taskRemoteState.todos = taskRemoteState.todos.filter((item) => item.id !== taskId);
        renderTaskList();
      } catch (storageError) {
        console.error("Todo DB completion error:", storageError);
        setTodoStatus(`DB completion failed: ${describeBackendError(storageError)}`);
        if (buttonEl) buttonEl.disabled = false;
        return;
      }
    } else {
      const tasks = getLocalTaskList().filter((item) => item.id !== taskId);
      setLocalTaskList(tasks);
      renderTaskList();
    }
    setTodoStatus(`Done: "${task.text}".`);
  } catch (error) {
    console.error("Todo completion error:", error);
    setTodoStatus(`Completion failed for "${task.text}".`);
    if (buttonEl) buttonEl.disabled = false;
  }
}

async function addTask() {
  const taskInput = document.getElementById("taskInput");
  if (!taskInput) return;

  const text = taskInput.value.trim();
  if (!text) return;

  const task = {
    id: makeLocalTaskId(),
    text,
    source: "local",
    createdAt: new Date().toISOString(),
  };

  if (isTaskBackendActive()) {
    try {
      const row = await createBackendTask({
        text,
        taskType: TASK_TYPE_TODO,
        source: task.source,
        createdAt: task.createdAt,
      });
      task.id = row.id;
      task.createdAt = row.created_at;
      taskRemoteState.todos.push(task);
      renderTaskList();
      taskInput.value = "";
      setTodoStatus(`Saved "${text}".`);
      return;
    } catch (error) {
      console.error("Todo DB save error:", error);
      // Fallback to local storage even if DB fails
      const fallbackTask = saveTodoToLocalFallback(task);
      if (fallbackTask) {
        taskRemoteState.todos.push(fallbackTask);
      }
      renderTaskList();
      taskInput.value = "";
      setTodoStatus(`DB failed, saved locally: "${text}".`);
      return;
    }
  }

  // Local mode - save to localStorage
  const savedTask = saveTodoToLocalFallback(task);
  if (savedTask) {
    renderTaskList();
    taskInput.value = "";
    setTodoStatus(`Saved locally: "${text}".`);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderTaskList();
  setTodoStatus("Ready.");

  const taskInput = document.getElementById("taskInput");
  if (taskInput) {
    taskInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") addTask();
    });
  }
});

// BACKEND / SUPABASE

const BACKEND_IMPORT_STATE_KEY = "startpageBackendImport_v1";
const backendState = {
  client: null,
  session: null,
  authMode: "normal",
};

function getConfigString(name) {
  const value = window[name];
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseConfig() {
  return {
    url: getConfigString("SUPABASE_URL"),
    anonKey: getConfigString("SUPABASE_ANON_KEY"),
  };
}

function getBackendUserId() {
  return backendState.session?.user?.id || "";
}

function setBackendAuthStatus(message) {
  const status = document.getElementById("backendAuthStatus");
  if (status) status.textContent = message;
}

function updateBackendAuthUi() {
  const emailInput = document.getElementById("backendAuthEmailInput");
  const passwordInput = document.getElementById("backendAuthPasswordInput");
  const sendBtn = document.getElementById("backendAuthSendBtn");
  const createBtn = document.getElementById("backendAuthCreateBtn");
  const resetBtn = document.getElementById("backendAuthResetBtn");
  const refreshBtn = document.getElementById("backendReloadBtn");
  const signOutBtn = document.getElementById("backendAuthSignOutBtn");
  const isSignedIn = Boolean(backendState.session);
  const isRecovering = backendState.authMode === "recovery";
  const canUseAuth = Boolean(backendState.client);
  if (emailInput) {
    emailInput.hidden = !canUseAuth || (isSignedIn && !isRecovering);
    emailInput.disabled = isRecovering;
  }
  if (passwordInput) {
    passwordInput.hidden = !canUseAuth || (isSignedIn && !isRecovering);
    passwordInput.placeholder = isRecovering ? "new password" : "password";
    passwordInput.autocomplete = isRecovering ? "new-password" : "current-password";
  }
  if (sendBtn) {
    sendBtn.hidden = !canUseAuth || (isSignedIn && !isRecovering);
    sendBtn.textContent = isRecovering ? "save password" : "login";
  }
  if (createBtn) createBtn.hidden = !canUseAuth || isSignedIn || isRecovering;
  if (resetBtn) resetBtn.hidden = !canUseAuth || isSignedIn || isRecovering;
  if (refreshBtn) refreshBtn.hidden = !isSignedIn || isRecovering;
  if (signOutBtn) signOutBtn.hidden = !isSignedIn && !isRecovering;
  renderConnectionsStatus();
}

function connectionLightForStatus(status) {
  if (status === "active") return "green";
  if (status === "disabled" || status === "local") return "yellow";
  if (status === "error") return "red";
  return "gray";
}

let selectedConnectionKey = "";

function formatConnectionDetail(value) {
  return String(value || "").trim() || "unknown";
}

function formatConnectionDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function buildConnectionRows() {
  const backendStatus = backendState.session
    ? "active"
    : backendState.client
      ? "local"
      : "disabled";
  const rows = [
    {
      name: "Backend",
      status: backendStatus,
      detail: backendState.session ? "signed in" : backendState.client ? "local mode" : "not configured",
      details: backendState.session
        ? [
            `User: ${backendState.session.user?.email || "unknown"}`,
            `User ID: ${getBackendUserId() || "unknown"}`,
          ]
        : backendState.client
          ? ["Supabase configured", "Sign in to enable cloud sync"]
          : ["Missing SUPABASE_URL or SUPABASE_ANON_KEY in keys.js"],
    },
  ];

  const workerAuthConfigured = hasWorkerAuthSession();

  const clickup = integrationRemoteState.integrations.clickup;
  const clickupMeta = clickup?.metadata || {};
  const clickupDisabledReason = !workerAuthConfigured
    ? "Sign in to Supabase first"
    : clickupMeta.lastError
      ? String(clickupMeta.lastError)
      : "ClickUp proxy unavailable";
  const clickupErrorReason = clickupMeta.lastError
    ? String(clickupMeta.lastError)
    : "Unknown ClickUp proxy error";
  rows.push({
    key: "clickup",
    name: "ClickUp",
    status: clickup?.status || (workerAuthConfigured ? "active" : "disabled"),
    detail: clickup?.status || (workerAuthConfigured ? "authenticated proxy" : "signed out"),
    details: [
      `Proxy URL: ${clickupMeta.proxyBaseUrl || getWorkerProxyBaseUrl()}`,
      `Worker auth: ${workerAuthConfigured ? "Supabase session" : "signed out"}`,
      "Provider token: stored in Worker",
      clickupMeta.listName ? `List: ${clickupMeta.listName}` : "",
      clickupMeta.lastTaskCount !== undefined ? `Last tasks: ${clickupMeta.lastTaskCount}` : "",
      `Last action: ${clickupMeta.lastAction || "none"}`,
      `Last check: ${formatConnectionDate(clickupMeta.lastCheckedAt) || "never"}`,
      clickup?.status === "disabled" ? `Disabled reason: ${clickupDisabledReason}` : "",
      clickup?.status === "error" ? `Error: ${clickupErrorReason}` : "",
    ].filter(Boolean),
  });

  const openai = integrationRemoteState.integrations.openai;
  const openaiMeta = openai?.metadata || {};
  const chatProxyConfigured = workerAuthConfigured;
  const openAiDisabledReason = !chatProxyConfigured
    ? "Sign in to Supabase first"
    : openaiMeta.lastError
      ? String(openaiMeta.lastError)
      : "OpenAI proxy unavailable";
  const openAiErrorReason = openaiMeta.lastError
    ? String(openaiMeta.lastError)
    : "Unknown OpenAI proxy error";
  rows.push({
    key: "openai",
    name: "OpenAI",
    status: openai?.status || (chatProxyConfigured ? "active" : "disabled"),
    detail: openai?.status || (chatProxyConfigured ? "authenticated proxy" : "signed out"),
    details: [
      `Model: ${openaiMeta.model || "gpt-4o-mini"}`,
      `Proxy URL: ${openaiMeta.proxyBaseUrl || getWorkerBaseUrl()}`,
      `Worker auth: ${chatProxyConfigured ? "Supabase session" : "signed out"}`,
      "Provider key: stored in Worker",
      `Last action: ${openaiMeta.lastAction || "none"}`,
      `Last check: ${formatConnectionDate(openaiMeta.lastCheckedAt) || "never"}`,
      openai?.status === "disabled" ? `Disabled reason: ${openAiDisabledReason}` : "",
      openai?.status === "error" ? `Error: ${openAiErrorReason}` : "",
    ].filter(Boolean),
  });

  const deepseek = integrationRemoteState.integrations.deepseek;
  const deepseekMeta = deepseek?.metadata || {};
  const deepseekDisabledReason = !chatProxyConfigured
    ? "Sign in to Supabase first"
    : deepseekMeta.lastError
      ? String(deepseekMeta.lastError)
      : "DeepSeek proxy unavailable";
  const deepseekErrorReason = deepseekMeta.lastError
    ? String(deepseekMeta.lastError)
    : "Unknown DeepSeek proxy error";
  rows.push({
    key: "deepseek",
    name: "DeepSeek V3",
    status: deepseek?.status || (chatProxyConfigured ? "active" : "disabled"),
    detail: deepseek?.status || (chatProxyConfigured ? "authenticated proxy" : "signed out"),
    details: [
      `Model: ${deepseekMeta.model || "deepseek-chat"}`,
      `Proxy URL: ${deepseekMeta.proxyBaseUrl || getWorkerBaseUrl()}`,
      `Worker auth: ${chatProxyConfigured ? "Supabase session" : "signed out"}`,
      "Provider key: stored in Worker",
      `Last action: ${deepseekMeta.lastAction || "none"}`,
      `Last check: ${formatConnectionDate(deepseekMeta.lastCheckedAt) || "never"}`,
      deepseek?.status === "disabled" ? `Disabled reason: ${deepseekDisabledReason}` : "",
      deepseek?.status === "error" ? `Error: ${deepseekErrorReason}` : "",
    ].filter(Boolean),
  });

  const gemini = integrationRemoteState.integrations.gemini;
  const geminiMeta = gemini?.metadata || {};
  const geminiDisabledReason = !chatProxyConfigured
    ? "Sign in to Supabase first"
    : geminiMeta.lastError
      ? String(geminiMeta.lastError)
      : "Gemini proxy unavailable";
  const geminiErrorReason = geminiMeta.lastError
    ? String(geminiMeta.lastError)
    : "Unknown Gemini proxy error";
  rows.push({
    key: "gemini",
    name: "Gemini",
    status: gemini?.status || (chatProxyConfigured ? "active" : "disabled"),
    detail: gemini?.status || (chatProxyConfigured ? "authenticated proxy" : "signed out"),
    details: [
      `Model: ${geminiMeta.model || "gemini-3.5-flash"}`,
      `Proxy URL: ${geminiMeta.proxyBaseUrl || getWorkerBaseUrl()}`,
      `Worker auth: ${chatProxyConfigured ? "Supabase session" : "signed out"}`,
      "Provider key: stored in Worker",
      `Last action: ${geminiMeta.lastAction || "none"}`,
      `Last check: ${formatConnectionDate(geminiMeta.lastCheckedAt) || "never"}`,
      gemini?.status === "disabled" ? `Disabled reason: ${geminiDisabledReason}` : "",
      gemini?.status === "error" ? `Error: ${geminiErrorReason}` : "",
    ].filter(Boolean),
  });

  const llama = integrationRemoteState.integrations.llama;
  const llamaMeta = llama?.metadata || {};
  const llamaDisabledReason = llamaMeta.lastError
    ? String(llamaMeta.lastError)
    : `Ollama not running on ${OLLAMA_BASE_URL}`;
  const llamaErrorReason = llamaMeta.lastError
    ? String(llamaMeta.lastError)
    : "Unable to connect to local Ollama";
  rows.push({
    key: "llama",
    name: "Llama 3.2 3B (Local)",
    status: llama?.status || "disabled",
    detail: llama?.status || "not connected",
    details: [
      `Model: ${llamaMeta.model || LOCAL_LLAMA_MODEL}`,
      `Endpoint: ${OLLAMA_BASE_URL}`,
      "Direct client: yes",
      `Last action: ${llamaMeta.lastAction || "none"}`,
      `Last check: ${formatConnectionDate(llamaMeta.lastCheckedAt) || "never"}`,
      llama?.status === "disabled" ? `Disabled reason: ${llamaDisabledReason}` : "",
      llama?.status === "error" ? `Error: ${llamaErrorReason}` : "",
    ].filter(Boolean),
  });

  const featureGroups = new Map();
  Object.values(FEATURE_SYNC_DEFINITIONS).forEach((definition) => {
    if (definition.key === "connections") return;
    featureGroups.set(definition.key, definition.label);
  });
  const featureStatuses = Array.from(featureGroups, ([key, label]) => ({
    label,
    status: featureSyncState.get(key)?.status || "idle",
  }));
  const readyFeatures = featureStatuses.filter((feature) => feature.status === "ready").length;
  const hasSyncError = featureStatuses.some((feature) => feature.status === "error");
  const isSyncing = featureStatuses.some((feature) => feature.status === "loading");
  rows.push({
    key: "sync",
    name: "Sync",
    status: !backendState.session ? "disabled" : hasSyncError ? "error" : readyFeatures > 0 ? "active" : "local",
    detail: backendState.session
      ? `${readyFeatures}/${featureStatuses.length} loaded${isSyncing ? " (syncing)" : ""}`
      : "signed out",
    details: backendState.session
      ? featureStatuses.map((feature) => `${feature.label}: ${feature.status}`)
      : ["Sign in to sync modules"],
  });

  rows[0].key = "backend";
  return rows;
}

function renderConnectionsStatus() {
  const list = document.getElementById("connectionsStatusList");
  if (!list) return;
  list.innerHTML = "";

  buildConnectionRows().forEach((row) => {
    const li = document.createElement("li");
    li.className = "connections-status-row";
    if (selectedConnectionKey && selectedConnectionKey === row.key) {
      li.classList.add("connections-status-row--active");
    }

    const light = document.createElement("span");
    light.className = `connection-light connection-light--${connectionLightForStatus(row.status)}`;
    light.title = row.status;

    const name = document.createElement("span");
    name.className = "connection-name";
    name.textContent = row.name;

    const detail = document.createElement("span");
    detail.className = "connection-detail";
    detail.textContent = formatConnectionDetail(row.detail);

    const status = document.createElement("span");
    status.className = "connection-status";
    status.appendChild(detail);
    status.appendChild(light);

    li.appendChild(name);
    li.appendChild(status);

    li.addEventListener("click", function () {
      selectedConnectionKey = selectedConnectionKey === row.key ? "" : row.key;
      renderConnectionsStatus();
    });

    if (selectedConnectionKey === row.key) {
      const detailsWrap = document.createElement("div");
      detailsWrap.className = "connection-extra";
      const detailsList = document.createElement("ul");
      detailsList.className = "connection-extra-list";
      (row.details || []).forEach((line) => {
        const detailsItem = document.createElement("li");
        detailsItem.textContent = line;
        detailsList.appendChild(detailsItem);
      });
      detailsWrap.appendChild(detailsList);
      li.appendChild(detailsWrap);
    }

    list.appendChild(li);
  });
}

function getBackendImportState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BACKEND_IMPORT_STATE_KEY)) || {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function hasBackendImportCompleted(scope) {
  const userId = getBackendUserId();
  if (!userId) return false;
  const state = getBackendImportState();
  return Boolean(state[userId]?.[scope]);
}

function markBackendImportCompleted(scope) {
  const userId = getBackendUserId();
  if (!userId) return;
  const state = getBackendImportState();
  state[userId] = {
    ...(state[userId] || {}),
    [scope]: new Date().toISOString(),
  };
  localStorage.setItem(BACKEND_IMPORT_STATE_KEY, JSON.stringify(state));
}

function throwIfSupabaseError(result) {
  if (result?.error) throw result.error;
  return result?.data;
}

function describeBackendError(error) {
  if (!error) return "unknown error";
  if (typeof error.message === "string" && error.message.trim()) return error.message;
  if (typeof error.error_description === "string") return error.error_description;
  if (typeof error.details === "string") return error.details;
  return String(error);
}

function setBackendSyncedStatus(prefix) {
  const synced = BACKEND_SYNC_ALL_CONTAINER_IDS.filter((containerId) => {
    const key = FEATURE_SYNC_DEFINITIONS[containerId].key;
    return featureSyncState.get(key)?.status === "ready";
  }).length;
  setBackendAuthStatus(`${prefix}: ${synced}/${BACKEND_SYNC_ALL_CONTAINER_IDS.length} feature(s) synced`);
}

async function ensureSupabaseProfile() {
  const user = backendState.session?.user;
  if (!backendState.client || !user) return;

  const existing = throwIfSupabaseError(
    await backendState.client
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1),
  );
  if (Array.isArray(existing) && existing.length > 0) return;

  const displayName = getLocalDisplayName() || user.email || "";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
  throwIfSupabaseError(
    await backendState.client.from("profiles").insert(
      {
        user_id: user.id,
        display_name: displayName,
        timezone,
        default_currency: "BRL",
      },
    ),
  );
}

async function saveBackendProfile(patch) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;
  throwIfSupabaseError(
    await backendState.client
      .from("profiles")
      .update(patch)
      .eq("user_id", userId),
  );
}

async function saveBackendUserSettings(patch) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;
  throwIfSupabaseError(
    await backendState.client.from("user_settings").upsert(
      {
        user_id: userId,
        ...patch,
      },
      { onConflict: "user_id" },
    ),
  );
}

async function syncBackendProfileSettings() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  const profiles = throwIfSupabaseError(
    await backendState.client
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .limit(1),
  );
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const remoteName =
    typeof profile?.display_name === "string" ? profile.display_name.trim() : "";
  const localName = getLocalDisplayName();

  if (remoteName) {
    setLocalDisplayName(remoteName);
    renderGreeting(remoteName);
  } else if (localName) {
    await saveBackendProfile({ display_name: localName });
    renderGreeting(localName);
  }

  const settingsRows = throwIfSupabaseError(
    await backendState.client
      .from("user_settings")
      .select("wallpaper")
      .eq("user_id", userId)
      .limit(1),
  );
  const settings = Array.isArray(settingsRows) ? settingsRows[0] : null;
  const remoteWallpaper =
    typeof settings?.wallpaper === "string" ? settings.wallpaper.trim() : "";
  const localWallpaper = getLocalWallpaper();

  if (remoteWallpaper) {
    setLocalWallpaper(remoteWallpaper);
    applyWallpaperValue(remoteWallpaper);
  } else if (localWallpaper) {
    await saveBackendUserSettings({ wallpaper: localWallpaper });
    applyWallpaperValue(localWallpaper);
  } else {
    applyCurrentWallpaper();
  }
}

const integrationRemoteState = {
  loaded: false,
  integrations: {},
};

function isIntegrationBackendActive() {
  return Boolean(backendState.client && backendState.session && integrationRemoteState.loaded);
}

function hasWorkerAuthSession() {
  return Boolean(backendState.client && backendState.session?.access_token);
}

async function getWorkerAuthorizationHeaders() {
  if (!backendState.client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await backendState.client.auth.getSession();
  if (error) throw error;

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    throw new Error("Sign in to Supabase before using cloud integrations");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function upsertBackendIntegration(provider, options = {}) {
  const userId = getBackendUserId();
  const cleanProvider = String(provider || "").trim();
  if (!backendState.client || !userId || !cleanProvider) return;

  const row = throwIfSupabaseError(
    await backendState.client
      .from("integrations")
      .upsert(
        {
          user_id: userId,
          provider: cleanProvider,
          external_user_id: options.externalUserId || null,
          status: options.status || "active",
          metadata: options.metadata || {},
        },
        { onConflict: "user_id,provider" },
      )
      .select("provider, external_user_id, status, metadata, updated_at")
      .single(),
  );
  integrationRemoteState.integrations[row.provider] = row;
}

async function loadIntegrationsBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    integrationRemoteState.loaded = false;
    return;
  }

  const rows = throwIfSupabaseError(
    await backendState.client
      .from("integrations")
      .select("provider, external_user_id, status, metadata, updated_at")
      .eq("user_id", userId)
      .order("provider", { ascending: true }),
  );
  integrationRemoteState.integrations = Object.fromEntries(
    (rows || []).map((row) => [row.provider, row]),
  );
  integrationRemoteState.loaded = true;
}

async function syncConfiguredIntegrationsState() {
  if (!backendState.client || !backendState.session) return;

  const workerAuthConfigured = hasWorkerAuthSession();
  const clickupMetadata = getIntegrationMetadata("clickup");
  const openAiMetadata = getIntegrationMetadata("openai");
  const geminiMetadata = getIntegrationMetadata("gemini");
  const deepseekMetadata = getIntegrationMetadata("deepseek");
  const llamaMetadata = getIntegrationMetadata("llama");
  const llamaCurrent = integrationRemoteState.integrations.llama;

  await Promise.all([
    upsertBackendIntegration("clickup", {
      status: workerAuthConfigured ? "active" : "disabled",
      metadata: {
        ...clickupMetadata,
        configured: workerAuthConfigured,
        directClient: false,
        proxyBaseUrl: getWorkerProxyBaseUrl(),
        usesSupabaseAuth: true,
      },
    }),
    upsertBackendIntegration("openai", {
      status: workerAuthConfigured ? "active" : "disabled",
      metadata: {
        ...openAiMetadata,
        configured: workerAuthConfigured,
        directClient: false,
        proxyBaseUrl: getWorkerBaseUrl(),
        usesSupabaseAuth: true,
        model: "gpt-4o-mini",
      },
    }),
    upsertBackendIntegration("gemini", {
      status: workerAuthConfigured ? "active" : "disabled",
      metadata: {
        ...geminiMetadata,
        configured: workerAuthConfigured,
        directClient: false,
        proxyBaseUrl: getWorkerBaseUrl(),
        usesSupabaseAuth: true,
        model: "gemini-3.5-flash",
      },
    }),
    upsertBackendIntegration("deepseek", {
      status: workerAuthConfigured ? "active" : "disabled",
      metadata: {
        ...deepseekMetadata,
        configured: workerAuthConfigured,
        directClient: false,
        proxyBaseUrl: getWorkerBaseUrl(),
        usesSupabaseAuth: true,
        model: "deepseek-chat",
      },
    }),
    upsertBackendIntegration("llama", {
      status: llamaCurrent?.status || "disabled",
      metadata: {
        ...llamaMetadata,
        configured: true,
        directClient: true,
        model: LOCAL_LLAMA_MODEL,
      },
    }),
  ]);
}

async function recordIntegrationStatus(provider, status, metadata = {}) {
  if (!backendState.client || !backendState.session) return;
  const current = integrationRemoteState.integrations[provider] || {};
  try {
    await upsertBackendIntegration(provider, {
      status,
      externalUserId: current.external_user_id || "",
      metadata: {
        ...(current.metadata || {}),
        ...metadata,
        lastCheckedAt: new Date().toISOString(),
      },
    });
    renderConnectionsStatus();
  } catch (error) {
    console.error(`${provider} integration status sync error:`, error);
  }
}

function getIntegrationMetadata(provider) {
  const current = integrationRemoteState.integrations[provider];
  return current && current.metadata && typeof current.metadata === "object"
    ? current.metadata
    : {};
}

async function saveIntegrationMetadata(provider, metadata, status = "active") {
  if (!backendState.client || !backendState.session) return;
  await upsertBackendIntegration(provider, { status, metadata });
  renderConnectionsStatus();
}

const FEATURE_SYNC_DEFINITIONS = {
  skillsContainer: { key: "gamify", label: "Gamify" },
  dailiesContainer: { key: "tasks", label: "Tasks" },
  todoContainer: { key: "tasks", label: "Tasks" },
  recContainer: { key: "lists", label: "Lists" },
  nextFeatures: { key: "lists", label: "Lists" },
  workoutContainer: { key: "workout", label: "Workout" },
  calendarContainer: { key: "calendar", label: "Calendar" },
  kanbanContainer: { key: "kanban", label: "Kanban" },
  financeContainer: { key: "finance", label: "Finance" },
  connectionsContainer: { key: "connections", label: "Connections" },
};
const BACKEND_SYNC_ALL_CONTAINER_IDS = [
  "todoContainer",
  "kanbanContainer",
  "skillsContainer",
  "calendarContainer",
  "workoutContainer",
  "recContainer",
  "financeContainer",
];
const featureSyncState = new Map();

function updateFeatureSyncUi(containerId, status) {
  const definition = FEATURE_SYNC_DEFINITIONS[containerId];
  if (!definition) return;
  Object.entries(FEATURE_SYNC_DEFINITIONS).forEach(([candidateId, candidate]) => {
    if (candidate.key !== definition.key) return;
    const container = document.getElementById(candidateId);
    const button = container?.querySelector("[data-feature-sync]");
    if (container) {
      container.classList.toggle("feature-sync-loading", status === "loading");
      container.setAttribute("aria-busy", status === "loading" ? "true" : "false");
    }
    if (!button) return;
    button.disabled = status === "loading" || !backendState.session;
    button.textContent = status === "loading" ? "syncing…" : status === "error" ? "retry sync" : "sync";
    button.title = backendState.session ? "Sync this feature now" : "Sign in to sync";
  });
}

function resetFeatureSyncState() {
  featureSyncState.clear();
  Object.keys(FEATURE_SYNC_DEFINITIONS).forEach((containerId) => {
    updateFeatureSyncUi(containerId, "idle");
  });
}

async function loadFeatureSyncGroup(key) {
  if (key === "tasks") {
    await loadTaskBackendState();
    renderTaskList();
    renderDailies();
    return;
  }
  if (key === "kanban") {
    await loadKanbanBackendState();
    renderKanbanBoard();
    return;
  }
  if (key === "gamify") {
    await loadTrackerBackendState();
    renderTrackerBackedUi();
    return;
  }
  if (key === "calendar") {
    await loadCalendarBackendState();
    generateCalendar();
    return;
  }
  if (key === "workout") {
    await loadWorkoutV2BackendState();
    renderWorkout();
    return;
  }
  if (key === "lists") {
    await loadListsBackendState();
    renderSimpleLists();
    return;
  }
  if (key === "finance") {
    if (!integrationRemoteState.loaded) await loadIntegrationsBackendState();
    await loadFinanceRecurringState();
    await refreshFinanceBackendState();
    return;
  }
  if (key === "connections") {
    await loadIntegrationsBackendState();
    renderConnectionsStatus();
    return;
  }
}

function syncFeatureForContainer(containerId, options = {}) {
  const definition = FEATURE_SYNC_DEFINITIONS[containerId];
  if (!definition || !backendState.client || !backendState.session) return Promise.resolve();
  const current = featureSyncState.get(definition.key);
  if (current?.status === "loading") return current.promise;
  if (current?.status === "ready" && !options.force) return Promise.resolve();

  updateFeatureSyncUi(containerId, "loading");
  const promise = loadFeatureSyncGroup(definition.key)
    .then(() => {
      featureSyncState.set(definition.key, { status: "ready", promise: null });
      updateFeatureSyncUi(containerId, "ready");
    })
    .catch((error) => {
      console.error(`${definition.label} sync error:`, error);
      featureSyncState.set(definition.key, { status: "error", promise: null });
      updateFeatureSyncUi(containerId, "error");
    });
  featureSyncState.set(definition.key, { status: "loading", promise });
  return promise;
}

function installFeatureSyncButtons() {
  Object.keys(FEATURE_SYNC_DEFINITIONS).forEach((containerId) => {
    const container = document.getElementById(containerId);
    const titleBar = container?.querySelector(":scope > .titleBar");
    if (!titleBar || titleBar.querySelector("[data-feature-sync]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "feature-sync-btn";
    button.dataset.featureSync = containerId;
    button.textContent = "sync";
    button.disabled = !backendState.session;
    button.title = backendState.session ? "Sync this feature now" : "Sign in to sync";
    button.addEventListener("click", function () {
      void syncFeatureForContainer(containerId, { force: true });
    });
    const closeButton = Array.from(titleBar.children).find((child) => child.tagName === "BUTTON");
    titleBar.insertBefore(button, closeButton || null);
  });
}

function syncVisibleFeatures() {
  const seen = new Set();
  const pending = [];
  Object.entries(FEATURE_SYNC_DEFINITIONS).forEach(([containerId, definition]) => {
    if (seen.has(definition.key)) return;
    const container = document.getElementById(containerId);
    if (!container || window.getComputedStyle(container).display === "none") return;
    seen.add(definition.key);
    pending.push(syncFeatureForContainer(containerId));
  });
  return Promise.all(pending);
}

async function refreshBackendModules() {
  if (!backendState.client || !backendState.session) {
    setBackendAuthStatus("Backend: sign in before reload");
    return;
  }

  setBackendAuthStatus("Backend: loading modules...");
  await loadIntegrationsBackendState();
  await syncConfiguredIntegrationsState();
  await loadIntegrationsBackendState();
  await Promise.all(BACKEND_SYNC_ALL_CONTAINER_IDS.map((containerId) =>
    syncFeatureForContainer(containerId, { force: true })
  ));
  renderConnectionsStatus();
}

async function loadBackendSession(session) {
  backendState.session = session;
  resetFeatureSyncState();
  updateBackendAuthUi();

  if (!session) {
    financeRemoteState.loaded = false;
    taskRemoteState.loaded = false;
    kanbanRemoteState.loaded = false;
    trackerRemoteState.loaded = false;
    calendarRemoteState.loaded = false;
    workoutRemoteState.loaded = false;
    if (typeof resetWorkoutV2BackendState === "function") resetWorkoutV2BackendState();
    listRemoteState.loaded = false;
    integrationRemoteState.loaded = false;
    setBackendAuthStatus("Backend: Supabase ready; sign in to sync modules");
    renderFinanceList();
    renderTaskList();
    renderDailies();
    renderKanbanBoard();
    generateCalendar();
    renderWorkout();
    renderSimpleLists();
    renderConnectionsStatus();
    return;
  }

  setBackendAuthStatus(`Backend: signed in as ${session.user.email || "user"}; features sync when opened`);
  try {
    await ensureSupabaseProfile();
    await syncBackendProfileSettings();
    await syncVisibleFeatures();
  } catch (error) {
    console.error("Backend profile/settings error:", error);
    setBackendAuthStatus(`Backend: signed in; profile settings failed (${describeBackendError(error)})`);
  }
}

let backendSessionLoadKey = "";
let backendSessionLoadPromise = null;

function handleBackendSession(session) {
  const sessionKey = session
    ? session.user?.id || "signed-in"
    : "signed-out";
  if (sessionKey === backendSessionLoadKey) {
    return backendSessionLoadPromise || Promise.resolve();
  }

  backendSessionLoadKey = sessionKey;
  backendSessionLoadPromise = loadBackendSession(session).finally(() => {
    backendSessionLoadPromise = null;
  });
  return backendSessionLoadPromise;
}

function getBackendAuthCredentials() {
  const emailInput = document.getElementById("backendAuthEmailInput");
  const passwordInput = document.getElementById("backendAuthPasswordInput");
  const fallbackEmail = backendState.session?.user?.email || "";
  const email = emailInput && emailInput.value.trim()
    ? emailInput.value.trim()
    : fallbackEmail;
  const password = passwordInput ? passwordInput.value : "";
  if (!email && backendState.authMode !== "recovery") {
    setBackendAuthStatus("Backend: enter email first");
    return null;
  }
  if (!password) {
    setBackendAuthStatus("Backend: enter password first");
    return null;
  }
  if (password.length < 6) {
    setBackendAuthStatus("Backend: password needs at least 6 characters");
    return null;
  }
  return { email, password };
}

function setBackendAuthPending(isPending) {
  ["backendAuthSendBtn", "backendAuthCreateBtn", "backendAuthResetBtn"].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = isPending;
  });
}

async function signInBackendWithPassword() {
  if (!backendState.client) return;
  const credentials = getBackendAuthCredentials();
  if (!credentials) return;

  setBackendAuthPending(true);
  setBackendAuthStatus("Backend: signing in...");
  const { error } = await backendState.client.auth.signInWithPassword(credentials);
  setBackendAuthPending(false);
  if (error) {
    console.error("Supabase password login error:", error);
    setBackendAuthStatus(`Backend: ${describeBackendError(error)}`);
    return;
  }
  setBackendAuthStatus("Backend: signed in");
}

async function createBackendPasswordAccount() {
  if (!backendState.client) return;
  const credentials = getBackendAuthCredentials();
  if (!credentials) return;

  setBackendAuthPending(true);
  setBackendAuthStatus("Backend: creating account...");
  const { data, error } = await backendState.client.auth.signUp(credentials);
  setBackendAuthPending(false);
  if (error) {
    console.error("Supabase password signup error:", error);
    setBackendAuthStatus(`Backend: ${describeBackendError(error)}`);
    return;
  }
  if (data?.session) {
    setBackendAuthStatus("Backend: account created");
    return;
  }
  setBackendAuthStatus("Backend: account created; confirm email, or use reset if this email already existed");
}

async function requestBackendPasswordReset() {
  if (!backendState.client) return;
  const credentials = getBackendAuthCredentials();
  if (!credentials) return;

  setBackendAuthPending(true);
  setBackendAuthStatus("Backend: sending reset email...");
  const redirectTo = window.location.href.split("#")[0];
  const { error } = await backendState.client.auth.resetPasswordForEmail(credentials.email, {
    redirectTo,
  });
  setBackendAuthPending(false);
  if (error) {
    console.error("Supabase password reset error:", error);
    setBackendAuthStatus(`Backend: ${describeBackendError(error)}`);
    return;
  }
  setBackendAuthStatus("Backend: reset email sent; open it from this local app URL");
}

async function finishBackendPasswordRecovery() {
  if (!backendState.client) return;
  const credentials = getBackendAuthCredentials();
  if (!credentials) return;

  setBackendAuthPending(true);
  setBackendAuthStatus("Backend: saving new password...");
  const { error } = await backendState.client.auth.updateUser({
    password: credentials.password,
  });
  setBackendAuthPending(false);
  if (error) {
    console.error("Supabase password recovery update error:", error);
    setBackendAuthStatus(`Backend: ${describeBackendError(error)}`);
    return;
  }
  backendState.authMode = "normal";
  updateBackendAuthUi();
  setBackendAuthStatus("Backend: password updated; use login now");
}

async function signOutBackend() {
  if (!backendState.client) return;
  await backendState.client.auth.signOut();
}

async function refreshBackendFromServer() {
  if (!backendState.client || !backendState.session) {
    setBackendAuthStatus("Backend: sign in before reload");
    return;
  }

  try {
    await refreshBackendModules();
    setBackendSyncedStatus("Backend: reloaded");
  } catch (error) {
    console.error("Backend reload error:", error);
    financeRemoteState.loaded = false;
    taskRemoteState.loaded = false;
    kanbanRemoteState.loaded = false;
    trackerRemoteState.loaded = false;
    calendarRemoteState.loaded = false;
    workoutRemoteState.loaded = false;
    if (typeof resetWorkoutV2BackendState === "function") resetWorkoutV2BackendState();
    listRemoteState.loaded = false;
    setBackendAuthStatus(`Backend: reload failed (${describeBackendError(error)})`);
    renderFinanceList();
    renderTaskList();
    renderDailies();
    renderKanbanBoard();
    generateCalendar();
    renderWorkout();
    renderSimpleLists();
  }
}

function initializeBackendAuth() {
  const { url, anonKey } = getSupabaseConfig();
  const library = window.supabase;
  if (!url || !anonKey || !library?.createClient) {
    setBackendAuthStatus("Backend: local mode (set Supabase config)");
    updateBackendAuthUi();
    renderFinanceList();
    return;
  }

  backendState.client = library.createClient(url, anonKey);
  updateBackendAuthUi();

  const sendBtn = document.getElementById("backendAuthSendBtn");
  const createBtn = document.getElementById("backendAuthCreateBtn");
  const resetBtn = document.getElementById("backendAuthResetBtn");
  const refreshBtn = document.getElementById("backendReloadBtn");
  const signOutBtn = document.getElementById("backendAuthSignOutBtn");
  const emailInput = document.getElementById("backendAuthEmailInput");
  const passwordInput = document.getElementById("backendAuthPasswordInput");
  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      if (backendState.authMode === "recovery") {
        void finishBackendPasswordRecovery();
        return;
      }
      void signInBackendWithPassword();
    });
  }
  if (createBtn) {
    createBtn.addEventListener("click", function () {
      void createBackendPasswordAccount();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      void requestBackendPasswordReset();
    });
  }
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      backendState.authMode = "normal";
      updateBackendAuthUi();
      void signOutBackend();
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      void refreshBackendFromServer();
    });
  }
  if (emailInput) {
    emailInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      if (backendState.authMode === "recovery") {
        void finishBackendPasswordRecovery();
        return;
      }
      void signInBackendWithPassword();
    });
  }
  if (passwordInput) {
    passwordInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      if (backendState.authMode === "recovery") {
        void finishBackendPasswordRecovery();
        return;
      }
      void signInBackendWithPassword();
    });
  }

  backendState.client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      const emailInput = document.getElementById("backendAuthEmailInput");
      if (emailInput && session?.user?.email) emailInput.value = session.user.email;
      backendState.authMode = "recovery";
      updateBackendAuthUi();
      setBackendAuthStatus("Backend: recovery link verified; enter a new password and click save password");
    } else if (event === "SIGNED_OUT") {
      backendState.authMode = "normal";
      updateBackendAuthUi();
    } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      if (backendState.authMode !== "recovery") {
        backendState.authMode = "normal";
      }
      updateBackendAuthUi();
    }
    void handleBackendSession(session);
  });
  backendState.client.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("Supabase session error:", error);
      setBackendAuthStatus("Backend: session check failed");
      return;
    }
    void handleBackendSession(data?.session || null);
  });
}

document.addEventListener("DOMContentLoaded", initializeBackendAuth);
document.addEventListener("DOMContentLoaded", installFeatureSyncButtons);

document.addEventListener("DOMContentLoaded", function () {
  renderConnectionsStatus();
  const refreshBtn = document.getElementById("connectionsRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      renderConnectionsStatus();
      if (!backendState.client || !backendState.session) return;
      refreshBtn.disabled = true;
      try {
        await syncConfiguredIntegrationsState();
        await loadIntegrationsBackendState();
        renderConnectionsStatus();
      } catch (error) {
        console.error("Connections refresh error:", error);
      } finally {
        refreshBtn.disabled = false;
      }
    });
  }
});

window.startpageBackendDiagnostics = function () {
  return {
    configured: Boolean(backendState.client),
    signedIn: Boolean(backendState.session),
    backendActive: isFinanceBackendActive(),
    taskBackendActive: isTaskBackendActive(),
    kanbanBackendActive: isKanbanBackendActive(),
    trackerBackendActive: isTrackerBackendActive(),
    trackerBackendWritable: isTrackerBackendWritable(),
    calendarBackendActive: isCalendarBackendActive(),
    workoutBackendActive: isWorkoutBackendActive(),
    listBackendActive: isListBackendActive(),
    integrationBackendActive: isIntegrationBackendActive(),
    email: backendState.session?.user?.email || "",
    userId: getBackendUserId(),
    displayName: getLocalDisplayName(),
    wallpaper: getLocalWallpaper(),
    entries: getFinanceEntries().length,
    categories: getFinanceBudgetState().categories.length,
    todos: getTasks().length,
    dailies: getDailyTasks().length,
    kanbanCards: KANBAN_COLUMNS.reduce(
      (total, column) => total + getKanbanState()[column.code].length,
      0,
    ),
    trackers: Object.keys(trackerRemoteState.trackerIds).length,
    calendarNotes: Object.keys(getCalendarNotes()).length,
    workoutExercises: loadWorkoutExerciseLibrary().length,
    recommendations: getRecommendations().length,
    featureBacklogItems: getFeatureBacklogItems().length,
    integrations: Object.keys(integrationRemoteState.integrations).length,
    integrationStatuses: Object.fromEntries(
      Object.entries(integrationRemoteState.integrations).map(([provider, integration]) => [
        provider,
        integration.status,
      ]),
    ),
    importState: getBackendImportState()[getBackendUserId()] || null,
  };
};

// FINANCE LOG

const FINANCE_STORAGE_KEY = "financeLog_v1";
const FINANCE_BUDGET_STORAGE_KEY = "financeBudget_v1";
const FINANCE_LEGACY_BUDGET_MONTHS_STORAGE_KEY = "financeBudgetMonths_v1";
const FINANCE_OPENING_BALANCE_STORAGE_KEY = "financeOpeningBalance_v1";
const FINANCE_RECURRING_STORAGE_KEY = "financeRecurring_v1";
const FINANCE_LAST_CATEGORY_STORAGE_KEY = "financeLastCategory_v1";
// The reserved row is the standard/default template; real month rows are snapshots.
const FINANCE_DEFAULT_BUDGET_MONTH_KEY = "0001-01";
const FINANCE_TYPES = new Set(["income", "expense"]);
const FINANCE_UNASSIGNED_CATEGORY_ID = "unassigned";
const FINANCE_CATEGORY_COLORS = [
  "#2f5bd3",
  "#d07a16",
  "#2d9b57",
  "#8f3ac6",
  "#2ba3b6",
  "#9e9531",
  "#7c7c7c",
  "#c74040",
];
const FINANCE_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const FINANCE_IMPORT_SCOPE = "finance_v1";
const financeRemoteState = {
  loaded: false,
  budgetRowId: "",
  defaultBudgetRowId: "",
  budget: null,
  defaultBudget: null,
  hasMonthBudget: false,
  openingBalance: null,
  entries: [],
};
let selectedFinanceSpentCategoryId = "";
let selectedFinanceMonthKey = currentFinanceMonthKey();

function isFinanceBackendActive() {
  return Boolean(backendState.client && backendState.session && financeRemoteState.loaded);
}

function makeFinanceEntryId() {
  return `finance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFinanceEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") return null;

  const date = typeof rawEntry.date === "string" ? rawEntry.date.trim() : "";
  const note = typeof rawEntry.note === "string" ? rawEntry.note.trim() : "";
  const rawType = typeof rawEntry.type === "string" ? rawEntry.type : "";
  const migratedType = rawType === "invoice" ? "expense" : rawType;
  const type = FINANCE_TYPES.has(migratedType) ? migratedType : "";
  const amountNumber = Number(rawEntry.amount);
  const amount = Number.isFinite(amountNumber) && amountNumber >= 0 ? amountNumber : NaN;
  if (!date || !note || !type || Number.isNaN(amount)) return null;

  return {
    id:
      typeof rawEntry.id === "string" && rawEntry.id.trim()
        ? rawEntry.id
        : makeFinanceEntryId(),
    date,
    type,
    categoryId:
      type === "expense" &&
      typeof rawEntry.categoryId === "string" &&
      rawEntry.categoryId.trim()
        ? rawEntry.categoryId.trim()
        : type === "expense"
          ? FINANCE_UNASSIGNED_CATEGORY_ID
          : "",
    amount,
    note,
    createdAt:
      typeof rawEntry.createdAt === "string" && rawEntry.createdAt
        ? rawEntry.createdAt
        : new Date().toISOString(),
  };
}

function currentFinanceMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentFinanceDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getSelectedFinanceMonthKey() {
  return safeFinanceMonthKey(selectedFinanceMonthKey);
}

function financeMonthStartDate(monthKey) {
  return `${safeFinanceMonthKey(monthKey)}-01`;
}

function financeMonthEndDay(monthKey) {
  const [year, month] = safeFinanceMonthKey(monthKey).split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function financeDateForMonthDay(monthKey, dayOfMonth) {
  const safeMonth = safeFinanceMonthKey(monthKey);
  const day = Math.min(Math.max(1, Number(dayOfMonth) || 1), financeMonthEndDay(safeMonth));
  return `${safeMonth}-${String(day).padStart(2, "0")}`;
}

function defaultFinanceDateForMonth(monthKey) {
  const safeMonth = safeFinanceMonthKey(monthKey);
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(safeMonth) ? today : financeMonthStartDate(safeMonth);
}

function isFinanceEntryInMonth(entry, monthKey = getSelectedFinanceMonthKey()) {
  return Boolean(entry && typeof entry.date === "string" && entry.date.startsWith(safeFinanceMonthKey(monthKey)));
}

function getFinanceEntriesForMonth(entries, monthKey = getSelectedFinanceMonthKey()) {
  return entries.filter((entry) => isFinanceEntryInMonth(entry, monthKey));
}

function defaultFinanceBudgetState() {
  return {
    monthKey: FINANCE_DEFAULT_BUDGET_MONTH_KEY,
    monthlyBudget: 0,
    categories: [],
  };
}

function cloneFinanceBudgetState(state, monthKey = state?.monthKey || FINANCE_DEFAULT_BUDGET_MONTH_KEY) {
  const normalized = normalizeFinanceBudgetState(state, monthKey);
  return {
    monthKey: normalized.monthKey,
    monthlyBudget: normalized.monthlyBudget,
    categories: normalized.categories.map((category) => ({ ...category })),
  };
}

function normalizeFinanceOpeningBalanceState(raw) {
  if (!raw || typeof raw !== "object") return null;
  const amount = Number(raw.amount);
  const effectiveOn =
    typeof raw.effectiveOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.effectiveOn.trim())
      ? raw.effectiveOn.trim()
      : "";
  if (!Number.isFinite(amount) || !effectiveOn) return null;
  return { amount, effectiveOn };
}

function normalizeFinanceCategory(rawCategory, index) {
  if (!rawCategory || typeof rawCategory !== "object") return null;
  const id = typeof rawCategory.id === "string" ? rawCategory.id.trim() : "";
  const name = typeof rawCategory.name === "string" ? rawCategory.name.trim() : "";
  const alloc = Number(rawCategory.allocatedAmount);
  if (!id || !name || !Number.isFinite(alloc) || alloc < 0) return null;
  const colorIndexRaw = Number(rawCategory.colorIndex);
  const colorIndex = Number.isInteger(colorIndexRaw) && colorIndexRaw >= 0 ? colorIndexRaw : index;
  return {
    id,
    name,
    allocatedAmount: alloc,
    colorIndex,
  };
}

function normalizeFinanceBudgetState(parsed, fallbackMonthKey = FINANCE_DEFAULT_BUDGET_MONTH_KEY) {
  const fallback = {
    ...defaultFinanceBudgetState(),
    monthKey: fallbackMonthKey === FINANCE_DEFAULT_BUDGET_MONTH_KEY
      ? FINANCE_DEFAULT_BUDGET_MONTH_KEY
      : safeFinanceMonthKey(fallbackMonthKey),
  };
  if (!parsed || typeof parsed !== "object") return fallback;

  const monthlyBudgetRaw = Number(parsed.monthlyBudget);
  const monthlyBudget = Number.isFinite(monthlyBudgetRaw) && monthlyBudgetRaw >= 0 ? monthlyBudgetRaw : 0;
  const categoriesRaw = Array.isArray(parsed.categories) ? parsed.categories : [];
  const categories = categoriesRaw.map(normalizeFinanceCategory).filter(Boolean);
  const rawMonthKey = typeof parsed.monthKey === "string" ? parsed.monthKey : fallback.monthKey;
  const monthKey = rawMonthKey === FINANCE_DEFAULT_BUDGET_MONTH_KEY
    ? FINANCE_DEFAULT_BUDGET_MONTH_KEY
    : safeFinanceMonthKey(rawMonthKey);
  return {
    monthKey,
    monthlyBudget,
    categories,
  };
}

function hasFinanceBudgetData(state) {
  return Boolean(
    state &&
      (Number(state.monthlyBudget) > 0 ||
        (Array.isArray(state.categories) && state.categories.length > 0)),
  );
}

function getLegacyLocalFinanceBudgetStates() {
  let months = {};
  try {
    months = JSON.parse(localStorage.getItem(FINANCE_LEGACY_BUDGET_MONTHS_STORAGE_KEY)) || {};
  } catch (_error) {
    months = {};
  }
  return Object.values(months).map(normalizeFinanceBudgetState).filter(hasFinanceBudgetData);
}

function getLocalFinanceBudgetMonths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FINANCE_LEGACY_BUDGET_MONTHS_STORAGE_KEY)) || {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function setLocalFinanceBudgetMonths(months) {
  localStorage.setItem(FINANCE_LEGACY_BUDGET_MONTHS_STORAGE_KEY, JSON.stringify(months || {}));
}

function getLocalFinanceDefaultBudgetState() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(FINANCE_BUDGET_STORAGE_KEY));
  } catch (_error) {
    parsed = null;
  }
  const normalized = normalizeFinanceBudgetState(parsed, FINANCE_DEFAULT_BUDGET_MONTH_KEY);
  const recovered = hasFinanceBudgetData(normalized)
    ? normalized
    : getLegacyLocalFinanceBudgetStates().find((state) => state.monthKey === FINANCE_DEFAULT_BUDGET_MONTH_KEY) ||
      getLegacyLocalFinanceBudgetStates()[0] ||
      normalized;
  recovered.monthKey = FINANCE_DEFAULT_BUDGET_MONTH_KEY;
  localStorage.setItem(FINANCE_BUDGET_STORAGE_KEY, JSON.stringify(recovered));
  return recovered;
}

function getLocalFinanceBudgetState(monthKey = getSelectedFinanceMonthKey()) {
  const safeMonth = monthKey === FINANCE_DEFAULT_BUDGET_MONTH_KEY
    ? FINANCE_DEFAULT_BUDGET_MONTH_KEY
    : safeFinanceMonthKey(monthKey);
  if (safeMonth === FINANCE_DEFAULT_BUDGET_MONTH_KEY) return getLocalFinanceDefaultBudgetState();

  const months = getLocalFinanceBudgetMonths();
  const snapshot = normalizeFinanceBudgetState(months[safeMonth], safeMonth);
  return hasFinanceBudgetData(snapshot) ? snapshot : cloneFinanceBudgetState(getLocalFinanceDefaultBudgetState(), safeMonth);
}

function hasLocalFinanceMonthBudget(monthKey = getSelectedFinanceMonthKey()) {
  const safeMonth = safeFinanceMonthKey(monthKey);
  return Boolean(getLocalFinanceBudgetMonths()[safeMonth]);
}

function setLocalFinanceBudgetState(state) {
  const normalized = normalizeFinanceBudgetState(state, state?.monthKey || getSelectedFinanceMonthKey());
  if (normalized.monthKey === FINANCE_DEFAULT_BUDGET_MONTH_KEY) {
    localStorage.setItem(FINANCE_BUDGET_STORAGE_KEY, JSON.stringify(normalized));
    return;
  }
  const months = getLocalFinanceBudgetMonths();
  months[normalized.monthKey] = normalized;
  setLocalFinanceBudgetMonths(months);
}

function removeLocalFinanceMonthBudget(monthKey = getSelectedFinanceMonthKey()) {
  const safeMonth = safeFinanceMonthKey(monthKey);
  const months = getLocalFinanceBudgetMonths();
  delete months[safeMonth];
  setLocalFinanceBudgetMonths(months);
}

function removeLocalFinanceCategory(categoryId) {
  const defaultBudget = getLocalFinanceDefaultBudgetState();
  defaultBudget.categories = defaultBudget.categories.filter((category) => category.id !== categoryId);
  setLocalFinanceDefaultBudgetState(defaultBudget);

  const months = getLocalFinanceBudgetMonths();
  Object.keys(months).forEach((monthKey) => {
    const monthBudget = normalizeFinanceBudgetState(months[monthKey], monthKey);
    monthBudget.categories = monthBudget.categories.filter((category) => category.id !== categoryId);
    months[monthKey] = monthBudget;
  });
  setLocalFinanceBudgetMonths(months);
}

function updateLocalFinanceCategoryName(categoryId, name) {
  const defaultBudget = getLocalFinanceDefaultBudgetState();
  defaultBudget.categories = defaultBudget.categories.map((category) =>
    category.id === categoryId ? { ...category, name } : category,
  );
  setLocalFinanceDefaultBudgetState(defaultBudget);

  const months = getLocalFinanceBudgetMonths();
  Object.keys(months).forEach((monthKey) => {
    const monthBudget = normalizeFinanceBudgetState(months[monthKey], monthKey);
    monthBudget.categories = monthBudget.categories.map((category) =>
      category.id === categoryId ? { ...category, name } : category,
    );
    months[monthKey] = monthBudget;
  });
  setLocalFinanceBudgetMonths(months);
}

function setLocalFinanceDefaultBudgetState(state) {
  const normalized = normalizeFinanceBudgetState({
    ...state,
    monthKey: FINANCE_DEFAULT_BUDGET_MONTH_KEY,
  }, FINANCE_DEFAULT_BUDGET_MONTH_KEY);
  localStorage.setItem(FINANCE_BUDGET_STORAGE_KEY, JSON.stringify(normalized));
}

function getFinanceBudgetState(monthKey = getSelectedFinanceMonthKey()) {
  if (isFinanceBackendActive() && financeRemoteState.budget) {
    return financeRemoteState.budget;
  }
  return getLocalFinanceBudgetState(monthKey);
}

function getFinanceDefaultBudgetState() {
  if (isFinanceBackendActive() && financeRemoteState.defaultBudget) {
    return financeRemoteState.defaultBudget;
  }
  return getLocalFinanceDefaultBudgetState();
}

function hasFinanceMonthBudget(monthKey = getSelectedFinanceMonthKey()) {
  if (isFinanceBackendActive()) return financeRemoteState.hasMonthBudget;
  return hasLocalFinanceMonthBudget(monthKey);
}

function getLocalFinanceOpeningBalanceState() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(FINANCE_OPENING_BALANCE_STORAGE_KEY));
  } catch (_error) {
    parsed = null;
  }
  const normalized = normalizeFinanceOpeningBalanceState(parsed);
  if (normalized) {
    localStorage.setItem(FINANCE_OPENING_BALANCE_STORAGE_KEY, JSON.stringify(normalized));
  } else {
    localStorage.removeItem(FINANCE_OPENING_BALANCE_STORAGE_KEY);
  }
  return normalized;
}

function setLocalFinanceOpeningBalanceState(state) {
  const normalized = normalizeFinanceOpeningBalanceState(state);
  if (normalized) {
    localStorage.setItem(FINANCE_OPENING_BALANCE_STORAGE_KEY, JSON.stringify(normalized));
  } else {
    localStorage.removeItem(FINANCE_OPENING_BALANCE_STORAGE_KEY);
  }
}

function getFinanceOpeningBalanceState() {
  if (isFinanceBackendActive()) {
    return financeRemoteState.openingBalance;
  }
  return getLocalFinanceOpeningBalanceState();
}

function setFinanceOpeningBalanceState(state) {
  const normalized = normalizeFinanceOpeningBalanceState(state);
  if (isFinanceBackendActive()) {
    financeRemoteState.openingBalance = normalized;
    return;
  }
  setLocalFinanceOpeningBalanceState(normalized);
}

function setFinanceBudgetState(state) {
  if (isFinanceBackendActive()) {
    financeRemoteState.budget = state;
    return;
  }
  setLocalFinanceBudgetState(state);
}

function getAllFinanceCategories() {
  const budget = getFinanceBudgetState();
  return [
    {
      id: FINANCE_UNASSIGNED_CATEGORY_ID,
      name: "Unassigned",
      allocatedAmount: 0,
      colorIndex: FINANCE_CATEGORY_COLORS.length - 1,
    },
    ...budget.categories,
  ];
}

function getLocalFinanceEntries() {
  let parsed = [];
  try {
    parsed = JSON.parse(localStorage.getItem(FINANCE_STORAGE_KEY)) || [];
  } catch (_error) {
    parsed = [];
  }

  const categories = getAllFinanceCategories();
  const allowedCategoryIds = new Set(categories.map((cat) => cat.id));
  const entries = Array.isArray(parsed)
    ? parsed.map(normalizeFinanceEntry).filter(Boolean)
    : [];
  entries.forEach((entry) => {
    if (entry.type === "expense" && !allowedCategoryIds.has(entry.categoryId)) {
      entry.categoryId = FINANCE_UNASSIGNED_CATEGORY_ID;
    }
  });

  const needsTypeMigration =
    Array.isArray(parsed) && parsed.some((entry) => entry && entry.type === "invoice");
  const needsCategoryMigration =
    Array.isArray(parsed) &&
    parsed.some(
      (entry) =>
        entry &&
        entry.type === "expense" &&
        (!entry.categoryId || !allowedCategoryIds.has(String(entry.categoryId))),
    );
  if (
    !Array.isArray(parsed) ||
    parsed.length !== entries.length ||
    needsTypeMigration ||
    needsCategoryMigration
  ) {
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(entries));
  }

  return entries;
}

function setLocalFinanceEntries(entries) {
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(entries));
}

function getFinanceEntries() {
  if (isFinanceBackendActive()) {
    return financeRemoteState.entries;
  }
  return getLocalFinanceEntries();
}

function setFinanceEntries(entries) {
  if (isFinanceBackendActive()) {
    financeRemoteState.entries = entries;
    return;
  }
  setLocalFinanceEntries(entries);
}

function safeFinanceMonthKey(monthKey) {
  return typeof monthKey === "string" && /^\d{4}-\d{2}$/.test(monthKey)
    ? monthKey
    : currentFinanceMonthKey();
}

function syncFinanceMonthUi() {
  const monthInput = document.getElementById("financeMonthInput");
  if (monthInput) monthInput.value = getSelectedFinanceMonthKey();
  const dateInput = document.getElementById("financeDateInput");
  if (dateInput && !dateInput.value.startsWith(getSelectedFinanceMonthKey())) {
    dateInput.value = defaultFinanceDateForMonth(getSelectedFinanceMonthKey());
  }
}

async function setSelectedFinanceMonth(monthKey) {
  selectedFinanceMonthKey = safeFinanceMonthKey(monthKey);
  selectedFinanceSpentCategoryId = "";
  syncFinanceMonthUi();
  if (isFinanceBackendActive()) {
    await refreshFinanceBackendState();
    return;
  }
  await postFinanceRecurringForMonth(getSelectedFinanceMonthKey());
  renderFinanceList();
}

function shiftSelectedFinanceMonth(delta) {
  const [year, month] = getSelectedFinanceMonthKey().split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function mapFinanceCategoryRow(row, allocatedAmount) {
  return {
    id: row.id,
    name: row.name,
    allocatedAmount: Number(allocatedAmount) || 0,
    colorIndex: Number.isInteger(Number(row.color_index)) ? Number(row.color_index) : 0,
  };
}

function mapFinanceEntryRow(row) {
  return normalizeFinanceEntry({
    id: row.id,
    date: row.happened_on,
    type: row.entry_type,
    categoryId: row.category_id || FINANCE_UNASSIGNED_CATEGORY_ID,
    amount: row.amount,
    note: row.note,
    createdAt: row.created_at,
  });
}

function mapFinanceOpeningBalanceRow(row) {
  return normalizeFinanceOpeningBalanceState({
    amount: row.amount,
    effectiveOn: row.effective_on,
  });
}

function financeCategoryIdForDb(categoryId) {
  return categoryId && categoryId !== FINANCE_UNASSIGNED_CATEGORY_ID ? categoryId : null;
}

function financeTimestampForDb(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseFinanceAmountInput(value) {
  const normalized = String(value || "").trim().replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

async function upsertFinanceMonthBudget(monthKey, monthlyBudget) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");
  const data = throwIfSupabaseError(
    await backendState.client
      .from("finance_month_budgets")
      .upsert(
        {
          user_id: userId,
          month_key: safeFinanceMonthKey(monthKey),
          monthly_budget: Number(monthlyBudget) || 0,
        },
        { onConflict: "user_id,month_key" },
      )
      .select("id, month_key, monthly_budget")
      .single(),
  );
  return data;
}

async function upsertFinanceOpeningBalance(state) {
  const userId = getBackendUserId();
  const normalized = normalizeFinanceOpeningBalanceState(state);
  if (!backendState.client || !userId || !normalized) throw new Error("Supabase session missing");
  const result = await backendState.client
    .from("finance_opening_balances")
    .upsert(
      {
        user_id: userId,
        amount: normalized.amount,
        effective_on: normalized.effectiveOn,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, amount, effective_on, created_at, updated_at")
    .single();
  // Supabase JS v2 can return { data: null, error: null } when an upsert
  // resolves to an UPDATE under certain RLS paths. Re-query to guarantee
  // the caller receives the actually-persisted row so cross-device state
  // stays consistent.
  if (result.error) throw result.error;
  if (!result.data) {
    const reQuery = throwIfSupabaseError(
      await backendState.client
        .from("finance_opening_balances")
        .select("user_id, amount, effective_on, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    );
    return reQuery;
  }
  return result.data;
}

function pickFinanceBudgetRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows.find((row) => row.month_key === FINANCE_DEFAULT_BUDGET_MONTH_KEY) || rows[0];
}

function buildFinanceBudgetStateFromRows(budgetRow, categoryRows, allocationRows, monthKey) {
  const allocationMap = new Map(
    (allocationRows || []).map((allocation) => [
      allocation.category_id,
      Number(allocation.allocated_amount) || 0,
    ]),
  );
  return {
    monthKey,
    monthlyBudget: Number(budgetRow?.monthly_budget) || 0,
    categories: (categoryRows || []).map((row) =>
      mapFinanceCategoryRow(row, allocationMap.get(row.id) || 0),
    ),
  };
}

async function upsertFinanceAllocation(monthBudgetId, categoryId, allocatedAmount) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !monthBudgetId || !categoryId) return;
  throwIfSupabaseError(
    await backendState.client.from("finance_budget_allocations").upsert(
      {
        user_id: userId,
        month_budget_id: monthBudgetId,
        category_id: categoryId,
        allocated_amount: Number(allocatedAmount) || 0,
      },
      { onConflict: "user_id,month_budget_id,category_id" },
    ),
  );
}

async function persistFinanceBudgetAllocations(monthBudgetId, categories) {
  if (!monthBudgetId || !Array.isArray(categories)) return;
  for (const category of categories) {
    if (!category || !category.id || category.id === FINANCE_UNASSIGNED_CATEGORY_ID) continue;
    await upsertFinanceAllocation(monthBudgetId, category.id, category.allocatedAmount);
  }
}

async function persistFinanceBudgetStateToBackend(budgetState) {
  const normalized = normalizeFinanceBudgetState(budgetState, budgetState?.monthKey || getSelectedFinanceMonthKey());
  const row = await upsertFinanceMonthBudget(normalized.monthKey, normalized.monthlyBudget);
  await persistFinanceBudgetAllocations(row.id, normalized.categories);
  return row;
}

async function loadFinanceBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    financeRemoteState.loaded = false;
    return;
  }

  const budgetRows = throwIfSupabaseError(
    await backendState.client
      .from("finance_month_budgets")
      .select("id, month_key, monthly_budget, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  );
  const selectedMonthKey = getSelectedFinanceMonthKey();
  const defaultBudgetRow = (budgetRows || []).find((row) => row.month_key === FINANCE_DEFAULT_BUDGET_MONTH_KEY) || null;
  const monthBudgetRow = (budgetRows || []).find((row) => row.month_key === selectedMonthKey) || null;
  const budgetRow = monthBudgetRow || defaultBudgetRow || pickFinanceBudgetRow(budgetRows);

  const openingBalanceRow = throwIfSupabaseError(
    await backendState.client
      .from("finance_opening_balances")
      .select("user_id, amount, effective_on, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  );

  const categoryRows = throwIfSupabaseError(
    await backendState.client
      .from("finance_categories")
      .select("id, name, color_index")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
  );

  let allocationRows = [];
  if (budgetRow) {
    allocationRows = throwIfSupabaseError(
      await backendState.client
        .from("finance_budget_allocations")
        .select("category_id, allocated_amount")
        .eq("user_id", userId)
        .eq("month_budget_id", budgetRow.id),
    );
  }

  let defaultAllocationRows = [];
  if (defaultBudgetRow) {
    defaultAllocationRows = throwIfSupabaseError(
      await backendState.client
        .from("finance_budget_allocations")
        .select("category_id, allocated_amount")
        .eq("user_id", userId)
        .eq("month_budget_id", defaultBudgetRow.id),
    );
  }

  const entryRows = throwIfSupabaseError(
    await backendState.client
      .from("finance_entries")
      .select("id, happened_on, entry_type, category_id, amount, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );

  financeRemoteState.budgetRowId = budgetRow?.id || "";
  financeRemoteState.defaultBudgetRowId = defaultBudgetRow?.id || "";
  financeRemoteState.hasMonthBudget = Boolean(monthBudgetRow);
  financeRemoteState.budget = buildFinanceBudgetStateFromRows(
    budgetRow,
    categoryRows,
    allocationRows,
    monthBudgetRow ? selectedMonthKey : FINANCE_DEFAULT_BUDGET_MONTH_KEY,
  );
  if (!monthBudgetRow && selectedMonthKey !== FINANCE_DEFAULT_BUDGET_MONTH_KEY) {
    financeRemoteState.budget.monthKey = selectedMonthKey;
  }
  financeRemoteState.defaultBudget = buildFinanceBudgetStateFromRows(
    defaultBudgetRow,
    categoryRows,
    defaultAllocationRows,
    FINANCE_DEFAULT_BUDGET_MONTH_KEY,
  );
  financeRemoteState.openingBalance = openingBalanceRow
    ? mapFinanceOpeningBalanceRow(openingBalanceRow)
    : null;
  financeRemoteState.entries = (entryRows || []).map(mapFinanceEntryRow).filter(Boolean);
  financeRemoteState.loaded = true;
}

async function refreshFinanceBackendState() {
  await loadFinanceBackendState();
  const generated = await postFinanceRecurringForMonth(getSelectedFinanceMonthKey());
  if (generated > 0 && isFinanceBackendActive()) {
    await loadFinanceBackendState();
  }
  renderFinanceList();
}

async function importFinanceLocalDataOnce() {
  if (hasBackendImportCompleted(FINANCE_IMPORT_SCOPE)) return;
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  const localBudget = getLocalFinanceDefaultBudgetState();
  const localMonthBudgets = Object.entries(getLocalFinanceBudgetMonths())
    .map(([monthKey, state]) => normalizeFinanceBudgetState(state, monthKey))
    .filter((state) => state.monthKey !== FINANCE_DEFAULT_BUDGET_MONTH_KEY && hasFinanceBudgetData(state));
  const localOpeningBalance = getLocalFinanceOpeningBalanceState();
  const localEntries = getLocalFinanceEntries();
  const hasBudgetData =
    localBudget.monthlyBudget > 0 ||
    (Array.isArray(localBudget.categories) && localBudget.categories.length > 0) ||
    localMonthBudgets.length > 0;
  const hasOpeningBalanceData = Boolean(localOpeningBalance);
  const hasEntryData = localEntries.length > 0;

  if (!hasBudgetData && !hasOpeningBalanceData && !hasEntryData) {
    markBackendImportCompleted(FINANCE_IMPORT_SCOPE);
    return;
  }

  setBackendAuthStatus("Backend: importing local Finance...");
  let budgetRow = null;
  if (hasBudgetData) {
    budgetRow = await upsertFinanceMonthBudget(localBudget.monthKey, localBudget.monthlyBudget);
  }
  if (hasOpeningBalanceData) {
    await upsertFinanceOpeningBalance(localOpeningBalance);
  }

  const categoryMap = new Map([[FINANCE_UNASSIGNED_CATEGORY_ID, null]]);
  const allLocalCategories = new Map();
  [localBudget, ...localMonthBudgets].forEach((budgetState) => {
    budgetState.categories.forEach((category) => {
      if (!allLocalCategories.has(category.id)) allLocalCategories.set(category.id, category);
    });
  });
  for (const category of allLocalCategories.values()) {
    const row = throwIfSupabaseError(
      await backendState.client
        .from("finance_categories")
        .upsert(
          {
            user_id: userId,
            legacy_id: category.id,
            name: category.name,
            color_index: category.colorIndex,
            archived_at: null,
          },
          { onConflict: "user_id,legacy_id" },
        )
        .select("id")
        .single(),
    );
    categoryMap.set(category.id, row.id);
    if (budgetRow) {
      const defaultCategory = localBudget.categories.find((item) => item.id === category.id);
      await upsertFinanceAllocation(budgetRow.id, row.id, defaultCategory?.allocatedAmount || 0);
    }
  }

  for (const monthBudget of localMonthBudgets) {
    const monthBudgetRow = await upsertFinanceMonthBudget(monthBudget.monthKey, monthBudget.monthlyBudget);
    for (const category of monthBudget.categories) {
      const categoryId = categoryMap.get(category.id);
      if (categoryId) await upsertFinanceAllocation(monthBudgetRow.id, categoryId, category.allocatedAmount);
    }
  }

  for (const entry of localEntries) {
    throwIfSupabaseError(
      await backendState.client.from("finance_entries").upsert(
        {
          user_id: userId,
          legacy_id: entry.id,
          happened_on: entry.date,
          entry_type: entry.type,
          category_id:
            entry.type === "expense" ? categoryMap.get(entry.categoryId) || null : null,
          amount: entry.amount,
          note: entry.note,
          created_at: financeTimestampForDb(entry.createdAt),
        },
        { onConflict: "user_id,legacy_id" },
      ),
    );
  }

  markBackendImportCompleted(FINANCE_IMPORT_SCOPE);
}

function makeFinanceRecurringId() {
  return `frec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFinanceRecurringDefinition(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = FINANCE_TYPES.has(raw.type) ? raw.type : "";
  const amount = Number(raw.amount);
  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  const dayOfMonth = Math.min(31, Math.max(1, Number(raw.dayOfMonth) || 1));
  const startMonth = safeFinanceMonthKey(raw.startMonth || getSelectedFinanceMonthKey());
  const endMonth =
    typeof raw.endMonth === "string" && /^\d{4}-\d{2}$/.test(raw.endMonth)
      ? raw.endMonth
      : "";
  if (!type || !Number.isFinite(amount) || amount < 0 || !note) return null;
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : makeFinanceRecurringId(),
    type,
    amount,
    note,
    categoryId:
      type === "expense" && typeof raw.categoryId === "string" && raw.categoryId.trim()
        ? raw.categoryId.trim()
        : type === "expense"
          ? FINANCE_UNASSIGNED_CATEGORY_ID
          : "",
    dayOfMonth,
    startMonth,
    endMonth,
    active: raw.active !== false,
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
  };
}

function normalizeFinanceRecurringState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const definitions = Array.isArray(source.definitions)
    ? source.definitions.map(normalizeFinanceRecurringDefinition).filter(Boolean)
    : [];
  const generated = source.generated && typeof source.generated === "object" ? source.generated : {};
  return { definitions, generated };
}

function getLocalFinanceRecurringState() {
  try {
    return normalizeFinanceRecurringState(JSON.parse(localStorage.getItem(FINANCE_RECURRING_STORAGE_KEY)));
  } catch (_error) {
    return normalizeFinanceRecurringState(null);
  }
}

function setLocalFinanceRecurringState(state) {
  localStorage.setItem(FINANCE_RECURRING_STORAGE_KEY, JSON.stringify(normalizeFinanceRecurringState(state)));
}

function getFinanceRecurringState() {
  const metadata = getIntegrationMetadata("finance");
  if (backendState.session && integrationRemoteState.loaded && metadata.recurring) {
    return normalizeFinanceRecurringState(metadata.recurring);
  }
  return getLocalFinanceRecurringState();
}

async function saveFinanceRecurringState(state) {
  const normalized = normalizeFinanceRecurringState(state);
  setLocalFinanceRecurringState(normalized);
  if (backendState.client && backendState.session && integrationRemoteState.loaded) {
    const metadata = {
      ...getIntegrationMetadata("finance"),
      recurring: normalized,
    };
    await saveIntegrationMetadata("finance", metadata, "active");
  }
  return normalized;
}

async function loadFinanceRecurringState() {
  const localState = getLocalFinanceRecurringState();
  if (!backendState.client || !backendState.session || !integrationRemoteState.loaded) {
    return localState;
  }

  const metadata = getIntegrationMetadata("finance");
  if (metadata.recurring) {
    const remoteState = normalizeFinanceRecurringState(metadata.recurring);
    setLocalFinanceRecurringState(remoteState);
    return remoteState;
  }

  if (localState.definitions.length > 0 || Object.keys(localState.generated).length > 0) {
    await saveFinanceRecurringState(localState);
  }
  return localState;
}

function financeRecurringGenerationKey(definition, monthKey) {
  return `${definition.id}:${safeFinanceMonthKey(monthKey)}`;
}

function financeRecurringEntryId(definition, monthKey) {
  return `recurring-${definition.id}-${safeFinanceMonthKey(monthKey)}`;
}

function financeRecurringAppliesToMonth(definition, monthKey) {
  const safeMonth = safeFinanceMonthKey(monthKey);
  if (!definition.active) return false;
  if (definition.startMonth && safeMonth < definition.startMonth) return false;
  if (definition.endMonth && safeMonth > definition.endMonth) return false;
  return true;
}

function financeRecurringScheduledDate(definition, monthKey) {
  return financeDateForMonthDay(monthKey, definition.dayOfMonth);
}

function financeRecurringIsPosted(state, definition, monthKey, monthEntries = []) {
  const safeMonth = safeFinanceMonthKey(monthKey);
  const entryId = financeRecurringEntryId(definition, safeMonth);
  const generationKey = financeRecurringGenerationKey(definition, safeMonth);
  return Boolean(state.generated[generationKey]) || monthEntries.some((entry) => entry.id === entryId);
}

function financeRecurringIsDue(definition, monthKey, today = currentFinanceDateKey()) {
  return (
    financeRecurringAppliesToMonth(definition, monthKey) &&
    financeRecurringScheduledDate(definition, monthKey) <= today
  );
}

function buildFinanceRecurringEntry(definition, monthKey) {
  return {
    id: financeRecurringEntryId(definition, monthKey),
    date: financeRecurringScheduledDate(definition, monthKey),
    type: definition.type,
    categoryId: definition.type === "expense" ? definition.categoryId : "",
    amount: definition.amount,
    note: definition.note,
    createdAt: new Date().toISOString(),
  };
}

async function postFinanceRecurringForMonth(monthKey) {
  const state = getFinanceRecurringState();
  const safeMonth = safeFinanceMonthKey(monthKey);
  const today = currentFinanceDateKey();
  let generatedCount = 0;

  for (const definition of state.definitions) {
    if (!financeRecurringIsDue(definition, safeMonth, today)) continue;
    const generationKey = financeRecurringGenerationKey(definition, safeMonth);
    if (state.generated[generationKey]) continue;
    const entry = buildFinanceRecurringEntry(definition, safeMonth);

    if (isFinanceBackendActive()) {
      const row = throwIfSupabaseError(
        await backendState.client
          .from("finance_entries")
          .upsert(
            {
              user_id: getBackendUserId(),
              legacy_id: generationKey,
              happened_on: entry.date,
              entry_type: entry.type,
              category_id: entry.type === "expense" ? financeCategoryIdForDb(entry.categoryId) : null,
              amount: entry.amount,
              note: entry.note,
            },
            { onConflict: "user_id,legacy_id" },
          )
          .select("id, happened_on, entry_type, category_id, amount, note, created_at")
          .single(),
      );
      state.generated[generationKey] = {
        entryId: row.id,
        generatedAt: new Date().toISOString(),
      };
    } else {
      const entries = getFinanceEntries();
      if (!entries.some((item) => item.id === entry.id)) {
        entries.push(entry);
        setFinanceEntries(entries);
      }
      state.generated[generationKey] = {
        entryId: entry.id,
        generatedAt: new Date().toISOString(),
      };
    }
    generatedCount++;
  }

  if (generatedCount > 0) await saveFinanceRecurringState(state);
  return generatedCount;
}

function formatFinanceAmount(value) {
  return FINANCE_CURRENCY_FORMATTER.format(value);
}

function financeAmountTextOrEmpty(value) {
  return Number.isFinite(value) ? formatFinanceAmount(value) : "Set starting balance";
}

function formatFinanceDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("pt-BR");
}

function updateFinanceTotals(entries) {
  const incomeTotal = entries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenseTotal = entries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const netTotal = incomeTotal - expenseTotal;

  const incomeEl = document.getElementById("financeIncomeTotal");
  const expenseEl = document.getElementById("financeExpenseTotal");
  const netEl = document.getElementById("financeNetTotal");
  if (!incomeEl || !expenseEl || !netEl) return;

  incomeEl.textContent = formatFinanceAmount(incomeTotal);
  expenseEl.textContent = formatFinanceAmount(expenseTotal);
  netEl.textContent = formatFinanceAmount(netTotal);
}

function getFinanceMonthNet(entries, monthKey = getSelectedFinanceMonthKey()) {
  const monthEntries = getFinanceEntriesForMonth(entries, monthKey);
  const incomeTotal = monthEntries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenseTotal = monthEntries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal,
  };
}

function getFinanceCurrentBalanceMeta(entries, openingBalance = getFinanceOpeningBalanceState()) {
  const normalized = normalizeFinanceOpeningBalanceState(openingBalance);
  if (!normalized) {
    return {
      openingBalance: null,
      includedEntries: [],
      currentBalance: null,
    };
  }
  const includedEntries = entries.filter((entry) => entry.date >= normalized.effectiveOn);
  const netSinceOpening = includedEntries.reduce((sum, entry) => {
    return sum + (entry.type === "income" ? entry.amount : -entry.amount);
  }, 0);
  return {
    openingBalance: normalized,
    includedEntries,
    currentBalance: normalized.amount + netSinceOpening,
  };
}

function getFinanceProjectedMonthEndBalance(entries, monthKey = getSelectedFinanceMonthKey()) {
  const balanceMeta = getFinanceCurrentBalanceMeta(entries);
  if (!balanceMeta.openingBalance || !Number.isFinite(balanceMeta.currentBalance)) return null;
  const monthNet = getFinanceMonthNet(entries, monthKey).netTotal;
  const projectedNet = getFinanceProjection(entries, monthKey).projectedNet;
  return balanceMeta.currentBalance + (projectedNet - monthNet);
}

function renderFinanceBalancePanel(allEntries) {
  const openingDateInput = document.getElementById("financeOpeningDateInput");
  const openingAmountInput = document.getElementById("financeOpeningAmountInput");
  const currentBalanceEl = document.getElementById("financeCurrentBalance");
  const projectedMonthEndEl = document.getElementById("financeProjectedMonthEndBalance");
  const emptyStateEl = document.getElementById("financeBalanceEmptyState");
  if (
    !openingDateInput ||
    !openingAmountInput ||
    !currentBalanceEl ||
    !projectedMonthEndEl ||
    !emptyStateEl
  ) {
    return;
  }

  const openingBalance = getFinanceOpeningBalanceState();
  const balanceMeta = getFinanceCurrentBalanceMeta(allEntries, openingBalance);
  const projectedMonthEndBalance = getFinanceProjectedMonthEndBalance(
    allEntries,
    getSelectedFinanceMonthKey(),
  );

  if (openingBalance) {
    openingDateInput.value = openingBalance.effectiveOn;
    openingAmountInput.value = String(openingBalance.amount);
  } else {
    if (!openingDateInput.value) openingDateInput.value = defaultFinanceDateForMonth(getSelectedFinanceMonthKey());
    if (openingAmountInput.value === "") openingAmountInput.value = "";
  }

  currentBalanceEl.textContent = financeAmountTextOrEmpty(balanceMeta.currentBalance);
  projectedMonthEndEl.textContent = financeAmountTextOrEmpty(projectedMonthEndBalance);
  emptyStateEl.hidden = Boolean(openingBalance);
}

function getFinanceCategorySpentMap(entries) {
  const spentByCategory = new Map();
  entries.forEach((entry) => {
    if (entry.type !== "expense") return;
    const key = entry.categoryId || FINANCE_UNASSIGNED_CATEGORY_ID;
    const cur = spentByCategory.get(key) || 0;
    spentByCategory.set(key, cur + entry.amount);
  });
  return spentByCategory;
}

function getFinanceBudgetMeta(entries) {
  const budget = getFinanceBudgetState();
  const allocated = budget.categories.reduce((sum, category) => sum + category.allocatedAmount, 0);
  const remaining = Math.max(0, budget.monthlyBudget - allocated);
  const spentByCategory = getFinanceCategorySpentMap(entries);
  return { budget, allocated, remaining, spentByCategory };
}

function describeFinanceCategoryLegend(category, spent, budgetAmount) {
  const pct = budgetAmount > 0 ? (category.allocatedAmount / budgetAmount) * 100 : 0;
  const left = Math.max(0, category.allocatedAmount - spent);
  return `${category.name}: ${formatFinanceAmount(category.allocatedAmount)} (${pct.toFixed(1)}%) spent ${formatFinanceAmount(spent)} left ${formatFinanceAmount(left)}`;
}

function polarToCartesian(cx, cy, radius, angleRad) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function pieSlicePath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function renderFinancePartition(entries) {
  const pie = document.getElementById("financePartitionPie");
  const legend = document.getElementById("financePartitionLegend");
  const allocatedTotalEl = document.getElementById("financeAllocatedTotal");
  const remainingEl = document.getElementById("financeRemainingBudget");
  if (!pie || !legend || !allocatedTotalEl || !remainingEl) return;

  const { budget, allocated, remaining, spentByCategory } = getFinanceBudgetMeta(entries);
  allocatedTotalEl.textContent = formatFinanceAmount(allocated);
  remainingEl.textContent = formatFinanceAmount(remaining);

  pie.innerHTML = "";
  legend.innerHTML = "";

  const cx = 110;
  const cy = 110;
  const radius = 86;
  const total = Math.max(budget.monthlyBudget, 0);
  let cursor = -Math.PI / 2;

  const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bgCircle.setAttribute("cx", String(cx));
  bgCircle.setAttribute("cy", String(cy));
  bgCircle.setAttribute("r", String(radius));
  bgCircle.setAttribute("fill", "#f5f5f5");
  bgCircle.setAttribute("stroke", "#333");
  bgCircle.setAttribute("stroke-width", "1");
  pie.appendChild(bgCircle);

  budget.categories.forEach((category, idx) => {
    if (total <= 0 || category.allocatedAmount <= 0) return;
    const fraction = Math.min(1, category.allocatedAmount / total);
    const delta = fraction * Math.PI * 2;
    if (delta <= 0) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pieSlicePath(cx, cy, radius, cursor, cursor + delta));
    path.setAttribute("fill", FINANCE_CATEGORY_COLORS[category.colorIndex % FINANCE_CATEGORY_COLORS.length]);
    path.setAttribute("stroke", "#1a1a1a");
    path.setAttribute("stroke-width", "1");
    pie.appendChild(path);
    cursor += delta;
    const legendItem = document.createElement("li");
    const chip = document.createElement("span");
    chip.className = "finance-color-chip";
    chip.style.backgroundColor =
      FINANCE_CATEGORY_COLORS[category.colorIndex % FINANCE_CATEGORY_COLORS.length];
    const spent = spentByCategory.get(category.id) || 0;
    const text = document.createElement("span");
    text.textContent = describeFinanceCategoryLegend(category, spent, total);
    legendItem.appendChild(chip);
    legendItem.appendChild(text);
    legend.appendChild(legendItem);
  });

  const unassignedSpent = spentByCategory.get(FINANCE_UNASSIGNED_CATEGORY_ID) || 0;
  const unassignedItem = document.createElement("li");
  const unassignedChip = document.createElement("span");
  unassignedChip.className = "finance-color-chip";
  unassignedChip.style.backgroundColor = "#5d5d5d";
  const unassignedText = document.createElement("span");
  unassignedText.textContent = `Unassigned spent: ${formatFinanceAmount(unassignedSpent)}`;
  unassignedItem.appendChild(unassignedChip);
  unassignedItem.appendChild(unassignedText);
  legend.appendChild(unassignedItem);
}

function makeFinanceCategoryId() {
  return `fcat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function renderFinanceCategoryOptions() {
  const categoryInput = document.getElementById("financeCategoryInput");
  const recurringCategoryInput = document.getElementById("financeRecurringCategoryInput");
  const categories = getAllFinanceCategories();
  const previousCategoryId = localStorage.getItem(FINANCE_LAST_CATEGORY_STORAGE_KEY) || categoryInput?.value || "";
  if (categoryInput) categoryInput.innerHTML = "";
  if (recurringCategoryInput) recurringCategoryInput.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    if (categoryInput) categoryInput.appendChild(option);
    if (recurringCategoryInput) recurringCategoryInput.appendChild(option.cloneNode(true));
  });
  if (categoryInput) {
    const preferredCategory = categories.some((category) => category.id === previousCategoryId)
      ? previousCategoryId
      : categories.find((category) => category.id !== FINANCE_UNASSIGNED_CATEGORY_ID)?.id
        || categories[0]?.id
        || "";
    categoryInput.value = preferredCategory;
  }
  renderFinanceCategoryChips();
}

function populateFinanceCategorySelect(selectEl, selectedCategoryId = FINANCE_UNASSIGNED_CATEGORY_ID) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  getAllFinanceCategories().forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    selectEl.appendChild(option);
  });
  selectEl.value = selectedCategoryId || FINANCE_UNASSIGNED_CATEGORY_ID;
}

function setFinanceEntryStatus(message, tone = "") {
  const status = document.getElementById("financeEntryStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function selectFinanceEntryCategory(categoryId) {
  const categoryInput = document.getElementById("financeCategoryInput");
  if (!categoryInput) return;
  const hasCategory = Array.from(categoryInput.options).some((option) => option.value === categoryId);
  if (!hasCategory) return;
  categoryInput.value = categoryId;
  localStorage.setItem(FINANCE_LAST_CATEGORY_STORAGE_KEY, categoryId);
  renderFinanceCategoryChips();
}

function renderFinanceCategoryChips() {
  const container = document.getElementById("financeCategoryChips");
  const categoryInput = document.getElementById("financeCategoryInput");
  if (!container || !categoryInput) return;
  container.innerHTML = "";
  getAllFinanceCategories().forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "finance-category-chip";
    button.classList.toggle("finance-category-chip--active", category.id === categoryInput.value);
    button.style.setProperty(
      "--finance-category-color",
      FINANCE_CATEGORY_COLORS[category.colorIndex % FINANCE_CATEGORY_COLORS.length],
    );
    button.textContent = category.id === FINANCE_UNASSIGNED_CATEGORY_ID ? "Other" : category.name;
    button.setAttribute("aria-pressed", category.id === categoryInput.value ? "true" : "false");
    button.addEventListener("click", function () {
      selectFinanceEntryCategory(category.id);
    });
    container.appendChild(button);
  });
}

function syncFinanceFormForType() {
  const typeInput = document.getElementById("financeTypeInput");
  const categoryInput = document.getElementById("financeCategoryInput");
  const categoryPicker = document.getElementById("financeCategoryPicker");
  const addButton = document.getElementById("financeAddBtn");
  const noteInput = document.getElementById("financeNoteInput");
  if (!typeInput || !categoryInput) return;
  const isExpense = typeInput.value === "expense";
  categoryInput.disabled = !isExpense;
  if (categoryPicker) categoryPicker.hidden = !isExpense;
  if (addButton && !addButton.disabled) {
    addButton.textContent = isExpense ? "Save expense" : "Save income";
  }
  if (noteInput) {
    noteInput.placeholder = isExpense ? "e.g. groceries" : "e.g. salary";
  }
  document.querySelectorAll("[data-finance-type]").forEach((button) => {
    const active = button.dataset.financeType === typeInput.value;
    button.classList.toggle("finance-type-btn--active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function syncFinanceRecurringFormForType() {
  const typeInput = document.getElementById("financeRecurringTypeInput");
  const categoryInput = document.getElementById("financeRecurringCategoryInput");
  if (!typeInput || !categoryInput) return;
  const isExpense = typeInput.value === "expense";
  categoryInput.disabled = !isExpense;
  categoryInput.style.opacity = isExpense ? "1" : "0.6";
}

function budgetAllocationWithinLimit(budgetState, nextAllocTotal) {
  return nextAllocTotal <= budgetState.monthlyBudget;
}

async function reassignFinanceRecurringCategory(categoryId) {
  const state = getFinanceRecurringState();
  let changed = false;
  state.definitions = state.definitions.map((definition) => {
    if (definition.type !== "expense" || definition.categoryId !== categoryId) return definition;
    changed = true;
    return { ...definition, categoryId: FINANCE_UNASSIGNED_CATEGORY_ID };
  });
  if (changed) await saveFinanceRecurringState(state);
}

async function removeFinanceCategory(categoryId) {
  if (isFinanceBackendActive()) {
    try {
      throwIfSupabaseError(
        await backendState.client
          .from("finance_categories")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", categoryId)
          .eq("user_id", getBackendUserId()),
      );
      throwIfSupabaseError(
        await backendState.client
          .from("finance_budget_allocations")
          .delete()
          .eq("category_id", categoryId)
          .eq("user_id", getBackendUserId()),
      );
      throwIfSupabaseError(
        await backendState.client
          .from("finance_entries")
          .update({ category_id: null })
          .eq("category_id", categoryId)
          .eq("user_id", getBackendUserId()),
      );
      await reassignFinanceRecurringCategory(categoryId);
      await refreshFinanceBackendState();
    } catch (error) {
      console.error("Finance category delete error:", error);
      setBackendAuthStatus("Backend: failed to remove Finance category");
    }
    return;
  }

  removeLocalFinanceCategory(categoryId);
  const entries = getFinanceEntries().map((entry) => {
    if (entry.type === "expense" && entry.categoryId === categoryId) {
      return { ...entry, categoryId: FINANCE_UNASSIGNED_CATEGORY_ID };
    }
    return entry;
  });
  setFinanceEntries(entries);
  await reassignFinanceRecurringCategory(categoryId);
  renderFinanceBudgetArea(entries);
  renderFinanceList();
}

function renderFinanceCategoryList(entries) {
  const list = document.getElementById("financeCategoryList");
  if (!list) return;
  const { budget, spentByCategory } = getFinanceBudgetMeta(entries);
  list.innerHTML = "";
  budget.categories.forEach((category) => {
    const li = document.createElement("li");
    const chip = document.createElement("span");
    chip.className = "finance-color-chip";
    chip.style.backgroundColor =
      FINANCE_CATEGORY_COLORS[category.colorIndex % FINANCE_CATEGORY_COLORS.length];

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "finance-category-name";
    nameInput.value = category.name;

    const allocInput = document.createElement("input");
    allocInput.type = "number";
    allocInput.min = "0";
    allocInput.step = "0.01";
    allocInput.className = "finance-category-alloc";
    allocInput.value = String(category.allocatedAmount);
    allocInput.title = `spent: ${formatFinanceAmount(spentByCategory.get(category.id) || 0)}`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "x";
    delBtn.addEventListener("click", function () {
      void removeFinanceCategory(category.id);
    });

    const persistEdit = async function () {
      const nextName = nameInput.value.trim();
      const nextAlloc = Number(allocInput.value);
      if (!nextName || !Number.isFinite(nextAlloc) || nextAlloc < 0) {
        renderFinanceBudgetArea(getFinanceEntries());
        return;
      }
      const nextBudget = getFinanceBudgetState();
      const idx = nextBudget.categories.findIndex((item) => item.id === category.id);
      if (idx < 0) return;
      const otherAlloc = nextBudget.categories.reduce((sum, item) => {
        if (item.id === category.id) return sum;
        return sum + item.allocatedAmount;
      }, 0);
      if (!budgetAllocationWithinLimit(nextBudget, otherAlloc + nextAlloc)) {
        renderFinanceBudgetArea(getFinanceEntries());
        return;
      }
      nextBudget.categories[idx].name = nextName;
      nextBudget.categories[idx].allocatedAmount = nextAlloc;
      nextBudget.monthKey = getSelectedFinanceMonthKey();

      if (isFinanceBackendActive()) {
        try {
          await persistFinanceBudgetStateToBackend(nextBudget);
          throwIfSupabaseError(
            await backendState.client
              .from("finance_categories")
              .update({ name: nextName })
              .eq("id", category.id)
              .eq("user_id", getBackendUserId()),
          );
          await refreshFinanceBackendState();
        } catch (error) {
          console.error("Finance category update error:", error);
          setBackendAuthStatus("Backend: failed to update Finance category");
          renderFinanceBudgetArea(getFinanceEntries());
        }
        return;
      }

      updateLocalFinanceCategoryName(category.id, nextName);
      setFinanceBudgetState(nextBudget);
      renderFinanceBudgetArea(getFinanceEntries());
      renderFinanceList();
    };

    nameInput.addEventListener("blur", function () {
      void persistEdit();
    });
    allocInput.addEventListener("blur", function () {
      void persistEdit();
    });
    allocInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") void persistEdit();
    });

    li.appendChild(chip);
    li.appendChild(nameInput);
    li.appendChild(allocInput);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function renderFinanceBudgetArea(entries) {
  const monthEntries = getFinanceEntriesForMonth(entries);
  const budgetInput = document.getElementById("financeMonthlyBudgetInput");
  if (budgetInput) {
    budgetInput.value = String(getFinanceBudgetState().monthlyBudget || 0);
  }
  const modeLabel = document.getElementById("financeBudgetModeLabel");
  if (modeLabel) {
    const monthKey = getSelectedFinanceMonthKey();
    modeLabel.textContent = hasFinanceMonthBudget(monthKey)
      ? `editing ${monthKey} budget snapshot`
      : `using default budget for ${monthKey}`;
  }
  renderFinanceCategoryOptions();
  syncFinanceFormForType();
  syncFinanceRecurringFormForType();
  renderFinancePartition(monthEntries);
  renderFinanceCategoryList(monthEntries);
}

function renderFinanceRecurringArea() {
  const list = document.getElementById("financeRecurringList");
  const startInput = document.getElementById("financeRecurringStartInput");
  const dayInput = document.getElementById("financeRecurringDayInput");
  if (startInput && !startInput.value) startInput.value = getSelectedFinanceMonthKey();
  if (dayInput && !dayInput.value) dayInput.value = "1";
  syncFinanceRecurringFormForType();
  if (!list) return;

  const categories = getAllFinanceCategories();
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const state = getFinanceRecurringState();
  const activeDefinitions = state.definitions.filter((definition) => definition.active);
  const selectedMonth = getSelectedFinanceMonthKey();
  const selectedMonthEntries = getFinanceEntriesForMonth(getFinanceEntries(), selectedMonth);
  list.innerHTML = "";

  activeDefinitions.forEach((definition) => {
    const li = document.createElement("li");
    const appliesToSelectedMonth = financeRecurringAppliesToMonth(definition, selectedMonth);
    const scheduledDate = financeRecurringScheduledDate(definition, selectedMonth);
    const posted = financeRecurringIsPosted(state, definition, selectedMonth, selectedMonthEntries);
    const status = posted ? "posted" : scheduledDate <= currentFinanceDateKey() ? "due" : "forecast";
    const type = document.createElement("span");
    type.className = "finance-row-type";
    type.textContent = definition.type;
    const amount = document.createElement("span");
    amount.textContent = formatFinanceAmount(definition.amount);
    const note = document.createElement("span");
    note.className = "finance-row-note";
    note.textContent =
      definition.type === "expense"
        ? `${definition.note} [${categoryMap.get(definition.categoryId) || "Unassigned"}]`
        : definition.note;
    const day = document.createElement("span");
    day.textContent = appliesToSelectedMonth ? `${scheduledDate} ${status}` : `not in ${selectedMonth}`;
    const range = document.createElement("span");
    range.textContent = definition.endMonth
      ? `${definition.startMonth} to ${definition.endMonth}`
      : `${definition.startMonth}+`;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "finance-row-delete";
    removeButton.textContent = "x";
    removeButton.addEventListener("click", function () {
      void removeFinanceRecurringDefinition(definition.id);
    });

    li.appendChild(type);
    li.appendChild(amount);
    li.appendChild(note);
    li.appendChild(day);
    li.appendChild(range);
    li.appendChild(removeButton);
    list.appendChild(li);
  });
}

function getFinanceProjection(entries, monthKey = getSelectedFinanceMonthKey()) {
  const monthEntries = getFinanceEntriesForMonth(entries, monthKey);
  let projectedIncome = monthEntries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  let projectedExpense = monthEntries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const state = getFinanceRecurringState();

  state.definitions.forEach((definition) => {
    if (!financeRecurringAppliesToMonth(definition, monthKey)) return;
    if (financeRecurringIsPosted(state, definition, monthKey, monthEntries)) return;
    if (definition.type === "income") projectedIncome += definition.amount;
    else projectedExpense += definition.amount;
  });

  return {
    projectedIncome,
    projectedExpense,
    projectedNet: projectedIncome - projectedExpense,
  };
}

function renderFinanceSpentArea(entries) {
  const pie = document.getElementById("financeSpentPie");
  const legend = document.getElementById("financeSpentLegend");
  const incomeTotalEl = document.getElementById("financeIncomeTotalMonth");
  const invoicesTotalEl = document.getElementById("financeInvoicesTotalMonth");
  const spentTotalEl = document.getElementById("financeSpentTotalMonth");
  const progressEl = document.getElementById("financeSpentBudgetProgress");
  const projectedIncomeEl = document.getElementById("financeProjectedIncomeTotal");
  const projectedExpenseEl = document.getElementById("financeProjectedExpenseTotal");
  const projectedNetEl = document.getElementById("financeProjectedNetTotal");
  const detailTitle = document.getElementById("financeSpentDetailTitle");
  const detailList = document.getElementById("financeSpentDetailList");
  if (
    !pie ||
    !legend ||
    !incomeTotalEl ||
    !invoicesTotalEl ||
    !spentTotalEl ||
    !progressEl ||
    !detailTitle ||
    !detailList
  ) {
    return;
  }

  const monthKey = getSelectedFinanceMonthKey();
  const monthlyIncomes = entries.filter((entry) => {
    return entry.type === "income" && typeof entry.date === "string" && entry.date.startsWith(monthKey);
  });
  const monthlyExpenses = entries.filter((entry) => {
    return entry.type === "expense" && typeof entry.date === "string" && entry.date.startsWith(monthKey);
  });
  const totalIncome = monthlyIncomes.reduce((sum, entry) => sum + entry.amount, 0);
  const totalSpent = monthlyExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const progress = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;

  incomeTotalEl.textContent = formatFinanceAmount(totalIncome);
  invoicesTotalEl.textContent = formatFinanceAmount(totalSpent);
  spentTotalEl.textContent = formatFinanceAmount(totalSpent);
  progressEl.textContent = `${progress.toFixed(1)}%`;
  const projection = getFinanceProjection(entries, monthKey);
  if (projectedIncomeEl) projectedIncomeEl.textContent = formatFinanceAmount(projection.projectedIncome);
  if (projectedExpenseEl) projectedExpenseEl.textContent = formatFinanceAmount(projection.projectedExpense);
  if (projectedNetEl) projectedNetEl.textContent = formatFinanceAmount(projection.projectedNet);

  pie.innerHTML = "";
  legend.innerHTML = "";

  const categories = getAllFinanceCategories();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const spentMap = new Map();
  monthlyExpenses.forEach((entry) => {
    const key = entry.categoryId || FINANCE_UNASSIGNED_CATEGORY_ID;
    spentMap.set(key, (spentMap.get(key) || 0) + entry.amount);
  });

  const cx = 110;
  const cy = 110;
  const radius = 86;
  let cursor = -Math.PI / 2;

  const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bgCircle.setAttribute("cx", String(cx));
  bgCircle.setAttribute("cy", String(cy));
  bgCircle.setAttribute("r", String(radius));
  bgCircle.setAttribute("fill", "#f5f5f5");
  bgCircle.setAttribute("stroke", "#333");
  bgCircle.setAttribute("stroke-width", "1");
  pie.appendChild(bgCircle);

  const spentPairs = Array.from(spentMap.entries()).sort((a, b) => b[1] - a[1]);
  if (totalIncome <= 0) {
    const item = document.createElement("li");
    const chip = document.createElement("span");
    chip.className = "finance-color-chip";
    chip.style.backgroundColor = "#9a9a9a";
    const text = document.createElement("span");
    text.textContent = "No income logged this month.";
    item.appendChild(chip);
    item.appendChild(text);
    legend.appendChild(item);
    selectedFinanceSpentCategoryId = "";
    detailTitle.textContent = "category logs: none selected";
    detailList.innerHTML = "";
    return;
  }

  if (totalSpent <= 0 || spentPairs.length === 0) {
    const item = document.createElement("li");
    const chip = document.createElement("span");
    chip.className = "finance-color-chip";
    chip.style.backgroundColor = "#9a9a9a";
    const text = document.createElement("span");
    text.textContent = "No expenses this month.";
    item.appendChild(chip);
    item.appendChild(text);
    legend.appendChild(item);
    selectedFinanceSpentCategoryId = "";
    detailTitle.textContent = "category logs: none selected";
    detailList.innerHTML = "";
    return;
  }

  const categoryStillExists = spentPairs.some(([categoryId]) => categoryId === selectedFinanceSpentCategoryId);
  if (!selectedFinanceSpentCategoryId || !categoryStillExists) {
    selectedFinanceSpentCategoryId = spentPairs[0][0];
  }

  let consumedFraction = 0;
  spentPairs.forEach(([categoryId, spentAmount]) => {
    const category = categoryMap.get(categoryId) || {
      id: FINANCE_UNASSIGNED_CATEGORY_ID,
      name: "Unassigned",
      colorIndex: FINANCE_CATEGORY_COLORS.length - 1,
    };
    const fraction = Math.min(spentAmount / totalIncome, 1);
    const delta = fraction * Math.PI * 2;
    if (delta <= 0) return;
    const color = FINANCE_CATEGORY_COLORS[category.colorIndex % FINANCE_CATEGORY_COLORS.length];

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pieSlicePath(cx, cy, radius, cursor, cursor + delta));
    path.setAttribute("fill", color);
    path.setAttribute("stroke", "#1a1a1a");
    path.setAttribute("stroke-width", "1");
    pie.appendChild(path);
    cursor += delta;
    consumedFraction += fraction;

    const item = document.createElement("li");
    item.className = "finance-spent-legend-item";
    if (categoryId === selectedFinanceSpentCategoryId) {
      item.classList.add("finance-spent-legend-item--active");
    }
    item.addEventListener("click", function () {
      selectedFinanceSpentCategoryId = categoryId;
      renderFinanceSpentArea(getFinanceEntries());
    });
    const chip = document.createElement("span");
    chip.className = "finance-color-chip";
    chip.style.backgroundColor = color;
    const text = document.createElement("span");
    text.textContent = `${category.name}: ${formatFinanceAmount(spentAmount)} (${(fraction * 100).toFixed(1)}% of income)`;
    item.appendChild(chip);
    item.appendChild(text);
    legend.appendChild(item);
  });

  const remainingIncome = Math.max(0, totalIncome - totalSpent);
  const remainingFraction = Math.max(0, 1 - Math.min(consumedFraction, 1));
  if (remainingIncome > 0 && remainingFraction > 0) {
    const delta = remainingFraction * Math.PI * 2;
    const remainingPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    remainingPath.setAttribute("d", pieSlicePath(cx, cy, radius, cursor, cursor + delta));
    remainingPath.setAttribute("fill", "#1f7a3f");
    remainingPath.setAttribute("stroke", "#1a1a1a");
    remainingPath.setAttribute("stroke-width", "1");
    pie.appendChild(remainingPath);

    const remainingItem = document.createElement("li");
    const remainingChip = document.createElement("span");
    remainingChip.className = "finance-color-chip";
    remainingChip.style.backgroundColor = "#1f7a3f";
    const remainingText = document.createElement("span");
    remainingText.textContent = `remaining income: ${formatFinanceAmount(remainingIncome)} (${(remainingFraction * 100).toFixed(1)}%)`;
    remainingItem.appendChild(remainingChip);
    remainingItem.appendChild(remainingText);
    legend.appendChild(remainingItem);
  } else if (totalSpent > totalIncome) {
    const overItem = document.createElement("li");
    const overChip = document.createElement("span");
    overChip.className = "finance-color-chip";
    overChip.style.backgroundColor = "#aa2222";
    const overText = document.createElement("span");
    overText.textContent = `overspent: ${formatFinanceAmount(totalSpent - totalIncome)}`;
    overItem.appendChild(overChip);
    overItem.appendChild(overText);
    legend.appendChild(overItem);
  }

  const selectedCategory = categoryMap.get(selectedFinanceSpentCategoryId) || {
    id: FINANCE_UNASSIGNED_CATEGORY_ID,
    name: "Unassigned",
  };
  const selectedLogs = monthlyExpenses
    .filter((entry) => {
      const entryCategoryId = entry.categoryId || FINANCE_UNASSIGNED_CATEGORY_ID;
      return entryCategoryId === selectedFinanceSpentCategoryId;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  detailTitle.textContent = `category logs: ${selectedCategory.name} (${selectedLogs.length})`;
  detailList.innerHTML = "";
  selectedLogs.forEach((entry) => {
    const li = document.createElement("li");
    const date = document.createElement("span");
    date.textContent = formatFinanceDate(entry.date);
    const amount = document.createElement("span");
    amount.textContent = formatFinanceAmount(entry.amount);
    const note = document.createElement("span");
    note.textContent = entry.note;
    li.appendChild(date);
    li.appendChild(amount);
    li.appendChild(note);
    detailList.appendChild(li);
  });
}

async function removeFinanceEntry(entryId) {
  if (isFinanceBackendActive()) {
    try {
      throwIfSupabaseError(
        await backendState.client
          .from("finance_entries")
          .delete()
          .eq("id", entryId)
          .eq("user_id", getBackendUserId()),
      );
      financeRemoteState.entries = financeRemoteState.entries.filter((entry) => entry.id !== entryId);
      renderFinanceList();
    } catch (error) {
      console.error("Finance entry delete error:", error);
      setBackendAuthStatus("Backend: failed to remove Finance entry");
    }
    return;
  }

  const nextEntries = getFinanceEntries().filter((entry) => entry.id !== entryId);
  setFinanceEntries(nextEntries);
  renderFinanceList();
}

async function updateFinanceEntry(entryId, patch) {
  const normalized = normalizeFinanceEntry({
    id: entryId,
    date: patch.date,
    type: patch.type,
    categoryId: patch.type === "expense" ? patch.categoryId : "",
    amount: patch.amount,
    note: patch.note,
    createdAt: patch.createdAt || new Date().toISOString(),
  });
  if (!normalized) return;

  if (isFinanceBackendActive()) {
    try {
      const row = throwIfSupabaseError(
        await backendState.client
          .from("finance_entries")
          .update({
            happened_on: normalized.date,
            entry_type: normalized.type,
            category_id:
              normalized.type === "expense"
                ? financeCategoryIdForDb(normalized.categoryId)
                : null,
            amount: normalized.amount,
            note: normalized.note,
          })
          .eq("id", entryId)
          .eq("user_id", getBackendUserId())
          .select("id, happened_on, entry_type, category_id, amount, note, created_at")
          .single(),
      );
      const mappedEntry = mapFinanceEntryRow(row);
      if (mappedEntry) {
        financeRemoteState.entries = financeRemoteState.entries.map((entry) =>
          entry.id === entryId ? mappedEntry : entry,
        );
      }
      renderFinanceList();
    } catch (error) {
      console.error("Finance entry update error:", error);
      setBackendAuthStatus("Backend: failed to update Finance entry");
    }
    return;
  }

  const nextEntries = getFinanceEntries().map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          date: normalized.date,
          type: normalized.type,
          categoryId: normalized.type === "expense" ? normalized.categoryId : "",
          amount: normalized.amount,
          note: normalized.note,
        }
      : entry,
  );
  setFinanceEntries(nextEntries);
  renderFinanceList();
}

function renderFinanceList() {
  const list = document.getElementById("financeList");
  if (!list) return;
  const allEntries = getFinanceEntries();
  const entries = getFinanceEntriesForMonth(allEntries).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  list.innerHTML = "";
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "finance-empty-row";
    empty.textContent = "No logs in this month yet.";
    list.appendChild(empty);
  }
  entries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "finance-entry-edit-row";

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = entry.date;

    const typeSelect = document.createElement("select");
    ["income", "expense"].forEach((typeValue) => {
      const option = document.createElement("option");
      option.value = typeValue;
      option.textContent = typeValue;
      typeSelect.appendChild(option);
    });
    typeSelect.value = entry.type;

    const categorySelect = document.createElement("select");
    populateFinanceCategorySelect(categorySelect, entry.categoryId || FINANCE_UNASSIGNED_CATEGORY_ID);
    categorySelect.disabled = entry.type !== "expense";
    categorySelect.style.opacity = entry.type === "expense" ? "1" : "0.55";
    typeSelect.addEventListener("change", function () {
      const isExpense = typeSelect.value === "expense";
      categorySelect.disabled = !isExpense;
      categorySelect.style.opacity = isExpense ? "1" : "0.55";
    });

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.min = "0";
    amountInput.step = "0.01";
    amountInput.value = String(entry.amount);

    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "finance-row-note";
    noteInput.value = entry.note;

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "finance-row-save";
    saveButton.textContent = "save";
    saveButton.addEventListener("click", function () {
      void updateFinanceEntry(entry.id, {
        date: dateInput.value,
        type: typeSelect.value,
        categoryId: categorySelect.value,
        amount: Number(amountInput.value),
        note: noteInput.value,
        createdAt: entry.createdAt,
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "finance-row-delete";
    deleteButton.textContent = "x";
    deleteButton.addEventListener("click", function () {
      void removeFinanceEntry(entry.id);
    });

    li.appendChild(dateInput);
    li.appendChild(typeSelect);
    li.appendChild(categorySelect);
    li.appendChild(amountInput);
    li.appendChild(noteInput);
    li.appendChild(saveButton);
    li.appendChild(deleteButton);
    list.appendChild(li);
  });

  renderFinanceBalancePanel(allEntries);
  updateFinanceTotals(entries);
  renderFinanceBudgetArea(entries);
  renderFinanceSpentArea(allEntries);
  renderFinanceRecurringArea();
}

async function saveFinanceOpeningBalance() {
  const openingDateInput = document.getElementById("financeOpeningDateInput");
  const openingAmountInput = document.getElementById("financeOpeningAmountInput");
  if (!openingDateInput || !openingAmountInput) return;

  const nextState = normalizeFinanceOpeningBalanceState({
    effectiveOn: openingDateInput.value,
    amount: Number(openingAmountInput.value),
  });
  if (!nextState) return;

  if (isFinanceBackendActive()) {
    try {
      const row = await upsertFinanceOpeningBalance(nextState);
      financeRemoteState.openingBalance = mapFinanceOpeningBalanceRow(row);
      renderFinanceList();
    } catch (error) {
      console.error("Finance opening balance save error:", error);
      setBackendAuthStatus("Backend: failed to save opening balance");
    }
    return;
  }

  setFinanceOpeningBalanceState(nextState);
  renderFinanceList();
}

async function reconcileFinanceCurrentBalance() {
  const entries = getFinanceEntries();
  const balanceMeta = getFinanceCurrentBalanceMeta(entries);
  const fallbackValue = Number.isFinite(balanceMeta.currentBalance)
    ? balanceMeta.currentBalance.toFixed(2)
    : "";
  const response = window.prompt("Actual current balance", fallbackValue);
  if (response === null) return;

  const actualBalance = parseFinanceAmountInput(response);
  if (!Number.isFinite(actualBalance)) return;

  const today = currentFinanceDateKey();
  const netSinceToday = entries
    .filter((entry) => entry.date >= today)
    .reduce((sum, entry) => sum + (entry.type === "income" ? entry.amount : -entry.amount), 0);
  const nextState = {
    effectiveOn: today,
    amount: actualBalance - netSinceToday,
  };

  if (isFinanceBackendActive()) {
    try {
      const row = await upsertFinanceOpeningBalance(nextState);
      financeRemoteState.openingBalance = mapFinanceOpeningBalanceRow(row);
      renderFinanceList();
    } catch (error) {
      console.error("Finance balance reconcile error:", error);
      setBackendAuthStatus("Backend: failed to reconcile Finance balance");
    }
    return;
  }

  setFinanceOpeningBalanceState(nextState);
  renderFinanceList();
}

async function addFinanceEntry() {
  const dateInput = document.getElementById("financeDateInput");
  const typeInput = document.getElementById("financeTypeInput");
  const amountInput = document.getElementById("financeAmountInput");
  const noteInput = document.getElementById("financeNoteInput");
  const categoryInput = document.getElementById("financeCategoryInput");
  if (!dateInput || !typeInput || !amountInput || !noteInput || !categoryInput) return;

  const date = dateInput.value;
  const type = typeInput.value;
  const amount = Number(amountInput.value);
  const categoryId = categoryInput.value;
  const category = getAllFinanceCategories().find((item) => item.id === categoryId);
  const categoryName = categoryId === FINANCE_UNASSIGNED_CATEGORY_ID ? "Expense" : category?.name;
  const note = noteInput.value.trim() || (type === "expense" ? categoryName || "Expense" : "Income");

  if (!date || !FINANCE_TYPES.has(type) || !Number.isFinite(amount) || amount <= 0) {
    setFinanceEntryStatus("Enter an amount greater than zero.", "error");
    return;
  }
  if (type === "expense" && !categoryId) {
    setFinanceEntryStatus("Choose a category for this expense.", "error");
    return;
  }

  const addButton = document.getElementById("financeAddBtn");
  if (addButton) {
    addButton.disabled = true;
    addButton.textContent = "Saving…";
  }
  setFinanceEntryStatus("Saving entry…");

  const finishSave = () => {
    const typeLabel = type === "expense" ? "Expense" : "Income";
    if (type === "expense") {
      localStorage.setItem(FINANCE_LAST_CATEGORY_STORAGE_KEY, categoryId);
    }
    noteInput.value = "";
    amountInput.value = "";
    renderFinanceList();
    setFinanceEntryStatus(`${typeLabel} of ${formatFinanceAmount(amount)} saved.`, "success");
    document.getElementById("financeEntryDetails")?.removeAttribute("open");
    amountInput.focus();
  };

  if (isFinanceBackendActive()) {
    try {
      const row = throwIfSupabaseError(
        await backendState.client
          .from("finance_entries")
          .insert({
            user_id: getBackendUserId(),
            happened_on: date,
            entry_type: type,
            category_id: type === "expense" ? financeCategoryIdForDb(categoryId) : null,
            amount,
            note,
          })
          .select("id, happened_on, entry_type, category_id, amount, note, created_at")
          .single(),
      );
      const entry = mapFinanceEntryRow(row);
      if (entry) financeRemoteState.entries.push(entry);
      finishSave();
    } catch (error) {
      console.error("Finance entry create error:", error);
      setBackendAuthStatus("Backend: failed to save Finance entry");
      setFinanceEntryStatus("Could not save. Please try again.", "error");
    } finally {
      if (addButton) addButton.disabled = false;
      syncFinanceFormForType();
    }
    return;
  }

  const entries = getFinanceEntries();
  entries.push({
    id: makeFinanceEntryId(),
    date,
    type,
    categoryId: type === "expense" ? categoryId : "",
    amount,
    note,
    createdAt: new Date().toISOString(),
  });
  setFinanceEntries(entries);
  finishSave();
  if (addButton) addButton.disabled = false;
  syncFinanceFormForType();
}

async function saveFinanceMonthlyBudget() {
  const budgetInput = document.getElementById("financeMonthlyBudgetInput");
  if (!budgetInput) return;
  const next = Number(budgetInput.value);
  if (!Number.isFinite(next) || next < 0) return;
  const budget = getFinanceBudgetState();
  const allocated = budget.categories.reduce((sum, category) => sum + category.allocatedAmount, 0);
  if (allocated > next) return;
  budget.monthlyBudget = next;
  budget.monthKey = getSelectedFinanceMonthKey();

  if (isFinanceBackendActive()) {
    try {
      const row = await persistFinanceBudgetStateToBackend(budget);
      financeRemoteState.budgetRowId = row.id;
      setFinanceBudgetState(budget);
      renderFinanceBudgetArea(getFinanceEntries());
      renderFinanceSpentArea(getFinanceEntries());
    } catch (error) {
      console.error("Finance budget update error:", error);
      setBackendAuthStatus("Backend: failed to save Finance budget");
    }
    return;
  }

  setFinanceBudgetState(budget);
  renderFinanceBudgetArea(getFinanceEntries());
  renderFinanceSpentArea(getFinanceEntries());
}

async function copyFinanceDefaultBudgetToMonth() {
  const monthKey = getSelectedFinanceMonthKey();
  const budget = cloneFinanceBudgetState(getFinanceDefaultBudgetState(), monthKey);

  if (isFinanceBackendActive()) {
    try {
      await persistFinanceBudgetStateToBackend(budget);
      await refreshFinanceBackendState();
    } catch (error) {
      console.error("Finance budget copy error:", error);
      setBackendAuthStatus("Backend: failed to copy default Finance budget");
    }
    return;
  }

  setFinanceBudgetState(budget);
  renderFinanceList();
}

async function saveFinanceMonthBudgetAsDefault() {
  const budget = cloneFinanceBudgetState(getFinanceBudgetState(), FINANCE_DEFAULT_BUDGET_MONTH_KEY);

  if (isFinanceBackendActive()) {
    try {
      await persistFinanceBudgetStateToBackend(budget);
      await refreshFinanceBackendState();
    } catch (error) {
      console.error("Finance budget default save error:", error);
      setBackendAuthStatus("Backend: failed to save default Finance budget");
    }
    return;
  }

  setLocalFinanceDefaultBudgetState(budget);
  renderFinanceList();
}

async function resetFinanceMonthBudget() {
  const monthKey = getSelectedFinanceMonthKey();

  if (isFinanceBackendActive()) {
    try {
      throwIfSupabaseError(
        await backendState.client
          .from("finance_month_budgets")
          .delete()
          .eq("user_id", getBackendUserId())
          .eq("month_key", monthKey),
      );
      await refreshFinanceBackendState();
    } catch (error) {
      console.error("Finance budget reset error:", error);
      setBackendAuthStatus("Backend: failed to reset Finance month budget");
    }
    return;
  }

  removeLocalFinanceMonthBudget(monthKey);
  renderFinanceList();
}

async function addFinanceCategory() {
  const nameInput = document.getElementById("financeCategoryNameInput");
  const allocInput = document.getElementById("financeCategoryAllocInput");
  if (!nameInput || !allocInput) return;
  const name = nameInput.value.trim();
  const alloc = Number(allocInput.value);
  if (!name || !Number.isFinite(alloc) || alloc < 0) return;
  const budget = getFinanceBudgetState();
  const existingAlloc = budget.categories.reduce((sum, category) => sum + category.allocatedAmount, 0);
  if (!budgetAllocationWithinLimit(budget, existingAlloc + alloc)) return;

  if (isFinanceBackendActive()) {
    try {
      budget.monthKey = getSelectedFinanceMonthKey();
      const budgetRow = await persistFinanceBudgetStateToBackend(budget);
      const categoryRow = throwIfSupabaseError(
        await backendState.client
          .from("finance_categories")
          .insert({
            user_id: getBackendUserId(),
            name,
            color_index: budget.categories.length,
          })
          .select("id, name, color_index")
          .single(),
      );
      await upsertFinanceAllocation(budgetRow.id, categoryRow.id, alloc);
      nameInput.value = "";
      allocInput.value = "";
      await refreshFinanceBackendState();
    } catch (error) {
      console.error("Finance category create error:", error);
      setBackendAuthStatus("Backend: failed to add Finance category");
    }
    return;
  }

  const category = {
    id: makeFinanceCategoryId(),
    name,
    allocatedAmount: alloc,
    colorIndex: budget.categories.length,
  };
  const defaultBudget = getLocalFinanceDefaultBudgetState();
  if (!defaultBudget.categories.some((item) => item.id === category.id)) {
    defaultBudget.categories.push({ ...category, allocatedAmount: 0 });
    setLocalFinanceDefaultBudgetState(defaultBudget);
  }
  budget.categories.push(category);
  setFinanceBudgetState(budget);
  nameInput.value = "";
  allocInput.value = "";
  renderFinanceBudgetArea(getFinanceEntries());
  renderFinanceSpentArea(getFinanceEntries());
}

async function addFinanceRecurringDefinition() {
  const typeInput = document.getElementById("financeRecurringTypeInput");
  const categoryInput = document.getElementById("financeRecurringCategoryInput");
  const amountInput = document.getElementById("financeRecurringAmountInput");
  const noteInput = document.getElementById("financeRecurringNoteInput");
  const dayInput = document.getElementById("financeRecurringDayInput");
  const startInput = document.getElementById("financeRecurringStartInput");
  const endInput = document.getElementById("financeRecurringEndInput");
  if (!typeInput || !categoryInput || !amountInput || !noteInput || !dayInput || !startInput || !endInput) {
    return;
  }

  const definition = normalizeFinanceRecurringDefinition({
    id: makeFinanceRecurringId(),
    type: typeInput.value,
    categoryId: typeInput.value === "expense" ? categoryInput.value : "",
    amount: Number(amountInput.value),
    note: noteInput.value,
    dayOfMonth: Number(dayInput.value),
    startMonth: startInput.value || getSelectedFinanceMonthKey(),
    endMonth: endInput.value,
    active: true,
  });
  if (!definition) return;

  const state = getFinanceRecurringState();
  state.definitions.push(definition);
  await saveFinanceRecurringState(state);
  amountInput.value = "";
  noteInput.value = "";
  renderFinanceList();
}

async function removeFinanceRecurringDefinition(definitionId) {
  const state = getFinanceRecurringState();
  const idx = state.definitions.findIndex((definition) => definition.id === definitionId);
  if (idx < 0) return;
  state.definitions[idx].active = false;
  await saveFinanceRecurringState(state);
  renderFinanceList();
}

function setFinanceTab(targetSectionId) {
  const sections = [
    document.getElementById("financeLogsSection"),
    document.getElementById("financeBudgetSection"),
    document.getElementById("financeRecurringSection"),
    document.getElementById("financeSpentSection"),
  ];
  const tabButtons = Array.from(document.querySelectorAll(".finance-tab-btn"));
  sections.forEach((section) => {
    if (!section) return;
    const active = section.id === targetSectionId;
    section.classList.toggle("finance-section--active", active);
    section.hidden = !active;
  });
  tabButtons.forEach((button) => {
    const isActive = button.dataset.target === targetSectionId;
    button.classList.toggle("finance-tab-btn--active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const dateInput = document.getElementById("financeDateInput");
  const addBtn = document.getElementById("financeAddBtn");
  const noteInput = document.getElementById("financeNoteInput");
  const amountInput = document.getElementById("financeAmountInput");
  const typeInput = document.getElementById("financeTypeInput");
  const categoryInput = document.getElementById("financeCategoryInput");
  const typeButtons = Array.from(document.querySelectorAll("[data-finance-type]"));
  const budgetSaveBtn = document.getElementById("financeBudgetSaveBtn");
  const categoryAddBtn = document.getElementById("financeCategoryAddBtn");
  const monthInput = document.getElementById("financeMonthInput");
  const prevMonthBtn = document.getElementById("financePrevMonthBtn");
  const nextMonthBtn = document.getElementById("financeNextMonthBtn");
  const openingBalanceSaveBtn = document.getElementById("financeOpeningBalanceSaveBtn");
  const balanceReconcileBtn = document.getElementById("financeBalanceReconcileBtn");
  const recurringTypeInput = document.getElementById("financeRecurringTypeInput");
  const recurringAddBtn = document.getElementById("financeRecurringAddBtn");
  const copyDefaultBudgetBtn = document.getElementById("financeCopyDefaultBudgetBtn");
  const saveAsDefaultBudgetBtn = document.getElementById("financeSaveAsDefaultBudgetBtn");
  const resetMonthBudgetBtn = document.getElementById("financeResetMonthBudgetBtn");
  const tabButtons = Array.from(document.querySelectorAll(".finance-tab-btn"));
  syncFinanceMonthUi();
  if (dateInput && !dateInput.value) {
    dateInput.value = defaultFinanceDateForMonth(getSelectedFinanceMonthKey());
  }

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      void addFinanceEntry();
    });
  }
  if (noteInput) {
    noteInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") void addFinanceEntry();
    });
  }
  if (amountInput) {
    amountInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") void addFinanceEntry();
    });
  }
  typeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (!typeInput || !FINANCE_TYPES.has(button.dataset.financeType)) return;
      typeInput.value = button.dataset.financeType;
      syncFinanceFormForType();
      setFinanceEntryStatus(
        typeInput.value === "expense"
          ? "Expense selected. Add an amount and choose a category."
          : "Income selected. Add the amount you received.",
      );
      amountInput?.focus();
    });
  });
  if (categoryInput) {
    categoryInput.addEventListener("change", function () {
      selectFinanceEntryCategory(categoryInput.value);
    });
  }
  if (typeInput) {
    typeInput.addEventListener("change", syncFinanceFormForType);
  }
  if (monthInput) {
    monthInput.addEventListener("change", function () {
      void setSelectedFinanceMonth(monthInput.value);
    });
  }
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", function () {
      void setSelectedFinanceMonth(shiftSelectedFinanceMonth(-1));
    });
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", function () {
      void setSelectedFinanceMonth(shiftSelectedFinanceMonth(1));
    });
  }
  if (openingBalanceSaveBtn) {
    openingBalanceSaveBtn.addEventListener("click", function () {
      void saveFinanceOpeningBalance();
    });
  }
  if (balanceReconcileBtn) {
    balanceReconcileBtn.addEventListener("click", function () {
      void reconcileFinanceCurrentBalance();
    });
  }
  if (budgetSaveBtn) {
    budgetSaveBtn.addEventListener("click", function () {
      void saveFinanceMonthlyBudget();
    });
  }
  if (categoryAddBtn) {
    categoryAddBtn.addEventListener("click", function () {
      void addFinanceCategory();
    });
  }
  if (copyDefaultBudgetBtn) {
    copyDefaultBudgetBtn.addEventListener("click", function () {
      void copyFinanceDefaultBudgetToMonth();
    });
  }
  if (saveAsDefaultBudgetBtn) {
    saveAsDefaultBudgetBtn.addEventListener("click", function () {
      void saveFinanceMonthBudgetAsDefault();
    });
  }
  if (resetMonthBudgetBtn) {
    resetMonthBudgetBtn.addEventListener("click", function () {
      void resetFinanceMonthBudget();
    });
  }
  if (recurringTypeInput) {
    recurringTypeInput.addEventListener("change", syncFinanceRecurringFormForType);
  }
  if (recurringAddBtn) {
    recurringAddBtn.addEventListener("click", function () {
      void addFinanceRecurringDefinition();
    });
  }
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetSection = button.dataset.target;
      if (!targetSection) return;
      setFinanceTab(targetSection);
    });
  });

  setFinanceTab("financeLogsSection");
  renderFinanceList();
});

// REC LIST / NEXT FEATURES

const RECOMMENDATIONS_STORAGE_KEY = "recs";
const FEATURE_BACKLOG_STORAGE_KEY = "features";
const LISTS_IMPORT_SCOPE = "lists_v1";
const listRemoteState = {
  loaded: false,
  recommendations: [],
  features: [],
};

function makeLocalListItemId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTextListItem(item, prefix) {
  if (typeof item === "string") {
    const text = item.trim();
    if (!text) return null;
    return {
      id: makeLocalListItemId(prefix),
      text,
      createdAt: new Date().toISOString(),
    };
  }

  if (!item || typeof item !== "object") return null;
  const text = typeof item.text === "string" ? item.text.trim() : "";
  if (!text) return null;
  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id : makeLocalListItemId(prefix),
    text,
    createdAt:
      typeof item.createdAt === "string" && item.createdAt
        ? item.createdAt
        : new Date().toISOString(),
  };
}

function getLocalTextList(storageKey, prefix) {
  let parsed = [];
  try {
    parsed = JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch (_error) {
    parsed = [];
  }
  const items = Array.isArray(parsed)
    ? parsed.map((item) => normalizeTextListItem(item, prefix)).filter(Boolean)
    : [];
  localStorage.setItem(storageKey, JSON.stringify(items));
  return items;
}

function setLocalTextList(storageKey, prefix, items) {
  const normalized = Array.isArray(items)
    ? items.map((item) => normalizeTextListItem(item, prefix)).filter(Boolean)
    : [];
  localStorage.setItem(storageKey, JSON.stringify(normalized));
}

function isListBackendActive() {
  return Boolean(backendState.client && backendState.session && listRemoteState.loaded);
}

function getRecommendations() {
  return isListBackendActive()
    ? listRemoteState.recommendations
    : getLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec");
}

function getFeatureBacklogItems() {
  return isListBackendActive()
    ? listRemoteState.features
    : getLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature");
}

function setRecommendations(items) {
  if (isListBackendActive()) {
    listRemoteState.recommendations = items;
    return;
  }
  setLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec", items);
}

function setFeatureBacklogItems(items) {
  if (isListBackendActive()) {
    listRemoteState.features = items;
    return;
  }
  setLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature", items);
}

function mapTextRowToItem(row, prefix) {
  return normalizeTextListItem(
    {
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
    },
    prefix,
  );
}

async function createBackendTextItem(tableName, text) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");
  return throwIfSupabaseError(
    await backendState.client
      .from(tableName)
      .insert({ user_id: userId, text })
      .select("id, text, created_at")
      .single(),
  );
}

async function deleteBackendTextItem(tableName, itemId) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !itemId) return;
  throwIfSupabaseError(
    await backendState.client
      .from(tableName)
      .delete()
      .eq("user_id", userId)
      .eq("id", itemId),
  );
}

async function importListsLocalDataOnce() {
  if (hasBackendImportCompleted(LISTS_IMPORT_SCOPE)) return;
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  for (const item of getLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec")) {
    await createBackendTextItem("recommendations", item.text);
  }
  for (const item of getLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature")) {
    await createBackendTextItem("feature_backlog_items", item.text);
  }

  markBackendImportCompleted(LISTS_IMPORT_SCOPE);
}

async function loadListsBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    listRemoteState.loaded = false;
    return;
  }

  const recRows = throwIfSupabaseError(
    await backendState.client
      .from("recommendations")
      .select("id, text, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  );
  const featureRows = throwIfSupabaseError(
    await backendState.client
      .from("feature_backlog_items")
      .select("id, text, created_at")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: true }),
  );

  listRemoteState.recommendations = (recRows || [])
    .map((row) => mapTextRowToItem(row, "rec"))
    .filter(Boolean);
  listRemoteState.features = (featureRows || [])
    .map((row) => mapTextRowToItem(row, "feature"))
    .filter(Boolean);
  listRemoteState.loaded = true;
}

function renderTextList(listId, items, removeHandler) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(`>  ${item.text}`));

    const deleteButton = document.createElement("button");
    deleteButton.appendChild(document.createTextNode("x"));
    deleteButton.onclick = function () {
      void removeHandler(item.id);
    };

    li.appendChild(deleteButton);
    list.appendChild(li);
  });
}

function renderRecommendations() {
  renderTextList("recList", getRecommendations(), removeRec);
}

function renderFeatureBacklog() {
  renderTextList("featureList", getFeatureBacklogItems(), removeFeature);
}

function renderSimpleLists() {
  renderRecommendations();
  renderFeatureBacklog();
}

async function addRec() {
  const recInput = document.getElementById("recInput");
  if (!recInput) return;
  const text = recInput.value.trim();
  if (!text) return;

  let item = {
    id: makeLocalListItemId("rec"),
    text,
    createdAt: new Date().toISOString(),
  };

  if (isListBackendActive()) {
    try {
      item = mapTextRowToItem(await createBackendTextItem("recommendations", text), "rec");
      listRemoteState.recommendations.push(item);
    } catch (error) {
      console.error("Recommendation DB add error:", error);
      const localItems = getLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec");
      localItems.push(item);
      setLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec", localItems);
      listRemoteState.recommendations.push(item);
    }
  } else {
    const items = getLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec");
    items.push(item);
    setLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec", items);
  }

  recInput.value = "";
  renderRecommendations();
}

async function removeRec(itemId) {
  if (isListBackendActive()) {
    try {
      await deleteBackendTextItem("recommendations", itemId);
    } catch (error) {
      console.error("Recommendation DB delete error:", error);
    }
    listRemoteState.recommendations = listRemoteState.recommendations.filter(
      (item) => item.id !== itemId,
    );
  } else {
    setLocalTextList(
      RECOMMENDATIONS_STORAGE_KEY,
      "rec",
      getLocalTextList(RECOMMENDATIONS_STORAGE_KEY, "rec").filter((item) => item.id !== itemId),
    );
  }
  renderRecommendations();
}

async function addFeature() {
  const featureInput = document.getElementById("featureInput");
  if (!featureInput) return;
  const text = featureInput.value.trim();
  if (!text) return;

  let item = {
    id: makeLocalListItemId("feature"),
    text,
    createdAt: new Date().toISOString(),
  };

  if (isListBackendActive()) {
    try {
      item = mapTextRowToItem(await createBackendTextItem("feature_backlog_items", text), "feature");
      listRemoteState.features.push(item);
    } catch (error) {
      console.error("Feature backlog DB add error:", error);
      const localItems = getLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature");
      localItems.push(item);
      setLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature", localItems);
      listRemoteState.features.push(item);
    }
  } else {
    const items = getLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature");
    items.push(item);
    setLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature", items);
  }

  featureInput.value = "";
  renderFeatureBacklog();
}

async function removeFeature(itemId) {
  if (isListBackendActive()) {
    try {
      await deleteBackendTextItem("feature_backlog_items", itemId);
    } catch (error) {
      console.error("Feature backlog DB delete error:", error);
    }
    listRemoteState.features = listRemoteState.features.filter((item) => item.id !== itemId);
  } else {
    setLocalTextList(
      FEATURE_BACKLOG_STORAGE_KEY,
      "feature",
      getLocalTextList(FEATURE_BACKLOG_STORAGE_KEY, "feature").filter(
        (item) => item.id !== itemId,
      ),
    );
  }
  renderFeatureBacklog();
}

document.addEventListener("DOMContentLoaded", renderSimpleLists);

// POMODORO

let timer;
let timeLeft = 25 * 60; // Default to Pomodoro duration
let isPaused = false; // Add pause state variable

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("timer").innerText =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startCustomTimer() {
  const customMinutes = parseInt(
    document.getElementById("customMinutes").value,
  );
  if (customMinutes > 0) {
    startTimer(customMinutes);
  }
}

function togglePause() {
  isPaused = !isPaused;
  const pauseButton = document.getElementById("pauseButton");
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
}

function startTimer(duration, callback) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isPaused = false;
  document.getElementById("pauseButton").textContent = "Pause";

  timeLeft = duration * 60;
  updateTimerDisplay();
  timer = setInterval(() => {
    if (!isPaused) {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timer);
        timer = null;
        // Play alarm sound
        playAlarmSound();
        alert(`Timer complete! (${duration} minutes)`);

        if (callback) {
          callback();
        }
      }
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  isPaused = false;
  document.getElementById("pauseButton").textContent = "Pause";
  timeLeft = 25 * 60; // Default to Pomodoro duration
  updateTimerDisplay();
}

function playAlarmSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.35);
}

updateTimerDisplay(); // Initial display

function skillThresholdLevel(skillCount) {
  const n = Number(skillCount) || 0;
  const thresholds = [3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047];
  for (let level = 0; level < thresholds.length; level++) {
    if (n <= thresholds[level]) return level + 2;
  }
  return 10;
}

function skillThresholdMax(skillCount) {
  const n = Number(skillCount) || 0;
  const thresholds = [3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047];
  for (let level = 0; level < thresholds.length; level++) {
    if (n <= thresholds[level]) return thresholds[level];
  }
  return 2047;
}

const SKILL_LVL_ELEMENT_IDS = {
  coding: "lvl1",
  fitness: "lvl2",
  meditation: "lvl3",
  content: "lvl4",
  standup: "lvl5",
  jobhunting: "lvl6",
};

function refreshSkillXpUi(skill) {
  const count = parseInt(localStorage.getItem(skill + "Count") || "0", 10);
  const meter = document.getElementById(skill + "Meter");
  if (meter) {
    meter.value = count;
    meter.max = skillThresholdMax(count);
  }
  const xpTotal = document.getElementById(skill + "TotalCount");
  if (xpTotal) xpTotal.textContent = String(count);
  const lvlId = SKILL_LVL_ELEMENT_IDS[skill];
  const lvlEl = lvlId ? document.getElementById(lvlId) : null;
  if (lvlEl) lvlEl.textContent = String(skillThresholdLevel(count));
}

function sortGamifySkillCardsByTotalCount() {
  const row = document.getElementById("gamifySkillBoxesRow");
  if (!row) return;

  const cards = Array.from(row.querySelectorAll(".gamify-skill-card[data-skill]"));
  const orderedCards = cards
    .map((card, index) => ({
      card,
      count: parseInt(localStorage.getItem(card.dataset.skill + "Count") || "0", 10),
      index,
    }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ card }) => card);

  orderedCards.forEach((card) => row.appendChild(card));
}

function adjustSkillXp(skill, delta) {
  let count = parseInt(localStorage.getItem(skill + "Count") || "0", 10);
  count = Math.max(0, count + delta);
  localStorage.setItem(skill + "Count", String(count));
  refreshSkillXpUi(skill);
  sortGamifySkillCardsByTotalCount();
}

function setSkillXp(skill, count) {
  localStorage.setItem(skill + "Count", String(Math.max(0, count)));
  refreshSkillXpUi(skill);
  sortGamifySkillCardsByTotalCount();
}

// PROJECTS METERS UPDATE

document.addEventListener("DOMContentLoaded", function () {
  recalculateGamifySkillXp("standup");
  Object.keys(SKILL_LVL_ELEMENT_IDS).forEach((skill) => {
    refreshSkillXpUi(skill);
  });
  sortGamifySkillCardsByTotalCount();
});

function upXp(skill) {
  adjustSkillXp(skill, 1);
}

function trackerDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTrackerDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ""));
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function parseTrackerMonthKey(monthKey) {
  const match = /^(\d{4})-(\d{1,2})$/.exec(String(monthKey || ""));
  if (!match) return null;
  const year = Number(match[1]);
  // localStorage BoardState suffixes are one-based; convert to JS Date month.
  const month = Number(match[2]) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return null;
  }
  return { year, month };
}

function isValidTrackerDay(year, month, day) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 0 ||
    month > 11 ||
    day < 1
  ) {
    return false;
  }
  return day <= new Date(year, month + 1, 0).getDate();
}

// DRAGABLE FUNCTION (cp from https://jsfiddle.net/4t3Ju/)

window.onload = function () {
  draggable("skillsContainer");
  draggable("pomodoro");
  draggable("dailiesContainer");
  draggable("todoContainer");
  draggable("recContainer");
  draggable("ideasContainer");
  draggable("notesContainer");
  draggable("calendarContainer");
  draggable("wallpContainer");
  draggable("calcContainer");
  draggable("workoutContainer");
  draggable("nextFeatures");
  draggable("chatContainer");
  draggable("clickupContainer");
  draggable("kanbanContainer");
  draggable("plannerContainer");
  draggable("financeContainer");
  draggable("connectionsContainer");
  draggable("llmUsageContainer");
  draggable("contentContainer");
  makeResizable("skillsContainer", {
    minWidth: 540,
    minHeight: 360,
    onResize: scheduleGamifyCalendarRender,
  });
  makeResizable("dailiesContainer", {
    minWidth: 420,
    minHeight: 360,
  });
  makeResizable("contentContainer", {
    minWidth: 460,
    minHeight: 380,
    onResize: scheduleContentBoardRender,
  });
  makeResizable("chatContainer", {
    minWidth: 320,
    minHeight: 320,
  });
  makeResizable("clickupContainer", {
    minWidth: 420,
    minHeight: 320,
  });
  makeResizable("plannerContainer", {
    minWidth: 420,
    minHeight: 360,
  });
  makeResizable("workoutContainer", {
    minWidth: 560,
    minHeight: 420,
    onResize: scheduleWorkoutV2ChartRender,
  });
  makeResizable("notesContainer", {
    minWidth: 420,
    minHeight: 320,
  });
};

var dragObj = null;
var dragOffsetX = 0;
var dragOffsetY = 0;
var resizeObj = null;
var resizeDir = "";
var resizeStartX = 0;
var resizeStartY = 0;
var resizeStartWidth = 0;
var resizeStartHeight = 0;
var resizeStartLeft = 0;
var resizeStartTop = 0;
var resizeOnResize = null;
var gamifyRenderRaf = 0;

function scheduleGamifyCalendarRender() {
  if (gamifyRenderRaf) return;
  gamifyRenderRaf = requestAnimationFrame(function () {
    gamifyRenderRaf = 0;
    renderGamifyStreakCalendar();
  });
}

function draggable(id) {
  var obj = document.getElementById(id);
  if (!obj) return;
  obj.style.position = "absolute";
  var titleBar = obj.querySelector(".titleBar");
  var handle = titleBar || obj;
  handle.onmousedown = function (e) {
    e = e || window.event;
    if (e.target.closest && e.target.closest("button")) return;
    var rect = obj.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    dragObj = obj;
  };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeResizable(id, options) {
  var obj = document.getElementById(id);
  if (!obj) return;
  if (obj.dataset.resizableReady === "true") return;
  obj.dataset.resizableReady = "true";
  obj.style.boxSizing = "border-box";
  if (options && options.minWidth != null) obj.style.minWidth = `${options.minWidth}px`;
  if (options && options.minHeight != null) obj.style.minHeight = `${options.minHeight}px`;
  if (options && typeof options.onResize === "function") obj._onWindowResize = options.onResize;

  ["nw", "ne", "sw", "se"].forEach(function (dir) {
    var handle = document.createElement("div");
    handle.className = `window-resize-handle window-resize-${dir}`;
    handle.dataset.resizeDir = dir;
    handle.addEventListener("mousedown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var rect = obj.getBoundingClientRect();
      resizeObj = obj;
      resizeDir = dir;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      resizeStartWidth = rect.width;
      resizeStartHeight = rect.height;
      resizeStartLeft = rect.left;
      resizeStartTop = rect.top;
      resizeOnResize = obj._onWindowResize || null;
    });
    obj.appendChild(handle);
  });
}

document.onmouseup = function () {
  dragObj = null;
  if (resizeObj && typeof resizeOnResize === "function") resizeOnResize();
  resizeObj = null;
  resizeDir = "";
  resizeOnResize = null;
};

document.onmousemove = function (e) {
  e = e || window.event;

  if (resizeObj) {
    var dx = e.clientX - resizeStartX;
    var dy = e.clientY - resizeStartY;
    var computed = window.getComputedStyle(resizeObj);
    var minWidth = parseFloat(computed.minWidth) || 180;
    var minHeight = parseFloat(computed.minHeight) || 140;
    var maxWidth = parseFloat(computed.maxWidth);
    var maxHeight = parseFloat(computed.maxHeight);
    if (!Number.isFinite(maxWidth) || maxWidth <= 0) maxWidth = Number.POSITIVE_INFINITY;
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) maxHeight = Number.POSITIVE_INFINITY;

    var nextWidth = resizeStartWidth + (resizeDir.indexOf("w") !== -1 ? -dx : dx);
    var nextHeight = resizeStartHeight + (resizeDir.indexOf("n") !== -1 ? -dy : dy);
    nextWidth = clampNumber(nextWidth, minWidth, maxWidth);
    nextHeight = clampNumber(nextHeight, minHeight, maxHeight);

    var nextLeft = resizeStartLeft;
    var nextTop = resizeStartTop;
    if (resizeDir.indexOf("w") !== -1) nextLeft = resizeStartLeft + (resizeStartWidth - nextWidth);
    if (resizeDir.indexOf("n") !== -1) nextTop = resizeStartTop + (resizeStartHeight - nextHeight);

    resizeObj.style.width = `${nextWidth}px`;
    resizeObj.style.height = `${nextHeight}px`;
    resizeObj.style.left = `${nextLeft}px`;
    resizeObj.style.top = `${nextTop}px`;

    if (typeof resizeOnResize === "function") resizeOnResize();
    return;
  }

  if (dragObj == null) return;

  // Disable text selection while dragging to avoid unexpected behavior
  var selection = document.getSelection();
  if (selection) selection.empty();

  dragObj.style.left = (e.clientX - dragOffsetX) + "px";
  dragObj.style.top = (e.clientY - dragOffsetY) + "px";
};

// WORKOUT (editable + saved)
const WORKOUT_PLAN_STORAGE_KEY = "workoutPlan_v1";
const WORKOUT_PLAN_SAVED_KEY = "workoutPlan_saved_v1";
const WORKOUT_EXERCISE_LIBRARY_STORAGE_KEY = "workoutExerciseLibrary_v1";
const WORKOUT_IMPORT_SCOPE = "workout_v1";
const workoutRemoteState = {
  loaded: false,
  planId: "",
  exerciseIdsByName: {},
};

/** One-time: treat existing plan as last-saved baseline so Reset does not wipe edits. */
function migrateWorkoutSavedSnapshotOnce() {
  if (localStorage.getItem(WORKOUT_PLAN_SAVED_KEY)) return;
  const cur = localStorage.getItem(WORKOUT_PLAN_STORAGE_KEY);
  if (cur) localStorage.setItem(WORKOUT_PLAN_SAVED_KEY, cur);
}

function workoutTitlesForMode(mode) {
  return mode === "sessions"
    ? ["A", "B", "C", "D", "E", "F"]
    : ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
}

function defaultWorkoutExerciseLibrary() {
  const seed = defaultWorkoutPlan().exercises.flat().map((x) => String(x || "").trim());
  return Array.from(new Set(seed.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function loadWorkoutExerciseLibrary() {
  const raw = localStorage.getItem(WORKOUT_EXERCISE_LIBRARY_STORAGE_KEY);
  if (!raw) return defaultWorkoutExerciseLibrary();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultWorkoutExerciseLibrary();
    const cleaned = parsed
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    const uniq = Array.from(new Set(cleaned));
    return uniq.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch (_) {
    return defaultWorkoutExerciseLibrary();
  }
}

function saveWorkoutExerciseLibrary(list) {
  const cleaned = Array.isArray(list)
    ? list.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const uniq = Array.from(new Set(cleaned)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  localStorage.setItem(
    WORKOUT_EXERCISE_LIBRARY_STORAGE_KEY,
    JSON.stringify(uniq),
  );
  return uniq;
}

function ensureWorkoutExerciseLibrarySeeded() {
  if (localStorage.getItem(WORKOUT_EXERCISE_LIBRARY_STORAGE_KEY)) return;
  saveWorkoutExerciseLibrary(defaultWorkoutExerciseLibrary());
}

function defaultWorkoutPlan() {
  return {
    mode: "week",
    titles: workoutTitlesForMode("week"),
    exercises: [
      ["Bench Press", "Dip", "Inclined Bench Press", "Fly", "", ""],
      ["T-Bar", "Lat Pulldown", "Seated Row", "Shrugs", "", ""],
      ["Squat", "Quad Ext", "Leg Press", "Seated Calf Raise", "", ""],
      ["Overhead Press", "Lat R Cable", "Lat R Dbb", "Inclined Crunch", "", ""],
      ["Deadlift", "Mesa Flexora", "Adutora", "Standing Calf Raise", "", ""],
      ["Biceps Curl", "Isolated Curl", "Hammer Curl", "Triceps Extension", "", ""],
      ["", "", "", "", "", ""],
    ],
  };
}

function normalizeWorkoutPlan(plan) {
  const normalized = plan && typeof plan === "object" ? plan : {};
  const mode = normalized.mode === "sessions" ? "sessions" : "week";
  const titles = workoutTitlesForMode(mode);
  const exercises = Array.isArray(normalized.exercises)
    ? normalized.exercises
    : defaultWorkoutPlan().exercises;

  const cols = titles.length;
  const rows = 6;
  const out = Array.from({ length: cols }, (_, c) => {
    const col = Array.isArray(exercises[c]) ? exercises[c] : [];
    return Array.from({ length: rows }, (_, r) => String(col[r] ?? ""));
  });

  return { mode, titles, exercises: out };
}

function loadWorkoutPlan() {
  const raw = localStorage.getItem(WORKOUT_PLAN_STORAGE_KEY);
  if (!raw) return defaultWorkoutPlan();
  try {
    return normalizeWorkoutPlan(JSON.parse(raw));
  } catch (_) {
    return defaultWorkoutPlan();
  }
}

function saveWorkoutPlan(plan) {
  localStorage.setItem(
    WORKOUT_PLAN_STORAGE_KEY,
    JSON.stringify(normalizeWorkoutPlan(plan)),
  );
}

function isWorkoutBackendActive() {
  return Boolean(backendState.client && backendState.session && workoutRemoteState.loaded);
}

function workoutExerciseNameKey(name) {
  return String(name || "").trim().toLocaleLowerCase();
}

async function ensureBackendWorkoutPlan() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");

  let plan = throwIfSupabaseError(
    await backendState.client
      .from("workout_plans")
      .select("id, mode")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  );

  if (!plan) {
    plan = throwIfSupabaseError(
      await backendState.client
        .from("workout_plans")
        .insert({ user_id: userId, mode: loadWorkoutPlan().mode, title: "Main" })
        .select("id, mode")
        .single(),
    );
  }

  workoutRemoteState.planId = plan.id;
  return plan.id;
}

async function upsertBackendWorkoutExercise(name) {
  const userId = getBackendUserId();
  const cleanName = String(name || "").trim();
  if (!backendState.client || !userId || !cleanName) return "";

  const row = throwIfSupabaseError(
    await backendState.client
      .from("workout_exercises")
      .upsert(
        {
          user_id: userId,
          name: cleanName,
          archived_at: null,
        },
        { onConflict: "user_id,name" },
      )
      .select("id, name")
      .single(),
  );
  workoutRemoteState.exerciseIdsByName[workoutExerciseNameKey(row.name)] = row.id;
  return row.id;
}

async function syncBackendWorkoutLibrary(library) {
  for (const name of library) {
    await upsertBackendWorkoutExercise(name);
  }
}

async function saveBackendWorkoutPlanMode(mode) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !workoutRemoteState.planId) return;
  throwIfSupabaseError(
    await backendState.client
      .from("workout_plans")
      .update({ mode })
      .eq("user_id", userId)
      .eq("id", workoutRemoteState.planId),
  );
}

async function saveBackendWorkoutSlot(col, row, exerciseName, plan) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !workoutRemoteState.planId) return;
  const cleanName = String(exerciseName || "").trim();
  const slotLabel = plan?.titles?.[col] || "";

  if (!cleanName) {
    throwIfSupabaseError(
      await backendState.client
        .from("workout_plan_slots")
        .delete()
        .eq("user_id", userId)
        .eq("workout_plan_id", workoutRemoteState.planId)
        .eq("column_index", col)
        .eq("row_index", row),
    );
    return;
  }

  const exerciseId = await upsertBackendWorkoutExercise(cleanName);
  throwIfSupabaseError(
    await backendState.client.from("workout_plan_slots").upsert(
      {
        user_id: userId,
        workout_plan_id: workoutRemoteState.planId,
        column_index: col,
        row_index: row,
        slot_label: slotLabel,
        exercise_id: exerciseId || null,
        exercise_name: cleanName,
      },
      { onConflict: "user_id,workout_plan_id,column_index,row_index" },
    ),
  );
}

async function syncBackendWorkoutPlan(plan) {
  await saveBackendWorkoutPlanMode(plan.mode);
  for (let c = 0; c < plan.exercises.length; c++) {
    for (let r = 0; r < 6; r++) {
      await saveBackendWorkoutSlot(c, r, plan.exercises[c][r], plan);
    }
  }
}

async function importWorkoutLocalDataOnce() {
  if (hasBackendImportCompleted(WORKOUT_IMPORT_SCOPE)) return;
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  await ensureBackendWorkoutPlan();
  const library = saveWorkoutExerciseLibrary(loadWorkoutExerciseLibrary());
  await syncBackendWorkoutLibrary(library);
  await syncBackendWorkoutPlan(loadWorkoutPlan());
  markBackendImportCompleted(WORKOUT_IMPORT_SCOPE);
}

async function loadWorkoutBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    workoutRemoteState.loaded = false;
    return;
  }

  const planId = await ensureBackendWorkoutPlan();
  const exerciseRows = throwIfSupabaseError(
    await backendState.client
      .from("workout_exercises")
      .select("id, name")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("name", { ascending: true }),
  );
  workoutRemoteState.exerciseIdsByName = {};
  const library = (exerciseRows || [])
    .map((row) => {
      workoutRemoteState.exerciseIdsByName[workoutExerciseNameKey(row.name)] = row.id;
      return row.name;
    })
    .filter(Boolean);

  const planRow = throwIfSupabaseError(
    await backendState.client
      .from("workout_plans")
      .select("mode")
      .eq("user_id", userId)
      .eq("id", planId)
      .single(),
  );
  const slotRows = throwIfSupabaseError(
    await backendState.client
      .from("workout_plan_slots")
      .select("column_index, row_index, exercise_name")
      .eq("user_id", userId)
      .eq("workout_plan_id", planId),
  );

  const planMode = planRow?.mode === "sessions" ? "sessions" : "week";
  const plan = normalizeWorkoutPlan({
    mode: planMode,
    exercises: Array.from(
      { length: workoutTitlesForMode(planMode).length },
      () => Array.from({ length: 6 }, () => ""),
    ),
  });
  (slotRows || []).forEach((slot) => {
    const col = Number(slot.column_index);
    const row = Number(slot.row_index);
    if (col < 0 || col >= plan.exercises.length || row < 0 || row > 5) return;
    plan.exercises[col][row] = String(slot.exercise_name || "");
  });

  if (library.length > 0) saveWorkoutExerciseLibrary(library);
  saveWorkoutPlan(plan);
  workoutRemoteState.loaded = true;
}

async function saveWorkoutPlanWithBackend(plan) {
  const normalized = normalizeWorkoutPlan(plan);
  saveWorkoutPlan(normalized);
  if (!isWorkoutBackendActive()) return;
  try {
    await syncBackendWorkoutPlan(normalized);
  } catch (error) {
    console.error("Workout DB plan sync error:", error);
  }
}

async function saveWorkoutLibraryWithBackend(list) {
  const library = saveWorkoutExerciseLibrary(list);
  if (isWorkoutBackendActive()) {
    try {
      await syncBackendWorkoutLibrary(library);
    } catch (error) {
      console.error("Workout DB library sync error:", error);
    }
  }
  return library;
}

function loadLastSavedWorkoutPlan() {
  const raw = localStorage.getItem(WORKOUT_PLAN_SAVED_KEY);
  if (!raw) return defaultWorkoutPlan();
  try {
    return normalizeWorkoutPlan(JSON.parse(raw));
  } catch (_) {
    return defaultWorkoutPlan();
  }
}

function saveWorkoutSnapshot() {
  const plan = loadWorkoutPlan();
  localStorage.setItem(
    WORKOUT_PLAN_SAVED_KEY,
    JSON.stringify(normalizeWorkoutPlan(plan)),
  );
}

function renderWorkout() {
  if (typeof renderWorkoutV2 === "function") {
    renderWorkoutV2();
    return;
  }
  const mount = document.getElementById("workoutTableDiv");
  if (!mount) return;

  migrateWorkoutSavedSnapshotOnce();
  ensureWorkoutExerciseLibrarySeeded();
  const library = loadWorkoutExerciseLibrary();
  const plan = loadWorkoutPlan();
  mount.innerHTML = `
    <div class="workoutToolbar">
      <button type="button" class="workoutBtn" id="workoutToggleModeBtn"></button>
      <button type="button" class="workoutBtn" id="workoutSaveBtn">Save</button>
      <button type="button" class="workoutBtn" id="workoutResetBtn">Reset</button>
      <span class="workoutSpacer"></span>
      <label class="workoutAddLabel" for="workoutNewExercise">Add exercise</label>
      <input type="text" class="workoutAddInput" id="workoutNewExercise" placeholder="e.g. Pull-up" />
      <button type="button" class="workoutBtn" id="workoutAddExerciseBtn">Add</button>
    </div>
    <div class="workoutTableScroll">
      <table class="workoutTable" id="workoutTable"></table>
    </div>
  `;

  const toggleBtn = document.getElementById("workoutToggleModeBtn");
  const saveBtn = document.getElementById("workoutSaveBtn");
  const resetBtn = document.getElementById("workoutResetBtn");
  const addBtn = document.getElementById("workoutAddExerciseBtn");
  const addInput = document.getElementById("workoutNewExercise");
  const table = document.getElementById("workoutTable");
  if (!toggleBtn || !saveBtn || !resetBtn || !addBtn || !addInput || !table) return;

  toggleBtn.textContent =
    plan.mode === "week" ? "Switch to A–F" : "Switch to weekdays";
  toggleBtn.addEventListener("click", async () => {
    const current = loadWorkoutPlan();
    const next = current.mode === "week" ? "sessions" : "week";
    await saveWorkoutPlanWithBackend({ ...current, mode: next });
    renderWorkout();
  });

  saveBtn.addEventListener("click", () => {
    saveWorkoutSnapshot();
  });

  resetBtn.addEventListener("click", async () => {
    await saveWorkoutPlanWithBackend(loadLastSavedWorkoutPlan());
    renderWorkout();
  });

  addBtn.addEventListener("click", async () => {
    const name = String(addInput.value || "").trim();
    if (!name) return;
    await saveWorkoutLibraryWithBackend([...loadWorkoutExerciseLibrary(), name]);
    addInput.value = "";
    // Keep current selections, just refresh options
    renderWorkout();
  });
  addInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addBtn.click();
  });

  const header = document.createElement("tr");
  for (let c = 0; c < plan.titles.length; c++) {
    const th = document.createElement("th");
    th.textContent = plan.titles[c] || "";
    header.appendChild(th);
  }
  table.appendChild(header);

  for (let r = 0; r < 6; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < plan.titles.length; c++) {
      const td = document.createElement("td");
      const select = document.createElement("select");
      select.className = "workoutCell";
      select.setAttribute("data-col", String(c));
      select.setAttribute("data-row", String(r));

      const current = String(plan.exercises[c][r] || "");
      const options = ["", ...library];
      if (current && !options.includes(current)) options.splice(1, 0, current);

      for (const optValue of options) {
        const opt = document.createElement("option");
        opt.value = optValue;
        opt.textContent = optValue || "—";
        if (optValue === current) opt.selected = true;
        select.appendChild(opt);
      }

      select.addEventListener("change", async () => {
        const col = Number(select.getAttribute("data-col"));
        const row = Number(select.getAttribute("data-row"));
        const latest = loadWorkoutPlan();
        latest.exercises[col][row] = select.value;
        saveWorkoutPlan(latest);
        if (isWorkoutBackendActive()) {
          try {
            await saveBackendWorkoutSlot(col, row, select.value, latest);
          } catch (error) {
            console.error("Workout DB slot sync error:", error);
          }
        }
      });
      td.appendChild(select);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

document.addEventListener("DOMContentLoaded", renderWorkout);

// APP MENU (START BUTTON)

document.addEventListener("DOMContentLoaded", hideAppMenu);

function hideAppMenu() {
  const appMenu = document.getElementById("appMenu");

  appMenu.style.display = appMenu.style.display === "none" ? "block" : "none";
  appMenu.style.position = "absolute";
  appMenu.style.bottom = "22px";
  appMenu.style.left = "-12px";
}

function clickStart() {
  const startBtn = document.getElementById("startBtn");

  if (startBtn.style.borderWidth) {
    startBtn.style = "";
  } else {
    startBtn.style.borderWidth = "2px";
    startBtn.style.borderRightColor = "#EEEEEE";
    startBtn.style.borderLeftColor = "#222222";
    startBtn.style.borderBottomColor = "#EEEEEE";
    startBtn.style.borderTopColor = "#222222";
  }
}

function hideQuadro(idQuadro) {
  const quadro = document.getElementById(`${idQuadro}`);
  if (!quadro) return;
  const opening = window.getComputedStyle(quadro).display === "none";
  const flexQuadros = ["chatContainer", "workoutContainer", "notesContainer", "contentContainer", "plannerContainer"];
  quadro.style.display = opening
    ? (flexQuadros.includes(idQuadro) ? "flex" : "block")
    : "none";
  if (opening) {
    void syncFeatureForContainer(idQuadro);
  }
  if (opening && idQuadro === "skillsContainer") {
    scheduleGamifyCalendarRender();
  }
  if (opening && idQuadro === "contentContainer") {
    scheduleContentBoardRender();
  }
  if (opening && idQuadro === "chatContainer") {
    requestAnimationFrame(() => {
      const messagesDiv = document.getElementById("chatMessages");
      if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  }
}

// CALENDAR GENERATOR

const CALENDAR_NOTES_STORAGE_KEY = "calendarDayNotes";
const CALENDAR_IMPORT_SCOPE = "calendar_notes_v1";
const calendarRemoteState = {
  loaded: false,
  notes: {},
};

function calendarDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function normalizeCalendarNotes(rawNotes) {
  const source = rawNotes && typeof rawNotes === "object" && !Array.isArray(rawNotes) ? rawNotes : {};
  const notes = {};
  Object.entries(source).forEach(([dateKey, note]) => {
    const text = typeof note === "string" ? note.trim() : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && text) {
      notes[dateKey] = text;
    }
  });
  return notes;
}

function getLocalCalendarNotes() {
  try {
    return normalizeCalendarNotes(JSON.parse(localStorage.getItem(CALENDAR_NOTES_STORAGE_KEY)));
  } catch {
    return {};
  }
}

function setLocalCalendarNotes(notes) {
  localStorage.setItem(CALENDAR_NOTES_STORAGE_KEY, JSON.stringify(normalizeCalendarNotes(notes)));
}

function isCalendarBackendActive() {
  return Boolean(backendState.client && backendState.session && calendarRemoteState.loaded);
}

function getCalendarNotes() {
  return isCalendarBackendActive() ? calendarRemoteState.notes : getLocalCalendarNotes();
}

function setCalendarNoteInState(dateKey, text) {
  const notes = getCalendarNotes();
  const t = (text || "").trim();
  if (!t) delete notes[dateKey];
  else notes[dateKey] = t;

  if (isCalendarBackendActive()) {
    calendarRemoteState.notes = notes;
  } else {
    setLocalCalendarNotes(notes);
  }
}

async function saveBackendCalendarNote(dateKey, text) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");
  const trimmed = (text || "").trim();

  if (!trimmed) {
    throwIfSupabaseError(
      await backendState.client
        .from("calendar_notes")
        .delete()
        .eq("user_id", userId)
        .eq("note_date", dateKey),
    );
    return;
  }

  throwIfSupabaseError(
    await backendState.client.from("calendar_notes").upsert(
      {
        user_id: userId,
        note_date: dateKey,
        note: trimmed,
      },
      { onConflict: "user_id,note_date" },
    ),
  );
}

async function setCalendarNote(dateKey, text) {
  const trimmed = (text || "").trim();
  if (isCalendarBackendActive()) {
    try {
      await saveBackendCalendarNote(dateKey, trimmed);
      setCalendarNoteInState(dateKey, trimmed);
      return;
    } catch (error) {
      console.error("Calendar note DB save error:", error);
      const notes = getLocalCalendarNotes();
      if (trimmed) notes[dateKey] = trimmed;
      else delete notes[dateKey];
      setLocalCalendarNotes(notes);
      setCalendarNoteInState(dateKey, trimmed);
      return;
    }
  }

  setCalendarNoteInState(dateKey, trimmed);
}

async function importCalendarLocalDataOnce() {
  if (hasBackendImportCompleted(CALENDAR_IMPORT_SCOPE)) return;
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  const notes = getLocalCalendarNotes();
  for (const [dateKey, note] of Object.entries(notes)) {
    await saveBackendCalendarNote(dateKey, note);
  }

  markBackendImportCompleted(CALENDAR_IMPORT_SCOPE);
}

async function loadCalendarBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    calendarRemoteState.loaded = false;
    return;
  }

  const rows = throwIfSupabaseError(
    await backendState.client
      .from("calendar_notes")
      .select("note_date, note")
      .eq("user_id", userId)
      .order("note_date", { ascending: true }),
  );

  calendarRemoteState.notes = normalizeCalendarNotes(
    Object.fromEntries((rows || []).map((row) => [row.note_date, row.note])),
  );
  calendarRemoteState.loaded = true;
}

function generateCalendar(
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
) {
  const currentDate = new Date(year, month);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // DEFINE MONTH TITLE
  const monthTitle = document.getElementById("calendarTitle");
  const options = {
    year: "numeric",
    month: "long",
  };

  const monthAndYear = currentDate.toLocaleDateString("pt-BR", options);
  monthTitle.textContent = `Calendário: ${monthAndYear}`;

  // Get the first day and last day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const notesMap = getCalendarNotes();
  const todayRef = new Date();
  todayRef.setHours(0, 0, 0, 0);

  // Create the table element
  const table = document.createElement("table");
  table.id = "calendar";

  // Add navigation buttons
  const navigation = document.createElement("div");
  navigation.className = "calendar-navigation";

  const prevButton = document.createElement("button");
  prevButton.textContent = "←";
  prevButton.onclick = () => {
    generateCalendar(currentYear, currentMonth - 1);
  };

  const nextButton = document.createElement("button");
  nextButton.textContent = "→";
  nextButton.onclick = () => {
    generateCalendar(currentYear, currentMonth + 1);
  };

  navigation.appendChild(prevButton);
  navigation.appendChild(nextButton);

  // Create the header row with day names
  const headerRow = table.insertRow();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  daysOfWeek.forEach((day) => {
    const th = document.createElement("th");
    th.textContent = day;
    headerRow.appendChild(th);
  });

  // Create the days of the month
  let currentDatePointer = new Date(firstDay);
  currentDatePointer.setDate(1 - firstDay.getDay());

  while (currentDatePointer <= lastDay) {
    const row = table.insertRow();

    for (let i = 0; i < 7; i++) {
      const cell = row.insertCell();
      const d = currentDatePointer.getDate();
      const m = currentDatePointer.getMonth();
      const y = currentDatePointer.getFullYear();

      if (m === currentMonth) {
        cell.classList.add("calendar-day-in-month");
        cell.textContent = d;
        const dateKey = calendarDateKey(y, m, d);
        cell.dataset.dateKey = dateKey;
        cell.id = `dia${d}`;

        if (
          y === todayRef.getFullYear() &&
          m === todayRef.getMonth() &&
          d === todayRef.getDate()
        ) {
          cell.classList.add("calendar-day-today");
        }

        const note = notesMap[dateKey];
        if (note) {
          cell.classList.add("calendar-day-has-note");
          cell.title = note;
        } else {
          cell.title = "Click to add a note";
        }

        cell.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          const cur = getCalendarNotes()[dateKey] || "";
          const next = prompt(`Note for ${dateKey}:`, cur);
          if (next === null) return;
          await setCalendarNote(dateKey, next);
          generateCalendar(currentYear, currentMonth);
        });
      } else {
        cell.textContent = d;
        cell.style.color = "#888";
      }
      currentDatePointer.setDate(currentDatePointer.getDate() + 1);
    }
  }

  // Append everything to the weekGraph div
  const weekGraph = document.getElementById("weekGraph");
  weekGraph.innerHTML = "";
  weekGraph.appendChild(navigation);
  weekGraph.appendChild(table);
}

// CALCULATOR
function toDisplay(value) {
  document.getElementById("display").value = value;
}

function appendToDisplay(value) {
  document.getElementById("display").value += value;
}

function clearDisplay() {
  document.getElementById("display").value = "";
}

function calculate() {
  try {
    document.getElementById("display").value = eval(
      document.getElementById("display").value,
    );
  } catch (error) {
    document.getElementById("display").value = "Error";
  }
}

const wallp = document.getElementById("selectWallp");

wallp.addEventListener("change", async () => {
  const wallpsPairs = {
    0: "windowsgreen",
    1: "98color",
    2: "clouds",
    3: "janeiro",
    4: "fevereiro",
    5: "marco",
    6: "abril",
    7: "maio",
    8: "junho",
    9: "julho",
    10: "agosto",
    11: "setembro",
    12: "outubro",
    13: "novembro",
    14: "dezembro",
  };

  const chosenWallp = wallp.value;
  const backgroundImage = document.getElementById("bgContainer");
  const wallpSelected =
    (backgroundImage.style.backgroundImage = `url("./imagens/${wallpsPairs[chosenWallp]}.jpg")`);

  setLocalWallpaper(wallpSelected);
  await saveBackendUserSettings({ wallpaper: wallpSelected });
});

function hideAppMenu2() {
  const appMenu = document.getElementById("appMenu");

  appMenu.style.display = "none";
}

async function addDaily() {
  const dailyInputEl = document.getElementById("dailyInput");
  const dailySkillEl = document.getElementById("dailySkillSelect");
  if (!dailyInputEl) return;
  const text = dailyInputEl.value.trim();
  if (!text) return;

  const skillCode = normalizeDailySkillCode(dailySkillEl?.value || "");
  const daily = {
    id: makeLocalTaskId(),
    text,
    source: "local",
    skillCode,
    sortOrder: getNextDailySortOrder(),
    dailyDoneOn: "",
    createdAt: new Date().toISOString(),
  };

  if (isTaskBackendActive()) {
    try {
      const row = await createBackendTask({
        text,
        taskType: TASK_TYPE_DAILY,
        source: daily.source,
        skillCode,
        sortOrder: daily.sortOrder,
        createdAt: daily.createdAt,
      });
      daily.id = row.id;
      daily.createdAt = row.created_at;
      daily.sortOrder = normalizeTaskSortOrder(row.sort_order);
      daily.skillCode = normalizeDailySkillCode(row.skill_code) || skillCode;
      taskRemoteState.dailies.push(daily);
      setDailiesStatus(`Saved daily "${text}".`);
    } catch (error) {
      console.error("Daily save error:", error);
      const dailies = getLocalDailyList();
      dailies.push(daily);
      setLocalDailyList(dailies);
      taskRemoteState.dailies.push(daily);
      setDailiesStatus(`DB failed; saved daily locally: ${describeBackendError(error)}`);
    }
  } else {
    const dailies = getLocalDailyList();
    dailies.push(daily);
    setLocalDailyList(dailies);
    setDailiesStatus(`Saved locally: "${text}".`);
  }

  renderDailies();
  dailyInputEl.value = "";
  if (dailySkillEl) dailySkillEl.value = "";
}

async function removeDaily(taskId) {
  const daily = getDailyTasks().find((item) => item.id === taskId);
  if (!daily) return;

  if (isTaskBackendActive()) {
    try {
      await deleteBackendTask(taskId);
      taskRemoteState.dailies = taskRemoteState.dailies.filter((item) => item.id !== taskId);
      renderDailies();
      setDailiesStatus(`Removed "${daily.text}".`);
    } catch (error) {
      console.error("Daily delete error:", error);
      setDailiesStatus(`Could not remove daily: ${describeBackendError(error)}`);
    }
    return;
  }

  const dailies = getLocalDailyList().filter((item) => item.id !== taskId);
  setLocalDailyList(dailies);
  renderDailies();
  setDailiesStatus(`Removed "${daily.text}".`);
}

function getSkillLabel(skillCode) {
  return skillCode && GAMIFY_SKILLS[skillCode] ? GAMIFY_SKILLS[skillCode].label : "";
}

function isSkillCompletedToday(skillCode) {
  const normalized = normalizeDailySkillCode(skillCode);
  if (!normalized) return false;
  const today = new Date();
  const boardState = getBoardStateSnapshot(
    normalized,
    today.getFullYear(),
    today.getMonth(),
  );
  return isGamifyDayDone(normalized, boardState[today.getDate()]);
}

function isDailyDoneToday(daily) {
  const today = new Date();
  return (
    typeof daily.dailyDoneOn === "string" &&
    daily.dailyDoneOn === trackerDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );
}

function getDailyActionState(daily) {
  const historyDone = isSkillCompletedToday(daily.skillCode);
  const doneToday = isDailyDoneToday(daily);
  const needsHistorySync = Boolean(daily.skillCode) && !historyDone;

  if (!needsHistorySync && doneToday) {
    return { label: "Done today ✓", disabled: true, stateText: "Status: completed today" };
  }
  if (needsHistorySync) {
    return { label: "Save history", disabled: false, stateText: "Status: history pending" };
  }
  return { label: "Done today", disabled: false, stateText: "Status: pending today" };
}

function setDailyCompletionStateLocally(taskId, patch) {
  if (isTaskBackendActive()) {
    taskRemoteState.dailies = taskRemoteState.dailies.map((daily) =>
      daily.id === taskId ? { ...daily, ...patch } : daily,
    );
    return;
  }
  const nextDailies = getLocalDailyList().map((daily) =>
    daily.id === taskId ? normalizeLocalDailyEntry({ ...daily, ...patch }) : daily,
  );
  setLocalDailyList(nextDailies);
}

function getDailyHistoryTargetValue(skillCode, currentValue) {
  if (skillCode === "fitness") return fitnessTrainingFromValue(currentValue) || "A";
  if (skillCode === "standup") return Math.max(1, Number(currentValue) || 0);
  return isGamifyDayDone(skillCode, currentValue) ? currentValue : 1;
}

async function syncDailyHistoryForToday(daily) {
  const skillCode = normalizeDailySkillCode(daily.skillCode);
  if (!skillCode) return false;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const boardState = getBoardStateSnapshot(skillCode, year, month);
  const currentValue = boardState[day];
  const nextValue = getDailyHistoryTargetValue(skillCode, currentValue);
  if (nextValue === currentValue) return false;

  boardState[day] = nextValue;
  saveBoardState(skillCode, year, month, boardState);
  await syncTrackerDayValue("skill", skillCode, year, month, day, nextValue);
  if (skillCode === "standup") recalculateGamifySkillXp(skillCode);
  else if (!isGamifyDayDone(skillCode, currentValue) && isGamifyDayDone(skillCode, nextValue)) {
    upXp(skillCode);
  }
  renderTrackerBackedUi();
  return true;
}

async function markDailyDoneToday(daily, year, month, day) {
  const doneOn = trackerDateKey(year, month, day);
  if (isTaskBackendActive()) {
    await updateBackendTask(daily.id, { daily_done_on: doneOn });
  }
  setDailyCompletionStateLocally(daily.id, { dailyDoneOn: doneOn });
}

async function setDailyDescription(daily, text) {
  const next = typeof text === "string" ? text.trim() : "";

  if (isTaskBackendActive()) {
    try {
      await updateBackendTask(daily.id, { description: next || null });
    } catch (error) {
      console.error("Daily description save error:", error);
      setDailiesStatus(`Could not save the note: ${describeBackendError(error)}`);
      return;
    }
  }

  setDailyCompletionStateLocally(daily.id, { description: next });
  renderDailies();
  setDailiesStatus(
    next ? `Note saved on "${daily.text}".` : `Note cleared on "${daily.text}".`,
  );
}

function editDailyDescription(daily) {
  const current = typeof daily.description === "string" ? daily.description : "";
  const next = prompt(`Done means, for "${daily.text}":`, current);
  if (next === null) return;
  void setDailyDescription(daily, next);
}

async function completeDaily(taskId, buttonEl) {
  const daily = getDailyTasks().find((item) => item.id === taskId);
  if (!daily) return;
  if (buttonEl) buttonEl.disabled = true;

  const historyDone = isSkillCompletedToday(daily.skillCode);
  const doneToday = isDailyDoneToday(daily);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  if (historyDone && doneToday) {
    setDailiesStatus(`"${daily.text}" was already done today.`);
    if (buttonEl) buttonEl.disabled = false;
    return;
  }

  try {
    if (!historyDone && daily.skillCode === "fitness" && typeof handleWorkoutGamifyDay === "function") {
      await handleWorkoutGamifyDay(year, month, day);
      setDailiesStatus(`Import today's Strong workout before scoring "${daily.text}".`);
      if (buttonEl) buttonEl.disabled = false;
      return;
    }
    if (!historyDone && daily.skillCode) {
      await syncDailyHistoryForToday(daily);
    }
    await markDailyDoneToday(daily, year, month, day);
    renderDailies();
    setDailiesStatus(`Done: "${daily.text}".`);
  } catch (error) {
    console.error("Daily completion error:", error);
    setDailiesStatus(
      `Failed to update "${daily.text}": ${error instanceof Error ? error.message : String(error)}`,
    );
    if (buttonEl) buttonEl.disabled = false;
    renderDailies();
  }
}

function renderDailies() {
  const dailiesList = document.getElementById("dailiesList");
  if (!dailiesList) return;
  dailiesList.innerHTML = "";

  const dailies = [...getDailyTasks()].sort(
    (a, b) => normalizeTaskSortOrder(a.sortOrder) - normalizeTaskSortOrder(b.sortOrder),
  );

  if (dailies.length === 0) {
    const li = document.createElement("li");
    li.className = "todo-task-item";
    li.textContent = "No dailies yet. Add one below.";
    dailiesList.appendChild(li);
    return;
  }

  dailies.forEach((daily) => {
    const li = document.createElement("li");
    li.className = "todo-task-item";

    const main = document.createElement("div");
    main.className = "todo-task-main";

    const text = document.createElement("span");
    text.className = "todo-task-text";
    text.textContent = daily.text;

    const actionState = getDailyActionState(daily);
    if (actionState.disabled && actionState.label === "Done today ✓") {
      text.classList.add("todo-task-text--done");
    } else if (actionState.label === "Save history") {
      text.classList.add("todo-task-text--desynced");
    }
    const titleRow = document.createElement("div");
    titleRow.className = "todo-task-title-row";
    titleRow.appendChild(text);

    if (daily.skillCode) {
      const skillBadge = document.createElement("span");
      skillBadge.className = "todo-task-badge todo-task-badge--skill";
      skillBadge.textContent = getSkillLabel(daily.skillCode);
      titleRow.appendChild(skillBadge);
    }

    main.appendChild(titleRow);

    if (daily.description) {
      const description = document.createElement("p");
      description.className = "todo-task-description";
      description.textContent = daily.description;
      main.appendChild(description);
    }

    const actions = document.createElement("div");
    actions.className = "todo-task-actions";

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "todo-task-done";
    doneButton.textContent = actionState.label;
    doneButton.disabled = actionState.disabled;
    doneButton.addEventListener("click", function () {
      void completeDaily(daily.id, doneButton);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "todo-task-remove";
    removeButton.textContent = "x";
    removeButton.addEventListener("click", function () {
      void removeDaily(daily.id);
    });

    const noteButton = document.createElement("button");
    noteButton.type = "button";
    noteButton.className = "todo-task-note";
    noteButton.textContent = "note";
    noteButton.title = daily.description
      ? "Edit what done means for this daily"
      : "Say what done means for this daily";
    noteButton.addEventListener("click", function () {
      editDailyDescription(daily);
    });

    actions.appendChild(doneButton);
    actions.appendChild(noteButton);
    actions.appendChild(removeButton);
    li.appendChild(main);
    li.appendChild(actions);
    li.title = actionState.stateText;
    dailiesList.appendChild(li);
  });
}

// Call renderDailies on page load to display any existing dailies
document.addEventListener("DOMContentLoaded", renderDailies);

// CONTENT BOARD ------------------------------------------------------------
// The month board is READ-ONLY and lives in content-projection.js: it draws
// data/projection.json, which the CLI exports from the contentflow ledger.
// The old local + Supabase toggle board was removed on purpose - the web
// face does not write (see AGENTS.md: one writer, the will CLI).

const LOCAL_WORKER_PROXY_DEFAULT = "http://127.0.0.1:8787";

function getWorkerBaseUrl() {
  if (typeof LOCAL_PROXY_BASE_URL === "string" && LOCAL_PROXY_BASE_URL.trim()) {
    return LOCAL_PROXY_BASE_URL.trim().replace(/\/+$/, "");
  }
  return LOCAL_WORKER_PROXY_DEFAULT;
}

function getWorkerProxyBaseUrl() {
  return getWorkerBaseUrl();
}

function setDailiesStatus(message) {
  const status = document.getElementById("dailiesStatus");
  if (!status) return;
  status.textContent = message;
}


document.addEventListener("DOMContentLoaded", function () {
  const dailyInput = document.getElementById("dailyInput");
  if (dailyInput) {
    dailyInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") addDaily();
    });
  }
  setDailiesStatus("Ready.");
});
// IDEAS (Video + Joke) - owned locally by Startpage

const IDEA_VIDEOS_STORAGE_KEY = "ideaVideosList";
const IDEA_JOKES_STORAGE_KEY = "ideaJokesList";

function setIdeasSyncStatus(message) {
  const status = document.getElementById("ideasSyncStatus");
  if (status) status.textContent = message;
}

function getVideoIdeas() {
  return getLocalTextList(IDEA_VIDEOS_STORAGE_KEY, "vididea");
}

function setVideoIdeas(items) {
  setLocalTextList(IDEA_VIDEOS_STORAGE_KEY, "vididea", items);
}

function getJokeIdeas() {
  return getLocalTextList(IDEA_JOKES_STORAGE_KEY, "jokeidea");
}

function setJokeIdeas(items) {
  setLocalTextList(IDEA_JOKES_STORAGE_KEY, "jokeidea", items);
}

function renderIdeas() {
  renderTextList("videoIdeaList", getVideoIdeas(), removeVideoIdea);
  renderTextList("jokeIdeaList", getJokeIdeas(), removeJokeIdea);
}

function addIdea(category) {
  const isVideo = category === "video";
  const input = document.getElementById(isVideo ? "videoIdeaInput" : "jokeIdeaInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const item = {
    id: makeLocalListItemId(isVideo ? "vididea" : "jokeidea"),
    text,
    createdAt: new Date().toISOString(),
  };
  const items = isVideo ? getVideoIdeas() : getJokeIdeas();
  items.push(item);
  if (isVideo) setVideoIdeas(items);
  else setJokeIdeas(items);
  renderIdeas();
  input.value = "";
  setIdeasSyncStatus(`Saved "${text}".`);
}

function addVideoIdea() {
  addIdea("video");
}

function addJokeIdea() {
  addIdea("joke");
}

function removeIdea(category, itemId) {
  const isVideo = category === "video";
  const items = isVideo ? getVideoIdeas() : getJokeIdeas();
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) return;

  const remaining = items.filter((candidate) => candidate.id !== itemId);
  if (isVideo) setVideoIdeas(remaining);
  else setJokeIdeas(remaining);
  renderIdeas();
  setIdeasSyncStatus(`Removed "${item.text}".`);
}

function removeVideoIdea(itemId) {
  removeIdea("video", itemId);
}

function removeJokeIdea(itemId) {
  removeIdea("joke", itemId);
}

document.addEventListener("DOMContentLoaded", function () {
  renderIdeas();

  const videoInput = document.getElementById("videoIdeaInput");
  if (videoInput) {
    videoInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") addVideoIdea();
    });
  }

  const jokeInput = document.getElementById("jokeIdeaInput");
  if (jokeInput) {
    jokeInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") addJokeIdea();
    });
  }
});

// NOTES
// The Notes window is READ-ONLY and lives in notes-projection.js: it draws
// data/notes.json, exported by `will export` from the will notes store.
// The old in-page editor (notes_sections via Supabase, titles + textareas) was
// removed on purpose - capture happens in the terminal: `will note "..."`.

/*DRAFT OF GENERIC FUNCTION FOR UP SKIL

function skillUpXp(skill){ 
	startTimer(2, function(skill) {

	if (localStorage.getItem(`${skill} + Count`) === null || localStorage.getItem(`${skill} + Count`) === undefined) {
		let skillCount = 1;
		localStorage.setItem(`${skill} + Count`, skillCount);
	        contentMeter.value = skillCount;
	} else {
		const originalCount = localStorage.getItem(`${skill} + Count`);
		let skillCount = originalCount;
		skillCount++;
		localStorage.setItem(`${skill} + Count`, skillCount);
		contentMeter.value = skillCount;
	}
});

};
*/

document.addEventListener("DOMContentLoaded", function () {
  updateDailyCounter("coding");
  updateDailyCounter("content");
  updateDailyCounter("fitness");
  updateDailyCounter("standup");
  updateDailyCounter("meditation");
  initGamifyStreakCalendar();
});

/** Board state month suffixes use one-based calendar months: January=1, May=5. */
function monthKeyVariants(year, month) {
  const n = month + 1;
  const legacy = `${year}-${n}`;
  const padded = `${year}-${String(n).padStart(2, "0")}`;
  return legacy === padded ? [legacy] : [legacy, padded];
}

function boardStateStorageKey(skill, monthKeyStr) {
  return `${skill}BoardState_${monthKeyStr}`;
}

function safeParseBoardState(raw) {
  if (raw == null || raw === "") return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (_) {}
  return {};
}

function getBoardStateSnapshot(skill, year, month) {
  const merged = {};
  for (const v of monthKeyVariants(year, month)) {
    Object.assign(
      merged,
      safeParseBoardState(localStorage.getItem(boardStateStorageKey(skill, v))),
    );
  }
  return merged;
}

function saveBoardState(skill, year, month, boardState) {
  const variants = monthKeyVariants(year, month);
  const canonical = variants[0];
  localStorage.setItem(
    boardStateStorageKey(skill, canonical),
    JSON.stringify(boardState),
  );
  if (variants.length > 1) {
    localStorage.removeItem(boardStateStorageKey(skill, variants[1]));
  }
}

const GAMIFY_SKILLS = {
  coding: { label: "Coding", color: "#00c853" },
  content: { label: "Content", color: "#ff8a00" },
  fitness: { label: "Physique", color: "#00bcd4" },
  standup: { label: "Stand Up", color: "#ef5350" },
  meditation: { label: "Meditation", color: "#7e57c2" },
  jobhunting: { label: "Job Hunting", color: "#ffc107" },
};

const TRACKER_IMPORT_SCOPE = "trackers_v1";
const trackerRemoteState = {
  loaded: false,
  trackerIds: {},
};

function skillTrackerCode(skill) {
  return `skill:${skill}`;
}

function getTrackerDefinitions() {
  return Object.entries(GAMIFY_SKILLS).map(([skill, meta]) => ({
    code: skillTrackerCode(skill),
    kind: "skill",
    localCode: skill,
    label: meta.label,
    color: meta.color,
    dayMax: skill === "standup" ? 3 : skill === "fitness" ? 7 : 1,
  }));
}

function isTrackerBackendActive() {
  return Boolean(backendState.client && backendState.session && trackerRemoteState.loaded);
}

function isTrackerBackendWritable() {
  return Boolean(backendState.client && backendState.session);
}

function encodeTrackerValue(kind, localCode, value) {
  if (kind === "skill" && localCode === "fitness") {
    const training = fitnessTrainingFromValue(value);
    if (training === FITNESS_UNKNOWN_TRAINING) return 7;
    return training ? FITNESS_TRAINING_CYCLE.indexOf(training) + 1 : 0;
  }
  if (kind === "skill") return gamifyDayXpValue(localCode, value);
  return Math.max(0, Number(value) || 0);
}

function decodeTrackerValue(kind, localCode, value) {
  const n = Math.max(0, Number(value) || 0);
  if (kind === "skill" && localCode === "fitness") {
    if (n === 7) return FITNESS_UNKNOWN_TRAINING;
    return FITNESS_TRAINING_CYCLE[n - 1] || "";
  }
  return n;
}

async function ensureBackendTrackers() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");

  const ids = {};
  for (const tracker of getTrackerDefinitions()) {
    const row = throwIfSupabaseError(
      await backendState.client
        .from("trackers")
        .upsert(
          {
            user_id: userId,
            kind: tracker.kind,
            code: tracker.code,
            label: tracker.label,
            color: tracker.color,
            day_max: tracker.dayMax,
            is_active: true,
          },
          { onConflict: "user_id,code" },
        )
        .select("id, code")
        .single(),
    );
    ids[row.code] = row.id;
  }
  trackerRemoteState.trackerIds = ids;
  return ids;
}

function collectLocalTrackerEntries() {
  const entries = [];

  Object.keys(GAMIFY_SKILLS).forEach((skill) => {
    const prefix = `${skill}BoardState_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const monthParts = parseTrackerMonthKey(key.slice(prefix.length));
      if (!monthParts) continue;
      const boardState = safeParseBoardState(localStorage.getItem(key));
      Object.entries(boardState).forEach(([day, value]) => {
        const dayNumber = Number(day);
        if (!isValidTrackerDay(monthParts.year, monthParts.month, dayNumber)) return;
        const encoded = encodeTrackerValue("skill", skill, value);
        if (encoded <= 0) return;
        entries.push({
          trackerCode: skillTrackerCode(skill),
          dateKey: trackerDateKey(monthParts.year, monthParts.month, dayNumber),
          value: encoded,
        });
      });
    }
  });

  return entries;
}

async function importTrackerLocalDataOnce() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  const trackerIds = await ensureBackendTrackers();
  const entries = collectLocalTrackerEntries();
  for (const entry of entries) {
    const trackerId = trackerIds[entry.trackerCode];
    if (!trackerId) continue;
    throwIfSupabaseError(
      await backendState.client.from("tracker_daily_values").upsert(
        {
          user_id: userId,
          tracker_id: trackerId,
          tracked_on: entry.dateKey,
          value: entry.value,
        },
        { onConflict: "user_id,tracker_id,tracked_on" },
      ),
    );
  }

  if (!hasBackendImportCompleted(TRACKER_IMPORT_SCOPE)) {
    markBackendImportCompleted(TRACKER_IMPORT_SCOPE);
  }
}

function applyRemoteTrackerRowsToLocalStorage(rows, trackerCodesById) {
  const skillMonths = new Map();
  const definitions = new Map(getTrackerDefinitions().map((tracker) => [tracker.code, tracker]));

  (rows || []).forEach((row) => {
    const trackerCode = trackerCodesById[row.tracker_id];
    const definition = definitions.get(trackerCode);
    const date = parseTrackerDateKey(row.tracked_on);
    if (!definition || !date || !isValidTrackerDay(date.year, date.month, date.day)) return;

    const decoded = decodeTrackerValue(definition.kind, definition.localCode, row.value);
    if (!decoded) return;

    const key = `${definition.localCode}|${date.year}|${date.month}`;
    const monthEntry = skillMonths.get(key) || {
      year: date.year,
      month: date.month,
      boardState: {},
    };
    monthEntry.boardState[date.day] = decoded;
    skillMonths.set(key, monthEntry);
  });

  skillMonths.forEach((monthEntry, key) => {
    const [skill] = key.split("|");
    saveBoardState(skill, monthEntry.year, monthEntry.month, {
      ...getBoardStateSnapshot(skill, monthEntry.year, monthEntry.month),
      ...monthEntry.boardState,
    });
  });
}

async function loadTrackerBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    trackerRemoteState.loaded = false;
    return;
  }

  const trackerIds = await ensureBackendTrackers();
  const ids = Object.values(trackerIds);
  if (ids.length === 0) {
    trackerRemoteState.loaded = true;
    return;
  }

  const rows = throwIfSupabaseError(
    await backendState.client
      .from("tracker_daily_values")
      .select("tracker_id, tracked_on, value")
      .eq("user_id", userId)
      .in("tracker_id", ids),
  );
  const trackerCodesById = Object.fromEntries(
    Object.entries(trackerIds).map(([code, id]) => [id, code]),
  );
  applyRemoteTrackerRowsToLocalStorage(rows, trackerCodesById);
  trackerRemoteState.loaded = true;
}

async function syncTrackerDayValue(kind, localCode, year, month, day, rawValue) {
  if (!isTrackerBackendWritable()) return;
  const userId = getBackendUserId();
  const trackerCode = skillTrackerCode(localCode);
  if (!backendState.client || !userId) return;

  try {
    let trackerId = trackerRemoteState.trackerIds[trackerCode];
    if (!trackerId) {
      const trackerIds = await ensureBackendTrackers();
      trackerId = trackerIds[trackerCode];
    }
    if (!trackerId) throw new Error(`Tracker missing for ${trackerCode}`);

    const encoded = encodeTrackerValue(kind, localCode, rawValue);
    if (!isValidTrackerDay(year, month, day)) {
      throw new Error(`Invalid tracker date parts: ${year}-${month}-${day}`);
    }
    const dateKey = trackerDateKey(year, month, day);
    if (encoded <= 0) {
      throwIfSupabaseError(
        await backendState.client
          .from("tracker_daily_values")
          .delete()
          .eq("user_id", userId)
          .eq("tracker_id", trackerId)
          .eq("tracked_on", dateKey),
      );
      return;
    }

    throwIfSupabaseError(
      await backendState.client.from("tracker_daily_values").upsert(
        {
          user_id: userId,
          tracker_id: trackerId,
          tracked_on: dateKey,
          value: encoded,
        },
        { onConflict: "user_id,tracker_id,tracked_on" },
      ),
    );
  } catch (error) {
    console.error("Tracker DB sync error:", error);
  }
}

function renderTrackerBackedUi() {
  Object.keys(GAMIFY_SKILLS).forEach((skill) => {
    recalculateGamifySkillXp(skill);
    updateDailyCounter(skill);
  });
  renderGamifyStreakCalendar();
}

let gamifySelectedSkill = "coding";
let gamifyViewYear = new Date().getFullYear();
let gamifyViewMonth = new Date().getMonth();
const FITNESS_TRAINING_CYCLE = ["A", "B", "C", "D", "E", "F"];
const FITNESS_UNKNOWN_TRAINING = "__WORKOUT__";

function fitnessTrainingFromValue(value) {
  if (typeof value === "string") {
    const v = value.trim().toUpperCase();
    if (FITNESS_TRAINING_CYCLE.includes(v)) return v;
    if (v === FITNESS_UNKNOWN_TRAINING) return FITNESS_UNKNOWN_TRAINING;
  }
  const numeric = Number(value) || 0;
  if (numeric === 7) return FITNESS_UNKNOWN_TRAINING;
  if (numeric >= 1 && numeric <= FITNESS_TRAINING_CYCLE.length) {
    return FITNESS_TRAINING_CYCLE[numeric - 1];
  }
  return "";
}

function isGamifyDayDone(skill, value) {
  if (skill === "fitness") return fitnessTrainingFromValue(value) !== "";
  return (Number(value) || 0) > 0;
}

function getGamifyDayBadge(skill, value) {
  if (skill === "fitness") {
    const training = fitnessTrainingFromValue(value);
    return training === FITNESS_UNKNOWN_TRAINING ? "" : training;
  }
  if (skill === "standup") {
    const count = Number(value) || 0;
    return count > 0 ? String(count) : "";
  }
  return "";
}

function nextGamifyDayState(skill, value) {
  if (skill === "standup") {
    const current = Number(value) || 0;
    if (current >= 3) return null;
    return current + 1;
  }
  if (skill !== "fitness") return isGamifyDayDone(skill, value) ? null : 1;
  const current = fitnessTrainingFromValue(value);
  if (!current) return "A";
  const idx = FITNESS_TRAINING_CYCLE.indexOf(current);
  if (idx < 0) return "A";
  if (idx === FITNESS_TRAINING_CYCLE.length - 1) return null;
  return FITNESS_TRAINING_CYCLE[idx + 1];
}

function gamifyDayXpValue(skill, value) {
  if (skill === "fitness") return isGamifyDayDone(skill, value) ? 1 : 0;
  if (skill === "standup") return Math.max(0, Math.min(3, Number(value) || 0));
  return isGamifyDayDone(skill, value) ? 1 : 0;
}

function recalculateGamifySkillXp(skill) {
  let total = 0;
  const prefix = `${skill}BoardState_`;
  const monthStates = new Map();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const monthKey = key.slice(prefix.length).replace(/-(\d)$/, "-0$1");
    const boardState = monthStates.get(monthKey) || {};
    Object.assign(boardState, safeParseBoardState(localStorage.getItem(key)));
    monthStates.set(monthKey, boardState);
  }

  monthStates.forEach((boardState) => {
    Object.keys(boardState).forEach((day) => {
      total += gamifyDayXpValue(skill, boardState[day]);
    });
  });

  setSkillXp(skill, total);
}

function findDailyBySkillCode(skill) {
  const normalized = normalizeDailySkillCode(skill);
  if (!normalized) return null;
  return getDailyTasks().find((daily) => normalizeDailySkillCode(daily.skillCode) === normalized) || null;
}

async function syncMappedDailyFromGamifyChange(skill, prevValue, nextValue, year, month, day) {
  const today = new Date();
  const isToday =
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  if (!isToday) return;
  if (isGamifyDayDone(skill, prevValue) || !isGamifyDayDone(skill, nextValue)) return;

  const daily = findDailyBySkillCode(skill);
  if (!daily || isDailyDoneToday(daily)) return;

  await markDailyDoneToday(daily, year, month, day);
  renderDailies();
}

function toggleGamifyDay(skill, year, month, day) {
  if (skill === "fitness" && typeof handleWorkoutGamifyDay === "function") {
    void handleWorkoutGamifyDay(year, month, day);
    return;
  }
  const boardState = getBoardStateSnapshot(skill, year, month);
  const prevValue = boardState[day];
  const nextValue = nextGamifyDayState(skill, prevValue);
  const xpDelta = gamifyDayXpValue(skill, nextValue) - gamifyDayXpValue(skill, prevValue);

  if (nextValue == null) delete boardState[day];
  else boardState[day] = nextValue;

  if (xpDelta !== 0) adjustSkillXp(skill, xpDelta);

  saveBoardState(skill, year, month, boardState);
  void syncTrackerDayValue("skill", skill, year, month, day, nextValue);
  if (skill === "standup") recalculateGamifySkillXp(skill);
  void syncMappedDailyFromGamifyChange(skill, prevValue, nextValue, year, month, day).catch(
    (error) => {
      console.error("Daily completion mirror error:", error);
    },
  );

  renderGamifyStreakCalendar();
  updateDailyCounter(skill);
  renderDailies();
}

function syncGamifySelectedSkillCard() {
  document.querySelectorAll("#gamifySkillBoxesRow .gamify-skill-card[data-skill]").forEach((card) => {
    const on = card.dataset.skill === gamifySelectedSkill;
    card.classList.toggle("gamify-skill-card--active", on);
    card.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function setGamifySelectedSkill(skill) {
  if (!skill || !GAMIFY_SKILLS[skill]) return false;
  gamifySelectedSkill = skill;
  syncGamifySelectedSkillCard();
  return true;
}

function initGamifyStreakCalendar() {
  const nav = document.getElementById("gamifyMonthNav");
  const grid = document.getElementById("gamifyStreakGrid");
  if (!nav || !grid) return;

  nav.innerHTML = "";
  const prevButton = document.createElement("button");
  prevButton.textContent = "←";
  const nextButton = document.createElement("button");
  nextButton.textContent = "→";
  const monthDisplay = document.createElement("span");
  monthDisplay.id = "gamifyMonthDisplay";

  nav.appendChild(prevButton);
  nav.appendChild(monthDisplay);
  nav.appendChild(nextButton);

  document.querySelectorAll("#gamifySkillBoxesRow .gamify-skill-card[data-skill]").forEach((card) => {
    card.addEventListener("click", () => {
      if (!setGamifySelectedSkill(card.dataset.skill)) return;
      renderGamifyStreakCalendar();
    });
    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (!setGamifySelectedSkill(card.dataset.skill)) return;
      renderGamifyStreakCalendar();
    });
  });
  syncGamifySelectedSkillCard();

  prevButton.addEventListener("click", () => {
    gamifyViewMonth--;
    if (gamifyViewMonth < 0) {
      gamifyViewMonth = 11;
      gamifyViewYear--;
    }
    renderGamifyStreakCalendar();
  });

  nextButton.addEventListener("click", () => {
    gamifyViewMonth++;
    if (gamifyViewMonth > 11) {
      gamifyViewMonth = 0;
      gamifyViewYear++;
    }
    renderGamifyStreakCalendar();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderGamifyStreakCalendar(), 100);
  });

  Object.keys(GAMIFY_SKILLS).forEach((skill) => {
    document.getElementById(`${skill}Btn`)?.addEventListener("click", function () {
      if (!setGamifySelectedSkill(skill)) return;
      renderGamifyStreakCalendar();
    });
  });

  renderGamifyStreakCalendar();
}

function renderGamifyStreakCalendar() {
  const grid = document.getElementById("gamifyStreakGrid");
  const svg = document.getElementById("gamifyStreakSvg");
  const wrap = document.getElementById("gamifyStreakWrap");
  const monthDisplay = document.getElementById("gamifyMonthDisplay");
  if (!grid || !svg || !wrap) return;

  const skill = gamifySelectedSkill;
  const meta = GAMIFY_SKILLS[skill];
  const year = gamifyViewYear;
  const month = gamifyViewMonth;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (monthDisplay) monthDisplay.textContent = `${monthNames[month]} ${year}`;

  const boardState = getBoardStateSnapshot(skill, year, month);
  const monthStateCache = new Map();
  monthStateCache.set(`${year}-${month}`, boardState);

  function getMonthBoardState(y, m) {
    const key = `${y}-${m}`;
    if (!monthStateCache.has(key)) {
      monthStateCache.set(key, getBoardStateSnapshot(skill, y, m));
    }
    return monthStateCache.get(key);
  }

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  /** Monday = first column (JS Sunday=0 → Mon-first pad) */
  const startPad = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const rowCount = totalCells / 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isViewingCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  let weekRail = document.getElementById("gamifyWeekNumbers");
  if (!weekRail) {
    weekRail = document.createElement("div");
    weekRail.id = "gamifyWeekNumbers";
    weekRail.className = "gamify-week-number-rail";
    wrap.appendChild(weekRail);
  }
  weekRail.innerHTML = "";
  weekRail.style.gridTemplateRows = `repeat(${rowCount}, 1fr)`;

  grid.innerHTML = "";

  for (let row = 0; row < rowCount; row++) {
    const rowDate = new Date(year, month, 1 - startPad + row * 7);
    const weekNumber = getWeekNumber(rowDate);
    const weekCell = document.createElement("div");
    weekCell.className = "gamify-week-number";
    weekCell.textContent = String(weekNumber);
    weekRail.appendChild(weekCell);
  }

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "gamify-streak-cell";

    if (i < startPad || i >= startPad + daysInMonth) {
      const d = new Date(year, month, 1 - startPad + i);
      cell.classList.add("gamify-streak-outside");

      const outsideState = getMonthBoardState(d.getFullYear(), d.getMonth());
      const outsideDone = isGamifyDayDone(skill, outsideState[d.getDate()]);
      if (outsideDone) {
        const dotSlot = document.createElement("div");
        dotSlot.className = "gamify-streak-dot-slot";
        const dot = document.createElement("span");
        dot.className = "gamify-streak-dot gamify-streak-done gamify-streak-dot--outside";
        dot.style.backgroundColor = meta.color;
        dotSlot.appendChild(dot);
        cell.appendChild(dotSlot);
      }

      const outNum = document.createElement("span");
      outNum.className = "gamify-streak-day-num gamify-streak-day-num--muted";
      outNum.textContent = String(d.getDate());
      cell.appendChild(outNum);
    } else {
      const day = i - startPad + 1;
      const dayValue = boardState[day];
      const dateKey = trackerDateKey(year, month, day);
      const workoutDraft =
        skill === "fitness" && typeof getWorkoutDraftForDate === "function"
          ? getWorkoutDraftForDate(dateKey)
          : null;
      const done = isGamifyDayDone(skill, dayValue);
      const badge = getGamifyDayBadge(skill, dayValue);

      cell.classList.add("gamify-streak-cell--in-month");
      cell.style.setProperty("--gamify-skill-color", meta.color);

      const num = document.createElement("span");
      num.className = "gamify-streak-day-num";
      num.textContent = String(day);
      cell.appendChild(num);

      const dotSlot = document.createElement("div");
      dotSlot.className = "gamify-streak-dot-slot";
      if (done) {
        cell.classList.add("gamify-streak-has-done");
        const dot = document.createElement("span");
        dot.className = "gamify-streak-dot gamify-streak-done";
        dot.style.backgroundColor = meta.color;
        if (badge) {
          const label = document.createElement("span");
          label.className = "gamify-streak-dot-label";
          label.textContent = badge;
          dot.appendChild(label);
        }
        dotSlot.appendChild(dot);
      } else if (workoutDraft) {
        const dot = document.createElement("span");
        dot.className = "gamify-streak-dot gamify-streak-dot--draft";
        dot.style.borderColor = meta.color;
        const label = document.createElement("span");
        label.className = "gamify-streak-dot-label";
        label.textContent = workoutDraft.routineCode || "…";
        dot.appendChild(label);
        dotSlot.appendChild(dot);
      }
      cell.appendChild(dotSlot);

      cell.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleGamifyDay(skill, year, month, day);
      });

      if (isViewingCurrentMonth && day === today.getDate()) {
        cell.classList.add("gamify-streak-today");
      }
    }
    grid.appendChild(cell);
  }

  requestAnimationFrame(() => {
    drawGamifyStreakLines(svg, wrap, grid, {
      skill,
      startPad,
      daysInMonth,
      boardState,
      color: meta.color,
    });
  });
}

function drawGamifyStreakLines(svg, wrap, grid, opts) {
  const { skill, startPad, daysInMonth, boardState, color } = opts;
  svg.innerHTML = "";
  const cells = grid.querySelectorAll(".gamify-streak-cell");
  const rect = wrap.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  svg.setAttribute("width", String(rect.width));
  svg.setAttribute("height", String(rect.height));

  function centerForDay(day) {
    const idx = startPad + day - 1;
    const el = cells[idx];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const dot = el.querySelector(".gamify-streak-dot");
    if (dot) {
      const dr = dot.getBoundingClientRect();
      return {
        x: dr.left - rect.left + dr.width / 2,
        y: dr.top - rect.top + dr.height / 2,
      };
    }
    return {
      x: r.left - rect.left + r.width / 2,
      y: r.bottom - rect.top - 9,
    };
  }

  const done = (d) => isGamifyDayDone(skill, boardState[d]);

  for (let d = 1; d < daysInMonth; d++) {
    const currentCellIndex = startPad + d - 1;
    const nextCellIndex = currentCellIndex + 1;
    const wrapsWeekRow =
      Math.floor(currentCellIndex / 7) !== Math.floor(nextCellIndex / 7);
    if (wrapsWeekRow) continue;

    if (!done(d) || !done(d + 1)) continue;
    const a = centerForDay(d);
    const b = centerForDay(d + 1);
    if (!a || !b) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(a.x));
    line.setAttribute("y1", String(a.y));
    line.setAttribute("x2", String(b.x));
    line.setAttribute("y2", String(b.y));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-dasharray", "6 5");
    line.setAttribute("opacity", "0.88");
    svg.appendChild(line);
  }
}

function incrementDayCount(skill, day) {
  const today = new Date();
  const boardState = getBoardStateSnapshot(
    skill,
    today.getFullYear(),
    today.getMonth(),
  );

  if (skill === "standup") {
    const nextValue = nextGamifyDayState(skill, boardState[day]);
    if (nextValue == null) delete boardState[day];
    else boardState[day] = nextValue;

    saveBoardState(skill, today.getFullYear(), today.getMonth(), boardState);
    void syncTrackerDayValue(
      "skill",
      skill,
      today.getFullYear(),
      today.getMonth(),
      day,
      nextValue,
    );
    recalculateGamifySkillXp(skill);

    renderGamifyStreakCalendar();
    updateDailyCounter(skill);
    startTimer(60);
    return;
  }

  const count = (Number(boardState[day]) || 0) + 1;
  boardState[day] = count;

  saveBoardState(skill, today.getFullYear(), today.getMonth(), boardState);
  void syncTrackerDayValue(
    "skill",
    skill,
    today.getFullYear(),
    today.getMonth(),
    day,
    count,
  );

  renderGamifyStreakCalendar();

  updateDailyCounter(skill);
  upXp(skill);
  startTimer(60);
}

function updateDailyCounter(skill) {
  const dailyCountElement = document.getElementById("dailyCount" + skill);
  if (!dailyCountElement) return;
  const today = new Date();
  const boardState = getBoardStateSnapshot(
    skill,
    today.getFullYear(),
    today.getMonth(),
  );

  const todayValue = boardState[today.getDate()];
  if (skill === "fitness") {
    const badge = getGamifyDayBadge(skill, todayValue);
    dailyCountElement.textContent = badge || "0";
    return;
  }
  const todayCount = Number(todayValue) || 0;
  dailyCountElement.textContent = todayCount;
}

// CHATBOT FUNCTIONALITY
let messages = [
  {
    role: "system",
    content:
      "You are a practical, friendly assistant with a slightly retro voice and broad knowledge of culture, science, and technology."
  },
];

// Local Ollama is reached via the startpage-chat bridge (127.0.0.1:11435),
// which adds Access-Control-Allow-Private-Network so this https page can call it
// (Chrome's Private Network Access). The bridge proxies to Ollama on 11434.
// Bridge runs as the `startpage-chat-bridge` systemd user service; see
// startpage-chat/bridge.py.
const OLLAMA_BASE_URL = "http://127.0.0.1:11435";
const LOCAL_LLAMA_MODEL = "llama3.2:3b";

const CHAT_ASSISTANT_PROVIDERS = {
  openai: {
    label: "OpenAI",
    model: "gpt-4o-mini",
  },
  gemini: {
    label: "Gemini",
    model: "gemini-3.5-flash",
  },
  deepseek: {
    label: "DeepSeek V3",
    model: "deepseek-chat",
  },
  llama: {
    label: "Llama 3.2 3B (Local)",
    model: LOCAL_LLAMA_MODEL,
  },
};

function getSelectedChatProvider() {
  const select = document.getElementById("chatProviderSelect");
  const provider = select && typeof select.value === "string" ? select.value : "openai";
  return CHAT_ASSISTANT_PROVIDERS[provider] ? provider : "openai";
}

function removeChatLoadingMessage() {
  const loadingMessage = document.querySelector(
    ".assistant-message:last-child",
  );
  if (loadingMessage && loadingMessage.textContent === "...") {
    loadingMessage.remove();
  }
}

async function readChatProxyError(response) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string") {
      return {
        message: payload.error,
        code: typeof payload.code === "string" ? payload.code : "chat_proxy_error",
        provider: typeof payload.provider === "string" ? payload.provider : "",
        model: typeof payload.model === "string" ? payload.model : "",
        upstreamStatus: payload.upstreamStatus || "",
        hint: typeof payload.hint === "string" ? payload.hint : "",
        expectedSecret: typeof payload.expectedSecret === "string" ? payload.expectedSecret : "",
      };
    }
  } catch (error) {
    console.warn("Unable to parse chat proxy error:", error);
  }
  return {
    message: `Chat proxy request failed (${response.status})`,
    code: "unreadable_proxy_error",
    provider: "",
    model: "",
    upstreamStatus: response.status,
    hint: "The Worker returned an error that the browser could not parse as JSON.",
    expectedSecret: "",
  };
}

function formatChatProxyError(errorInfo, providerConfig) {
  const providerLabel = providerConfig.label;
  const code = errorInfo.code || "unknown_chat_error";
  const upstreamStatus = errorInfo.upstreamStatus ? ` Upstream status: ${errorInfo.upstreamStatus}.` : "";
  const model = errorInfo.model ? ` Model: ${errorInfo.model}.` : "";
  const hint = errorInfo.hint ? ` Hint: ${errorInfo.hint}` : "";

  const messagesByCode = {
    missing_authorization:
      "Sign in to Supabase before using the Worker.",
    invalid_access_token:
      "The Worker could not validate the Supabase session. Sign in again.",
    forbidden_user:
      "This Supabase account is not allowed to use the Worker.",
    worker_auth_unavailable:
      "The Worker could not reach Supabase Auth to validate this session.",
    missing_provider_key:
      `The Worker is missing ${errorInfo.expectedSecret || `${providerLabel.toUpperCase()}_API_KEY`}. The browser should not store this key; configure it in Wrangler.`,
    unsupported_provider:
      "The browser sent a provider value the Worker does not support. This is a frontend/provider-select bug.",
    missing_messages:
      "The browser reached the Worker without chat messages. This is a frontend request-body bug.",
    upstream_network_error:
      `The Worker could not reach ${providerLabel}. Check network access and provider availability.`,
    upstream_request_failed:
      `${providerLabel} rejected the Worker request.${upstreamStatus}${model} Check model name, key permissions, billing, or request shape.`,
    invalid_upstream_json:
      `${providerLabel} responded, but the Worker could not parse JSON.${upstreamStatus}${model}`,
    empty_provider_response:
      `${providerLabel} responded successfully, but the Worker could not find text content in the response.${model}`,
    unreadable_proxy_error:
      "The Worker returned an error, but the browser could not parse its JSON body.",
  };

  return `Error [${code}]: ${messagesByCode[code] || errorInfo.message || "Unknown chat proxy failure."}${hint}`;
}

function createChatProxyError(errorInfo, providerConfig) {
  const error = new Error(formatChatProxyError(errorInfo, providerConfig));
  error.code = errorInfo.code || "unknown_chat_error";
  error.details = errorInfo;
  return error;
}

function resetChat() {
  messages.length = 0;
  messages.push({
    role: "system",
    content:
      "You are a practical, friendly assistant with a slightly retro voice and broad knowledge of culture, science, and technology."
  });
  document.getElementById("chatMessages").innerHTML = "";
  document.getElementById("chatInput").value = "";
  document.getElementById("chatInput").focus();
}

function appendMessage(role, text) {
  const messagesDiv = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message", `${role}-message`);
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendChatMessage() {
  const chatInput = document.getElementById("chatInput");
  const userText = chatInput.value.trim();
  if (!userText) return;
  const provider = getSelectedChatProvider();
  const providerConfig = CHAT_ASSISTANT_PROVIDERS[provider];
  const baseUrl = getWorkerBaseUrl();

  // Clear input
  chatInput.value = "";

  // Display user message
  appendMessage("user", userText);
  messages.push({ role: "user", content: userText });

  if (provider === "llama") {
    await sendChatMessageLocal(providerConfig);
    return;
  }

  const providerSystem = {
    role: "system",
    content:
      "You are Illan's startpage assistant. You have the last 30 days of his skill-tracker " +
      "data below (DD/MM from the hub's gamify board). Answer his questions about that " +
      "data honestly, using only what is shown. fitness letters = training cycle (A-F); " +
      "standup = count 0-3; others 'done' = completed that day.\n\n" +
      buildStartpageChatContext(),
  };

  if (!hasWorkerAuthSession()) {
    appendMessage(
      "assistant",
      "Sign in to Supabase before using the cloud chat providers.",
    );
    void recordIntegrationStatus(provider, "disabled", {
      configured: false,
      lastAction: "chat_completion",
      model: providerConfig.model,
      proxyBaseUrl: baseUrl,
      usesSupabaseAuth: true,
      directClient: false,
      lastError: "Supabase session missing",
      lastErrorCode: "missing_authorization",
    });
    return;
  }

  // Show loading indicator
  appendMessage("assistant", "...");

  try {
    const authorizationHeaders = await getWorkerAuthorizationHeaders();
    const response = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authorizationHeaders,
      },
      body: JSON.stringify({
        provider,
        messages: [providerSystem, ...messages],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw createChatProxyError(await readChatProxyError(response), providerConfig);
    }

    const data = await response.json();

    // Remove loading indicator
    removeChatLoadingMessage();

    const assistantResponse = typeof data.content === "string"
      ? data.content.trim()
      : "";
    if (!assistantResponse) {
      throw new Error("Chat proxy returned an empty response");
    }
    appendMessage("assistant", assistantResponse);
    messages.push({ role: "assistant", content: assistantResponse });
    void recordIntegrationStatus(provider, "active", {
      configured: true,
      directClient: false,
      usesSupabaseAuth: true,
      proxyBaseUrl: baseUrl,
      lastAction: "chat_completion",
      model: data.model || providerConfig.model,
    });
  } catch (error) {
    console.error("Error:", error);
    void recordIntegrationStatus(provider, "error", {
      configured: true,
      directClient: false,
      usesSupabaseAuth: true,
      proxyBaseUrl: baseUrl,
      lastAction: "chat_completion",
      model: providerConfig.model,
      lastError: error instanceof Error ? error.message : String(error),
      lastErrorCode: error?.code || "unknown_chat_error",
    });
    // Remove loading indicator
    removeChatLoadingMessage();
    appendMessage(
      "assistant",
      error instanceof Error
        ? error.message
        : `Error: Unable to connect to ${providerConfig.label} through the chat proxy.`,
    );
  }
}

function buildStartpageChatContext() {
  // Reads the hub's own gamify board state (localStorage) for the last 30 days
  // and packs it compactly so the local llama can answer from the user's data
  // without the site touching Supabase for this.
  const skills = [
    { code: "coding", label: "Coding" },
    { code: "content", label: "Content" },
    { code: "fitness", label: "Physique" },
    { code: "standup", label: "Stand Up" },
    { code: "meditation", label: "Meditation" },
  ];
  const today = new Date();
  const out = [];
  for (const { code, label } of skills) {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const snap = getBoardStateSnapshot(code, d.getFullYear(), d.getMonth());
      const raw = snap[d.getDate()];
      if (raw == null || raw === "") continue;
      const key =
        String(d.getDate()).padStart(2, "0") +
        "/" +
        String(d.getMonth() + 1).padStart(2, "0");
      let val = "done";
      if (code === "fitness") {
        const t = fitnessTrainingFromValue(raw);
        val = t ? t : "done";
      } else if (code === "standup") {
        val = String(Math.max(0, Math.min(3, Number(raw) || 0)));
      }
      days.push(`${key}:${val}`);
    }
    out.push(`skill:${code} (${label}): ${days.join(", ") || "no data last 30d"}`);
  }
  return out.join("\n");
}

async function sendChatMessageLocal(providerConfig) {
  const modelStatus = await getOllamaModelStatus(providerConfig.model);
  if (!modelStatus.running) {
    void recordIntegrationStatus("llama", "disabled", {
      configured: true,
      directClient: true,
      lastAction: "chat_completion",
      model: providerConfig.model,
      endpoint: OLLAMA_BASE_URL,
      lastCheckedAt: new Date().toISOString(),
      lastError: modelStatus.error || `Ollama is not reachable at ${OLLAMA_BASE_URL}`,
      lastErrorCode: "ollama_not_running",
    });
    appendMessage(
      "assistant",
      `Error: Ollama is not reachable at ${OLLAMA_BASE_URL}. Start it with \`ollama serve\`, then try ${providerConfig.label} again.`,
    );
    return;
  }

  if (!modelStatus.hasModel) {
    const availableModels = modelStatus.models.length
      ? modelStatus.models.join(", ")
      : "none returned by /api/tags";
    const message = `Ollama is running, but ${providerConfig.model} is not listed. Available models: ${availableModels}.`;
    void recordIntegrationStatus("llama", "error", {
      configured: true,
      directClient: true,
      lastAction: "chat_completion",
      model: providerConfig.model,
      endpoint: OLLAMA_BASE_URL,
      availableModels: modelStatus.models,
      lastCheckedAt: new Date().toISOString(),
      lastError: message,
      lastErrorCode: "ollama_model_missing",
    });
    appendMessage("assistant", `Error: ${message}`);
    return;
  }

  appendMessage("assistant", "...");

  try {
    const dataContext = buildStartpageChatContext();
    const llamaMessages = [
      {
        role: "system",
        content:
          "You are Illan's startpage assistant. You have the last 30 days of his skill-tracker " +
          "data below (DD/MM from the hub's gamify board). Answer his questions about that " +
          "data honestly, using only what is shown. fitness letters = training cycle (A-F); " +
          "standup = count 0-3; others 'done' = completed that day.\n\n" +
          dataContext,
      },
      ...messages.map(({ role, content }) => ({ role, content })),
    ];
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: providerConfig.model,
        messages: llamaMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    removeChatLoadingMessage();

    const assistantResponse = typeof data.message?.content === "string"
      ? data.message.content.trim()
      : "";
    if (!assistantResponse) {
      throw new Error("Ollama returned an empty response");
    }

    appendMessage("assistant", assistantResponse);
    messages.push({ role: "assistant", content: assistantResponse });
    void recordIntegrationStatus("llama", "active", {
      configured: true,
      directClient: true,
      lastAction: "chat_completion",
      model: data.model || providerConfig.model,
      endpoint: OLLAMA_BASE_URL,
      availableModels: modelStatus.models,
      lastCheckedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error:", error);
    void recordIntegrationStatus("llama", "error", {
      configured: true,
      directClient: true,
      lastAction: "chat_completion",
      model: providerConfig.model,
      endpoint: OLLAMA_BASE_URL,
      availableModels: modelStatus.models,
      lastCheckedAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : String(error),
      lastErrorCode: error?.code || "local_chat_error",
    });
    removeChatLoadingMessage();
    appendMessage(
      "assistant",
      error instanceof Error
        ? error.message
        : `Error: Unable to connect to local ${providerConfig.label}.`,
    );
  }
}

async function getOllamaModelStatus(model) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      return {
        running: false,
        hasModel: false,
        models: [],
        error: `Ollama /api/tags failed with status ${response.status}`,
      };
    }
    const data = await response.json();
    const models = Array.from(new Set(
      (Array.isArray(data.models) ? data.models : [])
        .flatMap((item) => [item?.name, item?.model])
        .filter(Boolean)
        .map(String),
    ));
    return {
      running: true,
      hasModel: models.includes(model),
      models,
      error: "",
    };
  } catch (error) {
    return {
      running: false,
      hasModel: false,
      models: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Add event listener for Enter key in chat input
document
  .getElementById("chatInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      sendChatMessage();
    }
  });

// Add these functions after the existing chat functionality

function toggleEmojiBoard() {
  const emojiBoard = document.getElementById('emojiBoard');
  emojiBoard.style.display = emojiBoard.style.display === 'none' ? 'block' : 'none';
}

function insertEmoji(emoji) {
  const chatInput = document.getElementById('chatInput');
  const start = chatInput.selectionStart;
  const end = chatInput.selectionEnd;
  const text = chatInput.value;
  const before = text.substring(0, start);
  const after = text.substring(end);
  
  chatInput.value = before + emoji + after;
  chatInput.selectionStart = chatInput.selectionEnd = start + emoji.length;
  chatInput.focus();
}

// Close emoji board when clicking outside
document.addEventListener('click', function(event) {
  const emojiBoard = document.getElementById('emojiBoard');
  const emojiButton = document.querySelector('.chat-toolbar button');
  
  if (!emojiBoard.contains(event.target) && event.target !== emojiButton) {
    emojiBoard.style.display = 'none';
  }
});

// LLM USAGE TRACKER

async function fetchLlmUsageFromWorker(provider) {
  const baseUrl = getWorkerBaseUrl();
  const authorizationHeaders = await getWorkerAuthorizationHeaders();
  const response = await fetch(`${baseUrl}/api/usage/${encodeURIComponent(provider)}`, {
    method: "GET",
    headers: authorizationHeaders,
  });
  const payload = await response.json();
  if (!response.ok) {
    const errMsg = payload && typeof payload.error === "string" ? payload.error : `HTTP ${response.status}`;
    throw new Error(errMsg);
  }
  return payload;
}

function setLlmUsageStatus(message) {
  const el = document.getElementById("llmUsageStatus");
  if (el) el.textContent = message;
}

function renderDeepseekUsage(data) {
  const body = document.getElementById("deepseekUsageBody");
  if (!body) return;
  if (!data || !Array.isArray(data.balance_infos)) {
    body.innerHTML = '<p class="deepseek-balance">$0.00</p>';
    return;
  }
  const info = data.balance_infos[0] || {};
  const total = info.total_balance || "0";
  body.innerHTML = `<p class="deepseek-balance">$${total}</p>`;
}

async function refreshLlmUsage() {
  const refreshBtn = document.getElementById("llmUsageRefreshBtn");
  if (refreshBtn) refreshBtn.disabled = true;
  setLlmUsageStatus("Refreshing...");

  try {
    const deepseekData = await fetchLlmUsageFromWorker("deepseek");
    renderDeepseekUsage(deepseekData);
  } catch (error) {
    document.getElementById("deepseekUsageBody").innerHTML = `<p>Error: ${error.message}</p>`;
  }

  setLlmUsageStatus("Done.");
  if (refreshBtn) refreshBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", function () {
  const refreshBtn = document.getElementById("llmUsageRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshLlmUsage);
  }
  // Auto-refresh on first open
  const container = document.getElementById("llmUsageContainer");
  if (container) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.target.style.display !== "none") {
          refreshLlmUsage();
        }
      });
    });
    observer.observe(container, { attributes: true, attributeFilter: ["style"] });
  }
});

// CLICKUP TASKS
const clickupState = {
  loaded: false,
  loading: false,
  page: 0,
  includeClosed: false,
  mineOnly: true,
  list: null,
  statuses: [],
  statusesByList: {},
  tasks: [],
  lastPage: true,
};

function setClickupSyncStatus(message) {
  const status = document.getElementById("clickupSyncStatus");
  if (status) status.textContent = message;
}

function normalizeClickupStatus(status) {
  if (!status || typeof status !== "object") return null;
  const name =
    typeof status.status === "string"
      ? status.status
      : typeof status.name === "string"
        ? status.name
        : "";
  const cleanName = name.trim();
  if (!cleanName) return null;
  return {
    id: typeof status.id === "string" ? status.id : cleanName,
    name: cleanName,
    color: typeof status.color === "string" ? status.color : "",
    type: typeof status.type === "string" ? status.type : "",
  };
}

function normalizeClickupTask(task) {
  if (!task || typeof task !== "object") return null;
  const id = typeof task.id === "string" ? task.id : "";
  const name = typeof task.name === "string" ? task.name.trim() : "";
  if (!id || !name) return null;
  const status = normalizeClickupStatus(task.status) || {
    id: "unknown",
    name: "unknown",
    color: "",
    type: "",
  };
  return {
    id,
    name,
    status,
    dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : "",
    url: typeof task.url === "string" ? task.url : "",
    listId: typeof task.listId === "string" ? task.listId : "",
    listName: typeof task.listName === "string" ? task.listName : "",
    assignees: Array.isArray(task.assignees)
      ? task.assignees.filter((name) => typeof name === "string" && name.trim())
      : [],
  };
}

function updateClickupPaginationControls() {
  const pageLabel = document.getElementById("clickupPageLabel");
  const prevBtn = document.getElementById("clickupPrevPageBtn");
  const nextBtn = document.getElementById("clickupNextPageBtn");
  if (pageLabel) pageLabel.textContent = `page ${clickupState.page + 1}`;
  if (prevBtn) prevBtn.disabled = clickupState.loading || clickupState.page <= 0;
  if (nextBtn) nextBtn.disabled = clickupState.loading || clickupState.lastPage;
}

function formatClickupDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

async function fetchClickupWorkerJson(path, options = {}) {
  const baseUrl = getWorkerProxyBaseUrl();
  const authorizationHeaders = await getWorkerAuthorizationHeaders();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...authorizationHeaders,
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const errMsg =
      payload && typeof payload.error === "string"
        ? payload.error
        : payload && typeof payload.message === "string"
          ? payload.message
          : `HTTP ${response.status}`;
    const error = new Error(errMsg);
    error.code = payload?.code || "";
    error.hint = payload?.hint || "";
    throw error;
  }

  return payload || {};
}

async function fetchClickupListFromWorker() {
  const payload = await fetchClickupWorkerJson("/api/clickup/list", { method: "GET" });
  const statuses = Array.isArray(payload.statuses)
    ? payload.statuses.map(normalizeClickupStatus).filter(Boolean)
    : [];
  return {
    list: payload.list && typeof payload.list === "object" ? payload.list : null,
    statuses,
  };
}

async function fetchClickupTasksFromWorker() {
  const query = new URLSearchParams({
    page: String(clickupState.page),
    includeClosed: clickupState.includeClosed ? "true" : "false",
    mine: clickupState.mineOnly ? "true" : "false",
  });
  const payload = await fetchClickupWorkerJson(`/api/clickup/tasks?${query.toString()}`, {
    method: "GET",
  });
  const tasks = Array.isArray(payload.tasks)
    ? payload.tasks.map(normalizeClickupTask).filter(Boolean)
    : [];
  return {
    tasks,
    lastPage: Boolean(payload.lastPage),
    page: typeof payload.page === "number" ? payload.page : clickupState.page,
    list: payload.list && typeof payload.list === "object" ? payload.list : null,
    statuses: Array.isArray(payload.statuses)
      ? payload.statuses.map(normalizeClickupStatus).filter(Boolean)
      : [],
    statusesByList:
      payload.statusesByList && typeof payload.statusesByList === "object"
        ? Object.fromEntries(
            Object.entries(payload.statusesByList).map(([listId, statuses]) => [
              listId,
              Array.isArray(statuses)
                ? statuses.map(normalizeClickupStatus).filter(Boolean)
                : [],
            ]),
          )
        : {},
  };
}

async function updateClickupTaskStatus(taskId, status) {
  const payload = await fetchClickupWorkerJson(
    `/api/clickup/tasks/${encodeURIComponent(taskId)}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
  );
  return normalizeClickupTask(payload.task);
}

function renderClickupTaskList() {
  const list = document.getElementById("clickupTaskList");
  if (!list) return;
  list.innerHTML = "";

  if (clickupState.loading && clickupState.tasks.length === 0) {
    const li = document.createElement("li");
    li.className = "clickup-empty-row";
    li.textContent = "Loading ClickUp tasks...";
    list.appendChild(li);
    return;
  }

  if (clickupState.loaded && clickupState.tasks.length === 0) {
    const li = document.createElement("li");
    li.className = "clickup-empty-row";
    li.textContent = "No ClickUp tasks on this page.";
    list.appendChild(li);
    return;
  }

  clickupState.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "clickup-task-row";
    li.dataset.taskId = task.id;

    const main = document.createElement("div");
    main.className = "clickup-task-main";

    const title = document.createElement(task.url ? "a" : "span");
    title.className = "clickup-task-title";
    title.textContent = task.name;
    if (task.url) {
      title.href = task.url;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
    }

    const meta = document.createElement("div");
    meta.className = "clickup-task-meta";
    const metaItems = [
      task.assignees.length ? task.assignees.join(", ") : "",
      task.listName ? task.listName : "",
      task.dueDate ? `due ${formatClickupDate(task.dueDate)}` : "",
      task.updatedAt ? `updated ${formatClickupDate(task.updatedAt)}` : "",
    ].filter(Boolean);
    meta.textContent = metaItems.join(" · ");

    main.appendChild(title);
    if (meta.textContent) main.appendChild(meta);

    const statusWrap = document.createElement("div");
    statusWrap.className = "clickup-status-cell";

    const pill = document.createElement("span");
    pill.className = "clickup-status-pill";
    pill.textContent = task.status.name;
    if (task.status.color) pill.style.backgroundColor = task.status.color;

    const select = document.createElement("select");
    select.className = "clickup-status-select";
    select.setAttribute("aria-label", `Status for ${task.name}`);
    const statusOptions = clickupState.statusesByList[task.listId] || clickupState.statuses;
    statusOptions.forEach((status) => {
      const option = document.createElement("option");
      option.value = status.name;
      option.textContent = status.name;
      if (status.name.toLowerCase() === task.status.name.toLowerCase()) option.selected = true;
      select.appendChild(option);
    });
    if (!select.value) {
      const option = document.createElement("option");
      option.value = task.status.name;
      option.textContent = task.status.name;
      option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener("change", function () {
      void handleClickupStatusChange(task.id, select.value);
    });

    statusWrap.appendChild(pill);
    statusWrap.appendChild(select);
    li.appendChild(main);
    li.appendChild(statusWrap);
    list.appendChild(li);
  });
}

async function refreshClickupTasks() {
  const refreshBtn = document.getElementById("clickupRefreshBtn");
  if (refreshBtn) refreshBtn.disabled = true;
  clickupState.loading = true;
  updateClickupPaginationControls();
  setClickupSyncStatus("Syncing ClickUp...");
  renderClickupTaskList();

  try {
    const taskResult = await fetchClickupTasksFromWorker();
    clickupState.tasks = taskResult.tasks;
    clickupState.page = taskResult.page;
    clickupState.lastPage = taskResult.lastPage;
    clickupState.list = taskResult.list;
    clickupState.statuses = taskResult.statuses;
    clickupState.statusesByList = taskResult.statusesByList;
    clickupState.loaded = true;
    setClickupSyncStatus(`Synced ${clickupState.tasks.length} ClickUp task(s).`);
    void recordIntegrationStatus("clickup", "active", {
      lastAction: "sync_tasks",
      lastTaskCount: clickupState.tasks.length,
      listName: clickupState.list?.name || "",
      mineOnly: clickupState.mineOnly,
      proxyBaseUrl: getWorkerProxyBaseUrl(),
      lastError: "",
    });
  } catch (error) {
    console.error("ClickUp sync error:", error);
    const message = error instanceof Error ? error.message : String(error);
    setClickupSyncStatus(`ClickUp sync failed: ${message}`);
    void recordIntegrationStatus("clickup", "error", {
      lastAction: "sync_tasks",
      lastError: message,
      lastErrorCode: error?.code || "",
    });
  } finally {
    clickupState.loading = false;
    if (refreshBtn) refreshBtn.disabled = false;
    updateClickupPaginationControls();
    renderClickupTaskList();
  }
}

async function handleClickupStatusChange(taskId, nextStatus) {
  const row = Array.from(document.querySelectorAll(".clickup-task-row")).find(
    (item) => item.dataset.taskId === taskId,
  );
  const select = row?.querySelector(".clickup-status-select");
  const taskIndex = clickupState.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex < 0 || !nextStatus) return;
  const previousTask = clickupState.tasks[taskIndex];
  if (select) select.disabled = true;
  setClickupSyncStatus(`Updating ${previousTask.name}...`);

  try {
    const updatedTask = await updateClickupTaskStatus(taskId, nextStatus);
    if (updatedTask) clickupState.tasks[taskIndex] = updatedTask;
    setClickupSyncStatus(`Updated ${previousTask.name}.`);
    void recordIntegrationStatus("clickup", "active", {
      lastAction: "update_status",
      lastTaskId: taskId,
      lastStatus: nextStatus,
      lastError: "",
    });
  } catch (error) {
    console.error("ClickUp status update error:", error);
    const message = error instanceof Error ? error.message : String(error);
    setClickupSyncStatus(`Status update failed: ${message}`);
    void recordIntegrationStatus("clickup", "error", {
      lastAction: "update_status",
      lastTaskId: taskId,
      lastError: message,
      lastErrorCode: error?.code || "",
    });
  } finally {
    if (select) select.disabled = false;
    renderClickupTaskList();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const refreshBtn = document.getElementById("clickupRefreshBtn");
  const includeClosedToggle = document.getElementById("clickupIncludeClosedToggle");
  const mineToggle = document.getElementById("clickupMineToggle");
  const prevBtn = document.getElementById("clickupPrevPageBtn");
  const nextBtn = document.getElementById("clickupNextPageBtn");

  if (refreshBtn) refreshBtn.addEventListener("click", refreshClickupTasks);
  if (mineToggle) mineToggle.checked = clickupState.mineOnly;
  if (includeClosedToggle) {
    includeClosedToggle.addEventListener("change", function () {
      clickupState.includeClosed = Boolean(includeClosedToggle.checked);
      clickupState.page = 0;
      void refreshClickupTasks();
    });
  }
  if (mineToggle) {
    mineToggle.addEventListener("change", function () {
      clickupState.mineOnly = Boolean(mineToggle.checked);
      clickupState.page = 0;
      void refreshClickupTasks();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (clickupState.page <= 0) return;
      clickupState.page -= 1;
      void refreshClickupTasks();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (clickupState.lastPage) return;
      clickupState.page += 1;
      void refreshClickupTasks();
    });
  }
  updateClickupPaginationControls();

  const container = document.getElementById("clickupContainer");
  if (container) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.target.style.display !== "none" && !clickupState.loaded && !clickupState.loading) {
          void refreshClickupTasks();
        }
      });
    });
    observer.observe(container, { attributes: true, attributeFilter: ["style"] });
  }
});

// PLANNER
// The Planner window is READ-ONLY and lives in planner-projection.js: it draws
// data/planner.json, exported by `will export` from the will planner store.
// The old in-page form (title, starts_on, ends_on, summary, Supabase save) was
// removed on purpose - plans are written in the terminal:
//   will plan add "finish the flip" --start 2026-09-24 --end 2026-09-30 --note ...

// KANBAN BOARD
const KANBAN_STORAGE_KEY = "kanbanState";
const KANBAN_IMPORT_SCOPE = "kanban_v1";
const KANBAN_COLUMNS = [
  { code: "todo", title: "To Do" },
  { code: "inProgress", title: "In Progress" },
  { code: "done", title: "Done" },
];
const kanbanRemoteState = {
  loaded: false,
  boardId: "",
  columns: {},
  cards: {
    todo: [],
    inProgress: [],
    done: [],
  },
};

function makeLocalKanbanCardId() {
  return `kanban-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isKanbanBackendActive() {
  return Boolean(backendState.client && backendState.session && kanbanRemoteState.loaded);
}

function emptyKanbanState() {
  return {
    todo: [],
    inProgress: [],
    done: [],
  };
}

function normalizeKanbanCard(card, columnCode) {
  if (typeof card === "string") {
    const text = card.trim();
    if (!text) return null;
    return {
      id: makeLocalKanbanCardId(),
      text,
      column: columnCode,
      createdAt: new Date().toISOString(),
    };
  }

  if (!card || typeof card !== "object") return null;
  const text = typeof card.text === "string" ? card.text.trim() : "";
  if (!text) return null;
  return {
    id: typeof card.id === "string" && card.id.trim() ? card.id : makeLocalKanbanCardId(),
    text,
    column: columnCode,
    createdAt:
      typeof card.createdAt === "string" && card.createdAt
        ? card.createdAt
        : new Date().toISOString(),
  };
}

function normalizeKanbanState(rawState) {
  const state = emptyKanbanState();
  const source = rawState && typeof rawState === "object" ? rawState : {};
  KANBAN_COLUMNS.forEach(({ code }) => {
    const cards = Array.isArray(source[code]) ? source[code] : [];
    state[code] = cards.map((card) => normalizeKanbanCard(card, code)).filter(Boolean);
  });
  return state;
}

function getLocalKanbanState() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(KANBAN_STORAGE_KEY));
  } catch (_error) {
    parsed = null;
  }
  const state = normalizeKanbanState(parsed);
  localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(state));
  return state;
}

function setLocalKanbanState(state) {
  localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(normalizeKanbanState(state)));
}

function getKanbanState() {
  return isKanbanBackendActive() ? kanbanRemoteState.cards : getLocalKanbanState();
}

function setKanbanState(state) {
  if (isKanbanBackendActive()) {
    kanbanRemoteState.cards = normalizeKanbanState(state);
    return;
  }
  setLocalKanbanState(state);
}

function kanbanColumnIndex(columnCode) {
  return KANBAN_COLUMNS.findIndex((column) => column.code === columnCode);
}

function kanbanAdjacentColumn(columnCode, direction) {
  const index = kanbanColumnIndex(columnCode);
  if (index < 0) return "";
  const next = KANBAN_COLUMNS[index + direction];
  return next ? next.code : "";
}

function mapKanbanCardRow(row, columnCode) {
  return normalizeKanbanCard(
    {
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
    },
    columnCode,
  );
}

async function ensureBackendKanbanBoard() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) throw new Error("Supabase session missing");

  let board = throwIfSupabaseError(
    await backendState.client
      .from("kanban_boards")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  );

  if (!board) {
    board = throwIfSupabaseError(
      await backendState.client
        .from("kanban_boards")
        .insert({ user_id: userId, title: "Main" })
        .select("id")
        .single(),
    );
  }

  const columnRows = [];
  for (const [position, column] of KANBAN_COLUMNS.entries()) {
    const row = throwIfSupabaseError(
      await backendState.client
        .from("kanban_columns")
        .upsert(
          {
            user_id: userId,
            board_id: board.id,
            code: column.code,
            title: column.title,
            position,
          },
          { onConflict: "user_id,board_id,code" },
        )
        .select("id, code")
        .single(),
    );
    columnRows.push(row);
  }

  return {
    boardId: board.id,
    columns: Object.fromEntries(columnRows.map((row) => [row.code, row.id])),
  };
}

async function loadKanbanBackendState() {
  const userId = getBackendUserId();
  if (!backendState.client || !userId) {
    kanbanRemoteState.loaded = false;
    return;
  }

  const { boardId, columns } = await ensureBackendKanbanBoard();
  const cardRows = throwIfSupabaseError(
    await backendState.client
      .from("kanban_cards")
      .select("id, column_id, text, position, created_at")
      .eq("user_id", userId)
      .eq("board_id", boardId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
  );

  const codeByColumnId = Object.fromEntries(
    Object.entries(columns).map(([code, id]) => [id, code]),
  );
  const cards = emptyKanbanState();
  (cardRows || []).forEach((row) => {
    const columnCode = codeByColumnId[row.column_id];
    if (!columnCode) return;
    const card = mapKanbanCardRow(row, columnCode);
    if (card) cards[columnCode].push(card);
  });

  kanbanRemoteState.boardId = boardId;
  kanbanRemoteState.columns = columns;
  kanbanRemoteState.cards = cards;
  kanbanRemoteState.loaded = true;
}

async function importKanbanLocalDataOnce() {
  if (hasBackendImportCompleted(KANBAN_IMPORT_SCOPE)) return;
  const userId = getBackendUserId();
  if (!backendState.client || !userId) return;

  const localState = getLocalKanbanState();
  const hasCards = KANBAN_COLUMNS.some(({ code }) => localState[code].length > 0);
  if (!hasCards) {
    markBackendImportCompleted(KANBAN_IMPORT_SCOPE);
    return;
  }

  const { boardId, columns } = await ensureBackendKanbanBoard();
  for (const { code } of KANBAN_COLUMNS) {
    const columnId = columns[code];
    for (const [position, card] of localState[code].entries()) {
      throwIfSupabaseError(
        await backendState.client.from("kanban_cards").insert({
          user_id: userId,
          board_id: boardId,
          column_id: columnId,
          text: card.text,
          position,
          created_at: financeTimestampForDb(card.createdAt),
        }),
      );
    }
  }

  markBackendImportCompleted(KANBAN_IMPORT_SCOPE);
}

async function createBackendKanbanCard(columnCode, text) {
  const userId = getBackendUserId();
  const columnId = kanbanRemoteState.columns[columnCode];
  if (!backendState.client || !userId || !kanbanRemoteState.boardId || !columnId) {
    throw new Error("Kanban backend not ready");
  }

  const position = kanbanRemoteState.cards[columnCode].length;
  return throwIfSupabaseError(
    await backendState.client
      .from("kanban_cards")
      .insert({
        user_id: userId,
        board_id: kanbanRemoteState.boardId,
        column_id: columnId,
        text,
        position,
      })
      .select("id, text, created_at")
      .single(),
  );
}

async function updateBackendKanbanCardColumn(cardId, columnCode, position) {
  const userId = getBackendUserId();
  const columnId = kanbanRemoteState.columns[columnCode];
  if (!backendState.client || !userId || !cardId || !columnId) return;
  throwIfSupabaseError(
    await backendState.client
      .from("kanban_cards")
      .update({ column_id: columnId, position })
      .eq("id", cardId)
      .eq("user_id", userId),
  );
}

async function deleteBackendKanbanCard(cardId) {
  const userId = getBackendUserId();
  if (!backendState.client || !userId || !cardId) return;
  throwIfSupabaseError(
    await backendState.client
      .from("kanban_cards")
      .delete()
      .eq("id", cardId)
      .eq("user_id", userId),
  );
}

function persistLocalKanbanMutation(mutator) {
  const state = getLocalKanbanState();
  mutator(state);
  setLocalKanbanState(state);
  return state;
}

function createKanbanTaskElement(card) {
  const taskElement = document.createElement("div");
  taskElement.className = "kanban-item";
  taskElement.dataset.cardId = card.id;
  taskElement.dataset.currentColumn = card.column;

  const taskText = document.createElement("span");
  taskText.textContent = card.text;

  const buttonsContainer = document.createElement("div");
  const prevColumn = kanbanAdjacentColumn(card.column, -1);
  const nextColumn = kanbanAdjacentColumn(card.column, 1);

  if (prevColumn) {
    const moveLeftButton = document.createElement("button");
    moveLeftButton.textContent = "←";
    moveLeftButton.onclick = function () {
      void moveKanbanTask(card.id, card.column, prevColumn);
    };
    buttonsContainer.appendChild(moveLeftButton);
  }

  if (nextColumn) {
    const moveRightButton = document.createElement("button");
    moveRightButton.textContent = "→";
    moveRightButton.onclick = function () {
      void moveKanbanTask(card.id, card.column, nextColumn);
    };
    buttonsContainer.appendChild(moveRightButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "x";
  deleteButton.onclick = function () {
    void removeKanbanTask(card.id, card.column);
  };
  buttonsContainer.appendChild(deleteButton);

  taskElement.appendChild(taskText);
  taskElement.appendChild(buttonsContainer);
  return taskElement;
}

function renderKanbanBoard() {
  KANBAN_COLUMNS.forEach(({ code }) => {
    const columnElement = document.getElementById(`${code}Column`);
    if (!columnElement) return;
    columnElement.querySelectorAll(".kanban-item").forEach((item) => item.remove());
    const addTaskContainer = columnElement.querySelector(".add-task");
    getKanbanState()[code].forEach((card) => {
      columnElement.insertBefore(createKanbanTaskElement(card), addTaskContainer);
    });
  });
}

async function addKanbanTask(column) {
  const input = document.getElementById(`${column}Input`);
  if (!input || kanbanColumnIndex(column) < 0) return;
  const text = input.value.trim();
  if (!text) return;

  const fallbackCard = {
    id: makeLocalKanbanCardId(),
    text,
    column,
    createdAt: new Date().toISOString(),
  };

  if (isKanbanBackendActive()) {
    try {
      const row = await createBackendKanbanCard(column, text);
      kanbanRemoteState.cards[column].push(mapKanbanCardRow(row, column));
    } catch (error) {
      console.error("Kanban DB add error:", error);
      saveKanbanCardToLocalFallback(fallbackCard);
      kanbanRemoteState.cards[column].push(fallbackCard);
    }
  } else {
    saveKanbanCardToLocalFallback(fallbackCard);
  }

  input.value = "";
  renderKanbanBoard();
}

function saveKanbanCardToLocalFallback(card) {
  persistLocalKanbanMutation((state) => {
    state[card.column].push(card);
  });
}

async function moveKanbanTask(cardId, fromColumn, toColumn) {
  if (!cardId || kanbanColumnIndex(fromColumn) < 0 || kanbanColumnIndex(toColumn) < 0) return;
  const state = getKanbanState();
  const cardIndex = state[fromColumn].findIndex((card) => card.id === cardId);
  if (cardIndex < 0) return;

  const [card] = state[fromColumn].splice(cardIndex, 1);
  card.column = toColumn;
  state[toColumn].push(card);
  setKanbanState(state);
  renderKanbanBoard();

  if (isKanbanBackendActive()) {
    try {
      await updateBackendKanbanCardColumn(cardId, toColumn, state[toColumn].length - 1);
    } catch (error) {
      console.error("Kanban DB move error:", error);
    }
  }
}

async function removeKanbanTask(cardId, column) {
  if (!cardId || kanbanColumnIndex(column) < 0) return;
  const state = getKanbanState();
  state[column] = state[column].filter((card) => card.id !== cardId);
  setKanbanState(state);
  renderKanbanBoard();

  if (isKanbanBackendActive()) {
    try {
      await deleteBackendKanbanCard(cardId);
    } catch (error) {
      console.error("Kanban DB delete error:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderKanbanBoard();
});
