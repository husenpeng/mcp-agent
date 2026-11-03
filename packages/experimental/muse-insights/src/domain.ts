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
import type { DailyRecap, UnfinishedAnalysis } from './types.ts'

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

const workItemSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(1_000),
  status: z.enum(['done', 'ongoing', 'blocked', 'unknown']),
}).strict()

const recapSessionSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().max(500),
  summary: z.string().max(1_000),
  messageCount: z.number().int().nonnegative(),
}).strict()

const dailyRecapSchema = z.object({
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
  /** The retained Client-facing recap. */
  readonly recap: DailyRecap
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
  version: 1,
  tables: { recaps: recapTable, analyses: analysisTable },
} satisfies DomainSpec

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
