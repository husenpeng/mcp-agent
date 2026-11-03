/**
 * Polling and navigation controller shared by the Muse insights overlay and
 * right-Sidebar page.
 *
 * Snapshot polling is the whole change feed: the Host exposes no forwarded
 * event for this optional capability, so one read per interval keeps a page
 * current across generations. Notices are raised only from polling, and only
 * for a day whose recap has not been announced and at most once per cooldown
 * while unfinished tasks remain.
 * @module @tomato/experimental-muse-insights/client/controller
 */

import type { RemoteResult } from '@tomato/api-remotes/client'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { MuseInsightsSnapshot } from '../types.ts'
import { readNoticeMemory, writeNoticeMemory } from './notice-state.ts'
import type { InsightsSource, InsightsView } from './source.ts'

/** Page type the notices and the guide open in the right Sidebar. */
export const INSIGHTS_TAB_KIND = 'muse-insights'

/** Minimum interval between proactive unfinished-task notices while tasks remain. */
export const REMINDER_COOLDOWN_MS = 30 * 60_000

/** Snapshot polling interval. */
export const POLL_INTERVAL_MS = 60_000

/** The narrow host face the controller drives. */
export interface InsightsControllerHost {
  /** Read the current Host snapshot. */
  snapshot(signal: AbortSignal): Promise<RemoteResult<MuseInsightsSnapshot>>
  /** Ask the Host to run both generators now. */
  refresh(signal: AbortSignal): Promise<RemoteResult<MuseInsightsSnapshot>>
  /** The Session on screen, or undefined. */
  readonly mounted: ObservableSnapshot<string | undefined>
  /** Open the details page for one view in the on-screen Session. */
  openTab(view: InsightsView): void
  /** Start a Session when no Session is on screen. */
  startSession(): void
  /** Subscribe to a reconnect reset. */
  onReset(listener: () => void): () => void
  /** Report one contained failure. */
  warn(message: string, error: unknown): void
}

/** One controller instance's lifetime. */
export interface InsightsController {
  /** Read once now; later reads repeat from the interval. */
  readonly poll: () => Promise<void>
  /** Ask the Host to run both generators now, then publish the result. */
  readonly refresh: (signal?: AbortSignal) => Promise<void>
  /** Open the details page for one view, starting a Session when none is on screen. */
  readonly open: (view: InsightsView) => void
  /** Remove the interval and cancel in-flight reads. */
  readonly dispose: () => void
}

/**
 * Create the polling controller.
 * @param host - Remote calls, Sidebar navigation, Workspace commands, and diagnostics.
 * @param source - shared observable and its write actions.
 * @returns the started controller; callers own disposal.
 */
export function createInsightsController(host: InsightsControllerHost, source: InsightsSource): InsightsController {
  const lifetime = new AbortController()
  const isDisposed = (): boolean => lifetime.signal.aborted
  let polling = false
  let nextNoticeId = 0
  let waitingForSession: (() => void) | undefined


  const consider = (snapshot: MuseInsightsSnapshot): void => {
    if (isDisposed() || !snapshot.available) return
    if (source.hooks.insights.getSnapshot().notice !== null) return
    const memory = readNoticeMemory()
    if (snapshot.recap !== null && snapshot.recap.day === snapshot.day && memory.recapDay !== snapshot.day) {
      source.actions.showNotice({ id: ++nextNoticeId, kind: 'recap', recap: snapshot.recap })
      writeNoticeMemory({ recapDay: snapshot.day, lastReminderAt: memory.lastReminderAt })
      return
    }
    if (snapshot.unfinished.tasks.length === 0) return
    if (Date.now() - memory.lastReminderAt < REMINDER_COOLDOWN_MS) return
    source.actions.showNotice({ id: ++nextNoticeId, kind: 'unfinished', tasks: snapshot.unfinished.tasks })
    writeNoticeMemory({ recapDay: memory.recapDay, lastReminderAt: Date.now() })
  }

  const poll = async (): Promise<void> => {
    if (isDisposed() || polling) return
    polling = true
    try {
      const result = await host.snapshot(lifetime.signal)
      if (isDisposed()) return
      if (result.ok) {
        source.actions.loaded(result.value)
        consider(result.value)
      } else if (result.error.code !== 'gateway/cancelled') {
        source.actions.failed()
        host.warn('snapshot read failed', result.error)
      }
    } catch (error: unknown) {
      if (!isDisposed()) {
        source.actions.failed()
        host.warn('snapshot transport failed', error)
      }
    } finally {
      polling = false
    }
  }

  const refresh = async (signal?: AbortSignal): Promise<void> => {
    if (isDisposed()) return
    source.actions.refreshing(true)
    try {
      const result = await host.refresh(signal ?? lifetime.signal)
      if (isDisposed()) return
      if (result.ok) source.actions.loaded(result.value)
      else if (result.error.code !== 'gateway/cancelled') {
        source.actions.failed()
        host.warn('explicit refresh failed', result.error)
      }
    } catch (error: unknown) {
      if (!isDisposed()) {
        source.actions.failed()
        host.warn('explicit refresh transport failed', error)
      }
    } finally {
      if (!isDisposed()) source.actions.refreshing(false)
    }
  }

  const openNow = (view: InsightsView): boolean => {
    try {
      host.openTab(view)
      source.actions.dismissNotice()
      return true
    } catch (error: unknown) {
      host.warn('could not open the insights page', error)
      return false
    }
  }

  const open = (view: InsightsView): void => {
    if (isDisposed()) return
    if (host.mounted.getSnapshot() !== undefined) {
      openNow(view)
      return
    }
    if (waitingForSession !== undefined) return
    try {
      host.startSession()
    } catch (error: unknown) {
      host.warn('could not start a Session for the insights page', error)
      return
    }
    let off: (() => void) | undefined
    const clear = (): void => {
      waitingForSession = undefined
      off?.()
      off = undefined
      clearTimeout(timer)
    }
    const timer = setTimeout(() => { clear() }, 5_000)
    off = host.mounted.subscribe(() => {
      if (host.mounted.getSnapshot() === undefined) return
      clear()
      openNow(view)
    })
    waitingForSession = clear
  }

  const interval = setInterval(() => { void poll() }, POLL_INTERVAL_MS)
  const offReset = host.onReset(() => { void poll() })
  void poll()

  return {
    poll,
    refresh,
    open,
    dispose: () => {
      lifetime.abort()
      clearInterval(interval)
      offReset()
      waitingForSession?.()
    },
  }
}
