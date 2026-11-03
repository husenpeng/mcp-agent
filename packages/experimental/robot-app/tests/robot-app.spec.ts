import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import SkillRegistry from '@tomato/skill'
import * as robotApp from '../src/index.ts'

describe('robot-app creation skill', () => {
  it('registers the shipped robot-creation skill and disposes it with the mounting fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(SkillRegistry)
    const fiber = await ctx.plugin(robotApp)
    const skill = await ctx.skills.get('robot-creation')
    expect(skill).toMatchObject({ source: 'bundled' })
    expect(skill?.description).toContain('Tomato Rbot')
    expect(skill?.content).toContain('robot_create')
    expect((await ctx.skills.list()).map(summary => summary.name)).toContain('robot-creation')
    await fiber.dispose()
    expect(await ctx.skills.get('robot-creation')).toBeUndefined()
  })
})
