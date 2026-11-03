/**
 * Wire types for the company gateway's web search endpoint
 * (`POST /api/v1/search/web`). Types only — no runtime code.
 *
 * The endpoint is the company BFF: it holds the search vendor credential, so
 * this provider never sees a vendor key or vendor name. It authenticates with
 * the desktop's auth session and answers the same `{data, meta}` / `{error}`
 * envelope the company services use.
 *
 * @module @tomato/web-search-company/types
 */

/** Request body sent to the company search endpoint. */
export interface CompanySearchRequest {
  query: string
  /** Upper bound on returned results; the gateway clamps it to its own ceiling. */
  maxResults?: number
}

/** One entry of the normalized `data.results[]`. */
export interface CompanySearchResult {
  url?: string | null
  title?: string | null
  /**
   * Vendor excerpt. Tavily answers with page `content`, which is far longer
   * than a highlight; the tool's per-source cap bounds what reaches the model.
   */
  snippet?: string | null
  /** Provider-supplied ISO-8601 publication timestamp, when the vendor returns one. */
  publishedAt?: string | null
}

/** The gateway's success envelope. */
export interface CompanySearchResponse {
  data?: {
    results?: CompanySearchResult[] | null
    /** True when the gateway dropped results to honor the request bound. */
    truncated?: boolean | null
    /** Gateway-synthesized answer, when the deployment enables one. */
    answer?: unknown
  } | null
  /** Per-response identifiers and the budgets the gateway applied. */
  meta?: {
    traceId?: unknown
    schemaVersion?: unknown
    budget?: {
      maxCharsPerResult?: unknown
      maxChars?: unknown
    } | null
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
