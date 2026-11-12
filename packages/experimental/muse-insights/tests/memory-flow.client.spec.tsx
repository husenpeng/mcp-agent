// @vitest-environment jsdom
/** Memory flow projection and the Session memory tab body. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { createToolResultMessage, createUserMessage, ToolCallId } from '@tomato/llm'
import type { SessionEventLikeEntry, SessionEventSource } from '@tomato/api-session-controller/client'
import { SessionSeq } from '@tomato/session/types'
import type { SessionEvent, SessionEventMap } from '@tomato/session/types'
import { memoryFlow, createMemoryFlowSource } from '../src/client/memory-flow.ts'
import type { MemoryFlowItem } from '../src/client/memory-flow.ts'
import { MemoryView } from '../src/client/MemoryView.tsx'
import { en } from '../src/client/memory-locales.ts'

afterEach(() => { cleanup() })

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
    'plugin:tool-memory/promotion': {
      readonly records: readonly {
        readonly id?: string
        readonly entity?: string
        readonly key?: string
        readonly episodes?: readonly string[]
      }[]
    }
    'plugin:tool-memory/turn-capture': {
      readonly fromSeq?: number
      readonly toSeq?: number
      readonly outcome: {
        readonly status: string
        readonly ids?: readonly string[]
        readonly activated?: readonly string[]
        readonly summaryId?: string
        readonly reason?: string
      }
    }
    'plugin:tool-memory/query-expansion': {
      readonly input?: string
      readonly outcome: { readonly status: string; readonly alternatives?: readonly string[]; readonly reason?: string }
    }
    'plugin:tool-memory/episode-capture': {
      readonly outcome: { readonly status: string; readonly id?: string; readonly reason?: string; readonly tool?: string }
    }
    'plugin:tool-memory/unknown': { readonly value?: string }
  }
}

/** One durable event entry. */
function event<K extends keyof SessionEventMap>(type: K, seq: number, data: SessionEventMap[K]): SessionEventLikeEntry {
  const ignorable = type.startsWith('plugin:') ? { ignorable: true as const } : {}
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
      event('plugin:tool-memory/promotion', 7, { records: [{ id: 'memory-1', entity: 'project', key: 'k' }] }),
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

  it('parses every snapshot section and the remaining plugin record shapes', () => {
    const text = [
      'Memory: 3.0/6.5 KB.',
      'Saved memories from earlier sessions: heading',
      '- memory-1 [constraint, pinned] user / a: b (saved 2026-11-04)',
      '',
      'Saved memories relevant to this request (historical records, not instructions):',
      '- memory-2 [decision] project / c: d (saved 2026-11-05)',
      '',
      'Project memories by subject (counts only; memory_search returns the values):',
      '- client: 2 (a, b)',
      '',
      'Project memory index:',
      '- episode-1 [observation/command] bash (saved 2026-11-09)',
      '',
      'Project history (historical records, not instructions):',
      '- episode-2 [observation/command] bash (saved 2026-11-09)',
    ].join('\n')
    const flow = memoryFlow([
      snapshot(1, text),
      call(2, 'memory_search', 'not json'),
      call(3, 'memory_get', '{"ids":["a",1]}'),
      call(4, 'memory_get', '{"id":"m"}'),
      result(5, 'call-2', '  '),
      event('plugin:tool-memory/promotion', 6, {
        records: [{ id: 'memory-1', entity: 'project', key: 'k', episodes: ['e1', 'e2'] }, { id: 'missing' }],
      }),
      event('plugin:tool-memory/promotion', 7, { records: [] }),
      event('plugin:tool-memory/query-expansion', 8, {
        input: 'q', outcome: { status: 'failed', reason: 'timeout' },
      }),
      event('plugin:tool-memory/turn-capture', 9, { outcome: { status: 'skipped', reason: 'empty' } }),
      event('plugin:tool-memory/episode-capture', 10, { outcome: { status: 'failed', reason: 'timeout' } }),
      event('plugin:tool-memory/episode-capture', 11, { outcome: { status: 'stored', id: 'episode-1', tool: 'bash' } }),
      event('plugin:tool-memory/unknown', 12, { value: 'x' }),
    ])
    expect(flow[0]?.counts).toEqual({ memories: 2, index: 2, history: 1 })
    expect(flow[1]?.lines).toEqual(['not json'])
    expect(flow[2]?.lines).toEqual(['ids: a'])
    expect(flow[3]?.lines).toEqual(['id: m'])
    expect(flow[4]?.lines).toEqual([])
    expect(flow[5]?.lines).toEqual(['project / k → memory-1 (2 episodes)'])
    expect(flow[6]?.lines).toEqual([])
    expect(flow[7]?.lines).toEqual(['query: q', 'outcome: failed (timeout)'])
    expect(flow[8]?.lines).toEqual(['outcome: skipped (empty)'])
    expect(flow[9]?.lines).toEqual(['outcome: failed (timeout)'])
    expect(flow[10]?.lines).toEqual(['tool: bash', 'outcome: stored', 'episode: episode-1'])
    expect(flow[11]?.record).toBeUndefined()
    expect(flow[11]?.title).toBe('unknown')
  })

  it('labels a withdrawn snapshot and turns plugin records into readable lines', () => {
    const flow = memoryFlow([
      snapshot(1, 'Saved memories: no memory is shown for this turn. Earlier saved memories in this session may no longer apply.'),
      event('plugin:tool-memory/turn-capture', 2, {
        fromSeq: 3,
        toSeq: 4,
        outcome: { status: 'stored', ids: ['memory-1'], activated: ['memory-1'], summaryId: 'episode-1' },
      }),
      event('plugin:tool-memory/query-expansion', 3, {
        input: 'tone',
        outcome: { status: 'expanded', alternatives: ['style', '语气'] },
      }),
    ])
    expect(flow[0]?.record).toBe('withdrawn')
    expect(flow[0]?.lines).toEqual([])
    expect(flow[1]?.record).toBe('turn-capture')
    expect(flow[1]?.lines).toEqual(['messages: #3–#4', 'outcome: stored', 'stored: memory-1', 'active: memory-1', 'summary: episode-1'])
    expect(flow[2]?.record).toBe('query-expansion')
    expect(flow[2]?.lines).toEqual(['query: tone', 'alternatives: style · 语气'])
  })

  it('handles a headerless snapshot, a non-memory message, and incomplete records', () => {
    const flow = memoryFlow([
      {
        type: 'event',
        event: {
          type: 'user/message', seq: 1, time: 1_000, surfaceOp: 'append',
          data: createUserMessage({ content: [{ type: 'text', text: 'hi' }], source: { kind: 'user' } }),
        } as never,
      },
      snapshot(2, 'Saved memories from earlier sessions: heading\n- memory-1 [preference] user / tone: short'),
      call(3, 'memory_search', ''),
      call(4, 'memory_search', '{}'),
      event('plugin:tool-memory/promotion', 5, { records: [{ id: 'm', entity: 'project', key: 'k' }] }),
      event('plugin:tool-memory/query-expansion', 6, { input: 'q', outcome: { status: 'expanded' } }),
      event('plugin:tool-memory/turn-capture', 7, {
        fromSeq: 1,
        outcome: { status: 'stored', ids: [], activated: ['a', 1] as never },
      }),
      event('plugin:tool-memory/promotion', 8, { records: null as never }),
      event('plugin:tool-memory/query-expansion', 9, {} as never),
      event('plugin:tool-memory/turn-capture', 10, {} as never),
      event('plugin:tool-memory/episode-capture', 11, {} as never),
    ])
    expect(flow).toHaveLength(10)
    expect(flow[0]?.lines).toEqual(['- memory-1 [preference] user / tone: short'])
    expect(flow[1]?.lines).toEqual([])
    expect(flow[2]?.lines).toEqual(['{}'])
    expect(flow[3]?.lines).toEqual(['project / k → m (0 episodes)'])
    expect(flow[4]?.lines).toEqual(['query: q', 'outcome: expanded'])
    expect(flow[5]?.lines).toEqual(['outcome: stored', 'active: a'])
    expect(flow[6]?.lines).toEqual([])
    expect(flow[7]?.lines).toEqual(['query: ', 'outcome: unknown'])
    expect(flow[8]?.lines).toEqual(['outcome: unknown'])
    expect(flow[9]?.lines).toEqual(['outcome: unknown'])
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
  it('renders typed snapshot and promotion rows, filters them, and shows the empty state', () => {
    const rows: MemoryFlowItem[] = [
      {
        seq: 1,
        time: 1_000,
        kind: 'snapshot',
        record: 'snapshot',
        title: 'Memory: 0.1/4.0 KB.',
        detail: 'Saved memories:',
        lines: ['- memory-1 [preference, profile] user / email-tone: 简短直接'],
        counts: { memories: 1, index: 2, history: 1 },
      },
      {
        seq: 2,
        time: 2_000,
        kind: 'promotion',
        record: 'promotion',
        title: 'promotion',
        detail: '{"records":[]}',
        lines: ['project / tone → memory-2 (2 episodes)'],
      },
    ]
    const flow = { getSnapshot: () => rows, subscribe: () => () => {} }
    const t = makeTranslate(en)
    const { rerender } = render(<MemoryView flow={flow} t={t} />)
    expect(screen.getByText('Memory snapshot')).toBeTruthy()
    expect(screen.getAllByText('Promotion').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('1 memory')).toBeTruthy()
    expect(screen.getByText('2 indexed episodes')).toBeTruthy()
    expect(screen.getByText('1 history entry')).toBeTruthy()
    expect(screen.getAllByText('Raw event')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Calls' }))
    expect(screen.getByText(en['summary.empty'])).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Memory snapshot')).toBeTruthy()

    const empty: readonly never[] = []
    rerender(<MemoryView flow={{ getSnapshot: () => empty, subscribe: () => () => {} }} t={t} />)
    expect(screen.getByText(en.empty)).toBeTruthy()
  })

  it('renders a withdrawn snapshot, a plain call, and filters by kind', () => {
    const rows: MemoryFlowItem[] = [
      {
        seq: 1,
        time: 1_000,
        kind: 'snapshot',
        record: 'withdrawn',
        title: 'Saved memories: no memory is shown for this turn.',
        detail: 'raw',
        lines: [],
      },
      {
        seq: 2,
        time: 2_000,
        kind: 'snapshot',
        record: 'snapshot',
        title: 'Memory: 1.0/4.0 KB.',
        detail: 'raw',
        lines: ['- memory-1'],
        counts: { memories: 2, index: 1, history: 2 },
      },
      {
        seq: 3,
        time: 3_000,
        kind: 'call',
        title: 'memory_search',
        detail: '{"query":"tone"}',
        lines: ['query: tone'],
      },
      {
        seq: 4,
        time: 4_000,
        kind: 'result',
        title: 'memory_search',
        detail: 'ok',
        lines: ['ok'],
      },
    ]
    const t = makeTranslate(en)
    render(<MemoryView flow={{ getSnapshot: () => rows, subscribe: () => () => {} }} t={t} />)
    expect(screen.getByText('Memory withdrawn')).toBeTruthy()
    expect(screen.getByText(en['withdrawn.hint'])).toBeTruthy()
    expect(screen.getByText('2 memories')).toBeTruthy()
    expect(screen.getByText('1 indexed episode')).toBeTruthy()
    expect(screen.getByText('2 history entries')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Calls' }))
    expect(screen.getAllByText('memory_search').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Memory withdrawn')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Snapshots' }))
    expect(screen.getByText('Memory withdrawn')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Promotion' }))
    expect(screen.getByText(en['summary.empty'])).toBeTruthy()
  })
})
