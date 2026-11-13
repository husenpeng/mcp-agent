/**
 * Robot Room vocabulary: one durable group conversation, its members, the
 * messages every participant can read, and the A2A v2 envelope carried between
 * members. Runtime behavior, persistence, and transport belong to the installed
 * provider.
 * @module @tomato/experimental-robot-room
 */

import type { Branded } from '@tomato/branded'

/** Stable identity of one room. */
export type RoomId = Branded<'RoomId'>

/** Stable identity of one member inside a room. */
export type RoomMemberId = Branded<'RoomMemberId'>

/** Stable identity of one room message. */
export type RoomMessageId = Branded<'RoomMessageId'>

/** Stable identity of one human-initiated episode. */
export type RoomEpisodeId = Branded<'RoomEpisodeId'>

/** Durable room lifecycle. */
export type RoomState = 'active' | 'paused' | 'tripped' | 'archived'

/** How a member contributes to the room. */
export type MemberRole = 'coordinator' | 'worker' | 'reviewer' | 'observer'

/** When a member wakes for a human message. Robot messages always need a mention. */
export type WakeRule =
  | { readonly kind: 'mention' }
  | { readonly kind: 'keywords'; readonly keywords: readonly string[] }
  | { readonly kind: 'all-human' }

/** What an A2A message asks of its receiver. */
export type A2aIntent = 'request' | 'delegate' | 'handoff' | 'inform' | 'reply'

/** How a reply settled. */
export type ReplyStatus = 'done' | 'partial' | 'declined' | 'aborted'

/** What one A2A reply expects. */
export type ReplyExpectation = 'answer' | 'artifact' | 'ack'

/** One published Rbot revision a member runs as. */
export interface RoomRobotRef {
  /** Published specification identity. */
  readonly spec: string
  /** Positive published revision. */
  readonly revision: number
}

/** Model route a member may use in this room. */
export interface RoomModel {
  /** Registered provider id. */
  readonly provider: string
  /** Provider-owned model id. */
  readonly model: string
  /** Optional reasoning effort id. */
  readonly reasoningEffort?: string
}

/** One member's A2A permissions inside the room. These only narrow the robot's own limits. */
export interface RoomMemberA2aSpec {
  /** Members this member may address; `'*'` means every other enabled member. */
  readonly canAddress: readonly RoomMemberId[] | '*'
  /** Intents this member accepts from peers. */
  readonly accepts: readonly A2aIntent[]
  /** Peers whose messages to this member need an operator approval. */
  readonly requiresApproval: readonly RoomMemberId[]
}

/** Per-member limits applied inside this room. */
export interface RoomMemberBudgetSpec {
  /** Input tokens one turn may spend. */
  readonly turnInputTokens: number
  /** Output tokens one turn may spend. */
  readonly turnOutputTokens: number
  /** Tokens one member may spend per room day. */
  readonly dailyTokens: number
}

/** One member of a room. */
export interface RoomMemberSpec {
  /** Lowercase slug unique inside the room; also the A2A address. */
  readonly id: RoomMemberId
  /** Robot identity and capability source. */
  readonly robot: RoomRobotRef
  /** Display name that overrides the robot name. */
  readonly displayName?: string
  /** Palette key the UI uses for the member. */
  readonly color?: string
  /** How the member contributes. */
  readonly role: MemberRole
  /** When the member wakes for a human message. */
  readonly wake: WakeRule
  /** Peer permissions inside this room. */
  readonly a2a: RoomMemberA2aSpec
  /** Per-member limits inside this room. */
  readonly budget: RoomMemberBudgetSpec
  /** Optional model override for this room. */
  readonly model?: RoomModel
  /** Optional fallback model used after the soft daily limit. */
  readonly fallbackModel?: RoomModel
  /** Whether the member can be woken at all. */
  readonly enabled: boolean
}

/** How human messages choose their recipients. */
export interface RoomRoutingSpec {
  /** Default recipients of an unmentioned human message. */
  readonly humanDefault: 'coordinator' | 'mentioned' | 'all-eligible'
  /** Coordinator used by the `coordinator` default. */
  readonly coordinator?: RoomMemberId
  /** Most members one message may wake. */
  readonly maxFanout: number
  /** Members that may run at the same time. */
  readonly floor: number
}

/** Loop protection a room enforces. Every value is deployment-configurable. */
export interface RoomGuardSpec {
  /** Longest causal chain from the human message. */
  readonly maxDepth: number
  /** Robot turns one episode may spend. */
  readonly episodeTurns: number
  /** Messages one episode may hold. */
  readonly episodeMessages: number
  /** Tokens one episode may spend. */
  readonly episodeTokens: number
  /** Wall-clock ceiling of one episode. */
  readonly wallClockMs: number
  /** Longest one member turn may stay unsettled before the room trips. */
  readonly memberTurnTimeoutMs: number
  /** Member turns allowed per minute. */
  readonly memberTurnsPerMinute: number
  /** Burst a member may spend before the rate applies. */
  readonly memberBurst: number
  /** Unanswered requests one member may hold at once. */
  readonly maxPendingPerMember: number
  /** Times one identical A2A signature may be delivered. */
  readonly maxDuplicates: number
  /** Alternations one unordered pair may make in an episode. */
  readonly pingPongLimit: number
  /** Consecutive similar robot outputs that mean no progress. */
  readonly noProgressWindow: number
  /** Similarity at or above which two outputs count as the same work. */
  readonly noProgressSimilarity: number
}

/** Token limits a room enforces. */
export interface RoomBudgetSpec {
  /** Tokens one room day may spend. */
  readonly dailyTokens: number
  /** Fraction of a limit at which the UI warns and fallback models apply. */
  readonly softLimitRatio: number
}

/** How much conversation a member reads on one wake. */
export interface RoomContextSpec {
  /** Raw messages included before the window collapses into a summary. */
  readonly window: number
  /** Characters kept from one message. */
  readonly messageChars: number
  /** Characters kept from the rolling summary. */
  readonly summaryChars: number
  /** Characters kept from the message that woke the member. */
  readonly triggerChars: number
}

/** One complete room configuration. */
export interface RoomSpec {
  /** Display name unique among rooms. */
  readonly name: string
  /** One-paragraph purpose and standing rules every member reads. */
  readonly charter: string
  /** Members in display order. */
  readonly members: readonly RoomMemberSpec[]
  /** Human-message routing. */
  readonly routing: RoomRoutingSpec
  /** Loop protection. */
  readonly guard: RoomGuardSpec
  /** Token limits. */
  readonly budget: RoomBudgetSpec
  /** Context construction. */
  readonly context: RoomContextSpec
  /** Absolute directory every member works in; omitted uses the deployment default. */
  readonly workspaceRoot?: string
}

/** One operator-facing room notice that a channel plugin may deliver. */
export interface RoomNotice {
  /** Room the notice belongs to. */
  readonly room: RoomId
  /** What happened. */
  readonly kind: 'tripped' | 'approval' | 'episode-ended'
  /** Human-readable summary. */
  readonly text: string
  /** Unix epoch milliseconds. */
  readonly at: number
}

/** One immutable published room revision. */
export interface Room {
  /** Room identity. */
  readonly id: RoomId
  /** Current specification. */
  readonly spec: RoomSpec
  /** Positive revision number; every save increments it. */
  readonly revision: number
  /** Current lifecycle state. */
  readonly state: RoomState
  /** Unix epoch milliseconds of the first publication. */
  readonly createdAt: number
  /** Unix epoch milliseconds of the latest save. */
  readonly updatedAt: number
}

/** Who wrote one room message. */
export type RoomAuthor =
  | { readonly kind: 'human'; readonly id: string; readonly name: string }
  | { readonly kind: 'member'; readonly id: RoomMemberId }
  | { readonly kind: 'system' }

/** What one message is. */
export type RoomMessageKind = 'chat' | 'a2a' | 'reply' | 'activity' | 'guard' | 'approval' | 'episode'

/** Machine-readable reason an admission was refused. */
export type RefusalCode =
  | 'not-member'
  | 'room-paused'
  | 'room-tripped'
  | 'breaker-open'
  | 'unknown-peer'
  | 'self'
  | 'acl'
  | 'intent'
  | 'depth'
  | 'fanout'
  | 'episode-turns'
  | 'episode-messages'
  | 'episode-tokens'
  | 'episode-time'
  | 'rate'
  | 'pending-limit'
  | 'duplicate'
  | 'ping-pong'
  | 'grant'
  | 'preflight'
  | 'human-only'

/** One A2A v2 envelope. */
export interface A2aEnvelopeV2 {
  /** Exact protocol identifier. */
  readonly protocol: 'tomato-a2a/2'
  /** Envelope identity. */
  readonly id: string
  /** Room the envelope belongs to. */
  readonly room: RoomId
  /** Human-initiated episode the envelope belongs to. */
  readonly episode: RoomEpisodeId
  /** Sending member. */
  readonly from: RoomMemberId
  /** Receiving members. */
  readonly to: readonly RoomMemberId[]
  /** What the receiver must do. */
  readonly intent: A2aIntent
  /** Task stated as an outcome. */
  readonly task: string
  /** Context the sender already has. */
  readonly context: string
  /** Artifacts referenced rather than inlined. */
  readonly artifacts: readonly string[]
  /** What the sender expects back. */
  readonly expect?: ReplyExpectation
  /** Envelope this one answers. */
  readonly replyTo?: string
  /** Settled reply status. */
  readonly status?: ReplyStatus
  /** Forwarding depth from the human message. */
  readonly depth: number
  /** Tokens this request grants the receiver. */
  readonly grantTokens: number
  /** Epoch milliseconds by which the request should settle. */
  readonly deadline: number
  /** Normalized duplicate-detection signature. */
  readonly signature: string
  /** `private` is visible only to the sender and receiver models; operators always see it. */
  readonly visibility: 'room' | 'private'
}

/** One activity summary rendered in the room instead of a full turn. */
export interface RoomActivity {
  /** What the member started or finished. */
  readonly label: string
  /** Tool names used, in call order. */
  readonly tools: readonly string[]
  /** Token usage once the turn settled. */
  readonly tokens?: number
  /** Whether the turn settled. */
  readonly done?: boolean
}

/** One approval an operator owes the room. */
export interface RoomApproval {
  /** Approval identity. */
  readonly id: string
  /** Envelope waiting for the decision. */
  readonly envelope: A2aEnvelopeV2
  /** Epoch milliseconds the request was raised. */
  readonly at: number
  /** Current decision, when one was made. */
  readonly decision?: 'approved' | 'rejected'
}

/** One guard record rendered as a system notice. */
export interface RoomGuardRecord {
  /** Rule that fired. */
  readonly code: RefusalCode | 'trip'
  /** One sentence naming the observed value and the limit. */
  readonly detail: string
  /** Members the record concerns. */
  readonly members: readonly RoomMemberId[]
}

/** One durable message. */
export interface RoomMessage {
  /** Message identity. */
  readonly id: RoomMessageId
  /** Room identity. */
  readonly room: RoomId
  /** Monotonic room sequence, starting at `1`. */
  readonly seq: number
  /** Episode the message belongs to. */
  readonly episode: RoomEpisodeId
  /** Who wrote it. */
  readonly author: RoomAuthor
  /** What it is. */
  readonly kind: RoomMessageKind
  /** Bounded body text. */
  readonly text: string
  /** Members the message addresses. */
  readonly mentions: readonly RoomMemberId[]
  /** A2A envelope for `a2a` and `reply`. */
  readonly a2a?: A2aEnvelopeV2
  /** Activity summary for `activity`. */
  readonly activity?: RoomActivity
  /** Guard detail for `guard`. */
  readonly guard?: RoomGuardRecord
  /** Approval detail for `approval`. */
  readonly approval?: RoomApproval
  /** Token usage recorded on a settled activity. */
  readonly usage?: number
  /** Message that caused this one. */
  readonly causedBy?: RoomMessageId
  /** Causal depth from the episode start. */
  readonly depth: number
  /** Member Session and turn that produced it. */
  readonly sessionRef?: { readonly sessionId: string; readonly turn: number }
  /** Unix epoch milliseconds. */
  readonly at: number
}

/** Budget counters one member turn or episode has spent. */
export interface RoomUsage {
  /** Input tokens spent. */
  readonly inputTokens: number
  /** Output tokens spent. */
  readonly outputTokens: number
  /** Total tokens spent. */
  readonly totalTokens: number
}

/** Durable episode state. */
export interface RoomEpisode {
  /** Episode identity. */
  readonly id: RoomEpisodeId
  /** Room identity. */
  readonly room: RoomId
  /** Message that opened the episode. */
  readonly startedBy: RoomMessageId
  /** Unix epoch milliseconds the episode opened. */
  readonly startedAt: number
  /** Member turns spent. */
  readonly turns: number
  /** Messages recorded. */
  readonly messages: number
  /** Tokens spent. */
  readonly tokens: number
  /** Longest causal depth recorded. */
  readonly depth: number
  /** Terminal state, omitted while the episode runs. */
  readonly ended?: { readonly at: number; readonly reason: 'completed' | 'tripped' | 'interrupted' }
}

/** Breaker state. */
export type BreakerState = 'closed' | 'open' | 'half-open'

/** Why a breaker opened. */
export type TripReason =
  | 'depth'
  | 'episode-turns'
  | 'episode-messages'
  | 'episode-tokens'
  | 'episode-time'
  | 'rate'
  | 'duplicate'
  | 'ping-pong'
  | 'no-progress'
  | 'storm'

/** Current counters and breaker state. */
export interface RoomGuardSnapshot {
  /** Breaker state. */
  readonly breaker: BreakerState
  /** Reason the breaker opened, when it is not closed. */
  readonly reason?: TripReason
  /** Episode turns spent. */
  readonly turns: number
  /** Episode messages spent. */
  readonly messages: number
  /** Episode tokens spent. */
  readonly tokens: number
  /** Wall-clock milliseconds since the episode opened. */
  readonly elapsedMs: number
  /** Longest depth recorded. */
  readonly depth: number
}

/** One field-level problem found while validating a room specification. */
export interface RoomSpecIssue {
  /** Dot-separated field path; empty for the whole specification. */
  readonly path: string
  /** Human-readable problem. */
  readonly message: string
}

/** Rejection of one room specification with every discovered issue. */
export class RoomSpecValidationError extends Error {
  /** Field-level problems that caused the rejection. */
  readonly issues: readonly RoomSpecIssue[]

  /**
   * @param issues - every problem found in the submitted specification.
   */
  constructor(issues: readonly RoomSpecIssue[]) {
    super(`invalid room specification: ${issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')}`)
    this.name = 'RoomSpecValidationError'
    this.issues = issues
  }
}

/** One admitted or refused candidate message. */
export type AdmissionVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly refusal: RefusalCode; readonly detail: string }
