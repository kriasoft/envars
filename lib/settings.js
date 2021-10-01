"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = require("fs");

var _settings$debug;

let settings = {};

try {
  settings = JSON.parse((0, _fs.readFileSync)("./package.json", "utf-8")).envars || {};
} catch (err) {
  console.warn("Failed to load ./package.json");
}

var _default = {
  cwd: settings.cwd || ".",
  encoding: settings.encoding || "utf-8",
  default: settings.default || "local",
  environments: settings.environments,
  debug: (_settings$debug = settings.debug) !== null && _settings$debug !== void 0 ? _settings$debug : false
};
exports.default = _default;