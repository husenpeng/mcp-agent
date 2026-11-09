import { describe, expect, it } from 'vitest'
import type { TrajectoryTurnModel } from '../src/client/layout.ts'
import type { TrajectoryCellProps } from '../src/client/trajectory-record.ts'
import {
  cellTokenCost,
  classifyToolOrigin,
  compactTokenCount,
  deriveTraceOverview,
  emptyTraceTokens,
  formatTraceDuration,
  formatTraceTotals,
  traceOriginLabel,
  traceTurnAtRecordIndex,
  type TraceSummary,
} from '../src/client/trace-overview.ts'
import { t } from './locale.client.ts'

function cell(overrides: Partial<TrajectoryCellProps> & Pick<TrajectoryCellProps, 'index' | 'kind' | 'text'>): TrajectoryCellProps {
  return { timeSeconds: 0, ...overrides }
}

function turn(turnNumber: number | null, cells: TrajectoryCellProps[]): TrajectoryTurnModel {
  return { turn: turnNumber, groups: [{ title: 'Step 1', cells }] }
}

const userCell = cell({ index: 1, kind: 'user', text: '  帮我找美妆达人 ', opensTurn: true, timeSeconds: 0, startedAt: 100 })
const messageCell = cell({
  index: 2,
  kind: 'message',
  text: '好的',
  timeSeconds: 4,
  startedAt: 1_000,
  input: 100,
  cacheRead: 50,
  cacheWrite: 10,
  output: 20,
  think: 5,
  assistantMetrics: {
    timingRecorded: true,
    stepStartTime: 1_000,
    firstTokenTime: 1_500,
    completedTime: 5_000,
    usageProvided: true,
    outputTokens: 20,
  },
})

function completedTurn(): TrajectoryTurnModel {
  return turn(3, [
    userCell,
    messageCell,
    cell({ index: 3, kind: 'tool', text: 'bash · ls', toolName: 'bash', timeSeconds: 0.5, startedAt: 5_000, outputDetail: 'listing' }),
    cell({ index: 4, kind: 'tool', text: 'mcp__playwright__click · {}', toolName: 'mcp__playwright__click', timeSeconds: 0.25, startedAt: 5_500, outputDetail: 'ok' }),
    cell({ index: 5, kind: 'subtool', text: 'run_code · print', toolName: 'run_code', timeSeconds: 0.5, startedAt: 5_400, outputDetail: 'done' }),
  ])
}

describe('deriveTraceOverview', () => {
  it('returns empty totals without turns', () => {
    expect(deriveTraceOverview([])).toEqual({
      traces: [],
      totals: { traces: 0, steps: 0, calls: 0, errors: 0, tokens: emptyTraceTokens(), durationMs: null },
    })
  })

  it('folds one trace per turn with prompt, chain, tools, and token cost', () => {
    const overview = deriveTraceOverview([completedTurn()])
    expect(overview.traces).toHaveLength(1)
    const trace = overview.traces[0] as TraceSummary
    expect(trace).toMatchObject({
      turn: 3,
      anchorIndex: 1,
      prompt: '帮我找美妆达人',
      status: 'completed',
      steps: 1,
      calls: 3,
      errors: 0,
      durationMs: 5_800,
      tokens: {
        input: 100,
        cacheRead: 50,
        cacheWrite: 10,
        output: 20,
        reasoning: 5,
        total: 180,
      },
      chain: [{ kind: 'llm' }, { kind: 'tool' }, { kind: 'tool' }, { kind: 'subtool' }],
      tools: [
        { name: 'bash', origin: 'builtin', count: 1 },
        { name: 'mcp__playwright__click', origin: 'mcp', count: 1 },
        { name: 'run_code', origin: 'ptc', count: 1 },
      ],
    })
    expect(overview.totals).toMatchObject({
      traces: 1,
      steps: 1,
      calls: 3,
      errors: 0,
      durationMs: 5_800,
      tokens: { total: 180 },
    })
  })

  it('reads the prompt preview from the Markdown source and caps its length', () => {
    const markdownPrompt = turn(1, [
      cell({ index: 1, kind: 'user', text: '', previewMarkdown: '  第一行\n\n第二行  ' }),
    ])
    expect(deriveTraceOverview([markdownPrompt]).traces[0]?.prompt).toBe('第一行 第二行')

    const longPrompt = turn(2, [
      cell({ index: 2, kind: 'user', text: 'x'.repeat(400) }),
    ])
    const prompt = deriveTraceOverview([longPrompt]).traces[0]?.prompt ?? ''
    expect(prompt).toHaveLength(240)
    expect(prompt.endsWith('…')).toBe(true)
  })

  it('counts repeated tools and orders them by count then name', () => {
    const repeated = turn(1, [
      cell({ index: 1, kind: 'tool', text: 'bash · a', toolName: 'bash', outputDetail: 'ok' }),
      cell({ index: 2, kind: 'tool', text: 'bash · b', toolName: 'bash', outputDetail: 'ok' }),
      cell({ index: 3, kind: 'tool', text: 'read · c', toolName: 'read', outputDetail: 'ok' }),
      cell({ index: 4, kind: 'tool', text: 'an unnamed tool', outputDetail: 'ok' }),
    ])
    expect(deriveTraceOverview([repeated]).traces[0]?.tools).toEqual([
      { name: 'bash', origin: 'builtin', count: 2 },
      { name: 'read', origin: 'builtin', count: 1 },
    ])
  })

  it('keeps a trace running while a record is in flight and reports no duration', () => {
    const streaming = turn(1, [
      userCell,
      cell({
        index: 2,
        kind: 'message',
        text: '',
        timeSeconds: null,
        assistantMetrics: {
          timingRecorded: true,
          stepStartTime: 1_000,
          firstTokenTime: null,
          completedTime: null,
          usageProvided: false,
          outputTokens: null,
        },
      }),
    ])
    expect(deriveTraceOverview([streaming]).traces[0]).toMatchObject({
      status: 'running',
      durationMs: null,
      errors: 0,
    })

    const pendingTool = turn(2, [
      cell({ index: 4, kind: 'tool', text: 'bash · sleep', toolName: 'bash', timeSeconds: null, startedAt: 2_000 }),
    ])
    expect(deriveTraceOverview([pendingTool]).traces[0]).toMatchObject({
      status: 'running',
      durationMs: null,
      calls: 1,
    })

    const pendingCompaction = turn(3, [
      cell({ index: 5, kind: 'compacted', text: 'compacting…', timeSeconds: null, startedAt: 2_000 }),
    ])
    expect(deriveTraceOverview([pendingCompaction]).traces[0]?.status).toBe('running')
  })

  it('marks a settled trace with an error as failed', () => {
    const failed = turn(1, [
      userCell,
      messageCell,
      cell({ index: 9, kind: 'tool', text: 'bash · false', toolName: 'bash', isError: true, outputDetail: 'boom' }),
    ])
    expect(deriveTraceOverview([failed]).traces[0]).toMatchObject({
      status: 'failed',
      errors: 1,
      durationMs: 4_900,
    })
  })

  it('treats an empty turn as running and skips turns between prompts', () => {
    const between = turn(null, [
      cell({ index: 7, kind: 'compacted', text: 'compact', timeSeconds: 1, startedAt: 1_000 }),
    ])
    const empty = turn(2, [])
    const overview = deriveTraceOverview([between, empty])
    expect(overview.traces).toHaveLength(1)
    expect(overview.traces[0]).toMatchObject({
      turn: 2,
      anchorIndex: 0,
      prompt: '',
      status: 'running',
      durationMs: null,
      steps: 0,
      calls: 0,
    })
  })

  it('treats a turn holding only its prompt as running', () => {
    const waiting = turn(6, [userCell])
    expect(deriveTraceOverview([waiting]).traces[0]).toMatchObject({
      status: 'running',
      durationMs: null,
    })
  })

  it('treats a running request-only record as pending', () => {
    const requested = turn(7, [
      userCell,
      cell({
        index: 8,
        kind: 'message',
        text: '',
        requestOnly: true,
        timeSeconds: null,
        startedAt: 1_000,
      }),
    ])
    expect(deriveTraceOverview([requested]).traces[0]?.status).toBe('running')
  })

  it('anchors a trace at its first loaded record when no prompt is loaded', () => {
    const anchored = turn(4, [
      cell({ index: 12, kind: 'system', text: 'system prompt' }),
      cell({ index: 13, kind: 'compacted', text: 'compact', timeSeconds: 1, startedAt: 1_000 }),
    ])
    expect(deriveTraceOverview([anchored]).traces[0]).toMatchObject({
      anchorIndex: 13,
      prompt: '',
      status: 'completed',
      durationMs: 1_000,
    })
  })

  it('anchors a completely empty turn at index zero', () => {
    expect(deriveTraceOverview([turn(5, [])]).traces[0]?.anchorIndex).toBe(0)
  })
})

describe('traceTurnAtRecordIndex', () => {
  const traces = deriveTraceOverview([
    turn(1, [cell({ index: 1, kind: 'user', text: 'a' })]),
    turn(2, [cell({ index: 5, kind: 'user', text: 'b' })]),
  ]).traces

  it('finds the owning trace by anchor', () => {
    expect(traceTurnAtRecordIndex(traces, 1)).toBe(1)
    expect(traceTurnAtRecordIndex(traces, 4)).toBe(1)
    expect(traceTurnAtRecordIndex(traces, 5)).toBe(2)
  })

  it('returns null without an index or before the first anchor', () => {
    expect(traceTurnAtRecordIndex(traces, null)).toBeNull()
    expect(traceTurnAtRecordIndex(traces, 0)).toBeNull()
  })
})

describe('compactTokenCount', () => {
  it('formats counts with compact units', () => {
    expect(compactTokenCount(0)).toBe('0')
    expect(compactTokenCount(-1)).toBe('0')
    expect(compactTokenCount(Number.NaN)).toBe('0')
    expect(compactTokenCount(999)).toBe('999')
    expect(compactTokenCount(1_000)).toBe('1k')
    expect(compactTokenCount(1_234)).toBe('1.2k')
    expect(compactTokenCount(12_400)).toBe('12.4k')
    expect(compactTokenCount(999_499)).toBe('999.5k')
    expect(compactTokenCount(999_999)).toBe('1M')
    expect(compactTokenCount(1_200_000)).toBe('1.2M')
  })
})

describe('formatTraceDuration', () => {
  it('uses milliseconds, seconds, and minutes by magnitude', () => {
    expect(formatTraceDuration(null, t)).toBe('—')
    expect(formatTraceDuration(Number.POSITIVE_INFINITY, t)).toBe('—')
    expect(formatTraceDuration(420, t)).toBe('420 ms')
    expect(formatTraceDuration(3_200, t)).toBe('3.2 s')
    expect(formatTraceDuration(60_000, t)).toBe('1 min')
    expect(formatTraceDuration(125_000, t)).toBe('2.1 min')
  })
})

describe('formatTraceTotals', () => {
  it('joins trace, step, call, token, and settled duration totals', () => {
    expect(formatTraceTotals({
      traces: 2,
      steps: 3,
      calls: 1,
      errors: 0,
      tokens: { ...emptyTraceTokens(), total: 12_400 },
      durationMs: 3_200,
    }, t)).toBe('2 traces · 3 steps · 1 tool call · 12.4k tok · 3.2 s')
  })

  it('omits duration until a trace settles and uses singular labels', () => {
    expect(formatTraceTotals({
      traces: 1,
      steps: 1,
      calls: 0,
      errors: 0,
      tokens: emptyTraceTokens(),
      durationMs: null,
    }, t)).toBe('1 trace · 1 step · 0 tool calls · 0 tok')
  })
})

describe('cellTokenCost', () => {
  it('returns no chip without usage and a compact total with usage', () => {
    expect(cellTokenCost(cell({ index: 1, kind: 'message', text: '' }))).toBeUndefined()
    expect(cellTokenCost(cell({ index: 2, kind: 'message', text: '', input: 0 }))).toBe('0')
    expect(cellTokenCost(cell({ index: 3, kind: 'message', text: '', input: 900, output: 300 }))).toBe('1.2k')
  })
})

describe('classifyToolOrigin', () => {
  it('resolves every documented tool family', () => {
    expect(classifyToolOrigin('mcp__playwright-mcp__browser_click')).toBe('mcp')
    expect(classifyToolOrigin('run_code')).toBe('ptc')
    expect(classifyToolOrigin('run_code_python')).toBe('ptc')
    expect(classifyToolOrigin('skill')).toBe('skill')
    expect(classifyToolOrigin('skill__office')).toBe('skill')
    expect(classifyToolOrigin('workflow')).toBe('workflow')
    expect(classifyToolOrigin('workflow_ptc')).toBe('workflow')
    expect(classifyToolOrigin('subagent')).toBe('subagent')
    expect(classifyToolOrigin('subagent_fork')).toBe('subagent')
    expect(classifyToolOrigin('send_message')).toBe('subagent')
    expect(classifyToolOrigin('interrupt_agent')).toBe('subagent')
    expect(classifyToolOrigin('wait_agent')).toBe('subagent')
    expect(classifyToolOrigin('list_agents')).toBe('subagent')
    expect(classifyToolOrigin('list_subagent_models')).toBe('subagent')
    expect(classifyToolOrigin('spawn_teammate')).toBe('subagent')
    expect(classifyToolOrigin('bash')).toBe('builtin')
  })

  it('localizes origin labels', () => {
    expect(traceOriginLabel('mcp', t)).toBe('MCP')
    expect(traceOriginLabel('builtin', t)).toBe('Built-in')
  })
})
