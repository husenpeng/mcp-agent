/**
 * Street-level detail for the WebGL launch city: each facade's storey and window grid, the geometric relief of the
 * avenue frontage, shop names, cars, street furniture, and the cables strung across the avenue. Pure data; no DOM or
 * WebGL access.
 */

import {
  SPLASH_AVENUE, SPLASH_AVENUE_FRONTAGE, SPLASH_CROSS_STREET_HALF_WIDTH, SPLASH_CROSS_STREETS, SPLASH_FACADE, SPLASH_FORM,
  SPLASH_LAMPS, SPLASH_SCREEN_SLOT, splashCameraHeightNear, splashRandom, type SplashCityLayout, type SplashLane,
  type SplashTier, type SplashVector,
} from './splash-city.ts'

/** Residential wall finishes resolved by the facade shader. */
export const SPLASH_FINISH = { concrete: 0, tile: 1, brick: 2 } as const

/** One residential wall finish. */
export type SplashFinish = typeof SPLASH_FINISH[keyof typeof SPLASH_FINISH]

/** Width of one shop along a storefront's avenue face; the facade shader and the awnings divide storefronts by it. */
export const SPLASH_SHOP_WIDTH = 6.5

/** Storey and window grid of one tier, shared by the facade shader and the geometric relief laid on it. */
export interface SplashFacadeGrid {
  /** Storey height in metres; storeys start at y = 0 for every tier of a building. */
  readonly floorHeight: number
  /** Preferred window-cell width in metres; each face divides its width into the nearest whole number of cells. */
  readonly cellTarget: number
  readonly finish: SplashFinish
  /** Residential tiers with a balcony on every storey; their windows reach the floor as doors. */
  readonly balconies: boolean
}

/** A box in scene metres around its centre, optionally turned about the X and then the Z axis through that centre. */
export interface SplashSolid extends SplashVector {
  readonly width: number
  readonly height: number
  readonly depth: number
  /** Radians about X, applied first. */
  readonly turnX?: number
  /** Radians about Z, applied second. */
  readonly turnZ?: number
}

/** A solid with its own linear albedo. */
export interface SplashTintedSolid extends SplashSolid {
  readonly tint: readonly [number, number, number]
}

/** Geometric relief on the avenue frontage, grouped by material. */
export interface SplashRelief {
  /** Concrete cornices, parapets, storey slabs, sills, balcony slabs, and privacy walls. */
  readonly masonry: readonly SplashSolid[]
  /** Painted steel: railings, fire escapes, and air-conditioner casings. */
  readonly steel: readonly SplashSolid[]
  /** Shop awnings tilted down toward the street. */
  readonly awnings: readonly SplashTintedSolid[]
}

/** A steady light in scene metres. */
export interface SplashLight extends SplashVector {
  /** Linear radiance. */
  readonly color: readonly [number, number, number]
  /** Radius in metres. */
  readonly radius: number
}

/** A lit poster quad: centre, size, and the screen-atlas slot it shows; its artwork faces +Z. */
export interface SplashPoster extends SplashVector {
  readonly width: number
  readonly height: number
  readonly slot: number
}

/** Street furniture along both sidewalks, grouped by material and form, with the lights and posters it carries. */
export interface SplashFurniture {
  /**
   * Dark painted steel boxes: bench slats and frames, signal arms, heads and visors, vending-machine bodies, and
   * shelters with their light boxes.
   */
  readonly steel: readonly SplashSolid[]
  /** Dark painted steel cylinders, sized by their bounding box: bins and their lids, bollards, and signal poles. */
  readonly round: readonly SplashSolid[]
  /** Red-painted hydrant cylinders: bodies, caps, bonnets, and outlets. */
  readonly red: readonly SplashSolid[]
  /** Emissive vending-machine fronts. */
  readonly glow: readonly SplashSolid[]
  readonly lights: readonly SplashLight[]
  readonly posters: readonly SplashPoster[]
}

/** A modelled car on an avenue lane; `bob` is negative, so it never hovers. */
export interface SplashCar extends SplashLane {
  /** Linear paint albedo. */
  readonly paint: readonly [number, number, number]
}

/** A sagging cable strung across the avenue between two facades. */
export interface SplashCable {
  readonly from: SplashVector
  readonly to: SplashVector
  /** Drop of the cable's midpoint below the straight line between its ends, in metres. */
  readonly sag: number
}

const FINISHES = [SPLASH_FINISH.concrete, SPLASH_FINISH.tile, SPLASH_FINISH.brick] as const
const AWNING_TINTS: readonly (readonly [number, number, number])[] = [
  [0.32, 0.03, 0.03], [0.04, 0.16, 0.08], [0.42, 0.38, 0.3], [0.03, 0.05, 0.16], [0.45, 0.16, 0.02],
]
const CAR_PAINTS: readonly (readonly [number, number, number])[] = [
  [0.02, 0.02, 0.022], [0.45, 0.46, 0.47], [0.28, 0.29, 0.31], [0.32, 0.03, 0.03], [0.04, 0.08, 0.18], [0.55, 0.42, 0.06],
  [0.06, 0.2, 0.1], [0.6, 0.6, 0.58],
]

// Stable per-tier hash in [0, 1) that leaves the layout's random stream untouched.
function unit(seed: number, salt: number): number {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

/**
 * Storey and window grid of a tier; every tier of one building shares it.
 * @param tier - building tier.
 * @returns the grid the facade shader draws and the frontage relief follows.
 */
export function splashFacadeGrid(tier: SplashTier): SplashFacadeGrid {
  const residential = tier.facade === SPLASH_FACADE.panel
  return {
    floorHeight: 3.3 + 0.8 * unit(tier.seed, 1),
    cellTarget: residential ? 2.1 + 0.9 * unit(tier.seed, 2) : 1.45 + 0.55 * unit(tier.seed, 3),
    finish: residential ? FINISHES[Math.floor(unit(tier.seed, 4) * FINISHES.length)] ?? SPLASH_FINISH.concrete : SPLASH_FINISH.concrete,
    balconies: residential && unit(tier.seed, 5) < 0.35,
  }
}

/**
 * Window-cell width on a face: the face divides into the nearest whole number of cells to the target width.
 * @param faceWidth - face width in metres.
 * @param cellTarget - preferred cell width in metres.
 * @returns the cell width in metres.
 */
export function splashCellWidth(faceWidth: number, cellTarget: number): number {
  return faceWidth / Math.max(1, Math.floor(faceWidth / cellTarget + 0.5))
}

/**
 * Box tiers of the buildings that line the avenue, whose avenue faces carry geometric relief.
 * @param layout - the city layout.
 * @returns the frontage tiers, upper tiers included.
 */
export function splashFrontageTiers(layout: SplashCityLayout): SplashTier[] {
  const frontage = new Set(layout.tiers.filter(tier => tier.storefront).map(tier => tier.seed))
  return layout.tiers.filter(tier => frontage.has(tier.seed) && tier.form === SPLASH_FORM.box && Math.abs(tier.x) - tier.width / 2 < 30)
}

const SHOP_PREFIXES = [
  '星河', '南巷', '云栖', '青柠', '白鹭', '半岛', '夜航', '北辰', '锦里', '西岸', '拾光', '海棠', '长街', '霓虹', '东风', '朝夕', '银杏', '月台',
]
const SHOP_TRADES = [
  ['咖啡', 'COFFEE'], ['直播间', 'LIVE STUDIO'], ['好物馆', 'SELECT SHOP'], ['面馆', 'NOODLES'],
  ['影像馆', 'PHOTO STUDIO'], ['茶饮', 'TEA BAR'], ['美妆', 'BEAUTY'], ['书店', 'BOOKS'],
] as const

/** How many shops can carry a name no other shop shares. */
export const SPLASH_SHOP_NAMES = SHOP_PREFIXES.length * SHOP_TRADES.length

/**
 * Fascia name of shop `index`: prefixes cycle shop by shop and trades step by three, so neighbours differ in both and
 * the first `SPLASH_SHOP_NAMES` shops never share a name.
 * @param index - shop number along the avenue, below `SPLASH_SHOP_NAMES`.
 * @returns the Chinese name and the English trade printed under it.
 */
export function splashShopName(index: number): { name: string; trade: string } {
  if (index < 0 || index >= SPLASH_SHOP_NAMES) throw new Error(`splash: no unique name for shop ${index}`)
  const [trade, english] = SHOP_TRADES[(3 * index + Math.floor(index / SHOP_PREFIXES.length)) % SHOP_TRADES.length] ?? SHOP_TRADES[0]
  return { name: `${SHOP_PREFIXES[index % SHOP_PREFIXES.length] ?? ''}${trade}`, trade: english }
}

/**
 * Fascia lettering slots: shops are numbered tier by tier in layout order, and each tier's shops along its avenue face
 * from facade coordinate u = 0, so every shop on the avenue shows its own lettering.
 * @param layout - the city layout.
 * @returns the slot of each storefront tier's first shop, keyed by tier, and the number of shops.
 */
export function splashShopSlots(layout: SplashCityLayout): { first: ReadonlyMap<SplashTier, number>; shops: number } {
  const first = new Map<SplashTier, number>()
  let shops = 0
  for (const tier of layout.tiers) {
    if (!tier.storefront || tier.form !== SPLASH_FORM.box) continue
    first.set(tier, shops)
    shops += Math.ceil(tier.depth / SPLASH_SHOP_WIDTH)
  }
  if (shops > SPLASH_SHOP_NAMES) {
    throw new Error(`splash: ${shops} shops line the avenue but only ${SPLASH_SHOP_NAMES} shop names are unique`)
  }
  return { first, shops }
}

/**
 * Geometric relief on the avenue faces of the frontage: cornices and parapets on every tier, storey slabs on glass
 * towers, balconies with railings and privacy walls, window sills, air-conditioner casings, fire escapes, and shop awnings.
 * Positions follow `splashFacadeGrid`, so relief lines up with the windows the facade shader draws.
 * @param layout - the city layout.
 * @returns the same relief on every call.
 */
export function splashFacadeRelief(layout: SplashCityLayout): SplashRelief {
  const random = splashRandom(0x4e11ef)
  const masonry: SplashSolid[] = []
  const steel: SplashSolid[] = []
  const awnings: SplashTintedSolid[] = []
  for (const tier of splashFrontageTiers(layout)) {
    const side = Math.sign(tier.x)
    const face = Math.abs(tier.x) - tier.width / 2
    // X of a point `distance` metres in front of the avenue face, and Z of facade coordinate `u` along that face.
    const out = (distance: number): number => side * (face - distance)
    const along = (u: number): number => (side > 0 ? tier.z - tier.depth / 2 + u : tier.z + tier.depth / 2 - u)
    const grid = splashFacadeGrid(tier)
    const cellWidth = splashCellWidth(tier.depth, grid.cellTarget)
    const cells = Math.round(tier.depth / cellWidth)
    const top = tier.y + tier.height
    const floors: number[] = []
    const lowest = Math.ceil(Math.max(tier.y, tier.storefront ? 5.6 : 0) / grid.floorHeight)
    for (let level = lowest; (level + 1) * grid.floorHeight <= top - 0.3; level += 1) floors.push(level * grid.floorHeight)
    masonry.push(
      { x: out(0.2), y: top - 0.3, z: tier.z, width: 0.4, height: 0.6, depth: tier.depth + 0.4 },
      { x: side * (face + 0.12), y: top + 0.55, z: tier.z, width: 0.24, height: 1.1, depth: tier.depth },
      { x: side * (face + tier.width - 0.12), y: top + 0.55, z: tier.z, width: 0.24, height: 1.1, depth: tier.depth },
      { x: tier.x, y: top + 0.55, z: tier.z + tier.depth / 2 - 0.12, width: tier.width, height: 1.1, depth: 0.24 },
      { x: tier.x, y: top + 0.55, z: tier.z - tier.depth / 2 + 0.12, width: tier.width, height: 1.1, depth: 0.24 },
    )
    if (tier.facade === SPLASH_FACADE.glass || tier.facade === SPLASH_FACADE.ribbon) {
      for (const y of floors) masonry.push({ x: out(0.16), y, z: tier.z, width: 0.32, height: 0.14, depth: tier.depth })
    } else if (tier.facade === SPLASH_FACADE.panel && grid.balconies) {
      for (const y of floors) {
        for (let cell = 0; cell + 1 < cells; cell += 2) {
          const centre = along((cell + 1) * cellWidth)
          const length = 2 * cellWidth - 0.3
          masonry.push(
            { x: out(0.6), y: y + 0.09, z: centre, width: 1.2, height: 0.18, depth: length },
            { x: out(0.6), y: y + 0.7, z: centre + length / 2 + 0.11, width: 1.2, height: 1.05, depth: 0.08 },
          )
          steel.push(
            { x: out(1.17), y: y + 1.07, z: centre, width: 0.05, height: 0.05, depth: length },
            { x: out(1.17), y: y + 0.5, z: centre, width: 0.03, height: 0.03, depth: length },
          )
          for (const offset of [-0.5, -0.17, 0.17, 0.5]) {
            steel.push({ x: out(1.17), y: y + 0.63, z: centre + offset * length, width: 0.04, height: 0.9, depth: 0.04 })
          }
        }
      }
    } else if (tier.facade === SPLASH_FACADE.panel) {
      const escape = random() < 0.4 && cells >= 4 ? Math.floor(cells * 0.3) : -1
      floors.forEach((y, index) => {
        for (let cell = 0; cell < cells; cell += 1) {
          if (cell === escape || cell === escape + 1) continue
          const sill = y + 0.3 * grid.floorHeight - 0.03
          masonry.push({ x: out(0.06), y: sill, z: along((cell + 0.5) * cellWidth), width: 0.12, height: 0.06, depth: 0.62 * cellWidth })
          if (random() < 0.3) {
            const casing = y + 0.06 * grid.floorHeight + 0.3
            steel.push({ x: out(0.22), y: casing, z: along((cell + 0.65) * cellWidth), width: 0.44, height: 0.6, depth: 0.82 })
          }
        }
        if (escape < 0) return
        // Fire escape: a landing on every storey, its outer rail, and a flight up to the next landing, switching back.
        const centre = along((escape + 1) * cellWidth)
        const length = 2 * cellWidth - 0.2
        steel.push(
          { x: out(0.55), y: y + 0.03, z: centre, width: 1.1, height: 0.06, depth: length },
          { x: out(1.08), y: y + 1.0, z: centre, width: 0.04, height: 0.04, depth: length },
        )
        for (const offset of [-0.5, 0, 0.5]) {
          steel.push({ x: out(1.08), y: y + 0.5, z: centre + offset * length, width: 0.04, height: 1.0, depth: 0.04 })
        }
        if (index + 1 < floors.length) {
          const run = length - 0.6
          const rise = grid.floorHeight
          const climb = (index % 2 === 0 ? 1 : -1) * side
          steel.push({
            x: out(0.8), y: y + rise / 2, z: centre, width: 0.6, height: 0.06, depth: Math.hypot(run, rise),
            turnX: -climb * Math.atan2(rise, run),
          })
        }
      })
    }
    if (tier.storefront) {
      for (let shop = 0; (shop + 1) * SPLASH_SHOP_WIDTH <= tier.depth; shop += 1) {
        if (random() >= 0.45) continue
        awnings.push({
          x: out(0.75), y: 3.62, z: along((shop + 0.5) * SPLASH_SHOP_WIDTH), width: 1.5, height: 0.07, depth: 5.2, turnZ: side * 0.24,
          tint: AWNING_TINTS[Math.floor(random() * AWNING_TINTS.length)] ?? [0.3, 0.03, 0.03],
        })
      }
    }
  }
  return { masonry, steel, awnings }
}

/**
 * Seeded cars in three lanes each way along the avenue, keeping right: cars heading away from the opening camera (-Z)
 * drive at +X. Cars sharing a lane share its speed.
 * @returns the same cars on every call.
 */
export function splashCars(): SplashCar[] {
  const random = splashRandom(0xca75)
  const centre = (SPLASH_AVENUE.start + SPLASH_AVENUE.end) / 2
  const span = SPLASH_AVENUE.start - SPLASH_AVENUE.end + 60
  const lanes = [[1.8, -1, 17], [5.05, -1, 14], [8.15, -1, 11], [-1.8, 1, 18], [-5.05, 1, 15], [-8.15, 1, 12]] as const
  return lanes.flatMap(([x, directionZ, speed]) => Array.from({ length: 7 }, (_, index) => ({
    origin: { x, y: 0, z: centre }, directionX: 0, directionZ, speed, span,
    phase: (index + 0.2 + random() * 0.6) * span / 7,
    bob: -1,
    paint: CAR_PAINTS[Math.floor(random() * CAR_PAINTS.length)] ?? [0.05, 0.05, 0.05],
  })))
}

/** Z of every lamp pair along the avenue. */
function lampRows(): number[] {
  const rows: number[] = []
  for (let z: number = SPLASH_AVENUE.start; z > SPLASH_AVENUE.end; z -= SPLASH_LAMPS.spacing) rows.push(z)
  return rows
}

/** Whether `z` lies inside a cross-street corridor, widened by `margin` metres. */
function inCorridor(z: number, margin: number): boolean {
  return Object.values(SPLASH_CROSS_STREETS).some(centre => Math.abs(z - centre) < SPLASH_CROSS_STREET_HALF_WIDTH + margin)
}

/**
 * Street furniture: benches and bins between the lamps, hydrants, bollards and traffic signals at the cross streets,
 * vending machines against the shop fronts, and two bus shelters with lit posters.
 * @param layout - the city layout, whose storefront tiers place the vending machines.
 * @returns the same furniture on every call.
 */
export function splashStreetFurniture(layout: SplashCityLayout): SplashFurniture {
  const random = splashRandom(0xbe7c)
  const steel: SplashSolid[] = []
  const round: SplashSolid[] = []
  const red: SplashSolid[] = []
  const glow: SplashSolid[] = []
  const lights: SplashLight[] = []
  const posters: SplashPoster[] = []
  lampRows().forEach((lamp, index) => {
    for (const side of [-1, 1]) {
      const bench = lamp - SPLASH_LAMPS.spacing / 2
      if (index % 2 === 0 && !inCorridor(bench, 3)) {
        // Three seat slats and two back slats on a pair of frames.
        for (const slat of [-0.15, 0, 0.15]) {
          steel.push({ x: side * (15.6 + slat), y: 0.45, z: bench, width: 0.12, height: 0.04, depth: 1.8 })
        }
        for (const slat of [0.6, 0.84]) steel.push({ x: side * 15.85, y: slat, z: bench, width: 0.04, height: 0.12, depth: 1.8 })
        steel.push(
          { x: side * 15.6, y: 0.22, z: bench - 0.75, width: 0.42, height: 0.44, depth: 0.06 },
          { x: side * 15.6, y: 0.22, z: bench + 0.75, width: 0.42, height: 0.44, depth: 0.06 },
          { x: side * 15.85, y: 0.66, z: bench - 0.75, width: 0.05, height: 0.48, depth: 0.06 },
          { x: side * 15.85, y: 0.66, z: bench + 0.75, width: 0.05, height: 0.48, depth: 0.06 },
        )
      }
      if (!inCorridor(lamp - 4, 1)) {
        round.push(
          { x: side * 11.1, y: 0.45, z: lamp - 4, width: 0.48, height: 0.9, depth: 0.48 },
          { x: side * 11.1, y: 0.93, z: lamp - 4, width: 0.54, height: 0.06, depth: 0.54 },
        )
      }
      if (index % 3 === 1 && !inCorridor(lamp + 6, 1)) {
        red.push(
          { x: side * 10.7, y: 0.31, z: lamp + 6, width: 0.3, height: 0.62, depth: 0.3 },
          { x: side * 10.7, y: 0.66, z: lamp + 6, width: 0.36, height: 0.08, depth: 0.36 },
          { x: side * 10.7, y: 0.76, z: lamp + 6, width: 0.2, height: 0.12, depth: 0.2 },
          { x: side * 10.7, y: 0.42, z: lamp + 6, width: 0.12, height: 0.5, depth: 0.12, turnX: Math.PI / 2 },
        )
      }
    }
  })
  for (const crossing of Object.values(SPLASH_CROSS_STREETS)) {
    for (const side of [-1, 1]) {
      for (const offset of [6.8, 8.2, 9.6]) {
        for (const corner of [-1, 1]) {
          round.push({ x: side * 10.45, y: 0.45, z: crossing + corner * offset, width: 0.2, height: 0.9, depth: 0.2 })
        }
      }
      // A signal pole on the near corner of each carriageway, its arm over the lanes, and a head facing the traffic
      // with a visor over each lamp.
      const z = crossing + side * 7.5
      round.push({ x: side * 10.6, y: 2.8, z, width: 0.16, height: 5.6, depth: 0.16 })
      steel.push(
        { x: side * 7.85, y: 5.55, z, width: 5.5, height: 0.12, depth: 0.12 },
        { x: side * 5.4, y: 5.05, z, width: 0.34, height: 0.95, depth: 0.3 },
        { x: side * 5.4, y: 5.05, z: z - side * 0.17, width: 0.5, height: 1.15, depth: 0.03 },
      )
      for (const y of [5.32, 4.78]) steel.push({ x: side * 5.4, y: y + 0.13, z: z + side * 0.26, width: 0.26, height: 0.03, depth: 0.22 })
      lights.push(
        { x: side * 5.4, y: 5.32, z: z + side * 0.17, color: [1.6, 0.08, 0.05], radius: 0.12 },
        { x: side * 5.4, y: 4.78, z: z + side * 0.17, color: [0.1, 1.3, 0.55], radius: 0.12 },
      )
    }
  }
  for (const tier of layout.tiers) {
    if (!tier.storefront || tier.y > 0 || random() >= 0.34) continue
    const side = Math.sign(tier.x)
    const face = Math.abs(tier.x) - tier.width / 2
    const z = tier.z + (random() - 0.5) * (tier.depth - 3)
    if (inCorridor(z, 1)) continue
    steel.push({ x: side * (face - 0.42), y: 0.95, z, width: 0.8, height: 1.9, depth: 0.95 })
    glow.push({ x: side * (face - 0.83), y: 1.08, z, width: 0.03, height: 1.4, depth: 0.8 })
  }
  const [nearShelter, farShelter] = SPLASH_SCREEN_SLOT.shelters
  for (const [side, z, slot] of [[1, 118, nearShelter], [-1, 32, farShelter]] as const) {
    steel.push(
      { x: side * 14.2, y: 2.65, z, width: 1.8, height: 0.08, depth: 4.4 },
      { x: side * 15.05, y: 1.4, z, width: 0.06, height: 2.4, depth: 4.4 },
      { x: side * 13.4, y: 1.3, z: z - 2.1, width: 0.08, height: 2.6, depth: 0.08 },
      { x: side * 13.4, y: 1.3, z: z + 2.1, width: 0.08, height: 2.6, depth: 0.08 },
      { x: side * 14.7, y: 0.45, z, width: 0.4, height: 0.06, depth: 3.0 },
      // The poster's light-box cabinet: an aluminium case 8 cm proud of the poster on every edge.
      { x: side * 14.2, y: 1.35, z: z + 2.22, width: 1.96, height: 1.06, depth: 0.08 },
    )
    posters.push({ x: side * 14.2, y: 1.35, z: z + 2.27, width: 1.8, height: 0.9, slot })
  }
  return { steel, round, red, glow, lights, posters }
}

/**
 * Cables strung across the avenue between facing frontage walls, clear of the camera path, signs, skybridges, and cross
 * streets; some carry rows of lanterns.
 * @param layout - the city layout.
 * @returns the cables and the lantern positions hanging from them.
 */
export function splashCables(layout: SplashCityLayout): { cables: SplashCable[]; lanterns: SplashVector[] } {
  const random = splashRandom(0xcab1e)
  const frontage = splashFrontageTiers(layout)
  const bridges = layout.tiers.filter(tier => Math.abs(tier.x) < 3 && tier.width > SPLASH_AVENUE_FRONTAGE)
  const cables: SplashCable[] = []
  const lanterns: SplashVector[] = []
  const heights = [9.5, 12, 14.5, 17, 19.5, 22]
  for (let z = SPLASH_AVENUE.start - 12; z > -40; z -= 5 + random() * 4) {
    if (inCorridor(z, 2) || bridges.some(bridge => Math.abs(bridge.z - z) < bridge.depth / 2 + 4)) continue
    const camera = splashCameraHeightNear(z)
    const first = Math.floor(random() * heights.length)
    let anchor: { height: number; west: number; east: number } | undefined
    for (let attempt = 0; attempt < heights.length && anchor === undefined; attempt += 1) {
      const height = (heights[(first + attempt) % heights.length] ?? 12) + random() * 1.5
      if (camera !== undefined && Math.abs(height - camera) < 6) continue
      if (layout.signs.some(sign => Math.abs(sign.z - z) < 2.5 && sign.y < height + 1.5 && sign.y + sign.height > height - 2.5)) continue
      const [west, east] = [-1, 1].map((side) => {
        const wall = frontage.find(tier => Math.sign(tier.x) === side && Math.abs(tier.z - z) < tier.depth / 2 - 1
          && tier.y < height - 1 && tier.y + tier.height > height + 1)
        return wall === undefined ? undefined : side * (Math.abs(wall.x) - wall.width / 2)
      })
      if (west !== undefined && east !== undefined) anchor = { height, west, east }
    }
    if (anchor === undefined) continue
    const sag = 0.6 + random() * 1.0
    const drift = (random() - 0.5) * 3
    const from = { x: anchor.west, y: anchor.height, z: z + drift }
    const to = { x: anchor.east, y: anchor.height + (random() - 0.5) * 1.5, z: z - drift }
    cables.push({ from, to, sag })
    if (random() < 0.45) {
      for (let share = 0.12; share < 0.9; share += 0.085) {
        const droop = 4 * sag * share * (1 - share)
        lanterns.push({
          x: from.x + (to.x - from.x) * share,
          y: from.y + (to.y - from.y) * share - droop - 0.32,
          z: from.z + (to.z - from.z) * share,
        })
      }
    }
  }
  return { cables, lanterns }
}
