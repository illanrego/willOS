// Static-contract tests for the willOS direction.
//
// willOS is a startpage fork moving to one shape: input happens in the CLI (or in
// an external app that gets imported), and the window only draws. The workout
// window is the reference case - Strong is the input, the page draws sessions.
//
// A window is MIGRATED when its inputs are gone and it draws a render model.
// Adding a window to MIGRATED_WINDOWS is the approval step: these assertions then
// enforce the contract for it (no input controls, no write path, no database).

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "willos.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "willos.js"), "utf8");

const MIGRATED_WINDOWS = [
  {
    id: "contentContainer",
    script: "content-projection.js",
    core: "projection-core.js",
    data: "data/content.json",
  },
  {
    id: "notesContainer",
    script: "notes-projection.js",
    core: "notes-core.js",
    data: "data/notes.json",
  },
  {
    id: "plannerContainer",
    script: "planner-projection.js",
    core: "planner-projection.js",
    data: "data/planner.json",
  },
  {
    id: "dailiesContainer",
    script: "tasks-projection.js",
    core: "tasks-projection.js",
    data: "data/routine.json",
  },
  {
    id: "todoContainer",
    script: "tasks-projection.js",
    core: "tasks-projection.js",
    data: "data/tasks.json",
  },
  {
    id: "kanbanContainer",
    script: "tasks-projection.js",
    core: "tasks-projection.js",
    data: "data/tasks.json",
  },
  {
    id: "skillsContainer",
    script: "skills-projection.js",
    core: "skills-projection.js",
    data: "data/skills.json",
  },
  {
    id: "financeContainer",
    script: "finance-projection.js",
    core: "finance-projection.js",
    data: "data/finance.json",
  },
];

// Comments legitimately name the things the code must not do, so scan code only.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

function readSource(name) {
  return stripComments(fs.readFileSync(path.join(root, name), "utf8"));
}

function windowMarkup(id) {
  const anchor = html.indexOf(`id="${id}"`);
  assert.ok(anchor > -1, `window ${id} not found in index.html`);
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

test("every migrated window carries no input controls", () => {
  MIGRATED_WINDOWS.forEach(({ id }) => {
    const markup = windowMarkup(id);
    ["<input", "<select", "<textarea", "<form"].forEach((tag) => {
      assert.ok(!markup.includes(tag), `#${id} must stay read-only, found ${tag}`);
    });
    const buttons = markup.match(/<button[^>]*>/g) || [];
    assert.deepEqual(
      buttons,
      [`<button onclick="hideQuadro('${id}')">`],
      `#${id} may only carry its close button`,
    );
  });
});

test("the projection code never writes anywhere", () => {
  const forbidden = [
    "localStorage.setItem",
    "sessionStorage.setItem",
    ".insert(",
    ".update(",
    ".upsert(",
    ".delete(",
    'method: "POST"',
    "method: 'POST'",
  ];
  MIGRATED_WINDOWS.forEach(({ script, core }) => {
    [readSource(script), readSource(core)].forEach((source) => {
      forbidden.forEach((snippet) => {
        assert.ok(!source.includes(snippet), `${script}/${core} must not write, found ${snippet}`);
      });
      assert.ok(!source.includes("supabase"), `${script}/${core} must not talk to the database`);
    });
  });
});

test("every migrated window reads its own render model and nothing else", () => {
  MIGRATED_WINDOWS.forEach(({ script, data }) => {
    const source = readSource(script);
    assert.ok(source.includes(data.split("/").pop()), `${script} should fetch ${data}`);
    assert.match(source, /fetch\([^)]*\{ cache: "no-store" \}\)/);
  });
});

test("every migrated window is loaded before the shell runs", () => {
  MIGRATED_WINDOWS.forEach(({ script, core }) => {
    assert.ok(html.includes(core), `${core} is not loaded`);
    assert.ok(html.includes(script), `${script} is not loaded`);
    if (core !== script) {
      assert.ok(html.indexOf(core) < html.indexOf(script), `${core} must load before ${script}`);
    }
    assert.ok(html.includes(`${script}?`), `${script} must be cache-busted in index.html`);
    assert.ok(html.indexOf(script) < html.indexOf("willos.js"), `${script} must load before the shell`);
  });
});

test("every migrated window opens as a flex column", () => {
  MIGRATED_WINDOWS.forEach(({ id }) => {
    // The stylesheet may carry several rules for the id (the older ones are kept
    // for their chrome); at least one must make it a column window.
    const rules = [...css.matchAll(new RegExp(`#${id} \\{([^}]*)\\}`, "g"))].map((match) => match[1]);
    assert.ok(rules.length > 0, `missing #${id} rule`);
    assert.ok(
      rules.some((rule) => /flex-direction:\s*column/.test(rule) && /overflow:\s*hidden/.test(rule)),
      `#${id} needs a flex-column rule with overflow hidden`,
    );
    const flexList = /const flexQuadros = \[([^\]]*)\]/.exec(engine);
    assert.ok(flexList, "hideQuadro has no flexQuadros list");
    assert.ok(flexList[1].includes(`"${id}"`), `${id} must open as a flex column`);
  });
});

test("a migrated window is not in the backend sync list", () => {
  MIGRATED_WINDOWS.forEach(({ id }) => {
    assert.ok(!engine.includes(`${id}: { key:`), `${id} must not sync against Supabase`);
  });
});

test("the shell still calls the projection render hooks", () => {
  assert.match(engine, /onResize: scheduleContentBoardRender/);
  assert.match(engine, /scheduleContentBoardRender\(\);/);
  assert.match(engine, /draggable\("notesContainer"\)/);
});

test("the retired content board cannot come back", () => {
  ["content_posts", "CONTENT_POSTS_STORAGE_KEY", "toggleContentPost", "persistContentPost", "ContentCore"].forEach(
    (snippet) => {
      assert.ok(!engine.includes(snippet), `willos.js still carries the old board: ${snippet}`);
    },
  );
  assert.ok(!fs.existsSync(path.join(root, "content-core.js")), "content-core.js is retired");
  assert.ok(!html.includes("content-core.js"), "index.html must not load the retired content core");
});

test("every migrated window has an exporter behind it", () => {
  const exporters = /EXPORTERS = \(([^)]*)\)/.exec(
    fs.readFileSync(path.join(root, "willcli", "exporter.py"), "utf8"),
  );
  assert.ok(exporters, "willcli/exporter.py has no EXPORTERS list");
  MIGRATED_WINDOWS.forEach(({ data }) => {
    const domain = data.split("/").pop().replace(".json", "");
    assert.ok(exporters[1].includes(`"${domain}"`), `no exporter writes ${data}`);
  });
});

test("code assets are cache-busted and every local asset exists", () => {
  const refs = [...html.matchAll(/(?:src|href)="(?!https?:)([^"]+)"/g)].map((match) => match[1]);
  assert.ok(refs.length > 0);
  refs.forEach((ref) => {
    if (ref.startsWith("#")) return;
    const file = ref.split("?")[0];
    // Code assets must be cache-busted; images only need to exist.
    if (/\.(css|js)$/.test(file)) {
      assert.ok(ref.includes("?v="), `${file} is not cache-busted`);
    }
    assert.ok(fs.existsSync(path.join(root, file)), `${file} does not exist on disk`);
  });
});
