/**
 * Durable evidence domain: one stored record per image, engine, and contract
 * version, keyed by a filesystem-safe digest.
 * @module @tomato/image-evidence/src/spec
 */

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type { VisionEngineRef } from './types.ts'

/** One engine attempt recorded beside the evidence it produced. */
export const imageEvidenceAttemptSchema = z.object({
  engine: z.object({ provider: z.string(), model: z.string() }),
  ok: z.boolean(),
  durationMs: z.number(),
  failure: z.object({ code: z.string(), message: z.string() }).optional(),
})

/** One attempt at reading an image. */
export type ImageEvidenceAttempt = z.infer<typeof imageEvidenceAttemptSchema>

/**
 * Durable shape of one evidence record. `text` is exactly what the projection
 * sends to the model, after the character cap, so replay reproduces the request.
 */
export const imageEvidenceRecordSchema = z.object({
  attachmentId: z.string(),
  engine: z.object({ provider: z.string(), model: z.string() }),
  contractVersion: z.number(),
  text: z.string(),
  truncated: z.boolean(),
  attempts: z.array(imageEvidenceAttemptSchema),
  createdAt: z.string(),
  lastReadAt: z.string(),
})

/** One stored evidence record, inferred from {@link imageEvidenceRecordSchema}. */
export type ImageEvidenceRecord = z.infer<typeof imageEvidenceRecordSchema>

/**
 * Store key for one (attachment, engine, contract version) triple. Hashed so
 * the key stays a safe per-record path segment whatever the model id contains.
 * @param attachmentId - content-addressed attachment id.
 * @param engine - engine that produced the evidence.
 * @param contractVersion - evidence contract version.
 * @returns a lowercase hex key.
 */
export function evidenceRecordKey(
  attachmentId: string,
  engine: VisionEngineRef,
  contractVersion: number,
): string {
  return createHash('sha256')
    .update(`${attachmentId}\u0000${engine.provider}\u0000${engine.model}\u0000${contractVersion}`)
    .digest('hex')
}

/**
 * The evidence domain: per-record layout, because each record holds a full
 * transcription and records retire individually.
 */
export const imageEvidenceDomainSpec = defineDomain({
  name: 'image_evidence',
  version: 1,
  layout: 'per-record',
  tables: { evidence: domainTable<string, ImageEvidenceRecord>(imageEvidenceRecordSchema) },
})
