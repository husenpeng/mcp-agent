/**
 * Wire types for the company BFF's web fetch endpoint
 * (`POST /api/v1/fetch/web`). Types only — no runtime code.
 *
 * The endpoint is the company BFF: it holds the fetch vendor credentials, so
 * this provider never sees a vendor key or vendor name. It authenticates with
 * the desktop's auth session and answers the same `{data, meta}` / `{error}`
 * envelope the company services use.
 *
 * @module @tomato/web-fetch-company/types
 */

/** The gateway's success envelope. */
export interface CompanyFetchResponse {
  data?: {
    /** Final URL after the gateway's own redirects. */
    url?: unknown
    /** Upstream HTTP status when the vendor reported one; the BFF fills 200 otherwise. */
    statusCode?: unknown
    /** `vendor` when {@link data.statusCode} came from the vendor, `assumed` otherwise. */
    statusCodeSource?: unknown
    /** Page title, when the vendor extracted one. */
    title?: unknown
    /** Extracted page body (markdown or plain text). */
    text?: unknown
    /** True when the gateway or the BFF capped {@link data.text}. */
    truncated?: unknown
  } | null
  /** Per-response identifiers. */
  meta?: {
    traceId?: unknown
    schemaVersion?: unknown
  } | null
}

/** The gateway's failure envelope (`{error:{code,message,retryable}}`). */
export interface CompanyErrorBody {
  error?: {
    code?: unknown
    message?: unknown
    /** Whether the gateway considers the same request worth retrying. */
    retryable?: unknown
  } | null
  /** Per-response identifiers used in support diagnostics. */
  meta?: {
    traceId?: unknown
  } | null
}
