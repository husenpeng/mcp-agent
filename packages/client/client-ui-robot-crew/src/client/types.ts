/** Internal shared types of the crew studio components. */

import type { CrewEntry, CrewNode, CrewRun, CrewRunId, CrewSpec, CrewSpecRevision } from '@tomato/experimental-robot-crew'
import type { RemoteResult } from '@tomato/typert-protocol'

/** One selectable robot revision a node may borrow capabilities from. */
export interface RobotOption {
  /** Published robot specification id. */
  readonly spec: string
  /** Revision number. */
  readonly revision: number
  /** Display name of the robot specification. */
  readonly name: string
}

/** Observable robot catalog the page may read. */
export interface RobotCatalogSource {
  getSnapshot(): RobotCatalogSnapshot
  subscribe(listener: () => void): () => void
}

/** Snapshot the studio reads for the robot picker. */
export interface RobotCatalogSnapshot {
  readonly options: readonly RobotOption[]
}

/** Actions the page calls; every one returns the Remote business result. */
export interface CrewActions {
  readonly publish: (request: { readonly spec: CrewSpec; readonly previous?: CrewSpecRevision['ref'] }) => Promise<RemoteResult<CrewSpecRevision>>
  readonly start: (request: { readonly ref: CrewSpecRevision['ref']; readonly message: string }) => Promise<RemoteResult<CrewRun>>
  readonly cancel: (request: { readonly runId: CrewRunId }) => Promise<RemoteResult<void>>
  /** Follow one run's ledger while it is live. */
  readonly track: (runId: CrewRunId | undefined, live: boolean) => void
}

/** What the studio needs from the plugin's inject face. */
export interface CrewStudioInjected {
  readonly hooks: {
    /** Crew roster snapshot. */
    readonly registry: import('@tomato/api-robot-crew-controller/client').CrewRunsSource
    /** Robot revisions a member may borrow capabilities from. */
    readonly robots: RobotCatalogSource
    /** Selected run's flow ledger. */
    readonly ledger: import('./ledger.ts').CrewLedgerSource
  }
  readonly actions: CrewActions
  /** Open a conversation that creates a crew with `robot_crew_create`. */
  readonly createWithConversation: () => void
  /** Working directory a new crew records; absent when no Workspace is open. */
  readonly workspaceRoot: () => string | undefined
}

/** What the multi-agent collaboration tab needs from the plugin's inject face. */
export interface GroupChatInjected {
  readonly hooks: {
    /** Crew roster snapshot. */
    readonly registry: import('@tomato/api-robot-crew-controller/client').CrewRunsSource
    /** Selected run's flow ledger. */
    readonly ledger: import('./ledger.ts').CrewLedgerSource
  }
  /** Roster actions the tab calls. */
  readonly actions: CrewActions
  /** Open a conversation that creates a crew with `robot_crew_create`. */
  readonly createWithConversation: () => void
  /** Switch to the canvas that edits this crew's graph. */
  readonly openCanvas: () => void
  /** Working directory a new crew records; absent when no Workspace is open. */
  readonly workspaceRoot: () => string | undefined
}

/** One selected handoff in the canvas. */
export interface SelectedEdge {
  readonly from: string
  readonly to: string
}

/** One ledger filter. */
export type LedgerFilter = 'all' | 'steps' | 'memory' | 'a2a' | 'guard'

/** Notice shown in the toolbar. */
export interface Notice {
  readonly tone: 'success' | 'warning' | 'error'
  readonly text: string
}

/** Entry group a filter admits. */
export function matchesFilter(entry: CrewEntry, filter: LedgerFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'steps') return entry.kind === 'step-start' || entry.kind === 'step-result' || entry.kind === 'brief'
  if (filter === 'memory') return entry.kind === 'memory' || entry.kind === 'drift'
  if (filter === 'a2a') return entry.kind === 'a2a-request' || entry.kind === 'a2a-reply' || entry.kind === 'handoff'
  return entry.kind === 'guard'
}

/** Whether a node has no successors. */
export function isLeaf(nodes: readonly CrewNode[], edges: readonly { readonly from: string }[], id: string): boolean {
  return nodes.length > 0 && !edges.some(edge => edge.from === id)
}

/** Patch accepted by the crew editor; an explicit `undefined` clears an optional field. */
export type CrewPatch = { [K in keyof import('@tomato/experimental-robot-crew').CrewSpec]?: import('@tomato/experimental-robot-crew').CrewSpec[K] | undefined }

/** Patch accepted by the member editor. */
export type NodePatch = { [K in keyof import('@tomato/experimental-robot-crew').CrewNode]?: import('@tomato/experimental-robot-crew').CrewNode[K] | undefined }

/** Patch accepted by the handoff editor. */
export type EdgePatch = { [K in keyof import('@tomato/experimental-robot-crew').CrewEdge]?: import('@tomato/experimental-robot-crew').CrewEdge[K] | undefined }
