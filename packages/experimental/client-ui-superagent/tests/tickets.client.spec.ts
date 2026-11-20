/** Host ticket reads publish one observable state, follow the live stream, and carry the person's actions. */
import { describe, expect, it, vi } from 'vitest'
import { RemoteError } from '@tomato/typert-protocol'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { SubmitResult, TicketDetail, TicketSummary } from '@tomato/superagent-runtime/types'
import { createTicketController } from '../src/client/tickets.ts'
import type { TicketList, TicketRow, TicketsRemote } from '../src/client/tickets.ts'

function row(id: string): TicketRow {
  return {
    id, subject: '加 tier 字段', stage: 'person', needs: 'review',
    state: 'ready', blocking: 0, rounds: 1, running: false, stopped: false,
  }
}

function success(rows: TicketList) {
  return vi.fn((_signal?: AbortSignal): Promise<RemoteResult<TicketList>> =>
    Promise.resolve({ ok: true, value: rows }))
}

/** A Remote namespace whose stream the test drives by hand. */
function fakeRemote(list = success([row('ticket-1')])): {
  remote: TicketsRemote
  list: typeof list
  push: (rows: TicketList) => void
  end: () => void
  fail: (error: Error) => void
} {
  const queue: TicketList[] = [[row('ticket-1')]]
  let done = false
  let failure: Error | undefined
  let wake: (() => void) | undefined
  const notify = (): void => { wake?.() }
  const stream = {
    [Symbol.asyncIterator]: () => ({
      next: async () => {
        while (queue.length === 0 && !done && failure === undefined) {
          await new Promise<void>((resolve) => { wake = resolve })
        }
        if (failure !== undefined) throw failure
        const value = queue.shift()
        return value === undefined ? { done: true as const, value: undefined } : { done: false as const, value: { tickets: value } }
      },
    }),
    send: vi.fn(),
    end: vi.fn(),
    dispose: vi.fn(),
  }
  const ok = <T>(value: T): Promise<RemoteResult<T>> => Promise.resolve({ ok: true, value })
  const remote = {
    list,
    watch: vi.fn(() => stream),
    submit: vi.fn((request: { text: string }): Promise<RemoteResult<SubmitResult>> =>
      ok({ kind: 'accepted', tickets: [row(`ticket-${request.text}`)] })),
    detail: vi.fn((_request: { ticket: string }): Promise<RemoteResult<TicketDetail>> => ok({
      summary: row('ticket-1'),
      mandate: { scope: 'change', strength: 'explicit', policyVersion: 'p1', sender: 'app-user', at: '2026-11-18T00:00:00.000Z' },
      assignments: [],
      triggers: [],
      ended: false,
    })),
    message: vi.fn((_request: { ticket: string; text: string }): Promise<RemoteResult<TicketSummary>> => ok(row('ticket-1'))),
    cancel: vi.fn((_request: { ticket: string }): Promise<RemoteResult<TicketSummary>> => ok(row('ticket-1'))),
    stop: vi.fn((_request: { ticket: string }): Promise<RemoteResult<TicketSummary>> => ok(row('ticket-1'))),
  } as unknown as TicketsRemote
  return {
    remote,
    list,
    push: (rows) => { queue.push(rows); notify() },
    end: () => { done = true; notify() },
    fail: (error) => { failure = error; notify() },
  }
}

describe('ticket Host reads', () => {
  it('starts loading, shares a concurrent read, and publishes returned rows', async () => {
    const pending = Promise.withResolvers<RemoteResult<TicketList>>()
    const read = vi.fn((_signal?: AbortSignal) => pending.promise)
    const { remote } = fakeRemote(read)
    const controller = createTicketController(remote)
    const listener = vi.fn()
    const stop = controller.source.subscribe(listener)
    expect(controller.source.getSnapshot()).toEqual({ status: 'loading', rows: [] })
    expect(read).not.toHaveBeenCalled()

    const first = controller.refresh()
    expect(controller.refresh()).toBe(first)
    expect(read).toHaveBeenCalledOnce()
    pending.resolve({ ok: true, value: [row('ticket-1')] })
    await first
    expect(controller.source.getSnapshot()).toEqual({ status: 'ready', rows: [row('ticket-1')] })
    expect(listener).toHaveBeenCalledOnce()
    stop()
    controller.dispose()
  })

  it('retains previous rows on a business or transport failure and recovers on retry', async () => {
    const read = success([row('ticket-1')])
    const { remote } = fakeRemote(read)
    const controller = createTicketController(remote)
    await controller.refresh()
    read.mockResolvedValueOnce({
      ok: false,
      error: new RemoteError('gateway/internal', 'offline', {}),
    })
    await controller.refresh()
    expect(controller.source.getSnapshot()).toEqual({ status: 'error', rows: [row('ticket-1')] })
    read.mockRejectedValueOnce(new Error('assembly missing'))
    await controller.refresh()
    expect(controller.source.getSnapshot().status).toBe('error')
    await controller.refresh()
    expect(controller.source.getSnapshot()).toEqual({ status: 'ready', rows: [row('ticket-1')] })
    controller.dispose()
  })

  it('ignores cancellation and late settlement after disposal', async () => {
    const cancelled = createTicketController(fakeRemote(vi.fn((_signal?: AbortSignal) => Promise.resolve({
      ok: false as const,
      error: new RemoteError('gateway/cancelled', 'cancelled', {}),
    }))).remote)
    await cancelled.refresh()
    expect(cancelled.source.getSnapshot().status).toBe('loading')
    cancelled.dispose()

    const pending = Promise.withResolvers<RemoteResult<TicketList>>()
    const { remote } = fakeRemote(vi.fn((signal?: AbortSignal) => {
      expect(signal?.aborted).toBe(false)
      return pending.promise
    }))
    const controller = createTicketController(remote)
    const reading = controller.refresh()
    controller.dispose()
    expect(controller.source.getSnapshot().status).toBe('loading')
    await controller.refresh()
    pending.resolve({ ok: true, value: [row('late')] })
    await reading
    expect(controller.source.getSnapshot()).toEqual({ status: 'loading', rows: [] })
  })
})

describe('ticket live stream', () => {
  it('publishes each frame and keeps the last rows when the stream drops', async () => {
    const { remote, push, fail } = fakeRemote()
    const controller = createTicketController(remote)
    controller.watch()
    controller.watch()
    await vi.waitFor(() => {
      expect(controller.source.getSnapshot()).toEqual({ status: 'ready', rows: [row('ticket-1')] })
    })
    push([row('ticket-1'), row('ticket-2')])
    await vi.waitFor(() => {
      expect(controller.source.getSnapshot().rows).toHaveLength(2)
    })
    fail(new Error('stream dropped'))
    await vi.waitFor(() => {
      expect(controller.source.getSnapshot()).toEqual({ status: 'error', rows: [row('ticket-1'), row('ticket-2')] })
    })
    controller.dispose()
  })

  it('stops following the stream after disposal', async () => {
    const { remote, push } = fakeRemote()
    const controller = createTicketController(remote)
    controller.watch()
    await vi.waitFor(() => { expect(controller.source.getSnapshot().status).toBe('ready') })
    controller.dispose()
    push([row('late')])
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(controller.source.getSnapshot().rows).toEqual([row('ticket-1')])
  })
})

describe('ticket person actions', () => {
  it('submits, messages, cancels, and stops through the Remote, refreshing after each success', async () => {
    const { remote, list } = fakeRemote()
    const controller = createTicketController(remote)
    const submitted = await controller.actions.submit('加 tier 字段')
    expect(submitted.ok).toBe(true)
    expect(remote.submit).toHaveBeenCalledWith({ text: '加 tier 字段' })
    const messaged = await controller.actions.message('ticket-1', '用蓝色')
    expect(messaged.ok).toBe(true)
    expect(remote.message).toHaveBeenCalledWith({ ticket: 'ticket-1', text: '用蓝色' })
    const cancelled = await controller.actions.cancel('ticket-1')
    expect(cancelled.ok).toBe(true)
    const stopped = await controller.actions.stop('ticket-1')
    expect(stopped.ok).toBe(true)
    const detail = await controller.actions.detail('ticket-1')
    expect(detail.ok).toBe(true)
    // Each mutation refreshed the list; the detail read did not.
    expect(list).toHaveBeenCalledTimes(4)
    controller.dispose()
  })

  it('returns a business failure without refreshing', async () => {
    const { remote, list } = fakeRemote()
    const refusal = { ok: false as const, error: new RemoteError('superagent/not-running', 'no run', { id: 'ticket-1' }) }
    vi.mocked(remote.cancel).mockResolvedValueOnce(refusal)
    const controller = createTicketController(remote)
    const result = await controller.actions.cancel('ticket-1')
    expect(result).toBe(refusal)
    expect(list).not.toHaveBeenCalled()
    controller.dispose()
  })
})
