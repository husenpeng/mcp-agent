/** Memory service storage, scoping, replacement, limits, and restart durability. */
import { mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, Service } from '@tomato/cordis'
import SessionStore, { SessionId, SessionSeq } from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import MemoryService, {
  MemoryError,
  MemoryId,
  isMemoryIdentifier,
  memoryTokens,
  rankMemories,
  resolveMemoryLimits,
} from '@tomato/experimental-memory'
import type { Config, MemoryRecord, RememberRequest } from '@tomato/experimental-memory'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'

const contexts: Context[] = []
const directories: string[] = []

afterEach(async () => {
  vi.useRealTimers()
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/** Mount the service over an in-memory storage medium that survives across harnesses. */
async function harness(options: { pool?: MemoryMediaPool; config?: Config } = {}) {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(SessionStore)
  await ctx.plugin(Storage)
  const pool = options.pool ?? new MemoryMediaPool()
  const backend = new MemoryStorageBackend(pool)
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => { await facility.closeAll(); unmount() }
  })
  const fiber = await ctx.plugin(MemoryService, options.config ?? {})
  return { ctx, pool, fiber, memory: ctx.memory }
}

function request(overrides: Partial<RememberRequest> = {}): RememberRequest {
  return {
    workspace: '/work/a',
    kind: 'preference',
    entity: 'user',
    key: 'email-tone',
    value: 'Short and direct, no emoji',
    status: 'active',
    pinned: false,
    source: { sessionId: SessionId('session-1'), userMessageSeq: SessionSeq(3) },
    ...overrides,
  }
}

async function tempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-'))
  directories.push(directory)
  return directory
}

describe('identifiers and tokens', () => {
  it('accepts lower-kebab-case segments joined by colons and nothing else', () => {
    for (const valid of ['user', 'client:brand-x', 'email-tone', 'a1:b2-c3']) expect(isMemoryIdentifier(valid)).toBe(true)
    for (const invalid of ['', 'User', 'brand x', 'a--b', '-a', 'a:', ':a', 'a_b', 'x'.repeat(65)]) {
      expect(isMemoryIdentifier(invalid)).toBe(false)
    }
    expect(isMemoryIdentifier('x'.repeat(64))).toBe(true)
  })

  it('segments Chinese and Latin text into lowercased words', () => {
    expect(memoryTokens('邮件语气 Brand-X')).toEqual(['邮件', '语气', 'brand', 'x'])
    expect(memoryTokens('  ，。 ')).toEqual([])
  })
})

describe('ranking', () => {
  const at = (id: string, value: string, updatedAt: number): MemoryRecord => ({
    id: MemoryId(id), workspace: '/w', kind: 'fact', entity: 'client:brand-x', key: 'budget', value,
    status: 'active', pinned: false, createdAt: 0, updatedAt, source: { sessionId: SessionId('s') },
  })

  it('orders by matched query fraction, then recency, then id, and drops non-matching records', () => {
    const records = [at('b', '预算 500 美元', 1), at('a', '预算 500 美元', 1), at('c', '语气 简短', 5), at('d', '预算', 9)]
    expect(rankMemories(records, '预算 500', 10).map(record => record.id)).toEqual(['a', 'b', 'd'])
    expect(rankMemories(records, '预算 500', 1).map(record => record.id)).toEqual(['a'])
  })

  it('matches identifier words and lists every record by recency for an empty query', () => {
    const records = [at('old', 'x', 1), at('new', 'y', 2)]
    expect(rankMemories(records, 'brand budget', 10).map(record => record.id)).toEqual(['new', 'old'])
    expect(rankMemories(records, '', 10).map(record => record.id)).toEqual(['new', 'old'])
  })
})

describe('limits', () => {
  it('defaults every limit and rejects a non-positive or fractional value', () => {
    expect(resolveMemoryLimits({}))
      .toEqual({ maxRecallResults: 10, maxPinnedRecords: 20, maxValueBytes: 1024, maxRecordsPerWorkspace: 1000 })
    expect(() => resolveMemoryLimits({ maxRecallResults: 0 })).toThrow('maxRecallResults must be a positive safe integer')
    expect(() => resolveMemoryLimits({ maxValueBytes: 1.5 })).toThrow('maxValueBytes must be a positive safe integer')
  })
})

describe('MemoryService', () => {
  it('stores, replaces by entity and key, and keeps the earlier id and creation time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.remember(request())
    vi.setSystemTime(2_000)
    const second = await memory.remember(request({ value: 'Warm and brief', pinned: true }))
    expect(second).toMatchObject({ id: first.id, createdAt: 1_000, updatedAt: 2_000, value: 'Warm and brief', pinned: true })
    expect(memory.list('/work/a')).toEqual([second])
  })

  it('isolates workspaces for recall, listing, pinning, confirming, and deletion', async () => {
    const { memory } = await harness()
    const own = await memory.remember(request({ pinned: true }))
    await memory.remember(request({ workspace: '/work/b', value: 'Other workspace' }))
    expect(memory.recall({ workspace: '/work/a', text: '' }).map(record => record.id)).toEqual([own.id])
    expect(memory.list('/work/b').map(record => record.value)).toEqual(['Other workspace'])
    expect(memory.pinned('/work/b')).toEqual([])
    expect(await memory.forget('/work/b', own.id)).toBe(false)
    expect(await memory.setPinned('/work/b', own.id, false)).toBeUndefined()
    expect(await memory.confirm('/work/b', own.id)).toBeUndefined()
    expect(memory.list('/work/a')).toHaveLength(1)
  })

  it('keeps candidates out of recall and pinning until confirmed', async () => {
    const { memory } = await harness()
    const candidate = await memory.remember(request({ status: 'candidate', pinned: true, source: { sessionId: SessionId('s') } }))
    expect(candidate.pinned).toBe(false)
    expect(memory.recall({ workspace: '/work/a', text: 'emoji' })).toEqual([])
    expect(await memory.setPinned('/work/a', candidate.id, true)).toBeUndefined()
    const confirmed = await memory.confirm('/work/a', candidate.id)
    expect(confirmed?.status).toBe('active')
    expect(await memory.confirm('/work/a', candidate.id)).toBeUndefined()
    expect(memory.recall({ workspace: '/work/a', text: 'emoji' }).map(record => record.id)).toEqual([candidate.id])
  })

  it('filters recall by kind and bounds it by maxRecallResults', async () => {
    const { memory } = await harness({ config: { maxRecallResults: 1 } })
    await memory.remember(request({ key: 'a', kind: 'fact', value: 'shared word' }))
    await memory.remember(request({ key: 'b', kind: 'decision', value: 'shared word' }))
    expect(memory.recall({ workspace: '/work/a', text: 'shared', kind: 'decision' }).map(record => record.key)).toEqual(['b'])
    expect(memory.recall({ workspace: '/work/a', text: 'shared' })).toHaveLength(1)
  })

  it('pins and unpins active records and orders pinned records by entity then key within the cap', async () => {
    const { memory } = await harness({ config: { maxPinnedRecords: 2 } })
    const b = await memory.remember(request({ entity: 'b', key: 'x', pinned: true }))
    const a2 = await memory.remember(request({ entity: 'a', key: 'y', pinned: true }))
    const a1 = await memory.remember(request({ entity: 'a', key: 'x' }))
    expect(await memory.setPinned('/work/a', a1.id, true)).toMatchObject({ pinned: true })
    expect(memory.pinned('/work/a').map(record => record.id)).toEqual([a1.id, a2.id])
    const unchanged = await memory.setPinned('/work/a', b.id, true)
    expect(unchanged).toEqual(memory.list('/work/a').find(record => record.id === b.id))
    expect(await memory.setPinned('/work/a', a2.id, false)).toMatchObject({ pinned: false })
    expect(memory.pinned('/work/a').map(record => record.id)).toEqual([a1.id, b.id])
  })

  it('deletes durably and reports whether the record existed', async () => {
    const { memory } = await harness()
    const record = await memory.remember(request())
    expect(await memory.forget('/work/a', record.id)).toBe(true)
    expect(await memory.forget('/work/a', record.id)).toBe(false)
    expect(memory.list('/work/a')).toEqual([])
  })

  it('rejects an oversized value and a new record in a full workspace, but allows replacement there', async () => {
    const { memory } = await harness({ config: { maxValueBytes: 16, maxRecordsPerWorkspace: 1 } })
    await expect(memory.remember(request({ value: '超过十六个字节的值' }))).rejects.toMatchObject({ code: 'value-too-large' })
    await memory.remember(request({ value: 'fits' }))
    await expect(memory.remember(request({ key: 'other', value: 'new' }))).rejects.toBeInstanceOf(MemoryError)
    await expect(memory.remember(request({ key: 'other', value: 'new' }))).rejects.toMatchObject({ code: 'workspace-full' })
    expect((await memory.remember(request({ value: 'replaced' }))).value).toBe('replaced')
  })

  it('survives a restart through the storage medium', async () => {
    const first = await harness()
    const stored = await first.memory.remember(request({ pinned: true }))
    await first.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(first.ctx), 1)
    const second = await harness({ pool: first.pool })
    expect(second.memory.list('/work/a')).toEqual([stored])
  })

  /** Seed one record, then rename its storage key so it no longer matches the record id. */
  async function mismatchedPool(): Promise<MemoryMediaPool> {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    await seed.memory.remember(request())
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    const records = pool.media.get('tomato_memory')?.tables.get('records')
    const [[key, value]] = [...records ?? []] as [[string, MemoryRecord]]
    records?.delete(key)
    records?.set('memory-renamed', value)
    return pool
  }

  /** A context with the storage domain over the pool, without the memory service. */
  async function bareContext(pool: MemoryMediaPool): Promise<{ ctx: Context; facility: DomainFacility }> {
    const ctx = new Context()
    contexts.push(ctx)
    await ctx.plugin(SessionStore)
    await ctx.plugin(Storage)
    const backend = new MemoryStorageBackend(pool)
    ctx.effect(() => ctx.storage.backend.register('fixture', backend))
    const facility = new DomainFacility(ctx, { backend: 'fixture' })
    ctx.effect(() => {
      const unmount = ctx.storage.mount('domain', facility)
      ctx.provide('storageDomain', facility)
      return async () => { await facility.closeAll(); unmount() }
    })
    return { ctx, facility }
  }

  it('refuses to activate over a record whose key differs from its id and releases the domain', async () => {
    const { ctx, facility } = await bareContext(await mismatchedPool())
    await expect(new MemoryService(ctx, {})[Service.init]()).rejects.toThrow('stored key "memory-renamed" differs from record id')
    // The domain name is free again after the refused activation closed it.
    const reopened = await facility.open({ name: 'tomato_memory', version: 1, tables: {} })
    await reopened.close()
  })

  it('logs a failing close and still reports the key mismatch', async () => {
    const { ctx, facility } = await bareContext(await mismatchedPool())
    const original = facility.open.bind(facility)
    vi.spyOn(facility, 'open').mockImplementationOnce(async (spec) => {
      const domain = await original(spec)
      vi.spyOn(domain, 'close').mockRejectedValueOnce(new Error('close failed'))
      return domain
    })
    const warn = vi.spyOn(ctx.logger, 'warn')
    await expect(new MemoryService(ctx, {})[Service.init]()).rejects.toThrow('differs from record id')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('closing the domain after a key mismatch failed: Error: close failed'))
  })

  it('rejects a stored pinned candidate when the domain opens', async () => {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    const record = await seed.memory.remember(request({ status: 'candidate' }))
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    pool.media.get('tomato_memory')?.tables.get('records')?.set(record.id, { ...record, pinned: true })
    await expect(harness({ pool })).rejects.toThrow()
  })

  it('resolves a Session workspace once through realpath and tolerates a missing or absent directory', async () => {
    const { ctx, memory } = await harness()
    const directory = await tempDirectory()
    const link = join(await tempDirectory(), 'link')
    await symlink(directory, link)
    const linked = ctx.sessions.create(SessionId('linked'), { meta: { cwd: link } })
    const first = memory.workspaceOf(linked)
    expect(memory.workspaceOf(linked)).toBe(first)
    expect(await first).toBe(await memory.workspaceOf(ctx.sessions.create(SessionId('direct'), { meta: { cwd: directory } })))
    expect(await memory.workspaceOf(ctx.sessions.create(SessionId('none')))).toBeUndefined()
    const warn = vi.spyOn(ctx.logger, 'warn')
    const missing = ctx.sessions.create(SessionId('missing'), { meta: { cwd: join(directory, 'gone') } })
    expect(await memory.workspaceOf(missing)).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('directory of Session "missing" is unavailable'))
  })
})
