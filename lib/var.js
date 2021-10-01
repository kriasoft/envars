"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.set = set;
exports.get = get;

var _dotenv = _interopRequireDefault(require("dotenv"));

var _fs = require("fs");

var _makeDir = _interopRequireDefault(require("make-dir"));

var _os = require("os");

var _path = _interopRequireDefault(require("path"));

var _readline = _interopRequireDefault(require("readline"));

var _cipher = require("./cipher");

var _settings = _interopRequireDefault(require("./settings"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */

/* SPDX-License-Identifier: MIT */

/**
 * Writes environment variable to the .env.{envName} file.
 */
async function set(name, value, options) {
  const cwd = options.cwd || _settings.default.cwd;
  const envName = options.env || _settings.default.default;
  const encoding = options.encoding || _settings.default.encoding;

  const filename = _path.default.join(cwd, `.env.${envName}`); // Ensure that that target directory exists.


  await (0, _makeDir.default)(cwd);

  if (options.secret) {
    var _c$parsed$ENVARS_PASS, _c$parsed;

    // Attempt to load the encryption password.
    let c = _dotenv.default.config({
      path: `${filename}.override`
    });

    let password = (_c$parsed$ENVARS_PASS = (_c$parsed = c.parsed) === null || _c$parsed === void 0 ? void 0 : _c$parsed.ENVARS_PASSWORD) !== null && _c$parsed$ENVARS_PASS !== void 0 ? _c$parsed$ENVARS_PASS : process.env.ENVARS_PASSWORD;

    if (!password) {
      var _lines$;

      // Ask the user for a password.
      const prl = _readline.default.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      while (!password) {
        await new Promise(function (resolve) {
          prl.question("Password: ", function (answer) {
            if (answer) password = answer;
            resolve();
          });
        });
      }

      prl.close();
      const lines = await (0, _utils.readLines)(`${filename}.override`, encoding);
      let append = true;
      lines.forEach(function (line, i) {
        if (line.startsWith("ENVARS_PASSWORD=")) {
          lines[i] = `ENVARS_PASSWORD=${password}`;
          append = false;
        }
      });

      if (append) {
        lines.push(`ENVARS_PASSWORD=${password}`);
      }

      if (!((_lines$ = lines[0]) !== null && _lines$ !== void 0 && _lines$.startsWith("#"))) {
        lines.unshift(`# Configuration overrides for the \`${envName}\` environment.`, `# This file must not be committed to the source control repository.`, ``);
      }

      await (0, _utils.writeLines)(lines, `${filename}.override`, encoding);
    }

    c = _dotenv.default.config({
      path: filename
    });
    let salt = (await (0, _cipher.generateSalt)()).toString("base64"); // Attempt to load the encryption password salt.

    for (const key in c.parsed) {
      var _c$parsed$key;

      const match = (_c$parsed$key = c.parsed[key]) === null || _c$parsed$key === void 0 ? void 0 : _c$parsed$key.match(_cipher.encRegExp);

      if (match) {
        salt = match[1];
        break;
      }
    }

    value = await (0, _cipher.encrypt)(value, password, salt);
  } // Read the target .env.{envName} file line-by-line.
  // The file is created if it does not exist.


  const input = (0, _fs.createReadStream)(filename, {
    flags: "a+",
    encoding
  });

  const rl = _readline.default.createInterface({
    input,
    crlfDelay: Infinity
  });

  try {
    const lines = [];
    let append = true;

    for await (const line of rl) {
      if (line.startsWith(`${name}=`)) {
        lines.push(`${name}=${value}`);
        append = false;
      } else {
        lines.push(line);
      }
    }

    if (append) lines.push(`${name}=${value}`);

    if (!lines[0].startsWith("#")) {
      const cliPrefix = (0, _fs.existsSync)("./yarn.lock") ? "yarn" : "npm run";
      lines.unshift(`# Configuration settings for the \`${envName}\` environment.`, `# Use the following CLI commands for reading/writing secrets:`, `#`, `#   $ ${cliPrefix} envars set <name> <value> --env=${envName} --secret`, `#   $ ${cliPrefix} envars get <name> --env=${envName}`, `#`, ``);
    }

    await new Promise(resolve => {
      input.on("close", resolve);
      input.destroy();
    });
    const output = (0, _fs.createWriteStream)(filename, {
      encoding
    });

    try {
      for (const line of lines) {
        output.write(line + _os.EOL);
      }

      return new Promise(resolve => {
        output.on("close", resolve);
        output.end();
      });
    } finally {
      output.close();
    }
  } finally {
    rl.close();
    input.close();
  }
}

async function get(name, options) {
  var _config$parsed, _value;

  const cwd = options.cwd || _settings.default.cwd;
  const envName = options.env || _settings.default.default;
  const encoding = options.encoding || _settings.default.encoding;

  const filename = _path.default.join(cwd, `.env.${envName}`);

  const config = _dotenv.default.config({
    path: filename
  });

  let value = (_config$parsed = config.parsed) === null || _config$parsed === void 0 ? void 0 : _config$parsed[name];

  if (value && _cipher.encRegExp.test(value)) {
    const password = await (0, _utils.findPassword)(`${filename}.override`, encoding);

    try {
      value = await (0, _cipher.decrypt)(value, password);
    } catch (err) {
      throw new Error(`Failed to decrypt \`${name}\` variable.` + (err instanceof Error ? ` ${err.message}` : ``));
    }
  }

  return (_value = value) !== null && _value !== void 0 ? _value : null;
}