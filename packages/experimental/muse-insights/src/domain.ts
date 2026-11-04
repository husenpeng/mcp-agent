/**
 * Durable `tomato_muse_insights` records: one retained recap per owner and
 * local day, plus each owner's latest unfinished-task analysis.
 *
 * The exact auxiliary model exchange rides its recap, so the model-visible
 * input stays reconstructable without a Session it does not belong to. Domain
 * keys repeat the logical identity (`<owner>|<day>` and `<owner>`) and opening
 * rejects a record whose key disagrees.
 * @module @tomato/experimental-muse-insights/domain
 */

import { z } from 'zod'
import type { DomainSpec, DomainTableSpec } from '@tomato/storage-domain'
import type { DailyRecap, RecapWorkItem, RecapWorkStatus, UnfinishedAnalysis } from './types.ts'

/** One exact auxiliary model request and the text it returned. */
export interface RecapModelExchange {
  /** Registered provider route that served the request. */
  readonly provider: string
  /** Provider model id that served the request. */
  readonly model: string
  /** Exact system instruction. */
  readonly system: string
  /** Exact user input. */
  readonly input: string
  /** Output-token cap passed to the route. */
  readonly maxTokens: number
  /** Complete text blocks of the accepted response, in order. */
  readonly response: string
}

const modelExchangeSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  system: z.string(),
  input: z.string(),
  maxTokens: z.number().int().positive(),
  response: z.string(),
}).strict()

/** A work item stored before items carried a problem, conclusion, and Sessions. */
export interface LegacyRecapWorkItem {
  /** Short line naming what the person worked on. */
  readonly title: string
  /** One outcome, blocker, or next step, or the deterministic Session excerpt. */
  readonly detail: string
  /** Whether the work finished, continued, or stopped on a blocker. */
  readonly status: RecapWorkStatus
}

/** Work items of any retained stored format. */
export type StoredRecapWorkItem = RecapWorkItem | LegacyRecapWorkItem

/** One retained recap as stored, before a legacy item becomes the served shape. */
export interface StoredDailyRecap extends Omit<DailyRecap, 'workItems'> {
  /** Work items in any retained stored format. */
  readonly workItems: readonly StoredRecapWorkItem[]
}

const legacyWorkItemSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(1_000),
  status: z.enum(['done', 'ongoing', 'blocked', 'unknown']),
}).strict()

const currentWorkItemSchema = z.object({
  problem: z.string().min(1).max(200),
  conclusion: z.string().max(500),
  solution: z.string().max(2_000),
  status: z.enum(['done', 'ongoing', 'blocked', 'unknown']),
  sessionIds: z.array(z.string().min(1)).max(20),
}).strict()

const workItemSchema = z.union([currentWorkItemSchema, legacyWorkItemSchema])

const recapSessionSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().max(500),
  summary: z.string().max(1_000),
  messageCount: z.number().int().nonnegative(),
}).strict()

const dailyRecapSchema: z.ZodType<StoredDailyRecap> = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  generatedAt: z.number().int().nonnegative(),
  source: z.enum(['model', 'local']),
  headline: z.string().max(200),
  summary: z.string().max(2_000),
  workItems: z.array(workItemSchema).max(12),
  openTasks: z.array(z.string().min(1).max(500)).max(20),
  sessions: z.array(recapSessionSchema).max(200),
  messageCount: z.number().int().nonnegative(),
}).strict()

/** One owner's retained recap and the source cut it summarized. */
export interface StoredRecap {
  /** Resolved owner identity. */
  readonly owner: string
  /** The retained recap, whose work items may still be in an earlier stored format. */
  readonly recap: StoredDailyRecap
  /** Latest source event time represented by this recap. */
  readonly latestEventTime: number
  /** Present only when a model wrote the narrative fields. */
  readonly model?: RecapModelExchange | undefined
}

/** One owner's latest periodic unfinished-task analysis. */
export interface StoredAnalysis {
  /** Resolved owner identity. */
  readonly owner: string
  /** The retained analysis. */
  readonly analysis: UnfinishedAnalysis
}

/** Schema of one retained recap. */
export const storedRecapSchema: z.ZodType<StoredRecap> = z.object({
  owner: z.string().min(1),
  recap: dailyRecapSchema,
  /** Latest source event time represented by this recap. */
  latestEventTime: z.number().int().nonnegative(),
  /** Present only when a model wrote the narrative fields. */
  model: modelExchangeSchema.optional(),
}).strict()

/** Schema of one retained unfinished-task analysis. */
export const storedAnalysisSchema: z.ZodType<StoredAnalysis> = z.object({
  owner: z.string().min(1),
  analysis: z.object({
    analyzedAt: z.number().int().nonnegative(),
    tasks: z.array(z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(500),
      detail: z.string().max(1_000),
      status: z.enum(['pending', 'in_progress']),
      source: z.enum(['todo', 'recap']),
      sessionId: z.string().min(1).nullable(),
      sessionTitle: z.string().max(500).nullable(),
    }).strict()).max(200),
  }).strict(),
}).strict()

const recapTable: DomainTableSpec<string, StoredRecap> = { valueSchema: storedRecapSchema }
const analysisTable: DomainTableSpec<string, StoredAnalysis> = { valueSchema: storedAnalysisSchema }

/**
 * Authoritative Muse insights storage. Declared as a spec object rather than
 * through `defineDomain` because this package also has a browser half: a Host
 * value import from `storage-domain` would require a dependency-policy
 * exception. The identifiers are static, and `open` validates the descriptor.
 */
export const museInsightsDomain = {
  name: 'tomato_muse_insights',
  // Version 1 holds both work-item forms; the single layout rejects a version
  // bump without an on-disk migration, so the reader stays on version 1.
  version: 1,
  tables: { recaps: recapTable, analyses: analysisTable },
} satisfies DomainSpec

/**
 * Convert one stored recap to the served shape, restating a legacy work item's
 * single text as its problem and solution.
 * @param recap - the retained recap record.
 * @returns the Client-facing recap.
 */
export function servedRecap(recap: StoredDailyRecap): DailyRecap {
  return {
    ...recap,
    workItems: recap.workItems.map(item => 'problem' in item
      ? item
      : {
        problem: item.title,
        conclusion: '',
        solution: item.detail,
        status: item.status,
        sessionIds: [],
      }),
  }
}

/**
 * Key one owner's recap for one local day.
 * @param owner - resolved owner identity.
 * @param day - `YYYY-MM-DD` local day key.
 * @returns the domain key.
 */
export function recapKey(owner: string, day: string): string {
  return `${owner}|${day}`
}

/**
 * Key one owner's latest analysis.
 * @param owner - resolved owner identity.
 * @returns the domain key.
 */
export function analysisKey(owner: string): string {
  return owner
}
