/**
 * The host face registers nothing: this package's behavior lives in the browser
 * half that renders the team's tickets. The no-op keeps the package loadable as
 * a row, because the browser roster is built from rows the Host can import.
 * @module @tomato/client-ui-superagent
 */

export const name = 'client-ui-superagent'

/** Services the host face needs: none. */
export const inject: readonly string[] = []

/** Register nothing on the Host. */
export function apply(): void {}
