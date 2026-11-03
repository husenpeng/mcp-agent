/** Electron single-instance ownership before any Desktop profile lifecycle begins. */

/** Minimal Electron application operations needed for instance ownership. */
export interface DesktopSingleInstanceApplication {
  requestSingleInstanceLock(): boolean
  /** A later launch's event and argv; a test double may omit the argv. */
  on(event: 'second-instance', listener: (event: unknown, argv?: readonly string[]) => void): unknown
}

/**
 * Claim the process-lifetime Desktop lock and route later launches to the owner.
 * A process that does not receive the lock stays alive until its caller terminates it,
 * so a launch can first wait for the owner's answer.
 * @param application - Electron application singleton.
 * @param laterLaunch - Handles the argv of a later launch; the owner decides whether to focus or restart.
 * @returns true only in the process that may access the Desktop profile.
 */
export function claimDesktopSingleInstance(
  application: DesktopSingleInstanceApplication,
  laterLaunch: (argv: readonly string[]) => void,
): boolean {
  if (!application.requestSingleInstanceLock()) return false
  application.on('second-instance', (_event, argv) => { laterLaunch(argv ?? []) })
  return true
}
