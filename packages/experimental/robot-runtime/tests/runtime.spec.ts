import AgentRegistry, { AgentModel, modelSelectionProjectionDefinition } from '@tomato/agent'
import type { Agent, AgentHandle, CreateAgentOptions } from '@tomato/agent'
import { createInboxStub } from '@tomato/agent-loop-testkit'
import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { Context } from '@tomato/cordis'
import type { RobotSpec, Robots, Run, RunId } from '@tomato/experimental-robot'
import { isTerminalRunState } from '@tomato/experimental-robot'
import LocalRobots from '@tomato/experimental-robot-local'
import { createAssistantMessage, createUserMessage } from '@tomato/llm'
import SessionStore from '@tomato/session'
import type { Session, SessionEvent, SessionId, UserMessage } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import { apply, inject, name } from '../src/index.ts'

const BASE = {
  name: 'Reviewer',
  description: 'Reviews changes',
  position: {
    owner: 'alice',
    reportsTo: 'chief',
    callers: ['chief'],
    callees: ['chief'],
    escalation: ['chief'],
    visibility: 'team',
  },
  goal: {
    mission: 'Review changes',
    successCriteria: ['find defects'],
    triggers: [{ kind: 'manual' }],
    strategy: 'plan',
    stopConditions: ['done'],
    failurePolicy: 'retry',
    budget: { tokens: 1000, millis: 1000, cost: 0.1, toolCalls: 10 },
    maxConcurrentRuns: 1,
  },
  capability: {
    tools: { allow: ['read'], deny: ['bash'] },
    mcpServers: [] as string[],
    skills: [] as string[],
    workspaceRoots: ['/tmp/workspace'],
    dataClasses: ['internal'],
    credentials: [] as string[],
    sandbox: 'workspace',
    permissionPreset: 'workspace',
    network: 'allowlist',
  },
  io: {
    input: { schema: 'review.request', version: 1 },
    output: { schema: 'review.result', format: 'markdown', delivery: 'artifact' },
    acceptance: ['cites evidence'],
  },
  memory: { read: [], write: [], recall: 'none' },
  a2a: { intents: ['request'], peers: [] },
} satisfies RobotSpec

type MutableSpec = typeof BASE
type TurnEndReason = SessionEvent<'turn/end'>['data']['reason']

const copy = (): MutableSpec => structuredClone(BASE)

type Script = (session: Session, message: UserMessage, agent: Agent) => void

interface BenchOptions {
  failCreate?: string | Error
  withPresets?: boolean
  deferRuntime?: boolean
  hang?: boolean
  /** Registered tool names the runtime sees; each entry may also carry a description. */
  tools?: readonly { readonly name: string }[]
  /** Skill names the run's catalog offers. */
  skills?: readonly { readonly name: string }[]
  /** Whether the deployment mounts a skill registry at all. */
  skillRegistry?: boolean
  /** MCP servers the deployment has configured. */
  mcpServers?: readonly string[]
  /** Keep the first turn's Agent idle promise pending until its turn is cancelled. */
  hangAfterFirstTurn?: boolean
  /** Pause wait budget the composition configures, in milliseconds. */
  pauseTimeoutMs?: number
}

function completedText(text: string): Script {
  return (session, message) => {
    session.append('turn/start', { turn: 1 })
    session.append('step/start', { turn: 1, step: 1 })
    session.append('user/message', message, { surfaceOp: 'append' })
    session.append('assistant/message', {
      stream: [],
      turn: 1,
      step: 1,
      message: createAssistantMessage({
        content: [{ type: 'text', text }],
        source: { provider: 'test-provider', model: 'test-model' },
      }),
    }, { surfaceOp: 'append' })
    session.append('step/end', { turn: 1, step: 1 })
    session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  }
}

function ended(reason: TurnEndReason): Script {
  return (session, message) => {
    session.append('turn/start', { turn: 1 })
    session.append('user/message', message, { surfaceOp: 'append' })
    session.append('turn/end', { turn: 1, reason })
  }
}

async function bench(script: Script, options: BenchOptions = {}) {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })

  const pool = new MemoryMediaPool()
  await ctx.plugin(Storage)
  const backend = new MemoryStorageBackend(pool)
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

  const sections: unknown[] = []
  const filters: unknown[] = []
  const presets: unknown[] = []
  const skillQueries: unknown[] = []
  const skillRestrictions: unknown[] = []
  const created: CreateAgentOptions[] = []
  let disposed = 0
  let followups = 0
  ctx.provide('systemPrompt', {
    section: (section: unknown) => { sections.push(section); return () => {} },
  } as never)
  ctx.provide('tools', {
    restrict: (filter: unknown) => { filters.push(filter); return () => {} },
    definitions: () => options.tools ?? [],
  } as never)
  if (options.skillRegistry !== false) {
    ctx.provide('skills', {
      list: async (query: unknown) => {
        skillQueries.push(query)
        return (options.skills ?? []).map(skill => ({ ...skill, description: '' }))
      },
      restrict: (filter: unknown) => {
        skillRestrictions.push(filter)
        return () => {}
      },
    } as never)
  }
  if (options.mcpServers !== undefined) {
    ctx.provide('mcpResources', {
      list: (scope?: unknown) => {
        expect(scope).toBeUndefined()
        return options.mcpServers
      },
    } as never)
  }
  if (options.withPresets === true) {
    ctx.provide('permissionPresets', {
      set: (session: Session, preset: string) => { presets.push([session.id, preset]) },
    } as never)
  }

  const mount = async (ownerCtx: Context, session: Session, createOptions: CreateAgentOptions): Promise<Agent> => {
    const agentOptions = createOptions.agentOptions ?? {}
    const projection = await ownerCtx.sessionProjections.register(modelSelectionProjectionDefinition)
    let idle: Promise<void> = Promise.resolve()
    let running = false
    let stop = (): void => {}
    const agent: Agent = {
      id: session.id,
      options: agentOptions,
      model: new AgentModel(() => projection.stateOf(session), session, agentOptions),
      session,
      inbox: createInboxStub(),
      get status() { return running ? 'running' : 'idle' },
      ctx: ownerCtx,
      cancel: () => { stop() },
      runMaintenance: () => Promise.reject(new Error('not used')),
      send: () => {},
      followup: (message: UserMessage) => {
        followups += 1
        running = true
        const hang = options.hang === true || (options.hangAfterFirstTurn === true && followups === 1)
        idle = Promise.resolve().then(() => {
          if (options.hang !== true) script(session, message, agent)
        }).then(() => {
          if (!hang) return
          // Keep the turn open until its cancellation: the executor's wait must
          // observe a run it still owns.
          return new Promise<void>((resolve) => {
            stop = () => {
              running = false
              resolve()
            }
          })
        }).finally(() => { running = false })
      },
      steer: () => {},
      inject: () => {},
      whenIdle: async () => {
        let activity: Promise<void>
        do { await (activity = idle) } while (activity !== idle)
      },
    }
    await createOptions.setup?.(ownerCtx, agent)
    await ctx.agents.register(agent)
    return agent
  }

  ctx.agents.setFactory({
    async createAgent(ownerCtx: Context, createOptions: CreateAgentOptions): Promise<AgentHandle> {
      if (options.failCreate !== undefined) throw options.failCreate
      created.push(createOptions)
      const session = ctx.sessions.create(createOptions.sessionId, createOptions.meta === undefined ? {} : { meta: createOptions.meta })
      const agent = await mount(ownerCtx, session, createOptions)
      return { agent, dispose: async () => { disposed += 1 } }
    },
    async resume(): Promise<AgentHandle> {
      throw new Error('not used')
    },
  })

  await ctx.plugin(LocalRobots)
  if (options.deferRuntime !== true) {
    await ctx.plugin({ name, inject, apply }, options.pauseTimeoutMs === undefined ? undefined : { pauseTimeoutMs: options.pauseTimeoutMs })
  }

  return {
    ctx, sections, filters, presets, created, skillQueries, skillRestrictions,
    disposed: () => disposed, followups: () => followups,
  }
}

async function waitUntil(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt++) {
    if (condition()) return
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error('condition was not reached')
}

async function waitForRun(robots: Robots, id: RunId): Promise<Run> {
  for (let attempt = 0; attempt < 500; attempt++) {
    const run = await robots.run(id)
    if (run !== undefined && isTerminalRunState(run.state)) return run
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error(`run ${id} did not settle`)
}

async function startRun(robots: Robots, spec: RobotSpec = copy()): Promise<Run> {
  const revision = await robots.publish(spec)
  const robot = await robots.instantiate(revision.ref)
  return robots.start(robot.id, { message: 'review the diff' })
}

describe('robot runtime', () => {
  it('keeps only the MCP servers the specification selects', async () => {
    const spec = copy()
    spec.capability.mcpServers = ['github']
    const test = await bench(completedText('reviewed'), {
      tools: [
        { name: 'read' },
        { name: 'bash' },
        { name: 'mcp__github__create_issue' },
        { name: 'mcp__web__search' },
      ],
      mcpServers: ['github', 'web'],
    })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.filters).toEqual([{ allow: ['read', 'mcp__github__create_issue'], deny: ['bash'] }])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('hides every MCP tool when the specification names no server', async () => {
    const test = await bench(completedText('reviewed'), {
      tools: [{ name: 'read' }, { name: 'bash' }, { name: 'mcp__github__create_issue' }],
      mcpServers: [],
    })
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.filters).toEqual([{ allow: ['read'], deny: ['bash'] }])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('fails a run whose MCP server is not configured instead of running without it', async () => {
    const spec = copy()
    spec.capability.mcpServers = ['web']
    const test = await bench(completedText('unused'), {
      tools: [{ name: 'read' }, { name: 'mcp__github__create_issue' }],
      mcpServers: ['github'],
    })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({
        state: 'failed',
        error: 'unavailable MCP server: web',
      })
      expect(test.created).toEqual([])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('fails a run that names an MCP server when this deployment mounts no MCP registry', async () => {
    const spec = copy()
    spec.capability.mcpServers = ['github']
    const test = await bench(completedText('unused'))
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({
        state: 'failed',
        error: 'unavailable MCP server: github',
      })
      expect(test.created).toEqual([])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('keeps every native tool when the specification allows no tool by name', async () => {
    const spec = copy()
    spec.capability.tools.allow = []
    spec.capability.mcpServers = ['github']
    const test = await bench(completedText('reviewed'), {
      tools: [{ name: 'read' }, { name: 'bash' }, { name: 'mcp__github__create_issue' }],
      mcpServers: ['github'],
    })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.filters).toEqual([{ allow: ['read', 'bash', 'mcp__github__create_issue'], deny: ['bash'] }])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('applies only a deny list when the specification allows every tool', async () => {
    const spec = copy()
    spec.capability.tools.allow = []
    const test = await bench(completedText('reviewed'))
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.filters).toEqual([{ deny: ['bash'] }])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('restricts the run to the selected skills', async () => {
    const spec = copy()
    spec.capability.skills = ['office-docx']
    const test = await bench(completedText('reviewed'), { skills: [{ name: 'office-docx' }] })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.skillQueries).toEqual([{ cwd: '/tmp/workspace' }])
      expect(test.skillRestrictions).toEqual([{ allow: ['office-docx'] }])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('fails a run whose selected skill is absent or has no registry', async () => {
    const spec = copy()
    spec.capability.skills = ['missing-skill']
    const test = await bench(completedText('unused'), { skills: [{ name: 'office-docx' }] })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({
        state: 'failed',
        error: 'unavailable skill: missing-skill',
      })
      expect(test.created).toEqual([])
    } finally {
      await test.ctx.fiber.dispose()
    }

    const bare = await bench(completedText('unused'), { skillRegistry: false })
    try {
      const run = await startRun(bare.ctx.robots, spec)
      await expect(waitForRun(bare.ctx.robots, run.id)).resolves.toMatchObject({
        state: 'failed',
        error: 'this deployment mounts no skill registry, so the selected skills cannot load',
      })
      expect(bare.created).toEqual([])
    } finally {
      await bare.ctx.fiber.dispose()
    }
  })

  it('executes a queued run and records the assistant text', async () => {
    const test = await bench(completedText('reviewed'))
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded', output: 'reviewed' })
      await waitUntil(() => test.disposed() === 1)
      expect(test.sections).toMatchObject([{ name: 'robot:mission', order: -500 }])
      expect(test.filters).toEqual([{ allow: ['read'], deny: ['bash'] }])
      expect(test.presets).toEqual([])
      expect(test.created[0]?.meta).toEqual({ cwd: '/tmp/workspace' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records the run Session on the run and in the Session projection', async () => {
    const test = await bench(completedText('reviewed'))
    try {
      const run = await startRun(test.ctx.robots)
      const settled = await waitForRun(test.ctx.robots, run.id)
      expect(settled.state).toBe('succeeded')
      expect(settled.sessionId).toBe(test.created[0]?.sessionId)
      const session = test.ctx.sessions.get(settled.sessionId!)
      expect(session).toBeDefined()
      const snapshot = test.ctx.sessionProjections.snapshot(session!)
      expect(snapshot.values.robotRun).toMatchObject({ robotId: run.robot, runId: run.id })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records a failure raised while driving the turn', async () => {
    const test = await bench(() => { throw new Error('turn failed') })
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'failed', error: 'turn failed' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records a failed turn', async () => {
    const test = await bench(ended({ kind: 'error', error: { code: 'TEST', message: 'boom' } }))
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'failed', error: 'TEST: boom' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records an aborted turn as cancelled', async () => {
    const test = await bench(ended({ kind: 'aborted', reason: { kind: 'user' } }))
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'cancelled' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records an unknown terminal reason as failed', async () => {
    const test = await bench(ended({ kind: 'blocked' }))
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'failed', error: 'run ended with blocked' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records a run with no turn result', async () => {
    const test = await bench(() => {})
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'failed', error: 'run ended without a turn result' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records a failed Agent creation', async () => {
    const test = await bench(completedText('unused'), { failCreate: new Error('create failed') })
    try {
      const run = await startRun(test.ctx.robots)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'failed', error: 'create failed' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('records a non-Error creation failure and omits an absent workspace root', async () => {
    const spec = copy()
    spec.capability.workspaceRoots = []
    const test = await bench(completedText('unused'), { failCreate: 'create failed without an Error' })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'failed', error: 'create failed without an Error' })
      expect(test.created).toEqual([])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('applies a deny-only tool filter and the permission preset', async () => {
    const spec = copy()
    spec.capability.tools = { allow: [], deny: ['bash'] }
    const test = await bench(completedText('reviewed'), { withPresets: true })
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.filters).toEqual([{ deny: ['bash'] }])
      expect(test.presets).toEqual([[test.created[0]?.sessionId, 'workspace']])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('omits tool filtering and optional prompt lines', async () => {
    const spec = copy()
    spec.capability.tools = { allow: [], deny: [] }
    spec.goal.successCriteria = []
    spec.goal.stopConditions = []
    spec.io.acceptance = []
    const test = await bench(completedText('reviewed'))
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.filters).toEqual([])
      expect(test.sections).toMatchObject([{ name: 'robot:mission', text: '## Robot mission\nReview changes' }])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('cancels the active Agent when the run is cancelled', async () => {
    const test = await bench(() => {}, { hang: true })
    try {
      const revision = await test.ctx.robots.publish(copy())
      const robot = await test.ctx.robots.instantiate(revision.ref)
      const run = await test.ctx.robots.start(robot.id, { message: 'slow work' })
      await waitUntil(() => test.followups() === 1)
      const other = test.ctx.sessions.create()
      other.append('turn/start', { turn: 1 })
      await test.ctx.robots.cancel(run.id)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'cancelled' })
      await waitUntil(() => test.disposed() === 1)
      await expect(test.ctx.robots.robot(robot.id)).resolves.toMatchObject({ state: 'idle' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('disposes active Agents when the runtime unloads', async () => {
    const test = await bench(() => {}, { hang: true })
    const revision = await test.ctx.robots.publish(copy())
    const robot = await test.ctx.robots.instantiate(revision.ref)
    await test.ctx.robots.start(robot.id, { message: 'slow work' })
    await waitUntil(() => test.followups() === 1)
    await test.ctx.fiber.dispose()
    expect(test.disposed()).toBe(1)
  })

  it('scans queued runs when the runtime loads later', async () => {
    const test = await bench(completedText('reviewed'), { deferRuntime: true })
    try {
      const run = await startRun(test.ctx.robots)
      await test.ctx.plugin({ name, inject, apply })
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded', output: 'reviewed' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('ignores unrelated domain changes and duplicate run writes', async () => {
    const test = await bench(() => {}, { hang: true })
    try {
      test.ctx.emit('domain/changed', { domain: 'other', table: 'runs', operation: 'put', key: 'x', value: {} })
      test.ctx.emit('domain/changed', { domain: 'tomato_robot', table: 'revisions', operation: 'put', key: 'x', value: {} })
      test.ctx.emit('domain/changed', { domain: 'tomato_robot', table: 'runs', operation: 'deleted', key: 'x' })
      const run = await startRun(test.ctx.robots)
      await waitUntil(() => test.followups() === 1)
      test.ctx.emit('domain/changed', { domain: 'tomato_robot', table: 'runs', operation: 'put', key: run.id, value: {} })
      await new Promise(resolve => setTimeout(resolve, 5))
      expect(test.created).toHaveLength(1)
      await test.ctx.robots.cancel(run.id)
      await waitUntil(() => test.disposed() === 1)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('falls back to the first registered Workspace when the specification names none', async () => {
    const spec = copy()
    spec.capability.workspaceRoots = []
    const test = await bench(completedText('reviewed'))
    try {
      test.ctx.provide('workspaceRegistry', { list: () => [{ path: '/registered/first' }] } as never)
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.created[0]?.meta).toEqual({ cwd: '/registered/first' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('falls back to the Host process directory when no Workspace is registered', async () => {
    const spec = copy()
    spec.capability.workspaceRoots = []
    const test = await bench(completedText('reviewed'))
    try {
      const run = await startRun(test.ctx.robots, spec)
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded' })
      expect(test.created[0]?.meta).toEqual({ cwd: process.cwd() })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('keeps a paused run and its Agent until a correction continues it', async () => {
    let turn = 0
    const script: Script = (session, message) => {
      turn += 1
      session.append('turn/start', { turn })
      session.append('step/start', { turn, step: 1 })
      session.append('user/message', message, { surfaceOp: 'append' })
      session.append('assistant/message', {
        stream: [],
        turn,
        step: 1,
        message: createAssistantMessage({
          content: [{ type: 'text', text: `answer ${turn}` }],
          source: { provider: 'test-provider', model: 'test-model' },
        }),
      }, { surfaceOp: 'append' })
      session.append('step/end', { turn, step: 1 })
      session.append('turn/end', { turn, reason: { kind: 'completed' } })
    }
    const test = await bench(script, { hangAfterFirstTurn: true })
    try {
      const run = await startRun(test.ctx.robots)
      await waitUntil(() => test.followups() === 1)
      await waitUntil(() => turn === 1)
      const agent = test.ctx.agents.get(test.created[0]?.sessionId as SessionId)
      if (agent === undefined) throw new Error('the run Agent was not published')
      // The Host pauses the run before it aborts the turn, then the turn
      // settles; the executor must keep the run and the Agent.
      await test.ctx.robots.advance(run.id, 'waiting')
      agent.cancel({ kind: 'user' }, { keepInbox: true })
      await new Promise(resolve => setTimeout(resolve, 10))
      await expect(test.ctx.robots.run(run.id)).resolves.toMatchObject({ state: 'waiting' })
      expect(test.disposed()).toBe(0)

      agent.followup(createUserMessage({ content: [{ type: 'text', text: 'use the other method' }], source: { kind: 'user' } }))
      await test.ctx.robots.advance(run.id, 'running')
      await expect(waitForRun(test.ctx.robots, run.id)).resolves.toMatchObject({ state: 'succeeded', output: 'answer 2' })
      await waitUntil(() => test.disposed() === 1)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('settles a paused run once its wait budget expires', async () => {
    const test = await bench(completedText('first'), { hangAfterFirstTurn: true, pauseTimeoutMs: 5 })
    try {
      const run = await startRun(test.ctx.robots)
      await waitUntil(() => test.followups() === 1)
      const agent = test.ctx.agents.get(test.created[0]?.sessionId as SessionId)
      if (agent === undefined) throw new Error('the run Agent was not published')
      await test.ctx.robots.advance(run.id, 'waiting')
      agent.cancel({ kind: 'user' }, { keepInbox: true })
      const settled = await waitForRun(test.ctx.robots, run.id)
      expect(settled).toMatchObject({ state: 'cancelled' })
      expect(settled.error).toContain('paused')
      await waitUntil(() => test.disposed() === 1)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })
})
