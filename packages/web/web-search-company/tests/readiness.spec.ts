/** Company search readiness and registration: the signed-in Desktop session is the credential a step needs. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import WebRuntime from '@tomato/web'
import * as companyPlugin from '../src/index.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.TOMATO_SEARCH_GATEWAY_URL
})

/** Decode the JSON body a stubbed fetch received. */
function bodyOf(init: RequestInit): unknown {
  return typeof init.body === 'string' ? JSON.parse(init.body) : undefined
}

/** One gateway success envelope carrying a single source. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/**
 * Mount the web seam and the company provider over one live session reader.
 * @param sessionId - reads the session the Desktop shell publishes; undefined when signed out.
 * @param config - plugin config; omitted leaves the environment origin in charge.
 * @returns the composed context.
 */
async function boot(sessionId: () => string | undefined, config: companyPlugin.Config = { baseURL: 'https://bff.test' }): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(WebRuntime, { searchProvider: 'company' })
  ctx.provide('desktopSession', { sessionId })
  await ctx.plugin(companyPlugin, config)
  return ctx
}

describe('company search readiness', () => {
  it('is ready for a signed-in session', async () => {
    const ctx = await boot(() => 'session-1')
    await expect(ctx.web.searchReady()).resolves.toBe(true)
  })

  it('is not ready while signed out, whatever the model route', async () => {
    const ctx = await boot(() => undefined)
    await expect(ctx.web.searchReady()).resolves.toBe(false)
    await expect(ctx.web.searchReady('blueai')).resolves.toBe(false)
  })

  it('treats an empty published session as signed out', async () => {
    const ctx = await boot(() => '')
    await expect(ctx.web.searchReady()).resolves.toBe(false)
  })

  it('follows a session that appears after sign-in', async () => {
    const session: { current: string | undefined } = { current: undefined }
    const ctx = await boot(() => session.current)
    await expect(ctx.web.searchReady()).resolves.toBe(false)
    session.current = 'session-2'
    await expect(ctx.web.searchReady()).resolves.toBe(true)
  })
})

describe('company search registration', () => {
  it('runs a search through the registered provider with the published session', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({
      data: { results: [{ url: 'https://a.test', snippet: 'one' }], truncated: false },
    }))
    vi.stubGlobal('fetch', fetchStub)
    const ctx = await boot(() => 'session-9')

    const result = await ctx.web.search({ query: 'q', maxResults: 3 })

    expect(result.sources).toEqual([{ url: 'https://a.test', snippet: 'one' }])
    const [url, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(url)).toBe('https://bff.test/api/v1/search/web')
    expect(new Headers(init.headers).get('cookie')).toBe('session_id=session-9')
  })

  it('applies the configured result bound and budget', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: { results: [] } }))
    vi.stubGlobal('fetch', fetchStub)
    const ctx = await boot(() => 'session-1', { baseURL: 'https://bff.test', timeoutMs: 5000, maxResults: 5 })

    await ctx.web.search({ query: 'q' })

    const [, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(bodyOf(init)).toEqual({ query: 'q', maxResults: 5, maxCharsPerResult: 500, maxChars: 3000 })
  })

  it('registers an unavailable provider when neither config nor environment names an origin', async () => {
    const ctx = await boot(() => 'session-1', {})

    await expect(ctx.web.search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE' })
  })

  it('reads the gateway origin from the environment when config omits it', async () => {
    process.env.TOMATO_SEARCH_GATEWAY_URL = 'https://env-bff.test'
    const fetchStub = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ data: { results: [] } }))
    vi.stubGlobal('fetch', fetchStub)
    const ctx = await boot(() => 'session-1', {})

    await ctx.web.search({ query: 'q' })

    const [url] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(url)).toBe('https://env-bff.test/api/v1/search/web')
  })
})
