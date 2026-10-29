/** Goal-round failure ledger, repeated-failure reminders, and per-tool approval through real registries. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import Loader from '@tomato/cordis-plugin-loader'
import AgentRegistry, { agentEvents } from '@tomato/agent'
import type { Agent, AgentStatus } from '@tomato/agent'
import { createInboxStub, unsupportedModel } from '@tomato/agent-loop-testkit'
import { GoalId } from '@tomato/goal'
import { createToolResultMessage, createUserMessage, HarnessError, ToolCallId } from '@tomato/llm'
import type { ContextFormed, UserMessage } from '@tomato/llm'
import SessionStore, { SessionId } from '@tomato/session'
import type { Session } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime, { defineTool } from '@tomato/tools'
import type { ToolExecutionResult } from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import { executeToolFixture } from '@tomato/tool-testkit'
import ApprovalService from '@tomato/user-approval'
import type { ApprovalOutcome } from '@tomato/user-approval'
import * as focus from '@tomato/experimental-focus'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    'focus-test': { kind: 'focus-test' } & ContextFormed
  }
}

const contexts: Context[] = []
const SIGNAL = new AbortController().signal

afterEach(async () => {
  vi.restoreAllMocks()
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
})

interface Harness {
  readonly ctx: Context
  readonly agent: Agent
  readonly session: Session
  readonly fiber: Context['fiber']
}

async function harness(config: focus.Config = {}, options: { approval?: boolean } = {}): Promise<Harness> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(NativeToolExecutor)
  if (options.approval !== false) await ctx.plugin(ApprovalService, { policy: 'ask' })
  const fiber = await ctx.plugin(focus, config)
  ctx.tools.register(defineTool({
    name: 'search_creators',
    description: 'test tool that fails while `fail` is true',
    parameters: { query: { type: 'string', required: true }, fail: { type: 'boolean' } },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    execute(args) {
      if (args.fail === true) return Promise.reject(new HarnessError(`quota exceeded for ${args.query}\nretry later`, 'QUOTA_EXCEEDED'))
      return Promise.resolve(`found ${args.query}`)
    },
  }))
  ctx.tools.register(defineTool({
    name: 'send_email',
    description: 'test tool with an external effect',
    parameters: {},
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    execute: () => Promise.resolve('sent'),
  }))
  const session = ctx.sessions.create(SessionId(`focus-${Math.random()}`))
  let status: AgentStatus = 'running'
  const agent: Agent = {
    id: session.id,
    options: {},
    session,
    model: unsupportedModel(),
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
  await ctx.agents.register(agent)
  // Approval audit events must be enclosed by a turn, as the loop opens one before tool calls.
  session.append('turn/start', { turn: 1 })
  return { ctx, agent, session, fiber }
}

const GOAL = GoalId('goal-1')

function roundMessage(round: number, goalId = GOAL): UserMessage {
  return createUserMessage({
    content: [{ type: 'text', text: `<goal_round>Round: ${round}</goal_round>` }],
    source: { kind: 'goal', goalId, revision: 1, round },
  })
}

/** Commit a goal round message as the loop admits it. */
function admitRound(session: Session, round: number, goalId = GOAL): void {
  session.append('user/message', roundMessage(round, goalId), { surfaceOp: 'append' })
}

/** Run one call through the real pipeline and log its call and result as the loop does. */
async function run(test: Harness, args: Record<string, unknown>, name = 'search_creators', parent?: symbol): Promise<ToolExecutionResult> {
  const callId = ToolCallId(`call-${Math.random()}`)
  test.session.append('tool/call', { turn: 1, step: 1, callId, name, arguments: JSON.stringify(args) })
  const result = await executeToolFixture(test.ctx, {
    signal: SIGNAL,
    callId,
    name,
    arguments: args,
    agent: test.agent,
    ...parent === undefined ? {} : { parent: parent as never },
  })
  test.session.append('tool/result', {
    turn: 1,
    step: 1,
    message: createToolResultMessage({ callId, content: result.content, isError: result.isError }),
    ...result.isError && result.error.info !== undefined ? { error: { name: result.error.info.name, code: result.error.info.code } } : {},
  }, { surfaceOp: 'append' })
  return result
}

function reminders(result: ToolExecutionResult): string[] {
  return (result.additionalContexts ?? [])
    .filter(context => context.source.kind === 'experimental-focus')
    .map(context => context.content.map(block => block.type === 'text' ? block.text : '').join(''))
}

/** Run the pre-step waterfall with the proposed messages and return the focus messages it added. */
async function preStep(test: Harness, proposed: UserMessage[]): Promise<string[]> {
  const decision = await agentEvents(test.ctx, test.agent).waterfall(
    'agent/pre-step',
    { modelSelection: { provider: 'mock', model: 'mock' }, messages: proposed, turn: 1, step: 1, signal: SIGNAL },
    () => Promise.resolve({ kind: 'enter' as const, messages: proposed }),
  )
  if (decision.kind !== 'enter') return []
  return decision.messages
    .filter(message => message.source.kind === 'experimental-focus')
    .map(message => message.content.map(block => block.type === 'text' ? block.text : '').join(''))
}

describe('plugin exports and configuration', () => {
  it('keeps the Loader namespace intact and defaults its policy', () => {
    const loader = Object.create(Loader.prototype) as Loader
    expect(loader.unwrapExports(focus)).toBe(focus)
    expect('default' in focus).toBe(false)
    expect(focus.name).toBe('experimental-focus')
    expect(focus.Config({})).toEqual({ repeatedFailureThreshold: 2, maxLedgerEntries: 5, maxMessageChars: 200, approvalTools: [] })
  })

  it('rejects invalid policy when applied directly', async () => {
    const test = await harness()
    await test.fiber.dispose()
    const cases: [focus.Config, string][] = [
      [{ repeatedFailureThreshold: 1 }, 'repeatedFailureThreshold must be a safe integer of at least 2'],
      [{ maxLedgerEntries: 0 }, 'maxLedgerEntries must be a safe integer of at least 1'],
      [{ maxMessageChars: 10 }, 'maxMessageChars must be a safe integer of at least 40'],
      [{ approvalTools: [' '] }, 'approvalTools entries must be non-empty patterns'],
    ]
    for (const [config, message] of cases) {
      await expect(focus.apply(test.ctx, config)).rejects.toThrow(message)
    }
  })

  it('applies directly with documented defaults', async () => {
    const test = await harness()
    await test.fiber.dispose()
    const fiber = await test.ctx.plugin({ name: 'focus-direct', inject: focus.inject, apply: (ctx: Context) => focus.apply(ctx, {}) })
    admitRound(test.session, 1)
    await run(test, { query: 'a', fail: true })
    expect(reminders(await run(test, { query: 'a', fail: true }))).toHaveLength(1)
    await fiber.dispose()
  })
})

describe('repeated-failure reminders', () => {
  it('reminds once the same call fails the same way twice in a goal round, and a success resets the streak', async () => {
    const test = await harness()
    admitRound(test.session, 1)
    expect(reminders(await run(test, { query: 'beauty', fail: true }))).toEqual([])
    expect(reminders(await run(test, { fail: true, query: 'beauty' }))).toEqual([
      'The search_creators call has now failed 2 times in a row with the same arguments and the same error (QUOTA_EXCEEDED). '
      + 'Repeating it unchanged will fail again. Inspect the error, then change the arguments or the approach, ask the user for what is missing, '
      + 'or report the blocker.',
    ])
    expect(reminders(await run(test, { query: 'other' }))).toEqual([])
    expect(reminders(await run(test, { query: 'beauty', fail: true }))).toEqual([])
  })

  it('keeps different arguments, cancellations, nested calls, and calls outside goal rounds out of the streak', async () => {
    const test = await harness()
    expect(reminders(await run(test, { query: 'x', fail: true }))).toEqual([])
    expect(reminders(await run(test, { query: 'x', fail: true }))).toEqual([])
    admitRound(test.session, 1)
    expect(reminders(await run(test, { query: 'a', fail: true }))).toEqual([])
    expect(reminders(await run(test, { query: 'b', fail: true }))).toEqual([])
    expect(reminders(await run(test, { query: 'a', fail: true }, 'search_creators', Symbol('outer')))).toEqual([])
    // Cancellation during pre-execute policy reaches post-execute as an ABORTED_BEFORE_DISPATCH failure.
    const aborting = new AbortController()
    const stop = test.ctx.on('tools/pre-execute', (exec, next) => {
      if (exec.callId === ToolCallId('cancelled')) {
        aborting.abort()
        return Promise.resolve({ kind: 'cancel' as const })
      }
      return next()
    })
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const cancelled = await executeToolFixture(test.ctx, {
        signal: aborting.signal, callId: ToolCallId('cancelled'), name: 'search_creators', arguments: { query: 'a', fail: true }, agent: test.agent,
      })
      expect(cancelled.isError && cancelled.error.info?.code).toBe('ABORTED_BEFORE_DISPATCH')
      expect(reminders(cancelled)).toEqual([])
    }
    stop()
    expect(reminders(await executeToolFixture(test.ctx, {
      signal: SIGNAL, callId: ToolCallId('agentless'), name: 'search_creators', arguments: { query: 'a', fail: true },
    }))).toEqual([])
  })

  it('adds its reminder to a downstream block without dropping the block or its contexts', async () => {
    const test = await harness()
    const downstream = createUserMessage({ content: [{ type: 'text', text: 'downstream' }], source: { kind: 'focus-test' } })
    let block = false
    // Registered after focus; focus prepends itself, so this policy still runs as its `next()`.
    test.ctx.on('tools/post-execute', (_exec, _result, next) => block
      ? Promise.resolve({ kind: 'block', feedback: [{ type: 'text', text: 'blocked' }], additionalContexts: [downstream] })
      : next())
    admitRound(test.session, 1)
    await run(test, { query: 'a', fail: true })
    block = true
    const result = await run(test, { query: 'a', fail: true })
    expect(result.content).toEqual([{ type: 'text', text: 'blocked' }])
    expect(result.additionalContexts?.map(context => context.source.kind)).toEqual(['experimental-focus', 'focus-test'])
  })
})

describe('goal-round ledger', () => {
  it('appends the failures of the current goal to its next round and nothing when none failed', async () => {
    const test = await harness({ maxMessageChars: 40 })
    admitRound(test.session, 1)
    expect(await preStep(test, [roundMessage(2)])).toEqual([])
    await run(test, { query: 'a-very-long-query-that-overflows-the-line', fail: true })
    await run(test, { query: 'a-very-long-query-that-overflows-the-line', fail: true })
    await run(test, { query: 'b', fail: true })
    const [ledger] = await preStep(test, [roundMessage(2)])
    expect(ledger).toBe([
      'Failures so far in this goal (do not repeat a failed call unchanged; change the approach, ask the user, or report the blocker):',
      '- search_creators failed 1× (QUOTA_EXCEEDED, latest in round 1): quota exceeded for b',
      '- search_creators failed 2× (QUOTA_EXCEEDED, latest in round 1): quota exceeded for a-very-long-query-th…',
    ].join('\n'))
  })

  it('omits the ledger for steps without a round, a round of another goal, or a rejected or cancelled step', async () => {
    const test = await harness()
    admitRound(test.session, 1)
    await run(test, { query: 'a', fail: true })
    const human = createUserMessage({ content: [{ type: 'text', text: 'hi' }], source: { kind: 'user' } })
    expect(await preStep(test, [human])).toEqual([])
    expect(await preStep(test, [roundMessage(1, GoalId('goal-2'))])).toEqual([])
    const removed = await agentEvents(test.ctx, test.agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [roundMessage(2)], turn: 1, step: 1, signal: SIGNAL },
      () => Promise.resolve({ kind: 'enter' as const, messages: [] }),
    )
    expect(removed).toEqual({ kind: 'enter', messages: [] })
    const rejected = await agentEvents(test.ctx, test.agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [roundMessage(2)], turn: 1, step: 1, signal: SIGNAL },
      () => Promise.resolve({ kind: 'reject' as const }),
    )
    expect(rejected).toEqual({ kind: 'reject' })
    const aborted = new AbortController()
    aborted.abort()
    const message = roundMessage(2)
    const cancelled = await agentEvents(test.ctx, test.agent).waterfall(
      'agent/pre-step',
      { modelSelection: { provider: 'mock', model: 'mock' }, messages: [message], turn: 1, step: 1, signal: aborted.signal },
      () => Promise.resolve({ kind: 'enter' as const, messages: [message] }),
    )
    expect(cancelled).toEqual({ kind: 'enter', messages: [message] })
  })

  it('resets the ledger for a new goal and bounds it by maxLedgerEntries', async () => {
    const test = await harness({ maxLedgerEntries: 1 })
    admitRound(test.session, 1)
    await run(test, { query: 'a', fail: true })
    await run(test, { query: 'b', fail: true })
    admitRound(test.session, 2)
    const [ledger] = await preStep(test, [roundMessage(3)])
    expect(ledger?.split('\n')).toHaveLength(2)
    expect(ledger).toContain('quota exceeded for b')
    admitRound(test.session, 1, GoalId('goal-2'))
    expect(await preStep(test, [roundMessage(2, GoalId('goal-2'))])).toEqual([])
  })

  it('identifies calls by canonical arguments and keeps malformed argument text', () => {
    expect(focus.failureSignature('t', '{not json', 'E')).toBe(focus.failureSignature('t', '{not json', 'E'))
    expect(focus.failureSignature('t', '{not json', 'E')).not.toBe(focus.failureSignature('t', '{not json!', 'E'))
    expect(focus.failureSignature('t', '{"b":1,"a":[{"d":2,"c":3}]}', 'E')).toBe(focus.failureSignature('t', { a: [{ c: 3, d: 2 }], b: 1 }, 'E'))
    expect(focus.failureSignature('t', {}, 'E')).not.toBe(focus.failureSignature('t', {}, 'F'))
    expect(focus.renderLedger([])).toBe('')
  })

  it('folds the logged history: rounds, code-less and cancelled failures, results without calls, and other tools', async () => {
    const test = await harness()
    const commit = (callId: string, name: string, args: string, result: { isError: boolean; code?: string; text?: string }) => {
      const id = ToolCallId(callId)
      test.session.append('tool/call', { turn: 1, step: 1, callId: id, name, arguments: args })
      test.session.append('tool/result', {
        turn: 1,
        step: 1,
        message: createToolResultMessage({ callId: id, content: [{ type: 'reasoning', text: 'x' }, { type: 'text', text: result.text ?? 'Error: plain failure' }], isError: result.isError }),
        ...result.code === undefined ? {} : { error: { name: 'E', code: result.code } },
      }, { surfaceOp: 'append' })
    }
    // Outside a goal, nothing is tracked.
    commit('before', 'search_creators', '{}', { isError: true })
    const human = createUserMessage({ content: [{ type: 'text', text: 'hi' }], source: { kind: 'user' } })
    test.session.append('user/message', human, { surfaceOp: 'append' })
    test.session.append('user/message', createUserMessage({ content: [{ type: 'text', text: 'r0' }], source: { kind: 'goal', goalId: GOAL, revision: 1, round: 0 } }), { surfaceOp: 'append' })
    expect(await preStep(test, [roundMessage(1)])).toEqual([])
    admitRound(test.session, 1)
    admitRound(test.session, 1)
    commit('plain', 'search_creators', '{}', { isError: true })
    commit('aborted', 'search_creators', '{}', { isError: true, code: 'ABORTED' })
    commit('other-ok', 'send_email', '{}', { isError: false })
    test.session.append('tool/result', {
      turn: 1, step: 1, message: createToolResultMessage({ callId: ToolCallId('orphan'), content: [{ type: 'text', text: 'x' }], isError: true }),
    }, { surfaceOp: 'append' })
    const [ledger] = await preStep(test, [roundMessage(2)])
    expect(ledger?.split('\n').slice(1)).toEqual(['- search_creators failed 1× (error, latest in round 1): plain failure'])
  })
})

describe('per-tool approval', () => {
  it('asks before each matching call, runs it once approved, and denies it when rejected', async () => {
    const test = await harness({ approvalTools: ['send_*'] })
    const outcomes: ApprovalOutcome[] = ['allowed-once', 'rejected']
    const asked: string[] = []
    test.ctx.on('approval/request', (request) => {
      asked.push(`${request.toolName}: ${request.reason ?? ''} | ${request.displayReason?.zh ?? ''}`)
      return Promise.resolve(outcomes.shift() ?? 'unavailable')
    })
    expect((await run(test, {}, 'send_email')).isError).toBe(false)
    const denied = await run(test, {}, 'send_email')
    expect(denied.isError && denied.error.message).toBe('the user rejected tool "send_email"')
    expect((await run(test, { query: 'q' })).isError).toBe(false)
    expect(asked).toEqual([
      'send_email: Tool "send_email" is configured to require approval before each call. | 允许运行 send_email 吗？该工具配置为每次调用前询问。',
      'send_email: Tool "send_email" is configured to require approval before each call. | 允许运行 send_email 吗？该工具配置为每次调用前询问。',
    ])
  })

  it('keeps an earlier denial, skips agent-less calls, and fails closed without an approval service', async () => {
    const test = await harness({ approvalTools: ['send_email'] })
    const ask = vi.fn(() => Promise.resolve<ApprovalOutcome>('allowed-once'))
    test.ctx.on('approval/request', ask)
    test.ctx.on('tools/pre-execute', (exec, next) => exec.name === 'send_email' && (exec.arguments as { deny?: boolean }).deny === true
      ? Promise.resolve({ kind: 'deny' as const, reason: 'denied upstream' })
      : next())
    const denied = await run(test, { deny: true }, 'send_email')
    expect(denied.isError && denied.error.message).toBe('denied upstream')
    expect((await executeToolFixture(test.ctx, { signal: SIGNAL, callId: ToolCallId('x'), name: 'send_email', arguments: {} })).isError).toBe(false)
    expect(ask).not.toHaveBeenCalled()

    const bare = await harness({ approvalTools: ['send_email'] }, { approval: false })
    const result = await run(bare, {}, 'send_email')
    expect(result.isError && result.error.message).toBe('Tool "send_email" is configured to require approval before each call.')
  })

  it('counts a code-less live failure and reminds with a block that carries no contexts', async () => {
    const test = await harness()
    test.ctx.tools.register(defineTool({
      name: 'plain_fail',
      description: 'fails without a stable code',
      parameters: {},
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
      execute: () => Promise.reject(new Error('plain')),
    }))
    let block = false
    test.ctx.on('tools/post-execute', (_exec, _result, next) => block
      ? Promise.resolve({ kind: 'block', feedback: [{ type: 'text', text: 'blocked' }] })
      : next())
    admitRound(test.session, 1)
    await run(test, {}, 'plain_fail')
    block = true
    const result = await run(test, {}, 'plain_fail')
    expect(reminders(result)).toEqual([expect.stringContaining('the same error (error)')])
  })

  it('registers no approval listener without configured patterns', async () => {
    const test = await harness()
    const ask = vi.fn(() => Promise.resolve<ApprovalOutcome>('rejected'))
    test.ctx.on('approval/request', ask)
    expect((await run(test, {}, 'send_email')).isError).toBe(false)
    expect(ask).not.toHaveBeenCalled()
  })
})
