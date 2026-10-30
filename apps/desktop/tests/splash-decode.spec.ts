import { describe, expect, it, vi } from 'vitest'
import { decodeSplashText } from '../src/client/splash-decode.ts'

describe('splash wordmark decoder', () => {
  it('preserves settled characters and spaces while unresolved glyphs cycle', () => {
    const random = vi.fn(() => 0)
    const frame = decodeSplashText('TO AI', 0.4, random)
    expect(frame.slice(0, 2)).toBe('TO')
    expect(frame[2]).toBe(' ')
    expect(frame.slice(3)).toBe('00')
    expect(random).toHaveBeenCalledTimes(2)
  })

  it('clamps early progress and always resolves the exact target', () => {
    expect(decodeSplashText('TOMATO', -1, () => 0)).toBe('000000')
    expect(decodeSplashText('TOMATO', 1, () => { throw new Error('resolved text must not sample') })).toBe('TOMATO')
    expect(decodeSplashText('TOMATO', 2, () => 0.999)).toBe('TOMATO')
  })
})
