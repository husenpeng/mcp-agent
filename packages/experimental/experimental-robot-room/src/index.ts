/**
 * Service definition for the `ctx.rooms` capability seam: durable group
 * conversations with manually configured Rbot members, one visible log, and
 * bounded A2A. Persistence, scheduling, and transport belong to the provider.
 * @module @tomato/experimental-robot-room
 */

import { Context, Service } from '@tomato/cordis'
import type { Room, RoomId, RoomMemberId, RoomMessage, RoomNotice, RoomSpec } from './types.ts'

export type * from './types.ts'
export { RoomSpecValidationError } from './types.ts'
export {
  A2A_MAX_CONTEXT, A2A_MAX_TASK, A2A_PROTOCOL_V2, clampText, createEnvelopeV2, isEnvelopeV2,
  normalizeRoomText, roomSignature,
} from './protocol.ts'
export type { RoomEnvelopeInput } from './protocol.ts'
export {
  DEFAULT_ROOM_BUDGET, DEFAULT_ROOM_CONTEXT, DEFAULT_ROOM_GUARD, MAX_MEMBERS, MIN_MEMBERS, ROOM_PRESETS,
  emptyRoomSpec, requireRoomSpec, roomMember, validateRoomSpec,
} from './spec.ts'
export type { EmptyRoomInput, EmptyRoomMemberInput, RoomPreset } from './spec.ts'
export { estimateTokens, grantFor, preflight, remaining, softLimitCrossed } from './budget.ts'
export type { PreflightVerdict, TurnBudgetLimits } from './budget.ts'
export { NO_PROGRESS_SIMILARITY, RoomGuard, routeHuman, similarity, wakeMatches } from './guard.ts'
export type { A2aCandidate, AdmissionBudgets, GuardTrip, HumanCandidate, HumanRoute, RoomGuardState } from './guard.ts'
export {
  authorLabel, buildMemberInput, fallbackSummary, renderMessage, unreadCount, visibleTo,
} from './context.ts'
export type { MemberInput, MemberInputOptions, WakeReason } from './context.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Durable Robot Room conversations. */
    rooms: Rooms
  }

  interface Events {
    /**
     * One room record family changed.
     * @param room - room whose records changed.
     * @mode emit
     */
    'room/changed'(room: RoomId): void
    /**
     * One operator-facing room notice for an external notification channel.
     * @param notice - room, kind, text, and time.
     * @mode emit
     */
    'room/notice'(notice: RoomNotice): void
  }
}

/** One human message submitted to a room. */
export interface RoomPost {
  /** Room identity. */
  readonly room: RoomId
  /** Message text. */
  readonly text: string
  /** Members explicitly addressed. */
  readonly mentions?: readonly RoomMemberId[]
  /** Human author identity. */
  readonly author: { readonly id: string; readonly name: string }
}

/**
 * Abstract Robot Room service. Implement every operation in a provider and load
 * the provider as the plugin.
 *
 * Implementations must honor these semantics:
 * - A room revision is immutable and append-only; a running episode keeps the
 *   revision it started under.
 * - Every message a member model can read is durably recorded before delivery.
 * - A member has no side channel: only `ctx.rooms` admits and delivers messages.
 * - An open breaker stops robot wakes; human messages are still recorded.
 * - An interrupted episode is not replayed after a restart.
 */
export abstract class Rooms extends Service {
  constructor(ctx: Context) {
    super(ctx, 'rooms')
  }

  /**
   * List current rooms in publication order.
   * @returns every published room.
   */
  abstract list(): Promise<readonly Room[]>

  /**
   * Read one room.
   * @param id - room identity.
   * @returns the room, or `undefined` when it does not exist.
   */
  abstract room(id: RoomId): Promise<Room | undefined>

  /**
   * Publish a new room or save a new revision of one.
   * @param id - existing room, or `undefined` for a new room.
   * @param spec - complete specification.
   * @returns the saved room with its new revision.
   */
  abstract publish(id: RoomId | undefined, spec: RoomSpec): Promise<Room>

  /**
   * Record one human message and schedule its wakes.
   * @param input - room, text, mentions, and author.
   * @returns the recorded message.
   */
  abstract post(input: RoomPost): Promise<RoomMessage>

  /**
   * Read room messages in sequence order.
   * @param id - room identity.
   * @param afterSeq - read messages after this sequence; omitted starts at `1`.
   * @param limit - maximum messages to return; omitted uses the provider default.
   * @returns messages in sequence order.
   */
  abstract messages(id: RoomId, afterSeq?: number, limit?: number): Promise<readonly RoomMessage[]>

  /**
   * Pause or resume a room.
   * @param id - room identity.
   * @param paused - whether robot wakes stop.
   * @returns the updated room.
   */
  abstract pause(id: RoomId, paused: boolean): Promise<Room>

  /**
   * Resume a tripped room: the breaker enters half-open.
   * @param id - room identity.
   * @returns the updated room.
   */
  abstract resume(id: RoomId): Promise<Room>

  /**
   * Raise the current episode's limits by 50% once.
   * @param id - room identity.
   * @returns the updated room.
   */
  abstract relaxOnce(id: RoomId): Promise<Room>

  /**
   * End the current episode and close its breaker.
   * @param id - room identity.
   * @returns the updated room.
   */
  abstract endEpisode(id: RoomId): Promise<Room>

  /**
   * Decide one pending A2A approval.
   * @param id - room identity.
   * @param approval - approval identity.
   * @param decision - operator decision.
   * @returns the updated room.
   */
  abstract approve(id: RoomId, approval: string, decision: 'approved' | 'rejected'): Promise<Room>
}
