/**
 * Wire types of the generated `robot` Remote namespace: the registry snapshot
 * stream, specification publication, instantiation, rebinding, and run
 * control. Client-safe: no Host runtime imports.
 * @module @tomato/api-robot-controller/types
 */

import type {
  Robot, RobotId, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, RobotTemplate, RobotTemplateId, Run, RunId,
} from '@tomato/experimental-robot/types'
// Type-only: carries the `robotRun` Session projection declaration this package's wire types assume.
// The re-export keeps that module reachable through declaration emit, which drops a bare type import.
import type {} from '@tomato/experimental-robot/session'
export type { RobotRunRecord } from '@tomato/experimental-robot/session'

export type {
  Robot, RobotId, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, RobotTemplate, RobotTemplateId,
  RobotTemplateText, Run, RunId,
} from '@tomato/experimental-robot/types'

/** One template hire: publish a user-owned copy and instantiate it. */
export interface RobotHireRequest {
  /** Registered template to copy. */
  readonly templateId: RobotTemplateId
  /** Locale whose template copy fills the name, mission, and criteria. */
  readonly locale: string
  /** Display name; defaults to the localized template name, suffixed when that name is taken. */
  readonly name?: string
  /**
   * Absolute Workspace directory the hired robot works in. Omitted keeps the
   * template's own roots; a template without roots inherits this value so the
   * hired robot records an inspectable working directory.
   */
  readonly workspaceRoot?: string
}

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

/** One run to pause for human correction. */
export interface RobotInterruptRequest {
  readonly runId: RunId
}

/** One correction to deliver into an executing run. */
export interface RobotCorrectRequest {
  readonly runId: RunId
  /** Message the run's Agent receives: the next turn when waiting, steering when running. */
  readonly message: string
}

/** One catalog read for the Workspace whose project skills apply. */
export interface RobotCapabilitiesRequest {
  /** Canonical project directory; omitted reads only deployment-wide sources. */
  readonly cwd?: string
}

/** One local value a capability field of the specification can reference. */
export interface RobotCapabilityOption {
  /** Value stored in the specification. */
  readonly value: string
  /** Display label; repeats `value` when its source has no separate title. */
  readonly label: string
  /** One-line detail that helps a person choose. */
  readonly description?: string
}

/**
 * Local values the specification editor offers as choices: skills visible in
 * this deployment or Workspace, registered tool names, live MCP server names,
 * and Workspace directories. A source that is not mounted contributes an empty
 * list rather than a failure, so the editor can still edit every other field.
 */
export interface RobotCapabilityCatalog {
  readonly skills: readonly RobotCapabilityOption[]
  readonly tools: readonly RobotCapabilityOption[]
  readonly mcpServers: readonly RobotCapabilityOption[]
  readonly workspaceRoots: readonly RobotCapabilityOption[]
}

/**
 * One whole registry frame: the latest revisions, every robot, every run, and
 * every registered template. Whole-set replacement, so a reconnect's first
 * frame is already the truth.
 */
export interface RobotSnapshotFrame {
  readonly specs: readonly RobotSpecRevision[]
  readonly robots: readonly Robot[]
  readonly runs: readonly Run[]
  /** Registered templates; empty when no template registry is mounted. */
  readonly templates: readonly RobotTemplate[]
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
