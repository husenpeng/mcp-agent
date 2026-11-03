import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CreatorSearchClient,
  CreatorSearchError,
  CREATOR_SEARCH_PATHS,
  CREATOR_SEARCH_SESSION_COOKIE,
} from '@tomato/tool-creator-search'

/** One captured fetch call. */
interface CapturedCall {
  readonly url: URL
  readonly init: RequestInit
}

/**
 * Replace the global fetch with a scripted responder.
 * @param respond - builds the response for one call.
 * @returns the captured calls.
 */
function stubFetch(respond: (call: CapturedCall) => Response | Promise<Response>): CapturedCall[] {
  const calls: CapturedCall[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: URL, init: RequestInit) => {
    const call = { url: input, init }
    calls.push(call)
    return respond(call)
  }))
  return calls
}

/**
 * Build a success envelope body.
 * @param data - capability payload.
 * @param extra - meta fields to merge.
 * @returns the JSON response.
 */
function success(data: unknown, extra: Record<string, unknown> = {}): Response {
  return Response.json({ data, meta: { traceId: 'trace-1', schemaVersion: '1.0', ...extra } })
}

/**
 * Build an error envelope body.
 * @param status - HTTP status.
 * @param code - BFF error code.
 * @param retryable - BFF retryable flag.
 * @returns the JSON response.
 */
function failure(status: number, code: string, retryable: boolean): Response {
  return Response.json({ error: { code, message: `${code} happened`, retryable }, meta: { traceId: 'trace-2' } }, { status })
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

afterEach(() => { vi.unstubAllGlobals() })

describe('CreatorSearchClient', () => {
  it('posts a Blue search with the session cookie and refuses redirects', async () => {
    const calls = stubFetch(() => success({ items: [{ unique_id: 'beauty.one' }], task_status: 'success' }))
    const result = await client().searchBlue({ platform: 'TIKTOK', query: 'beauty', page: 2, pageSize: 10 })

    expect(String(calls[0]?.url)).toBe(`https://bff.test${CREATOR_SEARCH_PATHS.blueSearch}`)
    const init = calls[0]?.init as RequestInit
    expect(init.method).toBe('POST')
    expect(init.redirect).toBe('error')
    expect((init.headers as Record<string, string>).cookie).toBe(`${CREATOR_SEARCH_SESSION_COOKIE}=session-1`)
    expect(JSON.parse(typeof init.body === 'string' ? init.body : '')).toEqual({ platform: 'TIKTOK', query: 'beauty', page: 2, pageSize: 10 })
    expect(result).toMatchObject({
      source: 'blue',
      traceId: 'trace-1',
      data: { items: [{ unique_id: 'beauty.one' }], task_status: 'success' },
    })
  })

  it('keeps the quota snapshot the BFF reported', async () => {
    stubFetch(() => success({ items: [] }, { source: 'blue', quota: { month: '2026-11', limit: 9000, used: 12, remaining: 8988 } }))
    await expect(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' })).resolves.toMatchObject({
      quota: { month: '2026-11', limit: 9000, used: 12, remaining: 8988 },
    })
  })

  it('asks for a new sign-in on 401 without retrying', async () => {
    stubFetch(() => failure(401, 'UNAUTHENTICATED', false))
    const error = await client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }).catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(CreatorSearchError)
    expect(error).toMatchObject({ failure: 'unauthenticated', retryable: false })
    expect((error as Error).message).toContain('sign in to Tomato')
    expect((error as Error).message).toContain('trace-2')
  })

  it('reports a spent quota without retrying, using the last snapshot', async () => {
    let calls = 0
    stubFetch(() => {
      calls += 1
      return calls === 1
        ? success({ items: [] }, { source: 'blue', quota: { month: '2026-11', limit: 9000, used: 9000, remaining: 0 } })
        : failure(429, 'BLUE_QUOTA_EXCEEDED', false)
    })
    const subject = client()
    await subject.searchBlue({ platform: 'TIKTOK', query: 'beauty' })
    const error = await subject.searchBlue({ platform: 'TIKTOK', query: 'skincare' }).catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'quota', retryable: false })
    expect((error as Error).message).toContain('9000/9000 used in 2026-11')
    expect((error as Error).message).toContain('Retrying cannot help')
  })

  it('marks a 502 without a readable envelope as retryable', async () => {
    stubFetch(() => new Response('<html>bad gateway</html>', { status: 502 }))
    const error = await client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }).catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'transient', retryable: true })
    expect((error as Error).message).toContain('Retry the identical request')
  })

  it('marks an upstream rate limit as retryable', async () => {
    stubFetch(() => failure(429, 'UPSTREAM_RATE_LIMITED', true))
    await expect(client().searchBlue({ platform: 'TIKTOK', query: 'beauty' })).rejects.toMatchObject({
      failure: 'transient',
      retryable: true,
    })
  })

  it('rejects a signed-out call before any request is made', async () => {
    const calls = stubFetch(() => success({}))
    const error = await client({ sessionId: () => undefined }).searchBlue({ platform: 'TIKTOK', query: 'beauty' })
      .catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'unauthenticated' })
    expect(calls).toHaveLength(0)
  })

  it('reports an unconfigured origin before any request is made', async () => {
    const calls = stubFetch(() => success({}))
    const error = await client({ baseURL: '' }).searchBlue({ platform: 'TIKTOK', query: 'beauty' })
      .catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'unconfigured' })
    expect((error as Error).message).toContain('TOMATO_SEARCH_GATEWAY_URL')
    expect(calls).toHaveLength(0)
  })

  it('reads a YCP channel with an encoded path and language query, and no body', async () => {
    const calls = stubFetch(() => success({ subscriberCount: 10 }, { source: 'ycp' }))
    const result = await client().ycpChannel({ channel: '@creator.one', languageCode: 'en' })

    expect(String(calls[0]?.url)).toBe(
      `https://bff.test${CREATOR_SEARCH_PATHS.ycpChannels}/%40creator.one?languageCode=en`,
    )
    expect(calls[0]?.init.body).toBeUndefined()
    expect(calls[0]?.init.method).toBe('GET')
    expect(result).toMatchObject({ source: 'ycp', data: { subscriberCount: 10 } })
  })

  it('describes an expired budget as retryable', async () => {
    stubFetch(() => Promise.reject(new DOMException('The operation was aborted.', 'AbortError')))
    const error = await client({ timeoutMs: 1_500 }).searchBlue({ platform: 'TIKTOK', query: 'beauty' })
      .catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'transient', retryable: true })
    expect((error as Error).message).toContain('1500 ms')
  })

  it('does not classify a caller cancellation as retryable', async () => {
    stubFetch(() => Promise.reject(new DOMException('The operation was aborted.', 'AbortError')))
    const controller = new AbortController()
    controller.abort()
    const error = await client().searchBlue({ platform: 'TIKTOK', query: 'beauty' }, controller.signal)
      .catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'rejected', retryable: false })
  })

  it('rejects an envelope without a trace id', async () => {
    stubFetch(() => Response.json({ data: {} }))
    const error = await client().detailBlue({ platform: 'YOUTUBE', creatorId: 'UC123' }).catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ failure: 'rejected' })
    expect((error as Error).message).toContain('no trace id')
  })
})
