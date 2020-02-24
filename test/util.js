/**
 * @module test/utils
 */

/**
 * @param {number} [minutes=5] Fast forward X minutes from now
 * @return {date}
 */
export function fastForward(minutes = 5, seconds = 0) {
  let date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

/**
 * @param {number} [ms=100] Milliseconds to wait for
 * @return {Promise<any>}
 */
export async function sleep(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
