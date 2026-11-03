// Edge-path coverage for the tool surface: envelope parsing failures, the
// origin and session fallbacks a profile meets, and the pure presentation and
// formatting helpers.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import { ToolCallId } from '@tomato/llm'
import { mountAgentLoopTestDependencies } from '@tomato/agent-loop-testkit'
import type { ToolExecutionResult } from '@tomato/tools'
import Storage from '@tomato/storage'
import * as CreatorSearch from '@tomato/tool-creator-search'
import * as MemoryStorage from './helpers/memory-storage.ts'
import {
  CreatorSearchClient,
  CREATOR_DETAIL_TOOL,
  CREATOR_SEARCH_TOOL,
  formatCreatorResult,
  YOUTUBE_CHANNEL_TOOL,
} from '@tomato/tool-creator-search'

/** A response whose body read aborts, as a cancelled caller would see. */
class AbortedBody extends Response {
  constructor(status: number) {
    super(null, { status })
  }

  override async json(): Promise<never> {
    throw new DOMException('The operation was aborted.', 'AbortError')
  }
}

const ORIGIN_VARS = ['TOMATO_SEARCH_GATEWAY_URL', 'TOMATO_WEB_URL'] as const
const saved = new Map<string, string | undefined>()

/**
 * Mount the registry and this plugin with a session stub.
 * @param config - plugin configuration overrides.
 * @param sessionId - what the Desktop-session stub reports.
 * @returns the context.
 */
async function mount(config: Record<string, unknown> = {}, sessionId: string | undefined = 'session-1') {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const storage = await ctx.plugin(Storage)
  await storage.await()
  const domains = await ctx.plugin(MemoryStorage)
  await domains.await()
  ctx.provide('desktopSession', { sessionId: () => sessionId })
  const fiber = await ctx.plugin(CreatorSearch, config)
  await fiber.await()
  return ctx
}

/**
 * Execute one tool call through the registry.
 * @param ctx - context carrying the registry.
 * @param name - wire tool name.
 * @param args - arguments to serialize.
 * @returns the normalized execution result.
 */
async function run(ctx: Context, name: string, args: unknown): Promise<ToolExecutionResult> {
  const batch = await ctx.tools.execute({
    calls: [{ type: 'tool-call', name, id: ToolCallId('edge-1'), arguments: JSON.stringify(args) }],
    signal: new AbortController().signal,
  })
  const result = batch.results[0]?.result
  if (result === undefined) throw new Error('tool execution produced no result')
  return result
}

/**
 * Build a client over a fixed origin and session.
 * @param overrides - options replacing the defaults.
 * @returns the client under test.
 */
function client(overrides: Partial<ConstructorParameters<typeof CreatorSearchClient>[0]> = {}): CreatorSearchClient {
  return new CreatorSearchClient({
    baseURL: 'https://bff.test',
    timeoutMs: 60_000,
    sessionId: () => 'session-1',
    ...overrides,
  })
}

/** Let one client call fail and return the thrown value. */
async function rejection(call: Promise<unknown>): Promise<unknown> {
  return call.catch((thrown: unknown) => thrown)
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const name of ORIGIN_VARS) {
    const value = saved.get(name)
    if (value === undefined) Reflect.deleteProperty(process.env, name)
    else process.env[name] = value
  }
  saved.clear()
})

for (const name of ORIGIN_VARS) saved.set(name, process.env[name])

describe('creator-search envelope edges', () => {
  it('reads a channel without a language query', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: {}, meta: { traceId: 't', schemaVersion: '1.0', source: 'ycp' } })))
    await expect(client().ycpChannel({ channel: '@handle' })).resolves.toMatchObject({ source: 'ycp' })
  })

  it('reports a success body it cannot parse', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect(error).toMatchObject({ failure: 'rejected' })
    expect((error as Error).message).toContain('unreadable body')
  })

  it('reports a non-object success body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json('ok')))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect((error as Error).message).toContain('non-object body')
  })

  it('reports a success body without data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ meta: { traceId: 'trace-x', schemaVersion: '1.0' } })))
    const error = await rejection(client().detailBlue({ platform: 'YOUTUBE', creatorId: 'UC1' }))
    expect((error as Error).message).toContain('carried no data')
  })

  it('ignores a malformed quota snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      data: {}, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue', quota: 'nope' },
    })))
    await expect(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' })).resolves.not.toHaveProperty('quota')
  })

  it('reports quota exhaustion without a known snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { error: { code: 'BLUE_QUOTA_EXCEEDED', message: 'spent', retryable: false }, meta: { traceId: 'q' } },
      { status: 429 },
    )))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect((error as Error).message).toBe('The group API monthly quota is spent. Retrying cannot help until the quota resets (trace q).')
  })

  it('falls back to the status line when the envelope names no message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { error: { code: 'INVALID_QUERY', retryable: false }, meta: { traceId: 'r' } },
      { status: 400 },
    )))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect((error as Error).message).toBe('Creator search failed (HTTP 400). (trace r)')
  })

  it('reports a cancelled error-body read as a cancellation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new AbortedBody(502)))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect(error).toMatchObject({ failure: 'rejected' })
    expect((error as Error).message).toBe('Creator search was cancelled.')
  })

  it('reports a cancelled success-body read as a timeout-free cancellation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new AbortedBody(200)))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect((error as Error).message).toContain('timed out after 60000 ms')
  })

  it('describes an unreachable BFF from an Error rejection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connection reset') }))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }))
    expect((error as Error).message).toContain('could not reach the BFF: connection reset')
  })

  it('ignores a quota object missing fields', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      data: {}, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue', quota: { month: '2026-11' } },
    })))
    await expect(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' })).resolves.not.toHaveProperty('quota')
  })

  it('describes an unreachable BFF from a non-Error rejection', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'socket closed' }))
    const error = await rejection(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }, controller.signal))
    expect((error as Error).message).toContain('could not reach the BFF: socket closed')
  })
})

describe('creator-search origin and session resolution', () => {
  it('fails every call when no origin is configured anywhere', async () => {
    for (const name of ORIGIN_VARS) Reflect.deleteProperty(process.env, name)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const ctx = await mount()

    const result = await run(ctx, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty' })
    expect(result.error?.message).toContain('TOMATO_SEARCH_GATEWAY_URL')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('takes the origin from TOMATO_SEARCH_GATEWAY_URL, then TOMATO_WEB_URL', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: URL) => {
      calls.push(url.origin)
      return Response.json({ data: {}, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue' } })
    }))

    delete process.env.TOMATO_WEB_URL
    process.env.TOMATO_SEARCH_GATEWAY_URL = 'https://gateway.test'
    const first = await mount()
    await run(first, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty' })

    delete process.env.TOMATO_SEARCH_GATEWAY_URL
    process.env.TOMATO_WEB_URL = 'https://web.test'
    const second = await mount()
    await run(second, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty' })

    expect(calls).toEqual(['https://gateway.test', 'https://web.test'])
  })

  it('asks for a sign-in when the Desktop session reports none', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const ctx = await mount({ baseURL: 'https://bff.test' }, '')

    const result = await run(ctx, YOUTUBE_CHANNEL_TOOL, { channel: '@handle' })
    expect(result.error?.message).toContain('Sign in to Tomato')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('creator-search tool surfaces', () => {
  it('renders a short result unchanged', () => {
    const text = formatCreatorResult({ source: 'blue', traceId: 't', data: { items: [] } }, 2_000)
    expect(text).toBe('{"source":"blue","traceId":"t","data":{"items":[]}}')
  })

  it('forwards the accepted page bounds', async () => {
    const bodies: unknown[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: URL, init: RequestInit) => {
      bodies.push(JSON.parse(typeof init.body === 'string' ? init.body : '{}'))
      return Response.json({ data: {}, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue' } })
    }))
    const ctx = await mount({ baseURL: 'https://bff.test' })
    const result = await run(ctx, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty', page: 3, pageSize: 7 })

    expect(result.isError).toBe(false)
    expect(bodies[0]).toEqual({ platform: 'TIKTOK', query: 'beauty', page: 3, pageSize: 7 })
  })

  it('registers the remaining tools when search is off', async () => {
    const ctx = await mount({ baseURL: 'https://bff.test', search: false })
    const names = ctx.tools.schemas().map(schema => schema.name)

    expect(names).not.toContain(CREATOR_SEARCH_TOOL)
    expect(names).toContain(CREATOR_DETAIL_TOOL)
    expect(names).toContain(YOUTUBE_CHANNEL_TOOL)
  })

  it('rejects a page below the accepted range', async () => {
    const ctx = await mount({ baseURL: 'https://bff.test' })
    const result = await run(ctx, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty', page: 0 })
    expect(result.error?.message).toContain('must be an integer between 1 and 100000')
  })

  it('reads a creator detail and a channel, and titles their pending cards', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      data: { channelId: 'UC1' }, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue' },
    })))
    const ctx = await mount({ baseURL: 'https://bff.test' })

    const detail = await run(ctx, CREATOR_DETAIL_TOOL, { platform: 'YOUTUBE', creatorId: 'UC1' })
    const channel = await run(ctx, YOUTUBE_CHANNEL_TOOL, { channel: '@handle', languageCode: 'zh' })
    expect(detail.isError).toBe(false)
    expect(channel.isError).toBe(false)

    const searchView = ctx.tools.get(CREATOR_SEARCH_TOOL)?.presentCall?.({ platform: 'TIKTOK', query: 'beauty' })
    const detailView = ctx.tools.get(CREATOR_DETAIL_TOOL)?.presentCall?.({ platform: 'YOUTUBE', creatorId: 'UC1' })
    const channelView = ctx.tools.get(YOUTUBE_CHANNEL_TOOL)?.presentCall?.({ channel: '@handle' })
    expect(searchView).toMatchObject({ card: 'generic', kind: 'search', title: 'creator_search tiktok: beauty' })
    expect(detailView).toMatchObject({ card: 'generic', kind: 'read', title: 'creator_detail youtube: UC1' })
    expect(channelView).toMatchObject({ card: 'generic', kind: 'read', title: 'youtube_channel: @handle' })
  })

  it('rejects an over-long language code', async () => {
    const ctx = await mount({ baseURL: 'https://bff.test' })
    const result = await run(ctx, YOUTUBE_CHANNEL_TOOL, { channel: '@handle', languageCode: 'x'.repeat(21) })
    expect(result.error?.message).toContain('languageCode must be between 1 and 20 characters')
  })
})
