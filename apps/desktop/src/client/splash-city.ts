/** Deterministic layout, camera path, and traffic for the WebGL launch city; no DOM or WebGL access. */

/** A point in scene metres. */
export interface SplashVector {
  readonly x: number
  readonly y: number
  readonly z: number
}

/** Facade families resolved by the city shader. */
export const SPLASH_FACADE = { glass: 0, panel: 1, ribbon: 2, hero: 3 } as const

/** One facade family. */
export type SplashFacade = typeof SPLASH_FACADE[keyof typeof SPLASH_FACADE]

/** Steady accent lighting resolved by the city shader. */
export const SPLASH_TRIM = { none: 0, redCorners: 1, cyanCorners: 2, crownBand: 3, floorLines: 4, fins: 5 } as const

/** One accent lighting choice. */
export type SplashTrim = typeof SPLASH_TRIM[keyof typeof SPLASH_TRIM]

/** Tier footprints: rectangular boxes or circular, optionally tapering cylinders. */
export const SPLASH_FORM = { box: 0, round: 1 } as const

/** One tier footprint. */
export type SplashForm = typeof SPLASH_FORM[keyof typeof SPLASH_FORM]

/** Axis-aligned box: centre `x`/`z`, base height `y`, and extents in metres. */
export interface SplashBox {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly width: number
  readonly height: number
  readonly depth: number
}

/** One building tier and the facade parameters the city shader reads. */
export interface SplashTier extends SplashBox {
  /** Stable per-building hash input in [0, 1). */
  readonly seed: number
  readonly facade: SplashFacade
  /** Share of rooms with their lights on, in [0, 1]. */
  readonly lit: number
  readonly trim: SplashTrim
  /** Shop fronts occupy the street-level band facing the avenue; only box tiers carry them. */
  readonly storefront: boolean
  readonly form: SplashForm
  /** Top-to-base footprint ratio; box tiers keep 1. */
  readonly taper: number
}

/** Vertical neon blade sign projecting over the avenue; its artwork faces +Z. */
export interface SplashSign {
  readonly x: number
  /** Height of the sign's lower edge. */
  readonly y: number
  readonly z: number
  readonly width: number
  readonly height: number
  /** Artwork slot in the sign atlas, below `SPLASH_SIGN_SLOTS`. */
  readonly slot: number
}

/** Advertising screen centred on `x`/`y`/`z`; `yaw` turns its +Z face around the vertical axis. */
export interface SplashScreen {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly width: number
  readonly height: number
  readonly yaw: number
  /** Artwork slot in the screen atlas, below `SPLASH_SCREEN_SLOTS`. */
  readonly slot: number
}

/** Roof mast or spire standing on `y`, tapering to a steady obstruction light at its tip. */
export interface SplashAntenna {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly height: number
  /** Base radius in metres. */
  readonly radius: number
}

/** The complete deterministic city. */
export interface SplashCityLayout {
  readonly tiers: readonly SplashTier[]
  readonly roofUnits: readonly SplashBox[]
  readonly antennas: readonly SplashAntenna[]
  readonly signs: readonly SplashSign[]
  readonly screens: readonly SplashScreen[]
}

/** Camera position, look-at target, and vertical field of view in degrees. */
export interface SplashCameraPose {
  readonly position: SplashVector
  readonly target: SplashVector
  readonly fov: number
}

/** A straight loop that craft and their lights follow. */
export interface SplashLane {
  /** Lane anchor; craft loop within `span / 2` metres of it along the travel direction. */
  readonly origin: SplashVector
  /** Unit horizontal travel direction. */
  readonly directionX: number
  readonly directionZ: number
  /** Metres per second; every craft on one lane shares it, so craft never overtake. */
  readonly speed: number
  /** Initial offset along the loop, in metres. */
  readonly phase: number
  /** Loop length in metres. */
  readonly span: number
  /** Phase of the slow vertical hover, in radians. */
  readonly bob: number
}

/** Modelled craft kinds. */
export const SPLASH_CRAFT = { spinner: 0, hauler: 1 } as const

/** One modelled craft kind. */
export type SplashCraftKind = typeof SPLASH_CRAFT[keyof typeof SPLASH_CRAFT]

/** A modelled flying craft. */
export interface SplashFlyer extends SplashLane {
  readonly kind: SplashCraftKind
  /** Linear paint albedo. */
  readonly paint: readonly [number, number, number]
}

/** A distant light-only craft. */
export interface SplashVehicle extends SplashLane {
  /** Trail length behind the light, in metres. */
  readonly trail: number
  /** Light radius in metres. */
  readonly radius: number
  /** Headlights face the viewer's end of the lane; tail lights face away. */
  readonly headlight: boolean
}

/** Artwork slots drawn into the blade-sign atlas; no two signs of a layout share one. */
export const SPLASH_SIGN_SLOTS = 18

/** Artwork slots drawn into the screen atlas; no two screens, shelter posters, or the airship share one. */
export const SPLASH_SCREEN_SLOTS = 8

/**
 * Screen-atlas slots: the facade screens of the layout take the first `facades` slots, one each; the airship and the
 * two bus-shelter posters own the rest.
 */
export const SPLASH_SCREEN_SLOT = { facades: 5, airship: 5, shelters: [6, 7] } as const

/** Distance from the avenue centreline to the first building line. */
export const SPLASH_AVENUE_FRONTAGE = 17

/** Avenue extent along Z; the landmark plaza begins past `end`. */
export const SPLASH_AVENUE = { start: 175, end: -205 } as const

/** Street lamps stand at ±`x` every `spacing` metres along the avenue. */
export const SPLASH_LAMPS = { x: 12.4, spacing: 26, height: 9.5 } as const

/** Landmark tower closing the avenue; `deck` is the crown deck height the projector stands on. */
export const SPLASH_TOWER = { x: 0, z: -238, deck: 150 } as const

/** Centre and width of the projected Tomato mark above the landmark tower. */
export const SPLASH_MARK = { x: 0, y: 186, z: -238, width: 48 } as const

/** Cross streets along X; the frontage, second row, and districts leave each corridor clear for traffic and the maglev. */
export const SPLASH_CROSS_STREETS = { north: 71, south: -113, rail: -159 } as const

/** Half-width of every cross-street corridor. */
export const SPLASH_CROSS_STREET_HALF_WIDTH = 6

/** Air-lane heights above the avenue; skybridges and the airship keep clear of them. */
export const SPLASH_AIR_LANES = [28, 72, 104] as const

/** Air-lane offsets from the avenue centreline: inbound craft fly at −X, outbound at +X. */
export const SPLASH_AIR_LANE_X = 10.5

/** Advertising airship hovering over the avenue below the camera's crane path and between air lanes. */
export const SPLASH_BLIMP = { x: 0, y: 50, z: -60, length: 24, radius: 4.6 } as const

/** Elevated maglev along the rail cross street: guideway height, train make-up, speed, and loop length. */
export const SPLASH_MAGLEV = { z: SPLASH_CROSS_STREETS.rail, height: 30, cars: 5, carLength: 17, gap: 1.2, speed: 32, span: 1100 } as const

/** Landmark towers around the plaza; districts keep each `clearance` radius free and every `view` corridor low. */
export const SPLASH_LANDMARKS = {
  /** Television tower of stacked glass spheres on three shafts. */
  pearl: { x: 160, z: -430, height: 318, clearance: 34, view: { from: 40, halfAngle: 0.1 } },
  /** Gate-shaped twin tower joined below its crown. */
  gate: { x: -146, z: -450, height: 250, clearance: 62, view: { from: 85, halfAngle: 0.16 } },
  /** Supertall with a rounded triangular plan twisting a third of a turn. */
  twist: { x: 136, z: -710, height: 400, radius: 30, clearance: 42, view: { from: 110, halfAngle: 0.08 } },
  /** Tapered tower with a trapezoidal opening below its crown. */
  opener: { x: -150, z: -760, height: 330, clearance: 46, view: { from: 140, halfAngle: 0.08 } },
} as const

/** Buildings past this Z and within `VISTA_RADIUS` of the resting camera stay below it, opening its view to the skyline. */
const VISTA_START_Z = -45
const VISTA_RADIUS = 150
const VISTA_HEIGHT = 136

/** Street-level glide, upward crane, and the resting composition with the mark in the upper third; in path order. */
const CAMERA_KEYS: readonly SplashCameraPose[] = [
  { position: { x: 0, y: 5.2, z: 130 }, target: { x: 0, y: 17, z: 20 }, fov: 62 },
  { position: { x: 0.4, y: 8.5, z: 62 }, target: { x: 0, y: 40, z: -110 }, fov: 58 },
  { position: { x: -0.5, y: 36, z: 14 }, target: { x: 0, y: 104, z: -210 }, fov: 52 },
  { position: { x: 0.3, y: 116, z: -38 }, target: { x: 0, y: 150, z: -238 }, fov: 44 },
  { position: { x: 0, y: 152, z: -70 }, target: { x: 0, y: 157, z: -238 }, fov: 40 },
]

/**
 * Speed along the camera path over the move, before normalisation: the glide holds half the climb's peak speed,
 * accelerates into the climb, and settles to rest with no residual deceleration.
 */
const CAMERA_GLIDE_SHARE = 0.5
const CAMERA_CLIMB = { from: 0.22, to: 0.5 } as const
const CAMERA_SETTLE = { from: 0.62, to: 1 } as const

/**
 * Seeded uniform generator shared by every procedural part of the splash.
 * @param seed - 32-bit seed; equal seeds yield equal sequences.
 * @returns a function that yields the next value in [0, 1).
 */
export function splashRandom(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates shuffle in place. */
function shuffle(items: unknown[], random: () => number): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const item: unknown = items[index]
    items[index] = items[swap]
    items[swap] = item
  }
}

type Triple = readonly [number, number, number]

function smootherstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Centripetal Catmull-Rom point between `p1` and `p2` at local parameter `u` in [0, 1]; it never loops or overshoots. */
function catmullRom(p0: Triple, p1: Triple, p2: Triple, p3: Triple, u: number): Triple {
  const knot = (a: Triple, b: Triple): number => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])))
  const t1 = knot(p0, p1)
  const t2 = t1 + knot(p1, p2)
  const t3 = t2 + knot(p2, p3)
  const t = t1 + (t2 - t1) * u
  const lerp = (a: Triple, b: Triple, from: number, to: number): Triple => {
    const w = (t - from) / (to - from)
    return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]
  }
  const a1 = lerp(p0, p1, 0, t1)
  const a2 = lerp(p1, p2, t1, t2)
  const a3 = lerp(p2, p3, t2, t3)
  return lerp(lerp(a1, a2, 0, t2), lerp(a2, a3, t1, t3), t1, t2)
}

/** Natural cubic spline through (`knots[i]`, `values[i]`): continuous slope and curvature, no curvature at either end. */
function naturalSpline(knots: readonly number[], values: readonly number[]): (x: number) => number {
  const count = knots.length
  const at = (list: readonly number[], index: number): number => list[index] ?? 0
  const curvature = new Array<number>(count).fill(0)
  const upper = new Array<number>(count).fill(0)
  for (let index = 1; index < count - 1; index += 1) {
    const left = at(knots, index) - at(knots, index - 1)
    const right = at(knots, index + 1) - at(knots, index)
    const pivot = 2 * (left + right) - left * at(upper, index - 1)
    const rhs = 6 * ((at(values, index + 1) - at(values, index)) / right - (at(values, index) - at(values, index - 1)) / left)
    upper[index] = right / pivot
    curvature[index] = (rhs - left * at(curvature, index - 1)) / pivot
  }
  for (let index = count - 2; index > 0; index -= 1) curvature[index] = at(curvature, index) - at(upper, index) * at(curvature, index + 1)
  return (x) => {
    let index = 0
    while (index < count - 2 && at(knots, index + 1) < x) index += 1
    const span = at(knots, index + 1) - at(knots, index)
    const b = (x - at(knots, index)) / span
    const a = 1 - b
    return a * at(values, index) + b * at(values, index + 1)
      + ((a * a * a - a) * at(curvature, index) + (b * b * b - b) * at(curvature, index + 1)) * span * span / 6
  }
}

/**
 * The precomputed crane shot: arc-length samples of the position path, the targets and field of view keyed to each
 * key's share of that length, and the share of length covered at each point of the move.
 */
const CAMERA_PATH = (() => {
  const points = CAMERA_KEYS.map((key): Triple => [key.position.x, key.position.y, key.position.z])
  const first = points[0] ?? [0, 0, 0]
  const second = points[1] ?? first
  const last = points.at(-1) ?? first
  const beforeLast = points.at(-2) ?? last
  // Mirrored phantom points let the path leave the first key and reach the last key along their neighbours' chords.
  const extended: Triple[] = [
    [2 * first[0] - second[0], 2 * first[1] - second[1], 2 * first[2] - second[2]],
    ...points,
    [2 * last[0] - beforeLast[0], 2 * last[1] - beforeLast[1], 2 * last[2] - beforeLast[2]],
  ]
  const steps = 96
  const samples: Triple[] = []
  const lengths: number[] = []
  const keyLengths: number[] = [0]
  let travelled = 0
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const [p0, p1, p2, p3] = [extended[segment], extended[segment + 1], extended[segment + 2], extended[segment + 3]]
    if (p0 === undefined || p1 === undefined || p2 === undefined || p3 === undefined) throw new Error('splash: camera path is incomplete')
    for (let step = segment === 0 ? 0 : 1; step <= steps; step += 1) {
      const point = catmullRom(p0, p1, p2, p3, step / steps)
      const previous = samples.at(-1)
      if (previous !== undefined) travelled += Math.hypot(point[0] - previous[0], point[1] - previous[1], point[2] - previous[2])
      samples.push(point)
      lengths.push(travelled)
    }
    keyLengths.push(travelled)
  }
  const shares = keyLengths.map(length => length / travelled)
  const channel = (read: (key: SplashCameraPose) => number): ((share: number) => number) =>
    naturalSpline(shares, CAMERA_KEYS.map(read))
  const speed = (t: number): number => (CAMERA_GLIDE_SHARE + (1 - CAMERA_GLIDE_SHARE) * smootherstep(CAMERA_CLIMB.from, CAMERA_CLIMB.to, t))
    * (1 - smootherstep(CAMERA_SETTLE.from, CAMERA_SETTLE.to, t))
  const timeSteps = 1024
  const covered = [0]
  for (let step = 1; step <= timeSteps; step += 1) {
    covered.push((covered.at(-1) ?? 0) + (speed((step - 1) / timeSteps) + speed(step / timeSteps)) / 2)
  }
  const total = covered.at(-1) ?? 1
  return {
    samples, lengths, length: travelled, speed, total,
    covered: covered.map(value => value / total),
    target: { x: channel(key => key.target.x), y: channel(key => key.target.y), z: channel(key => key.target.z) },
    fov: channel(key => key.fov),
  }
})()

/**
 * Sample the continuous crane shot. Position, aim, and field of view all change with continuous velocity and
 * acceleration, and the camera comes to rest without residual deceleration.
 * @param progress - share of the camera move; values outside [0, 1] clamp to the first or resting pose.
 * @returns the camera pose at that point of the move.
 */
export function splashCameraAt(progress: number): SplashCameraPose {
  const first = CAMERA_KEYS[0]
  const last = CAMERA_KEYS.at(-1)
  if (first === undefined || last === undefined) throw new Error('splash: camera keys are incomplete')
  if (progress <= 0) return first
  if (progress >= 1) return last
  const { samples, lengths, length, covered, speed, total, target, fov } = CAMERA_PATH
  const steps = covered.length - 1
  const lower = Math.floor(progress * steps)
  const start = lower / steps
  // Integrating the speed from the last tabulated step keeps the camera's speed exactly continuous.
  const share = (covered[lower] ?? 0) + (speed(start) + speed(progress)) * 0.5 * (progress - start) * steps / total
  const distance = share * length
  let low = 0
  let high = lengths.length - 1
  while (high - low > 1) {
    const middle = (low + high) >> 1
    if ((lengths[middle] ?? 0) < distance) low = middle
    else high = middle
  }
  const from = samples[low] ?? [0, 0, 0]
  const to = samples[high] ?? from
  const startLength = lengths[low] ?? 0
  const blend = Math.min(1, Math.max(0, (distance - startLength) / Math.max(1e-6, (lengths[high] ?? startLength) - startLength)))
  return {
    position: {
      x: from[0] + (to[0] - from[0]) * blend,
      y: from[1] + (to[1] - from[1]) * blend,
      z: from[2] + (to[2] - from[2]) * blend,
    },
    target: { x: target.x(share), y: target.y(share), z: target.z(share) },
    fov: fov(share),
  }
}

/**
 * Eased share of a timeline phase.
 * @param elapsedMs - milliseconds since the timeline started.
 * @param startMs - phase start in milliseconds.
 * @param durationMs - phase length in milliseconds.
 * @returns 0 before the phase, 1 after it, and a smoothstep-eased value between.
 */
export function splashPhase(elapsedMs: number, startMs: number, durationMs: number): number {
  const value = Math.min(1, Math.max(0, (elapsedMs - startMs) / durationMs))
  return value * value * (3 - 2 * value)
}

/**
 * Centre of the maglev train along X.
 * @param seconds - seconds since the timeline started; the train is centred on the avenue at 1.6 s.
 * @returns the centre X, looping within `±SPLASH_MAGLEV.span / 2`.
 */
export function splashTrainX(seconds: number): number {
  const { speed, span } = SPLASH_MAGLEV
  return ((((seconds - 1.6) * speed + span / 2) % span) + span) % span - span / 2
}

/**
 * Lowest camera height while the camera crosses `z`.
 * @param z - scene Z in metres.
 * @returns the lowest height within 6 m of `z`, or undefined where the camera never travels.
 */
export function splashCameraHeightNear(z: number): number | undefined {
  let height: number | undefined
  for (let step = 0; step <= 400; step += 1) {
    const pose = splashCameraAt(step / 400)
    if (Math.abs(pose.position.z - z) > 6) continue
    height = Math.min(height ?? Infinity, pose.position.y)
  }
  return height
}

/** Width over height of the splash window, whose resting composition the overlay keep-out areas describe. */
export const SPLASH_VIEW_ASPECT = 1280 / 760

/**
 * Areas of the resting composition under the splash page's overlay: the HUD corner brackets and captions, and the
 * brand lockup. Each is (left, top, right, bottom) as shares of the viewport from its top-left corner. Adverts stay
 * out of them, so overlay text never sits on advert copy.
 */
export const SPLASH_OVERLAY_KEEP_OUT: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0.18, 0.12], [0.82, 0, 1, 0.12], [0, 0.89, 0.1, 1], [0.75, 0.89, 1, 1], [0.37, 0.66, 0.63, 0.83],
]

/**
 * Where a world point lands in the resting composition.
 * @param point - scene position in metres.
 * @returns viewport shares from the top-left corner, or undefined when the point lies behind the resting camera.
 */
export function splashRestView(point: SplashVector): { x: number; y: number } | undefined {
  const { position, target, fov } = splashCameraAt(1)
  const forward = normalized({ x: target.x - position.x, y: target.y - position.y, z: target.z - position.z })
  const right = normalized({ x: -forward.z, y: 0, z: forward.x })
  const up = {
    x: right.y * forward.z - right.z * forward.y,
    y: right.z * forward.x - right.x * forward.z,
    z: right.x * forward.y - right.y * forward.x,
  }
  const offset = { x: point.x - position.x, y: point.y - position.y, z: point.z - position.z }
  const depth = dot(offset, forward)
  if (depth <= 0) return undefined
  const slope = Math.tan((fov * Math.PI) / 360)
  return {
    x: 0.5 + 0.5 * dot(offset, right) / (depth * slope * SPLASH_VIEW_ASPECT),
    y: 0.5 - 0.5 * dot(offset, up) / (depth * slope),
  }
}

function dot(a: SplashVector, b: SplashVector): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function normalized(vector: SplashVector): SplashVector {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length }
}

/**
 * Whether a screen facing the camera, as seen in the resting composition, overlaps the page overlay.
 * @param screen - an unturned screen centred on its `x`/`y`/`z`.
 * @returns true when any part of its bounding box in the viewport enters a `SPLASH_OVERLAY_KEEP_OUT` area.
 */
export function splashUnderOverlay(screen: Omit<SplashScreen, 'slot'>): boolean {
  const corners = [-1, 1].flatMap(across => [-1, 1].map(up => splashRestView({
    x: screen.x + Math.cos(screen.yaw) * across * screen.width / 2,
    y: screen.y + up * screen.height / 2,
    z: screen.z - Math.sin(screen.yaw) * across * screen.width / 2,
  })))
  const seen = corners.filter(corner => corner !== undefined)
  if (seen.length === 0) return false
  const left = Math.min(...seen.map(corner => corner.x))
  const right = Math.max(...seen.map(corner => corner.x))
  const top = Math.min(...seen.map(corner => corner.y))
  const bottom = Math.max(...seen.map(corner => corner.y))
  return SPLASH_OVERLAY_KEEP_OUT.some(([x0, y0, x1, y1]) => left < x1 && right > x0 && top < y1 && bottom > y0)
}

/** Centre of the first cross-street corridor overlapping the Z span from `top` down to `bottom`. */
function corridorWithin(top: number, bottom: number): number | undefined {
  return Object.values(SPLASH_CROSS_STREETS).find(centre =>
    centre + SPLASH_CROSS_STREET_HALF_WIDTH > bottom && centre - SPLASH_CROSS_STREET_HALF_WIDTH < top)
}

/** Whether a footprint centred on `x`/`z` with radius `reach` enters a landmark's clearance. */
function nearLandmark(x: number, z: number, reach: number): boolean {
  return Object.values(SPLASH_LANDMARKS).some(landmark => Math.hypot(x - landmark.x, z - landmark.z) < landmark.clearance + reach)
}

/**
 * Tallest height a building may reach without hiding a landmark from the resting camera: inside a landmark's view
 * corridor, and nearer than it, the building stays below the sightline to the landmark's `view.from` height; the limit
 * relaxes over 0.06 rad past the corridor edge.
 */
function sightlineCeiling(x: number, z: number, reach: number): number {
  const camera = splashCameraAt(1).position
  const distance = Math.hypot(x - camera.x, z - camera.z)
  const bearing = Math.atan2(x - camera.x, camera.z - z)
  let ceiling = Infinity
  for (const landmark of Object.values(SPLASH_LANDMARKS)) {
    const span = Math.hypot(landmark.x - camera.x, landmark.z - camera.z)
    if (distance + reach >= span) continue
    const offset = Math.abs(bearing - Math.atan2(landmark.x - camera.x, camera.z - landmark.z)) - Math.atan2(reach, distance)
    const relax = Math.min(1, Math.max(0, (offset - landmark.view.halfAngle) / 0.06))
    if (relax >= 1) continue
    const sightline = camera.y + (landmark.view.from - camera.y) * (distance + reach) / span
    ceiling = Math.min(ceiling, sightline + relax * relax * 400)
  }
  return ceiling
}

/** Height after the vista and sightline limits; never below `floor` metres. */
function limitHeight(height: number, x: number, z: number, reach: number, floor: number): number {
  const camera = splashCameraAt(1).position
  const vista = z < VISTA_START_Z && Math.hypot(x - camera.x, z - camera.z) < VISTA_RADIUS ? VISTA_HEIGHT : Infinity
  return Math.max(floor, Math.min(height, vista, sightlineCeiling(x, z, reach)))
}

/** A facade screen before its artwork slot is drawn: `draw` in [0, 1) picks the slot once the layout is final. */
interface ScreenDraft extends Omit<SplashScreen, 'slot'> {
  readonly draw: number
}

interface CityDraft {
  readonly tiers: SplashTier[]
  readonly roofUnits: SplashBox[]
  readonly antennas: SplashAntenna[]
  readonly signs: SplashSign[]
  readonly screens: ScreenDraft[]
  /** Sign artwork slots not yet drawn. */
  readonly signSlots: number[]
}

/** Remove the slot at `draw` in [0, 1) from `pool`, so a layout never shows one artwork twice. */
function drawSlot(pool: number[], draw: number, kind: string): number {
  const [slot] = pool.splice(Math.floor(draw * pool.length), 1)
  if (slot === undefined) throw new Error(`splash: the city places more ${kind} than it has artwork for`)
  return slot
}

interface Plot {
  readonly x: number
  readonly z: number
  readonly width: number
  readonly depth: number
  readonly height: number
  readonly storefront: boolean
}

function pickFacade(random: () => number): SplashFacade {
  const value = random()
  if (value < 0.46) return SPLASH_FACADE.glass
  if (value < 0.78) return SPLASH_FACADE.panel
  return SPLASH_FACADE.ribbon
}

function pickTrim(random: () => number, round: boolean): SplashTrim {
  const value = random()
  if (round) {
    if (value < 0.3) return SPLASH_TRIM.crownBand
    if (value < 0.55) return SPLASH_TRIM.floorLines
    if (value < 0.7) return SPLASH_TRIM.fins
    return SPLASH_TRIM.none
  }
  if (value < 0.05) return SPLASH_TRIM.redCorners
  if (value < 0.09) return SPLASH_TRIM.cyanCorners
  if (value < 0.18) return SPLASH_TRIM.crownBand
  if (value < 0.25) return SPLASH_TRIM.floorLines
  if (value < 0.3) return SPLASH_TRIM.fins
  return SPLASH_TRIM.none
}

/** Stack a podium, setbacks or a tapering drum, roof plant, and a mast or spire on one plot; returns the tiers it added. */
function addBuilding(city: CityDraft, random: () => number, plot: Plot): SplashTier[] {
  const seed = random()
  const round = !plot.storefront && plot.height > 46 && random() < 0.17
  const facade = round ? (random() < 0.6 ? SPLASH_FACADE.glass : SPLASH_FACADE.ribbon) : pickFacade(random)
  const lit = 0.08 + random() * 0.3
  const trim = pickTrim(random, round)
  const form = round ? SPLASH_FORM.round : SPLASH_FORM.box
  const added: SplashTier[] = []
  let base = 0
  let width = round ? Math.min(plot.width, plot.depth) : plot.width
  let depth = round ? width : plot.depth
  let tierCount = plot.height > 60 ? 2 + Math.floor(random() * 2) : random() < 0.4 ? 2 : 1
  if (round) tierCount = Math.min(tierCount, 2)
  if (!round && tierCount > 1 && random() < 0.55) {
    const podium = Math.min(plot.height * 0.4, 9 + random() * 10)
    added.push({
      x: plot.x, y: 0, z: plot.z, width, depth, height: podium, seed, facade: SPLASH_FACADE.panel,
      lit: Math.min(1, lit + 0.15), trim: SPLASH_TRIM.none, storefront: plot.storefront, form, taper: 1,
    })
    base = podium
    width *= 0.7 + random() * 0.18
    depth *= 0.7 + random() * 0.18
    tierCount -= 1
  }
  for (let tier = 0; tier < tierCount; tier += 1) {
    const remaining = plot.height - base
    const last = tier === tierCount - 1
    const height = last ? remaining : remaining * (0.58 + random() * 0.2)
    const taper = round ? 0.84 + random() * 0.16 : 1
    added.push({
      x: plot.x, y: base, z: plot.z, width, depth, height, seed, facade, lit,
      trim: last ? trim : SPLASH_TRIM.none, storefront: plot.storefront && base === 0, form, taper,
    })
    base += height
    const shrink = round ? taper * (0.82 + random() * 0.1) : 0.72 + random() * 0.16
    width *= shrink
    depth = round ? width : depth * (0.72 + random() * 0.16)
  }
  const top = added.at(-1)
  if (top === undefined) return added
  const roof = top.y + top.height
  const topWidth = top.width * top.taper
  const topDepth = top.depth * top.taper
  if (round && random() < 0.45) {
    city.antennas.push({ x: top.x, y: roof, z: top.z, height: plot.height * (0.12 + random() * 0.1), radius: topWidth * 0.12 })
  } else {
    const units = 1 + Math.floor(random() * 3)
    for (let unit = 0; unit < units; unit += 1) {
      const unitWidth = 1.6 + random() * Math.min(5, topWidth * 0.3)
      const unitDepth = 1.6 + random() * Math.min(5, topDepth * 0.3)
      const spread = round ? 0.5 : 1
      city.roofUnits.push({
        x: top.x + (random() - 0.5) * (topWidth - unitWidth - 1.5) * spread,
        y: roof,
        z: top.z + (random() - 0.5) * (topDepth - unitDepth - 1.5) * spread,
        width: unitWidth,
        height: 1.2 + random() * 2.4,
        depth: unitDepth,
      })
    }
    if (plot.height > 70 && random() < 0.55) {
      const spire = !round && plot.height > 110 && random() < 0.35
      city.antennas.push({
        x: top.x + (spire ? 0 : (random() - 0.5) * topWidth * 0.5),
        y: roof,
        z: top.z + (spire ? 0 : (random() - 0.5) * topDepth * 0.5),
        height: spire ? 18 + random() * 22 : 7 + random() * 16,
        radius: spire ? Math.min(topWidth, topDepth) * 0.09 : 0.22,
      })
    }
  }
  city.tiers.push(...added)
  return added
}

/** Shorten a run of buildings so it stops before a corridor; returns the usable length, or undefined to jump past it. */
function fitBeforeCorridor(z: number, length: number): { length: number } | { skipTo: number } {
  const corridor = corridorWithin(z, z - length)
  if (corridor === undefined) return { length }
  const clear = corridor + SPLASH_CROSS_STREET_HALF_WIDTH
  if (z - clear < 8) return { skipTo: corridor - SPLASH_CROSS_STREET_HALF_WIDTH - 1 }
  return { length: z - clear - 0.5 }
}

/** Avenue frontage on one side: shop fronts, blade signs, and facade screens facing the camera corridor. */
function addFrontage(city: CityDraft, random: () => number, side: -1 | 1): void {
  let z: number = SPLASH_AVENUE.start
  while (z > SPLASH_AVENUE.end + 12) {
    const fit = fitBeforeCorridor(z, Math.min(z - SPLASH_AVENUE.end, 14 + random() * 13))
    if ('skipTo' in fit) {
      z = fit.skipTo
      continue
    }
    const length = fit.length
    const centreZ = z - length / 2
    const width = 15 + random() * 13
    const setback = random() * 2.2
    const face = SPLASH_AVENUE_FRONTAGE + setback
    const towerward = Math.max(0, Math.min(1, (40 - centreZ) / 220))
    const x = side * (face + width / 2)
    const height = limitHeight(26 + random() ** 1.5 * 96 + towerward * 46, x, centreZ, Math.max(width, length) / 2, 24)
    const tiers = addBuilding(city, random, {
      x, z: centreZ, width, depth: length, height, storefront: true,
    })
    const street = tiers[0]
    if (street !== undefined && centreZ < 160 && centreZ > -150) {
      const count = random() < 0.8 ? 1 + Math.floor(random() * 2.4) : 0
      for (let index = 0; index < count; index += 1) {
        // Sign artwork slots are 1:4; heights follow widths so glyphs keep their proportions.
        const signWidth = 2.1 + random() * 0.6
        const signHeight = signWidth * (3.7 + random() * 0.5)
        const bottom = 5.5 + random() * Math.max(0, Math.min(34, street.height - signHeight - 7))
        if (bottom + signHeight > street.height - 1) continue
        city.signs.push({
          x: side * (face - signWidth / 2 - 0.35),
          y: bottom,
          z: centreZ + (index - (count - 1) / 2) * Math.min(5, length / Math.max(1, count)) + (random() - 0.5),
          width: signWidth,
          height: signHeight,
          slot: drawSlot(city.signSlots, random(), 'signs'),
        })
      }
    }
    if (street !== undefined && height > 46 && length > 16 && random() < 0.42 && centreZ < 120) {
      const screenWidth = Math.min(length - 4, 11 + random() * 9)
      const screenHeight = screenWidth * (0.5 + random() * 0.12)
      const screenY = Math.min(street.height - screenHeight / 2 - 3, 20 + screenHeight / 2 + random() * 26)
      if (screenY - screenHeight / 2 > 12) {
        city.screens.push({
          x: side * (face - 0.45), y: screenY, z: centreZ,
          width: screenWidth, height: screenHeight, yaw: -side * Math.PI / 2,
          draw: random(),
        })
      }
    }
    z -= length + (random() < 0.4 ? 4 + random() * 5 : 1.2)
  }
}

/** Taller second-row towers behind the frontage; some carry rooftop screens facing the camera. */
function addSecondRow(city: CityDraft, random: () => number, side: -1 | 1): void {
  let z = SPLASH_AVENUE.start - 10
  while (z > -300) {
    const fit = fitBeforeCorridor(z, 18 + random() * 14)
    if ('skipTo' in fit) {
      z = fit.skipTo
      continue
    }
    const length = fit.length
    const centreZ = z - length / 2
    const width = 18 + random() * 16
    const towerward = Math.max(0, Math.min(1, (60 - centreZ) / 300))
    const x = side * (44 + random() * 10 + width / 2)
    const height = limitHeight(50 + random() ** 1.3 * 110 + towerward * 60, x, centreZ, Math.max(width, length) / 2, 40)
    const tiers = addBuilding(city, random, {
      x, z: centreZ, width, depth: length, height, storefront: false,
    })
    const top = tiers.at(-1)
    if (top !== undefined && top.form === SPLASH_FORM.box && centreZ < -40 && random() < 0.35) {
      const screenWidth = Math.min(top.width - 2, 12 + random() * 8)
      const screenHeight = screenWidth * 0.48
      city.screens.push({
        x: top.x, y: top.y + top.height + 1.2 + screenHeight / 2, z: top.z + top.depth / 2 - 1,
        width: screenWidth, height: screenHeight, yaw: 0,
        draw: random(),
      })
    }
    z -= length + 3 + random() * 6
  }
}

/** Surrounding districts on a street grid whose gaps carry the cross streets, rising toward the landmark. */
function addDistricts(city: CityDraft, random: () => number): void {
  for (let gridX = -520; gridX <= 520; gridX += 46) {
    for (let gridZ = -780; gridZ <= 200; gridZ += 46) {
      if (Math.abs(gridX) < 96 && gridZ > -320) continue
      if (Math.hypot(gridX - SPLASH_TOWER.x, gridZ - SPLASH_TOWER.z) < 90) continue
      const buildings = 1 + Math.floor(random() * 2.2)
      for (let index = 0; index < buildings; index += 1) {
        const width = 12 + random() * (buildings === 1 ? 20 : 12)
        const depth = 12 + random() * (buildings === 1 ? 20 : 12)
        const x = gridX + (random() - 0.5) * (34 - width)
        const z = gridZ + (random() - 0.5) * (34 - depth)
        if (nearLandmark(x, z, Math.max(width, depth) / 2)) continue
        const toTower = Math.hypot(x - SPLASH_TOWER.x, z - SPLASH_TOWER.z)
        const spike = random() < 0.07 ? 70 + random() * 110 : 0
        const raw = 16 + random() ** 1.8 * 70 + 120 * Math.exp(-((toTower / 300) ** 2)) + spike
        const height = limitHeight(raw, x, z, Math.max(width, depth) / 2, 14)
        addBuilding(city, random, { x, z, width, depth, height, storefront: false })
      }
    }
  }
}

/** Distant megastructures that read as silhouettes through the haze. */
function addMegastructures(city: CityDraft, random: () => number): void {
  for (let index = 0; index < 14; index += 1) {
    const angle = -Math.PI * 0.92 + (index / 13) * Math.PI * 0.84 + (random() - 0.5) * 0.1
    const distance = 720 + random() * 420
    const width = 70 + random() * 70
    addBuilding(city, random, {
      x: SPLASH_TOWER.x + Math.cos(angle) * distance,
      z: SPLASH_TOWER.z + Math.sin(angle) * distance,
      width,
      depth: width * (0.7 + random() * 0.5),
      height: 260 + random() * 240,
      storefront: false,
    })
  }
}

/** The landmark the camera rises toward: a box plaza podium under a tapering drum; the projector deck carries the mark. */
function addLandmark(city: CityDraft): void {
  const { x, z, deck } = SPLASH_TOWER
  const tier = (
    y: number, width: number, height: number, facade: SplashFacade, trim: SplashTrim, form: SplashForm, taper: number,
  ): SplashTier => ({
    x, y, z, width, depth: width, height, seed: 0.618, facade, lit: 0.42, trim, storefront: false, form, taper,
  })
  city.tiers.push(
    tier(0, 72, 22, SPLASH_FACADE.panel, SPLASH_TRIM.crownBand, SPLASH_FORM.box, 1),
    tier(22, 38, 96, SPLASH_FACADE.hero, SPLASH_TRIM.none, SPLASH_FORM.round, 0.9),
    tier(118, 31, 22, SPLASH_FACADE.hero, SPLASH_TRIM.crownBand, SPLASH_FORM.round, 0.9),
    tier(140, 25, deck - 140, SPLASH_FACADE.hero, SPLASH_TRIM.crownBand, SPLASH_FORM.round, 0.96),
  )
}

/** Skybridge bottoms tried in order of preference; each is filtered against the camera, air lanes, and airship. */
const SKYBRIDGE_BOTTOMS = [12, 36, 48, 58, 82, 92, 112, 126, 140] as const
const SKYBRIDGE_THICKNESS = 4.6

/** Skybridges across the avenue where both frontages face each other, clear of the camera, air lanes, airship, signs, and screens. */
function addSkybridges(city: CityDraft, random: () => number): void {
  const street = (side: -1 | 1): SplashTier[] => city.tiers.filter(tier => tier.storefront && Math.sign(tier.x) === side)
  const placed: number[] = []
  for (const left of street(-1)) {
    for (const right of street(1)) {
      const north = Math.min(left.z + left.depth / 2, right.z + right.depth / 2) - 4
      const south = Math.max(left.z - left.depth / 2, right.z - right.depth / 2) + 4
      const z = (north + south) / 2
      if (north - south < 7 || z > splashCameraAt(0).position.z || placed.some(other => Math.abs(other - z) < 26)) continue
      const camera = splashCameraHeightNear(z)
      const nearBlimp = Math.abs(z - SPLASH_BLIMP.z) < 14
      const candidates = SKYBRIDGE_BOTTOMS.filter((bottom) => {
        const top = bottom + SKYBRIDGE_THICKNESS
        const middle = (bottom + top) / 2
        if (camera !== undefined && !(bottom > camera + 14 || top < camera - 18)) return false
        if (SPLASH_AIR_LANES.some(lane => lane > bottom - 5 && lane < top + 5)) return false
        if (city.signs.some(sign => Math.abs(sign.z - z) < 4.5 && sign.y < top + 1 && sign.y + sign.height > bottom - 1)) return false
        const screened = city.screens.some(screen =>
          Math.abs(screen.z - z) < screen.width / 2 + 3.5 && Math.abs(screen.y - middle) < screen.height / 2 + 3.5)
        if (screened) return false
        const blimpBottom = SPLASH_BLIMP.y - SPLASH_BLIMP.radius - 4
        const blimpTop = SPLASH_BLIMP.y + SPLASH_BLIMP.radius + 4
        return !nearBlimp || top < blimpBottom || bottom > blimpTop
      })
      shuffle(candidates, random)
      for (const bottom of candidates) {
        const top = bottom + SKYBRIDGE_THICKNESS
        // Each end sinks 1.5 m into the nearest tier that spans the bridge's height on that side.
        const ends = ([-1, 1] as const).map((side) => {
          const faces = city.tiers
            .filter(tier => Math.sign(tier.x) === side
              && Math.abs(tier.z - z) < tier.depth / 2 - 3
              && tier.y < bottom && tier.y + tier.height > top + 6)
            .map(tier => Math.abs(tier.x) - tier.width / 2)
          return faces.length === 0 ? undefined : side * (Math.min(...faces) + 1.5)
        })
        const [west, east] = ends
        if (west === undefined || east === undefined || east - west > SPLASH_AVENUE_FRONTAGE * 2 + 10) continue
        placed.push(z)
        city.tiers.push({
          x: (west + east) / 2, y: bottom, z, width: east - west, height: top - bottom, depth: 6.5,
          seed: random(), facade: SPLASH_FACADE.glass, lit: 0.55, trim: SPLASH_TRIM.none, storefront: false,
          form: SPLASH_FORM.box, taper: 1,
        })
        break
      }
    }
  }
}

/**
 * Build the seeded city: avenue frontage with signs and screens, second row, districts, skyline, and the plaza landmark.
 * The landmark plots in `SPLASH_LANDMARKS` and the corridors in `SPLASH_CROSS_STREETS` stay empty, no two adverts share
 * an artwork slot, and no screen sits under `SPLASH_OVERLAY_KEEP_OUT` in the resting composition.
 * @returns the same layout on every call.
 */
export function splashCityLayout(): SplashCityLayout {
  const random = splashRandom(0x70a704)
  const city: CityDraft = {
    tiers: [], roofUnits: [], antennas: [], signs: [], screens: [],
    signSlots: Array.from({ length: SPLASH_SIGN_SLOTS }, (_, slot) => slot),
  }
  addFrontage(city, random, -1)
  addFrontage(city, random, 1)
  addSecondRow(city, random, -1)
  addSecondRow(city, random, 1)
  addDistricts(city, random)
  addMegastructures(city, random)
  addLandmark(city)
  addSkybridges(city, random)
  // Screens under the page overlay in the resting composition go last, so leaving them out moves no other placement;
  // the screens that remain then draw their artwork.
  const pool = Array.from({ length: SPLASH_SCREEN_SLOT.facades }, (_, slot) => slot)
  const screens = city.screens.filter(screen => !splashUnderOverlay(screen))
    .map(({ draw, ...screen }) => ({ ...screen, slot: drawSlot(pool, draw, 'screens') }))
  return { tiers: city.tiers, roofUnits: city.roofUnits, antennas: city.antennas, signs: city.signs, screens }
}

const SPINNER_PAINTS: readonly (readonly [number, number, number])[] = [
  [0.05, 0.052, 0.06], [0.42, 0.43, 0.45], [0.3, 0.024, 0.028], [0.012, 0.012, 0.014], [0.03, 0.1, 0.18],
]
const HAULER_PAINTS: readonly (readonly [number, number, number])[] = [[0.4, 0.24, 0.04], [0.19, 0.19, 0.2]]

/**
 * Seeded modelled craft: spinners in both directions on every avenue air lane, spinners and haulers on the cross streets.
 * @returns the same craft on every call.
 */
export function splashFlyers(): SplashFlyer[] {
  const random = splashRandom(0xf1e5)
  const flyers: SplashFlyer[] = []
  const lane = (
    origin: SplashVector, directionX: number, directionZ: number, count: number, span: number, speed: number, kind: SplashCraftKind,
  ): void => {
    const paints = kind === SPLASH_CRAFT.hauler ? HAULER_PAINTS : SPINNER_PAINTS
    for (let index = 0; index < count; index += 1) {
      flyers.push({
        origin, directionX, directionZ, speed, span, kind,
        phase: (index + 0.15 + random() * 0.6) * span / count,
        bob: random() * Math.PI * 2,
        paint: paints[Math.floor(random() * paints.length)] ?? [0.05, 0.05, 0.05],
      })
    }
  }
  const avenueCentre = (SPLASH_AVENUE.start + SPLASH_AVENUE.end + 30) / 2
  const avenueSpan = SPLASH_AVENUE.start - SPLASH_AVENUE.end + 50
  for (const height of SPLASH_AIR_LANES) {
    lane({ x: -SPLASH_AIR_LANE_X, y: height, z: avenueCentre }, 0, 1, 5, avenueSpan, 22 + random() * 6, SPLASH_CRAFT.spinner)
    lane({ x: SPLASH_AIR_LANE_X, y: height + 2.5, z: avenueCentre }, 0, -1, 5, avenueSpan, 18 + random() * 6, SPLASH_CRAFT.spinner)
  }
  const crossings: readonly (readonly [number, readonly number[], number | undefined])[] = [
    [SPLASH_CROSS_STREETS.north, [58, 94], 40],
    [SPLASH_CROSS_STREETS.south, [66, 98, 130], 46],
    [SPLASH_CROSS_STREETS.rail, [60, 110], undefined],
  ]
  for (const [z, heights, haulerHeight] of crossings) {
    for (const height of heights) {
      lane({ x: 0, y: height, z: z + 2.4 }, 1, 0, 6, 900, 28 + random() * 8, SPLASH_CRAFT.spinner)
      lane({ x: 0, y: height + 3, z: z - 2.4 }, -1, 0, 6, 900, 26 + random() * 8, SPLASH_CRAFT.spinner)
    }
    if (haulerHeight !== undefined) {
      lane({ x: 0, y: haulerHeight, z: z + 2 }, 1, 0, 3, 900, 13, SPLASH_CRAFT.hauler)
      lane({ x: 0, y: haulerHeight + 6, z: z - 2 }, -1, 0, 3, 900, 12, SPLASH_CRAFT.hauler)
    }
  }
  return flyers
}

/**
 * Seeded distant light-only traffic above the outer districts.
 * @returns the same vehicles on every call.
 */
export function splashTraffic(): SplashVehicle[] {
  const random = splashRandom(0x5eed)
  const vehicles: SplashVehicle[] = []
  const lane = (origin: SplashVector, directionX: number, directionZ: number, count: number, span: number, headlight: boolean): void => {
    const speed = 30 + random() * 14
    for (let index = 0; index < count; index += 1) {
      vehicles.push({
        origin, directionX, directionZ, speed, span, headlight,
        phase: (index + random() * 0.7) * span / count,
        bob: random() * Math.PI * 2,
        trail: 5 + random() * 6,
        radius: 0.45,
      })
    }
  }
  // Lanes stay outside the landmark plots, and lanes crossing behind the mark fly below or above it in the resting shot.
  for (const [x, height] of [[-260, 150], [-340, 190], [-420, 230], [260, 165], [340, 205], [420, 250]] as const) {
    lane({ x, y: height, z: -300 }, 0, 1, 9, 900, true)
    lane({ x: x + 6, y: height + 4, z: -300 }, 0, -1, 9, 900, false)
  }
  for (const [z, height] of [[-380, 150], [-540, 290], [-660, 330]] as const) {
    lane({ x: 0, y: height, z }, 1, 0, 10, 1100, true)
    lane({ x: 0, y: height + 4, z: z - 6 }, -1, 0, 10, 1100, false)
  }
  return vehicles
}
