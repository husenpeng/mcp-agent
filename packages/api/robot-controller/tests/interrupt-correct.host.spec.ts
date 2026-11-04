/**
 * Pause and correction delivery for an executing run: the Host records the
 * pause, aborts the active turn, and routes the correction into the Agent the
 * run owns.
 */
import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import type { RobotSpec, RunId } from '@tomato/experimental-robot/types'
import LocalRobots from '@tomato/experimental-robot-local'
import type { SessionId } from '@tomato/session/types'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import TypertRegistry from '@tomato/typert-registry'
import { describe, expect, it, vi } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import RobotController from '../src/index.ts'

const BASE = {
  name: 'Reviewer',
  description: 'Reviews changes',
  position: {
    owner: 'alice',
    callers: ['alice'],
    callees: [],
    escalation: ['alice'],
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
    tools: { allow: ['read'], deny: [] },
    mcpServers: [],
    skills: [],
    workspaceRoots: ['/tmp/workspace'],
    dataClasses: ['internal'],
    credentials: [],
    sandbox: 'workspace',
    permissionPreset: 'workspace',
    network: 'none',
  },
  io: {
    input: { schema: 'review.request', version: 1 },
    output: { schema: 'review.result', format: 'markdown', delivery: 'chat' },
    acceptance: ['cites evidence'],
  },
  memory: { read: [], write: [], recall: 'none' },
  a2a: { intents: [], peers: [] },
} satisfies RobotSpec

/** Distinguishes published specifications, whose names must be unique. */
let published = 0

/** One executing run and the Session it logs to. */
interface Executing {
  readonly runId: RunId
  readonly sessionId: SessionId
}

interface Bench {
  readonly ctx: Context
  /** Executing Agents by Session identity; a settled run removes its entry. */
  readonly agents: Map<string, { cancel: ReturnType<typeof vi.fn> }>
  /** Prompt requests the Session controller received. */
  readonly prompts: Record<string, unknown>[]
}

async function bench(): Promise<Bench> {
  const ctx = new Context()
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
  const agents = new Map<string, { cancel: ReturnType<typeof vi.fn> }>()
  const prompts: Record<string, unknown>[] = []
  ctx.provide('agents', { get: (id: string) => agents.get(id) } as never)
  ctx.provide('sessionController', {
    prompt: async (request: Record<string, unknown>) => {
      prompts.push(request)
      return { accepted: true }
    },
  } as never)
  await ctx.plugin(TypertRegistry)
  await ctx.plugin(LocalRobots)
  await ctx.plugin(RobotController)
  return { ctx, agents, prompts }
}

/**
 * Accept one run, attach its Session, and report it executing.
 * @param bench - composition under test.
 * @param options - whether to attach a Session and publish a live Agent.
 * @returns the accepted run identity.
 */
async function executingRun(
  { ctx, agents }: Bench,
  options: { readonly session?: boolean; readonly agent?: boolean } = {},
): Promise<Executing> {
  published += 1
  const spec = structuredClone(BASE)
  spec.name = `${BASE.name} ${String(published)}`
  const revision = await ctx.robotController.publish({ spec })
  const robot = await ctx.robotController.instantiate({ ref: revision.ref })
  const run = await ctx.robotController.start({ robotId: robot.id, message: 'review' })
  const sessionId = brandString<SessionId>(`session-run-${String(published)}`)
  if (options.session !== false) {
    await ctx.robots.attachSession(run.id, sessionId)
    await ctx.robots.advance(run.id, 'running')
  }
  if (options.agent !== false) agents.set(sessionId, { cancel: vi.fn() })
  return { runId: run.id, sessionId }
}

describe('robot pause and correction', () => {
  it('records the pause before aborting the active turn and stays paused when asked again', async () => {
    const test = await bench()
    try {
      const { runId, sessionId } = await executingRun(test)
      const cancel = test.agents.get(sessionId)?.cancel
      if (cancel === undefined) throw new Error('the run Agent was not published')

      await test.ctx.robotController.interrupt({ runId: runId })
      expect(cancel).toHaveBeenCalledExactlyOnceWith({ kind: 'user' }, { keepInbox: true })
      await expect(test.ctx.robots.run(runId)).resolves.toMatchObject({ state: 'waiting' })

      await test.ctx.robotController.interrupt({ runId: runId })
      expect(cancel).toHaveBeenCalledOnce()
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('delivers a paused run correction as the next turn and reports it running again', async () => {
    const test = await bench()
    try {
      const { runId, sessionId } = await executingRun(test)
      await test.ctx.robots.advance(runId, 'waiting')

      await test.ctx.robotController.correct({ runId: runId, message: 'use the second method' })
      expect(test.prompts).toHaveLength(1)
      expect(test.prompts[0]).toMatchObject({
        sessionId,
        mode: 'queue',
        content: [{ type: 'text', text: 'use the second method' }],
      })
      expect(String(test.prompts[0]?.requestId)).toMatch(/^robot-correct-/)
      await expect(test.ctx.robots.run(runId)).resolves.toMatchObject({ state: 'running' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('steers a correction into the running turn instead of queueing it', async () => {
    const test = await bench()
    try {
      const { runId, sessionId } = await executingRun(test)
      await test.ctx.robotController.correct({ runId, message: 'skip the appendix' })
      expect(test.prompts[0]).toMatchObject({ mode: 'steer', sessionId })
      await expect(test.ctx.robots.run(runId)).resolves.toMatchObject({ state: 'running' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('refuses a correction without text, without an executing Agent, or from an unknown run', async () => {
    const test = await bench()
    try {
      const { runId } = await executingRun(test)
      await expect(test.ctx.robotController.correct({ runId, message: '  ' }))
        .rejects.toMatchObject({ code: 'gateway/bad-request' })
      await expect(test.ctx.robotController.correct({ runId: brandString<RunId>('missing-run'), message: 'fix it' }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
      expect(test.prompts).toEqual([])

      // A settled run has no live Agent, so the Host refuses instead of cold-
      // resuming a Session no executor settles.
      const idle = await executingRun(test, { agent: false })
      await expect(test.ctx.robotController.correct({ runId: idle.runId, message: 'fix it' }))
        .rejects.toMatchObject({ code: 'robot/conflict' })
      await expect(test.ctx.robotController.interrupt({ runId: idle.runId }))
        .rejects.toMatchObject({ code: 'robot/conflict' })
      expect(test.prompts).toEqual([])
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('refuses to pause a run whose Agent was never published', async () => {
    const test = await bench()
    try {
      const { runId } = await executingRun(test, { session: false, agent: false })
      await expect(test.ctx.robotController.interrupt({ runId }))
        .rejects.toMatchObject({ code: 'robot/conflict' })
      await expect(test.ctx.robots.run(runId)).resolves.toMatchObject({ state: 'queued' })
    } finally {
      await test.ctx.fiber.dispose()
    }
  })
})
