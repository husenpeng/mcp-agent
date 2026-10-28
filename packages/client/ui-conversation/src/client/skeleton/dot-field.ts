/**
 * Grid and motion model for the empty-session dot field.
 *
 * The hero backdrop matches the client-monorepo strategy landing: a centered
 * 4px dot grid on a 46px pitch. The reference app animates that grid with
 * GSAP physics — dots near the pointer tint toward the brand red, a fast move
 * pushes them away, a click sends a shockwave, and every displaced dot returns
 * with an elastic settle. This module keeps that motion model free of the DOM:
 * the canvas host owns pixels and events, and every numeric rule lives here so
 * it can be tested without a browser.
 * @module dot-field
 */

/** An idle dot follows the grid; pushed dots seek their target, returning dots seek zero. */
export type DotPhase = 'idle' | 'push' | 'return'

/** One dot: its resting grid center, live offset and velocity, and the phase driving them. */
export interface DotState {
  /** Resting center x in canvas CSS pixels. */
  readonly cx: number
  /** Resting center y in canvas CSS pixels. */
  readonly cy: number
  /** Offset from the resting center in CSS pixels. */
  x: number
  /** Offset from the resting center in CSS pixels. */
  y: number
  /** Offset velocity in CSS pixels per second. */
  vx: number
  /** Offset velocity in CSS pixels per second. */
  vy: number
  /** Current motion phase. */
  phase: DotPhase
  /** Offset the push phase seeks when it ends. */
  targetX: number
  /** Offset the push phase seeks when it ends. */
  targetY: number
  /** Time spent in the current phase, in seconds. */
  phaseTime: number
}

/** One pointer reading: position in canvas CSS pixels, timestamp, and the velocity derived from the previous reading. */
export interface PointerSample {
  /** Pointer x in canvas CSS pixels. */
  readonly x: number
  /** Pointer y in canvas CSS pixels. */
  readonly y: number
  /** Reading timestamp in milliseconds. */
  readonly time: number
  /** Horizontal velocity in CSS pixels per second. */
  readonly vx: number
  /** Vertical velocity in CSS pixels per second. */
  readonly vy: number
  /** Velocity magnitude in CSS pixels per second. */
  readonly speed: number
}

/** A resolved color channel triple with alpha, all channels 0..255 and alpha 0..1. */
export interface Rgba {
  /** Red channel. */
  readonly r: number
  /** Green channel. */
  readonly g: number
  /** Blue channel. */
  readonly b: number
  /** Alpha channel. */
  readonly a: number
}

/** Geometry, pointer, shockwave, and spring settings shared by the model and the canvas host. */
export interface DotFieldParams {
  /** Dot diameter in CSS pixels. */
  readonly dotSize: number
  /** Gap between dot edges in CSS pixels; the grid pitch is dotSize + gap. */
  readonly gap: number
  /** Radius in CSS pixels inside which dots tint toward the active color. */
  readonly proximity: number
  /** Minimum pointer speed in CSS pixels per second that pushes dots. */
  readonly speedTrigger: number
  /** Pointer speed cap in CSS pixels per second. */
  readonly maxSpeed: number
  /** Multiplier converting pointer velocity into an extra push displacement. */
  readonly velocityScale: number
  /** Click shockwave radius in CSS pixels. */
  readonly shockRadius: number
  /** Click shockwave strength multiplier. */
  readonly shockStrength: number
  /** Cap on a single push target displacement in CSS pixels. */
  readonly maxDisplacement: number
  /** Angular frequency of the push spring in radians per second. */
  readonly pushOmega: number
  /** Damping ratio of the push spring; 1 is critically damped. */
  readonly pushZeta: number
  /** Longest time a dot may spend seeking its push target, in seconds. */
  readonly pushTimeout: number
  /** Angular frequency of the return spring in radians per second. */
  readonly returnOmega: number
  /** Damping ratio of the return spring; matches the reference elastic settle. */
  readonly returnZeta: number
  /** Longest time a dot may spend returning, in seconds. */
  readonly returnTimeout: number
  /** Distance in CSS pixels below which a dot counts as settled. */
  readonly settleDistance: number
  /** Speed in CSS pixels per second below which a dot counts as settled. */
  readonly settleSpeed: number
  /** Integration step in seconds. */
  readonly fixedStep: number
  /** Longest frame delta folded into one step call, in seconds. */
  readonly maxFrameDt: number
  /** Minimum interval between pointer samples, in milliseconds. */
  readonly pointerThrottleMs: number
  /** Debounce for resize-driven grid rebuilds, in milliseconds. */
  readonly resizeDebounceMs: number
  /** Upper bound on the canvas backing-store device pixel ratio. */
  readonly maxDpr: number
}

/**
 * Default parameters, matching the reference grid and tuned so the return
 * spring reproduces `elastic.out(1, 0.75)` from a displaced dot at rest: the
 * first zero crossing lands at 0.9375s and the first overshoot stays near 7%
 * of the displacement.
 */
export const DOT_FIELD_PARAMS: DotFieldParams = {
  dotSize: 4,
  gap: 42,
  proximity: 170,
  speedTrigger: 10,
  maxSpeed: 1500,
  velocityScale: 0.005,
  shockRadius: 50,
  shockStrength: 20,
  maxDisplacement: 256,
  pushOmega: 16,
  pushZeta: 1,
  pushTimeout: 0.7,
  returnOmega: 3.136,
  returnZeta: 0.638,
  returnTimeout: 5.6,
  settleDistance: 0.5,
  settleSpeed: 10,
  fixedStep: 1 / 120,
  maxFrameDt: 0.05,
  pointerThrottleMs: 50,
  resizeDebounceMs: 220,
  maxDpr: 2,
}

/** Resting grid centers for a box, or an empty grid when it cannot hold one dot. */
export function createDotGrid(
  width: number,
  height: number,
  params: DotFieldParams = DOT_FIELD_PARAMS,
): DotState[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return []
  const pitch = params.dotSize + params.gap
  const cols = Math.floor((width + params.gap) / pitch)
  const rows = Math.floor((height + params.gap) / pitch)
  if (cols <= 0 || rows <= 0) return []
  const gridWidth = cols * pitch - params.gap
  const gridHeight = rows * pitch - params.gap
  const startX = (width - gridWidth) / 2 + params.dotSize / 2
  const startY = (height - gridHeight) / 2 + params.dotSize / 2
  const dots: DotState[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      dots.push({
        cx: startX + col * pitch,
        cy: startY + row * pitch,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        phase: 'idle',
        targetX: 0,
        targetY: 0,
        phaseTime: 0,
      })
    }
  }
  return dots
}

/**
 * Derive one pointer reading. The first reading carries no velocity, so a
 * field opened under a stationary cursor never receives a spurious jump from
 * the origin.
 * @param previous - prior reading, or undefined for the first sample.
 * @param x - pointer x in canvas CSS pixels.
 * @param y - pointer y in canvas CSS pixels.
 * @param now - reading timestamp in milliseconds.
 * @param params - speed cap.
 * @returns the new reading; invalid inputs replay the previous reading or a zero sample.
 */
export function samplePointer(
  previous: PointerSample | undefined,
  x: number,
  y: number,
  now: number,
  params: DotFieldParams = DOT_FIELD_PARAMS,
): PointerSample {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(now)) {
    return previous ?? { x: 0, y: 0, time: 0, vx: 0, vy: 0, speed: 0 }
  }
  if (previous === undefined) return { x, y, time: now, vx: 0, vy: 0, speed: 0 }
  const elapsed = now - previous.time
  if (!(elapsed > 0)) return { x, y, time: now, vx: 0, vy: 0, speed: 0 }
  let vx = ((x - previous.x) / elapsed) * 1000
  let vy = ((y - previous.y) / elapsed) * 1000
  let speed = Math.hypot(vx, vy)
  if (speed > params.maxSpeed) {
    const scale = params.maxSpeed / speed
    vx *= scale
    vy *= scale
    speed = params.maxSpeed
  }
  return { x, y, time: now, vx, vy, speed }
}

/**
 * Push every eligible dot near a moving pointer away from it.
 * @param dots - grid to mutate.
 * @param pointer - pointer position in canvas CSS pixels.
 * @param velocity - velocity magnitude and components of the pointer sample.
 * @param params - proximity, trigger, and displacement cap.
 * @returns how many dots started a push.
 */
export function pushDotsNearPointer(
  dots: DotState[],
  pointer: Readonly<{ x: number; y: number }>,
  velocity: Readonly<{ vx: number; vy: number; speed: number }>,
  params: DotFieldParams = DOT_FIELD_PARAMS,
): number {
  if (!(velocity.speed > params.speedTrigger)) return 0
  const proximitySquared = params.proximity * params.proximity
  let pushed = 0
  for (const dot of dots) {
    if (dot.phase === 'push') continue
    const dx = dot.cx - pointer.x
    const dy = dot.cy - pointer.y
    if (dx * dx + dy * dy >= proximitySquared) continue
    startPush(dot,
      dx + velocity.vx * params.velocityScale,
      dy + velocity.vy * params.velocityScale,
      params)
    pushed += 1
  }
  return pushed
}

/**
 * Send a click shockwave through every eligible dot inside its radius.
 * @param dots - grid to mutate.
 * @param x - click x in canvas CSS pixels.
 * @param y - click y in canvas CSS pixels.
 * @param params - shock radius, strength, and displacement cap.
 * @returns how many dots started a push.
 */
export function shockDots(
  dots: DotState[],
  x: number,
  y: number,
  params: DotFieldParams = DOT_FIELD_PARAMS,
): number {
  let pushed = 0
  for (const dot of dots) {
    if (dot.phase === 'push') continue
    const dx = dot.cx - x
    const dy = dot.cy - y
    const distance = Math.hypot(dx, dy)
    if (distance >= params.shockRadius || distance === 0) continue
    const falloff = 1 - distance / params.shockRadius
    startPush(dot,
      dx * params.shockStrength * falloff,
      dy * params.shockStrength * falloff,
      params)
    pushed += 1
  }
  return pushed
}

/**
 * Advance the motion model by one frame.
 * @param dots - grid to mutate.
 * @param dtSeconds - elapsed frame time in seconds.
 * @param params - spring and integration settings.
 * @returns whether any dot remains pushed or returning.
 */
export function stepDots(
  dots: DotState[],
  dtSeconds: number,
  params: DotFieldParams = DOT_FIELD_PARAMS,
): boolean {
  if (Number.isFinite(dtSeconds) && dtSeconds > 0) {
    const total = Math.min(dtSeconds, params.maxFrameDt)
    const steps = Math.ceil(total / params.fixedStep)
    const step = total / steps
    for (let index = 0; index < steps; index += 1) {
      for (const dot of dots) advanceDot(dot, step, params)
    }
  }
  return dots.some(dot => dot.phase !== 'idle')
}

/** Restore every dot to its resting grid center and idle phase. */
export function resetDots(dots: DotState[]): void {
  for (const dot of dots) resetDot(dot)
}

/**
 * Blend two colors by coverage, interpolating alpha with the channels.
 * @param base - color at zero coverage.
 * @param active - color at full coverage.
 * @param t - coverage, clamped to 0..1.
 * @returns the blended color.
 */
export function blendRgba(base: Rgba, active: Rgba, t: number): Rgba {
  const coverage = Math.min(1, Math.max(0, t))
  return {
    r: base.r + (active.r - base.r) * coverage,
    g: base.g + (active.g - base.g) * coverage,
    b: base.b + (active.b - base.b) * coverage,
    a: base.a + (active.a - base.a) * coverage,
  }
}

/**
 * Color a dot from its distance to the pointer.
 * @param distance - resting-center distance in CSS pixels.
 * @param proximity - radius at which the active color is fully faded out.
 * @param base - color outside the proximity radius.
 * @param active - color at the pointer position.
 * @returns the base color outside the radius, otherwise the proximity blend.
 */
export function proximityColor(distance: number, proximity: number, base: Rgba, active: Rgba): Rgba {
  if (!(proximity > 0) || distance >= proximity) return base
  return blendRgba(base, active, 1 - distance / proximity)
}

/** Format a resolved color for a canvas fill style. */
export function cssRgba(color: Rgba): string {
  const alpha = Math.round(color.a * 1000) / 1000
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`
}

/**
 * Parse a CSS color into channels.
 * @param value - computed CSS color: `rgb()`/`rgba()` in either syntax, hex,
 *   `transparent`, or `color(srgb …)`.
 * @returns the parsed color, or undefined when the syntax is unsupported.
 */
export function parseCssColor(value: string): Rgba | undefined {
  const text = value.trim().toLowerCase()
  if (text === '') return undefined
  if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  if (text.startsWith('#')) return parseHexColor(text.slice(1))
  const functional = /^(rgba?|color)\(([^)]*)\)$/u.exec(text)
  if (functional === null) return undefined
  const [, name, body] = functional
  if (body === undefined) return undefined
  const segments = body.split('/')
  if (segments.length > 2) return undefined
  const [main, alphaText] = segments
  if (main === undefined) return undefined
  const parts = main.trim().replaceAll(',', ' ').split(/\s+/u).filter(Boolean)
  // Legacy comma syntax carries alpha as the fourth component; the slash
  // syntax carries it after the separator.
  const legacyAlpha = alphaText === undefined && main.includes(',') && parts.length === 4
    ? parts.pop()
    : undefined
  const alpha = parseAlpha(alphaText ?? legacyAlpha)
  if (alpha === undefined) return undefined
  if (name === 'color') {
    const [space, ...channels] = parts
    if (space !== 'srgb' || channels.length !== 3) return undefined
    const [r, g, b] = channels.map(parseUnitChannel)
    if (r === undefined || g === undefined || b === undefined) return undefined
    return { r: r * 255, g: g * 255, b: b * 255, a: alpha }
  }
  const channels = parts.map(parseByteChannel)
  const [r, g, b] = channels
  if (r === undefined || g === undefined || b === undefined) return undefined
  return { r, g, b, a: alpha }
}

/** Begin a push toward the capped target displacement, without moving the dot. */
function startPush(dot: DotState, x: number, y: number, params: DotFieldParams): void {
  const length = Math.hypot(x, y)
  const scale = length > params.maxDisplacement ? params.maxDisplacement / length : 1
  dot.phase = 'push'
  dot.targetX = x * scale
  dot.targetY = y * scale
  dot.phaseTime = 0
}

/** Integrate one fixed step for one dot and advance its phase. */
function advanceDot(dot: DotState, step: number, params: DotFieldParams): void {
  if (dot.phase === 'idle') return
  dot.phaseTime += step
  const pushing = dot.phase === 'push'
  const omega = pushing ? params.pushOmega : params.returnOmega
  const zeta = pushing ? params.pushZeta : params.returnZeta
  const targetX = pushing ? dot.targetX : 0
  const targetY = pushing ? dot.targetY : 0
  const stiffness = omega * omega
  const damping = 2 * zeta * omega
  dot.vx += (-stiffness * (dot.x - targetX) - damping * dot.vx) * step
  dot.vy += (-stiffness * (dot.y - targetY) - damping * dot.vy) * step
  dot.x += dot.vx * step
  dot.y += dot.vy * step
  if (!Number.isFinite(dot.x) || !Number.isFinite(dot.y)
    || !Number.isFinite(dot.vx) || !Number.isFinite(dot.vy)) {
    resetDot(dot)
    return
  }
  const settled = Math.hypot(dot.x - targetX, dot.y - targetY) <= params.settleDistance
    && Math.hypot(dot.vx, dot.vy) <= params.settleSpeed
  if (pushing) {
    if (settled || dot.phaseTime >= params.pushTimeout) {
      dot.phase = 'return'
      dot.phaseTime = 0
      dot.targetX = 0
      dot.targetY = 0
    }
    return
  }
  if (settled || dot.phaseTime >= params.returnTimeout) resetDot(dot)
}

/** Zero one dot and mark it idle. */
function resetDot(dot: DotState): void {
  dot.x = 0
  dot.y = 0
  dot.vx = 0
  dot.vy = 0
  dot.phase = 'idle'
  dot.targetX = 0
  dot.targetY = 0
  dot.phaseTime = 0
}

/** Parse `#rgb`, `#rgba`, `#rrggbb`, and `#rrggbbaa`. */
function parseHexColor(digits: string): Rgba | undefined {
  if (!/^[0-9a-f]+$/u.test(digits)) return undefined
  if (digits.length === 3 || digits.length === 4) {
    const [r, g, b, a = 'f'] = digits
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: Number.parseInt(`${a}${a}`, 16) / 255,
    }
  }
  if (digits.length === 6 || digits.length === 8) {
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      a: digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1,
    }
  }
  return undefined
}

/** Parse a color alpha channel: a unit number or a percentage. */
function parseAlpha(value: string | undefined): number | undefined {
  if (value === undefined) return 1
  const text = value.trim()
  if (text === '') return undefined
  if (text.endsWith('%')) {
    const percent = Number(text.slice(0, -1))
    return Number.isFinite(percent) ? Math.min(1, Math.max(0, percent / 100)) : undefined
  }
  const numeric = Number(text)
  return Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : undefined
}

/** Parse an rgb() channel: a byte number or a percentage of 255. */
function parseByteChannel(value: string): number | undefined {
  const text = value.trim()
  if (text.endsWith('%')) {
    const percent = Number(text.slice(0, -1))
    return Number.isFinite(percent) ? Math.min(255, Math.max(0, (percent / 100) * 255)) : undefined
  }
  const numeric = Number(text)
  return Number.isFinite(numeric) ? Math.min(255, Math.max(0, numeric)) : undefined
}

/** Parse a `color(srgb …)` channel: a unit number. */
function parseUnitChannel(value: string): number | undefined {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : undefined
}
