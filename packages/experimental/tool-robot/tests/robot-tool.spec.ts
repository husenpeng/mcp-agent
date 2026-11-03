import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import AgentRegistry from '@tomato/agent'
import type { Agent, AgentStatus, Inbox } from '@tomato/agent'
import Robots, {
  RobotSpecValidationError,
} from '@tomato/experimental-robot'
import type {
  Robot, RobotId, RobotSpec, RobotSpecId, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, Run, RunId,
} from '@tomato/experimental-robot'
import { createUserMessage, ToolCallId } from '@tomato/llm'
import type { ContextFormed, MessageSource } from '@tomato/llm'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    'test': { kind: 'test' } & ContextFormed
  }
}
import SessionStore, { Session, SessionId } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime, { type ToolExecutionResult } from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import { executeToolFixture } from '@tomato/tool-testkit'
import { createInboxStub, unsupportedModel } from '@tomato/agent-loop-testkit'
import * as toolRobot from '../src/index.ts'

const testToolSignal = new AbortController().signal

/** In-memory robot provider that records the published specification and revision binding. */
class FakeRobots extends Robots {
  published: RobotSpec | undefined
  instantiated: RobotSpecRef | undefined
  rejection: readonly RobotSpecIssue[] | undefined

  override async publish(spec: RobotSpec): Promise<RobotSpecRevision> {
    if (this.rejection !== undefined) throw new RobotSpecValidationError(this.rejection)
    this.published = spec
    return { ref: { spec: 'spec-1' as RobotSpecId, revision: 1 }, spec, publishedAt: 0 }
  }

  override async instantiate(ref: RobotSpecRef): Promise<Robot> {
    this.instantiated = ref
    return { id: 'robot-1' as RobotId, name: this.published?.name ?? '', spec: ref, state: 'idle', createdAt: 0 }
  }

  override async revision(): Promise<RobotSpecRevision | undefined> { return undefined }

  override async specs(): Promise<readonly RobotSpecRevision[]> { return [] }

  override async rebind(robot: RobotId, ref: RobotSpecRef): Promise<Robot> {
    return { id: robot, name: '', spec: ref, state: 'idle', createdAt: 0 }
  }

  override async robot(): Promise<Robot | undefined> { return undefined }

  override async robots(): Promise<readonly Robot[]> { return [] }

  override async start(robot: RobotId): Promise<Run> {
    return {
      id: 'run-1' as RunId, robot, spec: { spec: 'spec-1' as RobotSpecId, revision: 1 },
      state: 'queued', input: { message: '' }, startedAt: 0,
    }
  }

  override async cancel(): Promise<void> {}

  override async finish(): Promise<void> {}

  override async attachSession(): Promise<void> {}

  override async run(): Promise<Run | undefined> { return undefined }

  override async runs(): Promise<readonly Run[]> { return [] }
}

interface StubAgent {
  readonly agent: Agent
  readonly session: Session
  readonly inbox: Inbox
}

/** Build one registry-compatible live agent on the harness Context. */
async function stubAgent(ctx: Context, rawId: string): Promise<StubAgent> {
  const session = ctx.sessions.create(SessionId(`session-${rawId}`))
  const inbox = createInboxStub()
  const agent: Agent = {
    id: session.id,
    options: {},
    session,
    model: unsupportedModel(),
    inbox,
    status: 'running' as AgentStatus,
    ctx,
    send: () => {},
    followup: () => {},
    steer: () => ({ outcome: Promise.resolve({ status: 'rejected' as const }) }),
    inject(input) { this.inbox.append('next-step', input) },
    cancel() {},
    runMaintenance: task => task(new AbortController().signal),
    whenIdle() { return Promise.resolve() },
  }
  await ctx.agents.register(agent)
  return { agent, session, inbox }
}

/** Open a turn and admit one human message into it. */
function openHumanTurn(stub: StubAgent, text = 'please create a robot'): void {
  const turn = nextTurn(stub)
  const message = createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
  stub.inbox.append('next-turn', message)
  const claimed = stub.inbox.splice('next-turn', 0, 1, [])
  if (claimed.length === 0) throw new Error('expected queued turn input')
  stub.session.append('turn/start', { turn })
  for (const admitted of claimed) stub.session.append('user/message', admitted, { surfaceOp: 'append' })
}

/** Open a turn without any human input. */
function openUnattendedTurn(stub: StubAgent, source: MessageSource): void {
  const turn = nextTurn(stub)
  stub.inbox.append('next-turn', createUserMessage({ content: [{ type: 'text', text: 'work' }], source }))
  const claimed = stub.inbox.splice('next-turn', 0, 1, [])
  stub.session.append('turn/start', { turn })
  for (const admitted of claimed) stub.session.append('user/message', admitted, { surfaceOp: 'append' })
}

function nextTurn(stub: StubAgent): number {
  return stub.session.snapshotEvents()
    .filter(event => event.type === 'turn/start')
    .reduce((max, event) => Math.max(max, event.data.turn), 0) + 1
}

async function harness() {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(NativeToolExecutor)
  await ctx.plugin(FakeRobots)
  const fiber = await ctx.plugin(toolRobot)
  const root = await stubAgent(ctx, `robot-tool-root-${String(Math.random())}`)
  return { ctx, root, fiber }
}

async function execute(ctx: Context, args: Record<string, unknown>, agent: Agent): Promise<ToolExecutionResult> {
  return ctx.agents.withInitiator(agent, () => executeToolFixture(ctx, {
    signal: testToolSignal,
    callId: ToolCallId(`call-${String(Math.random())}`),
    name: 'robot_create',
    arguments: args,
    agent,
  }))
}

function resultJson(result: ToolExecutionResult): Record<string, unknown> {
  expect(result.isError).toBe(false)
  if (result.isError) throw new Error('expected robot tool success')
  return result.value as Record<string, unknown>
}

describe('robot_create registration and defaults', () => {
  it('registers one tool and disposes it with the mounting fiber', async () => {
    const { ctx, fiber } = await harness()
    expect(ctx.tools.get('robot_create')?.name).toBe('robot_create')
    await fiber.dispose()
    expect(ctx.tools.get('robot_create')).toBeUndefined()
  })

  it('publishes the four basic fields over the shared defaults and instantiates the revision', async () => {
    const { ctx, root } = await harness()
    openHumanTurn(root)
    const robots = ctx.get('robots') as FakeRobots
    const value = resultJson(await execute(ctx, {
      name: 'Weekly digest',
      description: 'Summarizes the week',
      mission: 'Write a weekly summary from recent sessions',
      successCriteria: ['The summary names the week', 'No more than one page'],
    }, root.agent))
    expect(value).toMatchObject({ robotId: 'robot-1', name: 'Weekly digest', specId: 'spec-1', revision: 1 })
    expect(robots.instantiated).toEqual({ spec: 'spec-1', revision: 1 })
    expect(robots.published).toMatchObject({
      name: 'Weekly digest',
      description: 'Summarizes the week',
      goal: {
        mission: 'Write a weekly summary from recent sessions',
        successCriteria: ['The summary names the week', 'No more than one page'],
        triggers: [{ kind: 'manual' }],
        strategy: 'plan',
        budget: { tokens: 100_000, millis: 600_000, cost: 0, toolCalls: 100 },
      },
      capability: {
        tools: { allow: [], deny: [] },
        sandbox: 'workspace',
        permissionPreset: 'workspace',
        network: 'none',
      },
    })
  })

  it('omits a blank description and an empty success-criteria list', async () => {
    const { ctx, root } = await harness()
    openHumanTurn(root)
    const robots = ctx.get('robots') as FakeRobots
    await execute(ctx, { name: 'Quiet', description: '   ', mission: 'Do one small thing' }, root.agent)
    expect(robots.published?.description).toBeUndefined()
    expect(robots.published?.goal.successCriteria).toEqual([])
  })

  it('reports a provider rejection with its field paths', async () => {
    const { ctx, root } = await harness()
    openHumanTurn(root)
    const robots = ctx.get('robots') as FakeRobots
    robots.rejection = [{ path: 'name', message: 'must be unique' }]
    const result = await execute(ctx, { name: 'Duplicate', mission: 'Do work' }, root.agent)
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({ type: 'text', text: expect.stringContaining('name: must be unique') })
    expect(robots.instantiated).toBeUndefined()
  })
})

describe('robot_create authority', () => {
  it('rejects a turn without a direct human message on a root agent', async () => {
    const { ctx, root } = await harness()
    openUnattendedTurn(root, { kind: 'test' })
    const result = await execute(ctx, { name: 'Nope', mission: 'Do work' }, root.agent)
    expect(result.error?.info?.code).toBe('ROBOT_TOOL_AUTHORITY_REQUIRED')
    expect((ctx.get('robots') as FakeRobots).published).toBeUndefined()
  })
})
