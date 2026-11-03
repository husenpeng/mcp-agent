/** Host-local day and lookback boundaries. */
import { describe, expect, it } from 'vitest'
import { dayRange, daysBefore } from '../src/day.ts'

describe('dayRange', () => {
  it('opens at local midnight and closes at the next one', () => {
    const now = new Date(2026, 10, 2, 18, 35, 12, 250).getTime()
    const range = dayRange(now)
    expect(range.key).toBe('2026-11-02')
    const start = new Date(range.start)
    expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds()])
      .toEqual([2026, 10, 2, 0, 0, 0])
    const end = new Date(range.end)
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours()])
      .toEqual([2026, 10, 3, 0])
    expect(range.end).toBeGreaterThan(range.start)
  })

  it('keeps a wide date inside the key format', () => {
    expect(dayRange(new Date(2026, 0, 1, 0, 0, 1).getTime()).key).toBe('2026-01-01')
  })
})

describe('daysBefore', () => {
  it('subtracts local days and keeps the local time of day', () => {
    const now = new Date(2026, 10, 2, 18, 35, 12, 250).getTime()
    const before = new Date(daysBefore(now, 7))
    expect([before.getFullYear(), before.getMonth(), before.getDate(), before.getHours(), before.getMinutes(), before.getSeconds()])
      .toEqual([2026, 9, 26, 18, 35, 12])
  })
})
