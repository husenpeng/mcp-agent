import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@tomato/cordis'
import { templateSpec } from '@tomato/experimental-robot'
import RobotTemplateRegistry from '@tomato/experimental-robot/templates'
import { parseRobotSpec } from '@tomato/experimental-robot-local'
import SkillRegistry from '@tomato/skill'
import { describe, expect, it } from 'vitest'
import * as marketing from '../src/index.ts'
import { availableTemplates, MARKETING_TEMPLATES, readMarketingSkills } from '../src/index.ts'

const SKILL_IDS = MARKETING_TEMPLATES.map(template => template.id).sort()

describe('marketing templates', () => {
  it('ships eleven templates with unique ids, one skill each, and Chinese and English copy', () => {
    expect(MARKETING_TEMPLATES).toHaveLength(11)
    expect(new Set(MARKETING_TEMPLATES.map(template => template.id)).size).toBe(11)
    expect(MARKETING_TEMPLATES.map(template => template.id)).toEqual([
      'brand-insight', 'influencer-marketing', 'creative-intelligence',
      'tiktok-product-selection', 'tiktok-data-insight', 'instagram-product-selection', 'instagram-data-insight',
      'x-product-selection', 'x-data-insight', 'youtube-product-selection', 'youtube-data-insight',
    ])
    for (const template of MARKETING_TEMPLATES) {
      expect(template.spec.capability.skills).toEqual([template.id])
      expect(Object.keys(template.text).sort()).toEqual(['en', 'zh'])
      expect(template.text['zh']?.mission).toContain(template.id)
    }
  })

  it('uses the agreed execution profile on every template', () => {
    for (const template of MARKETING_TEMPLATES) {
      expect(template.spec).toMatchObject({
        goal: { triggers: [{ kind: 'manual' }], budget: { tokens: 400_000, millis: 1_800_000, toolCalls: 300 } },
        capability: { network: 'any', permissionPreset: 'workspace-write' },
        io: { output: { format: 'file', delivery: 'artifact' } },
      })
    }
  })

  it('produces specifications the local provider accepts in both languages', () => {
    for (const template of MARKETING_TEMPLATES) {
      for (const locale of ['zh', 'en']) expect(() => parseRobotSpec(templateSpec(template, locale))).not.toThrow()
    }
  })

  it('names a permission preset the base bundle configures', () => {
    for (const template of MARKETING_TEMPLATES) {
      expect(['read-only', 'workspace-write', 'danger-full-access']).toContain(template.spec.capability.permissionPreset)
    }
  })
})

describe('marketing skills', () => {
  it('reads every shipped skill directory', () => {
    expect(readMarketingSkills().map(skill => skill.name)).toEqual(SKILL_IDS)
  })

  it('offers only templates whose skill ships, so every listed template can run', () => {
    const shipped = readMarketingSkills()
    expect(availableTemplates(shipped)).toHaveLength(11)
    expect(availableTemplates(shipped.filter(skill => skill.name !== 'brand-insight')).map(template => template.id)).not.toContain('brand-insight')
  })

  it('rejects a skill whose frontmatter names another directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'marketing-skills-'))
    try {
      mkdirSync(join(root, 'alpha'))
      writeFileSync(join(root, 'alpha', 'SKILL.md'), '---\nname: beta\ndescription: x\n---\n\nbody\n')
      expect(() => readMarketingSkills(root)).toThrow(/declares "beta" instead of "alpha"/)
      writeFileSync(join(root, 'alpha', 'SKILL.md'), 'no frontmatter')
      expect(() => readMarketingSkills(root)).toThrow(/missing its name, description, or body/)
      writeFileSync(join(root, 'alpha', 'SKILL.md'), '---\nname: alpha\ndescription: "Quoted text"\n---\n\nbody\n')
      writeFileSync(join(root, 'notes.txt'), 'not a skill directory')
      mkdirSync(join(root, 'scratch'))
      expect(readMarketingSkills(root)).toMatchObject([{ name: 'alpha', description: 'Quoted text' }])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('registers templates and skills while mounted and removes them on dispose', async () => {
    const ctx = new Context()
    try {
      await ctx.plugin(SkillRegistry)
      await ctx.plugin(RobotTemplateRegistry)
      const fiber = await ctx.plugin(marketing)
      expect(ctx.robotTemplates.list().map(template => template.id)).toEqual(MARKETING_TEMPLATES.map(template => template.id))
      const skill = await ctx.skills.get('youtube-data-insight')
      expect(skill).toMatchObject({ source: 'bundled', provider: 'tomato-marketing', resourceBase: { kind: 'directory' } })
      expect(skill?.content).toContain('youtube_insight.py')
      await fiber.dispose()
      expect(ctx.robotTemplates.list()).toEqual([])
      expect(await ctx.skills.get('youtube-data-insight')).toBeUndefined()
    } finally {
      await ctx.fiber.dispose()
    }
  })
})

/**
 * Find a Python that can run the skill scripts: 3.11+ with XlsxWriter. The
 * Tomato bundled runtime qualifies; CI hosts without one skip the suite.
 */
function skillPython(): string | undefined {
  const candidates = [process.env.TOMATO_SKILL_PYTHON, 'python3.12', 'python3.13', 'python3.11', 'python3']
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === '') continue
    const probe = spawnSync(candidate, ['-c', 'import sys, xlsxwriter; sys.exit(0 if sys.version_info >= (3, 11) else 1)'], { encoding: 'utf8' })
    if (probe.status === 0) return candidate
  }
  return undefined
}

const python = skillPython()

describe.skipIf(python === undefined)('skill scripts', () => {
  it.each(readMarketingSkills().map(skill => skill.name))('%s passes its offline unittest suite', (skill) => {
    const skillDir = fileURLToPath(new URL(`../skills/${skill}/`, import.meta.url))
    const result = spawnSync(python!, ['-m', 'unittest', 'discover', '-s', 'tests'], { cwd: skillDir, encoding: 'utf8', timeout: 120_000 })
    expect(result.stderr).toMatch(/\nOK(?: \(skipped=\d+\))?\s*$/u)
    expect(result.status).toBe(0)
  })
})
