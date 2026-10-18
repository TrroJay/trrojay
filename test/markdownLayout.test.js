const { test } = require("node:test");
const assert = require("node:assert/strict");
const MarkdownIt = require("markdown-it");
const { parse: parseHtml } = require("node-html-parser");
const { userMarkdownSetup } = require("../src/helpers/userSetup");
const parse = (html) => parseHtml(html);

const md = new MarkdownIt({ html: true, breaks: true })
  .use(require("markdown-it-footnote"))
  .use(require("markdown-it-task-checkbox"))
  .use(userMarkdownSetup);

test("parent, child, grandchild and outdent produce real nested blocks", () => {
  const html = parse(md.render("Parent\n\tChild\n\t\tGrandchild\n\tSibling\nNext parent"));
  assert.deepEqual(html.childNodes.filter((n) => n.tagName).map((n) => n.tagName), ["P", "DIV", "P"]);
  assert.equal(html.querySelector(".md-indent > p").text, "Child");
  assert.equal(html.querySelector(".md-indent > .md-indent > p").text, "Grandchild");
  assert.equal(html.querySelectorAll(".md-indent").length, 2);
  assert.equal(html.querySelector(".md-indent").querySelectorAll(":scope > p").at(-1).text, "Sibling");
});

test("source blank lines retain their count at the same indentation", () => {
  const html = parse(md.render("First\n\nSecond\n\n\nThird\n\tChild\n\n\tNext child"));
  const gaps = html.querySelectorAll(".md-source-gap");
  assert.deepEqual(gaps.map((p) => p.getAttribute("style")), [
    "--md-blank-lines: 1;", "--md-blank-lines: 2;", "--md-blank-lines: 1;",
  ]);
  assert.equal(html.querySelectorAll(".md-indent").length, 1);
  assert.equal(html.querySelector(".md-indent").querySelectorAll("p").length, 2);
});

test("consecutive child lines preserve line breaks inside the indented block", () => {
  const html = parse(md.render("Parent\n\t[Child link](https://example.com)\n\tChild continuation"));
  const child = html.querySelector(".md-indent p");
  assert.equal(child.querySelector("a").getAttribute("href"), "https://example.com");
  assert.ok(child.querySelector("br"));
});

test("fenced code retains tabs, blank lines and nested fence text verbatim", () => {
  const source = "````js\n\tconst x = 1;\n\n```\n\tconst y = 2;\n````\n";
  const html = parse(md.render(source));
  assert.equal(html.querySelector("pre").innerHTML, '<code class="language-js">\tconst x = 1;\n\n```\n\tconst y = 2;\n</code>');
  assert.equal(html.querySelectorAll(".md-indent").length, 0);
});

test("space-indented Markdown code remains a code block", () => {
  const html = parse(md.render("    const x = 1;\n    const y = 2;\n"));
  assert.equal(html.querySelector("pre").innerHTML, "<code>const x = 1;\nconst y = 2;\n</code>");
  assert.equal(html.querySelectorAll(".md-indent").length, 0);
});

test("nested lists, task checkboxes and list continuations retain semantics", () => {
  const html = parse(md.render("- [ ] Parent\n\t- Child\n\t\tcontinued\n\n\tSecond paragraph\n- Sibling"));
  assert.equal(html.querySelectorAll("ul ul li").length, 1);
  assert.ok(html.querySelector("input[type=checkbox]"));
  assert.equal(html.querySelectorAll(".md-indent").length, 0);
});

test("quotes, raw HTML and inline code are not rewritten as outline text", () => {
  const html = parse(md.render("> Quote\n>\tcontinuation\n\n<div>\n\tRaw content\n</div>\n\n`a\tb`"));
  assert.ok(html.querySelector("blockquote"));
  assert.ok(html.querySelector("div").text.includes("\tRaw content"));
  assert.equal(html.querySelector("code").text, "a\tb");
  assert.equal(html.querySelectorAll(".md-indent").length, 0);
});

test("headings and footnotes still work beside outlined paragraphs", () => {
  const html = parse(md.render("# Heading\n\nParent[^1]\n\tChild **bold**\n\n[^1]: Footnote text"));
  assert.equal(html.querySelector("h1").text, "Heading");
  assert.equal(html.querySelector(".md-indent strong").text, "bold");
  assert.ok(html.querySelector(".footnote-ref"));
  assert.ok(html.querySelector(".footnotes"));
});

test("CRLF input and skipped indentation levels are handled consistently", () => {
  const html = parse(md.render("Parent\r\n\t\tGrandchild\r\n\r\nNext"));
  assert.equal(html.querySelectorAll(".md-indent").length, 2);
  assert.equal(html.querySelector(".md-indent .md-indent p").text, "Grandchild");
  assert.ok(html.querySelector("p.md-source-gap"));
});

test("multiline inline code is not split at an internal tab", () => {
  const html = parse(md.render("Parent `a\n\tb`\nEnd"));
  assert.equal(html.querySelector("code").text, "a \tb");
  assert.equal(html.querySelectorAll(".md-indent").length, 0);
});

test("display math containing indented source lines retains its formula", () => {
  const mathMd = new MarkdownIt({ html: true, breaks: true })
    .use(require("markdown-it-mathjax3"))
    .use(userMarkdownSetup);
  const html = mathMd.render("$$\n\tx + y\n$$");
  assert.ok(html.includes("mjx-container"));
  assert.ok(!html.includes("md-indent"));
});
