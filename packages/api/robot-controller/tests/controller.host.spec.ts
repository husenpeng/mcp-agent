import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import type { RobotId, RobotSpec, RobotSpecId, RunId } from '@tomato/experimental-robot/types'
import LocalRobots from '@tomato/experimental-robot-local'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import TypertRegistry from '@tomato/typert-registry'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import RobotController from '../src/index.ts'
import type { RobotSnapshotFrame } from '../src/types.ts'

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

async function bench() {
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
  await ctx.plugin(TypertRegistry)
  await ctx.plugin(LocalRobots)
  await ctx.plugin(RobotController)
  return ctx
}

describe('robot Remote controller', () => {
  it('publishes, instantiates, rebinds, and starts runs through the namespace face', async () => {
    const ctx = await bench()
    try {
      const first = await ctx.robotController.publish({ spec: structuredClone(BASE) })
      const robot = await ctx.robotController.instantiate({ ref: first.ref })
      expect(robot).toMatchObject({ name: 'Reviewer', spec: first.ref })

      const next = structuredClone(BASE)
      next.goal.mission = 'Review changes twice'
      const second = await ctx.robotController.publish({ spec: next, previous: first.ref })
      await expect(ctx.robotController.rebind({ robotId: robot.id, ref: second.ref }))
        .resolves.toMatchObject({ id: robot.id, spec: second.ref })

      const run = await ctx.robotController.start({ robotId: robot.id, message: 'review' })
      await expect(ctx.robotController.runs({ robotId: robot.id })).resolves.toMatchObject([{ id: run.id }])
      await ctx.robotController.cancel({ runId: run.id })
      await expect(ctx.robotController.runs({ robotId: robot.id })).resolves.toMatchObject([{ state: 'cancelled' }])
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('maps specification rejection and missing records to Remote codes', async () => {
    const ctx = await bench()
    try {
      const invalid = structuredClone(BASE)
      invalid.goal.budget.tokens = -1
      await expect(ctx.robotController.publish({ spec: invalid })).rejects.toMatchObject({
        code: 'robot/spec-invalid',
        details: { issues: [{ path: 'goal.budget.tokens' }] },
      })
      await expect(ctx.robotController.revision({ ref: { spec: brandString<RobotSpecId>('missing'), revision: 1 } }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
      await expect(ctx.robotController.start({ robotId: brandString<RobotId>('missing-robot'), message: 'go' }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
      await expect(ctx.robotController.cancel({ runId: brandString<RunId>('missing-run') }))
        .rejects.toMatchObject({ code: 'robot/not-found' })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('opens with the whole registry and re-reads after a change', async () => {
    const ctx = await bench()
    const abort = new AbortController()
    try {
      const frames: AsyncIterator<RobotSnapshotFrame> = ctx.robotController.watch(abort.signal)[Symbol.asyncIterator]()
      const first = await frames.next()
      expect(first.value).toMatchObject({ specs: [], robots: [], runs: [] })

      const revision = await ctx.robotController.publish({ spec: structuredClone(BASE) })
      const second = await frames.next()
      expect(second.value).toMatchObject({ specs: [{ ref: revision.ref }] })

      abort.abort()
      expect(await frames.next()).toMatchObject({ done: true })
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
