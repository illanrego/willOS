// Planner window: a READ-ONLY projection of the will planner store.
//
// Plans are written in the terminal:
//   will plan add "finish the flip" --start 2026-09-24 --end 2026-09-30 --note "..."
// The CLI writes ~/.local/share/will/planner.json and exports data/planner.json;
// this draws it. No form, no save button, no Supabase.

const plannerProjectionState = {
  model: null,
  status: "Ready.",
  renderRaf: 0,
};

const PLANNER_PROJECTION_URL = "data/planner.json";

function setPlannerStatus(message) {
  const el = document.getElementById("plannerStatus");
  if (el) el.textContent = message;
}

function normalizePlannerModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const plans = Array.isArray(source.plans) ? source.plans : [];
  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    plans: plans
      .filter((plan) => plan && typeof plan === "object")
      .map((plan) => ({
        id: Number(plan.id) || 0,
        title: String(plan.title || ""),
        start: String(plan.start || ""),
        end: String(plan.end || ""),
        note: String(plan.note || ""),
        state: String(plan.state || ""),
      })),
  };
}

async function loadPlannerModel() {
  try {
    const response = await fetch(PLANNER_PROJECTION_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    plannerProjectionState.model = normalizePlannerModel(payload);
    const current = plannerProjectionState.model.plans.filter((plan) => plan.state === "current").length;
    const stamp = plannerProjectionState.model.generatedAt
      ? ` exported ${plannerProjectionState.model.generatedAt}`
      : "";
    plannerProjectionState.status =
      `${plannerProjectionState.model.plans.length} plans, ${current} running now${stamp}. ` +
      "Read-only: write plans with `will plan add`.";
  } catch (error) {
    plannerProjectionState.model = { generatedAt: "", plans: [] };
    plannerProjectionState.status = `No render model yet (${error.message}). Run: will export`;
  }
  return plannerProjectionState.model;
}

function plannerDateRange(plan) {
  if (plan.start && plan.end && plan.start !== plan.end) return `${plan.start} -> ${plan.end}`;
  return plan.start || plan.end || "";
}

function renderPlanner() {
  const host = document.getElementById("plannerList");
  if (!host) return;
  host.innerHTML = "";

  const model = plannerProjectionState.model;
  if (!model) {
    setPlannerStatus(plannerProjectionState.status);
    return;
  }

  if (model.plans.length === 0) {
    const empty = document.createElement("li");
    empty.className = "projection-empty";
    empty.textContent = 'Nothing planned. In the terminal: will plan add "what it is" --start 2026-09-24';
    host.appendChild(empty);
    setPlannerStatus(plannerProjectionState.status);
    return;
  }

  model.plans.forEach((plan) => {
    const row = document.createElement("li");
    row.dataset.planId = String(plan.id);

    const dates = document.createElement("span");
    dates.className = "projection-date";
    dates.textContent = plannerDateRange(plan);

    const main = document.createElement("span");
    main.className = "projection-main";
    main.textContent = plan.title;

    const tag = document.createElement("span");
    tag.className = `projection-tag projection-tag--${plan.state || "past"}`;
    tag.textContent = plan.state || "past";

    row.append(dates, tag, main);
    if (plan.note) {
      const note = document.createElement("span");
      note.className = "projection-note";
      note.textContent = plan.note;
      row.appendChild(note);
    }
    host.appendChild(row);
  });

  setPlannerStatus(plannerProjectionState.status);
}

function schedulePlannerRender() {
  if (plannerProjectionState.renderRaf) return;
  plannerProjectionState.renderRaf = requestAnimationFrame(function () {
    plannerProjectionState.renderRaf = 0;
    renderPlanner();
  });
}

async function initPlannerProjection() {
  plannerProjectionState.model = { generatedAt: "", plans: [] };
  renderPlanner();
  await loadPlannerModel();
  schedulePlannerRender();
}

document.addEventListener("DOMContentLoaded", initPlannerProjection);
