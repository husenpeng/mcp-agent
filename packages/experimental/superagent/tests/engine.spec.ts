/** Engine transitions over the in-memory store: intake, accept, assign, report, stop, end. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import {
  InMemoryStore,
  SuperagentError,
  accept,
  assign,
  end,
  intake,
  latestAssignment,
  recordReview,
  report,
  stop,
  threadKey,
  ticketStage,
} from '@tomato/superagent'
import type {
  ActorId,
  AssignmentId,
  Mandate,
  MandateId,
  ThreadRef,
  TicketId,
  Trigger,
  TriggerId,
} from '@tomato/superagent'

const THREAD: ThreadRef = { source: 'feishu', id: 'oc_1:om_1' }
const OTHER: ThreadRef = { source: 'github', id: 'pr-7' }

const MANDATE: Mandate = {
  id: brandString<MandateId>('mandate-1'),
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: [],
  sender: brandString<ActorId>('ou_1'),
  thread: THREAD,
  at: '2026-11-14T00:00:00.000Z',
}

/** One trigger on the given thread. */
function trigger(id: string, threads: readonly ThreadRef[] = [THREAD]): Trigger {
  return {
    id: brandString<TriggerId>(id),
    source: 'feishu',
    threads,
    actor: brandString<ActorId>('ou_1'),
    human: true,
    at: '2026-11-14T00:00:00.000Z',
    text: '给达人详情页加 tier 字段',
    meta: {},
  }
}

/** One accepted ticket on the default thread. */
function accepted(store: InMemoryStore, id = 'ticket-1') {
  return accept(store, {
    id: brandString<TicketId>(id),
    subject: 'Add a tier field',
    mandate: MANDATE,
    thread: THREAD,
    supervisor: 'supervisor-session',
  })
}

describe('intake', () => {
  it('stores a new trigger once and reaches the tickets subscribed to its threads', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    const first = intake(store, trigger('trig-1'))
    expect(first).toEqual({ outcome: 'stored', reached: [ticket.id] })
    expect(store.trigger(brandString<TriggerId>('trig-1'))?.text).toBe('给达人详情页加 tier 字段')
  })

  it('treats a repeated trigger id as the same event and reaches nobody twice', () => {
    const store = new InMemoryStore()
    accepted(store)
    intake(store, trigger('trig-1'))
    expect(intake(store, trigger('trig-1'))).toEqual({ outcome: 'duplicate', reached: [] })
  })

  it('reaches no ticket for a thread nobody subscribed to, or one that ended or stopped', () => {
    const store = new InMemoryStore()
    expect(intake(store, trigger('trig-lonely', [OTHER]))).toEqual({ outcome: 'stored', reached: [] })

    const ended = accepted(store, 'ticket-ended')
    end(store, ended.id)
    const stopped = accepted(store, 'ticket-stopped')
    stop(store, stopped.id)
    expect(intake(store, trigger('trig-2'))).toEqual({ outcome: 'stored', reached: [] })
  })

  it('reaches a ticket whose subscription matches any of the trigger threads', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    expect(intake(store, trigger('trig-3', [OTHER, THREAD]))).toEqual({ outcome: 'stored', reached: [ticket.id] })
  })
})

describe('assign and report', () => {
  it('starts one assignment and refuses a second while it runs', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    const assignment = assign(store, ticket.id, { session: 'worker-1', directory: '/work/ticket-1' })
    expect(assignment).toMatchObject({ session: 'worker-1', directory: '/work/ticket-1', ended: false })
    expect(ticketStage(store.ticket(ticket.id)?.ticket ?? ticket)).toEqual({ stage: 'working' })
    expect(() => assign(store, ticket.id, { session: 'worker-2', directory: '/work/b' }))
      .toThrow(expect.objectContaining({ code: 'not-startable' }))
  })

  it('refuses an unknown ticket', () => {
    const store = new InMemoryStore()
    const missing = brandString<TicketId>('ticket-missing')
    expect(() => assign(store, missing, { session: 'w', directory: '/w' })).toThrow(SuperagentError)
    expect(() => report(store, missing, 'assignment-1' as AssignmentId, { state: 'ready' }))
      .toThrow(expect.objectContaining({ code: 'unknown-ticket' }))
    expect(() => stop(store, missing)).toThrow(expect.objectContaining({ code: 'unknown-ticket' }))
    expect(() => end(store, missing)).toThrow(expect.objectContaining({ code: 'unknown-ticket' }))
  })

  it('records a ready report, ends the assignment, and hands the work to a person', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    const assignment = assign(store, ticket.id, { session: 'worker-1', directory: '/work/ticket-1' })
    const updated = report(store, ticket.id, assignment.id, { state: 'ready', summary: 'PR open' })
    expect(latestAssignment(updated)).toMatchObject({ ended: true, report: { state: 'ready' } })
    // The result waits for the internal review before a person sees it.
    expect(ticketStage(updated)).toEqual({ stage: 'working' })
    expect(ticketStage(recordReview(store, ticket.id, { findings: [], rounds: 0 })))
      .toEqual({ stage: 'person', action: 'review' })
    // The slot is free again, so a correction can run.
    expect(() => assign(store, ticket.id, { session: 'worker-2', directory: '/work/ticket-1' })).not.toThrow()
  })

  it('keeps the assignment running while it reports progress and frees it only on a settled state', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    const assignment = assign(store, ticket.id, { session: 'worker-1', directory: '/work/ticket-1' })
    const progress = report(store, ticket.id, assignment.id, { state: 'progress' })
    expect(latestAssignment(progress)?.ended).toBe(false)
    // A turn that yielded releases the slot, so a later message can start the next run.
    expect(latestAssignment(report(store, ticket.id, assignment.id, { state: 'waiting' }))?.ended).toBe(true)
    expect(latestAssignment(report(store, ticket.id, assignment.id, { state: 'dropped' }))?.ended).toBe(true)

    // Blocked and failed also hand the work back, so they end the run too.
    const second = assign(store, ticket.id, { session: 'worker-3', directory: '/work/ticket-1' })
    const blocked = report(store, ticket.id, second.id, { state: 'blocked' })
    expect(ticketStage(blocked)).toEqual({ stage: 'person', action: 'blocked' })
    const third = assign(store, ticket.id, { session: 'worker-4', directory: '/work/ticket-1' })
    expect(ticketStage(report(store, ticket.id, third.id, { state: 'failed' })))
      .toEqual({ stage: 'person', action: 'failed' })
  })

  it('raises the question ahead of the report state and refuses a stale assignment id', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    const assignment = assign(store, ticket.id, { session: 'worker-1', directory: '/work/ticket-1' })
    const asking = report(store, ticket.id, assignment.id, { state: 'waiting', question: '改共享客户端可以吗？' })
    expect(ticketStage(asking)).toEqual({ stage: 'person', action: 'answer' })
    expect(() => report(store, ticket.id, 'assignment-9' as AssignmentId, { state: 'ready' }))
      .toThrow(expect.objectContaining({ code: 'unknown-assignment' }))
    const blank = accepted(store, 'ticket-blank')
    expect(() => report(store, blank.id, 'assignment-1' as AssignmentId, { state: 'ready' }))
      .toThrow(expect.objectContaining({ code: 'unknown-assignment' }))
  })

  it('stops and ends a ticket, which removes it from intake and from starting work', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    expect(stop(store, ticket.id).stopped).toBe(true)
    expect(end(store, ticket.id).ended).toBe(true)
    expect(store.ticket(ticket.id)).toMatchObject({ ticket: { stopped: true, ended: true } })
  })
})

describe('store', () => {
  it('keys a thread by source and id so two sources cannot collide', () => {
    expect(threadKey({ source: 'feishu', id: 'oc_1' })).not.toBe(threadKey({ source: 'github', id: 'oc_1' }))
    expect(threadKey(THREAD)).toBe(threadKey({ source: 'feishu', id: 'oc_1:om_1' }))
  })

  it('lists stored tickets and keeps the first write of one trigger', () => {
    const store = new InMemoryStore()
    const ticket = accepted(store)
    expect(store.tickets().map(entry => entry.ticket.id)).toEqual([ticket.id])
    store.putTrigger(trigger('trig-1'))
    store.putTrigger({ ...trigger('trig-1'), text: 'second write' })
    expect(store.trigger(brandString<TriggerId>('trig-1'))?.text).toBe('给达人详情页加 tier 字段')
  })
})
