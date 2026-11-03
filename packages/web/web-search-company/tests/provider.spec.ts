import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  COMPANY_DEFAULT_TIMEOUT_MS,
  COMPANY_MAX_RESULTS,
  COMPANY_QUERY_MAX_CHARS,
  CompanySearchProvider,
  mapCompanyResponse,
  mapCompanyResult,
} from '../src/provider.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** Decode the JSON body a stubbed fetch received. */
function bodyOf(init: RequestInit): unknown {
  return typeof init.body === 'string' ? JSON.parse(init.body) : undefined
}

function provider(sessionId: () => string | undefined = () => 'session-1'): CompanySearchProvider {
  return new CompanySearchProvider({ baseURL: 'https://bff.test', timeoutMs: 8000, sessionId })
}

describe('company result mapping', () => {
  it('maps a complete entry', () => {
    expect(mapCompanyResult({
      url: 'https://a.test',
      title: 'A',
      snippet: 'excerpt',
      publishedAt: '2026-10-01T00:00:00Z',
    })).toEqual({ url: 'https://a.test', title: 'A', snippet: 'excerpt', publishedAt: '2026-10-01T00:00:00Z' })
  })

  it('drops an entry without a URL', () => {
    expect(mapCompanyResult({ url: '' })).toBeUndefined()
    expect(mapCompanyResult({ url: null, title: 'A' })).toBeUndefined()
    expect(mapCompanyResult({ title: 'A' })).toBeUndefined()
    expect(mapCompanyResult({ url: '   ' })).toBeUndefined()
  })

  it('omits empty optional fields instead of emitting them', () => {
    expect(mapCompanyResult({ url: 'https://a.test', title: '', snippet: null, publishedAt: '' }))
      .toEqual({ url: 'https://a.test' })
  })

  it('drops unusable entries and keeps source order', () => {
    const result = mapCompanyResponse({
      data: {
        results: [
          { url: 'https://a.test', snippet: 'one' },
          { url: '' },
          { url: 'https://c.test', title: 'C' },
        ],
      },
    })
    expect(result).toEqual({
      sources: [{ url: 'https://a.test', snippet: 'one' }, { url: 'https://c.test', title: 'C' }],
      truncated: false,
    })
    expect(result.content).toBeUndefined()
  })

  it('tolerates a missing data envelope', () => {
    expect(mapCompanyResponse({}).sources).toEqual([])
    expect(mapCompanyResponse({ data: null }).sources).toEqual([])
    expect(mapCompanyResponse({ data: { results: null } }).sources).toEqual([])
  })
})

describe('company provider availability', () => {
  it('is unavailable without a gateway origin', () => {
    expect(new CompanySearchProvider({ baseURL: '', timeoutMs: 8000, sessionId: () => 's' }).available()).toBe(false)
    expect(new CompanySearchProvider({ baseURL: 'not-a-url', timeoutMs: 8000, sessionId: () => 's' }).available()).toBe(false)
  })

  it('stays available without a session, whose gate is readiness', () => {
    expect(provider(() => undefined).available()).toBe(true)
    expect(provider(() => '').available()).toBe(true)
  })

  it('is available with an origin and bounds, without making a network call', () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)
    expect(provider().available()).toBe(true)
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('is unavailable with a configured bound above the gateway maximum', () => {
    expect(new CompanySearchProvider({
      baseURL: 'https://bff.test',
      timeoutMs: 8000,
      maxResults: COMPANY_MAX_RESULTS + 1,
      sessionId: () => 'session-1',
    }).available()).toBe(false)
  })
})

describe('company search request', () => {
  it('sends query, bound, session cookie, and refuses redirects', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: { results: [{ url: 'https://a.test', snippet: 'one' }] } }))
    vi.stubGlobal('fetch', fetchStub)

    const result = await provider().search({ query: 'creator marketing', maxResults: 7 })

    expect(result).toEqual({ sources: [{ url: 'https://a.test', snippet: 'one' }], truncated: false })
    const [url, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(url)).toBe('https://bff.test/api/v1/search/web')
    expect(init.method).toBe('POST')
    expect(init.redirect).toBe('error')
    expect(new Headers(init.headers).get('cookie')).toBe('session_id=session-1')
    expect(bodyOf(init)).toEqual({ query: 'creator marketing', maxResults: 7 })
  })

  it('forwards the configured excerpt budgets', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: { results: [] } }))
    vi.stubGlobal('fetch', fetchStub)
    const bounded = new CompanySearchProvider({
      baseURL: 'https://bff.test',
      timeoutMs: 8000,
      sessionId: () => 'session-1',
      maxCharsPerResult: 400,
      maxChars: 1500,
    })

    await bounded.search({ query: 'q' })

    const [, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(bodyOf(init)).toEqual({ query: 'q', maxCharsPerResult: 400, maxChars: 1500 })
  })

  it('maps a gateway answer to the result content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      data: { results: [{ url: 'https://a.test' }], truncated: false, answer: '  a synthesized answer  ' },
    })))

    await expect(provider().search({ query: 'q' }))
      .resolves.toMatchObject({ content: 'a synthesized answer' })
  })

  it('omits content for an empty answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      data: { results: [{ url: 'https://a.test' }], answer: '   ' },
    })))

    const result = await provider().search({ query: 'q' })
    expect(result.content).toBeUndefined()
  })

  it('propagates the gateway truncation flag', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      data: { results: [{ url: 'https://a.test' }], truncated: true },
    })))

    await expect(provider().search({ query: 'q' })).resolves.toMatchObject({ truncated: true })
  })

  it('caps the request bound at the gateway maximum and reports the cut', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: { results: [] } }))
    vi.stubGlobal('fetch', fetchStub)

    const result = await provider().search({ query: 'q', maxResults: COMPANY_MAX_RESULTS + 10 })

    const [, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(bodyOf(init)).toEqual({ query: 'q', maxResults: COMPANY_MAX_RESULTS })
    expect(result.truncated).toBe(true)
  })

  it('rejects a query longer than the gateway accepts without calling it', async () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)

    await expect(provider().search({ query: 'x'.repeat(COMPANY_QUERY_MAX_CHARS + 1) }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR' })
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('omits maxResults when neither the request nor the config bounds it', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: { results: [] } }))
    vi.stubGlobal('fetch', fetchStub)

    await provider().search({ query: 'q' })

    const [, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(bodyOf(init)).toEqual({ query: 'q' })
  })

  it('fails as a missing credential without calling the gateway when signed out', async () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)

    await expect(provider(() => undefined).search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('reports an expired session as a missing credential', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { code: 'UNAUTHENTICATED' } }, 401)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
  })

  it('maps a rate-limited upstream to a retryable provider error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      error: { code: 'RATE_LIMITED', message: 'Search upstream is rate limited', retryable: true },
      meta: { traceId: 'trace-1' },
    }, 429)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({
        code: 'WEB_PROVIDER_RATE_LIMITED',
        message: 'Search upstream is rate limited Retry the search later. (trace trace-1)',
      })
  })

  it('maps a disabled search endpoint to its own code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      error: { code: 'SEARCH_DISABLED', message: 'Web search is not enabled', retryable: false },
      meta: { traceId: 'trace-2' },
    }, 503)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_SEARCH_DISABLED', message: 'Web search is not enabled (trace trace-2)' })
  })

  it('maps an upstream timeout to a retryable provider error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      error: { code: 'UPSTREAM_TIMEOUT', message: 'Search upstream timed out', retryable: true },
    }, 504)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({
        code: 'WEB_PROVIDER_TIMEOUT',
        message: 'Search upstream timed out Retry the search later.',
      })
  })

  it('surfaces the gateway message and retry hint for an unavailable upstream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      error: { code: 'UPSTREAM_UNAVAILABLE', message: 'upstream unavailable', retryable: true },
      meta: { traceId: 'trace-3' },
    }, 502)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({
        code: 'WEB_PROVIDER_ERROR',
        message: 'upstream unavailable Retry the search later. (trace trace-3)',
      })
  })

  it('keeps the gateway validation message without a retry hint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      error: { code: 'INVALID_QUERY', message: 'query must be 1–400 characters', retryable: false },
      meta: { traceId: 'trace-4' },
    }, 400)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR', message: 'query must be 1–400 characters (trace trace-4)' })
  })

  it('falls back to the status when the failure envelope omits usable fields', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      error: { code: '', message: '', retryable: 'yes' },
      meta: { traceId: '' },
    }, 500)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR', message: 'company search failed (HTTP 500)' })
  })

  it('tolerates an empty failure envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 500)))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR', message: 'company search failed (HTTP 500)' })
  })

  it('reports an abort while reading a failure body', async () => {
    const aborted = {
      ok: false,
      status: 502,
      json: () => Promise.reject(new DOMException('aborted', 'AbortError')),
    } as Response
    vi.stubGlobal('fetch', vi.fn(async () => aborted))

    await expect(provider().search({ query: 'q' })).rejects.toMatchObject({ code: 'WEB_ABORTED' })
  })

  it('keeps the HTTP status when the failure body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 })))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR', message: 'company search failed (HTTP 502) Retry the search later.' })
  })

  it('surfaces cancellation as an abort', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new DOMException('aborted', 'AbortError')
    }))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_ABORTED' })
  })

  it('surfaces a transport failure as a provider error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR' })
  })

  it('combines the caller signal with the configured budget', async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: { results: [] } }))
    vi.stubGlobal('fetch', fetchStub)
    const controller = new AbortController()

    await provider().search({ query: 'q' }, controller.signal)

    const [, init] = fetchStub.mock.calls[0] as unknown as [URL, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('reports an abort while reading a success body', async () => {
    const aborted = {
      ok: true,
      status: 200,
      json: () => Promise.reject(new DOMException('aborted', 'AbortError')),
    } as Response
    vi.stubGlobal('fetch', vi.fn(async () => aborted))

    await expect(provider().search({ query: 'q' })).rejects.toMatchObject({ code: 'WEB_ABORTED' })
  })

  it('surfaces an unprocessable success body as a provider error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))

    await expect(provider().search({ query: 'q' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR' })
  })
})

describe('company provider defaults', () => {
  it('allows the gateway 40s upstream budget before aborting', () => {
    expect(COMPANY_DEFAULT_TIMEOUT_MS).toBeGreaterThan(40_000)
  })
})
