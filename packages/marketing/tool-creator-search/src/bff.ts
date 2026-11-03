/**
 * Client for the company BFF's `/api/v1/creator-search/*` endpoints.
 *
 * The BFF owns the upstream vendor credentials (the group/Blue API and YCP) and
 * answers `{data, meta}` or `{error, meta}`. A caller sends only its request plus
 * the Desktop auth session: the BFF derives the identity from that session.
 *
 * A redirect is never followed: the request carries the user's session cookie,
 * and forwarding it to another origin would leak a credential.
 * @module @tomato/creator-search/bff
 */

import type { JsonValue } from '@tomato/util-values'
import type { CreatorPlatform, CreatorQuota, CreatorSearchResult } from './types.ts'

/** Endpoint paths appended to the configured BFF origin. */
export const CREATOR_SEARCH_PATHS = {
  /** Keyword search over the group (Blue/KOX) creator index. */
  blueSearch: '/api/v1/creator-search/blue/search',
  /** One creator's detail from the group API. */
  blueDetail: '/api/v1/creator-search/blue/detail',
  /** YCP public channel data, one channel per request. */
  ycpChannels: '/api/v1/creator-search/ycp/channels',
} as const

/** Cookie the company BFF reads for its own login sessions. */
export const CREATOR_SEARCH_SESSION_COOKIE = 'session_id'

/**
 * Default end-to-end budget for one creator-search request, in milliseconds.
 * The Blue search endpoint polls its upstream task for up to 45 seconds before
 * it answers, so the client budget leaves room for that whole chain.
 */
export const CREATOR_SEARCH_DEFAULT_TIMEOUT_MS = 60_000

/**
 * How one creator-search request failed, as far as a caller can act on it.
 * The tool layer turns each kind into model-facing guidance.
 */
export type CreatorSearchFailure =
  /** No BFF origin is configured for this profile. */
  | 'unconfigured'
  /** The BFF rejected the session; signing in again is the only fix. */
  | 'unauthenticated'
  /** The month's group-API quota is spent; retrying cannot help. */
  | 'quota'
  /** The BFF or its upstream rejected the request itself. */
  | 'rejected'
  /** A transient failure the identical request may survive. */
  | 'transient'

/** One failed creator-search request, carrying the category callers route on. */
export class CreatorSearchError extends Error {
  /**
   * @param failure - category the tool maps to its guidance.
   * @param message - model-facing explanation, including the BFF trace when known.
   * @param options - standard `Error` options; `cause` keeps the transport error.
   */
  constructor(
    readonly failure: CreatorSearchFailure,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'CreatorSearchError'
  }

  /** Whether repeating the identical request can succeed. */
  get retryable(): boolean {
    return this.failure === 'transient'
  }
}

/** One Blue keyword search. */
export interface BlueSearchRequest {
  /** Platform whose creator index to search. */
  readonly platform: CreatorPlatform
  /** Non-empty keyword phrase, at most 200 characters. */
  readonly query: string
  /** 1-based result page; omitted uses the BFF default of 1. */
  readonly page?: number
  /** Results per page, 1–50; omitted uses the BFF default of 20. */
  readonly pageSize?: number
}

/** One Blue creator detail read. */
export interface BlueDetailRequest {
  /** Platform that owns the identifier. */
  readonly platform: CreatorPlatform
  /** YouTube channel id (`UC…`) or a TikTok/Instagram handle. */
  readonly creatorId: string
}

/** One YCP channel read. */
export interface YcpChannelRequest {
  /** YouTube channel id (`UC…`) or `@handle`. */
  readonly channel: string
  /** BCP-47 language code for localized fields; omitted uses the BFF default. */
  readonly languageCode?: string
}

/** Resolved client options (the plugin's `apply` supplies environment and constant defaults). */
export interface CreatorSearchClientOptions {
  /** BFF origin such as `https://test.tomatoai.vip`; empty makes every call fail as unconfigured. */
  baseURL: string
  /** End-to-end budget for one request, in milliseconds. */
  timeoutMs: number
  /** Reads the current Desktop auth session; undefined when signed out. */
  sessionId(): string | undefined
}

/** Fields this client reads from a successful `{data, meta}` envelope. */
interface SuccessBody {
  readonly data: JsonValue
  readonly traceId: string
  readonly quota: CreatorQuota | undefined
}

/** Fields this client reads from a failed `{error, meta}` envelope. */
interface FailureBody {
  readonly status: number
  readonly code: string | undefined
  readonly message: string | undefined
  readonly retryable: boolean | undefined
  readonly traceId: string | undefined
}

/** The company-BFF creator-search client. */
export class CreatorSearchClient {
  /**
   * Last quota snapshot the BFF reported. A 429 quota answer carries no
   * snapshot of its own, so a spent quota is described from the last Blue call;
   * the snapshot stays stale until the next successful Blue answer replaces it.
   */
  private lastQuota: CreatorQuota | undefined

  constructor(private readonly options: CreatorSearchClientOptions) {}

  /**
   * Search one platform's creator index by keyword.
   * @param request - platform, keyword phrase, and optional paging.
   * @param signal - caller cancellation, combined with the configured budget.
   * @returns the group API payload under the BFF envelope.
   * @throws {CreatorSearchError} when the request cannot be made or fails.
   */
  searchBlue(request: BlueSearchRequest, signal?: AbortSignal): Promise<CreatorSearchResult> {
    return this.call('blue', CREATOR_SEARCH_PATHS.blueSearch, {
      method: 'POST',
      body: {
        platform: request.platform,
        query: request.query,
        ...request.page === undefined ? {} : { page: request.page },
        ...request.pageSize === undefined ? {} : { pageSize: request.pageSize },
      },
    }, signal)
  }

  /**
   * Read one creator's group-API detail.
   * @param request - platform and its creator identifier.
   * @param signal - caller cancellation, combined with the configured budget.
   * @returns the group API payload under the BFF envelope.
   * @throws {CreatorSearchError} when the request cannot be made or fails.
   */
  detailBlue(request: BlueDetailRequest, signal?: AbortSignal): Promise<CreatorSearchResult> {
    return this.call('blue', CREATOR_SEARCH_PATHS.blueDetail, {
      method: 'POST',
      body: { platform: request.platform, creatorId: request.creatorId },
    }, signal)
  }

  /**
   * Read one YouTube channel's YCP public data.
   * @param request - channel identifier and optional language code.
   * @param signal - caller cancellation, combined with the configured budget.
   * @returns the YCP payload under the BFF envelope.
   * @throws {CreatorSearchError} when the request cannot be made or fails.
   */
  ycpChannel(request: YcpChannelRequest, signal?: AbortSignal): Promise<CreatorSearchResult> {
    return this.call('ycp', `${CREATOR_SEARCH_PATHS.ycpChannels}/${encodeURIComponent(request.channel)}`, {
      method: 'GET',
      ...request.languageCode === undefined
        ? {}
        : { query: new URLSearchParams({ languageCode: request.languageCode }) },
    }, signal)
  }

  /**
   * Send one request and normalize its envelope.
   * @param source - capability that answers, recorded on the result.
   * @param path - BFF-relative endpoint path, already carrying path parameters.
   * @param request - method, optional JSON body, and optional query parameters.
   * @param signal - caller cancellation, combined with the configured budget.
   * @returns the normalized result.
   * @throws {CreatorSearchError} when the request cannot be made or fails.
   */
  private async call(
    source: 'blue' | 'ycp',
    path: string,
    request: { method: 'GET' | 'POST'; body?: Record<string, JsonValue>; query?: URLSearchParams },
    signal: AbortSignal | undefined,
  ): Promise<CreatorSearchResult> {
    const origin = this.options.baseURL
    if (origin === '') {
      throw new CreatorSearchError(
        'unconfigured',
        'Creator search has no BFF origin: set TOMATO_SEARCH_GATEWAY_URL (or TOMATO_WEB_URL) to the company BFF origin.',
      )
    }
    const sessionId = this.options.sessionId()
    if (sessionId === undefined) {
      throw new CreatorSearchError(
        'unauthenticated',
        'Creator search needs a signed-in BFF session. Sign in to Tomato and try again.',
      )
    }
    const url = new URL(path, origin)
    if (request.query !== undefined) url.search = request.query.toString()

    const budget = AbortSignal.timeout(this.options.timeoutMs)
    const combined = signal === undefined ? budget : AbortSignal.any([signal, budget])
    let response: Response
    try {
      response = await fetch(url, {
        method: request.method,
        redirect: 'error',
        headers: {
          'accept': 'application/json',
          'cookie': `${CREATOR_SEARCH_SESSION_COOKIE}=${sessionId}`,
          ...request.body === undefined ? {} : { 'content-type': 'application/json' },
        },
        ...request.body === undefined ? {} : { body: JSON.stringify(request.body) },
        signal: combined,
      })
    } catch (error: unknown) {
      throw this.transportError(error, signal)
    }

    if (!response.ok) throw failureError(await readFailure(response), this.lastQuota)
    let payload: unknown
    try {
      payload = await response.json()
    } catch (error: unknown) {
      if (isAbortError(error)) throw this.transportError(error, signal)
      throw new CreatorSearchError(
        'rejected',
        `The creator-search BFF returned an unreadable body (HTTP ${response.status}).`,
        { cause: error },
      )
    }
    const body = readSuccess(payload)
    if (body.quota !== undefined) this.lastQuota = body.quota
    return {
      source,
      traceId: body.traceId,
      data: body.data,
      ...body.quota === undefined ? {} : { quota: body.quota },
    }
  }

  /**
   * Classify a transport failure. A caller abort is not the deadline; a network
   * failure and an expired budget are both worth one more attempt.
   * @param error - the thrown fetch or body-read failure.
   * @param callerSignal - the caller's signal, or undefined when it supplied none.
   * @returns the typed failure to throw.
   */
  private transportError(error: unknown, callerSignal: AbortSignal | undefined): CreatorSearchError {
    if (callerSignal?.aborted === true) {
      return new CreatorSearchError('rejected', 'Creator search was cancelled.', { cause: error })
    }
    if (isAbortError(error)) {
      return new CreatorSearchError(
        'transient',
        `Creator search timed out after ${this.options.timeoutMs} ms. A slower search may still succeed.`,
        { cause: error },
      )
    }
    return new CreatorSearchError(
      'transient',
      `Creator search could not reach the BFF: ${describeError(error)}`,
      { cause: error },
    )
  }
}

/**
 * Read a successful envelope's fields.
 * @param payload - the parsed response body.
 * @returns the capability payload, trace id, and quota snapshot.
 * @throws {CreatorSearchError} when the body is not a readable `{data, meta}` envelope.
 */
function readSuccess(payload: unknown): SuccessBody {
  if (!isJsonObject(payload)) {
    throw new CreatorSearchError('rejected', 'The creator-search BFF returned a non-object body.')
  }
  const meta = payload.meta
  if (!isJsonObject(meta) || typeof meta.traceId !== 'string' || meta.traceId === '') {
    throw new CreatorSearchError('rejected', 'The creator-search BFF response carried no trace id.')
  }
  const data = payload.data
  if (data === undefined) {
    throw new CreatorSearchError(
      'rejected',
      `The creator-search BFF response carried no data (trace ${meta.traceId}).`,
    )
  }
  return { data, traceId: meta.traceId, quota: readQuota(meta.quota) }
}

/**
 * Read a failed response's status and `{error, meta}` envelope. A non-JSON body
 * is normal for a gateway 5xx: the status line still decides the category.
 * @param response - the non-2xx response.
 * @returns the fields the error mapping reads.
 */
async function readFailure(response: Response): Promise<FailureBody> {
  let envelope: unknown
  try {
    envelope = await response.json()
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new CreatorSearchError('rejected', 'Creator search was cancelled.', { cause: error })
    }
    envelope = undefined
  }
  const error = isJsonObject(envelope) ? envelope.error : undefined
  const meta = isJsonObject(envelope) ? envelope.meta : undefined
  return {
    status: response.status,
    code: isJsonObject(error) && typeof error.code === 'string' ? error.code : undefined,
    message: isJsonObject(error) && typeof error.message === 'string' ? error.message : undefined,
    retryable: isJsonObject(error) && typeof error.retryable === 'boolean' ? error.retryable : undefined,
    traceId: isJsonObject(meta) && typeof meta.traceId === 'string' ? meta.traceId : undefined,
  }
}

/**
 * Map one failed response to the category and model-facing guidance.
 * @param failure - the status and envelope fields read from the response.
 * @param quota - last quota snapshot the BFF reported, when this process saw one.
 * @returns the typed failure to throw.
 */
function failureError(failure: FailureBody, quota: CreatorQuota | undefined): CreatorSearchError {
  const trace = failure.traceId === undefined ? '' : ` (trace ${failure.traceId})`
  if (failure.status === 401 || failure.code === 'UNAUTHENTICATED') {
    return new CreatorSearchError(
      'unauthenticated',
      `Creator search needs a signed-in BFF session; sign in to Tomato and try again${trace}.`,
    )
  }
  if (failure.code === 'BLUE_QUOTA_EXCEEDED') {
    return new CreatorSearchError('quota', `The group API monthly quota is spent${quotaText(quota)}. Retrying cannot help until the quota resets${trace}.`)
  }
  const message = failure.message ?? `Creator search failed (HTTP ${failure.status}).`
  if (failure.retryable === true || failure.retryable === undefined && RETRYABLE_STATUSES.has(failure.status)) {
    return new CreatorSearchError('transient', `${message} Retry the identical request${trace}.`)
  }
  return new CreatorSearchError('rejected', `${message}${trace}`)
}

/** Statuses the BFF reports transiently when its own envelope is unreadable. */
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 502, 504])

/**
 * Describe a known quota snapshot, or an empty string when the process never saw one.
 * @param quota - last reported snapshot.
 * @returns the parenthetical used in the quota message.
 */
function quotaText(quota: CreatorQuota | undefined): string {
  if (quota === undefined) return ''
  return ` (${quota.used}/${quota.limit} used in ${quota.month}, ${quota.remaining} left)`
}

/**
 * Read the quota snapshot from a success envelope.
 * @param value - the `meta.quota` value.
 * @returns the snapshot, or undefined when absent or malformed.
 */
function readQuota(value: JsonValue | undefined): CreatorQuota | undefined {
  if (!isJsonObject(value)) return undefined
  const { month, limit, used, remaining } = value
  if (typeof month !== 'string' || typeof limit !== 'number' || typeof used !== 'number'
    || typeof remaining !== 'number') return undefined
  return { month, limit, used, remaining }
}

/**
 * Narrow a value to a JSON object.
 * @param value - candidate value.
 * @returns true when the value is a non-array JSON object.
 */
function isJsonObject(value: unknown): value is { readonly [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * True for a fetch or body-read abort.
 * @param error - candidate error.
 * @returns true when the error is an `AbortError`.
 */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Render an unknown transport error for a model-facing message.
 * @param error - the thrown value.
 * @returns its message, or its string form.
 */
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
