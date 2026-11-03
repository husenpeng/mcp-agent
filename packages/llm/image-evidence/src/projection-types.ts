/**
 * Pure-type outlet of the image-evidence projection: the client-visible
 * `imageEvidence` entries and their `SessionProjectionMap` membership, with no
 * runtime imports so a browser bundle can name them through
 * `@tomato/image-evidence/types` instead of the host package root.
 *
 * @module @tomato/image-evidence/types
 */

import type { SessionProjectionSummaryExcluded } from '@tomato/session-projection/types'

/** One image's evidence as the client reads it. */
export interface ImageEvidenceProjectionEntry {
  /** Engine that produced the evidence; on failure, the route tried first. */
  readonly engine: {
    /** Registered LLM provider route the engine ran on. */
    readonly provider: string
    /** Engine model id within that route. */
    readonly model: string
  }
  /** Attempts this read performed, in order; `0` for a record reused from storage. */
  readonly attempts: number
  /** Whether every attempt failed, so the request kept the text-only placeholder. */
  readonly failed: boolean
  /** Whether the stored text was cut at the configured character cap. */
  readonly truncated: boolean
  /** Whether the record came from storage instead of a new engine call. */
  readonly cached: boolean
  /** End-to-end generation time in milliseconds; `0` for a reused record. */
  readonly durationMs: number
}

/**
 * Evidence by attachment id. Entries outlive the transcript row that carried
 * the image, so a card can report a read the agent's answer no longer shows.
 */
export type ImageEvidenceProjection = Record<string, ImageEvidenceProjectionEntry>

declare module '@tomato/session-projection/types' {
  interface SessionProjectionMap {
    /**
     * Evidence for images this Session read, keyed by attachment id. Excluded
     * from Session summaries: the entry describes one image and is only read
     * inside an opened Session, while a list row would carry engine names and
     * timings nothing renders.
     */
    imageEvidence: SessionProjectionSummaryExcluded<ImageEvidenceProjection>
  }
}
