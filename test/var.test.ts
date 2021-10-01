/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import del from "del";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import makeDir from "make-dir";
import { encRegExp } from "../src/cipher";
import { set } from "../src/var";

beforeAll(async function () {
  await Promise.all([
    await del(["./env/.temp.env", "./env/.temp.override.env"]),
    await makeDir("./env"),
  ]);
});

afterAll(async function () {
  await del(["./env/.temp.env", "./env/.temp.override.env"]);
});

test("set()", async function () {
  const envName = "temp";
  const cwd = "./env";
  const override = `ENVARS_PASSWORD=pass\n`;

  writeFileSync(`${cwd}/.${envName}.env`, "\n", "utf-8");
  writeFileSync(`${cwd}/.${envName}.override.env`, override, "utf-8");

  let result = dotenv.config({ path: `${cwd}/.${envName}.env` });
  expect(result.error).toBeUndefined();
  expect(result.parsed.PLAIN_VAR).toBeUndefined();
  expect(result.parsed.SECRET_VAR).toBeUndefined();

  await set("PLAIN_VAR", "123", { cwd, env: envName });
  await set("SECRET_VAR", "123", { cwd, env: envName, secret: true });

  result = dotenv.config({ path: `${cwd}/.${envName}.env` });
  expect(result.error).toBeUndefined();
  expect(result.parsed.PLAIN_VAR).toBe("123");
  expect(result.parsed.SECRET_VAR).toBeTruthy();
  expect(encRegExp.test(result.parsed.SECRET_VAR)).toBe(true);
});
