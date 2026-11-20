/** One team end to end: a request from the bot service becomes finished, reviewed work. */
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@tomato/agent-loop-testkit'
import { Context } from '@tomato/cordis'
import { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@tomato/llm'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import type { BotEvent, BotGateway } from '@tomato/superagent'
import { pluginRecordOf } from '@tomato/session'
import { SUPERVISOR_SESSION } from '../src/index.ts'
import * as Runtime from '../src/index.ts'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'

const contexts: Context[] = []
const backends: MemoryStorageBackend[] = []
const directories: string[] = []

beforeEach(async () => {
  const home = await mkdtemp(join(tmpdir(), 'superagent-test-home-'))
  directories.push(home)
  vi.stubEnv('TOMATO_HOME', home)
})

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
  backends.length = 0
  vi.unstubAllEnvs()
})

/** The one request the fake service holds. */
const EVENT: BotEvent = {
  cursor: 1,
  eventId: 'evt-1',
  messageId: 'om_1',
  chatId: 'oc_1',
  chatType: 'group',
  messageType: 'text',
  content: JSON.stringify({ text: '给达人详情页加 tier 字段' }),
  senderOpenId: 'ou_1',
  mentionsBot: true,
  threadId: 'omt_1',
  rootId: 'om_root',
}

/** A bot service that holds one page of events and records replies. */
class FakeGateway implements BotGateway {
  readonly replies: string[] = []
  /** Whether replies are refused, as a service that was never told this conversation does. */
  refuseReplies = false
  #read = 0

  constructor(
    /** How many pages replay the same event, so a repeat reaches the engine as a duplicate. */
    readonly replayPages = 1,
    /** How long the first read waits, so a test can observe an overlapping tick. */
    readonly firstReadDelayMs = 0,
  ) {}

  async events(): Promise<{ readonly nextCursor: number; readonly items: readonly BotEvent[] }> {
    if (this.#read === 0 && this.firstReadDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.firstReadDelayMs))
    }
    const items = this.#read < this.replayPages ? [EVENT] : []
    this.#read += 1
    return { nextCursor: 1, items }
  }

  thread(): Promise<never> {
    return Promise.reject(new Error('the fake service has no thread history'))
  }

  reply(_chatId: string, _messageId: string, text: string): Promise<{ readonly messageId: string }> {
    if (this.refuseReplies) return Promise.reject(new Error('conversation was never observed'))
    this.replies.push(text)
    return Promise.resolve({ messageId: 'om_reply' })
  }
}

/** A model that answers each request by its turn: plan, work, then review. */
class TeamAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []

  constructor(
    /** What the work turn reports; `ready` by default. */
    private readonly workAnswer = 'Changed the page and opened a pull request.\nREPORT: ready - PR opened',
    /** Optional gate that holds work and review streams while supervision remains immediate. */
    private readonly workGate?: Promise<undefined>,
  ) {
    super()
  }

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    const prompt = JSON.stringify(options.messages)
    if (this.workGate !== undefined && !prompt.includes('You supervise a team')) await this.workGate
    const answer = prompt.includes('You supervise a team')
      ? 'DECISION: change the tier field on the creator detail page'
      : prompt.includes('Review the result')
        ? 'REVIEW: pass'
        : this.workAnswer
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: answer }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: answer } }
    yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 8 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

/** Mount the loop, storage, and the team, and return what the test observes. */
async function harness(options: {
  gateway?: FakeGateway
  adapter?: TeamAdapter
  pollSeconds?: number
  botOpenId?: string
  provider?: string
  model?: string
  maxOutputTokens?: number
  isolate?: boolean
  replies?: boolean
  allowedSenders?: string[]
  worktrees?: { create: (agent: unknown, request: { name?: string }) => Promise<{ path: string }> }
} = {}): Promise<{
  ctx: Context
  adapter: TeamAdapter
  gateway: FakeGateway
  backend: MemoryStorageBackend
  fiber: ReturnType<Context['plugin']>
  team: Runtime.SuperagentTeam
}> {
  const ctx = new Context()
  contexts.push(ctx)
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
  const adapter = options.adapter ?? new TeamAdapter()
  ctx.llm.registerAdapter(['test-provider'], adapter)
  await mountAgentLoopTestHarness(ctx)
  await ctx.plugin(Storage)
  const backend = new MemoryStorageBackend(new MemoryMediaPool())
  backends.push(backend)
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => {
      await facility.closeAll()
      unmount()
    }
  })
  const directory = await mkdtemp(join(tmpdir(), 'superagent-team-'))
  directories.push(directory)
  const gateway = options.gateway ?? new FakeGateway()
  ctx.provide('botGateway', gateway)
  if (options.worktrees !== undefined) ctx.provide('worktrees', options.worktrees as never)
  const fiber = ctx.plugin({ name: Runtime.name, inject: Runtime.inject, Config: Runtime.Config, apply: Runtime.apply }, {
    directory,
    provider: options.provider ?? 'test-provider',
    model: options.model ?? 'test-model',
    policyVersion: 'p1',
    appUser: 'app-user',
    allowedSenders: options.allowedSenders ?? ['ou_1'],
    bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'tomato-team' },
    pollSeconds: options.pollSeconds ?? 0,
    botOpenId: options.botOpenId ?? 'ou_bot',
    scope: 'change',
    limit: 10,
    workerPreset: '',
    permissionPreset: '',
    maxOutputTokens: options.maxOutputTokens ?? 0,
    isolate: options.isolate ?? false,
    replies: options.replies ?? false,
  })
  try {
    await fiber.await()
  } catch (error: unknown) {
    throw new Error(`mount failed: ${String(error)}`)
  }
  const team = ctx.get('superagent')
  if (team === undefined) throw new Error('the runtime did not publish its team')
  return { ctx, adapter, gateway, backend, fiber, team }
}

describe('superagent runtime', () => {
  it('turns one bot request into a planned, run, and reviewed ticket', async () => {
    const { adapter, team } = await harness()
    const report = await team.runOnce()

    expect(report.cycle.verdicts).toEqual([
      expect.objectContaining({ kind: 'accepted' }),
    ])
    expect(report.worked).toHaveLength(1)
    const outcome = report.worked[0]
    expect(typeof outcome?.ticket).toBe('string')
    expect(outcome).toMatchObject({ state: 'ready', review: { decision: 'handoff' } })

    const [ticket] = team.tickets()
    expect(ticket?.subject).toBe('the tier field on the creator detail page')
    expect(ticket?.supervisor).toBe(SUPERVISOR_SESSION)
    expect(ticket?.mandate.scope).toBe('change')
    expect(ticket?.review).toEqual({ findings: [], rounds: 1 })
    // Plan, work, review: three model turns, in that order.
    expect(adapter.requests).toHaveLength(3)
  })

  it('serves the current ticket summaries through its own Remote service', async () => {
    const { ctx, team } = await harness({ adapter: new TeamAdapter('REPORT: waiting') })
    await team.runOnce()

    await expect(ctx.superagentTickets.list(new AbortController().signal)).resolves.toEqual([
      expect.objectContaining({ subject: 'the tier field on the creator detail page', state: 'waiting' }),
    ])
  })

  it('retries a failed store opening for both Remote reads and a later cycle', async () => {
    const { ctx, team, backend } = await harness()
    const open = vi.spyOn(backend.kv, 'open').mockRejectedValueOnce(new Error('open failed'))

    await expect(ctx.superagentTickets.list(new AbortController().signal)).rejects.toThrow('open failed')
    await expect(ctx.superagentTickets.list(new AbortController().signal)).resolves.toEqual([])
    expect(open).toHaveBeenCalledTimes(2)
    await team.runOnce()
    expect(team.tickets()).toHaveLength(1)
  })

  it('drains a deferred Remote open and closes the domain during disposal', async () => {
    const { ctx, backend, fiber } = await harness()
    const gate = Promise.withResolvers<undefined>()
    const open = backend.kv.open.bind(backend.kv)
    let closed = 0
    const opening = vi.spyOn(backend.kv, 'open').mockImplementationOnce(async (descriptor) => {
      await gate.promise
      const unit = await open(descriptor)
      const wrapped = Object.create(unit) as typeof unit
      wrapped.close = async () => { closed += 1; await unit.close() }
      return wrapped
    })
    const reading = ctx.superagentTickets.list(new AbortController().signal)
    await vi.waitFor(() => { expect(opening).toHaveBeenCalledOnce() })
    let disposed = false
    const disposing = fiber.dispose().then(() => { disposed = true })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(disposed).toBe(false)

    gate.resolve(undefined)
    await expect(reading).rejects.toThrow('the team is disposed')
    await disposing
    expect(disposed).toBe(true)
    expect(closed).toBe(1)
  })

  it('disposes the operation scope and reports a store close failure', async () => {
    const { ctx, fiber, backend } = await harness()
    const open = backend.kv.open.bind(backend.kv)
    let closed = 0
    vi.spyOn(backend.kv, 'open').mockImplementationOnce(async (descriptor) => {
      const unit = await open(descriptor)
      const wrapped = Object.create(unit) as typeof unit
      wrapped.close = async () => {
        closed += 1
        await unit.close()
        throw new Error('close failed')
      }
      return wrapped
    })
    await ctx.superagentTickets.list(new AbortController().signal)
    const logError = vi.spyOn(ctx.logger, 'error')

    const [disposal] = await Promise.allSettled([fiber.dispose()])
    expect(closed).toBe(1)
    expect(ctx.get('superagentOperationScope')).toBeUndefined()
    if (disposal?.status === 'rejected') expect(String(disposal.reason)).toContain('close failed')
    else expect(logError.mock.calls.flat().map(String).join('\n')).toContain('close failed')
  })

  it('stops new Agent work and drains in-flight intake during disposal', async () => {
    const gateway = new FakeGateway(1, 80)
    const read = vi.spyOn(gateway, 'events')
    const { team, adapter, fiber } = await harness({
      gateway, adapter: new TeamAdapter('REPORT: waiting'),
    })
    const running = team.runOnce()
    await vi.waitFor(() => { expect(read).toHaveBeenCalledOnce() })
    let disposed = false
    const disposing = fiber.dispose().then(() => { disposed = true })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(disposed).toBe(false)

    await disposing
    await expect(running).rejects.toThrow('the team is disposed')
    expect(adapter.requests).toHaveLength(0)
  })

  it('keeps an active worker and its completion listener alive until the reported state is stored', async () => {
    const gate = Promise.withResolvers<undefined>()
    const adapter = new TeamAdapter('REPORT: waiting', gate.promise)
    const { ctx, team, backend } = await harness({ adapter })
    const running = team.runOnce()
    await vi.waitFor(() => { expect(adapter.requests).toHaveLength(2) })
    let disposed = false
    const disposing = ctx.fiber.dispose().then(() => { disposed = true })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(disposed).toBe(false)

    gate.resolve(undefined)
    await expect(running).rejects.toThrow('the team is disposed')
    await disposing
    const records = [...backend.pool.media.values()].flatMap(medium =>
      [...medium.tables.values()].flatMap(table => [...table.values()]))
    const persisted = JSON.stringify(records)
    expect(persisted).toContain('"state":"waiting"')
    expect(persisted).not.toContain('"state":"failed"')
  })

  it('does not create a worker when directory resolution finishes after disposal', async () => {
    const directory = Promise.withResolvers<{ path: string }>()
    const { ctx, team, fiber, adapter } = await harness({
      isolate: true,
      worktrees: { create: () => directory.promise },
    })
    const createAgent = vi.spyOn(ctx.agents, 'create')
    const running = team.runOnce()
    await vi.waitFor(() => { expect(adapter.requests).toHaveLength(1) })
    const disposing = fiber.dispose()
    directory.resolve({ path: '/tmp/late-worker' })

    await expect(running).rejects.toThrow('the team is disposed')
    await disposing
    expect(createAgent).toHaveBeenCalledTimes(2)
    expect(adapter.requests).toHaveLength(1)
  })

  it('records the intake outcome and nested refusal reason without message contents', async () => {
    const home = await mkdtemp(join(tmpdir(), 'superagent-logs-'))
    directories.push(home)
    vi.stubEnv('TOMATO_HOME', home)
    const { team } = await harness({ allowedSenders: ['ou_outsider'] })
    await team.runOnce()

    const diagnostics = await readFile(join(home, 'logs', 'superagent.log'), 'utf8')
    expect(diagnostics).toContain('outcomes')
    expect(diagnostics).toContain('stored(reached=0)')
    expect(diagnostics).toContain('refused(actor-not-allowed)')
    expect(diagnostics).not.toContain('给达人详情页加 tier 字段')
  })

  it('reads nothing new on the next cycle and keeps the cursor', async () => {
    const { team } = await harness()
    await team.runOnce()
    const second = await team.runOnce()
    expect(second.cycle.verdicts).toEqual([])
    expect(second.worked).toEqual([])
    expect(team.tickets()).toHaveLength(1)
  })

  it('refuses a scope the engine does not define', async () => {
    const { ctx } = await harness()
    await expect(Promise.resolve(ctx.plugin({
      name: Runtime.name, inject: Runtime.inject, Config: Runtime.Config, apply: Runtime.apply,
    }, {
      directory: '/tmp',
      provider: 'test-provider',
      model: 'test-model',
      policyVersion: 'p1',
      appUser: 'app-user',
      allowedSenders: [],
      bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'x' },
      pollSeconds: 0,
      botOpenId: '',
      scope: 'everything',
      limit: 1,
      workerPreset: '',
      permissionPreset: '',
      isolate: false,
      replies: false,
      maxOutputTokens: 0,
    }))).rejects.toThrow('scope must be investigate, change, or release')
  })
})
describe('superagent runtime polling', () => {
  it('works the team on its own schedule, skips an overlapping tick, and survives a failing read', async () => {
    const ctx = new Context()
    contexts.push(ctx)
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
    const adapter = new TeamAdapter()
    ctx.llm.registerAdapter(['test-provider'], adapter)
    await mountAgentLoopTestHarness(ctx)
    await ctx.plugin(Storage)
    const backend = new MemoryStorageBackend(new MemoryMediaPool())
    ctx.effect(() => ctx.storage.backend.register('fixture', backend))
    const facility = new DomainFacility(ctx, { backend: 'fixture' })
    ctx.effect(() => {
      const unmount = ctx.storage.mount('domain', facility)
      ctx.provide('storageDomain', facility)
      return async () => {
        await facility.closeAll()
        unmount()
      }
    })
    const directory = await mkdtemp(join(tmpdir(), 'superagent-timer-'))
    directories.push(directory)
    const gateway = new FakeGateway()
    vi.spyOn(gateway, 'events').mockRejectedValueOnce(new Error('service down'))
    ctx.provide('botGateway', gateway)
    const warn = vi.spyOn(ctx.logger, 'warn')
    await ctx.plugin({ name: Runtime.name, inject: Runtime.inject, Config: Runtime.Config, apply: Runtime.apply }, {
      directory,
      provider: 'test-provider',
      model: 'test-model',
      policyVersion: 'p1',
      appUser: 'app-user',
      allowedSenders: ['ou_1'],
      bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'tomato-team' },
      pollSeconds: 0.02,
      botOpenId: 'ou_bot',
      scope: 'change',
      limit: 10,
      workerPreset: '',
      permissionPreset: '',
      isolate: false,
      replies: false,
      maxOutputTokens: 0,
    })
    // A failing read is logged, and the next tick still runs the team.
    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('cycle failed: Error: service down'))
    })
    const team = ctx.get('superagent')
    if (team === undefined) throw new Error('the runtime did not publish its team')
    await vi.waitFor(() => { expect(team.tickets()).toHaveLength(1) }, { timeout: 5_000 })
    // Disposal stops the schedule: no further cycles run.
    await ctx.fiber.dispose()
    const worked = team.tickets().length
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(team.tickets()).toHaveLength(worked)
  })
})

describe('superagent runtime edge paths', () => {
  it('works a request without an open id configured for the bot', async () => {
    const { team } = await harness({ botOpenId: '', adapter: new TeamAdapter('REPORT: waiting') })
    const report = await team.runOnce()
    expect(report.worked).toHaveLength(1)
  })

  it('records work that stopped short of ready without asking for a review', async () => {
    const { team } = await harness({
      adapter: new TeamAdapter('The service needs a shared field.\nREPORT: blocked - waiting on the client change'),
    })
    const report = await team.runOnce()
    expect(report.worked).toHaveLength(1)
    expect(report.worked[0]).toMatchObject({ state: 'blocked' })
  })

  it('leaves a repeated event to the ticket it already reached', async () => {
    const { team } = await harness({ gateway: new FakeGateway(2), adapter: new TeamAdapter('REPORT: waiting') })
    const first = await team.runOnce()
    expect(first.cycle.verdicts[0]).toMatchObject({ kind: 'accepted' })
    const second = await team.runOnce()
    expect(second.cycle.verdicts[0]).toMatchObject({ kind: 'continued' })
    expect(second.worked).toEqual([])
  })

  it('skips a tick while a cycle is still working', async () => {
    const { team } = await harness({
      gateway: new FakeGateway(1, 120),
      pollSeconds: 0.02,
      adapter: new TeamAdapter('REPORT: waiting'),
    })
    // Several ticks fire while the first read is still waiting; exactly one cycle results.
    await vi.waitFor(() => { expect(team.tickets()).toHaveLength(1) }, { timeout: 5_000 })
    expect(team.tickets()).toHaveLength(1)
  })
})

describe('superagent runtime defaults', () => {
  it('publishes no tickets until its store opens, and builds its own client when none is published', async () => {
    const ctx = new Context()
    contexts.push(ctx)
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
    ctx.llm.registerAdapter(['test-provider'], new TeamAdapter())
    await mountAgentLoopTestHarness(ctx)
    await ctx.plugin(Storage)
    const backend = new MemoryStorageBackend(new MemoryMediaPool())
    ctx.effect(() => ctx.storage.backend.register('fixture', backend))
    const facility = new DomainFacility(ctx, { backend: 'fixture' })
    ctx.effect(() => {
      const unmount = ctx.storage.mount('domain', facility)
      ctx.provide('storageDomain', facility)
      return async () => {
        await facility.closeAll()
        unmount()
      }
    })
    const directory = await mkdtemp(join(tmpdir(), 'superagent-default-'))
    directories.push(directory)
    // No bot service is published and no bot open id is configured: the runtime builds its own client.
    await ctx.plugin({ name: Runtime.name, inject: Runtime.inject, Config: Runtime.Config, apply: Runtime.apply }, {
      directory,
      provider: 'test-provider',
      model: 'test-model',
      policyVersion: 'p1',
      appUser: 'app-user',
      allowedSenders: ['ou_1'],
      bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'tomato-team' },
      pollSeconds: 0,
      botOpenId: '',
      scope: 'change',
      limit: 10,
      workerPreset: '',
      permissionPreset: '',
      isolate: false,
      replies: false,
      maxOutputTokens: 0,
    })
    const team = ctx.get('superagent')
    if (team === undefined) throw new Error('the runtime did not publish its team')
    // The store opens behind the service, so a caller that reads before the first cycle sees nothing.
    expect(team.tickets()).toEqual([])
  })
})

describe('superagent runtime isolation', () => {
  it('works each ticket in its own checkout and names that checkout on the assignment', async () => {
    const created: string[] = []
    const { team } = await harness({
      isolate: true,
      adapter: new TeamAdapter('REPORT: waiting'),
      worktrees: {
        create: async (_agent, request) => {
          const path = `/tmp/worktrees/${request.name ?? 'unknown'}`
          created.push(path)
          return { path }
        },
      },
    })
    const report = await team.runOnce()
    expect(created).toHaveLength(1)
    expect(report.worked).toHaveLength(1)
    const [ticket] = team.tickets()
    expect(ticket?.assignments[0]?.directory).toBe(created[0])
  })

  it('refuses to isolate when the Host carries no worktree service', async () => {
    await expect(harness({ isolate: true })).rejects.toThrow(
      'isolate needs the worktrees service on this Host',
    )
  })
})

describe('superagent runtime replies', () => {
  it('answers in the conversation with what it opened and how it went', async () => {
    const gateway = new FakeGateway()
    const { team } = await harness({ gateway, replies: true, adapter: new TeamAdapter('REPORT: waiting') })
    await team.runOnce()
    expect(gateway.replies).toEqual(['Opened: the tier field on the creator detail page\nState: waiting'])
  })

  it('says nothing when the option is off, and survives a service that refuses the reply', async () => {
    const quiet = new FakeGateway()
    const off = await harness({ gateway: quiet, replies: false })
    await off.team.runOnce()
    expect(quiet.replies).toEqual([])

    const refusing = new FakeGateway()
    refusing.refuseReplies = true
    const { team, ctx } = await harness({ gateway: refusing, replies: true })
    const warn = vi.spyOn(ctx.logger, 'warn')
    const report = await team.runOnce()
    expect(report.worked).toHaveLength(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('replying failed: Error: conversation was never observed'))
  })
})

describe('superagent runtime refusals', () => {
  it('answers nobody when the policy refuses the sender', async () => {
    const gateway = new FakeGateway()
    const { team } = await harness({ gateway, replies: true, allowedSenders: ['ou_outsider'] })
    const report = await team.runOnce()
    expect(report.cycle.verdicts[0]).toMatchObject({ kind: 'refused' })
    expect(gateway.replies).toEqual([])
  })
})

describe('superagent runtime ticket view', () => {
  it('records every ticket on the supervising session, with where it stands', async () => {
    const { team, ctx } = await harness({ adapter: new TeamAdapter('REPORT: waiting') })
    await team.runOnce()
    const supervisor = ctx.agents.list().find(agent => agent.session.id === SUPERVISOR_SESSION)
    if (supervisor === undefined) throw new Error('the runtime created no supervising session')
    const records = supervisor.session.snapshotEvents()
      .map(pluginRecordOf)
      .filter(record => record?.type === 'plugin:superagent-runtime/tickets')
    expect(records).toHaveLength(1)
    const recorded = records[0]?.data as { tickets: readonly { id: unknown }[] } | undefined
    expect(recorded?.tickets).toHaveLength(1)
    expect(typeof recorded?.tickets[0]?.id).toBe('string')
    expect(recorded?.tickets[0]).toMatchObject({
      subject: 'the tier field on the creator detail page',
      stage: 'idle',
      state: 'waiting',
      blocking: 0,
      rounds: 0,
    })
  })

  it('shows a ready ticket as one waiting on a person, and counts a clearing review', async () => {
    const { team, ctx } = await harness()
    await team.runOnce()
    const supervisor = ctx.agents.list().find(agent => agent.session.id === SUPERVISOR_SESSION)
    if (supervisor === undefined) throw new Error('the runtime created no supervising session')
    const latest = supervisor.session.snapshotEvents()
      .map(pluginRecordOf)
      .filter(record => record?.type === 'plugin:superagent-runtime/tickets')
      .at(-1)
    expect(latest?.data).toEqual({
      tickets: [expect.objectContaining({ stage: 'person', needs: 'review', state: 'ready', rounds: 1 })],
    })
  })
})

describe('superagent runtime model route', () => {
  it('inherits the Host default model when the deployment names none', async () => {
    const { team } = await harness({ provider: '', model: '', adapter: new TeamAdapter('REPORT: waiting') })
    const report = await team.runOnce()
    expect(report.worked).toHaveLength(1)
  })

  it('closes a Remote store opened while route verification is pending and fails', async () => {
    const route = Promise.withResolvers<undefined>()
    const adapter = new TeamAdapter()
    vi.spyOn(adapter, 'resolveModel').mockImplementationOnce(async () => {
      await route.promise
      throw new Error('route rejected')
    })
    const mounting = harness({ adapter })
    await vi.waitFor(() => { expect(backends).toHaveLength(1) })
    const ctx = contexts.at(-1)
    const backend = backends.at(-1)
    if (ctx === undefined || backend === undefined) throw new Error('the mounting fixture is unavailable')
    const openGate = Promise.withResolvers<undefined>()
    const open = backend.kv.open.bind(backend.kv)
    let closed = 0
    const opening = vi.spyOn(backend.kv, 'open').mockImplementationOnce(async (descriptor) => {
      await openGate.promise
      const unit = await open(descriptor)
      const wrapped = Object.create(unit) as typeof unit
      wrapped.close = async () => { closed += 1; await unit.close() }
      return wrapped
    })
    const reading = ctx.superagentTickets.list(new AbortController().signal)
    await vi.waitFor(() => { expect(opening).toHaveBeenCalledOnce() })

    route.resolve(undefined)
    await Promise.resolve()
    openGate.resolve(undefined)
    await Promise.allSettled([reading])
    await expect(mounting).rejects.toThrow('model route test-provider/test-model is unavailable')
    expect(closed).toBe(1)
  })

  it('refuses to mount when the configured route has no working adapter', async () => {
    const adapter = new TeamAdapter()
    vi.spyOn(adapter, 'resolveModel').mockRejectedValueOnce(new Error('adapter unavailable'))
    await expect(harness({ adapter })).rejects.toThrow('model route test-provider/test-model is unavailable')
  })
})

describe('superagent runtime without any model route', () => {
  it('refuses to mount instead of failing at the first turn', async () => {
    const ctx = new Context()
    contexts.push(ctx)
    await mountAgentLoopTestDependencies(ctx)
    await mountAgentLoopTestHarness(ctx)
    await ctx.plugin(Storage)
    const backend = new MemoryStorageBackend(new MemoryMediaPool())
    ctx.effect(() => ctx.storage.backend.register('fixture', backend))
    const facility = new DomainFacility(ctx, { backend: 'fixture' })
    ctx.effect(() => {
      const unmount = ctx.storage.mount('domain', facility)
      ctx.provide('storageDomain', facility)
      return async () => {
        await facility.closeAll()
        unmount()
      }
    })
    // No agent-default-model and no configured route: the mount must be refused.
    let failure = ''
    const refused = { name: Runtime.name, inject: Runtime.inject, Config: Runtime.Config, apply: Runtime.apply }
    const config = {
      directory: '/tmp',
      provider: '',
      model: '',
      policyVersion: 'p1',
      appUser: 'app-user',
      allowedSenders: [],
      bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'x' },
      pollSeconds: 0,
      botOpenId: '',
      scope: 'change',
      limit: 1,
      workerPreset: '',
      permissionPreset: '',
      maxOutputTokens: 0,
      isolate: false,
      replies: false,
    }
    try {
      await ctx.plugin(refused, config)
    } catch (error: unknown) {
      failure = String(error)
    }
    expect(failure).toContain('set provider and model, or mount @tomato/agent-default-model')
  })
})
