/** Locate the Chromium headless shell the packaged Playwright provider launches. */

import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Runtime directory that carries the shipped browser registry in place of Playwright's user cache. */
export const PLAYWRIGHT_BROWSERS_DIRECTORY = 'playwright-browsers'

/** Upstream Playwright MCP option that selects the browser executable; the provider reads it from the Host environment. */
export const PLAYWRIGHT_EXECUTABLE_ENV = 'PLAYWRIGHT_MCP_EXECUTABLE_PATH'

/** Browser installation directory prefix; the suffix is Playwright's Chromium revision. */
export const PLAYWRIGHT_SHELL_PREFIX = 'chromium_headless_shell-'

/** Executable Playwright starts from a headless-shell installation on this host platform. */
export const PLAYWRIGHT_SHELL_EXECUTABLE = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell'

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
 * Find the headless shell inside a shipped browser registry. Upstream's `chromium` browser selects the full Chrome
 * for Testing build, so the provider must name the shell explicitly to use the smaller installation the build ships.
 * @param directory - Browser registry directory, normally the packaged `PLAYWRIGHT_BROWSERS_PATH`.
 * @returns The newest revision's shell executable, or undefined when the registry carries none.
 */
export function resolvePlaywrightShell(directory: string): string | undefined {
  if (!existsSync(directory)) return undefined
  const revisions = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith(PLAYWRIGHT_SHELL_PREFIX))
    .map(entry => entry.name)
    .sort((left, right) => revisionNumber(right) - revisionNumber(left))
  for (const name of revisions) {
    const root = join(directory, name)
    if (!existsSync(join(root, 'INSTALLATION_COMPLETE'))) continue
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const candidate = join(root, entry.name, PLAYWRIGHT_SHELL_EXECUTABLE)
      if (existsSync(candidate)) return candidate
    }
  }
  return undefined
}

/** Compare two `chromium_headless_shell-<revision>` names by their numeric revision. */
function revisionNumber(name: string): number {
  const parsed = Number.parseInt(name.slice(PLAYWRIGHT_SHELL_PREFIX.length), 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Point Playwright at the shipped registry and its headless shell for the Host and the MCP servers it starts. An
 * inherited `PLAYWRIGHT_BROWSERS_PATH` stays authoritative, so support and development launches can select another
 * registry; an inherited executable also wins.
 * @param environment - Host environment assembled from the launch environment and login shell.
 * @param browsers - Shipped registry directory, or undefined when the build carries none.
 * @param executable - Shell executable inside `browsers`, or undefined when the registry carries none.
 * @returns The environment to launch the Host with.
 */
export function withPlaywrightBrowsers(
  environment: NodeJS.ProcessEnv, browsers: string | undefined, executable?: string,
): NodeJS.ProcessEnv {
  if (browsers === undefined || environment.PLAYWRIGHT_BROWSERS_PATH !== undefined) return environment
  const selected: NodeJS.ProcessEnv = { ...environment, PLAYWRIGHT_BROWSERS_PATH: browsers }
  if (executable !== undefined && environment[PLAYWRIGHT_EXECUTABLE_ENV] === undefined) {
    selected[PLAYWRIGHT_EXECUTABLE_ENV] = executable
  }
  return selected
}
