"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.config = config;

var _dotenv = _interopRequireDefault(require("dotenv"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _cipher = require("./cipher");

var _settings = _interopRequireDefault(require("./settings"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* SPDX-FileCopyrightText: 2021-present Kriasoft <hello@kriasoft.com> */

/* SPDX-License-Identifier: MIT */
function config(options = {}) {
  var _options$debug, _env$NODE_ENV, _ref, _options$env;

  const env = process.env;
  const cwd = options.cwd || _settings.default.cwd;
  const encoding = options.encoding || _settings.default.encoding;
  const debug = ((_options$debug = options.debug) !== null && _options$debug !== void 0 ? _options$debug : _settings.default.debug) || undefined;
  const opts = {
    debug,
    encoding
  };

  const getPath = file => _path.default.join(cwd, file);

  env.NODE_ENV = (_env$NODE_ENV = env.NODE_ENV) !== null && _env$NODE_ENV !== void 0 ? _env$NODE_ENV : "development";
  env.APP_ENV = (_ref = (_options$env = options.env) !== null && _options$env !== void 0 ? _options$env : env.APP_ENV) !== null && _ref !== void 0 ? _ref : _settings.default.default;
  const output = [_dotenv.default.config({
    path: getPath(`.env.${env.APP_ENV}.override`),
    ...opts
  }), _dotenv.default.config({
    path: getPath(`.env.${env.APP_ENV}`),
    ...opts
  }), _dotenv.default.config({
    path: getPath(`.env.override`),
    ...opts
  }), _dotenv.default.config({
    path: getPath(`.env`),
    ...opts
  })];
  output.forEach(x => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    if (x.error && x.error.code !== "ENOENT") throw x.error;
  }); // Set the correct permissions for SSL key files

  if (env.PGSSLKEY && _fs.default.existsSync(env.PGSSLKEY)) {
    try {
      _fs.default.chmodSync(env.PGSSLKEY, 0o600);
    } catch (err) {
      console.error(err);
    }
  }

  for (const key in output[1].parsed) {
    var _output$0$parsed$ENVA, _output$0$parsed;

    const password = (_output$0$parsed$ENVA = (_output$0$parsed = output[0].parsed) === null || _output$0$parsed === void 0 ? void 0 : _output$0$parsed.ENVARS_PASSWORD) !== null && _output$0$parsed$ENVA !== void 0 ? _output$0$parsed$ENVA : process.env.ENVARS_PASSWORD;

    if (_cipher.encRegExp.test(output[1].parsed[key])) {
      if (!password) {
        throw new Error(`Password required to decrypt ${key}.`);
      }

      output[1].parsed[key] = (0, _cipher.decryptSync)(output[1].parsed[key], password);
      process.env[key] = output[1].parsed[key];
    }
  }

  return output.reduceRight((acc, x) => ({ ...acc,
    ...x.parsed
  }), {});
}

if (!require.main) config();