// willOS shell + projections.
//
// ARCHITECTURE (see AGENTS.md): the web face is READ-ONLY. It draws a render
// model produced by the `will` CLI; it never writes. No supabase writes, no
// localStorage.setItem, no POST, no input controls. tests/shell-ui.test.js
// pins that contract - if a change here needs to store something, the change
// belongs in the CLI instead.

var willosState = {
  projection: null,
  status: "Booting.",
  year: 0,
  month: 0,
  renderRaf: 0,
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

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

  var selection = document.getSelection();
  if (selection) selection.empty();

  dragObj.style.left = (e.clientX - dragOffsetX) + "px";
  dragObj.style.top = (e.clientY - dragOffsetY) + "px";
};

// WINDOWS

function hideQuadro(idQuadro) {
  const quadro = document.getElementById(idQuadro);
  if (!quadro) return;
  const opening = window.getComputedStyle(quadro).display === "none";
  const flexQuadros = ["contentContainer"];
  quadro.style.display = opening
    ? (flexQuadros.includes(idQuadro) ? "flex" : "block")
    : "none";
  if (opening && idQuadro === "contentContainer") {
    scheduleContentBoardRender();
  }
}

// APP MENU (START BUTTON)

function hideAppMenu() {
  const appMenu = document.getElementById("appMenu");
  if (!appMenu) return;
  appMenu.style.display = appMenu.style.display === "none" ? "block" : "none";
  appMenu.style.position = "absolute";
  appMenu.style.bottom = "22px";
  appMenu.style.left = "-12px";
}

function clickStart() {
  const startBtn = document.getElementById("startBtn");
  if (!startBtn) return;
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

// CONTENT PROJECTION (read-only)

function projectionUrl() {
  return "data/projection.json";
}

function scheduleContentBoardRender() {
  if (willosState.renderRaf) return;
  willosState.renderRaf = requestAnimationFrame(function () {
    willosState.renderRaf = 0;
    renderContentBoard();
  });
}

async function loadProjection() {
  try {
    const response = await fetch(projectionUrl(), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    willosState.projection = ProjectionCore.normalizeProjection(payload);
    willosState.status = statusFromProjection(willosState.projection);
  } catch (error) {
    willosState.projection = ProjectionCore.normalizeProjection(null);
    willosState.status = `no projection yet (${error.message}). Run the exporter to write ${projectionUrl()}.`;
  }
  return willosState.projection;
}

function statusFromProjection(projection) {
  const flight = ProjectionCore.inFlight(projection.cards).length;
  const stamp = projection.generatedAt ? ` generated ${projection.generatedAt}` : "";
  const origin = projection.source ? ` from ${projection.source}` : "";
  return `${projection.cards.length} cards, ${flight} in flight${origin}${stamp}. Read-only: the CLI owns every state change.`;
}

function renderLaneLegend() {
  const legend = document.getElementById("contentLaneLegend");
  const projection = willosState.projection;
  if (!legend || !projection) return;

  const summary = ProjectionCore.laneSummary(projection.days, willosState.year, willosState.month);
  const lanes = Object.keys(ProjectionCore.LANE_STYLE).filter((lane) => {
    return projection.lanes.length === 0 || projection.lanes.includes(lane);
  });

  legend.innerHTML = "";
  lanes.forEach((lane) => {
    const entry = summary[lane] || { count: 0, lastDateKey: "" };
    const chip = document.createElement("span");
    chip.className = "content-lane-chip";
    chip.dataset.lane = lane;
    chip.title = entry.lastDateKey
      ? `${ProjectionCore.laneLabel(lane)} - last posted ${entry.lastDateKey}`
      : `${ProjectionCore.laneLabel(lane)} - nothing posted yet`;

    const dot = document.createElement("span");
    dot.className = "content-lane-chip-dot";
    dot.style.background = ProjectionCore.laneColor(lane);

    const label = document.createElement("span");
    label.textContent = ProjectionCore.laneLabel(lane);

    const count = document.createElement("span");
    count.className = "content-lane-chip-count";
    count.textContent = String(entry.count);

    chip.append(dot, label, count);
    legend.appendChild(chip);
  });
}

function renderMonthNav() {
  const nav = document.getElementById("contentMonthNav");
  if (!nav) return;
  nav.innerHTML = "";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "<";
  prev.setAttribute("aria-label", "Previous month");
  prev.addEventListener("click", () => stepMonth(-1));

  const label = document.createElement("span");
  label.textContent = ProjectionCore.monthLabel(willosState.year, willosState.month);

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = ">";
  next.setAttribute("aria-label", "Next month");
  next.addEventListener("click", () => stepMonth(1));

  nav.append(prev, label, next);
}

function stepMonth(delta) {
  const next = ProjectionCore.shiftMonth(willosState.year, willosState.month, delta);
  willosState.year = next.year;
  willosState.month = next.month;
  scheduleContentBoardRender();
}

function renderContentBoard() {
  const grid = document.getElementById("contentBoardGrid");
  const status = document.getElementById("contentStatus");
  const projection = willosState.projection;

  renderMonthNav();
  renderLaneLegend();

  if (!grid) return;
  grid.innerHTML = "";

  if (!projection) {
    if (status) status.textContent = willosState.status;
    return;
  }

  const todayKey = ProjectionCore.dateKey(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  const layout = ProjectionCore.monthGrid(willosState.year, willosState.month);
  const lanes = Object.keys(ProjectionCore.LANE_STYLE);

  layout.cells.forEach((cell) => {
    const day = projection.days[cell.dateKey] || {};
    const cellEl = document.createElement("div");
    cellEl.className = "content-day";
    if (!cell.inMonth) cellEl.classList.add("content-day--outside");
    if (cell.dateKey === todayKey) cellEl.classList.add("content-day--today");
    const lanesOnDay = ProjectionCore.lanesOn(projection.days, cell.dateKey);
    if (lanesOnDay.length > 0) cellEl.classList.add("content-day--has-post");
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
        dot.style.background = ProjectionCore.laneColor(lane);
        dot.title = `${ProjectionCore.laneLabel(lane)}: ${count} posted`;
      } else {
        dot.classList.add("content-lane-dot--blank");
      }
      dots.appendChild(dot);
    });
    cellEl.appendChild(dots);
    grid.appendChild(cellEl);
  });

  if (status) {
    const postedDays = ProjectionCore.monthPostedDays(
      projection.days,
      willosState.year,
      willosState.month,
    );
    status.textContent = `${postedDays} posted days in ${ProjectionCore.monthLabel(willosState.year, willosState.month)}. ${willosState.status}`;
  }
}

window.onload = function () {
  const now = new Date();
  willosState.year = now.getFullYear();
  willosState.month = now.getMonth();
  willosState.projection = ProjectionCore.normalizeProjection(null);

  draggable("contentContainer");
  makeResizable("contentContainer", {
    minWidth: 460,
    minHeight: 380,
    onResize: scheduleContentBoardRender,
  });

  renderContentBoard();
  loadProjection().then(scheduleContentBoardRender);
};

document.addEventListener("DOMContentLoaded", hideAppMenu);
