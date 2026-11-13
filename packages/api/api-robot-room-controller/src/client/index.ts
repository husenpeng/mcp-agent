/**
 * Robot Room Controller client half: installs `ctx.roomRuns`, the room snapshot
 * and RPC passthroughs, over the generated `room` Remote namespace. The
 * namespace is mounted by the optional bundle row that keeps this feature out
 * of the default client assembly.
 * @module @tomato/api-robot-room-controller/client
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/api-robot-room-controller/remote'
import { RoomRunsModel } from './model.ts'
import { ClientRoomRuns } from './service.ts'

export type { RoomRunsSnapshot, RoomRunsSource } from './model.ts'
export type { IRoomRuns } from './service.ts'
export type {
  Room, RoomApprovalRequest, RoomMessage, RoomMessagesRequest, RoomPauseRequest, RoomPostRequest,
  RoomPublicationRequest, RoomSnapshotFrame, RoomTargetRequest,
} from '../types.ts'

/** Required Client Remote services. */
export const inject = ['remote', 'remote.room']

/**
 * Install the client room service.
 * @param ctx - Client root Context.
 */
export function apply(ctx: Context): void {
  const { remote } = ctx
  new ClientRoomRuns(ctx, { $stream: options => remote.$stream(options), room: remote.room }, new RoomRunsModel())
}
