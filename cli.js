#!/usr/bin/env node

"use strict";

const meow = require("meow");
const { bold, dim, yellow } = require("chalk");
const { config } = require("./lib/config");
const { set, get } = require("./lib/var");

const cli = meow(
  `
  ${dim("Usage:")}
    ${bold("$ envars get")} <name> [--env #0]
    ${dim("  Reads environment variable from .env[.<env>] file.")}

    ${bold("$ envars set")} <name> <value> [--env #0] [--secret, -s]
    ${dim("  Writes environment variable to .env or .env.<env> file.")}

  ${dim("Options:")}
    ${bold("--env")} <name>  ${dim(
    'Environment name such as "local", "dev", "test", "prod"'
  )}
    ${bold("--secret")}, ${bold("-s")}  ${dim("Use password-based encryption")}

  Examples:
    ${bold("$ envars set")} PGPASSWORD ${yellow(
    '"Passw0rd!"'
  )} --env=prod --secret
`,
  {
    flags: {
      env: {
        type: "string",
        default: "local",
      },
      secret: {
        type: "boolean",
        alias: "s",
        default: false,
      },
      help: {
        type: "boolean",
        alias: "h",
      },
    },
    allowUnknownFlags: false,
  }
);

if (cli.flags.help) {
  cli.showHelp(0);
}

if (cli.input.length === 0) {
  config({ env: cli.flags.env });
} else if (cli.input[0] === "get") {
  if (cli.input.length !== 2) cli.showHelp(1);
  get(cli.input[1], { env: cli.flags.env }).then((value) => {
    if (value === null) process.exit(1);
    console.log(value);
  });
} else if (cli.input[0] === "set") {
  if (cli.input.length !== 3) cli.showHelp(1);
  set(cli.input[1], cli.input[2], {
    env: cli.flags.env,
    secret: cli.flags.secret,
  });
}
