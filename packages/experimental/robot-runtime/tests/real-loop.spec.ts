import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@tomato/agent-loop-testkit'
import { Context } from '@tomato/cordis'
import type { RobotSpec, Robots, Run, RunId } from '@tomato/experimental-robot'
import { isTerminalRunState } from '@tomato/experimental-robot'
import LocalRobots from '@tomato/experimental-robot-local'
import { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@tomato/llm'
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
    mission: 'Review changes and report defects',
    successCriteria: ['find defects'],
    triggers: [{ kind: 'manual' }],
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
} satisfies RobotSpec

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

async function waitForRun(robots: Robots, id: RunId): Promise<Run> {
  for (let attempt = 0; attempt < 500; attempt++) {
    const run = await robots.run(id)
    if (run !== undefined && isTerminalRunState(run.state)) return run
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error(`run ${id} did not settle`)
}

describe('robot runtime with the production AgentLoop', () => {
  it('drives one real model request with the mission prompt and records its answer', async () => {
    const ctx = new Context()
    try {
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
      await ctx.plugin({ name, inject, apply })

      const revision = await ctx.robots.publish(structuredClone(BASE))
      const robot = await ctx.robots.instantiate(revision.ref)
      const accepted = await ctx.robots.start(robot.id, { message: 'review the diff' })
      const settled = await waitForRun(ctx.robots, accepted.id)

      expect(settled).toMatchObject({ state: 'succeeded', output: 'reviewed' })
      expect(adapter.requests).toHaveLength(1)
      const request = adapter.requests[0]
      const prompt = request === undefined ? '' : JSON.stringify(request.messages)
      expect(prompt).toContain('## Robot mission')
      expect(prompt).toContain('Review changes and report defects')
      expect(prompt).toContain('review the diff')
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
