/** The app source end to end: submit, watch, cancel, continue with new context, and stop. */
import { mkdtemp, rm } from 'node:fs/promises'
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
import * as Runtime from '../src/index.ts'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'

const contexts: Context[] = []
const directories: string[] = []

beforeEach(async () => {
  const home = await mkdtemp(join(tmpdir(), 'superagent-app-home-'))
  directories.push(home)
  vi.stubEnv('TOMATO_HOME', home)
})

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
  vi.unstubAllEnvs()
})

/** A model that plans, works, and reviews; the work turn can be held open for a cancel. */
class AppAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []
  /** What the work turn reports; `ready` by default. */
  workAnswer = 'Changed the page.\nREPORT: ready - done'
  /** When set, decides the work answer from the prompt instead of `workAnswer`. */
  answerFor?: (prompt: string) => string
  /** While set, every work turn waits for this gate before answering. */
  workGate?: Promise<undefined> | undefined

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    const prompt = JSON.stringify(options.messages)
    const supervise = prompt.includes('You supervise a team')
    if (!supervise && this.workGate !== undefined) {
      const gate = this.workGate
      const signal = options.signal
      await new Promise<undefined>((resolve, reject) => {
        const abort = (): void => { reject(new Error('the turn was cancelled')) }
        if (signal?.aborted) { abort(); return }
        signal?.addEventListener('abort', abort, { once: true })
        void gate.then(() => { signal?.removeEventListener('abort', abort); resolve(undefined) })
      })
    }
    const answer = supervise
      ? 'DECISION: change the tier field on the creator detail page'
      : prompt.includes('Review the result')
        ? 'REVIEW: pass'
        : this.answerFor?.(prompt) ?? this.workAnswer
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: answer }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: answer } }
    yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 8 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

/** Mount the loop, storage, and an app-only team (no bot service). */
async function harness(options: {
  adapter?: AppAdapter
  bot?: { baseUrl: string; userId: string }
  gateway?: BotGateway
  allowedSenders?: string[]
  appUser?: string
  replies?: boolean
} = {}): Promise<{
  ctx: Context
  adapter: AppAdapter
  team: Runtime.SuperagentTeam
}> {
  const ctx = new Context()
  contexts.push(ctx)
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
  const adapter = options.adapter ?? new AppAdapter()
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
  const directory = await mkdtemp(join(tmpdir(), 'superagent-app-'))
  directories.push(directory)
  if (options.gateway !== undefined) ctx.provide('botGateway', options.gateway)
  const fiber = ctx.plugin({ name: Runtime.name, inject: Runtime.inject, Config: Runtime.Config, apply: Runtime.apply }, {
    directory,
    provider: 'test-provider',
    model: 'test-model',
    policyVersion: 'p1',
    allowedSenders: options.allowedSenders ?? [],
    ...options.bot === undefined ? {} : { bot: options.bot },
    appUser: options.appUser ?? 'app-user',
    pollSeconds: 0,
    botOpenId: '',
    scope: 'change',
    limit: 10,
    workerPreset: '',
    permissionPreset: '',
    maxOutputTokens: 0,
    isolate: false,
    replies: options.replies ?? false,
  })
  try {
    await fiber.await()
  } catch (error: unknown) {
    throw new Error(`mount failed: ${String(error)}`)
  }
  const team = ctx.get('superagent')
  if (team === undefined) throw new Error('the runtime did not publish its team')
  return { ctx, adapter, team }
}

/** Wait until the team's single ticket settled its expected number of runs. */
async function settled(team: Runtime.SuperagentTeam, runs = 1): Promise<Runtime.TicketSummary> {
  let summary: Runtime.TicketSummary | undefined
  await vi.waitFor(() => {
    const tickets = team.tickets()
    expect(tickets).toHaveLength(1)
    const ticket = tickets[0]
    if (ticket === undefined) throw new Error('no ticket yet')
    expect(ticket.assignments.length).toBeGreaterThanOrEqual(runs)
    const latest = ticket.assignments.at(-1)
    expect(latest?.ended).toBe(true)
    // A ready result also waits for its review to record.
    if (latest?.report?.state === 'ready') expect(ticket.review).toBeDefined()
    summary = Runtime.ticketSummary(ticket)
  }, { timeout: 5_000 })
  return summary as Runtime.TicketSummary
}

describe('superagent app source', () => {
  it('mounts without a bot service and turns a submitted request into reviewed work', async () => {
    const { adapter, team } = await harness()
    const result = await team.submit('给达人详情页加 tier 字段')
    expect(result.kind).toBe('accepted')
    if (result.kind !== 'accepted') throw new Error('expected acceptance')
    expect(result.tickets).toHaveLength(1)
    expect(result.tickets[0]).toMatchObject({ stage: 'working', running: false, stopped: false })

    const summary = await settled(team)
    expect(summary).toMatchObject({ stage: 'person', needs: 'review', state: 'ready', rounds: 1 })
    // Plan, work, review: three model turns, in that order.
    expect(adapter.requests).toHaveLength(3)
    // A cycle with no bot service reads nothing and still settles.
    const report = await team.runOnce()
    expect(report.cycle.verdicts).toEqual([])
    expect(report.worked).toEqual([])
  })

  it('refuses blank text and declines a release request without a model turn', async () => {
    const { adapter, team } = await harness()
    await expect(team.submit('   ')).rejects.toMatchObject({ code: 'superagent/empty-text' })
    const declined = await team.submit('把改动发布到生产环境')
    expect(declined).toMatchObject({ kind: 'declined', reason: 'a person owns the release' })
    expect(adapter.requests).toHaveLength(0)
    expect(team.tickets()).toEqual([])
  })

  it('continues an idle ticket with new context the next run reads', async () => {
    const adapter = new AppAdapter()
    adapter.workAnswer = 'I need the color choice.\nREPORT: waiting'
    const { team } = await harness({ adapter })
    await team.submit('给达人详情页加 tier 字段')
    const first = await settled(team)
    expect(first).toMatchObject({ stage: 'idle', state: 'waiting', running: false })
    const ticket = team.tickets()[0]
    if (ticket === undefined) throw new Error('no ticket')

    adapter.workAnswer = 'Used the blue tier badge.\nREPORT: ready - done'
    const updated = await team.message(ticket.id, '用蓝色，顺便改一下展示文案')
    expect(updated).toMatchObject({ id: ticket.id })
    const second = await settled(team, 2)
    expect(second).toMatchObject({ state: 'ready', rounds: 1 })
    const continued = team.tickets()[0]
    expect(continued?.assignments).toHaveLength(2)
    // The continuation run reads the person's message as its latest instruction.
    const workPrompts = adapter.requests
      .map(request => JSON.stringify(request.messages))
      .filter(prompt => prompt.includes('Work:'))
    expect(workPrompts.at(-1)).toContain('用蓝色，顺便改一下展示文案')
    expect(workPrompts.at(-1)).toContain('Messages from the person after the work was accepted')
    const detail = await team.detail(ticket.id)
    expect(detail.triggers.map(trigger => trigger.text)).toEqual([
      '给达人详情页加 tier 字段',
      '用蓝色，顺便改一下展示文案',
    ])
    expect(detail.triggers.every(trigger => trigger.source === 'app')).toBe(true)
  })

  it('cancels an in-flight run, keeps the ticket open, and continues it with a message', async () => {
    const adapter = new AppAdapter()
    const gate = Promise.withResolvers<undefined>()
    adapter.workGate = gate.promise
    const { team } = await harness({ adapter })
    await team.submit('给达人详情页加 tier 字段')
    await vi.waitFor(() => { expect(adapter.requests).toHaveLength(2) }, { timeout: 5_000 })
    const ticket = team.tickets()[0]
    if (ticket === undefined) throw new Error('no ticket')
    expect(Runtime.ticketSummary(ticket).running).toBe(true)

    const cancelled = await team.cancel(ticket.id)
    expect(cancelled).toMatchObject({ state: 'dropped', stage: 'idle', running: false, stopped: false })
    gate.resolve(undefined)

    // Nothing runs again until the person sends new context.
    adapter.workGate = undefined
    adapter.workAnswer = 'Resumed with the blue badge.\nREPORT: ready - done'
    await team.message(ticket.id, '继续，用蓝色')
    const resumed = await settled(team, 2)
    expect(resumed).toMatchObject({ state: 'ready', rounds: 1 })
    expect(team.tickets()[0]?.assignments).toHaveLength(2)
    // Cancelling an idle ticket is a structured refusal, not a silent no-op.
    await expect(team.cancel(ticket.id)).rejects.toMatchObject({ code: 'superagent/not-running' })
  })

  it('accumulates messages sent during a run as the next run context', async () => {
    const adapter = new AppAdapter()
    const gate = Promise.withResolvers<undefined>()
    adapter.workGate = gate.promise
    adapter.workAnswer = 'First pass.\nREPORT: waiting'
    const { team } = await harness({ adapter })
    await team.submit('给达人详情页加 tier 字段')
    await vi.waitFor(() => { expect(adapter.requests).toHaveLength(2) }, { timeout: 5_000 })
    const ticket = team.tickets()[0]
    if (ticket === undefined) throw new Error('no ticket')
    await team.message(ticket.id, '补充：只要移动端')
    gate.resolve(undefined)
    await vi.waitFor(() => {
      expect(team.tickets()[0]?.assignments.at(-1)?.report?.state).toBe('waiting')
    }, { timeout: 5_000 })
    // The queued message starts the next run on its own.
    adapter.workGate = undefined
    await vi.waitFor(() => {
      const prompts = adapter.requests.map(request => JSON.stringify(request.messages))
      expect(prompts.some(prompt => prompt.includes('补充：只要移动端'))).toBe(true)
    }, { timeout: 5_000 })
  })

  it('stops a ticket for good and refuses further messages', async () => {
    const adapter = new AppAdapter()
    adapter.workAnswer = 'REPORT: waiting'
    const { team } = await harness({ adapter })
    await team.submit('给达人详情页加 tier 字段')
    await settled(team)
    const ticket = team.tickets()[0]
    if (ticket === undefined) throw new Error('no ticket')
    const stopped = await team.stop(ticket.id)
    expect(stopped).toMatchObject({ stopped: true })
    await expect(team.message(ticket.id, '还在吗')).rejects.toMatchObject({ code: 'superagent/closed' })
    await expect(team.detail('ticket-missing')).rejects.toMatchObject({ code: 'superagent/not-found' })
    await expect(team.cancel(ticket.id)).rejects.toMatchObject({ code: 'superagent/not-running' })
  })

  it('stops an in-flight run when the ticket is stopped', async () => {
    const adapter = new AppAdapter()
    const gate = Promise.withResolvers<undefined>()
    adapter.workGate = gate.promise
    const { team } = await harness({ adapter })
    await team.submit('给达人详情页加 tier 字段')
    await vi.waitFor(() => { expect(adapter.requests).toHaveLength(2) }, { timeout: 5_000 })
    const ticket = team.tickets()[0]
    if (ticket === undefined) throw new Error('no ticket')
    const stopped = await team.stop(ticket.id)
    expect(stopped).toMatchObject({ stopped: true, state: 'dropped', running: false })
    gate.resolve(undefined)
  })

  it('reads the full flow through detail and the Remote operations', async () => {
    const { ctx, team } = await harness()
    const result = await ctx.superagentTickets.submit({ text: '给达人详情页加 tier 字段' })
    expect(result.kind).toBe('accepted')
    await settled(team)
    const ticket = team.tickets()[0]
    if (ticket === undefined) throw new Error('no ticket')
    const detail = await ctx.superagentTickets.detail({ ticket: ticket.id })
    expect(detail.mandate).toMatchObject({ scope: 'change', strength: 'explicit', policyVersion: 'p1', sender: 'app-user' })
    expect(detail.assignments).toHaveLength(1)
    expect(detail.assignments[0]).toMatchObject({ ended: true, report: { state: 'ready', summary: 'done' } })
    expect(detail.review).toEqual({ findings: [], rounds: 1 })
    expect(detail.ended).toBe(false)
    await expect(ctx.superagentTickets.message({ ticket: ticket.id, text: ' ' }))
      .rejects.toMatchObject({ code: 'superagent/empty-text' })
    const messaged = await ctx.superagentTickets.message({ ticket: ticket.id, text: '再加一个筛选' })
    expect(messaged.id).toBe(ticket.id)
    await vi.waitFor(() => {
      expect(team.tickets()[0]?.assignments.length).toBe(2)
    }, { timeout: 5_000 })
    const stopped = await ctx.superagentTickets.stop({ ticket: ticket.id })
    expect(stopped.stopped).toBe(true)
  })

  it('drains disposal while a queued ticket and a waiting cycle sit behind an in-flight run', async () => {
    const adapter = new AppAdapter()
    const gate = Promise.withResolvers<undefined>()
    adapter.workGate = gate.promise
    const { ctx, team } = await harness({ adapter })
    await team.submit('第一个请求')
    await vi.waitFor(() => { expect(adapter.requests).toHaveLength(2) }, { timeout: 5_000 })
    // A second ticket queues behind the gated run, and a hand cycle waits for the pump.
    const second = await team.submit('第二个请求')
    expect(second.kind).toBe('accepted')
    const cycling = team.runOnce()
    const disposing = ctx.fiber.dispose()
    await new Promise(resolve => setTimeout(resolve, 20))
    gate.resolve(undefined)
    await expect(cycling).rejects.toThrow('the team is disposed')
    await disposing
    expect(ctx.get('superagentOperationScope')).toBeUndefined()
  })

  it('streams the run start so a watcher sees the in-flight assignment', async () => {
    const adapter = new AppAdapter()
    const gate = Promise.withResolvers<undefined>()
    adapter.workGate = gate.promise
    const { ctx, team } = await harness({ adapter })
    const controller = new AbortController()
    const frames: { tickets: readonly Runtime.TicketSummary[] }[] = []
    const iterator = ctx.superagentTickets.watch(controller.signal)[Symbol.asyncIterator]()
    const collecting = (async () => {
      for (;;) {
        const frame = await iterator.next()
        if (frame.done) break
        frames.push(frame.value)
      }
    })()
    await team.submit('给达人详情页加 tier 字段')
    await vi.waitFor(() => {
      expect(frames.some(frame => frame.tickets.some(ticket => ticket.running))).toBe(true)
    }, { timeout: 5_000 })
    gate.resolve(undefined)
    controller.abort()
    await collecting
  })

  it('streams one frame now and one after every committed change', async () => {
    const { ctx, team } = await harness()
    const controller = new AbortController()
    const frames = ctx.superagentTickets.watch(controller.signal)[Symbol.asyncIterator]()
    const first = await frames.next()
    expect(first.done).toBe(false)
    expect(first.value).toEqual({ tickets: [] })
    const next = frames.next()
    await team.submit('给达人详情页加 tier 字段')
    const second = await next
    expect(second.done).toBe(false)
    if (second.done) throw new Error('the stream ended before the submission frame')
    expect(second.value.tickets).toHaveLength(1)
    controller.abort()
    await frames.return?.(undefined)
  })
})

describe('superagent feishu continuation', () => {
  it('works a reached ticket again with the new message as context', async () => {
    const pages: BotEvent[][] = [
      [event('evt-1', 'om_root', '给达人详情页加 tier 字段')],
      [event('evt-2', 'om_2', '顺便把展示文案也改一下', 'om_root')],
    ]
    let read = 0
    const gateway: BotGateway = {
      events: () => {
        const items = pages[read] ?? []
        read += 1
        return Promise.resolve({ items, nextCursor: read })
      },
      thread: () => Promise.reject(new Error('no history')),
      reply: () => Promise.resolve({ messageId: 'om_reply' }),
    }
    const adapter = new AppAdapter()
    adapter.workAnswer = 'REPORT: waiting'
    const { team } = await harness({
      adapter,
      bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'tomato-team' },
      gateway,
      allowedSenders: ['ou_1'],
    })
    const first = await team.runOnce()
    expect(first.worked).toHaveLength(1)
    expect(first.worked[0]).toMatchObject({ state: 'waiting' })
    const second = await team.runOnce()
    expect(second.cycle.verdicts[0]).toMatchObject({ kind: 'continued' })
    expect(second.worked).toHaveLength(1)
    const ticket = team.tickets()[0]
    expect(ticket?.assignments).toHaveLength(2)
    const prompts = adapter.requests.map(request => JSON.stringify(request.messages))
    expect(prompts.at(-1)).toContain('顺便把展示文案也改一下')
  })

  it('answers each accepted request with its own outcome when a continuation shares the cycle', async () => {
    const pages: BotEvent[][] = [
      [event('evt-1', 'om_root', '给达人详情页加 tier 字段')],
      [event('evt-2', 'om_2', '继续，用蓝色', 'om_root'), event('evt-3', 'om_other', '另一个请求')],
    ]
    let read = 0
    const replies: string[] = []
    const gateway: BotGateway = {
      events: () => {
        const items = pages[read] ?? []
        read += 1
        return Promise.resolve({ items, nextCursor: read })
      },
      thread: () => Promise.reject(new Error('no history')),
      reply: (_chatId, _messageId, text) => {
        replies.push(text)
        return Promise.resolve({ messageId: 'om_reply' })
      },
    }
    const adapter = new AppAdapter()
    adapter.answerFor = prompt => prompt.includes('继续，用蓝色') ? 'REPORT: ready - done' : 'REPORT: waiting'
    const { team } = await harness({
      adapter,
      bot: { baseUrl: 'http://127.0.0.1:8013', userId: 'tomato-team' },
      gateway,
      allowedSenders: ['ou_1'],
      replies: true,
    })
    await team.runOnce()
    const second = await team.runOnce()
    expect(second.cycle.verdicts.map(verdict => verdict.kind)).toEqual(['continued', 'accepted'])
    expect(second.worked).toHaveLength(2)
    // The new request's reply names its own waiting state, not the continuation's ready one.
    expect(replies.at(-1)).toBe('Opened: the tier field on the creator detail page\nState: waiting')
  })
})

/** One feishu event the fake service holds. */
function event(eventId: string, messageId: string, text: string, rootId?: string): BotEvent {
  return {
    cursor: 1,
    eventId,
    messageId,
    chatId: 'oc_1',
    chatType: 'group',
    messageType: 'text',
    content: JSON.stringify({ text }),
    senderOpenId: 'ou_1',
    mentionsBot: true,
    ...rootId === undefined ? {} : { rootId },
  }
}
