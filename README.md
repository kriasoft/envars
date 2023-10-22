# `envars` — environment variables loader

[![NPM Version](https://img.shields.io/npm/v/envars?style=flat-square)](https://www.npmjs.com/package/envars)
[![NPM Downloads](https://img.shields.io/npm/dm/envars?style=flat-square)](https://www.npmjs.com/package/envars)
[![Donate](https://img.shields.io/badge/dynamic/json?color=%23ff424d&label=Patreon&style=flat-square&query=data.attributes.patron_count&suffix=%20patrons&url=https%3A%2F%2Fwww.patreon.com%2Fapi%2Fcampaigns%2F233228)](http://patreon.com/koistya)
[![Discord](https://img.shields.io/discord/643523529131950086?label=Chat&style=flat-square)](https://discord.gg/bSsv7XM)

<img src="https://raw.githubusercontent.com/motdotla/dotenv/master/dotenv.png" alt="dotenv" align="right" />

Loads environment variables for the target environment from `.env` files using [dotenv](https://github.com/motdotla/dotenv); supports cloud secret providers such as [Google Secret Manager](https://cloud.google.com/secret-manager).

By default it attempts to load `.env` files from the current working directory using the following naming convention ([learn more](https://vitejs.dev/guide/env-and-mode.html#env-files)):

```bash
.env.<environment>.local     # Local overrides for <environment>
.env.<environment>           # Environment-specific settings
.env.local                   # Local overrides
.env                         # Default settings
```

Created and diligently upheld with the generous backing of these exceptional companies:

<a href="https://reactstarter.com/s/1"><img src="https://reactstarter.com/s/1.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/s/2"><img src="https://reactstarter.com/s/2.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/s/3"><img src="https://reactstarter.com/s/3.png" height="60" /></a>

## How to Install

```bash
# with NPM
$ npm install envars --save-dev

# with Yarn
$ yarn add envars --dev
```

## Usage

```dotenv
# .env
# Environment variables for the local development environment
# NOTE: Secret values need to follow this format:
#       secret://[provider]/[resource]
GOOGLE_CLOUD_PROJECT=example
DB_PASSWORD=secret://google/projects/example/secrets/db-password/latest
```

```ts
// core/env.ts
import { cleanEnv, str } from "envalid";

/**
 * Sanitized and validated environment variables.
 * @see https://github.com/af/envalid#readme
 */
export default cleanEnv(process.env, {
  GOOGLE_CLOUD_PROJECT: str(),
  DB_PASSWORD: str(),
});
```

```ts
import { loadEnv } from "envars";

const env = await loadEnv("production", {
  root: ".",
  schema: "./core/env.ts",
  mergeTo: process.env,
});
```

## API

### loadEnv(mode?, options?)

### mode

Type: `string` (optional)<br>
Default: `undefined`<br>
Example: `production`, `development`, `staging`, etc.

### options

Type: `object` (optional)

#### root

Type: `string` (optional)<br>
Default: `.` (current working directory).

The root directory where it looks for `.env` files.

#### schema

Type: `string` (optional)<br>
Default: `undefined`<br>
Example: `./core/env.ts`

The path to the TypeScript or JavaScript module exporting a sanitized environment object. Example:

```ts
import { cleanEnv, str } from "envalid";

export default cleanEnv(process.env, {
  GOOGLE_CLOUD_PROJECT: str(),
  DB_PASSWORD: str(),
});
```

Or, another example using Zod:

```ts
import { z } from "zod";

export const env = z
  .object({
    GOOGLE_CLOUD_PROJECT: z.string(),
    DB_PASSWORD: z.string(),
  })
  .parse(process.env);
```

#### files

Type: `string[]` (optional)<br>
Default: `[
  ".env.<environment>.local",
  ".env.<environment>",
  ".env.local",
  ".env"
]`

The list of file patterns where to look for `.env` files.

#### mergeTo

Type: `object` (optional)<br>
Default: `undefined`
Example: `process.env`

The object where to merge the loaded environment variables.

## Usage with Vite

```ts
import { defineConfig } from "vite";
import { loadEnv } from "envars";

export default defineConfig(async ({ mode }) => {
  const env = await loadEnv(mode, {
    root: "../",
    schema: "./core/env.ts",
    mergeTo: process.env,
  });

  return {
    build: {
      ssr: "index.ts",
      target: "esnext",
      sourcemap: true,
    },
  };
});
```

### References

- https://cloud.google.com/secret-manager/docs

## Backers 💰

<a href="https://reactstarter.com/b/1"><img src="https://reactstarter.com/b/1.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/2"><img src="https://reactstarter.com/b/2.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/3"><img src="https://reactstarter.com/b/3.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/4"><img src="https://reactstarter.com/b/4.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/5"><img src="https://reactstarter.com/b/5.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/6"><img src="https://reactstarter.com/b/6.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/7"><img src="https://reactstarter.com/b/7.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/8"><img src="https://reactstarter.com/b/8.png" height="60" /></a>

## Related Projects

- [React Starter Kit](https://github.com/kriasoft/react-starter-kit) — front-end boilerplate (TypeScript, React, Material UI, Vite)
- [Full-stack Starter Kit](https://github.com/kriasoft/relay-starter-kit) — monorepo boilerplate (TypeScript, Vite, GraphQL.js, React, and Relay)

## How to Contribute

Please [fork the repo](https://github.com/kriasoft/envars/fork), create a [PR](https://docs.github.com/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request), or send me a message on [Discord](https://discord.gg/bSsv7XM) (`@koistya`).

```bash
$ git clone https://github.com/<username>/envars.git
$ cd ./envars
$ corepack enable
$ yarn test
```

## License

Copyright © 2021-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE](https://github.com/kriasoft/envars/blob/main/LICENSE) file.

---

<sup>Made with ♥ by Konstantin Tarkus ([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@koistya))
and [contributors](https://github.com/kriasoft/envars/graphs/contributors).</sup>
