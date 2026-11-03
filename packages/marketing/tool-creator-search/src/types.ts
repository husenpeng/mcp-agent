/**
 * Wire types for the company BFF's `/api/v1/creator-search/*` endpoints.
 *
 * The BFF keeps upstream field names inside `data` — snake_case for the group
 * (Blue/KOX) API and camelCase for YCP — so these types describe only the
 * envelope this client reads, never the vendor payloads.
 * @module @tomato/creator-search/types
 */

import type { JsonValue } from '@tomato/util-values'

/** Platforms the group (Blue/KOX) API accepts. */
export type CreatorPlatform = 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE'

/** Monthly group-API quota snapshot the BFF reports on a successful Blue call. */
export interface CreatorQuota {
  /** UTC month the snapshot counts, such as `2026-11`. */
  readonly month: string
  /** Calls the month allows. */
  readonly limit: number
  /** Calls already spent. */
  readonly used: number
  /** Calls still available. */
  readonly remaining: number
}

/** Meta fields of a successful `{data, meta}` envelope. */
export interface CreatorSuccessMeta {
  /** BFF trace id, quoted in diagnostics and support requests. */
  readonly traceId: string
  /** Envelope schema version the BFF answered with. */
  readonly schemaVersion: string
  /** Capability that answered. */
  readonly source: 'blue' | 'ycp'
  /** Quota snapshot; only Blue endpoints report one. */
  readonly quota?: CreatorQuota
}

/** `{data, meta}` body of a successful creator-search call. */
export interface CreatorSuccessEnvelope {
  /** Capability payload, passed through with its upstream field names. */
  readonly data: JsonValue
  readonly meta: CreatorSuccessMeta
}

/** `{error, meta}` body of a failed creator-search call. */
export interface CreatorErrorEnvelope {
  readonly error: {
    /** Stable BFF error code, such as `UNAUTHENTICATED` or `BLUE_QUOTA_EXCEEDED`. */
    readonly code: string
    /** Human-readable BFF message. */
    readonly message: string
    /** Whether the BFF considers the identical request worth retrying. */
    readonly retryable: boolean
  }
  readonly meta: {
    readonly traceId: string
  }
}

/** One successful creator-search call, as the tools return it. */
export interface CreatorSearchResult {
  /** Capability that answered. */
  readonly source: 'blue' | 'ycp'
  /** BFF trace id, quoted in diagnostics and support requests. */
  readonly traceId: string
  /** Capability payload, passed through with its upstream field names. */
  readonly data: JsonValue
  /** Quota snapshot; only Blue endpoints report one. */
  readonly quota?: CreatorQuota
}
