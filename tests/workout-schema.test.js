const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migrationPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260902000000_workout_sessions.sql",
);

test("workout V2 migration owns routines and session history under RLS", () => {
  const sql = fs.readFileSync(migrationPath, "utf8");

  for (const table of [
    "workout_routines",
    "workout_routine_exercises",
    "workout_sessions",
    "workout_session_entries",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`create policy "${table}_all_own"`));
  }

  assert.match(sql, /external_key text/);
  assert.match(sql, /unique \(user_id, external_key\)/);
  assert.match(sql, /status text not null default 'draft'/);
  assert.match(sql, /set_order text not null/);
  assert.match(sql, /entry_order integer not null/);
});
