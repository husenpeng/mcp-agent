/**
 * The crew ledger observed by the studio: one selected run's flow entries,
 * refreshed while the run is live. Owned by the plugin's apply closure and
 * exposed to the page through the reserved `hooks` compartment.
 * @module @tomato/client-ui-robot-crew
 */

import { notifySubscribers } from '@tomato/client-store'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { CrewEntry, CrewRunId } from '@tomato/experimental-robot-crew'

/** Immutable view of one run's ledger. */
export interface CrewLedgerSnapshot {
  /** Run the entries belong to. */
  readonly runId?: string
  /** Entries in sequence order. */
  readonly entries: readonly CrewEntry[]
  /** Latest read failure, cleared by the next successful read. */
  readonly error?: string
}

/** Bare observable source the page reads through its bound hook. */
export interface CrewLedgerSource {
  /** Read the identity-stable current snapshot. */
  getSnapshot(): CrewLedgerSnapshot
  /**
   * Subscribe to snapshot changes.
   * @param listener - invalidation callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

/** Ledger source plus the selection and polling controls the page drives. */
export interface CrewLedgerTracker extends CrewLedgerSource {
  /**
   * Follow one run's ledger.
   * @param runId - run to follow; `undefined` clears the view.
   * @param live - keep refreshing while the run has not settled.
   */
  track(runId: CrewRunId | undefined, live: boolean): void
  /** Stop refreshing and release the timer. */
  dispose(): void
}

/** Milliseconds between live ledger reads. */
const POLL_MS = 900

/**
 * Build the ledger tracker over one Remote read.
 * @param load - reads one run's entries.
 * @returns the tracker the plugin owns and disposes.
 */
export function createCrewLedgerTracker(
  load: (runId: CrewRunId) => Promise<RemoteResult<readonly CrewEntry[]>>,
): CrewLedgerTracker {
  let snapshot: CrewLedgerSnapshot = { entries: [] }
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let current: CrewRunId | undefined
  let live = false
  let inFlight = false
  let pendingRead = false
  let disposed = false

  const publish = (next: CrewLedgerSnapshot): void => {
    const previous = snapshot
    const unchanged = previous.runId === next.runId
      && previous.error === next.error
      && previous.entries.length === next.entries.length
      && previous.entries.at(-1)?.seq === next.entries.at(-1)?.seq
    snapshot = next
    if (!unchanged) notifySubscribers([...listeners], 'crew ledger changed')
  }

  const read = async (): Promise<void> => {
    if (disposed || current === undefined) return
    if (inFlight) {
      pendingRead = true
      return
    }
    inFlight = true
    try {
      const result = await load(current)
      if (disposed || result === undefined) return
      if (result.ok) publish({ runId: current, entries: result.value })
      else publish({ ...snapshot, runId: current, error: result.error.message })
    } catch (error: unknown) {
      publish({ ...snapshot, runId: current, error: error instanceof Error ? error.message : String(error) })
    } finally {
      inFlight = false
      if (pendingRead) {
        pendingRead = false
        void read()
      } else {
        schedule()
      }
    }
  }

  const schedule = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    if (disposed || !live || current === undefined) return
    timer = setTimeout(() => { void read() }, POLL_MS)
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    track: (runId, following) => {
      if (disposed) return
      if (runId !== current) {
        current = runId
        live = following
        publish(runId === undefined ? { entries: [] } : { runId, entries: [] })
        void read()
        return
      }
      const wasLive = live
      live = following
      if (!wasLive && live) schedule()
      else if (wasLive && !live) {
        // The run settled while it was followed: read once more so the final
        // step result and guard entries land even when the last poll raced them.
        if (timer !== undefined) {
          clearTimeout(timer)
          timer = undefined
        }
        void read()
      } else if (!live && snapshot.entries.length === 0) {
        void read()
      }
    },
    dispose: () => {
      disposed = true
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      listeners.clear()
    },
  }
}
