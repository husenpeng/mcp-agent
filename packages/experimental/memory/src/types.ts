/**
 * Pure types of the experimental memory domain: request vocabulary and the
 * pinned-snapshot message source. The stored record type is inferred from its
 * schema in `./storage.ts`.
 * @module @tomato/experimental-memory/types
 */

import type { Branded } from '@tomato/branded'
import type { ContextFormed } from '@tomato/llm'
import type { SessionId, SessionSeq } from '@tomato/session/types'

/** Stable identity of one stored memory record. */
export type MemoryId = Branded<'MemoryId'>

/**
 * Whose records a Host serves: `local` on a Host without accounts, or
 * `account:<id>` for the account the Host's sign-in names.
 */
export type MemoryOwner = Branded<'MemoryOwner'>

/** What a memory record states. */
export type MemoryKind = 'preference' | 'constraint' | 'decision' | 'fact'

/**
 * Lifecycle of one record. Only `active` records reach search results and the
 * snapshot; a `candidate` waits until a person confirms it.
 */
export type MemoryStatus = 'candidate' | 'active'

/**
 * Where one record applies: `profile` records describe the person in every
 * workspace; `workspace` records belong to one canonical project directory.
 */
export type MemoryScope =
  | { readonly kind: 'profile' }
  | { readonly kind: 'workspace'; readonly path: string }

/**
 * The records one Session can see: the owner's profile records and, when the
 * Session has a project directory, the owner's records of that workspace.
 */
export interface MemoryView {
  /** Owner of every visible record. */
  readonly owner: MemoryOwner
  /** Canonical project directory; absent when the Session has none, which leaves only profile records visible. */
  readonly workspace?: string
}

/** Stable identity of one stored embedding vector. */
export type VectorId = Branded<'VectorId'>

/** Record family a cached vector belongs to. */
export type VectorTarget = 'fact' | 'episode'

/** Stable identity of one stored episode. */
export type EpisodeId = Branded<'EpisodeId'>

/** What one episode records. */
export type EpisodeKind = 'observation' | 'summary'

/** Where one episode belongs: the canonical project directory of its Session. */
export interface EpisodeScope {
  /** Always `project`; robot, team, and task scopes arrive with the robot memory layer. */
  readonly kind: 'project'
  /** Canonical project directory the episode belongs to. */
  readonly path: string
}

/** The write that produced one episode. */
export interface EpisodeSource {
  /** Session whose tool activity produced the episode. */
  readonly sessionId: SessionId
  /** Tool call identity, when the episode was compressed from one call. */
  readonly toolCallId?: string
  /** Robot run identity, when a run owns the Session. */
  readonly runId?: string
}

/** Input of `ctx.memory.rememberEpisode()`. */
export interface RememberEpisodeRequest {
  /** Owner of the episode. */
  readonly owner: MemoryOwner
  /** Project the episode belongs to. */
  readonly scope: EpisodeScope
  /** Episode category. */
  readonly kind: EpisodeKind
  /** Lower-kebab-case summary type, for example `decision` or `bugfix`. */
  readonly type: string
  /** One-line title. */
  readonly title: string
  /** Optional second line. */
  readonly subtitle?: string
  /** What happened, in the observer's words. */
  readonly narrative: string
  /** Durable statements extracted from the observation. */
  readonly facts?: readonly string[]
  /** Concepts and keywords for later retrieval. */
  readonly concepts?: readonly string[]
  /** Files the observation read. */
  readonly filesRead?: readonly string[]
  /** Files the observation changed. */
  readonly filesModified?: readonly string[]
  /** Tool whose call produced the observation. */
  readonly tool?: string
  /** Content fingerprint that makes a repeated call update instead of append. */
  readonly fingerprint: string
  /** The write that produced the episode. */
  readonly source: EpisodeSource
}

/** Input of `ctx.memory.searchEpisodes()`. */
export interface EpisodeSearchRequest {
  /** Owner and project that bound the search. */
  readonly view: MemoryView
  /** Free text; an empty string lists the newest episodes. */
  readonly text: string
  /** Additional wordings of the same query. */
  readonly alternatives?: readonly string[]
  /** Maximum episodes returned; defaults to `maxRecallResults`. */
  readonly limit?: number
  /** Episode kinds to include. */
  readonly kinds?: readonly EpisodeKind[]
  /** Epoch-millisecond lower bound on creation time. */
  readonly since?: number
  /** Epoch-millisecond upper bound on creation time. */
  readonly until?: number
  /** Cancellation forwarded to an embedding provider. */
  readonly signal?: AbortSignal
}

/** Input of `ctx.memory.episodeTimeline()`. */
export interface EpisodeTimelineRequest {
  /** Owner and project that bound the timeline. */
  readonly view: MemoryView
  /** Episode the window centers on; absent starts at the newest episode. */
  readonly anchor?: EpisodeId
  /** Episodes older than the anchor to return; defaults to 3. */
  readonly before?: number
  /** Episodes newer than the anchor to return; defaults to 3. */
  readonly after?: number
  /** Episode kinds to include. */
  readonly kinds?: readonly EpisodeKind[]
  /** Cancellation forwarded to an embedding provider. */
  readonly signal?: AbortSignal
}

/** Whether a Session can use memory now. */
export type MemoryAccess =
  | { readonly kind: 'available'; readonly view: MemoryView }
  /** The Host names accounts and none is signed in, so no owner's records may be read or written. */
  | { readonly kind: 'sign-in-required' }

/** The write that justified one record. */
export interface MemorySource {
  /** Session in which the record was written. */
  readonly sessionId: SessionId
  /** The person's `user/message` the model quoted; absent for candidates and command writes. */
  readonly userMessageSeq?: SessionSeq
  /** Episode whose repeated facts promoted this record, when known. */
  readonly episodeId?: EpisodeId
}

/** One repeated episode promoted into a saved record. */
export interface PromotionOutcome {
  /** Record the episode facts were promoted into, new or already existing. */
  readonly recordId: MemoryId
  /** Episodes marked as promoted by this outcome. */
  readonly episodeIds: readonly string[]
  /** Subject every promoted record shares. */
  readonly entity: string
  /** Deterministic attribute derived from the fact and the episode's first concept. */
  readonly key: string
  /** Statement the record carries. */
  readonly value: string
}

/** Input of `ctx.memory.remember()`. */
export interface RememberRequest {
  /** Owner of the written record. */
  readonly owner: MemoryOwner
  /** Where the record applies. */
  readonly scope: MemoryScope
  /** Statement category. */
  readonly kind: MemoryKind
  /** Normalized subject. */
  readonly entity: string
  /** Normalized attribute. */
  readonly key: string
  /** Non-empty statement. */
  readonly value: string
  /** Lifecycle state of the written record. */
  readonly status: MemoryStatus
  /** Whether later sessions receive a workspace record without searching; ignored for a candidate or a profile record. */
  readonly pinned: boolean
  /** The write that justified the record. */
  readonly source: MemorySource
}

/** Input of `ctx.memory.recall()`. */
export interface RecallRequest {
  /** Records the search may return; records outside the view never match. */
  readonly view: MemoryView
  /** Free text; an empty string matches every active record. */
  readonly text: string
  /** Additional wordings of the same query, matched at a lower weight than `text`. */
  readonly alternatives?: readonly string[]
  /** Optional kind filter. */
  readonly kind?: MemoryKind
  /** Cancellation of the caller's operation, forwarded to an embedding provider. */
  readonly signal?: AbortSignal
}

declare module '@tomato/llm' {
  interface MessageSourceMap {
    /** Memory snapshot; readers preserve the recorded text without this producer.
     * The producer reads its own kind to avoid repeating an unchanged snapshot.
     * @persistenceAttribution
     */
    'experimental-memory': { kind: 'experimental-memory' } & ContextFormed
  }
}
