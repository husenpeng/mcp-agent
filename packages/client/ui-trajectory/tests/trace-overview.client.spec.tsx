// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { TrajectoryTraceOverview } from '../src/client/TrajectoryTraceOverview.tsx'
import {
  emptyTraceTokens, type TraceOverview, type TraceSummary,
} from '../src/client/trace-overview.ts'
import { t } from './locale.client.ts'

afterEach(cleanup)

function trace(overrides: Partial<TraceSummary> = {}): TraceSummary {
  return {
    turn: 1,
    anchorIndex: 1,
    prompt: '帮我找美妆达人',
    status: 'completed',
    steps: 2,
    calls: 3,
    errors: 0,
    durationMs: 3_200,
    tokens: { ...emptyTraceTokens(), input: 900, output: 300, total: 1_200 },
    tools: [
      { name: 'bash', origin: 'builtin', count: 2 },
      { name: 'mcp__playwright__click', origin: 'mcp', count: 1 },
    ],
    chain: [{ kind: 'llm' }, { kind: 'tool' }, { kind: 'llm' }],
    ...overrides,
  }
}

function overview(traces: readonly TraceSummary[]): TraceOverview {
  const tokens = traces.reduce((total, item) => total + item.tokens.total, 0)
  const durationMs = traces.reduce((total, item) => total + (item.durationMs ?? 0), 0)
  return {
    traces,
    totals: {
      traces: traces.length,
      steps: traces.reduce((total, item) => total + item.steps, 0),
      calls: traces.reduce((total, item) => total + item.calls, 0),
      errors: traces.reduce((total, item) => total + item.errors, 0),
      tokens: { ...emptyTraceTokens(), total: tokens },
      durationMs: durationMs === 0 ? null : durationMs,
    },
  }
}

describe('TrajectoryTraceOverview', () => {
  it('renders a card per trace with prompt, counts, cost, and duration', () => {
    render(
      <TrajectoryTraceOverview
        overview={overview([trace(), trace({ turn: 2, prompt: '第二轮', tokens: { ...emptyTraceTokens(), total: 500 } })])}
        activeTurn={1}
        onFocus={() => {}}
        t={t}
      />,
    )
    expect(screen.getByRole('region', { name: 'Traces' })).toBeTruthy()
    expect(screen.getByText('2 traces · 4 steps · 6 tool calls · 1.7k tok · 6.4 s')).toBeTruthy()
    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.getAttribute('aria-pressed')).toBe('true')
    expect(cards[1]?.getAttribute('aria-pressed')).toBe('false')
    expect(within(cards[0]).getByText('T1')).toBeTruthy()
    expect(within(cards[0]).getByText('帮我找美妆达人')).toBeTruthy()
    expect(within(cards[0]).getByText('2 steps · 3 tool calls')).toBeTruthy()
    expect(within(cards[0]).getByText('3.2 s')).toBeTruthy()
    expect(within(cards[0]).getByText('1.2k tok')).toBeTruthy()
    expect(within(cards[0]).getByText('bash ×2')).toBeTruthy()
    expect(within(cards[0]).getByText('MCP · mcp__playwright__click ×1')).toBeTruthy()
  })

  it('focuses a trace card on click', () => {
    const onFocus = vi.fn()
    render(
      <TrajectoryTraceOverview
        overview={overview([trace(), trace({ turn: 2 })])}
        activeTurn={null}
        onFocus={onFocus}
        t={t}
      />,
    )
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus.mock.calls[0]?.[0]).toMatchObject({ turn: 2, anchorIndex: 1 })
  })

  it('shows running and failed traces without invented duration', () => {
    render(
      <TrajectoryTraceOverview
        overview={overview([
          trace({ turn: 1, status: 'running', durationMs: null, prompt: '' }),
          trace({ turn: 2, status: 'failed', errors: 1, durationMs: null }),
        ])}
        activeTurn={2}
        onFocus={() => {}}
        t={t}
      />,
    )
    const cards = screen.getAllByRole('button')
    expect(cards[0]?.getAttribute('aria-label')).toContain('Running')
    expect(within(cards[0]).getByText('—')).toBeTruthy()
    expect(within(cards[0]).getByText('No content')).toBeTruthy()
    expect(cards[0]?.querySelector('[data-status="running"]')).toBeTruthy()
    expect(cards[1]?.getAttribute('aria-label')).toContain('Failed')
    expect(cards[1]?.querySelector('[data-status="failed"]')).toBeTruthy()
  })

  it('caps the tool chips and reports the hidden count', () => {
    const manyTools = trace({
      tools: [
        { name: 'a', origin: 'builtin', count: 1 },
        { name: 'b', origin: 'builtin', count: 1 },
        { name: 'c', origin: 'builtin', count: 1 },
        { name: 'd', origin: 'subagent', count: 1 },
        { name: 'e', origin: 'workflow', count: 1 },
      ],
    })
    render(
      <TrajectoryTraceOverview
        overview={overview([manyTools])}
        activeTurn={null}
        onFocus={() => {}}
        t={t}
      />,
    )
    const card = screen.getByRole('button')
    expect(within(card).getByText('+2')).toBeTruthy()
    expect(within(card).queryByText('d ×1')).toBeNull()
  })

  it('renders an empty state before the first prompt', () => {
    render(
      <TrajectoryTraceOverview
        overview={overview([])}
        activeTurn={null}
        onFocus={() => {}}
        t={t}
      />,
    )
    expect(screen.getByText('No traces yet')).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByRole('group')).toBeNull()
  })
})
