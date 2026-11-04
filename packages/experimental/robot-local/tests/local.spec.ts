import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import type { RobotId, RobotSpec, RobotSpecId, Robots, RunId } from '@tomato/experimental-robot'
import type { SessionId } from '@tomato/session'
import SessionStore from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import LocalRobots, { RobotSpecValidationError } from '../src/index.ts'

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
    triggers: [{ kind: 'manual' }, { kind: 'cron', expression: '0 9 * * *', timeZone: 'UTC' }],
    strategy: 'plan',
    stopConditions: ['done'],
    failurePolicy: 'retry',
    budget: { tokens: 1000, millis: 1000, cost: 0.1, toolCalls: 10 },
    maxConcurrentRuns: 1,
  },
  capability: {
    tools: { allow: ['read'], deny: ['bash'] },
    mcpServers: ['github'],
    skills: ['review'],
    workspaceRoots: ['/tmp/workspace'],
    dataClasses: ['internal'],
    credentials: ['token'],
    sandbox: 'workspace',
    permissionPreset: 'workspace',
    network: 'allowlist',
  },
  io: {
    input: { schema: 'review.request', version: 1 },
    output: { schema: 'review.result', format: 'markdown', delivery: 'artifact' },
    acceptance: ['cites evidence'],
  },
  memory: { read: ['team:main'], write: ['robot:self'], retentionDays: 30, recall: 'hybrid' },
  a2a: {
    intents: ['request'],
    peers: [{ peer: 'chief', budget: { tokens: 100, millis: 100, cost: 1, toolCalls: 1 }, requiresApproval: false }],
  },
} satisfies RobotSpec

type MutableSpec = typeof BASE

const copy = (): MutableSpec => structuredClone(BASE)

async function createContext(pool: MemoryMediaPool): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
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
  await ctx.plugin(LocalRobots)
  return ctx
}

async function withRobots(run: (robots: Robots) => Promise<void>): Promise<void> {
  const ctx = await createContext(new MemoryMediaPool())
  try {
    await run(ctx.robots)
  } finally {
    await ctx.fiber.dispose()
  }
}

async function seed(pool: MemoryMediaPool) {
  const ctx = await createContext(pool)
  try {
    const revision = await ctx.robots.publish(copy())
    const robot = await ctx.robots.instantiate(revision.ref)
    const run = await ctx.robots.start(robot.id, { message: 'review the diff' })
    return { revision, robot, run }
  } finally {
    await ctx.fiber.dispose()
  }
}

describe('robot-local specification registry', () => {
  it('publishes an immutable first revision', async () => {
    await withRobots(async (robots) => {
      const revision = await robots.publish(copy())
      expect(revision.ref.revision).toBe(1)
      expect(revision.supersedes).toBeUndefined()
      expect(typeof revision.publishedAt).toBe('number')
      expect(Object.isFrozen(revision)).toBe(true)
      expect(Object.isFrozen(revision.spec)).toBe(true)
      expect(Object.isFrozen(revision.spec.position.callers)).toBe(true)
      await expect(robots.revision(revision.ref)).resolves.toEqual(revision)
      await expect(robots.specs()).resolves.toEqual([revision])
    })
  })

  it('publishes a superseding revision and keeps the previous one', async () => {
    await withRobots(async (robots) => {
      const first = await robots.publish(copy())
      const next = structuredClone(BASE)
      next.goal.mission = 'Reviews changes and reports'
      const second = await robots.publish(next, first.ref)
      expect(second.ref.spec).toBe(first.ref.spec)
      expect(second.ref.revision).toBe(2)
      expect(second.supersedes).toBe(1)
      await expect(robots.revision(first.ref)).resolves.toEqual(first)
      await expect(robots.revision(second.ref)).resolves.toEqual(second)
      await expect(robots.publish(copy(), first.ref)).rejects.toThrow('is not the latest revision')
      await expect(robots.specs()).resolves.toEqual([second])
    })
  })

  it('rejects a structurally invalid specification', async () => {
    await withRobots(async (robots) => {
      const invalid = copy()
      invalid.goal.budget.tokens = -1
      await expect(robots.publish(invalid)).rejects.toMatchObject({
        name: 'RobotSpecValidationError',
        issues: [{ path: 'goal.budget.tokens' }],
      })
      await expect(robots.publish(invalid)).rejects.toBeInstanceOf(RobotSpecValidationError)
    })
  })

  it('rejects cross-field violations', async () => {
    await withRobots(async (robots) => {
      const duplicate = copy()
      duplicate.position.callers = ['chief', 'chief']
      await expect(robots.publish(duplicate)).rejects.toMatchObject({ issues: [{ path: 'position.callers' }] })

      const overlap = copy()
      overlap.capability.tools.deny = ['read']
      await expect(robots.publish(overlap)).rejects.toMatchObject({ issues: [{ path: 'capability.tools' }] })

      const triggerless = copy()
      triggerless.goal.triggers = []
      await expect(robots.publish(triggerless)).rejects.toMatchObject({ issues: [{ path: 'goal.triggers' }] })
    })
  })

  it('rejects an unknown or stale previous revision', async () => {
    await withRobots(async (robots) => {
      const unknownSpec = brandString<RobotSpecId>('missing')
      await expect(robots.revision({ spec: unknownSpec, revision: 1 })).resolves.toBeUndefined()
      await expect(robots.publish(copy(), { spec: unknownSpec, revision: 1 })).rejects.toThrow('unknown robot specification')
      const first = await robots.publish(copy())
      await expect(robots.publish(copy(), { spec: first.ref.spec, revision: 9 })).rejects.toThrow('is not the latest revision')
    })
  })

  it('rejects a duplicate specification name', async () => {
    await withRobots(async (robots) => {
      await robots.publish(copy())
      await expect(robots.publish(copy())).rejects.toThrow('already exists')
      const other = copy()
      other.name = 'Planner'
      await expect(robots.publish(other)).resolves.toMatchObject({ ref: { revision: 1 } })
    })
  })
})

describe('robot-local instantiation and runs', () => {
  it('instantiates an idle robot bound to the revision', async () => {
    await withRobots(async (robots) => {
      const revision = await robots.publish(copy())
      const robot = await robots.instantiate(revision.ref)
      expect(robot).toMatchObject({ name: 'Reviewer', state: 'idle', spec: revision.ref })
      await expect(robots.robot(robot.id)).resolves.toEqual(robot)
      await expect(robots.robots()).resolves.toEqual([robot])
      await expect(robots.robot(brandString<RobotId>('missing-robot'))).resolves.toBeUndefined()

      const unknownSpec = brandString<RobotSpecId>('missing')
      await expect(robots.instantiate({ spec: unknownSpec, revision: 1 })).rejects.toThrow('unknown robot specification revision')
    })
  })

  it('accepts one run at a time and reports the robot running', async () => {
    await withRobots(async (robots) => {
      const revision = await robots.publish(copy())
      const robot = await robots.instantiate(revision.ref)
      const run = await robots.start(robot.id, { message: 'review the diff' })
      expect(run).toMatchObject({ robot: robot.id, spec: revision.ref, state: 'queued' })
      await expect(robots.robot(robot.id)).resolves.toMatchObject({ state: 'running' })
      await expect(robots.robots()).resolves.toEqual([expect.objectContaining({ state: 'running' })])
      await expect(robots.start(robot.id, { message: 'again' })).rejects.toThrow('is already running')
      await expect(robots.runs(robot.id)).resolves.toEqual([run])
      await expect(robots.run(run.id)).resolves.toEqual(run)
      await expect(robots.runs(brandString<RobotId>('other-robot'))).resolves.toEqual([])
      await expect(robots.start(brandString<RobotId>('missing-robot'), { message: 'x' })).rejects.toThrow('unknown robot')
    })
  })

  it('cancels a run, returns the robot to idle, and keeps terminal state', async () => {
    await withRobots(async (robots) => {
      const revision = await robots.publish(copy())
      const robot = await robots.instantiate(revision.ref)
      const run = await robots.start(robot.id, { message: 'review the diff' })
      await robots.cancel(run.id)
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'cancelled' })
      await expect(robots.robot(robot.id)).resolves.toMatchObject({ state: 'idle' })
      await robots.cancel(run.id)
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'cancelled' })
      const next = await robots.start(robot.id, { message: 'review again' })
      await expect(robots.runs(robot.id)).resolves.toHaveLength(2)
      await expect(robots.cancel(brandString<RunId>('missing-run'))).rejects.toThrow('unknown run')
      await expect(robots.run(brandString<RunId>('missing-run'))).resolves.toBeUndefined()
      expect(next.state).toBe('queued')
    })
  })

  it('settles runs with executor outcomes and keeps terminal state', async () => {
    await withRobots(async (robots) => {
      const revision = await robots.publish(copy())
      const robot = await robots.instantiate(revision.ref)
      const run = await robots.start(robot.id, { message: 'review the diff' })
      await robots.finish(run.id, { state: 'succeeded', output: 'reviewed' })
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'succeeded', output: 'reviewed' })
      await expect(robots.robot(robot.id)).resolves.toMatchObject({ state: 'idle' })

      const failed = await robots.start(robot.id, { message: 'review again' })
      await robots.finish(failed.id, { state: 'failed', error: 'provider failed' })
      await expect(robots.run(failed.id)).resolves.toMatchObject({ state: 'failed', error: 'provider failed' })

      await robots.finish(run.id, { state: 'failed', error: 'late' })
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'succeeded', output: 'reviewed' })
      await expect(robots.finish(brandString<RunId>('missing-run'), { state: 'succeeded' })).rejects.toThrow('unknown run')
    })
  })

  it('restores revisions, robots, and runs after a restart', async () => {
    const pool = new MemoryMediaPool()
    const { revision, robot, run } = await seed(pool)
    const ctx = await createContext(pool)
    try {
      await expect(ctx.robots.revision(revision.ref)).resolves.toMatchObject({ ref: revision.ref })
      await expect(ctx.robots.specs()).resolves.toHaveLength(1)
      await expect(ctx.robots.robot(robot.id)).resolves.toMatchObject({ id: robot.id, state: 'running' })
      await expect(ctx.robots.run(run.id)).resolves.toMatchObject({ state: 'queued' })
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(1)
      await ctx.robots.cancel(run.id)
      await expect(ctx.robots.robot(robot.id)).resolves.toMatchObject({ state: 'idle' })
      await expect(ctx.robots.run(run.id)).resolves.toMatchObject({ state: 'cancelled' })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('attaches one session to a run once and restores it after a restart', async () => {
    const pool = new MemoryMediaPool()
    const { run } = await seed(pool)
    const session = brandString<SessionId>('session-attached')
    const ctx = await createContext(pool)
    try {
      await ctx.robots.attachSession(run.id, session)
      await expect(ctx.robots.run(run.id)).resolves.toMatchObject({ sessionId: session })
      await ctx.robots.attachSession(run.id, session)
      await expect(ctx.robots.attachSession(run.id, brandString<SessionId>('session-other')))
        .rejects.toThrow('already attached')
      await expect(ctx.robots.attachSession(brandString<RunId>('missing-run'), session))
        .rejects.toThrow('unknown run')
    } finally {
      await ctx.fiber.dispose()
    }
    const restarted = await createContext(pool)
    try {
      await expect(restarted.robots.run(run.id)).resolves.toMatchObject({ sessionId: session })
    } finally {
      await restarted.fiber.dispose()
    }
  })

  it('records executor progress and keeps a settled run state', async () => {
    await withRobots(async (robots) => {
      const revision = await robots.publish(copy())
      const robot = await robots.instantiate(revision.ref)
      const run = await robots.start(robot.id, { message: 'review' })

      await robots.advance(run.id, 'running')
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'running' })
      await expect(robots.robot(robot.id)).resolves.toMatchObject({ state: 'running' })
      await robots.advance(run.id, 'waiting')
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'waiting' })
      await robots.advance(run.id, 'running')
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'running' })

      await robots.finish(run.id, { state: 'succeeded', output: 'reviewed' })
      await robots.advance(run.id, 'running')
      await expect(robots.run(run.id)).resolves.toMatchObject({ state: 'succeeded', output: 'reviewed' })
      await expect(robots.advance(brandString<RunId>('missing-run'), 'running')).rejects.toThrow('unknown run')
    })
  })

  it('rebinds a robot to a newer revision without moving an accepted run', async () => {
    await withRobots(async (robots) => {
      const first = await robots.publish(copy())
      const robot = await robots.instantiate(first.ref)
      const run = await robots.start(robot.id, { message: 'first pass' })
      const renamed = structuredClone(BASE)
      renamed.name = 'Reviewer Two'
      renamed.goal.mission = 'Review changes twice'
      const second = await robots.publish(renamed, first.ref)

      await expect(robots.rebind(robot.id, second.ref)).resolves.toMatchObject({
        id: robot.id, name: 'Reviewer Two', spec: second.ref,
      })
      await expect(robots.run(run.id)).resolves.toMatchObject({ spec: first.ref })

      await robots.finish(run.id, { state: 'succeeded', output: 'reviewed' })
      const next = await robots.start(robot.id, { message: 'second pass' })
      await expect(robots.run(next.id)).resolves.toMatchObject({ spec: second.ref })

      await expect(robots.rebind(brandString<RobotId>('missing-robot'), second.ref)).rejects.toThrow('unknown robot')
      await expect(robots.rebind(robot.id, { spec: first.ref.spec, revision: 99 })).rejects.toThrow('unknown robot specification revision')
    })
  })

  it('announces registry changes', async () => {
    const ctx = await createContext(new MemoryMediaPool())
    const kinds: string[] = []
    ctx.effect(() => ctx.on('robot/changed', kind => kinds.push(kind)))
    try {
      const revision = await ctx.robots.publish(copy())
      const robot = await ctx.robots.instantiate(revision.ref)
      await ctx.robots.rebind(robot.id, revision.ref)
      const run = await ctx.robots.start(robot.id, { message: 'go' })
      await ctx.robots.attachSession(run.id, brandString<SessionId>('session-1'))
      await ctx.robots.finish(run.id, { state: 'succeeded', output: 'done' })
      await ctx.robots.cancel(run.id)
      expect(kinds).toEqual(['specs', 'robots', 'robots', 'runs', 'runs', 'runs'])
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
