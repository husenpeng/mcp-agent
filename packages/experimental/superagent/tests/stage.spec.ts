/** Ticket stage derivation from the latest assignment report. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import { canStart, latestAssignment, ticketStage, waitsForPerson } from '@tomato/superagent'
import type { ActorId, Assignment, AssignmentId, Mandate, MandateId, ReviewVerdict, Ticket, TicketId } from '@tomato/superagent'

const MANDATE: Mandate = {
  id: brandString<MandateId>('mandate-1'),
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: ['small-local-change'],
  sender: brandString<ActorId>('ou_1'),
  thread: { source: 'feishu', id: 'oc_1:om_1' },
  at: '2026-11-14T00:00:00.000Z',
}

/** One assignment carrying the given report state. */
function assignment(id: string, report?: Assignment['report'], ended = false): Assignment {
  return {
    id: brandString<AssignmentId>(id),
    session: `worker-${id}`,
    directory: `/work/${id}`,
    ended,
    ...report === undefined ? {} : { report },
  }
}

/** One review verdict, passing unless it carries a blocking finding. */
function verdict(severity?: 'p0', rounds = 0): ReviewVerdict {
  return { findings: severity === undefined ? [] : [{ summary: 'too long', severity, file: 'a.ts' }], rounds }
}

/** One ticket whose assignments are given oldest first. */
function ticket(assignments: readonly Assignment[], overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: brandString<TicketId>('ticket-1'),
    subject: 'Add a tier field to the creator detail page',
    mandate: MANDATE,
    supervisor: 'supervisor-session',
    follows: [],
    stopped: false,
    ended: false,
    assignments,
    ...overrides,
  }
}

describe('ticket stages', () => {
  it('queues a ticket that never ran and idles one whose run ended without a question', () => {
    expect(ticketStage(ticket([]))).toEqual({ stage: 'working', action: 'queued' })
    expect(ticketStage(ticket([assignment('a1', undefined, true)]))).toEqual({ stage: 'idle' })
  })

  it('keeps a ready result out of a person hands until an independent review clears it', () => {
    const ready = ticket([assignment('a1', { state: 'ready', summary: 'PR open' }, true)])
    // Ready without a review means the reviewer has not read it yet.
    expect(ticketStage(ready)).toEqual({ stage: 'working' })
    expect(waitsForPerson(ready)).toBe(false)
    const cleared = { ...ready, review: verdict() }
    expect(ticketStage(cleared)).toEqual({ stage: 'person', action: 'review' })
    expect(waitsForPerson(cleared)).toBe(true)
  })

  it('sends a blocking finding back to the implementer until the round budget is spent', () => {
    const ready = ticket([assignment('a1', { state: 'ready' }, true)])
    expect(ticketStage({ ...ready, review: verdict('p0', 0) })).toEqual({ stage: 'working' })
    expect(ticketStage({ ...ready, review: verdict('p0', 3) })).toEqual({ stage: 'person', action: 'review' })
  })

  it('puts a structured question ahead of the report state it arrived with', () => {
    const asking = ticket([assignment('a1', { state: 'waiting', question: 'May I change the shared client?' }, true)])
    expect(ticketStage(asking)).toEqual({ stage: 'person', action: 'answer' })
    expect(waitsForPerson(asking)).toBe(true)
  })

  it('reports blocked and failed as their own person stages, but not after a stop', () => {
    expect(ticketStage(ticket([assignment('a1', { state: 'blocked' }, true)]))).toEqual({ stage: 'person', action: 'blocked' })
    expect(ticketStage(ticket([assignment('a1', { state: 'failed' }, true)]))).toEqual({ stage: 'person', action: 'failed' })
    expect(ticketStage(ticket([assignment('a1', { state: 'blocked' }, true)], { stopped: true }))).toEqual({ stage: 'idle' })
  })

  it('keeps working while a run is live and ends only when the ticket ended', () => {
    expect(ticketStage(ticket([assignment('a1', { state: 'progress' })]))).toEqual({ stage: 'working' })
    expect(ticketStage(ticket([assignment('a1', { state: 'ready' }, true)], { ended: true }))).toEqual({ stage: 'ended' })
    expect(waitsForPerson(ticket([assignment('a1', { state: 'ready' }, true)], { ended: true }))).toBe(false)
  })

  it('starts work only when no unfinished assignment holds the ticket and nobody stopped it', () => {
    expect(canStart(ticket([]))).toBe(true)
    expect(canStart(ticket([assignment('a1', undefined, true)]))).toBe(true)
    expect(canStart(ticket([assignment('a1', { state: 'progress' })]))).toBe(false)
    expect(canStart(ticket([], { stopped: true }))).toBe(false)
    expect(canStart(ticket([], { ended: true }))).toBe(false)
  })

  it('reads the newest assignment when a ticket ran more than once', () => {
    const twice = ticket([
      assignment('a1', { state: 'blocked' }, true),
      assignment('a2', { state: 'ready', summary: 'fixed' }, true),
    ])
    expect(latestAssignment(twice)?.id).toBe('a2')
    expect(ticketStage(twice)).toEqual({ stage: 'working' })
  })
})
