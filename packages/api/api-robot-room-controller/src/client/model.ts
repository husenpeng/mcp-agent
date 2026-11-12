/**
 * React-free client room state: the room snapshot fed by whole `room.watch`
 * frames. Pure data plus subscriptions; transport wiring stays in the client
 * service and UI stays in slot components.
 * @module @tomato/api-robot-room-controller/client/model
 */

import { notifySubscribers } from '@tomato/client-store'
import type { Room } from '../types.ts'

/** Immutable client room snapshot. */
export interface RoomRunsSnapshot {
  /** Current rooms in creation order. */
  readonly rooms: readonly Room[]
}

/** Bare observable source for the client room snapshot. */
export interface RoomRunsSource {
  /** Read the identity-stable current snapshot. */
  getSnapshot(): RoomRunsSnapshot
  /**
   * Subscribe to snapshot changes.
   * @param listener - invalidation callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

const EMPTY: RoomRunsSnapshot = { rooms: [] }

/** Owns the room snapshot replaced by whole `room.watch` frames. */
export class RoomRunsModel implements RoomRunsSource {
  private snapshot: RoomRunsSnapshot = EMPTY
  private readonly listeners = new Set<() => void>()

  getSnapshot(): RoomRunsSnapshot {
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Replace the whole snapshot with one frame's set.
   * @param frame - the complete room set.
   */
  replaced(frame: RoomRunsSnapshot): void {
    this.snapshot = frame
    notifySubscribers([...this.listeners], 'room roster changed')
  }
}
