// Keep Obsidian's tab-indented prose as nested blocks instead of inline spaces.
// Work on parsed blocks so fenced code, lists, quotes and HTML keep their syntax.
module.exports = function markdownLayout(md) {
  function blockUnits(tokens, depth = 0) {
    const units = [];
    for (let i = 0; i < tokens.length; i++) {
      const start = i;
      if (tokens[i].nesting === 1) {
        let nesting = 1;
        while (nesting && ++i < tokens.length) nesting += tokens[i].nesting;
      }
      units.push({ tokens: tokens.slice(start, i + 1), depth });
    }
    return units;
  }

  function indentation(line) {
    const prefix = line.match(/^[\t ]*/)[0];
    // Space-indented code remains standard Markdown. Tabs denote note outlines.
    if (!prefix.includes("\t")) return { depth: 0, text: line };
    let columns = 0;
    for (const char of prefix) columns += char === "\t" ? 4 - columns % 4 : 1;
    return { depth: Math.floor(columns / 4), text: line.slice(prefix.length) };
  }

  md.core.ruler.after("block", "note_layout", function (state) {
    if (state.inlineMode) return;
    const lines = state.src.split("\n");
    const units = [];

    for (const unit of blockUnits(state.tokens)) {
      const first = unit.tokens[0];
      if (!first.map || !["paragraph_open", "code_block"].includes(first.type)) {
        units.push(unit);
        continue;
      }
      const [start, end] = first.map;
      const source = lines.slice(start, end);
      const raw = source.join("\n");
      const multilineCode = [...raw.matchAll(/(`+)([\s\S]*?)\1/g)]
        .some((match) => match[2].includes("\n"));
      // A newline within a code span or display formula is part of that syntax.
      if (!source.some((line) => /^[ ]*\t/.test(line)) || multilineCode || /^\s*\$\$/m.test(raw)) {
        units.push(unit);
        continue;
      }

      let run = null;
      const flush = () => {
        if (!run) return;
        const tokens = [];
        md.block.parse(run.lines.join("\n") + "\n", md, state.env, tokens);
        for (const token of tokens) {
          if (token.map) token.map = token.map.map((line) => line + run.start);
        }
        units.push(...blockUnits(tokens, run.depth));
        run = null;
      };

      source.forEach((line, offset) => {
        if (!line.trim()) {
          flush();
          return;
        }
        const { depth, text } = indentation(line);
        if (run && run.depth !== depth) flush();
        if (!run) run = { depth, start: start + offset, lines: [] };
        run.lines.push(text);
      });
      flush();
    }

    const result = [];
    let depth = 0;
    let seenBlock = false;
    const closeIndent = () => {
      const close = new state.Token("note_indent_close", "div", -1);
      close.block = true;
      result.push(close);
      depth--;
    };

    for (const unit of units) {
      while (depth > unit.depth) closeIndent();
      while (depth < unit.depth) {
        const open = new state.Token("note_indent_open", "div", 1);
        open.block = true;
        open.attrSet("class", "md-indent");
        result.push(open);
        depth++;
      }

      const first = unit.tokens[0];
      if (first.type === "paragraph_open") first.attrJoin("class", "md-paragraph");
      if (first.map) {
        let blankLines = 0;
        for (let i = first.map[0] - 1; i >= 0 && !lines[i].trim(); i--) blankLines++;
        if (seenBlock && blankLines) {
          first.attrJoin("class", "md-source-gap");
          first.attrJoin("style", `--md-blank-lines: ${blankLines};`);
        }
        seenBlock = true;
      }
      result.push(...unit.tokens);
    }
    while (depth) closeIndent();

    // Other Markdown plugins use token levels to distinguish nested content.
    let level = 0;
    for (const token of result) {
      if (token.nesting === -1) level--;
      token.level = level;
      if (token.nesting === 1) level++;
    }
    state.tokens = result;
  });
};
