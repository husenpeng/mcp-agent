/** One intake cycle: admit, accept, continue, or refuse — with the cursor advancing. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import { InMemoryStore, runCycle, subjectOf } from '@tomato/superagent'
import type { BotEvent, BotGateway, BotThread, MandateId, Policy, TicketId, Trigger } from '@tomato/superagent'

const POLICY: Policy = { version: 'p1', sources: [{ source: 'feishu', allowedActors: ['ou_1'] }] }

/** One inbound event, allowed and addressed unless overridden. */
function event(overrides: Partial<BotEvent> = {}): BotEvent {
  return {
    cursor: 1,
    eventId: 'evt-1',
    messageId: 'om_root',
    chatId: 'oc_1',
    chatType: 'group',
    messageType: 'text',
    content: '{"text":"给达人详情页加 tier 字段"}',
    senderOpenId: 'ou_1',
    mentionsBot: true,
    ...overrides,
  }
}

/** A gateway answering one fixed page and recording replies. */
class PageGateway implements BotGateway {
  readonly #events: readonly BotEvent[]
  readonly #nextCursor: number

  constructor(events: readonly BotEvent[], nextCursor = events.length) {
    this.#events = events
    this.#nextCursor = nextCursor
  }

  async events(): Promise<{ items: readonly BotEvent[]; nextCursor: number }> {
    return { items: this.#events, nextCursor: this.#nextCursor }
  }

  async thread(): Promise<BotThread> {
    return { source: 'log', items: [] }
  }

  async reply(): Promise<{ messageId: string }> {
    return { messageId: 'om_ack' }
  }
}

/** Identity sources a test can read back. */
function identities(): { nextTicketId: () => TicketId; nextMandateId: () => MandateId } {
  let ticket = 0
  let mandate = 0
  return {
    nextTicketId: () => brandString<TicketId>(`ticket-${++ticket}`),
    nextMandateId: () => brandString<MandateId>(`mandate-${++mandate}`),
  }
}

describe('intake cycle', () => {
  it('starts a ticket for an admitted request and records the mandate it was judged under', async () => {
    const store = new InMemoryStore()
    const result = await runCycle({
      store,
      gateway: new PageGateway([event()], 4),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 0,
      limit: 10,
      ...identities(),
    })
    expect(result.nextCursor).toBe(4)
    expect(result.verdicts).toHaveLength(1)
    const [verdict] = result.verdicts
    expect(verdict).toMatchObject({ kind: 'accepted' })
    if (verdict?.kind !== 'accepted') throw new Error('expected an acceptance')
    expect(verdict.tickets[0]).toMatchObject({
      subject: '给达人详情页加 tier 字段',
      mandate: { policyVersion: 'p1', scope: 'change', matchedRules: ['feishu:mention'], thread: { source: 'feishu', id: 'oc_1:om_root' } },
    })
    expect(store.tickets().map(entry => entry.ticket.id)).toEqual([verdict.tickets[0]!.id])
  })

  it('lets a later message on the subscribed thread continue the open ticket instead of starting one', async () => {
    const store = new InMemoryStore()
    const ids = identities()
    const first = await runCycle({
      store, gateway: new PageGateway([event()], 1), policy: POLICY,
      supervisor: 'supervisor-session', cursor: 0, limit: 10, ...ids,
    })
    const second = await runCycle({
      store,
      gateway: new PageGateway([event({ eventId: 'evt-2', messageId: 'om_2', rootId: 'om_root' })], 2),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 1,
      limit: 10,
      ...ids,
    })
    expect(second.verdicts).toHaveLength(1)
    const accepted = first.verdicts[0]
    if (accepted?.kind !== 'accepted') throw new Error('expected an acceptance')
    expect(second.verdicts[0]).toMatchObject({ kind: 'continued', reached: [accepted.tickets[0]!.id] })
    expect(store.tickets()).toHaveLength(1)
  })

  it('refuses a release request before any model turn can decide it', async () => {
    const store = new InMemoryStore()
    let asked = 0
    const result = await runCycle({
      store,
      gateway: new PageGateway([event({ content: JSON.stringify({ text: '把这次改动直接发布到线上' }) })], 1),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 0,
      limit: 10,
      judge: { supervise: () => { asked += 1; return Promise.resolve({ accepted: true, plans: [] }) } },
      ...identities(),
    })
    expect(result.verdicts[0]).toMatchObject({ kind: 'declined', reason: 'a person owns the release' })
    expect(asked).toBe(0)
    expect(store.tickets()).toHaveLength(0)
  })

  it('opens one ticket per piece the judge plans, and opens nothing when it declines', async () => {
    const store = new InMemoryStore()
    const planned = await runCycle({
      store,
      gateway: new PageGateway([event()], 1),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 0,
      limit: 10,
      judge: {
        supervise: () => Promise.resolve({
          accepted: true,
          plans: [
            { scope: 'change' as const, subject: 'change the service field' },
            { scope: 'investigate' as const, subject: 'check the client needs no change' },
          ],
        }),
      },
      ...identities(),
    })
    expect(planned.verdicts[0]).toMatchObject({ kind: 'accepted' })
    expect(store.tickets().map(entry => entry.ticket.subject))
      .toEqual(['change the service field', 'check the client needs no change'])
    expect(store.tickets()[1]?.ticket.mandate.scope).toBe('investigate')

    const declined = await runCycle({
      store: new InMemoryStore(),
      gateway: new PageGateway([event()], 1),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 0,
      limit: 10,
      judge: { supervise: () => Promise.resolve({ accepted: false, reason: 'out of scope', plans: [] }) },
      ...identities(),
    })
    expect(declined.verdicts[0]).toMatchObject({ kind: 'declined', reason: 'out of scope' })

    // A judge that declined without saying why still records a reason.
    const mute = await runCycle({
      store: new InMemoryStore(),
      gateway: new PageGateway([event()], 1),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 0,
      limit: 10,
      judge: { supervise: () => Promise.resolve({ accepted: false, plans: [] }) },
      ...identities(),
    })
    expect(mute.verdicts[0]).toMatchObject({ kind: 'declined', reason: 'declined' })
  })

  it('refuses a request from a person the policy does not name and starts nothing', async () => {
    const store = new InMemoryStore()
    const result = await runCycle({
      store,
      gateway: new PageGateway([event({ senderOpenId: 'ou_9' })], 1),
      policy: POLICY,
      supervisor: 'supervisor-session',
      cursor: 0,
      limit: 10,
      ...identities(),
    })
    expect(result.verdicts[0]).toMatchObject({ kind: 'refused', admission: { reason: 'actor-not-allowed' } })
    expect(store.tickets()).toEqual([])
  })

  it('treats a repeated event as a continuation rather than a second ticket', async () => {
    const store = new InMemoryStore()
    const ids = identities()
    await runCycle({ store, gateway: new PageGateway([event()], 1), policy: POLICY,
      supervisor: 'supervisor-session', cursor: 0, limit: 10, ...ids })
    const again = await runCycle({
      store, gateway: new PageGateway([event()], 1), policy: POLICY,
      supervisor: 'supervisor-session', cursor: 1, limit: 10, ...ids,
    })
    expect(again.verdicts[0]).toMatchObject({ kind: 'continued', reached: [] })
    expect(store.tickets()).toHaveLength(1)
  })
})

describe('subject', () => {
  it('collapses whitespace and bounds a long request to one short line', () => {
    const base: Trigger = {
      id: 'feishu:e' as Trigger['id'],
      source: 'feishu',
      threads: [{ source: 'feishu', id: 'oc_1' }],
      actor: 'ou_1' as Trigger['actor'],
      human: true,
      at: '2026-11-14T00:00:00.000Z',
      text: '  加   tier\n字段  ',
      meta: {},
    }
    expect(subjectOf(base)).toBe('加 tier 字段')
    expect(subjectOf({ ...base, text: 'x'.repeat(200) })).toHaveLength(120)
    expect(subjectOf({ ...base, text: 'x'.repeat(200) }).endsWith('…')).toBe(true)
  })
})
