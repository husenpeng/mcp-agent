/** Splash animation timeline; the 3D scene and DOM wordmark share these boundaries. */

/** Phase boundaries in milliseconds from document start. */
export const SPLASH_TIMINGS = {
  /** Exposure rises from black over an already lit city; no frame flashes. */
  fadeInMs: 1100,
  /** Street-level glide and upward crane into the resting composition. */
  cameraMs: 6300,
  /** The landmark crown powers its projector; the brand remains absent before this. */
  projectorMs: 3200,
  projectorRampMs: 600,
  /** The projector beam climbs from the crown to the mark's lowest stroke. */
  beamMs: 3500,
  beamRampMs: 650,
  /** Sparks stream up the beam from here and land on the strokes as the ignition front reaches them. */
  sparksMs: 3650,
  /** Light enters the mark where the beam meets it and runs along every stroke. */
  igniteMs: 4150,
  igniteRampMs: 1300,
  /** Geometric wordmark decoding follows the lit mark. */
  wordmarkDelayMs: 5650,
  wordmarkMs: 700,
  /** Final frame; the renderer reports completion here. */
  holdMs: 7200,
  /** Waiting indicator, measured from completion. */
  waitingDelayMs: 1500,
  /** Static final frame held under `prefers-reduced-motion`. */
  reducedMotionHoldMs: 400,
} as const

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
