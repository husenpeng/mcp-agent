/**
 * Wire types of the generated `room` Remote namespace: the room snapshot
 * stream, publication, posting, approvals, and message reads. Client-safe: no
 * Host runtime imports.
 * @module @tomato/api-robot-room-controller/types
 */

import type {
  Room, RoomApproval, RoomId, RoomMemberId, RoomMessage, RoomSpec, RoomSpecIssue,
} from '@tomato/experimental-robot-room'

export type {
  A2aEnvelopeV2, A2aIntent, AdmissionVerdict, BreakerState, MemberRole, RefusalCode, Room, RoomApproval,
  RoomAuthor, RoomEpisode, RoomGuardRecord, RoomGuardSnapshot, RoomId, RoomMemberId, RoomMemberSpec, RoomMessage,
  RoomMessageId, RoomMessageKind, RoomSpec, RoomSpecIssue, RoomState, RoomWorkRecord, TripReason, WakeRule,
} from '@tomato/experimental-robot-room'

/** One whole-room snapshot frame. */
export interface RoomSnapshotFrame {
  /** Current rooms in creation order. */
  readonly rooms: readonly Room[]
}

/** Publish a new room or a new revision of one. */
export interface RoomPublicationRequest {
  /** Existing room; omitted for a new room. */
  readonly id?: RoomId
  /** Complete specification. */
  readonly spec: RoomSpec
}

/** Record one human message. */
export interface RoomPostRequest {
  /** Room identity. */
  readonly room: RoomId
  /** Message text. */
  readonly text: string
  /** Members explicitly addressed. */
  readonly mentions?: readonly RoomMemberId[]
  /** Human author; defaults to the local operator. */
  readonly author?: { readonly id: string; readonly name: string }
}

/** Read room messages. */
export interface RoomMessagesRequest {
  /** Room identity. */
  readonly room: RoomId
  /** Read messages after this sequence. */
  readonly afterSeq?: number
  /** Maximum messages to return. */
  readonly limit?: number
}

/** Pause or resume a room. */
export interface RoomPauseRequest {
  /** Room identity. */
  readonly room: RoomId
  /** Whether robot wakes stop. */
  readonly paused: boolean
}

/** One room command that only needs the room identity. */
export interface RoomTargetRequest {
  /** Room identity. */
  readonly room: RoomId
}

/** Decide one pending approval. */
export interface RoomApprovalRequest {
  /** Room identity. */
  readonly room: RoomId
  /** Approval identity. */
  readonly approval: string
  /** Operator decision. */
  readonly decision: 'approved' | 'rejected'
}

/** One approval row rendered by the client. */
export type RoomApprovalView = RoomApproval

/** One message row rendered by the client. */
export type RoomMessageView = RoomMessage

declare module '@tomato/typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** A room publication was rejected by validation. */
    'room/spec-invalid': { readonly issues: readonly RoomSpecIssue[] }
    /** The named room record does not exist. */
    'room/not-found': { readonly id: string }
    /** The room refused the operation in its current state. */
    'room/conflict': { readonly message: string }
  }
}
