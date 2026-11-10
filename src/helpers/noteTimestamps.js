// Normalize published Obsidian properties without using checkout filesystem dates.
function normalizeTimestamp(value, select = "latest") {
  if (Array.isArray(value)) {
    const dates = value.flat(Infinity)
      .map((item) => normalizeTimestamp(item, select)).filter(Boolean);
    dates.sort((a, b) => Date.parse(a) - Date.parse(b));
    return dates.length ? dates[select === "earliest" ? 0 : dates.length - 1] : null;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== "string") return null;

  let date = value.trim();
  if (date.startsWith("[[") && date.endsWith("]]")) {
    date = date.slice(2, -2).split("|")[0].replace(/\\$/, "").split("#")[0];
    date = date.replace(/\\/g, "/").split("/").pop().replace(/\.md$/i, "").trim();
  }
  // Accept ISO dates/timestamps and the SQL-style timestamps supported previously.
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i);
  if (!match) return null;
  const calendar = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (Number.isNaN(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== date.slice(0, 10)) return null;
  date = date.replace(" ", "T");
  return Number.isNaN(Date.parse(date)) ? null : date;
}

function getNoteTimestamps(data) {
  return {
    created: normalizeTimestamp(data.created, "earliest"),
    updated: normalizeTimestamp(data.updated, "latest"),
  };
}

module.exports = { normalizeTimestamp, getNoteTimestamps };
