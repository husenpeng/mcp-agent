/**
 * Host half of the remote-access settings page. The page itself lives in the
 * browser half and talks to the Electron shell; this half only satisfies the
 * plugin protocol so the package can be mounted as an ordinary row.
 */

/** No Host services are needed: every fact the page shows comes from the shell bridge. */
export function apply(): void {
  // Intentionally empty.
}
