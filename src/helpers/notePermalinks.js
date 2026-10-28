const path = require("node:path");
const { createHash } = require("node:crypto");
const { globSync } = require("glob");
const matter = require("gray-matter");

const notesDirectory = path.resolve("src/site/notes");
let cachedPermalinks;

const portablePath = (filePath) => filePath.replace(/\\/g, "/").replace(/^\.\//, "");
const isHome = (data) => data.tags && data.tags.indexOf("gardenEntry") !== -1;

function outputKey(url) {
  return ("/" + url.replace(/^\/+/, ""))
    .replace(/\/+/g, "/")
    .replace(/\/index\.html$/i, "/")
    .replace(/\/$/, "") || "/";
}

function usablePermalink(url) {
  return typeof url === "string" && url.trim() !== "" &&
    !/\/\/|[\\?#{}]|^[a-z]+:/i.test(url);
}

function fallbackPermalink(filePath) {
  // Keep Chinese and other Unicode letters instead of dropping them to "".
  const stem = portablePath(filePath).replace(/\.(md|canvas)$/i, "");
  const segments = stem.split("/").map((segment) => segment.normalize("NFC")
    .toLowerCase()
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "note");
  return `/${segments.join("/")}/`;
}

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = key(item);
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
  }
  return groups;
}

function resolveNotePermalinks(notes) {
  const result = new Map();
  const used = new Set();
  const declared = [];
  const needsFallback = [];
  const sorted = notes.map((note) => ({ ...note, filePath: portablePath(note.filePath) }))
    .sort((a, b) => a.filePath < b.filePath ? -1 : a.filePath > b.filePath ? 1 : 0);

  for (const note of sorted) {
    const data = note.data || {};
    if (isHome(data)) {
      if (used.has("/")) throw new Error("Only one note can use the gardenEntry homepage tag.");
      result.set(note.filePath, "/");
      used.add("/");
    } else if (data.permalink === false) {
      result.set(note.filePath, false);
    } else if (usablePermalink(data.permalink)) {
      declared.push({ ...note, url: "/" + data.permalink.trim().replace(/^\/+/, "") });
    } else {
      needsFallback.push(note);
    }
  }

  // Preserve existing unique URLs. Duplicate publisher-generated URLs must
  // resolve consistently for the page, wiki links, search, graph and file tree.
  for (const [key, group] of groupBy(declared, (note) => outputKey(note.url))) {
    if (group.length === 1 && !used.has(key)) {
      result.set(group[0].filePath, group[0].url);
      used.add(key);
    } else {
      needsFallback.push(...group);
    }
  }

  const fallbacks = needsFallback.map((note) => ({ ...note, url: fallbackPermalink(note.filePath) }));
  for (const [key, group] of groupBy(fallbacks, (note) => outputKey(note.url))) {
    for (const note of group) {
      let url = note.url;
      if (group.length > 1 || used.has(key)) {
        // Hash the relative source path so the URL is identical on Windows
        // and Vercel, independent of checkout location and traversal order.
        const hash = createHash("sha256").update(note.filePath).digest("hex").slice(0, 12);
        const stem = `${url.slice(0, -1)}-${hash}`;
        url = `${stem}/`;
        let suffix = 2;
        while (used.has(outputKey(url))) url = `${stem}-${suffix++}/`;
      }
      result.set(note.filePath, url);
      used.add(outputKey(url));
    }
  }
  return result;
}

function getNotePermalink(inputPath, data = {}) {
  if (isHome(data)) return "/";
  if (!cachedPermalinks) {
    const notes = globSync("**/*.{md,canvas}", { cwd: notesDirectory, nodir: true })
      .map((filePath) => ({ filePath, data: matter.read(path.join(notesDirectory, filePath)).data }));
    cachedPermalinks = resolveNotePermalinks(notes);
  }
  const filePath = portablePath(path.relative(notesDirectory, path.resolve(inputPath)));
  if (cachedPermalinks.has(filePath)) return cachedPermalinks.get(filePath);
  return resolveNotePermalinks([{ filePath, data }]).get(filePath);
}

function resetNotePermalinks() {
  cachedPermalinks = undefined;
}

module.exports = { getNotePermalink, resetNotePermalinks, resolveNotePermalinks };
