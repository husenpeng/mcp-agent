import { describe, expect, it } from 'vitest'
import {
  SPLASH_AVENUE_FRONTAGE, SPLASH_SCREEN_SLOT, splashCameraAt, splashCameraHeightNear, splashCityLayout,
} from '../src/client/splash-city.ts'
import {
  SPLASH_SHOP_NAMES, SPLASH_SHOP_WIDTH, splashCables, splashCars, splashCellWidth, splashFacadeGrid, splashFacadeRelief,
  splashFrontageTiers, splashShopName, splashShopSlots, splashStreetFurniture,
} from '../src/client/splash-street.ts'
import { SPLASH_TIMINGS } from '../src/client/splash-timeline.ts'

const layout = splashCityLayout()
const frontage = splashFrontageTiers(layout)

describe('splash facade grid', () => {
  it('gives every tier of a building the same storey and cell grid', () => {
    for (const tier of layout.tiers) {
      const grid = splashFacadeGrid(tier)
      expect(grid).toEqual(splashFacadeGrid({ ...tier, y: tier.y + 10, width: tier.width / 2 }))
      expect(grid.floorHeight).toBeGreaterThanOrEqual(3.3)
      expect(grid.floorHeight).toBeLessThan(4.1)
    }
  })

  it('divides a face into whole cells close to the preferred width', () => {
    expect(splashCellWidth(10, 2)).toBe(2)
    expect(splashCellWidth(10.6, 2)).toBeCloseTo(10.6 / 5)
    expect(splashCellWidth(1, 2)).toBe(1)
  })
})

describe('splash frontage relief', () => {
  it('builds the same relief on every call and keeps it in front of or on top of the frontage', () => {
    const relief = splashFacadeRelief(layout)
    expect(splashFacadeRelief(layout)).toEqual(relief)
    expect(relief.masonry.length).toBeGreaterThan(frontage.length * 5)
    expect(relief.steel.length).toBeGreaterThan(0)
    expect(relief.awnings.length).toBeGreaterThan(0)
    for (const solid of [...relief.masonry, ...relief.steel, ...relief.awnings]) {
      // Relief stays between the avenue kerbs and the frontage's far side; nothing lands in the carriageway.
      expect(Math.abs(solid.x)).toBeGreaterThan(SPLASH_AVENUE_FRONTAGE - 2)
    }
  })
})

describe('splash shop fronts', () => {
  it('numbers every avenue shop and gives each one a name no other shop shares', () => {
    const { first, shops } = splashShopSlots(layout)
    const storefronts = layout.tiers.filter(tier => tier.storefront)
    expect(first.size).toBe(storefronts.length)
    // Consecutive storefronts take consecutive runs of slots, one per shop along their avenue face.
    let next = 0
    for (const tier of storefronts) {
      expect(first.get(tier)).toBe(next)
      next += Math.ceil(tier.depth / SPLASH_SHOP_WIDTH)
    }
    expect(next).toBe(shops)
    expect(shops).toBeLessThanOrEqual(SPLASH_SHOP_NAMES)
    const names = Array.from({ length: SPLASH_SHOP_NAMES }, (_, index) => splashShopName(index).name)
    expect(new Set(names).size).toBe(SPLASH_SHOP_NAMES)
    for (let index = 1; index < SPLASH_SHOP_NAMES; index += 1) {
      expect(splashShopName(index).trade).not.toBe(splashShopName(index - 1).trade)
    }
    expect(() => splashShopName(SPLASH_SHOP_NAMES)).toThrow('no unique name')
  })
})

describe('splash cars', () => {
  it('keeps right, shares one speed per lane, and never hovers', () => {
    const cars = splashCars()
    expect(splashCars()).toEqual(cars)
    for (const car of cars) {
      expect(Math.sign(car.origin.x)).toBe(-car.directionZ)
      expect(car.origin.y).toBe(0)
      expect(car.bob).toBeLessThan(0)
      expect(Math.abs(car.origin.x)).toBeLessThan(9.5)
    }
    const speeds = new Map<number, number>()
    for (const car of cars) {
      expect(speeds.get(car.origin.x) ?? car.speed).toBe(car.speed)
      speeds.set(car.origin.x, car.speed)
    }
  })
})

describe('splash street furniture and cables', () => {
  it('keeps furniture on the sidewalks and gives each shelter poster its own artwork', () => {
    const furniture = splashStreetFurniture(layout)
    expect(splashStreetFurniture(layout)).toEqual(furniture)
    for (const solid of [...furniture.round, ...furniture.red, ...furniture.glow]) expect(Math.abs(solid.x)).toBeGreaterThan(10)
    expect(furniture.round.length).toBeGreaterThan(0)
    expect(furniture.posters.map(poster => poster.slot)).toEqual([...SPLASH_SCREEN_SLOT.shelters])
    expect(furniture.lights.length).toBeGreaterThan(0)
  })

  it('anchors every cable on facing frontage walls, clear of the camera path', () => {
    const { cables, lanterns } = splashCables(layout)
    expect(cables.length).toBeGreaterThan(5)
    expect(lanterns.length).toBeGreaterThan(0)
    for (const cable of cables) {
      expect(Math.sign(cable.from.x)).toBe(-1)
      expect(Math.sign(cable.to.x)).toBe(1)
      for (const end of [cable.from, cable.to]) {
        const anchored = frontage.some(tier => Math.abs(Math.abs(tier.x) - tier.width / 2 - Math.abs(end.x)) < 1e-9
          && Math.abs(tier.z - end.z) < tier.depth / 2 + 2)
        expect(anchored).toBe(true)
      }
      const camera = splashCameraHeightNear((cable.from.z + cable.to.z) / 2)
      if (camera !== undefined) expect(Math.abs(cable.from.y - cable.sag / 2 - camera)).toBeGreaterThan(4)
    }
  })
})

describe('splash camera motion', () => {
  it('changes acceleration gradually and settles to rest without a final jolt', () => {
    const steps = 630
    const seconds = SPLASH_TIMINGS.cameraMs / 1000 / steps
    const positions = Array.from({ length: steps + 1 }, (_, step) => splashCameraAt(step / steps).position)
    const speeds = positions.slice(1).map((position, index) => {
      const previous = positions[index] ?? position
      return Math.hypot(position.x - previous.x, position.y - previous.y, position.z - previous.z) / seconds
    })
    const accelerations = speeds.slice(1).map((speed, index) => (speed - (speeds[index] ?? speed)) / seconds)
    const jolts = accelerations.slice(1).map((acceleration, index) => Math.abs(acceleration - (accelerations[index] ?? acceleration)))
    // Within each 10 ms step the acceleration changes by less than 3 m/s²: no kinks at the keys.
    expect(Math.max(...jolts)).toBeLessThan(3)
    expect(Math.abs(accelerations.at(-1) ?? 99)).toBeLessThan(2)
    expect(speeds.at(-1) ?? 1).toBeLessThan(1)
    expect(speeds[0] ?? 0).toBeGreaterThan(20)
  })
})
