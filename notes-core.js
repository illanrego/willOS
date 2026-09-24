(function attachNotesCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NotesCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createNotesCore() {
  "use strict";

  const URL_PATTERN = /https?:\/\/[^\s<>"')]+/i;
  const BULLET_PATTERN = /^\s*[-*•]\s+(.*)$/;
  const HEADING_PATTERN = /^\s*(#{1,6})\s+(.*)$/;

  // Notes bodies are written as the Habitica habit notes were: "- " bullets,
  // "# " headings and bare URLs on their own line. Keep that reading.
  function extractFirstUrl(text) {
    const match = URL_PATTERN.exec(String(text || ""));
    return match ? match[0] : "";
  }

  function isUrlOnlyLine(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return false;
    const url = extractFirstUrl(trimmed);
    if (!url) return false;
    return trimmed.replace(url, "").trim() === "";
  }

  function splitLabelAndUrl(text, url) {
    if (!url) return { label: String(text || "").trim(), url: "" };
    const label = String(text || "")
      .replace(url, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { label, url };
  }

  function parseNoteBody(body) {
    const blocks = [];
    const lines = String(body || "")
      .replace(/\r\n?/g, "\n")
      .split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      const heading = HEADING_PATTERN.exec(line);
      if (heading) {
        blocks.push({ type: "heading", text: heading[2].trim(), url: "" });
        continue;
      }

      const bullet = BULLET_PATTERN.exec(line);
      if (bullet) {
        const content = bullet[1].trim();
        if (!content) continue;
        const url = extractFirstUrl(content);
        const { label } = splitLabelAndUrl(content, url);
        blocks.push({ type: "bullet", text: label, url });
        continue;
      }

      if (isUrlOnlyLine(line)) {
        const url = extractFirstUrl(line);
        blocks.push({ type: "link", text: url, url });
        continue;
      }

      const url = extractFirstUrl(line);
      const { label } = splitLabelAndUrl(line, url);
      blocks.push({ type: "text", text: url ? label : line.trim(), url });
    }

    return blocks;
  }

  function noteBodyLineCount(body) {
    return String(body || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .filter((line) => line.trim()).length;
  }

  // The slug is the stable key and never changes; only this title is editable.
  // Mirrors the notes_sections_title_not_blank constraint so a blank title is
  // rejected in the UI instead of by the database.
  function normalizeNoteTitle(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  return {
    extractFirstUrl,
    isUrlOnlyLine,
    parseNoteBody,
    noteBodyLineCount,
    normalizeNoteTitle,
  };
});
