/**
 * Robot platform vocabulary: versioned specifications, robot instances, runs, and
 * agent-to-agent contract fields. Runtime behavior belongs to the installed provider.
 * @module @tomato/experimental-robot
 */

import type { Branded } from '@tomato/branded'
import type { SessionId } from '@tomato/session/types'

/** Stable identity of one robot specification across its revisions. */
export type RobotSpecId = Branded<'RobotSpecId'>

/** Stable identity of one robot instance. */
export type RobotId = Branded<'RobotId'>

/** Stable identity of one run. */
export type RunId = Branded<'RunId'>

/** One exact published revision of a specification. */
export interface RobotSpecRef {
  /** Specification identity shared by every revision. */
  readonly spec: RobotSpecId
  /** Positive revision number; every publish increments it. */
  readonly revision: number
}

/** Durable robot lifecycle state. */
export type RobotState = 'provisioning' | 'idle' | 'running' | 'paused' | 'failed' | 'stopped'

/** Durable run lifecycle state. */
export type RunState = 'queued' | 'leased' | 'running' | 'waiting' | 'finalizing' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out'

/** Non-terminal run states an executor reports while it drives a run. */
export type ActiveRunState = Extract<RunState, 'running' | 'waiting' | 'finalizing'>

/** A condition that starts a run. */
export type Trigger =
  | { readonly kind: 'manual' }
  | { readonly kind: 'cron'; readonly expression: string; readonly timeZone: string }
  | { readonly kind: 'event'; readonly topic: string }
  | { readonly kind: 'webhook'; readonly name: string }
  | { readonly kind: 'dependency'; readonly task: string }
  | { readonly kind: 'threshold'; readonly metric: string; readonly above: number }

/** Limits one robot, one run, or one peer pair accepts. */
export interface Budget {
  /** Maximum model tokens. */
  readonly tokens: number
  /** Maximum wall-clock milliseconds. */
  readonly millis: number
  /** Maximum spend in the billing currency. */
  readonly cost: number
  /** Maximum tool calls. */
  readonly toolCalls: number
}

/** Which models, providers, and files a robot may reach. */
export type DataClass = 'public' | 'internal' | 'confidential'

/** Filesystem and command confinement applied to one robot. */
export type SandboxLevel = 'none' | 'workspace' | 'full'

/** Outbound network policy applied to one robot. */
export type NetworkPolicy = 'none' | 'allowlist' | 'any'

/** Where a robot sits in the team and who may call it. */
export interface PositionSpec {
  /** Person or account responsible for the robot. */
  readonly owner: string
  /** Authority this robot escalates to; omitted for a root robot. */
  readonly reportsTo?: string
  /** Robots or users allowed to call this one. */
  readonly callers: readonly string[]
  /** Robots this one is allowed to call. */
  readonly callees: readonly string[]
  /** Escalation order used when the robot cannot settle a decision. */
  readonly escalation: readonly string[]
  /** Who can see the robot and its runs. */
  readonly visibility: 'private' | 'team' | 'organization'
}

/** What the robot is for and how a run starts and stops. */
export interface GoalSpec {
  /** One-sentence purpose. */
  readonly mission: string
  /** Observable conditions that mean the work succeeded. */
  readonly successCriteria: readonly string[]
  /** Conditions that start a run. */
  readonly triggers: readonly Trigger[]
  /** Execution strategy for one run. */
  readonly strategy: 'plan' | 'loop' | { readonly workflow: string }
  /** Conditions that end a run before success. */
  readonly stopConditions: readonly string[]
  /** Action taken when a run fails. */
  readonly failurePolicy: 'retry' | 'pause' | 'fail' | 'escalate'
  /** Per-run limits. */
  readonly budget: Budget
  /** Runs allowed to execute at the same time; `1` serializes the robot. */
  readonly maxConcurrentRuns: number
}

/** Tools, folders, credentials, and confinement available to one robot. */
export interface CapabilitySpec {
  /** Tool admission lists; a tool in both lists is a specification error. */
  readonly tools: { readonly allow: readonly string[]; readonly deny: readonly string[] }
  /** MCP servers mounted for the robot. */
  readonly mcpServers: readonly string[]
  /** Skills available to the robot. */
  readonly skills: readonly string[]
  /** Folders the robot may read or write, after normalization. */
  readonly workspaceRoots: readonly string[]
  /** Data classes the robot may handle. */
  readonly dataClasses: readonly DataClass[]
  /** Credential names the robot may receive. */
  readonly credentials: readonly string[]
  /** Filesystem and command confinement. */
  readonly sandbox: SandboxLevel
  /** Permission preset applied to every run. */
  readonly permissionPreset: string
  /** Outbound network policy. */
  readonly network: NetworkPolicy
}

/** One declared input format and version. */
export interface InputContract {
  /** Schema identifier understood by the provider. */
  readonly schema: string
  /** Positive schema version. */
  readonly version: number
}

/** One declared output format and delivery path. */
export interface OutputContract {
  /** Schema identifier understood by the provider. */
  readonly schema: string
  /** Produced form. */
  readonly format: 'text' | 'markdown' | 'json' | 'file'
  /** Where a finished run delivers the output. */
  readonly delivery: 'chat' | 'task' | 'artifact' | 'webhook'
}

/** What a robot consumes, produces, and how acceptance is judged. */
export interface IoSpec {
  /** Accepted input format. */
  readonly input: InputContract
  /** Produced output format. */
  readonly output: OutputContract
  /** Observable conditions a finished output must meet. */
  readonly acceptance: readonly string[]
}

/** Which memory namespaces a robot reads and writes. */
export interface MemorySpec {
  /** Namespaces read through recall. */
  readonly read: readonly string[]
  /** Namespaces this robot may write. */
  readonly write: readonly string[]
  /** Days a written entry is retained; omitted means no expiry. */
  readonly retentionDays?: number
  /** Retrieval used when the robot recalls entries. */
  readonly recall: 'none' | 'keyword' | 'hybrid'
}

/** One intent a robot accepts from peers. */
export type A2aIntent = 'request' | 'delegate' | 'event'

/** One peer this robot may call and the limits that apply. */
export interface A2aPeer {
  /** Peer name or remote identity. */
  readonly peer: string
  /** Limits applied to one conversation with this peer. */
  readonly budget: Budget
  /** Whether a call to this peer needs human approval. */
  readonly requiresApproval: boolean
}

/** Agent-to-agent admission and limits. */
export interface A2aSpec {
  /** Intents this robot accepts from peers. */
  readonly intents: readonly A2aIntent[]
  /** Peers this robot may call. */
  readonly peers: readonly A2aPeer[]
}

/** One complete robot definition submitted for publication. */
export interface RobotSpec {
  /** Display name unique within the team. */
  readonly name: string
  /** Optional one-line summary. */
  readonly description?: string
  /** Position and authority. */
  readonly position: PositionSpec
  /** Purpose, triggers, and stop rules. */
  readonly goal: GoalSpec
  /** Capability and confinement. */
  readonly capability: CapabilitySpec
  /** Input and output contracts. */
  readonly io: IoSpec
  /** Memory namespaces and recall policy. */
  readonly memory: MemorySpec
  /** Agent-to-agent admission and limits. */
  readonly a2a: A2aSpec
}

/** Stable identity of one robot template. */
export type RobotTemplateId = Branded<'RobotTemplateId'>

/** Localized copy of one template; hiring writes it into the new robot's specification. */
export interface RobotTemplateText {
  /** Label of the template's category, such as "Brand insight". */
  readonly category: string
  /** Robot display name. */
  readonly name: string
  /** One-line summary shown on the template card. */
  readonly description: string
  /** One-sentence purpose. */
  readonly mission: string
  /** Observable conditions that mean a run succeeded. */
  readonly successCriteria: readonly string[]
  /** Observable conditions a finished output must meet. */
  readonly acceptance: readonly string[]
}

/** Specification blocks a template fixes; localized fields come from {@link RobotTemplateText}. */
export interface RobotTemplateSpec {
  readonly position: PositionSpec
  readonly goal: Omit<GoalSpec, 'mission' | 'successCriteria'>
  readonly capability: CapabilitySpec
  readonly io: Omit<IoSpec, 'acceptance'>
  readonly memory: MemorySpec
  readonly a2a: A2aSpec
}

/**
 * One published starting point for a robot. Hiring copies it into a new
 * specification the user owns; later template changes never reach that copy.
 */
export interface RobotTemplate {
  /** Identity unique among registered templates. */
  readonly id: RobotTemplateId
  /** Stable grouping key, such as `brand` or `youtube`. */
  readonly category: string
  /** Copy by lowercase locale id; `en` is required and is the fallback. */
  readonly text: { readonly en: RobotTemplateText; readonly [locale: string]: RobotTemplateText }
  /** Non-localized specification blocks. */
  readonly spec: RobotTemplateSpec
}

/** One immutable published specification revision. */
export interface RobotSpecRevision {
  /** Exact revision identity. */
  readonly ref: RobotSpecRef
  /** The published specification. */
  readonly spec: RobotSpec
  /** Unix epoch milliseconds when the revision was published. */
  readonly publishedAt: number
  /** Revision number this one replaces; omitted for revision `1`. */
  readonly supersedes?: number
}

/** One robot instance bound to a published revision. */
export interface Robot {
  /** Stable robot identity. */
  readonly id: RobotId
  /** Display name copied from the bound specification. */
  readonly name: string
  /** Exact specification revision the robot runs. */
  readonly spec: RobotSpecRef
  /** Current lifecycle state. */
  readonly state: RobotState
  /** Unix epoch milliseconds when the robot was instantiated. */
  readonly createdAt: number
}

/** Input passed to one run. */
export interface RunInput {
  /** Instruction or event content handed to the run. */
  readonly message: string
  /** Task this run serves, when it was started for a task. */
  readonly task?: string
}

/** One activation of a robot. */
export interface Run {
  /** Stable run identity. */
  readonly id: RunId
  /** Robot that owns the run. */
  readonly robot: RobotId
  /** Specification revision the run executed. */
  readonly spec: RobotSpecRef
  /** Current run state. */
  readonly state: RunState
  /** Input the run started with. */
  readonly input: RunInput
  /** Unix epoch milliseconds when the run was accepted. */
  readonly startedAt: number
  /** Session whose log records the execution, once an executor attached one. */
  readonly sessionId?: SessionId
  /** Unix epoch milliseconds when the run reached a terminal state. */
  readonly endedAt?: number
  /** Final assistant text for a succeeded run. */
  readonly output?: string
  /** Failure, timeout, or interruption detail; present for `failed`, `timed_out`, and a pause that expired. */
  readonly error?: string
}

/** Settled result of one run, supplied by its executor. */
export interface RunOutcome {
  /** Terminal state the executor reached. */
  readonly state: Extract<RunState, 'succeeded' | 'failed' | 'cancelled' | 'timed_out'>
  /** Final assistant text; present for `succeeded`. */
  readonly output?: string
  /** Failure detail; present for `failed` and `timed_out`. */
  readonly error?: string
}

/** One field-level problem found while validating a robot specification. */
export interface RobotSpecIssue {
  /** Dot-separated field path; empty for the whole specification. */
  readonly path: string
  /** Human-readable problem. */
  readonly message: string
}

/** Rejection of one robot specification with every discovered issue. */
export class RobotSpecValidationError extends Error {
  /** Field-level problems that caused the rejection. */
  readonly issues: readonly RobotSpecIssue[]

  /**
   * @param issues - every problem found in the submitted specification.
   */
  constructor(issues: readonly RobotSpecIssue[]) {
    super(`invalid robot specification: ${issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')}`)
    this.name = 'RobotSpecValidationError'
    this.issues = issues
  }
}
