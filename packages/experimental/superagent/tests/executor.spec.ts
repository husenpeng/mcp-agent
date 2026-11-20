/** Running one ticket: lease, record, drive, report — including a run that throws. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import {
  InMemoryStore,
  SuperagentError,
  accept,
  assign,
  briefFor,
  createTicketSessionAccess,
  parseReport,
  openAssignment,
  recordReview,
  report,
  runAssignment,
  runReview,
  ticketStage,
} from '@tomato/superagent'
import type {
  ActorId,
  AssignmentReport,
  Mandate,
  MandateId,
  TicketId,
  Worker,
  ReviewVerdict,
  WorkerBrief,
  WorkerLease,
} from '@tomato/superagent'

const MANDATE: Mandate = {
  id: brandString<MandateId>('mandate-1'),
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: ['feishu:mention'],
  sender: brandString<ActorId>('ou_1'),
  thread: { source: 'feishu', id: 'oc_1:om_root' },
  at: '2026-11-14T00:00:00.000Z',
}

/** One accepted ticket in a fresh store. */
function accepted(store: InMemoryStore): TicketId {
  const ticket = accept(store, {
    id: brandString<TicketId>('ticket-1'),
    subject: '给达人详情页加 tier 字段',
    mandate: MANDATE,
    thread: { source: 'feishu', id: 'oc_1:om_root' },
    supervisor: 'supervisor-session',
  })
  return ticket.id
}

/** A worker whose run answers with a fixed report, or throws. */
function worker(answer: (brief: WorkerBrief) => Promise<AssignmentReport>, seen: WorkerBrief[] = []): Worker {
  return {
    lease: async (brief): Promise<WorkerLease> => {
      seen.push(brief)
      return { session: 'worker-ticket-1', directory: '/work/ticket-1', run: answer, cancel: () => {} }
    },
  }
}

describe('running an assignment', () => {
  it('leases a run, records it, and hands a ready result to a person', async () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const seen: WorkerBrief[] = []
    const ticket = (await runAssignment(store, ticketId, worker(async () => ({ state: 'ready', summary: 'PR open' }), seen))).ticket
    expect(seen[0]).toMatchObject({ ticket: ticketId, subject: '给达人详情页加 tier 字段' })
    expect(ticket.assignments).toHaveLength(1)
    expect(ticket.assignments[0]).toMatchObject({ session: 'worker-ticket-1', directory: '/work/ticket-1', ended: true })
    expect(ticketStage(ticket)).toEqual({ stage: 'working' })
    expect(ticketStage(recordReview(store, ticketId, { findings: [], rounds: 0 })))
      .toEqual({ stage: 'person', action: 'review' })
    expect(openAssignment(ticket)).toBeUndefined()
  })

  it('keeps the slot while the run reports progress, then frees it after a second run', async () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const running = (await runAssignment(store, ticketId, worker(async () => ({ state: 'progress' })))).ticket
    const live = openAssignment(running)
    expect(live).toMatchObject({ session: 'worker-ticket-1' })
    // A ticket whose run is still live refuses a second one.
    await expect(runAssignment(store, ticketId, worker(async () => ({ state: 'ready' }))))
      .rejects.toThrow(expect.objectContaining({ code: 'not-startable' }))
    // The live run settles itself later, which frees the slot for the next attempt.
    report(store, ticketId, live?.id ?? running.assignments[0]?.id as never, { state: 'ready' })
    const next = (await runAssignment(store, ticketId, worker(async () => ({ state: 'ready' })))).ticket
    expect(next.assignments).toHaveLength(2)
  })

  it('reports a throwing run as failed instead of letting it escape', async () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const ticket = (await runAssignment(store, ticketId, worker(async () => {
      throw new Error('worktree is locked')
    }))).ticket
    expect(openAssignment(ticket)).toBeUndefined()
    expect(ticket.assignments[0]).toMatchObject({ ended: true, report: { state: 'failed', summary: 'worktree is locked' } })
    expect(ticketStage(ticket)).toEqual({ stage: 'person', action: 'failed' })
  })

  it('reports a run that throws a non-Error value', async () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const ticket = (await runAssignment(store, ticketId, worker(async () => {
      throw 'disk full'
    }))).ticket
    expect(ticket.assignments[0]?.report).toEqual({ state: 'failed', summary: 'disk full' })
  })

  it('refuses an unknown ticket and one that ended', async () => {
    const store = new InMemoryStore()
    await expect(runAssignment(store, brandString<TicketId>('ticket-missing'), worker(async () => ({ state: 'ready' }))))
      .rejects.toThrow(SuperagentError)
  })
})

describe('brief', () => {
  it('carries the work and the mandate that authorizes it', () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const entry = store.ticket(ticketId)
    if (entry === undefined) throw new Error('expected a stored ticket')
    expect(briefFor(entry.ticket)).toEqual({
      ticket: ticketId,
      subject: '给达人详情页加 tier 字段',
      mandate: MANDATE,
    })
  })
})

describe('a worker that reports in text', () => {
  it('turns the report line of a finished turn into the ticket state', async () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const ticket = (await runAssignment(store, ticketId, worker(async () => parseReport(
      'Changed both repositories.\n\nREPORT: ready - PRs opened and linked',
    ).report))).ticket
    expect(ticket.assignments[0]?.report).toEqual({ state: 'ready', summary: 'PRs opened and linked' })
    // Ready still waits for the internal review before a person sees it.
    expect(ticketStage(ticket)).toEqual({ stage: 'working' })

    // A turn that ends without a marker yields instead of claiming a result.
    const quiet = new InMemoryStore()
    const quietTicket = (await runAssignment(quiet, accepted(quiet), worker(async () => parseReport('still reading').report))).ticket
    expect(quietTicket.assignments[0]?.report).toEqual({ state: 'waiting' })
    expect(ticketStage(quietTicket)).toEqual({ stage: 'idle' })
  })
})

describe('reviewing a ready result', () => {
  /** One ticket that already ran and reported ready. */
  async function ready(store: InMemoryStore): Promise<TicketId> {
    const ticketId = accepted(store)
    await runAssignment(store, ticketId, worker(async () => ({ state: 'ready', summary: 'PR open' })))
    return ticketId
  }

  it('records a passing verdict and hands the work to a person', async () => {
    const store = new InMemoryStore()
    const ticketId = await ready(store)
    const seen: { ticket: TicketId; round: number }[] = []
    const { ticket, decision } = await runReview(store, ticketId, {
      review: async (brief) => {
        seen.push({ ticket: brief.ticket, round: brief.round })
        return { findings: [], rounds: brief.round + 1 }
      },
    })
    expect(seen).toEqual([{ ticket: ticketId, round: 0 }])
    expect(decision).toEqual({ decision: 'handoff' })
    expect(ticket.review).toMatchObject({ rounds: 1 })
    expect(ticketStage(ticket)).toEqual({ stage: 'person', action: 'review' })
  })

  it('sends a blocking finding back and counts the next round', async () => {
    const store = new InMemoryStore()
    const ticketId = await ready(store)
    const reviewer = {
      review: async (brief: { round: number }): Promise<ReviewVerdict> => ({
        findings: [{ summary: 'file too long', severity: 'p0' as const, file: 'a.ts' }],
        rounds: brief.round + 1,
      }),
    }
    const first = await runReview(store, ticketId, reviewer)
    expect(first.decision).toMatchObject({ decision: 'revise' })
    expect(ticketStage(first.ticket)).toEqual({ stage: 'working' })
  })

  it('refuses a ticket with no ready result, and an unknown one', async () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const reviewer = { review: async (): Promise<ReviewVerdict> => ({ findings: [], rounds: 1 }) }
    await expect(runReview(store, ticketId, reviewer))
      .rejects.toThrow(expect.objectContaining({ code: 'not-reviewable' }))
    await expect(runReview(store, brandString<TicketId>('ticket-missing'), reviewer))
      .rejects.toThrow(SuperagentError)
  })
})

describe('session access', () => {
  it('grants the supervisor a read of every session its ticket ran in, and nobody else', () => {
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    assign(store, ticketId, { session: 'worker-1', directory: '/work/one' })
    const access = createTicketSessionAccess(store)
    expect(access.allows('supervisor-session', 'worker-1')).toBe(true)
    expect(access.allows('supervisor-session', 'someone-else')).toBe(false)
    expect(access.allows('another-supervisor', 'worker-1')).toBe(false)
  })
})
