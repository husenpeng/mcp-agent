/**
 * `CompanySearchProvider`: a `WebSearchProvider` backed by the company BFF's
 * `POST /api/v1/search/web`. The gateway owns the search vendor and its
 * credential, so this provider sends only the query plus the desktop's auth
 * session and maps the normalized `data.results[]` to the seam's sources.
 *
 * A redirect is never followed: the request carries the user's session cookie,
 * and forwarding it to another origin would leak a credential.
 * @module @tomato/web-search-company/provider
 */

import { WebError } from '@tomato/web'
import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@tomato/web'
import type { CompanyErrorBody, CompanySearchResponse, CompanySearchResult } from './types.ts'

/** Stable id this provider registers under. */
export const COMPANY_PROVIDER_ID = 'company'

/** Endpoint path appended to the configured gateway origin. */
export const COMPANY_SEARCH_PATH = '/api/v1/search/web'

/**
 * Default end-to-end budget for one gateway search. Above the gateway's own
 * 40-second upstream budget (a tavily→google fallback chain), so a slow but
 * successful search is not aborted before the gateway answers.
 */
export const COMPANY_DEFAULT_TIMEOUT_MS = 45_000

/** Longest query the gateway accepts, in characters. */
export const COMPANY_QUERY_MAX_CHARS = 400

/** Most results the gateway returns per search, regardless of the request bound. */
export const COMPANY_MAX_RESULTS = 20

/** Default per-result excerpt budget sent to the gateway, in characters. */
export const COMPANY_DEFAULT_MAX_CHARS_PER_RESULT = 500

/** Default total excerpt budget sent to the gateway, in characters. */
export const COMPANY_DEFAULT_MAX_CHARS = 3_000

/** Largest per-result excerpt budget the gateway accepts, in characters. */
export const COMPANY_MAX_CHARS_PER_RESULT = 2_000

/** Largest total excerpt budget the gateway accepts, in characters. */
export const COMPANY_MAX_CHARS = 20_000

/** Cookie the company BFF reads for its own login sessions. */
export const COMPANY_SESSION_COOKIE = 'session_id'

/** Attribution header sent on every request. */
const USER_AGENT = 'deepseek-harness/0.0.1'

/** Resolved provider options (the plugin's `apply` supplies env-var and constant defaults). */
export interface CompanySearchProviderOptions {
  /** Gateway origin, such as `https://test.tomatoai.vip`. Empty makes the provider unavailable. */
  baseURL: string
  /** End-to-end budget for one request, in milliseconds. */
  timeoutMs: number
  /** Default result bound when a request carries no `maxResults`. Omitted = gateway default (10). */
  maxResults?: number
  /** Per-result excerpt budget forwarded to the gateway, in characters. Omitted = gateway default. */
  maxCharsPerResult?: number
  /** Total excerpt budget forwarded to the gateway, in characters. Omitted = gateway default. */
  maxChars?: number
  /** Reads the current desktop auth session; undefined when signed out. */
  sessionId(): string | undefined
}

/**
 * Map one gateway result to a normalized source, or `undefined` when it has no
 * usable URL (the seam's portable shape requires one).
 *
 * @param result - one entry of `data.results[]`.
 * @returns the normalized source, or `undefined` for an entry without a URL.
 */
export function mapCompanyResult(result: CompanySearchResult): WebSearchSource | undefined {
  const url = typeof result.url === 'string' ? result.url.trim() : ''
  if (url === '') return undefined
  const title = typeof result.title === 'string' ? result.title.trim() : ''
  const snippet = typeof result.snippet === 'string' ? result.snippet.trim() : ''
  const publishedAt = typeof result.publishedAt === 'string' ? result.publishedAt.trim() : ''
  return {
    url,
    ...title === '' ? {} : { title },
    ...snippet === '' ? {} : { snippet },
    ...publishedAt === '' ? {} : { publishedAt },
  }
}

/**
 * Map a gateway success envelope to a normalized search result.
 *
 * @param response - the parsed `POST /api/v1/search/web` body.
 * @returns the normalized result, carrying the gateway's own `truncated` flag;
 *   the seam enforces the request's `maxResults` on top of it.
 */
export function mapCompanyResponse(response: CompanySearchResponse): WebSearchResult {
  const results = response.data?.results ?? []
  const sources = results
    .map(mapCompanyResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  const answer = typeof response.data?.answer === 'string' ? response.data.answer.trim() : ''
  // The gateway owns the bound it applied before answering; the seam still
  // enforces the request's own bound on top of it.
  return {
    ...answer === '' ? {} : { content: answer },
    sources,
    truncated: response.data?.truncated === true,
  }
}

/** The company-gateway search provider. */
export class CompanySearchProvider implements WebSearchProvider {
  readonly id = COMPANY_PROVIDER_ID

  constructor(private readonly options: CompanySearchProviderOptions) {}

  /**
   * Whether the provider can serve a search at all: a parseable gateway origin,
   * a positive budget, and an acceptable result bound. The signed-in session is
   * a per-request credential, so the plugin's `ready()` reports it instead.
   * @returns true when the static configuration can be used.
   */
  available(): boolean {
    return isValidBaseUrl(this.options.baseURL)
      && Number.isSafeInteger(this.options.timeoutMs)
      && this.options.timeoutMs > 0
      && isResultBound(this.options.maxResults)
      && isBudget(this.options.maxCharsPerResult, COMPANY_MAX_CHARS_PER_RESULT)
      && isBudget(this.options.maxChars, COMPANY_MAX_CHARS)
  }

  /**
   * Run one gateway search.
   * @param request - the seam's search request; `query` must fit the gateway's character ceiling.
   * @param signal - caller cancellation, combined with the configured budget.
   * @returns the normalized sources, marked truncated when either result bound cut them.
   */
  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const query = request.query.trim()
    if (query.length === 0 || query.length > COMPANY_QUERY_MAX_CHARS) {
      throw new WebError(
        `company search query must be 1–${COMPANY_QUERY_MAX_CHARS} characters`,
        'WEB_PROVIDER_ERROR',
      )
    }
    const sessionId = this.options.sessionId() ?? ''
    if (sessionId === '') {
      throw new WebError(
        'company search needs a signed-in desktop session; sign in and try again',
        'WEB_PROVIDER_CREDENTIAL_MISSING',
      )
    }
    const configuredBound = request.maxResults ?? this.options.maxResults
    const maxResults = configuredBound === undefined ? undefined : Math.min(configuredBound, COMPANY_MAX_RESULTS)
    const boundTruncated = configuredBound !== undefined && configuredBound > COMPANY_MAX_RESULTS
    const budget = AbortSignal.timeout(this.options.timeoutMs)
    let response: Response
    try {
      response = await fetch(new URL(COMPANY_SEARCH_PATH, this.options.baseURL), {
        method: 'POST',
        redirect: 'error',
        headers: {
          'cookie': `${COMPANY_SESSION_COOKIE}=${sessionId}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({
          query,
          ...maxResults === undefined ? {} : { maxResults },
          ...this.options.maxCharsPerResult === undefined ? {} : { maxCharsPerResult: this.options.maxCharsPerResult },
          ...this.options.maxChars === undefined ? {} : { maxChars: this.options.maxChars },
        }),
        signal: signal === undefined ? budget : AbortSignal.any([signal, budget]),
      })
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw new WebError('company search aborted', 'WEB_ABORTED', { cause: error })
      }
      throw new WebError(`company search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }

    if (!response.ok) {
      const failure = await this.readFailure(response)
      if (failure.status === 401 || failure.code === 'UNAUTHENTICATED') {
        throw new WebError(
          `company search: the desktop session is no longer valid; sign in again${traceSuffix(failure)}`,
          'WEB_PROVIDER_CREDENTIAL_MISSING',
        )
      }
      throw failureError(failure)
    }

    try {
      const payload = await response.json() as CompanySearchResponse
      const result = mapCompanyResponse(payload)
      return boundTruncated && !result.truncated ? { ...result, truncated: true } : result
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw new WebError('company search aborted', 'WEB_ABORTED', { cause: error })
      }
      throw new WebError(`company search returned an unprocessable body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
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
      if (isAbortError(error)) throw new WebError('company search aborted', 'WEB_ABORTED', { cause: error })
      // Otherwise the status is already authoritative; a malformed body can only
      // cost a richer provider message, never the real failure.
    }
    return {
      status,
      code,
      message: message ?? `company search failed (HTTP ${status})`,
      retryable: retryable ?? RETRYABLE_STATUSES.has(status),
      traceId,
    }
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
  const retry = failure.retryable ? ' Retry the search later.' : ''
  switch (failure.code) {
    case 'SEARCH_DISABLED':
      return new WebError(`${failure.message}${trace}`, 'WEB_SEARCH_DISABLED')
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

/** True for a result bound that can be sent to the gateway. */
function isResultBound(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 1 && value <= COMPANY_MAX_RESULTS)
}

/** True for an optional excerpt budget the gateway accepts. */
function isBudget(value: number | undefined, ceiling: number): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 1 && value <= ceiling)
}

/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
