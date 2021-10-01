# `envars` — environment variables loader

[![NPM Version](https://img.shields.io/npm/v/envars?style=flat-square)](https://www.npmjs.com/package/envars)
[![NPM Downloads](https://img.shields.io/npm/dm/envars?style=flat-square)](https://www.npmjs.com/package/envars)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg?style=flat-square)](http://www.typescriptlang.org/)
[![Donate](https://img.shields.io/badge/dynamic/json?color=%23ff424d&label=Patreon&style=flat-square&query=data.attributes.patron_count&suffix=%20patrons&url=https%3A%2F%2Fwww.patreon.com%2Fapi%2Fcampaigns%2F233228)](http://patreon.com/koistya)
[![Discord](https://img.shields.io/discord/643523529131950086?label=Chat&style=flat-square)](https://discord.gg/bSsv7XM)

<img src="https://raw.githubusercontent.com/motdotla/dotenv/master/dotenv.png" alt="dotenv" align="right" />

**Envars** is a Node.js module based on [`dotenv`](https://github.com/motdotla/dotenv)
that loads and decrypts environment variables from `.{envName}.env` files into
[`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env).

It allows to store application secrets in `.env.*` files encrypted making these
files safe to be committed into a source control repository.

## How to Install

```bash
# with NPM
$ npm install envars --save-dev

# with Yarn
$ yarn add envars --dev
```

## Getting Started

Suppose you have `local` (local development), `test` (test/QA), and `prod`
(production) application environments. For each of these environments you would
create a separate `.{envName}.env` file in your project. For example:

```bash
# .local.env
APP_ORIGIN=http://localhost:8080
PGHOST=127.0.0.1
PGDATABASE=example_local
PGUSER=postgres
PGPASSWORD=
```

```bash
# .test.env
APP_ORIGIN=http://test.example.com
PGHOST=34.72.79.184
PGDATABASE=example_test
PGUSER=postgres
PGPASSWORD=enc::mxJIZ9/1uV/NDgwT:Seheo3XvJlbllbLg:M5kwPZ3XYK14rbUctbxN/3z18Q==
```

```bash
# .prod.env
APP_ORIGIN=http://example.com
PGHOST=34.72.79.1
PGDATABASE=example
PGUSER=postgres
PGPASSWORD=enc::oiF6UkepsP2l41Mt:Et1jQuh7Vw3X4UpA:Qv3Lhr45ZPA0jga5QKeg917UDg==

# .gitignore
*.override.env
```

While the `.local.env` file, that is used during local development, will
contain all the configuration settings in plain text, the other two may have
some secret values such as live database password, JWT secret, etc. Since these
values will be encrypted, it would be totally OK to commit these files into the
source control repository without compromising security.

You can update and read secrets by using the `envars` CLI:

```bash
# Encrypt and save `PGPASSWORD` variable into the `.prod.env` file
$ yarn envars set PGPASSWORD "S^6wh:rruq!MS(Xd" --env=prod --secret

# Read and decrypt `PGPASSWORD` variable from the `.prod.env` file
$ yarn envars get PGPASSWORD --env=prod
```

Get more information by running `yarn envars --help`.

From there on, loading and passing the environment variables into your app
would be as simple as requiring `envars/config` module at run-time.

```bash
# Load environment variables when launching a Node.js app
$ node -r envars/config ./server.js

# Load environment variables when launching a Node.js app via Nodemon
$ nodemon -r envars/config ./server.js

# Load environment variables for "prod" environment instead of "local" (default)
$ APP_ENV=prod nodemon -r envars/config ./server.js
```

Alternatively, you can load environment variables programmatically:

```js
import { config } from "envars";

config({ env: "prod" });
```

## Q&A

#### ❓ In which order the `.env` files are being loaded?

```
1) .{envName}.override.env
2) .{envName}.env
3) .common.override.env
4) .common.env
5) .env
```

Where `{envName}` is the name of the target environment (defaults to `local`).

#### ❓ How to check which environment is being used at run-time

By reading the value of `process.env.APP_ENV`.

#### ❓ Which files needs be included into the source control?

As long as you store secrets encrypted it is safe to commit all the `.*.env`
files into the source control repository except for the `.*.override.env` files.

#### ❓ What's the purpose of `.*.override.env` files?

Sometimes it's required for a developer being able to override some of the
configuration settings without pushing these changes to the upstream repository.
These files also used to store encryption/decryption master password.

#### ❓ How to customize where it looks for `.*.env` files?

You can customize it by adding `envars` settings to `package.json`:

```json5
{
  "name": "app",
  "dependencies": {
    "envars": "x.x.x",
    ...
  },
  "envars": {
    "cwd": "./env",       // defaults to "." when omitted
    "default": "dev",     // defaults to "local" when omitted
    "encoding": "latin1", // defaults to "utf-8" when omitted
    "debug": true         // defaults to "false" when omitted
  }
}
```

## Related Projects

- [React Starter Kit](https://github.com/kriasoft/react-starter-kit) — front-end boilerplate (TypeScript, React, Material UI, Webpack 5)
- [GraphQL API and Relay Starter Kit](https://github.com/kriasoft/relay-starter-kit) — monorepo boilerplate (TypeScript, GraphQL.js, React, and Relay)
- [Node.js API Starter Kit](https://github.com/kriasoft/node-starter-kit) — Node.js boilerplate (TypeScript, Knex, GraphQL, Cloud SQL, Cloud Functions)

## How to Contribute

Please create a [PR](https://docs.github.com/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request) or send me a message on [Discord](https://discord.gg/bSsv7XM).

## License

Copyright © 2021-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE](https://github.com/kriasoft/envars/blob/main/LICENSE) file.

---

<sup>Made with ♥ by Konstantin Tarkus ([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@koistya))
and [contributors](https://github.com/kriasoft/envars/graphs/contributors).</sup>

```

```
