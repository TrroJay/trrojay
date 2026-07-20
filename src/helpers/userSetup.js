function userMarkdownSetup(md) {
  // The md parameter stands for the markdown-it instance used throughout the site generator.
  // Feel free to add any plugin you want here instead of /.eleventy.js
  const tabSpan = '<span class="md-tab" aria-hidden="true"></span>';

  md.core.ruler.before("normalize", "preserve_tabs", function (state) {
    let inFence = false;

    state.src = state.src
      .split("\n")
      .map((line) => {
        if (/^ {0,3}(```|~~~)/.test(line)) {
          inFence = !inFence;
          return line;
        }

        if (inFence || !line.includes("\t")) {
          return line;
        }

        if (/^\t+([-+*]|\d+[.)])\s/.test(line)) {
          return line;
        }

        return line.replace(/\t/g, tabSpan);
      })
      .join("\n");
  });

  const defaultText =
    md.renderer.rules.text ||
    ((tokens, idx) => md.utils.escapeHtml(tokens[idx].content));

  md.renderer.rules.text = function (tokens, idx, options, env, self) {
    return defaultText(tokens, idx, options, env, self).replace(/\t/g, tabSpan);
  };
}
function userEleventySetup(eleventyConfig) {
  // The eleventyConfig parameter stands for the the config instantiated in /.eleventy.js.
  // Feel free to add any plugin you want here instead of /.eleventy.js
}
exports.userMarkdownSetup = userMarkdownSetup;
exports.userEleventySetup = userEleventySetup;
