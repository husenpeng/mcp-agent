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

/** What a memory record states. */
export type MemoryKind = 'preference' | 'constraint' | 'decision' | 'fact'

/**
 * Lifecycle of one record. Only `active` records reach search results and the
 * pinned snapshot; a `candidate` waits until a person confirms it.
 */
export type MemoryStatus = 'candidate' | 'active'

/** The write that justified one record. */
export interface MemorySource {
  /** Session in which the record was written. */
  readonly sessionId: SessionId
  /** The person's `user/message` the model quoted; absent for candidates and command writes. */
  readonly userMessageSeq?: SessionSeq
}

/** Input of `ctx.memory.remember()`. */
export interface RememberRequest {
  /** Canonical workspace path. */
  readonly workspace: string
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
  /** Whether later sessions receive the record without searching; ignored for a candidate. */
  readonly pinned: boolean
  /** The write that justified the record. */
  readonly source: MemorySource
}

/** Input of `ctx.memory.recall()`. */
export interface RecallRequest {
  /** Canonical workspace path; records from other workspaces never match. */
  readonly workspace: string
  /** Free text; an empty string matches every active record. */
  readonly text: string
  /** Optional kind filter. */
  readonly kind?: MemoryKind
}

declare module '@tomato/llm' {
  interface MessageSourceMap {
    /** Pinned memory snapshot; readers preserve the recorded text without this producer.
     * The producer reads its own kind to avoid repeating an unchanged snapshot.
     * @persistenceAttribution
     */
    'experimental-memory': { kind: 'experimental-memory' } & ContextFormed
  }
}
