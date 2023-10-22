/* SPDX-FileCopyrightText: 2021-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import test from "ava";
import { unlink, writeFile } from "node:fs/promises";
import { loadEnv } from "./index.js";

// TODO: Add more tests

test.serial("Load vars from .env file", async (t) => {
  await writeLines(".env", ["FOO=bar", "BAR=foo"]);
  await writeLines(".env.local", ["BAZ=zzz"]);
  const [env] = await loadEnv();

  t.deepEqual(
    {
      NODE_ENV: env.NODE_ENV,
      FOO: env.FOO,
      BAR: env.BAR,
      PROCESS_FOO: process.env.FOO,
      PROCESS_BAR: process.env.BAR,
    },
    {
      NODE_ENV: "test",
      FOO: "bar",
      BAR: "foo",
      PROCESS_FOO: undefined,
      PROCESS_BAR: undefined,
    },
  );
});

test.serial("Load vars from .env file, merge to process.env", async (t) => {
  await writeLines(".env", ["FOO=bar", "BAR=foo"]);
  const [env] = await loadEnv(undefined, { mergeTo: process.env });

  t.deepEqual(
    {
      NODE_ENV: env.NODE_ENV,
      FOO: env.FOO,
      BAR: env.BAR,
      PROCESS_FOO: process.env.FOO,
      PROCESS_BAR: process.env.BAR,
    },
    {
      NODE_ENV: "test",
      FOO: "bar",
      BAR: "foo",
      PROCESS_FOO: "bar",
      PROCESS_BAR: "foo",
    },
  );
});

test.serial("Load vars from .env, .env.local files", async (t) => {
  await writeLines(".env", ["FOO=bar", "BAR=foo"]);
  await writeLines(".env.local", ["FOO=new"]);
  const [env] = await loadEnv(undefined);
  t.deepEqual({ FOO: env.FOO, BAR: env.BAR }, { FOO: "new", BAR: "foo" });
});

test.serial("Load vars from .env file with schema", async (t) => {
  await writeLines(".env", ["FOO=bar", "BAR=foo"]);
  await writeLines("env.ts", [
    `import { cleanEnv, str } from "envalid";`,
    "export default cleanEnv(process.env, {",
    "  FOO: str(),",
    "  BAR: str(),",
    "});",
  ]);
  const [env] = await loadEnv(undefined, { schema: "env.ts" });
  t.deepEqual(env, { FOO: "bar", BAR: "foo" });
});

// test.serial("Load secrets from .env file", async (t) => {
//   await writeLines(".env", [
//     "DB_PASSWORD=secret://google/projects/example/secrets/db-password/versions/latest",
//   ]);
//   const [env, secrets] = await loadEnv(undefined);
//   t.deepEqual({ DB_PASSWORD: env.DB_PASSWORD }, { DB_PASSWORD: "Passw0rd!" });
// });

const originalEnv = process.env;

async function cleanUp() {
  process.env = { ...originalEnv };
  await Promise.all([
    unlink(".env").catch(() => {}),
    unlink(".env.local").catch(() => {}),
    unlink(".env.development").catch(() => {}),
    unlink(".env.development.local").catch(() => {}),
    unlink(".env.test").catch(() => {}),
    unlink(".env.test.local").catch(() => {}),
    unlink(".env.production").catch(() => {}),
    unlink(".env.production.local").catch(() => {}),
  ]);
}

/**
 * @param {string} path
 * @param  {string[]} lines
 */
async function writeLines(path, lines) {
  await writeFile(path, lines.join("\n") + "\n", "utf-8");
}

test.beforeEach(cleanUp);
test.afterEach(cleanUp);
