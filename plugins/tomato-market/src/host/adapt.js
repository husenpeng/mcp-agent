/**
 * Build a Tomato-installable tarball from a published DeepSeek Harness plugin.
 *
 * The conversion reads and rewrites text only: it never executes package code.
 * Archives are extracted below one temporary directory after every entry path
 * is checked, then repacked under the same `package/` root pnpm expects.
 */
import { mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as tar from 'tar'
import { adaptManifest, isRewrittenFile, rewriteText } from './compat.js'

/** Largest plugin archive downloaded. */
const MAX_ARCHIVE_BYTES = 32 * 1024 * 1024
/** Largest extracted package accepted. */
const MAX_EXTRACTED_BYTES = 128 * 1024 * 1024
/** Most entries accepted from one archive. */
const MAX_ENTRIES = 6000
/** Largest text file rewritten. */
const MAX_TEXT_BYTES = 8 * 1024 * 1024

/**
 * Whether one archive entry stays inside the extraction directory.
 * @param {string} path - entry path as the archive names it.
 * @returns {boolean} whether it is relative and free of `..` segments.
 */
export function safeArchiveEntry(path) {
  if (path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)) return false
  return !path.split(/[\\/]/).includes('..')
}

/**
 * A filesystem-safe file name for one package version.
 * @param {string} name - package name.
 * @param {string} version - exact version.
 * @returns {string} a name without path separators or scoped markers.
 */
export function adaptedFileName(name, version) {
  return `${name.replace(/^@/, '').replace(/[\\/:*?"<>|]/g, '-')}-${version}-tomato.tgz`
}

/**
 * Rewrite the package references of every text file under a directory.
 * @param {string} root - package directory.
 * @returns {Promise<number>} how many files changed.
 */
async function rewriteTree(root) {
  let changed = 0
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(path)
        continue
      }
      if (!entry.isFile() || !isRewrittenFile(path)) continue
      const info = await stat(path)
      if (info.size > MAX_TEXT_BYTES) continue
      const before = await readFile(path, 'utf8')
      const after = rewriteText(before)
      if (after === before) continue
      await writeFile(path, after)
      changed += 1
    }
  }
  await visit(root)
  return changed
}

/**
 * Build an adapter that converts one registry tarball at a time and caches the result.
 * @param {{ fetchBytes: Function, cacheDir: string, timeoutMs?: number, signal?: AbortSignal }} options - downloader, cache, and bounds.
 * @returns {{ adapt: (name: string, version: string, tarball: string) => Promise<{ file: string, changed: number }> }} the adapter.
 */
export function createAdapter(options) {
  const pending = new Map()
  const build = async (name, version, tarball) => {
    const file = join(options.cacheDir, adaptedFileName(name, version))
    try {
      await stat(file)
      return { file, changed: 0 }
    } catch { /* not built yet */ }
    await mkdir(options.cacheDir, { recursive: true })
    const workspace = await mkdtemp(join(tmpdir(), 'tomato-market-'))
    const archive = join(workspace, 'package.tgz')
    const output = `${file}.tmp`
    try {
      const { bytes } = await options.fetchBytes(tarball, { maxBytes: MAX_ARCHIVE_BYTES, signal: options.signal, timeoutMs: options.timeoutMs })
      await writeFile(archive, bytes)
      const extract = join(workspace, 'extract')
      await mkdir(extract)
      let entries = 0
      let total = 0
      let refused
      await tar.x({
        file: archive,
        cwd: extract,
        strict: true,
        filter(path, entry) {
          entries += 1
          total += typeof entry?.size === 'number' ? entry.size : 0
          if (!safeArchiveEntry(path)) refused = `unsafe archive entry ${path}`
          else if (entries > MAX_ENTRIES) refused = 'archive holds too many entries'
          else if (total > MAX_EXTRACTED_BYTES) refused = 'archive expands beyond the size limit'
          return refused === undefined
        },
      })
      if (refused !== undefined) throw new Error(refused)
      const packageDir = join(extract, 'package')
      const manifestPath = join(packageDir, 'package.json')
      const published = JSON.parse(await readFile(manifestPath, 'utf8'))
      const { manifest } = adaptManifest(published)
      await writeFile(manifestPath, JSON.stringify(manifest, undefined, 2) + '\n')
      const changed = await rewriteTree(packageDir)
      await tar.c({ gzip: true, file: output, cwd: extract, portable: true }, ['package'])
      await rename(output, file)
      return { file, changed }
    } finally {
      await rm(workspace, { recursive: true, force: true })
      await rm(output, { force: true })
    }
  }
  return {
    async adapt(name, version, tarball) {
      const key = `${name}@${version}`
      let job = pending.get(key)
      if (job === undefined) {
        job = build(name, version, tarball).finally(() => { pending.delete(key) })
        pending.set(key, job)
      }
      return job
    },
  }
}