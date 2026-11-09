/** Select and copy the local npm tarball closures that supply Desktop tomato and its private Host. */

import { createHash } from 'node:crypto'
import {
  constants,
  copyFileSync,
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import * as yaml from 'js-yaml'
import {
  DESKTOP_HOST_PACKAGE,
  DESKTOP_HOST_RUNTIME_FILES,
  DESKTOP_PACKAGES_DIR,
  DESKTOP_PACKAGE_SET_FILE,
  parseDesktopCorePackageSet,
  type DesktopCorePackageRecord,
} from '../src/core-package-set.ts'
import { capture } from '../../../scripts/release/process.ts'
import { tarballFiles } from '../../../scripts/release/tarball.ts'
import { desktopTargetPlatform, resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { pnpmInvocation } from '../../../scripts/pnpm-invocation.ts'

const TOMATO_PACKAGE = '@tomato/cli'
const ROOT_PACKAGES = [TOMATO_PACKAGE, DESKTOP_HOST_PACKAGE] as const
/** First-party packages the Desktop runtime needs but the public release family omits. */
const EXTRA_PACKAGES = [
  'tomato-market',
  '@tomato/account-service',
  '@tomato/brand',
  '@tomato/gateway',
  '@tomato/telemetry',
] as const
/** Private workspace packages that supply runtime plugins but are never published. */
const PRIVATE_RUNTIME_PACKAGES = [
  'packages/tomato/account',
  'packages/tomato/account-access',
  'packages/tomato/account-gateway',
  'packages/tomato/brand',
  'packages/tomato/gateway',
  'packages/tomato/telemetry',
] as const
const APP_ROOT = resolve(import.meta.dirname, '..')
const REPOSITORY_ROOT = resolve(APP_ROOT, '..', '..')

const REQUIRED_DEPENDENCY_SECTIONS = ['dependencies', 'peerDependencies'] as const
const OPTIONAL_DEPENDENCY_SECTION = 'optionalDependencies'

/** Packed package information needed to form the local Desktop closure. */
export interface PackedDesktopPackage {
  readonly tarball: string
  readonly manifest: Readonly<Record<string, unknown>>
}

function supportsTarget(manifest: Readonly<Record<string, unknown>>, field: 'os' | 'cpu', target: string): boolean {
  const values = manifest[field]
  if (values === undefined) return true
  if (!Array.isArray(values) || !values.every((value): value is string => typeof value === 'string')) {
    throw new Error(`desktop package set: ${String(manifest.name)} has invalid ${field}`)
  }
  if (values.includes(`!${target}`)) return false
  return values.length === 0 || (values.length === 1 && values[0] === 'any') || values.includes(target)
    || values.every(value => value.startsWith('!'))
}

function dependencyNames(manifest: Readonly<Record<string, unknown>>, section: string): string[] {
  const value = manifest[section]
  if (value === undefined) return []
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`desktop package set: ${String(manifest.name)} has invalid ${section}`)
  }
  return Object.keys(value).sort()
}

/**
 * Select workspace dependencies rooted at tomato and its private Host; npm resolves external packages.
 * Reads the repository workspace manifest and package manifests to distinguish required local packages from npm-resolved externals.
 * @param available - Packed packages indexed by package name.
 * @param target - Platform and architecture of the installer payload.
 * @returns Selected packages sorted by name.
 */
export function selectDesktopPackageClosure(
  available: ReadonlyMap<string, PackedDesktopPackage>,
  target: ReturnType<typeof desktopTargetPlatform>,
): PackedDesktopPackage[] {
  const workspace = yaml.load(readFileSync(join(REPOSITORY_ROOT, 'pnpm-workspace.yaml'), 'utf8')) as { packages: string[] }
  const workspaceManifests = new Map<string, Record<string, unknown>>()
  for (const path of globSync(workspace.packages.map(pattern => `${pattern}/package.json`), { cwd: REPOSITORY_ROOT })) {
    const manifest = JSON.parse(readFileSync(join(REPOSITORY_ROOT, path), 'utf8')) as Record<string, unknown>
    const name = manifest.name
    if (typeof name === 'string' && name !== '') workspaceManifests.set(name, manifest)
  }
  const selected = new Map<string, PackedDesktopPackage>()
  const visit = (name: string): void => {
    if (selected.has(name)) return
    const packed = available.get(name)
    if (packed === undefined) throw new Error(`desktop package set: packed inputs omit required package ${name}`)
    selected.set(name, packed)
    for (const section of REQUIRED_DEPENDENCY_SECTIONS) {
      for (const dependency of dependencyNames(packed.manifest, section)) {
        if (available.has(dependency)) visit(dependency)
        else if (workspaceManifests.has(dependency)) {
          throw new Error(`desktop package set: ${name} requires unpacked package ${dependency}`)
        }
      }
    }
    for (const dependency of dependencyNames(packed.manifest, OPTIONAL_DEPENDENCY_SECTION)) {
      const optional = available.get(dependency)
      if (optional !== undefined) {
        if (supportsTarget(optional.manifest, 'os', target.platform)
          && supportsTarget(optional.manifest, 'cpu', target.arch)) visit(dependency)
        continue
      }
      // A usable workspace package cannot come from a registry, so leaving it out of
      // the packed inputs would only surface as a runtime module error.
      const workspaceManifest = workspaceManifests.get(dependency)
      if (workspaceManifest !== undefined
        && supportsTarget(workspaceManifest, 'os', target.platform)
        && supportsTarget(workspaceManifest, 'cpu', target.arch)) {
        throw new Error(`desktop package set: ${name} optionally requires unpacked workspace package ${dependency}`)
      }
    }
  }
  for (const name of ROOT_PACKAGES) {
    if (!available.has(name)) throw new Error(`desktop package set: packed inputs omit ${name}`)
    visit(name)
  }
  for (const name of EXTRA_PACKAGES) {
    if (available.has(name)) visit(name)
    else console.warn(`desktop package set: extra package ${name} is not in the packed inputs`)
  }
  return [...selected.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, packed]) => packed)
}

function packedManifest(tarball: string): Record<string, unknown> {
  const value: unknown = JSON.parse(capture('tar', ['-xOzf', tarball, 'package/package.json']))
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`desktop package set: ${tarball} has no package manifest`)
  }
  return value as Record<string, unknown>
}

function packedPackages(inputs: readonly string[]): Map<string, PackedDesktopPackage> {
  const available = new Map<string, PackedDesktopPackage>()
  for (const input of inputs) {
    const tarballs = readdirSync(input).filter(file => file.endsWith('.tgz')).sort()
    if (tarballs.length === 0) throw new Error(`desktop package set: ${input} contains no tarballs`)
    for (const file of tarballs) {
      const tarball = join(input, file)
      const manifest = packedManifest(tarball)
      const name = manifest.name
      if (typeof name !== 'string' || name === '') throw new Error(`desktop package set: ${tarball} has no package name`)
      if (available.has(name)) throw new Error(`desktop package set: duplicate packed package ${name}`)
      available.set(name, { tarball, manifest })
    }
  }
  return available
}

/**
 * Require every private Host file used before the Desktop profile can pass its health check.
 * @param files - Tarball paths rooted at `package/`.
 * @returns Nothing.
 */
export function assertDesktopHostPackageFiles(files: readonly string[]): void {
  const available = new Set(files)
  const missing = DESKTOP_HOST_RUNTIME_FILES
    .map(file => `package/${file}`)
    .filter(file => !available.has(file))
  if (missing.length > 0) {
    throw new Error(`desktop package set: ${DESKTOP_HOST_PACKAGE} tarball omits required file(s): ${missing.join(', ')}`)
  }
}

/**
 * Prepare a package set from release tarball directories.
 * @param inputs - Release tarball directories.
 * @param output - Destination package-set directory.
 * @param target - Platform and architecture of the installer payload.
 */
export function prepareDesktopPackageSet(
  inputs: readonly string[], output: string, target: ReturnType<typeof desktopTargetPlatform>,
): void {
  const selected = selectDesktopPackageClosure(packedPackages(inputs), target)
  const host = selected.find(packed => packed.manifest.name === DESKTOP_HOST_PACKAGE)
  if (host === undefined) throw new Error(`desktop package set: selected closure omits ${DESKTOP_HOST_PACKAGE}`)
  assertDesktopHostPackageFiles(tarballFiles(host.tarball))
  rmSync(output, { recursive: true, force: true })
  const packageDir = join(output, DESKTOP_PACKAGES_DIR)
  mkdirSync(packageDir, { recursive: true })
  const records: DesktopCorePackageRecord[] = selected.map((packed) => {
    const name = packed.manifest.name
    const version = packed.manifest.version
    if (typeof name !== 'string' || typeof version !== 'string') {
      throw new Error(`desktop package set: ${packed.tarball} has no package identity`)
    }
    const file = basename(packed.tarball)
    const destination = join(packageDir, file)
    copyFileSync(packed.tarball, destination, constants.COPYFILE_EXCL)
    const body = readFileSync(destination)
    return {
      name,
      version,
      file,
      bytes: statSync(destination).size,
      integrity: `sha512-${createHash('sha512').update(body).digest('base64')}`,
    }
  })
  const packageSet = parseDesktopCorePackageSet({ schemaVersion: 1, packages: records })
  writeFileSync(join(output, DESKTOP_PACKAGE_SET_FILE), `${JSON.stringify(packageSet, undefined, 2)}\n`, { mode: 0o600 })
}

function main(): void {
  const buildPaths = resolveDesktopTargetBuildPaths()
  const defaultInputs = [
    buildPaths.packedDsh,
    buildPaths.packedVendor,
    buildPaths.packedLandlock,
    buildPaths.packedNodeAddons,
  ].filter(path => existsSync(path) && readdirSync(path).some(file => file.endsWith('.tgz')))
  const { values } = parseArgs({
    options: { from: { type: 'string', multiple: true }, out: { type: 'string' } },
    allowPositionals: false,
  })
  const inputs = (values.from ?? defaultInputs).map(path => resolve(REPOSITORY_ROOT, path))
  // The built-in plugin market is a repository plugin rather than a workspace
  // package, and private runtime plugins are excluded from the public release
  // family. Pack both here and select them as extra closure roots. A build-local
  // npm cache keeps packaging independent of the caller's npm home.
  const extraDir = mkdtempSync(join(tmpdir(), 'tomato-desktop-extra-'))
  const npmCache = join(buildPaths.root, 'npm-cache')
  mkdirSync(npmCache, { recursive: true })
  execFileSync('npm', ['pack', '--pack-destination', extraDir], {
    cwd: join(REPOSITORY_ROOT, 'plugins', 'tomato-market'),
    env: { ...process.env, npm_config_cache: npmCache },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  for (const directory of PRIVATE_RUNTIME_PACKAGES) {
    const invocation = pnpmInvocation(['--dir', join(REPOSITORY_ROOT, directory), 'pack', '--pack-destination', extraDir])
    execFileSync(invocation.command, invocation.args, {
      cwd: REPOSITORY_ROOT,
      env: { ...process.env, npm_config_cache: npmCache },
      stdio: ['ignore', 'ignore', 'inherit'],
    })
  }
  inputs.push(extraDir)
  const output = values.out === undefined ? buildPaths.packageSet : resolve(REPOSITORY_ROOT, values.out)
  prepareDesktopPackageSet(inputs, output, desktopTargetPlatform(resolveDesktopBuildTarget()))
  console.log(`desktop package set: prepared ${output}`)
}

if (import.meta.main) main()
