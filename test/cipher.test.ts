/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import { decrypt, encRegExp, encrypt, generateSalt } from "../src/cipher";

test("encRegExp", async function () {
  const encrypted =
    "enc::8mDzA5sFC8EgMtVa:tXz6AuPBoOrlOdQ+:IiAJD+E8dvPxdVFG/Piba4e04yqI9ro=";
  expect(encRegExp.test(encrypted)).toBe(true);
});

test("encrypt / encrypt", async function () {
  const salt: Buffer = await generateSalt();

  const encrypted = await encrypt("test123", "pass", salt.toString("base64"));
  expect(encrypted).toBeTruthy();
  expect(encRegExp.test(encrypted)).toBe(true);

  const decrypted = await decrypt(encrypted, "pass");
  expect(decrypted).toMatch("test123");
});
