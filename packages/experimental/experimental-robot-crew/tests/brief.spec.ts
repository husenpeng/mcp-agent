import { describe, expect, it } from 'vitest'
import { composeBrief, extractMemory, summarize } from '../src/index.ts'
import type { BriefOptions } from '../src/index.ts'

const anchor: Omit<BriefOptions, 'budgetChars'> = {
  mission: 'Ship a campaign brief',
  successCriteria: ['Names the audience', 'Cites three sources'],
  stopConditions: ['Budget exhausted'],
  nodeLabel: '成稿',
  nodeRole: 'Turns research into the deliverable',
  instruction: 'Write the brief',
  memory: { decisions: [], constraints: [], open: [] },
  artifacts: [],
  replies: [],
  warnings: [],
}

describe('execution memory', () => {
  it('extracts marked decisions, constraints, open questions, and artifacts', () => {
    const memory = extractMemory([
      'Short answer first.',
      'DECISION: Use the creator angle',
      '- CONSTRAINT: Keep the budget under 20k',
      'OPEN: Which market first?',
      'ARTIFACT: report.xlsx',
      '决策：采用创作者视角',
    ].join('\n'))
    expect(memory).toMatchObject({
      decisions: ['Use the creator angle', '采用创作者视角'],
      constraints: ['Keep the budget under 20k'],
      open: ['Which market first?'],
      artifacts: ['report.xlsx'],
    })
    expect(memory.summary).toBe('Short answer first. DECISION: Use the creator angle - CONSTRAINT: Keep the budget under 20k OPEN: Which market first? ARTIFACT: report.xlsx 决策：采用创作者视角')
  })

  it('deduplicates markers and bounds each item', () => {
    const long = 'x'.repeat(500)
    const memory = extractMemory(`DECISION: same\nDECISION: same\nDECISION: ${long}`)
    expect(memory.decisions).toHaveLength(2)
    expect(memory.decisions[1]?.length).toBe(240)
  })

  it('summarizes at a sentence boundary within the limit', () => {
    const text = `${'a'.repeat(80)}. ${'b'.repeat(400)}`
    const summary = summarize(text, 120)
    expect(summary.endsWith('…')).toBe(true)
    expect(summary.length).toBeLessThanOrEqual(121)
  })

  it('keeps the anchor, role, and task inside the budget', () => {
    const brief = composeBrief({
      ...anchor,
      memory: { decisions: ['one'], constraints: ['two'], open: ['three'] },
      artifacts: [{ node: 'research', label: '调研', summary: 'facts' }],
      replies: [{ node: 'peer', label: '审校', summary: 'reply' }],
      warnings: ['a guard note'],
      budgetChars: 2000,
    })
    for (const expected of [
      '## Crew mission', '## Success criteria', '## Your role: 成稿', '## Your task', '## Output contract',
      '## Constraints from earlier steps', '## Decisions already made', '## Upstream results', '## Peer replies',
      '## Open questions', '## Guard notes',
    ]) expect(brief).toContain(expected)
    expect(brief.length).toBeLessThanOrEqual(2000)
  })

  it('drops optional sections before exceeding a tight budget', () => {
    const brief = composeBrief({
      ...anchor,
      memory: { decisions: ['d'.repeat(300)], constraints: [], open: [] },
      artifacts: [{ node: 'research', label: '调研', summary: 'a'.repeat(3000) }],
      replies: [],
      warnings: [],
      budgetChars: 500,
    })
    expect(brief).toContain('## Crew mission')
    expect(brief).not.toContain('## Upstream results')
    expect(brief.length).toBeLessThanOrEqual(500)
  })
})
