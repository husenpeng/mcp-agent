/** Deterministic episode-capture sampling: stable per call and bounded per Session. */
import { describe, expect, it } from 'vitest'
import { shouldCaptureEpisode } from '@tomato/experimental-tool-memory'
import type { EpisodeSamplingPolicy } from '@tomato/experimental-tool-memory'

function policy(rate: number, budget = 0): EpisodeSamplingPolicy {
  return { rate, budget }
}

describe('episode sampling', () => {
  it('captures everything at rate 1 and nothing at rate 0', () => {
    expect(shouldCaptureEpisode({ fingerprint: 'a'.repeat(64), used: 0 }, policy(1))).toBe(true)
    expect(shouldCaptureEpisode({ fingerprint: 'a'.repeat(64), used: 0 }, policy(0))).toBe(false)
  })

  it('makes the same decision for the same fingerprint', () => {
    const decisions = Array.from({ length: 20 }, () => shouldCaptureEpisode({ fingerprint: 'f'.repeat(64), used: 0 }, policy(0.5)))
    expect(new Set(decisions).size).toBe(1)
  })

  it('spreads fingerprints over the rate', () => {
    const captured = Array.from({ length: 1000 }, (_, index) =>
      shouldCaptureEpisode({ fingerprint: `call-${index}`, used: 0 }, policy(0.25))).filter(Boolean)
    expect(captured.length).toBeGreaterThan(200)
    expect(captured.length).toBeLessThan(300)
  })

  it('stops at the per-Session budget and treats 0 as unlimited', () => {
    expect(shouldCaptureEpisode({ fingerprint: 'x', used: 1 }, policy(1, 1))).toBe(false)
    expect(shouldCaptureEpisode({ fingerprint: 'x', used: 0 }, policy(1, 1))).toBe(true)
    expect(shouldCaptureEpisode({ fingerprint: 'x', used: 1_000 }, policy(1, 0))).toBe(true)
  })
})
