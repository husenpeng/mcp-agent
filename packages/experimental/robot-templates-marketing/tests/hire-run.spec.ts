/** A hired marketing template runs through the production runtime and AgentLoop; only the model is scripted. */
import AgentDefaultModelConfig from '@tomato/agent-default-model'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@tomato/agent-loop-testkit'
import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import { isTerminalRunState } from '@tomato/experimental-robot'
import type { Robots, Run, RunId, RobotTemplateId } from '@tomato/experimental-robot'
import RobotTemplateRegistry from '@tomato/experimental-robot/templates'
import LocalRobots from '@tomato/experimental-robot-local'
import { apply as applyRuntime, inject as runtimeInject, name as runtimeName } from '@tomato/experimental-robot-runtime'
import RobotController from '@tomato/api-robot-controller'
import { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@tomato/llm'
import Skills from '@tomato/skill'
import * as SkillTool from '@tomato/tool-skill'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import TypertRegistry from '@tomato/typert-registry'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import * as marketing from '../src/index.ts'

class TextAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'report written' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: 'report written' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

async function waitForRun(robots: Robots, id: RunId): Promise<Run> {
  for (let attempt = 0; attempt < 400; attempt++) {
    const run = await robots.run(id)
    if (run !== undefined && isTerminalRunState(run.state)) return run
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  throw new Error(`run ${id} did not settle`)
}

async function bench() {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx, { workingDirectory: true })
  await ctx.plugin(AgentDefaultModelConfig, { provider: 'test-provider', model: 'test-model' })
  const adapter = new TextAdapter()
  ctx.llm.registerAdapter(['test-provider'], adapter)
  await ctx.plugin(Skills)
  await ctx.plugin(SkillTool)
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
  await ctx.plugin(TypertRegistry)
  await ctx.plugin(LocalRobots)
  await ctx.plugin(RobotTemplateRegistry)
  await ctx.plugin(marketing)
  await ctx.plugin(RobotController)
  await ctx.plugin({ name: runtimeName, inject: runtimeInject, apply: applyRuntime })
  return { ctx, adapter }
}

describe('hired marketing template', () => {
  it('runs with the localized mission and the bundled skill in the catalog', async () => {
    const { ctx, adapter } = await bench()
    try {
      const robot = await ctx.robotController.hire({ templateId: brandString<RobotTemplateId>('youtube-data-insight'), locale: 'zh' })
      expect(robot.name).toBe('YouTube 数据洞察师')
      const run = await ctx.robotController.start({ robotId: robot.id, message: '分析 @mkbhd 最近 30 个视频' })
      const settled = await waitForRun(ctx.robots, run.id)
      expect(settled).toMatchObject({ state: 'succeeded', output: 'report written' })

      const request = JSON.stringify(adapter.requests[0])
      expect(request).toContain('## Robot mission')
      expect(request).toContain('采集数据前先加载 youtube-data-insight 技能')
      expect(request).toContain('在工作目录写出一份可独立打开的 HTML 报告和一份 xlsx 明细表')
      expect(request).toContain('<available_skills>')
      expect(request).toMatch(/youtube-data-insight/u)
      expect(request).toContain('分析 @mkbhd 最近 30 个视频')
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
