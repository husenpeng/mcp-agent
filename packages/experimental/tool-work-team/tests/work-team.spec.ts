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
import * as toolWorkTeam from '../src/index.ts'

const testToolSignal = new AbortController().signal

/** In-memory Rbot registry that records every published specification. */
class FakeRobots extends Robots {
  readonly published: RobotSpec[] = []
  private nextSpec = 0

  override async publish(spec: RobotSpec): Promise<RobotSpecRevision> {
    this.published.push(spec)
    this.nextSpec += 1
    return {
      ref: { spec: `rbot-${String(this.nextSpec)}` as RobotSpecRef['spec'], revision: 1 },
      spec,
      publishedAt: this.nextSpec,
    }
  }
  override async revision(ref: RobotSpecRef): Promise<RobotSpecRevision | undefined> {
    const index = Number(ref.spec.replace('rbot-', '')) - 1
    const spec = this.published[index]
    return spec === undefined ? undefined : { ref, spec, publishedAt: index + 1 }
  }
  override async specs(): Promise<readonly RobotSpecRevision[]> {
    return this.published.map((spec, index) => ({
      ref: { spec: `rbot-${String(index + 1)}` as RobotSpecRef['spec'], revision: 1 },
      spec,
      publishedAt: index + 1,
    }))
  }
  override async instantiate(ref: RobotSpecRef): Promise<Robot> {
    return { id: `robot-${ref.spec}` as RobotId, name: '', spec: ref, state: 'idle', createdAt: 0 }
  }
  override async rebind(robot: RobotId, ref: RobotSpecRef): Promise<Robot> {
    return { id: robot, name: '', spec: ref, state: 'idle', createdAt: 0 }
  }
  override async robot(): Promise<Robot | undefined> { return undefined }
  override async robots(): Promise<readonly Robot[]> { return [] }
  override async install(robot: RobotId): Promise<Robot> {
    return { id: robot, name: '', spec: { spec: 'rbot-1' as RobotSpecRef['spec'], revision: 1 }, state: 'idle', createdAt: 0 }
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
    return { ref: { spec: 'crew-1' as CrewSpecRef['spec'], revision: 1 }, spec, publishedAt: 0 }
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
  const message = createUserMessage({ content: [{ type: 'text', text: 'build my team' }], source: { kind: 'user' } })
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
  const fiber = await ctx.plugin(toolWorkTeam)
  const root = await stubAgent(ctx, `work-team-root-${String(Math.random())}`)
  openHumanTurn(root)
  return { ctx, root, fiber }
}

async function execute(ctx: Context, args: Record<string, unknown>, agent: Agent): Promise<ToolExecutionResult> {
  return ctx.agents.withInitiator(agent, () => executeToolFixture(ctx, {
    signal: testToolSignal,
    callId: ToolCallId(`call-${String(Math.random())}`),
    name: 'work_team_create',
    arguments: args,
    agent,
  }))
}

const TEAM_ARGS = {
  name: 'Launch team',
  mission: 'Ship the launch',
  members: [
    { id: 'research', label: 'Researcher', role: 'Find the facts', instruction: 'Collect the facts' },
    { id: 'brief', label: 'Brief writer', role: 'Write the brief', instruction: 'Draft the brief', kind: 'reviewer' },
  ],
}

describe('work_team_create', () => {
  it('registers one tool and disposes it with the mounting fiber', async () => {
    const { ctx, fiber } = await harness()
    expect(ctx.tools.get('work_team_create')?.name).toBe('work_team_create')
    await fiber.dispose()
    expect(ctx.tools.get('work_team_create')).toBeUndefined()
  })

  it('creates one robot per member with the default route and publishes the crew', async () => {
    const { ctx, root } = await harness()
    const robots = ctx.get('robots') as FakeRobots
    const crews = ctx.get('crews') as FakeCrews
    const result = await execute(ctx, TEAM_ARGS, root.agent)
    expect(result.isError).toBe(false)
    expect(robots.published).toHaveLength(2)
    expect(robots.published.map(spec => spec.name)).toEqual(['Researcher', 'Brief writer'])
    for (const spec of robots.published) {
      expect(spec.goal.model).toEqual({ provider: 'blueai', model: 'DeepSeek-V4.1-Flash-1017' })
      expect(spec.capability.permissionPreset).toBe('workspace-write')
      expect(spec.capability.sandbox).toBe('workspace')
    }
    expect(crews.published?.nodes).toHaveLength(2)
    expect(crews.published?.nodes[0]?.robot).toEqual({ spec: 'rbot-1', revision: 1 })
    expect(crews.published?.nodes[1]?.robot).toEqual({ spec: 'rbot-2', revision: 1 })
    expect(crews.published?.nodes[1]?.kind).toBe('reviewer')
  })

  it('chains members in order when no edges are given', async () => {
    const { ctx, root } = await harness()
    const crews = ctx.get('crews') as FakeCrews
    await execute(ctx, TEAM_ARGS, root.agent)
    expect(crews.published?.edges).toEqual([{ from: 'research', to: 'brief', kind: 'handoff', when: 'always' }])
  })

  it('honors explicit edges and per-member model overrides', async () => {
    const { ctx, root } = await harness()
    const robots = ctx.get('robots') as FakeRobots
    const crews = ctx.get('crews') as FakeCrews
    await execute(ctx, {
      ...TEAM_ARGS,
      members: [
        { ...TEAM_ARGS.members[0], provider: 'blueai-anthropic', model: 'claude-sonnet-5-5' },
        TEAM_ARGS.members[1],
      ],
      edges: [{ from: 'brief', to: 'research', kind: 'review' }],
    }, root.agent)
    expect(robots.published[0]?.goal.model).toEqual({ provider: 'blueai-anthropic', model: 'claude-sonnet-5-5' })
    expect(robots.published[1]?.goal.model).toEqual({ provider: 'blueai', model: 'DeepSeek-V4.1-Flash-1017' })
    expect(crews.published?.edges).toEqual([{ from: 'brief', to: 'research', kind: 'review', when: 'always' }])
  })

  it('gives a member the turns and budget it names and keeps the default for the rest', async () => {
    const { ctx, root } = await harness()
    const crews = ctx.get('crews') as FakeCrews
    await execute(ctx, {
      ...TEAM_ARGS,
      members: [
        { ...TEAM_ARGS.members[0], maxTurns: 4, budgetTokens: 400_000 },
        TEAM_ARGS.members[1],
      ],
    }, root.agent)
    expect(crews.published?.nodes[0]?.maxTurns).toBe(4)
    expect(crews.published?.nodes[0]?.budgetTokens).toBe(400_000)
    expect(crews.published?.nodes[1]?.maxTurns).toBe(1)
    expect(crews.published?.nodes[1]?.budgetTokens).toBe(60_000)
  })

  it('rejects a team with fewer than two members', async () => {
    const { ctx, root } = await harness()
    const result = await execute(ctx, { ...TEAM_ARGS, members: [TEAM_ARGS.members[0]] }, root.agent)
    expect(result.isError).toBe(true)
  })

  it('publishes a team larger than six members', async () => {
    const { ctx, root } = await harness()
    const crews = ctx.get('crews') as FakeCrews
    const members = Array.from({ length: 7 }, (_, index) => ({
      id: `step-${String(index)}`,
      label: `Step ${String(index)}`,
      role: `Own step ${String(index)}`,
      instruction: `Finish step ${String(index)}`,
    }))
    const result = await execute(ctx, { ...TEAM_ARGS, members }, root.agent)
    expect(result.isError).toBe(false)
    expect(crews.published?.nodes).toHaveLength(7)
  })

  it('requires a direct human turn', async () => {
    const { ctx, root } = await harness()
    // A fresh agent with no admitted human message in its open turn.
    const other = await stubAgent(ctx, `work-team-nohuman-${String(Math.random())}`)
    other.session.append('turn/start', { turn: 1 })
    const result = await execute(ctx, TEAM_ARGS, other.agent)
    expect(result.isError).toBe(true)
    void root
  })
})
