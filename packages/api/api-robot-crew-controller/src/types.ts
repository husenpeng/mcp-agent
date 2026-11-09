/**
 * Wire types of the generated `crew` Remote namespace: the roster snapshot
 * stream, specification publication, run control, and ledger reads.
 * Client-safe: no Host runtime imports.
 * @module @tomato/api-robot-crew-controller/types
 */

import type {
  CrewEntry, CrewRun, CrewRunId, CrewSpec, CrewSpecId, CrewSpecIssue, CrewSpecRef, CrewSpecRevision,
} from '@tomato/experimental-robot-crew'

export type {
  CrewEntry, CrewEntryKind, CrewNode, CrewNodeProgress, CrewRun, CrewRunId, CrewRunState, CrewSpec, CrewSpecId,
  CrewSpecIssue, CrewSpecRef, CrewSpecRevision, CrewTripReason,
} from '@tomato/experimental-robot-crew'

/** One whole roster frame: the latest specification of every crew and every run. */
export interface CrewSnapshotFrame {
  /** Latest published revision of every crew. */
  readonly specs: readonly CrewSpecRevision[]
  /** Every run in acceptance order. */
  readonly runs: readonly CrewRun[]
}

/** One published revision to read. */
export interface CrewRevisionRequest {
  readonly ref: CrewSpecRef
}

/** One specification publication and the revision it supersedes. */
export interface CrewPublishRequest {
  /** Complete specification to publish. */
  readonly spec: CrewSpec
  /** Revision this publication supersedes; omitted for a new crew. */
  readonly previous?: CrewSpecRef
}

/** One manual run request. */
export interface CrewStartRequest {
  /** Published revision to execute. */
  readonly ref: CrewSpecRef
  /** Goal message handed to the graph. */
  readonly message: string
}

/** One run to cancel. */
export interface CrewCancelRequest {
  readonly runId: CrewRunId
}

/** One ledger read. */
export interface CrewEntriesRequest {
  readonly runId: CrewRunId
}

/** One optional crew filter. */
export interface CrewRunsRequest {
  readonly spec?: CrewSpecId
}

declare module '@tomato/typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** A specification publication was rejected by validation. */
    'crew/spec-invalid': { readonly issues: readonly CrewSpecIssue[] }
    /** The named crew record does not exist. */
    'crew/not-found': { readonly id: string }
    /** The registry refused the operation in its current state. */
    'crew/conflict': { readonly message: string }
  }
}

/** One entry's canonical value for list rendering. */
export type CrewLedgerEntry = CrewEntry
