// The Finance window is a projection now: the terminal owns the ledger
// (`will fin add ...`), data/finance.json is the render model, and this window
// reads it. The old quick-log form, budgets, recurring entries, opening
// balances and Supabase CRUD are gone from the shell.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

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

test("the Finance window carries no form controls", () => {
  const markup = windowMarkup("financeContainer");
  ["<input", "<select", "<textarea", "<form"].forEach((snippet) => {
    assert.ok(!markup.includes(snippet), `#financeContainer must stay read-only, found ${snippet}`);
  });
  ["financeTotals", "financeCategories", "financeRecent", "financeStatus"].forEach((id) => {
    assert.ok(markup.includes(`id="${id}"`), `missing #${id}`);
  });
});

test("the finance ledger and its forms are gone from the shell", () => {
  const app = read("willos.js");

  for (const gone of [
    "FINANCE_STORAGE_KEY",
    "financeRemoteState",
    "renderFinanceList",
    "refreshFinanceBackendState",
    "loadFinanceBackendState",
    "finance_entries",
    "financeAmountInput",
    "financeBudgetSection",
  ]) {
    assert.ok(!app.includes(gone), `willos.js still carries ${gone}`);
  }
  assert.ok(!app.includes("financeContainer: { key:"), "Finance must not be in the backend sync list");
  assert.ok(!app.includes('"financeContainer",'), "Finance must not be in the sync-all list");
});

test("the projection reads data/finance.json and only reads", () => {
  const projection = read("finance-projection.js");
  assert.match(projection, /const FINANCE_PROJECTION_URL = "data\/finance\.json"/);
  assert.match(projection, /fetch\(FINANCE_PROJECTION_URL, \{ cache: "no-store" \}\)/);
  assert.ok(!projection.includes("supabase"), "no database in the projection");
  assert.ok(!projection.includes("localStorage.setItem"), "no writes in the projection");
});

test("the projection is loaded before the shell runs", () => {
  const html = read("index.html");
  assert.ok(html.indexOf("finance-projection.js") < html.indexOf("willos.js"));
});

test("the finance exporter exists behind the render model", () => {
  const exporter = read("willcli/exporter.py");
  assert.match(exporter, /def export_finance\(/);
  assert.match(exporter, /"finance": export_finance/);
});

test("the old finance tables stay in the migrations as history", () => {
  const schema = read("supabase/migrations/20260530000000_core_app_schema.sql");
  assert.match(schema, /create table if not exists public\.finance_entries/);
  assert.match(schema, /alter table public\.finance_entries enable row level security/);
});

test("Signed-in lifecycle defers feature data until a window opens", () => {
  const app = read("willos.js");
  assert.match(app, /async function loadBackendSession\(session\)/);
  assert.match(app, /function syncFeatureForContainer\(containerId, options = \{\}\)/);
  assert.match(app, /if \(opening\) \{\s*(?:void|\/\/) ?syncFeatureForContainer\(idQuadro\);/);
});
