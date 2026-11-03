/** Validate the assembled application, including native Office conversion outside ASAR and the shipped Chromium. */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { desktopArtifactOutput, resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { DESKTOP_PRODUCT_NAME } from './desktop-product.mjs'
import { PLAYWRIGHT_BROWSERS_DIRECTORY } from '../src/playwright-browsers.ts'
import { readDesktopRuntime, verifyDesktopRuntime } from '../src/runtime-tree.ts'
import { verifyWindowsCode } from './windows-runtime-signature.mjs'
import { smokePreparedRuntime } from './smoke-prepared-runtime.ts'
import { resolveDesktopPackageTarget } from './package-target.ts'

const paths = resolveDesktopTargetBuildPaths()
const { values } = parseArgs({ options: { unsigned: { type: 'boolean', default: false }, 'skip-notarization': { type: 'boolean', default: false } }, allowPositionals: false })
const target = resolveDesktopBuildTarget()
const windows = target === 'win-x64'
const artifacts = desktopArtifactOutput(paths, { unsigned: values.unsigned, skipNotarization: values['skip-notarization'] }).directory
const application = windows ? join(artifacts, 'win-unpacked')
  : join(artifacts, target === 'mac-arm64' ? 'mac-arm64' : 'mac', `${DESKTOP_PRODUCT_NAME}.app`, 'Contents')
const resources = join(application, windows ? 'resources' : 'Resources')
const executable = windows ? join(application, `${DESKTOP_PRODUCT_NAME}.exe`) : join(application, 'MacOS', DESKTOP_PRODUCT_NAME)

/**
 * Run the shipped headless shell so a missing byte, an unusable platform build, or a broken signature fails packaging.
 * @param root - Packaged runtime resources directory.
 * @returns The reported browser version.
 */
function smokePlaywrightShell(root: string): string {
  const registry = join(root, 'runtime', PLAYWRIGHT_BROWSERS_DIRECTORY)
  if (!existsSync(registry)) throw new Error(`desktop smoke: the application ships no ${PLAYWRIGHT_BROWSERS_DIRECTORY} registry`)
  const fileName = windows ? 'chrome-headless-shell.exe' : 'chrome-headless-shell'
  const shell = readdirSync(registry, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => readdirSync(join(registry, entry.name), { withFileTypes: true })
      .filter(shell => shell.isDirectory() && shell.name.startsWith('chrome-headless-shell-'))
      .map(shell => join(registry, entry.name, shell.name, fileName)))
    .find(candidate => existsSync(candidate))
  if (shell === undefined) throw new Error(`desktop smoke: ${registry} has no ${fileName}`)
  const reported = execFileSync(shell, ['--version'], { encoding: 'utf8', timeout: 60_000 }).trim()
  if (!/^Google Chrome for Testing \d+\.\d+\.\d+\.\d+$/u.test(reported)) {
    throw new Error(`desktop smoke: ${shell} reported ${JSON.stringify(reported)}`)
  }
  return reported
}

const descriptor = await verifyDesktopRuntime(paths.tomato, readDesktopRuntime(paths.tomato).release.version,
  resolveDesktopPackageTarget(target))
if (windows && !values.unsigned) await verifyWindowsCode(application)
await smokePreparedRuntime(join(resources, 'app.asar', 'tomato'), executable, join(resources, 'runtime'), descriptor)
console.info(`desktop smoke: ${smokePlaywrightShell(resources)} runs from the packaged runtime`)
