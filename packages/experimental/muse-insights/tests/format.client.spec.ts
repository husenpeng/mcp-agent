/** The recap list's brief keeps a work item's first prose line and nothing else. */
import { describe, expect, it } from 'vitest'
import { formatDay, formatTime, workItemSessions } from '../src/client/format.ts'
import type { DailyRecap, RecapWorkItem } from '../src/types.ts'

describe('workItemSessions', () => {
  const session = (sessionId: string, title: string) => ({ sessionId, title, summary: '', messageCount: 1 })
  const recap: DailyRecap = {
    day: '2026-11-02',
    generatedAt: 1,
    source: 'local',
    headline: '',
    summary: '',
    workItems: [],
    openTasks: [],
    sessions: [session('s1', 'Launch plan'), session('s2', 'Legal review')],
    messageCount: 2,
  }
  const item: RecapWorkItem = {
    problem: 'The launch plan has no owner',
    conclusion: '',
    solution: '',
    status: 'done',
    sessionIds: ['s2', 'missing', 's1'],
  }

  it('resolves the item’s Sessions in its own order', () => {
    expect(workItemSessions(recap, item).map(entry => entry.title)).toEqual(['Legal review', 'Launch plan'])
  })

  it('keeps nothing for an item that named no Session', () => {
    expect(workItemSessions(recap, { ...item, sessionIds: [] })).toEqual([])
  })
})

describe('formatDay', () => {
  it('shows a Host day as a long local date and keeps one it cannot parse', () => {
    expect(formatDay('2026-11-02', 'en-US')).toBe('Monday, November 2')
    expect(formatDay('not-a-day', 'en-US')).toBe('not-a-day')
  })
})

describe('formatTime', () => {
  it('shows an instant as a short local time', () => {
    expect(formatTime(new Date(2026, 10, 2, 18, 5).getTime(), 'en-US')).toBe('06:05 PM')
  })
})
