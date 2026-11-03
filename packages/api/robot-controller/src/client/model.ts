/**
 * React-free client robot state: the registry snapshot fed by whole frames of
 * the `robot.watch` stream. Pure data plus subscriptions — transport wiring
 * stays in the client service, UI stays in slot components.
 * @module @tomato/api-robot-controller/client/model
 */

import { notifySubscribers } from '@tomato/client-store'
import type {
  Robot, RobotSpecRevision, Run,
} from '../types.ts'

/** Immutable client robot registry state. */
export interface RobotRunsSnapshot {
  /** Latest published revision of every specification. */
  readonly specs: readonly RobotSpecRevision[]
  /** Every robot in creation order. */
  readonly robots: readonly Robot[]
  /** Every run in acceptance order. */
  readonly runs: readonly Run[]
}

/** Bare observable source for the client robot snapshot. */
export interface RobotRunsSource {
  /** Read the identity-stable current snapshot. */
  getSnapshot(): RobotRunsSnapshot
  /**
   * Subscribe to snapshot changes.
   * @param listener - invalidation callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

const EMPTY: RobotRunsSnapshot = { specs: [], robots: [], runs: [] }

/** Owns the registry snapshot replaced by whole `robot.watch` frames. */
export class RobotRunsModel implements RobotRunsSource {
  private snapshot: RobotRunsSnapshot = EMPTY
  private readonly listeners = new Set<() => void>()

  getSnapshot(): RobotRunsSnapshot {
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Replace the whole snapshot with one frame's set.
   * @param frame - the complete registry set.
   */
  replaced(frame: RobotRunsSnapshot): void {
    this.snapshot = frame
    notifySubscribers([...this.listeners], 'robot registry changed')
  }
}
