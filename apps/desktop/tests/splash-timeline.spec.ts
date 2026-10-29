import { describe, expect, it } from 'vitest'
import {
  SPLASH_STAR_COUNT, SPLASH_STAR_SEED, SPLASH_TIMINGS,
  splashAnimationDoneAt, splashStars, splashWaitingAt,
} from '../src/client/splash-timeline.ts'

describe('splash timeline', () => {
  it('reveals the geometric wordmark alongside the mark, blooms both, then holds', () => {
    expect(SPLASH_TIMINGS.wordmarkDelayMs).toBeGreaterThan(0)
    expect(SPLASH_TIMINGS.wordmarkMs).toBeGreaterThanOrEqual(SPLASH_TIMINGS.traceMs)
    expect(SPLASH_TIMINGS.traceMs).toBeLessThanOrEqual(SPLASH_TIMINGS.ignitionDelayMs)
    expect(SPLASH_TIMINGS.ignitionDelayMs + SPLASH_TIMINGS.ignitionMs)
      .toBeLessThanOrEqual(SPLASH_TIMINGS.wordmarkDelayMs + SPLASH_TIMINGS.wordmarkMs)
    expect(SPLASH_TIMINGS.wordmarkDelayMs + SPLASH_TIMINGS.wordmarkMs).toBeLessThan(SPLASH_TIMINGS.holdMs)
    expect(SPLASH_TIMINGS.pulseAtMs).toBeGreaterThanOrEqual(SPLASH_TIMINGS.ignitionDelayMs)
    expect(SPLASH_TIMINGS.pulseAtMs).toBeLessThanOrEqual(SPLASH_TIMINGS.wordmarkDelayMs + SPLASH_TIMINGS.wordmarkMs)
  })

  it('reports completion at the hold frame, or after the static holds under reduced motion', () => {
    expect(splashAnimationDoneAt(false)).toBe(SPLASH_TIMINGS.holdMs)
    expect(splashAnimationDoneAt(true)).toBe(SPLASH_TIMINGS.reducedMotionHoldMs)
    expect(splashWaitingAt(2000)).toBe(2000 + SPLASH_TIMINGS.waitingDelayMs)
  })
})

describe('splash star field', () => {
  it('is deterministic for the launch seed', () => {
    expect(splashStars()).toEqual(splashStars())
    expect(splashStars(10, SPLASH_STAR_SEED)).toEqual(splashStars(10, SPLASH_STAR_SEED))
    expect(splashStars(10, SPLASH_STAR_SEED + 1)).not.toEqual(splashStars(10, SPLASH_STAR_SEED))
  })

  it('keeps every star inside the documented ranges', () => {
    const stars = splashStars()
    expect(stars).toHaveLength(SPLASH_STAR_COUNT)
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThan(1)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThan(1)
      expect(star.depth).toBeGreaterThanOrEqual(0)
      expect(star.depth).toBeLessThan(1)
      expect(star.radius).toBeGreaterThanOrEqual(1.5)
      expect(star.radius).toBeLessThan(3.5)
      expect(star.intensity).toBeGreaterThanOrEqual(0.25)
      expect(star.intensity).toBeLessThan(1)
      expect(star.twinkle).toBeGreaterThanOrEqual(0.12)
      expect(star.twinkle).toBeLessThan(0.4)
      expect(star.phase).toBeGreaterThanOrEqual(0)
      expect(star.phase).toBeLessThan(2 * Math.PI)
    }
  })

  it('keeps the brand-red accents under one tenth of the field', () => {
    const stars = splashStars()
    const red = stars.filter(star => star.red).length
    expect(red / stars.length).toBeLessThanOrEqual(0.08)
    expect(red).toBe(22)
  })
})
