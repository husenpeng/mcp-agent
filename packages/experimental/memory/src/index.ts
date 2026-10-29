/**
 * Experimental cross-session memory. `ctx.memory` stores records in the
 * `tomato_memory` storage domain, scoped by the canonical original project
 * directory of a Session; records never enter a Session log. The
 * `@tomato/experimental-tool-memory` plugin is the model-facing and command
 * consumer.
 * @module @tomato/experimental-memory
 */

import { randomUUID } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import z from '@tomato/schemastery'
import { Service } from '@tomato/cordis'
import type { Context } from '@tomato/cordis'
import type { Session } from '@tomato/session'
import type { Domain } from '@tomato/storage-domain'
import { rankMemories } from './retrieval.ts'
import { MemoryId, memoryDomain } from './storage.ts'
import type { MemoryRecord } from './storage.ts'
import type { MemoryId as MemoryIdType, RecallRequest, RememberRequest } from './types.ts'

export type * from './types.ts'
export { MEMORY_KINDS, MEMORY_STATUSES, MemoryId, isMemoryIdentifier, memoryDomain, memoryRecordSchema } from './storage.ts'
export type { MemoryRecord } from './storage.ts'
export { memoryTokens, rankMemories } from './retrieval.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host-wide cross-session memory records scoped by canonical workspace. */
    memory: MemoryService
  }
}

/** Deployment limits for stored and recalled memory. */
export interface Config {
  /** Maximum records one recall returns. */
  maxRecallResults?: number
  /** Maximum pinned records one workspace exposes. */
  maxPinnedRecords?: number
  /** Maximum UTF-8 bytes of one record value. */
  maxValueBytes?: number
  /** Maximum stored records, including candidates, per workspace. */
  maxRecordsPerWorkspace?: number
}

/** Fully resolved deployment limits. */
export interface MemoryLimits {
  /** Maximum records one recall returns. */
  readonly maxRecallResults: number
  /** Maximum pinned records one workspace exposes. */
  readonly maxPinnedRecords: number
  /** Maximum UTF-8 bytes of one record value. */
  readonly maxValueBytes: number
  /** Maximum stored records, including candidates, per workspace. */
  readonly maxRecordsPerWorkspace: number
}

/** Stable failure classes of {@link MemoryError}. */
export type MemoryErrorCode = 'value-too-large' | 'workspace-full'

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

/**
 * Resolve deployment limits; direct construction outside Loader normalization is validated here.
 * @param config - partially specified limits.
 * @returns every limit, defaulted.
 */
export function resolveMemoryLimits(config: Config): MemoryLimits {
  const limits: MemoryLimits = {
    maxRecallResults: config.maxRecallResults ?? 10,
    maxPinnedRecords: config.maxPinnedRecords ?? 20,
    maxValueBytes: config.maxValueBytes ?? 1024,
    maxRecordsPerWorkspace: config.maxRecordsPerWorkspace ?? 1000,
  }
  for (const [field, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TypeError(`experimental-memory: ${field} must be a positive safe integer`)
    }
  }
  return limits
}

/**
 * Host-wide memory service. Every operation names the canonical workspace it
 * acts on, and records of other workspaces are invisible to it. Writes are
 * serialized by the storage domain and durable before they resolve.
 */
export class MemoryService extends Service {
  static inject = ['storageDomain']

  static Config: z<Config> = z.object({
    maxRecallResults: z.number().step(1).min(1).max(50).default(10),
    maxPinnedRecords: z.number().step(1).min(1).max(100).default(20),
    maxValueBytes: z.number().step(1).min(16).max(16_384).default(1024),
    maxRecordsPerWorkspace: z.number().step(1).min(1).max(100_000).default(1000),
  })

  /** Resolved deployment limits. */
  readonly limits: MemoryLimits
  private domain: Domain<typeof memoryDomain> | undefined
  private readonly workspaces = new WeakMap<Session, Promise<string | undefined>>()

  /**
   * @param ctx - Host context owning the storage domain.
   * @param config - validated deployment limits.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'memory')
    this.limits = resolveMemoryLimits(config)
  }

  protected async [Service.init](): Promise<void> {
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

  /**
   * Resolve the canonical workspace of a Session from its immutable header
   * directory, once per Session.
   * @param session - Session whose original project scopes memory.
   * @returns the realpath of the header directory, or `undefined` when the Session has none or it no longer exists.
   */
  workspaceOf(session: Session): Promise<string | undefined> {
    let workspace = this.workspaces.get(session)
    if (workspace === undefined) {
      const cwd = session.header.cwd
      workspace = cwd === undefined ? Promise.resolve(undefined) : realpath(cwd).then(
        path => path,
        (error: unknown) => {
          // A missing project directory leaves the Session without memory instead of failing its turn.
          this.ctx.logger.warn(`experimental-memory: directory of Session "${session.id}" is unavailable: ${String(error)}`)
          return undefined
        },
      )
      this.workspaces.set(session, workspace)
    }
    return workspace
  }

  /** Records of one workspace, in storage order. */
  private recordsOf(workspace: string): MemoryRecord[] {
    return [...this.records.entries()].map(([, record]) => record).filter(record => record.workspace === workspace)
  }

  /** The workspace's record with this id. */
  private owned(workspace: string, id: MemoryIdType): MemoryRecord | undefined {
    const record = this.records.get(id)
    return record?.workspace === workspace ? record : undefined
  }

  /**
   * Store one record, replacing the workspace's record with the same entity and key.
   * @param request - statement, lifecycle state, and the write that justified it.
   * @returns the stored record; a replacement keeps the earlier id and creation time.
   * @throws {@link MemoryError} `value-too-large` or `workspace-full`.
   */
  async remember(request: RememberRequest): Promise<MemoryRecord> {
    if (Buffer.byteLength(request.value, 'utf8') > this.limits.maxValueBytes) {
      throw new MemoryError(`a memory value is limited to ${this.limits.maxValueBytes} UTF-8 bytes`, 'value-too-large')
    }
    const records = this.recordsOf(request.workspace)
    const previous = records.find(record => record.entity === request.entity && record.key === request.key)
    if (previous === undefined && records.length >= this.limits.maxRecordsPerWorkspace) {
      throw new MemoryError(
        `this workspace already stores ${this.limits.maxRecordsPerWorkspace} memories; delete unused ones first`,
        'workspace-full',
      )
    }
    const now = Date.now()
    const record: MemoryRecord = {
      id: previous?.id ?? MemoryId(`memory-${randomUUID()}`),
      workspace: request.workspace,
      kind: request.kind,
      entity: request.entity,
      key: request.key,
      value: request.value,
      status: request.status,
      pinned: request.status === 'active' && request.pinned,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      source: request.source,
    }
    await this.records.put(record.id, record)
    return record
  }

  /**
   * Rank the workspace's active records against free text.
   * @param request - workspace, query text, and optional kind filter.
   * @returns at most `maxRecallResults` records, best match first.
   */
  recall(request: RecallRequest): readonly MemoryRecord[] {
    const candidates = this.recordsOf(request.workspace)
      .filter(record => record.status === 'active' && (request.kind === undefined || record.kind === request.kind))
    return rankMemories(candidates, request.text, this.limits.maxRecallResults)
  }

  /**
   * Delete one record durably.
   * @param workspace - canonical workspace that must own the record.
   * @param id - record to delete.
   * @returns whether the workspace owned the record.
   */
  async forget(workspace: string, id: MemoryIdType): Promise<boolean> {
    if (this.owned(workspace, id) === undefined) return false
    return await this.records.delete(id)
  }

  /**
   * Change whether an active record is pinned.
   * @param workspace - canonical workspace that must own the record.
   * @param id - record to change.
   * @param pinned - new pin state.
   * @returns the updated record, or `undefined` when the workspace owns no active record with that id.
   */
  async setPinned(workspace: string, id: MemoryIdType, pinned: boolean): Promise<MemoryRecord | undefined> {
    const record = this.owned(workspace, id)
    if (record?.status !== 'active') return undefined
    if (record.pinned === pinned) return record
    return await this.records.update(id, current => ({ ...current, pinned, updatedAt: Date.now() }))
  }

  /**
   * Activate a candidate.
   * @param workspace - canonical workspace that must own the record.
   * @param id - candidate to confirm.
   * @returns the active record, or `undefined` when the workspace owns no candidate with that id.
   */
  async confirm(workspace: string, id: MemoryIdType): Promise<MemoryRecord | undefined> {
    if (this.owned(workspace, id)?.status !== 'candidate') return undefined
    return await this.records.update(id, current => ({ ...current, status: 'active', updatedAt: Date.now() }))
  }

  /**
   * Enumerate every record of one workspace for human management.
   * @param workspace - canonical workspace path.
   * @returns the workspace's records, newest first.
   */
  list(workspace: string): readonly MemoryRecord[] {
    return this.recordsOf(workspace).sort(newestFirst)
  }

  /**
   * Select the pinned active records a Session receives without searching.
   * @param workspace - canonical workspace path.
   * @returns at most `maxPinnedRecords` records, ordered by entity, then key.
   */
  pinned(workspace: string): readonly MemoryRecord[] {
    return this.recordsOf(workspace)
      .filter(record => record.status === 'active' && record.pinned)
      .sort((left, right) => left.entity.localeCompare(right.entity) || left.key.localeCompare(right.key))
      .slice(0, this.limits.maxPinnedRecords)
  }
}

export default MemoryService
