/** The in-process executor against the production AgentLoop and a scripted model. */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@tomato/agent-loop-testkit'
import { Context } from '@tomato/cordis'
import { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@tomato/llm'
import { InMemoryStore, accept, runAssignment, runReview, ticketStage } from '@tomato/superagent'
import { SessionId } from '@tomato/session'
import type { ActorId, Mandate, MandateId, TicketId, Trigger, TriggerId } from '@tomato/superagent'
import {
  createInProcessReviewer,
  createInProcessSupervisor,
  createInProcessWorker,
  reportOf,
  supervisionOf,
} from '../src/index.ts'

const directories: string[] = []
const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

/** A model that answers with fixed text. */
class ScriptedAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []

  #index = 0

  constructor(
    /** One answer per request; the last one repeats once the script runs out. */
    private readonly answers: string | readonly string[],
    /** Runs once the answer starts streaming, so a test can interleave events. */
    private readonly during?: () => void,
  ) {
    super()
  }

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    this.during?.()
    const script = typeof this.answers === 'string' ? [this.answers] : this.answers
    const answer = script[Math.min(this.#index, script.length - 1)] ?? ''
    this.#index += 1
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: answer }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: answer } }
    yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 8 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

/** Mount the loop and return a context whose agents the worker can create. */
async function harness(answer: string | readonly string[], during?: () => void): Promise<{ ctx: Context; adapter: ScriptedAdapter }> {
  const ctx = new Context()
  contexts.push(ctx)
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
  const adapter = new ScriptedAdapter(answer, during)
  ctx.llm.registerAdapter(['test-provider'], adapter)
  await mountAgentLoopTestHarness(ctx)
  return { ctx, adapter }
}

/** The in-process worker with the test model route. */
function worker(ctx: Context, directory: string) {
  return createInProcessWorker(ctx, { directoryOf: async () => directory, model: { provider: 'test-provider', model: 'test-model' } })
}

const TRIGGER: Trigger = {
  id: 'feishu:evt-1' as TriggerId,
  source: 'feishu',
  threads: [{ source: 'feishu', id: 'oc_1:om_root' }],
  actor: 'ou_1' as ActorId,
  human: true,
  addressed: 'mention',
  at: '2026-11-14T00:00:00.000Z',
  text: '给达人详情页加 tier 字段',
  meta: { chatType: 'group' },
}

const MANDATE: Mandate = {
  id: 'mandate-1' as MandateId,
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: ['feishu:mention'],
  sender: 'ou_1' as ActorId,
  thread: { source: 'feishu', id: 'oc_1:om_root' },
  at: '2026-11-14T00:00:00.000Z',
}

/** One accepted ticket in a fresh store. */
function accepted(store: InMemoryStore): TicketId {
  return accept(store, {
    id: 'ticket-1' as TicketId,
    subject: '给达人详情页加 tier 字段',
    mandate: MANDATE,
    thread: { source: 'feishu', id: 'oc_1:om_root' },
    supervisor: 'supervisor-session',
  }).id
}

describe('in-process worker', () => {
  it('runs one ticket in its own session, reads the report line, and drives the ticket', async () => {
    const { ctx, adapter } = await harness('Changed both repositories.\nREPORT: ready - PRs opened')
    const directory = await mkdtemp(join(tmpdir(), 'superagent-worker-'))
    directories.push(directory)
    const store = new InMemoryStore()
    const ticketId = accepted(store)

    const ticket = (await runAssignment(store, ticketId, worker(ctx, directory))).ticket

    const assignment = ticket.assignments[0]
    expect(assignment?.session.startsWith('superagent-worker-ticket-1')).toBe(true)
    expect(assignment?.directory).toBe(directory)
    expect(ticket.assignments[0]?.report).toEqual({ state: 'ready', summary: 'PRs opened' })
    expect(ticketStage(ticket)).toEqual({ stage: 'working' })
    // The brief reached the model, and the worker asked once.
    expect(adapter.requests).toHaveLength(1)
    expect(JSON.stringify(adapter.requests[0]?.messages)).toContain('给达人详情页加 tier 字段')
    expect(JSON.stringify(adapter.requests[0]?.messages)).toContain('REPORT: <state>')
  })

  it('reads a turn that ends without a marker as waiting and frees the slot', async () => {
    const { ctx } = await harness('still reading the diff')
    const directory = await mkdtemp(join(tmpdir(), 'superagent-worker-'))
    directories.push(directory)
    const store = new InMemoryStore()
    const ticketId = accepted(store)

    const ticket = (await runAssignment(store, ticketId, worker(ctx, directory))).ticket
    expect(ticket.assignments[0]?.report).toEqual({ state: 'waiting' })
    expect(ticketStage(ticket)).toEqual({ stage: 'idle' })
  })
})

describe('turn outcome', () => {
  it('maps an error reason and a cancellation to their reports without reading text', () => {
    expect(reportOf({ text: 'REPORT: ready', reason: { kind: 'error', error: { code: 'provider', message: 'quota' } } }))
      .toEqual({ state: 'failed', summary: 'provider: quota' })
    expect(reportOf({ text: 'REPORT: ready', reason: { kind: 'aborted', reason: { kind: 'user' } } }))
      .toEqual({ state: 'dropped', summary: 'the run was cancelled' })
    expect(reportOf({ text: 'REPORT: ready', reason: { kind: 'max-steps' } as never }))
      .toEqual({ state: 'failed', summary: 'the run ended with max-steps' })
    expect(reportOf({ text: '', reason: undefined }))
      .toEqual({ state: 'failed', summary: 'the run ended without a turn result' })
  })
})


describe('worker isolation', () => {
  it('ignores events of another session while its run is live', async () => {
    const other: { session?: ReturnType<Context['sessions']['create']> } = {}
    const { ctx } = await harness('REPORT: ready', () => {
      // Another Session reports while this run is streaming; the run must not read it.
      other.session?.append('turn/end', { reason: { kind: 'completed' } } as never)
    })
    other.session = ctx.sessions.create(SessionId('someone-else'))
    const directory = await mkdtemp(join(tmpdir(), 'superagent-worker-'))
    directories.push(directory)
    const store = new InMemoryStore()
    const ticket = (await runAssignment(store, accepted(store), worker(ctx, directory))).ticket
    // The foreign turn end did not overwrite this run's own report.
    expect(ticket.assignments[0]?.report).toEqual({ state: 'ready' })
  })

  it('disposes the run once, so a second run on the same lease does not re-dispose it', async () => {
    const { ctx } = await harness('REPORT: ready')
    const directory = await mkdtemp(join(tmpdir(), 'superagent-worker-'))
    directories.push(directory)
    const inProcess = worker(ctx, directory)
    const brief = { ticket: 'ticket-1' as TicketId, subject: 'one task', mandate: MANDATE }
    const lease = await inProcess.lease(brief)
    expect(await lease.run(brief)).toEqual({ state: 'ready' })
    // The lease is spent: running it again fails, and its disposal stays idempotent.
    await expect(lease.run(brief)).rejects.toThrow()
  })
})

describe('in-process reviewer', () => {
  it('reads a failing verdict and sends the work back through the engine', async () => {
    const { ctx, adapter } = await harness([
      'Changed both repositories.\nREPORT: ready - PRs opened',
      ['FINDING: p0 apps/web/page.tsx:12 the page component exceeds 200 lines', 'REVIEW: fail'].join('\n'),
    ])
    const directory = await mkdtemp(join(tmpdir(), 'superagent-review-'))
    directories.push(directory)
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    const workerCtx = createInProcessWorker(ctx, { directoryOf: async () => directory, model: { provider: 'test-provider', model: 'test-model' } })
    await runAssignment(store, ticketId, workerCtx)

    const reviewed = await runReview(store, ticketId, createInProcessReviewer(ctx, {
      directoryOf: async () => directory, model: { provider: 'test-provider', model: 'test-model' },
    }))
    expect(reviewed.decision).toMatchObject({ decision: 'revise' })
    expect(reviewed.ticket.review?.findings).toEqual([
      { summary: 'the page component exceeds 200 lines', severity: 'p0', file: 'apps/web/page.tsx', line: 12 },
    ])
    expect(ticketStage(reviewed.ticket)).toEqual({ stage: 'working' })
    expect(adapter.requests).toHaveLength(2)
    expect(JSON.stringify(adapter.requests[1]?.messages)).toContain('This is review round 1.')
  })

  it('clears the work when the reviewer passes, so a person sees it', async () => {
    const { ctx } = await harness(['REPORT: ready', 'REVIEW: pass'])
    const directory = await mkdtemp(join(tmpdir(), 'superagent-review-'))
    directories.push(directory)
    const store = new InMemoryStore()
    const ticketId = accepted(store)
    await runAssignment(store, ticketId, createInProcessWorker(ctx, {
      directoryOf: async () => directory, model: { provider: 'test-provider', model: 'test-model' },
    }))
    const reviewed = await runReview(store, ticketId, createInProcessReviewer(ctx, {
      directoryOf: async () => directory, model: { provider: 'test-provider', model: 'test-model' },
    }))
    expect(reviewed.decision).toEqual({ decision: 'handoff' })
    expect(ticketStage(reviewed.ticket)).toEqual({ stage: 'person', action: 'review' })
  })
})

describe('in-process supervisor', () => {
  it('reads the work a request becomes and opens it through the engine', async () => {
    const { ctx, adapter } = await harness([
      'DECISION: change the service field in services-monorepo-im',
      'DECISION: investigate whether the client needs a migration',
    ].join('\n'))
    const directory = await mkdtemp(join(tmpdir(), 'superagent-plan-'))
    directories.push(directory)
    const supervisor = createInProcessSupervisor(ctx, {
      directory, model: { provider: 'test-provider', model: 'test-model' },
    })
    const decision = await supervisor.supervise({ trigger: TRIGGER, policyVersion: 'p1' })
    expect(decision).toEqual({
      accepted: true,
      plans: [
        { scope: 'change', subject: 'the service field in services-monorepo-im' },
        { scope: 'investigate', subject: 'whether the client needs a migration' },
      ],
    })
    expect(JSON.stringify(adapter.requests[0]?.messages)).toContain('给达人详情页加 tier 字段')
  })

  it('refuses a run that cannot start instead of opening work nobody decided on', async () => {
    const { ctx } = await harness('DECISION: change something')
    const directory = await mkdtemp(join(tmpdir(), 'superagent-plan-'))
    directories.push(directory)
    const supervisor = createInProcessSupervisor(ctx, {
      directory, model: { provider: 'test-provider', model: 'test-model' },
    })
    vi.spyOn(ctx.agents, 'create').mockRejectedValueOnce(new Error('no capacity'))
    await expect(supervisor.supervise({ trigger: TRIGGER, policyVersion: 'p1' })).rejects.toThrow('no capacity')
  })

  it('declines a turn that ended badly, or never ended, rather than opening work', () => {
    expect(supervisionOf({ text: 'DECISION: change x', reason: { kind: 'error', error: { code: 'provider', message: 'quota' } } }))
      .toEqual({ accepted: false, reason: 'the supervision turn ended with error', plans: [] })
    expect(supervisionOf({ text: 'DECISION: change x', reason: undefined }))
      .toEqual({ accepted: false, reason: 'the supervision turn ended without a result', plans: [] })
    expect(supervisionOf({ text: 'DECISION: change x', reason: { kind: 'completed' } }))
      .toEqual({ accepted: true, plans: [{ scope: 'change', subject: 'x' }] })
  })
})
