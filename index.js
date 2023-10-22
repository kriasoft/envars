/* SPDX-FileCopyrightText: 2021-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { parse } from "dotenv";
import { expand } from "dotenv-expand";
import { build } from "esbuild";
import { importFromString } from "module-from-string";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import parentModule from "parent-module";
import { readPackageUp } from "read-pkg-up";

// Matches the following patterns:
//   secret://[source]/[ref]
// For example:
//   secret://google/projects/example/secrets/db-password/versions/latest
const secretRegExp = /^secret:\/\/(\w+)\/(.*)$/;

/**
 * Loads environment variables from `.env` files. If any of these variables
 * reference secret values, they will be fetched from the cloud provider
 * such as Google Cloud Secret Manager, AWS Secrets Manager, or Azure Key Vault.
 *
 * @see https://cloud.google.com/secret-manager
 * @example
 *   const env = await loadEnv("development", {
 *     root: "..",
 *     schema: "./core/env.ts",
 *     mergeTo: process.env,
 *   });
 *
 * @param {string | undefined} environment Environment name such as "development" or "production".
 * @param {{
 *  root?: string;
 *  files?: string[] | string;
 *  schema?: string;
 *  mergeTo?: Record<string, unknown>;
 * }} options Loading options
 * @return {Promise<[env: Record<string, string>, secrets: Map<string, { ref: string; source: "google" | "aws" | "azure" }]>}
 */
export async function loadEnv(environment, options) {
  const files = options?.files ?? [
    ".env.{environment}.local",
    ".env.{environment}",
    ".env.local",
    ".env",
  ];

  const conflictPath =
    environment && files.find((file) => file.endsWith(`.${environment}`));

  if (conflictPath) {
    throw new Error(
      `"${environment}" cannot be used as an environment name because it ` +
        `conflicts with the "${conflictPath}" file path (see ``options.files``).`,
    );
  }

  // Load environment variables from the `.env` files
  const parentFile = parentModule();
  const parentDir = dirname(
    parentFile.startsWith("file://") ? fileURLToPath(parentFile) : parentFile,
  );
  const rootDir = resolve(parentDir, options?.root ?? ".");
  const encoding = options?.encoding ?? "utf-8";
  const parsed = await Promise.all(
    files.map((file) => {
      if (environment) file = file.replace("{environment}", environment);
      file = resolve(rootDir, file);
      return readFile(file, { encoding })
        .then((text) => parse(text))
        .catch((err) =>
          err.code === "ENOENT" ? Promise.resolve(null) : Promise.reject(err),
        );
    }),
  ).then((parsed) => parsed.reduce((a, b) => ({ ...b, ...a }), {}));

  // Compatibility with Vite
  if (parsed.NODE_ENV && process.env.VITE_USER_NODE_ENV === undefined) {
    process.env.VITE_USER_NODE_ENV = parsed.NODE_ENV;
  }
  if (parsed.BROWSER && process.env.BROWSER === undefined) {
    process.env.BROWSER = parsed.BROWSER;
  }
  if (parsed.BROWSER_ARGS && process.env.BROWSER_ARGS === undefined) {
    process.env.BROWSER_ARGS = parsed.BROWSER_ARGS;
  }

  const originalEnv = process.env;
  process.env = { ...process.env };
  expand({ parsed });
  process.env = originalEnv;

  /** @type {string[] | undefined} */
  let schemaKeys;

  if (options?.schema) {
    // Transpile the schema file into ESM code
    const schemaFile = resolve(parentDir, options?.schema);
    const { packageJson } = await readPackageUp({ cwd: parentDir });
    const {
      outputFiles: [{ text: contents }],
    } = await build({
      entryPoints: [schemaFile],
      loader: { ".ts": "ts", ".tsx": "ts" },
      bundle: true,
      write: false,
      format: "esm",
      external: Object.keys(packageJson.dependencies ?? {}).concat(
        Object.keys(packageJson.devDependencies ?? {}),
      ),
    });

    process.env = parsed;

    // Import env schema
    const envObj = await importFromString(contents, {
      dirname: parentDir,
      filename: schemaFile,
      useCurrentGlobal: true,
    }).then((module) => module.env ?? module.default);

    // Restore the original environment variables
    process.env = originalEnv;

    // Get the list of environment variable names from the schema
    schemaKeys = Object.keys(envObj);
    if (schemaKeys.length === 0) {
      throw new Error(
        "The schema file must export an object with environment variables.",
      );
    }
  }

  /** @type {Record<string, string>} */
  const env = schemaKeys === undefined ? { ...process.env } : {};
  /** @type {Map<string, { ref: string, source: "google" | "aws" | "azure" }>} */
  const secrets = new Map();
  /** @type {Promise<void>[]} */
  const queue = [];

  /** @type {import("@google-cloud/secret-manager").SecretManagerServiceClient} */
  let sm;

  const assign = options?.mergeTo
    ? (key, value, secretRef) => {
        if (process.env[key] === undefined) {
          env[key] = value;
          options.mergeTo[key] = value;
        } else {
          env[key] = process.env[key];
        }
        if (secretRef) secrets.set(key, secretRef);
      }
    : (key, value, secretRef) => {
        env[key] = process.env[key] === undefined ? value : process.env[key];
        if (secretRef) secrets.set(key, secretRef);
      };

  const tempEnv = Object.fromEntries(
    [...Object.entries(process.env), ...Object.entries(parsed)].filter(
      ([key]) => !schemaKeys || schemaKeys.includes(key),
    ),
  );

  Object.entries(tempEnv).forEach(([key, value]) => {
    if (value.startsWith("secret://") && secretRegExp.test(value)) {
      const [, source, ref] = value.match(secretRegExp) ?? [];

      if (source === "google" || source === "gcp") {
        if (ref) {
          // Load the secret value from Google Secret Manager
          // https://cloud.google.com/secret-manager/docs/access-secret-version
          if (!sm) {
            process.env = tempEnv;
            sm = new SecretManagerServiceClient();
            process.env = originalEnv;
          }
          queue.push(
            sm.accessSecretVersion({ name: ref }).then(([res]) => {
              const value = res.payload?.data?.toString();
              assign(key, value, { ref, source });
            }),
          );
        } else {
          assign(key, value);
        }
      } else {
        // TODO: Add support for AWS Secret Manager, Azure Key Vault, etc.
        console.warn(
          `Unable to decrypt: ${value}. The "${source}" secret manager is not supported yet.`,
        );
        assign(key, value);
      }

      assign(key, value);
    } else {
      assign(key, value);
    }
  });

  // Wait for all async operations to complete
  await Promise.all(queue);

  return [env, secrets];
}
