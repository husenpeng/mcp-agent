/**
 * Robot Controller client half: installs `ctx.robotRuns`, the registry
 * snapshot and RPC passthroughs, over the generated `robot` Remote namespace.
 * The namespace is mounted by `@tomato/experimental-robot-remote`, the optional
 * bundle row that keeps this feature out of the default client assembly.
 * @module @tomato/api-robot-controller/client
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/api-robot-controller/remote'
import { RobotRunsModel } from './model.ts'
import { ClientRobotRuns } from './service.ts'

export type { RobotRunsSnapshot, RobotRunsSource } from './model.ts'
// The `ctx.robotRuns` contract. Its module also carries the Context
// augmentation that declares `ctx.robotRuns`, which reaches consumers only
// through this export: declaration emit drops the value import above.
export type { IRobotRuns } from './service.ts'
export type {
  Robot, RobotCancelRequest, RobotCapabilitiesRequest, RobotCapabilityCatalog, RobotCapabilityOption, RobotHireRequest,
  RobotId, RobotInstantiateRequest, RobotPublishRequest, RobotRebindRequest, RobotRevisionRequest, RobotRunsRequest,
  RobotSnapshotFrame, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, RobotStartRequest, RobotTemplate,
  RobotTemplateId, RobotTemplateText, Run, RunId,
} from '../types.ts'

/** Required Client Remote services. */
export const inject = ['remote', 'remote.robot']

/**
 * Install the client robot service.
 * @param ctx - Client root Context.
 */
export function apply(ctx: Context): void {
  const { remote } = ctx
  const { robot } = remote
  new ClientRobotRuns(ctx, { $stream: options => remote.$stream(options), robot }, new RobotRunsModel())
}
