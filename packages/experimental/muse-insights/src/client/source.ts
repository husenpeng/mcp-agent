/**
 * One cross-entry observable for the Muse insights: the latest Host snapshot,
 * the notice currently on screen, and read/refresh state. The overlay entry and
 * the right-Sidebar page render from the same source, so a notice and the
 * details it opens never disagree.
 * @module @tomato/experimental-muse-insights/client/source
 */

import { createSnapshotStore } from '@tomato/client-store'
import type { HostObservable } from '@tomato/client-ui-slots'
import type { DailyRecap, MuseInsightsSnapshot, UnfinishedTask } from '../types.ts'

/** The two detail views the right-Sidebar page and the notices open. */
export type InsightsView = 'recap' | 'unfinished'

/** The recap notice shown after a day's recap becomes available. */
export interface RecapNotice {
  /** Per-show identity; keys the card so a new generation restarts its animation. */
  readonly id: number
  readonly kind: 'recap'
  readonly recap: DailyRecap
}

/** The proactive unfinished-task notice. */
export interface UnfinishedNotice {
  /** Per-show identity; keys the card so a new analysis restarts its animation. */
  readonly id: number
  readonly kind: 'unfinished'
  readonly tasks: readonly UnfinishedTask[]
}

/** One notice at a time; later notices wait for the shown one to close. */
export type InsightsNotice = RecapNotice | UnfinishedNotice

/** Complete read state shared by the overlay entry and the Sidebar page. */
export interface InsightsState {
  /** First-load state; a refresh keeps the previous value visible. */
  status: 'loading' | 'ready' | 'error'
  /** Latest Host snapshot, or null before the first successful read. */
  snapshot: MuseInsightsSnapshot | null
  /** Notice currently on screen, or null. */
  notice: InsightsNotice | null
  /** Whether an explicit refresh is in flight. */
  refreshing: boolean
}

/** The read face injected into both entries. */
export interface InsightsInjected {
  /** Observable read state; the renderer binds it to `useInsights`. */
  readonly hooks: { readonly insights: HostObservable<InsightsState> }
}

/** The write face owned by the controller. */
export interface InsightsActions {
  /** Publish the snapshot of a successful read. */
  readonly loaded: (snapshot: MuseInsightsSnapshot) => void
  /** Mark the first read as failed without blanking an already-visible snapshot. */
  readonly failed: () => void
  /** Set or clear the explicit-refresh indicator. */
  readonly refreshing: (value: boolean) => void
  /** Show one notice, replacing any previous one. */
  readonly showNotice: (notice: InsightsNotice) => void
  /** Clear the shown notice. */
  readonly dismissNotice: () => void
}

/** One shared observable plus its write actions. */
export interface InsightsSource extends InsightsInjected {
  readonly actions: InsightsActions
}

/**
 * Create the one shared insights source.
 * @returns the observable read face and the controller's write actions.
 */
export function createInsightsSource(): InsightsSource {
  const store = createSnapshotStore<InsightsState>({
    status: 'loading',
    snapshot: null,
    notice: null,
    refreshing: false,
  })
  return {
    hooks: {
      insights: {
        getSnapshot: () => store.getSnapshot(),
        subscribe: listener => store.subscribe(listener),
      },
    },
    actions: {
      loaded: (snapshot) => { store.update((state) => { state.status = 'ready'; state.snapshot = snapshot }) },
      failed: () => { store.update((state) => { if (state.snapshot === null) state.status = 'error' }) },
      refreshing: (value) => { store.update((state) => { state.refreshing = value }) },
      showNotice: (notice) => { store.update((state) => { state.notice = notice }) },
      dismissNotice: () => { store.update((state) => { state.notice = null }) },
    },
  }
}
