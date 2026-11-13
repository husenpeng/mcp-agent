/** Two Host processes over one tomato home: change refresh and the identity write lock. */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import SessionStore, { SessionId, SessionSeq } from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { JsonStorageBackend } from '@tomato/storage-json'
import MemoryService, { LOCAL_MEMORY_OWNER, provisionalProjectId } from '@tomato/experimental-memory'
import type { MemoryScope, MemoryView, RememberRequest } from '@tomato/experimental-memory'

const contexts: Context[] = []
const directories: string[] = []

afterEach(async () => {
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/**
 * Mount one process's memory service over a shared JSON root and tomato home.
 * @param root - storage root every process shares.
 * @param home - tomato home every process shares.
 * @param config - deployment config for this process's service.
 * @returns the mounted context and its memory service.
 */
async function mount(root: string, home: string, config: Parameters<typeof MemoryService.Config>[0] = {}) {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(SessionStore)
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(root)
  ctx.effect(() => {
    const unregister = ctx.storage.backend.register('json', backend)
    return async () => { unregister(); await backend.close() }
  })
  const facility = new DomainFacility(ctx, { backend: 'json' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => { await facility.closeAll(); unmount() }
  })
  ctx.provide('tomatoHomePath', (...segments: string[]) => join(home, ...segments))
  await ctx.plugin(MemoryService, config)
  return ctx.memory
}

const OWNER = LOCAL_MEMORY_OWNER
const SCOPE: MemoryScope = { kind: 'workspace', path: '/work/a' }
const VIEW: MemoryView = { owner: OWNER, workspace: { id: provisionalProjectId('/work/a'), path: '/work/a' } }

function request(overrides: Partial<RememberRequest> = {}): RememberRequest {
  return {
    owner: OWNER,
    scope: SCOPE,
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

describe('two mounted memory services over one home', () => {
  it('refreshes its mirror with a record the other process wrote', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-two-'))
    directories.push(directory)
    const root = join(directory, 'storages')
    const home = join(directory, 'home')
    const first = await mount(root, home)
    const second = await mount(root, home)
    const written = await second.remember(request({ value: 'Reply briefly, no emoji' }))
    // The first process opened before that write, so its mirror cannot hold it.
    expect(first.list(VIEW)).toEqual([])
    await first.refresh()
    expect(first.list(VIEW).map(record => record.id)).toEqual([written.id])
    expect((await first.recall({ view: VIEW, text: 'briefly' })).map(record => record.id))
      .toEqual([written.id])
  })

  it('closes the other process version when one identity is written twice', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-two-'))
    directories.push(directory)
    const root = join(directory, 'storages')
    const home = join(directory, 'home')
    const first = await mount(root, home)
    const second = await mount(root, home)
    const earlier = await first.remember(request({ value: 'Short and direct' }))
    const later = await second.remember(request({ value: 'Warm and brief' }))
    // A third process opens the stored state: one current version, one closed.
    const third = await mount(root, home)
    expect(third.list(VIEW).map(record => record.id)).toEqual([later.id])
    expect(third.versions(VIEW, later.id).map(version => version.id)).toEqual([later.id, earlier.id])
    expect(third.versions(VIEW, later.id)[1]).toMatchObject({ supersededBy: later.id })
  })

  it('reports write-busy when another process holds the write lock', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-two-'))
    directories.push(directory)
    const root = join(directory, 'storages')
    const home = join(directory, 'home')
    const memory = await mount(root, home, { writeLockTimeoutMs: 20, writeLockStaleMs: 10_000 })
    await mkdir(join(home, 'memory'), { recursive: true })
    await writeFile(join(home, 'memory', 'write.lock'), '424242\n1\n')
    await expect(memory.remember(request())).rejects.toMatchObject({ code: 'write-busy' })
  })

  it('skips the medium check when the refresh interval is zero', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-two-'))
    directories.push(directory)
    const memory = await mount(join(directory, 'storages'), join(directory, 'home'), { refreshIntervalMs: 0 })
    const record = await memory.remember(request())
    await memory.refresh()
    expect(memory.list(VIEW).map(current => current.id)).toEqual([record.id])
  })

  it('surfaces a lock path that cannot be created', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-two-'))
    directories.push(directory)
    const home = join(directory, 'home')
    // A regular file where the home directory should be: the lock cannot be created.
    await writeFile(home, 'not a directory\n')
    const memory = await mount(join(directory, 'storages'), home)
    await expect(memory.remember(request())).rejects.toMatchObject({ code: 'ENOTDIR' })
  })

  it('leaves the mirror alone when the medium did not move', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-two-'))
    directories.push(directory)
    const memory = await mount(join(directory, 'storages'), join(directory, 'home'), { refreshIntervalMs: 1 })
    const record = await memory.remember(request())
    await memory.refresh()
    await new Promise(resolve => setTimeout(resolve, 5))
    // The second check sees the same change token and skips the re-read.
    await memory.refresh()
    expect(memory.list(VIEW).map(current => current.id)).toEqual([record.id])
  })
})
