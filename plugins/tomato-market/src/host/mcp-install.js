// One-click MCP installs: add or remove one `@tomato/mcp-client` row in the
// running profile's `cordis.patch.yml`. Rows this market owns carry the
// `mkt-mcp-` id prefix and live in one `insert` patch of their own; nothing
// else in the file is read for meaning or rewritten. Each write copies the
// previous file to `cordis.patch.yml.bak-tomato-market`, replaces the file
// atomically, and is undone if the profile refuses the change.
import { access, constants, copyFile, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { delimiter, join } from 'node:path'
import * as yaml from 'js-yaml'
import { mcpCommand, mcpRowId, mcpServerName } from './marketing.js'

/** Prefix of every Loader row this market adds. */
export const MCP_ROW_PREFIX = 'mkt-mcp-'
/** Marks the market's own block, so a reader of the file knows who wrote it. */
const BLOCK_COMMENT = '# tomato-market: marketing MCP servers installed from the Marketing plugins tab. Remove them from the tab.'
/** Ends the market's block; text after it belongs to the user. */
const BLOCK_END = '# tomato-market: end of marketing MCP servers.'

/**
 * The Loader's entry-list YAML dialect: JSON scalars plus `!!js` expressions,
 * which this module keeps as opaque nodes and never evaluates.
 */
const SCHEMA = yaml.JSON_SCHEMA.extend(new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  resolve: data => typeof data === 'string',
  construct: data => ({ __jsExpr: data }),
  predicate: data => typeof data === 'object' && data !== null && typeof data.__jsExpr === 'string',
  represent: data => data.__jsExpr,
}))

/** @param {string} text - patch file text. @returns {unknown[]} the parsed patch list; an empty or comments-only file reads as `[]`. */
function parsePatches(text) {
  const parsed = yaml.load(text, { schema: SCHEMA })
  if (parsed === undefined || parsed === null) return []
  if (!Array.isArray(parsed)) throw new Error('cordis.patch.yml is not a YAML array of loader patches')
  return parsed
}

/**
 * The market-owned rows declared in one patch file.
 * @param {string} text - patch file text.
 * @returns {Map<string, object>} row id to row, for every `insert` row whose id starts with {@link MCP_ROW_PREFIX}.
 */
export function marketRows(text) {
  const rows = new Map()
  for (const patch of parsePatches(text)) {
    for (const row of Array.isArray(patch?.insert) ? patch.insert : []) {
      if (typeof row?.id === 'string' && row.id.startsWith(MCP_ROW_PREFIX)) rows.set(row.id, row)
    }
  }
  return rows
}

/**
 * The expression that hands the named variables to the server. MCP children
 * start from an environment with credential-shaped names removed, so each one
 * must be passed explicitly; unset names stay unset, and only names reach the
 * file, never values.
 * @param {string[]} names - validated environment variable names.
 * @returns {string} a Loader `!!js` expression evaluating to the env record.
 */
export function envExpression(names) {
  return `Object.fromEntries(${JSON.stringify(names)}.flatMap(name => process.env[name] === undefined ? [] : [[name, process.env[name]]]))`
}

/**
 * The Loader row one catalog MCP entry installs.
 * @param {{ id: string, install: object, env?: string[] }} entry - a catalog entry whose install type is `mcp`.
 * @returns {object} the `@tomato/mcp-client` row.
 */
export function mcpRow(entry) {
  const { command, args } = mcpCommand(entry.install)
  const config = { serverName: mcpServerName(entry.id), transport: 'stdio', command, args }
  if (entry.env !== undefined && entry.env.length > 0) config.env = { __jsExpr: envExpression(entry.env) }
  return { id: mcpRowId(entry.id), name: '@tomato/mcp-client', config }
}

/** @param {object[]} rows - Loader rows. @returns {string} the patch block that inserts them. */
function dumpBlock(rows) {
  return yaml.dump([{ insert: rows }], { schema: SCHEMA, lineWidth: -1, noRefs: true })
}

/** @param {{ id: string, install: object, env?: string[] }} entry - an MCP catalog entry. @returns {string} the YAML its install appends. */
export function mcpRowYaml(entry) {
  return `${BLOCK_COMMENT}\n${dumpBlock([mcpRow(entry)])}${BLOCK_END}\n`
}

/**
 * Split the file around the market block, which runs from {@link BLOCK_COMMENT}
 * to {@link BLOCK_END}. Text outside it is kept byte for byte.
 * @param {string} text - patch file text.
 * @returns {{ head: string, tail: string, rows: object[] }} the text around the block and the rows inside it.
 * @throws {Error} when the block holds anything but market rows.
 */
function splitBlock(text) {
  const start = text.indexOf(BLOCK_COMMENT)
  if (start === -1) return { head: text, tail: '', rows: [] }
  const end = text.indexOf(BLOCK_END, start)
  if (end === -1) throw new Error('the tomato-market block in cordis.patch.yml lost its end comment; restore it or remove the block by hand')
  const rows = []
  for (const patch of parsePatches(text.slice(start, end))) {
    const keys = typeof patch === 'object' && patch !== null ? Object.keys(patch) : []
    if (keys.length !== 1 || keys[0] !== 'insert' || !Array.isArray(patch.insert)
      || !patch.insert.every(row => typeof row?.id === 'string' && row.id.startsWith(MCP_ROW_PREFIX))) {
      throw new Error('the tomato-market block in cordis.patch.yml was edited by hand; move your own entries out of it')
    }
    rows.push(...patch.insert)
  }
  return { head: text.slice(0, start), tail: text.slice(end + BLOCK_END.length).replace(/^\n/, ''), rows }
}

/**
 * Render the patch file with the market block replaced.
 * @param {string} text - current patch file text.
 * @param {object[]} rows - the market rows to keep, in order.
 * @returns {string} the next file text.
 */
export function renderWithRows(text, rows) {
  const { head, tail } = splitBlock(text)
  let base = head.replace(/\s*$/, '')
  // A file holding only the empty list `[]` cannot be followed by more list items.
  if (/^(?:\s*#.*\n)*\s*\[\]$/.test(base)) base = base.replace(/\[\]$/, '').replace(/\s*$/, '')
  const prefix = base === '' ? '' : `${base}\n`
  if (rows.length > 0) return `${prefix}${BLOCK_COMMENT}\n${dumpBlock(rows)}${BLOCK_END}\n${tail}`
  const rest = `${prefix}${tail}`
  // A comments-only patch file fails boot, so an empty layer stays the explicit `[]`.
  return parsePatches(rest).length === 0 ? `${rest}[]\n` : rest
}

/** Writes without a live profile: the file changes and takes effect at the next start. */
const STARTUP_ONLY = {
  run: operation => operation(),
  apply: async () => ({ application: 'restart-required', warnings: [] }),
}

/**
 * Build the MCP installer for one profile patch file.
 * @param {object} options - installer settings.
 * @param {string} options.patchPath - the running profile's `cordis.patch.yml`.
 * @param {{ run: (operation: () => Promise<object>) => Promise<object>, apply: (requiredIds: string[]) => Promise<object> }} [options.profile] -
 *   `run` serializes the whole read, write, and apply with the profile's other configuration writers; `apply` recomposes
 *   the profile from the file and rejects when the profile refuses it.
 * @returns {object} `installed`, `install`, and `uninstall`.
 */
export function createMcpInstaller({ patchPath, profile = STARTUP_ONLY }) {
  let queue = Promise.resolve()
  /** One write at a time: concurrent clicks must not lose a row. */
  const exclusive = (operation) => {
    const run = queue.then(() => profile.run(operation), () => profile.run(operation))
    queue = run.catch(() => {})
    return run
  }
  const readCurrent = async () => {
    try {
      return await readFile(patchPath, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') return ''
      throw error
    }
  }
  const writeAtomically = async (text) => {
    const temporary = `${patchPath}.tomato-market.tmp`
    try {
      await writeFile(temporary, text)
      await rename(temporary, patchPath)
    } finally {
      await rm(temporary, { force: true })
    }
  }
  const backupPath = `${patchPath}.bak-tomato-market`
  const replace = async (before, next, requiredIds) => {
    // The result must still parse as a patch list before the file is touched.
    parsePatches(next)
    if (before !== '') await copyFile(patchPath, backupPath)
    await writeAtomically(next)
    try {
      return await profile.apply(requiredIds)
    } catch (error) {
      const reason = error?.message ?? String(error)
      try {
        // A missing file restores to the empty layer: an empty patch file fails boot.
        await writeAtomically(before === '' ? '[]\n' : before)
        await profile.apply([])
      } catch {
        throw new Error(`the profile refused the change and restoring it failed; the previous file is ${backupPath}: ${reason}`)
      }
      throw new Error(`the profile refused the change and was restored: ${reason}`)
    }
  }
  return {
    /** Ids of catalog entries whose rows the file declares. */
    async installed() {
      return [...marketRows(await readCurrent()).keys()].map(id => id.slice(MCP_ROW_PREFIX.length))
    },
    /** Add or replace one entry's row. */
    install(entry) {
      return exclusive(async () => {
        const before = await readCurrent()
        const { head, tail, rows } = splitBlock(before)
        const row = mcpRow(entry)
        if (marketRows(`${head}${tail}`).has(row.id)) throw new Error(`${row.id} sits outside the tomato-market block; remove it from cordis.patch.yml first`)
        const next = renderWithRows(before, [...rows.filter(kept => kept.id !== row.id), row])
        return { row: row.id, ...await replace(before, next, [row.id]) }
      })
    },
    /** Remove one entry's row; rows outside the market block are never touched. */
    uninstall(id) {
      return exclusive(async () => {
        const before = await readCurrent()
        const rowId = mcpRowId(id)
        const { head, tail, rows } = splitBlock(before)
        if (marketRows(`${head}${tail}`).has(rowId)) throw new Error(`${rowId} sits outside the tomato-market block; remove it from cordis.patch.yml by hand`)
        if (rows.every(row => row.id !== rowId)) return { removed: false }
        return { removed: true, ...await replace(before, renderWithRows(before, rows.filter(row => row.id !== rowId)), []) }
      })
    },
  }
}

/**
 * Whether an executable is on the search path MCP children inherit.
 * @param {string} name - executable name.
 * @param {NodeJS.ProcessEnv} [env] - environment to read `PATH` from.
 * @returns {Promise<boolean>} whether a matching executable exists.
 */
export async function onPath(name, env = process.env) {
  const extensions = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : ['']
  for (const directory of (env.PATH ?? env.Path ?? '').split(delimiter)) {
    if (directory === '') continue
    for (const extension of extensions) {
      try {
        await access(join(directory, `${name}${extension}`), constants.X_OK)
        return true
      } catch { /* not in this directory; the next one may hold it */ }
    }
  }
  return false
}
