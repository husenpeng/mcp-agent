import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebError } from '@tomato/web'
import {
  COMPANY_DEFAULT_TIMEOUT_MS,
  COMPANY_URL_MAX_CHARS,
  CompanyFetchProvider,
  mapCompanyFetchResponse,
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

function provider(sessionId: () => string | undefined = () => 'session-1'): CompanyFetchProvider {
  return new CompanyFetchProvider({ baseURL: 'https://bff.test', timeoutMs: 8000, sessionId })
}

describe('company fetch response mapping', () => {
  it('maps a complete envelope', () => {
    expect(mapCompanyFetchResponse({
      data: {
        url: 'https://a.test/final',
        statusCode: 204,
        statusCodeSource: 'vendor',
        title: 'A',
        text: '# Body',
        truncated: true,
      },
    }, 'https://a.test/page')).toEqual({
      url: 'https://a.test/final',
      statusCode: 204,
      body: { kind: 'text', content: '# Body' },
      truncated: true,
    })
  })

  it('falls back to the request URL and 200 when the envelope omits them', () => {
    expect(mapCompanyFetchResponse({ data: { text: 'body' } }, 'https://a.test/page')).toEqual({
      url: 'https://a.test/page',
      statusCode: 200,
      body: { kind: 'text', content: 'body' },
      truncated: false,
    })
  })

  it('ignores a non-integer status code', () => {
    expect(mapCompanyFetchResponse({ data: { text: 'body', statusCode: '201' } }, 'https://a.test').statusCode).toBe(200)
  })

  it('rejects an envelope without page text', () => {
    expect(() => mapCompanyFetchResponse({ data: { url: 'https://a.test' } }, 'https://a.test'))
      .toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
    expect(() => mapCompanyFetchResponse({}, 'https://a.test')).toThrow(WebError)
  })
})

describe('company fetch provider availability', () => {
  it('is available only with a parseable origin and a positive budget', () => {
    expect(provider().available()).toBe(true)
    expect(new CompanyFetchProvider({ baseURL: '', timeoutMs: 8000, sessionId: () => 's' }).available()).toBe(false)
    expect(new CompanyFetchProvider({ baseURL: 'not a url', timeoutMs: 8000, sessionId: () => 's' }).available()).toBe(false)
    expect(new CompanyFetchProvider({ baseURL: 'https://bff.test', timeoutMs: 0, sessionId: () => 's' }).available()).toBe(false)
  })

  it('publishes the documented default budget', () => {
    expect(COMPANY_DEFAULT_TIMEOUT_MS).toBeGreaterThan(45_000)
  })
})

describe('company fetch provider requests', () => {
  it('rejects an invalid URL before any request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(provider().fetch({ url: 'file:///etc/passwd' })).rejects.toMatchObject({ code: 'WEB_INVALID_URL' })
    await expect(provider().fetch({ url: '   ' })).rejects.toMatchObject({ code: 'WEB_INVALID_URL' })
    await expect(provider().fetch({ url: `https://a.test/${'x'.repeat(COMPANY_URL_MAX_CHARS)}` }))
      .rejects.toMatchObject({ code: 'WEB_INVALID_URL' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a signed-out fetch before any request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(provider(() => undefined).fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the session cookie and maps the page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: { url: 'https://a.test/page', statusCode: 200, text: '# Body', truncated: false },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await provider().fetch({ url: 'https://a.test/page' })
    expect(result).toEqual({
      url: 'https://a.test/page',
      statusCode: 200,
      body: { kind: 'text', content: '# Body' },
      truncated: false,
    })
    const [target, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(String(target)).toBe('https://bff.test/api/v1/fetch/web')
    expect(init.method).toBe('POST')
    expect(init.redirect).toBe('error')
    expect((init.headers as Record<string, string>).cookie).toBe('session_id=session-1')
    expect(bodyOf(init)).toEqual({ url: 'https://a.test/page' })
  })

  it('maps an expired session to a credential error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'UNAUTHENTICATED' } }, 401)))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
  })

  it('maps a rate-limited gateway response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'RATE_LIMITED' } }, 429)))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_RATE_LIMITED' })
  })

  it('maps a deployment quota rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: 'GATEWAY_QUOTA_EXCEEDED', message: 'Daily fetch quota exhausted', retryable: false } }, 429),
    ))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_RATE_LIMITED', message: expect.stringContaining('quota') })
  })

  it('maps an invalid-URL rejection from the gateway', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'INVALID_URL' } }, 400)))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_INVALID_URL' })
  })

  it('keeps the status line when the failure body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 })))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR', message: expect.stringContaining('HTTP 502') })
  })

  it('maps a transport abort to WEB_ABORTED', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_ABORTED' })
  })

  it('maps another transport failure to a provider error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR' })
  })

  it('maps an unparseable success body to a provider error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })))
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR' })
  })
})

describe('company fetch provider redirect policy', () => {
  it('refuses a redirect instead of following it to another origin', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'https://elsewhere.test/page' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await expect(provider().fetch({ url: 'https://a.test/page' }))
      .rejects.toMatchObject({ code: 'WEB_PROVIDER_ERROR' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(init.redirect).toBe('error')
  })
})
