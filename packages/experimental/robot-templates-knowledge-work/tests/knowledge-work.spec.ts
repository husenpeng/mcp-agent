import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { brandString } from '@tomato/branded'
import { Context } from '@tomato/cordis'
import { templateSpec } from '@tomato/experimental-robot'
import type { RobotTemplateId } from '@tomato/experimental-robot'
import RobotTemplateRegistry from '@tomato/experimental-robot/templates'
import { parseRobotSpec } from '@tomato/experimental-robot-local'
import SkillRegistry, { isSkillName } from '@tomato/skill'
import { describe, expect, it } from 'vitest'
import * as knowledgeWork from '../src/index.ts'
import { compose, PLUGINS_ROOT } from '../src/index.ts'
import { connectorPlan, serverNamespace } from '../src/connectors.ts'
import { readPlugins } from '../src/plugins.ts'
import { ROLE_COPY } from '../src/templates.ts'

const CATALOG = compose()

describe('knowledge-work templates', () => {
  it('ships one template per vendored role with English and Chinese copy', () => {
    expect(CATALOG.templates).toHaveLength(16)
    expect(new Set(CATALOG.templates.map(template => template.id)).size).toBe(16)
    expect(Object.keys(ROLE_COPY).sort()).toEqual(CATALOG.templates.map(template => template.id).sort())
    for (const template of CATALOG.templates) {
      expect(Object.keys(template.text).sort()).toEqual(['en', 'zh'])
      expect(template.text['zh']?.mission.length).toBeGreaterThan(10)
      expect(template.spec.capability.skills.length).toBeGreaterThan(0)
      expect(template.text['en']?.mission).toContain('skill')
    }
  })

  it('uses one execution profile across every role', () => {
    for (const template of CATALOG.templates) {
      expect(template.spec).toMatchObject({
        goal: { triggers: [{ kind: 'manual' }], budget: { tokens: 400_000, millis: 1_800_000, toolCalls: 300 }, maxConcurrentRuns: 1 },
        capability: { network: 'any', permissionPreset: 'workspace-write', sandbox: 'workspace' },
        io: { output: { format: 'markdown', delivery: 'chat' } },
      })
    }
  })

  it('produces specifications the local provider accepts in both languages', () => {
    for (const template of CATALOG.templates) {
      for (const locale of ['zh', 'en']) expect(() => parseRobotSpec(templateSpec(template, locale))).not.toThrow()
    }
  })
})

describe('vendored Claude skills', () => {
  it('reads every vendored role and skill', () => {
    const plugins = readPlugins(PLUGINS_ROOT)
    expect(plugins.map(plugin => plugin.id)).toHaveLength(16)
    expect(plugins.reduce((total, plugin) => total + plugin.skills.length, 0)).toBe(181)
    expect(CATALOG.candidates).toHaveLength(181)
  })

  it('keeps every shipped skill name unique by prefixing only duplicated names', () => {
    const names = CATALOG.candidates.map(candidate => candidate.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(expect.arrayContaining([
      'sales-lead-triage',
      'small-business-lead-triage',
      'marketing-competitive-brief',
      'product-management-competitive-brief',
      'bio-research-start',
      'productivity-start',
    ]))
    expect(names).not.toContain('lead-triage')
    expect(names).not.toContain('start')
    for (const name of names) expect(isSkillName(name)).toBe(true)
  })

  it('rewrites connector placeholders and resolvable slash commands', () => {
    const marketing = readPlugins(PLUGINS_ROOT).find(plugin => plugin.id === 'marketing')
    const campaign = marketing?.skills.find(skill => skill.name === 'campaign-plan')
    expect(campaign?.body).not.toContain('~~')
    expect(campaign?.body).toContain('campaign-plan')
    const support = readPlugins(PLUGINS_ROOT).find(plugin => plugin.id === 'customer-support')
    expect(support?.skills.find(skill => skill.name === 'customer-escalation')?.body).toContain('support platform tool')
    expect(support?.skills.find(skill => skill.name === 'customer-escalation')?.body).not.toContain('~~support platform')
  })

  it('imports a Claude command as a user-invocable skill that reads the user request', () => {
    const product = readPlugins(PLUGINS_ROOT).find(plugin => plugin.id === 'product-management')
    const brainstorm = product?.skills.find(skill => skill.name === 'brainstorm')
    expect(brainstorm?.body).toContain("the user's request")
    expect(brainstorm?.body).not.toContain('$ARGUMENTS')
  })

  it('keeps a reference to a command the plugin does not ship', () => {
    const small = readPlugins(PLUGINS_ROOT).find(plugin => plugin.id === 'small-business')
    const router = small?.skills.find(skill => skill.name === 'smb-router')
    expect(router?.body).toContain('the plan-payroll skill')
    expect(router?.body).toContain('/close-month')
  })

  it('reports a missing manifest, a divergent manifest name, and a bad skill file', () => {
    const root = mkdtempSync(join(tmpdir(), 'knowledge-work-'))
    try {
      mkdirSync(join(root, 'alpha', '.claude-plugin'), { recursive: true })
      mkdirSync(join(root, 'alpha', 'skills', 'alpha'), { recursive: true })
      writeFileSync(join(root, 'alpha', '.claude-plugin', 'plugin.json'), '{ not json')
      expect(() => readPlugins(root)).toThrow(/plugin\.json/)
      writeFileSync(join(root, 'alpha', '.claude-plugin', 'plugin.json'), '{"name":"beta"}')
      expect(() => readPlugins(root)).toThrow(/differs from directory "alpha"/)
      writeFileSync(join(root, 'alpha', '.claude-plugin', 'plugin.json'), '{"name":"alpha"}')
      writeFileSync(join(root, 'alpha', 'skills', 'alpha', 'SKILL.md'), '---\nname: gamma\ndescription: x\n---\n\nbody\n')
      expect(() => readPlugins(root)).toThrow(/frontmatter name must be "alpha"/)
      writeFileSync(join(root, 'alpha', 'skills', 'alpha', 'SKILL.md'), '---\nname: alpha\n---\n\nbody\n')
      expect(() => readPlugins(root)).toThrow(/no description/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects a vendored role that has no template copy', () => {
    const root = mkdtempSync(join(tmpdir(), 'knowledge-work-'))
    try {
      mkdirSync(join(root, 'unknown', '.claude-plugin'), { recursive: true })
      writeFileSync(join(root, 'unknown', '.claude-plugin', 'plugin.json'), '{"name":"unknown"}')
      mkdirSync(join(root, 'unknown', 'skills'))
      expect(() => compose(root)).toThrow(/unknown has no template copy/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('MCP connectors', () => {
  it('normalizes declared names into mcp-client namespaces', () => {
    expect(serverNamespace('google calendar')).toBe('google-calendar')
    expect(serverNamespace('Microsoft-365')).toBe('microsoft-365')
    expect(serverNamespace('atlassian-rovo')).toBe('atlassian-rovo')
  })

  it('plans one mountable row per endpoint and reports unfinished declarations', () => {
    const plan = connectorPlan(readPlugins(PLUGINS_ROOT))
    expect(plan.rows.length).toBeGreaterThan(20)
    expect(new Set(plan.rows.map(row => row.serverName)).size).toBe(plan.rows.length)
    for (const row of plan.rows) {
      expect(row.serverName).toMatch(/^[a-z0-9][a-z0-9-]{0,31}$/u)
      expect(row.url).toMatch(/^https?:\/\//u)
      expect(row.transport).toBe('streamable-http')
    }
    expect(plan.gaps.missingUrl).toContain('google calendar')
    expect(plan.gaps.needsOAuth).toContain('slack')
    expect(plan.gaps.conflicting).toContain('similarweb')
  })
})

describe('registration', () => {
  it('registers every template and bundled skill while mounted and removes them on dispose', async () => {
    const ctx = new Context()
    try {
      await ctx.plugin(SkillRegistry)
      await ctx.plugin(RobotTemplateRegistry)
      const fiber = await ctx.plugin(knowledgeWork)
      expect(ctx.robotTemplates.list().map(template => template.id)).toEqual(CATALOG.templates.map(template => template.id))
      const skill = await ctx.skills.get('campaign-plan')
      expect(skill).toMatchObject({ source: 'bundled', provider: 'tomato-knowledge-work', resourceBase: { kind: 'directory' } })
      expect(skill?.content).toContain('Campaign Brief Structure')
      const hired = ctx.robotTemplates.hireSpec(brandString<RobotTemplateId>('marketing'), 'zh', '我的营销机器人')
      expect(hired?.goal.mission).toContain('营销')
      await fiber.dispose()
      expect(ctx.robotTemplates.list()).toEqual([])
      expect(await ctx.skills.get('campaign-plan')).toBeUndefined()
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('resolves every declared template skill inside the bundled catalog', () => {
    const shipped = new Set(CATALOG.candidates.map(candidate => candidate.name))
    for (const template of CATALOG.templates) {
      for (const skill of template.spec.capability.skills) expect(shipped.has(skill)).toBe(true)
    }
  })
})
