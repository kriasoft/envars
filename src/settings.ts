/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import { readFileSync } from "fs";

type Settings = {
  cwd: string;
  encoding: BufferEncoding;
  default: string;
  environments?: string[];
  debug: boolean;
};

let settings: Partial<Settings> = {};

try {
  settings = JSON.parse(readFileSync("./package.json", "utf-8")).envars || {};
} catch (err) {
  console.warn("Failed to load ./package.json");
}

export default {
  cwd: settings.cwd || ".",
  encoding: settings.encoding || "utf-8",
  default: settings.default || "local",
  environments: settings.environments,
  debug: settings.debug ?? false,
} as Settings;
