function userMarkdownSetup(md) {
  // The md parameter stands for the markdown-it instance used throughout the site generator.
  // Feel free to add any plugin you want here instead of /.eleventy.js
  const defaultText =
    md.renderer.rules.text ||
    ((tokens, idx) => md.utils.escapeHtml(tokens[idx].content));

  md.renderer.rules.text = function (tokens, idx, options, env, self) {
    return defaultText(tokens, idx, options, env, self).replace(
      /\t/g,
      '<span class="md-tab" aria-hidden="true"></span>'
    );
  };
}
function userEleventySetup(eleventyConfig) {
  // The eleventyConfig parameter stands for the the config instantiated in /.eleventy.js.
  // Feel free to add any plugin you want here instead of /.eleventy.js
}
exports.userMarkdownSetup = userMarkdownSetup;
exports.userEleventySetup = userEleventySetup;
