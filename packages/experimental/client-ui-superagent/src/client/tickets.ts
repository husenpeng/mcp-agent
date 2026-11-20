/** Browser read state and person actions for the team's Host-owned tickets. */

import { createSnapshotStore } from '@tomato/client-store'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { RemoteResult, TypertClientRemote } from '@tomato/typert-protocol'
import type {} from '@tomato/superagent-runtime/remote'
import type { SubmitResult, TicketDetail, TicketSummary } from '@tomato/superagent-runtime/types'

/** Generated Remote face supplied by `@tomato/superagent-runtime`. */
export type TicketsRemote = TypertClientRemote['superagentTickets']

/** Successful list response inferred from the generated Remote method. */
export type TicketList = Extract<Awaited<ReturnType<TicketsRemote['list']>>, { readonly ok: true }>['value']

/** One row rendered by the panel. */
export type TicketRow = TicketList[number]

/** Current Host read; a failed refresh retains the last successful rows. */
export interface TicketSnapshot {
  readonly status: 'loading' | 'ready' | 'error'
  readonly rows: TicketList
}

/** Observable face the slot renderer binds to `useTickets`. */
export type TicketSource = ObservableSnapshot<TicketSnapshot>

/** The person's operations on the team, each resolving to the generated Remote result. */
export interface TicketActions {
  /** Submit one request typed into the panel. */
  readonly submit: (text: string) => Promise<RemoteResult<SubmitResult>>
  /** Read one ticket's full flow. */
  readonly detail: (ticket: string) => Promise<RemoteResult<TicketDetail>>
  /** Send one ticket new context for its next run. */
  readonly message: (ticket: string, text: string) => Promise<RemoteResult<TicketSummary>>
  /** Abort one ticket's in-flight run. */
  readonly cancel: (ticket: string) => Promise<RemoteResult<TicketSummary>>
  /** Stop one ticket for good. */
  readonly stop: (ticket: string) => Promise<RemoteResult<TicketSummary>>
}

/** One panel read controller; the plugin owns its disposal. */
export interface TicketController {
  readonly source: TicketSource
  /** Read the current Host list, sharing an already-running request. */
  refresh(): Promise<void>
  /** Follow the live ticket stream; a failed stream leaves the last rows and marks the error. */
  watch(): void
  /** The person's submit, detail, message, cancel, and stop operations. */
  readonly actions: TicketActions
  /** Cancel the in-flight read and stream and ignore their settlement. */
  dispose(): void
}

/**
 * Create a read controller without starting work. The slot's inject factory starts each visit's read.
 * @param remote - generated `superagentTickets` namespace.
 * @returns observable state, refresh, live stream, actions, and cancellation.
 */
export function createTicketController(remote: TicketsRemote): TicketController {
  const store = createSnapshotStore<TicketSnapshot>({ status: 'loading', rows: [] })
  const lifetime = new AbortController()
  let reading: Promise<void> | undefined
  let watching = false
  const refresh = (): Promise<void> => {
    if (lifetime.signal.aborted) return Promise.resolve()
    reading ??= (async () => {
      try {
        const result = await remote.list(lifetime.signal)
        if (lifetime.signal.aborted) return
        if (result.ok) store.set({ status: 'ready', rows: result.value })
        else if (result.error.code !== 'gateway/cancelled') {
          store.set({ ...store.getSnapshot(), status: 'error' })
        }
      } catch (_error: unknown) {
        // Generated calls normally return RemoteResult; an assembly failure still becomes a visible query error.
        if (!lifetime.signal.aborted) store.set({ ...store.getSnapshot(), status: 'error' })
      } finally {
        reading = undefined
      }
    })()
    return reading
  }
  const watch = (): void => {
    if (watching || lifetime.signal.aborted) return
    watching = true
    void (async () => {
      try {
        for await (const frame of remote.watch(lifetime.signal)) {
          if (lifetime.signal.aborted) return
          store.set({ status: 'ready', rows: frame.tickets })
        }
      } catch (_error: unknown) {
        // A dropped stream keeps the last rows; the next panel visit starts it again.
        if (!lifetime.signal.aborted) store.set({ ...store.getSnapshot(), status: 'error' })
      } finally {
        watching = false
      }
    })()
  }
  const settled = async <T>(call: Promise<RemoteResult<T>>): Promise<RemoteResult<T>> => {
    const result = await call
    if (result.ok && !lifetime.signal.aborted) void refresh()
    return result
  }
  return {
    source: { getSnapshot: () => store.getSnapshot(), subscribe: listener => store.subscribe(listener) },
    refresh,
    watch,
    actions: {
      submit: text => settled(remote.submit({ text })),
      detail: ticket => remote.detail({ ticket }),
      message: (ticket, text) => settled(remote.message({ ticket, text })),
      cancel: ticket => settled(remote.cancel({ ticket })),
      stop: ticket => settled(remote.stop({ ticket })),
    },
    dispose: () => { lifetime.abort() },
  }
}
