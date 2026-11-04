/** Exercise the install bundle layout, install script, and archive without an application build. */

import { execFile } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import {
  MACOS_INSTALL_BUNDLE_FILES,
  MACOS_INSTALL_LAUNCHER,
  macOSInstallBundleBaseName,
  packageMacOSInstallBundle,
  readDesktopManifestVersion,
} from '../scripts/package-macos-bundle.ts'

const execute = promisify(execFile)
const roots: string[] = []

async function fixtureApp(root: string, name = 'Tomato AI.app') {
  const appPath = join(root, 'built', 'mac-arm64', name)
  await mkdir(join(appPath, 'Contents', 'MacOS'), { recursive: true })
  await mkdir(join(appPath, 'Contents', 'Resources'), { recursive: true })
  await writeFile(join(appPath, 'Contents', 'MacOS', 'Tomato AI'), '#!/bin/sh\n')
  await symlink('Resources', join(appPath, 'Contents', 'ResourcesLink'))
  return appPath
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('macOS install bundle', () => {
  it('writes the application, installer, launcher, and both instructions into one zip', async () => {
    const root = await mkdtemp(join(tmpdir(), 'desktop-install-bundle-'))
    roots.push(root)
    const appPath = await fixtureApp(root)
    const installerDirectory = join(root, 'packaging')
    await mkdir(installerDirectory)
    await writeFile(join(installerDirectory, 'installer.sh'), '#!/bin/bash\necho installed\n')
    const assetsRoot = join(root, 'assets')
    const outputDirectory = join(root, 'artifacts')

    const base = macOSInstallBundleBaseName('0.1.0-test.1', 'arm64')
    expect(base).toBe('tomato-harness-0.1.0-test.1-mac-arm64')
    const { directory, archive } = await packageMacOSInstallBundle({
      arch: 'arm64', version: '0.1.0-test.1', appPath, assetsRoot, outputDirectory, installerDirectory,
    })

    expect(directory).toBe(join(assetsRoot, base))
    expect(archive).toBe(join(outputDirectory, `${base}.zip`))
    expect((await readdir(directory)).sort()).toEqual(Object.values(MACOS_INSTALL_BUNDLE_FILES).sort())
    for (const executable of [MACOS_INSTALL_BUNDLE_FILES.installer, MACOS_INSTALL_BUNDLE_FILES.launcher]) {
      expect((await stat(join(directory, executable))).mode & 0o111).not.toBe(0)
    }
    // The copied bundle keeps its symbolic links and its executable payload.
    expect((await readdir(join(directory, MACOS_INSTALL_BUNDLE_FILES.application, 'Contents'), { withFileTypes: true }))
      .find(entry => entry.name === 'ResourcesLink')?.isSymbolicLink()).toBe(true)

    const instructions = await readFile(join(directory, MACOS_INSTALL_BUNDLE_FILES.instructions), 'utf8')
    expect(instructions).toContain('Install Tomato AI.command')
    expect(instructions).toContain('0.1.0-test.1')
    expect(instructions).toContain('Apple 芯片')
    expect(await readFile(join(directory, MACOS_INSTALL_BUNDLE_FILES.readme), 'utf8')).toContain('Tomato AI 0.1.0-test.1')
    // Archive entries stay ASCII so every extractor, including third-party Windows tools, restores them intact.
    for (const path of Object.keys(MACOS_INSTALL_BUNDLE_FILES) as (keyof typeof MACOS_INSTALL_BUNDLE_FILES)[]) {
      expect(MACOS_INSTALL_BUNDLE_FILES[path]).toMatch(/^[\x20-\x7e]+$/u)
    }

    expect((await stat(archive)).size).toBeGreaterThan(0)
    const listing = await execute('/usr/bin/unzip', ['-Z1', archive])
    const entries = listing.stdout.split('\n').filter(line => line !== '')
    expect(entries.some(entry => entry === `${base}/`)).toBe(true)
    expect(entries).toContain(`${base}/${MACOS_INSTALL_BUNDLE_FILES.launcher}`)
    expect(entries).toContain(`${base}/${MACOS_INSTALL_BUNDLE_FILES.instructions}`)
    expect(entries.filter(entry => entry.startsWith(`${base}/${MACOS_INSTALL_BUNDLE_FILES.application}/Contents/MacOS/Tomato AI`)).length)
      .toBe(1)
  })

  it('replaces a stale bundle folder and archive instead of merging into them', async () => {
    const root = await mkdtemp(join(tmpdir(), 'desktop-install-bundle-stale-'))
    roots.push(root)
    const appPath = await fixtureApp(root)
    const installerDirectory = join(root, 'packaging')
    await mkdir(installerDirectory)
    await writeFile(join(installerDirectory, 'installer.sh'), '#!/bin/bash\n')
    const request = {
      arch: 'arm64' as const, version: '1.0.0', appPath,
      assetsRoot: join(root, 'assets'), outputDirectory: join(root, 'artifacts'), installerDirectory,
    }
    const stale = join(request.assetsRoot, macOSInstallBundleBaseName('1.0.0', 'arm64'))
    await mkdir(stale, { recursive: true })
    await writeFile(join(stale, 'stale-file'), 'old')
    const { directory } = await packageMacOSInstallBundle(request)
    expect(await readdir(directory)).not.toContain('stale-file')
  })

  it('reads the manifest version and rejects a manifest without one', async () => {
    const root = await mkdtemp(join(tmpdir(), 'desktop-install-bundle-manifest-'))
    roots.push(root)
    const manifest = join(root, 'package.json')
    await writeFile(manifest, JSON.stringify({ version: '2.3.4' }))
    expect(await readDesktopManifestVersion(manifest)).toBe('2.3.4')
    await chmod(manifest, 0o644)
    await writeFile(manifest, JSON.stringify({ name: 'fixture' }))
    await expect(readDesktopManifestVersion(manifest)).rejects.toThrow(/has no version/u)
  })
})

describe('install disk image helper', () => {
  it('stays unchanged: the DMG helper installs the app next to it', async () => {
    const script = await readFile(join(import.meta.dirname, '..', 'packaging', 'install-from-dmg.command'), 'utf8')
    expect(script).toContain('hdiutil attach')
    expect(script).toContain('/Applications')
    expect(script).toContain('install-from-dmg.command')
  })
})

describe('installer.sh', () => {
  it('installs the adjacent application into an override directory and clears quarantine', async () => {
    const root = await mkdtemp(join(tmpdir(), 'desktop-installer-'))
    roots.push(root)
    const appSource = await fixtureApp(root)
    const staging = join(root, 'folder')
    await mkdir(staging)
    await execute('/usr/bin/ditto', [appSource, join(staging, 'Tomato AI.app')])
    await execute('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', join(staging, 'Tomato AI.app')])
    await execute('/usr/bin/xattr', ['-w', 'com.apple.quarantine', '0081;00000000;Safari;', join(staging, 'Tomato AI.app')]).catch(() => {})
    const installer = join(staging, 'installer.sh')
    await execute('/bin/cp', [join(import.meta.dirname, '..', 'packaging', 'installer.sh'), installer])
    const destination = join(root, 'Applications')

    const { stdout } = await execute('/bin/bash', [installer], {
      env: { ...process.env, TOMATO_INSTALL_DIR: destination },
    })
    expect(stdout).toContain('安装完成')
    const installed = join(destination, 'Tomato AI.app')
    expect((await stat(join(installed, 'Contents', 'MacOS', 'Tomato AI'))).isFile()).toBe(true)
    expect((await readdir(destination)).sort()).toEqual(['Tomato AI.app'])
    // Fixture applications are unsigned, so codesign verification succeeds only with an ad-hoc seal.
    await execute('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', installed])
    const attributes = await execute('/usr/bin/xattr', [installed]).catch(error => error)
    expect(attributes.stdout ?? '').not.toContain('com.apple.quarantine')
    // The source folder survives installation.
    expect((await stat(join(staging, 'Tomato AI.app'))).isDirectory()).toBe(true)
  })

  it('runs the installer from its own folder so a double-click works regardless of working directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'desktop-launcher-'))
    roots.push(root)
    const folder = join(root, 'folder')
    await mkdir(folder)
    await writeFile(join(folder, 'installer.sh'), '#!/bin/bash\nprintf "installed from %s\\n" "$PWD"\n')
    await writeFile(join(folder, MACOS_INSTALL_BUNDLE_FILES.launcher), MACOS_INSTALL_LAUNCHER)
    await chmod(join(folder, MACOS_INSTALL_BUNDLE_FILES.launcher), 0o755)
    const { stdout } = await execute('/bin/bash', [join(folder, MACOS_INSTALL_BUNDLE_FILES.launcher)], { cwd: tmpdir() })
    expect(stdout).toContain(`installed from ${folder}`)
  })

  it('names the missing application instead of failing silently', async () => {
    const root = await mkdtemp(join(tmpdir(), 'desktop-installer-missing-'))
    roots.push(root)
    const installer = join(root, 'installer.sh')
    await execute('/bin/cp', [join(import.meta.dirname, '..', 'packaging', 'installer.sh'), installer])
    const error = await execute('/bin/bash', [installer], {
      env: { ...process.env, TOMATO_INSTALL_DIR: join(root, 'Applications') },
    }).then(() => undefined, reason => reason as { code: number; stderr: string })
    expect(error).toMatchObject({ code: 1 })
    expect(error?.stderr).toContain('找不到应用')
  })
})
