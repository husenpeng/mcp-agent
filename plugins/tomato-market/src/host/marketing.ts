// The curated marketing catalog bundled with this package: validation of its
// entries and the browser view of them. The file is reviewed by hand, so every
// command a one-click install runs comes from it, never from the browser.
import { existsSync, readFileSync } from 'node:fs'
import type { MarketingCatalog, MarketingEntry, MarketingInstall } from '../api.ts'

/** Entry ids double as MCP server names after the `mkt-` prefix, which allows 32 characters. */
export const ENTRY_ID = /^[a-z0-9][a-z0-9-]{0,27}$/
/** Skill directory names written below the user skill root. */
export const SKILL_NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/
/** Exact SemVer, as npm and PyPI pins are written in the catalog. */
const PINNED_VERSION = /^\d+(?:\.\d+){1,3}(?:[-.+]?[0-9A-Za-z.-]+)?$/
/** Package names accepted for `npx`/`uvx`: npm (scoped or not) and PyPI names. */
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9._-]*$/
/** Executable names an MCP package exposes. */
const BIN_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
/** Environment variable names the user supplies. */
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/
/** A full Git commit hash. */
const COMMIT = /^[0-9a-f]{40}$/
/** `owner/repo` on GitHub. */
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

/** The entry kinds a catalog declares. */
export const KINDS = ['plugin', 'mcp', 'skill'] as const
/** How an entry reaches its data: freely, with a free key, self-hosted, or with the reader's own login. */
export const ACCESS = ['none', 'free-key', 'self-hosted', 'login'] as const

/**
 * The catalog file this package ships. The bundle keeps it beside the source in `src/host/`, while the published
 * package and the bundled `lib/index.js` both resolve it one directory up.
 */
const SHIPPED_FILE = new URL('./marketing-catalog.json', import.meta.url)
const BUNDLED_DIRECTORY_FILE = new URL('../src/host/marketing-catalog.json', import.meta.url)

/** One catalog entry as the bundled file publishes it, before validation. */
type RawEntry = Record<string, unknown>

/** @returns the parsed bundled catalog. */
export function readMarketingFile(): unknown {
  return JSON.parse(readFileSync(existsSync(SHIPPED_FILE) ? SHIPPED_FILE : BUNDLED_DIRECTORY_FILE, 'utf8'))
}

/**
 * Whether a relative path stays inside its repository.
 * @param path - candidate relative path; `''` names the repository root.
 * @returns whether it is relative, POSIX-separated, and free of `.` and `..` segments.
 */
export function safeRelativePath(path: unknown): path is string {
  if (typeof path !== 'string') return false
  if (path === '') return true
  if (path.startsWith('/') || path.includes('\\') || path.endsWith('/')) return false
  return path.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..')
}

/**
 * @param value - candidate.
 * @returns whether it is `{ zh, en }` text with English.
 */
function isLocalized(value: unknown): boolean {
  return typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>).en === 'string'
    && (value as Record<string, string>).en !== ''
    && Object.values(value).every(text => typeof text === 'string')
}

/**
 * Validate one install record.
 * @param install - the entry's `install` field.
 * @param kind - the entry kind.
 * @returns the first problem, or undefined when valid.
 */
function installProblem(install: unknown, kind: string): string | undefined {
  if (typeof install !== 'object' || install === null) return 'install is missing'
  const record = install as Record<string, unknown>
  switch (record.type) {
    case 'plugin':
      if (kind !== 'plugin') return 'plugin install on a non-plugin entry'
      if (typeof record.name !== 'string' || record.name === '') return 'plugin install names no package'
      if (typeof record.version !== 'string' || record.version === '') return 'plugin install names no version'
      return undefined
    case 'mcp':
      if (kind !== 'mcp') return 'mcp install on a non-mcp entry'
      if (record.runner !== 'npx' && record.runner !== 'uvx') return 'mcp runner must be npx or uvx'
      if (typeof record.package !== 'string' || !PACKAGE_NAME.test(record.package)) return 'mcp package is invalid'
      if (typeof record.version !== 'string' || !PINNED_VERSION.test(record.version)) return 'mcp version must be exact'
      if (record.bin !== undefined && (typeof record.bin !== 'string' || !BIN_NAME.test(record.bin))) return 'mcp bin is invalid'
      if (record.args !== undefined && (!Array.isArray(record.args) || !record.args.every(arg => typeof arg === 'string'))) {
        return 'mcp args must be strings'
      }
      return undefined
    case 'skill':
      if (kind !== 'skill') return 'skill install on a non-skill entry'
      if (typeof record.repo !== 'string' || !REPO.test(record.repo)) return 'skill repo must be owner/repo'
      if (typeof record.commit !== 'string' || !COMMIT.test(record.commit)) return 'skill commit must be a full hash'
      if (!Array.isArray(record.skills) || record.skills.length === 0) return 'skill install lists no skills'
      for (const skill of record.skills as readonly Record<string, unknown>[]) {
        if (typeof skill?.name !== 'string' || !SKILL_NAME.test(skill.name)) return `skill name ${String(skill?.name)} is invalid`
        if (!safeRelativePath(skill.path)) return `skill path ${String(skill.path)} is invalid`
      }
      return undefined
    case 'manual':
      return isLocalized(record.steps) ? undefined : 'manual install has no steps'
    default:
      return `unknown install type ${String(record.type)}`
  }
}

/**
 * Validate one catalog entry.
 * @param entry - the entry's document.
 * @returns the first problem, or undefined when valid.
 */
function entryProblem(entry: RawEntry): string | undefined {
  if (typeof entry.id !== 'string' || !ENTRY_ID.test(entry.id)) return 'id is invalid'
  if (!KINDS.includes(entry.kind as (typeof KINDS)[number])) return 'kind is invalid'
  if (!isLocalized(entry.title)) return 'title is not localized text'
  if (!isLocalized(entry.description)) return 'description is not localized text'
  if (!Array.isArray(entry.categories) || entry.categories.length === 0) return 'categories are missing'
  if (entry.access !== undefined && !ACCESS.includes(entry.access as (typeof ACCESS)[number])) return 'access is invalid'
  if (entry.env !== undefined && (!Array.isArray(entry.env) || !entry.env.every(name => typeof name === 'string' && ENV_NAME.test(name)))) {
    return 'env names are invalid'
  }
  return installProblem(entry.install, entry.kind as string)
}

/**
 * @param document - the parsed catalog file.
 * @returns the first problem, or undefined when valid.
 */
function catalogProblem(document: RawEntry): string | undefined {
  if (document.format !== 1) return 'format must be 1'
  const categories = document.categories
  if (!Array.isArray(categories) || categories.length === 0) return 'categories are missing'
  if (!Array.isArray(document.entries)) return 'entries are missing'
  for (const category of categories as readonly RawEntry[]) {
    if (typeof category.id !== 'string' || category.id === '') return 'a category has no id'
    if (!isLocalized(category.title)) return `category ${category.id} has no localized title`
  }
  return undefined
}

/**
 * Validate the bundled catalog.
 * @param document - the parsed catalog file.
 * @returns the catalog.
 * @throws {Error} naming the first invalid entry.
 */
export function validateMarketingCatalog(document: unknown): MarketingCatalog {
  if (typeof document !== 'object' || document === null) throw new Error('the marketing catalog is not an object')
  const raw = document as RawEntry
  const problem = catalogProblem(raw)
  if (problem !== undefined) throw new Error(`marketing catalog: ${problem}`)
  const entries = raw.entries as readonly RawEntry[]
  for (const entry of entries) {
    const invalid = entryProblem(entry)
    if (invalid !== undefined) throw new Error(`marketing catalog ${String(entry.id)}: ${invalid}`)
  }
  return raw as unknown as MarketingCatalog
}

/** The parts of the catalog the browser reads, without the install commands it never runs itself. */
export interface MarketingModule {
  readonly categories: MarketingCatalog['categories']
  readonly entries: readonly MarketingEntry[]
}

/** @returns the catalog view the browser half receives. */
export function readMarketingModule(): MarketingModule {
  const catalog = validateMarketingCatalog(readMarketingFile())
  return { categories: catalog.categories, entries: catalog.entries }
}

/**
 * The stdio command one MCP entry runs.
 * @param entry - a catalog entry whose install type is `mcp`.
 * @returns the command line.
 */
export function mcpCommand(entry: Pick<MarketingEntry, 'install'>): { command: string; args: string[] } {
  const install = entry.install as MarketingInstall
  if (install.type !== 'mcp') throw new Error(`${entry.install.type} entries run no command`)
  const extra = [...install.args ?? []]
  const binary = install.bin
  if (install.runner === 'npx') {
    const spec = `${String(install.package)}@${String(install.version)}`
    return binary === undefined
      ? { command: 'npx', args: ['-y', spec, ...extra] }
      : { command: 'npx', args: ['-y', '--package', spec, binary, ...extra] }
  }
  const spec = `${String(install.package)}==${String(install.version)}`
  return binary === undefined
    ? { command: 'uvx', args: [spec, ...extra] }
    : { command: 'uvx', args: ['--from', spec, binary, ...extra] }
}

/** @param id - entry id. @returns the Loader row id of its MCP client. */
export function mcpRowId(id: string): string {
  return `mkt-mcp-${id}`
}

/** @param id - entry id. @returns the MCP server name, which prefixes its tool names. */
export function mcpServerName(id: string): string {
  return `mkt-${id}`
}
