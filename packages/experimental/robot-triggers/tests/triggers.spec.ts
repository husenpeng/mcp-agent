import { Context } from '@tomato/cordis'
import type { RobotSpec, Trigger } from '@tomato/experimental-robot'
import LocalRobots from '@tomato/experimental-robot-local'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import { apply, emitRobotEvent, inject, name } from '../src/index.ts'

function makeSpec(triggers: readonly Trigger[], suffix = ''): RobotSpec {
  return {
    name: `Reviewer${suffix}`,
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
      triggers,
      strategy: 'plan',
      stopConditions: ['done'],
      failurePolicy: 'retry',
      budget: { tokens: 1000, millis: 1000, cost: 0.1, toolCalls: 10 },
      maxConcurrentRuns: 1,
    },
    capability: {
      tools: { allow: [], deny: [] },
      mcpServers: [],
      skills: [],
      workspaceRoots: [],
      dataClasses: ['internal'],
      credentials: [],
      sandbox: 'none',
      permissionPreset: 'workspace',
      network: 'none',
    },
    io: {
      input: { schema: 'review.request', version: 1 },
      output: { schema: 'review.result', format: 'markdown', delivery: 'artifact' },
      acceptance: [],
    },
    memory: { read: [], write: [], recall: 'none' },
    a2a: { intents: [], peers: [] },
  }
}

async function flush(): Promise<void> {
  for (let index = 0; index < 50; index++) await Promise.resolve()
}

async function bench(deferTriggers = false): Promise<Context> {
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
  await ctx.plugin(LocalRobots)
  if (!deferTriggers) await ctx.plugin({ name, inject, apply })
  return ctx
}

async function seed(ctx: Context, triggers: readonly Trigger[], suffix = '') {
  const revision = await ctx.robots.publish(makeSpec(triggers, suffix))
  return ctx.robots.instantiate(revision.ref)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-30T10:00:30Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('robot cron triggers', () => {
  it('starts a run at the next occurrence and re-arms', async () => {
    const ctx = await bench(true)
    try {
      const robot = await seed(ctx, [{ kind: 'cron', expression: '* * * * *', timeZone: 'UTC' }])
      await ctx.plugin({ name, inject, apply })
      await flush()
      expect(vi.getTimerCount()).toBe(1)
      ctx.emit('domain/changed', { domain: 'tomato_robot', table: 'revisions', operation: 'put', key: 'x', value: {} })
      await flush()
      expect(vi.getTimerCount()).toBe(1)

      await vi.advanceTimersByTimeAsync(30_000)
      await flush()
      const first = await ctx.robots.runs(robot.id)
      expect(first).toHaveLength(1)
      expect(first[0]?.input.message).toBe('Review changes')

      const accepted = first[0]
      if (accepted === undefined) throw new Error('no accepted run')
      await ctx.robots.cancel(accepted.id)
      await vi.advanceTimersByTimeAsync(60_000)
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(2)
    } finally {
      await ctx.fiber.dispose()
      expect(vi.getTimerCount()).toBe(0)
    }
  })

  it('fires only the due schedule when triggers have different next times', async () => {
    const ctx = await bench(true)
    try {
      const robot = await seed(ctx, [
        { kind: 'cron', expression: '* * * * *', timeZone: 'UTC' },
        { kind: 'cron', expression: '0 0 * * *', timeZone: 'UTC' },
      ])
      await ctx.plugin({ name, inject, apply })
      await flush()
      await vi.advanceTimersByTimeAsync(30_000)
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('logs and skips an unusable cron trigger', async () => {
    const ctx = await bench(true)
    try {
      const robot = await seed(ctx, [{ kind: 'cron', expression: 'not a cron', timeZone: 'UTC' }])
      await ctx.plugin({ name, inject, apply })
      await flush()
      expect(vi.getTimerCount()).toBe(0)
      await vi.advanceTimersByTimeAsync(86_400_000)
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(0)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('recomputes schedules when robots are instantiated after load', async () => {
    const ctx = await bench()
    try {
      const robot = await seed(ctx, [{ kind: 'cron', expression: '* * * * *', timeZone: 'UTC' }])
      await flush()
      await vi.advanceTimersByTimeAsync(30_000)
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })
})

describe('robot event triggers', () => {
  it('starts runs for matching topics and ignores others', async () => {
    const ctx = await bench()
    try {
      const robot = await seed(ctx, [
        { kind: 'manual' },
        { kind: 'event', topic: 'deploy' },
        { kind: 'webhook', name: 'ignored' },
      ], '-event')
      await flush()
      ctx.emit('robot/event', 'other', { ignored: true })
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(0)

      emitRobotEvent(ctx, 'deploy', { id: 1 })
      await flush()
      const runs = await ctx.robots.runs(robot.id)
      expect(runs).toHaveLength(1)
      expect(runs[0]?.input.message).toBe('Review changes\n\nRobot event: deploy\n{"id":1}')
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('starts one run per robot and prints an undefined payload', async () => {
    const ctx = await bench()
    try {
      const first = await seed(ctx, [{ kind: 'event', topic: 'deploy' }], '-one')
      const second = await seed(ctx, [{ kind: 'event', topic: 'deploy' }], '-two')
      await flush()
      ctx.emit('robot/event', 'deploy', undefined)
      await flush()
      await expect(ctx.robots.runs(first.id)).resolves.toHaveLength(1)
      await expect(ctx.robots.runs(second.id)).resolves.toHaveLength(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('logs a start failure when the robot is already running', async () => {
    const ctx = await bench(true)
    try {
      const robot = await seed(ctx, [
        { kind: 'cron', expression: '* * * * *', timeZone: 'UTC' },
        { kind: 'event', topic: 'deploy' },
      ], '-busy')
      await ctx.plugin({ name, inject, apply })
      await flush()
      await vi.advanceTimersByTimeAsync(30_000)
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(1)

      ctx.emit('robot/event', 'deploy', { id: 2 })
      await flush()
      await expect(ctx.robots.runs(robot.id)).resolves.toHaveLength(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('ignores unrelated domain changes', async () => {
    const ctx = await bench()
    try {
      ctx.emit('domain/changed', { domain: 'other', table: 'robots', operation: 'put', key: 'x', value: {} })
      ctx.emit('domain/changed', { domain: 'tomato_robot', table: 'runs', operation: 'put', key: 'x', value: {} })
      await flush()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
