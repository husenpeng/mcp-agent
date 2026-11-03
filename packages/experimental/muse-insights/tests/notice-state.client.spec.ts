// @vitest-environment jsdom
/** Browser-local notice bookkeeping survives reloads and rejects malformed values. */
import { afterEach, describe, expect, it } from 'vitest'
import { NOTICE_STORAGE_KEY, readNoticeMemory, writeNoticeMemory } from '../src/client/notice-state.ts'

afterEach(() => { localStorage.clear() })

describe('notice memory', () => {
  it('starts empty and round-trips one written value', () => {
    expect(readNoticeMemory()).toEqual({ recapDay: null, lastReminderAt: 0 })
    writeNoticeMemory({ recapDay: '2026-11-02', lastReminderAt: 42 })
    expect(readNoticeMemory()).toEqual({ recapDay: '2026-11-02', lastReminderAt: 42 })
  })

  it('ignores malformed, non-object, and non-finite values', () => {
    localStorage.setItem(NOTICE_STORAGE_KEY, 'not json')
    expect(readNoticeMemory()).toEqual({ recapDay: null, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, 'null')
    expect(readNoticeMemory()).toEqual({ recapDay: null, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify({ recapDay: 7, lastReminderAt: -4 }))
    expect(readNoticeMemory()).toEqual({ recapDay: null, lastReminderAt: 0 })
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify({ recapDay: 'today', lastReminderAt: Number.NaN }))
    expect(readNoticeMemory()).toEqual({ recapDay: 'today', lastReminderAt: 0 })
  })
})
