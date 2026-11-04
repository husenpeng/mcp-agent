// One-click Skill installs: copy the SKILL.md directories a catalog entry
// names, at its pinned commit, into the user skill root
// (`$TOMATO_HOME/skills/<name>`). Each installed directory carries a
// `.tomato-market.json` marker; uninstall removes only marked directories,
// so a skill the user wrote under the same name is never touched.
import { mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { safeRelativePath } from './marketing.js'

/** Marker file written into every directory this market installs. */
export const MARKER_FILE = '.tomato-market.json'
/** Largest single file copied from a skill directory. */
const MAX_FILE_BYTES = 4 * 1024 * 1024
/** Largest total size of one skill directory. */
const MAX_SKILL_BYTES = 24 * 1024 * 1024
/** Most files copied for one skill. */
const MAX_FILES = 400
/** Concurrent file downloads of one install. */
const DOWNLOADS_AT_ONCE = 6

/**
 * Run one task per item, a few at a time. A failure stops later tasks, and the
 * returned promise settles only after running tasks finished, so the caller
 * may remove what they write.
 * @param {object[]} items - task inputs.
 * @param {(item: object) => Promise<void>} task - the task.
 * @returns {Promise<void>} resolved when every task finished.
 * @throws {unknown} the first failure.
 */
async function inBatches(items, task) {
  let next = 0
  let failed = false
  const worker = async () => {
    while (!failed && next < items.length) {
      try {
        await task(items[next++])
      } catch (error) {
        failed = true
        throw error
      }
    }
  }
  const outcomes = await Promise.allSettled(Array.from({ length: Math.min(DOWNLOADS_AT_ONCE, items.length) }, worker))
  for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason
}

/**
 * The files of one skill directory, from a flat repository listing.
 * @param {Array<{ name: string, size?: number }>} files - jsDelivr's flat listing; names start with `/`.
 * @param {string} path - the skill directory relative to the repository root, `''` for the root.
 * @returns {Array<{ path: string, size: number }>} files below that directory, relative to it.
 * @throws {Error} when the directory has no SKILL.md or exceeds the copy bounds.
 */
export function skillFiles(files, path) {
  const prefix = path === '' ? '/' : `/${path}/`
  const selected = []
  let total = 0
  for (const file of files) {
    if (typeof file?.name !== 'string' || !file.name.startsWith(prefix)) continue
    const inner = file.name.slice(prefix.length)
    // A root skill copies only its own files: nested directories are other skills or repository furniture.
    if (path === '' && inner.includes('/')) continue
    if (!safeRelativePath(inner) || inner === MARKER_FILE) continue
    const size = typeof file.size === 'number' ? file.size : 0
    if (size > MAX_FILE_BYTES) throw new Error(`${inner} is larger than ${MAX_FILE_BYTES} bytes`)
    total += size
    selected.push({ path: inner, size })
  }
  if (!selected.some(file => file.path === 'SKILL.md')) throw new Error(`${path || 'the repository root'} has no SKILL.md at this commit`)
  if (selected.length > MAX_FILES) throw new Error(`skill has more than ${MAX_FILES} files`)
  if (total > MAX_SKILL_BYTES) throw new Error(`skill is larger than ${MAX_SKILL_BYTES} bytes`)
  return selected
}

/**
 * Read one directory's marker.
 * @param {string} directory - a directory below the skill root.
 * @returns {Promise<object | undefined>} the marker, or undefined when the directory carries none.
 */
async function readMarker(directory) {
  try {
    const marker = JSON.parse(await readFile(join(directory, MARKER_FILE), 'utf8'))
    return typeof marker === 'object' && marker !== null && typeof marker.entry === 'string' ? marker : undefined
  } catch {
    return undefined
  }
}

/** @param {string} path - candidate. @returns {Promise<boolean>} whether anything exists there. */
async function exists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

/**
 * Build the Skill installer.
 * @param {object} options - installer settings.
 * @param {string} options.skillRoot - the user skill root, `$TOMATO_HOME/skills`.
 * @param {(url: string, options?: object) => Promise<{ value: unknown }>} options.readJson - JSON reader.
 * @param {(url: string, options?: object) => Promise<{ bytes: Uint8Array }>} options.readBytes - binary reader.
 * @param {string} [options.listingBase] - jsDelivr's package listing API.
 * @param {string} [options.fileBase] - jsDelivr's GitHub file CDN.
 * @returns {object} `installed`, `conflicts`, `install`, and `uninstall`.
 */
export function createSkillInstaller({
  skillRoot,
  readJson,
  readBytes,
  listingBase = 'https://data.jsdelivr.com/v1/packages/gh',
  fileBase = 'https://cdn.jsdelivr.net/gh',
}) {
  const target = name => join(skillRoot, name)
  const listing = async (repo, commit) => {
    const { value } = await readJson(`${listingBase}/${repo}@${commit}?structure=flat`, { maxBytes: 16 * 1024 * 1024 })
    if (!Array.isArray(value?.files)) throw new Error(`no file listing for ${repo}@${commit}`)
    return value.files
  }

  /** Skill names of one entry that already exist and were not installed by this entry. */
  const conflicts = async (entry) => {
    const found = []
    for (const skill of entry.install.skills) {
      const directory = target(skill.name)
      // A flat `<name>.md` in the same root declares the same skill.
      if (await exists(`${directory}.md`)) {
        found.push(skill.name)
        continue
      }
      if (!await exists(directory)) continue
      const marker = await readMarker(directory)
      if (marker?.entry !== entry.id) found.push(skill.name)
    }
    return found
  }

  return {
    /** Catalog entry ids with at least one marked directory, and the skill names each one installed. */
    async installed() {
      const byEntry = new Map()
      let names
      try {
        names = await readdir(skillRoot)
      } catch (error) {
        if (error?.code === 'ENOENT') return byEntry
        throw error
      }
      for (const name of names) {
        const marker = await readMarker(target(name))
        if (marker === undefined) continue
        byEntry.set(marker.entry, [...byEntry.get(marker.entry) ?? [], name])
      }
      return byEntry
    },
    conflicts,
    /**
     * Copy every listed skill of one entry. All files are downloaded into a
     * staging directory first; only then is each skill moved into place, so a
     * failed download leaves the skill root unchanged.
     */
    async install(entry) {
      const { repo, commit, skills } = entry.install
      const blocked = await conflicts(entry)
      if (blocked.length > 0) throw new Error(`skills already exist and were not installed by this market: ${blocked.join(', ')}`)
      const files = await listing(repo, commit)
      await mkdir(skillRoot, { recursive: true })
      const staging = await mkdtemp(join(skillRoot, '.tomato-market-'))
      try {
        const downloads = []
        for (const skill of skills) {
          const directory = join(staging, skill.name)
          for (const file of skillFiles(files, skill.path)) {
            const encoded = [...skill.path === '' ? [] : skill.path.split('/'), ...file.path.split('/')].map(encodeURIComponent).join('/')
            downloads.push({ source: `${fileBase}/${repo}@${commit}/${encoded}`, destination: join(directory, ...file.path.split('/')) })
          }
        }
        await inBatches(downloads, async ({ source, destination }) => {
          const { bytes } = await readBytes(source, { maxBytes: MAX_FILE_BYTES })
          await mkdir(dirname(destination), { recursive: true })
          await writeFile(destination, bytes)
        })
        for (const skill of skills) {
          await writeFile(join(staging, skill.name, MARKER_FILE), `${JSON.stringify({
            entry: entry.id, repo, commit, path: skill.path, installedAt: new Date().toISOString(),
          }, undefined, 2)}\n`)
        }
        const placed = []
        try {
          for (const skill of skills) {
            // Reinstalling an entry replaces its own marked directories.
            await rm(target(skill.name), { recursive: true, force: true })
            await rename(join(staging, skill.name), target(skill.name))
            placed.push(skill.name)
          }
        } catch (error) {
          for (const name of placed) await rm(target(name), { recursive: true, force: true })
          throw error
        }
        return { skills: placed }
      } finally {
        await rm(staging, { recursive: true, force: true })
      }
    },
    /** Remove the marked directories of one entry. */
    async uninstall(entry) {
      const removed = []
      for (const skill of entry.install.skills) {
        const directory = target(skill.name)
        const marker = await readMarker(directory)
        if (marker?.entry !== entry.id) continue
        await rm(directory, { recursive: true, force: true })
        removed.push(skill.name)
      }
      return { skills: removed }
    },
  }
}
