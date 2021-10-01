"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readLines = readLines;
exports.writeLines = writeLines;
exports.findPassword = findPassword;

var _fs = require("fs");

var _os = require("os");

var _readline = require("readline");

/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */

/* SPDX-License-Identifier: MIT */

/**
 * Reads the file line-by-line. Returns an empty array if the file doesn't exist.
 */
async function readLines(filename, encoding) {
  const input = (0, _fs.createReadStream)(filename, {
    encoding
  });
  const rl = (0, _readline.createInterface)({
    input,
    crlfDelay: Infinity
  });
  const output = [];
  rl.on("line", function (line) {
    output.push(line);
  });

  try {
    await new Promise(function (resolve, reject) {
      input.on("error", reject);
      input.on("close", resolve);
    });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err === null || err === void 0 ? void 0 : err.code) !== "ENOENT") throw err;
  } finally {
    input.destroy();
  }

  return output;
}
/**
 * Writes an array of text lines to file.
 */


async function writeLines(lines, filename, encoding) {
  const fs = (0, _fs.createWriteStream)(filename, {
    encoding
  });
  lines.forEach(function (line) {
    fs.write(`${line}${_os.EOL}`);
  });
  await new Promise(function (resolve) {
    fs.on("close", resolve);
    fs.end();
  });
}

async function findPassword(filename, encoding) {
  var _filename$match, _lines$;

  let lines = await readLines(filename, encoding);

  for (const line of lines) {
    const match = line.match(/^ENVARS_PASSWORD=(.+)$/);
    if (match) return match[1];
  }

  if (process.env.ENVARS_PASSWORD) return process.env.ENVARS_PASSWORD; // Ask the user for a password.

  const rl = (0, _readline.createInterface)({
    input: process.stdin,
    output: process.stdout
  });
  let password = null;

  while (!password) {
    await new Promise(function (resolve) {
      rl.question("Password: ", function (answer) {
        if (answer) password = answer;
        resolve();
      });
    });
  }

  rl.close();
  lines = await readLines(filename, encoding);
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

  const envName = (_filename$match = filename.match(/\.([^.]+)\.[^.]+?$/)) === null || _filename$match === void 0 ? void 0 : _filename$match[1];

  if (!((_lines$ = lines[0]) !== null && _lines$ !== void 0 && _lines$.startsWith("#"))) {
    lines.unshift(`# Configuration overrides for the \`${envName}\` environment.`, `# This file must not be committed to the source control repository.`, ``);
  }

  await writeLines(lines, filename, encoding);
  return password;
}