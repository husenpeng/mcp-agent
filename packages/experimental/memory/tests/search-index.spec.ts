/** Local FTS5 sidecar: indexing, filtering, deletion, and rebuilding from the domains. */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SessionId, SessionSeq } from '@tomato/session'
import {
  EpisodeId,
  LOCAL_MEMORY_OWNER,
  MemoryId,
  accountMemoryOwner,
  MemoryIndex,
  ProjectId,
  resolveVecExtensionPath,
  scopeProjectId,
  unpackedExtensionPath,
} from '@tomato/experimental-memory'
import type { EpisodeRecord, MemoryRecord, MemoryView } from '@tomato/experimental-memory'

const directories: string[] = []

afterEach(async () => {
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

async function indexPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-index-'))
  directories.push(directory)
  return join(directory, 'index.sqlite')
}

const PROJECT_A = ProjectId('ws-a')
const PROJECT_B = ProjectId('ws-b')
const VIEW_A: MemoryView = { owner: LOCAL_MEMORY_OWNER, workspace: { id: PROJECT_A, path: '/work/a' } }

let sequence = 0
function record(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  sequence += 1
  return {
    id: MemoryId(`memory-${sequence}`),
    owner: LOCAL_MEMORY_OWNER,
    scope: { kind: 'workspace', workspaceId: PROJECT_A, path: '/work/a' },
    kind: 'preference',
    entity: 'user',
    key: `key-${sequence}`,
    value: 'Reply briefly',
    status: 'active',
    pinned: false,
    createdAt: 1,
    updatedAt: 1,
    source: { sessionId: SessionId('session-1'), userMessageSeq: SessionSeq(1) },
    ...overrides,
  }
}

function episode(overrides: Partial<EpisodeRecord> = {}): EpisodeRecord {
  sequence += 1
  return {
    id: EpisodeId(`episode-${sequence}`),
    owner: LOCAL_MEMORY_OWNER,
    scope: { kind: 'project', workspaceId: PROJECT_A, path: '/work/a' },
    kind: 'observation',
    type: 'task',
    title: 'Change the layout',
    narrative: 'The call changed the sidebar layout.',
    facts: ['Sidebar moved'],
    concepts: ['layout'],
    filesRead: [],
    filesModified: ['src/layout.ts'],
    fingerprint: `fingerprint-${sequence}`,
    source: { sessionId: SessionId('session-1') },
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('memory search index', () => {

  it('queues embeddings, stores vectors, and ranks them by cosine', async () => {
    const index = new MemoryIndex(await indexPath())
    const first = record({ value: 'Reply briefly' })
    const second = record({ value: 'Use emoji' })
    index.putRecord(first)
    index.putRecord(second)
    expect(index.outboxCount()).toBe(2)
    const jobs = index.pendingEmbeddings(0, 10)
    expect(jobs).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: 'record', objectId: first.id, contentUpdatedAt: first.updatedAt }),
      expect.objectContaining({ target: 'record', objectId: second.id, contentUpdatedAt: second.updatedAt }),
    ]))
    index.putVector('record', first.id, 'm', 2, Float32Array.from([1, 0]), first.updatedAt)
    index.putVector('record', second.id, 'm', 2, Float32Array.from([0, 1]), second.updatedAt)
    expect(index.vectorCount()).toBe(2)
    expect(index.getVector('record', first.id, 'm', first.updatedAt)).toEqual(Float32Array.from([1, 0]))
    expect(index.getVector('record', first.id, 'other', first.updatedAt)).toBeUndefined()
    expect(index.nearestRecordIds(VIEW_A, Float32Array.from([1, 0]), 10, 'm')).toEqual([first.id, second.id])
    expect(index.nearestRecordIds(VIEW_A, Float32Array.from([1, 0]), 1, 'm')).toEqual([first.id])
    for (const job of jobs) index.completeEmbedding(job.seq)
    expect(index.outboxCount()).toBe(0)
    index.deleteRecord(first.id)
    expect(index.vectorCount()).toBe(1)
  })

  it('re-embeds a changed model and queues only missing vectors', async () => {
    const index = new MemoryIndex(await indexPath())
    const first = record({ value: 'Reply briefly' })
    const second = record({ value: 'Use emoji' })
    index.putRecord(first)
    index.putRecord(second)
    expect(index.syncEmbeddingModel('m')).toBe(true)
    index.putVector('record', first.id, 'm', 2, Float32Array.from([1, 0]), first.updatedAt)
    for (const job of index.pendingEmbeddings(0, 10)) index.completeEmbedding(job.seq)
    expect(index.syncEmbeddingModel('m')).toBe(false)
    index.ensureEmbeddings()
    expect(index.outboxCount()).toBe(1)
    expect(index.pendingEmbeddings(0, 10)[0]).toMatchObject({ objectId: second.id })
    expect(index.syncEmbeddingModel('other')).toBe(true)
    expect(index.vectorCount()).toBe(0)
    expect(index.outboxCount()).toBe(2)
    expect(index.syncEmbeddingModel('other')).toBe(false)
  })

  it('delays failed jobs and clears episode vectors and jobs', async () => {
    const index = new MemoryIndex(await indexPath())
    const entry = episode({ title: 'Sidebar layout' })
    index.putEpisode(entry)
    expect(index.outboxCount()).toBe(1)
    const [job] = index.pendingEmbeddings(0, 10)
    index.retryEmbeddings([job!.seq], 100)
    expect(index.pendingEmbeddings(0, 10)).toEqual([])
    expect(index.pendingEmbeddings(100, 10)).toHaveLength(1)
    index.putVector('episode', entry.id, 'm', 2, Float32Array.from([1, 0]), entry.updatedAt)
    expect(index.nearestEpisodeIds(VIEW_A, Float32Array.from([1, 0]), 10, 'm')).toEqual([entry.id])
    expect(index.nearestEpisodeIds({ owner: LOCAL_MEMORY_OWNER }, Float32Array.from([1, 0]), 10, 'm')).toEqual([])
    index.deleteEpisode(entry.id)
    expect(index.vectorCount()).toBe(0)
    expect(index.outboxCount()).toBe(0)
  })


  it('ranks a profile-only view and skips mismatched or tied vectors', async () => {
    const index = new MemoryIndex(await indexPath())
    const profile = record({ scope: { kind: 'profile' }, value: 'Profile tone' })
    const workspace = record({ value: 'Workspace tone' })
    index.putRecord(profile)
    index.putRecord(workspace)
    index.putVector('record', profile.id, 'm', 2, Float32Array.from([1, 0]), profile.updatedAt)
    index.putVector('record', workspace.id, 'm', 2, Float32Array.from([1, 0]), workspace.updatedAt)
    expect(index.nearestRecordIds({ owner: LOCAL_MEMORY_OWNER }, Float32Array.from([1, 0]), 10, 'm'))
      .toEqual([profile.id])
    expect(index.nearestRecordIds(VIEW_A, Float32Array.from([1, 0, 0]), 10, 'm')).toEqual([])
    const tied = index.nearestRecordIds(VIEW_A, Float32Array.from([1, 0]), 10, 'm')
    expect(tied).toHaveLength(2)
    expect(tied).toEqual([...tied].sort((left, right) => left.localeCompare(right)))
  })


  it('resolves and unpacks the sqlite-vec extension', async () => {
    expect(unpackedExtensionPath('/app/resources/app.asar/tomato/node_modules/vec0.dylib'))
      .toBe('/app/resources/app.asar.unpacked/tomato/node_modules/vec0.dylib')
    expect(unpackedExtensionPath('/tmp/vec0.dylib')).toBe('/tmp/vec0.dylib')
    expect(unpackedExtensionPath('/app/resources/app.asar.unpacked/vec0.dylib'))
      .toBe('/app/resources/app.asar.unpacked/vec0.dylib')
    const supported = ['darwin-x64', 'darwin-arm64', 'linux-x64', 'linux-arm64', 'win32-x64']
    const path = await resolveVecExtensionPath()
    if (supported.includes(`${process.platform}-${process.arch}`)) expect(path).toMatch(/\.(?:dylib|so|dll)$/u)
    else expect(path).toBeUndefined()
  })

  it('indexes pre-tokenized Chinese and Latin text', async () => {
    const index = new MemoryIndex(await indexPath())
    const chinese = record({ value: '邮件语气 简短 直接' })
    const latin = record({ value: 'Reply briefly and directly' })
    index.putRecord(chinese)
    index.putRecord(latin)
    expect(index.searchRecordIds({ view: VIEW_A, text: '邮件', limit: 10 })).toEqual([chinese.id])
    expect(index.searchRecordIds({ view: VIEW_A, text: 'briefly', limit: 10 })).toEqual([latin.id])
    expect(index.searchRecordIds({ view: VIEW_A, text: '直接', alternatives: ['directly'], limit: 10 }))
      .toEqual(expect.arrayContaining([chinese.id, latin.id]))
    index.close()
  })

  it('filters by owner, project, kind, and active status', async () => {
    const index = new MemoryIndex(await indexPath())
    const mine = record({ value: 'shared tone' })
    const otherProject = record({ scope: { kind: 'workspace', workspaceId: PROJECT_B, path: '/work/b' }, value: 'shared tone' })
    const otherOwner = record({ owner: accountMemoryOwner('u-bob'), value: 'shared tone' })
    const candidate = record({ status: 'candidate', value: 'shared tone' })
    const profile = record({ scope: { kind: 'profile' }, value: 'shared tone' })
    const kind = record({ kind: 'decision', value: 'shared tone' })
    for (const entry of [mine, otherProject, otherOwner, candidate, profile, kind]) index.putRecord(entry)
    expect(index.searchRecordIds({ view: VIEW_A, text: 'shared', limit: 10 }))
      .toEqual(expect.arrayContaining([mine.id, profile.id]))
    for (const hidden of [otherProject.id, candidate.id, otherOwner.id]) {
      expect(index.searchRecordIds({ view: VIEW_A, text: 'shared', limit: 10 })).not.toContain(hidden)
    }
    expect(index.searchRecordIds({ view: VIEW_A, text: 'shared', kind: 'decision', limit: 10 })).toEqual([kind.id])
    index.close()
  })

  it('lists the newest active records for an empty query', async () => {
    const index = new MemoryIndex(await indexPath())
    const older = record({ value: 'older', updatedAt: 1 })
    const newer = record({ value: 'newer', updatedAt: 2 })
    index.putRecord(older)
    index.putRecord(newer)
    expect(index.searchRecordIds({ view: VIEW_A, text: '', limit: 10 })).toEqual([newer.id, older.id])
    index.close()
  })

  it('reports staleness by marker and merges rows on rebuild', async () => {
    const index = new MemoryIndex(await indexPath())
    const first = record({ value: 'first tone' })
    const second = record({ value: 'second tone' })
    index.putRecord(first)
    index.putRecord(second)
    index.deleteRecord(first.id)
    expect(index.searchRecordIds({ view: VIEW_A, text: 'tone', limit: 10 })).toEqual([second.id])
    expect(index.needsRebuild()).toBe(true)
    index.rebuild([first, second], [])
    expect(index.needsRebuild()).toBe(false)
    expect(index.searchRecordIds({ view: VIEW_A, text: 'first', limit: 10 })).toEqual([first.id])
    index.markDirty()
    expect(index.needsRebuild()).toBe(true)
    index.close()
  })

  it('keeps rows another Host process published when one process rebuilds', async () => {
    const path = await indexPath()
    const first = record({ value: 'alpha tone' })
    const second = record({ value: 'beta tone' })
    const writer = new MemoryIndex(path)
    const other = new MemoryIndex(path)
    writer.rebuild([first], [])
    // The other process holds a snapshot without `first`; its rebuild must add
    // its own rows and leave the first process's row in place.
    other.rebuild([second], [])
    expect(other.searchRecordIds({ view: VIEW_A, text: 'alpha', limit: 10 })).toEqual([first.id])
    expect(writer.searchRecordIds({ view: VIEW_A, text: 'beta', limit: 10 })).toEqual([second.id])
    writer.close()
    other.close()
  })

  it('filters episodes by project, kind, and time', async () => {
    const index = new MemoryIndex(await indexPath())
    const observation = episode({ title: 'Sidebar layout', createdAt: 10 })
    const summary = episode({ kind: 'summary', title: 'Sidebar summary', createdAt: 20 })
    const otherProject = episode({
      scope: { kind: 'project', workspaceId: PROJECT_B, path: '/work/b' },
      title: 'Sidebar elsewhere',
    })
    for (const entry of [observation, summary, otherProject]) index.putEpisode(entry)
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'sidebar', limit: 10 }))
      .toEqual(expect.arrayContaining([observation.id, summary.id]))
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'sidebar', limit: 10 })).not.toContain(otherProject.id)
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'sidebar', kinds: ['summary'], limit: 10 })).toEqual([summary.id])
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'sidebar', since: 15, limit: 10 })).toEqual([summary.id])
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'sidebar', until: 10, limit: 10 })).toEqual([observation.id])
    expect(index.searchEpisodeIds({ view: VIEW_A, text: '', limit: 10 })[0]).toBe(summary.id)
    index.close()
  })


  it('searches a profile-only view and refuses an episode search without a project', async () => {
    const index = new MemoryIndex(await indexPath())
    const profile = record({ scope: { kind: 'profile' }, value: 'profile tone' })
    const workspace = record({ value: 'workspace tone' })
    index.putRecord(profile)
    index.putRecord(workspace)
    const profileView: MemoryView = { owner: LOCAL_MEMORY_OWNER }
    expect(index.searchRecordIds({ view: profileView, text: 'tone', limit: 10 })).toEqual([profile.id])
    expect(index.searchEpisodeIds({ view: profileView, text: 'tone', limit: 10 })).toEqual([])
    index.close()
  })

  it('combines episode kind and both time bounds and treats an empty kind list as no filter', async () => {
    const index = new MemoryIndex(await indexPath())
    const early = episode({ title: 'Early sidebar', createdAt: 10 })
    const late = episode({ title: 'Late sidebar', createdAt: 30 })
    index.putEpisode(early)
    index.putEpisode(late)
    expect(index.searchEpisodeIds({
      view: VIEW_A, text: 'sidebar', kinds: ['observation'], since: 20, until: 40, limit: 10,
    })).toEqual([late.id])
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'sidebar', kinds: [], limit: 10 }))
      .toEqual(expect.arrayContaining([early.id, late.id]))
    index.close()
  })

  it('rebuilds episodes with their text', async () => {
    const index = new MemoryIndex(await indexPath())
    const kept = episode({ title: 'Rebuilt sidebar' })
    index.rebuild([], [kept])
    expect(index.searchEpisodeIds({ view: VIEW_A, text: 'rebuilt', limit: 10 })).toEqual([kept.id])
    index.close()
  })

  it('reopens a file with its rows and merges a rebuild into them', async () => {
    const path = await indexPath()
    const index = new MemoryIndex(path)
    const kept = record({ value: 'kept tone' })
    index.putRecord(kept)
    index.close()
    const reopened = new MemoryIndex(path)
    expect(reopened.searchRecordIds({ view: VIEW_A, text: 'kept', limit: 10 })).toEqual([kept.id])
    reopened.rebuild([record({ id: MemoryId('memory-fresh'), value: 'fresh tone' })], [])
    // A rebuild merges: the row written before the reopen survives, because the
    // process that rebuilds may never have loaded it.
    expect(reopened.searchRecordIds({ view: VIEW_A, text: 'kept', limit: 10 })).toEqual([kept.id])
    expect(reopened.searchRecordIds({ view: VIEW_A, text: 'fresh', limit: 10 })).toEqual(['memory-fresh'])
    reopened.close()
  })

  it('derives a record project identity from a legacy scope path', () => {
    const legacy = record({ scope: { kind: 'workspace', path: '/work/a' } })
    if (legacy.scope.kind !== 'workspace') throw new Error('expected a workspace scope')
    expect(String(scopeProjectId(legacy.scope))).toMatch(/^pw:/u)
  })
})
