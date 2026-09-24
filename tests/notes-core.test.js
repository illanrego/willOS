const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const NotesCore = require("../notes-core.js");

const root = path.join(__dirname, "..");

test("A URL-only line becomes a link block", () => {
  const blocks = NotesCore.parseNoteBody(
    "https://github.com/frontendbr/vagas/issues\nhttps://remotar.com.br/",
  );
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0], {
    type: "link",
    text: "https://github.com/frontendbr/vagas/issues",
    url: "https://github.com/frontendbr/vagas/issues",
  });
  assert.equal(blocks[1].url, "https://remotar.com.br/");
});

test("A bullet keeps its label and lifts the trailing URL out", () => {
  const blocks = NotesCore.parseNoteBody("- spellbooks and staffs  https://imgur.com/a/7xjiNhe");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "bullet");
  assert.equal(blocks[0].text, "spellbooks and staffs");
  assert.equal(blocks[0].url, "https://imgur.com/a/7xjiNhe");
});

test("Bullets without URLs keep their whole text", () => {
  const blocks = NotesCore.parseNoteBody("- historia do stand up\n- voz e persona");
  assert.deepEqual(
    blocks.map((block) => block.text),
    ["historia do stand up", "voz e persona"],
  );
  assert.equal(blocks[0].url, "");
  assert.equal(blocks[0].type, "bullet");
});

test("Markdown headings survive as heading blocks", () => {
  const blocks = NotesCore.parseNoteBody('# 27k\n\n- White (Beginner, "blank slate") ✅');
  assert.equal(blocks[0].type, "heading");
  assert.equal(blocks[0].text, "27k");
  assert.equal(blocks[1].type, "bullet");
  assert.equal(blocks[1].text, 'White (Beginner, "blank slate") ✅');
});

test("Blank lines are dropped and prose stays prose", () => {
  const blocks = NotesCore.parseNoteBody("\n\na plain line\n\n");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[0].text, "a plain line");
});

test("Plain text that mentions a URL inline keeps its label", () => {
  const blocks = NotesCore.parseNoteBody("see the board at https://githubvagasbrasil.vercel.app/ today");
  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[0].text, "see the board at today");
  assert.equal(blocks[0].url, "https://githubvagasbrasil.vercel.app/");
});

test("Empty body parses to nothing", () => {
  assert.deepEqual(NotesCore.parseNoteBody(""), []);
  assert.deepEqual(NotesCore.parseNoteBody(null), []);
  assert.equal(NotesCore.noteBodyLineCount("\n \n"), 0);
});

test("A section title is trimmed, and blank is rejected", () => {
  assert.equal(NotesCore.normalizeNoteTitle("  Vagas  "), "Vagas");
  assert.equal(NotesCore.normalizeNoteTitle("Curso do Comic"), "Curso do Comic");
  assert.equal(NotesCore.normalizeNoteTitle(""), "");
  assert.equal(NotesCore.normalizeNoteTitle("   "), "");
  assert.equal(NotesCore.normalizeNoteTitle(null), "");
  assert.equal(NotesCore.normalizeNoteTitle(undefined), "");
});

test("The Notes window is wired into the shell, not a standalone page", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const projection = fs.readFileSync(path.join(root, "notes-projection.js"), "utf8");

  assert.match(html, /notes-core\.js[^>]*defer/);
  assert.ok(html.indexOf("notes-core.js") < html.indexOf("notes-projection.js"));
  assert.ok(html.indexOf("notes-projection.js") < html.indexOf("willos.js"));
  assert.match(html, /id="notesContainer"/);
  assert.match(html, /hideQuadro\('notesContainer'\)/);

  for (const hook of ["initNotesProjection", "loadNotesModel", "renderNotes", "buildNoteBlock"]) {
    assert.ok(projection.includes(hook), `notes-projection.js is missing ${hook}`);
  }
});

test("The notes editor is gone: no editing path survives in the shell", () => {
  const raw = fs.readFileSync(path.join(root, "willos.js"), "utf8");
  // Comments name the retired bits, so only the code is scanned.
  const app = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

  assert.doesNotMatch(app, /loadNotesBackendState/, "the Supabase notes loader is retired");
  assert.doesNotMatch(app, /saveNoteSection/, "the in-page notes writer is retired");
  assert.doesNotMatch(app, /note-section-title-input/, "the editable title input is retired");
  assert.doesNotMatch(app, /notes_sections/, "willos.js must not touch notes_sections anymore");
  assert.doesNotMatch(app, /notesContainer: \{ key:/, "Notes must not be in the backend sync list");
});

test("Habitica is gone from the app source", () => {
  for (const file of ["index.html", "willos.js", "willos.css"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /habitica/i, `${file} still references Habitica`);
  }
});
