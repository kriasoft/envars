/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import dotenv from "dotenv";
import { createReadStream, createWriteStream, existsSync } from "fs";
import makeDir from "make-dir";
import { EOL } from "os";
import path from "path";
import readline from "readline";
import { decrypt, encRegExp, encrypt, generateSalt } from "./cipher";
import settings from "./settings";
import { findPassword, readLines, writeLines } from "./utils";

export type Options = {
  /**
   * The source directory containing .env.* files.
   */
  cwd: string;

  /**
   * The environment name such as "local", "dev", "test", "prod", etc.
   */
  env: string;

  /**
   * Use password-based encryption.
   */
  secret?: boolean;

  /**
   * Text encoding of the .env.* files.
   */
  encoding?: BufferEncoding;
};

/**
 * Writes environment variable to the .env.{envName} file.
 */
export async function set(
  name: string,
  value: string,
  options: Options
): Promise<void> {
  const cwd = options.cwd || settings.cwd;
  const envName = options.env || settings.default;
  const encoding = options.encoding || settings.encoding;
  const filename = path.join(cwd, `.env.${envName}`);

  // Ensure that that target directory exists.
  await makeDir(cwd);

  if (options.secret) {
    // Attempt to load the encryption password.
    let c = dotenv.config({ path: `${filename}.override` });
    let password = c.parsed?.ENVARS_PASSWORD ?? process.env.ENVARS_PASSWORD;

    if (!password) {
      // Ask the user for a password.
      const prl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      while (!password) {
        await new Promise<void>(function (resolve) {
          prl.question("Password: ", function (answer) {
            if (answer) password = answer;
            resolve();
          });
        });
      }

      prl.close();

      const lines = await readLines(`${filename}.override`, encoding);
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

      if (!lines[0]?.startsWith("#")) {
        lines.unshift(
          `# Configuration overrides for the \`${envName}\` environment.`,
          `# This file must not be committed to the source control repository.`,
          ``
        );
      }

      await writeLines(lines, `${filename}.override`, encoding);
    }

    c = dotenv.config({ path: filename });
    let salt = (await generateSalt()).toString("base64");

    // Attempt to load the encryption password salt.
    for (const key in c.parsed) {
      const match = c.parsed[key]?.match(encRegExp);
      if (match) {
        salt = match[1];
        break;
      }
    }

    value = await encrypt(value, password as string, salt);
  }

  // Read the target .env.{envName} file line-by-line.
  // The file is created if it does not exist.
  const input = createReadStream(filename, { flags: "a+", encoding });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

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
      const cliPrefix = existsSync("./yarn.lock") ? "yarn" : "npm run";

      lines.unshift(
        `# Configuration settings for the \`${envName}\` environment.`,
        `# Use the following CLI commands for reading/writing secrets:`,
        `#`,
        `#   $ ${cliPrefix} envars set <name> <value> --env=${envName} --secret`,
        `#   $ ${cliPrefix} envars get <name> --env=${envName}`,
        `#`,
        ``
      );
    }

    await new Promise((resolve) => {
      input.on("close", resolve);
      input.destroy();
    });

    const output = createWriteStream(filename, { encoding });

    try {
      for (const line of lines) {
        output.write(line + EOL);
      }

      return new Promise((resolve) => {
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

export async function get(
  name: string,
  options: Omit<Options, "secret">
): Promise<string | null> {
  const cwd = options.cwd || settings.cwd;
  const envName = options.env || settings.default;
  const encoding = options.encoding || settings.encoding;
  const filename = path.join(cwd, `.env.${envName}`);

  const config = dotenv.config({ path: filename });
  let value = config.parsed?.[name];

  if (value && encRegExp.test(value)) {
    const password = await findPassword(`${filename}.override`, encoding);
    try {
      value = await decrypt(value, password);
    } catch (err) {
      throw new Error(
        `Failed to decrypt \`${name}\` variable.` +
          (err instanceof Error ? ` ${err.message}` : ``)
      );
    }
  }

  return value ?? null;
}
