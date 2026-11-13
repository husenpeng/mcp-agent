/**
 * Reads vendored Claude knowledge-work plugins and converts their skills into
 * the Tomato skill vocabulary: frontmatter fields the runtime validates, a
 * globally unique name, and a body whose Claude-only references name a skill
 * or a connector category instead of a slash command or `~~placeholder`.
 * @module @tomato/experimental-robot-templates-knowledge-work/plugins
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'

/** One skill read from a vendored plugin. */
export interface KnowledgeSkill {
  /** Skill name declared in frontmatter; unique inside its plugin. */
  readonly name: string
  /** One-line catalog description. */
  readonly description: string
  /** Instruction body with Claude-only references rewritten. */
  readonly body: string
  /** Absolute directory holding `SKILL.md` and any referenced resources. */
  readonly directory: string
}

/** One MCP server declared by a vendored plugin. */
export interface McpDeclaration {
  /** Name as written in `.mcp.json`. */
  readonly name: string
  /** Endpoint URL, empty when Claude expects the user to supply one. */
  readonly url: string
  /** Whether Claude performs an interactive OAuth grant for this server. */
  readonly oauth: boolean
}

/** One vendored Claude plugin with its manifest and skills. */
export interface KnowledgePlugin {
  /** Directory name, which is also the role id used by templates. */
  readonly id: string
  /** `version` from `.claude-plugin/plugin.json`; `0.0.0` when absent. */
  readonly version: string
  /** One-line summary from the manifest. */
  readonly description: string
  /** MCP servers declared in `.mcp.json`, in declaration order. */
  readonly mcpServers: readonly McpDeclaration[]
  /** Skills in directory-name order. */
  readonly skills: readonly KnowledgeSkill[]
}

interface Manifest {
  readonly name?: unknown
  readonly version?: unknown
  readonly description?: unknown
}

/**
 * Split one `SKILL.md` into parsed frontmatter fields and its body.
 * @param raw - complete file text.
 * @param path - file path used in failure messages.
 * @returns the frontmatter object and the body after the closing delimiter.
 * @throws when the file has no frontmatter block or the block is not a YAML mapping.
 */
function frontmatter(raw: string, path: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n(?<front>[\s\S]*?)\r?\n---(?:\r?\n|$)(?<body>[\s\S]*)$/u.exec(raw)
  const front = match?.groups?.front
  const body = match?.groups?.body
  if (front === undefined || body === undefined) throw new Error(`${path}: SKILL.md has no YAML frontmatter block`)
  const data: unknown = parseYaml(front)
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${path}: frontmatter must be a YAML mapping`)
  }
  return { data: data as Record<string, unknown>, body }
}

/**
 * Collect the connector labels a plugin documents, longest first so that a
 * multi-word label wins over its first word.
 * @param directory - plugin directory that may hold `CONNECTORS.md`.
 * @returns placeholder labels without the `~~` prefix.
 */
function connectorLabels(directory: string): readonly string[] {
  const path = join(directory, 'CONNECTORS.md')
  if (!existsSync(path)) return []
  const labels = new Set<string>()
  for (const match of readFileSync(path, 'utf8').matchAll(/`~~(?<label>[^`]+)`/gu)) {
    if (match.groups?.label !== undefined) labels.add(match.groups.label.trim())
  }
  return [...labels].sort((left, right) => right.length - left.length)
}

/**
 * Replace Claude's `~~category` placeholders with a phrase a Tomato model can act on.
 * Labels documented in `CONNECTORS.md` are replaced first; a placeholder that
 * names no documented connector falls back to one word, so surrounding prose is
 * never swallowed into the label.
 * @param body - skill instruction text.
 * @param labels - documented connector labels, longest first.
 * @returns text with each placeholder replaced by `<category> tool`.
 */
function rewriteConnectors(body: string, labels: readonly string[]): string {
  let text = body
  for (const label of labels) text = text.replaceAll(`~~${label}`, `${label} tool`)
  return text.replaceAll(/~~(?<label>[a-z0-9][a-z0-9/-]*)/gu, (_, label: string) => `${label} tool`)
}

/**
 * Rewrite slash-command references that name a skill in the same plugin.
 * A reference to a command the plugin does not ship stays verbatim, because
 * only the skill name is guaranteed to resolve in a Tomato run.
 * @param body - skill instruction text.
 * @param names - original skill name to shipped Tomato skill name.
 * @returns text where each resolvable `/name` reads `the <name> skill`.
 */
function rewriteSlashReferences(body: string, names: ReadonlyMap<string, string>): string {
  return body.replaceAll(
    /(^|[\s([{])\/(?<name>[a-z0-9]+(?:-[a-z0-9]+)*)(?=$|[\s.,;:)\]}!?\x60\x22\x27])/gmu,
    (match: string, prefix: string, name: string) => {
      const shipped = names.get(name)
      return shipped === undefined ? match : `${prefix}the ${shipped} skill`
    },
  )
}

/**
 * Rewrite `$ARGUMENTS`, the Claude command placeholder for the text the user
 * typed after the command, into the phrase a Tomato run reads.
 * @param body - command instruction text.
 * @returns text that names the user's request instead of the placeholder.
 */
function rewriteArguments(body: string): string {
  return body.replaceAll('$ARGUMENTS', "the user's request")
}

/**
 * Rewrite every Claude-only reference in one instruction body.
 * @param body - skill or command text.
 * @param names - original name to shipped Tomato skill name for this plugin.
 * @param labels - documented connector labels, longest first.
 * @returns the body a Tomato run should read.
 */
function renderBody(body: string, names: ReadonlyMap<string, string>, labels: readonly string[]): string {
  return rewriteSlashReferences(rewriteArguments(rewriteConnectors(body, labels)).trim(), names)
}

/**
 * Normalize one frontmatter description to a single catalog line.
 * @param value - parsed frontmatter value.
 * @param path - file path used in the failure message.
 * @returns the trimmed one-line description.
 * @throws when the value is not a non-empty string.
 */
function catalogDescription(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${path}: frontmatter has no description`)
  return value.replaceAll(/\s+/gu, ' ').trim()
}

/**
 * List the skill directories and command files a plugin ships.
 * @param root - plugin directory.
 * @returns skill directory names and command file names without the extension.
 */
function shippedNames(root: string): readonly string[] {
  const skillsRoot = join(root, 'skills')
  const commandsRoot = join(root, 'commands')
  const skills = existsSync(skillsRoot)
    ? readdirSync(skillsRoot)
      .filter(entry => statSync(join(skillsRoot, entry)).isDirectory() && existsSync(join(skillsRoot, entry, 'SKILL.md')))
    : []
  const commands = existsSync(commandsRoot)
    ? readdirSync(commandsRoot)
      .filter(entry => entry.endsWith('.md') && statSync(join(commandsRoot, entry)).isFile())
      .map(entry => entry.slice(0, -'.md'.length))
    : []
  return [...skills, ...commands].sort()
}

/**
 * Read every skill and command of one vendored plugin, converting both to the
 * Tomato skill vocabulary. A command is a user-invocable skill whose body once
 * carried `$ARGUMENTS`.
 * @param root - plugin directory holding `skills/` and optionally `commands/`.
 * @param names - original name to shipped Tomato skill name.
 * @returns skills and commands in name order.
 * @throws when a file is malformed, a skill name differs from its directory, or a name is not yet mapped.
 */
function readSkills(root: string, names: ReadonlyMap<string, string>): readonly KnowledgeSkill[] {
  const skillsRoot = join(root, 'skills')
  const commandsRoot = join(root, 'commands')
  const labels = connectorLabels(root)
  const read = (path: string, directory: string, declared: string, requireName: boolean): KnowledgeSkill => {
    const { data, body } = frontmatter(readFileSync(path, 'utf8'), path)
    const name = data.name ?? (requireName ? undefined : declared)
    if (name !== declared) throw new Error(`${path}: frontmatter name must be "${declared}", got ${JSON.stringify(name)}`)
    const shipped = names.get(declared)
    if (shipped === undefined) throw new Error(`${path}: no shipped name was assigned`)
    return {
      name: shipped,
      description: catalogDescription(data.description, path),
      body: renderBody(body, names, labels),
      directory: directory.split(sep).join('/'),
    }
  }
  const skills = existsSync(skillsRoot)
    ? readdirSync(skillsRoot)
      .filter(entry => statSync(join(skillsRoot, entry)).isDirectory() && existsSync(join(skillsRoot, entry, 'SKILL.md')))
      .map((entry) => {
        const directory = join(skillsRoot, entry)
        return read(join(directory, 'SKILL.md'), directory, entry, true)
      })
    : []
  const commands = existsSync(commandsRoot)
    ? readdirSync(commandsRoot)
      .filter(entry => entry.endsWith('.md') && statSync(join(commandsRoot, entry)).isFile())
      .map(entry => read(join(commandsRoot, entry), commandsRoot, entry.slice(0, -'.md'.length), false))
    : []
  return [...skills, ...commands].sort((left, right) => left.name.localeCompare(right.name))
}

/**
 * Read one JSON file and report its path when the text is not valid JSON.
 * @param path - absolute file path.
 * @returns the parsed value as a loosely typed object.
 * @throws when the file cannot be parsed.
 */
function readJson(path: string): Record<string, unknown> {
  const text = readFileSync(path, 'utf8')
  try {
    const value: unknown = JSON.parse(text)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('JSON value is not an object')
    return value as Record<string, unknown>
  } catch (error) {
    throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Read one plugin manifest and its skill names, before collision renaming.
 * @param directory - vendored plugin directory.
 * @returns the role id, manifest fields, declared MCP server names, and original skill names.
 * @throws when the manifest is missing, unreadable, or names a different plugin.
 */
function inspectPlugin(directory: string): {
  id: string
  version: string
  description: string
  mcpServers: readonly McpDeclaration[]
  names: readonly string[]
} {
  const id = basename(directory)
  const manifestPath = join(directory, '.claude-plugin', 'plugin.json')
  const mcpPath = join(directory, '.mcp.json')
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) as Manifest : {}
  if (manifest.name !== undefined && manifest.name !== id) {
    throw new Error(`${manifestPath}: manifest name ${JSON.stringify(manifest.name)} differs from directory "${id}"`)
  }
  const description = typeof manifest.description === 'string' ? manifest.description : ''
  const declaredServers = existsSync(mcpPath) ? readJson(mcpPath)['mcpServers'] : undefined
  const mcpServers = typeof declaredServers === 'object' && declaredServers !== null && !Array.isArray(declaredServers)
    ? Object.entries(declaredServers).map(([name, value]) => {
      const config = typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
      return {
        name,
        url: typeof config.url === 'string' ? config.url : '',
        oauth: typeof config.oauth === 'object' && config.oauth !== null,
      }
    })
    : []
  const names = shippedNames(directory)
  return {
    id,
    version: typeof manifest.version === 'string' ? manifest.version : '0.0.0',
    description,
    mcpServers,
    names,
  }
}

/**
 * Assign one shipped skill name per original name, prefixing every name that
 * more than one plugin declares with its role id so both versions stay usable.
 * @param roles - role id and original skill names for every vendored plugin.
 * @returns role id to original name to shipped name.
 * @throws when two shipped names coincide after prefixing.
 */
function assignNames(roles: readonly { id: string; names: readonly string[] }[]): ReadonlyMap<string, ReadonlyMap<string, string>> {
  const owners = new Map<string, string[]>()
  for (const role of roles) {
    for (const name of role.names) owners.set(name, [...owners.get(name) ?? [], role.id])
  }
  const shipped = new Set<string>()
  const result = new Map<string, Map<string, string>>()
  for (const role of roles) {
    const names = new Map<string, string>()
    for (const name of role.names) {
      const holder = owners.get(name) ?? []
      const mapped = holder.length > 1 ? `${role.id}-${name}` : name
      if (shipped.has(mapped)) throw new Error(`skill name "${mapped}" is produced twice; extend the renaming rule`)
      shipped.add(mapped)
      names.set(name, mapped)
    }
    result.set(role.id, names)
  }
  return result
}

/**
 * Read every vendored plugin under a root directory.
 * @param root - directory whose children are plugin directories.
 * @param only - role ids to read, in output order; omitted reads every child.
 * @returns plugins with converted skills in directory-name order.
 * @throws when the root is missing or a plugin or skill file is malformed.
 */
export function readPlugins(root: string, only?: readonly string[]): readonly KnowledgePlugin[] {
  if (!existsSync(root)) throw new Error(`${root}: vendored plugin root does not exist`)
  const directories = (only ?? readdirSync(root).sort())
    .map(id => join(root, id))
    .filter(directory => existsSync(join(directory, '.claude-plugin', 'plugin.json')))
  const inspected = directories.map(inspectPlugin)
  const names = assignNames(inspected)
  return inspected.map((plugin) => {
    const mapped = names.get(plugin.id)
    /* v8 ignore next -- inspectPlugin produced every key of names */
    if (mapped === undefined) throw new Error(`${plugin.id}: missing name assignment`)
    return {
      id: plugin.id,
      version: plugin.version,
      description: plugin.description,
      mcpServers: plugin.mcpServers,
      skills: readSkills(join(root, plugin.id), mapped),
    }
  })
}
