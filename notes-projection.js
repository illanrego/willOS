// Notes window: a READ-ONLY projection of the will notes store.
//
// Capture happens in the terminal (`will note "..."`), the CLI writes
// ~/.local/share/will/notes.json and exports data/notes.json; this draws it.
// No editor, no textareas, no Supabase, no writes.
// tests/shell-ui.test.js pins that contract.

const notesProjectionState = {
  model: null,
  status: "Ready.",
  renderRaf: 0,
};

const NOTES_PROJECTION_URL = "data/notes.json";

function notesProjectionCore() {
  return typeof NotesCore === "object" && NotesCore ? NotesCore : null;
}

function setNotesStatus(message) {
  const el = document.getElementById("notesStatus");
  if (el) el.textContent = message;
}

function emptyNotesModel() {
  return { generatedAt: "", source: "", sections: [] };
}

function normalizeNotesModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const sections = Array.isArray(source.sections) ? source.sections : [];
  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    source: typeof source.source === "string" ? source.source : "",
    sections: sections
      .filter((section) => section && typeof section === "object")
      .map((section) => ({
        slug: String(section.slug || ""),
        title: String(section.title || ""),
        lines: (Array.isArray(section.lines) ? section.lines : [])
          .filter((line) => line && typeof line === "object")
          .map((line) => ({
            id: Number(line.id) || 0,
            text: String(line.text || ""),
            at: String(line.at || ""),
          })),
      })),
  };
}

async function loadNotesModel() {
  try {
    const response = await fetch(NOTES_PROJECTION_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    notesProjectionState.model = normalizeNotesModel(payload);
    const total = notesProjectionState.model.sections.reduce(
      (sum, section) => sum + section.lines.length,
      0,
    );
    const stamp = notesProjectionState.model.generatedAt
      ? ` exported ${notesProjectionState.model.generatedAt}`
      : "";
    notesProjectionState.status =
      `${total} notes in ${notesProjectionState.model.sections.length} sections${stamp}. ` +
      "Read-only: capture with `will note`.";
  } catch (error) {
    notesProjectionState.model = emptyNotesModel();
    notesProjectionState.status = `No render model yet (${error.message}). Run: will export`;
  }
  return notesProjectionState.model;
}

function buildNoteBlock(line) {
  const core = notesProjectionCore();
  const blocks = core ? core.parseNoteBody(line.text) : [];
  const block = blocks[0] || { type: "text", text: line.text, url: "" };

  const el = document.createElement("div");
  el.className = `note-block note-block--${block.type}`;
  if (block.id) el.dataset.noteId = String(block.id);
  el.textContent = block.text;

  if (block.url) {
    const link = document.createElement("a");
    link.href = block.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = block.type === "link" ? "open" : block.url;
    if (block.type === "link") {
      el.textContent = "";
      el.appendChild(link);
    } else {
      el.appendChild(document.createTextNode(" "));
      el.appendChild(link);
    }
  }
  return el;
}

function buildNoteSection(section) {
  const wrapper = document.createElement("div");
  wrapper.className = "note-section";
  wrapper.dataset.section = section.slug;

  const header = document.createElement("div");
  header.className = "note-section-header";

  const title = document.createElement("span");
  title.className = "note-section-title";
  title.textContent = section.title;

  const count = document.createElement("span");
  count.className = "note-section-empty";
  count.textContent = `${section.lines.length}`;

  header.append(title, count);
  wrapper.appendChild(header);

  const body = document.createElement("div");
  body.className = "note-section-body";
  if (section.lines.length === 0) {
    const empty = document.createElement("p");
    empty.className = "note-section-empty";
    empty.textContent = "empty";
    body.appendChild(empty);
  } else {
    section.lines.forEach((line) => body.appendChild(buildNoteBlock(line)));
  }
  wrapper.appendChild(body);
  return wrapper;
}

function renderNotes() {
  const host = document.getElementById("notesSections");
  if (!host) return;
  host.innerHTML = "";

  const model = notesProjectionState.model;
  if (!model) {
    setNotesStatus(notesProjectionState.status);
    return;
  }

  const total = model.sections.reduce((sum, section) => sum + section.lines.length, 0);
  if (total === 0) {
    const empty = document.createElement("p");
    empty.className = "note-section-empty";
    empty.textContent = 'Nothing captured yet. In the terminal: will note "something to remember"';
    host.appendChild(empty);
    setNotesStatus(notesProjectionState.status);
    return;
  }

  model.sections.forEach((section) => host.appendChild(buildNoteSection(section)));
  setNotesStatus(notesProjectionState.status);
}

function scheduleNotesRender() {
  if (notesProjectionState.renderRaf) return;
  notesProjectionState.renderRaf = requestAnimationFrame(function () {
    notesProjectionState.renderRaf = 0;
    renderNotes();
  });
}

async function initNotesProjection() {
  notesProjectionState.model = emptyNotesModel();
  renderNotes();
  await loadNotesModel();
  scheduleNotesRender();
}

document.addEventListener("DOMContentLoaded", initNotesProjection);
