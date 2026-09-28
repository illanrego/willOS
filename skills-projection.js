// Gamify window: a READ-ONLY projection of the will skills store.
//
//   data/skills.json  <- will skills store   (will skill coding +1, will skill list)
//
// The drawing is the shell's old Gamify window: skill cards with icon, level,
// total and meter, and the streak calendar with week rail, done dots, badges
// (training letter / standup count) and dashed lines between consecutive done
// days. Only the write path is gone: no day toggles, no skill switching, nothing
// that stores state. The terminal owns the numbers, this draws them, and it
// publishes the model on window.willOsModels so the chat assistant can read it.

const SKILLS_PROJECTION_URL = "data/skills.json";

// The six skills the shell knows how to draw. Anything else in the store
// (counters such as weed/remedy) still gets a card, with the generic icon.
const GAMIFY_SKILLS = {
  coding: { label: "Coding", color: "#00c853", icon: "w98_keyboard.ico" },
  content: { label: "Content", color: "#ff8a00", icon: "w98_camera3_vid.ico" },
  fitness: { label: "Physique", color: "#00bcd4", icon: "w98_battery.ico" },
  standup: { label: "Stand Up", color: "#ef5350", icon: "w98_microphone_2.ico" },
  meditation: { label: "Meditation", color: "#7e57c2", icon: "w98_clock.ico" },
  jobhunting: { label: "Job Hunting", color: "#ffc107", icon: "w98_certificate.ico" },
};

const SKILL_ORDER = ["coding", "fitness", "content", "standup", "meditation", "jobhunting"];
const SKILL_ICON_DIR = "./imagens/98icons/";
const GENERIC_SKILL_ICON = "w98_joystick.ico";

const FITNESS_TRAINING_CYCLE = ["A", "B", "C", "D", "E", "F"];
const FITNESS_UNKNOWN_TRAINING = "__WORKOUT__";
const SKILL_LEVEL_THRESHOLDS = [3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047];

const SKILL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const skillsProjectionState = {
  model: null,
  status: "Ready.",
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selected: "",
  renderRaf: 0,
};

function setGamifyStatus(message) {
  const el = document.getElementById("gamifyStatus");
  if (el) el.textContent = message;
}

function emptySkillsModel() {
  return { generatedAt: "", skills: [], days: {} };
}

function normalizeSkillsModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const skills = (Array.isArray(source.skills) ? source.skills : [])
    .filter((skill) => skill && typeof skill === "object")
    .map((skill) => ({
      code: String(skill.code || ""),
      label: String(skill.label || skill.code || ""),
      total: Number(skill.total) || 0,
      today: Number(skill.today) || 0,
      streak: Number(skill.streak) || 0,
      monthTotal: Number(skill.month_total) || 0,
      // the weekly floor: x = occurrences this week, y = the minimum (0 = none)
      week: Number(skill.week) || 0,
      weeklyMinimum: Number(skill.weekly_minimum) || 0,
    }))
    .filter((skill) => skill.code);

  const rawDays = source.days && typeof source.days === "object" ? source.days : {};
  const days = {};
  Object.keys(rawDays).forEach((day) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    const values = rawDays[day];
    if (!values || typeof values !== "object") return;
    const kept = {};
    Object.keys(values).forEach((code) => {
      const value = Number(values[code]);
      if (Number.isFinite(value) && value > 0) kept[code] = value;
    });
    if (Object.keys(kept).length > 0) days[day] = kept;
  });

  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    skills,
    days,
  };
}

async function loadSkillsModel() {
  try {
    const response = await fetch(SKILLS_PROJECTION_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    skillsProjectionState.model = normalizeSkillsModel(payload);
    // Shared with the chat assistant (see buildStartpageChatContext in willos.js).
    window.willOsModels = window.willOsModels || {};
    window.willOsModels.skills = skillsProjectionState.model;

    const active = skillsProjectionState.model.skills.filter((skill) => skill.today > 0).length;
    const stamp = skillsProjectionState.model.generatedAt
      ? ` exported ${skillsProjectionState.model.generatedAt}`
      : "";
    skillsProjectionState.status =
      `${skillsProjectionState.model.skills.length} skills, ${active} touched today${stamp}. ` +
      "Read-only: will skill <code> +1";
  } catch (error) {
    skillsProjectionState.model = emptySkillsModel();
    skillsProjectionState.status = `No render model yet (${error.message}). Run: will export`;
  }
  return skillsProjectionState.model;
}

// ---------------------------------------------------------------- skill meta

function baseSkillCode(code) {
  const value = String(code || "");
  return value.startsWith("skill-") ? value.slice(6) : value;
}

function skillMeta(code) {
  const base = baseSkillCode(code);
  return GAMIFY_SKILLS[base] || { label: base, color: "#607d8b", icon: GENERIC_SKILL_ICON };
}

function skillLabel(skill) {
  return GAMIFY_SKILLS[baseSkillCode(skill.code)]?.label || skill.label || skill.code;
}

/** Most-used skill first, the way the old row sorted itself. */
function orderedSkills() {
  const model = skillsProjectionState.model;
  if (!model) return [];
  const rank = (code) => {
    const index = SKILL_ORDER.indexOf(baseSkillCode(code));
    return index < 0 ? SKILL_ORDER.length : index;
  };
  return model.skills
    .slice()
    .sort((a, b) => b.total - a.total || rank(a.code) - rank(b.code) || a.code.localeCompare(b.code));
}

// ------------------------------------------------------------------- day math

function fitnessTrainingFromValue(value) {
  if (typeof value === "string") {
    const v = value.trim().toUpperCase();
    if (FITNESS_TRAINING_CYCLE.includes(v)) return v;
    if (v === FITNESS_UNKNOWN_TRAINING) return FITNESS_UNKNOWN_TRAINING;
  }
  const numeric = Number(value) || 0;
  if (numeric === 7) return FITNESS_UNKNOWN_TRAINING;
  if (numeric >= 1 && numeric <= FITNESS_TRAINING_CYCLE.length) {
    return FITNESS_TRAINING_CYCLE[numeric - 1];
  }
  return "";
}

function isGamifyDayDone(code, value) {
  if (baseSkillCode(code) === "fitness") return fitnessTrainingFromValue(value) !== "";
  return (Number(value) || 0) > 0;
}

function getGamifyDayBadge(code, value) {
  const base = baseSkillCode(code);
  if (base === "fitness") {
    const training = fitnessTrainingFromValue(value);
    return training === FITNESS_UNKNOWN_TRAINING ? "" : training;
  }
  if (base === "standup") {
    const count = Number(value) || 0;
    return count > 0 ? String(count) : "";
  }
  return "";
}

/** day-of-month -> value for one skill in one month, read from the render model. */
function skillsMonthValues(code, year, month) {
  const out = {};
  const model = skillsProjectionState.model;
  if (!model) return out;
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  Object.keys(model.days).forEach((key) => {
    if (!key.startsWith(prefix)) return;
    const value = model.days[key][code];
    if (value == null) return;
    out[Number(key.slice(8, 10))] = value;
  });
  return out;
}

function skillThresholdLevel(count) {
  const n = Number(count) || 0;
  for (let level = 0; level < SKILL_LEVEL_THRESHOLDS.length; level++) {
    if (n <= SKILL_LEVEL_THRESHOLDS[level]) return level + 2;
  }
  return 10;
}

function skillThresholdMax(count) {
  const n = Number(count) || 0;
  for (let level = 0; level < SKILL_LEVEL_THRESHOLDS.length; level++) {
    if (n <= SKILL_LEVEL_THRESHOLDS[level]) return SKILL_LEVEL_THRESHOLDS[level];
  }
  return 2047;
}

function getWeekNumber(date) {
  const startOfYear = new Date(date.getUTCFullYear(), 0, 1);
  const daysDifference = Math.floor((date - startOfYear) / 86400000);
  return Math.floor((daysDifference + startOfYear.getUTCDay() + 1) / 7) + 1;
}

// ----------------------------------------------------------------- the cards

function meterBounds(base, total) {
  const max = skillThresholdMax(total);
  if (base === "coding") return { max, low: 15, high: 23, optimum: 30 };
  return { max, low: 2, high: 6 };
}

/** today's counter, the way the old card showed it (training letter / count / 0). */
function todayDisplay(code) {
  const base = baseSkillCode(code);
  const today = new Date();
  const values = skillsMonthValues(code, today.getFullYear(), today.getMonth());
  const value = values[today.getDate()];
  if (base === "fitness") return getGamifyDayBadge(code, value) || "0";
  return String(Number(value) || 0);
}

/**
 * The x/y label: this week's occurrences over the weekly floor.
 *
 * A skill with no floor shows the plain count instead, so something that runs at
 * its own pace (comics, freela) is never read as a shortfall.
 */
function weekQuota(skill) {
  const span = document.createElement("span");
  span.id = `weekCount${baseSkillCode(skill.code)}`;
  span.className = "gamify-week-quota";
  if (!skill.weeklyMinimum) {
    span.textContent = String(skill.week);
    return span;
  }
  span.textContent = `${skill.week}/${skill.weeklyMinimum}`;
  span.classList.toggle("gamify-week-quota--met", skill.week >= skill.weeklyMinimum);
  return span;
}

function buildSkillCard(skill) {
  const base = baseSkillCode(skill.code);
  const meta = skillMeta(skill.code);
  const bounds = meterBounds(base, skill.total);

  const card = document.createElement("div");
  card.className = "skillBox gamify-skill-card";
  card.dataset.skill = skill.code;
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  if (skill.code === skillsProjectionState.selected) {
    card.classList.add("gamify-skill-card--active");
    card.setAttribute("aria-pressed", "true");
  } else {
    card.setAttribute("aria-pressed", "false");
  }

  const details = document.createElement("div");
  details.className = "skillDetails";

  const info = document.createElement("div");
  info.className = "skillInfo";
  const label = document.createElement("label");
  label.setAttribute("for", base);
  label.textContent = skillLabel(skill);
  const icon = document.createElement("img");
  icon.src = `${SKILL_ICON_DIR}${meta.icon}`;
  icon.width = 50;
  icon.height = 55;
  icon.alt = "";
  info.append(label, icon);

  const right = document.createElement("span");
  right.className = "infoRight";
  const line = document.createElement("p");
  const lvl = document.createElement("span");
  lvl.id = `lvl_${base}`;
  lvl.textContent = String(skillThresholdLevel(skill.total));
  const total = document.createElement("span");
  total.id = `${base}TotalCount`;
  total.textContent = String(skill.total);
  const today = document.createElement("span");
  today.id = `dailyCount${base}`;
  today.textContent = todayDisplay(skill.code);
  line.append("lvl:", lvl, ` total:`, total, ` week:`, weekQuota(skill), " today:", today);
  right.appendChild(line);

  const meter = document.createElement("meter");
  meter.id = `${base}Meter`;
  meter.min = 0;
  meter.max = bounds.max;
  meter.low = bounds.low;
  meter.high = bounds.high;
  if (bounds.optimum != null) meter.optimum = bounds.optimum;
  meter.value = Math.min(skill.total, bounds.max);

  details.append(info, right, meter);
  card.appendChild(details);
  return card;
}

/** Card click only changes which skill the calendar draws - no data is touched. */
function selectSkill(code) {
  if (!code || code === skillsProjectionState.selected) return;
  skillsProjectionState.selected = code;
  document
    .querySelectorAll("#gamifySkillBoxesRow .gamify-skill-card[data-skill]")
    .forEach((card) => {
      const on = card.dataset.skill === code;
      card.classList.toggle("gamify-skill-card--active", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });
  renderSkillsCalendar();
}

function renderSkillCards() {
  const host = document.getElementById("gamifySkillBoxesRow");
  if (!host) return;
  host.innerHTML = "";

  const skills = orderedSkills();
  if (skills.length === 0) {
    const empty = document.createElement("p");
    empty.className = "projection-empty";
    empty.textContent = 'No skills. In the terminal: will skill add coding "Coding"';
    host.appendChild(empty);
    return;
  }
  if (!skillsProjectionState.selected) skillsProjectionState.selected = skills[0].code;
  skills.forEach((skill) => {
    const card = buildSkillCard(skill);
    card.addEventListener("click", () => selectSkill(skill.code));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectSkill(skill.code);
    });
    host.appendChild(card);
  });
}

// ------------------------------------------------------------- month header

function renderSkillsMonthNav() {
  const nav = document.getElementById("gamifyMonthNav");
  if (!nav) return;
  nav.innerHTML = "";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "←";
  prev.setAttribute("aria-label", "Previous month");
  prev.addEventListener("click", () => stepSkillsMonth(-1));

  const label = document.createElement("span");
  label.id = "gamifyMonthDisplay";
  label.textContent = `${SKILL_MONTH_NAMES[skillsProjectionState.month]} ${skillsProjectionState.year}`;

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "→";
  next.setAttribute("aria-label", "Next month");
  next.addEventListener("click", () => stepSkillsMonth(1));

  nav.append(prev, label, next);
}

function stepSkillsMonth(delta) {
  const total = skillsProjectionState.year * 12 + skillsProjectionState.month + delta;
  skillsProjectionState.year = Math.floor(total / 12);
  skillsProjectionState.month = ((total % 12) + 12) % 12;
  scheduleSkillsProjectionRender();
}

// ---------------------------------------------------------- streak calendar

function renderSkillsCalendar() {
  const grid = document.getElementById("gamifyStreakGrid");
  const svg = document.getElementById("gamifyStreakSvg");
  const wrap = document.getElementById("gamifyStreakWrap");
  if (!grid || !svg || !wrap) return;

  const skill = skillsProjectionState.selected;
  const color = skillMeta(skill).color;
  const year = skillsProjectionState.year;
  const month = skillsProjectionState.month;

  const boardState = skillsMonthValues(skill, year, month);
  const monthCache = new Map([[`${year}-${month}`, boardState]]);
  const monthState = (y, m) => {
    const key = `${y}-${m}`;
    if (!monthCache.has(key)) monthCache.set(key, skillsMonthValues(skill, y, m));
    return monthCache.get(key);
  };

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  /** Monday = first column (JS Sunday=0 → Mon-first pad) */
  const startPad = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const rowCount = totalCells / 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isViewingCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  let weekRail = document.getElementById("gamifyWeekNumbers");
  if (!weekRail) {
    weekRail = document.createElement("div");
    weekRail.id = "gamifyWeekNumbers";
    weekRail.className = "gamify-week-number-rail";
    wrap.appendChild(weekRail);
  }
  weekRail.innerHTML = "";
  weekRail.style.gridTemplateRows = `repeat(${rowCount}, 1fr)`;

  grid.innerHTML = "";

  for (let row = 0; row < rowCount; row++) {
    const weekCell = document.createElement("div");
    weekCell.className = "gamify-week-number";
    weekCell.textContent = String(getWeekNumber(new Date(year, month, 1 - startPad + row * 7)));
    weekRail.appendChild(weekCell);
  }

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "gamify-streak-cell";

    if (i < startPad || i >= startPad + daysInMonth) {
      const date = new Date(year, month, 1 - startPad + i);
      cell.classList.add("gamify-streak-outside");

      const outsideState = monthState(date.getFullYear(), date.getMonth());
      if (isGamifyDayDone(skill, outsideState[date.getDate()])) {
        const dotSlot = document.createElement("div");
        dotSlot.className = "gamify-streak-dot-slot";
        const dot = document.createElement("span");
        dot.className = "gamify-streak-dot gamify-streak-done gamify-streak-dot--outside";
        dot.style.backgroundColor = color;
        dotSlot.appendChild(dot);
        cell.appendChild(dotSlot);
      }

      const outsideNum = document.createElement("span");
      outsideNum.className = "gamify-streak-day-num gamify-streak-day-num--muted";
      outsideNum.textContent = String(date.getDate());
      cell.appendChild(outsideNum);
    } else {
      const day = i - startPad + 1;
      const dayValue = boardState[day];
      const done = isGamifyDayDone(skill, dayValue);
      const badge = getGamifyDayBadge(skill, dayValue);

      cell.classList.add("gamify-streak-cell--in-month");
      cell.style.setProperty("--gamify-skill-color", color);

      const num = document.createElement("span");
      num.className = "gamify-streak-day-num";
      num.textContent = String(day);
      cell.appendChild(num);

      const dotSlot = document.createElement("div");
      dotSlot.className = "gamify-streak-dot-slot";
      if (!done) {
        const empty = document.createElement("span");
        empty.className = "gamify-streak-dot gamify-streak-dot--empty";
        dotSlot.appendChild(empty);
      } else {
        cell.classList.add("gamify-streak-has-done");
        const dot = document.createElement("span");
        dot.className = "gamify-streak-dot gamify-streak-done";
        dot.style.backgroundColor = color;
        if (badge) {
          const badgeLabel = document.createElement("span");
          badgeLabel.className = "gamify-streak-dot-label";
          badgeLabel.textContent = badge;
          dot.appendChild(badgeLabel);
        }
        dotSlot.appendChild(dot);
      }
      cell.appendChild(dotSlot);

      if (isViewingCurrentMonth && day === today.getDate()) {
        cell.classList.add("gamify-streak-today");
      }
    }
    grid.appendChild(cell);
  }

  requestAnimationFrame(() => {
    drawSkillsStreakLines(svg, wrap, grid, { skill, startPad, daysInMonth, boardState, color });
  });
}

function drawSkillsStreakLines(svg, wrap, grid, opts) {
  const { skill, startPad, daysInMonth, boardState, color } = opts;
  svg.innerHTML = "";
  const cells = grid.querySelectorAll(".gamify-streak-cell");
  const rect = wrap.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  svg.setAttribute("width", String(rect.width));
  svg.setAttribute("height", String(rect.height));

  function centerForDay(day) {
    const el = cells[startPad + day - 1];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const dot = el.querySelector(".gamify-streak-dot");
    if (dot) {
      const dr = dot.getBoundingClientRect();
      return { x: dr.left - rect.left + dr.width / 2, y: dr.top - rect.top + dr.height / 2 };
    }
    return { x: r.left - rect.left + r.width / 2, y: r.bottom - rect.top - 9 };
  }

  const done = (d) => isGamifyDayDone(skill, boardState[d]);

  for (let d = 1; d < daysInMonth; d++) {
    const currentCellIndex = startPad + d - 1;
    const nextCellIndex = currentCellIndex + 1;
    if (Math.floor(currentCellIndex / 7) !== Math.floor(nextCellIndex / 7)) continue;
    if (!done(d) || !done(d + 1)) continue;

    const a = centerForDay(d);
    const b = centerForDay(d + 1);
    if (!a || !b) continue;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(a.x));
    line.setAttribute("y1", String(a.y));
    line.setAttribute("x2", String(b.x));
    line.setAttribute("y2", String(b.y));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-dasharray", "6 5");
    line.setAttribute("opacity", "0.88");
    svg.appendChild(line);
  }
}

// ------------------------------------------------------------------ plumbing

function renderSkillsProjection() {
  renderSkillCards();
  renderSkillsMonthNav();
  renderSkillsCalendar();
  setGamifyStatus(skillsProjectionState.status);
}

function scheduleSkillsProjectionRender() {
  if (skillsProjectionState.renderRaf) return;
  skillsProjectionState.renderRaf = requestAnimationFrame(function () {
    skillsProjectionState.renderRaf = 0;
    renderSkillsProjection();
  });
}

async function initSkillsProjection() {
  skillsProjectionState.model = emptySkillsModel();
  renderSkillsProjection();
  await loadSkillsModel();
  scheduleSkillsProjectionRender();
}

document.addEventListener("DOMContentLoaded", initSkillsProjection);
