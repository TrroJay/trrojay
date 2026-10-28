const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { parse } = require("node-html-parser");
const { resolveNotePermalinks } = require("../src/helpers/notePermalinks");

const note = (filePath, permalink, extra = {}) => ({ filePath, data: { permalink, ...extra } });

test("Chinese titles with empty publisher slugs receive distinct readable URLs", () => {
  const urls = resolveNotePermalinks([
    note("文章/第一篇.md", "/articles//"), note("文章/第二篇.md", "/articles//"),
  ]);
  assert.equal(urls.get("文章/第一篇.md"), "/文章/第一篇/");
  assert.equal(urls.get("文章/第二篇.md"), "/文章/第二篇/");
});

test("duplicate nonempty slugs from mixed Chinese and English titles are repaired", () => {
  const urls = resolveNotePermalinks([
    note("文章/中文 AI.md", "/articles/ai/"), note("文章/另一篇 AI.md", "/articles/ai/"),
  ]);
  assert.notEqual(urls.get("文章/中文 AI.md"), urls.get("文章/另一篇 AI.md"));
});

test("valid unique custom URLs, homepage and non-output notes keep their settings", () => {
  const urls = resolveNotePermalinks([
    note("文章/中文.md", "/custom/chinese/"),
    note("首页.md", "/ignored/", { tags: ["gardenEntry"] }),
    note("草稿.md", false),
  ]);
  assert.equal(urls.get("文章/中文.md"), "/custom/chinese/");
  assert.equal(urls.get("首页.md"), "/");
  assert.equal(urls.get("草稿.md"), false);
});

test("missing permalinks remain distinct across Chinese folders", () => {
  const urls = resolveNotePermalinks([note("甲/笔记.md"), note("乙/笔记.md")]);
  assert.equal(urls.get("甲/笔记.md"), "/甲/笔记/");
  assert.equal(urls.get("乙/笔记.md"), "/乙/笔记/");
});

test("punctuation-only differences cannot collide after URL normalization", () => {
  const notes = [note("目录/标题！.md", "/x//"), note("目录/标题？.md", "/x//")];
  const urls = resolveNotePermalinks(notes);
  assert.equal(new Set(urls.values()).size, 2);
  assert.deepEqual([...urls].sort(), [...resolveNotePermalinks([...notes].reverse())].sort());
});

test("fallbacks never overwrite a reserved custom URL", () => {
  const urls = resolveNotePermalinks([
    note("目录/中文.md", "/x//"), note("other.md", "/目录/中文/"),
  ]);
  assert.equal(urls.get("other.md"), "/目录/中文/");
  assert.notEqual(urls.get("目录/中文.md"), "/目录/中文/");
});

test("equivalent directory and index.html URLs are treated as output conflicts", () => {
  const urls = resolveNotePermalinks([note("第一篇.md", "/same/"), note("第二篇.md", "/same/index.html")]);
  assert.equal(urls.get("第一篇.md"), "/第一篇/");
  assert.equal(urls.get("第二篇.md"), "/第二篇/");
});

test("Windows separators and Markdown/canvas names produce stable unique URLs", () => {
  const windows = resolveNotePermalinks([
    note("目录\\同名.md", "/broken//"), note("目录\\同名.canvas", "/broken//"),
  ]);
  const linux = resolveNotePermalinks([
    note("目录/同名.md", "/broken//"), note("目录/同名.canvas", "/broken//"),
  ]);
  assert.deepEqual([...windows], [...linux]);
  assert.equal(new Set(windows.values()).size, 2);
});

test("real Eleventy build keeps Chinese pages, navigation, wiki links and search consistent", () => {
  const repository = path.resolve(__dirname, "..");
  const tempParent = path.resolve(os.tmpdir());
  const fixture = fs.mkdtempSync(path.join(tempParent, "garden-permalinks-"));
  const write = (name, content) => {
    const destination = path.join(fixture, "src/site", name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  };
  const requireSource = (file) => `module.exports = require(${JSON.stringify(path.join(repository, file))});`;
  const notes = [
    note("中文目录/第一篇.md", "/articles//", { title: "第一篇" }),
    note("中文目录/第二篇.md", "/articles//", { title: "第二篇" }),
    note("中文目录/中文 AI.md", "/articles/ai/", { title: "中文 AI" }),
    note("中文目录/另一篇 AI.md", "/articles/ai/", { title: "另一篇 AI" }),
    note("中文目录/自定义.md", "/custom-stable/", { title: "自定义" }),
    note("Reference.md", "/reference/", { title: "Reference" }),
  ];

  try {
    write("notes/notes.json", fs.readFileSync(path.join(repository, "src/site/notes/notes.json"), "utf8"));
    write("notes/notes.11tydata.js", requireSource("src/site/notes/notes.11tydata.js"));
    write("_data/eleventyComputed.js", requireSource("src/site/_data/eleventyComputed.js"));
    write("_includes/layouts/note.njk", "<main>{{ content | link | safe }}</main>");
    write("filetree.njk", "---\npermalink: /filetree.json\neleventyExcludeFromCollections: true\n---\n{{ filetree | jsonify | safe }}");
    for (const file of ["search-index.njk", "graph.njk"]) {
      write(file, fs.readFileSync(path.join(repository, "src/site", file), "utf8"));
    }
    for (const entry of notes) {
      write(`notes/${entry.filePath}`, `---\n${JSON.stringify(entry.data)}\n---\n${entry.filePath === "Reference.md" ? "[[中文目录/第一篇|第一篇]]\n[[中文目录/第二篇|第二篇]]" : entry.data.title}\n`);
    }
    try {
      execFileSync(process.execPath, [
        path.join(repository, "node_modules/@11ty/eleventy/cmd.cjs"),
        `--config=${path.join(repository, ".eleventy.js")}`, "--quiet",
      ], { cwd: fixture, encoding: "utf8", timeout: 60000, env: { ...process.env, ELEVENTY_ENV: "prod" }, stdio: "pipe" });
    } catch (error) {
      assert.fail(`${error.stdout || ""}\n${error.stderr || error.message}`);
    }

    const read = (file) => fs.readFileSync(path.join(fixture, "dist", file), "utf8");
    const urls = resolveNotePermalinks(notes);
    const search = JSON.parse(read("searchIndex.json"));
    const graph = JSON.parse(read("graph.json"));
    const tree = JSON.parse(read("filetree.json"));
    const treeUrls = [];
    const visit = (node) => {
      if (node.isNote) treeUrls.push(node.permalink);
      else for (const child of Object.values(node)) if (child && typeof child === "object") visit(child);
    };
    visit(tree);
    for (const entry of notes) {
      const url = urls.get(entry.filePath);
      assert.ok(fs.existsSync(path.join(fixture, "dist", url.slice(1), "index.html")), url);
      assert.equal(search.find((item) => item.title === entry.data.title)?.url, url);
      assert.ok(treeUrls.includes(url), `file tree: ${url}`);
      assert.ok(graph.nodes[url], `graph: ${url}`);
    }
    const links = parse(read("reference/index.html")).querySelectorAll("a.internal-link");
    assert.deepEqual(links.map((link) => link.getAttribute("href")), [urls.get("中文目录/第一篇.md"), urls.get("中文目录/第二篇.md")]);
  } finally {
    // Delete only this test's freshly created directory, directly under temp.
    assert.equal(path.dirname(path.resolve(fixture)), tempParent);
    assert.ok(path.basename(fixture).startsWith("garden-permalinks-"));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
