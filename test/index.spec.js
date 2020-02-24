/**
 * Does not work without Node test environment for now, see https://github.com/axios/axios/issues/1754#issuecomment-452602276
 */

// TODO: Some cleanup might be needed
import axios from "axios";
import nock from "nock";
import {
  attach as axiosPhraseAttach,
  detach as axiosPhraseDetach
} from "../lib/index";
import { fastForward, sleep } from "./util";

const PHRASEAPP_REQUEST = "https://api.phrase.com/v2/";

describe("axios-phraseapp functionality", () => {
  let reqInterceptor;
  let resInterceptor;

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    axiosPhraseDetach(undefined, [reqInterceptor, resInterceptor]);
  });

  it("Ignores irrelevant requests", async () => {
    [reqInterceptor, resInterceptor] = axiosPhraseAttach();
    nock("https://example.com")
      .get("/")
      .reply(() => [200]);
    const { config } = await axios.get("https://example.com");
    expect(config).not.toHaveProperty("phraseApp.moduleConfig");
  });

  it("Sets up default configuration info", async () => {
    [reqInterceptor, resInterceptor] = axiosPhraseAttach();

    nock(PHRASEAPP_REQUEST)
      .get("/")
      .reply(() => [
        200,
        true,
        {
          "x-rate-limit-limit": 1000,
          "x-rate-limit-remaining": 900,
          "x-rate-limit-reset": Date.now() / 1000
        }
      ]);

    const { config } = await axios.get(PHRASEAPP_REQUEST);
    expect(config).toHaveProperty("phraseApp");
    expect(config).toHaveProperty("phraseApp.moduleConfig");
    expect(config).toHaveProperty("phraseApp.state");
    expect(config).toHaveProperty("phraseApp.moduleConfig.logOnLimit", -1);
    expect(config).toHaveProperty(
      "phraseApp.moduleConfig.cancelOnQuota",
      false
    );
    expect(config).toHaveProperty("phraseApp.state.started", true);
    expect(config).toHaveProperty("phraseApp.state.inFlightRequests", 0);
    expect(config).toHaveProperty("phraseApp.state.remaining", "900");
    expect(config).toHaveProperty("phraseApp.state.limit", "1000");
  });

  it("Merges custom configuration with default", async () => {
    [reqInterceptor, resInterceptor] = axiosPhraseAttach(undefined, {
      cancelOnQuota: true
    });

    nock(PHRASEAPP_REQUEST)
      .get("/")
      .times(1)
      .reply(() => [200, true]);

    const { config } = await axios.get(PHRASEAPP_REQUEST);
    expect(config).toHaveProperty("phraseApp");
    expect(config).toHaveProperty("phraseApp.moduleConfig");
    expect(config).toHaveProperty("phraseApp.moduleConfig.logOnLimit", -1);
    expect(config).toHaveProperty("phraseApp.moduleConfig.cancelOnQuota", true);
    expect(config).toHaveProperty(
      "phraseApp.moduleConfig.logFunction",
      console.log
    );
  });

  it("Cancels after limit has been reached with 'cancelOnQuota'", async () => {
    [reqInterceptor, resInterceptor] = axiosPhraseAttach(undefined, {
      cancelOnQuota: true
    });
    const refreshDate = fastForward(0, 1);

    /** Convert Timestamp to Unix Epoch as returned by PhraseApp */
    const resetTimestamp = Math.round(Date.parse(refreshDate) / 1000);

    nock(PHRASEAPP_REQUEST)
      .get("/")
      .times(1)
      .reply(() => [
        200,
        true,
        {
          "x-rate-limit-limit": 1000,
          "x-rate-limit-remaining": 0,
          "x-rate-limit-reset": resetTimestamp
        }
      ]);

    const { config: lastAllowed } = await axios.get(PHRASEAPP_REQUEST);
    expect(lastAllowed).toHaveProperty("phraseApp.state.remaining", "0");

    await expect(axios.get(PHRASEAPP_REQUEST)).rejects.toEqual(
      new axios.Cancel(
        `[axios-phraseapp] No remaining quota. Wait until ${refreshDate}`
      )
    );
    // TODO: Consider what to do with module state
    /** Wait for the "reset" time to pass  */
    await sleep(1500);
  });

  it("Logs after specified limit has been reached", async () => {
    const LOG_LIMIT_INT = 100;
    console.log = jest.fn();
    [reqInterceptor, resInterceptor] = axiosPhraseAttach(undefined, {
      logOnLimit: LOG_LIMIT_INT,
      cancelOnQuota: true,
      logFunction: console.log
    });

    nock(PHRASEAPP_REQUEST)
      .get("/")
      .times(1)
      .reply(() => [
        200,
        true,
        {
          "x-rate-limit-limit": 1000,
          "x-rate-limit-remaining": LOG_LIMIT_INT
        }
      ]);

    await axios.get(PHRASEAPP_REQUEST);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      `[axios-phraseapp] Limit reached -> limit: ${LOG_LIMIT_INT} | remaining: ${LOG_LIMIT_INT}`
    );
  });

  it("Logs after specified percent limit has been reached", async () => {
    const LOG_LIMIT_PERCENT = 1 / 5;
    console.log = jest.fn();
    [reqInterceptor, resInterceptor] = axiosPhraseAttach(undefined, {
      logOnLimit: LOG_LIMIT_PERCENT,
      logFunction: console.log
    });

    nock(PHRASEAPP_REQUEST)
      .get("/")
      .times(1)
      .reply(() => [
        200,
        true,
        {
          "x-rate-limit-limit": 1000,
          "x-rate-limit-remaining": 1000 / 5
        }
      ]);

    await axios.get(PHRASEAPP_REQUEST);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      `[axios-phraseapp] Limit reached -> limit: ${LOG_LIMIT_PERCENT *
        100}% | remaining: ${1000 / 5}`
    );
  });
});
