(function attachProjectionCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ProjectionCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProjectionCore() {
  "use strict";

  // Presentation metadata only. Lane CODES come from contentflow - the engine
  // owns them, this file owns how they look. Never invent a lane here.
  const LANE_STYLE = {
    standup: { label: "Stand Up", color: "#ef5350", strategy: true },
    comics: { label: "Comics", color: "#7e57c2", strategy: true },
    moc: { label: "MoC / Personal", color: "#ff8a00", strategy: true },
    teacher: { label: "Teacher", color: "#00c853", strategy: true },
    freela: { label: "Freela", color: "#00bcd4", strategy: false },
  };

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function dateKey(year, month, day) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
  }

  function parseDateKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function monthLabel(year, month) {
    return `${MONTH_NAMES[((month % 12) + 12) % 12]} ${year}`;
  }

  /** Month arithmetic that carries the year, for the prev/next buttons. */
  function shiftMonth(year, month, delta) {
    const total = year * 12 + month + delta;
    return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
  }

  /**
   * Monday-first month grid. `cells` is always a whole number of weeks so the
   * grid never ends on a ragged row.
   */
  function monthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const startPad = (firstDay.getDay() + 6) % 7;
    const total = daysInMonth(year, month);
    const totalCells = Math.ceil((startPad + total) / 7) * 7;

    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month, 1 - startPad + i);
      cells.push({
        day: date.getDate(),
        inMonth: i >= startPad && i < startPad + total,
        dateKey: dateKey(date.getFullYear(), date.getMonth(), date.getDate()),
      });
    }

    return {
      year,
      month,
      startPad,
      daysInMonth: total,
      totalCells,
      rowCount: totalCells / 7,
      cells,
    };
  }

  function laneStyle(code) {
    return LANE_STYLE[String(code || "")] || null;
  }

  function laneLabel(code) {
    const style = laneStyle(code);
    return style ? style.label : String(code || "");
  }

  function laneColor(code) {
    const style = laneStyle(code);
    return style ? style.color : "#8b8b8b";
  }

  /**
   * The projection file is a render model produced by the exporter (the CLI
   * side): the viewer never derives state, it only draws. Anything malformed
   * is dropped rather than guessed at.
   */
  function normalizeProjection(raw) {
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const rawDays = source.days && typeof source.days === "object" ? source.days : {};
    const days = {};

    Object.keys(rawDays).forEach((key) => {
      if (!parseDateKey(key)) return;
      const lanes = rawDays[key];
      if (!lanes || typeof lanes !== "object") return;
      const kept = {};
      Object.keys(lanes).forEach((lane) => {
        const count = Number(lanes[lane]);
        if (!Number.isFinite(count) || count <= 0) return;
        kept[lane] = count;
      });
      if (Object.keys(kept).length > 0) days[key] = kept;
    });

    const lanes = Array.isArray(source.lanes)
      ? source.lanes.map((lane) => String(lane || "")).filter(Boolean)
      : [];
    const cards = Array.isArray(source.cards)
      ? source.cards.filter((card) => card && typeof card === "object")
      : [];

    return {
      generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
      source: typeof source.source === "string" ? source.source : "",
      lanes,
      days,
      cards,
    };
  }

  /** Lane codes posted on a day, ordered by LANE_STYLE so the dots are stable. */
  function lanesOn(days, key) {
    const day = (days && days[key]) || {};
    return Object.keys(LANE_STYLE)
      .filter((lane) => Number(day[lane]) > 0)
      .concat(
        Object.keys(day).filter((lane) => !LANE_STYLE[lane] && Number(day[lane]) > 0),
      );
  }

  /** Per-lane totals for the visible month plus the last posted day overall. */
  function laneSummary(days, year, month) {
    const summary = {};
    Object.keys(LANE_STYLE).forEach((lane) => {
      summary[lane] = { count: 0, lastDateKey: "" };
    });

    const monthPrefix = `${year}-${pad2(month + 1)}`;
    Object.keys(days || {})
      .sort()
      .forEach((key) => {
        Object.keys(days[key]).forEach((lane) => {
          if (!summary[lane]) summary[lane] = { count: 0, lastDateKey: "" };
          if (key.startsWith(monthPrefix)) summary[lane].count += 1;
          summary[lane].lastDateKey = key;
        });
      });

    return summary;
  }

  function monthPostedDays(days, year, month) {
    const monthPrefix = `${year}-${pad2(month + 1)}`;
    return Object.keys(days || {}).filter((key) => key.startsWith(monthPrefix)).length;
  }

  /** Cards still inside a lane workflow (not closed, not skipped). */
  function inFlight(cards) {
    return (Array.isArray(cards) ? cards : []).filter((card) => {
      const state = String((card && card.state) || "");
      return state !== "done" && state !== "skipped";
    });
  }

  return {
    LANE_STYLE,
    MONTH_NAMES,
    dateKey,
    parseDateKey,
    daysInMonth,
    monthLabel,
    shiftMonth,
    monthGrid,
    laneStyle,
    laneLabel,
    laneColor,
    normalizeProjection,
    lanesOn,
    laneSummary,
    monthPostedDays,
    inFlight,
  };
});
