export interface AxiosPhraseAppConfig {
  /**
   * Set a limit to 4 concurrent requests. Will abort with Axios.Cancel()
   * Defaults to false
   */
  preventConcurrent?: boolean;

  /**
   * Will cancel with Axios.Cancel() when no more quota are available until the next update.
   * Defaults to false
   */
  cancelOnQuota?: boolean;

  /**
   * Will log when in the zone of either a percentage or limit number of remaining requests.
   * You can either pass a number e.g. 200 or certain percentage e.g. 1 / 5 which is the same as 0.2 .
   * Every time that a request is in this zone, the `logFunction` will be triggered onRequest.
   * Logging will be done using `logFunction`.
   * Defaults to -1, which means it will not log.
   */
  logOnLimit?: number;

  /**
   * Method to log `logOnLevel` with
   * Defaults to `console.log` .
   */
  logFunction?: function;
}
