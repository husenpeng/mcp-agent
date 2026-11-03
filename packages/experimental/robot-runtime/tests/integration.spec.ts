import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@tomato/agent-loop-testkit'
import { Context } from '@tomato/cordis'
import type { RobotSpec, Robots, Run, RunId, Trigger } from '@tomato/experimental-robot'
import { isTerminalRunState } from '@tomato/experimental-robot'
import LocalRobots from '@tomato/experimental-robot-local'
import { apply as applyTriggers, emitRobotEvent, inject as triggerInject, name as triggerName } from '@tomato/experimental-robot-triggers'
import { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@tomato/llm'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import { apply as applyRuntime, inject as runtimeInject, name as runtimeName } from '../src/index.ts'

function makeSpec(triggers: readonly Trigger[]): RobotSpec {
  return {
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
      mission: 'Review changes and report defects',
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

class TextAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'reviewed' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: 'reviewed' } }
    yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 8 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

async function flush(): Promise<void> {
  for (let index = 0; index < 100; index++) await Promise.resolve()
}

async function waitForRun(robots: Robots, id: RunId): Promise<Run> {
  for (let attempt = 0; attempt < 500; attempt++) {
    const run = await robots.run(id)
    if (run !== undefined && isTerminalRunState(run.state)) return run
    await flush()
    await vi.advanceTimersByTimeAsync(1)
  }
  throw new Error(`run ${id} did not settle`)
}

async function bench() {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
  const adapter = new TextAdapter()
  ctx.llm.registerAdapter(['test-provider'], adapter)
  await mountAgentLoopTestHarness(ctx)

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
  await ctx.plugin({ name: runtimeName, inject: runtimeInject, apply: applyRuntime })
  await ctx.plugin({ name: triggerName, inject: triggerInject, apply: applyTriggers })
  return { ctx, adapter }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('robot module integration', () => {
  it('runs an event-triggered run end to end through the production AgentLoop', async () => {
    const test = await bench()
    try {
      const revision = await test.ctx.robots.publish(makeSpec([{ kind: 'event', topic: 'deploy' }]))
      const robot = await test.ctx.robots.instantiate(revision.ref)
      await flush()

      emitRobotEvent(test.ctx, 'deploy', { id: 7 })
      await flush()
      const runs = await test.ctx.robots.runs(robot.id)
      expect(runs).toHaveLength(1)
      const run = runs[0]
      if (run === undefined) throw new Error('no accepted run')
      const settled = await waitForRun(test.ctx.robots, run.id)

      expect(settled).toMatchObject({ state: 'succeeded', output: 'reviewed' })
      expect(test.adapter.requests).toHaveLength(1)
      const prompt = JSON.stringify(test.adapter.requests[0]?.messages)
      expect(prompt).toContain('## Robot mission')
      expect(prompt).toContain('Review changes and report defects')
      expect(prompt).toContain('deploy')
    } finally {
      await test.ctx.fiber.dispose()
    }
  })

  it('runs a cron-triggered run end to end with the host timer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T10:00:30Z'))
    const test = await bench()
    try {
      const revision = await test.ctx.robots.publish(makeSpec([{ kind: 'cron', expression: '* * * * *', timeZone: 'UTC' }]))
      const robot = await test.ctx.robots.instantiate(revision.ref)
      await flush()

      await vi.advanceTimersByTimeAsync(30_000)
      await flush()
      const runs = await test.ctx.robots.runs(robot.id)
      expect(runs).toHaveLength(1)
      const run = runs[0]
      if (run === undefined) throw new Error('no accepted run')
      const settled = await waitForRun(test.ctx.robots, run.id)

      expect(settled).toMatchObject({ state: 'succeeded', output: 'reviewed' })
      expect(test.adapter.requests).toHaveLength(1)
      expect(JSON.stringify(test.adapter.requests[0]?.messages)).toContain('Review changes and report defects')
    } finally {
      await test.ctx.fiber.dispose()
    }
  })
})
