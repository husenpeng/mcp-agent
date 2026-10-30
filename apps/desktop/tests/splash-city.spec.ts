import { describe, expect, it } from 'vitest'
import {
  SPLASH_AIR_LANES, SPLASH_AVENUE, SPLASH_AVENUE_FRONTAGE, SPLASH_CRAFT, SPLASH_CROSS_STREET_HALF_WIDTH, SPLASH_CROSS_STREETS,
  SPLASH_FORM, SPLASH_LANDMARKS, SPLASH_MAGLEV, SPLASH_SCREEN_SLOT, SPLASH_SCREEN_SLOTS, SPLASH_SIGN_SLOTS, SPLASH_TOWER,
  SPLASH_VIEW_ASPECT, splashCameraAt, splashCityLayout, splashFlyers, splashPhase, splashTraffic, splashTrainX,
  splashUnderOverlay, type SplashTier,
} from '../src/client/splash-city.ts'

const layout = splashCityLayout()
const spansAvenue = (tier: SplashTier): boolean => Math.abs(tier.x) - tier.width / 2 < SPLASH_AVENUE_FRONTAGE
  && tier.z < SPLASH_AVENUE.start && tier.z > SPLASH_AVENUE.end
const isPlaza = (tier: SplashTier): boolean => tier.x === SPLASH_TOWER.x && tier.z === SPLASH_TOWER.z

describe('splash 3D city layout', () => {
  it('generates the same mixed city on every call', () => {
    expect(splashCityLayout()).toEqual(layout)
    expect(layout.tiers.length).toBeGreaterThan(600)
    expect(layout.tiers.some(tier => tier.form === SPLASH_FORM.round)).toBe(true)
    expect(layout.tiers.some(tier => tier.form === SPLASH_FORM.box && tier.storefront)).toBe(true)
    expect(layout.signs.length).toBeGreaterThan(10)
    expect(layout.screens.length).toBeGreaterThan(4)
    expect(layout.antennas.some(antenna => antenna.radius > 1)).toBe(true)
    for (const tier of layout.tiers) {
      expect(tier.width).toBeGreaterThan(0)
      expect(tier.depth).toBeGreaterThan(0)
      expect(tier.height).toBeGreaterThan(0)
      expect(tier.taper).toBeGreaterThan(0)
      expect(tier.taper).toBeLessThanOrEqual(1)
      if (tier.form === SPLASH_FORM.box) expect(tier.taper).toBe(1)
      else expect(tier.storefront).toBe(false)
    }
  })

  it('shows every sign and screen artwork at most once, and leaves the airship and shelter slots to them', () => {
    const signSlots = layout.signs.map(sign => sign.slot)
    const screenSlots = layout.screens.map(screen => screen.slot)
    expect(new Set(signSlots).size).toBe(signSlots.length)
    // Every facade artwork is on exactly one screen.
    expect([...screenSlots].sort((a, b) => a - b)).toEqual(Array.from({ length: SPLASH_SCREEN_SLOT.facades }, (_, slot) => slot))
    for (const slot of signSlots) expect(slot >= 0 && slot < SPLASH_SIGN_SLOTS).toBe(true)
    const reserved = [SPLASH_SCREEN_SLOT.airship, ...SPLASH_SCREEN_SLOT.shelters]
    expect(new Set(reserved).size).toBe(reserved.length)
    for (const slot of reserved) expect(slot >= SPLASH_SCREEN_SLOT.facades && slot < SPLASH_SCREEN_SLOTS).toBe(true)
  })

  it('keeps every advert out from under the page overlay in the resting composition', () => {
    for (const screen of layout.screens) expect(splashUnderOverlay(screen)).toBe(false)
    for (const sign of layout.signs) expect(splashUnderOverlay({ ...sign, y: sign.y + sign.height / 2, yaw: 0 })).toBe(false)
    // The check itself: a screen centred on the bottom-right caption is under the overlay, one at the centre top is not.
    const rest = splashCameraAt(1)
    const ahead = { x: rest.position.x, y: rest.position.y, z: rest.position.z - 100 }
    const viewHeight = 2 * 100 * Math.tan((rest.fov * Math.PI) / 360)
    const at = (x: number, y: number): { x: number; y: number; z: number; width: number; height: number; yaw: number } => ({
      x: ahead.x + (x - 0.5) * viewHeight * SPLASH_VIEW_ASPECT,
      y: ahead.y + (0.5 - y) * viewHeight,
      z: ahead.z, width: 2, height: 1, yaw: 0,
    })
    expect(splashUnderOverlay(at(0.86, 0.95))).toBe(true)
    expect(splashUnderOverlay(at(0.5, 0.3))).toBe(false)
  })

  it('keeps the avenue open below its skybridges, and keeps every bridge clear of the air lanes', () => {
    const bridges = layout.tiers.filter(tier => spansAvenue(tier) && !isPlaza(tier))
    expect(bridges.length).toBeGreaterThan(0)
    for (const bridge of bridges) {
      expect(bridge.y).toBeGreaterThan(8)
      for (const lane of SPLASH_AIR_LANES) expect(lane < bridge.y - 4 || lane > bridge.y + bridge.height + 4).toBe(true)
    }
  })

  it('leaves the cross streets and landmark plots empty', () => {
    for (const tier of layout.tiers.filter(tier => !spansAvenue(tier) && !isPlaza(tier))) {
      for (const street of Object.values(SPLASH_CROSS_STREETS)) {
        const north = tier.z + tier.depth / 2 <= street - SPLASH_CROSS_STREET_HALF_WIDTH
        const south = tier.z - tier.depth / 2 >= street + SPLASH_CROSS_STREET_HALF_WIDTH
        expect(north || south).toBe(true)
      }
      for (const landmark of Object.values(SPLASH_LANDMARKS)) {
        expect(Math.hypot(tier.x - landmark.x, tier.z - landmark.z)).toBeGreaterThan(landmark.clearance)
      }
    }
  })

  it('keeps buildings near the resting camera below it so the final shot opens onto the skyline', () => {
    const rest = splashCameraAt(1).position
    const near = layout.tiers.filter(tier => tier.z < -45 && Math.hypot(tier.x - rest.x, tier.z - rest.z) < 150 && !spansAvenue(tier))
    expect(near.length).toBeGreaterThan(0)
    for (const tier of near) expect(tier.y + tier.height).toBeLessThan(rest.y)
  })
})

describe('splash camera and phases', () => {
  it('cranes from street level to the resting pose and clamps outside the move', () => {
    const start = splashCameraAt(0)
    const end = splashCameraAt(1)
    expect(start.position.y).toBeLessThan(10)
    expect(end.position.y).toBeGreaterThan(start.position.y + 120)
    expect(end.target.z).toBe(SPLASH_TOWER.z)
    expect(splashCameraAt(-1)).toEqual(start)
    expect(splashCameraAt(2)).toEqual(end)
  })

  it('eases a phase from 0 to 1 and holds outside it', () => {
    expect(splashPhase(0, 100, 200)).toBe(0)
    expect(splashPhase(200, 100, 200)).toBe(0.5)
    expect(splashPhase(250, 100, 200)).toBeGreaterThan(0.5)
    expect(splashPhase(900, 100, 200)).toBe(1)
  })
})

describe('splash traffic', () => {
  it('builds the same craft on every call, and craft sharing a lane share its speed', () => {
    const flyers = splashFlyers()
    expect(splashFlyers()).toEqual(flyers)
    expect(flyers.some(flyer => flyer.kind === SPLASH_CRAFT.spinner)).toBe(true)
    expect(flyers.some(flyer => flyer.kind === SPLASH_CRAFT.hauler)).toBe(true)
    const speeds = new Map<string, number>()
    for (const flyer of flyers) {
      const lane = `${flyer.origin.x},${flyer.origin.y},${flyer.origin.z},${flyer.directionX},${flyer.directionZ}`
      expect(speeds.get(lane) ?? flyer.speed).toBe(flyer.speed)
      speeds.set(lane, flyer.speed)
    }
    expect(splashTraffic()).toEqual(splashTraffic())
  })

  it('centres the maglev train on the avenue during the opening glide and loops within its span', () => {
    expect(splashTrainX(1.6)).toBeCloseTo(0)
    for (const seconds of [0, 3, 20, 400]) expect(Math.abs(splashTrainX(seconds))).toBeLessThanOrEqual(SPLASH_MAGLEV.span / 2)
  })
})
