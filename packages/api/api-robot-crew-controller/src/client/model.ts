/**
 * React-free client crew state: the roster snapshot fed by whole frames of the
 * `crew.watch` stream. Pure data plus subscriptions — transport wiring stays in
 * the client service, UI stays in slot components.
 * @module @tomato/api-robot-crew-controller/client/model
 */

import { notifySubscribers } from '@tomato/client-store'
import type { CrewRun, CrewSpecRevision } from '../types.ts'

/** Immutable client crew roster state. */
export interface CrewRunsSnapshot {
  /** Latest published revision of every crew. */
  readonly specs: readonly CrewSpecRevision[]
  /** Every run in acceptance order. */
  readonly runs: readonly CrewRun[]
}

/** Bare observable source for the client crew snapshot. */
export interface CrewRunsSource {
  /** Read the identity-stable current snapshot. */
  getSnapshot(): CrewRunsSnapshot
  /**
   * Subscribe to snapshot changes.
   * @param listener - invalidation callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

const EMPTY: CrewRunsSnapshot = { specs: [], runs: [] }

/** Owns the roster snapshot replaced by whole `crew.watch` frames. */
export class CrewRunsModel implements CrewRunsSource {
  private snapshot: CrewRunsSnapshot = EMPTY
  private readonly listeners = new Set<() => void>()

  getSnapshot(): CrewRunsSnapshot {
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Replace the whole snapshot with one frame's set.
   * @param frame - the complete roster.
   */
  replaced(frame: CrewRunsSnapshot): void {
    this.snapshot = frame
    notifySubscribers([...this.listeners], 'crew roster changed')
  }
}
