import { describe, expect, it } from 'vitest'
import { SPLASH_TIMINGS, splashAnimationDoneAt, splashWaitingAt } from '../src/client/splash-timeline.ts'

describe('splash 3D timeline', () => {
  it('reveals the city first, then powers the projector, climbs the beam, and ignites the mark', () => {
    expect(SPLASH_TIMINGS.fadeInMs).toBeLessThan(SPLASH_TIMINGS.projectorMs)
    expect(SPLASH_TIMINGS.projectorMs).toBeGreaterThanOrEqual(3000)
    expect(SPLASH_TIMINGS.projectorMs).toBeLessThan(SPLASH_TIMINGS.beamMs)
    expect(SPLASH_TIMINGS.beamMs).toBeLessThan(SPLASH_TIMINGS.sparksMs)
    expect(SPLASH_TIMINGS.sparksMs).toBeLessThan(SPLASH_TIMINGS.igniteMs)
    expect(SPLASH_TIMINGS.beamMs + SPLASH_TIMINGS.beamRampMs).toBeLessThanOrEqual(SPLASH_TIMINGS.igniteMs)
  })

  it('finishes the mark before the wordmark decodes and holds the final frame after the camera rests', () => {
    expect(SPLASH_TIMINGS.igniteMs + SPLASH_TIMINGS.igniteRampMs).toBeLessThanOrEqual(SPLASH_TIMINGS.wordmarkDelayMs)
    expect(SPLASH_TIMINGS.wordmarkDelayMs + SPLASH_TIMINGS.wordmarkMs).toBeLessThan(SPLASH_TIMINGS.holdMs)
    expect(SPLASH_TIMINGS.cameraMs).toBeLessThanOrEqual(SPLASH_TIMINGS.holdMs)
    expect(SPLASH_TIMINGS.holdMs).toBeGreaterThanOrEqual(6000)
  })

  it('reports completion at the hold frame, or after the static holds under reduced motion', () => {
    expect(splashAnimationDoneAt(false)).toBe(SPLASH_TIMINGS.holdMs)
    expect(splashAnimationDoneAt(true)).toBe(SPLASH_TIMINGS.reducedMotionHoldMs)
    expect(splashWaitingAt(6500)).toBe(6500 + SPLASH_TIMINGS.waitingDelayMs)
  })
})
