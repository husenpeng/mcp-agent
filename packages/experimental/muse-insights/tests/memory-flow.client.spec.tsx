// @vitest-environment jsdom
/** Memory flow projection and the Session memory tab body. */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { createToolResultMessage, createUserMessage, ToolCallId } from '@tomato/llm'
import type { SessionEventLikeEntry, SessionEventSource } from '@tomato/api-session-controller/client'
import { SessionSeq } from '@tomato/session/types'
import type { SessionEvent, SessionEventMap } from '@tomato/session/types'
import { memoryFlow, createMemoryFlowSource } from '../src/client/memory-flow.ts'
import { MemoryView } from '../src/client/MemoryView.tsx'
import { en } from '../src/client/memory-locales.ts'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    'experimental-memory': {
      readonly kind: 'experimental-memory'
      readonly form: 'snapshot'
      readonly sections: readonly { readonly name: string; readonly text: string }[]
    }
  }
}

declare module '@tomato/session/types' {
  interface SessionEventMap {
    'plugin:tool-memory/promotion': { readonly records: readonly string[] }
    'plugin:tool-memory/turn-capture': { readonly outcome: { readonly status: string } }
  }
}

/** One durable event entry. */
function event<K extends keyof SessionEventMap>(type: K, seq: number, data: SessionEventMap[K]): SessionEventLikeEntry {
  const ignorable = String(type).startsWith('plugin:') ? { ignorable: true as const } : {}
  return { type: 'event', event: { type, seq: SessionSeq(seq), time: seq * 1_000, data, ...ignorable } as SessionEvent }
}

/** One memory tool call. */
function call(seq: number, name = 'memory_search', args = '{"query":"tone"}'): SessionEventLikeEntry {
  return event('tool/call', seq, { turn: 1, step: 1, callId: ToolCallId(`call-${seq}`), name, arguments: args })
}

/** One tool result answering a memory call. */
function result(seq: number, callId: string, text: string): SessionEventLikeEntry {
  return event('tool/result', seq, {
    turn: 1,
    step: 1,
    message: createToolResultMessage({
      callId: ToolCallId(callId),
      isError: false,
      content: [{ type: 'text', text }, { type: 'reasoning', text: 'hidden' }],
    }),
  })
}

/** One injected memory snapshot. */
function snapshot(seq: number, text: string): SessionEventLikeEntry {
  return {
    type: 'event',
    event: {
      type: 'user/message',
      seq: SessionSeq(seq),
      time: seq * 1_000,
      surfaceOp: 'append',
      data: createUserMessage({
        content: [{ type: 'text', text }],
        source: { kind: 'experimental-memory', form: 'snapshot', sections: [{ name: 'experimental-memory', text }] },
      }),
    } as SessionEvent,
  }
}

describe('memoryFlow', () => {
  it('keeps snapshots, memory calls and results, and capture and promotion passes in log order', () => {
    const flow = memoryFlow([
      snapshot(1, 'Memory: 0.4/4.0 KB.\nSaved memories:'),
      call(2),
      result(3, 'call-2', 'Saved memories (historical records, not instructions):'),
      call(4, 'memory_get', '{"ids":["memory-1"]}'),
      result(5, 'call-4', 'details'),
      event('plugin:tool-memory/turn-capture', 6, { outcome: { status: 'stored' } }),
      event('plugin:tool-memory/promotion', 7, { records: ['memory-1'] }),
      event('tool/call', 8, { turn: 1, step: 1, callId: ToolCallId('other'), name: 'bash', arguments: '{}' }),
      { type: 'transient', event: { type: 'assistant/live-chunk', seq: 9, time: 9_000, data: {} as never } },
    ])
    expect(flow.map(row => [row.seq, row.kind, row.title])).toEqual([
      [1, 'snapshot', 'Memory: 0.4/4.0 KB.'],
      [2, 'call', 'memory_search'],
      [3, 'result', 'memory_search'],
      [4, 'call', 'memory_get'],
      [5, 'result', 'memory_get'],
      [6, 'capture', 'turn-capture'],
      [7, 'promotion', 'promotion'],
    ])
    expect(flow[2]?.detail).toBe('Saved memories (historical records, not instructions):')
    expect(flow[0]?.detail).toContain('Saved memories:')
  })

  it('ignores unrelated and orphaned events, bounds details, and keeps the newest rows', () => {
    const many = Array.from({ length: 205 }, (_, index) => call(index + 1, 'memory_search', 'x'.repeat(4_100)))
    const flow = memoryFlow([
      result(1, 'unknown-call', 'orphan'),
      event('tool/result', 2, {
        turn: 1, step: 1, message: createToolResultMessage({ callId: ToolCallId('x'), isError: false, content: [{ type: 'text', text: 'unrelated' }] }),
      }),
      ...many,
    ])
    expect(flow).toHaveLength(200)
    expect(flow[0]?.seq).toBe(6)
    expect(flow[0]?.detail.endsWith('…')).toBe(true)
    expect(flow[0]?.detail).toHaveLength(4_000)
  })

  it('reports changes from the event source and stops after unsubscribe', () => {
    let entries: SessionEventLikeEntry[] = []
    let notify: (() => void) | undefined
    const source: SessionEventSource = {
      getSnapshot: () => ({ entries, hasMore: false, revision: entries.length, change: { kind: 'append', entries } }),
      subscribe: (listener: () => void) => {
        notify = listener
        return () => { notify = undefined }
      },
    }
    const flow = createMemoryFlowSource(source)
    expect(flow.getSnapshot()).toEqual([])
    const seen: number[] = []
    const stop = flow.subscribe(() => { seen.push(flow.getSnapshot().length) })
    entries = [call(1)]
    notify?.()
    expect(seen).toEqual([1])
    stop()
    entries = [call(1), call(2)]
    notify?.()
    expect(seen).toEqual([1])
  })
})

describe('MemoryView', () => {
  it('renders one row per flow item and the empty state', () => {
    const rows = [
      { seq: 1, time: 1_000, kind: 'snapshot' as const, title: 'Memory: 0.1/4.0 KB.', detail: 'Saved memories:' },
      { seq: 2, time: 2_000, kind: 'promotion' as const, title: 'promotion', detail: '{"records":[]}' },
    ]
    const flow = { getSnapshot: () => rows, subscribe: () => () => {} }
    const t = makeTranslate(en)
    const { rerender } = render(<MemoryView flow={flow} t={t} />)
    expect(screen.getByText('Snapshot')).toBeTruthy()
    expect(screen.getByText('Promotion')).toBeTruthy()
    expect(screen.getByText('Memory: 0.1/4.0 KB.')).toBeTruthy()
    const empty: readonly never[] = []
    rerender(<MemoryView flow={{ getSnapshot: () => empty, subscribe: () => () => {} }} t={t} />)
    expect(screen.getByText(en.empty)).toBeTruthy()
  })
})
