/**
 * Crew vocabulary: a versioned multi-agent specification, its run states, the
 * durable flow ledger every step reads from, and the A2A envelope carried
 * between agents. Runtime behavior belongs to the installed provider.
 * @module @tomato/experimental-robot-crew
 */

import type { Branded } from '@tomato/branded'

/** Stable identity of one crew specification across its revisions. */
export type CrewSpecId = Branded<'CrewSpecId'>

/** Stable identity of one crew run. */
export type CrewRunId = Branded<'CrewRunId'>

/** One published revision of a crew specification. */
export interface CrewSpecRef {
  /** Specification identity shared by every revision. */
  readonly spec: CrewSpecId
  /** Positive revision number; every publish increments it. */
  readonly revision: number
}

/** How a node contributes to the crew. */
export type CrewNodeRole = 'worker' | 'reviewer' | 'observer'

/** What flows across one edge. */
export type CrewEdgeKind = 'handoff' | 'delegate' | 'review'

/** Which completed node states an edge admits. */
export type CrewEdgeWhen = 'always' | 'onSuccess'

/** Canvas position of one node, stored so an editor reopens the same graph. */
export interface CrewNodePosition {
  /** Horizontal offset in canvas pixels. */
  readonly x: number
  /** Vertical offset in canvas pixels. */
  readonly y: number
}

/** Reference to one published robot revision; the provider resolves it at run time. */
export interface CrewRobotRef {
  /** Robot specification identity. */
  readonly spec: string
  /** Positive published revision. */
  readonly revision: number
}

/** One agent in the crew. */
export interface CrewNode {
  /** Lowercase slug unique inside the crew; also the A2A address. */
  readonly id: string
  /** Short display name. */
  readonly label: string
  /** One sentence naming what this node is responsible for. */
  readonly role: string
  /** Task text this node receives, after the shared brief. */
  readonly instruction: string
  /** Published robot whose specification supplies capabilities; absent runs a bare agent. */
  readonly robot?: CrewRobotRef
  /** Canvas position used by the editor. */
  readonly at?: CrewNodePosition
  /** Execution strategy of the crew graph. */
  readonly kind: CrewNodeRole
  /** Turns one activation may take before its output is final. */
  readonly maxTurns: number
  /** Model-token ceiling for one activation. */
  readonly budgetTokens: number
}

/** One directed handoff between two nodes. */
export interface CrewEdge {
  /** Source node id. */
  readonly from: string
  /** Target node id. */
  readonly to: string
  /** Message intent the edge carries. */
  readonly kind: CrewEdgeKind
  /** Completion states of the source that admit the edge. */
  readonly when: CrewEdgeWhen
}

/** How the crew extracts execution memory from finished steps. */
export interface CrewMemorySpec {
  /** Character budget of the brief one node receives. */
  readonly briefChars: number
  /** Characters kept from one upstream result. */
  readonly artifactChars: number
  /** Whether finished steps contribute extracted decisions and constraints. */
  readonly extract: boolean
}

/**
 * Loop protection limits. Every limit is a deployment value: a run that reaches
 * one settles as `tripped` with the exceeded limit named, never by silently
 * dropping work.
 */
export interface CrewGuardSpec {
  /** Maximum node activations in one run. */
  readonly maxSteps: number
  /** Maximum A2A messages in one run. */
  readonly maxMessages: number
  /** Maximum A2A forwarding depth from an originating node. */
  readonly maxHops: number
  /** Times one identical message signature may be delivered. */
  readonly maxDuplicates: number
  /** Consecutive near-identical step outputs that mean no progress. */
  readonly noProgressWindow: number
  /** Wall-clock ceiling in milliseconds. */
  readonly wallClockMs: number
  /** Approximate model-token ceiling for the whole run. */
  readonly tokens: number
}

/** Agent-to-agent admission. */
export interface CrewA2aSpec {
  /** Intents nodes accept from peers. */
  readonly intents: readonly A2aIntent[]
  /** Node ids allowed to be called directly; empty admits every graph peer. */
  readonly peers: readonly string[]
}

/** One complete crew definition submitted for publication. */
export interface CrewSpec {
  /** Display name unique among crews. */
  readonly name: string
  /** Optional one-line summary. */
  readonly description?: string
  /** One-sentence purpose every node keeps in view. */
  readonly mission: string
  /** Observable conditions that mean the run succeeded. */
  readonly successCriteria: readonly string[]
  /** Conditions that stop the run before success. */
  readonly stopConditions: readonly string[]
  /** Agent nodes. */
  readonly nodes: readonly CrewNode[]
  /** Directed handoffs; the graph must stay acyclic. */
  readonly edges: readonly CrewEdge[]
  /** Memory extraction policy. */
  readonly memory: CrewMemorySpec
  /** Loop protection limits. */
  readonly guard: CrewGuardSpec
  /** Agent-to-agent admission. */
  readonly a2a: CrewA2aSpec
  /** Input contract: the run message a person supplies. */
  readonly input: CrewInputSpec
  /** Absolute directory every node agent works in; omitted uses the deployment's first Workspace. */
  readonly workspaceRoot?: string
}

/** How a crew run starts and what it delivers. */
export interface CrewInputSpec {
  /** Prompt shown in the editor for the run message. */
  readonly prompt: string
  /** Delivery path of the final output. */
  readonly delivery: 'chat' | 'artifact'
}

/** Durable crew run lifecycle state. */
export type CrewRunState = 'queued' | 'running' | 'succeeded' | 'failed' | 'tripped' | 'cancelled'

/** Lifecycle of one node inside one run. */
export type CrewNodeState = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'

/** Why the guard stopped a run. */
export type CrewTripReason =
  | 'steps'
  | 'messages'
  | 'hops'
  | 'duplicates'
  | 'tokens'
  | 'wall-clock'
  | 'no-progress'

/** Loop-protection verdict for one candidate A2A message. */
export type CrewA2aRefusal = 'duplicate' | 'hops' | 'messages' | 'unknown-peer' | 'self' | 'intent' | 'scope'

/** One node's progress inside one run. */
export interface CrewNodeProgress {
  /** Node id. */
  readonly id: string
  /** Current node state. */
  readonly state: CrewNodeState
  /** Turns consumed by this node. */
  readonly turns: number
  /** First line of this node's latest output, kept for the run list. */
  readonly summary?: string
}

/** One activation of a crew. */
export interface CrewRun {
  /** Stable run identity. */
  readonly id: CrewRunId
  /** Specification revision the run executes. */
  readonly spec: CrewSpecRef
  /** Display name copied from the revision. */
  readonly name: string
  /** Current run state. */
  readonly state: CrewRunState
  /** Message the run started with. */
  readonly input: string
  /** Unix epoch milliseconds when the run was accepted. */
  readonly startedAt: number
  /** Unix epoch milliseconds when the run reached a terminal state. */
  readonly endedAt?: number
  /** Final node output for a succeeded run. */
  readonly output?: string
  /** Failure, cancellation, or guard detail. */
  readonly error?: string
  /** Exceeded guard limit; present only for `tripped`. */
  readonly trip?: CrewTripReason
  /** Per-node progress in specification order. */
  readonly nodes: readonly CrewNodeProgress[]
  /** Approximate model tokens the run consumed. */
  readonly tokens: number
  /** Delivered A2A messages. */
  readonly messages: number
  /** Activations this run consumed. */
  readonly steps: number
}

/** Record family that changed. */
export type CrewChangeKind = 'specs' | 'runs' | 'entries'

/** One immutable published specification revision. */
export interface CrewSpecRevision {
  /** Exact revision identity. */
  readonly ref: CrewSpecRef
  /** The published specification. */
  readonly spec: CrewSpec
  /** Unix epoch milliseconds when the revision was published. */
  readonly publishedAt: number
  /** Revision number this one replaces; omitted for revision `1`. */
  readonly supersedes?: number
}

/** What the ledger records. */
export type CrewEntryKind =
  | 'run-start'
  | 'brief'
  | 'step-start'
  | 'step-result'
  | 'memory'
  | 'drift'
  | 'a2a-request'
  | 'a2a-reply'
  | 'handoff'
  | 'guard'
  | 'run-end'

/** One durable flow-ledger entry: the complete-process memory of one run. */
export interface CrewEntry {
  /** Run the entry belongs to. */
  readonly run: CrewRunId
  /** Monotonic sequence inside the run, starting at `1`. */
  readonly seq: number
  /** What happened. */
  readonly kind: CrewEntryKind
  /** Unix epoch milliseconds. */
  readonly at: number
  /** Node the entry concerns, when it concerns one. */
  readonly node?: string
  /** Human-readable body; already bounded by the writer. */
  readonly text?: string
  /** Structured detail the UI renders as labels. */
  readonly data?: Readonly<Record<string, string | number | boolean>>
}

/** One field-level problem found while validating a crew specification. */
export interface CrewSpecIssue {
  /** Dot-separated field path; empty for the whole specification. */
  readonly path: string
  /** Human-readable problem. */
  readonly message: string
}

/** Rejection of one crew specification with every discovered issue. */
export class CrewSpecValidationError extends Error {
  /** Field-level problems that caused the rejection. */
  readonly issues: readonly CrewSpecIssue[]

  /**
   * @param issues - every problem found in the submitted specification.
   */
  constructor(issues: readonly CrewSpecIssue[]) {
    super(`invalid crew specification: ${issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')}`)
    this.name = 'CrewSpecValidationError'
    this.issues = issues
  }
}

/** One intent a node accepts from peers. */
export type A2aIntent = 'request' | 'delegate' | 'event'

/** Protocol identifier carried by every envelope. */
export const A2A_PROTOCOL = 'tomato-a2a/1'

/** One agent-to-agent envelope. */
export interface A2aEnvelope {
  /** Envelope identity. */
  readonly id: string
  /** Exact protocol identifier. */
  readonly protocol: typeof A2A_PROTOCOL
  /** Run the envelope belongs to. */
  readonly run: CrewRunId
  /** Sending node id, or `orchestrator` for graph handoffs. */
  readonly from: string
  /** Receiving node id. */
  readonly to: string
  /** Intent the receiver admits. */
  readonly intent: A2aIntent
  /** Task the receiver must perform. */
  readonly task: string
  /** Context extracted from the sender's flow memory. */
  readonly payload: string
  /** Forwarding depth, starting at `1` for an originating message. */
  readonly hop: number
  /** Envelope this one answers, when it is a reply. */
  readonly replyTo?: string
  /** Unix epoch milliseconds. */
  readonly at: number
}
