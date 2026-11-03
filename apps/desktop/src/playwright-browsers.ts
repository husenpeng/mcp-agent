/** Locate the Chromium headless shell the packaged Playwright provider launches. */

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Runtime directory that carries the shipped browser registry in place of Playwright's user cache. */
export const PLAYWRIGHT_BROWSERS_DIRECTORY = 'playwright-browsers'

/**
 * Resolve the browser registry shipped beside the runtime.
 * @param development - Whether the shell runs from a checkout instead of a packaged application.
 * @param primaryRuntime - Prepared primary-runtime directory beside the shipped registry.
 * @param resourcesPath - Packaged application resources directory.
 * @returns The registry directory, or undefined when this build ships no browsers.
 */
export function resolvePlaywrightBrowsers(
  development: boolean, primaryRuntime: string, resourcesPath: string,
): string | undefined {
  const directory = development
    ? join(dirname(primaryRuntime), PLAYWRIGHT_BROWSERS_DIRECTORY)
    : join(resourcesPath, 'runtime', PLAYWRIGHT_BROWSERS_DIRECTORY)
  return existsSync(directory) ? directory : undefined
}

/**
 * Point Playwright at the shipped registry for the Host and the MCP servers it starts. An inherited
 * `PLAYWRIGHT_BROWSERS_PATH` stays authoritative, so support and development launches can select another registry.
 * @param environment - Host environment assembled from the launch environment and login shell.
 * @param browsers - Shipped registry directory, or undefined when the build carries none.
 * @returns The environment to launch the Host with.
 */
export function withPlaywrightBrowsers(
  environment: NodeJS.ProcessEnv, browsers: string | undefined,
): NodeJS.ProcessEnv {
  if (browsers === undefined || environment.PLAYWRIGHT_BROWSERS_PATH !== undefined) return environment
  return { ...environment, PLAYWRIGHT_BROWSERS_PATH: browsers }
}
