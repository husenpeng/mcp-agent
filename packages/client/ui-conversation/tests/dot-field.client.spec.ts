/** Dot-field motion model: grid geometry, pointer sampling, impulses, spring settle, and colors. */
import { describe, expect, it } from 'vitest'
import {
  DOT_FIELD_PARAMS, blendRgba, createDotGrid, cssRgba, parseCssColor, proximityColor,
  pushDotsNearPointer, resetDots, samplePointer, shockDots, stepDots,
} from '../src/client/skeleton/dot-field.ts'
import type { DotState } from '../src/client/skeleton/dot-field.ts'

const PARAMS = DOT_FIELD_PARAMS
const FRAME = 1 / 60

function oneDot(x = 100): DotState {
  return { cx: 0, cy: 0, x, y: 0, vx: 0, vy: 0, phase: 'return', targetX: 0, targetY: 0, phaseTime: 0 }
}

function gridAt(x: number, y: number): DotState[] {
  return [{
    cx: x, cy: y, x: 0, y: 0, vx: 0, vy: 0, phase: 'idle', targetX: 0, targetY: 0, phaseTime: 0,
  }]
}

describe('createDotGrid', () => {
  it('centers the reference 46px pitch inside the box', () => {
    const dots = createDotGrid(460, 460)
    expect(dots).toHaveLength(100)
    expect(dots[0]).toMatchObject({ cx: 23, cy: 23 })
    expect(dots.at(-1)).toMatchObject({ cx: 437, cy: 437 })
  })

  it('keeps one dot in a box narrower than one pitch', () => {
    const dots = createDotGrid(45, 45)
    expect(dots).toHaveLength(1)
    expect(dots[0]?.cx).toBeCloseTo(22.5)
  })

  it('rejects empty and invalid boxes', () => {
    expect(createDotGrid(0, 100)).toEqual([])
    expect(createDotGrid(100, -1)).toEqual([])
    expect(createDotGrid(Number.NaN, 100)).toEqual([])
    expect(createDotGrid(Number.POSITIVE_INFINITY, 100)).toEqual([])
    expect(createDotGrid(2, 2)).toEqual([])
  })
})

describe('samplePointer', () => {
  it('does not invent a jump on the first reading', () => {
    expect(samplePointer(undefined, 300, 200, 100)).toMatchObject({ vx: 0, vy: 0, speed: 0 })
  })

  it('caps velocity at the configured maximum', () => {
    const previous = samplePointer(undefined, 100, 100, 0)
    const next = samplePointer(previous, 300, 100, 50)
    expect(next.speed).toBe(PARAMS.maxSpeed)
    expect(next.vx).toBe(PARAMS.maxSpeed)
    expect(next.vy).toBe(0)
  })

  it('derives velocity from elapsed time', () => {
    const previous = samplePointer(undefined, 100, 100, 1000)
    const next = samplePointer(previous, 110, 90, 1100)
    expect(next.vx).toBeCloseTo(100)
    expect(next.vy).toBeCloseTo(-100)
  })

  it('returns zero velocity for a non-advancing clock', () => {
    const previous = samplePointer(undefined, 100, 100, 500)
    expect(samplePointer(previous, 200, 100, 500)).toMatchObject({ vx: 0, vy: 0, speed: 0 })
  })

  it('replays the prior reading for invalid input', () => {
    const previous = samplePointer(undefined, 100, 100, 0)
    expect(samplePointer(previous, Number.NaN, 200, 100)).toBe(previous)
    expect(samplePointer(undefined, Number.NaN, 200, 100)).toMatchObject({ x: 0, y: 0, speed: 0 })
  })
})

describe('pushDotsNearPointer', () => {
  it('ignores a slow pointer at the trigger boundary', () => {
    expect(pushDotsNearPointer(gridAt(100, 0), { x: 0, y: 0 },
      { vx: 0, vy: 0, speed: PARAMS.speedTrigger })).toBe(0)
  })

  it('ignores a dot at the proximity boundary', () => {
    expect(pushDotsNearPointer(gridAt(PARAMS.proximity, 0), { x: 0, y: 0 },
      { vx: 100, vy: 0, speed: 100 })).toBe(0)
  })

  it('pushes a dot just inside the proximity radius', () => {
    const dots = gridAt(PARAMS.proximity - 0.1, 0)
    expect(pushDotsNearPointer(dots, { x: 0, y: 0 }, { vx: 100, vy: 10, speed: 100 })).toBe(1)
    expect(dots[0]?.phase).toBe('push')
    expect(dots[0]?.targetX).toBeCloseTo(PARAMS.proximity - 0.1 + 100 * PARAMS.velocityScale)
    expect(dots[0]?.targetY).toBeCloseTo(10 * PARAMS.velocityScale)
  })

  it('does not retarget a dot already pushing', () => {
    const dots = gridAt(100, 0)
    pushDotsNearPointer(dots, { x: 0, y: 0 }, { vx: 100, vy: 0, speed: 100 })
    const target = dots[0]?.targetX
    expect(pushDotsNearPointer(dots, { x: 50, y: 0 }, { vx: 100, vy: 0, speed: 100 })).toBe(0)
    expect(dots[0]?.targetX).toBe(target)
  })

  it('may push a dot that is already returning', () => {
    const dots = [oneDot()]
    expect(pushDotsNearPointer(dots, { x: 0, y: 0 }, { vx: 100, vy: 0, speed: 100 })).toBe(1)
    expect(dots[0]?.phase).toBe('push')
  })

  it('caps a push at the maximum displacement', () => {
    const dots = gridAt(PARAMS.proximity - 1, 0)
    pushDotsNearPointer(dots, { x: 0, y: 0 }, { vx: PARAMS.maxSpeed, vy: 0, speed: PARAMS.maxSpeed })
    expect(Math.hypot(dots[0]!.targetX, dots[0]!.targetY)).toBeLessThanOrEqual(PARAMS.maxDisplacement)
  })
})

describe('shockDots', () => {
  it('ignores dots at or beyond the shock radius', () => {
    expect(shockDots(gridAt(PARAMS.shockRadius, 0), 0, 0)).toBe(0)
  })

  it('pushes with a linear falloff', () => {
    const near = gridAt(25, 0)
    const far = gridAt(40, 0)
    expect(shockDots(near, 0, 0)).toBe(1)
    expect(shockDots(far, 0, 0)).toBe(1)
    expect(near[0]?.targetX).toBeCloseTo(25 * PARAMS.shockStrength * 0.5)
    expect(far[0]?.targetX).toBeCloseTo(40 * PARAMS.shockStrength * 0.2)
  })

  it('leaves a dot under the click at rest', () => {
    const dots = gridAt(0, 0)
    expect(shockDots(dots, 0, 0)).toBe(0)
    expect(dots[0]?.phase).toBe('idle')
  })

  it('does not retarget a dot already pushing', () => {
    const dots = gridAt(25, 0)
    shockDots(dots, 0, 0)
    expect(shockDots(dots, 0, 0)).toBe(0)
  })
})

describe('stepDots', () => {
  it('passes the reference return timing and overshoot', () => {
    const dots = [oneDot()]
    let time = 0
    let crossing: number | undefined
    let minimum = 0
    while (dots[0]!.phase !== 'idle' && time < PARAMS.returnTimeout) {
      stepDots(dots, FRAME)
      time += FRAME
      const x = dots[0]!.x
      if (crossing === undefined && x <= 0) crossing = time
      if (crossing !== undefined) minimum = Math.min(minimum, x)
    }
    expect(crossing).toBeGreaterThan(0.85)
    expect(crossing).toBeLessThan(1.05)
    expect(minimum).toBeLessThan(-5)
    expect(minimum).toBeGreaterThan(-10)
    expect(time).toBeLessThan(PARAMS.returnTimeout)
  })

  it('moves from push into the elastic return once the target is reached', () => {
    const dots = gridAt(0, 0)
    shockDots(dots, 0, 0)
    const dot = {
      ...dots[0]!,
      phase: 'push' as const,
      targetX: 100,
      targetY: 0,
      phaseTime: 0,
    }
    const pushed = [dot]
    let time = 0
    while (pushed[0]!.phase === 'push' && time < PARAMS.pushTimeout) {
      stepDots(pushed, FRAME)
      time += FRAME
    }
    expect(pushed[0]!.phase).toBe('return')
    expect(time).toBeGreaterThan(0.3)
    expect(time).toBeLessThan(PARAMS.pushTimeout)
  })

  it('settles after a shock without leaving numeric residue', () => {
    const dots = createDotGrid(400, 400)
    shockDots(dots, 200, 200)
    let time = 0
    while (time < PARAMS.pushTimeout + PARAMS.returnTimeout) {
      stepDots(dots, FRAME)
      time += FRAME
      expect(dots.every(dot => Number.isFinite(dot.x) && Number.isFinite(dot.vx))).toBe(true)
    }
    expect(dots.every(dot => dot.phase === 'idle' && dot.x === 0 && dot.y === 0)).toBe(true)
  })

  it('leaves state untouched for a non-advancing frame', () => {
    const dots = [oneDot(50)]
    const before = { ...dots[0]! }
    expect(stepDots(dots, 0)).toBe(true)
    expect(stepDots(dots, -1)).toBe(true)
    expect(stepDots(dots, Number.NaN)).toBe(true)
    expect(dots[0]).toEqual(before)
  })

  it('clamps a long frame to the maximum delta', () => {
    const long = [oneDot(100)]
    const short = [oneDot(100)]
    stepDots(long, 1)
    stepDots(short, PARAMS.maxFrameDt)
    expect(long[0]!.x).toBeCloseTo(short[0]!.x, 6)
    expect(long[0]!.vx).toBeCloseTo(short[0]!.vx, 6)
  })

  it('reports whether any dot is still moving', () => {
    const idle = gridAt(0, 0)
    expect(stepDots(idle, FRAME)).toBe(false)
    const dots = gridAt(0, 0)
    shockDots(dots, 25, 0)
    expect(stepDots(dots, FRAME)).toBe(true)
  })
})

describe('resetDots', () => {
  it('returns every dot to rest and is idempotent', () => {
    const dots = gridAt(0, 0)
    shockDots(dots, 25, 0)
    resetDots(dots)
    resetDots(dots)
    expect(dots[0]).toMatchObject({ x: 0, y: 0, vx: 0, vy: 0, phase: 'idle', phaseTime: 0 })
  })
})

describe('colors', () => {
  it('parses computed rgb() and rgba() forms', () => {
    expect(parseCssColor('rgb(25, 27, 28)')).toEqual({ r: 25, g: 27, b: 28, a: 1 })
    expect(parseCssColor('rgba(25, 27, 28, 0.12)')).toEqual({ r: 25, g: 27, b: 28, a: 0.12 })
    expect(parseCssColor('rgb(25 27 28 / 12%)')).toEqual({ r: 25, g: 27, b: 28, a: 0.12 })
  })

  it('parses hex forms', () => {
    expect(parseCssColor('#191b1c')).toEqual({ r: 25, g: 27, b: 28, a: 1 })
    expect(parseCssColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseCssColor('#191b1c80')?.a).toBeCloseTo(128 / 255)
  })

  it('parses wide-gamut and transparent colors', () => {
    expect(parseCssColor('color(srgb 1 0.5 0.5)')).toEqual({ r: 255, g: 127.5, b: 127.5, a: 1 })
    expect(parseCssColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it('rejects unsupported or malformed colors', () => {
    for (const value of ['', 'nope', 'rgb(1 2)', '#12345', 'color(display-p3 1 0 0)', 'rgb(1 2 3 / 4 / 5)']) {
      expect(parseCssColor(value), value).toBeUndefined()
    }
  })

  it('blends channels and alpha with a clamped coverage', () => {
    const base = { r: 0, g: 0, b: 0, a: 0 }
    const active = { r: 100, g: 200, b: 50, a: 1 }
    expect(blendRgba(base, active, 0)).toEqual(base)
    expect(blendRgba(base, active, 1)).toEqual(active)
    expect(blendRgba(base, active, 2)).toEqual(active)
    expect(blendRgba(base, active, 0.5)).toEqual({ r: 50, g: 100, b: 25, a: 0.5 })
  })

  it('fades the active color across the proximity radius', () => {
    const base = { r: 224, g: 224, b: 224, a: 1 }
    const active = { r: 254, g: 80, b: 66, a: 1 }
    expect(proximityColor(170, 170, base, active)).toEqual(base)
    expect(proximityColor(0, 170, base, active)).toEqual(active)
    expect(proximityColor(85, 170, base, active)).toEqual({ r: 239, g: 152, b: 145, a: 1 })
    expect(proximityColor(10, 0, base, active)).toEqual(base)
  })

  it('formats a stable canvas color', () => {
    expect(cssRgba({ r: 254, g: 80, b: 66, a: 1 })).toBe('rgba(254, 80, 66, 1)')
    expect(cssRgba({ r: 25, g: 27, b: 28, a: 0.12345 })).toBe('rgba(25, 27, 28, 0.123)')
  })
})
