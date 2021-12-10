/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

"use strict";

const meow = require("meow");

const cli = meow({
  flags: {
    env: {
      type: "string",
    },
  },
});

require("./lib/config").config({
  env: cli.flags.env,
});
