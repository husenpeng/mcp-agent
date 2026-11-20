import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import AgentRegistry from '@tomato/agent'
import type { Agent, Inbox } from '@tomato/agent'
import { createInboxStub, unsupportedModel } from '@tomato/agent-loop-testkit'
import Robots from '@tomato/experimental-robot'
import type { Robot, RobotId, RobotSpec, RobotSpecRef, RobotSpecRevision, Run } from '@tomato/experimental-robot'
import { Crews } from '@tomato/experimental-robot-crew'
import type { CrewEntry, CrewRun, CrewSpec, CrewSpecRef, CrewSpecRevision } from '@tomato/experimental-robot-crew'
import { createUserMessage, ToolCallId } from '@tomato/llm'
import SessionStore, { SessionId } from '@tomato/session'
import type { Session } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime, { type ToolExecutionResult } from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import { executeToolFixture } from '@tomato/tool-testkit'
import * as toolRobotCrew from '../src/index.ts'

const testToolSignal = new AbortController().signal

/** In-memory Rbot registry exposing two published agents. */
class FakeRobots extends Robots {
  private readonly revisions: readonly RobotSpecRevision[]

  constructor(ctx: Context) {
    super(ctx)
    const spec = (name: string): RobotSpec => ({
      name,
      position: { owner: 'me', callers: [], callees: [], escalation: [], visibility: 'team' },
      goal: {
        mission: `${name} mission`, successCriteria: [], triggers: [{ kind: 'manual' }], strategy: 'plan',
        stopConditions: [], failurePolicy: 'fail',
        budget: { tokens: 100_000, millis: 600_000, cost: 0, toolCalls: 100 }, maxConcurrentRuns: 1,
      },
      capability: {
        tools: { allow: [], deny: [] }, mcpServers: [], plugins: [], skills: [], workspaceRoots: [], dataClasses: [],
        credentials: [], sandbox: 'workspace', permissionPreset: 'workspace-write', network: 'none',
      },
      io: {
        input: { schema: 'robot.request', version: 1 },
        output: { schema: 'robot.result', format: 'markdown', delivery: 'chat' },
        acceptance: [],
      },
      memory: { read: [], write: [], recall: 'none' },
      a2a: { intents: [], peers: [] },
    })
    this.revisions = [
      { ref: { spec: 'rbot-research' as RobotSpecRef['spec'], revision: 1 }, spec: spec('Researcher'), publishedAt: 1 },
      { ref: { spec: 'rbot-brief' as RobotSpecRef['spec'], revision: 3 }, spec: spec('Brief writer'), publishedAt: 2 },
    ]
  }

  override async publish(): Promise<RobotSpecRevision> { throw new Error('not used') }
  override async revision(ref: RobotSpecRef): Promise<RobotSpecRevision | undefined> {
    return this.revisions.find(entry => entry.ref.spec === ref.spec && entry.ref.revision === ref.revision)
  }
  override async specs(): Promise<readonly RobotSpecRevision[]> { return this.revisions }
  override async instantiate(ref: RobotSpecRef): Promise<Robot> {
    return { id: 'robot-1' as RobotId, name: '', spec: ref, state: 'idle', createdAt: 0 }
  }
  override async rebind(robot: RobotId, ref: RobotSpecRef): Promise<Robot> {
    return { id: robot, name: '', spec: ref, state: 'idle', createdAt: 0 }
  }
  override async robot(): Promise<Robot | undefined> { return undefined }
  override async robots(): Promise<readonly Robot[]> { return [] }
  override async install(robot: RobotId): Promise<Robot> {
    return { id: robot, name: '', spec: { spec: 'rbot-research' as RobotSpecRef['spec'], revision: 1 }, state: 'idle', createdAt: 0 }
  }
  override async remove(): Promise<void> {}
  override async start(): Promise<Run> { throw new Error('not used') }
  override async cancel(): Promise<void> {}
  override async advance(): Promise<void> {}
  override async finish(): Promise<void> {}
  override async attachSession(): Promise<void> {}
  override async run(): Promise<Run | undefined> { return undefined }
  override async runs(): Promise<readonly Run[]> { return [] }
}

/** Crew provider that records the published specification. */
class FakeCrews extends Crews {
  published: CrewSpec | undefined

  override async publish(spec: CrewSpec): Promise<CrewSpecRevision> {
    this.published = spec
    return {
      ref: { spec: 'crew-1' as CrewSpecRef['spec'], revision: 1 },
      spec,
      publishedAt: 0,
    }
  }
  override async revision(): Promise<CrewSpecRevision | undefined> { return undefined }
  override async specs(): Promise<readonly CrewSpecRevision[]> { return [] }
  override async start(): Promise<CrewRun> { throw new Error('not used') }
  override async cancel(): Promise<void> {}
  override async run(): Promise<CrewRun | undefined> { return undefined }
  override async runs(): Promise<readonly CrewRun[]> { return [] }
  override async entries(): Promise<readonly CrewEntry[]> { return [] }
  override async append(): Promise<CrewEntry> { throw new Error('not used') }
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
    status: 'running',
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
function openHumanTurn(stub: StubAgent): void {
  const turn = stub.session.snapshotEvents()
    .filter(event => event.type === 'turn/start')
    .reduce((max, event) => Math.max(max, event.data.turn), 0) + 1
  const message = createUserMessage({ content: [{ type: 'text', text: 'orchestrate my agents' }], source: { kind: 'user' } })
  stub.inbox.append('next-turn', message)
  const claimed = stub.inbox.splice('next-turn', 0, 1, [])
  if (claimed.length === 0) throw new Error('expected queued turn input')
  stub.session.append('turn/start', { turn })
  for (const admitted of claimed) stub.session.append('user/message', admitted, { surfaceOp: 'append' })
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
  await ctx.plugin(FakeCrews)
  const fiber = await ctx.plugin(toolRobotCrew)
  const root = await stubAgent(ctx, `crew-tool-root-${String(Math.random())}`)
  openHumanTurn(root)
  return { ctx, root, fiber }
}

async function execute(ctx: Context, args: Record<string, unknown>, agent: Agent): Promise<ToolExecutionResult> {
  return ctx.agents.withInitiator(agent, () => executeToolFixture(ctx, {
    signal: testToolSignal,
    callId: ToolCallId(`call-${String(Math.random())}`),
    name: 'robot_crew_create',
    arguments: args,
    agent,
  }))
}

describe('robot_crew_create over published Rbots', () => {
  it('registers one tool and disposes it with the mounting fiber', async () => {
    const { ctx, fiber } = await harness()
    expect(ctx.tools.get('robot_crew_create')?.name).toBe('robot_crew_create')
    await fiber.dispose()
    expect(ctx.tools.get('robot_crew_create')).toBeUndefined()
  })

  it('binds members to existing Rbots by name and pins a requested revision', async () => {
    const { ctx, root } = await harness()
    const crews = ctx.get('crews') as FakeCrews
    const result = await execute(ctx, {
      name: 'Campaign crew',
      mission: 'Ship the brief',
      nodes: [
        {
          id: 'research', label: 'Research', role: 'Find the facts', instruction: 'Collect facts',
          robot: 'Researcher',
        },
        {
          id: 'brief', label: 'Brief', role: 'Write it', instruction: 'Draft the brief',
          kind: 'reviewer', robot: 'rbot-brief', robotRevision: 3,
        },
      ],
      edges: [{ from: 'research', to: 'brief', kind: 'handoff' }],
    }, root.agent)
    expect(result.isError).toBe(false)
    expect(crews.published?.nodes.map(node => node.robot)).toEqual([
      { spec: 'rbot-research', revision: 1 },
      { spec: 'rbot-brief', revision: 3 },
    ])
    expect(crews.published?.nodes[1]?.kind).toBe('reviewer')
    expect(crews.published?.edges).toEqual([{ from: 'research', to: 'brief', kind: 'handoff', when: 'always' }])
  })

  it('rejects an unknown Rbot and lists the published names', async () => {
    const { ctx, root } = await harness()
    const crews = ctx.get('crews') as FakeCrews
    const result = await execute(ctx, {
      name: 'Campaign crew',
      mission: 'Ship the brief',
      nodes: [{
        id: 'research', label: 'Research', role: 'Find the facts', instruction: 'Collect facts',
        robot: 'Ghost agent',
      }],
    }, root.agent)
    expect(result.isError).toBe(true)
    const text = result.content.map(block => block.type === 'text' ? block.text : '').join('')
    expect(text).toContain('Researcher, Brief writer')
    expect(crews.published).toBeUndefined()
  })
})
