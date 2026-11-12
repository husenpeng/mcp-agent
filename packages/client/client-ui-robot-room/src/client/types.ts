/** Client-side Robot Room page seams. */

import type { RoomRunsSource } from '@tomato/api-robot-room-controller/client'
import type { RemoteResult } from '@tomato/typert-protocol'
import type {
  Room, RoomApprovalRequest, RoomMemberId, RoomMessage, RoomMessagesRequest, RoomPauseRequest, RoomPostRequest,
  RoomPublicationRequest, RoomSpec, RoomTargetRequest,
} from '@tomato/api-robot-room-controller/types'

/** One published Rbot revision the editor can add. */
export interface RoomRobotOption {
  /** Published specification id. */
  readonly spec: string
  /** Positive revision. */
  readonly revision: number
  /** Display name. */
  readonly name: string
  /** One-sentence mission. */
  readonly mission: string
}

/** Derived Rbot catalog the editor reads. */
export interface RoomRobotCatalogSnapshot {
  /** Selectable published revisions. */
  readonly options: readonly RoomRobotOption[]
}

/** Observable catalog face. */
export interface RoomRobotCatalogSource {
  /** Read the identity-stable current catalog. */
  getSnapshot(): RoomRobotCatalogSnapshot
  /**
   * Subscribe to catalog changes.
   * @param listener - invalidation callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

/** State the page reads. */
export interface RoomHooks {
  /** Room snapshot stream. */
  readonly rooms: RoomRunsSource
  /** Rbot roster for member selection. */
  readonly robots: RoomRobotCatalogSource
}

/** Commands the page issues. */
export interface RoomActions {
  /** Publish a new room or a new revision. */
  publish(request: RoomPublicationRequest): Promise<RemoteResult<Room>>
  /** Record one human message. */
  post(request: RoomPostRequest): Promise<RemoteResult<RoomMessage>>
  /** Read messages. */
  messages(request: RoomMessagesRequest): Promise<RemoteResult<readonly RoomMessage[]>>
  /** Pause or resume a room. */
  pause(request: RoomPauseRequest): Promise<RemoteResult<Room>>
  /** Resume a tripped room. */
  resume(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /** Raise the current episode's limits once. */
  relaxOnce(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /** End the current episode. */
  endEpisode(request: RoomTargetRequest): Promise<RemoteResult<Room>>
  /** Decide one approval. */
  approve(request: RoomApprovalRequest): Promise<RemoteResult<Room>>
}

/** Face injected into the page. */
export interface RoomInjected {
  /** Read state. */
  readonly hooks: {
    readonly rooms: RoomRunsSource
    readonly robots: RoomRobotCatalogSource
  }
  /** Issue commands. */
  readonly actions: RoomActions
  /** Open the Tomato Rbot panel. */
  openRobots(): void
  /** Open one member's full Session in the workspace. */
  openSession(sessionId: string): void
}

/** One member id list helper. */
export type MemberIds = readonly RoomMemberId[]

/** Copy of a room specification the editor mutates. */
export type RoomDraft = RoomSpec
