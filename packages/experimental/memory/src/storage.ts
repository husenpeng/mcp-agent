/** Durable `tomato_memory` storage domain and record validation. */
import { z } from 'zod'
import { SessionId, SessionSeq } from '@tomato/session'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type {
  EpisodeId as EpisodeIdType, EpisodeKind as EpisodeKindType, MemoryId as MemoryIdType, MemoryKind,
  MemoryOwner as MemoryOwnerType, MemoryStatus, VectorId as VectorIdType,
} from './types.ts'
import { ProjectId } from './project.ts'

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

/** One stable project identity: a workspace-registry id or a provisional `pw:` id. */
const projectIdSchema = z.string().min(1).max(128).transform(ProjectId)

/**
 * One workspace scope. `workspaceId` is absent only in records written before
 * domain v2, which carried the canonical path alone.
 */
const workspaceScopeSchema = z.object({
  kind: z.literal('workspace'),
  workspaceId: projectIdSchema.optional(),
  path: z.string().min(1).optional(),
}).strict().refine(scope => scope.workspaceId !== undefined || scope.path !== undefined, {
  message: 'A workspace scope needs a workspaceId or a canonical path',
})

/**
 * Durable record. `owner` names whose record it is; `scope` is `profile` for
 * statements about the person in every workspace, or one workspace record's
 * stable project identity plus its canonical directory snapshot.
 * `source.userMessageSeq` names the quoted person message and is absent for
 * candidates and command writes. Only active workspace records may be pinned.
 */
export const memoryRecordSchema = z.object({
  id: z.string().min(1).transform(MemoryId),
  owner: z.string().min(1).transform(MemoryOwner),
  scope: z.union([
    z.object({ kind: z.literal('profile') }).strict(),
    workspaceScopeSchema,
  ]),
  kind: z.enum(['preference', 'constraint', 'decision', 'fact']),
  entity: identifierSchema,
  key: identifierSchema,
  value: z.string().min(1),
  status: z.enum(['candidate', 'active']),
  pinned: z.boolean(),
  /** Start of this version's validity; absent only in records written before domain v3. */
  validFrom: z.number().int().nonnegative().optional(),
  /** End of this version's validity; absent while this version is current. */
  validTo: z.number().int().nonnegative().optional(),
  /** Version that replaced this one, when it has been superseded. */
  supersededBy: z.string().min(1).transform(MemoryId).optional(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /**
   * Record whose confirmation would replace this candidate's statement. A
   * capture that contradicts an already confirmed record stores the new
   * statement beside it, never over it.
   */
  proposalFor: z.string().min(1).transform(MemoryId).optional(),
  /** Times an independent write stated this candidate; absent counts as one. */
  evidence: z.number().int().positive().optional(),
  /** When a person last ignored this candidate, as epoch milliseconds. */
  dismissedAt: z.number().int().nonnegative().optional(),
  /** Evidence count at that moment; a later statement makes it due again. */
  dismissedEvidence: z.number().int().positive().optional(),
  source: z.object({
    sessionId: z.string().min(1).transform(SessionId),
    userMessageSeq: z.number().int().nonnegative().transform(SessionSeq).optional(),
    /** Episode whose repeated facts promoted this record, when known. */
    episodeId: z.string().min(1).transform(EpisodeId).optional(),
  }).strict(),
}).strict().refine(record => !record.pinned || (record.status === 'active' && record.scope.kind === 'workspace'), {
  message: 'Only an active workspace record can be pinned',
})

/** One stored memory record, inferred from {@link memoryRecordSchema}. */
export type MemoryRecord = z.infer<typeof memoryRecordSchema>


/** Brand one stored embedding vector identity. */
export function VectorId(id: string): VectorIdType {
  return id as VectorIdType
}

/** Maximum base64 characters of one stored vector; 16384 float32 values. */
export const MAX_VECTOR_BASE64 = 87_384

/** One cached embedding vector. The vector is base64 little-endian float32 data. */
export const vectorRecordSchema = z.object({
  id: z.string().min(1).transform(VectorId),
  owner: z.string().min(1).transform(MemoryOwner),
  target: z.enum(['fact', 'episode']),
  recordId: z.string().min(1),
  model: z.string().min(1).max(256),
  dimensions: z.number().int().positive().max(16_384),
  contentUpdatedAt: z.number().int().nonnegative(),
  vector: z.string().min(4).max(MAX_VECTOR_BASE64),
  updatedAt: z.number().int().nonnegative(),
}).strict()

/** One cached vector, inferred from {@link vectorRecordSchema}. */
export type VectorRecord = z.infer<typeof vectorRecordSchema>

/**
 * Derived embedding vectors stored beside the records they describe. The
 * domain keeps the `single` layout: its keys join a target and a record id
 * (`record:memory-…`), so they are not path-safe, and losing a cached vector
 * only costs one recomputation.
 */
export const vectorDomain = defineDomain({
  name: 'tomato_memory_vectors',
  version: 1,
  tables: { vectors: domainTable<VectorIdType, VectorRecord>(vectorRecordSchema) },
})

/**
 * Authoritative memory storage; a malformed record rejects opening the domain.
 * `per-record` keeps every record in its own document: Host processes sharing
 * one tomato home write at the same time, and a whole-unit rewrite publishes
 * this process's snapshot over every record another process wrote since it opened.
 */
export const memoryDomain = defineDomain({
  name: 'tomato_memory',
  version: 5,
  layout: 'per-record',
  compatibleVersions: [1, 2, 3, 4],
  tables: { records: domainTable<MemoryIdType, MemoryRecord>(memoryRecordSchema) },
})

/** Brand one stored or generated episode identity. */
export function EpisodeId(id: string): EpisodeIdType {
  return id as EpisodeIdType
}

/** Every episode kind. */
export const EPISODE_KINDS: readonly EpisodeKindType[] = ['observation', 'summary']

/** Maximum length of one episode type. */
export const MAX_EPISODE_TYPE_LENGTH = 32

/**
 * Bounds of every stored episode field. `concept` covers the path-shaped
 * concepts early extraction stored verbatim (up to 165 characters), so those
 * records stay readable; extraction keeps new concepts to label length.
 */
export const EPISODE_BOUNDS = {
  title: 200,
  subtitle: 300,
  narrative: 4096,
  fact: 300,
  concept: 256,
  file: 512,
  tool: 64,
  fingerprint: 128,
  facts: 20,
  concepts: 12,
  files: 20,
} as const

const episodeTypeSchema = z.string().min(1).max(MAX_EPISODE_TYPE_LENGTH)
  .refine(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value), { message: 'Expected a lower-kebab-case episode type' })

/** One stored episode of the project's history. */
export const episodeRecordSchema = z.object({
  id: z.string().min(1).transform(EpisodeId),
  owner: z.string().min(1).transform(MemoryOwner),
  scope: z.object({
    kind: z.literal('project'),
    workspaceId: projectIdSchema.optional(),
    path: z.string().min(1).optional(),
  }).strict().refine(scope => scope.workspaceId !== undefined || scope.path !== undefined, {
    message: 'A project scope needs a workspaceId or a canonical path',
  }),
  kind: z.enum(['observation', 'summary']),
  type: episodeTypeSchema,
  title: z.string().min(1).max(EPISODE_BOUNDS.title),
  subtitle: z.string().max(EPISODE_BOUNDS.subtitle).optional(),
  narrative: z.string().max(EPISODE_BOUNDS.narrative),
  facts: z.array(z.string().max(EPISODE_BOUNDS.fact)).max(EPISODE_BOUNDS.facts),
  concepts: z.array(z.string().max(EPISODE_BOUNDS.concept)).max(EPISODE_BOUNDS.concepts),
  filesRead: z.array(z.string().max(EPISODE_BOUNDS.file)).max(EPISODE_BOUNDS.files),
  filesModified: z.array(z.string().max(EPISODE_BOUNDS.file)).max(EPISODE_BOUNDS.files),
  tool: z.string().max(EPISODE_BOUNDS.tool).optional(),
  fingerprint: z.string().min(1).max(EPISODE_BOUNDS.fingerprint),
  source: z.object({
    sessionId: z.string().min(1).transform(SessionId),
    toolCallId: z.string().min(1).optional(),
    runId: z.string().min(1).optional(),
  }).strict(),
  /** Record this episode was promoted into, when a repeated fact became a saved record. */
  promotedTo: z.string().min(1).transform(MemoryId).optional(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
}).strict()

/** One stored episode, inferred from {@link episodeRecordSchema}. */
export type EpisodeRecord = z.infer<typeof episodeRecordSchema>

/**
 * Project history storage; a malformed record rejects opening the domain.
 * `per-record` for the same reason as {@link memoryDomain}.
 */
export const episodeDomain = defineDomain({
  name: 'tomato_memory_episodes',
  version: 2,
  layout: 'per-record',
  compatibleVersions: [1],
  tables: { records: domainTable<EpisodeIdType, EpisodeRecord>(episodeRecordSchema) },
})
