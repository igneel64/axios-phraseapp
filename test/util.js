/**
 * @module test/utils
 */

/**
 * @param {number} [minutes=5] Fast forward X minutes from now
 * @return {date}
 */
export function fastForward(minutes = 5) {
  let date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}
