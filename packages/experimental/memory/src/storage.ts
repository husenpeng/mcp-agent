/** Durable `tomato_memory` storage domain and record validation. */
import { z } from 'zod'
import { SessionId, SessionSeq } from '@tomato/session'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type { MemoryId as MemoryIdType, MemoryKind, MemoryOwner as MemoryOwnerType, MemoryStatus } from './types.ts'

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
 * Brand one stored owner.
 * @param owner - `local` or `account:<id>`.
 * @returns the branded owner.
 */
export function MemoryOwner(owner: string): MemoryOwnerType {
  return owner as MemoryOwnerType
}

/** Owner of every record on a Host without accounts. */
export const LOCAL_MEMORY_OWNER: MemoryOwnerType = MemoryOwner('local')

/**
 * Owner of one signed-in account's records.
 * @param accountId - stable account id from the sign-in service.
 * @returns `account:<accountId>`.
 */
export function accountMemoryOwner(accountId: string): MemoryOwnerType {
  return MemoryOwner(`account:${accountId}`)
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
 * Durable record. `owner` names whose record it is; `scope` is `profile` for
 * statements about the person in every workspace, or the canonical original
 * project directory that scopes a workspace record. `source.userMessageSeq`
 * names the quoted person message and is absent for candidates and command
 * writes. Only active workspace records may be pinned.
 */
export const memoryRecordSchema = z.object({
  id: z.string().min(1).transform(MemoryId),
  owner: z.string().min(1).transform(MemoryOwner),
  scope: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('profile') }).strict(),
    z.object({ kind: z.literal('workspace'), path: z.string().min(1) }).strict(),
  ]),
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
}).strict().refine(record => !record.pinned || (record.status === 'active' && record.scope.kind === 'workspace'), {
  message: 'Only an active workspace record can be pinned',
})

/** One stored memory record, inferred from {@link memoryRecordSchema}. */
export type MemoryRecord = z.infer<typeof memoryRecordSchema>

/** Authoritative memory storage; a malformed record rejects opening the domain. */
export const memoryDomain = defineDomain({
  name: 'tomato_memory',
  version: 1,
  tables: { records: domainTable<MemoryIdType, MemoryRecord>(memoryRecordSchema) },
})
