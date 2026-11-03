/** Geometry builders for the landmark towers, flying craft, airship, and maglev train; local frames, no scene state. */

import * as THREE from 'three'
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import type { LandmarkKind } from './splash-glsl-landmark.ts'
import { SPLASH_LANDMARKS, SPLASH_MAGLEV } from './splash-city.ts'

/** A light carried by a model, in the model's local frame (craft: +X right, +Y up, +Z forward). */
export interface ModelLight {
  readonly offset: readonly [number, number, number]
  /** Linear radiance. */
  readonly color: readonly [number, number, number]
  /** Radius in metres. */
  readonly radius: number
  /** 0 shines everywhere, 1 is a headlight facing forward, 2 is a tail light facing backward. */
  readonly kind: 0 | 1 | 2
  /** Trail length behind the light, in metres. */
  readonly trail: number
}

/** A neon outline tube: radiance, radius, and the path it follows. */
export interface ModelOutline {
  readonly color: readonly [number, number, number]
  readonly radius: number
  readonly points: readonly THREE.Vector3[]
}

/** A landmark's surfaces and the steady lights mounted on it, in its local frame with the base at y = 0. */
export interface LandmarkModel {
  /** Meshes grouped by the `LANDMARK_FRAGMENT_GLSL` surface each draws. */
  readonly surfaces: readonly {
    readonly kind: LandmarkKind
    /** Adds the gate's diamond lattice to a planar facade. */
    readonly diagrid?: boolean
    readonly geometry: THREE.BufferGeometry
  }[]
  readonly outlines: readonly ModelOutline[]
  /** Aviation and accent lights. */
  readonly lights: readonly ModelLight[]
}

/** Twist of the supertall's rounded triangular plan, in radians per metre of height: a third of a turn overall. */
export const TWIST_RATE = (2 * Math.PI / 3) / SPLASH_LANDMARKS.twist.height

const AVIATION_RED = [1.7, 0.07, 0.05] as const

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Attach constant per-vertex emission (rgb) and surface kind (alpha: 0 painted, 1 glass, 2 accent trim, 3 black
 * rubber and plastic) for the craft shader, which reads no texture coordinates.
 */
function glow(geometry: THREE.BufferGeometry, rgb: readonly [number, number, number], kind = 0): THREE.BufferGeometry {
  if (geometry.hasAttribute('uv')) geometry.deleteAttribute('uv')
  const count = geometry.getAttribute('position').count
  const values = new Float32Array(count * 4)
  for (let index = 0; index < count; index += 1) values.set([rgb[0], rgb[1], rgb[2], kind], index * 4)
  geometry.setAttribute('aGlow', new THREE.BufferAttribute(values, 4))
  return geometry
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false)
  for (const part of parts) part.dispose()
  return merged
}

/** Cylinder between two points. */
function strut(from: THREE.Vector3, to: THREE.Vector3, bottomRadius: number, topRadius: number, segments: number): THREE.BufferGeometry {
  const axis = to.clone().sub(from)
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, axis.length(), segments)
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.clone().normalize()))
  const middle = from.clone().add(to).multiplyScalar(0.5)
  geometry.translate(middle.x, middle.y, middle.z)
  return geometry
}

function quadratic(from: THREE.Vector2, control: THREE.Vector2, to: THREE.Vector2, count: number): THREE.Vector2[] {
  return Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count
    const s = 1 - t
    return new THREE.Vector2(
      s * s * from.x + 2 * s * t * control.x + t * t * to.x,
      s * s * from.y + 2 * s * t * control.y + t * t * to.y,
    )
  })
}

function line(from: THREE.Vector2, to: THREE.Vector2, count: number): THREE.Vector2[] {
  return Array.from({ length: count + 1 }, (_, index) => from.clone().lerp(to, index / count))
}

function lift(points: readonly THREE.Vector2[], z: number | ((y: number) => number)): THREE.Vector3[] {
  return points.map(point => new THREE.Vector3(point.x, point.y, typeof z === 'number' ? z : z(point.y)))
}

/**
 * Television tower: three shafts and inclined legs carrying a lower sphere, five small spheres, an upper sphere,
 * a space module, and a stepped spire.
 * @returns the tower in its local frame.
 */
export function createPearlTower(): LandmarkModel {
  const { height } = SPLASH_LANDMARKS.pearl
  const spheres: THREE.BufferGeometry[] = []
  const sphere = (x: number, y: number, z: number, radius: number): void => {
    spheres.push(new THREE.SphereGeometry(radius, 56, 32).translate(x, y, z))
  }
  sphere(0, 63, 0, 17)
  for (let index = 0; index < 5; index += 1) {
    const angle = index * (2 * Math.PI / 3) + Math.PI / 6
    sphere(Math.cos(angle) * 6.2, 94 + index * 14, Math.sin(angle) * 6.2, 4.3)
  }
  sphere(0, 179, 0, 15.3)
  sphere(0, 233, 0, 5.6)
  const shafts: THREE.BufferGeometry[] = []
  for (let index = 0; index < 3; index += 1) {
    const angle = index * (2 * Math.PI / 3) + Math.PI / 6
    const x = Math.cos(angle) * 6.2
    const z = Math.sin(angle) * 6.2
    shafts.push(new THREE.CylinderGeometry(3, 3, 182, 24).translate(x, 91, z))
    const legAngle = angle + Math.PI / 3
    shafts.push(strut(
      new THREE.Vector3(Math.cos(legAngle) * 24, 0, Math.sin(legAngle) * 24),
      new THREE.Vector3(Math.cos(legAngle) * 6, 50, Math.sin(legAngle) * 6),
      2.9, 2.3, 20,
    ))
  }
  shafts.push(new THREE.CylinderGeometry(4.2, 4.6, 54, 28).translate(0, 206, 0))
  const spire: readonly (readonly [number, number, number, number])[] = [
    [238, 262, 2.6, 2.2], [262, 288, 1.6, 1.3], [288, 306, 0.9, 0.6], [306, height, 0.35, 0.08],
  ]
  for (const [bottom, top, bottomRadius, topRadius] of spire) {
    shafts.push(new THREE.CylinderGeometry(topRadius, bottomRadius, top - bottom, 16).translate(0, (bottom + top) / 2, 0))
    shafts.push(new THREE.CylinderGeometry(bottomRadius + 0.6, bottomRadius + 0.6, 0.7, 20).translate(0, bottom + 0.35, 0))
  }
  const lights: ModelLight[] = [{ offset: [0, height + 0.4, 0], color: AVIATION_RED, radius: 0.9, kind: 0, trail: 0 }]
  for (let index = 0; index < 3; index += 1) {
    const angle = index * (2 * Math.PI / 3)
    lights.push({ offset: [Math.cos(angle) * 1.9, 288.6, Math.sin(angle) * 1.9], color: AVIATION_RED, radius: 0.6, kind: 0, trail: 0 })
    lights.push({ offset: [Math.cos(angle) * 3.4, 262.6, Math.sin(angle) * 3.4], color: AVIATION_RED, radius: 0.6, kind: 0, trail: 0 })
  }
  return {
    surfaces: [
      { kind: 'pearlSphere', geometry: merge(spheres) },
      { kind: 'pearlColumn', geometry: merge(shafts) },
    ],
    outlines: [],
    lights,
  }
}

/**
 * Gate tower: two legs that lean inward and join below a common crown, framing a tall arched opening.
 * Its +Z face is the front; neon traces the opening and the outer silhouette.
 * @returns the tower in its local frame.
 */
export function createGateTower(): LandmarkModel {
  const { height } = SPLASH_LANDMARKS.gate
  const depth = 30
  const shape = new THREE.Shape()
  shape.moveTo(-48, 0)
  shape.lineTo(-17, 0)
  shape.lineTo(-17, 150)
  shape.absellipse(0, 150, 17, 38, Math.PI, 0, true, 0)
  shape.lineTo(17, 0)
  shape.lineTo(48, 0)
  shape.quadraticCurveTo(47, 150, 40, height)
  shape.lineTo(-40, height)
  shape.quadraticCurveTo(-47, 150, -48, 0)
  const body = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 32, steps: 1 })
  body.translate(0, 0, -depth / 2)
  const front = depth / 2 + 0.3
  const arch = [
    ...line(new THREE.Vector2(-17, 0), new THREE.Vector2(-17, 150), 30),
    ...Array.from({ length: 41 }, (_, index) => {
      const angle = Math.PI - index / 40 * Math.PI
      return new THREE.Vector2(Math.cos(angle) * 17, 150 + Math.sin(angle) * 38)
    }),
    ...line(new THREE.Vector2(17, 150), new THREE.Vector2(17, 0), 30),
  ]
  const silhouette = [
    ...quadratic(new THREE.Vector2(-48, 0), new THREE.Vector2(-47, 150), new THREE.Vector2(-40, height), 40),
    ...line(new THREE.Vector2(-40, height), new THREE.Vector2(40, height), 30),
    ...quadratic(new THREE.Vector2(40, height), new THREE.Vector2(47, 150), new THREE.Vector2(48, 0), 40),
  ]
  return {
    surfaces: [{ kind: 'planar', diagrid: true, geometry: body }],
    outlines: [
      { color: [2.2, 0.1, 0.07], radius: 0.55, points: lift(arch, front) },
      { color: [0.2, 1.0, 1.5], radius: 0.32, points: lift(silhouette, front) },
    ],
    lights: [
      { offset: [-38, height + 0.6, 0], color: AVIATION_RED, radius: 0.9, kind: 0, trail: 0 },
      { offset: [38, height + 0.6, 0], color: AVIATION_RED, radius: 0.9, kind: 0, trail: 0 },
    ],
  }
}

/**
 * Supertall with a rounded triangular plan that tapers and twists a third of a turn, capped by a crown ring and mast.
 * @returns the tower in its local frame.
 */
export function createTwistTower(): LandmarkModel {
  const { height, radius } = SPLASH_LANDMARKS.twist
  const levels = 90
  const segments = 132
  const positions: number[] = []
  const indices: number[] = []
  const ring = (level: number): void => {
    const y = level / levels * height
    const plan = radius * (1 - 0.42 * (y / height) ** 1.2)
    for (let segment = 0; segment < segments; segment += 1) {
      const theta = segment / segments * Math.PI * 2
      const reach = plan * (1 + 0.085 * Math.cos(3 * (theta - TWIST_RATE * y)))
      positions.push(Math.cos(theta) * reach, y, Math.sin(theta) * reach)
    }
  }
  for (let level = 0; level <= levels; level += 1) ring(level)
  for (let level = 0; level < levels; level += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = level * segments + segment
      const b = level * segments + (segment + 1) % segments
      indices.push(a, a + segments, b, b, a + segments, b + segments)
    }
  }
  // The cap repeats the top ring so its edge stays crisp instead of averaging with the walls.
  const capStart = positions.length / 3
  ring(levels)
  const centre = positions.length / 3
  positions.push(0, height, 0)
  for (let segment = 0; segment < segments; segment += 1) indices.push(centre, capStart + (segment + 1) % segments, capStart + segment)
  const body = new THREE.BufferGeometry()
  body.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  body.setIndex(indices)
  body.computeVertexNormals()
  const top = radius * 0.58
  const crown = Array.from({ length: 97 }, (_, index) => {
    const angle = index / 96 * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * (top + 0.6), height - 1.2, Math.sin(angle) * (top + 0.6))
  })
  return {
    surfaces: [
      { kind: 'twist', geometry: body },
      { kind: 'pearlColumn', geometry: new THREE.CylinderGeometry(0.25, 1.1, 26, 12).translate(0, height + 13, 0) },
    ],
    outlines: [{ color: [2.0, 0.1, 0.07], radius: 0.5, points: crown }],
    lights: [{ offset: [0, height + 26.4, 0], color: AVIATION_RED, radius: 0.9, kind: 0, trail: 0 }],
  }
}

/**
 * Tapered tower whose depth narrows toward the crown, pierced by a trapezoidal opening; its +Z face is the front.
 * @returns the tower in its local frame.
 */
export function createOpenerTower(): LandmarkModel {
  const { height } = SPLASH_LANDMARKS.opener
  const depth = 52
  const narrowing = 0.72
  const shape = new THREE.Shape()
  shape.moveTo(-26, 0)
  shape.lineTo(26, 0)
  shape.lineTo(19, height)
  shape.lineTo(-19, height)
  shape.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-15, 268)
  hole.lineTo(15, 268)
  hole.lineTo(12, 302)
  hole.lineTo(-12, 302)
  hole.closePath()
  shape.holes.push(hole)
  const body = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 })
  body.translate(0, 0, -depth / 2)
  const position = body.getAttribute('position')
  for (let index = 0; index < position.count; index += 1) {
    position.setZ(index, position.getZ(index) * (1 - narrowing * position.getY(index) / height))
  }
  body.computeVertexNormals()
  const front = (y: number): number => depth / 2 * (1 - narrowing * y / height) + 0.3
  const opening = [
    ...line(new THREE.Vector2(-15, 268), new THREE.Vector2(15, 268), 20),
    ...line(new THREE.Vector2(15, 268), new THREE.Vector2(12, 302), 16),
    ...line(new THREE.Vector2(12, 302), new THREE.Vector2(-12, 302), 20),
    ...line(new THREE.Vector2(-12, 302), new THREE.Vector2(-15, 268), 16),
  ]
  return {
    surfaces: [{ kind: 'planar', geometry: body }],
    outlines: [
      { color: [2.1, 0.32, 0.08], radius: 0.45, points: lift(opening, front) },
      { color: [0.2, 1.0, 1.5], radius: 0.3, points: lift(line(new THREE.Vector2(-19, height), new THREE.Vector2(19, height), 30), front) },
    ],
    lights: [
      { offset: [-18, height + 0.6, 0], color: AVIATION_RED, radius: 0.9, kind: 0, trail: 0 },
      { offset: [18, height + 0.6, 0], color: AVIATION_RED, radius: 0.9, kind: 0, trail: 0 },
    ],
  }
}

/** Spinner lights: headlights, tail bar, thruster glows, and the hover glow beneath the hull. */
export const SPINNER_LIGHTS: readonly ModelLight[] = [
  { offset: [-0.5, -0.02, 2.25], color: [1.5, 1.45, 1.35], radius: 0.17, kind: 1, trail: 0.3 },
  { offset: [0.5, -0.02, 2.25], color: [1.5, 1.45, 1.35], radius: 0.17, kind: 1, trail: 0.3 },
  { offset: [0, 0.12, -2.26], color: [1.6, 0.06, 0.04], radius: 0.2, kind: 2, trail: 1.1 },
  { offset: [-1.12, -0.06, -1.76], color: [0.25, 1.1, 1.6], radius: 0.28, kind: 2, trail: 0.9 },
  { offset: [1.12, -0.06, -1.76], color: [0.25, 1.1, 1.6], radius: 0.28, kind: 2, trail: 0.9 },
  { offset: [0, -0.6, -0.5], color: [0.06, 0.32, 0.6], radius: 1.3, kind: 0, trail: 0 },
]

/** Hauler lights: headlights, amber corner markers, tail lights, and the thruster glow beneath the container. */
export const HAULER_LIGHTS: readonly ModelLight[] = [
  { offset: [-1.1, -0.3, 5.4], color: [1.6, 1.5, 1.35], radius: 0.24, kind: 1, trail: 0.4 },
  { offset: [1.1, -0.3, 5.4], color: [1.6, 1.5, 1.35], radius: 0.24, kind: 1, trail: 0.4 },
  { offset: [-1.85, 1.3, 4.8], color: [1.5, 0.7, 0.1], radius: 0.2, kind: 0, trail: 0 },
  { offset: [1.85, 1.3, 4.8], color: [1.5, 0.7, 0.1], radius: 0.2, kind: 0, trail: 0 },
  { offset: [-1.85, 1.3, -5.0], color: [1.5, 0.7, 0.1], radius: 0.2, kind: 0, trail: 0 },
  { offset: [1.85, 1.3, -5.0], color: [1.5, 0.7, 0.1], radius: 0.2, kind: 0, trail: 0 },
  { offset: [-1.4, 0.4, -5.1], color: [1.6, 0.06, 0.04], radius: 0.24, kind: 2, trail: 0.8 },
  { offset: [1.4, 0.4, -5.1], color: [1.6, 0.06, 0.04], radius: 0.24, kind: 2, trail: 0.8 },
  { offset: [0, -2.0, -1.2], color: [0.7, 0.28, 0.06], radius: 1.6, kind: 0, trail: 0 },
]

/**
 * Two-seat spinner: a smooth wedge hull with rounded shoulders and a drooping nose, a framed glass canopy, twin thruster
 * pods with intake lips and exhaust rings, skids, flank intakes, accent trim along the waist, and tail fins; +Z forward.
 * @returns geometry carrying `aGlow`.
 */
export function createSpinnerGeometry(): THREE.BufferGeometry {
  const box = new THREE.BoxGeometry(1.9, 0.62, 4.4, 8, 4, 18)
  box.deleteAttribute('normal')
  box.deleteAttribute('uv')
  // Shared corner vertices give the hull smooth normals, so its edges shade round instead of faceted.
  const hull = mergeVertices(box)
  box.dispose()
  const position = hull.getAttribute('position')
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const y = position.getY(index)
    const z = position.getZ(index)
    const along = (z + 2.2) / 4.4
    const nose = smoothstep(0.55, 1, along)
    const tail = smoothstep(0.25, 0, along)
    const shoulder = 1 - 0.16 * (y / 0.31) ** 2
    position.setX(index, x * shoulder * (1 - 0.42 * nose - 0.12 * tail))
    position.setY(index, (y > 0 ? y * (1 - 0.55 * nose) : y * (1 - 0.3 * nose)) - 0.05 * nose)
  }
  hull.computeVertexNormals()
  const parts = [glow(hull, [0, 0, 0])]
  const canopy = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.62, 0.36, 1.25).translate(0, 0.27, 0.25)
  parts.push(glow(canopy, [0.012, 0.045, 0.07], 1))
  parts.push(glow(new THREE.TorusGeometry(1, 0.045, 6, 28, Math.PI).scale(0.63, 0.37, 1).translate(0, 0.27, 0.25), [0, 0, 0]))
  for (const side of [-1, 1]) {
    // Thruster pod: nacelle, accent-lit intake lip, dark fan face, exhaust ring, and the glowing nozzle on one axis.
    const disc = (radius: number, length: number, z: number): THREE.BufferGeometry =>
      new THREE.CylinderGeometry(radius, radius, length, 20).rotateX(Math.PI / 2).translate(side * 1.12, -0.06, z)
    parts.push(glow(new THREE.CylinderGeometry(0.33, 0.29, 1.7, 20).rotateX(Math.PI / 2).translate(side * 1.12, -0.06, -0.8), [0, 0, 0]))
    parts.push(glow(disc(0.36, 0.1, 0.06), [0.9, 0, 0], 2))
    parts.push(glow(disc(0.22, 0.02, 0.12), [0.01, 0.015, 0.02]))
    parts.push(glow(disc(0.31, 0.08, -1.62), [0, 0, 0]))
    parts.push(glow(disc(0.24, 0.05, -1.68), [0.35, 1.6, 2.4]))
    parts.push(glow(new THREE.BoxGeometry(0.5, 0.03, 1.2).translate(side * 1.12, -0.37, -0.8), [0.1, 0.6, 1.0]))
    parts.push(glow(new THREE.BoxGeometry(0.42, 0.07, 0.05).translate(side * 0.5, -0.02, 2.17), [3.0, 2.9, 2.7]))
    parts.push(glow(new THREE.BoxGeometry(0.06, 0.5, 0.7).rotateZ(side * 0.35).translate(side * 0.45, 0.45, -1.8), [0, 0, 0]))
    parts.push(glow(new THREE.BoxGeometry(0.06, 0.05, 2.2).translate(side * 0.55, -0.335, -0.1), [0, 0, 0]))
    parts.push(glow(new THREE.BoxGeometry(0.05, 0.12, 0.45).translate(side * 0.8, 0, 1.0), [0.01, 0.012, 0.015]))
    parts.push(glow(new THREE.BoxGeometry(0.03, 0.025, 1.8).translate(side * 0.925, -0.1, -0.5), [1.5, 0, 0], 2))
  }
  parts.push(glow(new THREE.BoxGeometry(1.4, 0.06, 0.04).translate(0, 0.12, -2.21), [2.8, 0.12, 0.08]))
  parts.push(glow(new THREE.CylinderGeometry(0.012, 0.02, 0.35, 6).translate(0.2, 0.47, -1.5), [0, 0, 0]))
  return merge(parts)
}

/**
 * Cargo hauler: a cab with a split windscreen ahead of a ribbed, corrugated container on roof rails, slung on four
 * downward thrusters; +Z forward.
 * @returns geometry carrying `aGlow`.
 */
export function createHaulerGeometry(): THREE.BufferGeometry {
  const parts = [
    glow(new THREE.BoxGeometry(3.4, 2.0, 2.6).translate(0, 0.1, 4.0), [0, 0, 0]),
    glow(new THREE.BoxGeometry(3.0, 0.7, 0.05).translate(0, 0.55, 5.32), [0.01, 0.03, 0.04], 1),
    glow(new THREE.BoxGeometry(3.6, 2.6, 7.6).translate(0, 0.2, -1.3), [0, 0, 0]),
  ]
  for (let rib = 0; rib < 7; rib += 1) {
    parts.push(glow(new THREE.BoxGeometry(3.72, 2.7, 0.12).translate(0, 0.2, -4.7 + rib * 1.13), [0, 0, 0]))
  }
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      parts.push(glow(new THREE.CylinderGeometry(0.5, 0.42, 0.7, 16).translate(side * 1.55, -1.45, -1.3 + end * 3.0), [0, 0, 0]))
      parts.push(glow(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16).translate(side * 1.55, -1.82, -1.3 + end * 3.0), [2.4, 0.9, 0.2]))
      parts.push(glow(new THREE.BoxGeometry(0.16, 0.16, 0.16).translate(side * 1.85, 1.3, end > 0 ? 4.8 : -5.0), [2.6, 1.3, 0.2]))
    }
    parts.push(glow(new THREE.BoxGeometry(0.6, 0.16, 0.05).translate(side * 1.1, -0.3, 5.32), [3.0, 2.9, 2.7]))
    parts.push(glow(new THREE.BoxGeometry(0.5, 0.18, 0.05).translate(side * 1.4, 0.4, -5.12), [2.8, 0.12, 0.08]))
    parts.push(glow(new THREE.BoxGeometry(0.07, 0.74, 0.08).translate(side * 0.5, 0.55, 5.34), [0, 0, 0]))
    parts.push(glow(new THREE.BoxGeometry(0.12, 0.12, 7.4).translate(side * 1.6, 1.56, -1.3), [0, 0, 0]))
    parts.push(glow(new THREE.BoxGeometry(0.04, 0.05, 6.8).translate(side * 1.87, -0.95, -1.3), [1.3, 0, 0], 2))
  }
  return merge(parts)
}

/** Car lights: headlights and tail lights; local frame +Z forward with the wheels on y = 0. */
export const CAR_LIGHTS: readonly ModelLight[] = [
  { offset: [-0.6, 0.66, 2.27], color: [1.5, 1.45, 1.35], radius: 0.12, kind: 1, trail: 0.5 },
  { offset: [0.6, 0.66, 2.27], color: [1.5, 1.45, 1.35], radius: 0.12, kind: 1, trail: 0.5 },
  { offset: [-0.62, 0.8, -2.27], color: [1.5, 0.05, 0.04], radius: 0.11, kind: 2, trail: 0.9 },
  { offset: [0.62, 0.8, -2.27], color: [1.5, 0.05, 0.04], radius: 0.11, kind: 2, trail: 0.9 },
]

/** Wheel centres at x = ±track, y = radius, z = ±base; arches clear the tyres by 7 cm. */
const CAR_WHEEL = { radius: 0.33, width: 0.22, track: 0.8, base: 1.38, arch: 0.45 } as const

/**
 * Extrude a (z, y) side profile across the car, centred on x = 0, scale each vertex's x by `pinch(y, z)`, and keep
 * creases sharper than 40° while smoothing the rounded edges.
 */
function sideExtrusion(shape: THREE.Shape, width: number, bevel: number, pinch: (y: number, z: number) => number): THREE.BufferGeometry {
  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: width - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 4, curveSegments: 16,
  })
  extruded.deleteAttribute('uv')
  extruded.rotateY(-Math.PI / 2).translate(width / 2 - bevel, 0, 0)
  const position = extruded.getAttribute('position')
  for (let index = 0; index < position.count; index += 1) {
    position.setX(index, position.getX(index) * pinch(position.getY(index), position.getZ(index)))
  }
  const creased = toCreasedNormals(extruded, (40 * Math.PI) / 180)
  const indexed = mergeVertices(creased)
  extruded.dispose()
  creased.dispose()
  return indexed
}

/** A rounded tyre on the X axis: tread and sidewalls with softened shoulders. */
function tyre(): THREE.BufferGeometry {
  const { radius, width } = CAR_WHEEL
  const half = width / 2
  const profile = ([
    [radius * 0.62, -half], [radius - 0.03, -half], [radius, -half + 0.035], [radius, half - 0.035], [radius - 0.03, half],
    [radius * 0.62, half],
  ] as const).map(([r, y]) => new THREE.Vector2(r, y))
  return new THREE.LatheGeometry(profile, 28).rotateZ(Math.PI / 2)
}

/**
 * Saloon car: a body extruded from its side profile with wheel arches, a rounded nose, and a boot dropping to the tail;
 * a raked glass house narrowing toward its roof, with painted A- and C-pillars, black B-pillars, and a bright waist
 * trim; rounded tyres on bright rims; LED headlight strips, a full-width tail-light bar, grille and bumper intakes, side
 * skirts, mirrors, door handles, and a lit number plate. +Z forward, wheels on y = 0.
 * @returns geometry carrying `aGlow`.
 */
export function createCarGeometry(): THREE.BufferGeometry {
  const { radius, width, track, base, arch } = CAR_WHEEL
  const profile = new THREE.Shape()
  profile.moveTo(2.1, 0.3)
  profile.quadraticCurveTo(2.22, 0.33, 2.21, 0.5)
  profile.quadraticCurveTo(2.2, 0.69, 2.05, 0.75)
  profile.lineTo(1.02, 0.87)
  profile.lineTo(-1.3, 0.92)
  profile.quadraticCurveTo(-1.98, 0.93, -2.12, 0.84)
  profile.quadraticCurveTo(-2.22, 0.76, -2.2, 0.52)
  profile.quadraticCurveTo(-2.19, 0.33, -2.08, 0.3)
  profile.lineTo(-base - arch, 0.3)
  profile.absarc(-base, 0.3, arch, Math.PI, 0, true)
  profile.lineTo(base - arch, 0.3)
  profile.absarc(base, 0.3, arch, Math.PI, 0, true)
  profile.lineTo(2.1, 0.3)
  const body = sideExtrusion(profile, 1.8, 0.07, (y, z) => (1 - 0.07 * smoothstep(0.55, 0.98, y))
    * (1 - 0.05 * smoothstep(1.6, 2.27, Math.abs(z))))
  const house = new THREE.Shape()
  house.moveTo(1.02, 0.84)
  house.lineTo(0.14, 1.34)
  house.quadraticCurveTo(-0.12, 1.42, -0.55, 1.42)
  house.lineTo(-0.9, 1.4)
  house.quadraticCurveTo(-1.2, 1.36, -1.58, 0.88)
  house.lineTo(1.02, 0.84)
  const glasshouse = sideExtrusion(house, 1.52, 0.05, y => 1 - 0.16 * smoothstep(0.9, 1.42, y))
  const black = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => glow(geometry, [0, 0, 0], 3)
  const bright = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => glow(geometry, [0, 0, 0], 4)
  const parts = [
    glow(body, [0, 0, 0]),
    glow(glasshouse, [0.004, 0.006, 0.008], 1),
    black(new THREE.BoxGeometry(1.0, 0.15, 0.06).translate(0, 0.43, 2.24)),
    black(new THREE.BoxGeometry(0.72, 0.05, 0.05).translate(0, 0.62, 2.22)),
    black(new THREE.BoxGeometry(1.7, 0.1, 0.06).translate(0, 0.38, -2.22)),
    glow(new THREE.BoxGeometry(1.5, 0.04, 0.04).translate(0, 0.83, -2.18), [1.6, 0.05, 0.03]),
    glow(new THREE.BoxGeometry(0.42, 0.1, 0.02).translate(0, 0.55, -2.255), [0.4, 0.38, 0.32]),
  ]
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      parts.push(black(tyre().translate(side * track, radius, end * base)))
      const rim = new THREE.CylinderGeometry(radius * 0.66, radius * 0.66, width + 0.006, 28, 1).rotateZ(Math.PI / 2)
      parts.push(bright(rim.translate(side * track, radius, end * base)))
    }
    parts.push(glow(new THREE.BoxGeometry(0.42, 0.06, 0.07).translate(side * 0.6, 0.66, 2.2), [2.6, 2.5, 2.3]))
    parts.push(glow(new THREE.BoxGeometry(0.34, 0.08, 0.06).translate(side * 0.63, 0.79, -2.19), [2.2, 0.06, 0.04]))
    // Painted A- and C-pillars run from the waist to the roof edge.
    const at = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(side * x, y, z)
    parts.push(glow(strut(at(0.74, 0.88, 1.0), at(0.63, 1.35, 0.13), 0.04, 0.035, 8), [0, 0, 0]))
    parts.push(glow(strut(at(0.66, 1.39, -0.92), at(0.75, 0.92, -1.5), 0.05, 0.07, 8), [0, 0, 0]))
    parts.push(black(new THREE.BoxGeometry(0.03, 0.54, 0.07).rotateZ(side * 0.227).translate(side * 0.71, 1.16, -0.28)))
    parts.push(bright(new THREE.BoxGeometry(0.02, 0.02, 2.4).translate(side * 0.765, 0.905, -0.27)))
    parts.push(black(new THREE.BoxGeometry(0.03, 0.07, 1.74).translate(side * 0.89, 0.31, 0)))
    parts.push(glow(new THREE.BoxGeometry(0.16, 0.09, 0.11).translate(side * 0.94, 0.99, 0.8), [0, 0, 0]))
    parts.push(black(new THREE.BoxGeometry(0.1, 0.03, 0.05).translate(side * 0.86, 0.95, 0.82)))
    for (const z of [0.1, -0.88]) parts.push(bright(new THREE.BoxGeometry(0.02, 0.025, 0.13).translate(side * 0.88, 0.8, z)))
  }
  return merge(parts)
}

/** Airship lights: fin-tip navigation lights and the gondola's downlight; local frame with the hull along X. */
export const BLIMP_LIGHTS: readonly ModelLight[] = [
  { offset: [-10.6, 4.2, 0], color: [1.6, 0.07, 0.05], radius: 0.4, kind: 0, trail: 0 },
  { offset: [-10.6, -4.2, 0], color: [1.4, 1.4, 1.3], radius: 0.35, kind: 0, trail: 0 },
  { offset: [-10.6, 0, 4.2], color: [0.1, 1.2, 0.8], radius: 0.35, kind: 0, trail: 0 },
  { offset: [-10.6, 0, -4.2], color: [1.6, 0.07, 0.05], radius: 0.35, kind: 0, trail: 0 },
  { offset: [11.9, 0, 0], color: [1.4, 1.4, 1.3], radius: 0.35, kind: 0, trail: 0 },
  { offset: [0, -6.0, 0], color: [1.0, 0.7, 0.45], radius: 0.9, kind: 0, trail: 0 },
]

/** Placement of the airship's advertising screen relative to its centre: +Z side, facing +Z. */
export const BLIMP_SCREEN = { y: 0.4, z: 4.9, width: 13, height: 4.4 } as const

/**
 * Advertising airship along X: an ellipsoid hull, cruciform tail fins, a lit gondola, and the screen's mounting frame.
 * @param length - hull length in metres.
 * @param radius - hull radius in metres.
 * @returns geometry carrying `aGlow`.
 */
export function createBlimpGeometry(length: number, radius: number): THREE.BufferGeometry {
  const half = length / 2
  const parts = [glow(new THREE.SphereGeometry(1, 48, 24).scale(half, radius, radius), [0, 0, 0])]
  const fin = radius * 0.55
  const fins = [[fin, 0, 0.16, 3.4], [-fin, 0, 0.16, 3.4], [0, fin, 3.4, 0.16], [0, -fin, 3.4, 0.16]] as const
  for (const [y, z, width, height] of fins) {
    parts.push(glow(new THREE.BoxGeometry(2.8, height, width).translate(-half + 1.6, y, z), [0, 0, 0]))
  }
  parts.push(glow(new THREE.BoxGeometry(5.2, 1.4, 2.0).translate(0, -radius - 0.55, 0), [0, 0, 0]))
  parts.push(glow(new THREE.BoxGeometry(4.6, 0.42, 2.06).translate(0, -radius - 0.4, 0), [1.4, 0.95, 0.55]))
  const frame = new THREE.BoxGeometry(BLIMP_SCREEN.width + 0.5, BLIMP_SCREEN.height + 0.5, 0.3)
  parts.push(glow(frame.translate(0, BLIMP_SCREEN.y, BLIMP_SCREEN.z - 0.2), [0, 0, 0]))
  parts.push(glow(new THREE.BoxGeometry(0.3, 0.3, 1.6).translate(-4, BLIMP_SCREEN.y, BLIMP_SCREEN.z - 1.1), [0, 0, 0]))
  parts.push(glow(new THREE.BoxGeometry(0.3, 0.3, 1.6).translate(4, BLIMP_SCREEN.y, BLIMP_SCREEN.z - 1.1), [0, 0, 0]))
  return merge(parts)
}

/** Train lights: headlights at the leading nose and tail lights at the trailing nose; local frame along +X. */
export function trainLights(): ModelLight[] {
  const half = (SPLASH_MAGLEV.cars * (SPLASH_MAGLEV.carLength + SPLASH_MAGLEV.gap) - SPLASH_MAGLEV.gap) / 2
  return [-0.9, 0.9].flatMap(z => [
    { offset: [half + 0.2, -0.6, z] as const, color: [1.7, 1.6, 1.45] as const, radius: 0.3, kind: 0 as const, trail: 0 },
    { offset: [-half - 0.2, -0.6, z] as const, color: [1.6, 0.06, 0.04] as const, radius: 0.28, kind: 0 as const, trail: 0 },
  ])
}

/**
 * Maglev train along +X: cars with lit window bands, a cyan under-glow, and tapered noses at both ends.
 * @returns geometry carrying `aGlow`, centred on the train.
 */
export function createTrainGeometry(): THREE.BufferGeometry {
  const { cars, carLength, gap } = SPLASH_MAGLEV
  const parts: THREE.BufferGeometry[] = []
  for (let car = 0; car < cars; car += 1) {
    const x = (car - (cars - 1) / 2) * (carLength + gap)
    const body = new THREE.BoxGeometry(carLength, 3.3, 3.4, 12, 2, 2)
    const nose = car === cars - 1 ? 1 : car === 0 ? -1 : 0
    if (nose !== 0) {
      const position = body.getAttribute('position')
      for (let index = 0; index < position.count; index += 1) {
        const along = smoothstep(carLength / 2 - 6, carLength / 2, position.getX(index) * nose)
        if (position.getY(index) > 0) position.setY(index, position.getY(index) * (1 - 0.75 * along))
        position.setZ(index, position.getZ(index) * (1 - 0.35 * along))
      }
      body.computeVertexNormals()
    }
    parts.push(glow(body.translate(x, 0, 0), [0, 0, 0]))
    for (const side of [-1, 1]) {
      const windows = new THREE.BoxGeometry(carLength - (nose === 0 ? 2 : 7), 0.8, 0.04)
      parts.push(glow(windows.translate(x - nose * 2.5, 0.35, side * 1.72), [1.6, 1.15, 0.7]))
      parts.push(glow(new THREE.BoxGeometry(carLength - 1, 0.05, 0.12).translate(x, 1.62, side * 1.3), [0.8, 0.05, 0.04]))
    }
    parts.push(glow(new THREE.BoxGeometry(carLength - 1, 0.06, 2.8).translate(x, -1.68, 0), [0.2, 1.2, 1.8]))
  }
  return merge(parts)
}
