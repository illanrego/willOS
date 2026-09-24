// Content window: a READ-ONLY projection of the contentflow ledger.
//
// The page never owns content state. It fetches data/projection.json, a render
// model exported from ~/.local/share/contentflow/board.json, and draws it:
// lane legend + Monday-first month grid of posted days. No toggles, no writes,
// no Supabase. Changing content state happens in the terminal (`content ...`),
// never here. tests/shell-ui.test.js pins this.

const contentProjectionState = {
  projection: null,
  status: "Ready.",
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  renderRaf: 0,
};

const CONTENT_PROJECTION_URL = "data/projection.json";

function contentProjectionCore() {
  return typeof ProjectionCore === "object" && ProjectionCore ? ProjectionCore : null;
}

function setContentStatus(message) {
  const el = document.getElementById("contentStatus");
  if (el) el.textContent = message;
}

function emptyProjection() {
  const core = contentProjectionCore();
  return core ? core.normalizeProjection(null) : { generatedAt: "", source: "", lanes: [], days: {}, cards: [] };
}

async function loadContentProjection() {
  const core = contentProjectionCore();
  if (!core) {
    contentProjectionState.projection = emptyProjection();
    setContentStatus("projection-core.js did not load.");
    return contentProjectionState.projection;
  }

  try {
    const response = await fetch(CONTENT_PROJECTION_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const projection = core.normalizeProjection(payload);
    contentProjectionState.projection = projection;
    const flight = core.inFlight(projection.cards).length;
    const stamp = projection.generatedAt ? ` exported ${projection.generatedAt}` : "";
    const origin = projection.source ? ` from ${projection.source}` : "";
    contentProjectionState.status = `${projection.cards.length} cards, ${flight} in flight${origin}${stamp}. Read-only: the CLI owns every state change.`;
  } catch (error) {
    contentProjectionState.projection = emptyProjection();
    contentProjectionState.status = `No projection yet (${error.message}). Export it with: npm run export`;
  }

  return contentProjectionState.projection;
}

function renderContentLaneLegend() {
  const host = document.getElementById("contentLaneLegend");
  const core = contentProjectionCore();
  const projection = contentProjectionState.projection;
  if (!host || !core || !projection) return;

  const summary = core.laneSummary(projection.days, contentProjectionState.year, contentProjectionState.month);
  const lanes = Object.keys(core.LANE_STYLE).filter((lane) => {
    return projection.lanes.length === 0 || projection.lanes.includes(lane);
  });

  host.innerHTML = "";
  lanes.forEach((lane) => {
    const entry = summary[lane] || { count: 0, lastDateKey: "" };
    const chip = document.createElement("span");
    chip.className = "content-lane-chip";
    chip.dataset.lane = lane;
    chip.title = entry.lastDateKey
      ? `${core.laneLabel(lane)} - last posted ${entry.lastDateKey}`
      : `${core.laneLabel(lane)} - nothing posted yet`;

    const dot = document.createElement("span");
    dot.className = "content-lane-chip-dot";
    dot.style.background = core.laneColor(lane);

    const label = document.createElement("span");
    label.textContent = core.laneLabel(lane);

    const count = document.createElement("span");
    count.className = "content-lane-chip-count";
    count.textContent = String(entry.count);

    chip.append(dot, label, count);
    host.appendChild(chip);
  });
}

function renderContentMonthNav() {
  const nav = document.getElementById("contentMonthNav");
  const core = contentProjectionCore();
  if (!nav || !core) return;
  nav.innerHTML = "";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "<";
  prev.setAttribute("aria-label", "Previous month");
  prev.addEventListener("click", () => stepContentMonth(-1));

  const label = document.createElement("span");
  label.textContent = core.monthLabel(contentProjectionState.year, contentProjectionState.month);

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = ">";
  next.setAttribute("aria-label", "Next month");
  next.addEventListener("click", () => stepContentMonth(1));

  nav.append(prev, label, next);
}

function stepContentMonth(delta) {
  const core = contentProjectionCore();
  if (!core) return;
  const next = core.shiftMonth(contentProjectionState.year, contentProjectionState.month, delta);
  contentProjectionState.year = next.year;
  contentProjectionState.month = next.month;
  scheduleContentBoardRender();
}

function renderContentBoard() {
  const core = contentProjectionCore();
  const grid = document.getElementById("contentBoardGrid");
  if (!core || !grid) return;

  renderContentMonthNav();
  renderContentLaneLegend();
  grid.innerHTML = "";

  const projection = contentProjectionState.projection;
  if (!projection) {
    setContentStatus(contentProjectionState.status);
    return;
  }

  const now = new Date();
  const todayKey = core.dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const layout = core.monthGrid(contentProjectionState.year, contentProjectionState.month);
  const lanes = Object.keys(core.LANE_STYLE);

  layout.cells.forEach((cell) => {
    const day = projection.days[cell.dateKey] || {};
    const cellEl = document.createElement("div");
    cellEl.className = "content-day";
    if (!cell.inMonth) cellEl.classList.add("content-day--outside");
    if (cell.dateKey === todayKey) cellEl.classList.add("content-day--today");
    if (core.lanesOn(projection.days, cell.dateKey).length > 0) {
      cellEl.classList.add("content-day--has-post");
    }
    cellEl.dataset.date = cell.dateKey;

    const num = document.createElement("span");
    num.className = "content-day-num";
    num.textContent = String(cell.day);
    cellEl.appendChild(num);

    const dots = document.createElement("div");
    dots.className = "content-lane-dots";
    lanes.forEach((lane) => {
      const dot = document.createElement("span");
      dot.className = "content-lane-dot";
      const count = Number(day[lane]) || 0;
      if (count > 0 && cell.inMonth) {
        dot.classList.add("content-lane-dot--on");
        dot.style.background = core.laneColor(lane);
        dot.title = `${core.laneLabel(lane)}: ${count} posted`;
      } else {
        dot.classList.add("content-lane-dot--blank");
      }
      dots.appendChild(dot);
    });
    cellEl.appendChild(dots);
    grid.appendChild(cellEl);
  });

  const postedDays = core.monthPostedDays(
    projection.days,
    contentProjectionState.year,
    contentProjectionState.month,
  );
  const monthName = core.monthLabel(contentProjectionState.year, contentProjectionState.month);
  setContentStatus(`${postedDays} posted days in ${monthName}. ${contentProjectionState.status}`);
}

function scheduleContentBoardRender() {
  if (contentProjectionState.renderRaf) return;
  contentProjectionState.renderRaf = requestAnimationFrame(function () {
    contentProjectionState.renderRaf = 0;
    renderContentBoard();
  });
}

async function initContentProjection() {
  contentProjectionState.projection = emptyProjection();
  renderContentBoard();
  await loadContentProjection();
  scheduleContentBoardRender();
}

document.addEventListener("DOMContentLoaded", initContentProjection);
