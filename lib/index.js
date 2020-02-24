/**
 * @module axios-phraseapp
 */

const axios = require("axios");
const { assign } = require("./util");

const LOG_PREFIX = "[axios-phraseapp]";

/**
 * @type {import("./types").AxiosPhraseAppConfig}
 */
const defaultConfig = {
  cancelOnQuota: false,
  preventConcurrent: false,
  logFunction: console.log,
  logOnLimit: -1
};

// ModuleState
let phraseAppState = {
  inFlightRequests: 0,
  remaining: null,
  reset: null,
  limit: null,
  resetDate: null,
  phraseRequestIds: null,
  started: false
};

/**
 * Attach to an axiosInstance or the global axios instance
 * @param [axiosInstance] {import("axios").AxiosInstance|import("axios").AxiosStatic}
 * @param [config={}] {import("./types").AxiosPhraseAppConfig} axios-phrase-app configuration properties
 * @returns {array} The request and response interceptor Ids for cleanup
 */
exports.attach = (axiosInstance, config = defaultConfig) => [
  (axiosInstance || axios).interceptors.request.use(
    onPhraseAppRequest(assign(defaultConfig, config))
  ),
  (axiosInstance || axios).interceptors.response.use(
    onPhraseAppResponse(assign(defaultConfig, config))
  )
];

/**
 * Detach from an axiosInstance or the global axios instance
 * @param [axiosInstance] {import("axios").AxiosInstance|import("axios").AxiosStatic}
 * @param {array} interceptorIds Array containing the interceptor ids as returned from the `attach` function
 */
exports.detach = (axiosInstance, interceptorIds) => {
  (axiosInstance || axios).interceptors.request.eject(interceptorIds[0]);
  (axiosInstance || axios).interceptors.response.eject(interceptorIds[1]);
};

const onPhraseAppRequest = (
  /** @type {import("./types").AxiosPhraseAppConfig} */ moduleConfig
) => (/** @type {import("axios").AxiosRequestConfig} */ axiosConfig) => {
  const url = axiosConfig.url;
  const baseURL = axiosConfig.baseURL;
  // Return on non PhraseApp requests
  if (!(baseURL + url).match("//api.phrase.com")) {
    return axiosConfig;
  }

  // TODO: We probably could set this once and just expose the new state
  axiosConfig.phraseApp = {
    moduleConfig,
    state: phraseAppState
  };

  if (!phraseAppState.started) {
    phraseAppState.inFlightRequests++;
    phraseAppState.started = true;
    return axiosConfig;
  }

  if (moduleConfig.cancelOnQuota) {
    _preventLimitedRequest(phraseAppState);
  }

  phraseAppState.inFlightRequests += 1;
  return axiosConfig;
};

const onPhraseAppResponse = (
  /** @type {import("./types").AxiosPhraseAppConfig} */ moduleConfig
) => (/** @type {import("axios").AxiosResponse} */ response) => {
  const url = response.config.url;
  const baseURL = response.config.baseURL;
  // Return on non PhraseApp requests
  if (!(baseURL + url).match("//api.phrase.com")) {
    return response;
  }

  const headers = response.headers;
  const limit = headers["x-rate-limit-limit"];
  const remaining = headers["x-rate-limit-remaining"];
  const reset = headers["x-rate-limit-reset"];

  phraseAppState.inFlightRequests = phraseAppState.inFlightRequests -= 1;
  phraseAppState.limit = limit;
  phraseAppState.remaining = remaining;
  phraseAppState.reset = reset;
  phraseAppState.resetDate = new Date(reset * 1000);

  _logLimit(moduleConfig, remaining, limit);
  response.config.phraseApp.state = phraseAppState;
  return response;
};

/**
 * @param {import("./types").AxiosPhraseAppConfig} moduleConfig
 * @param {number|string} remaining
 * @param {number|string} limit
 */
function _logLimit(moduleConfig, remaining, limit) {
  function _log(limit) {
    logFunction(
      LOG_PREFIX +
        " Limit reached -> limit: " +
        limit +
        " | remaining: " +
        remaining
    );
  }
  const logOnLimit = moduleConfig.logOnLimit;
  const logFunction = moduleConfig.logFunction;
  remaining = Number(remaining);
  limit = Number(limit);
  if (logOnLimit !== -1 && typeof logFunction === "function") {
    if (logOnLimit < 1 && logOnLimit > 0) {
      if (logOnLimit < limit / remaining) {
        _log(logOnLimit * 100 + "%");
      }
    } else if (remaining <= logOnLimit) {
      _log(logOnLimit);
    }
  }
}

function _preventLimitedRequest(phraseAppState) {
  const remaining = phraseAppState.remaining;
  const reset = phraseAppState.reset;
  const resetDate = phraseAppState.resetDate;

  if (remaining == 0 && reset * 1000 > Date.now()) {
    throw new axios.Cancel(
      LOG_PREFIX + " No remaining quota. Wait until " + resetDate
    );
  }
}
