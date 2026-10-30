/** Deterministic-progress text decoding for the splash wordmark. */

const DECODE_GLYPHS = '01ABCDEF23456789#%$@'

/**
 * Reveal a target string from left to right while unresolved glyphs cycle.
 * @param target - final text; spaces remain fixed throughout decoding.
 * @param progress - reveal progress, clamped below to zero and completed at one.
 * @param random - glyph source, injectable for deterministic tests.
 * @returns the current decoded frame, or the exact target when progress reaches one.
 */
export function decodeSplashText(target: string, progress: number, random: () => number = Math.random): string {
  if (progress >= 1) return target
  const settled = Math.floor(Math.max(0, progress) * target.length)
  return Array.from(target, (glyph, index) => {
    if (glyph === ' ' || index < settled) return glyph
    return DECODE_GLYPHS.charAt(Math.floor(random() * DECODE_GLYPHS.length))
  }).join('')
}
