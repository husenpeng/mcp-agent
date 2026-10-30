/** Tomato mark geometry and the geodesic ignition field that drives its neon reveal. */

import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { TOMATO_MARK_PATH, TOMATO_MARK_VIEWBOX } from '@tomato/brand/src/client/mark.ts'

/** Texels per side of the rasterized ignition field. */
export const MARK_FIELD_SIZE = 256

const DIAGONAL = Math.SQRT2
const NEIGHBOURS = [
  [-1, -1, DIAGONAL], [0, -1, 1], [1, -1, DIAGONAL], [-1, 0, 1], [1, 0, 1], [-1, 1, DIAGONAL], [0, 1, 1], [1, 1, DIAGONAL],
] as const

/** Binary min-heap of texel indices keyed by tentative distance. */
class DistanceQueue {
  private readonly indices: number[] = []
  private readonly keys: number[] = []

  get size(): number {
    return this.indices.length
  }

  push(index: number, key: number): void {
    let slot = this.indices.length
    this.indices.push(index)
    this.keys.push(key)
    while (slot > 0) {
      const parent = (slot - 1) >> 1
      if ((this.keys[parent] ?? 0) <= key) break
      this.swap(slot, parent)
      slot = parent
    }
  }

  /** Remove the nearest entry; the queue must not be empty. */
  pop(): { index: number; key: number } {
    const index = this.indices[0] ?? 0
    const key = this.keys[0] ?? 0
    const lastIndex = this.indices.pop() ?? 0
    const lastKey = this.keys.pop() ?? 0
    if (this.indices.length > 0) {
      this.indices[0] = lastIndex
      this.keys[0] = lastKey
      let slot = 0
      for (;;) {
        const left = slot * 2 + 1
        const right = left + 1
        let smallest = slot
        if (left < this.keys.length && (this.keys[left] ?? 0) < (this.keys[smallest] ?? 0)) smallest = left
        if (right < this.keys.length && (this.keys[right] ?? 0) < (this.keys[smallest] ?? 0)) smallest = right
        if (smallest === slot) break
        this.swap(slot, smallest)
        slot = smallest
      }
    }
    return { index, key }
  }

  private swap(a: number, b: number): void {
    const index = this.indices[a] ?? 0
    const key = this.keys[a] ?? 0
    this.indices[a] = this.indices[b] ?? 0
    this.keys[a] = this.keys[b] ?? 0
    this.indices[b] = index
    this.keys[b] = key
  }
}

/**
 * Pick the texel where the projector beam meets the mark: the lowest stroke texel near the mark's centre column.
 * @param mask - row-major coverage, non-zero inside the strokes; row 0 is the top of the mark.
 * @param size - mask width and height in texels.
 * @returns the row-major seed index, or -1 for an empty mask.
 */
export function markIgnitionSeed(mask: Uint8Array, size: number): number {
  let minColumn = size
  let maxColumn = -1
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] === 0) continue
    const column = index % size
    minColumn = Math.min(minColumn, column)
    maxColumn = Math.max(maxColumn, column)
  }
  if (maxColumn < 0) return -1
  const centre = (minColumn + maxColumn) / 2
  const reach = Math.max(1, (maxColumn - minColumn) * 0.12)
  let seed = -1
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] === 0 || Math.abs((index % size) - centre) > reach) continue
    if (seed < 0 || Math.floor(index / size) > Math.floor(seed / size)) seed = index
  }
  return seed
}

/**
 * Geodesic distance from a seed texel through a stroke mask, normalized to [0, 1].
 * @param mask - row-major coverage, non-zero inside the strokes.
 * @param size - mask width and height in texels.
 * @param seed - row-major index of the stroke texel where light enters.
 * @returns per-texel distances; texels within four texels outside the strokes take the lowest neighbouring stroke
 *   value so extruded walls and bevels light with their stroke, and every other or unreachable texel is 1.
 */
export function markIgnitionField(mask: Uint8Array, size: number, seed: number): Float32Array {
  const distances = new Float32Array(size * size).fill(Infinity)
  if (seed < 0 || mask[seed] === 0) return distances.fill(1)
  const queue = new DistanceQueue()
  distances[seed] = 0
  queue.push(seed, 0)
  while (queue.size > 0) {
    const { index, key } = queue.pop()
    if (key > (distances[index] ?? Infinity)) continue
    const column = index % size
    const row = Math.floor(index / size)
    for (const [dx, dy, step] of NEIGHBOURS) {
      const x = column + dx
      const y = row + dy
      if (x < 0 || y < 0 || x >= size || y >= size) continue
      const next = y * size + x
      if (mask[next] === 0) continue
      const candidate = key + step
      if (candidate < (distances[next] ?? Infinity)) {
        distances[next] = candidate
        queue.push(next, candidate)
      }
    }
  }
  let longest = 0
  for (const value of distances) if (Number.isFinite(value)) longest = Math.max(longest, value)
  const field = new Float32Array(size * size).fill(-1)
  for (let index = 0; index < field.length; index += 1) {
    const value = distances[index] ?? Infinity
    if (mask[index] !== 0) field[index] = Number.isFinite(value) && longest > 0 ? value / longest : 1
  }
  for (let pass = 0; pass < 4; pass += 1) {
    const grown = field.slice()
    for (let index = 0; index < field.length; index += 1) {
      if ((field[index] ?? 0) >= 0) continue
      const column = index % size
      const row = Math.floor(index / size)
      let nearest = Infinity
      for (const [dx, dy] of NEIGHBOURS) {
        const x = column + dx
        const y = row + dy
        if (x < 0 || y < 0 || x >= size || y >= size) continue
        const value = field[y * size + x] ?? -1
        if (value >= 0) nearest = Math.min(nearest, value)
      }
      if (Number.isFinite(nearest)) grown[index] = nearest
    }
    field.set(grown)
  }
  for (let index = 0; index < field.length; index += 1) if ((field[index] ?? 0) < 0) field[index] = 1
  return field
}

/**
 * Rasterize the shared Tomato path into a stroke mask.
 * @param size - mask width and height in texels.
 * @returns row-major coverage with row 0 at the top of the mark.
 */
export function rasterizeMark(size: number): Uint8Array {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (context === null) throw new Error('splash: mark raster canvas is unavailable')
  context.scale(size / TOMATO_MARK_VIEWBOX.width, size / TOMATO_MARK_VIEWBOX.height)
  context.fill(new Path2D(TOMATO_MARK_PATH))
  const pixels = context.getImageData(0, 0, size, size).data
  const mask = new Uint8Array(size * size)
  for (let index = 0; index < mask.length; index += 1) mask[index] = (pixels[index * 4 + 3] ?? 0) > 96 ? 1 : 0
  return mask
}

/**
 * Upload an ignition field as a filterable single-channel texture.
 * @param field - normalized distances from `markIgnitionField`.
 * @param size - field width and height in texels.
 * @returns a linear-filtered texture addressed by the mark's source-path coordinates.
 */
export function createIgnitionTexture(field: Float32Array, size: number): THREE.DataTexture {
  const data = new Uint8Array(field.length)
  for (let index = 0; index < field.length; index += 1) data[index] = Math.round(Math.min(1, Math.max(0, field[index] ?? 1)) * 255)
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

/** Extruded mark geometry and the mapping from source-path coordinates into its local frame. */
export interface MarkGeometry {
  readonly geometry: THREE.BufferGeometry
  /** Map source-path coordinates divided by the view box, plus a local depth, to the mesh's local frame. */
  readonly project: (u: number, v: number, depth: number) => THREE.Vector3
}

/**
 * Extrude the shared Tomato path into rounded neon tubes centred on the origin, facing +Z with the stem up.
 * @param width - finished width in scene metres.
 * @returns geometry carrying `aMarkUv`, the source-path coordinates divided by the 64-unit view box, and its projection.
 */
export function createMarkGeometry(width: number): MarkGeometry {
  const { width: boxWidth, height: boxHeight } = TOMATO_MARK_VIEWBOX
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boxWidth} ${boxHeight}"><path d="${TOMATO_MARK_PATH}"/></svg>`)
  const parts = data.paths.flatMap(path => path.toShapes().map(shape => new THREE.ExtrudeGeometry(shape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.22,
    bevelThickness: 0.38,
    curveSegments: 14,
  })))
  const geometry = mergeGeometries(parts, false)
  for (const part of parts) part.dispose()
  const position = geometry.getAttribute('position')
  const markUv = new Float32Array(position.count * 2)
  for (let index = 0; index < position.count; index += 1) {
    markUv[index * 2] = position.getX(index) / boxWidth
    markUv[index * 2 + 1] = position.getY(index) / boxHeight
  }
  geometry.setAttribute('aMarkUv', new THREE.BufferAttribute(markUv, 2))
  geometry.computeBoundingBox()
  const centre = new THREE.Vector3()
  const size = new THREE.Vector3()
  geometry.boundingBox?.getCenter(centre)
  geometry.boundingBox?.getSize(size)
  geometry.translate(-centre.x, -centre.y, -centre.z)
  // SVG Y grows downward; a half turn about X keeps the stem up without reversing face winding.
  geometry.rotateX(Math.PI)
  const scale = width / size.x
  geometry.scale(scale, scale, scale)
  geometry.computeBoundingBox()
  return {
    geometry,
    project: (u, v, depth) => new THREE.Vector3((u * boxWidth - centre.x) * scale, -(v * boxHeight - centre.y) * scale, depth),
  }
}

/**
 * Pick stroke texels for the ignition sparks.
 * @param mask - row-major coverage from `rasterizeMark`.
 * @param field - normalized distances from `markIgnitionField`.
 * @param size - mask width and height in texels.
 * @param count - number of points to draw.
 * @param random - deterministic source in [0, 1).
 * @returns source-path coordinates divided by the view box, with each point's ignition distance.
 */
export function sampleMarkPoints(
  mask: Uint8Array, field: Float32Array, size: number, count: number, random: () => number,
): { u: number; v: number; travel: number }[] {
  const strokes: number[] = []
  for (let index = 0; index < mask.length; index += 1) if (mask[index] !== 0) strokes.push(index)
  if (strokes.length === 0) return []
  return Array.from({ length: count }, () => {
    const index = strokes[Math.floor(random() * strokes.length)] ?? 0
    return { u: (index % size + 0.5) / size, v: (Math.floor(index / size) + 0.5) / size, travel: field[index] ?? 1 }
  })
}

/**
 * When the ignition front reaches a stroke point; the front advances as `scale × splashPhase(t, start, duration)`.
 * @param travel - the point's normalized ignition distance.
 * @param startMs - ignition start on the splash timeline.
 * @param durationMs - ignition length.
 * @param scale - front overshoot factor; values above 1 let the front clear the farthest stroke before the phase ends.
 * @returns the arrival time in milliseconds on the splash timeline.
 */
export function markIgnitionArrival(travel: number, startMs: number, durationMs: number, scale: number): number {
  const goal = Math.min(1, Math.max(0, travel / scale))
  let low = 0
  let high = 1
  for (let step = 0; step < 24; step += 1) {
    const middle = (low + high) / 2
    if (middle * middle * (3 - 2 * middle) < goal) low = middle
    else high = middle
  }
  return startMs + (low + high) / 2 * durationMs
}
