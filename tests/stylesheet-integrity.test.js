// The stylesheet is hand-edited and machine-edited, and a mangled rule fails
// SILENTLY. A window whose `#id { flex-direction: column }` rule is swallowed
// still opens (hideQuadro sets display:flex) - it just opens with the default
// ROW direction, so its title bar is pinned to the LEFT instead of sitting on
// top like every other window. That is exactly what happened when a
// grouped-selector cleanup replaced a whole rule (selector AND body) with the
// surviving selectors: the closing brace of the rule before it vanished and
// `#skillsContainer` got absorbed into the `.titleBar` selector list.
//
// Brace balancing does NOT catch that. These do.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "willos.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "willos.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, " ");

/**
 * Every rule as {selector, body}, recursing into @media/@supports blocks.
 *
 * The matching close brace must be found by DEPTH, not by "the next }": a rule
 * sitting right after an @media block otherwise reads as if it were inside it,
 * and its frame rule looks missing when it is right there.
 */
function collect(text, out) {
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    const selector = text.slice(i, open).trim();
    let depth = 0;
    let close = -1;
    for (let idx = open; idx < text.length; idx++) {
      if (text[idx] === "{") depth += 1;
      else if (text[idx] === "}") {
        depth -= 1;
        if (depth === 0) {
          close = idx;
          break;
        }
      }
    }
    if (close < 0) break;
    const body = text.slice(open + 1, close);
    if (selector.startsWith("@")) collect(body, out);
    else out.push({ selector, body });
    i = close + 1;
  }
  return out;
}

function rules() {
  return collect(stripComments(css), []);
}

const ALL_RULES = rules();

/** Comma-separated selector entries of every rule. */
function entries() {
  return ALL_RULES.flatMap((rule) =>
    rule.selector
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

test("no selector swallowed another rule's text", () => {
  // Merging looks like `#kanbanContainer .titleBar #skillsContainer`: an id
  // AFTER a class inside one comma-separated entry, which no sane selector does.
  // A descendant selector (`#gamifySkillsColumn #row .skillBox`) is fine.
  entries().forEach((entry) => {
    const idAfterClass = /[.\w-]\s+#[\w-]+/.test(entry) && /\.[\w-]+.*#[\w-]+/.test(entry);
    assert.ok(!idAfterClass, `two rules were merged into one selector entry: ${entry}`);
  });
});

test("a window that opens as a flex column still has its frame rule", () => {
  const flex = /const flexQuadros = \[([^\]]*)\]/.exec(engine);
  assert.ok(flex, "hideQuadro has no flexQuadros list");
  const ids = [...flex[1].matchAll(/"([\w]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);

  const checked = ids.filter((id) => entries().includes(`#${id}`));
  assert.ok(checked.includes("skillsContainer"), "skillsContainer should have a frame rule");

  checked.forEach((id) => {
    const own = ALL_RULES.filter((rule) =>
      rule.selector.split(",").map((s) => s.trim()).includes(`#${id}`),
    );
    assert.ok(
      own.some((rule) => /flex-direction:\s*column/.test(rule.body) && /overflow:\s*hidden/.test(rule.body)),
      `#${id} opens as flex, so it needs flex-direction: column - without it the title bar pins left`,
    );
  });
});

test("the cleanup did not take neighbouring rules with it", () => {
  ["#todoContainer .titleBar", "#kanbanContainer .titleBar", "#todoPanel", "#kanbanBoard",
   ".todo-task-title-row", ".todo-task-main", "#timer-container"].forEach((selector) => {
    assert.ok(entries().includes(selector), `the stylesheet lost ${selector}`);
  });
});

test("the retired Routine rules are gone", () => {
  assert.ok(!/#dailies/i.test(css), "willos.css still styles the retired Routine window");
  assert.ok(!/\.routine-/i.test(css), "willos.css still styles routine rows");
});

test("the stylesheet is loaded cache-busted", () => {
  assert.match(html, /willos\.css\?v=\d{8}-/);
});
