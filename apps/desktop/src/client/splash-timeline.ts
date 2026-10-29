/** Splash animation timeline and deterministic star field; no DOM access. */

/** Phase boundaries in milliseconds from document start. */
export const SPLASH_TIMINGS = {
  /** Ink trace of the mark, stem first. */
  traceMs: 700,
  /** Color bloom from the stem, starting after the trace. */
  ignitionDelayMs: 700,
  ignitionMs: 450,
  /** Geometric wordmark entrance, overlapping the mark's bloom. */
  wordmarkDelayMs: 450,
  wordmarkMs: 750,
  /** Final frame; the renderer reports completion here. */
  holdMs: 1450,
  /** Waiting indicator, measured from completion. */
  waitingDelayMs: 1500,
  /** Static final frame held under `prefers-reduced-motion`. */
  reducedMotionHoldMs: 400,
  /** Whole-field brightness pulse when the bloom completes. */
  pulseAtMs: 1150,
  pulseMs: 120,
} as const

/** Star count and seed for the 1280×760 splash canvas. */
export const SPLASH_STAR_COUNT = 280
export const SPLASH_STAR_SEED = 0x70a704

/**
 * When the renderer reports its animation complete.
 * @param reducedMotion - whether the document matches `prefers-reduced-motion: reduce`.
 * @returns the completion time in milliseconds from document start.
 */
export function splashAnimationDoneAt(reducedMotion: boolean): number {
  return reducedMotion ? SPLASH_TIMINGS.reducedMotionHoldMs : SPLASH_TIMINGS.holdMs
}

/**
 * When the waiting indicator fades in after the animation ends.
 * @param doneAtMs - completion time in milliseconds from document start.
 * @returns the indicator time in milliseconds from document start.
 */
export function splashWaitingAt(doneAtMs: number): number {
  return doneAtMs + SPLASH_TIMINGS.waitingDelayMs
}

/** One star's stable place in the depth field. */
export interface SplashStar {
  /** Horizontal position as a fraction of the canvas width. */
  readonly x: number
  /** Vertical position as a fraction of the canvas height. */
  readonly y: number
  /** Depth from 0 (far, dim, slow) to 1 (near, brighter, faster). */
  readonly depth: number
  /** Radius in CSS pixels. */
  readonly radius: number
  /** Base intensity from 0 to 1; the renderer maps it onto the active palette. */
  readonly intensity: number
  /** Twinkle cycles per second. */
  readonly twinkle: number
  /** Twinkle phase in radians. */
  readonly phase: number
  /** Brand-red accent rather than neutral dust. */
  readonly red: boolean
}

/**
 * Build the deterministic star field shared by every launch.
 * @param count - number of stars; the geometry is stable for a given count and seed.
 * @param seed - 32-bit seed of the position generator.
 * @returns stars ordered by generation, with brand-red accents at a fixed share.
 */
export function splashStars(count = SPLASH_STAR_COUNT, seed = SPLASH_STAR_SEED): SplashStar[] {
  let state = seed | 0
  const random = (): number => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  return Array.from({ length: count }, (_, index) => {
    const depth = random()
    return {
      x: random(),
      y: random(),
      depth,
      radius: 1.5 + depth * 2,
      intensity: 0.25 + random() * 0.75,
      twinkle: 0.12 + random() * 0.28,
      phase: random() * 2 * Math.PI,
      // A fixed share keeps the accent legible: 22 of the 280 default stars.
      red: index % 13 === 0,
    }
  })
}
