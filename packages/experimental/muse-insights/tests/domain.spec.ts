/** Stored recap formats: a version-1 work item still reads and serves as the current shape. */
import { expect, it } from 'vitest'
import { museInsightsDomain, servedRecap, storedRecapSchema } from '../src/domain.ts'

/** One recap whose work items were stored before items carried outcome and Sessions. */
const legacyRecap = {
  day: '2026-11-02',
  generatedAt: 1,
  source: 'local' as const,
  headline: '',
  summary: '',
  workItems: [{ title: 'The launch plan has no owner', detail: 'The plan is drafted.', status: 'unknown' as const }],
  openTasks: [],
  sessions: [],
  messageCount: 2,
}

it('reads and serves a stored version-1 work item', () => {
  const stored = storedRecapSchema.parse({ owner: 'local', recap: legacyRecap, latestEventTime: 1 })
  expect(servedRecap(stored.recap).workItems).toEqual([{
    problem: 'The launch plan has no owner',
    conclusion: '',
    solution: 'The plan is drafted.',
    status: 'unknown',
    sessionIds: [],
  }])
})

it('serves a current work item unchanged', () => {
  const current = {
    ...legacyRecap,
    workItems: [{
      problem: 'The launch plan has no owner',
      conclusion: 'The plan is drafted.',
      solution: 'Wrote the plan and named the owner.',
      status: 'done' as const,
      sessionIds: ['s1'],
    }],
  }
  const stored = storedRecapSchema.parse({ owner: 'local', recap: current, latestEventTime: 1 })
  expect(servedRecap(stored.recap)).toEqual(current)
})

it('keeps the stored version that already holds both work-item forms', () => {
  expect(museInsightsDomain.version).toBe(1)
  expect(museInsightsDomain).not.toHaveProperty('compatibleVersions')
})
