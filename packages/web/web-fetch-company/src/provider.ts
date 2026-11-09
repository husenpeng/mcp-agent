/**
 * `CompanyFetchProvider`: a `WebFetchProvider` backed by the company BFF's
 * `POST /api/v1/fetch/web`. The gateway fetches the page and extracts its body,
 * so this provider sends only the URL plus the desktop's auth session and maps
 * the normalized `data` envelope to the seam's result.
 *
 * The seam's `WebFetchResult.statusCode` has no "unknown" arm, while the
 * gateway's vendor path (tavily extract) does not report one. The provider
 * forwards what the gateway sends and the BFF marks its own fallback as
 * `statusCodeSource: 'assumed'`; callers must not read that number as an
 * observed upstream response.
 *
 * A redirect is never followed: the request carries the user's session cookie,
 * and forwarding it to another origin would leak a credential.
 * @module @tomato/web-fetch-company/provider
 */

import { WebError } from '@tomato/web'
import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@tomato/web'
import type { CompanyErrorBody, CompanyFetchResponse } from './types.ts'

/** Stable id this provider registers under. */
export const COMPANY_PROVIDER_ID = 'company'

/** Endpoint path appended to the configured gateway origin. */
export const COMPANY_FETCH_PATH = '/api/v1/fetch/web'

/** Cookie carrying the desktop auth session. */
export const COMPANY_SESSION_COOKIE = 'session_id'

/**
 * Default end-to-end budget for one gateway fetch. Above the gateway's own
 * 45-second budget (a firecrawl 202 poll chain plus a tavily fallback), so a
 * slow but successful fetch is not aborted before the gateway answers.
 */
export const COMPANY_DEFAULT_TIMEOUT_MS = 50_000

/** Longest URL the gateway accepts, in characters. */
export const COMPANY_URL_MAX_CHARS = 4096

/** Attribution header sent on every request. */
const USER_AGENT = 'deepseek-harness/0.0.1'

/** Resolved provider options (the plugin's `apply` supplies env-var and constant defaults). */
export interface CompanyFetchProviderOptions {
  /** Gateway origin, such as `https://test.tomatoai.vip`. Empty makes the provider unavailable. */
  baseURL: string
  /** End-to-end budget for one request, in milliseconds. */
  timeoutMs: number
  /** Reads the current desktop auth session; undefined when signed out. */
  sessionId(): string | undefined
}

/**
 * Map a gateway success envelope to a normalized fetch result.
 *
 * @param response - the parsed `POST /api/v1/fetch/web` body.
 * @param requestUrl - the URL the seam asked for, used when the envelope omits one.
 * @returns the normalized result; the body is always the `text` arm because the
 *   gateway extracts the page before answering.
 * @throws {WebError} `WEB_PROVIDER_ERROR` when the envelope carries no body text.
 */
export function mapCompanyFetchResponse(response: CompanyFetchResponse, requestUrl: string): WebFetchResult {
  const data = response.data
  const text = typeof data?.text === 'string' ? data.text : ''
  if (text === '') {
    throw new WebError('company fetch returned no page text', 'WEB_PROVIDER_ERROR')
  }
  const finalUrl = typeof data?.url === 'string' && data.url.trim() !== '' ? data.url.trim() : requestUrl
  const reported = data?.statusCode
  const statusCode = typeof reported === 'number' && Number.isInteger(reported) ? reported : 200
  return {
    url: finalUrl,
    statusCode,
    body: { kind: 'text', content: text },
    truncated: data?.truncated === true,
  }
}

/** One failed gateway response, read from its status line and failure envelope. */
interface CompanyFailure {
  /** HTTP status. */
  readonly status: number
  /** Stable gateway error code, when the body carried one. */
  readonly code: string | undefined
  /** Human-readable gateway message, falling back to the status line. */
  readonly message: string
  /** Whether the gateway says the same request is worth retrying. */
  readonly retryable: boolean
  /** Gateway trace id, when the body carried one. */
  readonly traceId: string | undefined
}

/** Statuses the gateway may report transiently when its own envelope is unreadable. */
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 502, 504])

/** Support-diagnostics suffix naming the gateway trace, empty when absent. */
function traceSuffix(failure: CompanyFailure): string {
  return failure.traceId === undefined ? '' : ` (trace ${failure.traceId})`
}

/**
 * Map one gateway failure to the structured error the seam and the model read.
 * @param failure - the status and envelope fields read from the response.
 * @returns the error carrying the gateway code's meaning.
 */
function failureError(failure: CompanyFailure): WebError {
  const trace = traceSuffix(failure)
  const retry = failure.retryable ? ' Retry the fetch later.' : ''
  switch (failure.code) {
    case 'FETCH_DISABLED':
      return new WebError(`${failure.message}${trace}`, 'WEB_PROVIDER_UNAVAILABLE')
    case 'INVALID_URL':
      return new WebError(`${failure.message}${trace}`, 'WEB_INVALID_URL')
    case 'GATEWAY_QUOTA_EXCEEDED':
      // The deployment's own daily guard, shared with search, not a vendor limit:
      // retrying today will not help.
      return new WebError(`${failure.message}${trace}`, 'WEB_PROVIDER_RATE_LIMITED')
    case 'RATE_LIMITED':
      return new WebError(`${failure.message}${retry}${trace}`, 'WEB_PROVIDER_RATE_LIMITED')
    case 'UPSTREAM_TIMEOUT':
      return new WebError(`${failure.message}${retry}${trace}`, 'WEB_PROVIDER_TIMEOUT')
    default:
      return new WebError(`${failure.message}${retry}${trace}`, 'WEB_PROVIDER_ERROR')
  }
}

/** True when `baseURL` parses as an absolute URL (a cheap local config check). */
function isValidBaseUrl(baseURL: string): boolean {
  return baseURL !== '' && URL.canParse(baseURL)
}

/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Validate the seam's request URL before it reaches the gateway.
 * @param input - the URL from `WebFetchRequest`.
 * @returns the parsed URL.
 * @throws {WebError} `WEB_INVALID_URL` for an empty, over-long, unparseable, or
 *   non-HTTP(S) URL.
 */
function parseRequestUrl(input: string): URL {
  const url = input.trim()
  if (url === '' || url.length > COMPANY_URL_MAX_CHARS) {
    throw new WebError(`company fetch url must be 1–${COMPANY_URL_MAX_CHARS} characters`, 'WEB_INVALID_URL')
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (error: unknown) {
    throw new WebError('company fetch url must be an absolute URL', 'WEB_INVALID_URL', { cause: error })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new WebError('company fetch url must use http or https', 'WEB_INVALID_URL')
  }
  return parsed
}

/** The company-gateway fetch provider. */
export class CompanyFetchProvider implements WebFetchProvider {
  readonly id = COMPANY_PROVIDER_ID

  constructor(private readonly options: CompanyFetchProviderOptions) {}

  /**
   * Whether the provider can serve a fetch at all: a parseable gateway origin
   * and a positive budget. The signed-in session is a per-request credential,
   * so the plugin's `ready()` reports it instead.
   * @returns true when the static configuration can be used.
   */
  available(): boolean {
    return isValidBaseUrl(this.options.baseURL)
      && Number.isSafeInteger(this.options.timeoutMs)
      && this.options.timeoutMs > 0
  }

  /**
   * Run one gateway fetch.
   * @param request - the seam's fetch request; its `url` must be an HTTP(S) address.
   * @param signal - caller cancellation, combined with the configured budget.
   * @returns the normalized result, with the gateway's truncation flag preserved.
   */
  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    const url = parseRequestUrl(request.url)
    const sessionId = this.options.sessionId() ?? ''
    if (sessionId === '') {
      throw new WebError(
        'company fetch needs a signed-in desktop session; sign in and try again',
        'WEB_PROVIDER_CREDENTIAL_MISSING',
      )
    }
    const budget = AbortSignal.timeout(this.options.timeoutMs)
    let response: Response
    try {
      response = await fetch(new URL(COMPANY_FETCH_PATH, this.options.baseURL), {
        method: 'POST',
        redirect: 'error',
        headers: {
          'cookie': `${COMPANY_SESSION_COOKIE}=${sessionId}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({ url: url.toString() }),
        signal: signal === undefined ? budget : AbortSignal.any([signal, budget]),
      })
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw new WebError('company fetch aborted', 'WEB_ABORTED', { cause: error })
      }
      throw new WebError(`company fetch request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }

    if (!response.ok) {
      const failure = await this.readFailure(response)
      if (failure.status === 401 || failure.code === 'UNAUTHENTICATED') {
        throw new WebError(
          `company fetch: the desktop session is no longer valid; sign in again${traceSuffix(failure)}`,
          'WEB_PROVIDER_CREDENTIAL_MISSING',
        )
      }
      throw failureError(failure)
    }

    try {
      const payload = await response.json() as CompanyFetchResponse
      return mapCompanyFetchResponse(payload, url.toString())
    } catch (error: unknown) {
      if (error instanceof WebError) throw error
      if (isAbortError(error)) {
        throw new WebError('company fetch aborted', 'WEB_ABORTED', { cause: error })
      }
      throw new WebError(`company fetch returned an unprocessable body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
  }

  /**
   * Read one failed response's status and `{error, meta}` envelope. A non-JSON
   * body is normal for a gateway 5xx: the status line still decides the code.
   * @param response - the non-2xx response.
   * @returns the fields the error mapping reads.
   */
  private async readFailure(response: Response): Promise<CompanyFailure> {
    const status = response.status
    let code: string | undefined
    let message: string | undefined
    let retryable: boolean | undefined
    let traceId: string | undefined
    try {
      const payload = await response.json() as CompanyErrorBody
      if (typeof payload.error?.code === 'string' && payload.error.code.trim() !== '') code = payload.error.code.trim()
      if (typeof payload.error?.message === 'string' && payload.error.message.trim() !== '') message = payload.error.message.trim()
      if (typeof payload.error?.retryable === 'boolean') retryable = payload.error.retryable
      if (typeof payload.meta?.traceId === 'string' && payload.meta.traceId.trim() !== '') traceId = payload.meta.traceId.trim()
    } catch (error: unknown) {
      if (isAbortError(error)) throw new WebError('company fetch aborted', 'WEB_ABORTED', { cause: error })
      // Otherwise the status is already authoritative; a malformed body can only
      // cost a richer provider message, never the real failure.
    }
    return {
      status,
      code,
      message: message ?? `company fetch failed (HTTP ${status})`,
      retryable: retryable ?? RETRYABLE_STATUSES.has(status),
      traceId,
    }
  }
}
