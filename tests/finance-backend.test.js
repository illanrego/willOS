const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const appSource = fs.readFileSync("willos.js", "utf8");
const htmlSource = fs.readFileSync("index.html", "utf8");
const schemaSource = fs.readFileSync(
  "supabase/migrations/20260530000000_core_app_schema.sql",
  "utf8",
);
const openingBalanceSource = fs.readFileSync(
  "supabase/migrations/20260603120000_finance_opening_balances.sql",
  "utf8",
);

test("Signed-in lifecycle defers feature data until a window opens", () => {
  assert.match(appSource, /async function loadBackendSession\(session\)/);
  assert.match(appSource, /function handleBackendSession\(session\)/);
  assert.match(appSource, /backendSessionLoadPromise \|\| Promise\.resolve\(\)/);
  assert.match(appSource, /function syncFeatureForContainer\(containerId, options = \{\}\)/);
  assert.match(appSource, /if \(opening\) \{\s*void syncFeatureForContainer\(idQuadro\);/);

  const loginLifecycle = appSource.match(
    /async function loadBackendSession\(session\) \{([\s\S]*?)\n\}\n\nlet backendSessionLoadKey/,
  )?.[1] || "";
  assert.doesNotMatch(loginLifecycle, /refreshBackendModules/);
  assert.doesNotMatch(loginLifecycle, /import[A-Za-z]+LocalDataOnce/);
  assert.match(loginLifecycle, /syncVisibleFeatures/);
});

test("Finance sync remains available on demand", () => {
  assert.match(
    appSource,
    /if \(key === "finance"\) \{[\s\S]*?await loadFinanceRecurringState\(\);[\s\S]*?await refreshFinanceBackendState\(\);/,
  );
  assert.match(appSource, /const BACKEND_SYNC_ALL_CONTAINER_IDS = \[[\s\S]*?"financeContainer"/);
  assert.match(appSource, /syncFeatureForContainer\(containerId, \{ force: true \}\)/);
});

test("Finance quick log is expense-first with optional details", () => {
  assert.match(htmlSource, /data-finance-type="expense"[^>]*aria-pressed="true"/);
  assert.match(htmlSource, /id="financeAmountInput"[^>]*inputmode="decimal"/);
  assert.match(htmlSource, /id="financeCategoryChips"/);
  assert.match(htmlSource, /<summary>Change date<\/summary>/);
  assert.match(htmlSource, /id="financeAddBtn"[^>]*>Save expense<\/button>/);
  assert.match(htmlSource, /id="financeBalanceDetails"/);
  assert.match(appSource, /noteInput\.value\.trim\(\) \|\|/);
  assert.match(appSource, /FINANCE_LAST_CATEGORY_STORAGE_KEY/);
  assert.match(appSource, /setFinanceEntryStatus\(`\$\{typeLabel\} of \$\{formatFinanceAmount\(amount\)\} saved\.`/);
});

test("Finance logs use an owned Supabase table for CRUD and cross-device reads", () => {
  assert.match(schemaSource, /create table if not exists public\.finance_entries/);
  assert.match(schemaSource, /alter table public\.finance_entries enable row level security/);
  assert.match(schemaSource, /auth\.uid\(\) = user_id/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.select/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.insert/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.update/);
  assert.match(appSource, /\.from\("finance_entries"\)\s*\.delete/);
});

test("Finance opening balance persistence has its own RLS-protected migration", () => {
  assert.match(openingBalanceSource, /create table if not exists public\.finance_opening_balances/);
  assert.match(openingBalanceSource, /alter table public\.finance_opening_balances enable row level security/);
  assert.match(openingBalanceSource, /finance_opening_balances_all_own/);
  assert.match(appSource, /\.from\("finance_opening_balances"\)/);
});
