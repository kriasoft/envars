/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import {
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  pbkdf2Sync,
  randomBytes,
  randomFillSync,
} from "crypto";
import { promisify } from "util";

const algorithm = "aes-256-gcm";
const keyMap = new Map<string, Buffer>();
const authTagLength = 16;

// `enc::{password-salt}:{encrypted-text-salt}:{encrypted-text}`
const encRegExp =
  /^enc::([A-Za-z0-9+/=]{16}):([A-Za-z0-9+/=]{16}):([A-Za-z0-9+/=]{16,})$/;

const pbkdf2Async = promisify(pbkdf2);
const generateSalt = promisify(randomBytes).bind(undefined, 12);

function generateSaltSync(): Buffer {
  const buffer = Buffer.alloc(12, 0);
  randomFillSync(buffer);
  return buffer;
}

/**
 * Generates a key using PBKDF2 to slow down attempts to crack it.
 * 1,000,000 iterations was chosen because it took a little over
 * a second on an i7-7700HQ Quad Core processor.
 */
async function generateKey(password: string, salt: string): Promise<Buffer> {
  const saltBuff = Buffer.from(salt, "base64");
  let key = keyMap.get(salt);

  if (!key) {
    key = await pbkdf2Async(password, saltBuff, 1000000, 32, "sha256");
    keyMap.set(salt, key);
  }

  return key;
}

function generateKeySync(password: string, salt: string): Buffer {
  const saltBuff = Buffer.from(salt, "base64");
  let key = keyMap.get(salt);

  if (!key) {
    key = pbkdf2Sync(password, saltBuff, 1000000, 32, "sha256");
    keyMap.set(salt, key);
  }

  return key;
}

function encryptValue(
  value: string,
  salt: string,
  key: Buffer,
  iv: Buffer
): string {
  const cipher = createCipheriv(algorithm, key, iv, { authTagLength });
  return [
    "enc:",
    salt,
    iv.toString("base64"),
    Buffer.concat([
      cipher.update(value, "utf-8"),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString("base64"),
  ].join(":");
}

export async function encrypt(
  value: string,
  password: string,
  salt: string
): Promise<string> {
  const iv = await generateSalt();
  const key = await generateKey(password, salt);
  return encryptValue(value, salt, key, iv);
}

export function encryptSync(
  value: string,
  password: string,
  salt: string
): string {
  const iv = generateSaltSync();
  const key = generateKeySync(password, salt);
  return encryptValue(value, salt, key, iv);
}

function parse(value: string): [string, Buffer, Buffer, Buffer] {
  const data = value.match(encRegExp);

  if (!data || !data[1] || !data[2] || !data[3]) {
    throw new Error("The encrypted value is malformed.");
  }

  const salt = data[1];
  const iv = Buffer.from(data[2], "base64");
  const buff = Buffer.from(data[3], "base64");
  const val = buff.slice(0, buff.length - authTagLength);
  const authTag = buff.slice(buff.length - authTagLength);

  return [salt, iv, val, authTag];
}

function decryptValue(
  value: Buffer,
  key: Buffer,
  iv: Buffer,
  authTag: Buffer
): string {
  const decipher = createDecipheriv(algorithm, key, iv, { authTagLength });
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(value), decipher.final()]).toString(
      "utf-8"
    );
  } catch (err) {
    if (err instanceof Error) {
      if (err.stack?.includes(" Decipheriv.final ")) {
        throw new Error("Invalid password.");
      }
      throw err;
    }
    throw new Error();
  }
}

export async function decrypt(
  value: string,
  password: string
): Promise<string> {
  const [salt, iv, val, authTag] = parse(value);
  const key = await generateKey(password, salt);
  return decryptValue(val, key, iv, authTag);
}

export function decryptSync(value: string, password: string): string {
  const [salt, iv, val, authTag] = parse(value);
  const key = generateKeySync(password, salt);
  return decryptValue(val, key, iv, authTag);
}

export { encRegExp, generateSalt };
