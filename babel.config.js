/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

/**
 * Babel configuration.
 *
 * @see https://babeljs.io/docs/en/options
 * @type {import("@babel/core").ConfigAPI}
 */
module.exports = function config(api) {
  return {
    presets: [["@babel/preset-env", { targets: { node: "10" } }]],

    plugins: ["@babel/plugin-proposal-class-properties"],

    sourceMaps: api.env() === "production",

    ignore: api.env() === "test" ? [] : ["*.d.ts", "test/**/*"],

    overrides: [
      {
        test: /\.ts$/,
        presets: ["@babel/preset-typescript"],
      },
    ],
  };
};
