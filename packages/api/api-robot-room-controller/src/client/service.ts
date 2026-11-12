/**
 * The `ctx.roomRuns` client service: one reconnecting `room.watch` stream
 * feeding the room snapshot, plus RPC passthroughs for publication, posting,
 * approval, and message reads.
 * @module @tomato/api-robot-room-controller/client/service
 */

import { Service, type Context } from '@tomato/cordis'
import { RemoteStreamCarrierError, type ClientRemote } from '@tomato/api-gateway/client'
import type { RemoteResult } from '@tomato/typert-protocol'
import type {
  Room, RoomApprovalRequest, RoomMessage, RoomMessagesRequest, RoomPauseRequest, RoomPostRequest,
  RoomPublicationRequest, RoomSnapshotFrame, RoomTargetRequest,
} from '../types.ts'
import type { RoomRunsModel, RoomRunsSource } from './model.ts'

/** The generated `room` namespace face the service drives. */
export interface RoomRemote {
  /**
   * Open one room snapshot generation.
   * @param signal - generation cancellation.
   * @returns the whole-set frame sequence of one generation.
   */
  watch(signal?: AbortSignal): AsyncIterable<RoomSnapshotFrame>
  /**
   * List current rooms.
   * @returns the Remote result of the call.
   */
  rooms(): Promise<RemoteResult<readonly Room[]>>
  /**
   * Read one room.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  room(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * Publish a new room or a new revision.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  publish(request: RoomPublicationRequest): Promise<RemoteResult<Room>>
  /**
   * Record one human message.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  post(request: RoomPostRequest): Promise<RemoteResult<RoomMessage>>
  /**
   * Read room messages.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  messages(request: RoomMessagesRequest): Promise<RemoteResult<readonly RoomMessage[]>>
  /**
   * Pause or resume a room.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  pause(request: RoomPauseRequest): Promise<RemoteResult<Room>>
  /**
   * Resume a tripped room.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  resume(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * Raise the current episode's limits once.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  relaxOnce(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * End the current episode.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  endEpisode(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * Decide one pending approval.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  approve(request: RoomApprovalRequest): Promise<RemoteResult<Room>>
}

/** Remote faces the service drives: the Gateway stream factory and the `room` namespace. */
export interface RoomRunsRemote {
  readonly $stream: ClientRemote['$stream']
  readonly room: RoomRemote
}

/** The client room service face. */
export interface IRoomRuns {
  /** Room snapshot state. */
  readonly state: RoomRunsSource
  /**
   * List current rooms.
   * @returns the Remote result of the call.
   */
  rooms(): Promise<RemoteResult<readonly Room[]>>
  /**
   * Read one room.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  room(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * Publish a new room or a new revision.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  publish(request: RoomPublicationRequest): Promise<RemoteResult<Room>>
  /**
   * Record one human message.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  post(request: RoomPostRequest): Promise<RemoteResult<RoomMessage>>
  /**
   * Read room messages.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  messages(request: RoomMessagesRequest): Promise<RemoteResult<readonly RoomMessage[]>>
  /**
   * Pause or resume a room.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  pause(request: RoomPauseRequest): Promise<RemoteResult<Room>>
  /**
   * Resume a tripped room.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  resume(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * Raise the current episode's limits once.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  relaxOnce(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * End the current episode.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  endEpisode(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /**
   * Decide one pending approval.
   * @param request - room target and request fields.
   * @returns the Remote result of the call.
   */
  approve(request: RoomApprovalRequest): Promise<RemoteResult<Room>>
}

declare module '@tomato/cordis' {
  interface Context {
    /** Client room roster and control. */
    roomRuns: IRoomRuns
  }
}

/** Owns the room snapshot stream and the RPC passthroughs. */
export class ClientRoomRuns extends Service implements IRoomRuns {
  readonly state: RoomRunsSource

  /**
   * @param ctx - client root Context.
   * @param remote - the Gateway stream factory plus the generated `room` namespace.
   * @param model - shared client room model.
   */
  constructor(
    ctx: Context,
    private readonly remote: RoomRunsRemote,
    model: RoomRunsModel,
  ) {
    super(ctx, 'roomRuns')
    this.state = model
    const name = 'room roster'
    const stream = remote.$stream<RoomSnapshotFrame>({
      name,
      open: signal => remote.room.watch(signal),
      ended: accepted => accepted
        ? new RemoteStreamCarrierError(`${name} ended before release`)
        : new Error(`${name} ended before its first frame`),
    })
    ctx.effect(() => () => stream.dispose(), 'room-controller.client.roster')
    void (async () => {
      try {
        for await (const item of stream) {
          model.replaced(item.value)
          item.accept()
        }
      } catch {
        // A terminal stream failure keeps the last whole frame; a reconnect
        // replaces it with the next generation's truth.
      }
    })()
  }

  rooms(): Promise<RemoteResult<readonly Room[]>> {
    return this.remote.room.rooms()
  }

  room(request: RoomTargetRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.room(request)
  }

  publish(request: RoomPublicationRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.publish(request)
  }

  post(request: RoomPostRequest): Promise<RemoteResult<RoomMessage>> {
    return this.remote.room.post(request)
  }

  messages(request: RoomMessagesRequest): Promise<RemoteResult<readonly RoomMessage[]>> {
    return this.remote.room.messages(request)
  }

  pause(request: RoomPauseRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.pause(request)
  }

  resume(request: RoomTargetRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.resume(request)
  }

  relaxOnce(request: RoomTargetRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.relaxOnce(request)
  }

  endEpisode(request: RoomTargetRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.endEpisode(request)
  }

  approve(request: RoomApprovalRequest): Promise<RemoteResult<Room>> {
    return this.remote.room.approve(request)
  }
}
