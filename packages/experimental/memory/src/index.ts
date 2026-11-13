/**
 * Experimental cross-session memory. `ctx.memory` stores records in the
 * `tomato_memory` storage domain. Each record belongs to one owner — the
 * account `ctx.tomatoAccount` names, or one local owner on a Host without
 * accounts — and applies either to the owner's profile in every workspace or
 * to one canonical original project directory. Records never enter a Session
 * log. The `@tomato/experimental-tool-memory` plugin is the model-facing and
 * command consumer. Each of the deployment limits admits an automatic page on
 * the Settings server when that server is composed.
 * @module @tomato/experimental-memory
 */

import { createHash, randomUUID } from 'node:crypto'
import { appendFile, mkdir, readdir, realpath, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import z from '@tomato/schemastery'
import { Service } from '@tomato/cordis'
import type { Context, Volatile } from '@tomato/cordis'
import type {} from '@tomato/gateway'
import type {} from '@tomato/settings'
import type { Session, SessionId } from '@tomato/session'
import type { Domain, KvTable } from '@tomato/storage-domain'
import type {} from '@tomato/experimental-embeddings'
import { PROVISIONAL_PREFIX, resolveMemoryWorkspace, scopeProjectId } from './project.ts'
import { MemoryIndex } from './search-index.ts'
import { resolveVecExtensionPath } from './sqlite-vec.ts'
import type { EmbeddingJob } from './search-index.ts'
import { decodeVector, encodeVector } from './vector.ts'
import {
  cosineSimilarity, episodeEmbeddingText, memoryEmbeddingText, memoryTokens, scoreEpisodes, scoreMemories, tokenContainment,
} from './retrieval.ts'
import { normalizeIdentifier, normalizeStatement } from './normalize.ts'
import { WriteLockTimeoutError, withWriteLock } from './write-lock.ts'
import {
  EpisodeId, LOCAL_MEMORY_OWNER, MemoryId, VectorId, accountMemoryOwner, episodeDomain, isMemoryIdentifier, memoryDomain, vectorDomain,
} from './storage.ts'
import type { EpisodeRecord, MemoryRecord, VectorRecord } from './storage.ts'
import type {
  EpisodeId as EpisodeIdType, EpisodeScope, EpisodeSearchRequest, EpisodeTimelineRequest,
  VectorId as VectorIdType, VectorTarget,
  MemoryAccess,
  MemoryId as MemoryIdType,
  MemoryKind,
  MemoryOwner,
  MemoryWorkspace,
  ProjectId as ProjectIdType,
  PromotionOutcome,
  MemoryScope,
  MemoryView,
  RecallRequest,
  RememberEpisodeRequest,
  RememberRequest,
} from './types.ts'

export type * from './types.ts'
export { ProjectId, provisionalProjectId, resolveMemoryWorkspace, scopeProjectId } from './project.ts'
export type { ProjectScope } from './project.ts'
export { INDEX_VERSION, MemoryIndex } from './search-index.ts'
export { bytesToVector, decodeVector, encodeVector, vectorToBytes } from './vector.ts'
export { resolveVecExtensionPath, unpackedExtensionPath } from './sqlite-vec.ts'
export type { EpisodeIndexSearch, RecordIndexSearch } from './search-index.ts'
export {
  EPISODE_BOUNDS,
  EPISODE_KINDS,
  EpisodeId,
  LOCAL_MEMORY_OWNER,
  MEMORY_KINDS,
  MEMORY_STATUSES,
  MemoryId,
  MemoryOwner,
  accountMemoryOwner,
  isMemoryIdentifier,
  MAX_VECTOR_BASE64,
  VectorId,
  episodeDomain,
  episodeRecordSchema,
  memoryDomain,
  memoryRecordSchema,
  vectorDomain,
  vectorRecordSchema,
} from './storage.ts'
export type { EpisodeRecord, MemoryRecord, VectorRecord } from './storage.ts'
export {
  ALTERNATIVE_WEIGHT, cosineSimilarity, episodeEmbeddingText, memoryEmbeddingText, memoryTokens, rankMemories,
  scoreEpisodes, scoreMemories, tokenContainment,
} from './retrieval.ts'
export type { ScoredEpisode, ScoredMemory } from './retrieval.ts'
export { normalizeIdentifier, normalizeStatement } from './normalize.ts'
export { WriteLockTimeoutError, withWriteLock } from './write-lock.ts'
export type { WriteLockOptions } from './write-lock.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host-wide cross-session memory records scoped by owner, then by profile or canonical workspace. */
    memory: MemoryService
    /** Resolve one path below the harness home; provided by application boot. */
    tomatoHomePath?: (...segments: string[]) => string
  }
}

/** Deployment limits for stored and recalled memory; Loader publishes each as a live reference. */
export interface Config {
  /** Maximum records one recall returns. */
  maxRecallResults?: number | Volatile<number>
  /** Maximum pinned records one workspace exposes. */
  maxPinnedRecords?: number | Volatile<number>
  /** Maximum UTF-8 bytes of one record value. */
  maxValueBytes?: number | Volatile<number>
  /** Maximum stored records, including candidates, per owner and workspace. */
  maxRecordsPerWorkspace?: number | Volatile<number>
  /** Maximum stored profile records, including candidates, per owner. */
  maxProfileRecords?: number | Volatile<number>
  /** Weight of vector similarity in a blended search score; `0` disables semantic ranking. */
  semanticWeight?: number | Volatile<number>
  /** Candidates one semantic search embeds and reranks. */
  maxSemanticCandidates?: number | Volatile<number>
  /** Minimum cosine similarity for a record the lexical query does not match. */
  semanticFloor?: number | Volatile<number>
  /** Stored episodes per owner and project, including summaries. */
  maxEpisodesPerWorkspace?: number | Volatile<number>
  /** UTF-8 characters one episode may carry across its text fields. */
  maxEpisodeChars?: number | Volatile<number>
  /** Days an episode is retained before pruning. */
  episodeRetentionDays?: number | Volatile<number>
  /** Summaries one history injection considers. */
  historySummaries?: number | Volatile<number>
  /** Episodes one history injection considers. */
  historyEpisodes?: number | Volatile<number>
  /** Cached embedding vectors retained across owners and projects; `0` disables persistence. */
  maxEmbeddingVectors?: number | Volatile<number>
  /** Days a superseded record version is retained; `0` keeps every version. */
  versionRetentionDays?: number | Volatile<number>
  /** Most superseded versions retained per identity; the current version does not count. */
  maxVersionsPerRecord?: number | Volatile<number>
  /** Days a summary episode is retained; observations use `episodeRetentionDays`. */
  summaryRetentionDays?: number | Volatile<number>
  /** Minimum milliseconds between medium change checks; `0` never re-reads another process's writes. */
  refreshIntervalMs?: number | Volatile<number>
  /** Milliseconds a write waits for another Host process's memory write lock. */
  writeLockTimeoutMs?: number | Volatile<number>
  /** Milliseconds after which an abandoned write lock file is stolen. */
  writeLockStaleMs?: number | Volatile<number>
  /** SQLite sidecar path for FTS5 retrieval; absent keeps the in-memory scan. */
  indexPath?: string
  /** Embeddings one outbox drain submits; defaults to 32. */
  indexEmbedBatch?: number
  /** Delay before retrying a failed outbox batch; defaults to 5000 ms. */
  indexEmbedRetryMs?: number
  /** Optional sqlite-vec extension path, without the platform suffix. */
  vecExtensionPath?: string
  /** Directory that receives pruned records as monthly JSONL; absent deletes them. */
  coldArchivePath?: string
  /** Months of monthly cold-archive files retained; defaults to 6. */
  coldArchiveRetentionMonths?: number
}

/** Fully resolved deployment limits. */
export interface MemoryLimits {
  /** Maximum records one recall returns. */
  readonly maxRecallResults: number
  /** Maximum pinned records one workspace exposes. */
  readonly maxPinnedRecords: number
  /** Maximum UTF-8 bytes of one record value. */
  readonly maxValueBytes: number
  /** Maximum stored records, including candidates, per owner and workspace. */
  readonly maxRecordsPerWorkspace: number
  /** Maximum stored profile records, including candidates, per owner. */
  readonly maxProfileRecords: number
  /** Weight of vector similarity in a blended search score; `0` disables semantic ranking. */
  readonly semanticWeight: number
  /** Candidates one semantic search embeds and reranks. */
  readonly maxSemanticCandidates: number
  /** Minimum cosine similarity for a record the lexical query does not match. */
  readonly semanticFloor: number
  /** Stored episodes per owner and project, including summaries. */
  readonly maxEpisodesPerWorkspace: number
  /** UTF-8 characters one episode may carry across its text fields. */
  readonly maxEpisodeChars: number
  /** Days an episode is retained before pruning. */
  readonly episodeRetentionDays: number
  /** Summaries one history injection considers. */
  readonly historySummaries: number
  /** Episodes one history injection considers. */
  readonly historyEpisodes: number
  /** Cached embedding vectors retained across owners and projects; `0` disables persistence. */
  readonly maxEmbeddingVectors: number
  /** Days a superseded record version is retained; `0` keeps every version. */
  readonly versionRetentionDays: number
  /** Most superseded versions retained per identity; the current version does not count. */
  readonly maxVersionsPerRecord: number
  /** Days a summary episode is retained; observations use `episodeRetentionDays`. */
  readonly summaryRetentionDays: number
  /** Minimum milliseconds between medium change checks; `0` never re-reads another process's writes. */
  readonly refreshIntervalMs: number
  /** Milliseconds a write waits for another Host process's memory write lock. */
  readonly writeLockTimeoutMs: number
  /** Milliseconds after which an abandoned write lock file is stolen. */
  readonly writeLockStaleMs: number
}


/** Deepest relation walk one lookup follows; each hop reads the whole view. */
export const MAX_RELATION_DEPTH = 2

/** One lower-kebab-case episode type, such as `bugfix`. */
const EPISODE_TYPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

/** How a related record connects to the record one hop before it. */
export type MemoryRelation = 'same-entity' | 'same-session' | 'same-key'

/** Every edge a relation walk follows, in traversal order. */
export const MEMORY_RELATIONS: readonly MemoryRelation[] = ['same-entity', 'same-session', 'same-key']

/** Whether another record of the view connects to the node the walk expands. */
const RELATION_EDGES: Readonly<Record<MemoryRelation, (node: MemoryRecord, other: MemoryRecord) => boolean>> = {
  'same-entity': (node, other) => other.entity === node.entity,
  'same-session': (node, other) => other.source.sessionId === node.source.sessionId,
  'same-key': (node, other) => other.key === node.key,
}

/** One record reached by {@link MemoryService.related}. */
export interface RelatedMemory {
  /** Reached record. */
  readonly record: MemoryRecord
  /** Hops from the starting record; direct neighbors are 1. */
  readonly depth: number
  /** Edge followed from the record at `depth - 1`. */
  readonly via: MemoryRelation
}

/** Minimum word segments in each value before a duplicate comparison is meaningful. */
export const MIN_DUPLICATE_TOKENS = 3

/** Containment at or above which two values state the same thing; precision over recall. */
export const DUPLICATE_COVERAGE = 0.8

/** The fields of a pending write that duplicate detection compares. */
export interface DuplicateQuery {
  /** Owner the write belongs to. */
  readonly owner: MemoryOwner
  /** Scope the write targets. */
  readonly scope: MemoryScope
  /** Statement category the write claims. */
  readonly kind: MemoryKind
  /** Normalized subject of the write. */
  readonly entity: string
  /** Normalized attribute of the write. */
  readonly key: string
  /** Statement the write would store. */
  readonly value: string
}

/** A stored record that states what a pending write states. */
export interface DuplicateMatch {
  /** The stored record; it keeps its own entity, key, and identity. */
  readonly record: MemoryRecord
  /** Shared-word containment of the two values, from {@link DUPLICATE_COVERAGE} to 1. */
  readonly coverage: number
}

/** Stored counts and capacity of one view, for human inspection. */
export interface MemoryStats {
  /** Every current record version the view sees, active and candidates. */
  readonly total: number
  /** Records whose contents reach search and the snapshot. */
  readonly active: number
  /** Records waiting for a person to confirm them. */
  readonly candidates: number
  /** Pinned workspace records. */
  readonly pinned: number
  /** Every stored version the view sees, current and superseded. */
  readonly versions: number
  /** Profile records of this owner and the owner's profile limit. */
  readonly profile: { readonly stored: number; readonly limit: number }
  /** Workspace records of the view's directory and the workspace limit; `null` without a project directory. */
  readonly workspace: { readonly stored: number; readonly limit: number } | null
  /** Update time of the least recently updated active record, or `null` when none is active. */
  readonly oldestActiveUpdate: number | null
  /** Stored embedding vectors across owners and projects. */
  readonly vectors: number
}

/** Stable failure classes of {@link MemoryError}. */
export type MemoryErrorCode = 'value-too-large' | 'workspace-full' | 'profile-full' | 'episode-too-large' | 'episodes-full' | 'write-busy'
  | 'invalid-identifier' | 'invalid-scope' | 'empty-value'

/** Expected rejection of a memory write; `code` is stable for callers. */
export class MemoryError extends Error {
  /**
   * @param message - actionable explanation.
   * @param code - stable failure class.
   */
  constructor(message: string, readonly code: MemoryErrorCode) {
    super(message)
    this.name = 'MemoryError'
  }
}

/** Newest first, then by identity, for a total order. */
function newestFirst(left: MemoryRecord, right: MemoryRecord): number {
  return right.updatedAt - left.updatedAt || left.id.localeCompare(right.id)
}

/** By entity, then by key. */
function byEntityAndKey(left: MemoryRecord, right: MemoryRecord): number {
  return left.entity.localeCompare(right.entity) || left.key.localeCompare(right.key)
}

/** Deterministic attribute of a promoted fact: first concept plus a fact digest. */
function promotionKey(fact: string, episode: EpisodeRecord): string {
  const concept = (episode.concepts[0] ?? episode.type).toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '').slice(0, 40)
  return `${concept === '' ? 'fact' : concept}-${createHash('sha256').update(fact).digest('hex').slice(0, 8)}`
}

/**
 * First fact of an observation that may become a saved record. A failed call
 * only reports its error text, and a successful shell call often reports its
 * exit code; neither is a durable statement about the project.
 * @param episode - stored observation.
 * @returns the promotable fact, or `undefined` for session noise.
 */
function promotableFact(episode: EpisodeRecord): string | undefined {
  const fact = episode.facts[0]?.trim()
  if (fact === undefined || fact === '' || /^exit \d+$/u.test(fact) || /^failed\b/iu.test(fact)
    || episode.type === 'failure') return undefined
  return fact
}

/** An episode scope after resolution: identity and canonical path are both present. */
type ResolvedEpisodeScope = EpisodeScope & { readonly workspaceId: ProjectIdType; readonly path: string }

/** Whether two scopes name the same profile or the same project identity. */
function sameScope(left: MemoryScope, right: MemoryScope): boolean {
  if (left.kind === 'profile' && right.kind === 'profile') return true
  if (left.kind === 'profile' || right.kind === 'profile') return false
  return scopeProjectId(left) === scopeProjectId(right)
}

/** Whether a view sees a record. */
function visibleIn(view: MemoryView, record: MemoryRecord): boolean {
  return record.owner === view.owner
    && (record.scope.kind === 'profile' || scopeProjectId(record.scope) === view.workspace?.id)
}

/** Whether one record version is the current one. */
function isCurrent(record: MemoryRecord): boolean {
  return record.validTo === undefined
}

/** The account owner in force, or the reason no owner may be used. */
type OwnerResolution =
  | { readonly kind: 'available'; readonly owner: MemoryOwner }
  | { readonly kind: 'signed-out' }
  | { readonly kind: 'loading' }

/**
 * Map an unavailable owner to the public access result.
 * @param resolved - a resolution that is not `available`.
 * @returns `account-loading` before verification, otherwise `sign-in-required`.
 */
function unavailableAccess(resolved: Exclude<OwnerResolution, { readonly kind: 'available' }>): MemoryAccess {
  return { kind: resolved.kind === 'loading' ? 'account-loading' : 'sign-in-required' }
}

/** Map the cache's record family to the sidecar's object family. */
function indexTargetOf(target: VectorTarget): 'record' | 'episode' {
  return target === 'fact' ? 'record' : 'episode'
}

/** Stable identity of one record across its versions. */
function identityKey(record: MemoryRecord): string {
  const scope = record.scope.kind === 'profile' ? 'profile' : `workspace:${scopeProjectId(record.scope)}`
  return `${record.owner}\u0000${scope}\u0000${record.entity}\u0000${record.key}`
}

/**
 * Resolve deployment limits; direct construction outside Loader normalization is validated here.
 * @param config - partially specified limits.
 * @returns every limit, defaulted.
 */
export function resolveMemoryLimits(config: Config): MemoryLimits {
  const current = (value: number | Volatile<number> | undefined): number | undefined =>
    value === undefined || typeof value === 'number' ? value : value.get()
  const limits: MemoryLimits = {
    maxRecallResults: current(config.maxRecallResults) ?? 10,
    maxPinnedRecords: current(config.maxPinnedRecords) ?? 20,
    maxValueBytes: current(config.maxValueBytes) ?? 1024,
    maxRecordsPerWorkspace: current(config.maxRecordsPerWorkspace) ?? 1000,
    maxProfileRecords: current(config.maxProfileRecords) ?? 100,
    semanticWeight: current(config.semanticWeight) ?? 0.35,
    maxSemanticCandidates: current(config.maxSemanticCandidates) ?? 50,
    semanticFloor: current(config.semanticFloor) ?? 0.35,
    maxEpisodesPerWorkspace: current(config.maxEpisodesPerWorkspace) ?? 500,
    maxEpisodeChars: current(config.maxEpisodeChars) ?? 8000,
    episodeRetentionDays: current(config.episodeRetentionDays) ?? 90,
    historySummaries: current(config.historySummaries) ?? 1,
    historyEpisodes: current(config.historyEpisodes) ?? 5,
    maxEmbeddingVectors: current(config.maxEmbeddingVectors) ?? 2000,
    versionRetentionDays: current(config.versionRetentionDays) ?? 90,
    maxVersionsPerRecord: current(config.maxVersionsPerRecord) ?? 10,
    summaryRetentionDays: current(config.summaryRetentionDays) ?? 365,
    refreshIntervalMs: current(config.refreshIntervalMs) ?? 1000,
    writeLockTimeoutMs: current(config.writeLockTimeoutMs) ?? 2000,
    writeLockStaleMs: current(config.writeLockStaleMs) ?? 30_000,
  }
  for (const field of ['maxRecallResults', 'maxPinnedRecords', 'maxValueBytes', 'maxRecordsPerWorkspace', 'maxProfileRecords', 'maxSemanticCandidates', 'maxEpisodesPerWorkspace', 'maxEpisodeChars', 'episodeRetentionDays', 'maxVersionsPerRecord', 'summaryRetentionDays', 'writeLockTimeoutMs', 'writeLockStaleMs'] as const) {
    const value = limits[field]
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TypeError(`experimental-memory: ${field} must be a positive safe integer`)
    }
  }
  for (const field of ['historySummaries', 'historyEpisodes', 'maxEmbeddingVectors', 'versionRetentionDays', 'refreshIntervalMs'] as const) {
    const value = limits[field]
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`experimental-memory: ${field} must be a non-negative safe integer`)
    }
  }
  for (const field of ['semanticWeight', 'semanticFloor'] as const) {
    const value = limits[field]
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new TypeError(`experimental-memory: ${field} must be a number from 0 to 1`)
    }
  }
  return limits
}

/**
 * Host-wide memory service. Every operation names the owner or view it acts
 * on, and records of other owners and other workspaces are invisible to it.
 * Writes are serialized by the storage domain and durable before they resolve.
 */
export class MemoryService extends Service {
  static inject = ['storageDomain']

  static Config = z.object({
    maxRecallResults: z.number().step(1).min(1).max(50).default(10).volatile(),
    maxPinnedRecords: z.number().step(1).min(1).max(100).default(20).volatile(),
    maxValueBytes: z.number().step(1).min(16).max(16_384).default(1024).volatile(),
    maxRecordsPerWorkspace: z.number().step(1).min(1).max(100_000).default(1000).volatile(),
    maxProfileRecords: z.number().step(1).min(1).max(10_000).default(100).volatile(),
    semanticWeight: z.number().min(0).max(1).default(0.35).volatile(),
    maxSemanticCandidates: z.number().step(1).min(1).max(500).default(50).volatile(),
    semanticFloor: z.number().min(0).max(1).default(0.35).volatile(),
    maxEpisodesPerWorkspace: z.number().step(1).min(1).max(10_000).default(500).volatile(),
    maxEpisodeChars: z.number().step(1).min(1).max(65_536).default(8000).volatile(),
    episodeRetentionDays: z.number().step(1).min(1).max(3650).default(90).volatile(),
    historySummaries: z.number().step(1).min(0).max(10).default(1).volatile(),
    historyEpisodes: z.number().step(1).min(0).max(50).default(5).volatile(),
    maxEmbeddingVectors: z.number().step(1).min(0).max(100_000).default(2000).volatile(),
    versionRetentionDays: z.number().step(1).min(0).max(3650).default(90).volatile(),
    maxVersionsPerRecord: z.number().step(1).min(1).max(1000).default(10).volatile(),
    summaryRetentionDays: z.number().step(1).min(1).max(36_500).default(365).volatile(),
    refreshIntervalMs: z.number().step(1).min(0).max(3_600_000).default(1000).volatile(),
    writeLockTimeoutMs: z.number().step(1).min(1).max(600_000).default(2000).volatile(),
    writeLockStaleMs: z.number().step(1).min(1000).max(3_600_000).default(30_000).volatile(),
    indexPath: z.string(),
    indexEmbedBatch: z.number().step(1).min(1).max(256).default(32),
    indexEmbedRetryMs: z.number().step(1).min(1000).max(300_000).default(5000),
    vecExtensionPath: z.string(),
    coldArchivePath: z.string(),
    coldArchiveRetentionMonths: z.number().step(1).min(1).max(120).default(6),
  })

  /** Deployment limits read from the live configuration. */
  get limits(): MemoryLimits { return resolveMemoryLimits(this.config) }

  private domain: Domain<typeof memoryDomain> | undefined
  private episodeDomain: Domain<typeof episodeDomain> | undefined
  private vectorDomain: Domain<typeof vectorDomain> | undefined
  private index: MemoryIndex | undefined
  /** Orders this process's read-modify-write memory writes; the domain chain orders single calls only. */
  private writeChain: Promise<unknown> = Promise.resolve()
  /** When this process last asked the medium whether another process wrote. */
  private lastRefreshAt = 0
  /** Change tokens read at the last refresh, one per domain; `undefined` before the first read. */
  private changeStamps: readonly (number | undefined)[] | undefined
  private embeddingTimer: NodeJS.Timeout | undefined
  private embeddingAbort: AbortController | undefined
  private embeddingDraining = false
  private embedBatchSize = 32
  private embedRetryMs = 5_000
  private readonly workspaces = new WeakMap<Session, Promise<string | undefined>>()

  /**
   * @param ctx - Host context owning the storage domain.
   * @param config - validated deployment limits.
   */
  constructor(ctx: Context, private readonly config: Config = {}) {
    super(ctx, 'memory')
    // Fail loud before the domain opens; every later read resolves the live references again.
    resolveMemoryLimits(config)
  }

  protected async [Service.init](): Promise<void> {
    // This class is the Loader entry whose id also names the form, so the
    // page it admits carries the limits resolved above.
    this.ctx.inject(['settings'], (ctx) => {
      ctx.settings.configure({}, this.ctx.fiber)
    })
    const domain = await this.ctx.storageDomain.open(memoryDomain)
    for (const [key, record] of domain.table('records').entries()) {
      if (key === record.id) continue
      // The mismatch is the actionable failure; a rejecting close must not replace it.
      try {
        await domain.close()
      } catch (error: unknown) {
        this.ctx.logger.warn(`experimental-memory: closing the domain after a key mismatch failed: ${String(error)}`)
      }
      throw new Error(`experimental-memory: stored key "${key}" differs from record id "${record.id}"`)
    }
    const episodes = await this.ctx.storageDomain.open(episodeDomain)
    for (const [key, record] of episodes.table('records').entries()) {
      if (key === record.id) continue
      try {
        await episodes.close()
      } catch (error: unknown) {
        this.ctx.logger.warn(`experimental-memory: closing the episode domain after a key mismatch failed: ${String(error)}`)
      }
      throw new Error(`experimental-memory: stored episode key "${key}" differs from record id "${record.id}"`)
    }
    const vectors = await this.ctx.storageDomain.open(vectorDomain)
    for (const [key, record] of vectors.table('vectors').entries()) {
      if (key === record.id) continue
      try {
        await vectors.close()
      } catch (error: unknown) {
        this.ctx.logger.warn(`experimental-memory: closing the vector domain after a key mismatch failed: ${String(error)}`)
      }
      throw new Error(`experimental-memory: stored vector key "${key}" differs from record id "${record.id}"`)
    }
    this.domain = domain
    this.episodeDomain = episodes
    this.vectorDomain = vectors
    const migrated = await this.migrateProjectScopes(domain.table('records'), episodes.table('records'))
    const repaired = await this.repairCurrentVersions(domain.table('records'))
    const homePath = this.ctx.get('tomatoHomePath')
    const indexPath = this.config.indexPath
      ?? (homePath === undefined ? undefined : homePath('memory', 'index-v1.sqlite'))
    if (indexPath !== undefined) {
      if (indexPath.trim() === '') throw new TypeError('experimental-memory: indexPath must not be empty')
      const vecExtensionPath = this.config.vecExtensionPath ?? await resolveVecExtensionPath()
      try {
        /* v8 ignore next -- hosts without a platform binary have no extension path. */
        this.index = new MemoryIndex(indexPath, vecExtensionPath === undefined ? {} : { vecExtensionPath })
        const currentRecords = this.currentRecords()
        if (migrated > 0 || repaired > 0 || this.index.needsRebuild()) {
          this.index.rebuild(currentRecords, this.allEpisodes())
        }
      } catch (error: unknown) {
        // A path the operator named explicitly is a configuration error and
        // fails loud. Otherwise the sidecar is derived data: another Host
        // process may hold it, or it may be damaged, so recall keeps scanning
        // the domains instead of failing the whole service.
        if (this.config.vecExtensionPath !== undefined) throw error
        this.index = undefined
        this.ctx.logger.warn(`experimental-memory: opening the search index failed; recall scans the domains: ${String(error)}`)
      }
      /* v8 ignore next -- the Loader schema fills the default. */
      const batch = this.config.indexEmbedBatch ?? 32
      /* v8 ignore next -- the Loader schema fills the default. */
      const retry = this.config.indexEmbedRetryMs ?? 5_000
      /* v8 ignore next -- the Loader schema rejects a non-positive batch before activation. */
      if (!Number.isSafeInteger(batch) || batch < 1) throw new TypeError('experimental-memory: indexEmbedBatch must be a positive safe integer')
      /* v8 ignore next -- the Loader schema rejects a non-positive retry before activation. */
      if (!Number.isSafeInteger(retry) || retry < 1) throw new TypeError('experimental-memory: indexEmbedRetryMs must be a positive safe integer')
      this.embedBatchSize = batch
      this.embedRetryMs = retry
      this.ctx.inject(['embeddings'], () => { this.scheduleEmbedding(0) })
    }
    this.ctx.inject(['workspaceRegistry'], () => {
      // A registry mounted after this service turns provisional ids into its stable ids.
      void this.reconcileProjectIds().catch((error: unknown) => {
        this.ctx.logger.warn(`experimental-memory: reconciling project identities failed: ${String(error)}`)
      })
    })
    this.ctx.effect(() => async () => {
      /* v8 ignore next -- a live worker timer on disposal is covered by the lifecycle test set. */
      if (this.embeddingTimer !== undefined) clearTimeout(this.embeddingTimer)
      this.embeddingTimer = undefined
      this.embeddingAbort?.abort()
      this.index?.close()
      this.index = undefined
      await domain.close()
      await episodes.close()
      await vectors.close()
    }, 'experimental-memory: close storage domains')
  }

  /** The open domain; every public method runs only after activation. */
  /** The open episode domain; every public episode method runs only after activation. */
  private get episodes() {
    /* v8 ignore next -- Cordis publishes the service only after initialization resolves */
    if (this.episodeDomain === undefined) throw new Error('experimental-memory: service used before activation')
    return this.episodeDomain.table('records')
  }

  /** The open vector domain; every cache operation runs only after activation. */
  private get vectors() {
    /* v8 ignore next -- Cordis publishes the service only after initialization resolves */
    if (this.vectorDomain === undefined) throw new Error('experimental-memory: service used before activation')
    return this.vectorDomain.table('vectors')
  }

  /** Every cached vector, in storage order. */
  private allVectors(): VectorRecord[] {
    return [...this.vectors.entries()].map(([, record]) => record)
  }

  /** Every current record version, in storage order. */
  private currentRecords(): MemoryRecord[] {
    return this.all().filter(isCurrent)
  }

  /** Every stored episode, in storage order. */
  private allEpisodes(): EpisodeRecord[] {
    return [...this.episodes.entries()].map(([, record]) => record)
  }

  /**
   * Mirror one record into the sidecar. A failed mirror marks the file stale
   * and falls back to the in-memory scan for this process.
   * @param record - the durable record.
   */
  private indexRecord(record: MemoryRecord): void {
    if (this.index === undefined) return
    try {
      this.index.putRecord(record)
      this.scheduleEmbedding(0)
    } catch (error: unknown) {
      /* v8 ignore next -- contained by disableIndex */
      this.disableIndex(error)
    }
  }

  /**
   * Remove one record from the sidecar.
   * @param id - stored record identity.
   */
  private unindexRecord(id: MemoryIdType): void {
    if (this.index === undefined) return
    try {
      this.index.deleteRecord(id)
    } catch (error: unknown) {
      /* v8 ignore next -- contained by disableIndex */
      this.disableIndex(error)
    }
  }

  /**
   * Mirror one episode into the sidecar.
   * @param episode - the durable episode.
   */
  private indexEpisode(episode: EpisodeRecord): void {
    if (this.index === undefined) return
    try {
      this.index.putEpisode(episode)
      this.scheduleEmbedding(0)
    } catch (error: unknown) {
      /* v8 ignore next -- contained by disableIndex */
      this.disableIndex(error)
    }
  }

  /**
   * Remove one episode from the sidecar.
   * @param id - stored episode identity.
   */
  private unindexEpisode(id: EpisodeIdType): void {
    if (this.index === undefined) return
    try {
      this.index.deleteEpisode(id)
    } catch (error: unknown) {
      /* v8 ignore next -- contained by disableIndex */
      this.disableIndex(error)
    }
  }

  /* v8 ignore start -- a failed sidecar write falls back to the in-memory scan. */
  /**
   * Mark the sidecar stale, close it, and continue with the in-memory scan.
   * @param error - the failed index operation.
   */
  private disableIndex(error: unknown): void {
    this.ctx.logger.warn(`experimental-memory: search index unavailable: ${String(error)}`)
    try {
      this.index?.markDirty()
    } catch (markError: unknown) {
      this.ctx.logger.warn(`experimental-memory: marking the search index stale failed: ${String(markError)}`)
    }
    try {
      this.index?.close()
    } catch (closeError: unknown) {
      this.ctx.logger.warn(`experimental-memory: closing the search index failed: ${String(closeError)}`)
    }
    this.index = undefined
  }
  /* v8 ignore stop */

  /**
   * Schedule one outbox drain. A disabled sidecar, a missing provider, or a
   * disabled vector cache leaves the queue untouched.
   * @param delay - milliseconds before the drain.
   */
  private scheduleEmbedding(delay: number): void {
    if (this.index === undefined || this.embeddingTimer !== undefined) return
    if (this.limits.maxEmbeddingVectors === 0) return
    const embeddings = this.ctx.get('embeddings')
    if (embeddings === undefined || !embeddings.enabled) return
    this.embeddingTimer = setTimeout(() => {
      this.embeddingTimer = undefined
      void this.drainEmbeddings()
    }, delay)
    this.embeddingTimer.unref()
  }

  /** Drain one batch of the embedding outbox and store its vectors. */
  private async drainEmbeddings(): Promise<void> {
    const index = this.index
    const embeddings = this.ctx.get('embeddings')
    /* v8 ignore next -- the worker runs only with an open index and a mounted provider; disposal aborts it. */
    if (index === undefined || embeddings === undefined || !embeddings.enabled || this.embeddingDraining) return
    this.embeddingDraining = true
    const jobs: { job: EmbeddingJob; text: string }[] = []
    try {
      index.syncEmbeddingModel(embeddings.model)
      index.ensureEmbeddings()
      const pending = index.pendingEmbeddings(Date.now(), this.embedBatchSize)
      /* v8 ignore next -- the inject callback may drain an empty queue before the first write. */
      if (pending.length === 0) return
      for (const job of pending) {
        const record = job.target === 'record' ? this.records.get(MemoryId(job.objectId)) : undefined
        const episode = job.target === 'episode' ? this.episodes.get(EpisodeId(job.objectId)) : undefined
        /* v8 ignore next 4 -- a queued object removed before its drain needs storage fault injection. */
        if (record === undefined && episode === undefined) {
          index.completeEmbedding(job.seq)
          continue
        }
        jobs.push({
          job,
          text: record === undefined ? episodeEmbeddingText(episode as EpisodeRecord) : memoryEmbeddingText(record),
        })
      }
      /* v8 ignore next -- every queued object was removed before its drain. */
      if (jobs.length === 0) return
      const controller = new AbortController()
      this.embeddingAbort = controller
      const vectors = await embeddings.embed({ texts: jobs.map(entry => entry.text), signal: controller.signal })
      /* v8 ignore next -- only disposal closes the index, and it aborts the provider first. */
      if (this.index !== index) return
      /* v8 ignore start -- a malformed provider reply is covered by the provider contract tests. */
      if (vectors.length !== jobs.length) {
        throw new Error(`the embedding provider returned ${vectors.length} vectors for ${jobs.length} inputs`)
      }
      /* v8 ignore stop */
      for (const [position, entry] of jobs.entries()) {
        const vector = vectors[position]
        /* v8 ignore next -- the count check above rejects a short reply first. */
        if (vector === undefined) throw new Error('the embedding provider returned no vector for one object')
        index.putVector(entry.job.target, entry.job.objectId, embeddings.model, vector.length, vector, entry.job.contentUpdatedAt)
        index.completeEmbedding(entry.job.seq)
      }
      if (index.outboxCount() > 0) this.scheduleEmbedding(0)
    } catch (error: unknown) {
      /* v8 ignore next -- disposal aborts the provider; a closed index is the same path. */
      if (this.embeddingAbort?.signal.aborted === true || this.index !== index) return
      this.ctx.logger.warn(`experimental-memory: embedding the search index failed: ${String(error)}`)
      index.retryEmbeddings(jobs.map(entry => entry.job.seq), Date.now() + this.embedRetryMs)
      this.scheduleEmbedding(this.embedRetryMs)
    } finally {
      this.embeddingDraining = false
      this.embeddingAbort = undefined
    }
  }

  /** Episodes of the view's owner and project, newest first. */
  private visibleEpisodes(view: MemoryView): EpisodeRecord[] {
    const workspace = view.workspace
    if (workspace === undefined) return []
    return this.allEpisodes()
      .filter(record => record.owner === view.owner && scopeProjectId(record.scope) === workspace.id)
      .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
  }

  /**
   * Candidate records for one recall. With a sidecar open, FTS5 returns the
   * strongest active matches; without one, every visible active record is a
   * candidate and the ranking stage owns the scan.
   * @param view - owner and optional project.
   * @param text - query text.
   * @param alternatives - additional wordings of the query.
   * @param kind - optional kind filter.
   * @returns candidate records in sidecar order.
   */
  private async recallCandidates(
    view: MemoryView,
    text: string,
    alternatives: readonly string[] | undefined,
    kind: MemoryKind | undefined,
  ): Promise<MemoryRecord[]> {
    const index = this.index
    if (index === undefined) {
      return this.all().filter(record => visibleIn(view, record)
        && isCurrent(record) && record.status === 'active' && (kind === undefined || record.kind === kind))
    }
    const embeddings = this.ctx.get('embeddings')
    const semantic = embeddings !== undefined && embeddings.enabled
      && this.limits.semanticWeight > 0 && memoryTokens(text).length > 0
    const lexicalLimit = semantic ? Math.max(this.limits.maxRecallResults, 1) : this.limits.maxSemanticCandidates
    const ids = new Set(index.searchRecordIds({
      view,
      text,
      limit: lexicalLimit,
      ...alternatives === undefined ? {} : { alternatives },
      ...kind === undefined ? {} : { kind },
    }))
    if (embeddings !== undefined && semantic) {
      try {
        const [query] = await embeddings.embed({ texts: [text] })
        /* v8 ignore next 5 -- a provider returning no query vector leaves lexical candidates. */
        if (query !== undefined) {
          for (const id of index.nearestRecordIds(
            view, query, Math.max(this.limits.maxSemanticCandidates - lexicalLimit, 1), embeddings.model,
          )) ids.add(id)
        }
      /* v8 ignore next 3 -- a failed query embedding leaves lexical candidates. */
      } catch (error: unknown) {
        /* v8 ignore next -- a failed query embedding leaves lexical candidates. */
        this.ctx.logger.warn(`experimental-memory: semantic candidates unavailable: ${String(error)}`)
      }
    }
    return [...ids].flatMap((id) => {
      const record = this.records.get(MemoryId(id))
      /* v8 ignore next 2 -- a stale sidecar row resolves to no record */
      if (record === undefined) return []
      return [record]
    })
  }

  /**
   * Candidate episodes for one search, from the sidecar when it is open and
   * from the visible episodes otherwise.
   * @param request - view, text, alternatives, kind/time filters, session exclusion, and limit.
   * @returns candidate episodes.
   */
  private async episodeCandidates(request: EpisodeSearchRequest): Promise<EpisodeRecord[]> {
    const view = request.view
    if (view.workspace === undefined) return []
    const { kinds, since, until } = request
    if (this.index === undefined) {
      return this.visibleEpisodes(view).filter(record =>
        (kinds === undefined || kinds.includes(record.kind))
        && (since === undefined || record.createdAt >= since)
        && (until === undefined || record.createdAt <= until))
    }
    const index = this.index
    const embeddings = this.ctx.get('embeddings')
    const requested = request.limit ?? this.limits.maxRecallResults
    // Excluding a Session removes candidates after the index returns them, so ask
    // for a wider pool than the visible result needs.
    const resultLimit = request.excludeSession === undefined
      ? requested
      : Math.min(requested * 2, this.limits.maxSemanticCandidates)
    const semantic = embeddings !== undefined && embeddings.enabled
      && this.limits.semanticWeight > 0 && memoryTokens(request.text).length > 0
    const lexicalLimit = semantic ? Math.max(resultLimit, 1) : this.limits.maxSemanticCandidates
    const ids = new Set(index.searchEpisodeIds({
      view,
      text: request.text,
      limit: lexicalLimit,
      ...request.alternatives === undefined ? {} : { alternatives: request.alternatives },
      ...kinds === undefined ? {} : { kinds },
      ...since === undefined ? {} : { since },
      ...until === undefined ? {} : { until },
    }))
    if (embeddings !== undefined && semantic) {
      try {
        const [query] = await embeddings.embed({ texts: [request.text] })
        /* v8 ignore next 5 -- a provider returning no query vector leaves lexical candidates. */
        if (query !== undefined) {
          for (const id of index.nearestEpisodeIds(
            view, query, Math.max(this.limits.maxSemanticCandidates - lexicalLimit, 1), embeddings.model,
          )) ids.add(id)
        }
      /* v8 ignore next 3 -- a failed query embedding leaves lexical candidates. */
      } catch (error: unknown) {
        /* v8 ignore next -- a failed query embedding leaves lexical candidates. */
        this.ctx.logger.warn(`experimental-memory: semantic episode candidates unavailable: ${String(error)}`)
      }
    }
    return [...ids].flatMap((id) => {
      const record = this.episodes.get(EpisodeId(id))
      /* v8 ignore next 2 -- a stale sidecar row resolves to no episode */
      if (record === undefined) return []
      return [record]
    })
  }

  private get records() {
    /* v8 ignore next -- Cordis publishes the service only after initialization resolves */
    if (this.domain === undefined) throw new Error('experimental-memory: service used before activation')
    return this.domain.table('records')
  }

  /** Every stored record, in storage order. */
  private all(): MemoryRecord[] {
    return [...this.records.entries()].map(([, record]) => record)
  }

  /**
   * Resolve the canonical workspace of a Session from its immutable header
   * directory, once per Session.
   */
  private workspaceOf(session: Session): Promise<string | undefined> {
    let workspace = this.workspaces.get(session)
    if (workspace === undefined) {
      const cwd = session.header.cwd
      workspace = cwd === undefined ? Promise.resolve(undefined) : realpath(cwd).then(
        path => path,
        (error: unknown) => {
          // A missing project directory leaves the Session with profile records only instead of failing its turn.
          this.ctx.logger.warn(`experimental-memory: directory of Session "${session.id}" is unavailable: ${String(error)}`)
          return undefined
        },
      )
      this.workspaces.set(session, workspace)
    }
    return workspace
  }

  /**
   * The owner this Host serves now, read at each call because sign-in can
   * change between turns: the signed-in account where the gateway names
   * accounts, the local owner where it does not, and whether a Host that names
   * accounts is signed out or has not verified a session yet.
   * @returns the resolved owner, or the reason it is unavailable.
   */
  private owner(): OwnerResolution {
    const account = this.ctx.get('tomatoAccount')
    if (account === undefined) return { kind: 'available', owner: LOCAL_MEMORY_OWNER }
    const current = account.current()
    switch (current.status) {
      case 'signed-in':
        return { kind: 'available', owner: accountMemoryOwner(current.user.id) }
      case 'signed-out':
        return { kind: 'signed-out' }
      case 'unknown':
        return { kind: 'loading' }
      /* v8 ignore next 2 -- CurrentAccount is closed and every member is handled above */
      default:
        throw new TypeError(`unknown account state: ${String(current)}`)
    }
  }

  /**
   * Resolve which records a Session can use now.
   * @param session - Session whose original project directory scopes workspace records.
   * @returns the current owner's view, `sign-in-required` after a confirmed sign-out, or `account-loading`
   *   before the gateway has verified who is signed in.
   */
  async accessOf(session: Session): Promise<MemoryAccess> {
    const path = await this.workspaceOf(session)
    const resolved = this.owner()
    if (resolved.kind !== 'available') return unavailableAccess(resolved)
    const { owner } = resolved
    return { kind: 'available', view: path === undefined ? { owner } : { owner, workspace: await this.workspaceFor(path) } }
  }

  /**
   * Build the view a caller with no Session uses: the signed-in owner's profile
   * records, with no workspace. The phone's memory page reads through this when
   * the Session it follows has no project directory.
   * @returns the owner's profile-only access, `sign-in-required` after a confirmed sign-out, or `account-loading`
   *   before the gateway has verified who is signed in.
   */
  accessProfile(): MemoryAccess {
    const resolved = this.owner()
    return resolved.kind === 'available'
      ? { kind: 'available', view: { owner: resolved.owner } }
      : unavailableAccess(resolved)
  }

  /**
   * Resolve which records work in one project directory can use now.
   *
   * A run without a Session asks by directory instead of by Session. An
   * unavailable directory leaves the owner's profile records only, the same
   * fallback a Session without one gets.
   * @param path - project directory the work happens in.
   * @returns the current owner's view, `sign-in-required` after a confirmed sign-out, or `account-loading`
   *   before the gateway has verified who is signed in.
   */
  async accessFor(path: string): Promise<MemoryAccess> {
    const resolved = this.owner()
    if (resolved.kind !== 'available') return unavailableAccess(resolved)
    const canonical = await realpath(path).then(resolved => resolved, () => undefined)
    return {
      kind: 'available',
      view: canonical === undefined
        ? { owner: resolved.owner }
        : { owner: resolved.owner, workspace: await this.workspaceFor(canonical) },
    }
  }

  /**
   * Resolve one canonical directory to the workspace identity a view carries.
   * @param path - canonical project directory.
   * @returns the registry id, or the deterministic provisional id without a registry.
   */
  private async workspaceFor(path: string): Promise<MemoryWorkspace> {
    return await resolveMemoryWorkspace(this.ctx, path)
  }

  /**
   * Map records and episodes written before domain v2 to a project identity,
   * and records written before v3 to a version start. Idempotent: entries that
   * already carry both are skipped.
   * @param records - authoritative record table.
   * @param episodes - project-history table.
   * @returns how many entries were rewritten.
   */
  private async migrateProjectScopes(
    records: KvTable<MemoryIdType, MemoryRecord>,
    episodes: KvTable<EpisodeIdType, EpisodeRecord>,
  ): Promise<number> {
    let migrated = 0
    for (const [key, record] of records.entries()) {
      let scope: MemoryScope = record.scope
      if (record.scope.kind === 'workspace' && record.scope.workspaceId === undefined && record.scope.path !== undefined) {
        const workspace = await this.workspaceFor(record.scope.path)
        scope = { kind: 'workspace', workspaceId: workspace.id, path: workspace.path }
      }
      if (scope === record.scope && record.validFrom !== undefined) continue
      await records.put(key, { ...record, scope, validFrom: record.validFrom ?? record.createdAt })
      migrated += 1
    }
    for (const [key, record] of episodes.entries()) {
      if (record.scope.workspaceId !== undefined || record.scope.path === undefined) continue
      const workspace = await this.workspaceFor(record.scope.path)
      const scope: EpisodeScope = { kind: 'project', workspaceId: workspace.id, path: workspace.path }
      await episodes.put(key, { ...record, scope })
      migrated += 1
    }
    if (migrated > 0) this.ctx.logger.info(`experimental-memory: mapped ${migrated} stored scope(s) to project identities`)
    return migrated
  }

  /**
   * Close every extra current version of one identity, keeping the newest.
   * A crash between the two writes of a replacement can leave duplicates.
   * @param records - authoritative record table.
   * @returns how many versions were closed.
   */
  private async repairCurrentVersions(records: KvTable<MemoryIdType, MemoryRecord>): Promise<number> {
    const groups = new Map<string, MemoryRecord[]>()
    for (const [, record] of records.entries()) {
      /* v8 ignore next -- a superseded row in the table is skipped by the repair sweep. */
      if (!isCurrent(record)) continue
      const key = identityKey(record)
      const group = groups.get(key)
      if (group === undefined) groups.set(key, [record])
      else group.push(record)
    }
    let repaired = 0
    for (const versions of groups.values()) {
      if (versions.length < 2) continue
      versions.sort((left, right) => (right.validFrom ?? right.createdAt) - (left.validFrom ?? left.createdAt)
        || right.createdAt - left.createdAt || left.id.localeCompare(right.id))
      const newest = versions[0]
      /* v8 ignore next -- the group has at least two entries. */
      if (newest === undefined) continue
      for (const record of versions.slice(1)) {
        const closed: MemoryRecord = {
          ...record,
          /* v8 ignore next -- migration fills validFrom before the repair sweep. */
          validTo: newest.validFrom ?? newest.createdAt,
          supersededBy: newest.id,
          updatedAt: Date.now(),
        }
        await records.put(record.id, closed)
        repaired += 1
      }
    }
    if (repaired > 0) this.ctx.logger.info(`experimental-memory: closed ${repaired} duplicate current version(s)`)
    return repaired
  }

  /**
   * Re-resolve provisional identities once the workspace registry arrives, so
   * records written before it mounted join the registry's stable identity.
   */
  private async reconcileProjectIds(): Promise<void> {
    /* v8 ignore next -- the inject callback runs only after activation assigns both domains */
    if (this.domain === undefined || this.episodeDomain === undefined) return
    let changed = 0
    for (const [key, record] of this.domain.table('records').entries()) {
      if (record.scope.kind !== 'workspace' || record.scope.path === undefined) continue
      const current = scopeProjectId(record.scope)
      if (!String(current).startsWith(PROVISIONAL_PREFIX)) continue
      const workspace = await this.workspaceFor(record.scope.path)
      if (String(workspace.id) === String(current)) continue
      const scope: MemoryScope = { kind: 'workspace', workspaceId: workspace.id, path: workspace.path }
      await this.domain.table('records').put(key, { ...record, scope })
      changed += 1
    }
    for (const [key, record] of this.episodeDomain.table('records').entries()) {
      if (record.scope.path === undefined) continue
      const current = scopeProjectId(record.scope)
      if (!String(current).startsWith(PROVISIONAL_PREFIX)) continue
      const workspace = await this.workspaceFor(record.scope.path)
      if (String(workspace.id) === String(current)) continue
      const scope: EpisodeScope = { kind: 'project', workspaceId: workspace.id, path: workspace.path }
      await this.episodeDomain.table('records').put(key, { ...record, scope })
      changed += 1
    }
    if (changed > 0) {
      this.ctx.logger.info(`experimental-memory: re-mapped ${changed} scope(s) to registry identities`)
      /* v8 ignore start -- a rebuild failure is contained by the in-memory fallback */
      if (this.index !== undefined) {
        try {
          this.index.rebuild(this.currentRecords(), this.allEpisodes())
          this.scheduleEmbedding(0)
        } catch (error: unknown) {
          this.disableIndex(error)
        }
      }
      /* v8 ignore stop */
    }
  }

  /** The view's record with this id. */
  private visible(view: MemoryView, id: MemoryIdType): MemoryRecord | undefined {
    const record = this.records.get(id)
    return record !== undefined && visibleIn(view, record) ? record : undefined
  }

  /**
   * Resolve a caller scope to a form that carries a project identity. A
   * path-only scope resolves through the workspace registry or the
   * deterministic provisional id.
   * @param scope - caller scope.
   * @returns the scope with a resolved workspace identity.
   * @throws {@link MemoryError} `invalid-scope` when the scope names neither an identity nor a path.
   */
  private async scopeWithIdentity(scope: MemoryScope): Promise<MemoryScope> {
    if (scope.kind === 'profile' || scope.workspaceId !== undefined) return scope
    if (scope.path === undefined) {
      throw new MemoryError('a workspace scope needs a project identity or a canonical path', 'invalid-scope')
    }
    const workspace = await this.workspaceFor(scope.path)
    return { kind: 'workspace', workspaceId: workspace.id, path: workspace.path }
  }

  /**
   * Resolve an episode scope to one with a project identity and the canonical
   * path its pruning, duplicate, and promotion queries need.
   * @param scope - caller episode scope.
   * @returns the scope with an identity and a definite path.
   * @throws {@link MemoryError} `invalid-scope` when neither the path nor a registry record supplies one.
   */
  private async episodeScopeWithIdentity(scope: EpisodeScope): Promise<ResolvedEpisodeScope> {
    if (scope.workspaceId !== undefined) {
      if (scope.path === undefined) {
        throw new MemoryError('a project episode needs its canonical path', 'invalid-scope')
      }
      return { kind: 'project', workspaceId: scope.workspaceId, path: scope.path }
    }
    if (scope.path === undefined) {
      throw new MemoryError('a project episode needs a project identity or a canonical path', 'invalid-scope')
    }
    const workspace = await this.workspaceFor(scope.path)
    return { kind: 'project', workspaceId: workspace.id, path: workspace.path }
  }

  /**
   * Store one record version, closing the current version of the same owner,
   * scope, entity, and key.
   * Entity, key, and value are normalized before the identity lookup.
   * @param request - owner, scope, statement, lifecycle state, and the write that justified it.
   * @returns the newly stored version; the superseded version keeps its id and gains `validTo` and `supersededBy`.
   * @throws {@link MemoryError} `invalid-identifier`, `empty-value`, `value-too-large`, `workspace-full`, `profile-full`, or `write-busy`.
   */
  async remember(request: RememberRequest): Promise<MemoryRecord> {
    return this.serializeWrite(async () => {
      const path = this.writeLockPath()
      if (path === undefined) return this.rememberNow(request)
      const limits = this.limits
      try {
        return await withWriteLock(
          path,
          { timeoutMs: limits.writeLockTimeoutMs, staleMs: limits.writeLockStaleMs },
          async () => {
            // Another Host process may have written this identity since this
            // process opened the domain; the lock makes the re-read safe.
            await this.domain?.reload()
            return this.rememberNow(request)
          },
        )
      } catch (error: unknown) {
        if (error instanceof WriteLockTimeoutError) throw new MemoryError(error.message, 'write-busy')
        throw error
      }
    })
  }

  /** Absolute lock file excluding another Host process from this home's writes. */
  private writeLockPath(): string | undefined {
    const homePath = this.ctx.get('tomatoHomePath')
    return homePath === undefined ? undefined : homePath('memory', 'write.lock')
  }

  /**
   * Re-read the stored domains when another Host process may have written
   * since the last check. A backend that reports a change token makes this a
   * few `stat` calls per interval; one without a token is never re-read.
   * @returns resolution after this process's mirror matches the medium.
   */
  async refresh(): Promise<void> {
    const domain = this.domain
    /* v8 ignore next -- reads reach the service only after activation opened the domains */
    if (domain === undefined) return
    const interval = this.limits.refreshIntervalMs
    if (interval === 0) return
    const now = Date.now()
    if (now - this.lastRefreshAt < interval) return
    this.lastRefreshAt = now
    const stamps = await Promise.all([domain.changeStamp(), this.episodeDomain?.changeStamp()])
    const previous = this.changeStamps
    this.changeStamps = stamps
    if (stamps.every(stamp => stamp === undefined)) return
    if (previous !== undefined && stamps.every((stamp, index) => stamp === undefined || stamp === previous[index])) return
    await Promise.all([domain.reload(), this.episodeDomain?.reload()])
  }

  /**
   * Run one operation at the head of this service's write chain. A failed
   * operation rejects its own caller and leaves the chain running.
   * @param operation - the write sequence to run exclusively.
   * @returns the operation's result.
   */
  private serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.writeChain.then(operation, operation)
    this.writeChain = run.then(() => undefined, () => undefined)
    return run
  }

  /**
   * Write one memory after this process has seen every earlier write of the
   * same identity, so two Sessions cannot both store a current version.
   */
  private async rememberNow(request: RememberRequest): Promise<MemoryRecord> {
    const entity = normalizeIdentifier(request.entity)
    const key = normalizeIdentifier(request.key)
    if (!isMemoryIdentifier(entity) || !isMemoryIdentifier(key)) {
      throw new MemoryError(
        `entity and key must be lower-kebab-case identifiers of at most 64 characters, got "${request.entity}" and "${request.key}"`,
        'invalid-identifier',
      )
    }
    const value = normalizeStatement(request.value)
    if (value === '') throw new MemoryError('a memory value must not be empty', 'empty-value')
    if (Buffer.byteLength(value, 'utf8') > this.limits.maxValueBytes) {
      throw new MemoryError(`a memory value is limited to ${this.limits.maxValueBytes} UTF-8 bytes`, 'value-too-large')
    }
    const scope = await this.scopeWithIdentity(request.scope)
    const records = this.all().filter(record => record.owner === request.owner && sameScope(record.scope, scope) && isCurrent(record))
    const previous = records.find(record => record.entity === entity && record.key === key)
    if (previous === undefined) {
      if (scope.kind === 'profile' && records.length >= this.limits.maxProfileRecords) {
        throw new MemoryError(`the profile already stores ${this.limits.maxProfileRecords} memories; delete unused ones first`, 'profile-full')
      }
      if (scope.kind === 'workspace' && records.length >= this.limits.maxRecordsPerWorkspace) {
        throw new MemoryError(
          `this workspace already stores ${this.limits.maxRecordsPerWorkspace} memories; delete unused ones first`,
          'workspace-full',
        )
      }
    }
    const now = Date.now()
    const record: MemoryRecord = {
      id: MemoryId(`memory-${randomUUID()}`),
      owner: request.owner,
      scope,
      kind: request.kind,
      entity,
      key,
      value,
      status: request.status,
      pinned: request.status === 'active' && scope.kind === 'workspace' && request.pinned,
      validFrom: now,
      createdAt: now,
      updatedAt: now,
      source: request.source,
    }
    await this.records.put(record.id, record)
    this.indexRecord(record)
    if (previous !== undefined) {
      const closed: MemoryRecord = { ...previous, validTo: now, supersededBy: record.id, updatedAt: now }
      await this.records.put(closed.id, closed)
      this.unindexRecord(closed.id)
      await this.dropVector('fact', closed.id)
      await this.pruneVersions(request.owner, scope, entity, key, now)
    }
    return record
  }


  /** Storage key of one cached vector. */
  private vectorKey(target: VectorTarget, recordId: string): VectorIdType {
    return VectorId(`${target}:${recordId}`)
  }

  /** Read a current vector for one record, or `undefined` when it is absent or stale. */
  private cachedVector(target: VectorTarget, recordId: string, model: string, updatedAt: number): Float32Array | undefined {
    if (this.index !== undefined) {
      const indexed = this.index.getVector(indexTargetOf(target), recordId, model, updatedAt)
      if (indexed !== undefined) return indexed
    }
    const stored = this.vectors.get(this.vectorKey(target, recordId))
    if (stored === undefined || stored.model !== model || stored.contentUpdatedAt !== updatedAt) return undefined
    const vector = decodeVector(stored.vector, stored.dimensions)
    if (vector === undefined) {
      this.ctx.logger.warn(`experimental-memory: dropping a malformed cached vector for "${recordId}"`)
      void this.dropVector(target, recordId)
      return undefined
    }
    return vector
  }

  /** Store one vector and keep the cache under its cap. */
  private async putVector(
    target: VectorTarget,
    owner: MemoryOwner,
    recordId: string,
    contentUpdatedAt: number,
    model: string,
    vector: Float32Array,
  ): Promise<void> {
    if (this.limits.maxEmbeddingVectors === 0) return
    if (this.index !== undefined) {
      try {
        this.index.putVector(indexTargetOf(target), recordId, model, vector.length, vector, contentUpdatedAt)
        return
      } catch (error: unknown) {
        /* v8 ignore next -- a failed sidecar vector write is contained by the in-memory fallback. */
        this.disableIndex(error)
      }
    }
    const record: VectorRecord = {
      id: this.vectorKey(target, recordId),
      owner,
      target,
      recordId,
      model,
      dimensions: vector.length,
      contentUpdatedAt,
      vector: encodeVector(vector),
      updatedAt: Date.now(),
    }
    try {
      await this.vectors.put(record.id, record)
      await this.pruneVectors()
    } catch (error: unknown) {
      /* v8 ignore next -- a write failure leaves the vector uncached; search still has the fresh value */
      this.ctx.logger.warn(`experimental-memory: caching one embedding vector failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /** Drop the oldest cached vectors above the configured cap. */
  private async pruneVectors(): Promise<void> {
    const max = this.limits.maxEmbeddingVectors
    const stored = this.allVectors()
    if (stored.length <= max) return
    stored.sort((left, right) => left.updatedAt - right.updatedAt || left.id.localeCompare(right.id))
    for (const record of stored.slice(0, stored.length - max)) await this.vectors.delete(record.id)
  }

  /** Drop one cached vector; a failure leaves a stale entry that the next search replaces. */
  private async dropVector(target: VectorTarget, recordId: string): Promise<void> {
    try {
      this.index?.deleteVector(indexTargetOf(target), recordId)
    } catch (error: unknown) {
      /* v8 ignore next -- a failed sidecar delete leaves an entry the next rebuild removes */
      this.ctx.logger.warn(`experimental-memory: dropping a sidecar vector failed: ${String(error)}`)
    }
    try {
      await this.vectors.delete(this.vectorKey(target, recordId))
    } catch (error: unknown) {
      /* v8 ignore next -- a failed delete leaves a stale entry that the next search replaces */
      this.ctx.logger.warn(`experimental-memory: dropping a cached vector failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Rank the view's active records against free text. A mounted embedding
   * provider blends vector similarity into the lexical score for the strongest
   * candidates; without one, or when the provider fails, ranking stays lexical.
   * @param request - view, query text, optional alternative wordings, kind filter, and cancellation.
   * @returns at most `maxRecallResults` records, best match first.
   */
  async recall(request: RecallRequest): Promise<readonly MemoryRecord[]> {
    await this.refresh()
    const candidates = await this.recallCandidates(request.view, request.text, request.alternatives, request.kind)
    const ranked = scoreMemories(candidates, request.text, request.alternatives)
    const limit = this.limits.maxRecallResults
    const lexical = (): MemoryRecord[] => ranked.slice(0, limit).map(entry => entry.record)
    const embeddings = this.ctx.get('embeddings')
    const { semanticWeight, semanticFloor, maxSemanticCandidates } = this.limits
    if (embeddings === undefined || ! embeddings.enabled
      || semanticWeight === 0 || memoryTokens(request.text).length === 0) return lexical()
    // An empty lexical result still offers recency-ordered candidates, so a
    // paraphrase with no shared words can reach the semantic comparison. When
    // lexical hits exist, unmatched records fill the rest of the pool.
    const pool: { record: MemoryRecord; score: number }[] = ranked.slice(0, maxSemanticCandidates)
    if (pool.length < maxSemanticCandidates) {
      const seen = new Set(pool.map(entry => entry.record.id))
      for (const entry of scoreMemories(candidates, '')) {
        if (pool.length >= maxSemanticCandidates) break
        if (!seen.has(entry.record.id)) pool.push(entry)
      }
    }
    if (pool.length === 0) return lexical()
    const model = embeddings.model
    try {
      const cached = pool.map(entry => this.cachedVector('fact', entry.record.id, model, entry.record.updatedAt))
      const missing = cached.flatMap((vector, index) => vector === undefined ? [index] : [])
      const vectors = await embeddings.embed({
        texts: [request.text, ...missing.map((index) => {
          const record = pool[index]?.record
          /* v8 ignore next 2 -- every missing index comes from the same pool */
          if (record === undefined) throw new Error('semantic candidate disappeared')
          return memoryEmbeddingText(record)
        })],
        ...request.signal === undefined ? {} : { signal: request.signal },
      })
      const [query, ...computed] = vectors
      if (query === undefined || computed.length !== missing.length) {
        throw new Error(`the embedding provider returned ${vectors.length} vectors for ${missing.length + 1} inputs`)
      }
      const recordVectors = [...cached]
      for (const [position, index] of missing.entries()) recordVectors[index] = computed[position]
      const blended = pool.map((entry, index) => {
        const recordVector = recordVectors[index]
        /* v8 ignore next -- every pool entry has a cached or freshly computed vector */
        if (recordVector === undefined) throw new Error('the embedding provider returned no vector for one record')
        const similarity = cosineSimilarity(query, recordVector)
        return {
          record: entry.record,
          lexical: entry.score,
          score: (1 - semanticWeight) * entry.score + semanticWeight * Math.max(0, similarity),
          similarity,
        }
      }).filter(entry => entry.lexical > 0 || entry.similarity >= semanticFloor)
      blended.sort((left, right) => right.score - left.score
        || right.record.updatedAt - left.record.updatedAt
        || left.record.id.localeCompare(right.record.id))
      const persisted = missing.flatMap((index, position) => {
        const record = pool[index]?.record
        const vector = computed[position]
        /* v8 ignore next -- every missing pool entry has both a record and a fresh vector */
        return record === undefined || vector === undefined ? [] : [{ record, vector }]
      })
      await Promise.all(persisted.map(entry => this.putVector('fact', entry.record.owner, entry.record.id, entry.record.updatedAt, model, entry.vector)))
      return blended.slice(0, limit).map(entry => entry.record)
    } catch (error) {
      if (request.signal?.aborted === true) throw error
      this.ctx.logger.warn(`experimental-memory: semantic ranking unavailable: ${error instanceof Error ? error.message : String(error)}`)
      return lexical()
    }
  }

  /**
   * Walk the relations of one active record: records about the same subject,
   * records written in the same Session, and records sharing the attribute.
   * Every hop reads only the view, so nothing of another owner or workspace is
   * reached. A candidate, or a record outside the view, reaches nothing.
   * @param view - owner and optional workspace that bound the walk.
   * @param id - starting record.
   * @param depth - hops to follow, from 1 to {@link MAX_RELATION_DEPTH}; defaults to one.
   * @returns reached records in discovery order, at most `maxRecallResults`.
   * @throws TypeError when `depth` is not an integer in range.
   */
  related(view: MemoryView, id: MemoryIdType, depth: number = 1): readonly RelatedMemory[] {
    if (!Number.isSafeInteger(depth) || depth < 1 || depth > MAX_RELATION_DEPTH) {
      throw new TypeError(`experimental-memory: depth must be an integer from 1 to ${MAX_RELATION_DEPTH}`)
    }
    const seed = this.visible(view, id)
    if (seed?.status !== 'active') return []
    const active = this.all().filter(record => visibleIn(view, record) && isCurrent(record) && record.status === 'active')
    const visited = new Set<MemoryIdType>([seed.id])
    const reached: RelatedMemory[] = []
    let frontier: readonly MemoryRecord[] = [seed]
    for (let hop = 1; hop <= depth && reached.length < this.limits.maxRecallResults; hop += 1) {
      const next: MemoryRecord[] = []
      for (const node of frontier) {
        for (const via of MEMORY_RELATIONS) {
          const connects = RELATION_EDGES[via]
          for (const record of active.filter(other => !visited.has(other.id) && connects(node, other)).sort(newestFirst)) {
            if (reached.length >= this.limits.maxRecallResults) break
            visited.add(record.id)
            reached.push({ record, depth: hop, via })
            next.push(record)
          }
        }
      }
      frontier = next
    }
    return reached
  }

  /**
   * Find active records of the same owner, scope, and kind whose value states
   * nearly the same thing as a pending write: the two values share at least
   * {@link DUPLICATE_COVERAGE} of the larger value's word set, and each holds
   * at least {@link MIN_DUPLICATE_TOKENS}. The record the write would replace
   * by `(entity, key)` is not a match. Detection is lexical and conservative;
   * it never rejects or changes a write.
   * @param query - owner, scope, kind, identifiers, and value of the pending write.
   * @returns matching records, best match first, at most `maxRecallResults`.
   */
  duplicates(query: DuplicateQuery): readonly DuplicateMatch[] {
    const candidate = new Set(memoryTokens(query.value))
    if (candidate.size < MIN_DUPLICATE_TOKENS) return []
    const matches: DuplicateMatch[] = []
    for (const record of this.all()) {
      if (record.owner !== query.owner || !sameScope(record.scope, query.scope)) continue
      if (!isCurrent(record) || record.status !== 'active' || record.kind !== query.kind) continue
      if (record.entity === query.entity && record.key === query.key) continue
      const tokens = new Set(memoryTokens(record.value))
      if (tokens.size < MIN_DUPLICATE_TOKENS) continue
      const coverage = tokenContainment(candidate, tokens)
      if (coverage < DUPLICATE_COVERAGE) continue
      matches.push({ record, coverage })
    }
    return matches
      .sort((left, right) => right.coverage - left.coverage || newestFirst(left.record, right.record))
      .slice(0, this.limits.maxRecallResults)
  }

  /**
   * Count what the view stores and how much of its capacity that is.
   * @param view - owner and optional workspace.
   * @returns stored counts, both scope limits, and the oldest active update.
   */
  stats(view: MemoryView): MemoryStats {
    const records = this.all().filter(record => visibleIn(view, record))
    const current = records.filter(isCurrent)
    const active = current.filter(record => record.status === 'active')
    const workspace = current.filter(record => record.scope.kind === 'workspace')
    return {
      total: current.length,
      active: active.length,
      candidates: current.length - active.length,
      pinned: current.filter(record => record.pinned).length,
      versions: records.length,
      profile: {
        stored: current.length - workspace.length,
        limit: this.limits.maxProfileRecords,
      },
      workspace: view.workspace === undefined
        ? null
        : { stored: workspace.length, limit: this.limits.maxRecordsPerWorkspace },
      oldestActiveUpdate: active.length === 0 ? null : Math.min(...active.map(record => record.updatedAt)),
      vectors: this.index?.vectorCount() ?? this.allVectors().length,
    }
  }

  /**
   * Every stored version of one record identity, newest first.
   * @param view - view that must see the record.
   * @param id - any version id of the identity.
   * @returns the versions including the given one, or an empty list when the view sees no such record.
   */
  versions(view: MemoryView, id: MemoryIdType): readonly MemoryRecord[] {
    const target = this.visible(view, id)
    if (target === undefined) return []
    return this.all()
      .filter(record => record.owner === target.owner && sameScope(record.scope, target.scope)
        && record.entity === target.entity && record.key === target.key)
      .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
  }

  /**
   * Delete one record durably.
   * @param view - view that must see the record.
   * @param id - record to delete.
   * @returns whether the view saw the record.
   */
  async forget(view: MemoryView, id: MemoryIdType): Promise<boolean> {
    const target = this.visible(view, id)
    if (target === undefined) return false
    const versions = this.all().filter(record => record.owner === target.owner && sameScope(record.scope, target.scope)
      && record.entity === target.entity && record.key === target.key)
    for (const record of versions) {
      await this.records.delete(record.id)
      this.unindexRecord(record.id)
      await this.dropVector('fact', record.id)
    }
    return true
  }

  /**
   * Change whether an active workspace record is pinned.
   * @param view - view that must see the record.
   * @param id - record to change.
   * @param pinned - new pin state.
   * @returns the updated record, or `undefined` when the view sees no active workspace record with that id.
   */
  async setPinned(view: MemoryView, id: MemoryIdType, pinned: boolean): Promise<MemoryRecord | undefined> {
    const record = this.visible(view, id)
    if (record === undefined || !isCurrent(record) || record.status !== 'active' || record.scope.kind !== 'workspace') return undefined
    if (record.pinned === pinned) return record
    const updated = await this.records.update(id, current => ({ ...current, pinned, updatedAt: Date.now() }))
    this.indexRecord(updated)
    return updated
  }

  /**
   * Activate a candidate.
   * @param view - view that must see the record.
   * @param id - candidate to confirm.
   * @returns the active record, or `undefined` when the view sees no candidate with that id.
   */
  async confirm(view: MemoryView, id: MemoryIdType): Promise<MemoryRecord | undefined> {
    const record = this.visible(view, id)
    if (record === undefined || !isCurrent(record) || record.status !== 'candidate') return undefined
    const updated = await this.records.update(id, current => ({ ...current, status: 'active', updatedAt: Date.now() }))
    this.indexRecord(updated)
    return updated
  }

  /**
   * Enumerate every record a view sees, for human management.
   * @param view - owner and optional workspace.
   * @returns profile and workspace records, newest first.
   */
  list(view: MemoryView): readonly MemoryRecord[] {
    return this.all().filter(record => visibleIn(view, record) && isCurrent(record)).sort(newestFirst)
  }

  /**
   * Store one compressed episode. A repeated fingerprint of the same owner and
   * project updates the earlier record's timestamp instead of appending.
   * Every text field is normalized before the size check and the fingerprint lookup.
   * @param request - owner, project, episode fields, fingerprint, and source.
   * @returns the stored episode.
   * @throws {@link MemoryError} `invalid-identifier`, `empty-value`, `episode-too-large`, or `episodes-full`.
   */
  async rememberEpisode(request: RememberEpisodeRequest): Promise<EpisodeRecord> {
    const type = normalizeIdentifier(request.type)
    if (!EPISODE_TYPE.test(type)) {
      throw new MemoryError(`an episode type must be one lower-kebab-case word, got "${request.type}"`, 'invalid-identifier')
    }
    const title = normalizeStatement(request.title)
    if (title === '') throw new MemoryError('an episode title must not be empty', 'empty-value')
    const subtitle = request.subtitle === undefined ? '' : normalizeStatement(request.subtitle)
    const narrative = normalizeStatement(request.narrative)
    const scope = await this.episodeScopeWithIdentity(request.scope)
    const projectId = scope.workspaceId
    const facts = this.uncoveredFacts(
      request.owner,
      { id: projectId, path: scope.path },
      (request.facts ?? []).map(normalizeStatement).filter(fact => fact !== ''),
    )
    const concepts = (request.concepts ?? []).map(normalizeStatement).filter(concept => concept !== '')
    const filesRead = (request.filesRead ?? []).map(normalizeStatement).filter(file => file !== '')
    const filesModified = (request.filesModified ?? []).map(normalizeStatement).filter(file => file !== '')
    const tool = request.tool === undefined ? undefined : normalizeStatement(request.tool)
    const characters = [title, subtitle, narrative,
      ...facts, ...concepts, ...filesRead, ...filesModified]
      .join('').length
    if (characters > this.limits.maxEpisodeChars) {
      throw new MemoryError(`an episode is limited to ${this.limits.maxEpisodeChars} characters across its text fields`, 'episode-too-large')
    }
    const current = this.allEpisodes().filter(record => record.owner === request.owner && scopeProjectId(record.scope) === projectId)
    const now = Date.now()
    await this.pruneEpisodes(request.owner, projectId, now)
    const repeated = current.find(record => record.fingerprint === request.fingerprint)
    if (repeated !== undefined) {
      await this.dropVector('episode', repeated.id)
      const updated = await this.episodes.update(repeated.id, record => ({ ...record, updatedAt: now }))
      this.indexEpisode(updated)
      return updated
    }
    const stored = this.allEpisodes().filter(record => record.owner === request.owner && scopeProjectId(record.scope) === projectId)
    if (stored.length >= this.limits.maxEpisodesPerWorkspace) {
      throw new MemoryError(`this project already stores ${this.limits.maxEpisodesPerWorkspace} episodes; delete unused ones first`, 'episodes-full')
    }
    const record: EpisodeRecord = {
      id: EpisodeId(`episode-${randomUUID()}`),
      owner: request.owner,
      scope,
      kind: request.kind,
      type,
      title,
      ...subtitle === '' ? {} : { subtitle },
      narrative,
      facts,
      concepts,
      filesRead,
      filesModified,
      ...tool === undefined ? {} : { tool },
      fingerprint: request.fingerprint,
      source: request.source,
      createdAt: now,
      updatedAt: now,
    }
    await this.episodes.put(record.id, record)
    this.indexEpisode(record)
    return record
  }

  /**
   * Promote repeated observation facts into candidate records. Two episodes
   * from different Sessions whose first facts share
   * {@link DUPLICATE_COVERAGE} of their words form one group; the group's fact
   * becomes one workspace record unless an active record already states it,
   * and every member is marked with the record it promoted into. Failure
   * observations and facts that only report an exit code never promote.
   * @param view - owner and project; a view without a project promotes nothing.
   * @returns the records created or reused, with the episodes each covers.
   */
  async promote(view: MemoryView): Promise<readonly PromotionOutcome[]> {
    if (view.workspace === undefined) return []
    const episodes = this.visibleEpisodes(view)
      .filter(record => record.kind === 'observation' && record.promotedTo === undefined && promotableFact(record) !== undefined)
    const claimed = new Set<string>()
    const outcomes: PromotionOutcome[] = []
    for (const episode of episodes) {
      if (claimed.has(episode.id)) continue
      const fact = promotableFact(episode)
      /* v8 ignore next -- the filter above keeps only episodes with a promotable fact */
      if (fact === undefined) continue
      const tokens = new Set(memoryTokens(fact))
      if (tokens.size < MIN_DUPLICATE_TOKENS) continue
      const group = episodes.filter((other) => {
        if (other.id === episode.id || other.source.sessionId === episode.source.sessionId) return false
        const otherFact = promotableFact(other)
        /* v8 ignore next -- the episode filter above keeps every grouped episode promotable */
        if (otherFact === undefined) return false
        const otherTokens = new Set(memoryTokens(otherFact))
        return otherTokens.size >= MIN_DUPLICATE_TOKENS && tokenContainment(tokens, otherTokens) >= DUPLICATE_COVERAGE
      })
      if (group.length === 0) continue
      const members = [episode, ...group]
      for (const member of members) claimed.add(member.id)
      // Three Sessions repeating one failure/lesson signature is a pitfall the
      // workspace has proven, not a one-off candidate.
      const pitfall = members.length >= 3
        && new Set(members.map(member => member.source.sessionId)).size >= 3
        && members.every(member => member.type === 'failure' || member.type === 'lesson')
      const key = pitfall ? `pitfall-${createHash('sha256').update(fact).digest('hex').slice(0, 8)}` : promotionKey(fact, episode)
      const scope = { kind: 'workspace', workspaceId: view.workspace.id, path: view.workspace.path } as const
      const entity = pitfall ? 'pitfall' : 'project'
      const kind = pitfall ? 'constraint' : 'fact'
      const status = pitfall ? 'active' : 'candidate'
      const value = pitfall ? `${fact} (repeated in ${members.length} sessions)` : fact
      const existing = this.all().find(record => record.owner === view.owner && sameScope(record.scope, scope)
        && isCurrent(record) && record.entity === entity && record.key === key)
      const duplicate = existing ?? this.duplicates({
        owner: view.owner, scope, kind, entity, key, value,
      })[0]?.record
      const recordId = duplicate === undefined
        ? (await this.remember({
          owner: view.owner,
          scope,
          kind,
          entity,
          key,
          value,
          status,
          pinned: false,
          source: { sessionId: episode.source.sessionId, episodeId: episode.id },
        })).id
        : duplicate.id
      for (const member of members) {
        await this.episodes.update(member.id, record => ({ ...record, promotedTo: recordId }))
      }
      outcomes.push({ recordId, episodeIds: members.map(member => member.id), entity, key, value })
    }
    return outcomes
  }

  /** Facts of one episode not already stated by an active record of the same project. */
  private uncoveredFacts(owner: MemoryOwner, workspace: MemoryWorkspace, facts: readonly string[]): string[] {
    const active = this.all().filter(record => record.owner === owner && isCurrent(record) && record.status === 'active'
      && record.scope.kind === 'workspace' && scopeProjectId(record.scope) === workspace.id)
    if (active.length === 0) return [...facts]
    return facts.filter((fact) => {
      const tokens = new Set(memoryTokens(fact))
      if (tokens.size < MIN_DUPLICATE_TOKENS) return true
      return !active.some((record) => {
        const stored = new Set(memoryTokens(record.value))
        return stored.size >= MIN_DUPLICATE_TOKENS && tokenContainment(tokens, stored) >= DUPLICATE_COVERAGE
      })
    })
  }

  /**
   * Delete monthly cold-archive files older than the configured retention.
   * @param root - archive directory.
   * @param now - month the just-written object belongs to.
   */
  private async pruneColdArchive(root: string, now: Date): Promise<void> {
    /* v8 ignore next -- the Loader schema fills the default. */
    const months = this.config.coldArchiveRetentionMonths ?? 6
    const cutoff = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const cutoffKey = `${String(cutoff.getFullYear())}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`
    try {
      for (const name of await readdir(root)) {
        const match = /^(\d{4})-(\d{2})\.jsonl$/u.exec(name)
        if (match === null) continue
        if (`${match[1]}-${match[2]}` < cutoffKey) await unlink(join(root, name))
      }
    } catch (error: unknown) {
      /* v8 ignore next -- an unreadable archive directory is a contained maintenance failure. */
      this.ctx.logger.warn(`experimental-memory: pruning the cold archive failed: ${String(error)}`)
    }
  }

  /**
   * Append one pruned object to the monthly cold archive when one is configured.
   * @param kind - object family.
   * @param record - the object about to leave the hot store.
   * @returns true when deletion may proceed; false keeps the hot object for a later retry.
   */
  private async archive(kind: 'episode' | 'record', record: EpisodeRecord | MemoryRecord): Promise<boolean> {
    const root = this.config.coldArchivePath
    if (root === undefined) return true
    const month = new Date(record.createdAt).toISOString().slice(0, 7)
    try {
      await mkdir(root, { recursive: true })
      await appendFile(join(root, `${month}.jsonl`), `${JSON.stringify({ kind, record })}\n`, 'utf8')
      await this.pruneColdArchive(root, new Date(record.createdAt))
      return true
    } catch (error: unknown) {
      this.ctx.logger.warn(`experimental-memory: cold archive write failed: ${String(error)}`)
      return false
    }
  }

  /** Delete episodes older than the retention window of one owner and project. */
  private async pruneEpisodes(owner: MemoryOwner, projectId: ProjectIdType, now: number): Promise<void> {
    const observationCutoff = now - this.limits.episodeRetentionDays * 86_400_000
    const summaryCutoff = now - this.limits.summaryRetentionDays * 86_400_000
    for (const record of this.allEpisodes()) {
      const cutoff = record.kind === 'summary' ? summaryCutoff : observationCutoff
      if (record.owner !== owner || scopeProjectId(record.scope) !== projectId || record.createdAt >= cutoff) continue
      if (!(await this.archive('episode', record))) continue
      await this.episodes.delete(record.id)
      this.unindexEpisode(record.id)
      await this.dropVector('episode', record.id)
    }
  }

  /**
   * Trim superseded versions of one identity by age and count. The current
   * version and up to `maxVersionsPerRecord` superseded versions survive.
   * @param owner - record owner.
   * @param scope - record scope.
   * @param entity - normalized subject.
   * @param key - normalized attribute.
   * @param now - current epoch milliseconds.
   */
  private async pruneVersions(
    owner: MemoryOwner,
    scope: MemoryScope,
    entity: string,
    key: string,
    now: number,
  ): Promise<void> {
    const cutoff = this.limits.versionRetentionDays === 0 ? undefined : now - this.limits.versionRetentionDays * 86_400_000
    const superseded = this.all()
      .filter(record => record.owner === owner && sameScope(record.scope, scope)
        && record.entity === entity && record.key === key && !isCurrent(record))
      .sort((left, right) => right.createdAt - left.createdAt)
    const excess = new Set(superseded.slice(this.limits.maxVersionsPerRecord).map(record => record.id))
    for (const record of superseded) {
      if (!excess.has(record.id) && (cutoff === undefined || record.createdAt >= cutoff)) continue
      if (!(await this.archive('record', record))) continue
      await this.records.delete(record.id)
    }
  }

  /**
   * Read one episode the view can see.
   * @param view - owner and optional project.
   * @param id - episode identity.
   * @returns the episode, or `undefined` when it is outside the view.
   */
  episode(view: MemoryView, id: EpisodeIdType): EpisodeRecord | undefined {
    return this.visibleEpisodes(view).find(record => record.id === id)
  }

  /**
   * List the view's episodes newest first, for human management and `/memory history`.
   * @param view - owner and optional project.
   * @returns every episode of the owner's project, newest first.
   */
  listEpisodes(view: MemoryView): readonly EpisodeRecord[] {
    return this.visibleEpisodes(view)
  }

  /**
   * Search the view's episodes by lexical text and, when a provider is mounted,
   * vector similarity. The same pool and fallback rules as record search apply.
   * `excludeSession` keeps the caller's own work out of the result, and
   * `minScore` drops weak single-word matches from recency-ordered pools.
   * @param request - view, text, optional kinds, time bounds, session exclusion, match floor, limit, and cancellation.
   * @returns at most `limit` episodes, best match first.
   */
  async searchEpisodes(request: EpisodeSearchRequest): Promise<readonly EpisodeRecord[]> {
    await this.refresh()
    const candidates = (await this.episodeCandidates(request))
      .filter(record => request.excludeSession === undefined || record.source.sessionId !== request.excludeSession)
    const floor = memoryTokens(request.text).length === 0 ? 0 : Math.max(0, Math.min(1, request.minScore ?? 0))
    const ranked = scoreEpisodes(candidates, request.text, request.alternatives).filter(entry => entry.score >= floor)
    const limit = request.limit ?? this.limits.maxRecallResults
    const lexical = (): EpisodeRecord[] => ranked.slice(0, limit).map(entry => entry.record)
    const { semanticWeight, semanticFloor, maxSemanticCandidates } = this.limits
    const embeddings = semanticWeight === 0 || memoryTokens(request.text).length === 0 ? undefined : this.ctx.get('embeddings')
    if (embeddings === undefined || ! embeddings.enabled) return lexical()
    const pool: { record: EpisodeRecord; score: number }[] = ranked.slice(0, maxSemanticCandidates)
    if (pool.length < maxSemanticCandidates) {
      const seen = new Set(pool.map(entry => entry.record.id))
      for (const entry of scoreEpisodes(candidates, '')) {
        if (pool.length >= maxSemanticCandidates) break
        if (!seen.has(entry.record.id)) pool.push(entry)
      }
    }
    if (pool.length === 0) return lexical()
    const model = embeddings.model
    try {
      const cached = pool.map(entry => this.cachedVector('episode', entry.record.id, model, entry.record.updatedAt))
      const missing = cached.flatMap((vector, index) => vector === undefined ? [index] : [])
      const vectors = await embeddings.embed({
        texts: [request.text, ...missing.map((index) => {
          const record = pool[index]?.record
          /* v8 ignore next 2 -- every missing index comes from the same pool */
          if (record === undefined) throw new Error('semantic episode candidate disappeared')
          return episodeEmbeddingText(record)
        })],
        ...request.signal === undefined ? {} : { signal: request.signal },
      })
      const [query, ...computed] = vectors
      if (query === undefined || computed.length !== missing.length) {
        throw new Error(`the embedding provider returned ${vectors.length} vectors for ${missing.length + 1} inputs`)
      }
      const recordVectors = [...cached]
      for (const [position, index] of missing.entries()) recordVectors[index] = computed[position]
      const blended = pool.map((entry, index) => {
        const vector = recordVectors[index]
        /* v8 ignore next -- every pool entry has a cached or freshly computed vector */
        if (vector === undefined) throw new Error('the embedding provider returned no vector for one episode')
        const similarity = cosineSimilarity(query, vector)
        return {
          record: entry.record,
          lexical: entry.score,
          score: (1 - semanticWeight) * entry.score + semanticWeight * Math.max(0, similarity),
          similarity,
        }
      }).filter(entry => entry.lexical > 0 || entry.similarity >= semanticFloor)
      blended.sort((left, right) => right.score - left.score
        || right.record.createdAt - left.record.createdAt
        || left.record.id.localeCompare(right.record.id))
      const persisted = missing.flatMap((index, position) => {
        const record = pool[index]?.record
        const vector = computed[position]
        /* v8 ignore next -- every missing pool entry has both a record and a fresh vector */
        return record === undefined || vector === undefined ? [] : [{ record, vector }]
      })
      await Promise.all(persisted.map(entry => this.putVector('episode', entry.record.owner, entry.record.id, entry.record.updatedAt, model, entry.vector)))
      return blended.slice(0, limit).map(entry => entry.record)
    } catch (error) {
      if (request.signal?.aborted === true) throw error
      this.ctx.logger.warn(`experimental-memory: semantic episode ranking unavailable: ${error instanceof Error ? error.message : String(error)}`)
      return lexical()
    }
  }

  /**
   * Read the episodes around one anchor, newest first.
   * @param request - view, optional anchor, window sizes, and kind filter.
   * @returns the window, at most `before + after + 1` episodes.
   */
  episodeTimeline(request: EpisodeTimelineRequest): readonly EpisodeRecord[] {
    const candidates = this.visibleEpisodes(request.view)
      .filter(record => request.kinds === undefined || request.kinds.includes(record.kind))
    const anchorIndex = request.anchor === undefined ? 0 : candidates.findIndex(record => record.id === request.anchor)
    if (anchorIndex < 0) return []
    const before = request.before ?? 3
    const after = request.after ?? 3
    const start = request.anchor === undefined ? 0 : Math.max(0, anchorIndex - after)
    const end = request.anchor === undefined ? Math.min(candidates.length, before) : Math.min(candidates.length, anchorIndex + before + 1)
    return candidates.slice(start, end)
  }

  /**
   * Select the episodes one snapshot injects: the newest summaries and the
   * observations most relevant to the query, both bounded by configuration.
   * `excludeSession` keeps the Session's own episodes out of its snapshot, and
   * `minScore` drops single-word matches that only share a generic token.
   * @param view - owner and optional project.
   * @param text - the Session's first message, used for observation relevance.
   * @param options - the Session to exclude and the lowest lexical match kept.
   * @returns summaries first, then observations, newest first within each group.
   */
  async history(
    view: MemoryView,
    text: string,
    options: { readonly excludeSession?: SessionId; readonly minScore?: number } = {},
  ): Promise<readonly EpisodeRecord[]> {
    await this.refresh()
    const { excludeSession, minScore } = options
    const listed = this.visibleEpisodes(view)
      .filter(record => excludeSession === undefined || record.source.sessionId !== excludeSession)
    const summaries = listed.filter(record => record.kind === 'summary').slice(0, this.limits.historySummaries)
    if (this.limits.historyEpisodes === 0) return summaries
    const observations = await this.searchEpisodes({
      view, text, kinds: ['observation'], limit: this.limits.historyEpisodes,
      ...excludeSession === undefined ? {} : { excludeSession },
      ...minScore === undefined ? {} : { minScore },
    })
    return [...summaries, ...observations]
  }

  /**
   * Delete one episode.
   * @param view - owner and optional project.
   * @param id - episode identity.
   * @returns whether the view held the episode.
   */
  async forgetEpisode(view: MemoryView, id: EpisodeIdType): Promise<boolean> {
    if (this.episode(view, id) === undefined) return false
    await this.episodes.delete(id)
    this.unindexEpisode(id)
    await this.dropVector('episode', id)
    return true
  }

  /**
   * Select the records a Session receives without searching.
   * @param view - owner and optional workspace.
   * @returns every active profile record, then at most `maxPinnedRecords` pinned workspace records; each group ordered by entity, then key.
   */
  snapshot(view: MemoryView): readonly MemoryRecord[] {
    const active = this.all().filter(record => visibleIn(view, record) && isCurrent(record) && record.status === 'active')
    return [
      ...active.filter(record => record.scope.kind === 'profile').sort(byEntityAndKey),
      ...active.filter(record => record.pinned).sort(byEntityAndKey).slice(0, this.limits.maxPinnedRecords),
    ]
  }
}

export default MemoryService
