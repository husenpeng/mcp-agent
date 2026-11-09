// @vitest-environment jsdom
/** Browser-local notice bookkeeping survives reloads and rejects malformed values. */
import { afterEach, describe, expect, it } from 'vitest'
import { NOTICE_STORAGE_KEY, readNoticeMemory, writeNoticeMemory } from '../src/client/notice-state.ts'

afterEach(() => { localStorage.clear() })

describe('notice memory', () => {
  it('starts empty and round-trips one written value', () => {
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 0, lastReminderAt: 0 })
    writeNoticeMemory({ lastRecapNoticeAt: 42, lastReminderAt: 7 })
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 42, lastReminderAt: 7 })
  })

  it('ignores malformed, non-object, and non-finite values', () => {
    localStorage.setItem(NOTICE_STORAGE_KEY, 'not json')
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 0, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, 'null')
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 0, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify({ lastRecapNoticeAt: 'today', lastReminderAt: -4 }))
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 0, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify({ lastRecapNoticeAt: 7, lastReminderAt: Number.NaN }))
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 7, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify({ recapDay: '2026-11-02' }))
    expect(readNoticeMemory()).toEqual({ lastRecapNoticeAt: 0, lastReminderAt: 0 })
  })
})
