/** Prepare the disposable npm-project view used by an unpackaged Electron shell. */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { createDevelopmentProjectMetadata } from '../src/project-manager.ts'
import type { DesktopRelease } from '../src/release.ts'
import { DESKTOP_RUNTIME_FILE, type DesktopRuntimeDescriptor } from '../src/runtime-tree.ts'
import type { DesktopAutoUpdateTarget } from './desktop-auto-update-environment.mjs'
import { desktopTargetPlatform } from './desktop-build-paths.mjs'

interface PackageManifest {
  readonly name?: string
  readonly version?: string
  readonly dependencies?: Readonly<Record<string, string>>
}

/** Inputs whose locations differ between the launcher and isolated tests. */
export interface DevelopmentProjectOptions {
  /** Directory replaced with the generated development project. */
  readonly projectDir: string
  /** Current workspace's `apps/cli` package directory. */
  readonly cliDir: string
  /** Current workspace's private Desktop Host application directory. */
  readonly hostDir: string
  /** pnpm's workspace-wide virtual-hoist directory. */
  readonly dependencyDir: string
  /** Release identity written into the disposable project metadata. */
  readonly release: DesktopRelease
  /** Build target whose prepared payload the disposable project runs against. */
  readonly target: DesktopAutoUpdateTarget
}

function readManifest(path: string): PackageManifest {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest
}

function removeOwnedPath(path: string): void {
  let stat: ReturnType<typeof lstatSync>
  try {
    stat = lstatSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }
  if (stat.isSymbolicLink()) {
    unlinkSync(path)
    return
  }
  if (stat.isDirectory()) {
    rmSync(path, { recursive: true })
    return
  }
  unlinkSync(path)
}

function linkDirectory(source: string, destination: string): void {
  mkdirSync(dirname(destination), { recursive: true })
  symlinkSync(realpathSync(source), destination, process.platform === 'win32' ? 'junction' : 'dir')
}

function mirrorDependencyLinks(sourceRoot: string, destinationRoot: string): string[] {
  const names: string[] = []
  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    if (entry.name === '.bin') continue
    const source = join(sourceRoot, entry.name)
    if (entry.name.startsWith('@') && (entry.isDirectory() || entry.isSymbolicLink())) {
      mkdirSync(join(destinationRoot, entry.name), { recursive: true })
      for (const scoped of readdirSync(source, { withFileTypes: true })) {
        if (!scoped.isDirectory() && !scoped.isSymbolicLink()) continue
        linkDirectory(join(source, scoped.name), join(destinationRoot, entry.name, scoped.name))
        names.push(`${entry.name}/${scoped.name}`)
      }
      continue
    }
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      linkDirectory(source, join(destinationRoot, entry.name))
      names.push(entry.name)
    }
  }
  return names
}

/** Configured workspace plugins must resolve from the profile even when pnpm does not hoist them. */
function mirrorWorkspaceDependencies(roots: readonly string[], destinationRoot: string): string[] {
  const names: string[] = []
  const visited = new Set<string>()
  const visit = (directory: string): void => {
    const source = realpathSync(directory)
    if (visited.has(source)) return
    visited.add(source)
    const manifest = readManifest(join(source, 'package.json'))
    for (const [name, specifier] of Object.entries(manifest.dependencies ?? {})) {
      if (!specifier.startsWith('workspace:')) continue
      const dependency = join(source, 'node_modules', ...name.split('/'))
      if (!existsSync(dependency)) {
        throw new Error(`desktop development: ${name} is missing from ${source}; run pnpm install`)
      }
      const destination = join(destinationRoot, ...name.split('/'))
      removeOwnedPath(destination)
      linkDirectory(dependency, destination)
      names.push(name)
      visit(dependency)
    }
  }
  for (const directory of roots) visit(directory)
  return names
}

/**
 * Replace one disposable project with links to the current built workspace.
 * @param options - Project destination, CLI package, release identity, and build target.
 * @returns the absolute project directory supplied by the caller.
 */
export function prepareDevelopmentProject(options: DevelopmentProjectOptions): string {
  const cliManifest = readManifest(join(options.cliDir, 'package.json'))
  if (cliManifest.name !== '@tomato/cli' || cliManifest.version !== options.release.version) {
    throw new Error(
      `desktop development: apps/cli must be @tomato/cli@${options.release.version}, found `
      + `${String(cliManifest.name)}@${String(cliManifest.version)}`,
    )
  }
  if (!existsSync(options.dependencyDir)) {
    throw new Error('desktop development: workspace dependency links are missing; run pnpm install')
  }
  const hostManifest = readManifest(join(options.hostDir, 'package.json'))
  if (hostManifest.name !== '@tomato/desktop-host' || hostManifest.version !== options.release.version) {
    throw new Error(
      `desktop development: apps/desktop-host must be @tomato/desktop-host@${options.release.version}, found `
      + `${String(hostManifest.name)}@${String(hostManifest.version)}`,
    )
  }
  if (!existsSync(join(options.hostDir, 'lib', 'index.js'))) {
    throw new Error('desktop development: apps/desktop-host/lib/index.js is missing; run pnpm run build')
  }

  removeOwnedPath(options.projectDir)
  createDevelopmentProjectMetadata(options.projectDir, options.release)
  // The development tree carries the multi-agent team when the developer asked for it.
  // These are application-layer settings: the engine itself names no provider.
  const teamDirectory = process.env.TOMATO_SUPERAGENT_DIRECTORY
  if (teamDirectory !== undefined && teamDirectory !== '') {
    // An empty bot URL runs the team app-only: requests arrive from the ticket
    // panel's composer instead of a Feishu service.
    const botUrl = process.env.TOMATO_SUPERAGENT_BOT_URL ?? 'http://127.0.0.1:8013'
    writeFileSync(join(options.projectDir, 'cordis.patch.yml'), [
      '- insert:',
      '    - id: superagent-runtime',
      '      name: "@tomato/superagent-runtime"',
      '      config:',
      `        directory: ${JSON.stringify(teamDirectory)}`,
      `        provider: ${JSON.stringify(process.env.TOMATO_SUPERAGENT_PROVIDER ?? 'blueai')}`,
      `        model: ${JSON.stringify(process.env.TOMATO_SUPERAGENT_MODEL ?? 'DeepSeek-V4.1-Flash-1017')}`,
      '        maxOutputTokens: 16000',
      '        permissionPreset: workspace-write',
      ...botUrl === ''
        ? ['        pollSeconds: 0']
        : [
          '        allowedSenders:',
          `          - ${JSON.stringify(process.env.TOMATO_SUPERAGENT_SENDER ?? 'ou_b2d923aea664c674f8c16ecfbb0814e5')}`,
          '        bot:',
          `          baseUrl: ${JSON.stringify(botUrl)}`,
          '          userId: tomato-supervisor',
          '        pollSeconds: 15',
        ],
      '        isolate: false',
      '        replies: false',
      '- insert:',
      '    - id: client-ui-superagent',
      '      name: "@tomato/client-ui-superagent"',
      '',
    ].join('\n'))
    // The browser roster is read from the profile manifest, so the client half
    // must be listed there as a dependency of the generated profile.
    const manifestPath = join(options.projectDir, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      dependencies?: Record<string, string>
      tomato?: { profile?: { bundles?: string[] } }
    }
    manifest.dependencies = {
      ...manifest.dependencies,
      '@tomato/superagent-runtime': '*',
      '@tomato/client-ui-superagent': '*',
      '@tomato/experimental-robot-app': '*',
    }
    const bundles = manifest.tomato?.profile?.bundles ?? []
    manifest.tomato = {
      ...manifest.tomato,
      profile: {
        ...manifest.tomato?.profile,
        bundles: [...new Set([...bundles, '@tomato/experimental-robot-app'])],
      },
    }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, undefined, 2)}\n`)
  }
  const destinationModules = join(options.projectDir, 'node_modules')
  mkdirSync(destinationModules, { recursive: true })
  const names = [
    ...mirrorDependencyLinks(options.dependencyDir, destinationModules),
    ...mirrorWorkspaceDependencies([options.cliDir, options.hostDir], destinationModules),
  ]
  const tomatoLink = join(destinationModules, '@tomato', 'cli')
  removeOwnedPath(tomatoLink)
  linkDirectory(options.cliDir, tomatoLink)
  const hostLink = join(destinationModules, '@tomato', 'desktop-host')
  removeOwnedPath(hostLink)
  linkDirectory(options.hostDir, hostLink)
  const sharedPackages = [...new Set([...names, '@tomato/cli', '@tomato/desktop-host'])].flatMap((name) => {
    const manifest = readManifest(join(destinationModules, name, 'package.json'))
    return typeof manifest.version === 'string' ? [{ name, version: manifest.version, path: `node_modules/${name}` }] : []
  })
  const runtime: DesktopRuntimeDescriptor = { schemaVersion: 1, release: options.release,
    ...desktopTargetPlatform(options.target), sharedPackages, files: [] }
  writeFileSync(join(options.projectDir, DESKTOP_RUNTIME_FILE), `${JSON.stringify(runtime, undefined, 2)}\n`)
  return options.projectDir
}
