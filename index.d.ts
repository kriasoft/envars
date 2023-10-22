/* SPDX-FileCopyrightText: 2021-present Kriasoft */
/* SPDX-License-Identifier: MIT */

export type SecretSource = "google" | "aws" | "azure";

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
 * @param environment Environment name such as "development" or "production".
 * @param options Loading options
 */
export function loadEnv(
  environment: string | undefined,
  options: {
    /**
     * Where to look for `.env` files. Defaults to the current working directory.
     */
    root?: string;
    /**
     * Lookup filenames.
     * @default
     *   [
     *     ".env.{environment}.local",
     *     ".env.{environment}",
     *     ".env.local",
     *     ".env"
     *   ]
     */
    files?: string[] | string;
    /**
     * Path to the environment schema file exporting environment variables
     * required by the app at runtime.
     *
     * @example
     *   // env.ts
     *   import { cleanEnv, str, num } from "envalid";
     *
     *   export default cleanEnv(process.env, {
     *     HOSTNAME: str({ default: "localhost" }),
     *     PORT: num({ default: 8080 }),
     *     DB_PASSWORD: str(),
     *   });
     */
    schema?: string;
    /**
     * Merge the loaded environment variables into the specified object.
     */
    mergeTo?: Record<string, unknown>;
  },
): Promise<
  [
    env: Record<string, string>,
    secrets: Map<string, { ref: string; source: SecretSource }>,
  ]
>;
