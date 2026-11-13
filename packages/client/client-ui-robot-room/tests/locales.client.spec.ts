import { describe, expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.ts'

describe('room page dictionaries', () => {
  it('mirrors every Chinese key in English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })

  it('keeps every phrase non-empty', () => {
    for (const [key, value] of Object.entries(zh)) expect(value.trim(), key).not.toBe('')
    for (const [key, value] of Object.entries(en)) expect(value.trim(), key).not.toBe('')
  })
})
