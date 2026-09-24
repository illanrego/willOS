# Startpage Workout Feature Plan

> Superseded on 2026-09-13: Startpage is now a read-only analytics companion to Strong, not a
> workout logger or Strong replacement. The active UI imports repeat Strong CSV exports, refreshes
> matching sessions, feeds completed dates into Gamify/Physique, and provides history plus exercise
> progression analytics. Its typed-confirmation deletion removes Workout history from local/Supabase
> storage and reconciles the corresponding Physique calendar and Fitness XP. The original
> implementation plan below is retained as historical context.

Created: 2026-09-02

## Name

Workout.

## Problem

The existing Workout window is only a fixed 6-row plan editor. It keeps a local working plan, a separate local reset snapshot, and a partially synchronized Supabase copy. The Save button saves only the reset snapshot, while cell edits save through another path. This makes persistence difficult to understand and does not record completed workouts.

Gamify currently stores a Physique day as an A-F marker in `tracker_daily_values`, but that marker is not connected to a workout session, exercises, sets, duration, or notes. Startpage therefore cannot answer what was performed on a marked day.

## Product truth

Workout is the source of truth for performed training. Gamify visualizes completed Workout sessions and awards Physique progress; it does not independently claim that a workout happened.

A draft workout may exist for a date and routine without counting as completed. Physique receives a completed marker and XP only when the workout is explicitly finished.

## Target role

Startpage should be a full replacement for Strong:

- create and edit workout templates;
- run and record detailed workouts;
- browse workout history and exercise progress;
- import the user's existing Strong history;
- export Strong-compatible CSV that can be moved back to the phone or another compatible app.

## Source export inspected

File: `/home/illan/Downloads/strong1744047614538687368.csv`

Observed data:

- 13 semicolon-delimited columns:
  - `Workout #`
  - `Date`
  - `Workout Name`
  - `Duration (sec)`
  - `Exercise Name`
  - `Set Order`
  - `Weight (kg)`
  - `Reps`
  - `RPE`
  - `Distance (meters)`
  - `Seconds`
  - `Notes`
  - `Workout Notes`
- 6,397 logical rows representing 320 workouts.
- Date range: 2022-06-01 12:57:06 through 2026-09-02 16:40:48.
- 64 distinct exercise names and 66 distinct workout names.
- Set-order values include numeric working sets plus `W`, `F`, `D`, `Note`, and `Rest Timer`.
- The optional fields are genuinely used: weight, reps, RPE, distance, seconds, per-entry notes, and workout notes must all be preserved.
- Some notes contain embedded newlines and unescaped double quotes. A standards-only CSV parser loses records; the importer must tolerate this Strong export behavior while the exporter must produce correctly escaped CSV.
- The source currently contains one workout per calendar date, but the Startpage model must not unnecessarily forbid multiple sessions on one day.

## Agreed behavior

### Gamify to Workout

When Physique is selected in Gamify:

1. Clicking an unlogged calendar day opens an A-F routine choice.
2. Choosing a routine creates or opens one draft Workout session for that date and routine.
3. The Workout window opens on that draft.
4. Changing routine updates the same draft rather than creating duplicates.
5. The draft is visually distinguishable from a completed day and awards no XP.
6. `Finish workout` changes the session to completed, persists its details, and then updates the Physique marker and XP.
7. Clicking a completed Physique day opens the corresponding completed session instead of cycling or deleting its marker.
8. Reopening, deleting, or changing a completed session reconciles the Physique day from the remaining completed Workout sessions.

### Imported history to Gamify

Every imported Strong workout is a completed Workout session and marks its historical Physique date.

Routine badges are inferred only from clear workout names:

- A: A, Alpha, Alfa, or α prefixes/forms;
- B: B, Beta, or β prefixes/forms;
- C: C, Gamma, or γ prefixes/forms;
- D: D or Delta prefixes/forms;
- E: E or Epsilon prefixes/forms;
- F: F prefixes/forms.

Ambiguous names remain completed but display an unlabeled Physique dot. They are not falsely assigned to A.

## User experience

The Workout window gains five compact sections/tabs while preserving the retro OS style.

### Log

- selected date, routine code, and workout name;
- draft/completed status;
- start time and duration;
- workout notes;
- ordered exercises and entries;
- add/remove/reorder exercises;
- add/remove entries;
- fields for set order/type, weight kg, reps, RPE, distance meters, seconds, and notes;
- prefill from the selected template and, where useful, the most recent matching exercise performance;
- automatic draft persistence;
- explicit `Finish workout` action that controls Gamify completion;
- explicit reopen/delete actions with confirmation.

### Templates

- A-F routines inside the active plan;
- editable routine names;
- any number of ordered exercises rather than the current six-row ceiling;
- target sets, target reps, target weight, rest seconds, and notes;
- adding an exercise reuses the exercise library;
- the current week/A-F plan is migrated into the new routine structure without deleting the legacy storage or tables during the first release.

### History

- newest-first workout list;
- filter by routine, workout name, exercise, and date range;
- open a complete session for review/editing;
- show duration, exercise count, set count, and workout notes.

### Progress

- choose an exercise;
- chronological recent-performance table;
- best weight, best reps at a weight, estimated volume, and recent trend;
- exclude `Note` and `Rest Timer` rows from strength calculations while preserving them in history/export;
- do not invent comparisons for rows without the required numeric fields.

### Import / Export

- file picker for Strong-compatible CSV;
- preview totals and validation errors before writing;
- idempotent import: importing the same export again creates no duplicate sessions or entries;
- preserve all 13 source fields and logical row order;
- tolerate Strong's unescaped quote/newline behavior;
- export the exact 13-column layout using semicolons, quoted fields, decimal dots, and valid CSV escaping;
- allow exporting all history or a selected date range.

## Data model

### Existing tables retained

- `workout_exercises`
- `workout_plans`
- `workout_plan_slots` (legacy plan compatibility during migration)
- `trackers`
- `tracker_daily_values`

### New template tables

`workout_routines`

- `id`
- `user_id`
- `workout_plan_id`
- `code` (`A`-`F`)
- `name`
- `position`
- `is_active`
- timestamps
- unique routine code per user and plan

`workout_routine_exercises`

- `id`
- `user_id`
- `routine_id`
- `exercise_id`
- `exercise_name` snapshot/fallback
- `position`
- `target_sets`
- `target_reps` text, allowing values such as `8-12`
- `target_weight_kg`
- `rest_seconds`
- `notes`
- timestamps

### New workout history tables

`workout_sessions`

- `id`
- `user_id`
- nullable `routine_id`
- nullable `routine_code` (`A`-`F`)
- `workout_name`
- `status` (`draft`, `completed`)
- `started_at`
- `duration_seconds`
- `workout_notes`
- `source` (`startpage`, `strong_import`, `gamify`)
- nullable `external_workout_number`
- nullable unique-per-user `external_key`, formed deterministically for imported sessions
- `completed_at`
- timestamps

`workout_session_entries`

- `id`
- `user_id`
- `workout_session_id`
- nullable `exercise_id`
- `exercise_name` snapshot
- `entry_order`
- `set_order` text
- nullable `weight_kg`
- nullable `reps`
- nullable `rpe`
- nullable `distance_meters`
- nullable `seconds`
- `notes`
- timestamps

A session entry intentionally mirrors one Strong CSV row. This preserves warmups, failure/drop markers, notes, timers, cardio, and their exact ordering without forcing incompatible rows into a strength-only set model.

All new tables use `user_id`, foreign keys that preserve same-user ownership, RLS, own-user policies, updated-at triggers, and indexes for history/date/exercise lookups.

## Local fallback

Use a versioned `workoutData_v2` local structure for routines, sessions, and entries when signed out or when the backend is unavailable. Keep the current v1 keys readable for migration:

- `workoutPlan_v1`
- `workoutPlan_saved_v1`
- `workoutExerciseLibrary_v1`

Signed-in Supabase state remains canonical. Local fallback writes must not silently overwrite loaded remote history.

## Gamify representation

`tracker_daily_values` remains the canonical Gamify/Skills daily ledger.

For Physique:

- values 1-6 represent completed routine A-F;
- value 7 represents a completed workout whose routine is unknown/ambiguous;
- a draft has no positive tracker value;
- the Workout session remains the canonical detailed record;
- reconciliation derives the daily tracker value from completed sessions, preventing a completed badge without a workout record.

Existing fitness values continue decoding as A-F. The tracker `day_max` expands to 7 solely to represent an unlabeled completed workout.

## Migration and import rules

1. Add the new Supabase schema without dropping existing workout tables or data.
2. Convert the current active plan slots into A-F/new routine records once, preserving exercise order.
3. Import Strong rows grouped by `Workout #` and Date.
4. Generate a deterministic `external_key` from source plus workout number and timestamp.
5. Upsert exercises by normalized name while retaining the original name snapshot on every session entry.
6. Insert a complete session and its entries as one logical import operation; on failure, do not mark it imported.
7. Reconcile the Physique tracker after each imported batch.
8. Report imported, skipped-existing, and invalid totals.
9. Never overwrite a Startpage-authored session merely because an imported workout shares its date.

## Implementation phases

### Phase 1 — Pure model and CSV compatibility

- Extract testable workout normalization, routine inference, Strong import parsing, export escaping, grouping, and idempotency-key helpers into a browser-compatible module.
- Add Node's built-in test runner; no framework dependency is required.
- Build fixtures covering ordinary rows, notes with semicolons, embedded newlines, unescaped quotes, timers, note rows, blank optional values, and round-trip export/import.

Verification:

- focused unit tests fail before implementation and pass afterward;
- all 6,397 logical source rows parse into 320 workouts;
- importing an exported fixture preserves all 13 field values.

### Phase 2 — Supabase schema and repository layer

- add migrations for routines, routine exercises, sessions, and entries;
- add RLS, ownership constraints, triggers, and indexes;
- implement local v2 state plus Supabase load/save/import methods;
- migrate the current v1 plan into routines once;
- fix the misleading old Save/snapshot split by replacing it with explicit autosave/status behavior.

Verification:

- migration syntax/static checks;
- repository tests for draft persistence, session completion, entry ordering, and idempotent import;
- signed-out fallback and signed-in canonical state remain separate.

### Phase 3 — Log and template UI

- replace the fixed table with Log and Templates sections;
- create/open drafts from routine/date;
- detailed entry editor with automatic draft persistence;
- explicit finish/reopen/delete lifecycle;
- flexible A-F template editor.

Verification:

- draft survives rerender/reload;
- unfinished draft does not award Physique XP;
- finishing preserves every entered field;
- templates generate correctly ordered draft entries.

### Phase 4 — Gamify integration

- replace direct Physique-marker mutation with Workout draft/open behavior;
- reconcile completed Workout sessions to `tracker_daily_values`;
- support value 7 as an unlabeled completed dot;
- open existing draft/completed sessions from calendar days;
- preserve other Gamify skills and Habitica behavior unchanged.

Verification:

- A-F draft selection creates exactly one draft;
- repeat selection opens/updates the same draft;
- finish creates the correct badge and one XP day;
- reopen/delete removes or recalculates that day;
- imported ambiguous workout shows a completed unlabeled dot.

### Phase 5 — History, progress, and full Strong import/export UI

- import preview and confirmed batch write;
- history filters and detail view;
- exercise progress summaries;
- date-range/all-history Strong-compatible export;
- import the supplied 320-workout history after preview confirmation.

Verification:

- supplied file previews as 320 workouts and 6,397 rows;
- second import reports all sessions skipped with no duplicates;
- exported CSV reimports with equal logical data;
- historical Physique dates are populated with inferred or unlabeled badges.

### Phase 6 — Final validation

- run focused tests after each vertical slice;
- run the full Node test suite;
- run JavaScript syntax checks and project static verifiers;
- run Supabase migration validation available in the local environment;
- run `git diff --check`;
- manually exercise the browser flow locally: calendar → draft → log → finish → history → Gamify;
- commit each coherent phase; do not push unless explicitly requested.

## Accepted boundaries

- Do not change Coding's definition: only LeetCode/Java/old-school study belongs in that skill.
- Do not alter other Gamify skills, Habitica scoring, Finance, Planner, Kanban, or unrelated windows.
- Do not push or deploy automatically.
- Do not delete the supplied CSV or legacy workout data during migration.

## Delivered behavior (2026-09-02)

Implemented and committed in three phases behind 10 passing unit/static tests:

1. **CSV compatibility core** (`workout-core.js`) — tolerant Strong CSV parsing that survives
   unescaped quotes/embedded newlines, 13-field export, A-F routine-name inference, idempotent
   import, draft/completed lifecycle, fitness value derivation (A-F = 1-6, unknown = 7), and
   exercise progress stats. Verified against the supplied export: 6,397 rows / 320 workouts.
2. **Supabase schema** (`20260902000000_workout_sessions.sql`) — `workout_routines`,
   `workout_routine_exercises`, `workout_sessions`, `workout_session_entries` with RLS,
   same-user FK chains, triggers, indexes, and a unique `user_id,external_key` idempotency key.
3. **Browser app** (`workout-v2.js` + `workout-v2.css`) — the Workout window is now a 5-tab
   experience (Log, Templates, History, Progress, Import / Export) with detailed ordered entry
   rows, explicit Finish/reopen/delete, autosave, flexible A-F template editor, filters,
   per-exercise progress, preview-then-import, and Strong-compatible export. It reads the legacy
   option only once to seed A-F routine templates, and degrades to local storage when the
   new tables are absent. `startpage.js` was wired so a Musculacao calendar day opens the Log
   with an A-F picker (decision kept), finished sessions populate the circuit letter/XP, and
   ambiguous workouts use an unlabeled value-7 dot.

Not yet applied:

- The new tables must be migrated to Supabase for signed-in persistence.
- The supplied 320-workout history has not been imported; check a preview on the Import / Export
  tab and confirm before writing.
- A broad reload-to-reload browser smoke test of the editor is still manual.

## Acceptance criteria

- Reloading no longer makes saved Workout state ambiguous or silently lose changes.
- A draft and a completed workout are distinct persisted states.
- Physique XP cannot be created without a completed Workout session after the migration.
- Selecting A-F from Gamify creates/opens a draft and opens Workout.
- Completing the draft updates Workout history and Gamify exactly once.
- Templates support more than six exercises and detailed targets.
- Every Strong field can be stored, edited where relevant, imported, and exported.
- The supplied 320-workout file imports without logical-row loss despite malformed quote/newline combinations.
- Reimport is idempotent.
- Imported clear routine names receive A-F badges; ambiguous names receive an unlabeled completed badge.
- History and per-exercise progress are usable without relying on Strong.

## Protected boundaries

- Do not change Coding's definition: only LeetCode/Java/old-school study belongs in that skill.
- Do not alter other Gamify skills, Habitica scoring, Finance, Planner, Kanban, or unrelated windows.
- Do not push or deploy automatically.
- Do not delete the supplied CSV or legacy workout data during migration.
