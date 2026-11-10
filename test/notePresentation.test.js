const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getNoteTimestamps, normalizeTimestamp } = require("../src/helpers/noteTimestamps");
const { getFileTree } = require("../src/helpers/filetreeUtils");
const computed = require("../src/site/notes/notes.11tydata").eleventyComputed;

test("Obsidian date links, aliases and nested date lists are normalized", () => {
  assert.deepEqual(getNoteTimestamps({
    created: ["[[2026-11-09]]", "2026-11-10"],
    updated: ["2026-09-19", "[[Daily/2026-11-10.md|Tuesday]]", ["2026-11-09"]],
  }), { created: "2026-11-09", updated: "2026-11-10" });
  assert.equal(normalizeTimestamp("[[2026-11-09#Notes]]"), "2026-11-09");
  assert.equal(normalizeTimestamp([["2026-11-09"]]), "2026-11-09");
});

test("ISO dates and timezone timestamps retain their calendar values", () => {
  for (const date of ["2026-11-09", "2026-11-09T23:30:00+08:00", "2026-11-09T10:30:00Z"]) {
    assert.equal(normalizeTimestamp(date), date);
  }
  assert.equal(normalizeTimestamp("2026-11-09 10:30:00"), "2026-11-09T10:30:00");
  assert.equal(normalizeTimestamp(new Date("2026-11-09T00:00:00Z")), "2026-11-09T00:00:00.000Z");
});

test("invalid or absent dates never become checkout dates or Invalid Date text", () => {
  for (const value of [undefined, null, "", "not a date", "2026-02-30", "2026-13-01", "[[Not a date]]", new Date(NaN)]) {
    assert.equal(normalizeTimestamp(value), null);
  }
  assert.deepEqual(getNoteTimestamps({}), { created: null, updated: null });
});

test("global TOC disable wins over old published per-note enables", () => {
  const previous = process.env.dgShowToc;
  try {
    process.env.dgShowToc = "false";
    assert.equal(computed.settings({ dgShowToc: true }).dgShowToc, false);
    assert.equal(computed.settings({}).dgShowToc, false);
    process.env.dgShowToc = "true";
    assert.equal(computed.settings({}).dgShowToc, true);
    assert.equal(computed.settings({ dgShowToc: false }).dgShowToc, false);
  } finally {
    if (previous === undefined) delete process.env.dgShowToc;
    else process.env.dgShowToc = previous;
  }
});

test("Storage source and virtual folders are absent from the tree without filtering collections", () => {
  const note = (name, data = {}) => ({
    filePathStem: `/notes/${name}`, inputPath: `./src/site/notes/${name}.md`,
    url: `/${name}/`, data,
  });
  const notes = [
    note("Storage/ExternalFile/Article"),
    note("storage/Archive"),
    note("Storage/Home", { tags: ["gardenEntry"] }),
    note("Storage/Moved out", { "dg-path": "Visible/Article" }),
    note("Other/Moved in", { "dg-path": "Storage/Nested/Article" }),
    note("StorageBox/Visible"),
    note("Other/Visible"),
  ];
  const tree = getFileTree({ collections: { note: notes } });
  assert.deepEqual(Object.keys(tree), ["Other", "StorageBox"]);
  assert.deepEqual(Object.keys(tree.Other), ["isFolder", "Visible.md"]);
  assert.equal(notes.length, 7);
});
