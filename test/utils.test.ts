import del from "del";
import { readFileSync, writeFileSync } from "fs";
import makeDir from "make-dir";
import { readLines, writeLines } from "../src/utils";

const encoding = "utf-8";

afterAll(async function () {
  return Promise.all([
    del("./env/.env.read"),
    del("./env/.env.write"),
    del("./env/.env.empty"),
    makeDir("./env"),
  ]);
});

test(`readLines(".env.non-existent")`, async function () {
  const result = await readLines("./env/.env.non-existent", encoding);
  expect(result).toMatchObject([]);
});

test(`readLines(".env.empty")`, async function () {
  const filename = "./env/.env.empty";
  writeFileSync(filename, "", { encoding });

  const result = await readLines(filename, encoding);
  expect(result).toMatchObject([]);
});

test(`readLines(".env.read")`, async function () {
  const filename = "./env/.env.read";
  writeFileSync(filename, "A=1\nB=2\n", { encoding });

  const result = await readLines(filename, encoding);
  expect(result).toMatchObject(["A=1", "B=2"]);
});

test(`writeLines(".env.write")`, async function () {
  const filename = "./env/.env.write";
  await writeLines(["A=1", "B=2"], filename, encoding);
  const result = readFileSync(filename, { encoding });
  expect(result).toMatch("A=1\nB=2\n");
});
