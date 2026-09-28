// Rec List window: a READ-ONLY projection of the will recs store.
//
// The list is written in the terminal (`will rec add "deliverance (1972)"`); the
// CLI writes ~/.local/share/will/recs.json and exports data/recs.json, and this
// window draws it. No input, no add button, no delete button, no database
// client, no storage writes - tests/shell-ui.test.js pins that contract.

const recsProjectionState = {
  model: null,
  status: "Ready.",
  renderRaf: 0,
};

const RECS_PROJECTION_URL = "data/recs.json";

function setRecsStatus(message) {
  const el = document.getElementById("recStatus");
  if (el) el.textContent = message;
}

function emptyRecsModel() {
  return { generatedAt: "", source: "", count: 0, items: [] };
}

function normalizeRecsModel(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    generatedAt: typeof source.generated_at === "string" ? source.generated_at : "",
    source: typeof source.source === "string" ? source.source : "",
    count: items.length,
    items: items
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: Number(item.id) || 0,
        text: String(item.text || ""),
        at: String(item.at || ""),
      })),
  };
}

async function loadRecsModel() {
  try {
    const response = await fetch(RECS_PROJECTION_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    recsProjectionState.model = normalizeRecsModel(payload);
    const total = recsProjectionState.model.count;
    const stamp = recsProjectionState.model.generatedAt
      ? ` exported ${recsProjectionState.model.generatedAt}`
      : "";
    recsProjectionState.status =
      `${total} ${total === 1 ? "rec" : "recs"}${stamp}. ` +
      'Read-only: add one with `will rec add "..."`.';
  } catch (error) {
    recsProjectionState.model = emptyRecsModel();
    recsProjectionState.status = `No render model yet (${error.message}). Run: will export`;
  }
  return recsProjectionState.model;
}

function buildRecEntry(item) {
  const li = document.createElement("li");
  li.className = "rec-item";
  li.dataset.recId = String(item.id);

  // The old window printed `>  <text>`; keep the look, drop the delete button.
  li.appendChild(document.createTextNode(`>  ${item.text}`));

  const id = document.createElement("span");
  id.className = "rec-id";
  id.textContent = `${item.id}`;
  li.appendChild(id);

  return li;
}

function renderRecs() {
  const host = document.getElementById("recList");
  if (!host) return;
  host.innerHTML = "";

  const model = recsProjectionState.model;
  if (!model) {
    setRecsStatus(recsProjectionState.status);
    return;
  }

  if (model.items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "rec-empty";
    empty.textContent = 'Nothing on the list. In the terminal: will rec add "deliverance (1972)"';
    host.appendChild(empty);
    setRecsStatus(recsProjectionState.status);
    return;
  }

  model.items.forEach((item) => host.appendChild(buildRecEntry(item)));
  setRecsStatus(recsProjectionState.status);
}

function scheduleRecsRender() {
  if (recsProjectionState.renderRaf) return;
  recsProjectionState.renderRaf = requestAnimationFrame(function () {
    recsProjectionState.renderRaf = 0;
    renderRecs();
  });
}

async function initRecsProjection() {
  recsProjectionState.model = emptyRecsModel();
  renderRecs();
  await loadRecsModel();
  scheduleRecsRender();
}

document.addEventListener("DOMContentLoaded", initRecsProjection);
