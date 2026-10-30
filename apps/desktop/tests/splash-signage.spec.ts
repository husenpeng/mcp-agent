import { describe, expect, it } from 'vitest'
import { SPLASH_SCREEN_SLOTS, SPLASH_SIGN_SLOTS } from '../src/client/splash-city.ts'
import { SPLASH_SCREEN_ARTWORK, SPLASH_SIGN_ARTWORK } from '../src/client/splash-signage.ts'

describe('splash advert artwork', () => {
  it('fills every atlas slot with a different influencer-marketing module', () => {
    expect(SPLASH_SIGN_ARTWORK.length).toBe(SPLASH_SIGN_SLOTS)
    expect(SPLASH_SCREEN_ARTWORK.length).toBe(SPLASH_SCREEN_SLOTS)
    const signs = SPLASH_SIGN_ARTWORK.map(artwork => artwork.glyphs)
    const captions = SPLASH_SIGN_ARTWORK.map(artwork => artwork.caption)
    const screens = SPLASH_SCREEN_ARTWORK.map(artwork => artwork.module)
    expect(new Set(signs).size).toBe(signs.length)
    expect(new Set(captions).size).toBe(captions.length)
    expect(new Set(screens).size).toBe(screens.length)
    // A module advertised on a sign is not advertised again on a screen.
    for (const module of screens) expect(signs.some(sign => module.includes(sign))).toBe(false)
  })

  it('keeps every advert free of the Tomato brand', () => {
    const copy = [
      ...SPLASH_SIGN_ARTWORK.flatMap(artwork => [artwork.glyphs, artwork.caption]),
      ...SPLASH_SCREEN_ARTWORK.map(artwork => artwork.module),
    ]
    for (const text of copy) expect(text).not.toMatch(/tomato|番茄/iu)
  })
})
