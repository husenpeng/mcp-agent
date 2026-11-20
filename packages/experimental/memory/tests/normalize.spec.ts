/** Write-boundary normalization of stored memory identifiers and statements. */
import { describe, expect, it } from 'vitest'
import { boundStatement, normalizeStatement } from '@tomato/experimental-memory'

describe('normalizeStatement', () => {
  it('keeps short text unchanged', () => {
    expect(normalizeStatement('  Chose  FTS5 ')).toBe('Chose FTS5')
  })
})

describe('boundStatement', () => {
  it('keeps a value at or under the limit unchanged', () => {
    expect(boundStatement('abcdef', 6)).toBe('abcdef')
  })

  it('clips a longer value to the limit and trims the cut', () => {
    expect(boundStatement('abcdef ghij', 7)).toBe('abcdef')
  })

  it('drops a surrogate pair split by the limit instead of emitting half of it', () => {
    const emoji = '\u{1F600}'
    expect(boundStatement(`a${emoji}`, 2)).toBe('a')
  })
})
