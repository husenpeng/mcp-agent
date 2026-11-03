/**
 * Wire types of the generated `robot` Remote namespace: the registry snapshot
 * stream, specification publication, instantiation, rebinding, and run
 * control. Client-safe: no Host runtime imports.
 * @module @tomato/api-robot-controller/types
 */

import type {
  Robot, RobotId, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, Run, RunId,
} from '@tomato/experimental-robot/types'
// Type-only: carries the `robotRun` Session projection declaration this package's wire types assume.
// The re-export keeps that module reachable through declaration emit, which drops a bare type import.
import type {} from '@tomato/experimental-robot/session'
export type { RobotRunRecord } from '@tomato/experimental-robot/session'

export type {
  Robot, RobotId, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, Run, RunId,
} from '@tomato/experimental-robot/types'

/** One published revision to read. */
export interface RobotRevisionRequest {
  readonly ref: RobotSpecRef
}

/** One specification publication and the revision it supersedes. */
export interface RobotPublishRequest {
  /** Complete specification to publish. */
  readonly spec: RobotSpec
  /** Revision this publication supersedes; omitted for a new specification. */
  readonly previous?: RobotSpecRef
}

/** One published revision to instantiate. */
export interface RobotInstantiateRequest {
  readonly ref: RobotSpecRef
}

/** One robot and the revision later runs should bind. */
export interface RobotRebindRequest {
  readonly robotId: RobotId
  readonly ref: RobotSpecRef
}

/** One manual run request. */
export interface RobotStartRequest {
  readonly robotId: RobotId
  /** Instruction handed to the run. */
  readonly message: string
}

/** One robot whose runs to list. */
export interface RobotRunsRequest {
  readonly robotId: RobotId
}

/** One run to cancel. */
export interface RobotCancelRequest {
  readonly runId: RunId
}

/**
 * One whole registry frame: the latest revisions, every robot, and every run.
 * Whole-set replacement, so a reconnect's first frame is already the truth.
 */
export interface RobotSnapshotFrame {
  readonly specs: readonly RobotSpecRevision[]
  readonly robots: readonly Robot[]
  readonly runs: readonly Run[]
}

declare module '@tomato/typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** A specification publication was rejected by validation. */
    'robot/spec-invalid': { readonly issues: readonly RobotSpecIssue[] }
    /** The named robot record does not exist. */
    'robot/not-found': { readonly id: string }
    /** The registry refused the operation in its current state. */
    'robot/conflict': { readonly message: string }
  }
}
