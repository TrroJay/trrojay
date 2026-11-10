require("dotenv").config();
const settings = require("../../helpers/constants");
const { getNotePermalink } = require("../../helpers/notePermalinks");
const { getNoteTimestamps } = require("../../helpers/noteTimestamps");

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
  eleventyComputed: {
    layout: (data) => {
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "layouts/index.njk";
      }
      return "layouts/note.njk";
    },
    permalink: (data) => {
      return getNotePermalink(data.page.inputPath, data);
    },
    noteTimestamps: (data) => getNoteTimestamps(data),
    settings: (data) => {
      const noteSettings = {};
      allSettings.forEach((setting) => {
        let noteSetting = data[setting];
        let globalSetting = process.env[setting];

        let settingValue =
          noteSetting || (globalSetting === "true" && noteSetting !== false);
        // Treat disabling the global TOC as a master switch, including older exports.
        if (setting === "dgShowToc" && globalSetting === "false") settingValue = false;
        noteSettings[setting] = settingValue;
      });
      return noteSettings;
    },
  },
};
