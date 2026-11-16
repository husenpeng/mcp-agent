/**
 * Wire vocabulary of the `memories` namespace: the records a phone reads and
 * the candidates it proposes. Kept on a public type subpath so both faces of
 * the generated Typert artifacts share one declaration.
 * @module @tomato/experimental-tool-memory/types
 */

import { isDue } from '@tomato/experimental-memory'
import type { MemoryKind, MemoryRecord } from '@tomato/experimental-memory'

/** One memory as the phone renders it. */
export interface MemoryWireRecord {
  /** Record identity, stable across the phone and `/memory`. */
  readonly id: string
  /** Where the record applies. */
  readonly scope: 'profile' | 'workspace'
  /** Statement category. */
  readonly kind: MemoryKind
  /** Normalized subject. */
  readonly entity: string
  /** Normalized attribute. */
  readonly key: string
  /** The statement itself. */
  readonly value: string
  /** Only `active` records reach later turns. */
  readonly status: 'active' | 'candidate'
  /** Whether this candidate is worth putting in front of a person now. */
  readonly due: boolean
  /** Times an independent write stated this candidate; absent counts as one. */
  readonly evidence?: number
  /** Record whose confirmation would replace this candidate statement. */
  readonly proposalFor?: string
  /** Last write, in epoch milliseconds. */
  readonly updatedAt: number
  /** Session the write was attributed to. */
  readonly sessionId?: string
}

/** One candidate a phone proposes. */
export interface MemoryWireEntry {
  /** Scope the candidate claims. */
  readonly scope: 'profile' | 'workspace'
  /** Statement category. */
  readonly kind: MemoryKind
  /** Normalized subject, lower-kebab-case. */
  readonly entity: string
  /** Normalized attribute, lower-kebab-case. */
  readonly key: string
  /** The statement, in the owner's language. */
  readonly value: string
}

/** Request naming the Session that scopes the records. */
export interface MemoryScopeRequest {
  /** Session whose project scopes workspace records. */
  readonly sessionId: string
}

/** Request proposing candidates from one Session. */
export interface MemoryProposeRequest extends MemoryScopeRequest {
  /** Candidates to store; each waits for the owner's confirmation. */
  readonly entries: readonly MemoryWireEntry[]
}

/** Request naming one record. */
export interface MemoryTargetRequest extends MemoryScopeRequest {
  /** Record to promote or delete. */
  readonly id: string
}

/** `list` value. */
export interface MemoryListValue {
  /** Whether an owner is signed in; false leaves every record unreachable. */
  readonly signedIn: boolean
  /** Whether the Host has not verified the account yet, so a retry may succeed without a sign-in. */
  readonly accountLoading?: boolean
  /** Profile records first, then this workspace's, newest first within each. */
  readonly records: readonly MemoryWireRecord[]
}

/** `propose` value. */
export interface MemoryProposalValue {
  /** The stored candidates, in request order. */
  readonly written: readonly MemoryWireRecord[]
}

/** `confirm` value: the promoted record, or the reason nothing was promoted. */
export interface MemoryConfirmationValue {
  /** The record now active. */
  readonly record?: MemoryWireRecord
  /** `not_found`, `already_active`, or `sign_in_required`. */
  readonly code?: string
}

/** `forget` value. */
export interface MemoryDeletionValue {
  /** Whether a record was removed. */
  readonly deleted: boolean
  /** `sign_in_required` when nobody is signed in. */
  readonly code?: string
}

/** Most candidates one proposal may carry. */
export const MAX_PROPOSED_ENTRIES = 20

/**
 * Render one stored record for the phone.
 * @param record - the stored record.
 * @returns its wire view.
 */
export function wireRecord(record: MemoryRecord): MemoryWireRecord {
  return {
    id: record.id,
    scope: record.scope.kind,
    kind: record.kind,
    entity: record.entity,
    key: record.key,
    value: record.value,
    status: record.status,
    due: record.status === 'candidate' && isDue(record),
    ...record.evidence === undefined ? {} : { evidence: record.evidence },
    ...record.proposalFor === undefined ? {} : { proposalFor: record.proposalFor },
    updatedAt: record.updatedAt,
    sessionId: record.source.sessionId,
  }
}

