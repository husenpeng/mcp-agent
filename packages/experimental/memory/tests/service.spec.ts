/** Memory service storage, scoping, replacement, limits, and restart durability. */
import { mkdtemp, realpath, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, Service } from '@tomato/cordis'
import SessionStore, { SessionId, SessionSeq } from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { AccountState } from '@tomato/gateway'
import MemoryService, {
  LOCAL_MEMORY_OWNER,
  MemoryError,
  MemoryId,
  accountMemoryOwner,
  isMemoryIdentifier,
  memoryTokens,
  rankMemories,
  resolveMemoryLimits,
} from '@tomato/experimental-memory'
import type { Config, MemoryRecord, MemoryScope, MemoryView, RememberRequest } from '@tomato/experimental-memory'
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

const OWNER = LOCAL_MEMORY_OWNER
const WORKSPACE_A: MemoryScope = { kind: 'workspace', path: '/work/a' }
const PROFILE: MemoryScope = { kind: 'profile' }
const VIEW_A: MemoryView = { owner: OWNER, workspace: '/work/a' }
const VIEW_B: MemoryView = { owner: OWNER, workspace: '/work/b' }

function request(overrides: Partial<RememberRequest> = {}): RememberRequest {
  return {
    owner: OWNER,
    scope: WORKSPACE_A,
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
    id: MemoryId(id), owner: OWNER, scope: WORKSPACE_A, kind: 'fact', entity: 'client:brand-x', key: 'budget', value,
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

  it('scores an alternative wording below the literal query and ignores an empty one', () => {
    const records = [at('literal', '邮件 语气', 1), at('synonym', 'email tone', 2)]
    expect(rankMemories(records, '邮件', 10, ['email', '  ']).map(record => record.id)).toEqual(['literal', 'synonym'])
    expect(rankMemories(records, '无关', 10, ['tone']).map(record => record.id)).toEqual(['synonym'])
  })
})

describe('limits', () => {
  it('defaults every limit and rejects a non-positive or fractional value', () => {
    expect(resolveMemoryLimits({})).toEqual({
      maxRecallResults: 10, maxPinnedRecords: 20, maxValueBytes: 1024, maxRecordsPerWorkspace: 1000, maxProfileRecords: 100,
    })
    expect(() => resolveMemoryLimits({ maxRecallResults: 0 })).toThrow('maxRecallResults must be a positive safe integer')
    expect(() => resolveMemoryLimits({ maxValueBytes: 1.5 })).toThrow('maxValueBytes must be a positive safe integer')
    expect(() => resolveMemoryLimits({ maxProfileRecords: -1 })).toThrow('maxProfileRecords must be a positive safe integer')
  })
})

describe('MemoryService', () => {
  it('stores, replaces by scope, entity, and key, and keeps the earlier id and creation time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.remember(request())
    vi.setSystemTime(2_000)
    const second = await memory.remember(request({ value: 'Warm and brief', pinned: true }))
    expect(second).toMatchObject({ id: first.id, createdAt: 1_000, updatedAt: 2_000, value: 'Warm and brief', pinned: true })
    vi.setSystemTime(3_000)
    const profile = await memory.remember(request({ scope: PROFILE, value: 'Everywhere' }))
    expect(profile.id).not.toBe(first.id)
    expect(memory.list(VIEW_A)).toEqual([profile, second])
  })

  it('isolates workspaces for recall, listing, the snapshot, pinning, confirming, and deletion', async () => {
    const { memory } = await harness()
    const own = await memory.remember(request({ pinned: true }))
    await memory.remember(request({ scope: { kind: 'workspace', path: '/work/b' }, value: 'Other workspace' }))
    expect(memory.recall({ view: VIEW_A, text: '' }).map(record => record.id)).toEqual([own.id])
    expect(memory.list(VIEW_B).map(record => record.value)).toEqual(['Other workspace'])
    expect(memory.snapshot(VIEW_B)).toEqual([])
    expect(await memory.forget(VIEW_B, own.id)).toBe(false)
    expect(await memory.setPinned(VIEW_B, own.id, false)).toBeUndefined()
    expect(await memory.confirm(VIEW_B, own.id)).toBeUndefined()
    expect(await memory.forget(VIEW_A, MemoryId('memory-missing'))).toBe(false)
    expect(memory.list(VIEW_A)).toHaveLength(1)
  })

  it('shows profile records in every workspace of their owner and to no other owner', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const profile = await memory.remember(request({ scope: PROFILE, key: 'language', value: 'Reply in Chinese' }))
    const bob: MemoryView = { owner: accountMemoryOwner('u-bob'), workspace: '/work/a' }
    expect(memory.recall({ view: VIEW_B, text: 'chinese' }).map(record => record.id)).toEqual([profile.id])
    expect(memory.recall({ view: { owner: OWNER }, text: '' }).map(record => record.id)).toEqual([profile.id])
    expect(memory.list(bob)).toEqual([])
    expect(memory.snapshot(bob)).toEqual([])
    expect(await memory.forget(bob, profile.id)).toBe(false)
    expect(await memory.confirm(bob, profile.id)).toBeUndefined()
    vi.setSystemTime(2_000)
    const workspace = await memory.remember(request({ value: 'Workspace only' }))
    expect(memory.list({ owner: OWNER }).map(record => record.id)).toEqual([profile.id])
    expect(memory.list(VIEW_A).map(record => record.id)).toEqual([workspace.id, profile.id])
  })

  it('keeps candidates out of recall and the snapshot until confirmed', async () => {
    const { memory } = await harness()
    const candidate = await memory.remember(request({ status: 'candidate', pinned: true, source: { sessionId: SessionId('s') } }))
    const profileCandidate = await memory.remember(request({ scope: PROFILE, status: 'candidate', source: { sessionId: SessionId('s') } }))
    expect(candidate.pinned).toBe(false)
    expect(memory.recall({ view: VIEW_A, text: 'emoji' })).toEqual([])
    expect(memory.snapshot(VIEW_A)).toEqual([])
    expect(await memory.setPinned(VIEW_A, candidate.id, true)).toBeUndefined()
    const confirmed = await memory.confirm(VIEW_A, candidate.id)
    expect(confirmed?.status).toBe('active')
    expect(await memory.confirm(VIEW_A, candidate.id)).toBeUndefined()
    expect(memory.recall({ view: VIEW_A, text: 'emoji' }).map(record => record.id)).toEqual([candidate.id])
    await memory.confirm(VIEW_A, profileCandidate.id)
    expect(memory.snapshot(VIEW_A).map(record => record.id)).toEqual([profileCandidate.id])
  })

  it('filters recall by kind and bounds it by maxRecallResults', async () => {
    const { memory } = await harness({ config: { maxRecallResults: 1 } })
    await memory.remember(request({ key: 'a', kind: 'fact', value: 'shared word' }))
    await memory.remember(request({ key: 'b', kind: 'decision', value: 'shared word' }))
    expect(memory.recall({ view: VIEW_A, text: 'shared', kind: 'decision' }).map(record => record.key)).toEqual(['b'])
    expect(memory.recall({ view: VIEW_A, text: 'shared' })).toHaveLength(1)
  })

  it('pins only active workspace records and puts every active profile record before the capped pinned ones', async () => {
    const { memory } = await harness({ config: { maxPinnedRecords: 2 } })
    const b = await memory.remember(request({ entity: 'b', key: 'x', pinned: true }))
    const a2 = await memory.remember(request({ entity: 'a', key: 'y', pinned: true }))
    const a1 = await memory.remember(request({ entity: 'a', key: 'x' }))
    const profileZ = await memory.remember(request({ scope: PROFILE, entity: 'z', key: 'x', pinned: true }))
    const profileY = await memory.remember(request({ scope: PROFILE, entity: 'y', key: 'x' }))
    expect(profileZ.pinned).toBe(false)
    expect(await memory.setPinned(VIEW_A, profileY.id, true)).toBeUndefined()
    expect(await memory.setPinned(VIEW_A, a1.id, true)).toMatchObject({ pinned: true })
    expect(memory.snapshot(VIEW_A).map(record => record.id)).toEqual([profileY.id, profileZ.id, a1.id, a2.id])
    const unchanged = await memory.setPinned(VIEW_A, b.id, true)
    expect(unchanged).toEqual(memory.list(VIEW_A).find(record => record.id === b.id))
    expect(await memory.setPinned(VIEW_A, a2.id, false)).toMatchObject({ pinned: false })
    expect(memory.snapshot(VIEW_A).map(record => record.id)).toEqual([profileY.id, profileZ.id, a1.id, b.id])
    expect(memory.snapshot({ owner: OWNER }).map(record => record.id)).toEqual([profileY.id, profileZ.id])
  })

  it('deletes durably and reports whether the record existed', async () => {
    const { memory } = await harness()
    const record = await memory.remember(request())
    expect(await memory.forget(VIEW_A, record.id)).toBe(true)
    expect(await memory.forget(VIEW_A, record.id)).toBe(false)
    expect(memory.list(VIEW_A)).toEqual([])
  })

  it('rejects an oversized value and a new record in a full workspace or profile, but allows replacement there', async () => {
    const { memory } = await harness({ config: { maxValueBytes: 16, maxRecordsPerWorkspace: 1, maxProfileRecords: 1 } })
    await expect(memory.remember(request({ value: '超过十六个字节的值' }))).rejects.toMatchObject({ code: 'value-too-large' })
    await memory.remember(request({ value: 'fits' }))
    await expect(memory.remember(request({ key: 'other', value: 'new' }))).rejects.toBeInstanceOf(MemoryError)
    await expect(memory.remember(request({ key: 'other', value: 'new' }))).rejects.toMatchObject({ code: 'workspace-full' })
    expect((await memory.remember(request({ value: 'replaced' }))).value).toBe('replaced')
    await memory.remember(request({ scope: PROFILE, value: 'fits' }))
    await expect(memory.remember(request({ scope: PROFILE, key: 'other', value: 'new' }))).rejects.toMatchObject({ code: 'profile-full' })
    expect((await memory.remember(request({ scope: PROFILE, value: 'replaced' }))).value).toBe('replaced')
    expect((await memory.remember(request({ owner: accountMemoryOwner('u-bob'), scope: PROFILE, key: 'other', value: 'new' }))).value)
      .toBe('new')
  })

  it('survives a restart through the storage medium', async () => {
    const first = await harness()
    const stored = await first.memory.remember(request({ pinned: true }))
    await first.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(first.ctx), 1)
    const second = await harness({ pool: first.pool })
    expect(second.memory.list(VIEW_A)).toEqual([stored])
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

  it.each([
    ['a pinned candidate', { status: 'candidate' as const }],
    ['a pinned profile record', { scope: PROFILE }],
  ])('rejects %s when the domain opens', async (_label, overrides) => {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    const record = await seed.memory.remember(request(overrides))
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    pool.media.get('tomato_memory')?.tables.get('records')?.set(record.id, { ...record, pinned: true })
    await expect(harness({ pool })).rejects.toThrow()
  })

  it('resolves a Session workspace through realpath and keeps profile access without a directory', async () => {
    const { ctx, memory } = await harness()
    const directory = await tempDirectory()
    const link = join(await tempDirectory(), 'link')
    await symlink(directory, link)
    const linked = ctx.sessions.create(SessionId('linked'), { meta: { cwd: link } })
    const first = await memory.accessOf(linked)
    expect(await memory.accessOf(linked)).toEqual(first)
    expect(first).toEqual(await memory.accessOf(ctx.sessions.create(SessionId('direct'), { meta: { cwd: directory } })))
    expect(first).toEqual({ kind: 'available', view: { owner: OWNER, workspace: await realpath(directory) } })
    expect(await memory.accessOf(ctx.sessions.create(SessionId('none')))).toEqual({ kind: 'available', view: { owner: OWNER } })
    const warn = vi.spyOn(ctx.logger, 'warn')
    const missing = ctx.sessions.create(SessionId('missing'), { meta: { cwd: join(directory, 'gone') } })
    expect(await memory.accessOf(missing)).toEqual({ kind: 'available', view: { owner: OWNER } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('directory of Session "missing" is unavailable'))
  })

  it('serves the signed-in account where the Host names accounts and refuses while nobody is signed in', async () => {
    const { ctx, memory } = await harness()
    const account = new AccountState()
    ctx.provide('tomatoAccount', account.view())
    const session = ctx.sessions.create(SessionId('account'))
    expect(await memory.accessOf(session)).toEqual({ kind: 'sign-in-required' })
    const alice = { id: 'u-alice', email: 'alice@example.com', name: null, avatarUrl: null, language: null }
    account.observe({ kind: 'valid', user: alice })
    expect(await memory.accessOf(session)).toEqual({ kind: 'available', view: { owner: accountMemoryOwner('u-alice') } })
    account.observe({ kind: 'valid', user: { ...alice, id: 'u-bob' } })
    expect(await memory.accessOf(session)).toEqual({ kind: 'available', view: { owner: accountMemoryOwner('u-bob') } })
    account.signOut()
    expect(await memory.accessOf(session)).toEqual({ kind: 'sign-in-required' })
  })
})
