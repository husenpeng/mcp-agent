/** Memory service storage, scoping, replacement, limits, and restart durability. */
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, Service } from '@tomato/cordis'
import SessionStore, { SessionId, SessionSeq } from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { AccountState } from '@tomato/gateway'
import { Embeddings, EmbeddingsError } from '@tomato/experimental-embeddings'
import type { EmbedRequest } from '@tomato/experimental-embeddings'
import MemoryService, {
  EpisodeId,
  LOCAL_MEMORY_OWNER,
  MemoryError,
  MemoryId,
  MemoryIndex,
  accountMemoryOwner,
  cosineSimilarity,
  isMemoryIdentifier,
  memoryDomain,
  memoryEmbeddingText,
  memoryTokens,
  normalizeIdentifier,
  isDue,
  normalizeStatement,
  provisionalProjectId,
  ProjectId,
  rankMemories,
  repositoryRootOf,
  resolveMemoryLimits,
  resolveMemoryWorkspace,
  scoreMemories,
  tokenContainment,
} from '@tomato/experimental-memory'
import type { EpisodeRecord, MemoryRecord, MemoryScope, MemoryView, RememberEpisodeRequest, RememberRequest } from '@tomato/experimental-memory'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'

const contexts: Context[] = []
const directories: string[] = []

afterEach(async () => {
  vi.useRealTimers()
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/** Mount the service over an in-memory storage medium that survives across harnesses. */
async function harness(options: {
  pool?: MemoryMediaPool
  config?: Parameters<typeof MemoryService.Config>[0]
  tomatoHomePath?: (...segments: string[]) => string
} = {}) {
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
  if (options.tomatoHomePath !== undefined) ctx.provide('tomatoHomePath', options.tomatoHomePath)
  const fiber = await ctx.plugin(MemoryService, options.config ?? {})
  return { ctx, pool, fiber, memory: ctx.memory }
}

const OWNER = LOCAL_MEMORY_OWNER
const WORKSPACE_A: MemoryScope = { kind: 'workspace', path: '/work/a' }
const PROFILE: MemoryScope = { kind: 'profile' }
const VIEW_A: MemoryView = { owner: OWNER, workspace: { id: provisionalProjectId('/work/a'), path: '/work/a' } }
const VIEW_B: MemoryView = { owner: OWNER, workspace: { id: provisionalProjectId('/work/b'), path: '/work/b' } }

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

/** Scripted embedding provider: one axis signals "tone", the other "emoji". */
class ScriptEmbeddings extends Embeddings {
  readonly model: string = 'script'
  readonly dimensions = 2
  readonly batches: string[][] = []
  failure: unknown
  countOverride: number | undefined

  async embed(request: EmbedRequest): Promise<readonly Float32Array[]> {
    if (request.signal?.aborted === true) throw new DOMException('aborted', 'AbortError')
    if (this.failure !== undefined) throw this.failure
    this.batches.push([...request.texts])
    const vectors = request.texts.map((text) => {
      if (text.includes('emoji') || text.includes('表情')) return Float32Array.from([0, 1])
      if (text.includes('half') || text.includes('半')) return Float32Array.from([0.6, 0.8])
      return Float32Array.from([1, 0])
    })
    return this.countOverride === undefined ? vectors : vectors.slice(0, this.countOverride)
  }
}

/** Provider mounted but switched off by its host. */
class DisabledEmbeddings extends ScriptEmbeddings {
  override get enabled(): boolean { return false }
}

async function tempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-'))
  directories.push(directory)
  return directory
}

/** Run one Git command in a directory, with an identity that never reads the operator's configuration. */
async function git(directory: string, ...args: string[]): Promise<void> {
  await new Promise<void>((settle, fail) => {
    execFile(
      'git',
      ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', '-c', 'commit.gpgsign=false', ...args],
      { cwd: directory },
      (error) => {
        if (error === null) settle()
        else fail(new Error(`git ${args.join(' ')} failed: ${error.message}`, { cause: error }))
      },
    )
  })
}

/** A committed repository and one linked worktree of it, both canonical. */
async function repositoryWithWorktree(): Promise<{ repository: string; worktree: string }> {
  const root = await tempDirectory()
  await git(root, 'init', '--quiet')
  await writeFile(join(root, 'tracked.txt'), 'content\n')
  await git(root, 'add', 'tracked.txt')
  await git(root, 'commit', '--quiet', '--no-verify', '-m', 'initial')
  const worktree = join(await tempDirectory(), 'checkout')
  await git(root, 'worktree', 'add', '--quiet', '--detach', worktree, 'HEAD')
  return { repository: await realpath(root), worktree: await realpath(worktree) }
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

describe('normalization', () => {
  it('canonicalizes identifiers and statements', () => {
    expect(normalizeIdentifier('  Client:Brand   X ')).toBe('client:brand-x')
    expect(normalizeIdentifier('Email_Tone')).toBe('email-tone')
    expect(normalizeIdentifier('Ａ：Ｂ')).toBe('a:b')
    expect(normalizeIdentifier('a--b')).toBe('a-b')
    expect(normalizeIdentifier(':a::b:')).toBe('a:b')
    expect(normalizeIdentifier('用户')).toBe('用户')
    expect(normalizeStatement('  Use\tEnglish\nnow  ')).toBe('Use English now')
    expect(normalizeStatement('\u0000 短  ')).toBe('短')
  })

  it('stores the canonical identity and replaces a differently spelled write', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.remember(request({ entity: ' User ', key: 'Email_Tone', value: '  Short   and direct  ' }))
    expect(first.entity).toBe('user')
    expect(first.key).toBe('email-tone')
    expect(first.value).toBe('Short and direct')
    vi.setSystemTime(2_000)
    const second = await memory.remember(request({ entity: 'user', key: 'email-tone', value: 'Reply briefly' }))
    expect(second.id).not.toBe(first.id)
    const versions = memory.versions(VIEW_A, second.id)
    expect(versions.map(version => version.id)).toEqual([second.id, first.id])
    expect(versions[0]).toMatchObject({ validFrom: 2_000 })
    expect(versions[0]?.validTo).toBeUndefined()
    expect(versions[1]).toMatchObject({ validTo: 2_000, supersededBy: second.id })
  })

  it('rejects an identifier and an empty statement normalization cannot make valid', async () => {
    const { memory } = await harness()
    await expect(memory.remember(request({ entity: '用户' }))).rejects.toMatchObject({ code: 'invalid-identifier' })
    await expect(memory.remember(request({ value: '   \n ' }))).rejects.toMatchObject({ code: 'empty-value' })
  })

  it('normalizes every stored episode text field', async () => {
    const { memory } = await harness()
    const episode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: ' Bugfix ',
      title: '  Fix   the bug ',
      subtitle: '  ',
      narrative: 'Line one\nline two',
      facts: ['  did   x ', '   '],
      concepts: [' UI '],
      filesRead: ['  src/a.ts '],
      filesModified: ['  src/b.ts '],
      fingerprint: 'fingerprint',
      source: { sessionId: SessionId('session-1') },
    })
    expect(episode.type).toBe('bugfix')
    expect(episode.title).toBe('Fix the bug')
    expect(episode.subtitle).toBeUndefined()
    expect(episode.narrative).toBe('Line one line two')
    expect(episode.facts).toEqual(['did x'])
    expect(episode.concepts).toEqual(['UI'])
    expect(episode.filesRead).toEqual(['src/a.ts'])
    expect(episode.filesModified).toEqual(['src/b.ts'])
  })

  it('keeps a non-empty episode subtitle in canonical form', async () => {
    const { memory } = await harness()
    const episode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: 'bugfix',
      title: 'Fix the bug',
      subtitle: '  Second   line ',
      narrative: 'Body',
      fingerprint: 'fingerprint-2',
      source: { sessionId: SessionId('session-1') },
    })
    expect(episode.subtitle).toBe('Second line')
  })

  it('rejects an empty episode title and a type that is not one word', async () => {
    const { memory } = await harness()
    const base: RememberEpisodeRequest = {
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: 'bugfix',
      title: 'Fix the bug',
      narrative: '',
      fingerprint: 'fingerprint',
      source: { sessionId: SessionId('session-1') },
    }
    await expect(memory.rememberEpisode({ ...base, title: '   ' })).rejects.toMatchObject({ code: 'empty-value' })
    await expect(memory.rememberEpisode({ ...base, type: 'bug:fix' })).rejects.toMatchObject({ code: 'invalid-identifier' })
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

  it('scores every record once and keeps an empty query at score zero', () => {
    const records = [at('a', '预算 500 美元', 2), at('b', '预算 500', 1)]
    const scored = scoreMemories(records, '预算 500 美元')
    expect(scored.map(entry => entry.record.id)).toEqual(['a', 'b'])
    expect(scored[0]?.score).toBe(1)
    expect(scored[1]?.score).toBeCloseTo(2 / 3)
    expect(scoreMemories(records, '').map(entry => entry.record.id)).toEqual(['a', 'b'])
    expect(memoryEmbeddingText(records[0]!)).toBe('client brand x budget 预算 500 美元')
  })

  it('compares vectors by cosine and rejects mismatched lengths', () => {
    expect(cosineSimilarity(Float32Array.from([1, 0]), Float32Array.from([1, 0]))).toBe(1)
    expect(cosineSimilarity(Float32Array.from([1, 0]), Float32Array.from([0, 1]))).toBe(0)
    expect(cosineSimilarity(Float32Array.from([0, 0]), Float32Array.from([1, 1]))).toBe(0)
    expect(cosineSimilarity(new Float32Array(), new Float32Array())).toBe(0)
    expect(() => cosineSimilarity(Float32Array.from([1]), Float32Array.from([1, 2]))).toThrow(/differ in length/u)
  })
})

describe('semantic ranking', () => {
  async function semanticHarness(config: Parameters<typeof MemoryService.Config>[0] = {}) {
    const harnessed = await harness({ config })
    await harnessed.ctx.plugin(ScriptEmbeddings)
    return { ...harnessed, embeddings: harnessed.ctx.embeddings as ScriptEmbeddings }
  }

  it('returns a paraphrase with no shared words above the similarity floor', async () => {
    const { memory, embeddings } = await semanticHarness()
    const reply = await memory.remember(request({ key: 'reply', value: 'Reply briefly' }))
    await memory.remember(request({ key: 'emoji', value: 'Use emoji sparingly' }))
    const result = await memory.recall({ view: VIEW_A, text: '语气' })
    expect(result.map(record => record.id)).toEqual([reply.id])
    expect(embeddings.batches).toHaveLength(1)
    expect(embeddings.batches[0]?.[0]).toBe('语气')
  })

  it('keeps a lexical hit ahead of a semantic-only match', async () => {
    const { memory } = await semanticHarness()
    const literal = await memory.remember(request({ key: 'tone', value: '语气 简短' }))
    const paraphrase = await memory.remember(request({ key: 'paraphrase', value: 'Reply briefly' }))
    const result = await memory.recall({ view: VIEW_A, text: '语气' })
    expect(result.map(record => record.id)).toEqual([literal.id, paraphrase.id])
  })

  it('filters a semantic-only match below the floor', async () => {
    const { memory } = await semanticHarness({ semanticFloor: 0.9 })
    await memory.remember(request({ key: 'half', value: 'half tone' }))
    expect(await memory.recall({ view: VIEW_A, text: '语气' })).toEqual([])
    const permissive = await semanticHarness({ semanticFloor: 0.35 })
    const half = await permissive.memory.remember(request({ key: 'half', value: 'half tone' }))
    expect((await permissive.memory.recall({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([half.id])
  })

  it('embeds at most maxSemanticCandidates records plus the query', async () => {
    const { memory, embeddings } = await semanticHarness({ maxSemanticCandidates: 1 })
    await memory.remember(request({ key: 'a', value: 'Alpha' }))
    await memory.remember(request({ key: 'b', value: 'Beta' }))
    await memory.recall({ view: VIEW_A, text: '语气' })
    expect(embeddings.batches[0]).toHaveLength(2)
  })

  it('trims a lexical pool that already fills the semantic candidate limit', async () => {
    const { memory, embeddings } = await semanticHarness({ maxSemanticCandidates: 1 })
    await memory.remember(request({ key: 'a', value: '语气 alpha' }))
    await memory.remember(request({ key: 'b', value: '语气 beta' }))
    expect(await memory.recall({ view: VIEW_A, text: '语气' })).toHaveLength(1)
    expect(embeddings.batches[0]).toHaveLength(2)
  })

  it('breaks a blended tie by recency and then by id', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await semanticHarness()
    const older = await memory.remember(request({ key: 'older', value: 'tone' }))
    vi.setSystemTime(2_000)
    const newer = await memory.remember(request({ key: 'newer', value: 'tone' }))
    expect((await memory.recall({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([newer.id, older.id])
    vi.setSystemTime(5_000)
    const first = await memory.remember(request({ key: 'first', value: 'tone' }))
    const second = await memory.remember(request({ key: 'second', value: 'tone' }))
    const sameTime = [first.id, second.id].sort((left, right) => left.localeCompare(right))
    expect((await memory.recall({ view: VIEW_A, text: '语气' })).map(record => record.id))
      .toEqual([...sameTime, newer.id, older.id])
  })

  it('skips the provider when semantic weight is zero, the query is empty, or no provider is mounted', async () => {
    const disabled = await semanticHarness({ semanticWeight: 0 })
    await disabled.memory.remember(request({ key: 'paraphrase', value: 'Reply briefly' }))
    expect(await disabled.memory.recall({ view: VIEW_A, text: '语气' })).toEqual([])
    expect(disabled.embeddings.batches).toEqual([])
    expect((await disabled.memory.recall({ view: VIEW_A, text: '' }).then(records => records.length))).toBe(1)
    expect(disabled.embeddings.batches).toEqual([])
    const plain = await harness()
    await plain.memory.remember(request({ key: 'paraphrase', value: 'Reply briefly' }))
    expect(await plain.memory.recall({ view: VIEW_A, text: '语气' })).toEqual([])
  })

  it('falls back to the lexical result when the provider fails', async () => {
    const { ctx, memory, embeddings } = await semanticHarness()
    const warn = vi.spyOn(ctx.logger, 'warn')
    const literal = await memory.remember(request({ key: 'tone', value: '语气 简短' }))
    await memory.remember(request({ key: 'paraphrase', value: 'Reply briefly' }))
    embeddings.failure = new EmbeddingsError('provider down', 'provider')
    expect((await memory.recall({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([literal.id])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('provider down'))
  })

  it('falls back when the provider throws a value that is not an Error', async () => {
    const { ctx, memory, embeddings } = await semanticHarness()
    const warn = vi.spyOn(ctx.logger, 'warn')
    const literal = await memory.remember(request({ key: 'tone', value: '语气 简短' }))
    embeddings.failure = 'boom'
    expect((await memory.recall({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([literal.id])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'))
  })

  it('falls back when the provider returns the wrong number of vectors', async () => {
    const { ctx, memory, embeddings } = await semanticHarness()
    const warn = vi.spyOn(ctx.logger, 'warn')
    await memory.remember(request({ key: 'tone', value: '语气 简短' }))
    embeddings.countOverride = 0
    expect((await memory.recall({ view: VIEW_A, text: '语气' })).map(record => record.key)).toEqual(['tone'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('returned 0 vectors'))
  })

  it('forwards caller cancellation instead of falling back', async () => {
    const { memory } = await semanticHarness()
    await memory.remember(request({ key: 'tone', value: '语气 简短' }))
    const controller = new AbortController()
    controller.abort()
    await expect(memory.recall({ view: VIEW_A, text: '语气', signal: controller.signal })).rejects.toBeInstanceOf(DOMException)
  })
})

describe('limits', () => {
  it('defaults every limit and rejects a non-positive or fractional value', () => {
    expect(resolveMemoryLimits({})).toEqual({
      maxRecallResults: 10, maxPinnedRecords: 20, maxValueBytes: 1024, maxRecordsPerWorkspace: 1000, maxProfileRecords: 100,
      semanticWeight: 0.35, maxSemanticCandidates: 50, semanticFloor: 0.35,
      maxEpisodesPerWorkspace: 500, maxEpisodeChars: 8000, episodeRetentionDays: 90,
      historySummaries: 1, historyEpisodes: 5, maxEmbeddingVectors: 2000,
      versionRetentionDays: 90, maxVersionsPerRecord: 10, summaryRetentionDays: 365,
      refreshIntervalMs: 1000, writeLockTimeoutMs: 2000, writeLockStaleMs: 30_000,
    })
    expect(() => resolveMemoryLimits({ maxRecallResults: 0 })).toThrow('maxRecallResults must be a positive safe integer')
    expect(() => resolveMemoryLimits({ maxValueBytes: 1.5 })).toThrow('maxValueBytes must be a positive safe integer')
    expect(() => resolveMemoryLimits({ maxProfileRecords: -1 })).toThrow('maxProfileRecords must be a positive safe integer')
    expect(() => resolveMemoryLimits({ maxSemanticCandidates: 0 })).toThrow('maxSemanticCandidates must be a positive safe integer')
    expect(() => resolveMemoryLimits({ versionRetentionDays: -1 })).toThrow('versionRetentionDays must be a non-negative safe integer')
    expect(() => resolveMemoryLimits({ maxVersionsPerRecord: 0 })).toThrow('maxVersionsPerRecord must be a positive safe integer')
    expect(() => resolveMemoryLimits({ summaryRetentionDays: 0 })).toThrow('summaryRetentionDays must be a positive safe integer')
    expect(() => resolveMemoryLimits({ semanticWeight: 1.5 })).toThrow('semanticWeight must be a number from 0 to 1')
    expect(() => resolveMemoryLimits({ semanticFloor: Number.NaN })).toThrow('semanticFloor must be a number from 0 to 1')
    expect(() => resolveMemoryLimits({ historyEpisodes: -1 })).toThrow('historyEpisodes must be a non-negative safe integer')
    expect(() => resolveMemoryLimits({ refreshIntervalMs: -1 })).toThrow('refreshIntervalMs must be a non-negative safe integer')
    expect(() => resolveMemoryLimits({ writeLockTimeoutMs: 0 })).toThrow('writeLockTimeoutMs must be a positive safe integer')
    expect(() => resolveMemoryLimits({ writeLockStaleMs: 0 })).toThrow('writeLockStaleMs must be a positive safe integer')
  })
})

describe('MemoryService', () => {
  it('admits its automatic page on a Settings server composed beside the class entry', async () => {
    const configure = vi.fn((_presentation: { auto?: boolean }, _owner: Context['fiber']) => () => {})
    const ctx = new Context()
    contexts.push(ctx)
    await ctx.plugin(SessionStore)
    await ctx.plugin(Storage)
    const backend = new MemoryStorageBackend(new MemoryMediaPool())
    ctx.effect(() => ctx.storage.backend.register('fixture', backend))
    const facility = new DomainFacility(ctx, { backend: 'fixture' })
    ctx.effect(() => {
      const unmount = ctx.storage.mount('domain', facility)
      ctx.provide('storageDomain', facility)
      return async () => { await facility.closeAll(); unmount() }
    })
    ctx.provide('settings', { configure } as never)
    await ctx.plugin(MemoryService, {})
    await vi.waitFor(() => { expect(configure).toHaveBeenCalledTimes(1) })
    const [call] = configure.mock.calls
    assert(call !== undefined)
    assert(JSON.stringify(call[0]) === '{}')
    assert(typeof call[1].dispose === 'function')
  })

  it('mounts without a Settings server', async () => {
    const { ctx } = await harness()
    expect(ctx.get('settings')).toBeUndefined()
  })

  it('stores, replaces by scope, entity, and key, and closes the earlier version', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.remember(request())
    vi.setSystemTime(2_000)
    const second = await memory.remember(request({ value: 'Warm and brief', pinned: true }))
    expect(second).toMatchObject({ createdAt: 2_000, updatedAt: 2_000, validFrom: 2_000, value: 'Warm and brief', pinned: true })
    expect(second.id).not.toBe(first.id)
    const versions = memory.versions(VIEW_A, second.id)
    expect(versions.map(version => version.id)).toEqual([second.id, first.id])
    expect(versions[1]).toMatchObject({ validTo: 2_000, supersededBy: second.id })
    vi.setSystemTime(3_000)
    const profile = await memory.remember(request({ scope: PROFILE, value: 'Everywhere' }))
    expect(profile.id).not.toBe(first.id)
    expect(memory.list(VIEW_A)).toEqual([profile, second])
  })

  it('serializes concurrent writes to one identity', async () => {
    const { memory } = await harness()
    const [first, second] = await Promise.all([
      memory.remember(request({ value: 'Short and direct' })),
      memory.remember(request({ value: 'Warm and brief' })),
    ])
    expect(first.id).not.toBe(second.id)
    // Both writes saw the earlier one: exactly one current version remains and
    // the other is closed, instead of two active versions for one identity.
    expect(memory.list(VIEW_A).map(record => record.id)).toEqual([second.id])
    expect(memory.versions(VIEW_A, second.id).find(version => version.id === first.id))
      .toMatchObject({ supersededBy: second.id })
  })

  it('isolates workspaces for recall, listing, the snapshot, pinning, confirming, and deletion', async () => {
    const { memory } = await harness()
    const own = await memory.remember(request({ pinned: true }))
    await memory.remember(request({ scope: { kind: 'workspace', path: '/work/b' }, value: 'Other workspace' }))
    expect((await memory.recall({ view: VIEW_A, text: '' })).map(record => record.id)).toEqual([own.id])
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
    const bob: MemoryView = { owner: accountMemoryOwner('u-bob'), workspace: { id: provisionalProjectId('/work/a'), path: '/work/a' } }
    expect((await memory.recall({ view: VIEW_B, text: 'chinese' })).map(record => record.id)).toEqual([profile.id])
    expect((await memory.recall({ view: { owner: OWNER }, text: '' })).map(record => record.id)).toEqual([profile.id])
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
    expect(await memory.recall({ view: VIEW_A, text: 'emoji' })).toEqual([])
    expect(memory.snapshot(VIEW_A)).toEqual([])
    expect(await memory.setPinned(VIEW_A, candidate.id, true)).toBeUndefined()
    const confirmed = await memory.confirm(VIEW_A, candidate.id)
    expect(confirmed?.status).toBe('active')
    expect(await memory.confirm(VIEW_A, candidate.id)).toBeUndefined()
    expect((await memory.recall({ view: VIEW_A, text: 'emoji' })).map(record => record.id)).toEqual([candidate.id])
    await memory.confirm(VIEW_A, profileCandidate.id)
    expect(memory.snapshot(VIEW_A).map(record => record.id)).toEqual([profileCandidate.id])
  })

  it('keeps a confirmed record in force until a proposal that replaces it is accepted', async () => {
    const { memory } = await harness()
    const confirmed = await memory.remember(request({ value: 'Short and direct, no emoji' }))
    const proposal = await memory.remember(request({
      entity: 'proposal',
      key: 'replace-0123456789abcdef',
      value: 'Short and direct, one emoji is fine',
      status: 'candidate',
      source: { sessionId: SessionId('s') },
      proposalFor: confirmed.id,
    }))
    expect(proposal.proposalFor).toBe(confirmed.id)

    // The proposal waits beside the rule it contradicts, and the rule keeps applying.
    expect((await memory.recall({ view: VIEW_A, text: 'emoji' })).map(record => record.id)).toEqual([confirmed.id])
    expect(memory.list(VIEW_A).map(record => record.entity).sort()).toEqual(['proposal', 'user'])

    const accepted = await memory.confirm(VIEW_A, proposal.id)
    expect(accepted).toMatchObject({ status: 'active', entity: 'user', key: 'email-tone', value: 'Short and direct, one emoji is fine' })
    const current = memory.list(VIEW_A)
    expect(current.map(record => record.id)).toEqual([accepted?.id])
    expect(current[0]?.scope).toEqual(confirmed.scope)
    // The replaced version stays stored as history, and the proposal records what it replaced.
    const versions = memory.versions(VIEW_A, confirmed.id)
    expect(versions.find(record => record.id === confirmed.id)?.supersededBy).toBe(accepted?.id)
    expect(memory.versions(VIEW_A, proposal.id)[0]?.supersededBy).toBe(accepted?.id)
  })

  it('activates a proposal on its own identity when the record it named is gone', async () => {
    const { memory } = await harness()
    const confirmed = await memory.remember(request())
    const proposal = await memory.remember(request({
      entity: 'proposal',
      key: 'replace-fedcba9876543210',
      value: 'A statement whose rule was deleted',
      status: 'candidate',
      source: { sessionId: SessionId('s') },
      proposalFor: confirmed.id,
    }))
    await memory.forget(VIEW_A, confirmed.id)
    const accepted = await memory.confirm(VIEW_A, proposal.id)
    expect(accepted).toMatchObject({ id: proposal.id, status: 'active', entity: 'proposal' })
    expect(memory.list(VIEW_A).map(record => record.value)).toEqual(['A statement whose rule was deleted'])
  })

  it('filters recall by kind and bounds it by maxRecallResults', async () => {
    const { memory } = await harness({ config: { maxRecallResults: 1 } })
    await memory.remember(request({ key: 'a', kind: 'fact', value: 'shared word' }))
    await memory.remember(request({ key: 'b', kind: 'decision', value: 'shared word' }))
    expect((await memory.recall({ view: VIEW_A, text: 'shared', kind: 'decision' })).map(record => record.key)).toEqual(['b'])
    expect(await memory.recall({ view: VIEW_A, text: 'shared' })).toHaveLength(1)
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
    const reopened = await facility.open({ name: 'tomato_memory', version: memoryDomain.version, tables: {} })
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
    const canonical = await realpath(directory)
    expect(first).toEqual({
      kind: 'available',
      view: { owner: OWNER, workspace: { id: provisionalProjectId(canonical), path: canonical } },
    })
    expect(await memory.accessOf(ctx.sessions.create(SessionId('none')))).toEqual({ kind: 'available', view: { owner: OWNER } })
    const warn = vi.spyOn(ctx.logger, 'warn')
    const missing = ctx.sessions.create(SessionId('missing'), { meta: { cwd: join(directory, 'gone') } })
    expect(await memory.accessOf(missing)).toEqual({ kind: 'available', view: { owner: OWNER } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('directory of Session "missing" is unavailable'))

    // A run without a Session resolves its view by directory.
    expect(await memory.accessFor(link)).toEqual(first)
    expect(await memory.accessFor(join(directory, 'gone'))).toEqual({ kind: 'available', view: { owner: OWNER } })
  })

  it('gives a linked Git worktree the project identity of its repository', async () => {
    const { ctx, memory } = await harness()
    const { repository, worktree } = await repositoryWithWorktree()
    const outside = await realpath(await tempDirectory())

    expect(await repositoryRootOf(worktree)).toBe(repository)
    // A conventional checkout, a directory below one, and a directory outside Git keep their own identity.
    expect(await repositoryRootOf(repository)).toBeUndefined()
    expect(await repositoryRootOf(join(repository, 'nested'))).toBeUndefined()
    expect(await repositoryRootOf(outside)).toBeUndefined()

    expect((await resolveMemoryWorkspace(ctx, worktree)).id).toBe(provisionalProjectId(repository))
    expect((await resolveMemoryWorkspace(ctx, repository)).id).toBe(provisionalProjectId(repository))
    expect((await resolveMemoryWorkspace(ctx, outside)).id).toBe(provisionalProjectId(outside))
    // Without the repository mapping the two directories would be separate projects.
    expect(provisionalProjectId(worktree)).not.toBe(provisionalProjectId(repository))

    // A record a worktree writes keeps its own directory as the display path and reaches the repository's Sessions.
    const stored = await memory.remember(request({ scope: { kind: 'workspace', path: worktree } }))
    expect(stored.scope).toMatchObject({ kind: 'workspace', workspaceId: provisionalProjectId(repository), path: worktree })
    const inRepository = await memory.accessFor(repository)
    assert(inRepository.kind === 'available' && inRepository.view.workspace !== undefined)
    expect(memory.list(inRepository.view).map(record => record.id)).toEqual([stored.id])
  })

  it('keeps a checkout that names no repository on its own project identity', async () => {
    const { ctx } = await harness()
    // A `.git` file that names no gitdir, and a gitdir that does not exist, name no repository.
    const noPointer = await tempDirectory()
    await writeFile(join(noPointer, '.git'), 'not a gitdir line\n')
    const dangling = await tempDirectory()
    await writeFile(join(dangling, '.git'), `gitdir: ${join(dangling, 'absent')}\n`)

    // A submodule's gitdir carries no `commondir`, so it names a repository of its own rather than its parent's.
    const submodule = await tempDirectory()
    await mkdir(join(submodule, 'gitdir'), { recursive: true })
    await writeFile(join(submodule, '.git'), `gitdir: ${join(submodule, 'gitdir')}\n`)

    // A `commondir` that names no directory, and an empty one, name no repository either.
    const absentCommon = await tempDirectory()
    await mkdir(join(absentCommon, 'gitdir'), { recursive: true })
    await writeFile(join(absentCommon, '.git'), `gitdir: ${join(absentCommon, 'gitdir')}\n`)
    await writeFile(join(absentCommon, 'gitdir', 'commondir'), '../absent\n')
    const emptyCommon = await tempDirectory()
    await mkdir(join(emptyCommon, 'gitdir'), { recursive: true })
    await writeFile(join(emptyCommon, '.git'), `gitdir: ${join(emptyCommon, 'gitdir')}\n`)
    await writeFile(join(emptyCommon, 'gitdir', 'commondir'), '\n')

    for (const directory of [noPointer, dangling, submodule, absentCommon, emptyCommon]) {
      expect(await repositoryRootOf(directory)).toBeUndefined()
      expect((await resolveMemoryWorkspace(ctx, directory)).id).toBe(provisionalProjectId(directory))
    }

    // A `.git` file may name its gitdir relatively, as a submodule does.
    const parent = await tempDirectory()
    const repository = join(parent, 'repository')
    const worktree = join(parent, 'checkout')
    await mkdir(join(repository, '.git', 'worktrees', 'checkout'), { recursive: true })
    await writeFile(join(repository, '.git', 'worktrees', 'checkout', 'commondir'), '../..\n')
    await mkdir(worktree, { recursive: true })
    await writeFile(join(worktree, '.git'), 'gitdir: ../repository/.git/worktrees/checkout\n')
    const root = await realpath(repository)
    expect(await repositoryRootOf(worktree)).toBe(root)
    expect((await resolveMemoryWorkspace(ctx, worktree)).id).toBe(provisionalProjectId(root))
  })

  it('serves the signed-in account, distinguishes a loading account from a sign-out, and refuses after one', async () => {
    const { ctx, memory } = await harness()
    const account = new AccountState()
    ctx.provide('tomatoAccount', account.view())
    const session = ctx.sessions.create(SessionId('account'))
    // A fresh gateway has not verified the browser yet; that is not a sign-out.
    expect(await memory.accessOf(session)).toEqual({ kind: 'account-loading' })
    expect(await memory.accessFor('/tmp')).toEqual({ kind: 'account-loading' })
    expect(memory.accessProfile()).toEqual({ kind: 'account-loading' })
    const alice = { id: 'u-alice', email: 'alice@example.com', name: null, avatarUrl: null, language: null }
    account.observe({ kind: 'valid', user: alice })
    expect(await memory.accessOf(session)).toEqual({ kind: 'available', view: { owner: accountMemoryOwner('u-alice') } })
    account.observe({ kind: 'valid', user: { ...alice, id: 'u-bob' } })
    expect(await memory.accessOf(session)).toEqual({ kind: 'available', view: { owner: accountMemoryOwner('u-bob') } })
    account.signOut()
    expect(await memory.accessOf(session)).toEqual({ kind: 'sign-in-required' })
    // A caller without a Session reads the same account state.
    expect(memory.accessProfile()).toEqual({ kind: 'sign-in-required' })
  })
  it('uses the workspace registry identity and keeps memory visible across a path change', async () => {
    const { ctx, memory } = await harness()
    const first = await realpath(await tempDirectory())
    const second = await realpath(await tempDirectory())
    ctx.provide('workspaceRegistry', {
      resolveByPath: async (path: string) => ({ id: 'ws-shared', path }),
    })
    const firstAccess = await memory.accessFor(first)
    const secondAccess = await memory.accessFor(second)
    if (firstAccess.kind !== 'available' || firstAccess.view.workspace === undefined) throw new Error('expected a project view')
    if (secondAccess.kind !== 'available' || secondAccess.view.workspace === undefined) throw new Error('expected a project view')
    expect(firstAccess.view.workspace.id).toBe(ProjectId('ws-shared'))
    expect(secondAccess.view.workspace.path).toBe(second)
    const record = await memory.remember(request({ scope: { kind: 'workspace', path: first }, key: 'shared' }))
    expect(record.scope).toMatchObject({ kind: 'workspace', workspaceId: ProjectId('ws-shared') })
    expect(memory.list(firstAccess.view).map(entry => entry.id)).toEqual([record.id])
    expect(memory.list(secondAccess.view).map(entry => entry.id)).toEqual([record.id])
  })

  it('maps a pre-v2 stored scope to a provisional project identity when the domain opens', async () => {
    const pool = new MemoryMediaPool()
    const legacy: MemoryRecord = {
      id: MemoryId('memory-legacy'),
      owner: OWNER,
      scope: { kind: 'workspace', path: '/work/a' },
      kind: 'fact',
      entity: 'user',
      key: 'legacy',
      value: 'Legacy statement',
      status: 'active',
      pinned: false,
      createdAt: 1,
      updatedAt: 1,
      source: { sessionId: SessionId('session-legacy') },
    }
    pool.versions.set('tomato_memory', 1)
    pool.media.set('tomato_memory', {
      tables: new Map<string, Map<string, unknown>>([['records', new Map<string, unknown>([[legacy.id, legacy]])]]),
      global: null,
    })
    const legacyEpisode: EpisodeRecord = {
      id: EpisodeId('episode-legacy'),
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: 'task',
      title: 'Legacy episode',
      narrative: '',
      facts: [],
      concepts: [],
      filesRead: [],
      filesModified: [],
      fingerprint: 'legacy-fingerprint',
      source: { sessionId: SessionId('session-legacy') },
      createdAt: 1,
      updatedAt: 1,
    }
    pool.versions.set('tomato_memory_episodes', 1)
    pool.media.set('tomato_memory_episodes', {
      tables: new Map<string, Map<string, unknown>>([['records', new Map<string, unknown>([[legacyEpisode.id, legacyEpisode]])]]),
      global: null,
    })
    const indexPath = join(await tempDirectory(), 'index.sqlite')
    const { memory } = await harness({ pool, config: { indexPath } })
    const [migrated] = memory.list(VIEW_A)
    expect(migrated?.scope).toMatchObject({
      kind: 'workspace',
      workspaceId: provisionalProjectId('/work/a'),
      path: '/work/a',
    })
    expect(migrated?.validFrom).toBe(1)
    expect(memory.listEpisodes(VIEW_A)[0]?.scope).toMatchObject({
      kind: 'project',
      workspaceId: provisionalProjectId('/work/a'),
      path: '/work/a',
    })
  })

  it('re-maps a provisional identity when the workspace registry arrives later', async () => {
    const { ctx, memory } = await harness()
    const canonical = await realpath(await tempDirectory())
    const record = await memory.remember(request({ scope: { kind: 'workspace', path: canonical }, key: 'reconciled' }))
    expect(record.scope).toMatchObject({ kind: 'workspace', workspaceId: provisionalProjectId(canonical) })
    ctx.provide('workspaceRegistry', {
      resolveByPath: async (path: string) => ({ id: 'ws-late', path }),
    })
    await vi.waitFor(() => {
      expect(memory.list({ owner: OWNER, workspace: { id: ProjectId('ws-late'), path: canonical } }).map(entry => entry.id))
        .toEqual([record.id])
    })
  })

  it('rejects a scope with neither a project identity nor a path', async () => {
    const { memory } = await harness()
    await expect(memory.remember(request({ scope: { kind: 'workspace' } }))).rejects.toMatchObject({ code: 'invalid-scope' })
    await expect(memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project' },
      kind: 'observation',
      type: 'task',
      title: 'A title',
      narrative: '',
      fingerprint: 'fingerprint',
      source: { sessionId: SessionId('session-1') },
    })).rejects.toMatchObject({ code: 'invalid-scope' })
  })
})

describe('project identity', () => {
  it('falls back to the deterministic provisional id without a registry or an answer', async () => {
    const plain = new Context()
    contexts.push(plain)
    expect(await resolveMemoryWorkspace(plain, '/work/a')).toEqual({
      id: provisionalProjectId('/work/a'), path: '/work/a',
    })
    const empty = new Context()
    contexts.push(empty)
    empty.provide('workspaceRegistry', { resolveByPath: async () => undefined })
    expect(await resolveMemoryWorkspace(empty, '/work/a')).toEqual({
      id: provisionalProjectId('/work/a'), path: '/work/a',
    })
  })

  it('uses the registry id and falls back when the lookup throws', async () => {
    const ctx = new Context()
    contexts.push(ctx)
    ctx.provide('workspaceRegistry', { resolveByPath: async (path: string) => ({ id: 'ws-1', path }) })
    expect(await resolveMemoryWorkspace(ctx, '/work/a')).toEqual({ id: ProjectId('ws-1'), path: '/work/a' })
    const failing = new Context()
    contexts.push(failing)
    const warn = vi.spyOn(failing.logger, 'warn')
    failing.provide('workspaceRegistry', {
      resolveByPath: async () => { throw new Error('registry down') },
    })
    expect((await resolveMemoryWorkspace(failing, '/work/b')).id).toBe(provisionalProjectId('/work/b'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('workspace lookup for "/work/b" failed'))
  })

  it('stores an explicit identity without a path and rejects an episode identity without one', async () => {
    const { memory } = await harness()
    const record = await memory.remember(request({
      scope: { kind: 'workspace', workspaceId: ProjectId('ws-direct') }, key: 'direct',
    }))
    expect(record.scope).toEqual({ kind: 'workspace', workspaceId: ProjectId('ws-direct') })
    expect(memory.list({ owner: OWNER, workspace: { id: ProjectId('ws-direct'), path: '/elsewhere' } }).map(entry => entry.id))
      .toEqual([record.id])
    const episode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', workspaceId: ProjectId('ws-direct'), path: '/work/a' },
      kind: 'observation',
      type: 'task',
      title: 'Direct episode',
      narrative: '',
      fingerprint: 'direct',
      source: { sessionId: SessionId('session-1') },
    })
    expect(episode.scope).toEqual({ kind: 'project', workspaceId: ProjectId('ws-direct'), path: '/work/a' })
    await expect(memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', workspaceId: ProjectId('ws-direct') },
      kind: 'observation',
      type: 'task',
      title: 'No path',
      narrative: '',
      fingerprint: 'no-path',
      source: { sessionId: SessionId('session-1') },
    })).rejects.toMatchObject({ code: 'invalid-scope' })
  })

  it('leaves already-identified scopes untouched during migration', async () => {
    const pool = new MemoryMediaPool()
    const fixedId = ProjectId('ws-fixed')
    const record: MemoryRecord = {
      id: MemoryId('memory-fixed'),
      owner: OWNER,
      scope: { kind: 'workspace', workspaceId: fixedId, path: '/work/a' },
      kind: 'fact',
      entity: 'user',
      key: 'fixed',
      value: 'Fixed statement',
      status: 'active',
      pinned: false,
      createdAt: 1,
      updatedAt: 1,
      source: { sessionId: SessionId('session-fixed') },
    }
    const profile: MemoryRecord = {
      ...record,
      id: MemoryId('memory-profile'),
      scope: { kind: 'profile' },
      key: 'profile',
    }
    const episode: EpisodeRecord = {
      id: EpisodeId('episode-fixed'),
      owner: OWNER,
      scope: { kind: 'project', workspaceId: fixedId, path: '/work/a' },
      kind: 'observation',
      type: 'task',
      title: 'Fixed episode',
      narrative: '',
      facts: [],
      concepts: [],
      filesRead: [],
      filesModified: [],
      fingerprint: 'fixed-episode',
      source: { sessionId: SessionId('session-fixed') },
      createdAt: 1,
      updatedAt: 1,
    }
    pool.versions.set('tomato_memory', 1)
    pool.media.set('tomato_memory', {
      tables: new Map<string, Map<string, unknown>>([['records', new Map<string, unknown>([
        [record.id, record],
        [profile.id, profile],
      ])]]),
      global: null,
    })
    pool.versions.set('tomato_memory_episodes', 1)
    pool.media.set('tomato_memory_episodes', {
      tables: new Map<string, Map<string, unknown>>([['records', new Map<string, unknown>([[episode.id, episode]])]]),
      global: null,
    })
    const { memory } = await harness({ pool })
    expect(memory.list({ owner: OWNER, workspace: { id: fixedId, path: '/work/a' } }).map(entry => entry.id).sort())
      .toEqual([profile.id, record.id].sort())
    expect(memory.listEpisodes({ owner: OWNER, workspace: { id: fixedId, path: '/work/a' } }).map(entry => entry.id))
      .toEqual([episode.id])
  })

  it('re-maps provisional identities and leaves fixed identities alone', async () => {
    const pool = new MemoryMediaPool()
    const withoutPath: EpisodeRecord = {
      id: EpisodeId('episode-without-path'),
      owner: OWNER,
      scope: { kind: 'project', workspaceId: ProjectId('ws-hidden') },
      kind: 'observation',
      type: 'task',
      title: 'No path',
      narrative: '',
      facts: [],
      concepts: [],
      filesRead: [],
      filesModified: [],
      fingerprint: 'without-path',
      source: { sessionId: SessionId('session-1') },
      createdAt: 1,
      updatedAt: 1,
    }
    pool.media.set('tomato_memory_episodes', {
      tables: new Map<string, Map<string, unknown>>([['records', new Map<string, unknown>([[withoutPath.id, withoutPath]])]]),
      global: null,
    })
    const { ctx, memory } = await harness({ pool })
    const canonical = await realpath(await tempDirectory())
    const other = await realpath(await tempDirectory())
    const late = await memory.remember(request({ scope: { kind: 'workspace', path: canonical }, key: 'late' }))
    const fixed = await memory.remember(request({
      scope: { kind: 'workspace', workspaceId: ProjectId('ws-fixed'), path: canonical }, key: 'fixed',
    }))
    const profile = await memory.remember(request({ scope: PROFILE, key: 'profile' }))
    const unmapped = await memory.remember(request({ scope: { kind: 'workspace', path: other }, key: 'unmapped' }))
    const lateEpisode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', path: canonical },
      kind: 'observation', type: 'task', title: 'Late episode', narrative: '', fingerprint: 'late-episode',
      source: { sessionId: SessionId('session-1') },
    })
    const fixedEpisode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', workspaceId: ProjectId('ws-fixed'), path: canonical },
      kind: 'observation', type: 'task', title: 'Fixed episode', narrative: '', fingerprint: 'fixed-episode',
      source: { sessionId: SessionId('session-1') },
    })
    const unmappedEpisode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', path: other },
      kind: 'observation', type: 'task', title: 'Unmapped episode', narrative: '', fingerprint: 'unmapped-episode',
      source: { sessionId: SessionId('session-1') },
    })
    ctx.provide('workspaceRegistry', {
      resolveByPath: async (path: string) => path === canonical ? { id: 'ws-late', path } : undefined,
    })
    const lateView: MemoryView = { owner: OWNER, workspace: { id: ProjectId('ws-late'), path: canonical } }
    await vi.waitFor(() => {
      expect(memory.list(lateView).map(entry => entry.id).sort()).toEqual([late.id, profile.id].sort())
    })
    expect(memory.list(lateView).map(entry => entry.id)).not.toContain(fixed.id)
    expect(memory.listEpisodes(lateView).map(entry => entry.id)).toEqual([lateEpisode.id])
    const fixedView: MemoryView = { owner: OWNER, workspace: { id: ProjectId('ws-fixed'), path: canonical } }
    expect(memory.list(fixedView).map(entry => entry.id).sort()).toEqual([fixed.id, profile.id].sort())
    expect(memory.listEpisodes(fixedView).map(entry => entry.id)).toEqual([fixedEpisode.id])
    const otherView: MemoryView = { owner: OWNER, workspace: { id: provisionalProjectId(other), path: other } }
    expect(memory.list(otherView).map(entry => entry.id).sort()).toEqual([unmapped.id, profile.id].sort())
    expect(memory.listEpisodes(otherView).map(entry => entry.id)).toEqual([unmappedEpisode.id])
  })

  it('warns when reconciliation cannot persist its rewrite', async () => {
    const pool = new MemoryMediaPool()
    const { ctx, memory } = await harness({ pool })
    const canonical = await realpath(await tempDirectory())
    await memory.remember(request({ scope: { kind: 'workspace', path: canonical }, key: 'late' }))
    const warn = vi.spyOn(ctx.logger, 'warn')
    pool.failNextWrites = 1
    ctx.provide('workspaceRegistry', { resolveByPath: async (path: string) => ({ id: 'ws-late', path }) })
    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('reconciling project identities failed'))
    })
  })

  it('does not rewrite scopes when every stored identity already matches', async () => {
    const { ctx, memory } = await harness()
    const fixed = await memory.remember(request({ scope: { kind: 'workspace', workspaceId: ProjectId('ws-fixed') }, key: 'fixed' }))
    ctx.provide('workspaceRegistry', {
      resolveByPath: async (path: string) => ({ id: 'ws-fixed', path }),
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(memory.list({ owner: OWNER, workspace: { id: ProjectId('ws-fixed'), path: '/work/a' } }).map(entry => entry.id))
      .toEqual([fixed.id])
  })
})

describe('versioned facts', () => {
  it('closes the previous version and keeps only the current one reachable', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.remember(request({ key: 'tone', value: 'First tone' }))
    vi.setSystemTime(2_000)
    const second = await memory.remember(request({ key: 'tone', value: 'Second tone' }))
    expect((await memory.recall({ view: VIEW_A, text: 'tone' })).map(record => record.id)).toEqual([second.id])
    expect(memory.list(VIEW_A).map(record => record.id)).toEqual([second.id])
    expect(await memory.confirm(VIEW_A, first.id)).toBeUndefined()
    expect(await memory.setPinned(VIEW_A, first.id, true)).toBeUndefined()
    expect(memory.stats(VIEW_A)).toMatchObject({ total: 1, versions: 2 })
  })

  it('lists versions by creation time and returns nothing for an unknown id', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    await memory.remember(request({ key: 'tone', value: 'First tone' }))
    const second = await memory.remember(request({ key: 'tone', value: 'Second tone' }))
    expect(memory.versions(VIEW_A, second.id)).toHaveLength(2)
    expect(memory.versions(VIEW_A, MemoryId('memory-missing'))).toEqual([])
  })

  it('closes duplicate current versions left by an interrupted replacement', async () => {
    const pool = new MemoryMediaPool()
    const base: MemoryRecord = {
      id: MemoryId('memory-a'),
      owner: OWNER,
      scope: { kind: 'workspace', path: '/work/a' },
      kind: 'fact',
      entity: 'user',
      key: 'tone',
      value: 'older',
      status: 'active',
      pinned: false,
      validFrom: 2,
      createdAt: 2,
      updatedAt: 2,
      source: { sessionId: SessionId('session-1') },
    }
    const first: MemoryRecord = { ...base, id: MemoryId('memory-b') }
    const newest: MemoryRecord = { ...base, id: MemoryId('memory-c'), value: 'newer', createdAt: 3, updatedAt: 3 }
    pool.media.set('tomato_memory', {
      tables: new Map<string, Map<string, unknown>>([['records', new Map<string, unknown>([
        [base.id, base], [first.id, first], [newest.id, newest],
      ])]]),
      global: null,
    })
    const { memory } = await harness({ pool })
    expect(memory.list(VIEW_A).map(entry => entry.id)).toEqual([newest.id])
    const versions = memory.versions(VIEW_A, newest.id)
    expect(versions.map(version => version.id)).toEqual([newest.id, 'memory-a', 'memory-b'])
    expect(versions[0]?.validTo).toBeUndefined()
    expect(versions[1]).toMatchObject({ validTo: 2, supersededBy: newest.id })
    expect(versions[2]).toMatchObject({ validTo: 2, supersededBy: newest.id })
    expect(memory.stats(VIEW_A)).toMatchObject({ total: 1, versions: 3 })
  })

  it('keeps only the newest superseded versions per identity', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { memory } = await harness({ config: { maxVersionsPerRecord: 2, versionRetentionDays: 0 } })
    for (const [index, value] of ['one', 'two', 'three', 'four'].entries()) {
      vi.setSystemTime(1_000 + index * 1_000)
      await memory.remember(request({ key: 'tone', value }))
    }
    const current = memory.list(VIEW_A)[0]
    const versions = memory.versions(VIEW_A, current!.id)
    expect(versions.map(version => version.value)).toEqual(['four', 'three', 'two'])
    expect(memory.stats(VIEW_A)).toMatchObject({ total: 1, versions: 3 })
  })

  it('keeps a superseded version when the cold archive cannot be written', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const archive = join(await tempDirectory(), 'cold')
    await writeFile(archive, 'not a directory')
    const { memory } = await harness({ config: { versionRetentionDays: 1, coldArchivePath: archive } })
    await memory.remember(request({ key: 'tone', value: 'old' }))
    vi.setSystemTime(1_000_000 + 2 * 86_400_000)
    const current = await memory.remember(request({ key: 'tone', value: 'new' }))
    expect(memory.versions(VIEW_A, current.id).map(version => version.value)).toEqual(['new', 'old'])
  })

  it('archives a pruned superseded version before deleting it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const archive = await tempDirectory()
    const cold = join(archive, 'cold')
    await mkdir(cold, { recursive: true })
    await writeFile(join(cold, '1969-01.jsonl'), 'expired\n')
    await writeFile(join(cold, 'README.txt'), 'not a month\n')
    const { memory } = await harness({ config: {
      versionRetentionDays: 1, maxVersionsPerRecord: 10, coldArchivePath: cold,
    } })
    const old = await memory.remember(request({ key: 'tone', value: 'old' }))
    vi.setSystemTime(1_000_000 + 2 * 86_400_000)
    const current = await memory.remember(request({ key: 'tone', value: 'new' }))
    expect(memory.versions(VIEW_A, current.id).map(version => version.value)).toEqual(['new'])
    const lines = (await readFile(join(archive, 'cold', `${new Date(old.createdAt).toISOString().slice(0, 7)}.jsonl`), 'utf8'))
      .trim().split('\n').map(line => JSON.parse(line) as { kind: string; record: MemoryRecord })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ kind: 'record', record: { id: old.id, value: 'old' } })
    const months = await readdir(cold)
    expect(months).not.toContain('1969-01.jsonl')
    expect(months).toContain(`${new Date(old.createdAt).toISOString().slice(0, 7)}.jsonl`)
  })

  it('drops superseded versions past the age window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const { memory } = await harness({ config: { versionRetentionDays: 1, maxVersionsPerRecord: 10 } })
    await memory.remember(request({ key: 'tone', value: 'old' }))
    vi.setSystemTime(1_000_000 + 2 * 86_400_000)
    const current = await memory.remember(request({ key: 'tone', value: 'new' }))
    expect(memory.versions(VIEW_A, current.id).map(version => version.value)).toEqual(['new'])
  })

  it('forgets every version of one identity from any version id', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.remember(request({ key: 'tone', value: 'First tone' }))
    vi.setSystemTime(2_000)
    await memory.remember(request({ key: 'tone', value: 'Second tone' }))
    expect(await memory.forget(VIEW_A, first.id)).toBe(true)
    expect(memory.list(VIEW_A)).toEqual([])
    expect(memory.stats(VIEW_A)).toMatchObject({ total: 0, versions: 0 })
  })

  it('does not count superseded versions against workspace capacity', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness({ config: { maxRecordsPerWorkspace: 1 } })
    const first = await memory.remember(request({ key: 'tone', value: 'First tone' }))
    vi.setSystemTime(2_000)
    await memory.remember(request({ key: 'tone', value: 'Second tone' }))
    expect(memory.stats(VIEW_A)).toMatchObject({ total: 1, versions: 2 })
    await expect(memory.remember(request({ key: 'other', value: 'Another' }))).rejects.toMatchObject({ code: 'workspace-full' })
    expect(first.validFrom).toBe(1_000)
  })
})

describe('episode retention', () => {
  it('keeps a hot episode when the cold archive cannot be written', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const archive = join(await tempDirectory(), 'cold')
    await writeFile(archive, 'not a directory')
    const { memory } = await harness({ config: { episodeRetentionDays: 1, coldArchivePath: archive } })
    const old = await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation',
      type: 'task', title: 'Old observation', narrative: '', fingerprint: 'old-observation',
      source: { sessionId: SessionId('session-1') },
    })
    vi.setSystemTime(1_000_000 + 2 * 86_400_000)
    await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation',
      type: 'task', title: 'New observation', narrative: '', fingerprint: 'new-observation',
      source: { sessionId: SessionId('session-1') },
    })
    expect(memory.listEpisodes(VIEW_A).map(entry => entry.id)).toContain(old.id)
  })

  it('keeps summaries past the observation window and prunes them later', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const { memory } = await harness({ config: { episodeRetentionDays: 1, summaryRetentionDays: 10 } })
    const observation = await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation',
      type: 'task', title: 'Old observation', narrative: '', fingerprint: 'old-observation',
      source: { sessionId: SessionId('session-1') },
    })
    const summary = await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'summary',
      type: 'summary', title: 'Kept summary', narrative: '', fingerprint: 'kept-summary',
      source: { sessionId: SessionId('session-1') },
    })
    vi.setSystemTime(1_000_000 + 2 * 86_400_000)
    await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation',
      type: 'task', title: 'New observation', narrative: '', fingerprint: 'new-observation',
      source: { sessionId: SessionId('session-1') },
    })
    const kept = memory.listEpisodes(VIEW_A).map(entry => entry.id)
    expect(kept).not.toContain(observation.id)
    expect(kept).toContain(summary.id)
    vi.setSystemTime(1_000_000 + 11 * 86_400_000)
    await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation',
      type: 'task', title: 'Later observation', narrative: '', fingerprint: 'later-observation',
      source: { sessionId: SessionId('session-1') },
    })
    expect(memory.listEpisodes(VIEW_A).map(entry => entry.id)).not.toContain(summary.id)
  })
})

describe('sidecar index', () => {
  it('serves recall and episode search from the index and updates it on writes', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const pool = new MemoryMediaPool()
    const { memory } = await harness({ pool, config: { indexPath } })
    const record = await memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    expect((await memory.recall({ view: VIEW_A, text: 'briefly' })).map(entry => entry.id)).toEqual([record.id])
    const episode = await memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: 'task',
      title: 'Sidebar layout',
      narrative: 'The sidebar layout changed',
      fingerprint: 'layout',
      source: { sessionId: SessionId('session-1') },
    })
    expect((await memory.searchEpisodes({ view: VIEW_A, text: 'layout' })).map(entry => entry.id)).toEqual([episode.id])
    await memory.forget(VIEW_A, record.id)
    expect(await memory.recall({ view: VIEW_A, text: 'briefly' })).toEqual([])
    await memory.forgetEpisode(VIEW_A, episode.id)
    expect(await memory.searchEpisodes({ view: VIEW_A, text: 'layout' })).toEqual([])
  })


  it('precomputes vectors through the outbox and uses them for semantic candidates', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const harnessed = await harness({ config: { indexPath } })
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const record = await harnessed.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    await vi.waitFor(() => {
      expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
    }, { timeout: 5_000 })
    expect((await harnessed.memory.recall({ view: VIEW_A, text: '语气' })).map(entry => entry.id)).toEqual([record.id])
  })

  it('keeps recall on the domain scan when the sidecar cannot open', async () => {
    const directory = await tempDirectory()
    // A directory at the sidecar path makes SQLite fail to open the file.
    const indexPath = join(directory, 'index.sqlite')
    await mkdir(indexPath)
    const harnessed = await harness({ config: { indexPath } })
    const record = await harnessed.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    expect((await harnessed.memory.recall({ view: VIEW_A, text: 'briefly' })).map(entry => entry.id)).toEqual([record.id])
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(0)
  })

  it('fails loud when a configured sqlite-vec extension cannot load', async () => {
    const directory = await tempDirectory()
    await expect(harness({
      config: { indexPath: join(directory, 'index.sqlite'), vecExtensionPath: join(directory, 'missing-vec') },
    })).rejects.toThrow()
  })

  it('validates embedding worker limits', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    await expect(harness({ config: { indexPath, indexEmbedBatch: 0 } })).rejects.toThrow(/indexEmbedBatch/u)
    await expect(harness({ config: { indexPath, indexEmbedRetryMs: 0 } })).rejects.toThrow(/indexEmbedRetryMs/u)
  })

  it('leaves the queue untouched without an enabled provider or vector persistence', async () => {
    const firstDirectory = await tempDirectory()
    const disabled = await harness({ config: { indexPath: join(firstDirectory, 'index.sqlite') } })
    await disabled.ctx.plugin(DisabledEmbeddings)
    await disabled.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(disabled.memory.stats(VIEW_A).vectors).toBe(0)
    const secondDirectory = await tempDirectory()
    const unpersisted = await harness({ config: { indexPath: join(secondDirectory, 'index.sqlite'), maxEmbeddingVectors: 0 } })
    await unpersisted.ctx.plugin(ScriptEmbeddings)
    await unpersisted.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(unpersisted.memory.stats(VIEW_A).vectors).toBe(0)
  })

  it('drains the outbox in batches and retries after a provider failure', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const harnessed = await harness({ config: { indexPath, indexEmbedBatch: 1, indexEmbedRetryMs: 1_000 } })
    const embeddings = await harnessed.ctx.plugin(ScriptEmbeddings)
    const provider = harnessed.ctx.embeddings as ScriptEmbeddings
    provider.failure = new Error('provider down')
    await harnessed.memory.remember(request({ key: 'first', value: 'First tone' }))
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(0)
    provider.failure = undefined
    await harnessed.memory.remember(request({ key: 'second', value: 'Second tone' }))
    await vi.waitFor(() => {
      expect(harnessed.memory.stats(VIEW_A).vectors).toBe(2)
    }, { timeout: 5_000 })
    expect(provider.batches.length).toBeGreaterThanOrEqual(2)
    expect(embeddings).toBeDefined()
  })

  it('falls back to domain search when delaying a failed batch cannot write to the index', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown): void => { unhandled.push(reason) }
    process.on('unhandledRejection', onUnhandled)
    const retry = vi.spyOn(MemoryIndex.prototype, 'retryEmbeddings').mockImplementation(() => {
      throw Object.assign(new Error('database is locked'), { errcode: 5 })
    })
    try {
      const harnessed = await harness({ config: { indexPath } })
      await harnessed.ctx.plugin(ScriptEmbeddings)
      const embeddings = harnessed.ctx.embeddings as ScriptEmbeddings
      embeddings.failure = new Error('provider down')
      const stored = await harnessed.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
      await vi.waitFor(() => { expect(retry).toHaveBeenCalled() })
      await new Promise<void>((resolve) => { setImmediate(resolve) })
      expect(unhandled).toEqual([])
      expect((await harnessed.memory.recall({ view: VIEW_A, text: 'briefly' })).map(entry => entry.id))
        .toEqual([stored.id])
    } finally {
      retry.mockRestore()
      process.off('unhandledRejection', onUnhandled)
    }
  })

  it('precomputes episode vectors and uses them for semantic episode search', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const harnessed = await harness({ config: { indexPath } })
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const episode = await harnessed.memory.rememberEpisode({
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: 'task',
      title: 'Sidebar layout',
      narrative: '',
      fingerprint: 'layout',
      source: { sessionId: SessionId('session-1') },
    })
    await vi.waitFor(() => {
      expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
    }, { timeout: 5_000 })
    expect((await harnessed.memory.searchEpisodes({ view: VIEW_A, text: '语气' })).map(entry => entry.id))
      .toEqual([episode.id])
  })

  it('stores a vector computed during retrieval when the worker has not run', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const harnessed = await harness({ config: { indexPath } })
    const record = await harnessed.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    await harnessed.ctx.plugin(ScriptEmbeddings)
    expect((await harnessed.memory.recall({ view: VIEW_A, text: 'briefly' })).map(entry => entry.id))
      .toEqual([record.id])
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
  })

  it('opens the home-relative index when the host provides a home path', async () => {
    const home = await tempDirectory()
    const harnessed = await harness({ tomatoHomePath: (...segments) => join(home, ...segments) })
    const record = await harnessed.memory.remember(request({ key: 'tone', value: 'Reply briefly' }))
    expect((await stat(join(home, 'memory', 'index-v1.sqlite'))).isFile()).toBe(true)
    expect((await harnessed.memory.recall({ view: VIEW_A, text: 'briefly' })).map(entry => entry.id)).toEqual([record.id])
  })

  it('reopens a valid sidecar without rebuilding it', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const pool = new MemoryMediaPool()
    const first = await harness({ pool, config: { indexPath } })
    const kept = await first.memory.remember(request({ key: 'kept', value: 'Keep this' }))
    await first.fiber.dispose()
    const second = await harness({ pool, config: { indexPath } })
    expect((await second.memory.recall({ view: VIEW_A, text: 'keep' })).map(entry => entry.id)).toEqual([kept.id])
  })

  it('indexes a confirmed candidate and rebuilds from the domains after the file disappears', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const pool = new MemoryMediaPool()
    const first = await harness({ pool, config: { indexPath } })
    const candidate = await first.memory.remember(request({ key: 'tone', value: '邮件语气', status: 'candidate' }))
    expect(await first.memory.recall({ view: VIEW_A, text: '邮件' })).toEqual([])
    await first.memory.confirm(VIEW_A, candidate.id)
    expect((await first.memory.recall({ view: VIEW_A, text: '邮件' })).map(entry => entry.id)).toEqual([candidate.id])
    const kept = await first.memory.remember(request({ key: 'kept', value: 'Keep this' }))
    await first.fiber.dispose()
    await rm(indexPath, { force: true })
    await rm(`${indexPath}-wal`, { force: true })
    await rm(`${indexPath}-shm`, { force: true })
    const second = await harness({ pool, config: { indexPath } })
    expect((await second.memory.recall({ view: VIEW_A, text: 'keep' })).map(entry => entry.id)).toEqual([kept.id])
    expect((await second.memory.recall({ view: VIEW_A, text: '邮件' })).map(entry => entry.id)).toEqual([candidate.id])
  })

  it('rejects an empty index path', async () => {
    await expect(harness({ config: { indexPath: '   ' } })).rejects.toThrow('indexPath must not be empty')
  })

  it('serves alternatives, kind filters, and episode bounds from the index', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const { memory } = await harness({ config: { indexPath } })
    const tone = await memory.remember(request({ key: 'tone', value: 'Email tone' }))
    const decision = await memory.remember(request({ key: 'tone-decision', kind: 'decision', value: 'Email tone' }))
    expect((await memory.recall({ view: VIEW_A, text: '语气', alternatives: ['email'], kind: 'decision' })).map(entry => entry.id))
      .toEqual([decision.id])
    expect((await memory.recall({ view: VIEW_A, text: 'tone', alternatives: ['语气'] })).map(entry => entry.id))
      .toEqual(expect.arrayContaining([tone.id, decision.id]))
    const late = await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'summary',
      type: 'summary', title: 'Late layout', narrative: '', fingerprint: 'late',
      source: { sessionId: SessionId('session-1') },
    })
    expect((await memory.searchEpisodes({
      view: VIEW_A, text: 'layout', alternatives: ['sidebar'], kinds: ['summary'], since: 0, until: Date.now() + 1000, limit: 10,
    })).map(entry => entry.id)).toEqual([late.id])
  })

  it('rebuilds the sidecar after re-mapping identities', async () => {
    const directory = await tempDirectory()
    const indexPath = join(directory, 'index.sqlite')
    const { ctx, memory } = await harness({ config: { indexPath } })
    const canonical = await realpath(await tempDirectory())
    const late = await memory.remember(request({
      scope: { kind: 'workspace', path: canonical }, key: 'late', value: 'late tone',
    }))
    ctx.provide('workspaceRegistry', {
      resolveByPath: async (path: string) => ({ id: 'ws-late', path }),
    })
    const view: MemoryView = { owner: OWNER, workspace: { id: ProjectId('ws-late'), path: canonical } }
    await vi.waitFor(async () => {
      expect((await memory.recall({ view, text: 'late' })).map(entry => entry.id)).toEqual([late.id])
    })
  })

})

describe('relations and stats', () => {
  it('reaches neighbors by subject, session, and attribute and follows a second hop only on request', async () => {
    const test = await harness()
    const { memory } = test
    const origin = await memory.remember(request({ entity: 'client:acme', key: 'email-tone', source: { sessionId: SessionId('s-a') } }))
    const subject = await memory.remember(request({ entity: 'client:acme', key: 'budget', source: { sessionId: SessionId('s-b') } }))
    const attribute = await memory.remember(request({ entity: 'client:other', key: 'email-tone', source: { sessionId: SessionId('s-c') } }))
    const sameSession = await memory.remember(request({ entity: 'user', key: 'language', scope: PROFILE, source: { sessionId: SessionId('s-a') } }))
    const second = await memory.remember(request({ entity: 'client:globex', key: 'budget', source: { sessionId: SessionId('s-d') } }))
    expect(memory.related(VIEW_A, origin.id).map(entry => [entry.record.id, entry.via, entry.depth])).toEqual([
      [subject.id, 'same-entity', 1],
      [sameSession.id, 'same-session', 1],
      [attribute.id, 'same-key', 1],
    ])
    expect(memory.related(VIEW_A, origin.id).map(entry => entry.record.id)).not.toContain(second.id)
    expect(memory.related(VIEW_A, origin.id, 2).map(entry => [entry.record.id, entry.via, entry.depth])).toEqual([
      [subject.id, 'same-entity', 1],
      [sameSession.id, 'same-session', 1],
      [attribute.id, 'same-key', 1],
      [second.id, 'same-key', 2],
    ])
  })

  it('caps one lookup at maxRecallResults', async () => {
    const test = await harness({ config: { maxRecallResults: 1 } })
    const origin = await test.memory.remember(request({ entity: 'client:acme', key: 'a', source: { sessionId: SessionId('s-1') } }))
    await test.memory.remember(request({ entity: 'client:acme', key: 'b', source: { sessionId: SessionId('s-2') } }))
    await test.memory.remember(request({ entity: 'client:acme', key: 'c', source: { sessionId: SessionId('s-3') } }))
    expect(test.memory.related(VIEW_A, origin.id)).toHaveLength(1)
  })

  it('reaches nothing from a candidate, a foreign owner, or another workspace, and rejects an invalid depth', async () => {
    const test = await harness()
    const candidate = await test.memory.remember(request({ status: 'candidate' }))
    expect(test.memory.related(VIEW_A, candidate.id)).toEqual([])
    const foreign = await test.memory.remember(request({ owner: accountMemoryOwner('u-other') }))
    expect(test.memory.related(VIEW_A, foreign.id)).toEqual([])
    const elsewhere = await test.memory.remember(request({ scope: { kind: 'workspace', path: '/work/b' } }))
    expect(test.memory.related(VIEW_A, elsewhere.id)).toEqual([])
    for (const depth of [0, 3, 1.5]) {
      expect(() => test.memory.related(VIEW_A, candidate.id, depth)).toThrow(TypeError)
    }
  })

  it('counts what a view stores and how much of its capacity that is', async () => {
    const test = await harness({ config: { maxProfileRecords: 2, maxRecordsPerWorkspace: 5 } })
    expect(test.memory.stats(VIEW_A).oldestActiveUpdate).toBeNull()
    const first = await test.memory.remember(request({ entity: 'client:acme', key: 'tone' }))
    await test.memory.remember(request({ entity: 'client:acme', key: 'budget', pinned: true }))
    const profile = await test.memory.remember(request({ scope: PROFILE, key: 'language', value: 'Chinese' }))
    await test.memory.remember(request({ entity: 'client:acme', key: 'contact', status: 'candidate' }))
    expect(test.memory.stats(VIEW_A)).toEqual({
      total: 4,
      active: 3,
      candidates: 1,
      pinned: 1,
      versions: 4,
      profile: { stored: 1, limit: 2 },
      workspace: { stored: 3, limit: 5 },
      oldestActiveUpdate: first.updatedAt,
      vectors: 0,
    })
    expect(test.memory.stats({ owner: OWNER })).toEqual({
      total: 1,
      active: 1,
      candidates: 0,
      pinned: 0,
      versions: 1,
      profile: { stored: 1, limit: 2 },
      workspace: null,
      oldestActiveUpdate: profile.updatedAt,
      vectors: 0,
    })
  })
})

describe('duplicate detection', () => {
  it('finds an active record of the same scope and kind that states nearly the same thing', async () => {
    const test = await harness()
    const stored = await test.memory.remember(request({ entity: 'user', key: 'email-tone', value: 'Reply in Chinese, short and direct' }))
    expect(test.memory.duplicates({
      owner: OWNER, scope: WORKSPACE_A, kind: 'preference', entity: 'user', key: 'reply-style', value: 'Short and direct: reply in Chinese.',
    })).toEqual([{ record: stored, coverage: 1 }])
  })

  it('measures containment over the larger token set and treats empty sets as no overlap', () => {
    expect(tokenContainment(new Set(['a', 'b']), new Set(['a', 'b', 'c']))).toBeCloseTo(2 / 3)
    expect(tokenContainment(new Set(), new Set())).toBe(0)
  })

  it('orders matches by containment', async () => {
    const test = await harness()
    const exact = await test.memory.remember(request({ entity: 'user', key: 'tone-a', value: 'Reply in Chinese, short and direct' }))
    const partial = await test.memory.remember(request({ entity: 'user', key: 'tone-b', value: 'Short direct: reply in Chinese' }))
    const twin = await test.memory.remember(request({ entity: 'user', key: 'tone-d', value: 'Reply in Chinese, short and direct' }))
    const matches = test.memory.duplicates({
      owner: OWNER, scope: WORKSPACE_A, kind: 'preference', entity: 'user', key: 'tone-c', value: 'reply in chinese short and direct',
    })
    expect(matches.filter(match => match.coverage === 1).map(match => match.record.id).sort())
      .toEqual([exact.id, twin.id].sort())
    expect(matches.findIndex(match => match.record.id === partial.id)).toBe(2)
  })

  it('keeps exactly the documented coverage as a match', async () => {
    const test = await harness()
    const boundary = await test.memory.remember(request({ entity: 'user', key: 'tone-a', value: 'reply chinese short direct' }))
    const below = await test.memory.remember(request({ entity: 'user', key: 'tone-b', value: 'reply chinese short' }))
    const matches = test.memory.duplicates({
      owner: OWNER, scope: WORKSPACE_A, kind: 'preference', entity: 'user', key: 'tone-c', value: 'reply chinese short direct and',
    })
    expect(matches.map(match => [match.record.id, match.coverage])).toEqual([[boundary.id, 0.8]])
    expect(matches.map(match => match.record.id)).not.toContain(below.id)
  })

  it('leaves out the replaced record, candidates, other kinds, scopes, owners, and short values', async () => {
    const test = await harness()
    await test.memory.remember(request({ entity: 'user', key: 'email-tone', value: 'Reply in Chinese, short and direct' }))
    const query = { owner: OWNER, scope: WORKSPACE_A, kind: 'preference' as const, entity: 'user', key: 'other-key', value: 'Reply in Chinese, short and direct' }
    expect(test.memory.duplicates({ ...query, entity: 'user', key: 'email-tone' })).toEqual([])
    expect(test.memory.duplicates({ ...query, kind: 'fact' })).toEqual([])
    expect(test.memory.duplicates({ ...query, scope: { kind: 'workspace', path: '/work/b' } })).toEqual([])
    expect(test.memory.duplicates({ ...query, owner: accountMemoryOwner('u-other') })).toEqual([])
    await test.memory.remember(request({ entity: 'user', key: 'emoji', value: 'Use emoji sparingly in replies', status: 'candidate' }))
    expect(test.memory.duplicates({ ...query, entity: 'user', key: 'emoji-2', value: 'Use emoji sparingly in replies' })).toEqual([])
    const short = await test.memory.remember(request({ entity: 'user', key: 'lang', value: 'Chinese' }))
    expect(test.memory.duplicates({ ...query, entity: 'user', key: 'lang-2', value: 'Chinese' })).toEqual([])
    expect(test.memory.duplicates({ ...query, entity: 'user', key: 'lang-3', value: 'Reply in Chinese, short and direct' })
      .map(match => match.record.id)).not.toContain(short.id)
  })
})

describe('project history', () => {
  function episodeRequest(overrides: Partial<RememberEpisodeRequest> = {}): RememberEpisodeRequest {
    return {
      owner: OWNER,
      scope: { kind: 'project', path: '/work/a' },
      kind: 'observation',
      type: 'decision',
      title: 'Chose FTS5 for session search',
      subtitle: 'SQLite',
      narrative: 'The team compared FTS5 and LIKE scans and chose FTS5.',
      facts: ['FTS5 ranks whole tokens'],
      concepts: ['search', 'sqlite'],
      filesRead: ['src/search.ts'],
      filesModified: [],
      tool: 'edit',
      fingerprint: 'fingerprint-1',
      source: { sessionId: SessionId('session-1'), toolCallId: 'call-1' },
      ...overrides,
    }
  }

  it('stores, lists, reads, and forgets episodes of one project', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.rememberEpisode(episodeRequest())
    vi.setSystemTime(2_000)
    const second = await memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-2', title: 'Later' }))
    expect(memory.listEpisodes(VIEW_A).map(record => record.id)).toEqual([second.id, first.id])
    expect(memory.episode(VIEW_A, first.id)?.title).toBe('Chose FTS5 for session search')
    expect(memory.episode(VIEW_B, first.id)).toBeUndefined()
    expect(memory.episode({ owner: OWNER }, first.id)).toBeUndefined()
    expect(await memory.forgetEpisode(VIEW_B, first.id)).toBe(false)
    expect(await memory.forgetEpisode(VIEW_A, first.id)).toBe(true)
    expect(memory.listEpisodes(VIEW_A).map(record => record.id)).toEqual([second.id])
  })

  it('stores an episode whose optional fields are absent', async () => {
    const harnessed = await harness()
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const { memory } = harnessed
    const stored = await memory.rememberEpisode({
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation', type: 'task',
      title: 'Bare episode', narrative: 'Nothing optional.', fingerprint: 'bare',
      source: { sessionId: SessionId('session-1') },
    })
    expect(stored).toMatchObject({ facts: [], concepts: [], filesRead: [], filesModified: [] })
    expect(stored.subtitle).toBeUndefined()
    expect(stored.tool).toBeUndefined()
    expect((await memory.searchEpisodes({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([stored.id])
  })

  it('updates a repeated fingerprint instead of appending and keeps the earlier record', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    const first = await memory.rememberEpisode(episodeRequest())
    vi.setSystemTime(2_000)
    const repeated = await memory.rememberEpisode(episodeRequest({ title: 'Ignored title' }))
    expect(repeated.id).toBe(first.id)
    expect(repeated.updatedAt).toBe(2_000)
    expect(repeated.title).toBe('Chose FTS5 for session search')
    expect(memory.listEpisodes(VIEW_A)).toHaveLength(1)
  })

  it('rejects an oversized episode and a project at its stored limit', async () => {
    const oversized = await harness({ config: { maxEpisodeChars: 10 } })
    await expect(oversized.memory.rememberEpisode(episodeRequest())).rejects.toMatchObject({ code: 'episode-too-large' })
    const full = await harness({ config: { maxEpisodesPerWorkspace: 1 } })
    await full.memory.rememberEpisode(episodeRequest())
    await expect(full.memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-2' })))
      .rejects.toMatchObject({ code: 'episodes-full' })
  })

  it('prunes episodes past the retention window when a later episode is written', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(0)
    const { memory } = await harness({ config: { episodeRetentionDays: 1 } })
    await memory.rememberEpisode(episodeRequest())
    vi.setSystemTime(2 * 86_400_000)
    await memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-2' }))
    expect(memory.listEpisodes(VIEW_A).map(record => record.fingerprint)).toEqual(['fingerprint-2'])
  })

  it('searches episodes by text, kinds, and time bounds', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    const { memory } = await harness()
    await memory.rememberEpisode(episodeRequest())
    vi.setSystemTime(2_000)
    await memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-2', type: 'bugfix', title: 'Fixed the parser' }))
    vi.setSystemTime(3_000)
    await memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-3', kind: 'summary', title: 'Session summary' }))
    expect((await memory.searchEpisodes({ view: VIEW_A, text: 'parser' })).map(record => record.title)).toEqual(['Fixed the parser'])
    expect((await memory.searchEpisodes({ view: VIEW_A, text: '', kinds: ['summary'] })).map(record => record.title)).toEqual(['Session summary'])
    expect((await memory.searchEpisodes({ view: VIEW_A, text: '', since: 2_000 })).map(record => record.title))
      .toEqual(['Session summary', 'Fixed the parser'])
    expect((await memory.searchEpisodes({ view: VIEW_A, text: '', until: 2_000 })).map(record => record.title))
      .toEqual(['Fixed the parser', 'Chose FTS5 for session search'])
    expect(await memory.searchEpisodes({ view: VIEW_A, text: '', kinds: ['summary'], since: 4_000 })).toEqual([])
    expect(await memory.searchEpisodes({ view: { owner: OWNER }, text: '' })).toEqual([])
  })

  it('ignores a provider that is switched off without calling it', async () => {
    const { ctx, memory } = await harness()
    const embed = vi.fn(async () => [new Float32Array([1, 0])])
    ctx.provide('embeddings', { enabled: false, model: 'mock', dimensions: 2, embed } as never)
    await memory.remember(request({ value: 'Short and direct' }))
    await memory.rememberEpisode(episodeRequest())
    expect(await memory.recall({ view: VIEW_A, text: 'tone' })).toHaveLength(1)
    expect(await memory.searchEpisodes({ view: VIEW_A, text: 'FTS5' })).toHaveLength(1)
    expect(embed).not.toHaveBeenCalled()
  })

  it('blends vector similarity into episode search and falls back on a provider failure', async () => {
    const harnessed = await harness()
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const embeddings = harnessed.ctx.embeddings as ScriptEmbeddings
    const first = await harnessed.memory.rememberEpisode(episodeRequest({ title: 'Reply briefly', fingerprint: 'a' }))
    await harnessed.memory.rememberEpisode(episodeRequest({
      title: 'Use emoji sparingly', fingerprint: 'b', narrative: 'Use fewer emoji.', facts: [], concepts: ['emoji'],
    }))
    expect((await harnessed.memory.searchEpisodes({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([first.id])
    embeddings.failure = new EmbeddingsError('down', 'provider')
    const warn = vi.spyOn(harnessed.ctx.logger, 'warn')
    expect((await harnessed.memory.searchEpisodes({ view: VIEW_A, text: 'FTS5' })).map(record => record.id)).toEqual([first.id])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('semantic episode ranking unavailable'))
    embeddings.failure = 'boom'
    expect((await harnessed.memory.searchEpisodes({ view: VIEW_A, text: 'FTS5' })).map(record => record.id)).toEqual([first.id])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'))
    embeddings.failure = undefined
    embeddings.countOverride = 0
    expect((await harnessed.memory.searchEpisodes({ view: VIEW_A, text: 'FTS5' })).map(record => record.id)).toEqual([first.id])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('returned 0 vectors'))
    embeddings.countOverride = undefined
    const controller = new AbortController()
    embeddings.failure = new EmbeddingsError('down', 'provider')
    await expect(harnessed.memory.searchEpisodes({ view: VIEW_A, text: 'FTS5', signal: controller.signal })).resolves.toHaveLength(1)
    controller.abort()
    await expect(harnessed.memory.searchEpisodes({ view: VIEW_A, text: 'FTS5', signal: controller.signal })).rejects.toBeInstanceOf(DOMException)
  })

  it('caps semantic episode candidates and breaks blended ties by recency and id', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const capped = await harness({ config: { maxSemanticCandidates: 1 } })
    await capped.ctx.plugin(ScriptEmbeddings)
    await capped.memory.rememberEpisode(episodeRequest({ fingerprint: 'a', title: 'Alpha' }))
    await capped.memory.rememberEpisode(episodeRequest({ fingerprint: 'b', title: 'Beta' }))
    vi.setSystemTime(3_000)
    await capped.memory.searchEpisodes({ view: VIEW_A, text: '语气' })
    const lexicalFull = await harness({ config: { maxSemanticCandidates: 1 } })
    await lexicalFull.ctx.plugin(ScriptEmbeddings)
    await lexicalFull.memory.rememberEpisode(episodeRequest({ fingerprint: 'g', title: 'First FTS5' }))
    await lexicalFull.memory.rememberEpisode(episodeRequest({ fingerprint: 'h', title: 'Second FTS5' }))
    expect(await lexicalFull.memory.searchEpisodes({ view: VIEW_A, text: 'FTS5' })).toHaveLength(1)
    const tied = await harness()
    await tied.ctx.plugin(ScriptEmbeddings)
    vi.setSystemTime(1_000)
    const older = await tied.memory.rememberEpisode(episodeRequest({ fingerprint: 'c', title: 'Older', narrative: 'tone', facts: [], concepts: [] }))
    vi.setSystemTime(2_000)
    const newer = await tied.memory.rememberEpisode(episodeRequest({ fingerprint: 'd', title: 'Newer', narrative: 'tone', facts: [], concepts: [] }))
    expect((await tied.memory.searchEpisodes({ view: VIEW_A, text: '语气' })).map(record => record.id)).toEqual([newer.id, older.id])
    vi.setSystemTime(5_000)
    const first = await tied.memory.rememberEpisode(episodeRequest({ fingerprint: 'e', title: 'Same A', narrative: 'tone', facts: [], concepts: [] }))
    const second = await tied.memory.rememberEpisode(episodeRequest({ fingerprint: 'f', title: 'Same B', narrative: 'tone', facts: [], concepts: [] }))
    const sameTime = [first.id, second.id].sort((left, right) => left.localeCompare(right))
    expect((await tied.memory.searchEpisodes({ view: VIEW_A, text: '语气', limit: 4 })).map(record => record.id))
      .toEqual([...sameTime, newer.id, older.id])
  })

  it('returns a timeline window around an anchor and the newest window without one', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { memory } = await harness()
    for (let index = 0; index < 5; index += 1) {
      vi.setSystemTime(index + 1)
      await memory.rememberEpisode(episodeRequest({ fingerprint: `f-${index}`, title: `Episode ${index}` }))
    }
    const episodes = memory.listEpisodes(VIEW_A)
    const anchor = episodes[2]
    const window = anchor === undefined ? [] : memory.episodeTimeline({ view: VIEW_A, anchor: anchor.id, before: 1, after: 1 })
    expect(window.map(record => record.title)).toEqual(['Episode 3', 'Episode 2', 'Episode 1'])
    expect(memory.episodeTimeline({ view: VIEW_A, before: 2 }).map(record => record.title)).toEqual(['Episode 4', 'Episode 3'])
    expect(memory.episodeTimeline({ view: VIEW_A }).map(record => record.title)).toEqual(['Episode 4', 'Episode 3', 'Episode 2'])
    expect(memory.episodeTimeline({ view: VIEW_A, anchor: episodes[3]!.id }).map(record => record.title))
      .toEqual(['Episode 4', 'Episode 3', 'Episode 2', 'Episode 1', 'Episode 0'])
    expect(memory.episodeTimeline({ view: VIEW_A, anchor: episodes[0]!.id, kinds: ['summary'] })).toEqual([])
  })

  it('selects summaries before observations for history injection', async () => {
    const { memory } = await harness({ config: { historySummaries: 1, historyEpisodes: 1 } })
    await memory.rememberEpisode(episodeRequest({ kind: 'summary', type: 'summary', title: 'Summary A', fingerprint: 'a' }))
    await memory.rememberEpisode(episodeRequest({ kind: 'summary', type: 'summary', title: 'Summary B', fingerprint: 'b' }))
    await memory.rememberEpisode(episodeRequest({ title: 'Observation A', fingerprint: 'c' }))
    await memory.rememberEpisode(episodeRequest({ title: 'Observation B', fingerprint: 'd' }))
    const history = await memory.history(VIEW_A, '')
    expect(history.map(record => record.kind)).toEqual(['summary', 'observation'])
    const withoutObservations = await harness({ config: { historyEpisodes: 0 } })
    await withoutObservations.memory.rememberEpisode(episodeRequest({ kind: 'summary', type: 'summary', title: 'Only summary' }))
    expect((await withoutObservations.memory.history(VIEW_A, '')).map(record => record.title)).toEqual(['Only summary'])
  })

  it('excludes the asking Session and drops matches below the score floor', async () => {
    const { memory } = await harness({ config: { historySummaries: 1, historyEpisodes: 5 } })
    await memory.rememberEpisode(episodeRequest({
      title: 'Own work', fingerprint: 'own', source: { sessionId: SessionId('session-1') },
    }))
    await memory.rememberEpisode(episodeRequest({
      title: 'Chose FTS5 for search', fingerprint: 'strong', source: { sessionId: SessionId('session-2') },
    }))
    await memory.rememberEpisode(episodeRequest({
      title: 'Weak match', fingerprint: 'weak', facts: ['FTS5 is one word of a much longer note about launching a product'],
      source: { sessionId: SessionId('session-3') },
    }))
    const history = await memory.history(VIEW_A, 'FTS5 ranks whole tokens for the launch', {
      excludeSession: SessionId('session-1'), minScore: 0.5,
    })
    expect(history.map(record => record.title)).toEqual(['Chose FTS5 for search'])
  })

  it('refuses to activate over an episode whose key differs from its id', async () => {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    await seed.memory.rememberEpisode(episodeRequest())
    await seed.memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-2' }))
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    const records = pool.media.get('tomato_memory_episodes')?.tables.get('records')
    const [[key, value]] = [...records ?? []] as [[string, import('@tomato/experimental-memory').EpisodeRecord]]
    records?.delete(key)
    records?.set('episode-renamed', value)
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
    await expect(new MemoryService(ctx, {})[Service.init]()).rejects.toThrow('stored episode key "episode-renamed" differs from record id')
  })

  it('logs a failing episode-domain close and still reports the key mismatch', async () => {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    await seed.memory.rememberEpisode(episodeRequest())
    await seed.memory.rememberEpisode(episodeRequest({ fingerprint: 'fingerprint-2' }))
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    const records = pool.media.get('tomato_memory_episodes')?.tables.get('records')
    const [[key, value]] = [...records ?? []] as [[string, import('@tomato/experimental-memory').EpisodeRecord]]
    records?.delete(key)
    records?.set('episode-renamed', value)
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
    const original = facility.open.bind(facility)
    let opens = 0
    vi.spyOn(facility, 'open').mockImplementation(async (spec) => {
      const domain = await original(spec)
      opens += 1
      if (opens === 2) vi.spyOn(domain, 'close').mockRejectedValueOnce(new Error('episode close failed'))
      return domain
    })
    const warn = vi.spyOn(ctx.logger, 'warn')
    await expect(new MemoryService(ctx, {})[Service.init]()).rejects.toThrow('stored episode key')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('closing the episode domain after a key mismatch failed'))
  })


  it('promotes a fact repeated by episodes from different sessions and marks them', async () => {
    const { memory } = await harness()
    const first = await memory.rememberEpisode(episodeRequest({ fingerprint: 'a', source: { sessionId: SessionId('s1') } }))
    const second = await memory.rememberEpisode(episodeRequest({ fingerprint: 'b', source: { sessionId: SessionId('s2') }, title: 'FTS5 again' }))
    const outcomes = await memory.promote(VIEW_A)
    expect(outcomes).toHaveLength(1)
    const [outcome] = outcomes
    expect(outcome).toMatchObject({ entity: 'project', value: 'FTS5 ranks whole tokens' })
    expect(outcome?.key).toMatch(/^search-[0-9a-f]{8}$/u)
    const record = memory.list(VIEW_A).find(record => record.id === outcome?.recordId)
    expect(record).toMatchObject({ status: 'candidate', kind: 'fact' })
    expect([first.id, second.id]).toContain(record?.source.episodeId)
    expect(memory.listEpisodes(VIEW_A).map(record => record.promotedTo)).toEqual([outcome?.recordId, outcome?.recordId])
    expect(await memory.promote(VIEW_A)).toEqual([])
  })

  it('never promotes a failure observation or a bare exit code', async () => {
    const { memory } = await harness()
    await memory.rememberEpisode(episodeRequest({
      type: 'failure', fingerprint: 'failure-1', facts: ['edit was rejected'],
      source: { sessionId: SessionId('s1') },
    }))
    await memory.rememberEpisode(episodeRequest({
      type: 'failure', fingerprint: 'failure-2', facts: ['failed: cannot edit "src/a.ts"'],
      source: { sessionId: SessionId('s2') },
    }))
    expect(memory.listEpisodes(VIEW_A).map(record => record.type)).toEqual(['failure', 'failure'])
    expect(await memory.promote(VIEW_A)).toEqual([])
    await memory.rememberEpisode(episodeRequest({
      fingerprint: 'exit-1', facts: ['exit 0'], source: { sessionId: SessionId('s3') },
    }))
    await memory.rememberEpisode(episodeRequest({
      fingerprint: 'exit-2', facts: ['exit 0'], source: { sessionId: SessionId('s4') },
    }))
    expect(await memory.promote(VIEW_A)).toEqual([])
    expect(memory.list(VIEW_A)).toEqual([])
  })

  it('asks only for candidates stated more than once, and stops asking once a person dismisses one', async () => {
    const { memory } = await harness()
    const once = await memory.remember(request({ status: 'candidate', value: 'One mention', source: { sessionId: SessionId('s1') } }))
    expect(isDue(once)).toBe(false)
    // A confirmed rule is never due, and dismissing a single-mention candidate records the count it had.
    expect(isDue(await memory.remember(request({ key: 'other-rule', value: 'Confirmed already' })))).toBe(false)
    expect(await memory.dismiss(VIEW_A, once.id)).toMatchObject({ dismissedEvidence: 1 })

    const twice = await memory.remember(request({ status: 'candidate', value: 'Two mentions', source: { sessionId: SessionId('s2') } }))
    expect(isDue(await memory.remember(request({
      status: 'candidate', value: 'Two mentions', source: { sessionId: SessionId('s2') },
    })))).toBe(true)

    const dismissed = await memory.dismiss(VIEW_A, twice.id)
    expect(dismissed).toMatchObject({ dismissedEvidence: 2 })
    expect(isDue(dismissed ?? twice)).toBe(false)
    // A repeat from another turn makes the same statement due again.
    expect(isDue(await memory.remember(request({
      status: 'candidate', value: 'Two mentions', source: { sessionId: SessionId('s3') },
    })))).toBe(true)

    // A proposal is due immediately: it asks whether a confirmed rule should change.
    const confirmed = await memory.remember(request({ value: 'Current rule' }))
    const proposal = await memory.remember(request({
      entity: 'proposal', key: 'replace-0000000000000000', value: 'New rule', status: 'candidate',
      source: { sessionId: SessionId('s4') }, proposalFor: confirmed.id,
    }))
    expect(isDue(proposal)).toBe(true)
    // Dismissal only speaks for candidates, and only for a record the view sees.
    expect(await memory.dismiss(VIEW_A, confirmed.id)).toBeUndefined()
    expect(await memory.dismiss(VIEW_B, proposal.id)).toBeUndefined()
  })

  it('strengthens a repeated candidate instead of storing a second copy', async () => {
    const { memory } = await harness()
    const first = await memory.remember(request({ status: 'candidate', value: 'Reply briefly', source: { sessionId: SessionId('s1') } }))
    expect(first.evidence).toBeUndefined()
    const again = await memory.remember(request({ status: 'candidate', value: 'Reply  briefly', source: { sessionId: SessionId('s2') } }))
    // The same statement restated keeps one identity and one version, counting the repetition.
    expect(again.id).toBe(first.id)
    expect(again.evidence).toBe(2)
    expect(memory.versions(VIEW_A, first.id)).toHaveLength(1)
    expect((await memory.remember(request({ status: 'candidate', value: 'Reply briefly', source: { sessionId: SessionId('s3') } }))).evidence).toBe(3)
    // A different statement still replaces the candidate as a new version.
    const other = await memory.remember(request({ status: 'candidate', value: 'Reply at length', source: { sessionId: SessionId('s4') } }))
    expect(other.id).not.toBe(first.id)
    expect(other.evidence).toBeUndefined()
  })

  it('marks a lesson three different sessions repeat as a pitfall that still waits for a person', async () => {
    const { memory } = await harness()
    for (const session of ['s1', 's2', 's3']) {
      await memory.rememberEpisode(episodeRequest({
        type: 'lesson', fingerprint: `lesson-${session}`, source: { sessionId: SessionId(session) },
        facts: ['A capped glob hides the file you want'],
      }))
    }
    const [outcome] = await memory.promote(VIEW_A)
    expect(outcome).toMatchObject({ entity: 'pitfall', value: 'A capped glob hides the file you want (repeated in 3 sessions)' })
    expect(outcome?.key).toMatch(/^pitfall-[0-9a-f]{8}$/u)
    // Repetition marks the subject, not the authority: a rule reaches Sessions only once a person confirms it.
    const [record] = memory.list(VIEW_A)
    expect(record).toMatchObject({ status: 'candidate', kind: 'constraint', entity: 'pitfall' })
    expect(await memory.recall({ view: VIEW_A, text: 'capped glob' })).toEqual([])
    expect((await memory.confirm(VIEW_A, record?.id ?? MemoryId('memory-missing')))?.status).toBe('active')
  })

  it('excludes a Session from indexed episode search', async () => {
    const directory = await tempDirectory()
    const { memory } = await harness({ config: { indexPath: join(directory, 'index.sqlite') } })
    await memory.rememberEpisode(episodeRequest({
      title: 'Own FTS5', fingerprint: 'own', source: { sessionId: SessionId('s1') },
    }))
    await memory.rememberEpisode(episodeRequest({
      title: 'Other FTS5', fingerprint: 'other', source: { sessionId: SessionId('s2') },
    }))
    const found = await memory.searchEpisodes({
      view: VIEW_A, text: 'FTS5', limit: 1, excludeSession: SessionId('s1'),
    })
    expect(found.map(record => record.title)).toEqual(['Other FTS5'])
  })

  it('derives the key from the episode type or a placeholder when no concept survives', async () => {
    const typed = await harness()
    await typed.memory.rememberEpisode(episodeRequest({ fingerprint: 'a', concepts: [], source: { sessionId: SessionId('s1') } }))
    await typed.memory.rememberEpisode(episodeRequest({ fingerprint: 'b', concepts: [], source: { sessionId: SessionId('s2') } }))
    const [typeOutcome] = await typed.memory.promote(VIEW_A)
    expect(typeOutcome?.key).toMatch(/^decision-[0-9a-f]{8}$/u)

    const placeholder = await harness()
    await placeholder.memory.rememberEpisode(episodeRequest({ fingerprint: 'a', concepts: ['—'], source: { sessionId: SessionId('s1') } }))
    await placeholder.memory.rememberEpisode(episodeRequest({ fingerprint: 'b', concepts: ['—'], source: { sessionId: SessionId('s2') } }))
    const [placeholderOutcome] = await placeholder.memory.promote(VIEW_A)
    expect(placeholderOutcome?.key).toMatch(/^fact-[0-9a-f]{8}$/u)
  })

  it('leaves facts too short to compare out of promotion and suppression', async () => {
    const { memory } = await harness()
    await memory.rememberEpisode(episodeRequest({ fingerprint: 'a', facts: ['FTS5'], source: { sessionId: SessionId('s1') } }))
    await memory.rememberEpisode(episodeRequest({ fingerprint: 'b', facts: ['FTS5'], source: { sessionId: SessionId('s2') } }))
    expect(await memory.promote(VIEW_A)).toEqual([])

    await memory.remember(request({ kind: 'fact', entity: 'client:acme', key: 'search', value: 'FTS5' }))
    const stored = await memory.rememberEpisode(episodeRequest({ fingerprint: 'c', facts: ['FTS5'], source: { sessionId: SessionId('s3') } }))
    expect(stored.facts).toEqual(['FTS5'])
  })

  it('reuses a record that already states the fact or carries the derived key', async () => {
    const fact = 'FTS5 ranks whole tokens'
    const key = `search-${createHash('sha256').update(fact).digest('hex').slice(0, 8)}`

    const byKey = await harness()
    await byKey.memory.rememberEpisode(episodeRequest({ fingerprint: 'a', source: { sessionId: SessionId('s1') } }))
    await byKey.memory.rememberEpisode(episodeRequest({ fingerprint: 'b', source: { sessionId: SessionId('s2') } }))
    const keyed = await byKey.memory.remember(request({
      kind: 'fact', entity: 'project', key, value: 'A different statement entirely',
    }))
    const [keyOutcome] = await byKey.memory.promote(VIEW_A)
    expect(keyOutcome?.recordId).toBe(keyed.id)
    expect(byKey.memory.list(VIEW_A)).toHaveLength(1)

    const byValue = await harness()
    await byValue.memory.rememberEpisode(episodeRequest({ fingerprint: 'a', source: { sessionId: SessionId('s1') } }))
    await byValue.memory.rememberEpisode(episodeRequest({ fingerprint: 'b', source: { sessionId: SessionId('s2') } }))
    const stated = await byValue.memory.remember(request({
      kind: 'fact', entity: 'client:acme', key: 'search', value: fact,
    }))
    const [valueOutcome] = await byValue.memory.promote(VIEW_A)
    expect(valueOutcome?.recordId).toBe(stated.id)
    expect(byValue.memory.list(VIEW_A)).toHaveLength(1)

    const same = await harness()
    await same.memory.rememberEpisode(episodeRequest({ fingerprint: 'a', source: { sessionId: SessionId('only') } }))
    await same.memory.rememberEpisode(episodeRequest({ fingerprint: 'b', source: { sessionId: SessionId('only') } }))
    expect(await same.memory.promote(VIEW_A)).toEqual([])
    await same.memory.rememberEpisode(episodeRequest({ kind: 'summary', fingerprint: 'summary', facts: ['Unrelated summary fact'] }))
    expect(await same.memory.promote({ owner: OWNER })).toEqual([])
  })

  it('drops episode facts that an active record already states', async () => {
    const { memory } = await harness()
    await memory.remember(request({ kind: 'fact', entity: 'client:acme', key: 'search', value: 'FTS5 ranks whole tokens' }))
    const stored = await memory.rememberEpisode(episodeRequest({ facts: ['FTS5 ranks whole tokens', 'FTS5 supports prefix queries'] }))
    expect(stored.facts).toEqual(['FTS5 supports prefix queries'])
    const candidate = await harness()
    await candidate.memory.remember(request({ kind: 'fact', entity: 'client:acme', key: 'search', value: 'FTS5 ranks whole tokens', status: 'candidate' }))
    const kept = await candidate.memory.rememberEpisode(episodeRequest())
    expect(kept.facts).toEqual(['FTS5 ranks whole tokens'])
  })
})

describe('embedding vector cache', () => {
  /** Second provider identity, used to prove a model change invalidates vectors. */
  class OtherScriptEmbeddings extends ScriptEmbeddings {
    override readonly model: string = 'script-2'
  }

  function episodeRequestCache(overrides: Partial<RememberEpisodeRequest> = {}): RememberEpisodeRequest {
    return {
      owner: OWNER, scope: { kind: 'project', path: '/work/a' }, kind: 'observation', type: 'decision',
      title: 'Cached episode', narrative: 'The team chose FTS5.', facts: [], concepts: [], filesRead: [], filesModified: [],
      fingerprint: 'cache-1', source: { sessionId: SessionId('session-1') }, ...overrides,
    }
  }

  it('reuses stored vectors and sends only the query on a repeated search', async () => {
    const harnessed = await harness()
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const embeddings = harnessed.ctx.embeddings as ScriptEmbeddings
    await harnessed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await harnessed.memory.remember(request({ key: 'b', value: 'Use emoji sparingly' }))
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    expect(embeddings.batches[0]).toHaveLength(3)
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(2)
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    expect(embeddings.batches[1]).toEqual(['语气'])
  })

  it('re-embeds a record whose content changed and keeps one vector per record', async () => {
    const harnessed = await harness()
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const embeddings = harnessed.ctx.embeddings as ScriptEmbeddings
    const first = await harnessed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    await harnessed.memory.remember(request({ key: 'a', value: 'Reply warmly' }))
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    expect(embeddings.batches[1]).toHaveLength(2)
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
    expect(harnessed.memory.episode(VIEW_A, first.id as never)).toBeUndefined()
  })

  it('re-embeds everything when the provider model changes', async () => {
    const pool = new MemoryMediaPool()
    const first = await harness({ pool })
    await first.ctx.plugin(ScriptEmbeddings)
    await first.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await first.memory.recall({ view: VIEW_A, text: '语气' })
    await first.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(first.ctx), 1)
    const second = await harness({ pool })
    await second.ctx.plugin(OtherScriptEmbeddings)
    const other = second.ctx.embeddings as OtherScriptEmbeddings
    await second.memory.recall({ view: VIEW_A, text: '语气' })
    expect(other.batches[0]).toHaveLength(2)
  })

  it('skips persistence when the cache is disabled', async () => {
    const harnessed = await harness({ config: { maxEmbeddingVectors: 0 } })
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const embeddings = harnessed.ctx.embeddings as ScriptEmbeddings
    await harnessed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    expect(embeddings.batches.map(batch => batch.length)).toEqual([2, 2])
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(0)
  })

  it('drops a record vector when the record is forgotten or its episode is pruned', async () => {
    const harnessed = await harness({ config: { episodeRetentionDays: 1 } })
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const record = await harnessed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
    await harnessed.memory.forget(VIEW_A, record.id)
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(0)
    const episode = await harnessed.memory.rememberEpisode(episodeRequestCache())
    await harnessed.memory.searchEpisodes({ view: VIEW_A, text: '语气' })
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
    await harnessed.memory.forgetEpisode(VIEW_A, episode.id)
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(0)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(0)
    const old = await harnessed.memory.rememberEpisode(episodeRequestCache({ fingerprint: 'old' }))
    vi.setSystemTime(2 * 86_400_000)
    await harnessed.memory.rememberEpisode(episodeRequestCache({ fingerprint: 'new' }))
    await harnessed.memory.searchEpisodes({ view: VIEW_A, text: '语气' })
    expect(harnessed.memory.listEpisodes(VIEW_A).map(record => record.id)).not.toContain(old.id)
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
  })

  it('keeps the cache under its cap by dropping the oldest vector', async () => {
    const harnessed = await harness({ config: { maxEmbeddingVectors: 1 } })
    await harnessed.ctx.plugin(ScriptEmbeddings)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000)
    await harnessed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    vi.setSystemTime(2_000)
    await harnessed.memory.remember(request({ key: 'b', value: 'Use emoji sparingly' }))
    vi.setSystemTime(3_000)
    await harnessed.memory.recall({ view: VIEW_A, text: '语气' })
    expect(harnessed.memory.stats(VIEW_A).vectors).toBe(1)
  })

  it('replaces a malformed cached vector on the next search', async () => {
    const pool = new MemoryMediaPool()
    const first = await harness({ pool })
    await first.ctx.plugin(ScriptEmbeddings)
    await first.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await first.memory.recall({ view: VIEW_A, text: '语气' })
    await first.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(first.ctx), 1)
    const stored = pool.media.get('tomato_memory_vectors')?.tables.get('vectors')
    const [[key, record]] = [...stored ?? []] as [[string, import('@tomato/experimental-memory').VectorRecord]]
    stored?.set(key, { ...record, vector: 'AAAA' })
    const second = await harness({ pool })
    await second.ctx.plugin(ScriptEmbeddings)
    const embeddings = second.ctx.embeddings as ScriptEmbeddings
    const warn = vi.spyOn(second.ctx.logger, 'warn')
    expect(await second.memory.recall({ view: VIEW_A, text: '语气' })).toHaveLength(1)
    expect(embeddings.batches[0]).toHaveLength(2)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed cached vector'))
  })
})

describe('vector cache activation and empty searches', () => {
  it('searches an empty view without calling the provider', async () => {
    const harnessed = await harness()
    await harnessed.ctx.plugin(ScriptEmbeddings)
    const embeddings = harnessed.ctx.embeddings as ScriptEmbeddings
    expect(await harnessed.memory.recall({ view: VIEW_A, text: 'nothing' })).toEqual([])
    expect(await harnessed.memory.searchEpisodes({ view: VIEW_A, text: 'nothing' })).toEqual([])
    expect(embeddings.batches).toEqual([])
  })

  it('refuses to activate over a vector whose key differs from its record id', async () => {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    await seed.ctx.plugin(ScriptEmbeddings)
    await seed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await seed.memory.remember(request({ key: 'b', value: 'Use emoji sparingly' }))
    await seed.memory.recall({ view: VIEW_A, text: '语气' })
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    const stored = pool.media.get('tomato_memory_vectors')?.tables.get('vectors')
    const [[key, record]] = [...stored ?? []] as [[string, import('@tomato/experimental-memory').VectorRecord]]
    stored?.delete(key)
    stored?.set('vector-renamed', record)
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
    await expect(new MemoryService(ctx, {})[Service.init]()).rejects.toThrow('stored vector key "vector-renamed" differs from record id')
  })
})

describe('vector cache activation failures', () => {
  it('logs a failing vector-domain close and still reports the key mismatch', async () => {
    const pool = new MemoryMediaPool()
    const seed = await harness({ pool })
    await seed.ctx.plugin(ScriptEmbeddings)
    await seed.memory.remember(request({ key: 'a', value: 'Reply briefly' }))
    await seed.memory.remember(request({ key: 'b', value: 'Use emoji sparingly' }))
    await seed.memory.recall({ view: VIEW_A, text: '语气' })
    await seed.ctx.fiber.dispose()
    contexts.splice(contexts.indexOf(seed.ctx), 1)
    const stored = pool.media.get('tomato_memory_vectors')?.tables.get('vectors')
    const [[key, record]] = [...stored ?? []] as [[string, import('@tomato/experimental-memory').VectorRecord]]
    stored?.delete(key)
    stored?.set('vector-renamed', record)
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
    const original = facility.open.bind(facility)
    let opens = 0
    vi.spyOn(facility, 'open').mockImplementation(async (spec) => {
      const domain = await original(spec)
      opens += 1
      if (opens === 3) vi.spyOn(domain, 'close').mockRejectedValueOnce(new Error('vector close failed'))
      return domain
    })
    const warn = vi.spyOn(ctx.logger, 'warn')
    await expect(new MemoryService(ctx, {})[Service.init]()).rejects.toThrow('stored vector key')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('closing the vector domain after a key mismatch failed'))
  })
})
