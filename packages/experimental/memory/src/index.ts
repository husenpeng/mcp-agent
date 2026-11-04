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

import { randomUUID } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import z from '@tomato/schemastery'
import { Service } from '@tomato/cordis'
import type { Context, Volatile } from '@tomato/cordis'
import type {} from '@tomato/gateway'
import type {} from '@tomato/settings'
import type { Session } from '@tomato/session'
import type { Domain } from '@tomato/storage-domain'
import { memoryTokens, rankMemories, tokenContainment } from './retrieval.ts'
import { LOCAL_MEMORY_OWNER, MemoryId, accountMemoryOwner, memoryDomain } from './storage.ts'
import type { MemoryRecord } from './storage.ts'
import type {
  MemoryAccess,
  MemoryId as MemoryIdType,
  MemoryKind,
  MemoryOwner,
  MemoryScope,
  MemoryView,
  RecallRequest,
  RememberRequest,
} from './types.ts'

export type * from './types.ts'
export {
  LOCAL_MEMORY_OWNER,
  MEMORY_KINDS,
  MEMORY_STATUSES,
  MemoryId,
  MemoryOwner,
  accountMemoryOwner,
  isMemoryIdentifier,
  memoryDomain,
  memoryRecordSchema,
} from './storage.ts'
export type { MemoryRecord } from './storage.ts'
export { ALTERNATIVE_WEIGHT, memoryTokens, rankMemories, tokenContainment } from './retrieval.ts'

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
}

/** Stable failure classes of {@link MemoryError}. */
export type MemoryErrorCode = 'value-too-large' | 'workspace-full' | 'profile-full'

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
  }
  for (const [field, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TypeError(`experimental-memory: ${field} must be a positive safe integer`)
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
  })

  /** Deployment limits read from the live configuration. */
  get limits(): MemoryLimits { return resolveMemoryLimits(this.config) }

  private domain: Domain<typeof memoryDomain> | undefined
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
    this.domain = domain
    this.ctx.effect(() => () => domain.close(), 'experimental-memory: close storage domain')
  }

  /** The open domain; every public method runs only after activation. */
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
    return record
  }

  /**
   * Rank the view's active records against free text.
   * @param request - view, query text, optional alternative wordings, and optional kind filter.
   * @returns at most `maxRecallResults` records, best match first.
   */
  recall(request: RecallRequest): readonly MemoryRecord[] {
    const candidates = this.all().filter(record => visibleIn(request.view, record)
      && record.status === 'active' && (request.kind === undefined || record.kind === request.kind))
    return rankMemories(candidates, request.text, this.limits.maxRecallResults, request.alternatives)
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
    return await this.records.delete(id)
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
