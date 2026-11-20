/** Monitor geometry, the three forms, edge parking, and persistence of the monitor overlay. */
import { describe, expect, it } from 'vitest'
import {
  BALL_SIZE, OVERLAY_HEIGHT, OVERLAY_MARGIN, OVERLAY_STORAGE_KEY, OVERLAY_WIDTH, PILL_HEIGHT, PILL_WIDTH,
  ballLayout, ballTone, clampAxis, clampLayout, defaultLayout, expandLayout, formSize, parkLayout, parseLayout,
  readLayout, writeLayout, type OverlayLayout,
} from '../src/client/overlay-layout.ts'

const stored: OverlayLayout = { x: 40, y: 60, form: 'card', restore: 'card', edge: 'right', axis: BALL_SIZE / 2, paused: false, placed: true }

describe('formSize', () => {
  it('sizes each form', () => {
    expect(formSize('pill')).toEqual({ width: PILL_WIDTH, height: PILL_HEIGHT })
    expect(formSize('card')).toEqual({ width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT })
    expect(formSize('ball')).toEqual({ width: BALL_SIZE, height: BALL_SIZE })
  })
})

describe('defaultLayout', () => {
  it('rests the pill above the bottom-right corner', () => {
    expect(defaultLayout(1200, 900)).toEqual({
      x: 1200 - PILL_WIDTH - OVERLAY_MARGIN,
      y: 900 - PILL_HEIGHT - OVERLAY_MARGIN,
      form: 'pill',
      restore: 'pill',
      edge: 'right',
      axis: 450,
      paused: false,
      placed: false,
    })
  })

  it('keeps the margin when the window is smaller than the pill', () => {
    // 56 leaves no room for the pill plus both margins, so both offsets fall to the margin.
    expect(defaultLayout(56, 56)).toMatchObject({ x: OVERLAY_MARGIN, y: OVERLAY_MARGIN })
  })
})

describe('clampLayout', () => {
  it('returns the same layout when it already fits', () => {
    const layout: OverlayLayout = { x: 100, y: 100, form: 'pill', restore: 'pill', edge: 'right', axis: 8, paused: false, placed: true }
    expect(clampLayout(layout, 1200, 900)).toBe(layout)
  })

  it('pulls an off-screen card back inside the margin', () => {
    expect(clampLayout({ ...stored, x: -50, y: 5000 }, 1200, 900)).toEqual({
      ...stored,
      x: OVERLAY_MARGIN,
      y: 900 - OVERLAY_HEIGHT - OVERLAY_MARGIN,
    })
  })

  it('keeps a parked ball’s center inside the window', () => {
    const parked = ballLayout(stored, 'left', 8_000, 'card', 900)
    expect(parked.axis).toBe(900 - BALL_SIZE / 2)
    expect(clampLayout({ ...parked, axis: -40 }, 1200, 900).axis).toBe(BALL_SIZE / 2)
  })
})

describe('clampAxis', () => {
  it('keeps half a ball visible at both ends', () => {
    expect(clampAxis(-10, 900)).toBe(BALL_SIZE / 2)
    expect(clampAxis(2_000, 900)).toBe(900 - BALL_SIZE / 2)
    expect(clampAxis(100, 900)).toBe(100)
    expect(clampAxis(5, 10)).toBe(BALL_SIZE / 2)
  })
})

describe('parkLayout', () => {
  it('parks a card against its nearer edge, centered on the card', () => {
    expect(parkLayout({ ...stored, x: 100, y: 200 }, 1200, 900)).toMatchObject({
      form: 'ball',
      edge: 'left',
      axis: 200 + OVERLAY_HEIGHT / 2,
      restore: 'card',
      placed: true,
    })
  })

  it('parks a right-side pill against the right edge and remembers the pill', () => {
    const pill: OverlayLayout = { ...stored, form: 'pill', restore: 'pill', x: 900, y: 700 }
    expect(parkLayout(pill, 1200, 900)).toMatchObject({ form: 'ball', edge: 'right', axis: 700 + PILL_HEIGHT / 2, restore: 'pill' })
  })

  it('treats the exact middle as the right half', () => {
    expect(parkLayout({ ...stored, x: 600 - OVERLAY_WIDTH / 2, y: 0 }, 1200, 900).edge).toBe('right')
  })
})

describe('expandLayout', () => {
  it('returns to the requested form at the last free position', () => {
    const parked = parkLayout({ ...stored, x: 100, y: 200 }, 1200, 900)
    expect(expandLayout(parked, 'card', 1200, 900)).toMatchObject({ form: 'card', restore: 'card', x: 100, y: 200 })
    expect(expandLayout(parked, 'pill', 1200, 900)).toMatchObject({ form: 'pill', restore: 'pill', x: 100, y: 200 })
  })

  it('clamps a free position a narrower window no longer fits', () => {
    const parked = parkLayout({ ...stored, x: 1_100, y: 800 }, 1200, 900)
    // 400 is narrower than the card and its two margins, so the card keeps the left margin.
    expect(expandLayout(parked, 'card', 400, 400)).toMatchObject({ x: 36, y: OVERLAY_MARGIN })
  })
})

describe('ballTone', () => {
  it('bands processor load and stays neutral while paused or unread', () => {
    expect(ballTone(0.12, false)).toBe('calm')
    expect(ballTone(0.6, false)).toBe('busy')
    expect(ballTone(0.9, false)).toBe('hot')
    expect(ballTone(0.9, true)).toBe('neutral')
    expect(ballTone(undefined, false)).toBe('neutral')
  })
})

describe('parseLayout', () => {
  it('round-trips a stored layout', () => {
    expect(parseLayout(JSON.stringify(stored))).toEqual(stored)
  })

  it('reads the earlier record that only carried an expanded flag', () => {
    expect(parseLayout('{"x":1,"y":2,"expanded":true}')).toEqual({
      x: 1, y: 2, form: 'card', restore: 'card', edge: 'right', axis: BALL_SIZE / 2, paused: false, placed: false,
    })
  })

  it('reads a parked ball back with its edge and restore form', () => {
    expect(parseLayout(JSON.stringify({ ...stored, form: 'ball', edge: 'left', axis: 120, restore: 'pill' })))
      .toEqual({ ...stored, form: 'ball', edge: 'left', axis: 120, restore: 'pill' })
  })

  it('falls back to the right edge and the pill for a ball record that omits them', () => {
    expect(parseLayout('{"x":1,"y":2,"form":"ball","axis":30}')).toMatchObject({ edge: 'right', restore: 'pill', axis: 30 })
  })

  it('defaults the flags when only coordinates were stored', () => {
    expect(parseLayout('{"x":1,"y":2}')).toEqual({
      x: 1, y: 2, form: 'pill', restore: 'pill', edge: 'right', axis: BALL_SIZE / 2, paused: false, placed: false,
    })
  })

  it('defaults an unknown form to the pill and a non-card restore target to the pill', () => {
    expect(parseLayout('{"x":1,"y":2,"form":"bar"}')).toMatchObject({ form: 'pill', restore: 'pill' })
    expect(parseLayout('{"x":1,"y":2,"form":"ball","axis":1,"restore":"ball"}')).toMatchObject({ restore: 'pill' })
  })

  it.each([
    null,
    '{broken',
    'null',
    '42',
    '{"x":"1","y":2}',
    '{"x":1}',
    '{"x":1e999,"y":2}',
    '{"x":1,"y":2,"form":"ball"}',
  ])('rejects an unusable payload %s', (raw) => {
    expect(parseLayout(raw)).toBeNull()
  })
})

describe('readLayout and writeLayout', () => {
  it('writes and reads through a storage face', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    }
    writeLayout(storage, stored)
    expect(values.get(OVERLAY_STORAGE_KEY)).toBe(JSON.stringify(stored))
    expect(readLayout(storage)).toEqual(stored)
  })

  it('ignores a refused storage write', () => {
    expect(() => {
      writeLayout({ setItem: () => { throw new Error('quota') } }, stored)
    }).not.toThrow()
  })

  it('reports no layout when the storage read throws', () => {
    expect(readLayout({ getItem: () => { throw new Error('blocked') } })).toBeNull()
  })
})
