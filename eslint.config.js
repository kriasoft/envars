/* SPDX-FileCopyrightText: 2021-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import js from "@eslint/js";
import * as tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import ts from "typescript-eslint";

/**
 * ESLint configuration
 * https://eslint.org/docs/latest/use/configure/
 */
export default ts.config(
  {
    ignores: [".yarn", "**/node_modules", ".pnp.*"],
  },
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
  },
);
