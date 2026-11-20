// One-click MCP installs: add or remove one `@tomato/mcp-client` row in the
// running profile's `cordis.patch.yml`. Rows this market owns carry the
// `mkt-mcp-` id prefix and live in one `insert` patch of their own; nothing
// else in the file is read for meaning or rewritten. Each write copies the
// previous file to `cordis.patch.yml.bak-tomato-market`, replaces the file
// atomically, and is undone if the profile refuses the change.
import { access, constants, copyFile, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { delimiter, join } from 'node:path'
import * as yaml from 'js-yaml'
import type { MarketingEntry } from '../api.ts'
import { mcpCommand, mcpRowId, mcpServerName } from './marketing.ts'

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
  predicate: data => typeof data === 'object' && data !== null && typeof (data as { __jsExpr?: unknown }).__jsExpr === 'string',
  represent: data => (data as { __jsExpr: string }).__jsExpr,
}))

/** One Loader patch as this file writes it. */
interface Patch {
  readonly insert?: readonly Row[]
  readonly [field: string]: unknown
}

/** One Loader row. */
interface Row {
  readonly id?: unknown
  readonly name?: unknown
  readonly config?: unknown
}

/**
 * @param text - patch file text.
 * @returns the parsed patch list; an empty or comments-only file reads as `[]`.
 */
function parsePatches(text: string): Patch[] {
  const parsed = yaml.load(text, { schema: SCHEMA })
  if (parsed === undefined || parsed === null) return []
  if (!Array.isArray(parsed)) throw new Error('cordis.patch.yml is not a YAML array of loader patches')
  return parsed as Patch[]
}

/**
 * The market-owned rows declared in one patch file.
 * @param {string} text - patch file text.
 * @returns row id to row, for every `insert` row whose id starts with {@link MCP_ROW_PREFIX}.
 */
export function marketRows(text: string): Map<string, Row> {
  const rows = new Map<string, Row>()
  for (const patch of parsePatches(text)) {
    for (const row of Array.isArray(patch.insert) ? patch.insert : []) {
      if (typeof row.id === 'string' && row.id.startsWith(MCP_ROW_PREFIX)) rows.set(row.id, row)
    }
  }
  return rows
}

/**
 * The expression that hands the named variables to the server. MCP children
 * start from an environment with credential-shaped names removed, so each one
 * must be passed explicitly; unset names stay unset, and only names reach the
 * file, never values.
 * @param names - validated environment variable names.
 * @returns a Loader `!!js` expression evaluating to the env record.
 */
export function envExpression(names: readonly string[]): string {
  return `Object.fromEntries(${JSON.stringify(names)}.flatMap(name => process.env[name] === undefined ? [] : [[name, process.env[name]]]))`
}

/**
 * The Loader row one catalog MCP entry installs.
 * @param entry - a catalog entry whose install type is `mcp`, with the resource variables it reads.
 * @returns the `@tomato/mcp-client` row.
 */
export function mcpRow(entry: MarketingEntry & { readonly env?: readonly string[] }): Row {
  const { command, args } = mcpCommand(entry)
  const config: Record<string, unknown> = { serverName: mcpServerName(entry.id), transport: 'stdio', command, args }
  if (entry.env !== undefined && entry.env.length > 0) config.env = { __jsExpr: envExpression(entry.env) }
  return { id: mcpRowId(entry.id), name: '@tomato/mcp-client', config }
}

/**
 * @param rows - Loader rows.
 * @returns the patch block that inserts them.
 */
function dumpBlock(rows: readonly Row[]): string {
  return yaml.dump([{ insert: rows }], { schema: SCHEMA, lineWidth: -1, noRefs: true })
}

/**
 * @param entry - an MCP catalog entry.
 * @returns the YAML its install appends.
 */
export function mcpRowYaml(entry: MarketingEntry): string {
  return `${BLOCK_COMMENT}\n${dumpBlock([mcpRow(entry)])}${BLOCK_END}\n`
}

/**
 * Split the file around the market block, which runs from {@link BLOCK_COMMENT}
 * to {@link BLOCK_END}. Text outside it is kept byte for byte.
 * @param {string} text - patch file text.
 * @returns the text around the block and the rows inside it.
 * @throws {Error} when the block holds anything but market rows.
 */
function splitBlock(text: string): { head: string; tail: string; rows: Row[] } {
  const start = text.indexOf(BLOCK_COMMENT)
  if (start === -1) return { head: text, tail: '', rows: [] }
  const end = text.indexOf(BLOCK_END, start)
  if (end === -1) throw new Error('the tomato-market block in cordis.patch.yml lost its end comment; restore it or remove the block by hand')
  const rows: Row[] = []
  for (const patch of parsePatches(text.slice(start, end))) {
    const keys = typeof patch === 'object' && patch !== null ? Object.keys(patch) : []
    if (keys.length !== 1 || keys[0] !== 'insert' || !Array.isArray(patch.insert)
      || !patch.insert.every(row => typeof row.id === 'string' && row.id.startsWith(MCP_ROW_PREFIX))) {
      throw new Error('the tomato-market block in cordis.patch.yml was edited by hand; move your own entries out of it')
    }
    rows.push(...patch.insert)
  }
  return { head: text.slice(0, start), tail: text.slice(end + BLOCK_END.length).replace(/^\n/, ''), rows }
}

/**
 * Render the patch file with the market block replaced.
 * @param text - current patch file text.
 * @param rows - the market rows to keep, in order.
 * @returns the next file text.
 */
export function renderWithRows(text: string, rows: readonly Row[]): string {
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

/** One profile recomposition result. */
export interface AppliedProfile {
  readonly application: 'applied' | 'restart-required'
  readonly warnings: readonly unknown[]
}

/** Serialization and recomposition of the running profile. */
export interface LiveProfile {
  /** @returns the operation's result, run with the profile's other configuration writers. */
  run<T>(operation: () => Promise<T>): Promise<T>
  /** @returns the profile's answer to a recomposition with the required rows. */
  apply(requiredIds: readonly string[]): Promise<AppliedProfile>
}

/** The MCP installer for one profile patch file. */
export interface McpInstaller {
  /** @returns catalog entry ids whose rows the file declares. */
  installed(): Promise<string[]>
  /** Add or replace one entry's row. */
  install(entry: MarketingEntry): Promise<{ readonly row: string } & AppliedProfile>
  /** Remove one entry's row; rows outside the market block are never touched. */
  uninstall(id: string): Promise<{ readonly removed: boolean } & Partial<AppliedProfile>>
}

/** Writes without a live profile: the file changes and takes effect at the next start. */
const STARTUP_ONLY: LiveProfile = {
  run: operation => operation(),
  apply: async () => ({ application: 'restart-required', warnings: [] }),
}

/**
 * Build the MCP installer for one profile patch file.
 * @param options - installer settings.
 * @returns `installed`, `install`, and `uninstall`.
 */
export function createMcpInstaller({ patchPath, profile = STARTUP_ONLY }: {
  /** The running profile's `cordis.patch.yml`. */
  readonly patchPath: string
  /** Serialization and recomposition, which the installer uses for every write. */
  readonly profile?: LiveProfile
}): McpInstaller {
  let queue: Promise<unknown> = Promise.resolve()
  /** One write at a time: concurrent clicks must not lose a row. */
  const exclusive = <T>(operation: () => Promise<T>): Promise<T> => {
    const run = queue.then(() => profile.run(operation), () => profile.run(operation))
    queue = run.catch(() => undefined)
    return run
  }
  const readCurrent = async (): Promise<string> => {
    try {
      return await readFile(patchPath, 'utf8')
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') return ''
      throw error
    }
  }
  const writeAtomically = async (text: string): Promise<void> => {
    const temporary = `${patchPath}.tomato-market.tmp`
    try {
      await writeFile(temporary, text)
      await rename(temporary, patchPath)
    } finally {
      await rm(temporary, { force: true })
    }
  }
  const backupPath = `${patchPath}.bak-tomato-market`
  const replace = async (before: string, next: string, requiredIds: readonly string[]): Promise<AppliedProfile> => {
    // The result must still parse as a patch list before the file is touched.
    parsePatches(next)
    if (before !== '') await copyFile(patchPath, backupPath)
    await writeAtomically(next)
    try {
      return await profile.apply(requiredIds)
    } catch (error) {
      const reason = (error as Error)?.message ?? String(error)
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
    install(entry: MarketingEntry): Promise<{ readonly row: string } & AppliedProfile> {
      return exclusive(async () => {
        const before = await readCurrent()
        const { head, tail, rows } = splitBlock(before)
        const row = mcpRow(entry)
        const id = String(row.id)
        if (marketRows(`${head}${tail}`).has(id)) throw new Error(`${id} sits outside the tomato-market block; remove it from cordis.patch.yml first`)
        const next = renderWithRows(before, [...rows.filter(kept => String(kept.id) !== id), row])
        return { row: id, ...await replace(before, next, [id]) }
      })
    },
    /** Remove one entry's row; rows outside the market block are never touched. */
    uninstall(id: string): Promise<{ readonly removed: boolean } & Partial<AppliedProfile>> {
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
 * @param name - executable name.
 * @param env - environment to read `PATH` from.
 * @returns whether a matching executable exists.
 */
export async function onPath(name: string, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
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
