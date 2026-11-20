/**
 * React-free client monitoring state: the latest frame plus a bounded history
 * of the three headline percentages a sparkline draws. Pure data and
 * subscriptions — transport wiring lives in the client service, presentation in
 * the overlay package.
 * @module @tomato/api-system-monitor-controller/client/model
 */

import { notifySubscribers } from '@tomato/client-store'
import type { SystemSampleFrame } from '../types.ts'

/** History points retained for the sparklines. */
const HISTORY_LIMIT = 90

/** Connection state of the one observation stream. */
export type MonitorStatus = 'idle' | 'live' | 'reconnecting' | 'failed'

/** One sparkline point, all values already reduced to percentages. */
export interface MonitorPoint {
  /** Host wall-clock time the sample was collected, in epoch milliseconds. */
  readonly at: number
  /** Processor busy share, 0–1. */
  readonly cpu: number
  /** Graphics busy share, 0–1; null when the platform reports none. */
  readonly gpu: number | null
  /** Memory in use as a share of physical memory, 0–1. */
  readonly memory: number
}

/** Immutable client monitor state. */
export interface SystemMonitorSnapshot {
  /** The newest frame, or null before the first one arrives. */
  readonly frame: SystemSampleFrame | null
  /** Retained history, oldest first, at most 90 points. */
  readonly points: readonly MonitorPoint[]
  /** Connection state of the observation stream. */
  readonly status: MonitorStatus
  /** Message of the last terminal stream failure, or null. */
  readonly failure: string | null
}

/** Bare observable source for the client monitor snapshot. */
export interface SystemMonitorSource {
  /** Read the identity-stable current snapshot. */
  getSnapshot(): SystemMonitorSnapshot
  /**
   * Subscribe to snapshot changes.
   * @param listener - invalidation callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

/** Mutable bookkeeping behind one snapshot. */
export class ClientSystemMonitorModel implements SystemMonitorSource {
  private frame: SystemSampleFrame | null = null
  private points: readonly MonitorPoint[] = []
  private status: MonitorStatus = 'idle'
  private failure: string | null = null
  private readonly listeners = new Set<() => void>()
  private snapshotCache: SystemMonitorSnapshot = { frame: null, points: [], status: 'idle', failure: null }
  private snapshotDirty = false

  getSnapshot(): SystemMonitorSnapshot {
    if (this.snapshotDirty) {
      this.snapshotCache = {
        frame: this.frame,
        points: this.points,
        status: this.status,
        failure: this.failure,
      }
      this.snapshotDirty = false
    }
    return this.snapshotCache
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Record the stream opening; keeps the last frame visible across a reconnect. */
  opened(): void {
    this.setStatus('live')
  }

  /** Record the carrier reporting an interruption it will retry. */
  interrupted(): void {
    this.setStatus('reconnecting')
  }

  /**
   * Record one frame and extend the history.
   * @param frame - the frame the stream delivered.
   */
  frameReceived(frame: SystemSampleFrame): void {
    this.frame = frame
    const point: MonitorPoint = {
      at: frame.at,
      cpu: frame.cpu.usage,
      gpu: frame.gpu?.utilization ?? null,
      memory: frame.memory.totalBytes > 0 ? frame.memory.usedBytes / frame.memory.totalBytes : 0,
    }
    const next = [...this.points, point]
    this.points = next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
    this.failure = null
    this.status = 'live'
    this.invalidate()
  }

  /**
   * Record a terminal stream failure.
   * @param message - the failure message to keep for the overlay.
   */
  failed(message: string): void {
    this.failure = message
    this.setStatus('failed')
  }

  /** Record that the last consumer released the stream. */
  closed(): void {
    this.failure = null
    this.setStatus('idle')
  }

  private setStatus(status: MonitorStatus): void {
    this.status = status
    this.invalidate()
  }

  private invalidate(): void {
    this.snapshotDirty = true
    notifySubscribers(this.listeners, 'systemMonitor')
  }
}
