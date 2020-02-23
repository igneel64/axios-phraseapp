/**
 * Does not work without Node test environment for now, see https://github.com/axios/axios/issues/1754#issuecomment-452602276
 */

import axios from "axios";
import nock from "nock";
import {
  attach as axiosPhraseAttach,
  detach as axiosPhraseDetach
} from "../lib/index";

const PHRASEAPP_REQUEST = "https://api.phrase.com/v2/";

describe("axios-phraseapp functionality", () => {
  let reqInterceptor;
  let resInterceptor;

  beforeEach(() => {
    [reqInterceptor, resInterceptor] = axiosPhraseAttach();
  });

  afterEach(() => {
    nock.cleanAll();
    axiosPhraseDetach(undefined, [reqInterceptor, resInterceptor]);
  });

  it("Sets up configuration info", async () => {
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
  it.skip("Cancels after limit has been reached", async () => {});
  it.skip("Logs after specified limit has been reached", async () => {});
});
