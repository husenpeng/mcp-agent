/**
 * Behavior of the `memories` Remote surface the phone uses: one store, written
 * as candidates, invisible to turns until a person confirms.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import AgentRegistry from '@tomato/agent'
import CommandRuntime from '@tomato/commands'
import LlmRuntime, { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, StreamChunk } from '@tomato/llm'
import SessionStore, { SessionId } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import MemoryService from '@tomato/experimental-memory'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import { AccountState } from '@tomato/gateway'
import * as memoryTools from '../src/index.ts'

const directories: string[] = []
const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

/** An adapter that never answers; these tests never run a turn. */
class SilentModel extends LlmAdapter {
  override async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

/** Mount the memory service and this plugin, then create one Session in a temporary project. */
async function harness() {
  const workspace = await mkdtemp(join(tmpdir(), 'tomato-memory-remote-'))
  directories.push(workspace)
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(NativeToolExecutor)
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(Storage)
  const backend = new MemoryStorageBackend(new MemoryMediaPool())
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => { await facility.closeAll(); unmount() }
  })
  await ctx.plugin(LlmRuntime)
  ctx.effect(() => ctx.llm.registerAdapter(['mock'], new SilentModel()))
  await ctx.plugin(MemoryService, {})
  await ctx.plugin(memoryTools, {})
  const session = ctx.sessions.create(SessionId('phone-a'), { meta: { cwd: workspace } })
  return { ctx, workspace, sessionId: session.id }
}

describe('memories Remote', () => {
  it('lists the owner records of the Session project', async () => {
    const test = await harness()
    const value = await test.ctx.memories.list({ sessionId: test.sessionId })
    expect(value.signedIn).toBe(true)
    expect(value.records).toEqual([])
  })

  it('reads a closed Session through the query corpus', async () => {
    const test = await harness()
    test.ctx.provide('sessionQuery', {
      listSessions: async () => [{ header: { id: 'closed', cwd: test.workspace } }],
    } as never)
    expect(await test.ctx.memories.list({ sessionId: 'closed' }))
      .toEqual({ signedIn: true, records: [] })
  })

  it('dismisses a candidate through the Remote and reports a missing one', async () => {
    const test = await harness()
    const written = await test.ctx.memories.propose({
      sessionId: test.sessionId,
      entries: [{ scope: 'workspace', kind: 'preference', entity: 'user', key: 'email-tone', value: 'Reply briefly' }],
    })
    expect(written.written).toHaveLength(1)
    const candidate = written.written[0]!
    if (candidate === undefined) throw new Error('expected a written candidate')
    const dismissed = await test.ctx.memories.dismiss({ sessionId: test.sessionId, id: candidate.id })
    expect(dismissed).toMatchObject({ record: { id: candidate.id, status: 'candidate' } })
    expect(await test.ctx.memories.dismiss({ sessionId: test.sessionId, id: 'memory-missing' }))
      .toEqual({ code: 'not_found' })
  })

  it('refuses an oversized proposal and answers write calls while the account loads', async () => {
    const test = await harness()
    const account = new AccountState()
    test.ctx.provide('tomatoAccount', account.view())
    await expect(test.ctx.memories.propose({
      sessionId: test.sessionId,
      entries: Array.from({ length: 21 }, () => ({ scope: 'profile', kind: 'fact', entity: 'user', key: 'k', value: 'v' })),
    })).rejects.toThrow(/at most 20 entries/u)
    expect(await test.ctx.memories.propose({
      sessionId: test.sessionId,
      entries: [{ scope: 'profile', kind: 'fact', entity: 'user', key: 'k', value: 'v' }],
    })).toEqual({ written: [] })
    expect(await test.ctx.memories.confirm({ sessionId: test.sessionId, id: 'memory-1' }))
      .toEqual({ code: 'account_loading' })
    expect(await test.ctx.memories.forget({ sessionId: test.sessionId, id: 'memory-1' }))
      .toEqual({ deleted: false, code: 'account_loading' })
    expect(await test.ctx.memories.dismiss({ sessionId: test.sessionId, id: 'memory-1' }))
      .toEqual({ code: 'account_loading' })
  })

  it('reports a loading account separately from a sign-out', async () => {
    const test = await harness()
    const account = new AccountState()
    test.ctx.provide('tomatoAccount', account.view())
    expect(await test.ctx.memories.list({ sessionId: test.sessionId }))
      .toEqual({ signedIn: false, accountLoading: true, records: [] })
    account.signOut()
    expect(await test.ctx.memories.list({ sessionId: test.sessionId }))
      .toEqual({ signedIn: false, records: [] })
  })

  it('stores phone proposals as candidates, then promotes and deletes them', async () => {
    const test = await harness()
    const proposed = await test.ctx.memories.propose({
      sessionId: test.sessionId,
      entries: [{
        scope: 'workspace', kind: 'preference', entity: 'usage-pattern', key: 'active-hours', value: '最常在下班后使用',
      }],
    })
    expect(proposed.written).toHaveLength(1)
    const [record] = proposed.written
    expect(record?.status).toBe('candidate')
    expect(record?.sessionId).toBe(test.sessionId)

    // A candidate is not part of what later turns receive.
    const listed = await test.ctx.memories.list({ sessionId: test.sessionId })
    expect(listed.records.map((entry: { status: string }) => entry.status)).toEqual(['candidate'])

    const confirmed = await test.ctx.memories.confirm({ sessionId: test.sessionId, id: record!.id })
    expect(confirmed.record?.status).toBe('active')

    const deleted = await test.ctx.memories.forget({ sessionId: test.sessionId, id: record!.id })
    expect(deleted.deleted).toBe(true)
    expect((await test.ctx.memories.list({ sessionId: test.sessionId })).records).toEqual([])
  })

  it('stores profile candidates for a Session without a project directory', async () => {
    const test = await harness()
    const bare = test.ctx.sessions.create(SessionId('phone-b'))
    const proposed = await test.ctx.memories.propose({
      sessionId: bare.id,
      entries: [{ scope: 'profile', kind: 'preference', entity: 'prompt-style', key: 'ties', value: '喜欢列点' }],
    })
    expect(proposed.written).toHaveLength(1)
    expect(proposed.written[0]?.scope).toBe('profile')
    // A workspace record has no project to belong to here, so it is refused.
    await expect(test.ctx.memories.propose({
      sessionId: bare.id,
      entries: [{ scope: 'workspace', kind: 'fact', entity: 'project', key: 'root', value: '/x' }],
    })).rejects.toThrow(/no project directory/)
  })

  it('reports a missing record rather than inventing one', async () => {
    const test = await harness()
    expect(await test.ctx.memories.confirm({ sessionId: test.sessionId, id: 'memory-missing' })).toEqual({ code: 'not_found' })
    expect(await test.ctx.memories.forget({ sessionId: test.sessionId, id: 'memory-missing' })).toEqual({ deleted: false })
  })

  it('replaces a repeated candidate instead of piling up versions', async () => {
    const test = await harness()
    const entry = { scope: 'profile' as const, kind: 'preference' as const, entity: 'prompt-style', key: 'typical-length', value: '提问很短' }
    await test.ctx.memories.propose({ sessionId: test.sessionId, entries: [entry] })
    await test.ctx.memories.propose({ sessionId: test.sessionId, entries: [{ ...entry, value: '提问更短' }] })
    const listed = await test.ctx.memories.list({ sessionId: test.sessionId })
    expect(listed.records).toHaveLength(1)
    expect(listed.records[0]?.value).toBe('提问更短')
  })
})
