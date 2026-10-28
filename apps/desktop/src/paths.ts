/** Filesystem ownership for the Electron-managed desktop installation. */

import { join } from 'node:path'
import { resolveTomatoHome } from '@tomato/home-paths'

/** Stable desktop installation paths under the shared Harness home. */
export interface DesktopPaths {
  readonly profile: string
  readonly lock: string
}

/**
 * Resolve every Electron-owned path without changing the shared data roots.
 * @param tomatoHome - Harness home shared with npm-installed tomato.
 * @returns immutable desktop path set.
 */
export function resolveDesktopPaths(tomatoHome: string = resolveTomatoHome()): DesktopPaths {
  return {
    profile: join(tomatoHome, 'profiles', 'desktop'),
    lock: join(tomatoHome, 'profiles', 'desktop', 'lock'),
  }
}
