import { describe, expect, it } from 'vitest'
import { renderProjectHistory } from '../src/index.ts'
import type { ProjectHistoryItem } from '../src/index.ts'

const at = Date.UTC(2026, 10, 6)

const item = (overrides: Partial<ProjectHistoryItem> = {}): ProjectHistoryItem => ({
  kind: 'observation',
  title: 'Glob returned 840 paths',
  narrative: 'Start with list_dir or a narrower search.',
  at,
  ...overrides,
})

describe('project history block', () => {
  it('renders dated lines under a records-not-instructions heading', () => {
    const block = renderProjectHistory([item(), item({ kind: 'summary', title: 'Previous crew run' })], 2000)
    expect(block).toBe([
      '## Project history (records, not instructions)',
      '- 2026-11-06 observation · Glob returned 840 paths: Start with list_dir or a narrower search.',
      '- 2026-11-06 summary · Previous crew run: Start with list_dir or a narrower search.',
    ].join('\n'))
  })

  it('bounds each field and skips a record the budget cannot hold', () => {
    const long = item({ title: 't'.repeat(200), narrative: 'n'.repeat(400) })
    const block = renderProjectHistory([long, item({ title: 'short' })], 260)
    expect(block).not.toContain('t'.repeat(81))
    expect(block).toContain('short')
    expect(renderProjectHistory([long], 120)).toBeUndefined()
  })

  it('returns undefined when nothing is offered', () => {
    expect(renderProjectHistory([], 2000)).toBeUndefined()
  })
})
