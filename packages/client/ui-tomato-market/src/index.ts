/** Plugin markets page, Host half: both tabs live in the browser half and read the `@tomato/plugin-tomato-market` route. */

/** Host plugin body; the browser half lives in `./client`. The row itself needs no Host work, so this body is empty. */
export function apply(): void {
  // The market's Host half is its own package; this one only carries the two tabs.
}
