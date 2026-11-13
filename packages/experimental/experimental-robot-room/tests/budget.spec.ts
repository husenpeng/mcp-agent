import { describe, expect, it } from 'vitest'
import { estimateTokens, grantFor, preflight, remaining, softLimitCrossed } from '../src/index.ts'

describe('budget arithmetic', () => {
  it('grants at most half of the smaller remaining budget and attenuates down the chain', () => {
    expect(grantFor({ senderRemaining: 100_000, episodeRemaining: 200_000, memberTurnCap: 48_000 })).toBe(48_000)
    expect(grantFor({ senderRemaining: 20_000, episodeRemaining: 200_000, memberTurnCap: 48_000 })).toBe(10_000)
    expect(grantFor({ senderRemaining: 100_000, episodeRemaining: 8000, memberTurnCap: 48_000 })).toBe(4000)
    expect(grantFor({ senderRemaining: 48_000, episodeRemaining: 200_000, memberTurnCap: 48_000 })).toBe(24_000)
    expect(grantFor({ senderRemaining: 0, episodeRemaining: 200_000, memberTurnCap: 48_000 })).toBe(0)
  })

  it('refuses a preflight that cannot fit the turn, episode, or member day', () => {
    const limits = { turnInputTokens: 48_000, turnOutputTokens: 6000, episodeRemaining: 40_000, dailyRemaining: 50_000 }
    expect(preflight({ estimatedPromptTokens: 30_000, expectedOutputTokens: 1000, limits })).toEqual({ ok: true })
    expect(preflight({ estimatedPromptTokens: 49_000, expectedOutputTokens: 1, limits })).toMatchObject({ ok: false })
    expect(preflight({ estimatedPromptTokens: 1000, expectedOutputTokens: 7000, limits })).toMatchObject({ ok: false })
    expect(preflight({ estimatedPromptTokens: 39_000, expectedOutputTokens: 2000, limits })).toMatchObject({ ok: false })
    const tight = { ...limits, dailyRemaining: 39_500 }
    expect(preflight({ estimatedPromptTokens: 39_000, expectedOutputTokens: 1000, limits: tight })).toMatchObject({ ok: false })
  })

  it('reports soft limits and remaining amounts without going negative', () => {
    expect(softLimitCrossed(80, 100, 0.8)).toBe(true)
    expect(softLimitCrossed(79, 100, 0.8)).toBe(false)
    expect(softLimitCrossed(1, 0, 0.8)).toBe(false)
    expect(remaining(100, 120)).toBe(0)
    expect(remaining(100, 30)).toBe(70)
  })

  it('estimates tokens from text length', () => {
    expect(estimateTokens('')).toBe(1)
    expect(estimateTokens('abc')).toBe(1)
    expect(estimateTokens('a'.repeat(300))).toBe(100)
  })
})
