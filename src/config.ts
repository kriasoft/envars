/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { decryptSync, encRegExp } from "./cipher";
import settings from "./settings";

export type Options = {
  /**
   * The source directory containing .env.* files.
   */
  cwd?: string;

  /**
   * The environment name such as "local", "dev", "test", "prod", etc.
   */
  env?: string;

  /**
   * Text encoding of the .env.* files.
   */
  encoding?: BufferEncoding;

  /**
   * You may turn on logging to help debug why certain keys or values are not being set as you expect.
   */
  debug?: boolean;
};

export function config(options: Options = {}): Record<string, string> {
  const env = process.env;
  const cwd = options.cwd || settings.cwd;
  const encoding = options.encoding || settings.encoding;
  const debug = (options.debug ?? settings.debug) || undefined;
  const opts = { debug, encoding };
  const getPath = (file: string) => path.join(cwd, file);

  env.NODE_ENV = env.NODE_ENV ?? "development";
  env.APP_ENV = options.env ?? env.APP_ENV ?? settings.default;

  const output = [
    dotenv.config({ path: getPath(`.${env.APP_ENV}.override.env`), ...opts }),
    dotenv.config({ path: getPath(`.${env.APP_ENV}.env`), ...opts }),
    dotenv.config({ path: getPath(`.common.override.env`), ...opts }),
    dotenv.config({ path: getPath(`.common.env`), ...opts }),
    dotenv.config({ path: getPath(`.env`), ...opts }),
  ];

  output.forEach((x) => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    if (x.error && (x.error as any).code !== "ENOENT") throw x.error;
  });

  // Set the correct permissions for SSL key files
  if (env.PGSSLKEY && fs.existsSync(env.PGSSLKEY)) {
    try {
      fs.chmodSync(env.PGSSLKEY, 0o600);
    } catch (err) {
      console.error(err);
    }
  }

  for (const key in output[1].parsed) {
    const password =
      output[0].parsed?.ENVARS_PASSWORD ?? process.env.ENVARS_PASSWORD;
    if (encRegExp.test(output[1].parsed[key])) {
      if (!password) {
        throw new Error(`Password required to decrypt ${key}.`);
      }

      output[1].parsed[key] = decryptSync(output[1].parsed[key], password);
      process.env[key] = output[1].parsed[key];
    }
  }

  return output.reduceRight(
    (acc, x) => ({ ...acc, ...x.parsed }),
    {} as Record<string, string>
  );
}
