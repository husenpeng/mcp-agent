/**
 * Remembered creator feedback: one durable record per creator and client, read
 * before the next scouting pass so a rejection is not offered again and an
 * acceptance ranks higher.
 *
 * Records live in the plugin's own storage domain. A record without a client
 * applies to every client on this host; a record naming one applies only to it,
 * and the client-specific record wins.
 * @module @tomato/tool-creator-search/feedback
 */

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type { KvTable } from '@tomato/storage-domain'
import type { CreatorPlatform } from './types.ts'

/** Decisions a reviewer can record about one creator. */
export type FeedbackDecision = 'accept' | 'reject' | 'watch'

/** Stable reason values a reviewer may attach, so later passes can summarize them. */
export const FEEDBACK_REASONS = [
  'brand-safety',
  'audience-mismatch',
  'price',
  'content-quality',
  'competitor',
  'already-worked',
  'other',
] as const

/** One reason a reviewer attached to a decision. */
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]

/** One stored feedback record. */
export const feedbackRecordSchema = z.object({
  platform: z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE']),
  creatorId: z.string(),
  handle: z.string().optional(),
  name: z.string().optional(),
  decision: z.enum(['accept', 'reject', 'watch']),
  reasons: z.array(z.string()),
  note: z.string().optional(),
  client: z.string().optional(),
  updatedAt: z.string(),
})

/** One stored feedback record, inferred from {@link feedbackRecordSchema}. */
export type FeedbackRecord = z.infer<typeof feedbackRecordSchema>

/** What one feedback write states. */
export interface FeedbackInput {
  readonly platform: CreatorPlatform
  readonly creatorId: string
  readonly handle?: string
  readonly name?: string
  readonly decision: FeedbackDecision
  readonly reasons?: readonly FeedbackReason[]
  readonly note?: string
  /** Client or brand the decision applies to; omitted applies to every client. */
  readonly client?: string
}

/** The durable feedback domain: one record per creator, client, and decision update. */
export const creatorFeedbackDomainSpec = defineDomain({
  name: 'creator_search_feedback',
  version: 1,
  layout: 'per-record',
  tables: { feedback: domainTable<string, FeedbackRecord>(feedbackRecordSchema) },
})

/**
 * Stable in-process key for one platform creator.
 * @param platform - owning platform.
 * @param creatorId - platform identifier.
 * @returns the map key used by scoring and feedback lookup.
 */
export function creatorKey(platform: CreatorPlatform, creatorId: string): string {
  return `${platform.toLowerCase()}:${creatorId.trim()}`
}

/**
 * Storage key for one record. Hashed so a handle or channel id never becomes a
 * path segment and the key stays stable across clients.
 * @param client - client the record applies to, or undefined for every client.
 * @param platform - owning platform.
 * @param creatorId - platform identifier.
 * @returns a lowercase hex key.
 */
export function feedbackStorageKey(client: string | undefined, platform: CreatorPlatform, creatorId: string): string {
  return createHash('sha256')
    .update(`${client ?? '*'}\u0000${platform}\u0000${creatorId.trim()}`)
    .digest('hex')
}

/** What a scout pass reads from remembered feedback. */
export interface CreatorFeedbackIndex {
  /**
   * Read the records that apply to one client.
   * @param client - the brief's client, when it names one.
   * @returns records keyed by {@link creatorKey}; client-specific records win over host-wide ones.
   */
  byCreator(client: string | undefined): ReadonlyMap<string, FeedbackRecord>
}

/** Durable feedback over one storage table. */
export class CreatorFeedbackStore implements CreatorFeedbackIndex {
  constructor(private readonly table: KvTable<string, FeedbackRecord>) {}

  /**
   * List the records that apply to one client.
   * @param client - client to include; undefined includes host-wide records only.
   * @returns the matching records, newest first.
   */
  list(client: string | undefined): FeedbackRecord[] {
    return [...this.table.entries()]
      .map(([, record]) => record)
      .filter(record => record.client === undefined || record.client === client)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  /**
   * Read the records that apply to one client, keyed by creator.
   * @param client - the brief's client, when it names one.
   * @returns the most specific record per creator.
   */
  byCreator(client: string | undefined): Map<string, FeedbackRecord> {
    const out = new Map<string, FeedbackRecord>()
    for (const record of this.list(client)) {
      const key = creatorKey(record.platform, record.creatorId)
      const held = out.get(key)
      if (record.client !== undefined || held === undefined) out.set(key, record)
    }
    return out
  }

  /**
   * Insert or replace the decision for one creator.
   * @param input - the reviewer's decision.
   * @param now - epoch milliseconds; tests replace it.
   * @returns the stored record.
   */
  async record(input: FeedbackInput, now: number = Date.now()): Promise<FeedbackRecord> {
    const record: FeedbackRecord = {
      platform: input.platform,
      creatorId: input.creatorId,
      decision: input.decision,
      reasons: [...(input.reasons ?? [])],
      updatedAt: new Date(now).toISOString(),
      ...input.handle === undefined ? {} : { handle: input.handle },
      ...input.name === undefined ? {} : { name: input.name },
      ...input.note === undefined ? {} : { note: input.note },
      ...input.client === undefined ? {} : { client: input.client },
    }
    await this.table.put(feedbackStorageKey(input.client, input.platform, input.creatorId), record)
    return record
  }
}
