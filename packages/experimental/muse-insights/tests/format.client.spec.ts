/** The recap list's brief keeps a work item's first prose line and nothing else. */
import { describe, expect, it } from 'vitest'
import { formatDay, formatTime, workItemBrief } from '../src/client/format.ts'

describe('workItemBrief', () => {
  it('takes the first prose line after empty and fenced lines', () => {
    expect(workItemBrief('```text\n\nThe launch plan is ready.\nStill waiting on legal.\n```'))
      .toBe('The launch plan is ready.')
  })

  it('trims the line it takes', () => {
    expect(workItemBrief('  Ready  ')).toBe('Ready')
  })

  it('keeps nothing without prose', () => {
    expect(workItemBrief('')).toBe('')
    expect(workItemBrief('\n```text\n```')).toBe('')
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
