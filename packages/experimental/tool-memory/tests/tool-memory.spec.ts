/** Memory tools, `/memory`, quote matching, account scoping, and snapshot injection through real registries. */
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import Loader from '@tomato/cordis-plugin-loader'
import AgentRegistry, { agentEvents } from '@tomato/agent'
import type { Agent, AgentStatus } from '@tomato/agent'
import { createInboxStub } from '@tomato/agent-loop-testkit'
import CommandRuntime from '@tomato/commands'
import LlmRuntime, { LlmAdapter, createUserMessage, ToolCallId } from '@tomato/llm'
import type { ContextFormed, GenerateOptions, MessageSource, StreamChunk } from '@tomato/llm'
import SessionStore, { SessionId, SessionSeq } from '@tomato/session'
import { pluginRecordOf } from '@tomato/session'
import type { Session, SessionEvent } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime from '@tomato/tools'
import type { ToolExecutionResult } from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import { executeToolFixture } from '@tomato/tool-testkit'
import MemoryService, { LOCAL_MEMORY_OWNER, MemoryError } from '@tomato/experimental-memory'
import type { MemoryRecord, MemoryView, RememberRequest } from '@tomato/experimental-memory'
import { AccountState } from '@tomato/gateway'
import type { SessionUser } from '@tomato/gateway'
import * as memoryTools from '@tomato/experimental-tool-memory'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    'memory-test': { kind: 'memory-test' } & ContextFormed
  }
}

const contexts: Context[] = []
const directories: string[] = []
const SIGNAL = new AbortController().signal

afterEach(async () => {
  vi.restoreAllMocks()
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/** Scripted expansion model: each request consumes the next reply, or the reply builder's result. */
class ExpansionModel extends LlmAdapter {
  readonly requests: GenerateOptions[] = []
  constructor(readonly replies: (string | Error)[] = []) { super() }
  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    const reply = this.replies.shift() ?? ''
    if (reply instanceof Error) {
      yield { type: 'finish', reason: { kind: 'error', failure: { message: reply.message, code: 'TEST' } } }
      return
    }
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: reply } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

interface Harness {
  readonly ctx: Context
  readonly workspace: string
  /** The local owner's view of {@link workspace}. */
  readonly view: MemoryView
  readonly fiber: Context['fiber']
  readonly model: ExpansionModel
}

async function harness(config: memoryTools.Config = {}, pool = new MemoryMediaPool()): Promise<Harness> {
  const workspace = await mkdtemp(join(tmpdir(), 'tomato-memory-tools-'))
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
  const backend = new MemoryStorageBackend(pool)
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => { await facility.closeAll(); unmount() }
  })
  await ctx.plugin(LlmRuntime)
  const model = new ExpansionModel()
  ctx.effect(() => ctx.llm.registerAdapter(['mock'], model))
  await ctx.plugin(MemoryService, {})
  const fiber = await ctx.plugin(memoryTools, config)
  const canonical = await realpath(workspace)
  return { ctx, workspace: canonical, view: { owner: LOCAL_MEMORY_OWNER, workspace: canonical }, fiber, model }
}

/** Save one record directly, as a confirmed write would; the default is an active workspace record of the local owner. */
async function seed(test: Harness, agent: Agent, overrides: Partial<RememberRequest> = {}): Promise<MemoryRecord> {
  return test.ctx.memory.remember({
    owner: LOCAL_MEMORY_OWNER, scope: { kind: 'workspace', path: test.workspace }, kind: 'preference', entity: 'user',
    key: 'email-tone', value: '邮件口吻要简短直接', status: 'active', pinned: false, source: { sessionId: agent.session.id },
    ...overrides,
  })
}

interface Live {
  readonly agent: Agent
  readonly session: Session
}

/** Register one live agent whose Session belongs to the workspace, optionally as a delegated child. */
async function live(test: Harness, options: { cwd?: string | null; owner?: Agent; model?: undefined } = {}): Promise<Live> {
  const cwd = options.cwd === undefined ? test.workspace : options.cwd
  const session = test.ctx.sessions.create(
    SessionId(`memory-${Math.random()}`),
    cwd === null ? {} : { meta: { cwd } },
  )
  let status: AgentStatus = 'running'
  const agent: Agent = {
    id: session.id,
    options: {},
    session,
    model: { current: () => 'model' in options ? undefined : { provider: 'mock', model: 'mock' }, select: () => {} },
    inbox: createInboxStub(),
    get status() { return status },
    ctx: new Context(),
    send: () => {},
    followup: () => {},
    steer: () => ({ outcome: Promise.resolve({ status: 'rejected' as const }) }),
    inject: () => {},
    cancel() { status = 'idle' },
    runMaintenance: task => task(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  if (options.owner === undefined) await test.ctx.agents.register(agent)
  else test.ctx.agents.enter(agent, options.owner)
  return { agent, session }
}

let turns = 0

/** Open a new turn in the Session. */
function startTurn(session: Session): void {
  turns += 1
  session.append('turn/start', { turn: turns })
}

/** Admit one message in the open turn. */
function say(session: Session, text: string, source: MessageSource = { kind: 'user' }): SessionEvent<'user/message'> {
  return session.append('user/message', createUserMessage({ content: [{ type: 'text', text }], source }), { surfaceOp: 'append' })
}

async function call(test: Harness, name: string, args: unknown, agent?: Agent): Promise<ToolExecutionResult> {
  return executeToolFixture(test.ctx, {
    signal: SIGNAL,
    callId: ToolCallId(`call-${Math.random()}`),
    name,
    arguments: args,
    ...agent === undefined ? {} : { agent },
  })
}

function text(result: ToolExecutionResult): string {
  const block = result.content[0]
  if (block?.type !== 'text') throw new Error('expected text tool content')
  return block.text
}

async function write(test: Harness, agent: Agent, overrides: Record<string, unknown> = {}): Promise<ToolExecutionResult> {
  return call(test, 'memory_write', {
    scope: 'workspace',
    kind: 'preference',
    entity: 'user',
    key: 'email-tone',
    value: '邮件简短直接，不用 emoji',
    user_quote: '以后给达人写邮件都用简短直接的语气，不要用 emoji',
    pinned: true,
    ...overrides,
  }, agent)
}

async function command(test: Harness, agent: Agent, line: string) {
  const execution = await test.ctx.commands.execute(agent, line, [], SIGNAL)
  if (execution === undefined) throw new Error('memory command is not registered')
  return execution.result
}

/** Run the pre-step waterfall once and return the snapshot messages it added after the proposed one. */
async function preStep(test: Harness, agent: Agent, step = 1): Promise<string[]> {
  const proposed = createUserMessage({ content: [{ type: 'text', text: 'proposal' }], source: { kind: 'memory-test' } })
  const decision = await agentEvents(test.ctx, agent).waterfall(
    'agent/pre-step',
    { modelSelection: { provider: 'mock', model: 'mock' }, messages: [proposed], turn: 1, step, signal: SIGNAL },
    () => Promise.resolve({ kind: 'enter' as const, messages: [proposed] }),
  )
  if (decision.kind !== 'enter') return []
  const added = decision.messages.filter(message => message !== proposed)
  for (const message of added) agent.session.append('user/message', message, { surfaceOp: 'append' })
  return added.map(message => message.content.map(block => block.type === 'text' ? block.text : '').join(''))
}

describe('plugin exports', () => {
  it('keeps the Loader namespace intact and validates its limit', async () => {
    const loader = Object.create(Loader.prototype) as Loader
    expect(loader.unwrapExports(memoryTools)).toBe(memoryTools)
    expect(memoryTools.name).toBe('experimental-tool-memory')
    expect('default' in memoryTools).toBe(false)
    expect(memoryTools.Config({})).toEqual({
      maxSnapshotBytes: 4096, projectIndex: true, minQuoteChars: 8, queryExpansion: true, expansionTimeoutMs: 8000, expansionMaxTokens: 120,
      maxAlternatives: 8, capture: false, captureMaxInputBytes: 6000, captureMaxTokens: 400, captureTimeoutMs: 12_000,
    })
    const test = await harness()
    await expect(memoryTools.apply(test.ctx, { maxSnapshotBytes: 100 })).rejects.toThrow('maxSnapshotBytes must be a safe integer of at least 256')
    await expect(memoryTools.apply(test.ctx, { minQuoteChars: 0 })).rejects.toThrow('minQuoteChars must be a positive safe integer')
    await expect(memoryTools.apply(test.ctx, { expansionTimeoutMs: 0 })).rejects.toThrow('expansionTimeoutMs must be a positive safe integer')
    await expect(memoryTools.apply(test.ctx, { expansionProvider: 'mock' })).rejects.toThrow('expansionProvider and expansionModel must be supplied together')
    await expect(memoryTools.apply(test.ctx, { captureMaxInputBytes: 0 })).rejects.toThrow('captureMaxInputBytes must be a positive safe integer')
    // Direct application without Loader normalization falls back to the documented defaults.
    await test.fiber.dispose()
    const fiber = await test.ctx.plugin({ name: 'memory-tools-direct', inject: memoryTools.inject, apply: (ctx: Context) => memoryTools.apply(ctx, {}) })
    expect(test.ctx.tools.get('memory_write')).toBeDefined()
    await fiber.dispose()
  })

  it('declares read-only searches parallel-safe and presents every call generically', async () => {
    const test = await harness()
    const tool = (name: string) => test.ctx.tools.get(name)
    expect(tool('memory_search')?.isConcurrencySafe?.({ query: 'x' })).toBe(true)
    expect(tool('memory_write')).not.toHaveProperty('isConcurrencySafe')
    expect(tool('memory_search')?.presentCall?.({ query: 'tone' }))
      .toEqual({ card: 'generic', title: 'Search memories', kind: 'search', rawInput: 'tone' })
    expect(tool('memory_write')?.presentCall?.({ scope: 'workspace', kind: 'fact', entity: 'user', key: 'k', value: 'v', user_quote: 'q' }))
      .toEqual({ card: 'generic', title: 'Save memory', kind: 'edit', rawInput: 'user / k: v' })
    expect(tool('memory_forget')?.presentCall?.({ id: 'memory-1' })).toEqual({ card: 'generic', title: 'Delete memory', kind: 'delete', rawInput: 'memory-1' })
    expect(tool('memory_related')?.isConcurrencySafe?.({ id: 'memory-1' })).toBe(true)
    expect(tool('memory_related')?.presentCall?.({ id: 'memory-1' }))
      .toEqual({ card: 'generic', title: 'Find related memories', kind: 'search', rawInput: 'memory-1' })
  })

  it('registers four tools and one command and removes them on disposal', async () => {
    const test = await harness()
    const probe = await live(test)
    const names = () => test.ctx.tools.definitions().map(tool => tool.name).filter(name => name.startsWith('memory_')).sort()
    expect(names()).toEqual(['memory_forget', 'memory_related', 'memory_search', 'memory_write'])
    expect(test.ctx.commands.list(probe.agent).map(entry => entry.name)).toContain('memory')
    await test.fiber.dispose()
    expect(names()).toEqual([])
    expect(test.ctx.commands.list(probe.agent).map(entry => entry.name)).not.toContain('memory')
  })
})

describe('memory_write', () => {
  it('activates a write whose quote is contained in a person message of the open turn, ignoring case, whitespace, and end punctuation', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, 'unrelated earlier message in this turn')
    const said = say(session, '你好。以后给达人写邮件都用简短直接的语气，\n不要用 Emoji！另外报价不超过 500 美元。')
    const result = await write(test, agent, { user_quote: '以后给达人写邮件都用简短直接的语气， 不要用 emoji！' })
    expect(text(result)).toMatch(/^Saved memory-[0-9a-f-]+\.$/u)
    const [record] = test.ctx.memory.list(test.view)
    expect(record).toMatchObject({
      scope: { kind: 'workspace', path: test.workspace }, status: 'active', pinned: true, source: { sessionId: session.id, userMessageSeq: said.seq },
    })
  })

  it('stores a candidate for a quote from an earlier turn or one shorter than minQuoteChars', async () => {
    const test = await harness({ minQuoteChars: 6 })
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('turn/end', { turn: turns, reason: { kind: 'completed' } })
    startTurn(session)
    say(session, 'next turn')
    expect(text(await write(test, agent))).toContain('as an unconfirmed candidate')
    expect(text(await write(test, agent, { key: 'short', user_quote: 'next' }))).toContain('as an unconfirmed candidate')
    expect(text(await write(test, agent, { key: 'turn', user_quote: 'next turn' }))).toMatch(/^Saved memory-[0-9a-f-]+\.$/u)
  })

  it('stores a candidate when the quote matches no person message or only a non-person message', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, 'remember that the budget is 500 dollars', { kind: 'memory-test' })
    const result = await write(test, agent, { user_quote: 'remember that the budget is 500 dollars' })
    expect(text(result)).toContain('as an unconfirmed candidate')
    expect(test.ctx.memory.list(test.view)[0]).toMatchObject({ status: 'candidate', pinned: false, source: { sessionId: session.id } })
    expect(test.ctx.memory.list(test.view)[0]?.source.userMessageSeq).toBeUndefined()
    await write(test, agent, { user_quote: '   ' })
    expect(test.ctx.memory.list(test.view)[0]?.status).toBe('candidate')
  })

  it('rejects invalid identifiers, an empty value, delegated callers, and workspace writes without a workspace', async () => {
    const test = await harness()
    const root = await live(test)
    expect((await write(test, root.agent, { entity: 'Brand X' })).error?.info?.code).toBe('MEMORY_INVALID_IDENTIFIER')
    expect((await write(test, root.agent, { value: '  ' })).error?.info?.code).toBe('MEMORY_INVALID_VALUE')
    const child = await live(test, { owner: root.agent })
    expect((await write(test, child.agent)).error?.info?.code).toBe('MEMORY_WRITE_DENIED')
    const homeless = await live(test, { cwd: null })
    expect((await write(test, homeless.agent)).error?.info?.code).toBe('MEMORY_WORKSPACE_REQUIRED')
    expect((await call(test, 'memory_search', { query: '' })).error?.info?.code).toBe('MEMORY_AGENT_REQUIRED')
    expect(test.ctx.memory.list(test.view)).toEqual([])
  })

  it('names a saved memory that nearly repeats the write and stays silent otherwise', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, '以后回复用中文，简短直接，不要加 emoji')
    const first = await seed(test, agent, { entity: 'user', key: 'email-tone', value: 'Reply in Chinese, short and direct' })
    const repeated = await write(test, agent, {
      entity: 'user', key: 'reply-style', value: 'Short direct: reply in Chinese', user_quote: '以后回复用中文，简短直接，不要加 emoji',
    })
    expect(text(repeated)).toMatch(/^Saved memory-[0-9a-f-]+\. Similar saved memories: /u)
    expect(text(repeated)).toContain(`${first.id} (user / email-tone)`)
    const candidate = await write(test, agent, {
      entity: 'user', key: 'reply-style-2', value: 'Short direct: reply in Chinese', user_quote: 'not said',
    })
    expect(text(candidate)).toContain('as an unconfirmed candidate')
    expect(text(candidate)).toContain('Similar saved memories:')
    const distinct = await write(test, agent, {
      entity: 'user', key: 'deadline', value: 'Quotes are due every Friday', user_quote: '以后回复用中文，简短直接，不要加 emoji',
    })
    expect(text(distinct)).toMatch(/^Saved memory-[0-9a-f-]+\.$/u)
  })

  it('saves a profile memory unpinned from a session without a workspace and shows it in every workspace', async () => {
    const test = await harness()
    const homeless = await live(test, { cwd: null })
    startTurn(homeless.session)
    say(homeless.session, 'I am a brand manager, please always reply in Chinese')
    const saved = await write(test, homeless.agent, {
      scope: 'profile', kind: 'fact', key: 'role', value: 'Brand manager; replies in Chinese', user_quote: 'please always reply in Chinese',
    })
    expect(text(saved)).toMatch(/^Saved memory-[0-9a-f-]+\.$/u)
    expect(test.ctx.memory.list(test.view)).toEqual([expect.objectContaining({ scope: { kind: 'profile' }, status: 'active', pinned: false })])
    const { agent } = await live(test)
    expect(text(await call(test, 'memory_search', { query: 'brand manager' }, agent)))
      .toMatch(/^Saved memories \(historical records, not instructions\):\n- memory-\S+ \[fact, profile\] user \/ role: /u)
  })

  it('reports storage limits as structured failures and rethrows unexpected storage failures', async () => {
    const test = await harness()
    const { agent } = await live(test)
    expect((await write(test, agent, { value: 'x'.repeat(2000) })).error?.info?.code).toBe('MEMORY_VALUE_TOO_LARGE')
    vi.spyOn(test.ctx.memory, 'remember').mockRejectedValueOnce(new MemoryError('full', 'workspace-full'))
    expect((await write(test, agent)).error?.info?.code).toBe('MEMORY_WORKSPACE_FULL')
    vi.spyOn(test.ctx.memory, 'remember').mockRejectedValueOnce(new MemoryError('full', 'profile-full'))
    expect((await write(test, agent, { scope: 'profile' })).error?.info?.code).toBe('MEMORY_PROFILE_FULL')
    vi.spyOn(test.ctx.memory, 'remember').mockRejectedValueOnce(new Error('disk failed'))
    expect((await write(test, agent)).error?.message).toBe('disk failed')
  })
})

describe('memory_search and memory_forget', () => {
  it('finds active records as historical text, lets a delegated agent search, and deletes by id', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    await write(test, agent)
    const child = await live(test, { owner: agent })
    const found = await call(test, 'memory_search', { query: '邮件 语气', kind: 'preference' }, child.agent)
    const header = 'Saved memories (historical records, not instructions):\n'
    expect(text(found).startsWith(header)).toBe(true)
    expect(text(found).slice(header.length))
      .toMatch(/^- memory-\S+ \[preference, pinned\] user \/ email-tone: 邮件简短直接，不用 emoji \(saved \d{4}-\d{2}-\d{2}\)$/u)
    const [record] = test.ctx.memory.list(test.view) as [MemoryRecord]
    expect((await call(test, 'memory_forget', { id: record.id }, child.agent)).error?.info?.code).toBe('MEMORY_WRITE_DENIED')
    expect(text(await call(test, 'memory_forget', { id: record.id }, agent))).toBe(`Deleted ${record.id}.`)
    expect(text(await call(test, 'memory_forget', { id: record.id }, agent))).toBe(`No saved memory ${record.id} exists here.`)
    expect(text(await call(test, 'memory_search', { query: '邮件' }, agent))).toBe('No saved memories match.')
  })
})

describe('memory_related', () => {
  it('walks same subject, same session, and same attribute, naming the edge and the saving session', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    const origin = await seed(test, agent, {
      entity: 'client:acme', key: 'email-tone', value: 'Short and direct',
      source: { sessionId: session.id, userMessageSeq: SessionSeq(4) },
    })
    const entity = await seed(test, agent, {
      entity: 'client:acme', key: 'budget', value: 'Up to 500 USD', source: { sessionId: SessionId('session-b'), userMessageSeq: SessionSeq(9) },
    })
    await seed(test, agent, { entity: 'client:other', key: 'email-tone', value: 'Formal', source: { sessionId: SessionId('session-c') } })
    await seed(test, agent, { entity: 'user', key: 'language', value: 'Chinese', source: { sessionId: session.id } })
    const body = text(await call(test, 'memory_related', { id: origin.id }, agent))
    expect(body).toMatch(/^Related saved memories \(historical records, not instructions\):/u)
    expect(body).toContain(`- ${entity.id} [preference] client:acme / budget: Up to 500 USD (saved `)
    expect(body).toContain('same-entity, 1 hop, from session-b#9')
    expect(body).toContain('same-key, 1 hop, from session-c')
    expect(body).toContain(`same-session, 1 hop, from ${session.id}`)
    expect(body).not.toContain(origin.id)
  })

  it('reaches the second hop only when asked', async () => {
    const test = await harness()
    const { agent } = await live(test)
    const origin = await seed(test, agent, { entity: 'client:acme', key: 'a', value: 'A', source: { sessionId: SessionId('session-a') } })
    const first = await seed(test, agent, { entity: 'client:acme', key: 'b', value: 'B', source: { sessionId: SessionId('session-b') } })
    const second = await seed(test, agent, { entity: 'client:other', key: 'b', value: 'C', source: { sessionId: SessionId('session-c') } })
    const one = text(await call(test, 'memory_related', { id: origin.id }, agent))
    expect(one).toContain(first.id)
    expect(one).not.toContain(second.id)
    const two = text(await call(test, 'memory_related', { id: origin.id, depth: 2 }, agent))
    expect(two).toContain(second.id)
    expect(two).toContain('2 hops')
  })

  it('reports a lone record as unconnected', async () => {
    const test = await harness()
    const { agent } = await live(test)
    const lone = await seed(test, agent, { entity: 'client:solo', key: 'tone', value: 'Warm', source: { sessionId: SessionId('session-solo') } })
    expect(text(await call(test, 'memory_related', { id: lone.id }, agent))).toBe(`No saved memories are connected to ${lone.id}.`)
  })

  it('rejects an unknown id, an unconfirmed memory, and an invalid depth, and lets a delegated agent read', async () => {
    const test = await harness()
    const root = await live(test)
    expect((await call(test, 'memory_related', { id: 'memory-missing' }, root.agent)).error?.info?.code).toBe('MEMORY_NOT_FOUND')
    await write(test, root.agent, { user_quote: 'not said' })
    const [candidate] = test.ctx.memory.list(test.view) as [MemoryRecord]
    expect((await call(test, 'memory_related', { id: candidate.id }, root.agent)).error?.info?.code).toBe('MEMORY_UNCONFIRMED')
    expect((await call(test, 'memory_related', { id: candidate.id, depth: 3 }, root.agent)).error?.info?.code).toBe('MEMORY_INVALID_DEPTH')
    const seeded = await seed(test, root.agent, { entity: 'client:acme', key: 'tone', value: 'Warm', source: { sessionId: SessionId('session-a') } })
    const neighbour = await seed(test, root.agent, { entity: 'client:acme', key: 'budget', value: '500 USD', source: { sessionId: SessionId('session-b') } })
    const child = await live(test, { owner: root.agent })
    expect(text(await call(test, 'memory_related', { id: seeded.id }, child.agent))).toContain(neighbour.id)
  })
})

describe('query expansion', () => {
  /** Expansion records logged in the Session. */
  function expansions(session: Session): unknown[] {
    return session.snapshotEvents().flatMap((event) => {
      const record = pluginRecordOf(event)
      return record?.type === 'plugin:tool-memory/query-expansion' ? [record.data] : []
    })
  }

  it('finds a memory phrased differently through model-suggested wordings and logs the request', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    await seed(test, agent)
    test.model.replies.push('1. 口吻\n- 写作风格\n简短直接, tone')
    const result = await call(test, 'memory_search', { query: '邮件语气' }, agent)
    expect(text(result)).toContain('user / email-tone: 邮件口吻要简短直接')
    expect(test.model.requests).toHaveLength(1)
    expect(test.model.requests[0]).toMatchObject({ provider: 'mock', model: 'mock', system: memoryTools.EXPANSION_SYSTEM, maxTokens: 120 })
    expect(JSON.stringify(test.model.requests[0]?.messages)).toContain('邮件语气')
    expect(expansions(session)).toEqual([{
      route: { provider: 'mock', model: 'mock' }, system: memoryTools.EXPANSION_SYSTEM, input: '邮件语气', maxTokens: 120,
      outcome: { status: 'expanded', alternatives: ['口吻', '写作风格', '简短直接', 'tone'] },
    }])
  })

  it('skips expansion for an empty query, a full literal result, an empty store, and when switched off', async () => {
    const test = await harness()
    const { agent } = await live(test)
    await call(test, 'memory_search', { query: 'anything' }, agent)
    await seed(test, agent, { key: 'a', value: 'shared word one' })
    await call(test, 'memory_search', { query: '' }, agent)
    expect(test.model.requests).toHaveLength(0)
    const off = await harness({ queryExpansion: false })
    const other = await live(off)
    await seed(off, other.agent, { kind: 'fact', key: 'x', value: 'unrelated' })
    expect(text(await call(off, 'memory_search', { query: 'nothing alike' }, other.agent))).toBe('No saved memories match.')
    expect(off.model.requests).toHaveLength(0)
  })

  it('skips expansion when the literal query already fills the result', async () => {
    const test = await harness()
    const { agent } = await live(test)
    for (let index = 0; index < 10; index += 1) await seed(test, agent, { key: `k${index}`, value: `shared word ${index}` })
    await call(test, 'memory_search', { query: 'shared' }, agent)
    expect(test.model.requests).toHaveLength(0)
  })

  it('falls back to the literal query and logs the failure when the model fails or times out', async () => {
    const test = await harness({ expansionTimeoutMs: 1000 })
    const { agent, session } = await live(test)
    await seed(test, agent)
    test.model.replies.push(new Error('provider down'))
    expect(text(await call(test, 'memory_search', { query: '邮件语气' }, agent))).toContain('email-tone')
    expect(expansions(session).at(-1)).toMatchObject({ outcome: { status: 'failed', reason: 'provider down' } })
    test.model.replies.push('')
    expect(text(await call(test, 'memory_search', { query: '完全无关' }, agent))).toBe('No saved memories match.')
    expect(expansions(session).at(-1)).toMatchObject({ outcome: { status: 'expanded', alternatives: [] } })
  })

  it('uses an explicit route and skips expansion when the agent has no model and none is configured', async () => {
    const test = await harness({ expansionProvider: 'mock', expansionModel: 'small' })
    const { agent } = await live(test)
    await seed(test, agent)
    test.model.replies.push('口吻')
    await call(test, 'memory_search', { query: '邮件语气' }, agent)
    expect(test.model.requests[0]).toMatchObject({ provider: 'mock', model: 'small' })
    const plain = await harness()
    const bare = await live(plain, { model: undefined })
    await seed(plain, bare.agent, { kind: 'fact', key: 'x', value: 'unrelated' })
    expect(text(await call(plain, 'memory_search', { query: 'other words' }, bare.agent))).toBe('No saved memories match.')
    expect(plain.model.requests).toHaveLength(0)
  })

  it('ends the search when the tool call itself is cancelled during expansion', async () => {
    const test = await harness()
    const { agent } = await live(test)
    await seed(test, agent)
    const controller = new AbortController()
    vi.spyOn(test.model, 'stream').mockImplementation(async function* () {
      controller.abort()
      yield* []
      throw new Error('aborted by caller')
    })
    const result = await executeToolFixture(test.ctx, {
      signal: controller.signal, callId: ToolCallId('cancel-expansion'), name: 'memory_search', arguments: { query: '邮件语气' }, agent,
    })
    expect(result.isError).toBe(true)
  })

  it('logs a thrown non-Error failure and ignores non-text reply blocks', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    await seed(test, agent)
    vi.spyOn(test.ctx.llm, 'prepareCall').mockRejectedValueOnce('route gone')
    await call(test, 'memory_search', { query: '邮件语气' }, agent)
    expect(expansions(session).at(-1)).toMatchObject({ outcome: { status: 'failed', reason: 'route gone' } })
    vi.spyOn(test.model, 'stream').mockImplementationOnce(async function* () {
      yield { type: 'block-start', index: 0, blockType: 'reasoning' }
      yield { type: 'block-end', index: 0, block: { type: 'reasoning', text: 'thinking' } }
      yield { type: 'block-start', index: 1, blockType: 'text' }
      yield { type: 'block-end', index: 1, block: { type: 'text', text: '口吻' } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    })
    expect(text(await call(test, 'memory_search', { query: '邮件语气' }, agent))).toContain('email-tone')
    expect(expansions(session).at(-1)).toMatchObject({ outcome: { status: 'expanded', alternatives: ['口吻'] } })
  })

  it('parses list markers, separators, duplicates, and the limit out of a reply', () => {
    expect(memoryTools.parseAlternatives('1. A\n2) b\n- a\n• c、d；e', 'query', 10)).toEqual(['A', 'b', 'c', 'd', 'e'])
    expect(memoryTools.parseAlternatives('Query\nx\ny', 'query', 1)).toEqual(['x'])
    expect(memoryTools.parseAlternatives('x'.repeat(80), 'q', 5)).toEqual(['x'.repeat(40)])
  })
})

describe('post-turn capture', () => {
  /** Session-query face backed by the live Session's own events. */
  function provideSessionQuery(test: Harness): void {
    test.ctx.provide('sessionQuery', {
      observeSession: async (id: SessionId) => {
        const session = test.ctx.sessions.get(id)
        if (session === undefined) throw new Error('missing session')
        return { events: session.snapshotEvents(), [Symbol.dispose]() {} }
      },
    } as never)
  }

  /** Capture records logged in the Session. */
  function captures(session: Session): unknown[] {
    return session.snapshotEvents().flatMap((event) => {
      const record = pluginRecordOf(event)
      return record?.type === 'plugin:tool-memory/turn-capture' ? [record.data] : []
    })
  }

  /** End the open turn as completed. */
  function endTurn(session: Session): void {
    session.append('turn/end', { turn: turns, reason: { kind: 'completed' } })
  }

  it('stores quoted candidates after a turn and logs the request', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { agent: _agent, session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push(JSON.stringify([{
      scope: 'workspace', kind: 'preference', entity: 'user', key: 'email-tone',
      value: '邮件简短直接，不用 emoji', quote: '简短直接的语气，不要用 emoji',
    }]))
    endTurn(session)
    await vi.waitFor(() => { expect(test.ctx.memory.list(test.view)).toHaveLength(1) })
    const [record] = test.ctx.memory.list(test.view) as [MemoryRecord]
    expect(record).toMatchObject({ status: 'candidate', scope: { kind: 'workspace' }, source: { sessionId: session.id } })
    expect(record.source.userMessageSeq).toBeDefined()
    expect(test.model.requests).toHaveLength(1)
    expect(test.model.requests[0]).toMatchObject({ provider: 'mock', model: 'mock', system: memoryTools.CAPTURE_SYSTEM, maxTokens: 400 })
    expect(JSON.stringify(test.model.requests[0]?.messages)).toContain('简短直接的语气')
    await vi.waitFor(() => { expect(captures(session)).toHaveLength(1) })
    expect(captures(session)[0]).toMatchObject({ route: { provider: 'mock', model: 'mock' }, outcome: { status: 'stored' } })
  })

  it('skips an identity it already stores and a candidate whose quote is absent', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { agent, session } = await live(test)
    const existing = await seed(test, agent, { entity: 'user', key: 'email-tone', value: '邮件简短直接' })
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push(JSON.stringify([
      { scope: 'workspace', kind: 'preference', entity: 'user', key: 'email-tone', value: '重复', quote: '简短直接的语气' },
      { scope: 'workspace', kind: 'preference', entity: 'user', key: 'deadline', value: '周五截止', quote: '这句话不存在' },
    ]))
    endTurn(session)
    await vi.waitFor(() => { expect(captures(session)).toHaveLength(1) })
    expect(captures(session)[0]).toMatchObject({ outcome: { status: 'skipped', reason: 'nothing new to store' } })
    expect(test.ctx.memory.list(test.view)).toEqual([existing])
  })

  it('records a failed request without touching the finished turn', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push(new Error('provider down'))
    endTurn(session)
    await vi.waitFor(() => { expect(captures(session)).toHaveLength(1) })
    expect(captures(session)[0]).toMatchObject({ outcome: { status: 'failed', reason: 'provider down' } })
    expect(test.ctx.memory.list(test.view)).toEqual([])
  })

  it('records an empty reply when the model proposes nothing', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push('[]')
    endTurn(session)
    await vi.waitFor(() => { expect(captures(session)).toHaveLength(1) })
    expect(captures(session)[0]).toMatchObject({ outcome: { status: 'empty' } })
    expect(test.ctx.memory.list(test.view)).toEqual([])
  })

  it('contains an unexpected storage failure and still ends the turn', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { session } = await live(test)
    const warn = vi.spyOn(test.ctx.logger, 'warn')
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push(JSON.stringify([{
      scope: 'workspace', kind: 'preference', entity: 'user', key: 'email-tone', value: '邮件简短直接', quote: '简短直接的语气，不要用 emoji',
    }]))
    vi.spyOn(test.ctx.memory, 'remember').mockRejectedValueOnce(new Error('disk failed'))
    endTurn(session)
    await vi.waitFor(() => { expect(warn).toHaveBeenCalledWith('experimental-tool-memory: post-turn capture failed: disk failed') })
  })

  it('stores a profile candidate and drops a workspace candidate without a project directory', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const homeless = await live(test, { cwd: null })
    await seed(test, homeless.agent, { scope: { kind: 'profile' }, key: 'language', value: 'Chinese' })
    startTurn(homeless.session)
    say(homeless.session, '我是品牌经理，请始终用中文回复，语气简短直接')
    homeless.session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push(JSON.stringify([
      { scope: 'profile', kind: 'fact', entity: 'user', key: 'role', value: '品牌经理', quote: '请始终用中文回复' },
      { scope: 'workspace', kind: 'preference', entity: 'user', key: 'tone', value: '简短直接', quote: '语气简短直接' },
    ]))
    endTurn(homeless.session)
    await vi.waitFor(() => {
      expect(test.ctx.memory.list({ owner: LOCAL_MEMORY_OWNER }).filter(record => record.key === 'role')).toHaveLength(1)
    })
    const record = test.ctx.memory.list({ owner: LOCAL_MEMORY_OWNER }).find(candidate => candidate.key === 'role')
    expect(record).toMatchObject({ scope: { kind: 'profile' }, entity: 'user', status: 'candidate' })
    await vi.waitFor(() => { expect(captures(homeless.session)).toHaveLength(1) })
    expect(captures(homeless.session)[0]).toMatchObject({ outcome: { status: 'stored' } })
  })

  it('skips a candidate that nearly repeats a saved memory and swallows a storage rejection', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { agent, session } = await live(test)
    await seed(test, agent, { entity: 'user', key: 'email-tone', value: '邮件简短直接，不要用 emoji' })
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    test.model.replies.push(JSON.stringify([
      { scope: 'workspace', kind: 'preference', entity: 'user', key: 'reply-style', value: '邮件简短直接，不要用 emoji', quote: '简短直接的语气，不要用 emoji' },
    ]))
    endTurn(session)
    await vi.waitFor(() => { expect(captures(session)).toHaveLength(1) })
    expect(captures(session)[0]).toMatchObject({ outcome: { status: 'skipped', reason: 'nothing new to store' } })

    const second = await harness({ capture: true })
    provideSessionQuery(second)
    const run = await live(second)
    startTurn(run.session)
    say(run.session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    run.session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    second.model.replies.push(JSON.stringify([{
      scope: 'workspace', kind: 'preference', entity: 'client:acme', key: 'tone', value: '简短直接', quote: '简短直接的语气，不要用 emoji',
    }]))
    vi.spyOn(second.ctx.memory, 'remember').mockRejectedValueOnce(new MemoryError('full', 'workspace-full'))
    endTurn(run.session)
    await vi.waitFor(() => { expect(captures(run.session)).toHaveLength(1) })
    expect(captures(run.session)[0]).toMatchObject({ outcome: { status: 'skipped', reason: 'nothing new to store' } })
  })

  it('returns without a request for a turn with no person text or while nobody is signed in', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const silent = await live(test)
    startTurn(silent.session)
    silent.session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    endTurn(silent.session)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(test.model.requests).toEqual([])

    const account = new AccountState()
    const signedOut = await harness({ capture: true })
    provideSessionQuery(signedOut)
    signedOut.ctx.provide('tomatoAccount', account.view())
    const { session } = await live(signedOut)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    endTurn(session)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(signedOut.model.requests).toEqual([])
    expect(captures(session)).toEqual([])
  })

  it('logs a thrown non-Error failure and ignores non-text reply blocks', async () => {
    const test = await harness({ capture: true })
    provideSessionQuery(test)
    const { session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    vi.spyOn(test.ctx.llm, 'prepareCall').mockRejectedValueOnce('route gone')
    endTurn(session)
    await vi.waitFor(() => { expect(captures(session)).toHaveLength(1) })
    expect(captures(session)[0]).toMatchObject({ outcome: { status: 'failed', reason: 'route gone' } })

    const mixed = await harness({ capture: true })
    provideSessionQuery(mixed)
    const live2 = await live(mixed)
    startTurn(live2.session)
    say(live2.session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    live2.session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    vi.spyOn(mixed.model, 'stream').mockImplementationOnce(async function* () {
      yield { type: 'block-start', index: 0, blockType: 'reasoning' }
      yield { type: 'block-end', index: 0, block: { type: 'reasoning', text: 'thinking' } }
      yield { type: 'block-start', index: 1, blockType: 'text' }
      yield {
        type: 'block-end', index: 1, block: {
          type: 'text',
          text: JSON.stringify([{
            scope: 'workspace', kind: 'preference', entity: 'user', key: 'email-tone', value: '邮件简短直接', quote: '简短直接的语气，不要用 emoji',
          }]),
        },
      }
      yield { type: 'finish', reason: { kind: 'stop' } }
    })
    endTurn(live2.session)
    await vi.waitFor(() => { expect(mixed.ctx.memory.list(mixed.view)).toHaveLength(1) })
    await vi.waitFor(() => { expect(captures(live2.session)[0]).toMatchObject({ outcome: { status: 'stored' } }) })
  })

  it('contains a non-Error rejection from the capture pipeline', async () => {
    const test = await harness({ capture: true })
    test.ctx.provide('sessionQuery', {
      observeSession: async () => { throw 'broken' },
    } as never)
    const { session } = await live(test)
    const warn = vi.spyOn(test.ctx.logger, 'warn')
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' })
    endTurn(session)
    await vi.waitFor(() => { expect(warn).toHaveBeenCalledWith('experimental-tool-memory: post-turn capture failed: broken') })
  })

  it('stays silent when capture is off or the turn carried no model route', async () => {
    const off = await harness()
    provideSessionQuery(off)
    const quiet = await live(off)
    startTurn(quiet.session)
    say(quiet.session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    endTurn(quiet.session)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(off.model.requests).toEqual([])

    const routed = await harness({ capture: true })
    provideSessionQuery(routed)
    const blind = await live(routed)
    startTurn(blind.session)
    say(blind.session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    endTurn(blind.session)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(routed.model.requests).toEqual([])
    expect(captures(blind.session)).toEqual([])
  })
})

describe('capture transcript and parsing', () => {
  it('reads the turn person text within the byte cap and ignores trivial turns', async () => {
    const test = await harness()
    const { session } = await live(test)
    startTurn(session)
    say(session, '')
    const first = say(session, '以后给达人写邮件都用简短直接的语气')
    const end = session.append('turn/end', { turn: turns, reason: { kind: 'completed' } })
    const events = session.snapshotEvents()
    const transcript = memoryTools.collectTurnMessages(events, turns, end.seq, 4096)
    if (transcript === undefined) throw new Error('expected a transcript')
    expect(transcript).toEqual({ fromSeq: first.seq, toSeq: first.seq, messages: [{ seq: first.seq, text: '以后给达人写邮件都用简短直接的语气' }] })
    expect(memoryTools.renderCaptureInput(transcript)).toBe(`Finished turn, user messages:\n[${first.seq}] 以后给达人写邮件都用简短直接的语气`)
    expect(memoryTools.collectTurnMessages(events, turns, end.seq, 4)).toBeUndefined()
    expect(memoryTools.collectTurnMessages(events, 99, end.seq, 4096)).toBeUndefined()
    startTurn(session)
    say(session, 'hi')
    const short = session.append('turn/end', { turn: turns, reason: { kind: 'completed' } })
    expect(memoryTools.collectTurnMessages(session.snapshotEvents(), turns, short.seq, 4096)).toBeUndefined()
  })

  it('parses a fenced reply and drops invalid, empty, long, and duplicate candidates', () => {
    const reply = [
      'Here you go:',
      '```json',
      JSON.stringify([
        { scope: 'profile', kind: 'fact', entity: 'user', key: 'role', value: 'Brand manager', quote: 'I manage brands' },
        { scope: 'profile', kind: 'fact', entity: 'user', key: 'role', value: 'Duplicate', quote: 'I manage brands' },
        { scope: 'workspace', kind: 'preference', entity: 'Brand X', key: 'tone', value: 'x', quote: 'y' },
        { scope: 'workspace', kind: 'preference', entity: 'user', key: 'tone', value: 'x'.repeat(201), quote: 'y' },
        { scope: 'workspace', kind: 'preference', entity: 'user', key: 'tone-2', value: '', quote: 'y' },
        { scope: 'workspace', kind: 'preference', entity: 'user', key: 'tone-3', value: 'ok', quote: '   ' },
      ]),
      '```',
    ].join('\n')
    expect(memoryTools.parseCaptureReply(reply)).toEqual([
      { scope: 'profile', kind: 'fact', entity: 'user', key: 'role', value: 'Brand manager', quote: 'I manage brands' },
    ])
  })

  it('keeps at most three candidates and rejects malformed payloads', () => {
    const candidates = Array.from({ length: 5 }, (_, index) => ({
      scope: 'workspace', kind: 'fact', entity: 'user', key: `k-${index}`, value: `v${index}`, quote: 'evidence here',
    }))
    expect(memoryTools.parseCaptureReply(JSON.stringify(candidates))).toHaveLength(3)
    expect(memoryTools.parseCaptureReply('no json here')).toEqual([])
    expect(memoryTools.parseCaptureReply('[not json]')).toEqual([])
    expect(memoryTools.parseCaptureReply(JSON.stringify([{ scope: 'profile', kind: 'unknown', entity: 'user', key: 'k', value: 'v', quote: 'q' }]))).toEqual([])
  })
})

describe('/memory', () => {
  const USAGE = 'Usage: /memory [list|profile|stats|show <id>|related <id> [1-2]|confirm <id>|pin <id>|unpin <id>|forget <id>]'

  it('lists, confirms, pins, unpins, and deletes records of the agent workspace', async () => {
    const test = await harness()
    const { agent } = await live(test)
    expect(await command(test, agent, '/memory')).toEqual({
      kind: 'success', text: `No profile memories.\n\nNo memories in this workspace.\n\n${USAGE}`,
    })
    await write(test, agent, { user_quote: 'not said' })
    const [candidate] = test.ctx.memory.list(test.view) as [MemoryRecord]
    const listed = await command(test, agent, '/memory list')
    expect(listed.kind === 'success' && listed.text).toContain(`Memories in this workspace:\n- ${candidate.id} [preference, unconfirmed] user / email-tone`)
    expect(await command(test, agent, `/memory pin ${candidate.id}`)).toEqual({ kind: 'error', text: `No confirmed workspace memory ${candidate.id} exists here.` })
    expect(await command(test, agent, `/memory confirm ${candidate.id}`)).toEqual({ kind: 'success', text: `Confirmed ${candidate.id}.` })
    expect(await command(test, agent, `/memory confirm ${candidate.id}`)).toEqual({ kind: 'error', text: `No unconfirmed memory ${candidate.id} exists here.` })
    expect(await command(test, agent, `/memory pin ${candidate.id}`)).toEqual({ kind: 'success', text: `Pinned ${candidate.id}.` })
    expect(await command(test, agent, `/memory unpin ${candidate.id}`)).toEqual({ kind: 'success', text: `Unpinned ${candidate.id}.` })
    expect(await command(test, agent, `/memory forget ${candidate.id}`)).toEqual({ kind: 'success', text: `Deleted ${candidate.id}.` })
    expect(await command(test, agent, `/memory forget ${candidate.id}`)).toEqual({ kind: 'error', text: `No memory ${candidate.id} exists here.` })
  })

  it('lists the profile alone, refuses to pin a profile memory, and shows the profile without a workspace', async () => {
    const test = await harness()
    const { agent } = await live(test)
    const profile = await seed(test, agent, { scope: { kind: 'profile' }, key: 'language', value: 'Reply in Chinese' })
    await seed(test, agent)
    const line = `- ${profile.id} [preference, profile] user / language: Reply in Chinese`
    const only = await command(test, agent, '/memory profile')
    const onlyText = only.kind === 'success' ? only.text ?? '' : ''
    expect(onlyText.startsWith(`Profile memories (they apply in every workspace):\n${line} (saved `)).toBe(true)
    expect(onlyText.endsWith(`\n\n${USAGE}`)).toBe(true)
    expect(onlyText).not.toContain('email-tone')
    expect(await command(test, agent, `/memory pin ${profile.id}`)).toEqual({
      kind: 'error', text: 'Profile memories always reach new sessions; pinning applies to workspace memories.',
    })
    const homeless = await live(test, { cwd: null })
    const listed = await command(test, homeless.agent, '/memory')
    expect(listed.kind === 'success' && listed.text).toContain(line)
    expect(listed.kind === 'success' && listed.text).toContain('This session has no project directory, so it has no workspace memories.')
    expect(listed.kind === 'success' && listed.text).not.toContain('email-tone')
  })

  it('shows the writing Session of a record, its relations, and the storage in use', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    const origin = await seed(test, agent, {
      entity: 'client:acme', key: 'email-tone', value: 'Short',
      source: { sessionId: session.id, userMessageSeq: SessionSeq(7) },
    })
    const neighbour = await seed(test, agent, { entity: 'client:acme', key: 'budget', value: '500 USD', source: { sessionId: SessionId('session-b') } })
    const today = new Date(origin.updatedAt).toISOString().slice(0, 10)
    expect(await command(test, agent, `/memory show ${origin.id}`)).toEqual({
      kind: 'success',
      text: `- ${origin.id} [preference] client:acme / email-tone: Short (saved ${today})\nSaved in session ${session.id} from message 7.`,
    })
    expect(await command(test, agent, '/memory show memory-missing')).toEqual({ kind: 'error', text: 'No memory memory-missing exists here.' })
    expect(await command(test, agent, '/memory related memory-missing')).toEqual({ kind: 'error', text: 'No memory memory-missing exists here.' })
    const related = await command(test, agent, `/memory related ${origin.id}`)
    expect(related.kind === 'success' && related.text).toContain(`Related memories:\n- ${neighbour.id}`)
    expect(await command(test, agent, '/memory stats')).toEqual({
      kind: 'success',
      text: [
        'Memory stats: 2 stored, 2 active, 0 unconfirmed, 0 pinned.',
        'Profile: 0 of 100.',
        'This workspace: 2 of 1000.',
        `Oldest active memory: ${today}.`,
      ].join('\n'),
    })
  })

  it('marks an unconfirmed record, refuses its relations, and counts without a workspace', async () => {
    const test = await harness()
    const { agent } = await live(test)
    await write(test, agent, { user_quote: 'not said' })
    const [candidate] = test.ctx.memory.list(test.view) as [MemoryRecord]
    const shown = await command(test, agent, `/memory show ${candidate.id}`)
    expect(shown.kind === 'success' && shown.text).toContain(`Unconfirmed: later sessions do not see it until you run /memory confirm ${candidate.id}.`)
    expect(await command(test, agent, `/memory related ${candidate.id}`)).toEqual({
      kind: 'error', text: `Memory ${candidate.id} is unconfirmed, so it has no connections yet.`,
    })
    const lone = await seed(test, agent, { entity: 'client:solo', key: 'tone', value: 'Warm', source: { sessionId: SessionId('session-solo') } })
    expect(await command(test, agent, `/memory related ${lone.id}`)).toEqual({ kind: 'success', text: `No memories are connected to ${lone.id}.` })
    const homeless = await live(test, { cwd: null })
    const counted = await command(test, homeless.agent, '/memory stats')
    expect(counted.kind === 'success' && counted.text).toContain('This session has no project directory, so it has no workspace memories.')
  })

  it('rejects unknown grammar', async () => {
    const test = await harness()
    const { agent } = await live(test)
    for (const line of ['/memory pin', '/memory list extra', '/memory profile extra', '/memory forget a b', '/memory erase x', '/memory show', '/memory stats extra', '/memory related x 0', '/memory related x 3', '/memory related x two']) {
      expect(await command(test, agent, line)).toEqual({ kind: 'error', text: USAGE })
    }
  })
})

describe('account scope', () => {
  const ALICE: SessionUser = { id: 'u-alice', email: 'alice@example.com', name: 'Alice', avatarUrl: null, language: 'zh' }
  const BOB: SessionUser = { ...ALICE, id: 'u-bob', email: 'bob@example.com', name: 'Bob' }

  /** A harness whose Host names accounts through the gateway's account view. */
  async function accountHarness() {
    const test = await harness()
    const account = new AccountState()
    test.ctx.provide('tomatoAccount', account.view())
    return { test, account }
  }

  it('refuses every memory surface while nobody is signed in', async () => {
    const { test } = await accountHarness()
    const { agent } = await live(test)
    expect((await call(test, 'memory_search', { query: '' }, agent)).error?.info?.code).toBe('MEMORY_SIGN_IN_REQUIRED')
    expect((await write(test, agent)).error?.info?.code).toBe('MEMORY_SIGN_IN_REQUIRED')
    expect(await command(test, agent, '/memory')).toEqual({ kind: 'error', text: 'Memory is unavailable until you sign in.' })
    expect(await preStep(test, agent)).toEqual([])
  })

  it('keeps each account\'s memories to that account and withdraws the snapshot on sign-out', async () => {
    const { test, account } = await accountHarness()
    const { agent, session } = await live(test)
    account.observe({ kind: 'valid', user: ALICE })
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    await write(test, agent, { scope: 'profile' })
    const [shown] = await preStep(test, agent)
    expect(shown).toContain('[preference, profile] user / email-tone')
    account.observe({ kind: 'valid', user: BOB })
    expect(text(await call(test, 'memory_search', { query: '邮件' }, agent))).toBe('No saved memories match.')
    account.signOut()
    expect(await preStep(test, agent)).toEqual(['Saved memories: none are shown now. Earlier saved memories in this session no longer apply.'])
    account.observe({ kind: 'valid', user: ALICE })
    expect(text(await call(test, 'memory_search', { query: '邮件' }, agent))).toContain('email-tone')
  })
})

describe('project index rendering', () => {
  const active = (test: Harness): readonly MemoryRecord[] =>
    test.ctx.memory.list(test.view).filter(record => record.status === 'active')

  it('orders subjects by count, then by name, and lists at most eight', async () => {
    const test = await harness()
    const { agent } = await live(test)
    for (const entity of ['b', 'a', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) {
      await seed(test, agent, { entity, key: 'k1' })
      await seed(test, agent, { entity, key: 'k2' })
    }
    await seed(test, agent, { entity: 'a', key: 'k3' })
    const lines = memoryTools.renderProjectIndex(active(test), 4096).split('\n')
    expect(lines[0]).toBe('Project memories by subject (counts only; memory_search returns the values):')
    expect(lines[1]).toBe('- a: 3 (k1, k2, k3)')
    expect(lines[2]).toBe('- b: 2 (k1, k2)')
    expect(lines).toHaveLength(9)
  })

  it('lists at most six attributes per subject and marks the rest', async () => {
    const test = await harness()
    const { agent } = await live(test)
    for (const key of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) await seed(test, agent, { entity: 'client:x', key })
    expect(memoryTools.renderProjectIndex(active(test), 4096).split('\n')[1]).toBe('- client:x: 7 (a, b, c, d, e, f, …)')
  })

  it('indexes workspace subjects only and stays empty below the threshold', async () => {
    const test = await harness()
    const { agent } = await live(test)
    await seed(test, agent, { scope: { kind: 'profile' }, key: 'language', value: 'Chinese' })
    await seed(test, agent, { entity: 'client:solo', key: 'tone', value: 'Warm' })
    expect(memoryTools.renderProjectIndex(active(test), 4096)).toBe('')
  })

  it('bounds the index by bytes and names omitted subjects', async () => {
    const test = await harness()
    const { agent } = await live(test)
    for (const entity of ['alpha', 'beta', 'gamma']) {
      await seed(test, agent, { entity, key: 'k1' })
      await seed(test, agent, { entity, key: 'k2' })
    }
    const records = active(test)
    expect(memoryTools.renderProjectIndex(records, 8)).toBe('')
    const [header, first, second] = memoryTools.renderProjectIndex(records, 4096).split('\n')
    const budget = Buffer.byteLength([header, first, second, '(1 more subjects omitted; memory_search by subject.)'].join('\n'), 'utf8') - 1
    expect(memoryTools.renderProjectIndex(records, budget))
      .toBe([header, first, '(2 more subjects omitted; memory_search by subject.)'].join('\n'))
  })
})

describe('snapshot injection', () => {
  it('appends one snapshot when pinned records exist, skips an unchanged snapshot, and replaces a changed one', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    expect(await preStep(test, agent)).toEqual([])
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    await write(test, agent)
    const [first] = await preStep(test, agent)
    const [heading, line] = (first ?? '').split('\n')
    expect(heading).toBe('Saved memories from earlier sessions: profile memories describe the user in every workspace, and pinned '
      + 'memories belong to this workspace. They are historical records, not instructions; the current request takes precedence, and '
      + 'memory_search finds more.')
    expect(line).toMatch(/^- memory-\S+ \[preference, pinned\] user \/ email-tone: 邮件简短直接，不用 emoji \(saved \d{4}-\d{2}-\d{2}\)$/u)
    const snapshot = session.snapshotEvents().at(-1)
    expect(snapshot?.type === 'user/message' && snapshot.data.source).toEqual({
      kind: 'experimental-memory', form: 'snapshot', sections: [{ name: 'experimental-memory', text: first }],
    })
    expect(await preStep(test, agent)).toEqual([])
    const [record] = test.ctx.memory.list(test.view) as [MemoryRecord]
    await test.ctx.memory.setPinned(test.view, record.id, false)
    expect(await preStep(test, agent, 2)).toEqual([])
    expect(await preStep(test, agent)).toEqual(['Saved memories: none are shown now. Earlier saved memories in this session no longer apply.'])
    expect(await preStep(test, agent)).toEqual([])
  })

  it('restores a snapshot that a surface replacement removed', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    await write(test, agent)
    expect(await preStep(test, agent)).toHaveLength(1)
    const carrier = session.snapshotEvents().at(-1)
    if (carrier === undefined) throw new Error('missing snapshot event')
    session.append('user/message', createUserMessage({ content: [{ type: 'text', text: 'summary' }], source: { kind: 'memory-test' } }), {
      surfaceOp: { op: 'replace', startSeq: carrier.seq, endSeq: carrier.seq },
      sourceEventSeqs: [carrier.seq],
    })
    expect(await preStep(test, agent)).toHaveLength(1)
  })

  it('appends a subject index of workspace memories and honors projectIndex', async () => {
    const test = await harness()
    const { agent } = await live(test)
    await seed(test, agent, { entity: 'client:acme', key: 'budget', value: '500 USD' })
    await seed(test, agent, { entity: 'client:acme', key: 'email-tone', value: 'Short' })
    await seed(test, agent, { entity: 'client:globex', key: 'budget', value: '900 USD' })
    const [indexed] = await preStep(test, agent)
    expect(indexed).toBe('Project memories by subject (counts only; memory_search returns the values):\n- client:acme: 2 (budget, email-tone)')
    expect(indexed).not.toContain('client:globex')

    const pinned = await seed(test, agent, { entity: 'user', key: 'language', value: 'Chinese', pinned: true })
    const [both] = await preStep(test, agent)
    const [snapshot, index] = (both ?? '').split('\n\n')
    expect(snapshot).toContain(`- ${pinned.id} [preference, pinned] user / language: Chinese`)
    expect(index).toBe('Project memories by subject (counts only; memory_search returns the values):\n- client:acme: 2 (budget, email-tone)')

    const quiet = await harness({ projectIndex: false })
    const { agent: quietAgent } = await live(quiet)
    await seed(quiet, quietAgent, { entity: 'client:acme', key: 'budget', value: '500 USD' })
    await seed(quiet, quietAgent, { entity: 'client:acme', key: 'email-tone', value: 'Short' })
    expect(await preStep(quiet, quietAgent)).toEqual([])
  })

  it('leaves no room for the index when the snapshot fills the budget', async () => {
    const test = await harness({ maxSnapshotBytes: 512 })
    const { agent } = await live(test)
    await seed(test, agent, { entity: 'client:acme', key: 'budget', value: '500 USD' })
    await seed(test, agent, { entity: 'client:acme', key: 'email-tone', value: 'Short' })
    const sample = await seed(test, agent, { scope: { kind: 'profile' }, key: 'language', value: 'x' })
    const measured = Buffer.byteLength(memoryTools.renderMemorySnapshot([sample], 65_536), 'utf8')
    await test.ctx.memory.forget(test.view, sample.id)
    await seed(test, agent, { scope: { kind: 'profile' }, key: 'language', value: 'v'.repeat(510 - measured + 1) })
    expect(Buffer.byteLength(memoryTools.renderMemorySnapshot(test.ctx.memory.snapshot(test.view), 512), 'utf8')).toBe(510)
    const [shown] = await preStep(test, agent)
    expect(shown).toContain('vvv')
    expect(shown).not.toContain('Project memories by subject')
  })

  it('bounds the snapshot by maxSnapshotBytes, profile first, and names omitted records', async () => {
    const test = await harness({ maxSnapshotBytes: 512 })
    const { agent } = await live(test)
    for (const key of ['a', 'b', 'c', 'd']) {
      await seed(test, agent, { kind: 'fact', entity: 'client:brand-x', key, value: 'v'.repeat(60), pinned: true })
    }
    await seed(test, agent, { scope: { kind: 'profile' }, key: 'language', value: 'Reply in Chinese' })
    const [snapshot] = await preStep(test, agent)
    expect(Buffer.byteLength(snapshot ?? '', 'utf8')).toBeLessThanOrEqual(512)
    expect(snapshot?.split('\n')[1]).toContain('[preference, profile] user / language: Reply in Chinese')
    expect(snapshot).toMatch(/\n\(\d more memories omitted; use memory_search\.\)$/u)
    expect(memoryTools.renderMemorySnapshot(test.ctx.memory.snapshot(test.view), 300)).toBe('')
    expect(memoryTools.renderMemorySnapshot([], 4096)).toBe('')
  })

  it('leaves rejected, empty, and cancelled steps unchanged and gives a workspace-less step its profile', async () => {
    const test = await harness()
    const { agent, session } = await live(test)
    startTurn(session)
    say(session, '以后给达人写邮件都用简短直接的语气，不要用 emoji')
    await write(test, agent)
    const reject = await agentEvents(test.ctx, agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [], turn: 1, step: 1, signal: SIGNAL },
      () => Promise.resolve({ kind: 'reject' as const }),
    )
    expect(reject).toEqual({ kind: 'reject' })
    const empty = await agentEvents(test.ctx, agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [], turn: 1, step: 1, signal: SIGNAL },
      () => Promise.resolve({ kind: 'enter' as const, messages: [] }),
    )
    expect(empty).toEqual({ kind: 'enter', messages: [] })
    const aborted = new AbortController()
    aborted.abort()
    const proposed = createUserMessage({ content: [{ type: 'text', text: 'p' }], source: { kind: 'memory-test' } })
    const cancelled = await agentEvents(test.ctx, agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [proposed], turn: 1, step: 1, signal: aborted.signal },
      () => Promise.resolve({ kind: 'enter' as const, messages: [proposed] }),
    )
    expect(cancelled).toEqual({ kind: 'enter', messages: [proposed] })
    const late = new AbortController()
    const accessOf = test.ctx.memory.accessOf.bind(test.ctx.memory)
    vi.spyOn(test.ctx.memory, 'accessOf').mockImplementationOnce(async (target) => {
      late.abort()
      return accessOf(target)
    })
    const cancelledDuringAccess = await agentEvents(test.ctx, agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [proposed], turn: 1, step: 1, signal: late.signal },
      () => Promise.resolve({ kind: 'enter' as const, messages: [proposed] }),
    )
    expect(cancelledDuringAccess).toEqual({ kind: 'enter', messages: [proposed] })
    const homeless = await live(test, { cwd: null })
    expect(await preStep(test, homeless.agent)).toEqual([])
    await seed(test, agent, { scope: { kind: 'profile' }, key: 'language', value: 'Reply in Chinese' })
    const [profileOnly] = await preStep(test, homeless.agent)
    expect(profileOnly).toContain('[preference, profile] user / language: Reply in Chinese')
    expect(profileOnly).not.toContain('email-tone')
  })

  it('resumes duplicate suppression and current-turn quotes from the Session log', () => {
    const empty = { turnQuotes: [], snapshot: null, snapshotSeq: null }
    const sources: Record<'user' | 'experimental-memory' | 'memory-test', MessageSource> = {
      'user': { kind: 'user' },
      'experimental-memory': { kind: 'experimental-memory' },
      'memory-test': { kind: 'memory-test' },
    }
    const message = (text: string, kind: keyof typeof sources, seq: number): SessionEvent => ({
      type: 'user/message', seq: SessionSeq(seq), time: 0,
      data: createUserMessage({ content: [{ type: 'text', text }], source: sources[kind] }),
      surfaceOp: 'append',
    })
    const reasoning: SessionEvent = {
      type: 'user/message', seq: SessionSeq(0), time: 0,
      data: createUserMessage({ content: [{ type: 'reasoning', text: 'not quotable' }], source: { kind: 'user' } }),
      surfaceOp: 'append',
    }
    expect(memoryTools.applyMemorySessionEvent(empty, reasoning)).toBe(empty)
    const said = memoryTools.applyMemorySessionEvent(empty, message('One. Two!', 'user', 1))
    expect(said.turnQuotes).toEqual([{ seq: 1, text: 'one. two' }])
    expect(memoryTools.applyMemorySessionEvent(said, message('  ', 'user', 2))).toBe(said)
    expect(memoryTools.applyMemorySessionEvent(said, message('ignored', 'memory-test', 3))).toBe(said)
    const shown = memoryTools.applyMemorySessionEvent(said, message('snapshot text', 'experimental-memory', 4))
    expect(shown).toMatchObject({ snapshotSeq: 4 })
    expect(shown.snapshot).not.toBeNull()
    const cleared = memoryTools.applyMemorySessionEvent(shown, message(
      'Saved memories: none are shown now. Earlier saved memories in this session no longer apply.', 'experimental-memory', 5,
    ))
    expect(cleared).toMatchObject({ snapshot: null, snapshotSeq: 5 })
    const turnEnd: SessionEvent = { type: 'turn/end', seq: SessionSeq(6), time: 0, data: { turn: 1, reason: { kind: 'completed' } } }
    const ended = memoryTools.applyMemorySessionEvent(shown, turnEnd)
    expect(ended).toMatchObject({ turnQuotes: [], snapshotSeq: 4 })
    const turnStart: SessionEvent = { type: 'turn/start', seq: SessionSeq(7), time: 0, data: { turn: 2 } }
    expect(memoryTools.applyMemorySessionEvent(ended, turnStart)).toBe(ended)
    const unrelated: SessionEvent = { type: 'step/start', seq: SessionSeq(8), time: 0, data: { turn: 2, step: 1 } }
    expect(memoryTools.applyMemorySessionEvent(shown, unrelated)).toBe(shown)
  })

  it('normalizes quotes and finds the latest containing message', () => {
    expect(memoryTools.normalizeQuote('  A \n b。！ ')).toBe('a b')
    const quotes = [{ seq: 1, text: 'shared words here' }, { seq: 4, text: 'more shared words' }]
    expect(memoryTools.quotedMessage(quotes, 'Shared  words', 5)).toBe(4)
    expect(memoryTools.quotedMessage(quotes, 'words here.', 5)).toBe(1)
    expect(memoryTools.quotedMessage(quotes, 'word', 5)).toBeUndefined()
    expect(memoryTools.quotedMessage(quotes, 'absent phrase', 5)).toBeUndefined()
  })
})
