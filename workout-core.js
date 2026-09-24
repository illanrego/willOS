(function attachWorkoutCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.WorkoutCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorkoutCore() {
  "use strict";

  const STRONG_HEADERS = [
    "Workout #",
    "Date",
    "Workout Name",
    "Duration (sec)",
    "Exercise Name",
    "Set Order",
    "Weight (kg)",
    "Reps",
    "RPE",
    "Distance (meters)",
    "Seconds",
    "Notes",
    "Workout Notes",
  ];

  const STRONG_RECORD_START = /^"\d+";"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}";/;

  function splitTolerantStrongRecords(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    const chunks = [];
    let current = "";

    lines.slice(1).forEach((line) => {
      if (STRONG_RECORD_START.test(line)) {
        if (current) chunks.push(current);
        current = line;
      } else if (current) {
        current += `\n${line}`;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  }

  function parseTolerantStrongRow(chunk) {
    const source = String(chunk || "");
    const unwrapped = source.startsWith('"') ? source.slice(1) : source;
    const withoutLastQuote = unwrapped.endsWith('"') ? unwrapped.slice(0, -1) : unwrapped;
    return withoutLastQuote.split('";"').map((value) => value.replace(/""/g, '"'));
  }

  function inferRoutineCode(workoutName) {
    const name = String(workoutName || "").trim().toUpperCase();
    if (!name) return "";

    const namedPrefixes = [
      ["A", ["ALFA", "ALPHA", "Α"]],
      ["B", ["BETA", "Β"]],
      ["C", ["GAMMA", "Γ"]],
      ["D", ["DELTA", "Δ"]],
      ["E", ["EPSILON", "Ε"]],
    ];
    for (const [code, prefixes] of namedPrefixes) {
      if (prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix} `) || name.startsWith(`${prefix}-`))) {
        return code;
      }
    }

    const leadingCode = /^([A-F])(?:$|[\s._-])/.exec(name);
    if (leadingCode) return leadingCode[1];
    const embeddedWorkoutCode = /(?:^|\s)WORKOUT\s+([A-F])(?:$|[\s._-])/.exec(name);
    return embeddedWorkoutCode ? embeddedWorkoutCode[1] : "";
  }

  function makeStrongEntry(row, entryOrder) {
    return {
      exerciseName: row["Exercise Name"],
      entryOrder,
      setOrder: row["Set Order"],
      weightKg: row["Weight (kg)"],
      reps: row.Reps,
      rpe: row.RPE,
      distanceMeters: row["Distance (meters)"],
      seconds: row.Seconds,
      notes: row.Notes,
    };
  }

  function groupStrongRows(rows) {
    const byKey = new Map();
    rows.forEach((row) => {
      const externalKey = `strong:${row["Workout #"]}:${row.Date}`;
      let workout = byKey.get(externalKey);
      if (!workout) {
        workout = {
          externalKey,
          externalWorkoutNumber: row["Workout #"],
          date: row.Date,
          workoutName: row["Workout Name"],
          routineCode: inferRoutineCode(row["Workout Name"]),
          durationSeconds: row["Duration (sec)"],
          workoutNotes: row["Workout Notes"],
          entries: [],
        };
        byKey.set(externalKey, workout);
      }
      workout.entries.push(makeStrongEntry(row, workout.entries.length));
    });
    return Array.from(byKey.values());
  }

  function nullableNumber(value) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function cloneWorkoutData(data) {
    const source = data && typeof data === "object" ? data : {};
    return {
      version: 2,
      routines: Array.isArray(source.routines)
        ? source.routines.map((routine) => ({ ...routine, exercises: Array.isArray(routine.exercises) ? routine.exercises.map((exercise) => ({ ...exercise })) : [] }))
        : [],
      sessions: Array.isArray(source.sessions)
        ? source.sessions.map((session) => ({
          ...session,
          entries: Array.isArray(session.entries) ? session.entries.map((entry) => ({ ...entry })) : [],
        }))
        : [],
    };
  }

  function importStrongWorkouts(data, workouts) {
    const next = cloneWorkoutData(data);
    const existing = new Map(next.sessions
      .map((session, index) => [session.externalKey, index])
      .filter(([externalKey]) => Boolean(externalKey)));
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    (Array.isArray(workouts) ? workouts : []).forEach((workout) => {
      if (!workout || !workout.externalKey) {
        skipped += 1;
        return;
      }
      const startedAt = String(workout.date || "").replace(" ", "T");
      const existingIndex = existing.get(workout.externalKey);
      const previous = existingIndex == null ? null : next.sessions[existingIndex];
      const session = {
        id: previous?.id || workout.externalKey,
        remoteId: previous?.remoteId || "",
        externalKey: workout.externalKey,
        externalWorkoutNumber: String(workout.externalWorkoutNumber || ""),
        dateKey: String(workout.date || "").slice(0, 10),
        startedAt,
        workoutName: String(workout.workoutName || "Workout"),
        routineCode: inferRoutineCode(workout.workoutName),
        durationSeconds: nullableNumber(workout.durationSeconds),
        workoutNotes: String(workout.workoutNotes || ""),
        status: "completed",
        source: "strong_import",
        completedAt: startedAt,
        entries: (Array.isArray(workout.entries) ? workout.entries : []).map((entry, index) => ({
          exerciseName: String(entry.exerciseName || ""),
          entryOrder: Number.isInteger(entry.entryOrder) ? entry.entryOrder : index,
          setOrder: String(entry.setOrder || ""),
          weightKg: nullableNumber(entry.weightKg),
          reps: nullableNumber(entry.reps),
          rpe: nullableNumber(entry.rpe),
          distanceMeters: nullableNumber(entry.distanceMeters),
          seconds: nullableNumber(entry.seconds),
          notes: String(entry.notes || ""),
        })),
      };
      if (existingIndex == null) {
        existing.set(workout.externalKey, next.sessions.length);
        next.sessions.push(session);
        imported += 1;
      } else {
        next.sessions[existingIndex] = session;
        updated += 1;
      }
    });

    return { data: next, imported, updated, skipped };
  }

  function isProgressEntry(entry) {
    const setOrder = String(entry?.setOrder || "").trim().toLocaleLowerCase();
    return !["note", "rest timer"].includes(setOrder);
  }

  function estimatedOneRepMax(weightKg, reps) {
    const weight = nullableNumber(weightKg);
    const repetitions = nullableNumber(reps);
    if (weight == null || weight <= 0 || repetitions == null || repetitions <= 0) return null;
    if (repetitions === 1) return weight;
    return weight * (1 + repetitions / 30);
  }

  function computeExerciseSeries(data, exerciseName) {
    const target = String(exerciseName || "").trim().toLocaleLowerCase();
    const sessions = new Map();
    cloneWorkoutData(data).sessions.forEach((session) => {
      if (session.status !== "completed") return;
      const matching = session.entries.filter((entry) =>
        String(entry.exerciseName || "").trim().toLocaleLowerCase() === target && isProgressEntry(entry));
      if (!matching.length) return;
      let workingSets = 0;
      let volumeKg = 0;
      let maxWeightKg = null;
      let estimated1rmKg = null;
      const sets = [];
      matching.forEach((entry) => {
        const weight = nullableNumber(entry.weightKg);
        const reps = nullableNumber(entry.reps);
        const seconds = nullableNumber(entry.seconds);
        const distanceMeters = nullableNumber(entry.distanceMeters);
        if (weight != null || reps != null || seconds != null || distanceMeters != null) {
          workingSets += 1;
          sets.push({
            setOrder: String(entry.setOrder || ""),
            weightKg: weight,
            reps,
            rpe: nullableNumber(entry.rpe),
            seconds,
            distanceMeters,
          });
        }
        if (weight != null) maxWeightKg = maxWeightKg == null ? weight : Math.max(maxWeightKg, weight);
        if (weight != null && reps != null) volumeKg += weight * reps;
        const estimate = estimatedOneRepMax(weight, reps);
        if (estimate != null) estimated1rmKg = estimated1rmKg == null ? estimate : Math.max(estimated1rmKg, estimate);
      });
      const key = session.id || session.externalKey || `${session.startedAt}:${session.workoutName}`;
      sessions.set(key, {
        sessionId: session.id || "",
        dateKey: session.dateKey || String(session.startedAt || "").slice(0, 10),
        startedAt: session.startedAt || "",
        workoutName: session.workoutName || "Workout",
        workingSets,
        volumeKg,
        maxWeightKg,
        estimated1rmKg,
        sets,
      });
    });
    return Array.from(sessions.values()).sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  }

  function computeWorkoutSummary(data) {
    const completed = cloneWorkoutData(data).sessions.filter((session) => session.status === "completed");
    const exerciseNames = new Set();
    let rows = 0;
    let workingSets = 0;
    let volumeKg = 0;
    let durationSeconds = 0;
    completed.forEach((session) => {
      durationSeconds += nullableNumber(session.durationSeconds) || 0;
      session.entries.forEach((entry) => {
        if (entry.exerciseName) exerciseNames.add(String(entry.exerciseName).trim());
        rows += 1;
        if (!isProgressEntry(entry)) return;
        const weight = nullableNumber(entry.weightKg);
        const reps = nullableNumber(entry.reps);
        if (weight != null || reps != null || nullableNumber(entry.seconds) != null || nullableNumber(entry.distanceMeters) != null) workingSets += 1;
        if (weight != null && reps != null) volumeKg += weight * reps;
      });
    });
    const ordered = completed.sort((a, b) => String(a.startedAt || "").localeCompare(String(b.startedAt || "")));
    return {
      sessions: completed.length,
      rows,
      workingSets,
      volumeKg,
      durationSeconds,
      exercises: exerciseNames.size,
      firstDate: ordered[0]?.dateKey || "",
      lastDate: ordered[ordered.length - 1]?.dateKey || "",
    };
  }

  function createWorkoutDraft(data, options) {
    const next = cloneWorkoutData(data);
    const dateKey = String(options?.dateKey || "").slice(0, 10);
    const routineCode = /^[A-F]$/.test(String(options?.routineCode || "").toUpperCase())
      ? String(options.routineCode).toUpperCase()
      : "";
    let session = next.sessions.find(
      (candidate) => candidate.status === "draft" && candidate.dateKey === dateKey && candidate.source === "gamify",
    );
    const created = !session;
    if (!session) {
      session = {
        id: `gamify-draft:${dateKey}`,
        externalKey: "",
        externalWorkoutNumber: "",
        dateKey,
        startedAt: `${dateKey}T12:00:00`,
        workoutName: String(options?.routineName || routineCode || "Workout"),
        routineCode,
        durationSeconds: null,
        workoutNotes: "",
        status: "draft",
        source: "gamify",
        completedAt: "",
        entries: (Array.isArray(options?.entries) ? options.entries : []).map((entry, index) => ({
          exerciseName: String(entry.exerciseName || ""),
          entryOrder: index,
          setOrder: String(entry.setOrder || index + 1),
          weightKg: nullableNumber(entry.weightKg),
          reps: nullableNumber(entry.reps),
          rpe: nullableNumber(entry.rpe),
          distanceMeters: nullableNumber(entry.distanceMeters),
          seconds: nullableNumber(entry.seconds),
          notes: String(entry.notes || ""),
        })),
      };
      next.sessions.push(session);
    } else {
      session.routineCode = routineCode;
      session.workoutName = String(options?.routineName || routineCode || session.workoutName || "Workout");
      if (Array.isArray(options?.entries) && session.entries.length === 0) {
        session.entries = options.entries.map((entry, index) => ({ ...entry, entryOrder: index }));
      }
    }
    return { data: next, session, created };
  }

  function finishWorkoutSession(data, sessionId, completedAt) {
    const next = cloneWorkoutData(data);
    const session = next.sessions.find((candidate) => candidate.id === sessionId);
    if (!session) return { data: next, session: null };
    session.status = "completed";
    session.completedAt = String(completedAt || new Date().toISOString());
    return { data: next, session };
  }

  function computeExerciseProgress(data, exerciseName) {
    const target = String(exerciseName || "").trim().toLocaleLowerCase();
    const sets = [];
    cloneWorkoutData(data).sessions.forEach((session) => {
      if (session.status !== "completed") return;
      session.entries.forEach((entry) => {
        if (String(entry.exerciseName || "").trim().toLocaleLowerCase() !== target) return;
        if (!isProgressEntry(entry)) return;
        const weightKg = nullableNumber(entry.weightKg);
        const reps = nullableNumber(entry.reps);
        if (weightKg == null && reps == null) return;
        sets.push({
          ...entry,
          weightKg,
          reps,
          dateKey: session.dateKey || String(session.startedAt || "").slice(0, 10),
          workoutName: session.workoutName || "Workout",
        });
      });
    });
    sets.sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));

    let bestWeightKg = null;
    let totalVolumeKg = 0;
    const bestRepsByWeight = {};
    sets.forEach((entry) => {
      if (entry.weightKg != null) {
        bestWeightKg = bestWeightKg == null ? entry.weightKg : Math.max(bestWeightKg, entry.weightKg);
      }
      if (entry.weightKg != null && entry.reps != null) {
        totalVolumeKg += entry.weightKg * entry.reps;
        const key = String(entry.weightKg);
        bestRepsByWeight[key] = Math.max(bestRepsByWeight[key] || 0, entry.reps);
      }
    });
    return { sets, bestWeightKg, totalVolumeKg, bestRepsByWeight };
  }

  function getFitnessTrackerValueForDate(data, dateKey) {
    const completed = cloneWorkoutData(data).sessions
      .filter((session) => session.status === "completed" && session.dateKey === dateKey)
      .sort((a, b) => String(a.startedAt || "").localeCompare(String(b.startedAt || "")));
    if (completed.length === 0) return 0;
    const latest = completed[completed.length - 1];
    const codeIndex = ["A", "B", "C", "D", "E", "F"].indexOf(latest.routineCode);
    return codeIndex >= 0 ? codeIndex + 1 : 7;
  }

  function csvValue(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportStrongCsv(workouts) {
    const lines = [STRONG_HEADERS.map(csvValue).join(";")];
    (Array.isArray(workouts) ? workouts : []).forEach((workout, workoutIndex) => {
      const workoutNumber = workout.externalWorkoutNumber || String(workoutIndex + 1);
      const entries = Array.isArray(workout.entries) ? workout.entries : [];
      entries.forEach((entry) => {
        const row = [
          workoutNumber,
          workout.date || workout.startedAt || "",
          workout.workoutName || "",
          workout.durationSeconds ?? "",
          entry.exerciseName || "",
          entry.setOrder || "",
          entry.weightKg ?? "",
          entry.reps ?? "",
          entry.rpe ?? "",
          entry.distanceMeters ?? "",
          entry.seconds ?? "",
          entry.notes || "",
          workout.workoutNotes || "",
        ];
        lines.push(row.map(csvValue).join(";"));
      });
    });
    return `${lines.join("\r\n")}\r\n`;
  }

  function parseStrongCsv(text) {
    const normalized = String(text || "").replace(/^\uFEFF/, "");
    const headerLine = normalized.replace(/\r\n?/g, "\n").split("\n", 1)[0] || "";
    const parsedHeaders = parseTolerantStrongRow(headerLine);
    const errors = [];
    if (
      parsedHeaders.length !== STRONG_HEADERS.length ||
      parsedHeaders.some((header, index) => header !== STRONG_HEADERS[index])
    ) {
      errors.push("Strong CSV header does not match the expected 13-column format.");
    }

    const rows = [];
    splitTolerantStrongRecords(normalized).forEach((chunk, index) => {
      const values = parseTolerantStrongRow(chunk);
      if (values.length !== STRONG_HEADERS.length) {
        errors.push(`Record ${index + 1} has ${values.length} columns; expected 13.`);
        return;
      }
      rows.push(Object.fromEntries(STRONG_HEADERS.map((header, column) => [header, values[column]])));
    });

    return { headers: [...STRONG_HEADERS], rows, workouts: groupStrongRows(rows), errors };
  }

  // Axis helpers shared by the workout charts: they keep every tick on a readable
  // number (10/20/50/…) instead of echoing the raw data minimum and maximum.
  function niceAxisTicks(min, max, count) {
    const target = Math.max(2, Math.round(Number(count) || 5));
    let low = Number(min);
    let high = Number(max);
    if (!Number.isFinite(low) || !Number.isFinite(high)) return { min: 0, max: 0, step: 0, ticks: [] };
    if (low > high) [low, high] = [high, low];
    if (low === high) {
      const span = Math.max(1, Math.abs(low) * 0.1);
      low -= span;
      high += span;
    }
    const rawStep = (high - low) / (target - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const multiple = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
    const step = multiple * magnitude;
    const niceLow = Math.floor(low / step) * step;
    const niceHigh = Math.ceil(high / step) * step;
    const ticks = [];
    for (let value = niceLow; value <= niceHigh + step / 1000; value += step) {
      ticks.push(Number(value.toFixed(6)));
    }
    return { min: Number(niceLow.toFixed(6)), max: Number(niceHigh.toFixed(6)), step, ticks };
  }

  // Even time steps: equal horizontal distance means equal elapsed time, so a
  // three-week break reads as a three-week gap instead of one session slot.
  // Both ends land on real session dates, so the graph stays readable.
  function timeAxisTicks(fromKey, toKey, count) {
    const from = new Date(`${String(fromKey || "").slice(0, 10)}T12:00:00`).getTime();
    const to = new Date(`${String(toKey || "").slice(0, 10)}T12:00:00`).getTime();
    const limit = Math.max(2, Math.round(Number(count) || 7));
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
      return [{ time: Number.isFinite(from) ? from : 0, dateKey: String(fromKey || "").slice(0, 10) }];
    }
    const ticks = [];
    const seen = new Set();
    for (let step = 0; step < limit; step += 1) {
      const time = from + ((to - from) * step) / (limit - 1);
      const date = new Date(Math.min(to, Math.max(from, Math.round(time))));
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (seen.has(dateKey)) continue;
      seen.add(dateKey);
      ticks.push({ time, dateKey });
    }
    return ticks;
  }

  return {
    STRONG_HEADERS,
    computeExerciseProgress,
    computeExerciseSeries,
    niceAxisTicks,
    timeAxisTicks,
    computeWorkoutSummary,
    createWorkoutDraft,
    exportStrongCsv,
    finishWorkoutSession,
    getFitnessTrackerValueForDate,
    importStrongWorkouts,
    inferRoutineCode,
    estimatedOneRepMax,
    parseStrongCsv,
  };
});
