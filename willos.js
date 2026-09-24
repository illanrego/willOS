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

// TASKS (To-do + Dailies) and KANBAN
// These windows are READ-ONLY projections now, drawn from data/tasks.json and
// data/routine.json by tasks-projection.js. The old local + Supabase task
// machinery (add/toggle/remove, dailies, kanban cards, the task input, the
// skill mapping) was removed on purpose - all of it is written in the terminal:
//   will task add "..." [--state doing]  ·  will task done <id>
//   will done morning-operator           ·  will routine list
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
  workoutContainer: { key: "workout", label: "Workout" },
  calendarContainer: { key: "calendar", label: "Calendar" },
  connectionsContainer: { key: "connections", label: "Connections" },
};
const BACKEND_SYNC_ALL_CONTAINER_IDS = [
  "calendarContainer",
  "workoutContainer",
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
  if (key === "calendar") {
    await loadCalendarBackendState();
    generateCalendar();
    return;
  }
  if (key === "workout") {
    await loadWorkoutV2BackendState();
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
    calendarRemoteState.loaded = false;
    if (typeof resetWorkoutV2BackendState === "function") resetWorkoutV2BackendState();
    integrationRemoteState.loaded = false;
    setBackendAuthStatus("Backend: Supabase ready; sign in to sync modules");
    generateCalendar();
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
    calendarRemoteState.loaded = false;
    if (typeof resetWorkoutV2BackendState === "function") resetWorkoutV2BackendState();
    setBackendAuthStatus(`Backend: reload failed (${describeBackendError(error)})`);
    generateCalendar();
  }
}

function initializeBackendAuth() {
  const { url, anonKey } = getSupabaseConfig();
  const library = window.supabase;
  if (!url || !anonKey || !library?.createClient) {
    setBackendAuthStatus("Backend: local mode (set Supabase config)");
    updateBackendAuthUi();
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
    calendarBackendActive: isCalendarBackendActive(),
    integrationBackendActive: isIntegrationBackendActive(),
    email: backendState.session?.user?.email || "",
    userId: getBackendUserId(),
    displayName: getLocalDisplayName(),
    wallpaper: getLocalWallpaper(),
    calendarNotes: Object.keys(getCalendarNotes()).length,
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

// FINANCE LOG used to live here: local + Supabase entries, categories, budgets,
// recurring income/expense, opening balances, the pie chart and every form.
// The terminal owns the ledger now (`will fin add 149,90 --kind expense
// --category course`, `will fin list`) and finance-projection.js draws
// data/finance.json: month totals, spent by category and the recent entries.
// REC LIST / NEXT FEATURES / IDEAS used to live here.
// They were note-shaped, so they are notes now: the notebook holds them and
// the Notes window draws them. In the terminal:
//   will note "the bear" --section "Rec List"
//   will note "bit about uber drivers" --section "Videos Ideas"
// The old Supabase rows (recommendations, feature_backlog_items) import into
// those sections with `will import legacy.json`.

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

// SKILL LEVELS / METERS used to live here. Gamify is a projection now:
// skills-projection.js draws data/skills.json, written by `will skill`.
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
    onResize: scheduleSkillsRender,
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
// The skills window draws a render model; the projection owns the redraw.
function scheduleSkillsRender() {
  if (typeof scheduleSkillsProjectionRender === "function") scheduleSkillsProjectionRender();
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

// The legacy WORKOUT PLAN GRID used to live here: the editable week/session
// table, its exercise library, the saved snapshot and the Supabase plan-slot
// sync. It is deleted - sessions come from the Strong app (Workout V2 owns the
// charts and the import view), and the plan grid was the thing it replaced.
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
  const flexQuadros = [
    "chatContainer",
    "workoutContainer",
    "notesContainer",
    "contentContainer",
    "plannerContainer",
    "dailiesContainer",
    "todoContainer",
    "kanbanContainer",
    "skillsContainer",
    "financeContainer",
  ];
  quadro.style.display = opening
    ? (flexQuadros.includes(idQuadro) ? "flex" : "block")
    : "none";
  if (opening) {
    void syncFeatureForContainer(idQuadro);
  }
  if (opening && idQuadro === "skillsContainer") {
    scheduleSkillsRender();
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

// (the dailies UI used to live here - see the TASKS / KANBAN note above)

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


// ROUTINE / TASKS / KANBAN render from data/routine.json + data/tasks.json
// (tasks-projection.js). There is no input here anymore: `will task ...` and
// `will done <routine>` own the data.
// REC LIST / NEXT FEATURES / IDEAS used to live here.
// They were note-shaped, so they are notes now: the notebook holds them and
// the Notes window draws them. In the terminal:
//   will note "the bear" --section "Rec List"
//   will note "bit about uber drivers" --section "Videos Ideas"
// The old Supabase rows (recommendations, feature_backlog_items) import into
// those sections with `will import legacy.json`.

// GAMIFY (skills) used to live here: board state in localStorage, trackers in
// Supabase, the streak calendar and the daily counters. All of it is gone - the
// terminal owns the numbers (`will skill coding +1`, `will skill list`) and the
// window only draws data/skills.json. Ticking a skill no longer mirrors into a
// routine: obligation and occurrence stay separate.
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
  // Reads the render models the projections already fetched (window.willOsModels),
  // so the local llama can answer from real data without the page touching the DB.
  const model = (window.willOsModels && window.willOsModels.skills) || null;
  if (!model) return "skills: no render model loaded yet (run: will export)";

  const days = model.days || {};
  const recent = Object.keys(days).sort().slice(-30);
  const out = [];
  (model.skills || []).forEach((skill) => {
    const marks = recent
      .filter((day) => Number((days[day] || {})[skill.code]) > 0)
      .map((day) => `${day.slice(8, 10)}/${day.slice(5, 7)}:${Number((days[day] || {})[skill.code])}`);
    out.push(`skill:${skill.code} (${skill.label}): ${marks.join(", ") || "no data last 30d"}`);
  });
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

// (the kanban board used to live here - see the TASKS / KANBAN note above)