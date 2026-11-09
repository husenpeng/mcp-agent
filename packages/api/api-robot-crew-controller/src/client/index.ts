/**
 * Crew Controller client half: installs `ctx.crewRuns`, the roster snapshot and
 * RPC passthroughs, over the generated `crew` Remote namespace. The namespace
 * is mounted by `@tomato/experimental-robot-crew-remote`, the optional bundle
 * row that keeps this feature out of the default client assembly.
 * @module @tomato/api-robot-crew-controller/client
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/api-robot-crew-controller/remote'
import { CrewRunsModel } from './model.ts'
import { ClientCrewRuns } from './service.ts'

export type { CrewRunsSnapshot, CrewRunsSource } from './model.ts'
export type { ICrewRuns } from './service.ts'
export type {
  CrewCancelRequest, CrewEntriesRequest, CrewEntry, CrewPublishRequest, CrewRevisionRequest, CrewRun, CrewRunsRequest,
  CrewSnapshotFrame, CrewSpec, CrewSpecRevision, CrewStartRequest,
} from '../types.ts'

/** Required Client Remote services. */
export const inject = ['remote', 'remote.crew']

/**
 * Install the client crew service.
 * @param ctx - Client root Context.
 */
export function apply(ctx: Context): void {
  const { remote } = ctx
  new ClientCrewRuns(ctx, { $stream: options => remote.$stream(options), crew: remote.crew }, new CrewRunsModel())
}
