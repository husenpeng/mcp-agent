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
import { realpath } from 'node:fs/promises'
import z from '@tomato/schemastery'
import { Service } from '@tomato/cordis'
import type { Context, Volatile } from '@tomato/cordis'
import type {} from '@tomato/gateway'
import type {} from '@tomato/settings'
import type { Session } from '@tomato/session'
import type { Domain } from '@tomato/storage-domain'
import type {} from '@tomato/experimental-embeddings'
import {
  cosineSimilarity, episodeEmbeddingText, memoryEmbeddingText, memoryTokens, scoreEpisodes, scoreMemories, tokenContainment,
} from './retrieval.ts'
import {
  EpisodeId, LOCAL_MEMORY_OWNER, MemoryId, VectorId, accountMemoryOwner, episodeDomain, memoryDomain, vectorDomain,
} from './storage.ts'
import type { EpisodeRecord, MemoryRecord, VectorRecord } from './storage.ts'
import type {
  EpisodeId as EpisodeIdType, EpisodeSearchRequest, EpisodeTimelineRequest,
  VectorId as VectorIdType, VectorTarget,
  MemoryAccess,
  MemoryId as MemoryIdType,
  MemoryKind,
  MemoryOwner,
  PromotionOutcome,
  MemoryScope,
  MemoryView,
  RecallRequest,
  RememberEpisodeRequest,
  RememberRequest,
} from './types.ts'

export type * from './types.ts'
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

declare module '@tomato/cordis' {
  interface Context {
    /** Host-wide cross-session memory records scoped by owner, then by profile or canonical workspace. */
    memory: MemoryService
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
}


/** Encode one embedding vector as base64 little-endian float32 data. */
export function encodeVector(vector: Float32Array): string {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength).toString('base64')
}

/**
 * Decode one stored vector.
 * @param encoded - base64 little-endian float32 data.
 * @param dimensions - expected vector length.
 * @returns the vector, or `undefined` when the stored bytes do not match.
 */
export function decodeVector(encoded: string, dimensions: number): Float32Array | undefined {
  const buffer = Buffer.from(encoded, 'base64')
  if (buffer.byteLength !== dimensions * 4) return undefined
  const vector = new Float32Array(dimensions)
  for (let index = 0; index < dimensions; index += 1) vector[index] = buffer.readFloatLE(index * 4)
  return vector
}

/** Deepest relation walk one lookup follows; each hop reads the whole view. */
export const MAX_RELATION_DEPTH = 2

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
  /** Every record the view sees, active and candidates. */
  readonly total: number
  /** Records whose contents reach search and the snapshot. */
  readonly active: number
  /** Records waiting for a person to confirm them. */
  readonly candidates: number
  /** Pinned workspace records. */
  readonly pinned: number
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
export type MemoryErrorCode = 'value-too-large' | 'workspace-full' | 'profile-full' | 'episode-too-large' | 'episodes-full'

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

/** Whether two scopes name the same profile or the same workspace. */
function sameScope(left: MemoryScope, right: MemoryScope): boolean {
  return left.kind === 'profile' ? right.kind === 'profile' : right.kind === 'workspace' && left.path === right.path
}

/** Whether a view sees a record. */
function visibleIn(view: MemoryView, record: MemoryRecord): boolean {
  return record.owner === view.owner && (record.scope.kind === 'profile' || record.scope.path === view.workspace)
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
  }
  for (const field of ['maxRecallResults', 'maxPinnedRecords', 'maxValueBytes', 'maxRecordsPerWorkspace', 'maxProfileRecords', 'maxSemanticCandidates', 'maxEpisodesPerWorkspace', 'maxEpisodeChars', 'episodeRetentionDays'] as const) {
    const value = limits[field]
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TypeError(`experimental-memory: ${field} must be a positive safe integer`)
    }
  }
  for (const field of ['historySummaries', 'historyEpisodes', 'maxEmbeddingVectors'] as const) {
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
  })

  /** Deployment limits read from the live configuration. */
  get limits(): MemoryLimits { return resolveMemoryLimits(this.config) }

  private domain: Domain<typeof memoryDomain> | undefined
  private episodeDomain: Domain<typeof episodeDomain> | undefined
  private vectorDomain: Domain<typeof vectorDomain> | undefined
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
    this.ctx.effect(() => async () => {
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

  /** Every stored episode, in storage order. */
  private allEpisodes(): EpisodeRecord[] {
    return [...this.episodes.entries()].map(([, record]) => record)
  }

  /** Episodes of the view's owner and project, newest first. */
  private visibleEpisodes(view: MemoryView): EpisodeRecord[] {
    if (view.workspace === undefined) return []
    return this.allEpisodes()
      .filter(record => record.owner === view.owner && record.scope.path === view.workspace)
      .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
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
   * accounts, the local owner where it does not, and none while a Host that
   * names accounts has nobody signed in.
   */
  private owner(): MemoryOwner | undefined {
    const account = this.ctx.get('tomatoAccount')
    if (account === undefined) return LOCAL_MEMORY_OWNER
    const current = account.current()
    return current.status === 'signed-in' ? accountMemoryOwner(current.user.id) : undefined
  }

  /**
   * Resolve which records a Session can use now.
   * @param session - Session whose original project directory scopes workspace records.
   * @returns the current owner's view, or `sign-in-required` while the Host names accounts and none is signed in.
   */
  async accessOf(session: Session): Promise<MemoryAccess> {
    const workspace = await this.workspaceOf(session)
    const owner = this.owner()
    if (owner === undefined) return { kind: 'sign-in-required' }
    return { kind: 'available', view: workspace === undefined ? { owner } : { owner, workspace } }
  }

  /**
   * Resolve which records work in one project directory can use now.
   *
   * A run without a Session asks by directory instead of by Session. An
   * unavailable directory leaves the owner's profile records only, the same
   * fallback a Session without one gets.
   * @param path - project directory the work happens in.
   * @returns the current owner's view, or `sign-in-required` while the Host names accounts and none is signed in.
   */
  async accessFor(path: string): Promise<MemoryAccess> {
    const owner = this.owner()
    if (owner === undefined) return { kind: 'sign-in-required' }
    const workspace = await realpath(path).then(resolved => resolved, () => undefined)
    return { kind: 'available', view: workspace === undefined ? { owner } : { owner, workspace } }
  }

  /** The view's record with this id. */
  private visible(view: MemoryView, id: MemoryIdType): MemoryRecord | undefined {
    const record = this.records.get(id)
    return record !== undefined && visibleIn(view, record) ? record : undefined
  }

  /**
   * Store one record, replacing the owner's record with the same scope, entity, and key.
   * @param request - owner, scope, statement, lifecycle state, and the write that justified it.
   * @returns the stored record; a replacement keeps the earlier id and creation time.
   * @throws {@link MemoryError} `value-too-large`, `workspace-full`, or `profile-full`.
   */
  async remember(request: RememberRequest): Promise<MemoryRecord> {
    if (Buffer.byteLength(request.value, 'utf8') > this.limits.maxValueBytes) {
      throw new MemoryError(`a memory value is limited to ${this.limits.maxValueBytes} UTF-8 bytes`, 'value-too-large')
    }
    const records = this.all().filter(record => record.owner === request.owner && sameScope(record.scope, request.scope))
    const previous = records.find(record => record.entity === request.entity && record.key === request.key)
    if (previous === undefined) {
      if (request.scope.kind === 'profile' && records.length >= this.limits.maxProfileRecords) {
        throw new MemoryError(`the profile already stores ${this.limits.maxProfileRecords} memories; delete unused ones first`, 'profile-full')
      }
      if (request.scope.kind === 'workspace' && records.length >= this.limits.maxRecordsPerWorkspace) {
        throw new MemoryError(
          `this workspace already stores ${this.limits.maxRecordsPerWorkspace} memories; delete unused ones first`,
          'workspace-full',
        )
      }
    }
    const now = Date.now()
    const record: MemoryRecord = {
      id: previous?.id ?? MemoryId(`memory-${randomUUID()}`),
      owner: request.owner,
      scope: request.scope,
      kind: request.kind,
      entity: request.entity,
      key: request.key,
      value: request.value,
      status: request.status,
      pinned: request.status === 'active' && request.scope.kind === 'workspace' && request.pinned,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      source: request.source,
    }
    await this.records.put(record.id, record)
    if (previous !== undefined) await this.dropVector('fact', record.id)
    return record
  }


  /** Storage key of one cached vector. */
  private vectorKey(target: VectorTarget, recordId: string): VectorIdType {
    return VectorId(`${target}:${recordId}`)
  }

  /** Read a current vector for one record, or `undefined` when it is absent or stale. */
  private cachedVector(target: VectorTarget, recordId: string, model: string, updatedAt: number): Float32Array | undefined {
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
    const candidates = this.all().filter(record => visibleIn(request.view, record)
      && record.status === 'active' && (request.kind === undefined || record.kind === request.kind))
    const ranked = scoreMemories(candidates, request.text, request.alternatives)
    const limit = this.limits.maxRecallResults
    const lexical = (): MemoryRecord[] => ranked.slice(0, limit).map(entry => entry.record)
    const embeddings = this.ctx.get('embeddings')
    const { semanticWeight, semanticFloor, maxSemanticCandidates } = this.limits
    if (embeddings === undefined || embeddings.enabled === false
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
    const active = this.all().filter(record => visibleIn(view, record) && record.status === 'active')
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
      if (record.status !== 'active' || record.kind !== query.kind) continue
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
    const active = records.filter(record => record.status === 'active')
    const workspace = records.filter(record => record.scope.kind === 'workspace')
    return {
      total: records.length,
      active: active.length,
      candidates: records.length - active.length,
      pinned: records.filter(record => record.pinned).length,
      profile: {
        stored: records.length - workspace.length,
        limit: this.limits.maxProfileRecords,
      },
      workspace: view.workspace === undefined
        ? null
        : { stored: workspace.length, limit: this.limits.maxRecordsPerWorkspace },
      oldestActiveUpdate: active.length === 0 ? null : Math.min(...active.map(record => record.updatedAt)),
      vectors: this.allVectors().length,
    }
  }

  /**
   * Delete one record durably.
   * @param view - view that must see the record.
   * @param id - record to delete.
   * @returns whether the view saw the record.
   */
  async forget(view: MemoryView, id: MemoryIdType): Promise<boolean> {
    if (this.visible(view, id) === undefined) return false
    const deleted = await this.records.delete(id)
    await this.dropVector('fact', id)
    return deleted
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
    if (record?.status !== 'active' || record.scope.kind !== 'workspace') return undefined
    if (record.pinned === pinned) return record
    return await this.records.update(id, current => ({ ...current, pinned, updatedAt: Date.now() }))
  }

  /**
   * Activate a candidate.
   * @param view - view that must see the record.
   * @param id - candidate to confirm.
   * @returns the active record, or `undefined` when the view sees no candidate with that id.
   */
  async confirm(view: MemoryView, id: MemoryIdType): Promise<MemoryRecord | undefined> {
    if (this.visible(view, id)?.status !== 'candidate') return undefined
    return await this.records.update(id, current => ({ ...current, status: 'active', updatedAt: Date.now() }))
  }

  /**
   * Enumerate every record a view sees, for human management.
   * @param view - owner and optional workspace.
   * @returns profile and workspace records, newest first.
   */
  list(view: MemoryView): readonly MemoryRecord[] {
    return this.all().filter(record => visibleIn(view, record)).sort(newestFirst)
  }

  /**
   * Store one compressed episode. A repeated fingerprint of the same owner and
   * project updates the earlier record's timestamp instead of appending.
   * @param request - owner, project, episode fields, fingerprint, and source.
   * @returns the stored episode.
   * @throws {@link MemoryError} `episode-too-large` or `episodes-full`.
   */
  async rememberEpisode(request: RememberEpisodeRequest): Promise<EpisodeRecord> {
    const facts = this.uncoveredFacts(request.owner, request.scope.path, request.facts ?? [])
    const characters = [request.title, request.subtitle ?? '', request.narrative,
      ...facts, ...request.concepts ?? [], ...request.filesRead ?? [], ...request.filesModified ?? []]
      .join('').length
    if (characters > this.limits.maxEpisodeChars) {
      throw new MemoryError(`an episode is limited to ${this.limits.maxEpisodeChars} characters across its text fields`, 'episode-too-large')
    }
    const current = this.allEpisodes().filter(record => record.owner === request.owner && record.scope.path === request.scope.path)
    const now = Date.now()
    await this.pruneEpisodes(request.owner, request.scope.path, now)
    const repeated = current.find(record => record.fingerprint === request.fingerprint)
    if (repeated !== undefined) {
      await this.dropVector('episode', repeated.id)
      return await this.episodes.update(repeated.id, record => ({ ...record, updatedAt: now }))
    }
    const stored = this.allEpisodes().filter(record => record.owner === request.owner && record.scope.path === request.scope.path)
    if (stored.length >= this.limits.maxEpisodesPerWorkspace) {
      throw new MemoryError(`this project already stores ${this.limits.maxEpisodesPerWorkspace} episodes; delete unused ones first`, 'episodes-full')
    }
    const record: EpisodeRecord = {
      id: EpisodeId(`episode-${randomUUID()}`),
      owner: request.owner,
      scope: request.scope,
      kind: request.kind,
      type: request.type,
      title: request.title,
      ...request.subtitle === undefined ? {} : { subtitle: request.subtitle },
      narrative: request.narrative,
      facts,
      concepts: [...request.concepts ?? []],
      filesRead: [...request.filesRead ?? []],
      filesModified: [...request.filesModified ?? []],
      ...request.tool === undefined ? {} : { tool: request.tool },
      fingerprint: request.fingerprint,
      source: request.source,
      createdAt: now,
      updatedAt: now,
    }
    await this.episodes.put(record.id, record)
    return record
  }

  /**
   * Promote repeated observation facts into candidate records. Two episodes
   * from different Sessions whose first facts share
   * {@link DUPLICATE_COVERAGE} of their words form one group; the group's fact
   * becomes one workspace record unless an active record already states it,
   * and every member is marked with the record it promoted into.
   * @param view - owner and project; a view without a project promotes nothing.
   * @returns the records created or reused, with the episodes each covers.
   */
  async promote(view: MemoryView): Promise<readonly PromotionOutcome[]> {
    if (view.workspace === undefined) return []
    const episodes = this.visibleEpisodes(view)
      .filter(record => record.kind === 'observation' && record.promotedTo === undefined && record.facts.length > 0)
    const claimed = new Set<string>()
    const outcomes: PromotionOutcome[] = []
    for (const episode of episodes) {
      if (claimed.has(episode.id)) continue
      const fact = episode.facts[0]
      /* v8 ignore next -- the filter above keeps only episodes with a first fact */
      if (fact === undefined) continue
      const tokens = new Set(memoryTokens(fact))
      if (tokens.size < MIN_DUPLICATE_TOKENS) continue
      const group = episodes.filter((other) => {
        if (other.id === episode.id || other.source.sessionId === episode.source.sessionId) return false
        /* v8 ignore next -- the same filter keeps every grouped episode's first fact */
        const otherTokens = new Set(memoryTokens(other.facts[0] ?? ''))
        return otherTokens.size >= MIN_DUPLICATE_TOKENS && tokenContainment(tokens, otherTokens) >= DUPLICATE_COVERAGE
      })
      if (group.length === 0) continue
      const members = [episode, ...group]
      for (const member of members) claimed.add(member.id)
      const key = promotionKey(fact, episode)
      const scope = { kind: 'workspace', path: view.workspace } as const
      const existing = this.all().find(record => record.owner === view.owner && sameScope(record.scope, scope)
        && record.entity === 'project' && record.key === key)
      const duplicate = existing ?? this.duplicates({
        owner: view.owner, scope, kind: 'fact', entity: 'project', key, value: fact,
      })[0]?.record
      const recordId = duplicate === undefined
        ? (await this.remember({
          owner: view.owner,
          scope,
          kind: 'fact',
          entity: 'project',
          key,
          value: fact,
          status: 'candidate',
          pinned: false,
          source: { sessionId: episode.source.sessionId, episodeId: episode.id },
        })).id
        : duplicate.id
      for (const member of members) {
        await this.episodes.update(member.id, record => ({ ...record, promotedTo: recordId }))
      }
      outcomes.push({ recordId, episodeIds: members.map(member => member.id), entity: 'project', key, value: fact })
    }
    return outcomes
  }

  /** Facts of one episode not already stated by an active workspace record. */
  private uncoveredFacts(owner: MemoryOwner, path: string, facts: readonly string[]): string[] {
    const active = this.all().filter(record => record.owner === owner && record.status === 'active'
      && record.scope.kind === 'workspace' && record.scope.path === path)
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

  /** Delete episodes older than the retention window of one owner and project. */
  private async pruneEpisodes(owner: MemoryOwner, path: string, now: number): Promise<void> {
    const cutoff = now - this.limits.episodeRetentionDays * 86_400_000
    for (const record of this.allEpisodes()) {
      if (record.owner !== owner || record.scope.path !== path || record.createdAt >= cutoff) continue
      await this.episodes.delete(record.id)
      await this.dropVector('episode', record.id)
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
   * @param request - view, text, optional kinds, time bounds, limit, and cancellation.
   * @returns at most `limit` episodes, best match first.
   */
  async searchEpisodes(request: EpisodeSearchRequest): Promise<readonly EpisodeRecord[]> {
    const candidates = this.visibleEpisodes(request.view).filter(record =>
      (request.kinds === undefined || request.kinds.includes(record.kind))
      && (request.since === undefined || record.createdAt >= request.since)
      && (request.until === undefined || record.createdAt <= request.until))
    const ranked = scoreEpisodes(candidates, request.text, request.alternatives)
    const limit = request.limit ?? this.limits.maxRecallResults
    const lexical = (): EpisodeRecord[] => ranked.slice(0, limit).map(entry => entry.record)
    const { semanticWeight, semanticFloor, maxSemanticCandidates } = this.limits
    const embeddings = semanticWeight === 0 || memoryTokens(request.text).length === 0 ? undefined : this.ctx.get('embeddings')
    if (embeddings === undefined || embeddings.enabled === false) return lexical()
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
   * @param view - owner and optional project.
   * @param text - the Session's first message, used for observation relevance.
   * @returns summaries first, then observations, newest first within each group.
   */
  async history(view: MemoryView, text: string): Promise<readonly EpisodeRecord[]> {
    const listed = this.visibleEpisodes(view)
    const summaries = listed.filter(record => record.kind === 'summary').slice(0, this.limits.historySummaries)
    if (this.limits.historyEpisodes === 0) return summaries
    const observations = await this.searchEpisodes({
      view, text, kinds: ['observation'], limit: this.limits.historyEpisodes,
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
    await this.dropVector('episode', id)
    return true
  }

  /**
   * Select the records a Session receives without searching.
   * @param view - owner and optional workspace.
   * @returns every active profile record, then at most `maxPinnedRecords` pinned workspace records; each group ordered by entity, then key.
   */
  snapshot(view: MemoryView): readonly MemoryRecord[] {
    const active = this.all().filter(record => visibleIn(view, record) && record.status === 'active')
    return [
      ...active.filter(record => record.scope.kind === 'profile').sort(byEntityAndKey),
      ...active.filter(record => record.pinned).sort(byEntityAndKey).slice(0, this.limits.maxPinnedRecords),
    ]
  }
}

export default MemoryService
