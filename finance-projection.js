// Finance window: a READ-ONLY projection of the will finance store.
//
//   data/finance.json  <- will finance store
//     will fin add "149,90" --kind expense --category course --note "..."
//     will fin list [--month 2026-09]
//
// The window used to hold the whole ledger: quick log, categories, budgets,
// recurring entries, opening balances, a pie chart and Supabase CRUD. All of it
// is gone; the amounts are stored in cents on the CLI side so nothing drifts.

const FINANCE_PROJECTION_URL = "data/finance.json";

const financeProjectionState = { model: null, status: "Ready.", renderRaf: 0 };

function setFinanceStatus(message) {
  const el = document.getElementById("financeStatus");
  if (el) el.textContent = message;
}

function emptyFinanceModel() {
  return {
    generatedAt: "",
    totals: { month: "", income_cents: 0, expense_cents: 0, net_cents: 0, count: 0 },
    categories: {},
    recent: [],
  };
}

function normalizeFinanceModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const totals = source.totals && typeof source.totals === "object" ? source.totals : {};
  const categories = source.categories && typeof source.categories === "object" ? source.categories : {};
  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    totals: {
      month: String(totals.month || ""),
      incomeCents: Number(totals.income_cents) || 0,
      expenseCents: Number(totals.expense_cents) || 0,
      netCents: Number(totals.net_cents) || 0,
      count: Number(totals.count) || 0,
    },
    categories: Object.keys(categories).map((name) => ({
      name,
      cents: Number(categories[name]) || 0,
    })),
    recent: (Array.isArray(source.recent) ? source.recent : [])
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        id: Number(entry.id) || 0,
        date: String(entry.date || ""),
        kind: String(entry.kind || "expense"),
        amount: String(entry.amount || "0.00"),
        category: String(entry.category || ""),
        note: String(entry.note || ""),
      })),
  };
}

function money(cents) {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}R$ ${Math.floor(absolute / 100)},${String(absolute % 100).padStart(2, "0")}`;
}

async function loadFinanceModel() {
  try {
    const response = await fetch(FINANCE_PROJECTION_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    financeProjectionState.model = normalizeFinanceModel(payload);
    const totals = financeProjectionState.model.totals;
    const stamp = financeProjectionState.model.generatedAt
      ? ` exported ${financeProjectionState.model.generatedAt}`
      : "";
    financeProjectionState.status =
      `${totals.month}: ${totals.count} entries, net ${money(totals.netCents)}${stamp}. ` +
      'Read-only: will fin add "149,90" --kind expense';
  } catch (error) {
    financeProjectionState.model = emptyFinanceModel();
    financeProjectionState.status = `No render model yet (${error.message}). Run: will export`;
  }
  return financeProjectionState.model;
}

function renderFinanceTotals() {
  const host = document.getElementById("financeTotals");
  if (!host) return;
  host.innerHTML = "";

  const model = financeProjectionState.model;
  if (!model) return;

  const boxes = [
    { label: "income", value: money(model.totals.incomeCents) },
    { label: "spent", value: money(model.totals.expenseCents) },
    { label: "net", value: money(model.totals.netCents), strong: true },
    { label: "entries", value: String(model.totals.count) },
  ];

  boxes.forEach((box) => {
    const el = document.createElement("div");
    el.className = "finance-stat";
    if (box.strong) el.classList.add("finance-stat--strong");

    const label = document.createElement("span");
    label.className = "finance-stat-label";
    label.textContent = box.label;

    const value = document.createElement("span");
    value.className = "finance-stat-value";
    value.textContent = box.value;

    el.append(label, value);
    host.appendChild(el);
  });
}

function renderFinanceCategories() {
  const host = document.getElementById("financeCategories");
  if (!host) return;
  host.innerHTML = "";

  const model = financeProjectionState.model;
  if (!model) return;

  if (model.categories.length === 0) {
    const empty = document.createElement("p");
    empty.className = "projection-empty";
    empty.textContent = "nothing spent this month";
    host.appendChild(empty);
    return;
  }

  const total = model.categories.reduce((sum, row) => sum + row.cents, 0) || 1;
  model.categories.forEach((row) => {
    const line = document.createElement("div");
    line.className = "finance-category";

    const name = document.createElement("span");
    name.className = "finance-category-name";
    name.textContent = row.name || "uncategorized";

    const bar = document.createElement("span");
    bar.className = "finance-category-bar";
    const fill = document.createElement("span");
    fill.className = "finance-category-fill";
    fill.style.width = `${Math.max(4, Math.round((row.cents / total) * 100))}%`;
    bar.appendChild(fill);

    const amount = document.createElement("span");
    amount.className = "finance-category-amount";
    amount.textContent = money(row.cents);

    line.append(name, bar, amount);
    host.appendChild(line);
  });
}

function renderFinanceRecent() {
  const host = document.getElementById("financeRecent");
  if (!host) return;
  host.innerHTML = "";

  const model = financeProjectionState.model;
  if (!model) return;

  if (model.recent.length === 0) {
    const empty = document.createElement("li");
    empty.className = "projection-empty";
    empty.textContent = 'No entries yet. In the terminal: will fin add 149,90 --kind expense --category course';
    host.appendChild(empty);
    return;
  }

  model.recent.forEach((entry) => {
    const li = document.createElement("li");
    li.dataset.entryId = String(entry.id);

    const date = document.createElement("span");
    date.className = "projection-date";
    date.textContent = entry.date;

    const tag = document.createElement("span");
    tag.className = `projection-tag projection-tag--${entry.kind}`;
    tag.textContent = entry.kind;

    const main = document.createElement("span");
    main.className = "projection-main";
    main.textContent = [entry.category, entry.note].filter(Boolean).join(" · ");

    const amount = document.createElement("span");
    amount.className = "finance-entry-amount";
    amount.textContent = `R$ ${entry.amount}`;

    li.append(date, tag, main, amount);
    host.appendChild(li);
  });
}

function renderFinanceProjection() {
  renderFinanceTotals();
  renderFinanceCategories();
  renderFinanceRecent();
  setFinanceStatus(financeProjectionState.status);
}

function scheduleFinanceProjectionRender() {
  if (financeProjectionState.renderRaf) return;
  financeProjectionState.renderRaf = requestAnimationFrame(function () {
    financeProjectionState.renderRaf = 0;
    renderFinanceProjection();
  });
}

async function initFinanceProjection() {
  financeProjectionState.model = emptyFinanceModel();
  renderFinanceProjection();
  await loadFinanceModel();
  scheduleFinanceProjectionRender();
}

document.addEventListener("DOMContentLoaded", initFinanceProjection);
