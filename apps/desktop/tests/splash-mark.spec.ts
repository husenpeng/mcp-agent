import { describe, expect, it } from 'vitest'
import { markIgnitionArrival, markIgnitionField, markIgnitionSeed, sampleMarkPoints } from '../src/client/splash-mark.ts'

/** 8×8 mask: an L-shaped stroke down column 1 and along row 6, plus an isolated texel at (6, 1). */
function lMask(): Uint8Array {
  const size = 8
  const mask = new Uint8Array(size * size)
  for (let row = 1; row <= 6; row += 1) mask[row * size + 1] = 1
  for (let column = 1; column <= 6; column += 1) mask[6 * size + column] = 1
  mask[size + 6] = 1
  return mask
}

describe('splash mark ignition field', () => {
  it('enters at the lowest stroke texel near the centre column', () => {
    const size = 8
    const mask = new Uint8Array(size * size)
    for (let column = 1; column <= 6; column += 1) {
      mask[2 * size + column] = 1
      mask[5 * size + column] = 1
    }
    const seed = markIgnitionSeed(mask, size)
    expect(Math.floor(seed / size)).toBe(5)
    expect(Math.abs((seed % size) - 3.5)).toBeLessThanOrEqual(1)
    expect(markIgnitionSeed(new Uint8Array(size * size), size)).toBe(-1)
  })

  it('grows along the strokes from the seed and leaves unreachable texels unlit until the end', () => {
    const size = 8
    const field = markIgnitionField(lMask(), size, 6 * size + 6)
    expect(field[6 * size + 6]).toBe(0)
    expect(field[6 * size + 3]).toBeLessThan(field[6 * size + 1] ?? 0)
    expect(field[6 * size + 1]).toBeLessThan(field[size + 1] ?? 0)
    expect(field[size + 1]).toBe(1)
    expect(field[size + 6]).toBe(1)
    // Texels just outside a stroke take the lowest neighbouring stroke value, so extruded walls light with their stroke.
    expect(field[5 * size + 3]).toBeCloseTo(field[6 * size + 4] ?? -1)
    expect(markIgnitionField(lMask(), size, 0).every(value => value === 1)).toBe(true)
  })

  it('samples only stroke texels and carries their ignition distance', () => {
    const size = 8
    const mask = lMask()
    const field = markIgnitionField(mask, size, 6 * size + 6)
    let state = 7
    const random = (): number => {
      state = (state * 16807) % 2147483647
      return state / 2147483647
    }
    const points = sampleMarkPoints(mask, field, size, 40, random)
    expect(points).toHaveLength(40)
    for (const point of points) {
      const index = Math.floor(point.v * size) * size + Math.floor(point.u * size)
      expect(mask[index]).toBe(1)
      expect(point.travel).toBe(field[index])
    }
    expect(sampleMarkPoints(new Uint8Array(size * size), field, size, 4, random)).toEqual([])
  })

  it('times each stroke point by when the overshooting front reaches it', () => {
    expect(markIgnitionArrival(0, 4000, 1000, 1.2)).toBeCloseTo(4000)
    expect(markIgnitionArrival(1.2, 4000, 1000, 1.2)).toBeCloseTo(5000)
    expect(markIgnitionArrival(0.6, 4000, 1000, 1.2)).toBeCloseTo(4500)
    expect(markIgnitionArrival(0.3, 4000, 1000, 1.2)).toBeLessThan(markIgnitionArrival(0.9, 4000, 1000, 1.2))
  })
})
