/**
 * Host Robot Room Remote owner: streams current rooms as whole frames and
 * exposes publication, posting, pausing, approval, and message reads over the
 * generated `room` namespace. Every read projects `ctx.rooms`; the controller
 * holds no state of its own.
 * @module @tomato/api-robot-room-controller
 */

import type { Context } from '@tomato/cordis'
import type { Room, RoomId, RoomMessage, RoomSpecIssue, RoomWorkRecord } from '@tomato/experimental-robot-room'
import type {} from '@tomato/experimental-robot-room'
import { Remote, RemoteError, TypertRemoteService } from '@tomato/typert-protocol'
import type {
  RoomApprovalRequest, RoomMessagesRequest, RoomPauseRequest, RoomPostRequest, RoomPublicationRequest,
  RoomSnapshotFrame, RoomTargetRequest,
} from './types.ts'

export type * from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host Robot Room Remote namespace owner. */
    roomController: RoomController
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Read the field issues of a provider's specification rejection, recognized by
 * name so a provider loaded from another package copy is still reported as
 * `room/spec-invalid`.
 * @param error - value the provider rejected with.
 * @returns the issues, or `undefined` when the error is not a specification rejection.
 */
function specIssuesOf(error: unknown): readonly RoomSpecIssue[] | undefined {
  if (!(error instanceof Error) || error.name !== 'RoomSpecValidationError' || !('issues' in error)) return undefined
  return Array.isArray(error.issues) ? error.issues : undefined
}

/** Host service backing the generated `ctx.remote.room` namespace. */
export class RoomController extends TypertRemoteService {
  static inject = ['rooms', 'typert']

  /** @param ctx - Host context carrying the room service. */
  constructor(ctx: Context) {
    super(ctx, 'roomController', { namespace: 'room' })
  }

  /**
   * List current rooms.
   * @returns every published room in publication order.
   */
  @Remote('rooms')
  rooms(): Promise<readonly Room[]> {
    return this.ctx.rooms.list()
  }

  /**
   * Read one room.
   * @param request - room identity.
   * @returns the room.
   * @throws RemoteError `room/not-found` for an unknown room.
   */
  @Remote('room')
  async room(request: RoomTargetRequest): Promise<Room> {
    const room = await this.ctx.rooms.room(request.room)
    if (room === undefined) throw this.missing(String(request.room))
    return room
  }

  /**
   * Publish a new room or a new revision.
   * @param request - existing room and complete specification.
   * @returns the saved room.
   * @throws RemoteError `room/spec-invalid` with every field issue, or
   *   `room/conflict` when the provider refuses the save.
   */
  @Remote('publish')
  async publish(request: RoomPublicationRequest): Promise<Room> {
    try {
      return await this.ctx.rooms.publish(request.id, request.spec)
    } catch (error: unknown) {
      const issues = specIssuesOf(error)
      if (issues !== undefined) throw new RemoteError('room/spec-invalid', messageOf(error), { issues: [...issues] })
      throw new RemoteError('room/conflict', messageOf(error), { message: messageOf(error) })
    }
  }

  /**
   * Record one human message.
   * @param request - room, text, mentions, and optional author.
   * @returns the recorded message.
   * @throws RemoteError `room/not-found` or `room/conflict`.
   */
  @Remote('post')
  async post(request: RoomPostRequest): Promise<RoomMessage> {
    try {
      return await this.ctx.rooms.post({
        room: request.room,
        text: request.text,
        ...request.mentions === undefined ? {} : { mentions: request.mentions },
        author: request.author ?? { id: 'operator', name: 'You' },
      })
    } catch (error: unknown) {
      throw this.conflict(request.room, error)
    }
  }

  /**
   * Read the work records one room produced.
   * @param request - room identity.
   * @returns one record per ticket, oldest first.
   */
  @Remote('work')
  work(request: RoomTargetRequest): Promise<readonly RoomWorkRecord[]> {
    return this.ctx.rooms.work(request.room)
  }

  /**
   * Read room messages.
   * @param request - room, start sequence, and limit.
   * @returns messages in sequence order.
   * @throws RemoteError `room/not-found`.
   */
  @Remote('messages')
  async messages(request: RoomMessagesRequest): Promise<readonly RoomMessage[]> {
    const room = await this.ctx.rooms.room(request.room)
    if (room === undefined) throw this.missing(String(request.room))
    return this.ctx.rooms.messages(request.room, request.afterSeq, request.limit)
  }

  /**
   * Pause or resume a room.
   * @param request - room and whether robot wakes stop.
   * @returns the updated room.
   */
  @Remote('pause')
  async pause(request: RoomPauseRequest): Promise<Room> {
    try {
      return await this.ctx.rooms.pause(request.room, request.paused)
    } catch (error: unknown) {
      throw this.conflict(request.room, error)
    }
  }

  /**
   * Resume a tripped room.
   * @param request - room target and decision input.
   * @returns the room after the change.
   */
  @Remote('resume')
  async resume(request: RoomTargetRequest): Promise<Room> {
    try {
      return await this.ctx.rooms.resume(request.room)
    } catch (error: unknown) {
      throw this.conflict(request.room, error)
    }
  }

  /**
   * Raise the current episode's limits by 50% once.
   * @param request - room target and decision input.
   * @returns the room after the change.
   */
  @Remote('relaxOnce')
  async relaxOnce(request: RoomTargetRequest): Promise<Room> {
    try {
      return await this.ctx.rooms.relaxOnce(request.room)
    } catch (error: unknown) {
      throw this.conflict(request.room, error)
    }
  }

  /**
   * End the current episode.
   * @param request - room target and decision input.
   * @returns the room after the change.
   */
  @Remote('endEpisode')
  async endEpisode(request: RoomTargetRequest): Promise<Room> {
    try {
      return await this.ctx.rooms.endEpisode(request.room)
    } catch (error: unknown) {
      throw this.conflict(request.room, error)
    }
  }

  /**
   * Decide one pending approval.
   * @param request - room target and decision input.
   * @returns the room after the change.
   */
  @Remote('approve')
  async approve(request: RoomApprovalRequest): Promise<Room> {
    try {
      return await this.ctx.rooms.approve(request.room, request.approval, request.decision)
    } catch (error: unknown) {
      throw this.conflict(request.room, error)
    }
  }

  /**
   * Stream room frames: one on open, then one after each change.
   * @param signal - cancellation owned by the Remote stream carrier.
   * @returns the snapshot frames.
   */
  @Remote({ mode: 'stream' })
  watch(signal: AbortSignal): AsyncIterable<RoomSnapshotFrame> {
    return this.snapshots(signal)
  }

  private missing(id: string): RemoteError {
    return new RemoteError('room/not-found', `unknown room ${id}`, { id })
  }

  private conflict(room: RoomId, error: unknown): RemoteError {
    return new RemoteError('room/conflict', messageOf(error), { message: `${room}: ${messageOf(error)}` })
  }

  private async readSnapshot(): Promise<RoomSnapshotFrame> {
    return { rooms: await this.ctx.rooms.list() }
  }

  private async *snapshots(signal: AbortSignal): AsyncGenerator<RoomSnapshotFrame> {
    while (!signal.aborted) {
      let wake!: () => void
      const changed = new Promise<void>((resolve) => { wake = resolve })
      const off = this.ctx.on('room/changed', () => { wake() })
      const abortWake = (): void => { wake() }
      signal.addEventListener('abort', abortWake, { once: true })
      try {
        yield await this.readSnapshot()
        await changed
      } finally {
        off()
        signal.removeEventListener('abort', abortWake)
      }
    }
  }
}

export default RoomController
