import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import { describe, expect, it } from 'vitest'
import { emptyRobotSpec, templateSpec, templateText } from '../src/index.ts'
import type { RobotTemplate, RobotTemplateId } from '../src/index.ts'
import RobotTemplateRegistry from '../src/templates.ts'

const base = emptyRobotSpec()

const TEMPLATE: RobotTemplate = {
  id: brandString<RobotTemplateId>('youtube-insight'),
  category: 'youtube',
  text: {
    en: { category: 'YouTube', name: 'YouTube insight', description: 'Channel analytics', mission: 'Analyze channels', successCriteria: ['report'], acceptance: ['cites sources'] },
    zh: { category: 'YouTube', name: 'YouTube 数据洞察师', description: '频道分析', mission: '分析频道', successCriteria: ['报告'], acceptance: ['标注来源'] },
  },
  spec: {
    position: base.position,
    goal: { ...base.goal, budget: { tokens: 400_000, millis: 1_800_000, cost: 0, toolCalls: 300 } },
    capability: { ...base.capability, network: 'any', skills: ['youtube-insight'] },
    io: { input: base.io.input, output: { schema: 'robot.result', format: 'file', delivery: 'artifact' } },
    memory: base.memory,
    a2a: base.a2a,
  },
}

describe('templateText', () => {
  it('selects the exact locale, then its language, then English', () => {
    expect(templateText(TEMPLATE, 'zh').name).toBe('YouTube 数据洞察师')
    expect(templateText(TEMPLATE, 'zh-CN').name).toBe('YouTube 数据洞察师')
    expect(templateText(TEMPLATE, 'ja').name).toBe('YouTube insight')
  })
})

describe('templateSpec', () => {
  it('fills localized fields and keeps the template blocks', () => {
    const spec = templateSpec(TEMPLATE, 'zh')
    expect(spec).toMatchObject({
      name: 'YouTube 数据洞察师',
      description: '频道分析',
      goal: { mission: '分析频道', successCriteria: ['报告'], budget: { tokens: 400_000, toolCalls: 300 } },
      capability: { network: 'any', skills: ['youtube-insight'] },
      io: { output: { format: 'file' }, acceptance: ['标注来源'] },
    })
    expect(templateSpec(TEMPLATE, 'en', 'Mine').name).toBe('Mine')
  })

  it('returns a copy that shares no arrays with the template', () => {
    const spec = templateSpec(TEMPLATE, 'en')
    expect(spec.capability.skills).not.toBe(TEMPLATE.spec.capability.skills)
    expect(spec.goal.successCriteria).not.toBe(TEMPLATE.text.en.successCriteria)
  })
})

describe('robot template registry', () => {
  it('lists registrations in order, rejects duplicates, and removes on dispose', async () => {
    const ctx = new Context()
    try {
      await ctx.plugin(RobotTemplateRegistry)
      const kinds: string[] = []
      ctx.effect(() => ctx.on('robot/changed', kind => kinds.push(kind)))
      const second = { ...TEMPLATE, id: brandString<RobotTemplateId>('second') }
      const fiber = await ctx.plugin({
        name: 'fixture-templates',
        inject: ['robotTemplates'],
        apply: (child: Context) => {
          child.effect(() => child.robotTemplates.register(TEMPLATE))
          child.effect(() => child.robotTemplates.register(second))
        },
      })
      expect(ctx.robotTemplates.list().map(entry => entry.id)).toEqual(['youtube-insight', 'second'])
      expect(ctx.robotTemplates.get(TEMPLATE.id)).toBe(TEMPLATE)
      expect(ctx.robotTemplates.hireSpec(TEMPLATE.id, 'zh', 'Mine')).toMatchObject({ name: 'Mine', goal: { mission: '分析频道' } })
      expect(ctx.robotTemplates.hireSpec(brandString<RobotTemplateId>('missing'), 'zh')).toBeUndefined()
      expect(() => ctx.robotTemplates.register(TEMPLATE)).toThrow(/already registered/)
      await fiber.dispose()
      expect(ctx.robotTemplates.list()).toEqual([])
      expect(kinds).toEqual(['templates', 'templates', 'templates', 'templates'])
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('leaves a re-registered template in place when a stale disposer runs', async () => {
    const ctx = new Context()
    try {
      await ctx.plugin(RobotTemplateRegistry)
      const stale = ctx.robotTemplates.register(TEMPLATE)
      stale()
      const replacement = { ...TEMPLATE }
      ctx.robotTemplates.register(replacement)
      stale()
      expect(ctx.robotTemplates.get(TEMPLATE.id)).toBe(replacement)
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
