/**
 * Pure types of the memory-dream domain: worklist vocabulary, plan operations,
 * run records, and the cursor that tracks incremental progress.
 * @module @tomato/memory-dream/types
 */

import type { Branded } from '@tomato/branded'

/** Stable identity of one dream run. */
export type DreamRunId = Branded<'DreamRunId'>

/** One consolidation target: a group of records that may need merging or conflict resolution. */
export interface DreamTarget {
  /** Stable identity of this target across runs, derived from its member record ids. */
  readonly id: string
  /** Why this target was flagged. */
  readonly reason: 'duplicate-cluster' | 'identity-conflict' | 'stale-candidate' | 'pinned-over-budget' | 'repeated-fact'
  /** Record ids involved in this target. */
  readonly recordIds: readonly string[]
  /** Episode ids that provide evidence for this target. */
  readonly episodeIds: readonly string[]
  /** Human-readable summary of what needs consolidation. */
  readonly summary: string
}

/** One operation the model proposed in its consolidation plan. */
export type DreamPlanOp =
  | { readonly kind: 'merge'; readonly keepId: string; readonly dropIds: readonly string[]; readonly reason: string }
  | { readonly kind: 'proposal'; readonly targetId: string; readonly value: string; readonly reason: string; readonly evidence: readonly string[] }
  | {
    readonly kind: 'promote'
    readonly episodeIds: readonly string[]
    readonly entity: string
    readonly key: string
    readonly value: string
    readonly reason: string
  }
  | { readonly kind: 'pin'; readonly ids: readonly string[] }
  | { readonly kind: 'unpin'; readonly ids: readonly string[] }
  | { readonly kind: 'prune'; readonly ids: readonly string[] }

/** The model's complete consolidation plan, validated. */
export interface DreamPlan {
  readonly merges: readonly Extract<DreamPlanOp, { kind: 'merge' }>[]
  readonly proposals: readonly Extract<DreamPlanOp, { kind: 'proposal' }>[]
  readonly promotions: readonly Extract<DreamPlanOp, { kind: 'promote' }>[]
  readonly pins: readonly string[]
  readonly unpins: readonly string[]
  readonly prunes: readonly string[]
  readonly notes: readonly string[]
}

/** Result of applying one plan operation. */
export interface DreamOpResult {
  readonly op: DreamPlanOp
  readonly status: 'applied' | 'rejected' | 'failed'
  readonly detail?: string | undefined
}

/** Outcome of one dream run. */
export interface DreamOutcome {
  readonly status: 'completed' | 'empty-plan' | 'failed' | 'skipped'
  readonly reason?: string | undefined
  readonly chunksProcessed: number
  readonly chunksTotal: number
  readonly targetsCovered: number
  readonly targetsPending: number
  readonly opResults: readonly DreamOpResult[]
  /** Conclusions the model wrote for the person reading the run report. */
  readonly notes: readonly string[]
  readonly inputTokens: number
  readonly outputTokens: number
  readonly modelRoute: { readonly provider: string; readonly model: string }
}

/** Cursor tracking which chunk to process next. */
export interface DreamCursor {
  /** Index into the chunked worklist. */
  readonly index: number
  /** Digest of the worklist at the time the cursor was saved. */
  readonly targetDigest: string
  /** How many consecutive times the current chunk has been shrunk. */
  readonly shrinkStreak: number
  /** Timestamp of the last successful run. */
  readonly lastRunAt: number
  /** Watermark: episodes created before this time are not re-collected. */
  readonly watermark: number
}

/** One session's summary chain, assembled from its summary episodes. */
export interface SessionSummaryChain {
  readonly sessionId: string
  readonly summaries: readonly {
    readonly id: string
    readonly title: string
    readonly narrative: string
    readonly facts: readonly string[]
    readonly createdAt: number
  }[]
  readonly totalChars: number
}

/** One chunk of the worklist, sized to fit a single model call. */
export interface DreamChunk {
  readonly index: number
  readonly targets: readonly DreamTarget[]
  readonly estimatedTokens: number
}
