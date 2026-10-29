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
