import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import SkillRegistry from '@tomato/skill'
import * as robotApp from '../src/index.ts'

describe('robot-app bundled skills', () => {
  it('registers the shipped creation and grilling skills and disposes them with the mounting fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(SkillRegistry)
    const fiber = await ctx.plugin(robotApp)
    const skill = await ctx.skills.get('robot-creation')
    expect(skill).toMatchObject({ source: 'bundled' })
    expect(skill?.description).toContain('Tomato Rbot')
    expect(skill?.content).toContain('robot_create')
    expect(skill?.content.replace(/\s+/g, ' ')).toContain('one question at a time')
    expect(skill?.content ?? '').not.toContain('Ask all four questions')
    expect((await ctx.skills.list()).map(summary => summary.name)).toContain('robot-creation')

    const grilling = await ctx.skills.get('grilling')
    expect(grilling).toMatchObject({ source: 'bundled', name: 'grilling' })
    expect(grilling?.content.replace(/\s+/g, ' ')).toContain('one at a time')

    await fiber.dispose()
    expect(await ctx.skills.get('robot-creation')).toBeUndefined()
    expect(await ctx.skills.get('grilling')).toBeUndefined()
  })
})
