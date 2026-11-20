// One-click Skill installs: copy the SKILL.md directories a catalog entry names,
// at its pinned commit, into the user skill root (`$TOMATO_HOME/skills/<name>`).
// Each installed directory carries a `.tomato-market.json` marker; uninstall
// removes only marked directories, so a skill the user wrote under the same name
// is never touched.
import { mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { MarketingEntry, MarketingInstall } from '../api.ts'
import type { HttpReader } from './http.ts'
import { safeRelativePath } from './marketing.ts'

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

/** One entry whose install type must be `skill`; the installer refuses any other and names it. */
type SkillEntry = Pick<MarketingEntry, 'id'> & { readonly install: MarketingInstall }

/** One file of a skill directory. */
interface SkillFile {
  readonly path: string
  readonly size: number
}

/** What the installer reads and writes. */
export interface SkillInstallerOptions {
  /** The user skill root, `$TOMATO_HOME/skills`. */
  readonly skillRoot: string
  readonly readJson: HttpReader
  /** Binary reader; tests supply their own. */
  readonly readBytes: (url: string, options?: { readonly maxBytes?: number; readonly signal?: AbortSignal }) => Promise<{ readonly bytes: Uint8Array }>
  /** jsDelivr's package listing API. */
  readonly listingBase?: string
  /** jsDelivr's GitHub file CDN. */
  readonly fileBase?: string
}

/** The installer. */
export interface SkillInstaller {
  /** @returns catalog entry ids with at least one marked directory, and the skill names each one installed. */
  installed(): Promise<Map<string, string[]>>
  /** @returns the skill names of one entry that already exist and were not installed by this entry. */
  conflicts(entry: SkillEntry): Promise<string[]>
  install(entry: SkillEntry): Promise<{ readonly skills: string[] }>
  uninstall(entry: SkillEntry): Promise<{ readonly skills: string[] }>
}

/**
 * The files of one skill directory, from a flat repository listing.
 * @param files - jsDelivr's flat listing; names start with `/`.
 * @param path - the skill directory relative to the repository root, `''` for the root.
 * @returns files below that directory, relative to it.
 * @throws {Error} when the directory has no SKILL.md or exceeds the copy bounds.
 */
export function skillFiles(files: readonly { readonly name?: string; readonly size?: number }[], path: string): SkillFile[] {
  const prefix = path === '' ? '/' : `/${path}/`
  const selected: SkillFile[] = []
  let total = 0
  for (const file of files) {
    if (typeof file?.name !== 'string' || !file.name.startsWith(prefix)) continue
    const inner = file.name.slice(prefix.length)
    // A root skill copies only its own files: nested directories are other skills or repository furniture.
    if (path === '' && inner.includes('/')) continue
    if (inner === MARKER_FILE || !safeRelativePath(inner)) continue
    const size = typeof file.size === 'number' ? file.size : 0
    if (size > MAX_FILE_BYTES) throw new Error(`${inner} is larger than ${MAX_FILE_BYTES} bytes`)
    total += size
    selected.push({ path: inner, size })
  }
  if (!selected.some(file => file.path === 'SKILL.md')) throw new Error(`${path === '' ? 'the repository root' : path} has no SKILL.md at this commit`)
  if (selected.length > MAX_FILES) throw new Error(`skill has more than ${MAX_FILES} files`)
  if (total > MAX_SKILL_BYTES) throw new Error(`skill is larger than ${MAX_SKILL_BYTES} bytes`)
  return selected
}

/**
 * Run one task per item, a few at a time. A failure stops later tasks, and the returned promise settles only after
 * running tasks finished, so the caller may remove what they write.
 * @param items - task inputs.
 * @param task - the task.
 * @throws the first failure.
 */
async function inBatches<T>(items: readonly T[], task: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  let failed = false
  const worker = async (): Promise<void> => {
    while (!failed && next < items.length) {
      const item = items[next++] as T
      try {
        await task(item)
      } catch (error) {
        failed = true
        throw error
      }
    }
  }
  const outcomes = await Promise.allSettled(Array.from({ length: Math.min(DOWNLOADS_AT_ONCE, items.length) }, worker))
  for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason as unknown
}

/**
 * Read one directory's marker.
 * @param directory - a directory below the skill root.
 * @returns the marker entry id, or undefined when the directory carries none.
 */
async function readMarker(directory: string): Promise<string | undefined> {
  try {
    const marker: unknown = JSON.parse(await readFile(join(directory, MARKER_FILE), 'utf8'))
    if (typeof marker !== 'object' || marker === null) return undefined
    const entry = (marker as { entry?: unknown }).entry
    return typeof entry === 'string' ? entry : undefined
  } catch {
    return undefined
  }
}

/**
 * @param path - candidate.
 * @returns whether anything exists there.
 */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if ((error as { code?: string }).code !== 'ENOENT') throw error
    return false
  }
}

/**
 * Build the Skill installer.
 * @param options - installer settings.
 * @returns the installer.
 */
export function createSkillInstaller({
  skillRoot,
  readJson,
  readBytes,
  listingBase = 'https://data.jsdelivr.com/v1/packages/gh',
  fileBase = 'https://cdn.jsdelivr.net/gh',
}: SkillInstallerOptions): SkillInstaller {
  const target = (name: string): string => join(skillRoot, name)
  const listing = async (repo: string, commit: string): Promise<readonly { readonly name?: string; readonly size?: number }[]> => {
    const { value } = await readJson(`${listingBase}/${repo}@${commit}?structure=flat`, { maxBytes: 16 * 1024 * 1024 })
    const files = (value as { files?: unknown })?.files
    if (!Array.isArray(files)) throw new Error(`no file listing for ${repo}@${commit}`)
    return files as readonly { readonly name?: string; readonly size?: number }[]
  }
  const conflicts = async (entry: SkillEntry): Promise<string[]> => {
    const install = entry.install as MarketingInstall
    if (install.type !== 'skill') throw new Error(`${entry.id} is not a Skill entry`)
    const found: string[] = []
    for (const skill of install.skills ?? []) {
      const directory = target(skill.name)
      // A flat `<name>.md` in the same root declares the same skill.
      if (await exists(`${directory}.md`)) {
        found.push(skill.name)
        continue
      }
      if (!await exists(directory)) continue
      if (await readMarker(directory) !== entry.id) found.push(skill.name)
    }
    return found
  }
  return {
    async installed() {
      const byEntry = new Map<string, string[]>()
      let names: string[]
      try {
        names = await readdir(skillRoot)
      } catch (error) {
        if ((error as { code?: string }).code === 'ENOENT') return byEntry
        throw error
      }
      for (const name of names) {
        const entry = await readMarker(target(name))
        if (entry === undefined) continue
        byEntry.set(entry, [...byEntry.get(entry) ?? [], name])
      }
      return byEntry
    },
    conflicts,
    /**
     * Copy every listed skill of one entry. All files are downloaded into a staging directory first; only then is each
     * skill moved into place, so a failed download leaves the skill root unchanged.
     */
    async install(entry) {
      const install = entry.install as MarketingInstall
      if (install.type !== 'skill') throw new Error(`${entry.id} is not a Skill entry`)
      const repo = install.repo ?? ''
      const commit = install.commit ?? ''
      const skills = install.skills ?? []
      const blocked = await conflicts(entry)
      if (blocked.length > 0) throw new Error(`skills already exist and were not installed by this market: ${blocked.join(', ')}`)
      const files = await listing(repo, commit)
      await mkdir(skillRoot, { recursive: true })
      const staging = await mkdtemp(join(skillRoot, '.tomato-market-'))
      try {
        const downloads: Array<{ source: string; destination: string }> = []
        for (const skill of skills) {
          for (const file of skillFiles(files, skill.path)) {
            const encoded = [...skill.path === '' ? [] : skill.path.split('/'), ...file.path.split('/')]
              .map(encodeURIComponent).join('/')
            downloads.push({ source: `${fileBase}/${repo}@${commit}/${encoded}`, destination: join(staging, skill.name, ...file.path.split('/')) })
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
        const placed: string[] = []
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
      const install = entry.install as MarketingInstall
      if (install.type !== 'skill') throw new Error(`${entry.id} is not a Skill entry`)
      const removed: string[] = []
      for (const skill of install.skills ?? []) {
        const directory = target(skill.name)
        if (await readMarker(directory) !== entry.id) continue
        await rm(directory, { recursive: true, force: true })
        removed.push(skill.name)
      }
      return { skills: removed }
    },
  }
}