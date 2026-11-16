/** How one stored ticket reads to a watcher. */
import { describe, expect, it } from 'vitest'
import {
  InMemoryStore,
  accept,
  assign,
  recordReview,
  report,
} from '@tomato/superagent'
import type { ActorId, MandateId, TicketId } from '@tomato/superagent'
import { ticketSummary } from '../src/index.ts'

/** One accepted ticket whose work has already run. */
function ticketOf(review?: { severity: 'p0' | 'p1'; summary: string }): ReturnType<typeof accept> {
  const store = new InMemoryStore()
  const ticket = accept(store, {
    id: 'ticket-1' as TicketId,
    subject: '给达人详情页加 tier 字段',
    supervisor: 'supervisor-session',
    thread: { source: 'feishu', id: 'oc_1:om_root' },
    mandate: {
      id: 'mandate-1' as MandateId,
      policyVersion: 'p1',
      scope: 'change',
      strength: 'explicit',
      matchedRules: ['feishu:mention'],
      sender: 'ou_1' as ActorId,
      thread: { source: 'feishu', id: 'oc_1:om_root' },
      at: '2026-11-14T00:00:00.000Z',
    },
  })
  const assignment = assign(store, ticket.id, { session: 'worker-1', directory: '/work/one' })
  report(store, ticket.id, assignment.id, { state: 'ready', summary: 'PR open' })
  if (review !== undefined) {
    recordReview(store, ticket.id, {
      findings: [{ severity: review.severity, summary: review.summary, file: 'a.ts' }],
      rounds: 1,
    })
  }
  return store.ticket(ticket.id)?.ticket as ReturnType<typeof accept>
}

/** One accepted ticket nobody has worked on yet. */
function unworked(): ReturnType<typeof accept> {
  const store = new InMemoryStore()
  const ticket = accept(store, {
    id: 'ticket-2' as TicketId,
    subject: '查一下客户端要不要跟着改',
    supervisor: 'supervisor-session',
    thread: { source: 'feishu', id: 'oc_1:om_root' },
    mandate: {
      id: 'mandate-2' as MandateId,
      policyVersion: 'p1',
      scope: 'investigate',
      strength: 'explicit',
      matchedRules: ['feishu:mention'],
      sender: 'ou_1' as ActorId,
      thread: { source: 'feishu', id: 'oc_1:om_root' },
      at: '2026-11-14T00:00:00.000Z',
    },
  })
  return store.ticket(ticket.id)?.ticket as ReturnType<typeof accept>
}

describe('ticket summary', () => {
  it('reads a ticket nobody has worked on yet as open work with no run state', () => {
    expect(ticketSummary(unworked())).toEqual({
      id: 'ticket-2', subject: '查一下客户端要不要跟着改', stage: 'working', blocking: 0, rounds: 0,
    })
  })

  it('reads a reviewed ticket as work waiting on a person', () => {
    expect(ticketSummary(ticketOf({ severity: 'p1', summary: 'naming' }))).toEqual({
      id: 'ticket-1', subject: '给达人详情页加 tier 字段', stage: 'person', needs: 'review',
      state: 'ready', blocking: 0, rounds: 1,
    })
  })

  it('reads work nobody reviewed yet as still in progress', () => {
    expect(ticketSummary(ticketOf())).toMatchObject({ stage: 'working', rounds: 0 })
  })

  it('counts a blocking finding and leaves the work with the implementer', () => {
    expect(ticketSummary(ticketOf({ severity: 'p0', summary: 'breaks the detail page' }))).toMatchObject({
      stage: 'working', blocking: 1,
    })

  })
})
