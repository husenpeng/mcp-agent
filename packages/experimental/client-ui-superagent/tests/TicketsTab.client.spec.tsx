// @vitest-environment jsdom
/** The panel presents Host read states, submits work, and lets a person step into one ticket's flow. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RemoteError } from '@tomato/typert-protocol'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { SubmitResult, TicketDetail } from '@tomato/superagent-runtime/types'
import { TicketsTab } from '../src/client/TicketsTab.tsx'
import type { TicketActions, TicketSnapshot } from '../src/client/tickets.ts'

afterEach(cleanup)

const ok = <T,>(value: T): Promise<RemoteResult<T>> => Promise.resolve({ ok: true, value })

function actions(overrides: Partial<TicketActions> = {}): TicketActions {
  return {
    submit: vi.fn((text: string) => ok<SubmitResult>({ kind: 'accepted', tickets: [{ ...row('ticket-1'), subject: text }] })),
    detail: vi.fn(() => ok(detail())),
    message: vi.fn(() => ok(row('ticket-1'))),
    cancel: vi.fn(() => ok(row('ticket-1'))),
    stop: vi.fn(() => ok(row('ticket-1'))),
    ...overrides,
  }
}

function row(id: string) {
  return {
    id, subject: '加 tier 字段', stage: 'person' as const, needs: 'review' as const,
    state: 'ready' as const, blocking: 1, rounds: 2, running: false, stopped: false,
  }
}

function detail(): TicketDetail {
  return {
    summary: row('ticket-1'),
    mandate: { scope: 'change', strength: 'explicit', policyVersion: 'p1', sender: 'app-user', at: '2026-11-18T00:00:00.000Z' },
    assignments: [{
      id: 'assignment-1', session: 'superagent-worker-ticket-1', directory: '/work', ended: true,
      report: { state: 'ready', summary: 'PR opened', question: '用哪个颜色？' },
    }],
    review: { rounds: 2, findings: [{ severity: 'p0', file: 'a.ts', line: 12, summary: 'breaks the page' }] },
    triggers: [{ at: '2026-11-18T00:00:00.000Z', source: 'app', actor: 'app-user', text: '加 tier 字段' }],
    ended: false,
  }
}

function renderPanel(
  snapshot: TicketSnapshot,
  refresh = vi.fn(() => Promise.resolve()),
  ops: TicketActions = actions(),
) {
  render(
    <TicketsTab
      useTickets={selector => selector(snapshot)}
      refresh={refresh}
      actions={ops}
      t={((key: string) => key)}
    />,
  )
  return { refresh, ops }
}

const ready: TicketSnapshot = { status: 'ready', rows: [row('ticket-1')] }

describe('Team tickets panel', () => {
  it('renders ticket state and refreshes on request', () => {
    const { refresh } = renderPanel(ready)
    expect(screen.getByText('加 tier 字段')).toBeTruthy()
    expect(screen.getByText('stage.person · needs.review')).toBeTruthy()
    expect(screen.getByText(/row.blocking: 1/u)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('shows a labeled list skeleton on the first read', () => {
    renderPanel({ status: 'loading', rows: [] })
    expect(screen.getByRole('status', { name: 'loading' })).toBeTruthy()
  })

  it('retains rows on failure and offers retry', () => {
    const { refresh } = renderPanel({ ...ready, status: 'error' })
    expect(screen.getByText('加 tier 字段')).toBeTruthy()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'retry' }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('localizes ended tickets and delivery handoff', () => {
    renderPanel({
      status: 'ready',
      rows: [{ ...ready.rows[0]!, stage: 'ended', needs: 'delivery' }],
    })
    expect(screen.getByText('stage.ended · needs.delivery')).toBeTruthy()
  })

  it('distinguishes an empty result from a failed first read', () => {
    renderPanel({ status: 'ready', rows: [] })
    expect(screen.getByText('empty')).toBeTruthy()
    cleanup()
    renderPanel({ status: 'error', rows: [] })
    expect(screen.queryByText('empty')).toBeNull()
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})

describe('Team tickets composer', () => {
  it('submits the typed request and selects the opened ticket', async () => {
    const ops = actions()
    renderPanel({ status: 'ready', rows: [] }, vi.fn(() => Promise.resolve()), ops)
    fireEvent.change(screen.getByLabelText('composer.placeholder'), { target: { value: '加 tier 字段' } })
    fireEvent.click(screen.getByRole('button', { name: 'composer.submit' }))
    await waitFor(() => { expect(ops.submit).toHaveBeenCalledWith('加 tier 字段') })
    await waitFor(() => { expect(ops.detail).toHaveBeenCalledWith('ticket-1') })
  })

  it('keeps a declined request visible with its reason', async () => {
    const ops = actions({
      submit: vi.fn(() => ok<SubmitResult>({ kind: 'declined', reason: 'a person owns the release' })),
    })
    renderPanel({ status: 'ready', rows: [] }, vi.fn(() => Promise.resolve()), ops)
    fireEvent.change(screen.getByLabelText('composer.placeholder'), { target: { value: '发布到生产环境' } })
    fireEvent.click(screen.getByRole('button', { name: 'composer.submit' }))
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('notice.declined a person owns the release')
    })
  })

  it('surfaces a transport failure as a notice', async () => {
    const ops = actions({
      submit: vi.fn(() => Promise.resolve({ ok: false as const, error: new RemoteError('gateway/internal', 'offline', {}) })),
    })
    renderPanel({ status: 'ready', rows: [] }, vi.fn(() => Promise.resolve()), ops)
    fireEvent.change(screen.getByLabelText('composer.placeholder'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'composer.submit' }))
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('notice.failed offline')
    })
  })
})

describe('Team ticket flow', () => {
  it('opens the flow on selection: mandate, runs, review, and messages', async () => {
    const { ops } = renderPanel(ready)
    fireEvent.click(screen.getByRole('button', { name: /加 tier 字段/u }))
    await waitFor(() => { expect(ops.detail).toHaveBeenCalledWith('ticket-1') })
    await waitFor(() => { expect(screen.getByText('detail.mandate: scope.change · strength.explicit · p1 · app-user')).toBeTruthy() })
    expect(screen.getByText(/#1 superagent-worker-ticket-1 · state.ready/u)).toBeTruthy()
    expect(screen.getByText('PR opened')).toBeTruthy()
    expect(screen.getByText('detail.question: 用哪个颜色？')).toBeTruthy()
    expect(screen.getByText('P0 a.ts:12 breaks the page')).toBeTruthy()
    expect(screen.getByText('detail.review · row.rounds: 2')).toBeTruthy()
  })

  it('cancels a running ticket and stops an open one', async () => {
    const ops = actions()
    renderPanel({ status: 'ready', rows: [{ ...row('ticket-1'), running: true }] }, vi.fn(() => Promise.resolve()), ops)
    fireEvent.click(screen.getByRole('button', { name: /加 tier 字段/u }))
    await waitFor(() => { expect(screen.getByRole('button', { name: 'action.cancel' })).toBeTruthy() })
    fireEvent.click(screen.getByRole('button', { name: 'action.cancel' }))
    await waitFor(() => { expect(ops.cancel).toHaveBeenCalledWith('ticket-1') })
    fireEvent.click(screen.getByRole('button', { name: 'action.stop' }))
    await waitFor(() => { expect(ops.stop).toHaveBeenCalledWith('ticket-1') })
  })

  it('sends context to continue the work and hides actions on a stopped ticket', async () => {
    const ops = actions()
    renderPanel(ready, vi.fn(() => Promise.resolve()), ops)
    fireEvent.click(screen.getByRole('button', { name: /加 tier 字段/u }))
    await waitFor(() => { expect(screen.getByLabelText('action.messagePlaceholder')).toBeTruthy() })
    fireEvent.change(screen.getByLabelText('action.messagePlaceholder'), { target: { value: '用蓝色' } })
    fireEvent.click(screen.getByRole('button', { name: 'action.send' }))
    await waitFor(() => { expect(ops.message).toHaveBeenCalledWith('ticket-1', '用蓝色') })
    cleanup()
    renderPanel({ status: 'ready', rows: [{ ...row('ticket-1'), stopped: true }] }, vi.fn(() => Promise.resolve()), ops)
    fireEvent.click(screen.getByRole('button', { name: /加 tier 字段/u }))
    await waitFor(() => { expect(screen.getByText('stage.person · needs.review · row.stopped')).toBeTruthy() })
    expect(screen.queryByRole('button', { name: 'action.stop' })).toBeNull()
    expect(screen.queryByLabelText('action.messagePlaceholder')).toBeNull()
  })

  it('shows a detail read failure without losing the list', async () => {
    const ops = actions({
      detail: vi.fn(() => Promise.resolve({ ok: false as const, error: new RemoteError('superagent/not-found', 'gone', { id: 'ticket-1' }) })),
    })
    renderPanel(ready, vi.fn(() => Promise.resolve()), ops)
    fireEvent.click(screen.getByRole('button', { name: /加 tier 字段/u }))
    await waitFor(() => { expect(screen.getByText('detail.error')).toBeTruthy() })
    expect(screen.getByText('加 tier 字段')).toBeTruthy()
  })
})
