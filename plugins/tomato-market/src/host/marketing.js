// The curated marketing catalog bundled with this package: validation of its
// entries and the browser view of them. The file is reviewed by hand, so every
// command a one-click install runs comes from it, never from the browser.

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

export const KINDS = ['plugin', 'mcp', 'skill']
export const ACCESS = ['none', 'free-key', 'self-hosted', 'login']

/**
 * Whether a relative path stays inside its repository.
 * @param {unknown} path - candidate relative path; `''` names the repository root.
 * @returns {boolean} whether it is relative, POSIX-separated, and free of `.` and `..` segments.
 */
export function safeRelativePath(path) {
  if (typeof path !== 'string') return false
  if (path === '') return true
  if (path.startsWith('/') || path.includes('\\') || path.endsWith('/')) return false
  return path.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..')
}

/** @param {unknown} value - candidate. @returns {boolean} whether it is `{ zh, en }` text with English. */
function isLocalized(value) {
  return typeof value === 'object' && value !== null && typeof value.en === 'string' && value.en !== ''
    && Object.values(value).every(text => typeof text === 'string')
}

/**
 * Validate one install record.
 * @param {unknown} install - the entry's `install` field.
 * @param {string} kind - the entry kind.
 * @returns {string | undefined} the first problem, or undefined when valid.
 */
function installProblem(install, kind) {
  if (typeof install !== 'object' || install === null) return 'install is missing'
  switch (install.type) {
    case 'plugin':
      if (kind !== 'plugin') return 'plugin install on a non-plugin entry'
      if (typeof install.name !== 'string' || install.name === '') return 'plugin install names no package'
      if (typeof install.version !== 'string' || install.version === '') return 'plugin install names no version'
      return undefined
    case 'mcp':
      if (kind !== 'mcp') return 'mcp install on a non-mcp entry'
      if (install.runner !== 'npx' && install.runner !== 'uvx') return 'mcp runner must be npx or uvx'
      if (typeof install.package !== 'string' || !PACKAGE_NAME.test(install.package)) return 'mcp package is invalid'
      if (typeof install.version !== 'string' || !PINNED_VERSION.test(install.version)) return 'mcp version must be exact'
      if (install.bin !== undefined && (typeof install.bin !== 'string' || !BIN_NAME.test(install.bin))) return 'mcp bin is invalid'
      if (install.args !== undefined && (!Array.isArray(install.args) || !install.args.every(arg => typeof arg === 'string'))) {
        return 'mcp args must be strings'
      }
      return undefined
    case 'skill':
      if (kind !== 'skill') return 'skill install on a non-skill entry'
      if (typeof install.repo !== 'string' || !REPO.test(install.repo)) return 'skill repo must be owner/repo'
      if (typeof install.commit !== 'string' || !COMMIT.test(install.commit)) return 'skill commit must be a full hash'
      if (!Array.isArray(install.skills) || install.skills.length === 0) return 'skill install lists no skills'
      for (const skill of install.skills) {
        if (typeof skill?.name !== 'string' || !SKILL_NAME.test(skill.name)) return `skill name ${skill?.name} is invalid`
        if (!safeRelativePath(skill.path)) return `skill path ${skill.path} is invalid`
      }
      return undefined
    case 'manual':
      return isLocalized(install.steps) ? undefined : 'manual install has no steps'
    default:
      return `unknown install type ${install.type}`
  }
}

/**
 * Validate the bundled marketing catalog.
 * @param {unknown} document - the parsed `marketing-catalog.json`.
 * @returns {{ categories: object[], entries: object[] }} the catalog.
 * @throws {Error} naming the first invalid entry; the file ships with the package, so any defect is a packaging error.
 */
export function validateMarketingCatalog(document) {
  if (typeof document !== 'object' || document === null || document.format !== 1) throw new Error('marketing catalog: format must be 1')
  if (!Array.isArray(document.categories) || !Array.isArray(document.entries)) throw new Error('marketing catalog: categories and entries are required')
  const categoryIds = new Set()
  for (const category of document.categories) {
    if (typeof category?.id !== 'string' || !isLocalized(category.title)) throw new Error('marketing catalog: invalid category')
    categoryIds.add(category.id)
  }
  const ids = new Set()
  const skillNames = new Map()
  for (const entry of document.entries) {
    const where = `marketing catalog entry ${entry?.id ?? '?'}`
    if (typeof entry?.id !== 'string' || !ENTRY_ID.test(entry.id)) throw new Error(`${where}: id is invalid`)
    if (ids.has(entry.id)) throw new Error(`${where}: duplicate id`)
    ids.add(entry.id)
    if (!KINDS.includes(entry.kind)) throw new Error(`${where}: unknown kind`)
    if (!ACCESS.includes(entry.access)) throw new Error(`${where}: unknown access`)
    if (!isLocalized(entry.title) || !isLocalized(entry.description)) throw new Error(`${where}: title and description need English`)
    if (entry.access !== 'none' && !isLocalized(entry.setup)) throw new Error(`${where}: access ${entry.access} needs setup text`)
    if (!Array.isArray(entry.categories) || entry.categories.length === 0 || !entry.categories.every(id => categoryIds.has(id))) {
      throw new Error(`${where}: categories must name declared categories`)
    }
    if (entry.env !== undefined && (!Array.isArray(entry.env) || !entry.env.every(name => typeof name === 'string' && ENV_NAME.test(name)))) {
      throw new Error(`${where}: env names are invalid`)
    }
    const problem = installProblem(entry.install, entry.kind)
    if (problem !== undefined) throw new Error(`${where}: ${problem}`)
    if (entry.install.type === 'skill') {
      for (const skill of entry.install.skills) {
        const owner = skillNames.get(skill.name)
        if (owner !== undefined) throw new Error(`${where}: skill ${skill.name} is also installed by ${owner}`)
        skillNames.set(skill.name, entry.id)
      }
    }
  }
  return { categories: document.categories, entries: document.entries }
}

/**
 * The stdio command one MCP entry runs.
 * @param {{ runner: 'npx' | 'uvx', package: string, version: string, bin?: string, args?: string[] }} install - the pinned install.
 * @returns {{ command: string, args: string[] }} the command line.
 */
export function mcpCommand(install) {
  const extra = install.args ?? []
  if (install.runner === 'npx') {
    const spec = `${install.package}@${install.version}`
    return install.bin === undefined
      ? { command: 'npx', args: ['-y', spec, ...extra] }
      : { command: 'npx', args: ['-y', '--package', spec, install.bin, ...extra] }
  }
  const spec = `${install.package}==${install.version}`
  return install.bin === undefined
    ? { command: 'uvx', args: [spec, ...extra] }
    : { command: 'uvx', args: ['--from', spec, install.bin, ...extra] }
}

/** @param {string} id - entry id. @returns {string} the Loader row id of its MCP client. */
export function mcpRowId(id) {
  return `mkt-mcp-${id}`
}

/** @param {string} id - entry id. @returns {string} the MCP server name, which prefixes its tool names. */
export function mcpServerName(id) {
  return `mkt-${id}`
}
