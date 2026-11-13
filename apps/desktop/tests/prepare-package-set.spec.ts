import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { DESKTOP_HOST_RUNTIME_FILES, DESKTOP_PACKAGES_DIR } from '../src/core-package-set.ts'
import {
  assertDesktopHostPackageFiles,
  prepareDesktopPackageSet,
  selectDesktopPackageClosure,
  type PackedDesktopPackage,
} from '../scripts/prepare-package-set.ts'

function packed(name: string, manifest: Record<string, unknown> = {}): PackedDesktopPackage {
  return { tarball: `${name}.tgz`, manifest: { name, version: '1.0.0', ...manifest } }
}

describe('desktop package-set selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not select a packaging target when imported as a library', async () => {
    vi.stubEnv('TOMATO_DESKTOP_TARGET_PLATFORM', 'linux')
    vi.stubEnv('TOMATO_DESKTOP_TARGET_ARCH', 'x64')
    vi.resetModules()
    await expect(import('../scripts/prepare-package-set.ts')).resolves.toHaveProperty('prepareDesktopPackageSet')
  })

  it('includes only the available internal production closure', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', {
        dependencies: { '@tomato/base': '^1.0.0', external: '^2.0.0' },
        optionalDependencies: { '@tomato/platform-package': '1.0.0', '@tomato/missing-platform': '1.0.0' },
      })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host', {
        dependencies: { '@tomato/cli': '^1.0.0' },
      })],
      ['@tomato/base', packed('@tomato/base', {
        peerDependencies: { '@tomato/cordis': '^1.0.0' },
      })],
      ['@tomato/cordis', packed('@tomato/cordis')],
      ['@tomato/platform-package', packed('@tomato/platform-package')],
      ['@tomato/unused', packed('@tomato/unused')],
    ])
    expect(selectDesktopPackageClosure(available, { platform: 'win32', arch: 'x64' }).map(entry => entry.manifest.name)).toEqual([
      '@tomato/base',
      '@tomato/cli',
      '@tomato/cordis',
      '@tomato/desktop-host',
      '@tomato/platform-package',
    ])
  })

  it('rejects an optional workspace package absent from the packed inputs when the target can use it', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', { optionalDependencies: { '@tomato/base': '^1.0.0' } })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host', { dependencies: { '@tomato/cli': '^1.0.0' } })],
    ])
    expect(() => selectDesktopPackageClosure(available, { platform: 'darwin', arch: 'arm64' }))
      .toThrow('optionally requires unpacked workspace package @tomato/base')
  })

  it('skips an optional workspace package the target platform cannot use', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', {
        optionalDependencies: { '@tomato/node-addon-system-darwin-arm64': '^0.1.2' },
      })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host', { dependencies: { '@tomato/cli': '^1.0.0' } })],
    ])
    const selected = selectDesktopPackageClosure(available, { platform: 'win32', arch: 'x64' })
    expect(selected.map(entry => entry.manifest.name)).toEqual(['@tomato/cli', '@tomato/desktop-host'])
  })

  it.each([
    '@tomato/base', '@tomato/cordis', '@tomato/node-addon-system',
  ])('rejects required prepared package %s absent from the packed release inputs', (dependency) => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', {
        dependencies: { [dependency]: '^1.0.0' },
      })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host', {
        dependencies: { '@tomato/cli': '^1.0.0' },
      })],
    ])
    expect(() => selectDesktopPackageClosure(available, { platform: 'win32', arch: 'x64' })).toThrow(/unpacked package/u)
    expect(() => selectDesktopPackageClosure(new Map([
      ['@tomato/cli', packed('@tomato/cli')],
    ]), { platform: 'win32', arch: 'x64' })).toThrow(/omit @tomato\/desktop-host/u)
  })

  it('leaves independently published Office packages to npm resolution', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', {
        dependencies: {
          '@deepseek-ai/libreoffice-kit': '0.0.1',
          '@deepseek-ai/libreoffice-kit-wasm': '0.0.1',
        },
      })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host')],
    ])
    expect(selectDesktopPackageClosure(available, { platform: 'win32', arch: 'x64' }).map(entry => entry.manifest.name)).toEqual([
      '@tomato/cli', '@tomato/desktop-host',
    ])
  })

  it('requires both Desktop Host and public CLI entries', () => {
    const files = [
      'package/lib/index.js',
      'package/lib/cli.js',
    ]
    expect(() => {
      assertDesktopHostPackageFiles(files)
    }).not.toThrow()
    expect(() => {
      assertDesktopHostPackageFiles(files.slice(1))
    }).toThrow(/lib\/index\.js/u)
    expect(() => { assertDesktopHostPackageFiles(files.slice(0, 1)) }).toThrow(/lib\/cli\.js/u)
  })
})

const macProvider = '@tomato/experimental-cua-macos'
const cuaBundle = '@tomato/cua-bundle'
const targetManifests = () => new Map<string, PackedDesktopPackage>([
  ['@tomato/cli', packed('@tomato/cli', { dependencies: { [cuaBundle]: '1.0.0' } })],
  ['@tomato/desktop-host', packed('@tomato/desktop-host')],
  [cuaBundle, packed(cuaBundle, {
    optionalDependencies: { [macProvider]: '1.0.0' }, dependencies: { '@tomato/cua': '1.0.0' },
  })],
  ['@tomato/cua', packed('@tomato/cua')],
  [macProvider, packed(macProvider, { os: ['darwin'] })],
])

it.each([
  ['darwin', 'arm64', true], ['darwin', 'x64', true], ['win32', 'x64', false],
] as const)('selects the CUA native tarball for target %s/%s independently of the host', (platform, arch, included) => {
  const selected = selectDesktopPackageClosure(targetManifests(), { platform, arch }).map(entry => entry.manifest.name)
  expect(selected.includes(macProvider)).toBe(included)
  expect(selected).toContain('@tomato/cua')
  expect(selected).toContain(cuaBundle)
})

it.each([
  [{ cpu: ['arm64'] }, false], [{ os: ['!win32'] }, false], [{ os: ['!linux'] }, true],
  [{ os: [] }, true], [{ os: ['any'] }, true], [{ os: ['any', '!win32'] }, false],
  [{ cpu: ['x64'] }, true],
])('honors optional package platform constraints %j', (constraints, included) => {
  const packages = targetManifests()
  packages.set(macProvider, packed(macProvider, constraints))
  expect(selectDesktopPackageClosure(packages, { platform: 'win32', arch: 'x64' })
    .some(entry => entry.manifest.name === macProvider)).toBe(included)
})

it.each([{ os: 'darwin' }, { cpu: [42] }])('rejects malformed platform constraints %j', (constraints) => {
  const packages = targetManifests()
  packages.set(macProvider, packed(macProvider, constraints))
  expect(() => selectDesktopPackageClosure(packages, { platform: 'win32', arch: 'x64' })).toThrow(/has invalid/u)
})

it('copies no macOS tarball into the Windows package set', () => {
  const root = mkdtempSync(join(tmpdir(), 'desktop-platform-packages-'))
  onTestFinished(() => { rmSync(root, { recursive: true, force: true }) })
  const inputs = join(root, 'inputs')
  mkdirSync(inputs)
  for (const [name, entry] of targetManifests()) {
    const stem = name.replace('@tomato/', '')
    const folder = join(root, stem, 'package')
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, 'package.json'), JSON.stringify(entry.manifest))
    if (name === '@tomato/desktop-host') {
      for (const file of DESKTOP_HOST_RUNTIME_FILES) {
        mkdirSync(join(folder, file, '..'), { recursive: true })
        writeFileSync(join(folder, file), '')
      }
    }
    execFileSync('tar', ['-czf', join(inputs, `${stem}.tgz`), '-C', join(folder, '..'), 'package'])
  }
  const output = join(root, 'output')
  prepareDesktopPackageSet([inputs], output, { platform: 'win32', arch: 'x64' })
  expect(readdirSync(join(output, DESKTOP_PACKAGES_DIR))).not.toContain('experimental-cua-macos.tgz')
  prepareDesktopPackageSet([inputs], output, { platform: 'darwin', arch: 'arm64' })
  expect(readFileSync(join(output, DESKTOP_PACKAGES_DIR, 'experimental-cua-macos.tgz')))
    .toEqual(readFileSync(join(inputs, 'experimental-cua-macos.tgz')))
})

const crewPackage = '@tomato/client-ui-robot-crew'
const crewLocal = '@tomato/experimental-robot-crew-local'
const crewTool = '@tomato/experimental-tool-robot-crew'

function tarballManifest(tarball: string): Record<string, unknown> {
  const value: unknown = JSON.parse(
    execFileSync('tar', ['-xOzf', basename(tarball), 'package/package.json'], { cwd: dirname(tarball), encoding: 'utf8' }),
  )
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${tarball} has no manifest`)
  return value as Record<string, unknown>
}

describe('desktop payload exclusions', () => {
  const target = { platform: 'darwin', arch: 'arm64' } as const

  it('selects no excluded package and stops the package that named it from declaring it', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', { dependencies: { '@tomato/experimental-robot-app': '1.0.0' } })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host', { dependencies: { '@tomato/cli': '1.0.0' } })],
      ['@tomato/experimental-robot-app', packed('@tomato/experimental-robot-app', {
        dependencies: { [crewPackage]: '1.0.0', '@tomato/experimental-robot': '1.0.0' },
      })],
      [crewPackage, packed(crewPackage, { dependencies: { '@tomato/experimental-robot-crew': '1.0.0' } })],
      ['@tomato/experimental-robot-crew', packed('@tomato/experimental-robot-crew')],
      ['@tomato/experimental-robot', packed('@tomato/experimental-robot')],
    ])
    const selected = selectDesktopPackageClosure(available, target, new Set([crewPackage]))
    expect(selected.map(entry => entry.manifest.name)).toEqual([
      '@tomato/cli', '@tomato/desktop-host', '@tomato/experimental-robot', '@tomato/experimental-robot-app',
    ])
    const app = selected.find(entry => entry.manifest.name === '@tomato/experimental-robot-app')
    expect(app?.manifest.dependencies).toEqual({ '@tomato/experimental-robot': '1.0.0' })
    expect(app?.dropped).toEqual([crewPackage])
  })

  it('keeps Robot Room packages when only the crew cluster is excluded', () => {
    const roomLocal = '@tomato/experimental-robot-room-local'
    const roomUi = '@tomato/client-ui-robot-room'
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', { dependencies: { '@tomato/experimental-robot-app': '1.0.0' } })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host', { dependencies: { '@tomato/cli': '1.0.0' } })],
      ['@tomato/experimental-robot-app', packed('@tomato/experimental-robot-app', {
        dependencies: { [roomLocal]: '1.0.0', [roomUi]: '1.0.0' },
      })],
      [roomLocal, packed(roomLocal)],
      [roomUi, packed(roomUi)],
    ])
    const selected = selectDesktopPackageClosure(available, target, new Set([crewPackage, crewLocal, crewTool]))
    expect(selected.map(entry => entry.manifest.name)).toEqual([
      '@tomato/cli', '@tomato/desktop-host', '@tomato/experimental-robot-app', roomLocal, roomUi,
    ].sort((left, right) => left.localeCompare(right)))
    expect(selected.find(entry => entry.manifest.name === '@tomato/experimental-robot-app')?.manifest.dependencies)
      .toEqual({ [roomLocal]: '1.0.0', [roomUi]: '1.0.0' })
  })

  it('fails when a package other than the composing bundle requires an excluded package', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', { dependencies: { '@tomato/experimental-robot': '1.0.0' } })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host')],
      ['@tomato/experimental-robot', packed('@tomato/experimental-robot', { dependencies: { [crewPackage]: '1.0.0' } })],
    ])
    expect(() => selectDesktopPackageClosure(available, target, new Set([crewPackage])))
      .toThrow(`@tomato/experimental-robot requires excluded package ${crewPackage}`)
  })

  it('refuses to exclude a payload root', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli')],
      ['@tomato/desktop-host', packed('@tomato/desktop-host')],
    ])
    expect(() => selectDesktopPackageClosure(available, target, new Set(['@tomato/desktop-host'])))
      .toThrow('@tomato/desktop-host is a payload root and cannot be excluded')
  })

  it('ships a payload tarball whose manifest and bundle patch drop the excluded packages', () => {
    const root = mkdtempSync(join(tmpdir(), 'desktop-payload-exclusion-'))
    onTestFinished(() => { rmSync(root, { recursive: true, force: true }) })
    const inputs = join(root, 'inputs')
    mkdirSync(inputs)
    const patchHeader = [
      '# The Tomato Rbot bundle.',
      '# Selecting this optional bundle is the opt-in.',
      '',
    ].join('\n')
    const patchRows = [
      { id: 'robot-crew-local', name: crewLocal },
      { id: 'ui-robot-crew', name: crewPackage },
      { id: 'ui-robot', name: '@tomato/client-ui-robot' },
    ]
    const manifests = new Map<string, PackedDesktopPackage>([
      ['@tomato/cli', packed('@tomato/cli', { dependencies: { '@tomato/experimental-robot-app': '1.0.0' } })],
      ['@tomato/desktop-host', packed('@tomato/desktop-host')],
      ['@tomato/experimental-robot-app', packed('@tomato/experimental-robot-app', {
        dependencies: {
          [crewLocal]: '1.0.0',
          [crewTool]: '1.0.0',
          [crewPackage]: '1.0.0',
          '@tomato/client-ui-robot': '1.0.0',
        },
      })],
      ['@tomato/client-ui-robot', packed('@tomato/client-ui-robot')],
      [crewPackage, packed(crewPackage)],
      [crewLocal, packed(crewLocal)],
      [crewTool, packed(crewTool)],
    ])
    for (const [name, entry] of manifests) {
      const stem = name.replace('@tomato/', '')
      const folder = join(root, stem, 'package')
      mkdirSync(folder, { recursive: true })
      writeFileSync(join(folder, 'package.json'), JSON.stringify(entry.manifest))
      if (name === '@tomato/desktop-host') {
        for (const file of DESKTOP_HOST_RUNTIME_FILES) {
          mkdirSync(join(folder, file, '..'), { recursive: true })
          writeFileSync(join(folder, file), '')
        }
      }
      if (name === '@tomato/experimental-robot-app') {
        writeFileSync(join(folder, 'cordis.patch.yml'), `${patchHeader}- insert:\n${patchRows.map(row => `    - id: ${row.id}\n      name: '${row.name}'`).join('\n\n')}\n`)
      }
      execFileSync('tar', ['-czf', join(inputs, `${stem}.tgz`), '-C', join(folder, '..'), 'package'])
    }
    const output = join(root, 'output')
    prepareDesktopPackageSet([inputs], output, target, new Set([crewPackage, crewLocal, crewTool]))

    const files = readdirSync(join(output, DESKTOP_PACKAGES_DIR))
    expect(files).not.toContain('client-ui-robot-crew.tgz')
    expect(files).not.toContain('experimental-tool-robot-crew.tgz')
    const appTarball = join(output, DESKTOP_PACKAGES_DIR, 'experimental-robot-app.tgz')
    expect(tarballManifest(appTarball).dependencies).toEqual({ '@tomato/client-ui-robot': '1.0.0' })
    const patch = execFileSync('tar', ['-xOzf', basename(appTarball), 'package/cordis.patch.yml'], { cwd: dirname(appTarball), encoding: 'utf8' })
    expect(patch.startsWith(patchHeader)).toBe(true)
    expect(patch).toContain("name: '@tomato/client-ui-robot'")
    expect(patch).not.toContain(crewPackage)
    expect(patch).not.toContain(crewLocal)
  })
})
