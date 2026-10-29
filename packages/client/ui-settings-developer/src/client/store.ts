/** Bounded gateway-observation log and the last read page facts for the developer page. */
import type { ConnectionObservation } from '@tomato/client-connection/client'
import { createSnapshotStore, type SnapshotStore } from '@tomato/client-store'
import type { DeveloperPageInfo } from './page-info.ts'

/** Observations retained before the oldest are dropped. */
export const RETAINED_OBSERVATIONS = 2000

/** One observed exchange or frame with its page-local sequence id. */
export interface DeveloperEntry {
  readonly id: number
  readonly observation: ConnectionObservation
}

/** Everything the developer page renders. */
export interface DeveloperState {
  readonly entries: DeveloperEntry[]
  readonly dropped: number
  readonly page: DeveloperPageInfo | undefined
}

/** Write surface owned by the plugin's apply closure. */
export interface DeveloperStore {
  /** Current bounded state; subscribers hear at most one change per animation frame. */
  readonly state: SnapshotStore<DeveloperState>
  /** @param observation - one completed exchange or frame. */
  append(observation: ConnectionObservation): void
  /** Drop every retained observation and reset the drop count. */
  clear(): void
  /** @param page - page facts read at the moment the user asked for them. */
  setPage(page: DeveloperPageInfo): void
}

/**
 * Create the page's bounded observation store.
 * @returns state and the actions the page injects.
 */
export function createDeveloperStore(): DeveloperStore {
  const state = createSnapshotStore<DeveloperState>({ entries: [], dropped: 0, page: undefined }, { flush: 'raf' })
  let nextId = 0
  return {
    state,
    append(observation) {
      const current = state.getSnapshot()
      const entries = [...current.entries, { id: nextId++, observation }]
      const excess = Math.max(0, entries.length - RETAINED_OBSERVATIONS)
      state.set({
        entries: excess === 0 ? entries : entries.slice(excess),
        dropped: current.dropped + excess,
        page: current.page,
      })
    },
    clear() {
      const current = state.getSnapshot()
      state.set({ entries: [], dropped: 0, page: current.page })
    },
    setPage(page) {
      state.set({ ...state.getSnapshot(), page })
    },
  }
}
