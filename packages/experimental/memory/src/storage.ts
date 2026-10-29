/** Durable `tomato_memory` storage domain and record validation. */
import { z } from 'zod'
import { SessionId, SessionSeq } from '@tomato/session'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type { MemoryId as MemoryIdType, MemoryKind, MemoryStatus } from './types.ts'

/** Every record kind, in display order. */
export const MEMORY_KINDS: readonly MemoryKind[] = ['preference', 'constraint', 'decision', 'fact']

/** Every record status. */
export const MEMORY_STATUSES: readonly MemoryStatus[] = ['candidate', 'active']

/** Lower-kebab-case segments joined by `:`, for example `client:brand-x`. */
const IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*(?::[a-z0-9]+(?:-[a-z0-9]+)*)*$/u

/** Maximum length of one entity or key. */
export const MAX_IDENTIFIER_LENGTH = 64

/**
 * Brand one stored or generated record identity.
 * @param id - opaque identity string.
 * @returns the branded identity.
 */
export function MemoryId(id: string): MemoryIdType {
  return id as MemoryIdType
}

/**
 * Whether a string is a valid entity or key.
 * @param value - candidate identifier.
 * @returns true for 1–64 characters of lower-kebab-case segments joined by `:`.
 */
export function isMemoryIdentifier(value: string): boolean {
  return value.length > 0 && value.length <= MAX_IDENTIFIER_LENGTH && IDENTIFIER.test(value)
}

const identifierSchema = z.string().refine(isMemoryIdentifier, { message: 'Expected a lower-kebab-case identifier' })

/**
 * Durable record. `workspace` is the canonical original project directory
 * that scopes visibility; `source.userMessageSeq` names the quoted person
 * message and is absent for candidates and command writes. Only active records
 * may be pinned.
 */
export const memoryRecordSchema = z.object({
  id: z.string().min(1).transform(MemoryId),
  workspace: z.string().min(1),
  kind: z.enum(['preference', 'constraint', 'decision', 'fact']),
  entity: identifierSchema,
  key: identifierSchema,
  value: z.string().min(1),
  status: z.enum(['candidate', 'active']),
  pinned: z.boolean(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  source: z.object({
    sessionId: z.string().min(1).transform(SessionId),
    userMessageSeq: z.number().int().nonnegative().transform(SessionSeq).optional(),
  }).strict(),
}).strict().refine(record => record.status === 'active' || !record.pinned, {
  message: 'Only an active record can be pinned',
})

/** One stored memory record, inferred from {@link memoryRecordSchema}. */
export type MemoryRecord = z.infer<typeof memoryRecordSchema>

/** Authoritative memory storage; a malformed record rejects opening the domain. */
export const memoryDomain = defineDomain({
  name: 'tomato_memory',
  version: 1,
  tables: { records: domainTable<MemoryIdType, MemoryRecord>(memoryRecordSchema) },
})
