/**
 * One ticket's whole life: a person asks in a topic, the supervisor admits it,
 * an executor runs it, a reviewer reads it, the merge gate judges the result,
 * and a follow-up in the same topic continues the same work.
 */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import {
  InMemoryStore,
  mergeReadiness,
  report,
  runAssignment,
  runCycle,
  runReview,
  stop,
  ticketStage,
} from '@tomato/superagent'
import type {
  BotEvent,
  BotGateway,
  BotThread,
  MandateId,
  Policy,
  ReviewVerdict,
  TicketId,
  Worker,
  WorkerLease,
} from '@tomato/superagent'

const POLICY: Policy = { version: 'p1', sources: [{ source: 'feishu', allowedActors: ['ou_1'] }] }

/** A bot service whose page the test rewrites between cycles. */
class ChangingGateway implements BotGateway {
  page: { items: readonly BotEvent[]; nextCursor: number } = { items: [], nextCursor: 0 }

  async events(): Promise<{ items: readonly BotEvent[]; nextCursor: number }> {
    return this.page
  }

  async thread(): Promise<BotThread> {
    return { source: 'feishu', items: [] }
  }

  async reply(): Promise<{ messageId: string }> {
    return { messageId: 'om_ack' }
  }
}

/** One inbound group message that mentions the agent. */
function event(eventId: string, messageId: string, text: string, rootId?: string): BotEvent {
  return {
    cursor: 1,
    eventId,
    messageId,
    chatId: 'oc_1',
    chatType: 'group',
    messageType: 'text',
    content: JSON.stringify({ text }),
    senderOpenId: 'ou_1',
    mentionsBot: true,
    ...rootId === undefined ? {} : { rootId },
  }
}

/** Identity sources whose values the test can predict. */
function identities(): { nextTicketId: () => TicketId; nextMandateId: () => MandateId } {
  let ticket = 0
  let mandate = 0
  return {
    nextTicketId: () => brandString<TicketId>(`ticket-${++ticket}`),
    nextMandateId: () => brandString<MandateId>(`mandate-${++mandate}`),
  }
}

/** A worker that answers progress on its first lease and ready afterwards. */
function twoAttemptWorker(): Worker {
  let attempt = 0
  return {
    lease: async (): Promise<WorkerLease> => {
      attempt += 1
      const state = attempt === 1 ? 'progress' : 'ready'
      return { session: `worker-${attempt}`, directory: `/work/ticket-${attempt}`, run: async () => ({ state, summary: `${state} result` }) }
    },
  }
}

const passes: ReviewVerdict = { findings: [], rounds: 1 }
const blocks: ReviewVerdict = {
  findings: [{ summary: 'the page component exceeds 200 lines', severity: 'p0', file: 'apps/web/page.tsx', line: 3 }],
  rounds: 1,
}

describe('one ticket end to end', () => {
  it('admits a request, runs it, reviews it, and only then offers it for a merge decision', async () => {
    const store = new InMemoryStore()
    const gateway = new ChangingGateway()
    const ids = identities()
    gateway.page = { items: [event('evt-1', 'om_root', '给达人详情页加 tier 字段')], nextCursor: 1 }

    const cycle = await runCycle({ store, gateway, policy: POLICY,
      supervisor: 'supervisor-session', cursor: 0, limit: 10, ...ids })
    const accepted = cycle.verdicts[0]
    if (accepted?.kind !== 'accepted') throw new Error('expected the request to start work')
    const ticketId = accepted.tickets[0]!.id
    expect(cycle.nextCursor).toBe(1)

    // One worker answers progress on its first lease and ready on its second.
    const worker = twoAttemptWorker()
    let ticket = (await runAssignment(store, ticketId, worker)).ticket
    expect(ticketStage(ticket)).toEqual({ stage: 'working' })
    const live = ticket.assignments.at(-1)
    if (live === undefined) throw new Error('expected an assignment')

    // That same run finishes later with a ready result.
    ticket = report(store, ticketId, live.id, { state: 'ready', summary: 'PR open' })
    expect(ticketStage(ticket)).toEqual({ stage: 'working' })

    // A reviewer that finds a blocking problem sends the work back.
    const revised = await runReview(store, ticketId, { review: async () => blocks })
    expect(revised.decision).toMatchObject({ decision: 'revise' })
    expect(ticketStage(revised.ticket)).toEqual({ stage: 'working' })

    // The next round reports ready and a clean review hands it to a person.
    ticket = (await runAssignment(store, ticketId, worker)).ticket
    const cleared = await runReview(store, ticketId, { review: async () => passes })
    expect(cleared.decision).toEqual({ decision: 'handoff' })
    expect(ticketStage(cleared.ticket)).toEqual({ stage: 'person', action: 'review' })

    // The merge gate still refuses while CI is red, and asks for nothing else once it is green.
    expect(mergeReadiness({
      repository: 'TomatoAg/client-monorepo', draft: false, checks: 'failing', mergeable: true, review: [],
    })).toEqual({ ready: false, blockers: ['checks-failing'] })
    expect(mergeReadiness({
      repository: 'TomatoAg/client-monorepo', draft: false, checks: 'passing', mergeable: true, review: [{ severity: 'p1' }],
    })).toEqual({ ready: true, blockers: [] })
  })

  it('continues the same ticket when the person follows up in the topic, and stops once stopped', async () => {
    const store = new InMemoryStore()
    const gateway = new ChangingGateway()
    const ids = identities()
    gateway.page = { items: [event('evt-1', 'om_root', '加 tier 字段')], nextCursor: 1 }
    const first = await runCycle({ store, gateway, policy: POLICY,
      supervisor: 'supervisor-session', cursor: 0, limit: 10, ...ids })
    const accepted = first.verdicts[0]
    if (accepted?.kind !== 'accepted') throw new Error('expected the request to start work')

    // A reply in the same topic reaches the open ticket instead of starting another.
    gateway.page = { items: [event('evt-2', 'om_2', '顺便把展示文案也改一下', 'om_root')], nextCursor: 2 }
    const followUp = await runCycle({ store, gateway, policy: POLICY,
      supervisor: 'supervisor-session', cursor: 1, limit: 10, ...ids })
    expect(followUp.verdicts[0]).toMatchObject({ kind: 'continued', reached: [accepted.tickets[0]!.id] })
    expect(store.tickets()).toHaveLength(1)

    // A stopped ticket receives nothing: a later message is judged as new work instead.
    stop(store, accepted.tickets[0]!.id)
    gateway.page = { items: [event('evt-3', 'om_3', '还在吗', 'om_root')], nextCursor: 3 }
    const afterStop = await runCycle({ store, gateway, policy: POLICY,
      supervisor: 'supervisor-session', cursor: 2, limit: 10, ...ids })
    expect(afterStop.verdicts[0]).toMatchObject({ kind: 'accepted' })
    expect(store.tickets()).toHaveLength(2)
  })
})
