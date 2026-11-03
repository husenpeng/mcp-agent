/**
 * Coordinate a development relaunch between two launches of one workspace.
 *
 * The running Electron shell cannot tell whether a later launch carries newer
 * artifacts; `second-instance` reports only the later process's argv. The
 * development launcher marks its launches with a request identifier, the running
 * shell acknowledges and restarts, and the later launch reports whether the
 * restart actually happened instead of exiting as if it had taken effect.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Prefix of the launcher argument carrying one relaunch request identifier. */
export const DEVELOPMENT_RELAUNCH_ARGUMENT = '--tomato-dev-relaunch='

/** Acknowledgement shared through `userData` by the running and the later launch. */
const ACKNOWLEDGEMENT_FILE = 'development-relaunch-request'

/** Interval between acknowledgement reads; the later launch exits either way. */
const POLL_INTERVAL_MS = 100

/**
 * Read the relaunch request a later launch carries.
 * Packaged applications ignore the argument, so an unrelated launch can never
 * restart them.
 * @param argv - Arguments of the later launch, as Electron reports them.
 * @param development - Whether this process is an unpackaged development shell.
 * @returns the request identifier, or undefined for an ordinary or packaged launch.
 */
export function developmentRelaunchRequest(argv: readonly string[] | undefined, development: boolean): string | undefined {
  if (!development) return undefined
  const argument = argv?.find(value => value.startsWith(DEVELOPMENT_RELAUNCH_ARGUMENT))
  const request = argument?.slice(DEVELOPMENT_RELAUNCH_ARGUMENT.length)
  return request === undefined || request === '' ? undefined : request
}

/**
 * Record that the running shell is restarting for one request.
 * @param userData - Electron userData directory shared with the requesting launch.
 * @param request - Request identifier carried by the later launch.
 */
export function acknowledgeDevelopmentRelaunch(userData: string, request: string): void {
  writeFileSync(join(userData, ACKNOWLEDGEMENT_FILE), `${request}\n`)
}

/**
 * Whether this shell already restarted for one request. Electron can replay a
 * pending later-launch notification to the relaunched process, and that process
 * must not restart again for the same request.
 * @param userData - Electron userData directory shared with the requesting launch.
 * @param request - Request identifier carried by the later launch.
 * @returns true when the recorded acknowledgement names this request.
 */
export function developmentRelaunchAcknowledged(userData: string, request: string): boolean {
  try {
    return readAcknowledgement(userData) === request
  } catch {
    // No acknowledgement yet is the normal state before this shell restarts.
    return false
  }
}

/**
 * Read the request identifier recorded by the running shell.
 * @param userData - Electron userData directory shared with the requesting launch.
 * @returns the acknowledged request identifier.
 * @throws when the acknowledgement is absent or unreadable.
 */
function readAcknowledgement(userData: string): string {
  return readFileSync(join(userData, ACKNOWLEDGEMENT_FILE), 'utf8').trim()
}

/**
 * Wait until the running shell acknowledges one relaunch request.
 * @param userData - Electron userData directory shared with the running shell.
 * @param request - Request identifier carried by this launch.
 * @param deadlineMs - Longest wait, in milliseconds.
 * @returns whether the acknowledgement arrived before the deadline.
 */
export async function waitForDevelopmentRelaunch(userData: string, request: string, deadlineMs: number): Promise<boolean> {
  const deadline = Date.now() + deadlineMs
  for (;;) {
    try {
      if (readAcknowledgement(userData) === request) return true
    } catch (error) {
      // An absent acknowledgement is the normal state before the running shell answers;
      // any other read failure also means this request cannot be confirmed.
      if (String((error as NodeJS.ErrnoException).code) !== 'ENOENT') return false
    }
    if (Date.now() >= deadline) return false
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
  }
}
