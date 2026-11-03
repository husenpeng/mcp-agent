/** Download the Chromium headless shell the bundled Playwright provider launches, and place it beside the runtime. */

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLAYWRIGHT_BROWSERS_DIRECTORY, PLAYWRIGHT_SHELL_EXECUTABLE, PLAYWRIGHT_SHELL_PREFIX } from '../src/playwright-browsers.ts'
import { desktopTargetPlatform, resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { packagingStep } from './packaging-step.mjs'

const APP_ROOT = fileURLToPath(new URL('..', import.meta.url))
const REPOSITORY_ROOT = resolve(APP_ROOT, '..', '..')
const PROVIDER_MANIFEST = join(REPOSITORY_ROOT, 'packages', 'experimental', 'browser-use-playwright-mcp', 'package.json')

/**
 * Resolve the Playwright CLI that the packaged provider runs, so the downloaded shell matches the bundled server's revision.
 * @param providerManifest - Manifest of the provider whose `@playwright/mcp` dependency pins Playwright.
 * @returns Absolute path to Playwright's install CLI.
 */
export function playwrightCommand(providerManifest = PROVIDER_MANIFEST): string {
  const providerRequire = createRequire(providerManifest)
  const server = providerRequire.resolve('@playwright/mcp/package.json')
  return join(dirname(createRequire(server).resolve('playwright/package.json')), 'cli.js')
}

/**
 * Download the headless shell into the shared build cache, reusing a complete earlier installation.
 * @param cli - Playwright install CLI prepared by {@link playwrightCommand}.
 * @param cache - Browser registry directory reused across builds.
 */
export function downloadPlaywrightShell(cli: string, cache: string): void {
  mkdirSync(cache, { recursive: true })
  execFileSync(process.execPath, [cli, 'install', 'chromium', '--only-shell', '--no-progress'], {
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: cache, PLAYWRIGHT_SKIP_BROWSER_GC: '1' },
    stdio: 'inherit',
  })
}

/**
 * Copy complete headless-shell installations into the runtime and verify Playwright's completion marker and executable.
 * @param source - Shared browser registry populated by {@link downloadPlaywrightShell}.
 * @param destination - Runtime directory that becomes the packaged `PLAYWRIGHT_BROWSERS_PATH`.
 * @returns Absolute executable path of the copied shell.
 */
export function installPlaywrightShell(source: string, destination: string): string {
  const shells = readdirSync(source, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith(PLAYWRIGHT_SHELL_PREFIX))
    .map(entry => entry.name)
  if (shells.length === 0) throw new Error(`desktop playwright: ${source} has no ${PLAYWRIGHT_SHELL_PREFIX}<revision> installation`)
  rmSync(destination, { recursive: true, force: true })
  mkdirSync(destination, { recursive: true })
  const executables: string[] = []
  for (const name of shells) {
    const directory = join(destination, name)
    cpSync(join(source, name), directory, { recursive: true })
    if (!existsSync(join(directory, 'INSTALLATION_COMPLETE'))) {
      throw new Error(`desktop playwright: ${directory} is an incomplete installation`)
    }
    executables.push(shellExecutable(directory))
  }
  return executables[0] as string
}

/** Find the shell executable Playwright launches inside one browser installation directory. */
function shellExecutable(directory: string): string {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const candidate = join(directory, entry.name, PLAYWRIGHT_SHELL_EXECUTABLE)
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`desktop playwright: ${directory} has no ${PLAYWRIGHT_SHELL_EXECUTABLE}`)
}

/**
 * Place the packaged target's Chromium headless shell beside the prepared runtime.
 * @returns Absolute executable path of the installed shell.
 */
export async function preparePlaywrightBrowsers(): Promise<string> {
  const target = desktopTargetPlatform(resolveDesktopBuildTarget())
  if (target.platform !== process.platform || target.arch !== process.arch) {
    throw new Error(`desktop playwright: browsers must be prepared on the target platform and architecture; host is ${process.platform}-${process.arch}`)
  }
  const paths = resolveDesktopTargetBuildPaths()
  const cli = playwrightCommand()
  const revision = JSON.parse(readFileSync(join(dirname(cli), 'package.json'), 'utf8')) as { version: string }
  const cache = join(paths.downloads, PLAYWRIGHT_BROWSERS_DIRECTORY)
  const run = process.env.TOMATO_DESKTOP_PACKAGING_RUN_DIR
  await packagingStep(run, 'download:playwright-shell', async () => { downloadPlaywrightShell(cli, cache) })
  let executable = ''
  await packagingStep(run, 'install:playwright-shell', async () => {
    executable = installPlaywrightShell(cache, join(paths.runtime, PLAYWRIGHT_BROWSERS_DIRECTORY))
  })
  console.info(`desktop playwright: bundled Chromium headless shell ${revision.version} at ${executable}`)
  return executable
}

if (import.meta.main) await preparePlaywrightBrowsers()
