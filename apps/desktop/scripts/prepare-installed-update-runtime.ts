/** Copy a verified runtime into isolated, version-bound qualification resources without signing. */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { runtimePath, verifyDesktopRuntime, writeDesktopRuntime } from '../src/runtime-tree.ts'
import { readInstalledUpdateRun } from './installed-update-qualification.ts'

/**
 * Names pinned from `vendor/`. They carry the same `@tomato/` scope as release
 * packages but are rescoped upstream copies, so a release must not retag them.
 */
const VENDOR_PACKAGES = (() => {
  const root = join(import.meta.dirname, '../../../vendor')
  try {
    return new Set(readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .flatMap((entry) => {
        try {
          const metadata = JSON.parse(readFileSync(join(root, entry.name, 'package.json'), 'utf8')) as { name?: unknown }
          return typeof metadata.name === 'string' ? [metadata.name] : []
        } catch {
          // A directory without a readable manifest is not a package.
          return []
        }
      }))
  } catch {
    // A packaged qualification environment carries no vendor tree; nothing to exclude there.
    return new Set<string>()
  }
})()

interface PackageMetadata {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

/**
 * Clone one verified source tree into two synthetic release versions, retaining source bytes unchanged.
 * @param manifest The existing test run manifest; both version directories must be absent.
 * @param sourceRoot Fresh prepared tomato runtime, never the user's installed application.
 * @returns Completion record with descriptor hashes; this is not signed or boot-tested artifact evidence.
 */
export async function prepareInstalledUpdateRuntime(manifest: string, sourceRoot: string): Promise<object> {
  const run = await readInstalledUpdateRun(manifest)
  const receipt = join(run.root, 'runtime-preparation')
  await mkdir(receipt)
  await writeFile(join(receipt, 'started.json'), `${JSON.stringify({ sourceRoot, time: new Date().toISOString() })}\n`,
    { flag: 'wx', mode: 0o600, flush: true })
  const results: object[] = []
  try {
    const source = await verifyDesktopRuntime(sourceRoot, run.source.version)
    const sourceHash = createHash('sha256').update(await readFile(join(sourceRoot, 'desktop-runtime.json'))).digest('hex')
    await writeFile(join(receipt, 'source.json'), `${JSON.stringify({ sourceHash, version: run.source.version })}\n`,
      { flag: 'wx', mode: 0o600, flush: true })
    const releaseNames = new Set(source.sharedPackages.filter(entry => entry.version === run.source.version
      && (entry.name === '@tomato/cli' || entry.name.startsWith('@tomato/'))
      && !VENDOR_PACKAGES.has(entry.name)).map(entry => entry.name))
    for (const version of run.versions) {
      const directory = join(run.root, version)
      await mkdir(directory)
      const runtime = join(directory, 'tomato')
      await cp(sourceRoot, runtime, { recursive: true, force: false, errorOnExist: true })
      const paths = [join(runtime, 'package.json'), ...source.sharedPackages.filter(entry => releaseNames.has(entry.name))
        .map(entry => join(runtimePath(runtime, entry.path), 'package.json'))]
      for (const path of paths) {
        const metadata = JSON.parse(await readFile(path, 'utf8')) as PackageMetadata
        metadata.version = version
        for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const) {
          for (const [name, value] of Object.entries(metadata[field] ?? {})) {
            if (releaseNames.has(name) && value === run.source.version) metadata[field]![name] = version
          }
        }
        await writeFile(path, `${JSON.stringify(metadata, null, 2)}\n`)
      }
      writeDesktopRuntime(runtime, { ...source.release, version }, source.sharedPackages.map(entry => entry.name), source)
      const verified = await verifyDesktopRuntime(runtime, version, source)
      results.push({ version, runtime, files: verified.files.length, sharedPackages: verified.sharedPackages.length,
        descriptorSha256: createHash('sha256').update(await readFile(join(runtime, 'desktop-runtime.json'))).digest('hex') })
    }
    await verifyDesktopRuntime(sourceRoot, run.source.version, source)
    if (createHash('sha256').update(await readFile(join(sourceRoot, 'desktop-runtime.json'))).digest('hex') !== sourceHash) {
      throw new Error('installed update: source runtime changed during qualification preparation')
    }
    const result = { schemaVersion: 1, sourceHash, versions: results, signed: false, bootTested: false }
    await writeFile(join(receipt, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600, flush: true })
    return result
  } catch (error) {
    await writeFile(join(receipt, 'failed.json'), `${JSON.stringify({ failed: true, time: new Date().toISOString(),
      completedVersions: results.length, retryAllowed: false })}\n`, { flag: 'wx', mode: 0o600, flush: true })
    throw error
  }
}
