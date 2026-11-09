import AgentRegistry, { AgentModel, modelSelectionProjectionDefinition } from '@tomato/agent'
import type { Agent, AgentHandle, CreateAgentOptions } from '@tomato/agent'
import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { createInboxStub } from '@tomato/agent-loop-testkit'
import { Context } from '@tomato/cordis'
import { emptyCrewSpec, isTerminalCrewRunState } from '@tomato/experimental-robot-crew'
import type { CrewRun, CrewRunId, CrewSpec } from '@tomato/experimental-robot-crew'
import { createAssistantMessage } from '@tomato/llm'
import SessionStore from '@tomato/session'
import type { Session, UserMessage } from '@tomato/session'
import SessionProjectionRegistry from '@tomato/session-projection'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import type { ToolDefinition } from '@tomato/tools'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import { Crews } from '@tomato/experimental-robot-crew'
import LocalCrews from '../src/index.ts'
import { A2A_TOOL_NAME } from '../src/execute.ts'

/** Output per node id, keyed by the node slug. */
type Scripts = Readonly<Record<string, string | ((session: Session) => Promise<string>)>>

const GRAPH = (): CrewSpec => {
  const spec = emptyCrewSpec({ name: 'Campaign crew', mission: 'Ship a campaign brief' })
  return {
    ...spec,
    workspaceRoot: '/tmp/crew-workspace',
    nodes: [
      {
        id: 'research', label: 'Research', role: 'Find the facts', instruction: 'Collect facts',
        kind: 'worker', maxTurns: 1, budgetTokens: 10_000,
      },
      {
        id: 'draft', label: 'Draft', role: 'Write the brief', instruction: 'Write the brief',
        kind: 'worker', maxTurns: 1, budgetTokens: 10_000,
      },
      {
        id: 'review', label: 'Review', role: 'Check the brief', instruction: 'Review the brief',
        kind: 'reviewer', maxTurns: 1, budgetTokens: 10_000,
      },
    ],
    edges: [
      { from: 'research', to: 'draft', kind: 'handoff', when: 'always' },
      { from: 'draft', to: 'review', kind: 'review', when: 'always' },
    ],
  }
}

function nodeOfSession(session: Session): string {
  const id = String(session.id)
  for (const node of ['research', 'draft', 'review']) {
    if (id.includes(`-${node}-`)) return node
  }
  return 'unknown'
}

interface MemoryStub {
  readonly accessFor: (path: string) => Promise<unknown>
  readonly history: (view: unknown, text: string) => Promise<readonly Record<string, unknown>[]>
  readonly rememberEpisode: (request: Record<string, unknown>) => Promise<Record<string, unknown>>
}

async function bench(scripts: Scripts, memory?: MemoryStub) {
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
  const sections: { name: string; text: string }[] = []
  ctx.provide('systemPrompt', {
    section: (input: { name: string; text: string }) => {
      sections.push(input)
      return () => {}
    },
  } as never)
  if (memory !== undefined) ctx.provide('memory', memory as never)
  const registered: ToolDefinition[] = []
  ctx.provide('tools', {
    register: (definition: ToolDefinition) => {
      registered.push(definition)
      return () => {}
    },
    restrict: () => () => {},
    definitions: () => [],
  } as never)
  const disposed: string[] = []
  ctx.agents.setFactory({
    async createAgent(ownerCtx: Context, createOptions: CreateAgentOptions): Promise<AgentHandle> {
      const session = ctx.sessions.create(
        createOptions.sessionId,
        createOptions.meta === undefined ? {} : { meta: createOptions.meta },
      )
      const projection = await ctx.sessionProjections.register(modelSelectionProjectionDefinition)
      const agentOptions = createOptions.agentOptions ?? {}
      let idle: Promise<void> = Promise.resolve()
      let running = false
      const agent: Agent = {
        id: session.id,
        options: agentOptions,
        model: new AgentModel(() => projection.stateOf(session), session, agentOptions),
        session,
        inbox: createInboxStub(),
        get status() { return running ? 'running' : 'idle' },
        ctx: ownerCtx,
        cancel: () => {},
        runMaintenance: () => Promise.reject(new Error('not used')),
        send: () => {},
        followup: (message: UserMessage) => {
          running = true
          idle = Promise.resolve().then(async () => {
            const node = nodeOfSession(session)
            const script = scripts[node]
            const text = typeof script === 'function' ? await script(session) : script ?? `answer from ${node}`
            session.append('turn/start', { turn: 1 })
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
      return { agent, dispose: async () => { disposed.push(String(session.id)) } }
    },
    async resume(): Promise<AgentHandle> {
      throw new Error('not used')
    },
  })
  await ctx.plugin(LocalCrews)
  return { ctx, crews: ctx.crews as Crews, registered, disposed, sections }
}

async function waitForRun(crews: Crews, id: CrewRunId): Promise<CrewRun> {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const run = await crews.run(id)
    if (run !== undefined && isTerminalCrewRunState(run.state)) return run
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error(`run ${id} did not settle`)
}

describe('crew execution', () => {
  it('runs the graph, records memory, and hands results to the next node', async () => {
    const test = await bench({
      research: 'Facts: 20 creators.\nDECISION: Use the creator angle\nOPEN: Which market?',
      draft: 'Brief drafted from the creator angle.\nDECISION: Lead with the top creator',
      review: 'Approved with one fix.\nCONSTRAINT: Add the sources section',
    })
    try {
      const revision = await test.crews.publish(GRAPH())
      const run = await test.crews.start(revision.ref, { message: 'Write the campaign brief' })
      const settled = await waitForRun(test.crews, run.id)
      expect(settled).toMatchObject({
        state: 'succeeded',
        steps: 3,
        output: expect.stringContaining('Approved with one fix.'),
      })
      expect(settled.nodes.map(node => node.state)).toEqual(['succeeded', 'succeeded', 'succeeded'])
      const entries = await test.crews.entries(run.id)
      expect(entries.map(entry => entry.kind)).toEqual(expect.arrayContaining([
        'run-start', 'brief', 'step-start', 'step-result', 'memory', 'handoff', 'run-end',
      ]))
      const handoff = entries.find(entry => entry.kind === 'handoff' && entry.node === 'draft')
      expect(handoff?.text).toContain('Facts: 20 creators.')
      const brief = entries.find(entry => entry.kind === 'brief' && entry.node === 'draft')
      expect(brief?.text).toContain('## Decisions already made')
      expect(brief?.text).toContain('Use the creator angle')
      expect(test.disposed).toHaveLength(3)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('injects project history into every member and records the run summary', async () => {
    const written: Record<string, unknown>[] = []
    const memory: MemoryStub = {
      accessFor: async () => ({ kind: 'available', view: { owner: 'local', workspace: '/tmp/crew-workspace' } }),
      history: async () => [{
        kind: 'observation',
        title: 'Glob overflowed',
        narrative: 'Start with list_dir instead of a bare recursive glob.',
        createdAt: Date.UTC(2026, 10, 5),
      }],
      rememberEpisode: async (request) => {
        written.push(request)
        return { ...request, id: 'episode-1', createdAt: 1, updatedAt: 1 }
      },
    }
    const test = await bench({
      research: 'Facts found.\nDECISION: Use the creator angle',
      draft: 'Drafted.',
      review: 'Approved.',
    }, memory)
    try {
      const revision = await test.crews.publish(GRAPH())
      const run = await test.crews.start(revision.ref, { message: 'Write the brief' })
      const settled = await waitForRun(test.crews, run.id)
      expect(settled.state).toBe('succeeded')

      const memorySections = test.sections.filter(section => section.name === 'crew:memory')
      expect(memorySections).toHaveLength(3)
      expect(memorySections[0]?.text).toContain('Glob overflowed')
      expect(memorySections[0]?.text).toContain('not instructions')

      expect(written).toHaveLength(1)
      expect(written[0]).toMatchObject({
        type: 'crew-run',
        scope: { kind: 'project', path: '/tmp/crew-workspace' },
        kind: 'summary',
      })
      expect(written[0]?.title).toBe('Campaign crew: Write the brief')
      expect(written[0]?.facts).toContain('Use the creator angle')
      expect(written[0]?.fingerprint).toBe(`crew-run:${run.id}`)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('keeps running when project memory cannot be read or written', async () => {
    const memory: MemoryStub = {
      accessFor: async () => ({ kind: 'available', view: { owner: 'local' } }),
      history: async () => { throw new Error('memory backend offline') },
      rememberEpisode: async () => { throw new Error('memory backend offline') },
    }
    const test = await bench({ research: 'ok', draft: 'ok', review: 'ok' }, memory)
    try {
      const revision = await test.crews.publish(GRAPH())
      const run = await test.crews.start(revision.ref, { message: 'Write the brief' })
      const settled = await waitForRun(test.crews, run.id)
      expect(settled.state).toBe('succeeded')
      const drift = (await test.crews.entries(run.id)).filter(entry => entry.kind === 'drift')
      expect(drift.map(entry => entry.text)).toEqual(expect.arrayContaining([
        'project memory is unavailable: memory backend offline',
      ]))
      expect(test.sections.filter(section => section.name === 'crew:memory')).toHaveLength(0)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('carries decisions from earlier runs into the next run', async () => {
    const test = await bench({
      research: 'Facts: 20 creators.\nDECISION: Use the creator angle',
      draft: 'Brief drafted.',
      review: 'Approved.\nCONSTRAINT: Add the sources section',
    })
    try {
      const revision = await test.crews.publish(GRAPH())
      const first = await test.crews.start(revision.ref, { message: 'Round one' })
      await waitForRun(test.crews, first.id)
      const second = await test.crews.start(revision.ref, { message: 'Round two' })
      await waitForRun(test.crews, second.id)

      const entries = await test.crews.entries(second.id)
      const carried = entries.find(entry => entry.kind === 'memory' && entry.data?.carried === true)
      expect(carried?.text).toBe('Carried task memory from earlier runs (decisions 1, constraints 1, open questions 0).')
      const brief = entries.find(entry => entry.kind === 'brief' && entry.node === 'research')
      expect(brief?.text).toContain('## Decisions already made')
      expect(brief?.text).toContain('Use the creator angle')
      expect(brief?.text).toContain('## Constraints from earlier steps')
      expect(brief?.text).toContain('Add the sources section')
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('trips the loop guard when the step ceiling is reached', async () => {
    const spec = GRAPH()
    const guarded: CrewSpec = { ...spec, guard: { ...spec.guard, maxSteps: 1 } }
    const test = await bench({
      research: 'Facts found',
      draft: 'Drafted',
      review: 'Reviewed',
    })
    try {
      const revision = await test.crews.publish(guarded)
      const run = await test.crews.start(revision.ref, { message: 'Write it' })
      const settled = await waitForRun(test.crews, run.id)
      expect(settled.state).toBe('tripped')
      expect(settled.trip).toBe('steps')
      expect(settled.error).toContain('activations')
      const guardEntries = (await test.crews.entries(run.id)).filter(entry => entry.kind === 'guard')
      expect(guardEntries).toHaveLength(1)
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('delivers an A2A request synchronously and refuses the duplicate', async () => {
    const results: { ok: boolean; refusal?: string; reply?: string }[] = []
    let registered: ToolDefinition[] = []
    const research = async (): Promise<string> => {
      const tool = registered.find(definition => definition.name === A2A_TOOL_NAME)
      expect(tool).toBeDefined()
      const exec = { signal: new AbortController().signal } as never
      for (let attempt = 0; attempt < 3; attempt += 1) {
        results.push(await tool!.execute({ to: 'review', intent: 'request', task: 'Check the facts' }, exec) as { ok: boolean })
      }
      return 'Research done with a peer check.'
    }
    const test = await bench({ research, draft: 'Drafted', review: 'Peer reviewed the facts' })
    registered = test.registered
    try {
      const revision = await test.crews.publish(GRAPH())
      const run = await test.crews.start(revision.ref, { message: 'Write it' })
      const settled = await waitForRun(test.crews, run.id)
      expect(settled.state).toBe('succeeded')
      expect(results[0]).toMatchObject({ ok: true, node: 'review', reply: 'Peer reviewed the facts' })
      expect(results[1]).toMatchObject({ ok: true })
      expect(results[2]).toMatchObject({ ok: false, refusal: 'duplicate' })
      const entries = await test.crews.entries(run.id)
      expect(entries.some(entry => entry.kind === 'a2a-request' && entry.node === 'review')).toBe(true)
      expect(entries.some(entry => entry.kind === 'a2a-reply' && entry.data?.from === 'review')).toBe(true)
      const brief = entries.find(entry => entry.kind === 'brief' && entry.node === 'review' && entry.data?.a2a !== undefined)
      expect(brief?.text).toContain('Peer research asks you to act: Check the facts')
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('cancels a queued run without waiting for an answer', async () => {
    const test = await bench({ research: 'Facts', draft: 'Draft', review: 'Review' })
    try {
      const revision = await test.crews.publish(GRAPH())
      const run = await test.crews.start(revision.ref, { message: 'Write it' })
      await test.crews.cancel(run.id)
      const settled = await waitForRun(test.crews, run.id)
      expect(settled.state).toBe('cancelled')
    } finally {
      await test.ctx.fiber.dispose()
    }
  })
})
