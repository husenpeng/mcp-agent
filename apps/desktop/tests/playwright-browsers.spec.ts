/** The Host receives the shipped Playwright browser registry unless the launch environment selects its own. */

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PLAYWRIGHT_BROWSERS_DIRECTORY, resolvePlaywrightBrowsers, withPlaywrightBrowsers } from '../src/playwright-browsers.ts'
import { installPlaywrightShell } from '../scripts/prepare-playwright-browsers.ts'

const directories: string[] = []

function temporary(): string {
  const directory = mkdtempSync(join(tmpdir(), 'tomato.playwright-browsers-'))
  directories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('shipped Playwright browser registry', () => {
  it('resolves the packaged registry beside the runtime resources', () => {
    const resources = temporary()
    mkdirSync(join(resources, 'runtime', PLAYWRIGHT_BROWSERS_DIRECTORY), { recursive: true })
    expect(resolvePlaywrightBrowsers(false, join(resources, 'runtime', 'primary-runtime'), resources))
      .toBe(join(resources, 'runtime', PLAYWRIGHT_BROWSERS_DIRECTORY))
  })

  it('resolves the development registry beside the prepared primary runtime', () => {
    const runtime = temporary()
    mkdirSync(join(runtime, 'primary-runtime'), { recursive: true })
    mkdirSync(join(runtime, PLAYWRIGHT_BROWSERS_DIRECTORY))
    expect(resolvePlaywrightBrowsers(true, join(runtime, 'primary-runtime'), temporary()))
      .toBe(join(runtime, PLAYWRIGHT_BROWSERS_DIRECTORY))
  })

  it('leaves Playwright on its user cache when the build ships no browsers', () => {
    const runtime = temporary()
    mkdirSync(join(runtime, 'primary-runtime'), { recursive: true })
    expect(resolvePlaywrightBrowsers(true, join(runtime, 'primary-runtime'), temporary())).toBeUndefined()
    expect(resolvePlaywrightBrowsers(false, join(runtime, 'primary-runtime'), temporary())).toBeUndefined()
  })

  it('sets the registry without replacing an inherited choice', () => {
    const inherited = { PLAYWRIGHT_BROWSERS_PATH: '/opt/browsers', PATH: '/usr/bin' }
    expect(withPlaywrightBrowsers(inherited, '/shipped/browsers')).toBe(inherited)
    expect(withPlaywrightBrowsers({ PATH: '/usr/bin' }, '/shipped/browsers')).toEqual({
      PATH: '/usr/bin', PLAYWRIGHT_BROWSERS_PATH: '/shipped/browsers',
    })
    const untouched = { PATH: '/usr/bin' }
    expect(withPlaywrightBrowsers(untouched, undefined)).toBe(untouched)
  })
})
describe('shipped Chromium headless shell installation', () => {
  const shell = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell'

  function installation(root: string, complete = true): string {
    const directory = join(root, 'chromium_headless_shell-1243')
    mkdirSync(join(directory, 'chrome-headless-shell-mac-arm64'), { recursive: true })
    if (complete) writeFileSync(join(directory, 'INSTALLATION_COMPLETE'), '')
    writeFileSync(join(directory, 'chrome-headless-shell-mac-arm64', shell), '')
    return directory
  }

  it('copies complete shell installations beside the runtime and returns the executable', () => {
    const source = temporary()
    const destination = join(temporary(), PLAYWRIGHT_BROWSERS_DIRECTORY)
    installation(source)
    expect(installPlaywrightShell(source, destination)).toBe(
      join(destination, 'chromium_headless_shell-1243', 'chrome-headless-shell-mac-arm64', shell))
  })

  it('replaces an earlier runtime copy', () => {
    const source = temporary()
    const destination = join(temporary(), PLAYWRIGHT_BROWSERS_DIRECTORY)
    mkdirSync(join(destination, 'stale'), { recursive: true })
    installation(source)
    installPlaywrightShell(source, destination)
    expect(existsSync(join(destination, 'stale'))).toBe(false)
  })

  it('rejects a registry without a shell installation', () => {
    const source = temporary()
    mkdirSync(join(source, 'ffmpeg-1011'))
    expect(() => installPlaywrightShell(source, join(temporary(), PLAYWRIGHT_BROWSERS_DIRECTORY)))
      .toThrow(/has no chromium_headless_shell-<revision> installation/)
  })

  it('rejects an incomplete installation', () => {
    const source = temporary()
    installation(source, false)
    expect(() => installPlaywrightShell(source, join(temporary(), PLAYWRIGHT_BROWSERS_DIRECTORY)))
      .toThrow(/incomplete installation/)
  })

  it('rejects an installation without the shell executable', () => {
    const source = temporary()
    const directory = installation(source)
    rmSync(join(directory, 'chrome-headless-shell-mac-arm64', shell))
    expect(() => installPlaywrightShell(source, join(temporary(), PLAYWRIGHT_BROWSERS_DIRECTORY)))
      .toThrow(new RegExp(`has no ${shell}`))
  })
})
