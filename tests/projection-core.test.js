const test = require("node:test");
const assert = require("node:assert");
const Core = require("../projection-core.js");

test("lane style keeps contentflow's lane codes and marks freela as non-strategy", () => {
  assert.deepEqual(Object.keys(Core.LANE_STYLE), ["standup", "comics", "moc", "teacher", "freela"]);
  assert.equal(Core.LANE_STYLE.freela.strategy, false);
  assert.equal(Core.LANE_STYLE.moc.strategy, true);
  assert.equal(Core.laneLabel("standup"), "Stand Up");
  assert.equal(Core.laneColor("nope"), "#8b8b8b");
  assert.equal(Core.laneStyle("nope"), null);
});

test("date keys round-trip and reject junk", () => {
  assert.equal(Core.dateKey(2026, 8, 3), "2026-09-03");
  assert.deepEqual(Core.parseDateKey("2026-09-03"), { year: 2026, month: 8, day: 3 });
  assert.equal(Core.parseDateKey("2026-9-3"), null);
  assert.equal(Core.parseDateKey(""), null);
});

test("monthGrid is Monday-first and always a whole number of weeks", () => {
  const grid = Core.monthGrid(2026, 8); // September 2026 starts on a Tuesday
  assert.equal(grid.rowCount, Math.ceil((grid.startPad + 30) / 7));
  assert.equal(grid.totalCells % 7, 0);
  assert.equal(grid.cells[0].dateKey, "2026-08-31");
  assert.equal(grid.cells[0].inMonth, false);
  assert.equal(grid.cells[grid.startPad].dateKey, "2026-09-01");
  assert.equal(grid.cells[grid.startPad].inMonth, true);

  const feb = Core.monthGrid(2026, 1); // 2026 is not a leap year
  assert.equal(feb.daysInMonth, 28);
  assert.equal(feb.cells.filter((cell) => cell.inMonth).length, 28);
});

test("shiftMonth carries the year in both directions", () => {
  assert.deepEqual(Core.shiftMonth(2026, 11, 1), { year: 2027, month: 0 });
  assert.deepEqual(Core.shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(Core.shiftMonth(2026, 8, 0), { year: 2026, month: 8 });
  assert.equal(Core.monthLabel(2026, 8), "September 2026");
});

test("normalizeProjection keeps real day counts and drops malformed input", () => {
  const projection = Core.normalizeProjection({
    generated_at: "2026-09-24T07:00:00-03:00",
    source: "contentflow board.json",
    lanes: ["standup", "comics"],
    days: {
      "2026-09-14": { standup: 2, comics: 0 },
      "2026-9-14": { standup: 1 },
      "2026-09-15": { standup: -1 },
      "2026-09-16": "nope",
    },
    cards: [{ id: 1, lane: "standup", state: "rendered" }, "junk"],
  });

  assert.deepEqual(projection.days, { "2026-09-14": { standup: 2 } });
  assert.equal(projection.cards.length, 1);
  assert.equal(projection.lanes.length, 2);
  assert.equal(projection.generatedAt, "2026-09-24T07:00:00-03:00");
});

test("normalizeProjection survives a missing or broken payload", () => {
  [null, undefined, "nope", 42, []].forEach((raw) => {
    const projection = Core.normalizeProjection(raw);
    assert.deepEqual(projection.days, {});
    assert.deepEqual(projection.cards, []);
    assert.deepEqual(projection.lanes, []);
  });
});

test("lanesOn lists the posted lanes in the fixed legend order", () => {
  const days = { "2026-09-14": { teacher: 1, standup: 3, mystery: 1 } };
  assert.deepEqual(Core.lanesOn(days, "2026-09-14"), ["standup", "teacher", "mystery"]);
  assert.deepEqual(Core.lanesOn(days, "2026-09-20"), []);
  assert.deepEqual(Core.lanesOn(null, "2026-09-20"), []);
});

test("laneSummary counts the visible month and tracks the last posted day", () => {
  const days = {
    "2026-08-31": { standup: 1 },
    "2026-09-14": { standup: 1, moc: 2 },
    "2026-09-20": { standup: 1 },
  };
  const summary = Core.laneSummary(days, 2026, 8);
  assert.equal(summary.standup.count, 2);
  assert.equal(summary.standup.lastDateKey, "2026-09-20");
  assert.equal(summary.moc.count, 1);
  assert.equal(summary.comics.count, 0);
  assert.equal(summary.comics.lastDateKey, "");
});

test("monthPostedDays counts days, not posts", () => {
  const days = {
    "2026-09-14": { standup: 2, moc: 1 },
    "2026-09-15": { comics: 1 },
    "2026-08-31": { standup: 1 },
  };
  assert.equal(Core.monthPostedDays(days, 2026, 8), 2);
  assert.equal(Core.monthPostedDays(days, 2026, 7), 1);
});

test("inFlight keeps cards that are not closed", () => {
  const cards = [
    { id: 1, state: "rendered" },
    { id: 2, state: "done" },
    { id: 3, state: "skipped" },
    { id: 4, state: "posted" },
  ];
  assert.deepEqual(Core.inFlight(cards).map((card) => card.id), [1, 4]);
  assert.deepEqual(Core.inFlight(null), []);
});

test("the projection core exposes no write helper", () => {
  const exported = Object.keys(Core);
  assert.ok(!exported.includes("togglePost"), "the read-only viewer must not own a write path");
  assert.ok(!exported.includes("setPosted"));
});
