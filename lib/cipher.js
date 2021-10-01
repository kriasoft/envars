"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encrypt = encrypt;
exports.encryptSync = encryptSync;
exports.decrypt = decrypt;
exports.decryptSync = decryptSync;
exports.generateSalt = exports.encRegExp = void 0;

var _crypto = require("crypto");

var _util = require("util");

/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */

/* SPDX-License-Identifier: MIT */
const algorithm = "aes-256-gcm";
const keyMap = new Map();
const authTagLength = 16; // `enc::{password-salt}:{encrypted-text-salt}:{encrypted-text}`

const encRegExp = /^enc::([A-Za-z0-9+/=]{16}):([A-Za-z0-9+/=]{16}):([A-Za-z0-9+/=]{16,})$/;
exports.encRegExp = encRegExp;
const pbkdf2Async = (0, _util.promisify)(_crypto.pbkdf2);
const generateSalt = (0, _util.promisify)(_crypto.randomBytes).bind(undefined, 12);
exports.generateSalt = generateSalt;

function generateSaltSync() {
  const buffer = Buffer.alloc(12, 0);
  (0, _crypto.randomFillSync)(buffer);
  return buffer;
}
/**
 * Generates a key using PBKDF2 to slow down attempts to crack it.
 * 1,000,000 iterations was chosen because it took a little over
 * a second on an i7-7700HQ Quad Core processor.
 */


async function generateKey(password, salt) {
  const saltBuff = Buffer.from(salt, "base64");
  let key = keyMap.get(salt);

  if (!key) {
    key = await pbkdf2Async(password, saltBuff, 1000000, 32, "sha256");
    keyMap.set(salt, key);
  }

  return key;
}

function generateKeySync(password, salt) {
  const saltBuff = Buffer.from(salt, "base64");
  let key = keyMap.get(salt);

  if (!key) {
    key = (0, _crypto.pbkdf2Sync)(password, saltBuff, 1000000, 32, "sha256");
    keyMap.set(salt, key);
  }

  return key;
}

function encryptValue(value, salt, key, iv) {
  const cipher = (0, _crypto.createCipheriv)(algorithm, key, iv, {
    authTagLength
  });
  return ["enc:", salt, iv.toString("base64"), Buffer.concat([cipher.update(value, "utf-8"), cipher.final(), cipher.getAuthTag()]).toString("base64")].join(":");
}

async function encrypt(value, password, salt) {
  const iv = await generateSalt();
  const key = await generateKey(password, salt);
  return encryptValue(value, salt, key, iv);
}

function encryptSync(value, password, salt) {
  const iv = generateSaltSync();
  const key = generateKeySync(password, salt);
  return encryptValue(value, salt, key, iv);
}

function parse(value) {
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

function decryptValue(value, key, iv, authTag) {
  const decipher = (0, _crypto.createDecipheriv)(algorithm, key, iv, {
    authTagLength
  });
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(value), decipher.final()]).toString("utf-8");
  } catch (err) {
    if (err instanceof Error) {
      var _err$stack;

      if ((_err$stack = err.stack) !== null && _err$stack !== void 0 && _err$stack.includes(" Decipheriv.final ")) {
        throw new Error("Invalid password.");
      }

      throw err;
    }

    throw new Error();
  }
}

async function decrypt(value, password) {
  const [salt, iv, val, authTag] = parse(value);
  const key = await generateKey(password, salt);
  return decryptValue(val, key, iv, authTag);
}

function decryptSync(value, password) {
  const [salt, iv, val, authTag] = parse(value);
  const key = generateKeySync(password, salt);
  return decryptValue(val, key, iv, authTag);
}