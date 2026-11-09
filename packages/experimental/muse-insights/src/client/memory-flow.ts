/**
 * Memory activity derived from one Session's event window: injected snapshots,
 * memory tool calls and results, capture passes, and promotion passes. The tab
 * reads the same durable events the Host logs, so the flow it shows is the
 * memory subsystem's own record rather than a second copy.
 * @module @tomato/experimental-muse-insights/client/memory-flow
 */

import type { ObservableSnapshot } from '@tomato/client-store'
import type { SessionEventLikeEntry, SessionEventSource } from '@tomato/api-session-controller/client'
import type { SessionEvent } from '@tomato/session/types'

/** Which kind of memory work one row reports. */
export type MemoryFlowKind = 'snapshot' | 'call' | 'result' | 'capture' | 'promotion'

/** One row of the memory processing flow. */
export interface MemoryFlowItem {
  /** Event seq that produced the row. */
  readonly seq: number
  /** Event time in epoch milliseconds. */
  readonly time: number
  /** Category shown as a badge. */
  readonly kind: MemoryFlowKind
  /** Tool name, plugin record, or snapshot heading. */
  readonly title: string
  /** Bounded event text. */
  readonly detail: string
}

/** Longest detail one row keeps; the tab is a log, not a payload viewer. */
const MAX_DETAIL_CHARS = 4_000

/** Rows kept in the window; older memory events stay in the Session log. */
const MAX_ROWS = 200

/** Join the text blocks of one message or tool result. */
function textOf(event: SessionEvent<'user/message'> | SessionEvent<'tool/result'>): string {
  const content: unknown = event.type === 'tool/result' ? event.data.message.content : event.data.content
  /* v8 ignore next -- durable message content is always a block array */
  if (!Array.isArray(content)) return ''
  return content.flatMap(block => block !== null && typeof block === 'object' && 'type' in block && block.type === 'text'
    ? [(block as { readonly text: string }).text]
    : []).join('\n')
}

/** Bounded detail text. */
function bounded(text: string): string {
  return text.length <= MAX_DETAIL_CHARS ? text : `${text.slice(0, MAX_DETAIL_CHARS - 1)}…`
}

/** A memory tool call id mapped to its tool name, so a result row names the tool. */
type CallNames = Map<string, string>

/** Read one event as a flow row, or `undefined` for an unrelated event. */
function rowOf(event: SessionEvent, calls: CallNames): MemoryFlowItem | undefined {
  if (event.type === 'user/message' && String(event.data.source.kind) === 'experimental-memory') {
    const text = textOf(event)
    /* v8 ignore next -- split always yields one line */
    return { seq: event.seq, time: event.time, kind: 'snapshot', title: text.split('\n')[0] ?? '', detail: bounded(text) }
  }
  if (event.type === 'tool/call' && event.data.name.startsWith('memory_')) {
    calls.set(event.data.callId, event.data.name)
    return { seq: event.seq, time: event.time, kind: 'call', title: event.data.name, detail: bounded(event.data.arguments) }
  }
  if (event.type === 'tool/result') {
    const name = calls.get(event.data.message.toolCallId)
    if (name === undefined) return undefined
    return { seq: event.seq, time: event.time, kind: 'result', title: name, detail: bounded(textOf(event)) }
  }
  // Plugin records are the ignorable Session events whose type carries their own name.
  if (event.ignorable !== true || !event.type.startsWith('plugin:tool-memory/')) return undefined
  const suffix = event.type.slice('plugin:tool-memory/'.length)
  return {
    seq: event.seq,
    time: event.time,
    kind: suffix === 'promotion' ? 'promotion' : 'capture',
    title: suffix,
    detail: bounded(JSON.stringify(event.data)),
  }
  return undefined
}

/**
 * Build the memory flow of one event window.
 * @param entries - the Session's contiguous event entries.
 * @returns rows in log order, capped to the newest {@link MAX_ROWS}.
 */
export function memoryFlow(entries: readonly SessionEventLikeEntry[]): readonly MemoryFlowItem[] {
  const calls: CallNames = new Map()
  const rows: MemoryFlowItem[] = []
  for (const entry of entries) {
    if (entry.type !== 'event') continue
    const row = rowOf(entry.event, calls)
    if (row !== undefined) rows.push(row)
  }
  return rows.slice(-MAX_ROWS)
}

/**
 * Live memory flow over one Session's event window.
 * @param events - the binding's observable event window.
 * @returns an observable snapshot the tab renders.
 */
export function createMemoryFlowSource(events: SessionEventSource): ObservableSnapshot<readonly MemoryFlowItem[]> {
  let snapshot = memoryFlow(events.getSnapshot().entries)
  const listeners = new Set<() => void>()
  events.subscribe(() => {
    snapshot = memoryFlow(events.getSnapshot().entries)
    for (const listener of listeners) listener()
  })
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}
