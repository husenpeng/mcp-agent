/** The app source vocabulary: direct human triggers, shared intake decisions, and continuation context. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import {
  APP_SOURCE,
  InMemoryStore,
  accept,
  appThread,
  appTrigger,
  briefFor,
  decideTriggers,
  intake,
  runAssignment,
  workerBriefText,
} from '@tomato/superagent'
import type {
  ActorId,
  AssignmentReport,
  Mandate,
  MandateId,
  Policy,
  TicketId,
  TriggerId,
  Worker,
  WorkerLease,
} from '@tomato/superagent'

const POLICY: Policy = {
  version: 'p1',
  sources: [{ source: APP_SOURCE, allowedActors: ['app-user'] }],
}

const MANDATE: Mandate = {
  id: brandString<MandateId>('mandate-1'),
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: ['app:direct'],
  sender: brandString<ActorId>('app-user'),
  thread: { source: APP_SOURCE, id: 'app-1' },
  at: '2026-11-18T00:00:00.000Z',
}

/** One app submission with a predictable identity. */
function submission(id: string, text: string, threadId = 'app-1') {
  return appTrigger({
    id: brandString<TriggerId>(`app:${id}`),
    text,
    thread: appThread(threadId),
    actor: brandString<ActorId>('app-user'),
    at: '2026-11-18T00:00:00.000Z',
  })
}

/** Identity sources whose values the test can predict. */
function identities() {
  let ticket = 0
  let mandate = 0
  return {
    nextTicketId: () => brandString<TicketId>(`ticket-${++ticket}`),
    nextMandateId: () => brandString<MandateId>(`mandate-${++mandate}`),
  }
}

describe('app trigger', () => {
  it('is a direct human request on the app source with no reply channel', () => {
    const trigger = submission('evt-1', '给达人详情页加 tier 字段')
    expect(trigger).toMatchObject({
      source: 'app',
      human: true,
      addressed: 'direct',
      threads: [{ source: 'app', id: 'app-1' }],
      meta: {},
    })
    expect(trigger.channel).toBeUndefined()
  })
})

describe('shared intake decisions', () => {
  it('admits an app submission into a ticket the policy authorizes', async () => {
    const store = new InMemoryStore()
    const trigger = submission('evt-1', '给达人详情页加 tier 字段')
    const outcome = intake(store, trigger)
    const verdicts = await decideTriggers({
      store, policy: POLICY, supervisor: 'supervisor-session', ...identities(),
    }, [{ trigger, outcome }])
    expect(verdicts[0]).toMatchObject({ kind: 'accepted' })
    const ticket = store.tickets()[0]?.ticket
    expect(ticket?.mandate).toMatchObject({ scope: 'change', strength: 'explicit', matchedRules: ['app:direct'] })
    expect(ticket?.follows).toEqual([{ source: 'app', id: 'app-1' }])
  })

  it('refuses an actor the app policy does not name, and declines the release lane', async () => {
    const store = new InMemoryStore()
    const outsider = { ...submission('evt-1', '查一下'), actor: brandString<ActorId>('someone-else') }
    const refused = await decideTriggers({
      store, policy: POLICY, supervisor: 'supervisor-session', ...identities(),
    }, [{ trigger: outsider, outcome: intake(store, outsider) }])
    expect(refused[0]).toMatchObject({ kind: 'refused', admission: { reason: 'actor-not-allowed' } })
    const release = submission('evt-2', '把改动发布到生产环境')
    const declined = await decideTriggers({
      store, policy: POLICY, supervisor: 'supervisor-session', ...identities(),
    }, [{ trigger: release, outcome: intake(store, release) }])
    expect(declined[0]).toMatchObject({ kind: 'declined', reason: 'a person owns the release' })
  })

  it('continues the ticket a later message on the same thread reaches', async () => {
    const store = new InMemoryStore()
    const first = submission('evt-1', '加 tier 字段')
    await decideTriggers({
      store, policy: POLICY, supervisor: 'supervisor-session', ...identities(),
    }, [{ trigger: first, outcome: intake(store, first) }])
    const ticketId = store.tickets()[0]?.ticket.id as TicketId
    const followUp = submission('evt-2', '用蓝色')
    const verdicts = await decideTriggers({
      store, policy: POLICY, supervisor: 'supervisor-session', ...identities(),
    }, [{ trigger: followUp, outcome: intake(store, followUp) }])
    expect(verdicts[0]).toMatchObject({ kind: 'continued', reached: [ticketId] })
    expect(store.triggers().map(trigger => trigger.text)).toEqual(['加 tier 字段', '用蓝色'])
  })
})

describe('continuation context', () => {
  it('carries the person messages into the brief and the worker prompt', () => {
    const store = new InMemoryStore()
    const ticket = accept(store, {
      id: brandString<TicketId>('ticket-1'),
      subject: '加 tier 字段',
      mandate: MANDATE,
      thread: { source: APP_SOURCE, id: 'app-1' },
      supervisor: 'supervisor-session',
    })
    expect(briefFor(ticket).context).toBeUndefined()
    const brief = briefFor(ticket, ['用蓝色', '顺便改文案'])
    expect(brief.context).toEqual(['用蓝色', '顺便改文案'])
    const text = workerBriefText(brief, '/work')
    expect(text).toContain('Messages from the person after the work was accepted')
    expect(text).toContain('- 用蓝色')
    expect(text).toContain('- 顺便改文案')
    expect(workerBriefText(briefFor(ticket))).not.toContain('Messages from the person')
  })

  it('hands the lease to the caller before driving, so a cancel reaches the run', async () => {
    const store = new InMemoryStore()
    const ticket = accept(store, {
      id: brandString<TicketId>('ticket-1'),
      subject: '加 tier 字段',
      mandate: MANDATE,
      thread: { source: APP_SOURCE, id: 'app-1' },
      supervisor: 'supervisor-session',
    })
    let cancelled = false
    const worker: Worker = {
      lease: async (): Promise<WorkerLease> => ({
        session: 'worker-1',
        directory: '/work',
        cancel: () => { cancelled = true },
        run: async (): Promise<AssignmentReport> => cancelled
          ? { state: 'dropped', summary: 'the run was cancelled' }
          : { state: 'ready' },
      }),
    }
    const seen: WorkerLease[] = []
    const ran = await runAssignment(store, ticket.id, worker, {
      context: ['继续，用蓝色'],
      onLease: (lease) => { seen.push(lease); lease.cancel() },
    })
    expect(seen).toHaveLength(1)
    expect(ran.report).toEqual({ state: 'dropped', summary: 'the run was cancelled' })
    expect(ran.ticket.assignments[0]?.ended).toBe(true)
  })
})
