/**
 * One-shot intent that the launch after a settings-driven restart starts the phone
 * tunnel once.
 *
 * The persistent switch stays in `settings.json`; this marker only carries the
 * user's in-flight "start tunnel" action across the relaunch that applies a changed
 * keep-awake choice, so one start never exposes the tunnel on every later launch.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Marker file inside the Electron userData directory. */
const RESUME_FILE = 'remote-tunnel-resume'

/**
 * Record that the next launch should start the tunnel once.
 * @param userData - Electron's userData directory shared with the next launch.
 */
export function requestTunnelResume(userData: string): void {
  writeFileSync(join(userData, RESUME_FILE), '1\n', { mode: 0o600 })
}

/**
 * Read and clear the one-shot request.
 * @param userData - Electron's userData directory shared with the previous launch.
 * @returns whether the previous launch asked for a tunnel resume.
 */
export function consumeTunnelResume(userData: string): boolean {
  const path = join(userData, RESUME_FILE)
  try {
    readFileSync(path)
  } catch (_error) {
    // An absent marker is the normal case; any other read failure also means no resume.
    return false
  }
  try {
    rmSync(path, { force: true })
  } catch (_error) {
    // The next successful launch clears the stale marker; this one still resumes.
    return true
  }
  return true
}

/**
 * Drop a pending request without starting anything.
 * @param userData - Electron's userData directory shared with the next launch.
 */
export function clearTunnelResume(userData: string): void {
  try {
    rmSync(join(userData, RESUME_FILE), { force: true })
  } catch (_error) {
    // A leftover marker only resumes a tunnel once; it never blocks the next launch.
  }
}
