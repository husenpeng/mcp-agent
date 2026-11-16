/** Feishu source: event translation, cursor polling through the engine, and replies. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import {
  BotGatewayError,
  HttpBotGateway,
  InMemoryStore,
  accept,
  channelOf,
  contentText,
  pollFeishu,
  replyTo,
  reportText,
  threadOf,
  toTrigger,
} from '@tomato/superagent'
import type { ActorId, BotEvent, BotGateway, BotThread, Mandate, MandateId, TicketId } from '@tomato/superagent'

const MANDATE: Mandate = {
  id: brandString<MandateId>('mandate-1'),
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: [],
  sender: brandString<ActorId>('ou_1'),
  thread: { source: 'feishu', id: 'oc_1:om_root' },
  at: '2026-11-14T00:00:00.000Z',
}

/** One inbound text event. */
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

/** A gateway serving one page and recording replies. */
class FakeGateway implements BotGateway {
  readonly replies: { chatId: string; messageId: string; text: string }[] = []
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

  async reply(chatId: string, messageId: string, text: string): Promise<{ messageId: string }> {
    this.replies.push({ chatId, messageId, text })
    return { messageId: 'om_ack' }
  }
}

describe('event translation', () => {
  it('reads the text a content payload carries and leaves a non-JSON payload alone', () => {
    expect(contentText('{"text":"加 tier 字段"}')).toBe('加 tier 字段')
    expect(contentText('not json')).toBe('not json')
    expect(contentText('{"image_key":"img"}')).toBe('{"image_key":"img"}')
    expect(contentText('null')).toBe('null')
  })

  it('makes a topic reply and the message that started it share one thread', () => {
    expect(threadOf(event()).id).toBe('oc_1:om_root')
    expect(threadOf(event({ messageId: 'om_2', rootId: 'om_root', threadId: 'omt_1' })).id).toBe('oc_1:om_root')
    expect(channelOf(event()).address).toEqual({ chatId: 'oc_1', messageId: 'om_root' })
  })

  it('turns a mention into a mention and a direct message into a direct address', () => {
    expect(toTrigger(event()).addressed).toBe('mention')
    expect(toTrigger(event({ mentionsBot: false, chatType: 'p2p' })).addressed).toBe('direct')
    // A group message that does not mention the agent carries no address form.
    const quiet = toTrigger(event({ mentionsBot: false }))
    expect(quiet.addressed).toBeUndefined()
    expect(quiet.meta).toEqual({ chatType: 'group', messageType: 'text' })
  })

  it('marks the agent own messages as not human', () => {
    expect(toTrigger(event(), 'ou_1').human).toBe(false)
    expect(toTrigger(event(), 'ou_bot').human).toBe(true)
    expect(toTrigger(event()).human).toBe(true)
  })
})

describe('polling', () => {
  it('stores a new event once, reaches the subscribed ticket, and advances the cursor', async () => {
    const store = new InMemoryStore()
    const ticket = accept(store, {
      id: brandString<TicketId>('ticket-1'),
      subject: 'Add a tier field',
      mandate: MANDATE,
      thread: { source: 'feishu', id: 'oc_1:om_root' },
      supervisor: 'supervisor-session',
    })
    const gateway = new FakeGateway([event()], 7)
    const first = await pollFeishu(store, gateway, 0, 50)
    expect(first.nextCursor).toBe(7)
    expect(first.outcomes).toEqual([{ outcome: 'stored', reached: [ticket.id] }])

    // The same page read again is the same event, so nothing is stored twice.
    const again = await pollFeishu(store, gateway, 7, 50)
    expect(again.outcomes).toEqual([{ outcome: 'duplicate', reached: [] }])
  })

  it('replies into the conversation the channel names', async () => {
    const gateway = new FakeGateway([])
    const sent = await replyTo(gateway, channelOf(event()), '收到，我先看服务端。')
    expect(sent).toBe('om_ack')
    expect(gateway.replies).toEqual([{ chatId: 'oc_1', messageId: 'om_root', text: '收到，我先看服务端。' }])
  })

  it('refuses a channel that did not come from this source', async () => {
    const gateway = new FakeGateway([])
    await expect(replyTo(gateway, { source: 'github', address: { chatId: 'oc_1', messageId: 'om_1' } }, 'x'))
      .rejects.toThrow('a reply needs a feishu channel carrying a chat and a message')
    await expect(replyTo(gateway, { source: 'feishu', address: {} }, 'x'))
      .rejects.toThrow('a reply needs a feishu channel carrying a chat and a message')
  })
})

describe('HTTP gateway', () => {
  /** A fetch stand-in answering one scripted response. */
  function transport(response: Response) {
    const calls: { url: string; init: RequestInit | undefined }[] = []
    const fetch: typeof globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      calls.push({ url, init })
      return response
    }
    return { fetch, calls }
  }

  it('reads events, threads, and replies with the acting user on every call', async () => {
    const response = new Response(JSON.stringify({ code: 0, message: 'success', data: { items: [], nextCursor: 3 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const { fetch, calls } = transport(response)
    const gateway = new HttpBotGateway({ baseUrl: 'http://127.0.0.1:8013', userId: 'u-1', fetch })
    await gateway.events(0, 10)
    expect(calls[0]?.url).toBe('http://127.0.0.1:8013/api/v1/bot/events?cursor=0&limit=10')
    expect((calls[0]?.init?.headers as Record<string, string>)['X-User-Id']).toBe('u-1')
    expect(calls[0]?.init?.body).toBeUndefined()
  })

  it('posts a reply as JSON and returns the created message id', async () => {
    const response = new Response(JSON.stringify({ code: 0, message: 'success', data: { messageId: 'om_ack' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const { fetch, calls } = transport(response)
    const gateway = new HttpBotGateway({ baseUrl: 'http://127.0.0.1:8013', userId: 'u-1', fetch })
    expect(await gateway.reply('oc_1', 'om_1', 'hi')).toEqual({ messageId: 'om_ack' })
    expect(calls[0]?.init?.method).toBe('POST')
    expect((calls[0]?.init?.headers as Record<string, string>)['content-type']).toBe('application/json')
    const sent = calls[0]?.init?.body
    expect(JSON.parse(typeof sent === 'string' ? sent : '{}')).toEqual({ chatId: 'oc_1', messageId: 'om_1', text: 'hi' })
  })

  it('escapes the path segments of a thread read and rejects a refusal', async () => {
    const ok = new Response(JSON.stringify({ code: 0, message: 'success', data: { source: 'log', items: [] } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const reading = transport(ok)
    await new HttpBotGateway({ baseUrl: 'http://h', userId: 'u', fetch: reading.fetch }).thread('oc/1', 'om 1')
    expect(reading.calls[0]?.url).toBe('http://h/api/v1/bot/threads/oc%2F1/om%201')

    const refused = transport(new Response('{"detail":"forbidden"}', { status: 403 }))
    await expect(new HttpBotGateway({ baseUrl: 'http://h', userId: 'u', fetch: refused.fetch }).events(0, 5))
      .rejects.toThrow(expect.objectContaining({ status: 403 }))
  })

  it('falls back to the global fetch when the deployment gives no transport', async () => {
    const original = globalThis.fetch
    let called = ''
    globalThis.fetch = async (input) => {
      called = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      return new Response('{"code":0,"data":{"items":[],"nextCursor":0}}', { status: 200 })
    }
    try {
      expect(await new HttpBotGateway({ baseUrl: 'http://h', userId: 'u' }).events(0, 1))
        .toEqual({ items: [], nextCursor: 0 })
      expect(called).toBe('http://h/api/v1/bot/events?cursor=0&limit=1')
    } finally {
      globalThis.fetch = original
    }
  })

  it('rejects a body without the documented envelope', async () => {
    const bare = transport(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))
    await expect(new HttpBotGateway({ baseUrl: 'http://h', userId: 'u', fetch: bare.fetch }).events(0, 5))
      .rejects.toThrow(BotGatewayError)
    const noData = transport(new Response('{"code":0}', { status: 200, headers: { 'content-type': 'application/json' } }))
    await expect(new HttpBotGateway({ baseUrl: 'http://h', userId: 'u', fetch: noData.fetch }).events(0, 5))
      .rejects.toThrow('bot service answered without a payload')
  })
})

describe('replying in the conversation', () => {
  it('names what was opened and how the work went', () => {
    expect(reportText({ kind: 'accepted', tickets: [{ subject: '加 tier 字段' }] }, [{ state: 'ready' }]))
      .toBe('Opened: 加 tier 字段\nState: ready')
    expect(reportText({ kind: 'accepted', tickets: [{ subject: 'a' }, { subject: 'b' }] }, []))
      .toBe('Opened 2 tickets:\n- a\n- b')
  })

  it('says why a request was refused, and says nothing when an open ticket continues', () => {
    expect(reportText({ kind: 'declined', reason: 'out of scope' }, [])).toBe('Not taken: out of scope')
    expect(reportText({ kind: 'continued' }, [])).toBeUndefined()
  })
})
