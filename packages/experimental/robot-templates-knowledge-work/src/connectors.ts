/**
 * Convert the MCP declarations vendored in Claude plugins into `mcp-client`
 * rows a Tomato deployment can mount. Claude performs OAuth for most of these
 * servers; a Tomato row carries only a URL and static headers, so a declaration
 * that needs an interactive grant is reported instead of producing a row that
 * would fail during its first call.
 * @module @tomato/experimental-robot-templates-knowledge-work/connectors
 */

import type { KnowledgePlugin } from './plugins.ts'

/** One mountable `mcp-client` row. */
export interface ConnectorRow {
  /** Namespace for model-facing tool names; matches `[A-Za-z0-9_-]{1,32}`. */
  readonly serverName: string
  /** Streamable HTTP transport, the only transport Claude's declarations use. */
  readonly transport: 'streamable-http'
  /** MCP endpoint. */
  readonly url: string
}

/** Connector declarations that cannot become a row as they stand. */
export interface ConnectorGaps {
  /** Declared server names without an endpoint; the user supplies the URL. */
  readonly missingUrl: readonly string[]
  /** Declared names whose namespace differs, keyed by original name. */
  readonly renamed: Readonly<Record<string, string>>
  /** Declared names that need an interactive OAuth grant before a row can work. */
  readonly needsOAuth: readonly string[]
  /** Namespaces whose declarations disagree on the endpoint; the first declaration wins. */
  readonly conflicting: readonly string[]
}

/** Mountable rows plus the declarations a person must finish by hand. */
export interface ConnectorPlan {
  /** One row per unique endpoint, in declaration order. */
  readonly rows: readonly ConnectorRow[]
  /** Unfinished declarations. */
  readonly gaps: ConnectorGaps
}

/** Longest server namespace `mcp-client` accepts. */
const MAX_SERVER_NAME = 32

/**
 * Normalize a declared server name into an `mcp-client` namespace.
 * @param declared - name as written in `.mcp.json`, possibly with spaces or capitals.
 * @returns a lowercase kebab name of at most 32 characters.
 */
export function serverNamespace(declared: string): string {
  return declared
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
    .slice(0, MAX_SERVER_NAME)
    .replaceAll(/-+$/gu, '')
}

/**
 * Build the mountable rows for every vendored plugin.
 * @param plugins - vendored plugins with their declared MCP servers.
 * @returns unique rows plus the declarations that need a person.
 * @throws when a declared name has no usable namespace.
 */
export function connectorPlan(plugins: readonly KnowledgePlugin[]): ConnectorPlan {
  const rows: ConnectorRow[] = []
  const missingUrl = new Set<string>()
  const needsOAuth = new Set<string>()
  const renamed: Record<string, string> = {}
  const conflicting = new Set<string>()
  const byNamespace = new Map<string, ConnectorRow>()
  for (const plugin of plugins) {
    for (const declared of plugin.mcpServers) {
      if (declared.url === '') {
        missingUrl.add(declared.name)
        continue
      }
      if (declared.oauth) {
        needsOAuth.add(declared.name)
        continue
      }
      const serverName = serverNamespace(declared.name)
      if (serverName === '') throw new Error(`${declared.name}: no usable mcp-client namespace`)
      if (serverName !== declared.name) renamed[declared.name] = serverName
      const existing = byNamespace.get(serverName)
      if (existing !== undefined) {
        if (existing.url !== declared.url) conflicting.add(serverName)
        continue
      }
      const row: ConnectorRow = { serverName, transport: 'streamable-http', url: declared.url }
      byNamespace.set(serverName, row)
      rows.push(row)
    }
  }
  return { rows, gaps: { missingUrl: [...missingUrl], renamed, needsOAuth: [...needsOAuth], conflicting: [...conflicting] } }
}
