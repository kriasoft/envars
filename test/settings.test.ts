/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import { readFileSync, unlinkSync, writeFileSync } from "fs";

beforeAll(function () {
  // Create a backup of "package.json"
  const pkg = readFileSync("./package.json", "utf-8");
  writeFileSync("./package.bak", pkg, "utf-8");
});

afterAll(function () {
  // Restore "package.json" to its original state
  const pkg = readFileSync("./package.bak", "utf-8");
  writeFileSync("./package.json", pkg, "utf-8");
  unlinkSync("./package.bak");
});

beforeEach(() => {
  jest.resetModules();
});

test("default settings", async function () {
  const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
  delete pkg.envars;
  writeFileSync("./package.json", JSON.stringify(pkg), "utf-8");

  const { default: settings } = await import("../src/settings");
  expect(settings).toMatchInlineSnapshot(`
    Object {
      "cwd": ".",
      "debug": false,
      "default": "local",
      "encoding": "utf-8",
      "environments": undefined,
    }
  `);
});

test("custom settings", async function () {
  const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
  pkg.envars = {
    cwd: "./env",
    debug: true,
    default: "dev",
    encoding: "latin1",
    environments: ["local", "test", "prod"],
  };
  writeFileSync("./package.json", JSON.stringify(pkg), "utf-8");

  const { default: settings } = await import("../src/settings");
  expect(settings).toMatchInlineSnapshot(`
    Object {
      "cwd": "./env",
      "debug": true,
      "default": "dev",
      "encoding": "latin1",
      "environments": Array [
        "local",
        "test",
        "prod",
      ],
    }
  `);
});
