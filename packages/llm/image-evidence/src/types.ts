/**
 * Public contracts of the image-evidence bridge: engine routes, evidence
 * records, generation outcomes, and the session event the plugin appends.
 * @module @tomato/image-evidence/src/types
 */

import type { ContextFormed, ModelModality, TokenUsage } from '@tomato/llm'
import type { ImageEvidenceAttempt, ImageEvidenceRecord } from './spec.ts'

export type { ImageEvidenceAttempt, ImageEvidenceRecord } from './spec.ts'

/** One configured vision route: the provider and the model that reads images. */
export interface VisionEngineRef {
  /** Registered LLM provider route name. */
  readonly provider: string
  /** Model id within that route; it must accept image input. */
  readonly model: string
}

/**
 * The model asking for image bytes. `inputModalities` absent means unknown, and
 * unknown is never read as confirmed text-only.
 */
export interface ImageEvidenceModel {
  /** Registered provider route the conversation model runs on. */
  readonly provider: string
  /** Conversation model id. */
  readonly id: string
  /** Accepted request modalities declared by that route; omission is unknown. */
  readonly inputModalities?: readonly ModelModality[]
}

/** Result of one attachment's evidence resolution inside a step. */
export interface ImageEvidenceOutcome {
  /** Content-addressed attachment id the evidence belongs to. */
  readonly attachmentId: string
  /** The fresh or previously stored record; absent when every engine failed. */
  readonly record?: ImageEvidenceRecord
  /** Attempts performed by this call, in order; empty for a cache hit. */
  readonly attempts: readonly ImageEvidenceAttempt[]
  /** Whether the record came from storage instead of a new engine call. */
  readonly cached: boolean
  /** Whether the caller should append an `image/evidence` event for this outcome. */
  readonly log: boolean
  /** End-to-end generation time observed by this call; zero for a cache hit. */
  readonly durationMs: number
  /** Provider usage reported by the engine that produced the record; absent for a cache hit. */
  readonly usage?: TokenUsage
}

/** Durable record that one image was read by one engine under one contract version. */
export interface ImageEvidenceEventData {
  /** Content-addressed attachment id. */
  readonly attachmentId: string
  /** True when the record came from storage rather than a new engine call. */
  readonly cached: boolean
  /** Engine that produced the stored record. */
  readonly engine: VisionEngineRef
  /** Attempts observed while producing it; empty for a cache hit. */
  readonly attempts: readonly ImageEvidenceAttempt[]
  /** Whether the stored text was cut at the configured character cap. */
  readonly truncated: boolean
  /** End-to-end generation duration in milliseconds; zero for a cache hit. */
  readonly durationMs: number
  /** Provider usage reported by the engine; absent for a cache hit. */
  readonly usage?: TokenUsage
}

declare module '@tomato/llm' {
  interface MessageSourceMap {
    /** One hand-built auxiliary request issued by this bridge. */
    '@tomato/image-evidence': { kind: '@tomato/image-evidence' } & ContextFormed
  }
}

declare module '@tomato/session/types' {
  interface SessionEventMap {
    /**
     * One image's evidence was produced or first reused in this session.
     * @mode durable
     */
    'image/evidence': ImageEvidenceEventData
  }
}
