'use strict';
const path = require("path");

module.exports = {
  extension: ["ts", "js"],
  package: path.join(__dirname, "./package.json"),
  ui: "bdd",
  spec: [
    "./test/**/*.test.*",
  ],
  exit: true
};
