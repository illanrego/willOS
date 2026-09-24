// Gamify window: a READ-ONLY projection of the will skills store.
//
//   data/skills.json  <- will skills store   (will skill coding +1, will skill list)
//
// The window used to keep board state in localStorage and trackers in Supabase,
// with a meter per skill and a clickable streak calendar. All of that is gone:
// the terminal owns the numbers, this draws them, and it publishes the model on
// window.willOsModels so the chat assistant can read it too.

const SKILLS_PROJECTION_URL = "data/skills.json";

const SKILL_ORDER = ["coding", "fitness", "standup", "meditation", "jobhunting", "content"];

const skillsProjectionState = {
  model: null,
  status: "Ready.",
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  renderRaf: 0,
};

const SKILL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
    }));

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

function orderedSkills() {
  const model = skillsProjectionState.model;
  if (!model) return [];
  const byCode = new Map(model.skills.map((skill) => [skill.code, skill]));
  const ordered = SKILL_ORDER.map((code) => byCode.get(code)).filter(Boolean);
  model.skills.forEach((skill) => {
    if (!SKILL_ORDER.includes(skill.code)) ordered.push(skill);
  });
  return ordered;
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

  skills.forEach((skill) => {
    const card = document.createElement("div");
    card.className = "skillBox gamify-skill-card gamify-skill-card--projection";
    card.dataset.skill = skill.code;

    const details = document.createElement("div");
    details.className = "skillDetails";

    const title = document.createElement("h3");
    title.className = "skill-projection-title";
    title.textContent = skill.label;

    const line = document.createElement("p");
    line.className = "skill-projection-line";
    line.textContent = `total ${skill.total} · today ${skill.today} · streak ${skill.streak} · month ${skill.monthTotal}`;

    details.append(title, line);
    card.appendChild(details);
    host.appendChild(card);
  });
}

function renderSkillsMonthNav() {
  const nav = document.getElementById("gamifyMonthNav");
  if (!nav) return;
  nav.innerHTML = "";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "<";
  prev.setAttribute("aria-label", "Previous month");
  prev.addEventListener("click", () => stepSkillsMonth(-1));

  const label = document.createElement("span");
  label.textContent = `${SKILL_MONTH_NAMES[skillsProjectionState.month]} ${skillsProjectionState.year}`;

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = ">";
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

function skillsMonthCells() {
  const year = skillsProjectionState.year;
  const month = skillsProjectionState.month;
  const startPad = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < Math.ceil((startPad + total) / 7) * 7; i++) {
    const date = new Date(year, month, 1 - startPad + i);
    const key =
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, "0")}-` +
      `${String(date.getDate()).padStart(2, "0")}`;
    cells.push({ day: date.getDate(), inMonth: i >= startPad && i < startPad + total, key });
  }
  return cells;
}

function renderSkillsCalendar() {
  const grid = document.getElementById("gamifyStreakGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const model = skillsProjectionState.model;
  if (!model) return;

  const skills = orderedSkills();
  const colors = { coding: "#4c6ef5", fitness: "#f76707", standup: "#e64980", meditation: "#12b886", jobhunting: "#845ef7", content: "#f59f00" };

  skillsMonthCells().forEach((cell) => {
    const day = model.days[cell.key] || {};
    const cellEl = document.createElement("div");
    cellEl.className = "gamify-streak-cell";
    if (!cell.inMonth) cellEl.classList.add("gamify-streak-cell--outside");

    const num = document.createElement("span");
    num.className = "gamify-streak-day";
    num.textContent = String(cell.day);
    cellEl.appendChild(num);

    const dots = document.createElement("div");
    dots.className = "gamify-streak-dots";
    skills.forEach((skill) => {
      const value = Number(day[skill.code]) || 0;
      const dot = document.createElement("span");
      dot.className = "gamify-streak-dot";
      if (value > 0 && cell.inMonth) {
        dot.classList.add("gamify-streak-dot--on");
        dot.style.background = colors[skill.code] || "#666";
        dot.title = `${skill.label}: ${value}`;
      } else {
        dot.classList.add("gamify-streak-dot--blank");
      }
      dots.appendChild(dot);
    });
    cellEl.appendChild(dots);
    grid.appendChild(cellEl);
  });
}

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
