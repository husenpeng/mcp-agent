/** JSON-safe page facts the developer page shows beside the gateway log. */
import type { ConnectionState } from '@tomato/client-connection/client'
import type { BootManifest } from '@tomato/client-modules/client'

/** One read of the client composition, without live subscriptions. */
export interface DeveloperPageInfo {
  readonly release: string
  readonly modules: number
  readonly plugins: number
  readonly connection: string
  readonly panel: string
  readonly sessions: number
  readonly slotNodes: number
  readonly slotTree: string
}

/** Sources read once per refresh; every value is a current snapshot. */
export interface DeveloperPageSources {
  readonly manifest: BootManifest
  readonly connection: ConnectionState | undefined
  readonly panel: string | null
  readonly sessions: number
  readonly slotSnapshot: readonly unknown[]
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function countNodes(nodes: readonly unknown[]): number {
  let count = 0
  for (const node of nodes) {
    count += 1
    if (isRecord(node) && Array.isArray(node.children)) count += countNodes(node.children)
  }
  return count
}

/**
 * Read the current client composition for display.
 * @param sources - manifest, connection state, panel, session count, and the live slot tree.
 * @returns the page facts, with an absent release or slot tree rendered as a plain label.
 */
export function readPageInfo(sources: DeveloperPageSources): DeveloperPageInfo {
  return {
    release: sources.manifest.release?.version ?? 'unknown',
    modules: sources.manifest.modules.length,
    plugins: sources.manifest.plugins.length,
    connection: sources.connection ?? 'unknown',
    panel: sources.panel ?? 'conversation',
    sessions: sources.sessions,
    slotNodes: countNodes(sources.slotSnapshot),
    slotTree: JSON.stringify(sources.slotSnapshot, undefined, 2),
  }
}
