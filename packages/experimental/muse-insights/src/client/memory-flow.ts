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

/** Plugin records and snapshot outcomes the tab renders with their own copy. */
export type MemoryFlowRecord =
  | 'snapshot'
  | 'withdrawn'
  | 'query-expansion'
  | 'turn-capture'
  | 'episode-capture'
  | 'promotion'
  | 'candidates'

/** Heading counts of one injected snapshot. */
export interface MemorySnapshotCounts {
  /** Record lines under the saved-memories heading. */
  readonly memories: number
  /** Episode lines under the project index heading. */
  readonly index: number
  /** Episode lines under the project history heading. */
  readonly history: number
}

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
  /** Sub-kind the view localizes; absent for a plain snapshot body. */
  readonly record?: MemoryFlowRecord
  /** Parsed lines shown as the card body. */
  readonly lines: readonly string[]
  /** Heading counts of an injected snapshot. */
  readonly counts?: MemorySnapshotCounts
  /** Records this row can act on, each with the command that acts on it. */
  readonly actions?: readonly MemoryFlowAction[]
}

/** One record a row can act on, and the host command that acts on it. */
export interface MemoryFlowAction {
  /** Record identity the command names. */
  readonly id: string
  /** Prompt text the host runs as a command; it needs no model turn. */
  readonly confirm: string
  /** Prompt text that silences the record until another write states it. */
  readonly dismiss: string
}

/** Longest detail one row keeps; the tab is a log, not a payload viewer. */
const MAX_DETAIL_CHARS = 4_000

/** Rows kept in the window; older memory events stay in the Session log. */
const MAX_ROWS = 200

/** Text that marks a snapshot the Host withdrew. */
const WITHDRAWN_PREFIX = 'Saved memories: no memory is shown for this turn'

/** Join the text blocks of one message or tool result. */
function textOf(event: SessionEvent<'user/message'> | SessionEvent<'tool/result'>): string {
  const content: unknown = event.type === 'tool/result' ? event.data.message.content : event.data.content
  /* v8 ignore next -- durable message content is always a block array */
  if (!Array.isArray(content)) return ''
  return (content as readonly unknown[]).flatMap(textBlock).join('\n')
}

/** Read one block's text, if it is a text block. */
function textBlock(block: unknown): string[] {
  /* v8 ignore next -- durable message blocks are typed objects */
  if (block === null || typeof block !== 'object' || !('type' in block)) return []
  const record = block as { readonly type?: unknown; readonly text?: unknown }
  return record.type === 'text' && typeof record.text === 'string' ? [record.text] : []
}

/** Bounded detail text. */
function bounded(text: string): string {
  return text.length <= MAX_DETAIL_CHARS ? text : `${text.slice(0, MAX_DETAIL_CHARS - 1)}…`
}

/** A memory tool call id mapped to its tool name, so a result row names the tool. */
type CallNames = Map<string, string>

/** Read an unknown record field as a string. */
function stringField(value: unknown, key: string): string | undefined {
  /* v8 ignore next -- plugin record data is an object */
  if (value === null || typeof value !== 'object') return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : undefined
}

/** Read an unknown record field as a number. */
function numberField(value: unknown, key: string): number | undefined {
  /* v8 ignore next -- plugin record data is an object */
  if (value === null || typeof value !== 'object') return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'number' ? field : undefined
}

/** Read an unknown record field as an object. */
function objectField(value: unknown, key: string): unknown {
  /* v8 ignore next -- plugin record data is an object */
  if (value === null || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)[key]
}

/** One-line summary of a JSON argument object, or the raw text when it is not JSON. */
function argumentLines(args: string): readonly string[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(args)
  } catch {
    return args.trim() === '' ? [] : [args.trim()]
  }
  const lines: string[] = []
  const query = stringField(parsed, 'query')
  if (query !== undefined) lines.push(`query: ${query}`)
  const ids = objectField(parsed, 'ids')
  if (Array.isArray(ids)) lines.push(`ids: ${ids.filter(id => typeof id === 'string').join(', ')}`)
  const id = stringField(parsed, 'id')
  if (id !== undefined) lines.push(`id: ${id}`)
  if (lines.length === 0) lines.push(args.trim())
  return lines
}

/** Count the record and episode lines of one injected snapshot. */
function snapshotCounts(text: string): MemorySnapshotCounts {
  let section: 'memories' | 'index' | 'history' = 'memories'
  const counts = { memories: 0, index: 0, history: 0 }
  for (const line of text.split('\n')) {
    if (line.startsWith('Project memory index:')) { section = 'index'; continue }
    if (line.startsWith('Project history')) { section = 'history'; continue }
    if (line.startsWith('Project memories by subject')) { section = 'index'; continue }
    if (!line.startsWith('- ')) continue
    counts[section] += 1
  }
  return counts
}

/** Lines of one injected snapshot, without its byte-count header. */
function snapshotLines(text: string): readonly string[] {
  if (text.startsWith(WITHDRAWN_PREFIX)) return []
  const lines = text.split('\n')
  if (lines[0]?.startsWith('Memory: ')) lines.shift()
  const heading = lines[0]
  /* v8 ignore next -- the producer always writes the heading */
  if (heading === undefined) return []
  lines.shift()
  return lines.filter(line => line !== '' && !line.startsWith('Project memory index:')
    && !line.startsWith('Project history') && !line.startsWith('Project memories by subject')
    && !line.startsWith('Saved memories relevant to this request'))
}

/** Read one event as a flow row, or `undefined` for an unrelated event. */
function rowOf(event: SessionEvent, calls: CallNames): MemoryFlowItem | undefined {
  if (event.type === 'user/message') {
    // The memory package augments MessageSourceMap; widen to its runtime marker without importing Host code here.
    const sourceKind: string = event.data.source.kind
    if (sourceKind === 'experimental-memory') {
      const text = textOf(event)
      const withdrawn = text.startsWith(WITHDRAWN_PREFIX)
      return {
        seq: event.seq,
        time: event.time,
        kind: 'snapshot',
        record: withdrawn ? 'withdrawn' : 'snapshot',
        /* v8 ignore next -- split always yields one line */
        title: text.split('\n')[0] ?? '',
        detail: bounded(text),
        lines: snapshotLines(text),
        ...withdrawn ? {} : { counts: snapshotCounts(text) },
      }
    }
  }
  if (event.type === 'tool/call' && event.data.name.startsWith('memory_')) {
    calls.set(event.data.callId, event.data.name)
    return {
      seq: event.seq,
      time: event.time,
      kind: 'call',
      title: event.data.name,
      detail: bounded(event.data.arguments),
      lines: argumentLines(event.data.arguments),
    }
  }
  if (event.type === 'tool/result') {
    const name = calls.get(event.data.message.toolCallId)
    if (name === undefined) return undefined
    const text = textOf(event)
    const first = text.split('\n').find(line => line.trim() !== '')?.trim()
    return {
      seq: event.seq,
      time: event.time,
      kind: 'result',
      title: name,
      detail: bounded(text),
      lines: first === undefined ? [] : [first],
    }
  }
  // Plugin records are the ignorable Session events whose type carries their own name.
  if (event.ignorable !== true || !event.type.startsWith('plugin:tool-memory/')) return undefined
  const suffix = event.type.slice('plugin:tool-memory/'.length)
  const data: unknown = event.data
  if (suffix === 'promotion') {
    const records = objectField(data, 'records')
    const lines = Array.isArray(records)
      ? records.flatMap((record) => {
        const entity = stringField(record, 'entity')
        const key = stringField(record, 'key')
        const id = stringField(record, 'id')
        const episodes = objectField(record, 'episodes')
        const count = Array.isArray(episodes) ? episodes.length : 0
        return entity === undefined || key === undefined || id === undefined
          ? []
          : [`${entity} / ${key} → ${id} (${count} episodes)`]
      })
      : []
    return {
      seq: event.seq,
      time: event.time,
      kind: 'promotion',
      record: 'promotion',
      title: suffix,
      detail: bounded(JSON.stringify(data)),
      lines,
    }
  }
  if (suffix === 'candidates') {
    const records = objectField(data, 'candidates')
    const lines = Array.isArray(records)
      ? records.flatMap((record) => {
        const entity = stringField(record, 'entity')
        const key = stringField(record, 'key')
        const id = stringField(record, 'id')
        if (entity === undefined || key === undefined || id === undefined) return []
        const value = stringField(record, 'value') ?? ''
        const evidence = numberField(record, 'evidence')
        const replaces = stringField(record, 'proposalFor')
        const marks = [
          ...evidence === undefined || evidence < 2 ? [] : [`x${evidence}`],
          ...replaces === undefined ? [] : [`replaces ${replaces}`],
        ]
        return [`${entity} / ${key}: ${value}${marks.length === 0 ? '' : ` (${marks.join(', ')})`} → ${id}`]
      })
      : []
    const actions = Array.isArray(records)
      ? records.flatMap((record) => {
        const id = stringField(record, 'id')
        return id === undefined
          ? []
          : [{ id, confirm: `/memory confirm ${id}`, dismiss: `/memory dismiss ${id}` }]
      })
      : []
    return {
      seq: event.seq,
      time: event.time,
      kind: 'capture',
      record: 'candidates',
      title: suffix,
      detail: bounded(JSON.stringify(data)),
      lines,
      ...actions.length === 0 ? {} : { actions },
    }
  }
  if (suffix === 'query-expansion') {
    const input = stringField(data, 'input') ?? ''
    const outcome = objectField(data, 'outcome')
    const status = stringField(outcome, 'status')
    const alternatives = objectField(outcome, 'alternatives')
    const reason = stringField(outcome, 'reason')
    return {
      seq: event.seq,
      time: event.time,
      kind: 'capture',
      record: 'query-expansion',
      title: suffix,
      detail: bounded(JSON.stringify(data)),
      lines: [
        `query: ${input}`,
        status === 'expanded' && Array.isArray(alternatives)
          ? `alternatives: ${alternatives.filter(value => typeof value === 'string').join(' · ')}`
          : `outcome: ${status ?? 'unknown'}${reason === undefined ? '' : ` (${reason})`}`,
      ],
    }
  }
  if (suffix === 'turn-capture') {
    const outcome = objectField(data, 'outcome')
    const status = stringField(outcome, 'status')
    const ids = objectField(outcome, 'ids')
    const activated = objectField(outcome, 'activated')
    const summaryId = stringField(outcome, 'summaryId')
    const reason = stringField(outcome, 'reason')
    const fromSeq = numberField(data, 'fromSeq')
    const toSeq = numberField(data, 'toSeq')
    const lines: string[] = []
    if (fromSeq !== undefined && toSeq !== undefined) lines.push(`messages: #${fromSeq}–#${toSeq}`)
    lines.push(`outcome: ${status ?? 'unknown'}${reason === undefined ? '' : ` (${reason})`}`)
    if (Array.isArray(ids) && ids.length > 0) lines.push(`stored: ${ids.join(', ')}`)
    if (Array.isArray(activated) && activated.length > 0) {
      lines.push(`active: ${activated.filter(value => typeof value === 'string').join(', ')}`)
    }
    if (summaryId !== undefined) lines.push(`summary: ${summaryId}`)
    return {
      seq: event.seq,
      time: event.time,
      kind: 'capture',
      record: 'turn-capture',
      title: suffix,
      detail: bounded(JSON.stringify(data)),
      lines,
    }
  }
  if (suffix === 'episode-capture') {
    const outcome = objectField(data, 'outcome')
    const status = stringField(outcome, 'status')
    const id = stringField(outcome, 'id')
    const reason = stringField(outcome, 'reason')
    const tool = stringField(objectField(data, 'outcome') ?? data, 'tool')
    return {
      seq: event.seq,
      time: event.time,
      kind: 'capture',
      record: 'episode-capture',
      title: suffix,
      detail: bounded(JSON.stringify(data)),
      lines: [
        ...tool === undefined ? [] : [`tool: ${tool}`],
        `outcome: ${status ?? 'unknown'}${reason === undefined ? '' : ` (${reason})`}`,
        ...id === undefined ? [] : [`episode: ${id}`],
      ],
    }
  }
  return {
    seq: event.seq,
    time: event.time,
    kind: 'capture',
    title: suffix,
    detail: bounded(JSON.stringify(data)),
    lines: [],
  }
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
