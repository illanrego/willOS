"use strict";

const WORKOUT_V2_STORAGE_KEY = "workoutData_v2";
const WORKOUT_V2_CODES = ["A", "B", "C", "D", "E", "F"];
const WORKOUT_V2_VIEWS = ["Overview", "History", "Exercises", "Import"];
const WORKOUT_V2_PAGE_SIZE = 10;
// Chart geometry shared by the SVG line chart (fixed 760x300 viewBox) and the
// HTML bar chart (fixed pixel track so the gridlines line up with the bars).
const WORKOUT_V2_CHART = { width: 760, height: 300, left: 66, right: 18, top: 24, bottom: 60, inset: 34, minWidth: 480, maxWidth: 1600 };
const WORKOUT_V2_BAR_TRACK_PX = 150;
const WORKOUT_V2_BAR_LABEL_PX = 14;
// Metric metadata drives the graph picker, the axis titles and the tooltip rows.
const WORKOUT_V2_METRICS = {
  estimated1rmKg: { label: "Estimated 1RM (kg)", unit: "kg" },
  maxWeightKg: { label: "Top weight (kg)", unit: "kg" },
  workingSets: { label: "Working sets", unit: "" },
  volumeKg: { label: "Volume (kg)", unit: "kg" },
};
const workoutV2UiState = {
  data: null,
  view: "Overview",
  selectedSessionId: "",
  pendingDateKey: "",
  pendingRoutineCode: "A",
  templateCode: "A",
  historyText: "",
  historyFrom: "",
  historyTo: "",
  pageByView: { History: 1, Exercises: 1 },
  progressExercise: "",
  progressMetric: "estimated1rmKg",
  progressRange: "all",
  progressFrom: "",
  progressTo: "",
  importPreview: null,
  importText: "",
  syncMessage: "",
  remoteAvailable: false,
  remoteLoading: false,
  remoteLoaded: false,
  saveTimer: 0,
  saveChain: Promise.resolve(),
};

function workoutV2Id(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

function workoutV2Today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function workoutV2Number(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function workoutV2Integer(value) {
  const number = workoutV2Number(value);
  return number == null ? null : Math.max(0, Math.round(number));
}

function workoutV2Escape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function workoutV2NormalizeExercise(exercise, index) {
  const source = exercise && typeof exercise === "object" ? exercise : {};
  return {
    id: String(source.id || workoutV2Id("template-entry")),
    remoteId: String(source.remoteId || ""),
    exerciseName: String(source.exerciseName || source.exercise_name || ""),
    position: Number.isInteger(Number(source.position)) ? Math.max(0, Number(source.position)) : index,
    targetSets: workoutV2Integer(source.targetSets ?? source.target_sets),
    targetReps: String(source.targetReps ?? source.target_reps ?? ""),
    targetWeightKg: workoutV2Number(source.targetWeightKg ?? source.target_weight_kg),
    restSeconds: workoutV2Integer(source.restSeconds ?? source.rest_seconds),
    notes: String(source.notes || ""),
  };
}

function workoutV2NormalizeRoutine(routine, index) {
  const source = routine && typeof routine === "object" ? routine : {};
  const fallbackCode = WORKOUT_V2_CODES[index] || "A";
  const code = WORKOUT_V2_CODES.includes(String(source.code || "").toUpperCase())
    ? String(source.code).toUpperCase()
    : fallbackCode;
  return {
    id: String(source.id || `local-routine-${code}`),
    remoteId: String(source.remoteId || ""),
    code,
    name: String(source.name || code).trim() || code,
    position: WORKOUT_V2_CODES.indexOf(code),
    isActive: source.isActive !== false && source.is_active !== false,
    exercises: (Array.isArray(source.exercises) ? source.exercises : [])
      .map(workoutV2NormalizeExercise)
      .sort((a, b) => a.position - b.position)
      .map((exercise, exerciseIndex) => ({ ...exercise, position: exerciseIndex })),
  };
}

function workoutV2NormalizeEntry(entry, index) {
  const source = entry && typeof entry === "object" ? entry : {};
  return {
    id: String(source.id || workoutV2Id("workout-entry")),
    remoteId: String(source.remoteId || ""),
    exerciseName: String(source.exerciseName ?? source.exercise_name ?? ""),
    entryOrder: index,
    setOrder: String(source.setOrder ?? source.set_order ?? index + 1),
    weightKg: workoutV2Number(source.weightKg ?? source.weight_kg),
    reps: workoutV2Number(source.reps),
    rpe: workoutV2Number(source.rpe),
    distanceMeters: workoutV2Number(source.distanceMeters ?? source.distance_meters),
    seconds: workoutV2Number(source.seconds),
    notes: String(source.notes || ""),
  };
}

function workoutV2NormalizeSession(session) {
  const source = session && typeof session === "object" ? session : {};
  const dateKey = String(source.dateKey || source.workout_date || source.startedAt || source.started_at || workoutV2Today()).slice(0, 10);
  const status = source.status === "completed" ? "completed" : "draft";
  const routineCode = WORKOUT_V2_CODES.includes(String(source.routineCode || source.routine_code || "").toUpperCase())
    ? String(source.routineCode || source.routine_code).toUpperCase()
    : "";
  return {
    id: String(source.id || workoutV2Id("session")),
    remoteId: String(source.remoteId || ""),
    externalKey: String(source.externalKey || source.external_key || ""),
    externalWorkoutNumber: String(source.externalWorkoutNumber || source.external_workout_number || ""),
    dateKey,
    startedAt: String(source.startedAt || source.started_at || `${dateKey}T12:00:00`),
    workoutName: String(source.workoutName || source.workout_name || routineCode || "Workout").trim() || "Workout",
    routineCode,
    durationSeconds: workoutV2Integer(source.durationSeconds ?? source.duration_seconds),
    workoutNotes: String(source.workoutNotes || source.workout_notes || ""),
    status,
    source: ["startpage", "strong_import", "gamify"].includes(source.source) ? source.source : "startpage",
    completedAt: status === "completed" ? String(source.completedAt || source.completed_at || source.startedAt || source.started_at || new Date().toISOString()) : "",
    entries: (Array.isArray(source.entries) ? source.entries : [])
      .map(workoutV2NormalizeEntry),
  };
}

function workoutV2SeedRoutines() {
  let plan = null;
  try {
    if (typeof loadWorkoutPlan === "function") plan = loadWorkoutPlan();
  } catch (error) {
    console.warn("Workout V2 could not read the legacy plan:", error);
  }
  const columns = Array.isArray(plan?.exercises) ? plan.exercises : [];
  const titles = Array.isArray(plan?.titles) ? plan.titles : [];
  return WORKOUT_V2_CODES.map((code, index) => {
    const legacyTitle = String(titles[index] || "").trim();
    const name = legacyTitle && legacyTitle.toUpperCase() !== code ? legacyTitle : code;
    const exercises = (Array.isArray(columns[index]) ? columns[index] : [])
      .map((exerciseName) => String(exerciseName || "").trim())
      .filter(Boolean)
      .map((exerciseName, position) => workoutV2NormalizeExercise({
        id: `legacy-${code}-${position}`,
        exerciseName,
        position,
        targetSets: 1,
      }, position));
    return workoutV2NormalizeRoutine({ id: `local-routine-${code}`, code, name, exercises }, index);
  });
}

function workoutV2NormalizeData(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const sourceRoutines = Array.isArray(source.routines) ? source.routines : [];
  const byCode = new Map(sourceRoutines.map((routine, index) => {
    const normalized = workoutV2NormalizeRoutine(routine, index);
    return [normalized.code, normalized];
  }));
  const seeded = workoutV2SeedRoutines();
  const routines = WORKOUT_V2_CODES.map((code, index) => byCode.get(code) || seeded[index]);
  return {
    version: 2,
    routines,
    sessions: (Array.isArray(source.sessions) ? source.sessions : []).map(workoutV2NormalizeSession),
  };
}

function workoutV2LoadLocal() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(WORKOUT_V2_STORAGE_KEY));
  } catch (error) {
    console.warn("Workout V2 local data was invalid; rebuilding it.", error);
  }
  const data = workoutV2NormalizeData(parsed);
  localStorage.setItem(WORKOUT_V2_STORAGE_KEY, JSON.stringify(data));
  return data;
}

function workoutV2Data() {
  if (!workoutV2UiState.data) workoutV2UiState.data = workoutV2LoadLocal();
  return workoutV2UiState.data;
}

function workoutV2SetData(data) {
  workoutV2UiState.data = workoutV2NormalizeData(data);
  localStorage.setItem(WORKOUT_V2_STORAGE_KEY, JSON.stringify(workoutV2UiState.data));
  return workoutV2UiState.data;
}

function workoutV2Routine(code) {
  return workoutV2Data().routines.find((routine) => routine.code === code) || workoutV2Data().routines[0];
}

function workoutV2Session(id) {
  return workoutV2Data().sessions.find((session) => session.id === id) || null;
}

function workoutV2Paginate(items, view) {
  const list = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(list.length / WORKOUT_V2_PAGE_SIZE));
  const requested = Number(workoutV2UiState.pageByView[view]) || 1;
  const page = Math.min(totalPages, Math.max(1, requested));
  workoutV2UiState.pageByView[view] = page;
  const start = (page - 1) * WORKOUT_V2_PAGE_SIZE;
  return { items: list.slice(start, start + WORKOUT_V2_PAGE_SIZE), page, totalPages, start };
}

function workoutV2RenderPagination(view, total) {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / WORKOUT_V2_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(workoutV2UiState.pageByView[view]) || 1));
  workoutV2UiState.pageByView[view] = page;
  if ((Number(total) || 0) <= WORKOUT_V2_PAGE_SIZE) return "";
  return `<div class="workout-v2-pagination" aria-label="${workoutV2Escape(view)} pagination">
    <button type="button" data-action="page" data-page-view="${workoutV2Escape(view)}" data-page="${page - 1}"${page <= 1 ? " disabled" : ""}>Previous</button>
    <span>Page ${page} of ${totalPages}</span>
    <button type="button" data-action="page" data-page-view="${workoutV2Escape(view)}" data-page="${page + 1}"${page >= totalPages ? " disabled" : ""}>Next</button>
  </div>`;
}

function getWorkoutDraftForDate(dateKey) {
  return null;
}

function workoutV2TemplateEntries(routine) {
  const entries = [];
  (routine?.exercises || []).forEach((exercise) => {
    const count = Math.max(1, exercise.targetSets || 1);
    for (let set = 1; set <= count; set++) {
      entries.push({
        exerciseName: exercise.exerciseName,
        setOrder: String(set),
        weightKg: exercise.targetWeightKg,
        reps: workoutV2Number(exercise.targetReps),
        rpe: null,
        distanceMeters: null,
        seconds: null,
        notes: exercise.notes,
      });
    }
  });
  return entries;
}

function workoutV2CreateDraft(dateKey, routineCode, source) {
  const routine = workoutV2Routine(routineCode);
  const result = WorkoutCore.createWorkoutDraft(workoutV2Data(), {
    dateKey,
    routineCode: routine.code,
    routineName: routine.name,
    entries: workoutV2TemplateEntries(routine),
  });
  const data = workoutV2NormalizeData(result.data);
  let session = data.sessions.find((candidate) => candidate.id === result.session.id);
  if (session) session.source = source === "gamify" ? "gamify" : "startpage";
  workoutV2SetData(data);
  workoutV2UiState.selectedSessionId = session?.id || "";
  workoutV2UiState.pendingDateKey = dateKey;
  workoutV2ScheduleSave(session ? { session } : {});
  return session;
}

function workoutV2HasBackend() {
  try {
    return Boolean(backendState?.client && getBackendUserId());
  } catch (_error) {
    return false;
  }
}

function workoutV2SetStatus(message) {
  workoutV2UiState.syncMessage = String(message || "");
  const status = document.getElementById("workoutV2SyncStatus");
  if (status) status.textContent = workoutV2UiState.syncMessage;
}

function workoutV2MissingTable(error) {
  const text = String(error?.message || error || "").toLowerCase();
  return error?.code === "42P01" || error?.code === "PGRST205" || text.includes("workout_routines") || text.includes("schema cache");
}

function workoutV2DbResult(result) {
  return typeof throwIfSupabaseError === "function" ? throwIfSupabaseError(result) : (() => {
    if (result?.error) throw result.error;
    return result?.data;
  })();
}

async function workoutV2SyncRoutine(routine) {
  if (!workoutV2UiState.remoteAvailable || !workoutV2HasBackend()) return;
  const userId = getBackendUserId();
  const planId = workoutRemoteState.planId || await ensureBackendWorkoutPlan();
  let row;
  const payload = {
    user_id: userId,
    workout_plan_id: planId,
    code: routine.code,
    name: routine.name || routine.code,
    position: WORKOUT_V2_CODES.indexOf(routine.code),
    is_active: routine.isActive !== false,
  };
  if (routine.remoteId) {
    row = workoutV2DbResult(await backendState.client.from("workout_routines")
      .update(payload).eq("id", routine.remoteId).eq("user_id", userId)
      .select("id").single());
  } else {
    row = workoutV2DbResult(await backendState.client.from("workout_routines")
      .upsert(payload, { onConflict: "user_id,workout_plan_id,code" })
      .select("id").single());
    routine.remoteId = row.id;
  }
  await workoutV2DbResult(await backendState.client.from("workout_routine_exercises")
    .delete().eq("user_id", userId).eq("routine_id", row.id));
  const rows = [];
  for (const [position, exercise] of routine.exercises.entries()) {
    const exerciseName = String(exercise.exerciseName || "").trim();
    if (!exerciseName) continue;
    const exerciseId = typeof upsertBackendWorkoutExercise === "function"
      ? await upsertBackendWorkoutExercise(exerciseName)
      : "";
    rows.push({
      user_id: userId,
      routine_id: row.id,
      exercise_id: exerciseId || null,
      exercise_name: exerciseName,
      position,
      target_sets: exercise.targetSets,
      target_reps: exercise.targetReps || null,
      target_weight_kg: exercise.targetWeightKg,
      rest_seconds: exercise.restSeconds,
      notes: exercise.notes || "",
    });
  }
  if (rows.length) workoutV2DbResult(await backendState.client.from("workout_routine_exercises").insert(rows));
}

async function workoutV2SyncSession(session) {
  if (!workoutV2UiState.remoteAvailable || !workoutV2HasBackend() || !session) return;
  const userId = getBackendUserId();
  const routine = session.routineCode ? workoutV2Routine(session.routineCode) : null;
  if (routine && !routine.remoteId) await workoutV2SyncRoutine(routine);
  const payload = {
    user_id: userId,
    routine_id: routine?.remoteId || null,
    routine_code: session.routineCode || null,
    workout_name: session.workoutName || "Workout",
    status: session.status,
    workout_date: session.dateKey,
    started_at: session.startedAt || `${session.dateKey}T12:00:00`,
    duration_seconds: session.durationSeconds,
    workout_notes: session.workoutNotes || "",
    source: session.source || "startpage",
    external_workout_number: session.externalWorkoutNumber || null,
    external_key: session.externalKey || null,
    completed_at: session.status === "completed" ? (session.completedAt || new Date().toISOString()) : null,
  };
  let row;
  if (session.remoteId) {
    row = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .update(payload).eq("id", session.remoteId).eq("user_id", userId)
      .select("id").single());
  } else if (session.externalKey) {
    row = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .upsert(payload, { onConflict: "user_id,external_key" }).select("id").single());
  } else {
    row = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .insert(payload).select("id").single());
  }
  session.remoteId = row.id;
  await workoutV2DbResult(await backendState.client.from("workout_session_entries")
    .delete().eq("user_id", userId).eq("workout_session_id", row.id));
  const rows = [];
  for (const [entryOrder, entry] of session.entries.entries()) {
    const exerciseName = String(entry.exerciseName || "").trim();
    if (!exerciseName) continue;
    const exerciseId = typeof upsertBackendWorkoutExercise === "function"
      ? await upsertBackendWorkoutExercise(exerciseName)
      : "";
    rows.push({
      user_id: userId,
      workout_session_id: row.id,
      exercise_id: exerciseId || null,
      exercise_name: exerciseName,
      entry_order: entryOrder,
      set_order: String(entry.setOrder || entryOrder + 1),
      weight_kg: entry.weightKg,
      reps: entry.reps,
      rpe: entry.rpe,
      distance_meters: entry.distanceMeters,
      seconds: entry.seconds,
      notes: entry.notes || "",
    });
  }
  if (rows.length) workoutV2DbResult(await backendState.client.from("workout_session_entries").insert(rows));
}

function workoutV2Chunks(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

async function workoutV2FetchSessions(userId) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const page = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .select("id, routine_id, routine_code, workout_name, status, workout_date, started_at, duration_seconds, workout_notes, source, external_workout_number, external_key, completed_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1));
    rows.push(...(page || []));
    if (!page || page.length < pageSize) break;
  }
  return rows;
}

async function workoutV2FetchSessionEntries(userId, sessionIds) {
  const rows = [];
  const pageSize = 1000;
  for (const ids of workoutV2Chunks(sessionIds, 40)) {
    for (let from = 0; ; from += pageSize) {
      const page = workoutV2DbResult(await backendState.client.from("workout_session_entries")
        .select("id, workout_session_id, exercise_name, entry_order, set_order, weight_kg, reps, rpe, distance_meters, seconds, notes")
        .eq("user_id", userId)
        .in("workout_session_id", ids)
        .order("workout_session_id", { ascending: true })
        .order("entry_order", { ascending: true })
        .range(from, from + pageSize - 1));
      rows.push(...(page || []));
      if (!page || page.length < pageSize) break;
    }
  }
  return rows;
}

async function workoutV2EnsureExerciseIds(sessions) {
  const names = new Map();
  sessions.forEach((session) => session.entries.forEach((entry) => {
    const name = String(entry.exerciseName || "").trim();
    if (name) names.set(name.toLocaleLowerCase(), name);
  }));
  for (const [key, name] of names) {
    if (!workoutRemoteState.exerciseIdsByName[key]) await upsertBackendWorkoutExercise(name);
  }
}

function workoutV2SessionPayload(session, userId) {
  return {
    user_id: userId,
    routine_id: null,
    routine_code: session.routineCode || null,
    workout_name: session.workoutName || "Workout",
    status: "completed",
    workout_date: session.dateKey,
    started_at: session.startedAt || `${session.dateKey}T12:00:00`,
    duration_seconds: session.durationSeconds,
    workout_notes: session.workoutNotes || "",
    source: "strong_import",
    external_workout_number: session.externalWorkoutNumber || null,
    external_key: session.externalKey,
    completed_at: session.completedAt || session.startedAt || new Date().toISOString(),
  };
}

async function workoutV2SyncImportedSessions(sessions) {
  if (!workoutV2UiState.remoteAvailable || !workoutV2HasBackend() || !sessions.length) return;
  const userId = getBackendUserId();
  await workoutV2EnsureExerciseIds(sessions);
  const remoteIdByKey = new Map();
  for (const chunk of workoutV2Chunks(sessions, 100)) {
    const saved = workoutV2DbResult(await backendState.client.from("workout_sessions")
      .upsert(chunk.map((session) => workoutV2SessionPayload(session, userId)), { onConflict: "user_id,external_key" })
      .select("id, external_key"));
    (saved || []).forEach((row) => remoteIdByKey.set(row.external_key, row.id));
  }
  sessions.forEach((session) => { session.remoteId = remoteIdByKey.get(session.externalKey) || session.remoteId; });
  const remoteIds = Array.from(remoteIdByKey.values());
  for (const ids of workoutV2Chunks(remoteIds, 40)) {
    workoutV2DbResult(await backendState.client.from("workout_session_entries")
      .delete().eq("user_id", userId).in("workout_session_id", ids));
  }
  const entryRows = [];
  sessions.forEach((session) => {
    const sessionId = remoteIdByKey.get(session.externalKey);
    if (!sessionId) return;
    session.entries.forEach((entry, entryOrder) => {
      const exerciseName = String(entry.exerciseName || "").trim();
      if (!exerciseName) return;
      entryRows.push({
        user_id: userId,
        workout_session_id: sessionId,
        exercise_id: workoutRemoteState.exerciseIdsByName[exerciseName.toLocaleLowerCase()] || null,
        exercise_name: exerciseName,
        entry_order: entryOrder,
        set_order: String(entry.setOrder || entryOrder + 1),
        weight_kg: entry.weightKg,
        reps: entry.reps,
        rpe: entry.rpe,
        distance_meters: entry.distanceMeters,
        seconds: entry.seconds,
        notes: entry.notes || "",
      });
    });
  });
  for (const chunk of workoutV2Chunks(entryRows, 500)) {
    workoutV2DbResult(await backendState.client.from("workout_session_entries").insert(chunk));
  }
}

async function workoutV2SyncAll() {
  for (const routine of workoutV2Data().routines) await workoutV2SyncRoutine(routine);
  for (const session of workoutV2Data().sessions) await workoutV2SyncSession(session);
  workoutV2SetData(workoutV2Data());
}

function workoutV2QueueRemoteSave(scope) {
  if (!workoutV2UiState.remoteAvailable) return;
  workoutV2UiState.saveChain = workoutV2UiState.saveChain.then(async () => {
    try {
      if (scope?.routine) await workoutV2SyncRoutine(scope.routine);
      if (scope?.session) await workoutV2SyncSession(scope.session);
      if (!scope?.routine && !scope?.session) await workoutV2SyncAll();
      workoutV2SetData(workoutV2Data());
      workoutV2SetStatus("Saved to Supabase.");
    } catch (error) {
      console.error("Workout V2 backend save error:", error);
      workoutV2SetStatus("Backend save failed; local copy kept.");
      if (workoutV2MissingTable(error)) workoutV2UiState.remoteAvailable = false;
    }
  });
}

function workoutV2ScheduleSave(scope) {
  workoutV2SetData(workoutV2Data());
  workoutV2SetStatus(workoutV2UiState.remoteAvailable ? "Saving…" : "Saved locally.");
  clearTimeout(workoutV2UiState.saveTimer);
  workoutV2UiState.saveTimer = setTimeout(() => workoutV2QueueRemoteSave(scope), 350);
}

function resetWorkoutV2BackendState() {
  workoutV2UiState.remoteAvailable = false;
  workoutV2UiState.remoteLoading = false;
  workoutV2UiState.remoteLoaded = false;
  workoutV2UiState.data = null;
  workoutV2UiState.selectedSessionId = "";
  workoutV2UiState.importPreview = null;
  if (typeof workoutRemoteState !== "undefined") {
    workoutRemoteState.v2Loaded = false;
    workoutRemoteState.v2Available = false;
  }
}

async function loadWorkoutV2BackendState() {
  if (workoutV2UiState.remoteLoading) return;
  if (!workoutV2HasBackend()) {
    resetWorkoutV2BackendState();
    workoutV2UiState.data = workoutV2LoadLocal();
    renderWorkoutV2();
    return;
  }
  workoutV2UiState.remoteLoading = true;
  const localData = workoutV2Data();
  try {
    const userId = getBackendUserId();
    const sessionRows = await workoutV2FetchSessions(userId);
    const sessionIds = (sessionRows || []).map((row) => row.id);
    let entryRows = [];
    if (sessionIds.length) {
      entryRows = await workoutV2FetchSessionEntries(userId, sessionIds);
    }
    const entriesBySession = new Map();
    entryRows.forEach((row) => {
      if (!entriesBySession.has(row.workout_session_id)) entriesBySession.set(row.workout_session_id, []);
      entriesBySession.get(row.workout_session_id).push({
        id: row.id, remoteId: row.id, exerciseName: row.exercise_name, entryOrder: row.entry_order,
        setOrder: row.set_order, weightKg: row.weight_kg, reps: row.reps, rpe: row.rpe,
        distanceMeters: row.distance_meters, seconds: row.seconds, notes: row.notes,
      });
    });
    const remoteSessions = sessionRows.map((row) => ({
      id: row.id, remoteId: row.id, routineCode: row.routine_code, workoutName: row.workout_name,
      status: row.status, dateKey: row.workout_date, startedAt: row.started_at,
      durationSeconds: row.duration_seconds, workoutNotes: row.workout_notes, source: row.source,
      externalWorkoutNumber: row.external_workout_number, externalKey: row.external_key,
      completedAt: row.completed_at, entries: entriesBySession.get(row.id) || [],
    }));
    workoutV2UiState.remoteAvailable = true;
    workoutV2UiState.remoteLoaded = true;
    workoutRemoteState.v2Loaded = true;
    workoutRemoteState.v2Available = true;
    workoutV2SetData({ version: 2, routines: localData.routines, sessions: remoteSessions.length ? remoteSessions : localData.sessions });
    if (!remoteSessions.length) {
      const localStrongSessions = workoutV2Data().sessions.filter((session) => session.source === "strong_import");
      if (localStrongSessions.length) await workoutV2SyncImportedSessions(localStrongSessions);
    }
    await workoutV2ReconcileAllDates();
    workoutV2SetStatus("Loaded from Supabase.");
  } catch (error) {
    console.warn("Workout V2 backend unavailable; using local data:", error);
    workoutV2UiState.remoteAvailable = false;
    workoutV2UiState.remoteLoaded = false;
    workoutRemoteState.v2Loaded = false;
    workoutRemoteState.v2Available = false;
    workoutV2UiState.data = localData;
    workoutV2SetStatus(workoutV2MissingTable(error)
      ? "Workout V2 tables are not installed; using local storage."
      : "Workout backend unavailable; using local storage.");
  } finally {
    workoutV2UiState.remoteLoading = false;
    renderWorkoutV2();
  }
}

function workoutV2RoutineOptions(selected, allowBlank) {
  const blank = allowBlank ? '<option value="">Unknown / no routine</option>' : "";
  return blank + workoutV2Data().routines.map((routine) =>
    `<option value="${routine.code}"${routine.code === selected ? " selected" : ""}>${routine.code} — ${workoutV2Escape(routine.name)}</option>`
  ).join("");
}

function workoutV2RenderTabs() {
  return `<div class="workout-v2-tabs" role="tablist">${WORKOUT_V2_VIEWS.map((view) =>
    `<button type="button" role="tab" data-view="${workoutV2Escape(view)}" aria-selected="${view === workoutV2UiState.view}">${workoutV2Escape(view)}</button>`
  ).join("")}</div>`;
}

function workoutV2RenderEmptyLog() {
  const dateKey = workoutV2UiState.pendingDateKey || workoutV2Today();
  const code = workoutV2UiState.pendingRoutineCode || "A";
  return `<section class="workout-v2-panel">
    <h3>Start or open a workout</h3>
    <div class="workout-v2-form-row">
      <label>Date<input id="workoutV2NewDate" type="date" value="${workoutV2Escape(dateKey)}"></label>
      <label>Routine<select id="workoutV2NewRoutine">${workoutV2RoutineOptions(code, false)}</select></label>
      <button type="button" data-action="create-draft">Start draft</button>
    </div>
    <p class="workout-v2-help">Choose A–F. A draft does not count toward Physique until you finish it.</p>
  </section>`;
}

function workoutV2ExerciseGroups(session) {
  const groups = [];
  (session?.entries || []).forEach((entry, index) => {
    const name = String(entry.exerciseName || "");
    const previous = groups[groups.length - 1];
    if (!previous || previous.name !== name) {
      groups.push({ name, startIndex: index, entries: [{ entry, index }] });
    } else {
      previous.entries.push({ entry, index });
    }
  });
  return groups;
}

function workoutV2RenumberWorkingSets(session) {
  workoutV2ExerciseGroups(session).forEach((group) => {
    let workingSet = 0;
    group.entries.forEach(({ entry }) => {
      if (/^\d+$/.test(String(entry.setOrder || "")) || !entry.setOrder) {
        workingSet += 1;
        entry.setOrder = String(workingSet);
      }
    });
  });
  session.entries.forEach((entry, index) => { entry.entryOrder = index; });
}

function workoutV2SetType(setOrder) {
  const value = String(setOrder || "");
  if (value === "W") return "warmup";
  if (value === "F") return "failure";
  if (value === "D") return "drop";
  if (value === "Note") return "note";
  if (value === "Rest Timer") return "rest";
  return "working";
}

function workoutV2SetTypeOptions(setOrder) {
  const current = workoutV2SetType(setOrder);
  return [
    ["working", "Working"],
    ["warmup", "Warm-up"],
    ["failure", "Failure"],
    ["drop", "Drop"],
    ["note", "Note"],
    ["rest", "Rest timer"],
  ].map(([value, label]) => `<option value="${value}"${value === current ? " selected" : ""}>${label}</option>`).join("");
}

function workoutV2RenderSetRow(entry, index, completed, workingNumber) {
  const disabled = completed ? " disabled" : "";
  const numberInput = (field, value, attrs) => `<input type="number" data-entry-index="${index}" data-entry-field="${field}" value="${value == null ? "" : workoutV2Escape(value)}" ${attrs || ""}${disabled}>`;
  const type = workoutV2SetType(entry.setOrder);
  const setLabel = type === "working" ? String(workingNumber) : "—";
  return `<tr data-entry-id="${workoutV2Escape(entry.id)}">
    <td class="workout-v2-set-number">${setLabel}</td>
    <td><select data-entry-index="${index}" data-entry-field="setType"${disabled}>${workoutV2SetTypeOptions(entry.setOrder)}</select></td>
    <td>${numberInput("weightKg", entry.weightKg, 'min="0" step="0.01"')}</td>
    <td>${numberInput("reps", entry.reps, 'min="0" step="0.01"')}</td>
    <td>${numberInput("rpe", entry.rpe, 'min="0" max="10" step="0.5"')}</td>
    <td>${numberInput("distanceMeters", entry.distanceMeters, 'min="0" step="0.01"')}</td>
    <td>${numberInput("seconds", entry.seconds, 'min="0" step="0.01"')}</td>
    <td><input class="workout-v2-set-notes" data-entry-index="${index}" data-entry-field="notes" value="${workoutV2Escape(entry.notes)}"${disabled}></td>
    <td><button type="button" data-action="remove-entry" data-index="${index}" aria-label="Remove set" title="Remove set"${disabled}>Remove</button></td>
  </tr>`;
}

function workoutV2RenderExerciseGroup(group, groupOrder, completed) {
  let workingNumber = 0;
  const rows = group.entries.map(({ entry, index }) => {
    if (workoutV2SetType(entry.setOrder) === "working") workingNumber += 1;
    return workoutV2RenderSetRow(entry, index, completed, workingNumber);
  }).join("");
  const controls = completed ? "" : `<div class="workout-v2-exercise-actions">
    <button type="button" data-action="move-exercise" data-start="${group.startIndex}" data-count="${group.entries.length}" data-direction="-1" title="Move exercise earlier">↑</button>
    <button type="button" data-action="move-exercise" data-start="${group.startIndex}" data-count="${group.entries.length}" data-direction="1" title="Move exercise later">↓</button>
    <button type="button" data-action="remove-exercise" data-start="${group.startIndex}" data-count="${group.entries.length}">Remove exercise</button>
  </div>`;
  return `<section class="workout-v2-exercise-group">
    <div class="workout-v2-exercise-heading">
      <span class="workout-v2-exercise-order">Exercise ${groupOrder + 1}</span>
      <input class="workout-v2-exercise-name" data-exercise-name-start="${group.startIndex}" data-exercise-name-count="${group.entries.length}" value="${workoutV2Escape(group.name)}" list="workoutV2ExerciseNames" placeholder="Exercise name"${completed ? " disabled" : ""}>
      ${controls}
    </div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table workout-v2-set-table">
      <thead><tr><th>Set</th><th>Set type</th><th>Weight (kg)</th><th>Reps</th><th>RPE</th><th>Distance (m)</th><th>Seconds</th><th>Notes</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    ${completed ? "" : `<button type="button" class="workout-v2-add-set" data-action="add-set" data-start="${group.startIndex}" data-count="${group.entries.length}">Add set</button>`}
  </section>`;
}

function workoutV2ExerciseNames() {
  const names = new Set();
  workoutV2Data().routines.forEach((routine) => routine.exercises.forEach((exercise) => names.add(exercise.exerciseName)));
  workoutV2Data().sessions.forEach((session) => session.entries.forEach((entry) => names.add(entry.exerciseName)));
  return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function workoutV2RenderLog() {
  const session = workoutV2Session(workoutV2UiState.selectedSessionId);
  if (!session) return workoutV2RenderEmptyLog();
  const completed = session.status === "completed";
  const groups = workoutV2ExerciseGroups(session);
  const groupPage = workoutV2Paginate(groups, "Log");
  return `<section class="workout-v2-panel workout-v2-log">
    <div class="workout-v2-panel-heading"><h3>Workout log</h3><span class="workout-v2-status workout-v2-status--${session.status}">Status: ${session.status}</span></div>
    <div class="workout-v2-form-grid">
      <label>Date<input type="date" data-session-field="dateKey" value="${workoutV2Escape(session.dateKey)}"${completed ? " disabled" : ""}></label>
      <label class="workout-v2-wide-field">Workout name<input data-session-field="workoutName" value="${workoutV2Escape(session.workoutName)}"${completed ? " disabled" : ""}></label>
      <label>Routine<select data-session-field="routineCode"${completed ? " disabled" : ""}>${workoutV2RoutineOptions(session.routineCode, true)}</select></label>
      <label>Duration (seconds)<input type="number" min="0" step="1" data-session-field="durationSeconds" value="${session.durationSeconds == null ? "" : workoutV2Escape(session.durationSeconds)}"${completed ? " disabled" : ""}></label>
    </div>
    <label class="workout-v2-block-label">Workout notes<textarea data-session-field="workoutNotes" rows="3"${completed ? " disabled" : ""}>${workoutV2Escape(session.workoutNotes)}</textarea></label>
    <div class="workout-v2-section-title">Exercises — shown in the order performed</div>
    <div class="workout-v2-exercise-list">${groupPage.items.map((group, index) => workoutV2RenderExerciseGroup(group, groupPage.start + index, completed)).join("") || '<div class="workout-v2-empty">No exercises yet. Add the first exercise below.</div>'}</div>
    ${workoutV2RenderPagination("Log", groups.length)}
    <datalist id="workoutV2ExerciseNames">${workoutV2ExerciseNames().map((name) => `<option value="${workoutV2Escape(name)}"></option>`).join("")}</datalist>
    <div class="workout-v2-actions">
      ${completed ? '<button type="button" data-action="reopen">Reopen workout</button>' : '<button type="button" data-action="add-exercise">Add exercise</button><button type="button" class="workout-v2-primary" data-action="finish">Finish workout</button>'}
      <button type="button" class="workout-v2-danger" data-action="delete-session">Delete workout</button>
      <button type="button" data-action="close-session">Back</button>
    </div>
  </section>`;
}

function workoutV2RenderTemplateRow(exercise, index) {
  const numberInput = (field, value, attrs) => `<input type="number" data-template-index="${index}" data-template-field="${field}" value="${value == null ? "" : workoutV2Escape(value)}" ${attrs || ""}>`;
  return `<tr>
    <td>${index + 1}</td>
    <td><input data-template-index="${index}" data-template-field="exerciseName" value="${workoutV2Escape(exercise.exerciseName)}" list="workoutV2ExerciseNames"></td>
    <td>${numberInput("targetSets", exercise.targetSets, 'min="1" step="1"')}</td>
    <td><input data-template-index="${index}" data-template-field="targetReps" value="${workoutV2Escape(exercise.targetReps)}" placeholder="8-12"></td>
    <td>${numberInput("targetWeightKg", exercise.targetWeightKg, 'min="0" step="0.01"')}</td>
    <td>${numberInput("restSeconds", exercise.restSeconds, 'min="0" step="1"')}</td>
    <td><input data-template-index="${index}" data-template-field="notes" value="${workoutV2Escape(exercise.notes)}"></td>
    <td><button type="button" data-action="remove-template-entry" data-index="${index}" aria-label="Remove template exercise">Remove</button></td>
  </tr>`;
}

function workoutV2RenderTemplates() {
  const routine = workoutV2Routine(workoutV2UiState.templateCode);
  const exercisePage = workoutV2Paginate(routine.exercises, "Templates");
  return `<section class="workout-v2-panel">
    <h3>Workout templates</h3>
    <div class="workout-v2-form-row">
      <label>Template<select id="workoutV2TemplateCode">${workoutV2RoutineOptions(routine.code, false)}</select></label>
      <label class="workout-v2-grow">Routine name<input data-routine-field="name" value="${workoutV2Escape(routine.name)}"></label>
    </div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table">
      <thead><tr><th>#</th><th>Exercise</th><th>Target sets</th><th>Target reps</th><th>Target kg</th><th>Rest sec</th><th>Notes</th><th>Action</th></tr></thead>
      <tbody>${exercisePage.items.map((exercise, index) => workoutV2RenderTemplateRow(exercise, exercisePage.start + index)).join("")}</tbody>
    </table></div>
    ${workoutV2RenderPagination("Templates", routine.exercises.length)}
    <datalist id="workoutV2ExerciseNames">${workoutV2ExerciseNames().map((name) => `<option value="${workoutV2Escape(name)}"></option>`).join("")}</datalist>
    <div class="workout-v2-actions"><button type="button" data-action="add-template-entry">Add exercise</button></div>
  </section>`;
}

function workoutV2FilteredHistory() {
  const text = workoutV2UiState.historyText.trim().toLocaleLowerCase();
  return workoutV2Data().sessions.filter((session) => {
    if (workoutV2UiState.historyFrom && session.dateKey < workoutV2UiState.historyFrom) return false;
    if (workoutV2UiState.historyTo && session.dateKey > workoutV2UiState.historyTo) return false;
    if (!text) return true;
    return [session.workoutName, session.routineCode, session.workoutNotes, ...session.entries.map((entry) => entry.exerciseName)]
      .some((value) => String(value || "").toLocaleLowerCase().includes(text));
  }).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

function workoutV2RenderHistoryLegacy() {
  const allRows = workoutV2FilteredHistory();
  const page = workoutV2Paginate(allRows, "History");
  const rows = page.items;
  return `<section class="workout-v2-panel">
    <h3>Workout history</h3>
    <div class="workout-v2-form-row workout-v2-filters">
      <label class="workout-v2-grow">Text, routine, or exercise<input id="workoutV2HistoryText" value="${workoutV2Escape(workoutV2UiState.historyText)}"></label>
      <label>From<input id="workoutV2HistoryFrom" type="date" value="${workoutV2Escape(workoutV2UiState.historyFrom)}"></label>
      <label>To<input id="workoutV2HistoryTo" type="date" value="${workoutV2Escape(workoutV2UiState.historyTo)}"></label>
      <button type="button" data-action="apply-history-filters">Filter</button>
    </div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table">
      <thead><tr><th>Date</th><th>Routine</th><th>Name</th><th>Status</th><th>Duration</th><th>Exercises</th><th>Sets / rows</th><th>Notes</th><th></th></tr></thead>
      <tbody>${rows.map((session) => `<tr>
        <td>${workoutV2Escape(session.dateKey)}</td><td>${workoutV2Escape(session.routineCode || "—")}</td><td>${workoutV2Escape(session.workoutName)}</td>
        <td>${workoutV2Escape(session.status)}</td><td>${session.durationSeconds == null ? "—" : workoutV2Escape(session.durationSeconds)}</td>
        <td>${new Set(session.entries.map((entry) => entry.exerciseName).filter(Boolean)).size}</td><td>${session.entries.length}</td><td class="workout-v2-notes-cell">${workoutV2Escape(session.workoutNotes)}</td>
        <td><button type="button" data-action="open-session" data-session-id="${workoutV2Escape(session.id)}">Open</button></td>
      </tr>`).join("") || '<tr><td colspan="9">No workouts match these filters.</td></tr>'}</tbody>
    </table></div>
    ${workoutV2RenderPagination("History", allRows.length)}
  </section>`;
}

function workoutV2ProgressRows(exerciseName) {
  const rows = [];
  workoutV2Data().sessions.filter((session) => session.status === "completed").forEach((session) => {
    session.entries.forEach((entry) => {
      if (entry.exerciseName !== exerciseName) return;
      const setKind = String(entry.setOrder || "").trim().toLocaleLowerCase();
      if (setKind === "note" || setKind === "rest timer") return;
      rows.push({ session, entry, volume: entry.weightKg != null && entry.reps != null ? entry.weightKg * entry.reps : null });
    });
  });
  return rows.sort((a, b) => String(b.session.startedAt).localeCompare(String(a.session.startedAt)));
}

function workoutV2RenderProgressLegacy() {
  const names = workoutV2ExerciseNames();
  if (!workoutV2UiState.progressExercise && names.length) workoutV2UiState.progressExercise = names[0];
  const exercise = workoutV2UiState.progressExercise;
  const rows = workoutV2ProgressRows(exercise);
  const page = workoutV2Paginate(rows, "Progress");
  const weights = rows.map((row) => row.entry.weightKg).filter((value) => value != null);
  const volumes = rows.map((row) => row.volume).filter((value) => value != null);
  const bestWeight = weights.length ? Math.max(...weights) : null;
  const totalVolume = volumes.reduce((sum, value) => sum + value, 0);
  return `<section class="workout-v2-panel">
    <h3>Exercise progress</h3>
    <div class="workout-v2-form-row"><label>Exercise<select id="workoutV2ProgressExercise">${names.map((name) => `<option value="${workoutV2Escape(name)}"${name === exercise ? " selected" : ""}>${workoutV2Escape(name)}</option>`).join("")}</select></label></div>
    <div class="workout-v2-metrics"><div><strong>Best weight</strong><span>${bestWeight == null ? "—" : `${workoutV2Escape(bestWeight)} kg`}</span></div><div><strong>Recorded volume</strong><span>${volumes.length ? `${workoutV2Escape(totalVolume.toFixed(2))} kg` : "—"}</span></div><div><strong>Recent rows</strong><span>${rows.length}</span></div></div>
    <div class="workout-v2-table-wrap"><table class="workout-v2-table">
      <thead><tr><th>Date</th><th>Workout</th><th>Set</th><th>kg</th><th>Reps</th><th>RPE</th><th>Volume</th><th>Notes</th></tr></thead>
      <tbody>${page.items.map(({ session, entry, volume }) => `<tr><td>${workoutV2Escape(session.dateKey)}</td><td>${workoutV2Escape(session.workoutName)}</td><td>${workoutV2Escape(entry.setOrder)}</td><td>${entry.weightKg ?? "—"}</td><td>${entry.reps ?? "—"}</td><td>${entry.rpe ?? "—"}</td><td>${volume == null ? "—" : workoutV2Escape(volume.toFixed(2))}</td><td>${workoutV2Escape(entry.notes)}</td></tr>`).join("") || '<tr><td colspan="8">No completed strength rows for this exercise.</td></tr>'}</tbody>
    </table></div>
    ${workoutV2RenderPagination("Progress", rows.length)}
    <p class="workout-v2-help">Note and Rest Timer rows are preserved in history/export but excluded from progress calculations.</p>
  </section>`;
}

function workoutV2RenderImportExportLegacy() {
  const preview = workoutV2UiState.importPreview;
  return `<section class="workout-v2-panel">
    <h3>Strong CSV import</h3>
    <div class="workout-v2-form-row"><label class="workout-v2-file-label">Choose CSV<input id="workoutV2CsvFile" type="file" accept=".csv,text/csv"></label></div>
    <label class="workout-v2-block-label">Or paste Strong CSV<textarea id="workoutV2CsvText" rows="6" placeholder="Paste the 13-column semicolon CSV here">${workoutV2Escape(workoutV2UiState.importText)}</textarea></label>
    <div class="workout-v2-actions"><button type="button" data-action="preview-import">Preview import</button>${preview && preview.errors.length === 0 ? '<button type="button" class="workout-v2-primary" data-action="confirm-import">Import preview</button>' : ""}</div>
    ${preview ? `<div class="workout-v2-import-preview"><strong>Preview:</strong> ${preview.workouts.length} workout(s), ${preview.rows.length} row(s), ${preview.errors.length} error(s).${preview.errors.length ? `<ul>${preview.errors.map((error) => `<li>${workoutV2Escape(error)}</li>`).join("")}</ul>` : ""}</div>` : ""}
    <hr>
    <h3>Strong CSV export</h3>
    <div class="workout-v2-form-row"><label>From<input id="workoutV2ExportFrom" type="date"></label><label>To<input id="workoutV2ExportTo" type="date"></label><button type="button" data-action="export-csv">Download CSV</button></div>
  </section>`;
}

function workoutV2CompletedSessions() {
  return workoutV2Data().sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

function workoutV2FormatNumber(value, digits) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits ?? 1 }).format(number);
}

// One metric value plus its unit, the shape every tooltip row and axis label uses.
function workoutV2MetricValue(metric, value) {
  if (value == null || !Number.isFinite(Number(value))) return "";
  const text = workoutV2FormatNumber(value, metric === "workingSets" ? 0 : 1);
  return WORKOUT_V2_METRICS[metric]?.unit ? `${text} ${WORKOUT_V2_METRICS[metric].unit}` : text;
}

// Axis labels follow the tick step so "10" never shows up next to "62.5".
function workoutV2AxisLabel(value, step) {
  const decimals = step >= 1 ? (Number.isInteger(step) ? 0 : 1) : step >= 0.1 ? 1 : 2;
  return workoutV2FormatNumber(value, decimals);
}

// "80×8 · 85×6 · 85×5" — the session's actual sets, so hover says more than a total.
function workoutV2SetList(sets) {
  return (Array.isArray(sets) ? sets : []).map((set) => {
    const weight = Number(set?.weightKg);
    const reps = Number(set?.reps);
    const seconds = Number(set?.seconds);
    const distance = Number(set?.distanceMeters);
    const rpe = Number(set?.rpe);
    if (Number.isFinite(weight) && Number.isFinite(reps)) {
      return `${workoutV2FormatNumber(weight, 1)}×${reps}${Number.isFinite(rpe) ? `@${workoutV2FormatNumber(rpe, 1)}` : ""}`;
    }
    if (Number.isFinite(reps)) return `${reps} reps`;
    if (Number.isFinite(seconds)) return `${workoutV2FormatNumber(seconds, 0)}s`;
    if (Number.isFinite(distance)) return `${workoutV2FormatNumber(distance, 0)} m`;
    return "";
  }).filter(Boolean).join(" · ");
}

function workoutV2FormatDuration(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return "—";
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function workoutV2MetricCard(label, value, hint) {
  return `<div class="workout-v2-metric"><span>${workoutV2Escape(label)}</span><strong>${workoutV2Escape(value)}</strong>${hint ? `<small>${workoutV2Escape(hint)}</small>` : ""}</div>`;
}

function workoutV2WeeklyCounts(sessions, count) {
  const weeks = [];
  const today = new Date(`${workoutV2Today()}T12:00:00`);
  const day = (today.getDay() + 6) % 7;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - day);
  for (let offset = count - 1; offset >= 0; offset--) {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const key = start.toISOString().slice(0, 10);
    const lastDay = new Date(end.getTime() - 86400000).toISOString().slice(0, 10);
    weeks.push({
      label: key.slice(5),
      dateKey: key,
      rangeLabel: `${key} → ${lastDay}`,
      value: sessions.filter((session) => {
        const date = new Date(`${session.dateKey}T12:00:00`);
        return date >= start && date < end;
      }).length,
    });
  }
  return weeks;
}

// Weekly counts are whole numbers, so the axis step is forced to an integer.
function workoutV2CountAxis(maxValue) {
  const rounded = WorkoutCore.niceAxisTicks(0, Math.max(1, Number(maxValue) || 1), 3);
  const step = Math.max(1, Math.ceil(rounded.step || 1));
  const max = Math.max(step, Math.ceil(rounded.max / step) * step);
  const ticks = [];
  for (let value = 0; value <= max; value += step) ticks.push(value);
  return { max, step, ticks };
}

function workoutV2BarChart(points, label) {
  const axis = workoutV2CountAxis(Math.max(0, ...points.map((point) => point.value)));
  const barPixels = (value) => Math.round((value / axis.max) * WORKOUT_V2_BAR_TRACK_PX);
  const baseline = (tick) => WORKOUT_V2_BAR_LABEL_PX + barPixels(tick);
  const gridlines = axis.ticks.map((tick) => `<div class="workout-v2-bar-gridline${tick ? "" : " is-base"}" style="bottom:${baseline(tick)}px"></div>`).join("");
  const scale = axis.ticks.map((tick) => `<span style="bottom:${baseline(tick)}px">${tick}</span>`).join("");
  const columns = points.map((point) => {
    const rows = [["Workouts", String(point.value)], ["Week", point.rangeLabel || point.label]];
    return `<div class="chart-hit workout-v2-bar-column" role="img" aria-label="Week of ${workoutV2Escape(point.label)}: ${point.value} workout(s)" data-tip-date="${workoutV2Escape(point.dateKey || point.label)}" data-tip-title="Week of ${workoutV2Escape(point.dateKey || point.label)}" data-tip-rows="${workoutV2Escape(JSON.stringify(rows))}"><span>${point.value}</span><i style="height:${barPixels(point.value)}px"></i><small>${workoutV2Escape(point.label)}</small></div>`;
  }).join("");
  return `<div class="workout-v2-bar-chart" role="img" aria-label="${workoutV2Escape(label)} · ${points.length} weeks · 0 to ${axis.max} per week">
    <div class="workout-v2-bar-scale" aria-hidden="true">${scale}</div>
    <div class="workout-v2-bar-plot">${gridlines}<div class="workout-v2-bar-columns">${columns}</div></div>
    <p class="workout-v2-chart-caption">Workouts per week · week starting (MM-DD)</p>
  </div>`;
}

function workoutV2RenderOverview() {
  const sessions = workoutV2CompletedSessions();
  const summary = WorkoutCore.computeWorkoutSummary({ version: 2, routines: [], sessions });
  const recent = sessions.slice(0, 8);
  const exerciseCounts = new Map();
  sessions.forEach((session) => {
    new Set(session.entries.map((entry) => entry.exerciseName).filter(Boolean)).forEach((name) => {
      exerciseCounts.set(name, (exerciseCounts.get(name) || 0) + 1);
    });
  });
  const topExercises = Array.from(exerciseCounts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 8);
  if (!sessions.length) return `<section class="workout-v2-panel workout-v2-welcome"><h3>Workout analytics</h3><p>Startpage reads your Strong CSV; Strong remains where you log workouts.</p><button type="button" class="workout-v2-primary" data-action="go-import">Import a Strong export</button></section>`;
  return `<section class="workout-v2-panel">
    <div class="workout-v2-panel-heading"><div><h3>Training overview</h3><p class="workout-v2-subtitle">Strong data from ${workoutV2Escape(summary.firstDate)} to ${workoutV2Escape(summary.lastDate)}</p></div><button type="button" data-action="go-import">Sync Strong CSV</button></div>
    <div class="workout-v2-metric-grid">
      ${workoutV2MetricCard("Workouts", workoutV2FormatNumber(summary.sessions, 0), "completed sessions")}
      ${workoutV2MetricCard("Working sets", workoutV2FormatNumber(summary.workingSets, 0), `${workoutV2FormatNumber(summary.rows, 0)} total CSV rows`)}
      ${workoutV2MetricCard("Exercises", workoutV2FormatNumber(summary.exercises, 0), "distinct movements")}
      ${workoutV2MetricCard("Volume", `${workoutV2FormatNumber(summary.volumeKg, 0)} kg`, "weight × reps")}
      ${workoutV2MetricCard("Training time", workoutV2FormatDuration(summary.durationSeconds), "recorded by Strong")}
    </div>
    <div class="workout-v2-dashboard-grid">
      <section class="workout-v2-inset"><h4>Workouts per week</h4>${workoutV2BarChart(workoutV2WeeklyCounts(sessions, 12), "Workout count for the last twelve weeks")}</section>
      <section class="workout-v2-inset"><h4>Most frequent exercises</h4><ol class="workout-v2-ranking">${topExercises.map((item) => `<li><button type="button" data-action="open-exercise" data-exercise="${workoutV2Escape(item.name)}"><span>${workoutV2Escape(item.name)}</span><strong>${item.count}</strong></button></li>`).join("")}</ol></section>
    </div>
    <section class="workout-v2-inset"><div class="workout-v2-section-heading"><h4>Recent sessions</h4><button type="button" data-action="go-history">All history</button></div>${workoutV2SessionTable(recent)}</section>
  </section>`;
}

function workoutV2SessionTable(sessions) {
  return `<div class="workout-v2-table-wrap"><table class="workout-v2-table workout-v2-history-table"><thead><tr><th>Date</th><th>Session</th><th>Exercises</th><th>Sets / rows</th><th>Duration</th><th></th></tr></thead><tbody>${sessions.map((session) => `<tr>
    <td>${workoutV2Escape(session.dateKey)}</td><td>${workoutV2Escape(session.workoutName)}</td>
    <td>${new Set(session.entries.map((entry) => entry.exerciseName).filter(Boolean)).size}</td><td>${session.entries.length}</td>
    <td>${workoutV2Escape(workoutV2FormatDuration(session.durationSeconds))}</td><td><button type="button" data-action="open-session" data-session-id="${workoutV2Escape(session.id)}">Details</button></td>
  </tr>`).join("") || '<tr><td colspan="6">No sessions match these filters.</td></tr>'}</tbody></table></div>`;
}

function workoutV2RenderHistory() {
  if (workoutV2UiState.selectedSessionId) return workoutV2RenderSessionDetail(workoutV2Session(workoutV2UiState.selectedSessionId));
  const text = workoutV2UiState.historyText.trim().toLocaleLowerCase();
  const all = workoutV2CompletedSessions().filter((session) => {
    if (workoutV2UiState.historyFrom && session.dateKey < workoutV2UiState.historyFrom) return false;
    if (workoutV2UiState.historyTo && session.dateKey > workoutV2UiState.historyTo) return false;
    if (!text) return true;
    return [session.workoutName, session.routineCode, session.workoutNotes, ...session.entries.map((entry) => entry.exerciseName)]
      .some((value) => String(value || "").toLocaleLowerCase().includes(text));
  });
  const page = workoutV2Paginate(all, "History");
  return `<section class="workout-v2-panel"><h3>Session history</h3><div class="workout-v2-form-row workout-v2-filters">
    <label class="workout-v2-grow">Session or exercise<input id="workoutV2HistoryText" value="${workoutV2Escape(workoutV2UiState.historyText)}"></label>
    <label>From<input id="workoutV2HistoryFrom" type="date" value="${workoutV2Escape(workoutV2UiState.historyFrom)}"></label>
    <label>To<input id="workoutV2HistoryTo" type="date" value="${workoutV2Escape(workoutV2UiState.historyTo)}"></label>
    <button type="button" data-action="apply-history-filters">Apply</button><button type="button" data-action="clear-history-filters">Clear</button>
  </div>${workoutV2SessionTable(page.items)}${workoutV2RenderPagination("History", all.length)}</section>`;
}

function workoutV2RenderSessionDetail(session) {
  if (!session) { workoutV2UiState.selectedSessionId = ""; return workoutV2RenderHistory(); }
  const groups = workoutV2ExerciseGroups(session);
  const exerciseCount = new Set(session.entries.map((entry) => entry.exerciseName).filter(Boolean)).size;
  return `<section class="workout-v2-panel"><div class="workout-v2-panel-heading"><div><h3>${workoutV2Escape(session.workoutName)}</h3><p class="workout-v2-subtitle">${workoutV2Escape(session.dateKey)} · ${exerciseCount} exercises · ${session.entries.length} CSV rows · ${workoutV2Escape(workoutV2FormatDuration(session.durationSeconds))}</p></div><button type="button" data-action="close-session">Back to history</button></div>
    ${session.workoutNotes ? `<div class="workout-v2-session-notes"><strong>Workout notes</strong><p>${workoutV2Escape(session.workoutNotes)}</p></div>` : ""}
    <div class="workout-v2-detail-groups">${groups.map((group, index) => `<section class="workout-v2-detail-group"><div class="workout-v2-section-heading"><h4>${index + 1}. ${workoutV2Escape(group.name)}</h4><button type="button" data-action="open-exercise" data-exercise="${workoutV2Escape(group.name)}">Progress</button></div>
      <div class="workout-v2-table-wrap"><table class="workout-v2-table workout-v2-detail-table"><thead><tr><th>Set</th><th>kg</th><th>Reps</th><th>e1RM</th><th>RPE</th><th>Distance</th><th>Time</th><th>Notes</th></tr></thead><tbody>${group.entries.map(({ entry }) => {
        const estimate = WorkoutCore.estimatedOneRepMax(entry.weightKg, entry.reps);
        return `<tr><td>${workoutV2Escape(entry.setOrder)}</td><td>${entry.weightKg ?? "—"}</td><td>${entry.reps ?? "—"}</td><td>${estimate == null ? "—" : workoutV2FormatNumber(estimate, 1)}</td><td>${entry.rpe ?? "—"}</td><td>${entry.distanceMeters == null ? "—" : `${entry.distanceMeters} m`}</td><td>${entry.seconds == null ? "—" : `${entry.seconds} s`}</td><td>${workoutV2Escape(entry.notes)}</td></tr>`;
      }).join("")}</tbody></table></div></section>`).join("")}</div>
  </section>`;
}

function workoutV2ImportedExerciseNames() {
  const names = new Set();
  workoutV2CompletedSessions().forEach((session) => session.entries.forEach((entry) => {
    if (entry.exerciseName) names.add(entry.exerciseName);
  }));
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

// Preset range and exact dates combine: the preset sets the window, From/To sharpen it.
function workoutV2FilteredSeries(series) {
  const presetCutoff = workoutV2UiState.progressRange === "all"
    ? null
    : (() => {
      const cutoff = new Date(`${workoutV2Today()}T12:00:00`);
      cutoff.setMonth(cutoff.getMonth() - Number(workoutV2UiState.progressRange));
      return cutoff.getTime();
    })();
  const from = workoutV2UiState.progressFrom;
  const to = workoutV2UiState.progressTo;
  return series.filter((point) => {
    const dateKey = String(point.dateKey || "").slice(0, 10);
    if (!dateKey) return false;
    if (from && dateKey < from) return false;
    if (to && dateKey > to) return false;
    if (presetCutoff != null && new Date(`${dateKey}T12:00:00`).getTime() < presetCutoff) return false;
    return true;
  });
}

// The SVG is drawn at the panel's real pixel width, so stretching the window gives
// the graph more room (and more date ticks) instead of blowing up every label.
function workoutV2ChartWidth() {
  const mount = document.getElementById("workoutTableDiv");
  const measured = mount && mount.clientWidth ? mount.clientWidth - WORKOUT_V2_CHART.inset : 0;
  if (!measured) return WORKOUT_V2_CHART.width;
  return Math.round(Math.max(WORKOUT_V2_CHART.minWidth, Math.min(WORKOUT_V2_CHART.maxWidth, measured)));
}

// The graph is mounted from the space left under the controls, not from a fixed
// 300px block, so its x-axis stays on screen in a short window.
const WORKOUT_V2_CHART_HEIGHT = { min: 200, max: 340, ratio: 0.42 };

function workoutV2ChartHeight() {
  const viewport = typeof window !== "undefined" ? window.innerHeight || 0 : 0;
  if (!viewport) return WORKOUT_V2_CHART.height;
  return Math.round(Math.max(WORKOUT_V2_CHART_HEIGHT.min, Math.min(WORKOUT_V2_CHART_HEIGHT.max, viewport * WORKOUT_V2_CHART_HEIGHT.ratio)));
}

let workoutV2ChartRenderFrame = 0;

// Resize hook for makeResizable: one redraw per frame, only while the graph is on screen.
function scheduleWorkoutV2ChartRender() {
  if (workoutV2ChartRenderFrame) return;
  const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
  workoutV2ChartRenderFrame = schedule(() => {
    workoutV2ChartRenderFrame = 0;
    const mount = document.getElementById("workoutTableDiv");
    if (!mount || !mount.clientWidth || workoutV2UiState.view !== "Exercises") return;
    renderWorkoutV2();
  });
}

// Value axis from the lowest session you actually have to the highest, so no
// vertical space is spent on numbers you never lifted (the old nice-rounding
// snapped the floor to 0 whenever the range was wide, e.g. sets 2-12 or volume).
function workoutV2EvenTicks(min, max, count) {
  const total = Math.max(2, Math.round(Number(count) || 5));
  const step = (max - min) / (total - 1);
  const ticks = [];
  for (let index = 0; index < total; index += 1) {
    ticks.push(index === total - 1 ? max : min + step * index);
  }
  return { min, max, step, ticks };
}

function workoutV2ValueAxis(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return { min: 0, max: 0, step: 0, ticks: [] };
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) {
    const span = Math.max(1, Math.abs(min) * 0.1);
    return workoutV2EvenTicks(min - span, max + span);
  }
  return workoutV2EvenTicks(min, max);
}

function workoutV2LineChart(points, metric, label) {
  const valid = points
    .map((point) => ({ ...point, value: point[metric] }))
    .filter((point) => Number.isFinite(point.value));
  if (!valid.length) return '<div class="workout-v2-chart-empty">No values for this metric in the selected range.</div>';
  const { left, right, top, bottom } = WORKOUT_V2_CHART;
  const width = workoutV2ChartWidth();
  const height = workoutV2ChartHeight();
  const maxDateTicks = Math.max(4, Math.min(12, Math.round(width / 95)));
  const meta = WORKOUT_V2_METRICS[metric] || { label: metric, unit: "" };
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const axis = workoutV2ValueAxis(valid.map((point) => point.value));
  const band = Math.max(1e-6, axis.max - axis.min);
  // Horizontal position is elapsed time, not session order.
  const times = valid.map((point) => new Date(`${String(point.dateKey || "").slice(0, 10)}T12:00:00`).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const spanDays = (maxTime - minTime) / 86400000;
  const xTime = (time) => left + ((time - minTime) / Math.max(1, maxTime - minTime)) * plotWidth;
  const x = (index) => (valid.length === 1 || maxTime === minTime ? left + plotWidth / 2 : xTime(times[index]));
  const y = (value) => top + ((axis.max - value) * plotHeight) / band;
  const path = valid.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const yAxis = axis.ticks.map((tick) => {
    const tickY = y(tick).toFixed(1);
    return `<line x1="${left}" y1="${tickY}" x2="${width - right}" y2="${tickY}" class="chart-grid"/>`
      + `<line x1="${left - 4}" y1="${tickY}" x2="${left}" y2="${tickY}" class="chart-axis-tick"/>`
      + `<text x="${left - 9}" y="${tickY}" dy="3.5" text-anchor="end" class="chart-tick-label">${workoutV2Escape(workoutV2AxisLabel(tick, axis.step))}</text>`;
  }).join("");
  const longRange = spanDays > 365;
  const dateAxis = WorkoutCore.timeAxisTicks(valid[0].dateKey, valid[valid.length - 1].dateKey, maxDateTicks).map((tick) => {
    const tickX = xTime(tick.time).toFixed(1);
    return `<line x1="${tickX}" y1="${height - bottom}" x2="${tickX}" y2="${height - bottom + 5}" class="chart-axis-tick"/>`
      + `<text x="${tickX}" y="${height - bottom + 17}" text-anchor="middle" class="chart-tick-label">${workoutV2Escape(longRange ? tick.dateKey.slice(0, 7) : tick.dateKey.slice(5))}</text>`;
  }).join("");
  // Bands meet at the midpoints between sessions so the whole plot is hoverable
  // (a uniform band width would leave dead strips either side of every point).
  const bandEdges = valid.map((_point, index) => {
    if (valid.length === 1) return [left, width - right];
    if (index === 0) return [left, (x(0) + x(1)) / 2];
    if (index === valid.length - 1) return [(x(index - 1) + x(index)) / 2, width - right];
    return [(x(index - 1) + x(index)) / 2, (x(index) + x(index + 1)) / 2];
  });
  const hits = valid.map((point, index) => {
    const cx = x(index);
    const cy = y(point.value);
    const [start, end] = bandEdges[index];
    const rows = [
      [meta.label, workoutV2MetricValue(metric, point.value)],
      ...(metric === "maxWeightKg" ? [] : [["Top weight", workoutV2MetricValue("maxWeightKg", point.maxWeightKg)]]),
      ...(metric === "estimated1rmKg" ? [] : [["Estimated 1RM (Epley)", workoutV2MetricValue("estimated1rmKg", point.estimated1rmKg)]]),
      ...(metric === "workingSets" ? [] : [["Working sets", workoutV2MetricValue("workingSets", point.workingSets)]]),
      ...(metric === "volumeKg" ? [] : [["Volume", workoutV2MetricValue("volumeKg", point.volumeKg)]]),
    ].filter(([, value]) => value);
    const click = point.sessionId
      ? ` data-action="open-session" data-session-id="${workoutV2Escape(point.sessionId)}" data-tip-session="1"`
      : "";
    return `<rect class="chart-hit" x="${start.toFixed(1)}" y="${top}" width="${Math.max(6, end - start).toFixed(1)}" height="${plotHeight}"`
      + ` data-cx="${cx.toFixed(1)}" data-cy="${cy.toFixed(1)}"`
      + ` data-tip-date="${workoutV2Escape(point.dateKey)}" data-tip-title="${workoutV2Escape(point.workoutName)}"`
      + ` data-tip-sets="${workoutV2Escape(workoutV2SetList(point.sets))}"`
      + ` data-tip-rows="${workoutV2Escape(JSON.stringify(rows))}"${click}></rect>`;
  }).join("");
  return `<div class="workout-v2-chart"><svg viewBox="0 0 ${width} ${height}" style="height:${height}px" role="img" aria-label="${workoutV2Escape(label)} · ${valid.length} sessions · ${workoutV2Escape(workoutV2AxisLabel(axis.min, axis.step))} to ${workoutV2Escape(workoutV2AxisLabel(axis.max, axis.step))}">
    <text class="chart-axis-title" x="16" y="${top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 16 ${top + plotHeight / 2})">${workoutV2Escape(meta.label)}</text>
    ${yAxis}
    <line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" class="chart-axis"/>
    <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" class="chart-axis"/>
    ${dateAxis}
    <text class="chart-axis-title" x="${left + plotWidth / 2}" y="${height - 14}" text-anchor="middle">Session date (MM-DD) · ${workoutV2Escape(workoutV2FormatNumber(valid.length, 0))} sessions</text>
    <path d="${path}" class="chart-line"/>
    ${valid.map((point, index) => `<circle class="chart-point" cx="${x(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="4"/>`).join("")}
    ${hits}
    <g class="chart-cursor" hidden><line class="chart-cursor-line" x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}"/><circle class="chart-cursor-dot" cx="${left}" cy="${top}" r="5.5"/></g>
  </svg></div>`;
}

// ---- Chart hover: one shared tooltip element + the highlighted point cursor ----
let workoutV2ActiveChartHit = null;

function workoutV2ChartTooltip() {
  if (typeof document === "undefined" || !document.body) return null;
  let tip = document.getElementById("workoutV2ChartTooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "workoutV2ChartTooltip";
    tip.className = "workout-v2-chart-tooltip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    document.body.appendChild(tip);
  }
  return tip;
}

function workoutV2ChartHitRows(hit) {
  let rows = [];
  try {
    rows = JSON.parse(hit.dataset.tipRows || "[]");
  } catch (_error) {
    rows = [];
  }
  return Array.isArray(rows) ? rows.filter((row) => Array.isArray(row) && row[0] && row[1]) : [];
}

function workoutV2SetChartCursor(hit) {
  if (hit === workoutV2ActiveChartHit) return;
  const previous = workoutV2ActiveChartHit?.closest("svg")?.querySelector(".chart-cursor");
  if (previous) previous.setAttribute("hidden", "");
  workoutV2ActiveChartHit = hit;
  if (!hit) return;
  const cursor = hit.closest("svg")?.querySelector(".chart-cursor");
  if (!cursor) return;
  const cx = Number(hit.dataset.cx);
  const cy = Number(hit.dataset.cy);
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
  cursor.removeAttribute("hidden");
  const line = cursor.querySelector(".chart-cursor-line");
  if (line) {
    line.setAttribute("x1", String(cx));
    line.setAttribute("x2", String(cx));
  }
  const dot = cursor.querySelector(".chart-cursor-dot");
  if (dot) {
    dot.setAttribute("cx", String(cx));
    dot.setAttribute("cy", String(cy));
  }
}

function workoutV2HideChartTooltip() {
  const tip = typeof document === "undefined" ? null : document.getElementById("workoutV2ChartTooltip");
  if (tip) tip.hidden = true;
  workoutV2SetChartCursor(null);
}

function workoutV2ShowChartTooltip(hit, clientX, clientY) {
  const tip = workoutV2ChartTooltip();
  if (!tip) return;
  const rows = workoutV2ChartHitRows(hit);
  tip.innerHTML = `<strong>${workoutV2Escape(hit.dataset.tipDate)}</strong>`
    + (hit.dataset.tipTitle ? `<em>${workoutV2Escape(hit.dataset.tipTitle)}</em>` : "")
    + (hit.dataset.tipSets ? `<p class="workout-v2-chart-tooltip-sets">${workoutV2Escape(hit.dataset.tipSets)}</p>` : "")
    + `<dl>${rows.map(([rowLabel, rowValue], index) => `<div${index ? "" : ' class="is-primary"'}><dt>${workoutV2Escape(rowLabel)}</dt><dd>${workoutV2Escape(rowValue)}</dd></div>`).join("")}</dl>`
    + (hit.dataset.tipSession ? "<small>Click to open the session</small>" : "");
  tip.hidden = false;
  const box = tip.getBoundingClientRect();
  const margin = 14;
  let left = clientX + margin;
  let top = clientY + margin;
  if (typeof window !== "undefined") {
    if (left + box.width > window.innerWidth - 8) left = Math.max(8, clientX - box.width - margin);
    // Flip above the cursor when there is no room below, or when the cursor sits low
    // in the window (where a downward card would cover the chart's own axis labels).
    const flipUp = top + box.height > window.innerHeight - 8
      || (clientY > window.innerHeight * 0.6 && clientY - box.height - margin >= 8);
    if (flipUp) top = Math.max(8, clientY - box.height - margin);
  }
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

// Points are whole columns, so the tooltip follows the nearest session, not the dot.
function workoutV2HandleChartPointer(event) {
  const hit = event.target?.closest?.(".chart-hit");
  if (!hit) {
    workoutV2HideChartTooltip();
    return;
  }
  workoutV2SetChartCursor(hit);
  workoutV2ShowChartTooltip(hit, event.clientX, event.clientY);
}
function workoutV2RenderExercises() {
  const names = workoutV2ImportedExerciseNames();
  if (!names.includes(workoutV2UiState.progressExercise)) workoutV2UiState.progressExercise = names[0] || "";
  const exercise = workoutV2UiState.progressExercise;
  const allSeries = WorkoutCore.computeExerciseSeries(workoutV2Data(), exercise);
  const series = workoutV2FilteredSeries(allSeries);
  const firstDate = allSeries[0]?.dateKey || "";
  const lastDate = allSeries[allSeries.length - 1]?.dateKey || "";
  const latest = series[series.length - 1];
  const best1rm = Math.max(...series.map((point) => point.estimated1rmKg).filter(Number.isFinite), -Infinity);
  const bestWeight = Math.max(...series.map((point) => point.maxWeightKg).filter(Number.isFinite), -Infinity);
  const totalSets = series.reduce((sum, point) => sum + point.workingSets, 0);
  const totalVolume = series.reduce((sum, point) => sum + point.volumeKg, 0);
  const metricEntries = Object.entries(WORKOUT_V2_METRICS);
  return `<section class="workout-v2-panel"><h3>Exercise progression</h3>
    <div class="workout-v2-form-row"><label class="workout-v2-grow">Exercise<select id="workoutV2ProgressExercise">${names.map((name) => `<option value="${workoutV2Escape(name)}"${name === exercise ? " selected" : ""}>${workoutV2Escape(name)}</option>`).join("")}</select></label>
      <label>Graph<select id="workoutV2ProgressMetric">${metricEntries.map(([value, meta]) => `<option value="${value}"${value === workoutV2UiState.progressMetric ? " selected" : ""}>${workoutV2Escape(meta.label)}</option>`).join("")}</select></label>
      <label>Range<select id="workoutV2ProgressRange"><option value="all">All history</option>${[3, 6, 12, 24].map((months) => `<option value="${months}"${String(months) === workoutV2UiState.progressRange ? " selected" : ""}>Last ${months} months</option>`).join("")}</select></label>
      <label>From<input id="workoutV2ProgressFrom" type="date" value="${workoutV2Escape(workoutV2UiState.progressFrom)}" min="${workoutV2Escape(firstDate)}" max="${workoutV2Escape(lastDate)}" title="Exact start date — leave empty to ignore"></label>
      <label>To<input id="workoutV2ProgressTo" type="date" value="${workoutV2Escape(workoutV2UiState.progressTo)}" min="${workoutV2Escape(firstDate)}" max="${workoutV2Escape(lastDate)}" title="Exact end date — leave empty to ignore"></label>
      ${workoutV2UiState.progressFrom || workoutV2UiState.progressTo ? '<button type="button" data-action="clear-progress-range">Clear dates</button>' : ""}</div>
    ${exercise ? `<div class="workout-v2-metric-grid workout-v2-metric-grid--exercise">
      ${workoutV2MetricCard("Best e1RM", best1rm === -Infinity ? "—" : `${workoutV2FormatNumber(best1rm, 1)} kg`, "Epley estimate")}
      ${workoutV2MetricCard("Top weight", bestWeight === -Infinity ? "—" : `${workoutV2FormatNumber(bestWeight, 1)} kg`, "heaviest recorded set")}
      ${workoutV2MetricCard("Sets", workoutV2FormatNumber(totalSets, 0), `${series.length} sessions`)}
      ${workoutV2MetricCard("Volume", `${workoutV2FormatNumber(totalVolume, 0)} kg`, "selected range")}
      ${workoutV2MetricCard("Last trained", latest?.dateKey || "—", latest?.workoutName || "")}
    </div>${workoutV2LineChart(series, workoutV2UiState.progressMetric, `${exercise}: ${metricEntries.find(([value]) => value === workoutV2UiState.progressMetric)?.[1].label || ""}`)}
    <p class="workout-v2-help">Hover (or drag on touch) anywhere over the graph to read that session's numbers; click a point to open the workout. Estimated 1RM uses the Epley formula. Note and Rest Timer rows are preserved but excluded from training metrics.</p>` : '<div class="workout-v2-empty">Import Strong data to see exercise analytics.</div>'}
  </section>`;
}

function workoutV2RenderImport() {
  const preview = workoutV2UiState.importPreview;
  let previewHtml = "";
  if (preview) {
    const existing = new Set(workoutV2Data().sessions.map((session) => session.externalKey).filter(Boolean));
    const updates = preview.workouts.filter((workout) => existing.has(workout.externalKey)).length;
    const exerciseNames = new Set(preview.rows.map((row) => row["Exercise Name"]).filter(Boolean));
    previewHtml = `<div class="workout-v2-import-preview"><strong>${preview.errors.length ? "Import needs attention" : "Ready to sync"}</strong><div class="workout-v2-metric-grid">
      ${workoutV2MetricCard("Sessions", String(preview.workouts.length), `${preview.workouts.length - updates} new · ${updates} refreshed`)}
      ${workoutV2MetricCard("CSV rows", String(preview.rows.length), "sets, notes and timers")}
      ${workoutV2MetricCard("Exercises", String(exerciseNames.size), "distinct names")}
    </div>${preview.errors.length ? `<ul>${preview.errors.map((error) => `<li>${workoutV2Escape(error)}</li>`).join("")}</ul>` : ""}</div>`;
  }
  return `<section class="workout-v2-panel"><h3>Sync from Strong</h3><div class="workout-v2-import-intro"><p>Export your workout history from Strong and choose the CSV here. Re-importing the full file is safe: known sessions are refreshed and new sessions are added.</p><p>Every exercise, set row, weight, rep, RPE, distance, timer and note is retained. Imported completed sessions feed the Physique calendar and points.</p></div>
    <label class="workout-v2-file-drop">Strong CSV<input id="workoutV2CsvFile" type="file" accept=".csv,text/csv"></label>${previewHtml}
    <div class="workout-v2-actions">${preview && !preview.errors.length ? '<button type="button" class="workout-v2-primary" data-action="confirm-import">Sync preview</button>' : ""}</div>
    <section class="workout-v2-danger-zone"><div><h4>Delete Workout data</h4><p>Delete every imported session, set, and graph point from Startpage and Supabase. This also removes the matching Physique calendar history and recalculates Fitness skill XP/points. Your data inside Strong is not affected.</p></div><button type="button" class="workout-v2-danger" data-action="delete-all-workout-data">Delete all Workout data…</button></section>
  </section>`;
}

function renderWorkoutV2() {
  const mount = document.getElementById("workoutTableDiv");
  if (!mount) return;
  workoutV2HideChartTooltip();
  workoutV2Data();
  let content = "";
  if (workoutV2UiState.view === "History") content = workoutV2RenderHistory();
  else if (workoutV2UiState.view === "Exercises") content = workoutV2RenderExercises();
  else if (workoutV2UiState.view === "Import") content = workoutV2RenderImport();
  else content = workoutV2RenderOverview();
  mount.innerHTML = `<div class="workout-v2">${workoutV2RenderTabs()}<div class="workout-v2-content">${content}</div><div id="workoutV2SyncStatus" class="workout-v2-sync" role="status">${workoutV2Escape(workoutV2UiState.syncMessage || (workoutV2UiState.remoteAvailable ? "Supabase ready." : "Local storage."))}</div></div>`;
  workoutV2BindEvents(mount);
}

function workoutV2OpenWindow() {
  const container = document.getElementById("workoutContainer");
  if (container) container.style.display = "block";
}

function handleWorkoutGamifyDay(year, month, day) {
  const dateKey = typeof trackerDateKey === "function"
    ? trackerDateKey(year, month, day)
    : `${year}-${String(Number(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const sessions = workoutV2Data().sessions
    .filter((session) => session.dateKey === dateKey)
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  const session = sessions.find((candidate) => candidate.status === "completed");
  workoutV2UiState.view = "History";
  workoutV2UiState.pendingDateKey = dateKey;
  workoutV2UiState.selectedSessionId = session?.id || "";
  workoutV2UiState.historyFrom = session ? "" : dateKey;
  workoutV2UiState.historyTo = session ? "" : dateKey;
  workoutV2UiState.syncMessage = session
    ? `Showing the Strong session for ${dateKey}.`
    : `No imported Strong workout for ${dateKey}. Sync a current export after training.`;
  workoutV2OpenWindow();
  renderWorkoutV2();
  return session || null;
}

async function workoutV2ReconcileDate(dateKey, previousValue) {
  const value = WorkoutCore.getFitnessTrackerValueForDate(workoutV2Data(), dateKey);
  const parts = typeof parseTrackerDateKey === "function" ? parseTrackerDateKey(dateKey) : null;
  if (!parts) return;
  let boardState = {};
  if (typeof getBoardStateSnapshot === "function") boardState = getBoardStateSnapshot("fitness", parts.year, parts.month);
  else {
    try { boardState = JSON.parse(localStorage.getItem(`fitnessBoardState_${parts.year}-${parts.month + 1}`)) || {}; }
    catch (_error) { boardState = {}; }
  }
  const prev = previousValue === undefined ? boardState[parts.day] : previousValue;
  if (value <= 0) delete boardState[parts.day];
  else if (value <= 6) boardState[parts.day] = WORKOUT_V2_CODES[value - 1];
  else boardState[parts.day] = typeof FITNESS_UNKNOWN_TRAINING !== "undefined" ? FITNESS_UNKNOWN_TRAINING : "__WORKOUT__";
  const next = boardState[parts.day];
  if (prev === next) return;
  if (typeof saveBoardState === "function") saveBoardState("fitness", parts.year, parts.month, boardState);
  if (typeof syncTrackerDayValue === "function") await syncTrackerDayValue("skill", "fitness", parts.year, parts.month, parts.day, value);
  if (typeof syncMappedDailyFromGamifyChange === "function") await syncMappedDailyFromGamifyChange("fitness", prev, next, parts.year, parts.month, parts.day);
  if (typeof recalculateGamifySkillXp === "function") recalculateGamifySkillXp("fitness");
  if (typeof renderGamifyStreakCalendar === "function") renderGamifyStreakCalendar();
  if (typeof updateDailyCounter === "function") updateDailyCounter("fitness");
  if (typeof renderDailies === "function") renderDailies();
}

async function workoutV2ReconcileAllDates() {
  const dates = Array.from(new Set(workoutV2Data().sessions.map((session) => session.dateKey).filter(Boolean)));
  for (const dateKey of dates) await workoutV2ReconcileDate(dateKey);
}

function workoutV2UpdateSessionField(session, field, value) {
  if (field === "durationSeconds") session[field] = workoutV2Integer(value);
  else if (field === "dateKey") {
    const oldDate = session.dateKey;
    session.dateKey = String(value).slice(0, 10);
    session.startedAt = `${session.dateKey}${String(session.startedAt || "").slice(10) || "T12:00:00"}`;
    session._previousDateKey = oldDate;
  } else session[field] = String(value || "");
}

function workoutV2UpdateEntryField(entry, field, value) {
  if (field === "setType") {
    const setOrderByType = { warmup: "W", failure: "F", drop: "D", note: "Note", rest: "Rest Timer" };
    entry.setOrder = setOrderByType[value] || "1";
  } else if (["weightKg", "reps", "rpe", "distanceMeters", "seconds"].includes(field)) entry[field] = workoutV2Number(value);
  else entry[field] = String(value || "");
}

function workoutV2UpdateTemplateField(exercise, field, value) {
  if (["targetSets", "restSeconds"].includes(field)) exercise[field] = workoutV2Integer(value);
  else if (field === "targetWeightKg") exercise[field] = workoutV2Number(value);
  else exercise[field] = String(value || "");
}

async function workoutV2Finish(session) {
  const result = WorkoutCore.finishWorkoutSession(workoutV2Data(), session.id, new Date().toISOString());
  workoutV2SetData(result.data);
  const finished = workoutV2Session(session.id);
  workoutV2ScheduleSave({ session: finished });
  await workoutV2UiState.saveChain;
  await workoutV2ReconcileDate(finished.dateKey);
  renderWorkoutV2();
}

async function workoutV2Reopen(session) {
  session.status = "draft";
  session.completedAt = "";
  workoutV2ScheduleSave({ session });
  await workoutV2ReconcileDate(session.dateKey);
  renderWorkoutV2();
}

async function workoutV2DeleteSession(session) {
  const ok = typeof confirm !== "function" || confirm(`Delete ${session.workoutName} on ${session.dateKey}?`);
  if (!ok) return;
  const remoteId = session.remoteId;
  workoutV2Data().sessions = workoutV2Data().sessions.filter((candidate) => candidate.id !== session.id);
  workoutV2SetData(workoutV2Data());
  if (remoteId && workoutV2UiState.remoteAvailable) {
    try {
      workoutV2DbResult(await backendState.client.from("workout_sessions").delete()
        .eq("id", remoteId).eq("user_id", getBackendUserId()));
    } catch (error) {
      console.error("Workout V2 remote delete failed:", error);
      workoutV2SetStatus("Deleted locally; backend delete failed.");
    }
  }
  workoutV2UiState.selectedSessionId = "";
  await workoutV2ReconcileDate(session.dateKey);
  renderWorkoutV2();
}

function workoutV2ReadImportText() {
  const textarea = document.getElementById("workoutV2CsvText");
  workoutV2UiState.importText = textarea?.value || workoutV2UiState.importText;
  workoutV2UiState.importPreview = WorkoutCore.parseStrongCsv(workoutV2UiState.importText);
  renderWorkoutV2();
}

async function workoutV2ConfirmImport() {
  const preview = workoutV2UiState.importPreview;
  if (!preview || preview.errors.length) return;
  const result = WorkoutCore.importStrongWorkouts(workoutV2Data(), preview.workouts);
  workoutV2SetData(result.data);
  const importedKeys = new Set(preview.workouts.map((workout) => workout.externalKey));
  const importedSessions = workoutV2Data().sessions.filter((session) => importedKeys.has(session.externalKey));
  let remoteError = null;
  if (workoutV2UiState.remoteAvailable) {
    workoutV2SetStatus(`Syncing ${importedSessions.length} sessions to Supabase…`);
    try {
      await workoutV2SyncImportedSessions(importedSessions);
      workoutV2SetData(workoutV2Data());
    } catch (error) {
      remoteError = error;
      console.error("Strong workout sync failed:", error);
    }
  }
  await workoutV2ReconcileAllDates();
  workoutV2SetStatus(remoteError
    ? `Imported locally, but Supabase sync failed. Re-import the same file to repair it (${String(remoteError.message || remoteError)}).`
    : `Strong sync complete: ${result.imported} new, ${result.updated} refreshed, ${result.skipped} invalid.`);
  workoutV2UiState.importPreview = null;
  workoutV2UiState.importText = "";
  workoutV2UiState.view = "Overview";
  renderWorkoutV2();
}

async function workoutV2DeleteAllData() {
  const requiredPhrase = "DELETE WORKOUT DATA";
  const entered = typeof prompt === "function"
    ? prompt(`This permanently deletes all Workout data from Startpage and Supabase.\n\nMatching Physique calendar history and Fitness skill XP/points will also be removed. Your Strong app data will not be changed.\n\nType ${requiredPhrase} to continue:`)
    : null;
  if (entered === null) return;
  if (entered.trim() !== requiredPhrase) {
    workoutV2SetStatus("Nothing was deleted: the confirmation phrase did not match.");
    renderWorkoutV2();
    return;
  }

  const dateKeys = Array.from(new Set(workoutV2Data().sessions.map((session) => session.dateKey).filter(Boolean)));
  if (workoutV2HasBackend()) {
    workoutV2SetStatus("Deleting Workout data from Supabase…");
    try {
      workoutV2DbResult(await backendState.client.from("workout_sessions")
        .delete().eq("user_id", getBackendUserId()));
    } catch (error) {
      if (!workoutV2MissingTable(error)) {
        console.error("Workout data deletion failed:", error);
        workoutV2SetStatus(`Nothing was deleted: Supabase deletion failed (${String(error.message || error)}).`);
        renderWorkoutV2();
        return;
      }
    }
  }

  workoutV2SetData({ version: 2, routines: workoutV2Data().routines, sessions: [] });
  workoutV2UiState.selectedSessionId = "";
  workoutV2UiState.importPreview = null;
  workoutV2UiState.importText = "";
  workoutV2UiState.progressExercise = "";
  workoutV2UiState.view = "Overview";
  let calendarCleanupFailed = false;
  for (const dateKey of dateKeys) {
    try {
      await workoutV2ReconcileDate(dateKey);
    } catch (error) {
      calendarCleanupFailed = true;
      console.error("Workout calendar cleanup failed:", error);
    }
  }
  if (typeof recalculateGamifySkillXp === "function") recalculateGamifySkillXp("fitness");
  if (typeof renderGamifyStreakCalendar === "function") renderGamifyStreakCalendar();
  if (typeof updateDailyCounter === "function") updateDailyCounter("fitness");
  if (typeof renderDailies === "function") renderDailies();
  workoutV2SetStatus(calendarCleanupFailed
    ? "Workout history was deleted, but some calendar entries could not be synchronized."
    : "All Workout data was deleted. Your Strong app data was not changed.");
  renderWorkoutV2();
}

function workoutV2ExportCsv() {
  const from = document.getElementById("workoutV2ExportFrom")?.value || "";
  const to = document.getElementById("workoutV2ExportTo")?.value || "";
  const sessions = workoutV2Data().sessions
    .filter((session) => session.status === "completed")
    .filter((session) => !from || session.dateKey >= from)
    .filter((session) => !to || session.dateKey <= to)
    .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)))
    .map((session) => ({
      ...session,
      date: String(session.startedAt || `${session.dateKey}T12:00:00`).replace("T", " ").replace(/Z$/, "").slice(0, 19),
    }));
  const csv = WorkoutCore.exportStrongCsv(sessions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workout-strong-${workoutV2Today()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  workoutV2SetStatus(`Exported ${sessions.length} completed workout(s).`);
}

function workoutV2BindEventsLegacy(mount) {
  mount.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    workoutV2UiState.view = button.dataset.view;
    workoutV2UiState.selectedSessionId = "";
    renderWorkoutV2();
  }));
  mount.querySelectorAll("[data-session-field]").forEach((input) => input.addEventListener("input", () => {
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    if (!session || session.status === "completed") return;
    workoutV2UpdateSessionField(session, input.dataset.sessionField, input.value);
    workoutV2ScheduleSave({ session });
  }));
  mount.querySelectorAll("[data-entry-field]").forEach((input) => input.addEventListener("input", () => {
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    const entry = session?.entries[Number(input.dataset.entryIndex)];
    if (!entry || session.status === "completed") return;
    workoutV2UpdateEntryField(entry, input.dataset.entryField, input.value);
    workoutV2RenumberWorkingSets(session);
    workoutV2ScheduleSave({ session });
    if (input.dataset.entryField === "setType") renderWorkoutV2();
  }));
  mount.querySelectorAll("[data-exercise-name-start]").forEach((input) => input.addEventListener("input", () => {
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    if (!session || session.status === "completed") return;
    const start = Number(input.dataset.exerciseNameStart);
    const count = Number(input.dataset.exerciseNameCount);
    session.entries.slice(start, start + count).forEach((entry) => { entry.exerciseName = input.value; });
    workoutV2ScheduleSave({ session });
  }));
  mount.querySelectorAll("[data-template-field]").forEach((input) => input.addEventListener("input", () => {
    const routine = workoutV2Routine(workoutV2UiState.templateCode);
    const exercise = routine.exercises[Number(input.dataset.templateIndex)];
    if (!exercise) return;
    workoutV2UpdateTemplateField(exercise, input.dataset.templateField, input.value);
    workoutV2ScheduleSave({ routine });
  }));
  mount.querySelector("[data-routine-field]")?.addEventListener("input", (event) => {
    const routine = workoutV2Routine(workoutV2UiState.templateCode);
    routine.name = event.target.value || routine.code;
    workoutV2ScheduleSave({ routine });
  });
  mount.querySelector("#workoutV2TemplateCode")?.addEventListener("change", (event) => {
    workoutV2UiState.templateCode = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressExercise")?.addEventListener("change", (event) => {
    workoutV2UiState.progressExercise = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressMetric")?.addEventListener("change", (event) => {
    workoutV2UiState.progressMetric = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressRange")?.addEventListener("change", (event) => {
    workoutV2UiState.progressRange = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2CsvFile")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    workoutV2UiState.importText = await file.text();
    workoutV2UiState.importPreview = WorkoutCore.parseStrongCsv(workoutV2UiState.importText);
    renderWorkoutV2();
  });
  if (mount.dataset.workoutV2BindEventsBound === "true") return;
  mount.dataset.workoutV2BindEventsBound = "true";
  mount.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "page") {
      const view = button.dataset.pageView;
      if (view && Object.hasOwn(workoutV2UiState.pageByView, view)) {
        workoutV2UiState.pageByView[view] = Number(button.dataset.page) || 1;
        renderWorkoutV2();
      }
      return;
    }
    const session = workoutV2Session(workoutV2UiState.selectedSessionId);
    if (action === "go-import") {
      workoutV2UiState.view = "Import";
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "go-history") {
      workoutV2UiState.view = "History";
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "open-exercise") {
      workoutV2UiState.progressExercise = button.dataset.exercise || "";
      workoutV2UiState.view = "Exercises";
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "create-draft") {
      const dateKey = document.getElementById("workoutV2NewDate")?.value || workoutV2Today();
      const code = document.getElementById("workoutV2NewRoutine")?.value || "A";
      workoutV2UiState.pendingRoutineCode = code;
      workoutV2CreateDraft(dateKey, code, workoutV2UiState.pendingDateKey ? "gamify" : "startpage");
      renderWorkoutV2();
    } else if (action === "add-exercise" && session) {
      session.entries.push(workoutV2NormalizeEntry({ exerciseName: "", setOrder: "1" }, session.entries.length));
      workoutV2RenumberWorkingSets(session);
      workoutV2UiState.pageByView.Log = Math.ceil(workoutV2ExerciseGroups(session).length / WORKOUT_V2_PAGE_SIZE);
      workoutV2ScheduleSave({ session });
      renderWorkoutV2();
    } else if (action === "add-set" && session) {
      const start = Number(button.dataset.start);
      const count = Number(button.dataset.count);
      const exerciseName = session.entries[start]?.exerciseName || "";
      session.entries.splice(start + count, 0, workoutV2NormalizeEntry({ exerciseName, setOrder: "1" }, start + count));
      workoutV2RenumberWorkingSets(session);
      workoutV2ScheduleSave({ session });
      renderWorkoutV2();
    } else if (action === "remove-entry" && session) {
      session.entries.splice(Number(button.dataset.index), 1);
      workoutV2RenumberWorkingSets(session);
      workoutV2ScheduleSave({ session });
      renderWorkoutV2();
    } else if (action === "remove-exercise" && session) {
      session.entries.splice(Number(button.dataset.start), Number(button.dataset.count));
      workoutV2RenumberWorkingSets(session);
      workoutV2ScheduleSave({ session });
      renderWorkoutV2();
    } else if (action === "move-exercise" && session) {
      const groups = workoutV2ExerciseGroups(session);
      const groupIndex = groups.findIndex((group) => group.startIndex === Number(button.dataset.start));
      const targetIndex = groupIndex + Number(button.dataset.direction);
      if (groupIndex >= 0 && targetIndex >= 0 && targetIndex < groups.length) {
        const blocks = groups.map((group) => group.entries.map(({ entry }) => entry));
        [blocks[groupIndex], blocks[targetIndex]] = [blocks[targetIndex], blocks[groupIndex]];
        session.entries = blocks.flat();
        workoutV2RenumberWorkingSets(session);
        workoutV2ScheduleSave({ session });
        renderWorkoutV2();
      }
    } else if (action === "finish" && session) await workoutV2Finish(session);
    else if (action === "reopen" && session) await workoutV2Reopen(session);
    else if (action === "delete-session" && session) await workoutV2DeleteSession(session);
    else if (action === "close-session") {
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "add-template-entry") {
      const routine = workoutV2Routine(workoutV2UiState.templateCode);
      routine.exercises.push(workoutV2NormalizeExercise({ targetSets: 1 }, routine.exercises.length));
      workoutV2UiState.pageByView.Templates = Math.ceil(routine.exercises.length / WORKOUT_V2_PAGE_SIZE);
      workoutV2ScheduleSave({ routine });
      renderWorkoutV2();
    } else if (action === "remove-template-entry") {
      const routine = workoutV2Routine(workoutV2UiState.templateCode);
      routine.exercises.splice(Number(button.dataset.index), 1);
      routine.exercises.forEach((exercise, index) => { exercise.position = index; });
      workoutV2ScheduleSave({ routine });
      renderWorkoutV2();
    } else if (action === "apply-history-filters") {
      workoutV2UiState.historyText = document.getElementById("workoutV2HistoryText")?.value || "";
      workoutV2UiState.historyFrom = document.getElementById("workoutV2HistoryFrom")?.value || "";
      workoutV2UiState.historyTo = document.getElementById("workoutV2HistoryTo")?.value || "";
      workoutV2UiState.pageByView.History = 1;
      renderWorkoutV2();
    } else if (action === "clear-history-filters") {
      workoutV2UiState.historyText = "";
      workoutV2UiState.historyFrom = "";
      workoutV2UiState.historyTo = "";
      workoutV2UiState.pageByView.History = 1;
      renderWorkoutV2();
    } else if (action === "open-session") {
      workoutV2UiState.selectedSessionId = button.dataset.sessionId;
      workoutV2UiState.view = "History";
      renderWorkoutV2();
    } else if (action === "preview-import") workoutV2ReadImportText();
    else if (action === "confirm-import") await workoutV2ConfirmImport();
    else if (action === "export-csv") workoutV2ExportCsv();
  });
}

function workoutV2BindEvents(mount) {
  mount.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    workoutV2UiState.view = button.dataset.view;
    workoutV2UiState.selectedSessionId = "";
    renderWorkoutV2();
  }));
  mount.querySelector("#workoutV2ProgressExercise")?.addEventListener("change", (event) => {
    workoutV2UiState.progressExercise = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressMetric")?.addEventListener("change", (event) => {
    workoutV2UiState.progressMetric = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressRange")?.addEventListener("change", (event) => {
    workoutV2UiState.progressRange = event.target.value;
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressFrom")?.addEventListener("change", (event) => {
    workoutV2UiState.progressFrom = event.target.value || "";
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2ProgressTo")?.addEventListener("change", (event) => {
    workoutV2UiState.progressTo = event.target.value || "";
    renderWorkoutV2();
  });
  mount.querySelector("#workoutV2CsvFile")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    workoutV2SetStatus("Reading Strong export…");
    workoutV2UiState.importText = await file.text();
    workoutV2UiState.importPreview = WorkoutCore.parseStrongCsv(workoutV2UiState.importText);
    renderWorkoutV2();
  });
  if (mount.dataset.workoutChartBound !== "true") {
    mount.dataset.workoutChartBound = "true";
    mount.addEventListener("pointermove", workoutV2HandleChartPointer);
    mount.addEventListener("pointerleave", workoutV2HideChartTooltip);
    mount.addEventListener("click", (event) => {
      if (!event.target?.closest?.(".chart-hit")) workoutV2HideChartTooltip();
    });
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", workoutV2HideChartTooltip, true);
      window.addEventListener("resize", workoutV2HideChartTooltip);
    }
  }
  if (mount.dataset.workoutAnalyticsBound === "true") return;
  mount.dataset.workoutAnalyticsBound = "true";
  mount.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "page") {
      const view = button.dataset.pageView;
      if (view && Object.hasOwn(workoutV2UiState.pageByView, view)) {
        workoutV2UiState.pageByView[view] = Number(button.dataset.page) || 1;
        renderWorkoutV2();
      }
    } else if (action === "go-import") {
      workoutV2UiState.view = "Import";
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "go-history") {
      workoutV2UiState.view = "History";
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "open-exercise") {
      workoutV2UiState.progressExercise = button.dataset.exercise || "";
      workoutV2UiState.view = "Exercises";
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "open-session") {
      workoutV2UiState.selectedSessionId = button.dataset.sessionId || "";
      workoutV2UiState.view = "History";
      workoutV2HideChartTooltip();
      renderWorkoutV2();
    } else if (action === "close-session") {
      workoutV2UiState.selectedSessionId = "";
      renderWorkoutV2();
    } else if (action === "apply-history-filters") {
      workoutV2UiState.historyText = document.getElementById("workoutV2HistoryText")?.value || "";
      workoutV2UiState.historyFrom = document.getElementById("workoutV2HistoryFrom")?.value || "";
      workoutV2UiState.historyTo = document.getElementById("workoutV2HistoryTo")?.value || "";
      workoutV2UiState.pageByView.History = 1;
      renderWorkoutV2();
    } else if (action === "clear-history-filters") {
      workoutV2UiState.historyText = "";
      workoutV2UiState.historyFrom = "";
      workoutV2UiState.historyTo = "";
      workoutV2UiState.pageByView.History = 1;
      renderWorkoutV2();
    } else if (action === "clear-progress-range") {
      workoutV2UiState.progressFrom = "";
      workoutV2UiState.progressTo = "";
      renderWorkoutV2();
    } else if (action === "confirm-import") {
      button.disabled = true;
      await workoutV2ConfirmImport();
    } else if (action === "delete-all-workout-data") {
      button.disabled = true;
      await workoutV2DeleteAllData();
    }
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    renderWorkoutV2();
  });
}
