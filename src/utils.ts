/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import { createReadStream, createWriteStream } from "fs";
import { EOL } from "os";
import { createInterface } from "readline";

/**
 * Reads the file line-by-line. Returns an empty array if the file doesn't exist.
 */
export async function readLines(
  filename: string,
  encoding: BufferEncoding
): Promise<string[]> {
  const input = createReadStream(filename, { encoding });
  const rl = createInterface({ input, crlfDelay: Infinity });
  const output: string[] = [];

  rl.on("line", function (line) {
    output.push(line);
  });

  try {
    await new Promise(function (resolve, reject) {
      input.on("error", reject);
      input.on("close", resolve);
    });
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  } finally {
    input.destroy();
  }

  return output;
}

/**
 * Writes an array of text lines to file.
 */
export async function writeLines(
  lines: string[],
  filename: string,
  encoding: BufferEncoding
): Promise<void> {
  const fs = createWriteStream(filename, { encoding });

  lines.forEach(function (line) {
    fs.write(`${line}${EOL}`);
  });

  await new Promise(function (resolve) {
    fs.on("close", resolve);
    fs.end();
  });
}

export async function findPassword(
  filename: string,
  encoding: BufferEncoding
): Promise<string> {
  let lines = await readLines(filename, encoding);

  for (const line of lines) {
    const match = line.match(/^ENVARS_PASSWORD=(.+)$/);
    if (match) return match[1];
  }

  if (process.env.ENVARS_PASSWORD) return process.env.ENVARS_PASSWORD;

  // Ask the user for a password.
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let password: string | null = null;

  while (!password) {
    await new Promise<void>(function (resolve) {
      rl.question("Password: ", function (answer: string) {
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

  const envName = filename.match(/\.([^.]+)\.[^.]+?$/)?.[1];
  if (!lines[0]?.startsWith("#")) {
    lines.unshift(
      `# Configuration overrides for the \`${envName}\` environment.`,
      `# This file must not be committed to the source control repository.`,
      ``
    );
  }

  await writeLines(lines, filename, encoding);

  return password;
}
