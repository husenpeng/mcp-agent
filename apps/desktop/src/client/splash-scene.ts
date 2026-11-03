/** Procedural WebGL night city with landmark towers, flying traffic, and a projector-lit Tomato mark for the desktop splash. */

import * as THREE from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { SPLASH_TIMINGS } from './splash-timeline.ts'
import {
  SPLASH_AVENUE, SPLASH_AVENUE_FRONTAGE, SPLASH_BLIMP, SPLASH_CRAFT, SPLASH_CROSS_STREET_HALF_WIDTH, SPLASH_CROSS_STREETS,
  SPLASH_FORM, SPLASH_LAMPS, SPLASH_LANDMARKS, SPLASH_MAGLEV, SPLASH_MARK, SPLASH_SCREEN_SLOT, SPLASH_TOWER, splashCameraAt,
  splashCityLayout, splashFlyers, splashPhase, splashTraffic, splashTrainX, type SplashCityLayout, type SplashLane,
  type SplashVector,
} from './splash-city.ts'
import {
  FACADE_FRAGMENT_GLSL, FACADE_VERTEX_GLSL, GROUND_FRAGMENT_GLSL, GROUND_VERTEX_GLSL, PANEL_FRAGMENT_GLSL,
  PANEL_VERTEX_GLSL, SKY_FRAGMENT_GLSL, SKY_VERTEX_GLSL, SOLID_FRAGMENT_GLSL, SOLID_SURFACE, SOLID_VERTEX_GLSL,
  type SolidSurface,
} from './splash-glsl.ts'
import {
  BEAM_FRAGMENT_GLSL, BEAM_VERTEX_GLSL, CRAFT_LIGHT_VERTEX_GLSL, LIGHT_FRAGMENT_GLSL, MARK_FRAGMENT_GLSL,
  MARK_FRONT_SCALE, MARK_VERTEX_GLSL, POINT_LIGHT_VERTEX_GLSL, RAIN_VERTEX_GLSL, SPARK_VERTEX_GLSL,
} from './splash-glsl-light.ts'
import {
  CRAFT_FRAGMENT_GLSL, CRAFT_KIND, CRAFT_VERTEX_GLSL, LANDMARK_FRAGMENT_GLSL, LANDMARK_KIND, LANDMARK_VERTEX_GLSL,
  type CraftKind,
} from './splash-glsl-landmark.ts'
import {
  createIgnitionTexture, createMarkGeometry, MARK_FIELD_SIZE, markIgnitionArrival, markIgnitionField,
  markIgnitionSeed, rasterizeMark, sampleMarkPoints,
} from './splash-mark.ts'
import {
  BLIMP_LIGHTS, BLIMP_SCREEN, CAR_LIGHTS, createBlimpGeometry, createCarGeometry, createGateTower, createHaulerGeometry,
  createOpenerTower, createPearlTower, createSpinnerGeometry, createTrainGeometry, createTwistTower, HAULER_LIGHTS,
  SPINNER_LIGHTS, trainLights, TWIST_RATE, type LandmarkModel, type ModelLight,
} from './splash-models.ts'
import { createFasciaAtlas, createScreenAtlas, createSignAtlas, type SplashAtlas } from './splash-signage.ts'
import {
  splashCables, splashCars, splashFacadeGrid, splashFacadeRelief, splashFrontageTiers, splashShopSlots, splashStreetFurniture,
  type SplashCable, type SplashSolid,
} from './splash-street.ts'
import { createSplashPost } from './splash-post.ts'

/** Lifecycle of the running scene, owned by the splash document. */
export interface SplashScene {
  /** Jump to the resting composition with the mark lit. */
  finish(): void
  /** Stop rendering and release GPU resources. */
  stop(): void
}

/** Uniform objects shared by every city material; assigning `.value` updates all of them. */
interface SharedUniforms {
  readonly uTime: { value: number }
  /** 1 for the main view; 0 while the mirrored ground render draws, which skips interior detail. */
  readonly uDetail: { value: number }
  readonly uHoloPos: { value: THREE.Vector3 }
  readonly uHolo: { value: number }
  readonly uFogDensity: { value: number }
  readonly uFogFalloff: { value: number }
  /** Avenue lamp heads for `lampLight`: |x|, height, first row z, and row spacing toward -Z. */
  readonly uLamps: { value: THREE.Vector4 }
  readonly uLampRows: { value: number }
}

/** Scene objects animated on the splash timeline. */
interface Animated {
  readonly objects: readonly THREE.Object3D[]
  /**
   * Apply one sample.
   * @param timeline - milliseconds on the splash timeline, clamped at the hold frame.
   * @param seconds - seconds since the timeline started, unclamped, for motion that continues through the hold.
   */
  update(timeline: number, seconds: number): void
  dispose(): void
}

/** A light in world space for the static point-light mesh. */
interface WorldLight {
  readonly position: THREE.Vector3
  readonly color: readonly [number, number, number]
  readonly radius: number
}

/** One projector beam cone and the uniforms that drive it. */
interface Beam {
  readonly mesh: THREE.Mesh
  /** Share of the projector's power this cone carries. */
  readonly strength: number
  readonly power: { value: number }
  readonly reach: { value: number }
}

const staticScene: SplashScene = { finish: () => {}, stop: () => {} }

/** Rain stays out of the mirrored ground render. */
const RAIN_LAYER = 1
const CLEAR_COLOR = 0x030105
/**
 * Pixels per CSS pixel at most. The 1280×760 window renders at 1920×1140 on a 2× display, which holds 120 Hz on Apple
 * silicon; a `2` cap measured 82 fps there with no visible sharpness gain over the bloom and sharpening passes.
 */
const MAX_PIXEL_RATIO = 1.5
const MIN_PIXEL_RATIO = 0.8
/** Drawing-buffer pixels rendered at most: the 1280×760 window at `MAX_PIXEL_RATIO`; larger windows render softer. */
const MAX_DRAWING_PIXELS = 1920 * 1140
const SPARK_COUNT = 900
/** Share of the drawing buffer's resolution used by the mirrored ground render; puddle blur hides the loss. */
const MIRROR_SCALE = 0.4
/** Ground distance in metres past which the camera no longer sees open street, so the mirror stops updating. */
const MIRROR_REACH = 450
/**
 * Emissive scale of each advert family. Artwork stays below the bloom threshold, so copy keeps its outlines; only the
 * sign frames' white cores and the brightest screen highlights bloom.
 */
const AD_GLOW = { signs: 1.1, screens: 0.9, airship: 0.95, posters: 0.85 } as const
/** Lamp luminaires: how far the arm reaches toward the road from the post, and how far below the post top they shine. */
const LAMP_HEAD = { reach: 2.1, drop: 0.42 } as const

function cityMaterial(
  shared: SharedUniforms,
  vertexShader: string,
  fragmentShader: string,
  uniforms: Record<string, { value: unknown }> = {},
  options: THREE.ShaderMaterialParameters = {},
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ ...options, vertexShader, fragmentShader, uniforms: { ...shared, ...uniforms } })
}

/**
 * A prop material; `surface` picks the `SOLID_FRAGMENT_GLSL` surface, and `bevel` rounds the centred unit box's edges.
 */
function solidMaterial(
  shared: SharedUniforms, albedo: number | THREE.Color, sheen: number, emissive = new THREE.Color(0, 0, 0),
  surface: SolidSurface = 'plain', bevel = false,
): THREE.ShaderMaterial {
  return cityMaterial(shared, SOLID_VERTEX_GLSL, SOLID_FRAGMENT_GLSL, {
    uAlbedo: { value: typeof albedo === 'number' ? new THREE.Color(albedo, albedo * 0.96, albedo * 1.04) : albedo },
    uEmissive: { value: emissive },
    uSheen: { value: sheen },
    uSurface: { value: SOLID_SURFACE[surface] },
  }, bevel ? { defines: { BEVEL: '' } } : {})
}

/** Instance a base geometry's vertex attributes once per entry of `attributes`. */
function instanced(
  base: THREE.BufferGeometry,
  count: number,
  attributes: Record<string, THREE.InstancedBufferAttribute>,
): THREE.InstancedBufferGeometry {
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.index = base.index
  for (const [name, attribute] of Object.entries(base.attributes)) geometry.setAttribute(name, attribute)
  for (const [name, attribute] of Object.entries(attributes)) geometry.setAttribute(name, attribute)
  geometry.instanceCount = count
  return geometry
}

function instancedQuad(count: number, attributes: Record<string, THREE.InstancedBufferAttribute>): THREE.InstancedBufferGeometry {
  const quad = new THREE.PlaneGeometry(1, 1)
  quad.deleteAttribute('normal')
  return instanced(quad, count, attributes)
}

/** Light capsules size themselves in pixels, so each draw reads the pixel size of the target it renders into. */
function bindViewport(mesh: THREE.Mesh, material: THREE.ShaderMaterial, viewport: { value: THREE.Vector2 }): void {
  mesh.frustumCulled = false
  mesh.onBeforeRender = (renderer) => {
    const target = renderer.getRenderTarget()
    if (target === null) renderer.getDrawingBufferSize(viewport.value)
    else viewport.value.set(target.width, target.height)
    material.uniformsNeedUpdate = true
  }
}

function lightMesh(
  shared: SharedUniforms,
  viewport: { value: THREE.Vector2 },
  vertexShader: string,
  geometry: THREE.InstancedBufferGeometry,
  uniforms: Record<string, { value: unknown }> = {},
): THREE.Mesh {
  const material = cityMaterial(shared, vertexShader, LIGHT_FRAGMENT_GLSL, { uViewport: viewport, ...uniforms }, {
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  bindViewport(mesh, material, viewport)
  return mesh
}

function pointLights(
  shared: SharedUniforms,
  viewport: { value: THREE.Vector2 },
  lights: readonly WorldLight[],
  offset: { value: THREE.Vector3 } = { value: new THREE.Vector3() },
): THREE.Mesh {
  const heads = new Float32Array(lights.length * 3)
  const colors = new Float32Array(lights.length * 4)
  lights.forEach((light, index) => {
    heads.set([light.position.x, light.position.y, light.position.z], index * 3)
    colors.set([...light.color, light.radius], index * 4)
  })
  return lightMesh(shared, viewport, POINT_LIGHT_VERTEX_GLSL, instancedQuad(lights.length, {
    aHead: new THREE.InstancedBufferAttribute(heads, 3),
    aLight: new THREE.InstancedBufferAttribute(colors, 4),
  }), { uLightOffset: offset })
}

/** Lights in a model's local frame, placed at the origin for meshes that move them with `uLightOffset`. */
function localLights(lights: readonly ModelLight[]): WorldLight[] {
  return modelLights(lights, new THREE.Matrix4())
}

function modelLights(lights: readonly ModelLight[], matrix: THREE.Matrix4): WorldLight[] {
  return lights.map(light => ({
    position: new THREE.Vector3(...light.offset).applyMatrix4(matrix),
    color: light.color,
    radius: light.radius,
  }))
}

function createCity(layout: SplashCityLayout, shared: SharedUniforms, fascia: SplashAtlas): THREE.Mesh[] {
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
  const drum = new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1).translate(0, 0.5, 0)
  const frontage = new Set(splashFrontageTiers(layout))
  const shops = splashShopSlots(layout).first
  return ([[SPLASH_FORM.box, box], [SPLASH_FORM.round, drum]] as const).map(([form, base]) => {
    const tiers = layout.tiers.filter(tier => tier.form === form)
    const centres = new Float32Array(tiers.length * 3)
    const sizes = new Float32Array(tiers.length * 4)
    const styles = new Float32Array(tiers.length * 4)
    const grids = new Float32Array(tiers.length * 4)
    const storefronts = new Float32Array(tiers.length)
    tiers.forEach((tier, index) => {
      const grid = splashFacadeGrid(tier)
      centres.set([tier.x, tier.y, tier.z], index * 3)
      sizes.set([tier.width, tier.height, tier.depth, tier.taper], index * 4)
      styles.set([tier.seed, tier.facade, tier.lit, tier.trim], index * 4)
      grids.set([grid.floorHeight, grid.cellTarget, grid.finish, (grid.balconies ? 1 : 0) + (frontage.has(tier) ? 2 : 0)], index * 4)
      const firstShop = shops.get(tier)
      storefronts[index] = firstShop === undefined ? 0 : firstShop + 1
    })
    base.deleteAttribute('uv')
    const geometry = instanced(base, tiers.length, {
      aCenter: new THREE.InstancedBufferAttribute(centres, 3),
      aSize: new THREE.InstancedBufferAttribute(sizes, 4),
      aStyle: new THREE.InstancedBufferAttribute(styles, 4),
      aGrid: new THREE.InstancedBufferAttribute(grids, 4),
      aStorefront: new THREE.InstancedBufferAttribute(storefronts, 1),
    })
    const mesh = new THREE.Mesh(geometry, cityMaterial(shared, FACADE_VERTEX_GLSL, FACADE_FRAGMENT_GLSL, {
      uFascia: { value: fascia.texture },
      uFasciaGrid: { value: fascia.grid },
    }, {
      defines: form === SPLASH_FORM.round ? { RADIAL: '' } : {},
    }))
    mesh.frustumCulled = false
    return mesh
  })
}

function createGround(shared: SharedUniforms): Reflector {
  const reflector = new Reflector(new THREE.PlaneGeometry(2800, 2800), {
    textureWidth: 1,
    textureHeight: 1,
    clipBias: 0.003,
    color: 0xd9d3df,
    multisample: 4,
    shader: {
      name: 'SplashGround',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uStreet: { value: new THREE.Vector4(SPLASH_LAMPS.x, SPLASH_LAMPS.spacing, 0, SPLASH_AVENUE_FRONTAGE) },
        uAvenue: { value: new THREE.Vector2(SPLASH_AVENUE.start + 15, SPLASH_AVENUE.end - 10) },
        uCrossings: { value: new THREE.Vector3(SPLASH_CROSS_STREETS.north, SPLASH_CROSS_STREETS.south, SPLASH_CROSS_STREETS.rail) },
      },
      vertexShader: GROUND_VERTEX_GLSL,
      fragmentShader: GROUND_FRAGMENT_GLSL,
    },
  })
  const material = reflector.material
  if (!(material instanceof THREE.ShaderMaterial)) throw new Error('splash: ground reflector has no shader material')
  // Reflector clones its shader uniforms; reattach the shared objects so one assignment drives every surface.
  Object.assign(material.uniforms, shared)
  const texture = reflector.getRenderTarget().texture
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  reflector.rotation.x = -Math.PI / 2
  reflector.position.set(0, 0, -300)
  // The mirrored render skips interior detail; puddle blur hides it and it would double the facade cost.
  // Once the camera's lowest ray meets the ground beyond the streets buildings hide, the mirror keeps its last frame.
  const mirror = reflector.onBeforeRender.bind(reflector)
  const forward = new THREE.Vector3()
  reflector.onBeforeRender = (renderer, scene, camera, ...rest) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const lowest = Math.asin(camera.getWorldDirection(forward).y) - THREE.MathUtils.degToRad(camera.fov / 2)
      if (lowest > -0.01 || camera.position.y / Math.tan(-lowest) > MIRROR_REACH) return
    }
    shared.uDetail.value = 0
    mirror(renderer, scene, camera, ...rest)
    shared.uDetail.value = 1
  }
  return reflector
}

function createSky(shared: SharedUniforms): THREE.Mesh {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 48, 24),
    cityMaterial(shared, SKY_VERTEX_GLSL, SKY_FRAGMENT_GLSL, {}, { side: THREE.BackSide, depthTest: false, depthWrite: false }),
  )
  sky.renderOrder = -1
  sky.frustumCulled = false
  sky.onBeforeRender = (_renderer, _scene, camera) => {
    sky.position.copy(camera.position)
    sky.updateMatrixWorld()
  }
  return sky
}

/** One instance of a prop mesh: position, scale, and yaw about the vertical axis. */
interface Placement {
  readonly position: THREE.Vector3
  readonly scale: THREE.Vector3
  readonly yaw?: number
}

function placeBoxes(mesh: THREE.InstancedMesh, boxes: readonly Placement[]): THREE.InstancedMesh {
  const matrix = new THREE.Matrix4()
  const rotation = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  boxes.forEach((box, index) => {
    rotation.setFromAxisAngle(up, box.yaw ?? 0)
    mesh.setMatrixAt(index, matrix.compose(box.position, rotation, box.scale))
  })
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}

/** Lamp post with an arm reaching toward the road along -X: a plinth, a tapered pole, the arm, and the luminaire housing. */
function lampGeometry(): THREE.BufferGeometry {
  const height = SPLASH_LAMPS.height
  const parts = [
    new THREE.CylinderGeometry(0.17, 0.2, 0.55, 14).translate(0, 0.275, 0),
    new THREE.CylinderGeometry(0.065, 0.11, height, 14).translate(0, height / 2, 0),
    new THREE.CylinderGeometry(0.045, 0.045, LAMP_HEAD.reach, 10).rotateZ(Math.PI / 2).translate(-LAMP_HEAD.reach / 2, height - 0.1, 0),
    new THREE.CylinderGeometry(0.05, 0.05, 0.42, 10).rotateZ(Math.PI / 4).translate(-0.17, height - 0.27, 0),
    new THREE.BoxGeometry(0.92, 0.14, 0.38).translate(-LAMP_HEAD.reach, height - 0.25, 0),
    new THREE.BoxGeometry(0.7, 0.06, 0.3).translate(-LAMP_HEAD.reach + 0.02, height - 0.15, 0),
  ]
  const merged = mergeGeometries(parts, false)
  for (const part of parts) part.dispose()
  return merged
}

function lampPositions(): { x: number; z: number; side: -1 | 1 }[] {
  const lamps: { x: number; z: number; side: -1 | 1 }[] = []
  for (let z: number = SPLASH_AVENUE.start; z > SPLASH_AVENUE.end; z -= SPLASH_LAMPS.spacing) {
    lamps.push({ x: -SPLASH_LAMPS.x, z, side: -1 }, { x: SPLASH_LAMPS.x, z, side: 1 })
  }
  return lamps
}

/** Rooftop water tank on four legs, base at y = 0, for instancing at the unit's footprint and height. */
function waterTankGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(0.5, 0.5, 0.78, 18).translate(0, 0.61, 0)]
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as const) {
    parts.push(new THREE.BoxGeometry(0.07, 0.24, 0.07).translate(x, 0.12, z))
  }
  const merged = mergeGeometries(parts, false)
  for (const part of parts) part.dispose()
  return merged
}

/** Rooftop air handler: a casing with a fan shroud on top, base at y = 0. */
function airHandlerGeometry(): THREE.BufferGeometry {
  const parts = [
    new THREE.BoxGeometry(1, 0.86, 1).translate(0, 0.43, 0),
    new THREE.CylinderGeometry(0.34, 0.34, 0.14, 20).translate(-0.18, 0.93, 0),
    new THREE.CylinderGeometry(0.34, 0.34, 0.14, 20).translate(0.22, 0.93, 0),
  ]
  const merged = mergeGeometries(parts, false)
  for (const part of parts) part.dispose()
  return merged
}

/** Kerb runs along both sides of the avenue, broken where the cross streets meet it. */
function kerbRuns(): { from: number; to: number }[] {
  const breaks = Object.values(SPLASH_CROSS_STREETS).sort((a, b) => b - a)
  const runs: { from: number; to: number }[] = []
  let from: number = SPLASH_AVENUE.start + 15
  for (const crossing of breaks) {
    runs.push({ from, to: crossing + SPLASH_CROSS_STREET_HALF_WIDTH })
    from = crossing - SPLASH_CROSS_STREET_HALF_WIDTH
  }
  runs.push({ from, to: SPLASH_AVENUE.end - 10 })
  return runs.filter(run => run.from > run.to)
}

function createProps(layout: SplashCityLayout, shared: SharedUniforms): THREE.Object3D[] {
  const metal = solidMaterial(shared, 0.05, 0.25)
  // Roof units vary between plain condensers, water tanks, and fan-topped air handlers.
  const kinds = layout.roofUnits.map(unit => Math.floor(Math.abs(Math.sin(unit.x * 12.9898 + unit.z * 78.233)) * 43758.5453) % 3)
  const roofMesh = (geometry: THREE.BufferGeometry, kind: number, round: boolean): THREE.InstancedMesh => {
    const units = layout.roofUnits.filter((_, index) => kinds[index] === kind)
    return placeBoxes(new THREE.InstancedMesh(geometry, metal, units.length), units.map((unit) => {
      const across = round ? Math.min(unit.width, unit.depth) : unit.width
      return {
        position: new THREE.Vector3(unit.x, unit.y, unit.z),
        scale: new THREE.Vector3(across, unit.height, round ? across : unit.depth),
      }
    }))
  }
  const units = [
    roofMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), 0, false),
    roofMesh(waterTankGeometry(), 1, true),
    roofMesh(airHandlerGeometry(), 2, false),
  ]
  const masts = placeBoxes(
    new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 1, 1, 12).translate(0, 0.5, 0), metal, layout.antennas.length),
    layout.antennas.map(mast => ({
      position: new THREE.Vector3(mast.x, mast.y, mast.z),
      scale: new THREE.Vector3(mast.radius, mast.height, mast.radius),
    })),
  )
  const lamps = lampPositions()
  const posts = placeBoxes(
    new THREE.InstancedMesh(lampGeometry(), metal, lamps.length),
    lamps.map(lamp => ({
      position: new THREE.Vector3(lamp.x, 0, lamp.z),
      scale: new THREE.Vector3(1, 1, 1),
      yaw: lamp.side > 0 ? 0 : Math.PI,
    })),
  )
  // The luminaire's lens under each housing.
  const lenses = placeBoxes(
    new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), solidMaterial(shared, 0.02, 0, new THREE.Color(1.6, 1.15, 0.75)), lamps.length),
    lamps.map(lamp => ({
      position: new THREE.Vector3(lamp.x - lamp.side * LAMP_HEAD.reach, SPLASH_LAMPS.height - 0.33, lamp.z),
      scale: new THREE.Vector3(0.78, 0.025, 0.3),
    })),
  )
  const steel = solidMaterial(shared, 0.05, 0.25, undefined, 'steel', true)
  // Sign and screen cabinets behind each panel, and a bezel standing 3 cm proud of the panel around its edges.
  const cabinets = [
    ...layout.signs.map(sign => ({ ...sign, y: sign.y + sign.height / 2, yaw: 0, lip: 0.13 })),
    ...layout.screens.map(screen => ({ ...screen, lip: 0.25 })),
  ]
  const housings = placeBoxes(
    new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steel, cabinets.length * 5),
    cabinets.flatMap((cabinet) => {
      const sin = Math.sin(cabinet.yaw)
      const cos = Math.cos(cabinet.yaw)
      // `across` metres along the panel's width and `out` metres in front of its face.
      const at = (across: number, up: number, out: number): THREE.Vector3 =>
        new THREE.Vector3(cabinet.x + across * cos + out * sin, cabinet.y + up, cabinet.z - across * sin + out * cos)
      const outer = { width: cabinet.width + 2 * cabinet.lip, height: cabinet.height + 2 * cabinet.lip }
      const band = cabinet.lip
      return [
        { position: at(0, 0, -0.24), scale: new THREE.Vector3(outer.width, outer.height, 0.42), yaw: cabinet.yaw },
        { position: at(0, (cabinet.height + band) / 2, 0), scale: new THREE.Vector3(outer.width, band, 0.06), yaw: cabinet.yaw },
        { position: at(0, -(cabinet.height + band) / 2, 0), scale: new THREE.Vector3(outer.width, band, 0.06), yaw: cabinet.yaw },
        { position: at((cabinet.width + band) / 2, 0, 0), scale: new THREE.Vector3(band, cabinet.height, 0.06), yaw: cabinet.yaw },
        { position: at(-(cabinet.width + band) / 2, 0, 0), scale: new THREE.Vector3(band, cabinet.height, 0.06), yaw: cabinet.yaw },
      ]
    }),
  )
  // Each blade sign hangs from two arms reaching back to its facade, 0.35 m behind the sign's inner edge.
  const brackets = placeBoxes(
    new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steel, layout.signs.length * 2),
    layout.signs.flatMap(sign => [0.45, sign.height - 0.45].map((height) => {
      const inner = Math.abs(sign.x) + sign.width / 2
      return {
        position: new THREE.Vector3(Math.sign(sign.x) * (inner + 0.175), sign.y + height, sign.z - 0.24),
        scale: new THREE.Vector3(0.5, 0.08, 0.1),
      }
    })),
  )
  // The kerbs line the ground shader's road edge at |x| = 10.
  const course = kerbRuns().flatMap(run => [-1, 1].map(side => ({
    position: new THREE.Vector3(side * 10.15, 0.075, (run.from + run.to) / 2),
    scale: new THREE.Vector3(0.3, 0.15, run.from - run.to),
  })))
  const kerbs = placeBoxes(
    new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), solidMaterial(shared, 0.09, 0.15, undefined, 'masonry', true), course.length),
    course,
  )
  return [...units, masts, posts, lenses, housings, brackets, kerbs]
}

/** Instance unit boxes as solids, each turned about X and then Z through its centre. */
function placeSolids(mesh: THREE.InstancedMesh, solids: readonly SplashSolid[]): THREE.InstancedMesh {
  const matrix = new THREE.Matrix4()
  const rotation = new THREE.Quaternion()
  const turn = new THREE.Euler(0, 0, 0, 'ZYX')
  const position = new THREE.Vector3()
  const scale = new THREE.Vector3()
  solids.forEach((solid, index) => {
    rotation.setFromEuler(turn.set(solid.turnX ?? 0, 0, solid.turnZ ?? 0, 'ZYX'))
    position.set(solid.x, solid.y, solid.z)
    mesh.setMatrixAt(index, matrix.compose(position, rotation, scale.set(solid.width, solid.height, solid.depth)))
  })
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}

function solidBoxes(solids: readonly SplashSolid[], material: THREE.ShaderMaterial): THREE.InstancedMesh {
  return placeSolids(new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, solids.length), solids)
}

/** A sagging cable as points from one end to the other. */
function cablePoints(cable: SplashCable): THREE.Vector3[] {
  return Array.from({ length: 25 }, (_, index) => {
    const share = index / 24
    return new THREE.Vector3(
      cable.from.x + (cable.to.x - cable.from.x) * share,
      cable.from.y + (cable.to.y - cable.from.y) * share - 4 * cable.sag * share * (1 - share),
      cable.from.z + (cable.to.z - cable.from.z) * share,
    )
  })
}

/**
 * Street level: the frontage relief, street furniture with its lit posters and signals, and the cables and lanterns
 * strung over the avenue.
 */
function createStreet(
  layout: SplashCityLayout, shared: SharedUniforms, atlas: SplashAtlas,
): { objects: THREE.Object3D[]; lights: WorldLight[] } {
  const relief = splashFacadeRelief(layout)
  const furniture = splashStreetFurniture(layout)
  const { cables, lanterns } = splashCables(layout)
  const steel = solidMaterial(shared, 0.035, 0.35, undefined, 'steel', true)
  const tint = new THREE.Color()
  const awnings = solidBoxes(relief.awnings, solidMaterial(shared, 1, 0.08, undefined, 'fabric', true))
  relief.awnings.forEach((awning, index) => { awnings.setColorAt(index, tint.setRGB(...awning.tint)) })
  const tubes = cables.map(cable => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints(cable)), 32, 0.035, 5, false))
  const strung = tubes.length === 0 ? new THREE.BufferGeometry() : mergeGeometries(tubes, false)
  for (const tube of tubes) tube.dispose()
  const lanternGlow = new THREE.Color(1.5, 0.11, 0.06)
  const lanternMesh = placeBoxes(
    new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 18, 12), solidMaterial(shared, 0.02, 0, lanternGlow, 'lantern'), lanterns.length),
    lanterns.map(lantern => ({ position: new THREE.Vector3(lantern.x, lantern.y, lantern.z), scale: new THREE.Vector3(1, 1.3, 1) })),
  )
  const cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 18)
  const posters = furniture.posters.map(poster => ({ ...poster, yaw: 0 }))
  const objects: THREE.Object3D[] = [
    solidBoxes(relief.masonry, solidMaterial(shared, 0.075, 0.1, undefined, 'masonry', true)),
    solidBoxes(relief.steel, steel),
    awnings,
    solidBoxes(furniture.steel, steel),
    placeSolids(new THREE.InstancedMesh(cylinder, solidMaterial(shared, 0.035, 0.35, undefined, 'steel'), furniture.round.length), furniture.round),
    placeSolids(
      new THREE.InstancedMesh(cylinder, solidMaterial(shared, new THREE.Color(0.34, 0.02, 0.02), 0.3, undefined, 'painted'), furniture.red.length),
      furniture.red,
    ),
    solidBoxes(furniture.glow, solidMaterial(shared, 0.02, 0.2, undefined, 'vending', true)),
    new THREE.Mesh(strung, solidMaterial(shared, 0.02, 0.2)),
    lanternMesh,
    createPanels(shared, posters, atlas, AD_GLOW.posters, true),
  ]
  const lantern = [1.4, 0.1, 0.05] as const
  const at = (point: SplashVector): THREE.Vector3 => new THREE.Vector3(point.x, point.y, point.z)
  const lights: WorldLight[] = [
    ...furniture.lights.map(light => ({ position: at(light), color: light.color, radius: light.radius })),
    ...lanterns.map(point => ({ position: at(point), color: lantern, radius: 0.32 })),
  ]
  return { objects, lights }
}

/** Aviation lights on masts and the plaza crown, and lamp heads along the avenue. */
function cityLights(layout: SplashCityLayout): WorldLight[] {
  const lights: WorldLight[] = []
  const light = (x: number, y: number, z: number, color: readonly [number, number, number], radius: number): void => {
    lights.push({ position: new THREE.Vector3(x, y, z), color, radius })
  }
  for (const mast of layout.antennas) light(mast.x, mast.y + mast.height, mast.z, [1.6, 0.08, 0.06], Math.max(0.55, mast.radius * 0.5))
  for (const lamp of lampPositions()) {
    light(lamp.x - lamp.side * LAMP_HEAD.reach, SPLASH_LAMPS.height - LAMP_HEAD.drop, lamp.z, [1.8, 1.25, 0.8], 0.4)
  }
  for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]] as const) {
    light(SPLASH_TOWER.x + dx, SPLASH_TOWER.deck + 0.6, SPLASH_TOWER.z + dz, [1.8, 0.1, 0.08], 0.6)
  }
  return lights
}

function laneAttributes(lanes: readonly SplashLane[]): { lane: Float32Array; motion: Float32Array } {
  const lane = new Float32Array(lanes.length * 4)
  const motion = new Float32Array(lanes.length * 4)
  lanes.forEach((entry, index) => {
    lane.set([entry.origin.x, entry.origin.y, entry.origin.z, entry.speed], index * 4)
    motion.set([entry.directionX, entry.directionZ, entry.phase, entry.span], index * 4)
  })
  return { lane, motion }
}

/** Spinners and haulers on their lanes, their lights, and the distant light-only traffic. */
/** One instanced mesh of lane-driven craft or cars; `define` selects the panel seams the craft shader draws. */
function laneMesh(
  shared: SharedUniforms,
  entries: readonly (SplashLane & { readonly paint: readonly [number, number, number] })[],
  base: THREE.BufferGeometry,
  kind: CraftKind,
): THREE.Mesh {
  const { lane, motion } = laneAttributes(entries)
  const looks = new Float32Array(entries.length * 4)
  entries.forEach((entry, index) => { looks.set([...entry.paint, entry.bob], index * 4) })
  const mesh = new THREE.Mesh(
    instanced(base, entries.length, {
      aLane: new THREE.InstancedBufferAttribute(lane, 4),
      aMotion: new THREE.InstancedBufferAttribute(motion, 4),
      aCraft: new THREE.InstancedBufferAttribute(looks, 4),
    }),
    cityMaterial(shared, CRAFT_VERTEX_GLSL, CRAFT_FRAGMENT_GLSL, { uCraft: { value: CRAFT_KIND[kind] } }, { defines: { LANE: '' } }),
  )
  mesh.frustumCulled = false
  return mesh
}

function createTraffic(shared: SharedUniforms, viewport: { value: THREE.Vector2 }): THREE.Object3D[] {
  const flyers = splashFlyers()
  const cars = splashCars()
  const objects: THREE.Object3D[] = [
    laneMesh(shared, flyers.filter(flyer => flyer.kind === SPLASH_CRAFT.spinner), createSpinnerGeometry(), 'spinner'),
    laneMesh(shared, flyers.filter(flyer => flyer.kind === SPLASH_CRAFT.hauler), createHaulerGeometry(), 'hauler'),
    laneMesh(shared, cars, createCarGeometry(), 'car'),
  ]
  const lights: { lane: SplashLane; light: ModelLight }[] = [
    ...flyers.flatMap((flyer) => {
      const mounted = flyer.kind === SPLASH_CRAFT.hauler ? HAULER_LIGHTS : SPINNER_LIGHTS
      return mounted.map(light => ({ lane: flyer, light }))
    }),
    ...cars.flatMap(car => CAR_LIGHTS.map(light => ({ lane: car, light }))),
  ]
  for (const vehicle of splashTraffic()) {
    lights.push({
      lane: vehicle,
      light: {
        offset: [0, 0, 0],
        color: vehicle.headlight ? [1.1, 1.0, 0.9] : [1.2, 0.06, 0.04],
        radius: vehicle.radius,
        kind: vehicle.headlight ? 1 : 2,
        trail: vehicle.trail,
      },
    })
  }
  const { lane, motion } = laneAttributes(lights.map(entry => entry.lane))
  const offsets = new Float32Array(lights.length * 4)
  const colors = new Float32Array(lights.length * 4)
  const kinds = new Float32Array(lights.length * 2)
  lights.forEach(({ lane: owner, light }, index) => {
    offsets.set([...light.offset, owner.bob], index * 4)
    colors.set([...light.color, light.radius], index * 4)
    kinds.set([light.kind, light.trail], index * 2)
  })
  objects.push(lightMesh(shared, viewport, CRAFT_LIGHT_VERTEX_GLSL, instancedQuad(lights.length, {
    aLane: new THREE.InstancedBufferAttribute(lane, 4),
    aMotion: new THREE.InstancedBufferAttribute(motion, 4),
    aOffset: new THREE.InstancedBufferAttribute(offsets, 4),
    aLight: new THREE.InstancedBufferAttribute(colors, 4),
    aKind: new THREE.InstancedBufferAttribute(kinds, 2),
  })))
  return objects
}

function createRain(shared: SharedUniforms, viewport: { value: THREE.Vector2 }): THREE.Mesh {
  const count = 2400
  const drops = new Float32Array(count * 4)
  let state = 0x2a17
  for (let index = 0; index < drops.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    drops[index] = state / 4294967296
  }
  const rain = lightMesh(shared, viewport, RAIN_VERTEX_GLSL, instancedQuad(count, {
    aDrop: new THREE.InstancedBufferAttribute(drops, 4),
  }), { uRainBox: { value: new THREE.Vector3(56, 40, 56) }, uRain: { value: 1 } })
  rain.layers.set(RAIN_LAYER)
  return rain
}

function createPanels(
  shared: SharedUniforms,
  panels: readonly { x: number; y: number; z: number; yaw: number; width: number; height: number; slot: number }[],
  atlas: SplashAtlas,
  glow: number,
  screen: boolean,
  offset: { value: THREE.Vector3 } = { value: new THREE.Vector3() },
): THREE.Mesh {
  const placement = new Float32Array(panels.length * 4)
  const shape = new Float32Array(panels.length * 4)
  panels.forEach((panel, index) => {
    placement.set([panel.x, panel.y, panel.z, panel.yaw], index * 4)
    shape.set([panel.width, panel.height, panel.slot, glow], index * 4)
  })
  const mesh = new THREE.Mesh(
    instancedQuad(panels.length, {
      aPanel: new THREE.InstancedBufferAttribute(placement, 4),
      aShape: new THREE.InstancedBufferAttribute(shape, 4),
    }),
    cityMaterial(shared, PANEL_VERTEX_GLSL, PANEL_FRAGMENT_GLSL, {
      uAtlas: { value: atlas.texture },
      uGrid: { value: atlas.grid },
      uSlotAspect: { value: atlas.aspect },
      uScreen: { value: screen ? 1 : 0 },
      uPanelOffset: offset,
    }),
  )
  mesh.frustumCulled = false
  return mesh
}

/** Uniforms the landmark shader reads; `axis`, `radius`, and `twistRate` only matter to the twisting tower. */
function landmarkUniforms(seed: number, axis = new THREE.Vector2(), radius = 1, twistRate = 0): Record<string, { value: unknown }> {
  return { uSeed: { value: seed }, uAxis: { value: axis }, uRadius: { value: radius }, uTwistRate: { value: twistRate } }
}

/** Place one landmark model; gates and openers turn their fronts toward the resting camera. */
function placeLandmark(
  shared: SharedUniforms,
  model: LandmarkModel,
  plot: { readonly x: number; readonly z: number },
  faceCamera: boolean,
  uniforms: Record<string, { value: unknown }>,
): { group: THREE.Group; lights: WorldLight[] } {
  const { x, z } = plot
  const group = new THREE.Group()
  for (const surface of model.surfaces) {
    const placement = {
      ...uniforms,
      uLandmark: { value: LANDMARK_KIND[surface.kind] },
      uDiagrid: { value: surface.diagrid === true ? 1 : 0 },
    }
    group.add(new THREE.Mesh(surface.geometry, cityMaterial(shared, LANDMARK_VERTEX_GLSL, LANDMARK_FRAGMENT_GLSL, placement)))
  }
  for (const outline of model.outlines) {
    const curve = new THREE.CatmullRomCurve3([...outline.points], false, 'centripetal')
    const tube = new THREE.TubeGeometry(curve, outline.points.length * 2, outline.radius, 6, false)
    group.add(new THREE.Mesh(tube, solidMaterial(shared, 0.02, 0, new THREE.Color(...outline.color))))
  }
  group.position.set(x, 0, z)
  if (faceCamera) {
    const rest = splashCameraAt(1).position
    group.rotation.y = Math.atan2(rest.x - x, rest.z - z)
  }
  group.updateMatrixWorld(true)
  return { group, lights: modelLights(model.lights, group.matrixWorld) }
}

function createLandmarks(shared: SharedUniforms): { objects: THREE.Object3D[]; lights: WorldLight[] } {
  const { pearl, gate, twist, opener } = SPLASH_LANDMARKS
  const twistUniforms = landmarkUniforms(0.83, new THREE.Vector2(twist.x, twist.z), twist.radius, TWIST_RATE)
  const placed = [
    placeLandmark(shared, createPearlTower(), pearl, false, landmarkUniforms(0.31)),
    placeLandmark(shared, createGateTower(), gate, true, landmarkUniforms(0.47)),
    placeLandmark(shared, createTwistTower(), twist, false, twistUniforms),
    placeLandmark(shared, createOpenerTower(), opener, true, landmarkUniforms(0.62)),
  ]
  return { objects: placed.map(entry => entry.group), lights: placed.flatMap(entry => entry.lights) }
}

/** Advertising airship drifting over the avenue; its screen and lights follow the hull. */
function createBlimp(shared: SharedUniforms, viewport: { value: THREE.Vector2 }, atlas: SplashAtlas): Animated {
  const hull = new THREE.Mesh(
    createBlimpGeometry(SPLASH_BLIMP.length, SPLASH_BLIMP.radius),
    cityMaterial(shared, CRAFT_VERTEX_GLSL, CRAFT_FRAGMENT_GLSL, {
      uPaint: { value: new THREE.Color(0.035, 0.034, 0.04) },
      uCraft: { value: CRAFT_KIND.blimp },
    }),
  )
  const offset = { value: new THREE.Vector3(SPLASH_BLIMP.x, SPLASH_BLIMP.y, SPLASH_BLIMP.z) }
  const panel = {
    x: 0, y: BLIMP_SCREEN.y, z: BLIMP_SCREEN.z, yaw: 0, width: BLIMP_SCREEN.width, height: BLIMP_SCREEN.height,
    slot: SPLASH_SCREEN_SLOT.airship,
  }
  const screen = createPanels(shared, [panel], atlas, AD_GLOW.airship, true, offset)
  const lights = pointLights(shared, viewport, localLights(BLIMP_LIGHTS), offset)
  return {
    objects: [hull, screen, lights],
    update: (_timeline, seconds) => {
      offset.value.set(SPLASH_BLIMP.x + Math.sin(seconds * 0.12) * 1.5, SPLASH_BLIMP.y + Math.sin(seconds * 0.5) * 0.4, SPLASH_BLIMP.z)
      hull.position.copy(offset.value)
    },
    dispose: () => {},
  }
}

/** Elevated guideway on pylons along the rail cross street and the train gliding along it. */
function createMaglev(shared: SharedUniforms, viewport: { value: THREE.Vector2 }): Animated {
  const { z, height, span } = SPLASH_MAGLEV
  const metal = solidMaterial(shared, 0.045, 0.3)
  const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 2.2, 3.2), metal)
  beam.position.set(0, height - 1.1, z)
  const strips = new THREE.Mesh(
    mergeGeometries([
      new THREE.BoxGeometry(span, 0.12, 0.05).translate(0, height - 0.5, z + 1.63),
      new THREE.BoxGeometry(span, 0.12, 0.05).translate(0, height - 0.5, z - 1.63),
    ], false),
    solidMaterial(shared, 0.02, 0, new THREE.Color(0.18, 0.9, 1.35)),
  )
  const pylonX: number[] = []
  for (let x = -span / 2 + 20; x < span / 2; x += 45) if (Math.abs(x) > 14) pylonX.push(x)
  const pylons = placeBoxes(
    new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1, 2.2).translate(0, 0.5, 0), metal, pylonX.length),
    pylonX.map(x => ({ position: new THREE.Vector3(x, 0, z), scale: new THREE.Vector3(1, height - 2.2, 1) })),
  )
  const paint = { uPaint: { value: new THREE.Color(0.46, 0.47, 0.5) } }
  const train = new THREE.Mesh(
    createTrainGeometry(),
    cityMaterial(shared, CRAFT_VERTEX_GLSL, CRAFT_FRAGMENT_GLSL, { ...paint, uCraft: { value: CRAFT_KIND.train } }),
  )
  const offset = { value: new THREE.Vector3(0, height + 1.95, z) }
  const lights = pointLights(shared, viewport, localLights(trainLights()), offset)
  return {
    objects: [beam, strips, pylons, train, lights],
    update: (_timeline, seconds) => {
      offset.value.x = splashTrainX(seconds)
      train.position.copy(offset.value)
    },
    dispose: () => {},
  }
}

/** Crown ring, projector, beams, the mark whose strokes light up from the beam's contact point, and the sparks feeding it. */
function createProjector(shared: SharedUniforms, viewport: { value: THREE.Vector2 }): Animated {
  const { x, z, deck } = SPLASH_TOWER
  const metal = solidMaterial(shared, 0.04, 0.4)
  const ringGlow = new THREE.Color(0, 0, 0)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13.5, 0.5, 12, 160), solidMaterial(shared, 0.03, 0.2, ringGlow))
  ring.rotation.x = Math.PI / 2
  ring.position.set(x, deck + 0.9, z)
  const innerGlow = new THREE.Color(0, 0, 0)
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.22, 10, 96), solidMaterial(shared, 0.03, 0.2, innerGlow))
  innerRing.rotation.x = Math.PI / 2
  innerRing.position.set(x, deck + 2.5, z)
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 4.4, 2.7, 48), metal)
  housing.position.set(x, deck + 1.35, z)
  const lensGlow = new THREE.Color(0, 0, 0)
  const lens = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), solidMaterial(shared, 0.02, 0.1, lensGlow))
  lens.rotation.x = -Math.PI / 2
  lens.position.set(x, deck + 2.72, z)
  const fins = placeBoxes(
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 3.2, 3.4).translate(0, 1.6, 0), metal, 12),
    Array.from({ length: 12 }, (_, index) => {
      const angle = index / 12 * Math.PI * 2
      const position = new THREE.Vector3(x + Math.sin(angle) * 9.4, deck, z + Math.cos(angle) * 9.4)
      return { position, scale: new THREE.Vector3(1, 1, 1), yaw: angle }
    }),
  )

  const { geometry: markGeometry, project } = createMarkGeometry(SPLASH_MARK.width)
  const mask = rasterizeMark(MARK_FIELD_SIZE)
  const travel = markIgnitionField(mask, MARK_FIELD_SIZE, markIgnitionSeed(mask, MARK_FIELD_SIZE))
  const field = createIgnitionTexture(travel, MARK_FIELD_SIZE)
  const ignite = { value: 0 }
  const dormant = { value: 0 }
  const mark = new THREE.Mesh(markGeometry, cityMaterial(shared, MARK_VERTEX_GLSL, MARK_FRAGMENT_GLSL, {
    uField: { value: field },
    uIgnite: ignite,
    uDormant: dormant,
  }))
  const rest = splashCameraAt(1).position
  // The mark leans toward the resting camera so its face reads without foreshortening.
  const tilt = Math.atan2(SPLASH_MARK.y - rest.y, rest.z - SPLASH_MARK.z)
  mark.position.set(SPLASH_MARK.x, SPLASH_MARK.y, SPLASH_MARK.z)
  mark.rotation.x = tilt
  mark.updateMatrixWorld()

  const lensTop = deck + 2.75
  const markBottom = SPLASH_MARK.y + (markGeometry.boundingBox?.min.y ?? -SPLASH_MARK.width * 0.3) * Math.cos(tilt)
  const beam = (bottomRadius: number, topRadius: number, top: number, strength: number): Beam => {
    const power = { value: 0 }
    const reach = { value: 0 }
    const length = top - lensTop
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius, bottomRadius, length, 64, 1, true),
      cityMaterial(shared, BEAM_VERTEX_GLSL, BEAM_FRAGMENT_GLSL, { uBeam: power, uBeamReach: reach }, {
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide,
      }),
    )
    mesh.position.set(x, lensTop + length / 2, z)
    return { mesh, strength, power, reach }
  }
  const core = beam(1.5, 1.1, markBottom + 0.6, 1)
  const volume = beam(3.4, SPLASH_MARK.width * 0.46, SPLASH_MARK.y, 0.32)

  // Each spark rises inside the beam, fans out below the mark, and lands as the ignition front reaches its stroke point.
  let state = 0x51a4
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const points = sampleMarkPoints(mask, travel, MARK_FIELD_SIZE, SPARK_COUNT, random)
  const from = new Float32Array(points.length * 3)
  const via = new Float32Array(points.length * 3)
  const to = new Float32Array(points.length * 3)
  const timing = new Float32Array(points.length * 2)
  points.forEach((point, index) => {
    const angle = random() * Math.PI * 2
    const spread = Math.sqrt(random()) * 1.2
    const target = project(point.u, point.v, 0.9).applyMatrix4(mark.matrixWorld)
    from.set([x + Math.cos(angle) * spread, lensTop + 0.4, z + Math.sin(angle) * spread], index * 3)
    via.set([x + Math.cos(angle) * spread * 1.8, markBottom - 3 - random() * 5, z + Math.sin(angle) * spread * 1.8], index * 3)
    to.set([target.x, target.y, target.z], index * 3)
    const arrival = markIgnitionArrival(point.travel, SPLASH_TIMINGS.igniteMs, SPLASH_TIMINGS.igniteRampMs, MARK_FRONT_SCALE)
    timing.set([Math.max(SPLASH_TIMINGS.sparksMs, arrival - 620 - random() * 380), arrival], index * 2)
  })
  const sparkTimeline = { value: 0 }
  const sparks = lightMesh(shared, viewport, SPARK_VERTEX_GLSL, instancedQuad(points.length, {
    aFrom: new THREE.InstancedBufferAttribute(from, 3),
    aVia: new THREE.InstancedBufferAttribute(via, 3),
    aTo: new THREE.InstancedBufferAttribute(to, 3),
    aTiming: new THREE.InstancedBufferAttribute(timing, 2),
  }), { uTimeline: sparkTimeline })

  return {
    objects: [ring, innerRing, housing, lens, fins, core.mesh, volume.mesh, mark, sparks],
    update: (timeline, seconds) => {
      const { projectorMs, projectorRampMs, beamMs, beamRampMs, igniteMs, igniteRampMs } = SPLASH_TIMINGS
      const projector = splashPhase(timeline, projectorMs, projectorRampMs)
      const reach = splashPhase(timeline, beamMs, beamRampMs)
      const lit = splashPhase(timeline, igniteMs, igniteRampMs)
      ringGlow.setRGB(2.3 * projector, 0.12 * projector, 0.09 * projector)
      innerGlow.setRGB(0.25 * projector, 1.2 * projector, 1.7 * projector)
      lensGlow.setRGB(3.2 * projector, 0.9 * projector, 0.7 * projector)
      for (const part of [core, volume]) {
        part.power.value = part.strength * projector * (1 - 0.35 * lit)
        part.reach.value = reach * 1.04
      }
      dormant.value = splashPhase(timeline, beamMs + beamRampMs * 0.6, 500)
      ignite.value = lit
      sparkTimeline.value = timeline
      const settle = splashPhase(timeline, igniteMs + igniteRampMs - 200, 1600)
      mark.rotation.y = 0.16 * Math.sin(seconds * 0.42) * settle
      shared.uHolo.value = 0.22 * projector + 0.78 * lit
    },
    dispose: () => { field.dispose() },
  }
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object instanceof THREE.Mesh
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof Reflector) {
      object.dispose()
      object.geometry.dispose()
      return
    }
    if (!isMesh(object)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material instanceof THREE.ShaderMaterial) {
        for (const uniform of Object.values(material.uniforms)) {
          const value: unknown = uniform.value
          if (value instanceof THREE.CanvasTexture) value.dispose()
        }
      }
      material.dispose()
    }
  })
}

function renderScene(canvas: HTMLCanvasElement, reducedMotion: boolean, onReady: () => void): SplashScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false })
  let shaderFailed = false
  renderer.debug.onShaderError = (gl, _program, vertexShader, fragmentShader) => {
    shaderFailed = true
    console.error('Tomato splash: shader compilation failed', gl.getShaderInfoLog(vertexShader), gl.getShaderInfoLog(fragmentShader))
  }
  renderer.setClearColor(CLEAR_COLOR, 1)
  let pixelRatio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1)
  renderer.setPixelRatio(pixelRatio)

  const shared: SharedUniforms = {
    uTime: { value: 0 },
    uDetail: { value: 1 },
    uHoloPos: { value: new THREE.Vector3(SPLASH_MARK.x, SPLASH_MARK.y, SPLASH_MARK.z) },
    uHolo: { value: 0 },
    uFogDensity: { value: 0.0034 },
    uFogFalloff: { value: 0.0125 },
    uLamps: {
      value: new THREE.Vector4(
        SPLASH_LAMPS.x - LAMP_HEAD.reach, SPLASH_LAMPS.height - LAMP_HEAD.drop, SPLASH_AVENUE.start, SPLASH_LAMPS.spacing,
      ),
    },
    uLampRows: { value: lampPositions().length / 2 },
  }
  const viewport = { value: new THREE.Vector2(1, 1) }
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 4000)
  camera.layers.enable(RAIN_LAYER)

  const layout = splashCityLayout()
  const anisotropy = renderer.capabilities.getMaxAnisotropy()
  const screenAtlas = createScreenAtlas(anisotropy)
  const ground = createGround(shared)
  ground.getReflectionCamera(camera).layers.disable(RAIN_LAYER)
  const landmarks = createLandmarks(shared)
  const animated = [createProjector(shared, viewport), createBlimp(shared, viewport, screenAtlas), createMaglev(shared, viewport)]
  const signs = layout.signs.map(sign => ({ ...sign, y: sign.y + sign.height / 2, yaw: 0 }))
  const street = createStreet(layout, shared, screenAtlas)
  scene.add(
    createSky(shared),
    ground,
    ...createCity(layout, shared, createFasciaAtlas(splashShopSlots(layout).shops, anisotropy)),
    ...createProps(layout, shared),
    ...street.objects,
    ...landmarks.objects,
    createPanels(shared, signs, createSignAtlas(anisotropy), AD_GLOW.signs, false),
    createPanels(shared, layout.screens, screenAtlas, AD_GLOW.screens, true),
    ...animated.flatMap(entry => entry.objects),
    pointLights(shared, viewport, [...cityLights(layout), ...landmarks.lights, ...street.lights]),
    ...createTraffic(shared, viewport),
    createRain(shared, viewport),
  )
  const post = createSplashPost(renderer, scene, camera)

  let origin = 0
  let started = false
  let skipped = false
  let stopped = false
  let frame = 0
  let samples = 0
  let slowSamples = 0
  let lastStamp = 0
  let adapted = false

  let sizedWidth = -1
  let sizedHeight = -1

  const timelineAt = (now: number): number =>
    (skipped || reducedMotion ? SPLASH_TIMINGS.holdMs : Math.min(SPLASH_TIMINGS.holdMs, now - origin))
  const pose = (timeline: number): void => {
    const shot = splashCameraAt(timeline / SPLASH_TIMINGS.cameraMs)
    camera.position.set(shot.position.x, shot.position.y, shot.position.z)
    camera.fov = shot.fov
    camera.updateProjectionMatrix()
    camera.lookAt(shot.target.x, shot.target.y, shot.target.z)
  }
  const draw = (now: number): void => {
    // Size events need the page's rendering steps; comparing every frame also covers a window laid out while hidden.
    if (canvas.clientWidth !== sizedWidth || canvas.clientHeight !== sizedHeight) resize()
    const timeline = timelineAt(now)
    const seconds = (now - origin) / 1000
    shared.uTime.value = seconds
    post.time.value = seconds
    pose(timeline)
    for (const entry of animated) entry.update(timeline, seconds)
    post.exposure.value = splashPhase(timeline, 0, SPLASH_TIMINGS.fadeInMs)
    post.composer.render()
  }
  const resize = (): void => {
    sizedWidth = canvas.clientWidth
    sizedHeight = canvas.clientHeight
    // A hidden window can report zero size; zero-sized attachments leave every target incomplete.
    const width = Math.max(1, sizedWidth)
    const height = Math.max(1, sizedHeight)
    const ratio = Math.min(pixelRatio, Math.sqrt(MAX_DRAWING_PIXELS / (width * height)))
    renderer.setPixelRatio(ratio)
    renderer.setSize(width, height, false)
    post.setSize(width, height, ratio)
    const mirrorPixels = (size: number): number => Math.max(1, Math.round(size * ratio * MIRROR_SCALE))
    ground.getRenderTarget().setSize(mirrorPixels(width), mirrorPixels(height))
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    // Resizing clears the canvas; the reduced-motion frame has no loop to repaint it.
    if (started && reducedMotion && !stopped) draw(performance.now())
  }
  // One downgrade, decided within the first 0.4 s while the exposure is still rising from black, so the change in
  // sharpness never shows; repeated switching would itself read as flicker.
  const adapt = (stamp: number): void => {
    if (adapted) return
    if (lastStamp > 0) {
      samples += 1
      if (samples > 4 && stamp - lastStamp > 24) slowSamples += 1
    }
    lastStamp = stamp
    if (samples < 24) return
    adapted = true
    if (slowSamples > 10 && pixelRatio > MIN_PIXEL_RATIO) {
      pixelRatio = Math.max(MIN_PIXEL_RATIO, pixelRatio * 0.72)
      resize()
    }
  }
  const tick = (stamp: number): void => {
    if (stopped) return
    frame = requestAnimationFrame(tick)
    draw(performance.now())
    adapt(stamp)
  }
  const start = (): void => {
    if (stopped) return
    if (shaderFailed) throw new Error('splash: a city shader failed to compile')
    origin = performance.now()
    started = true
    onReady()
    if (reducedMotion) draw(origin)
    else frame = requestAnimationFrame(tick)
  }
  const fallback = (error: unknown): void => {
    console.error('Tomato splash: WebGL scene failed; using the static brand.', error)
    stopped = true
    cancelAnimationFrame(frame)
    document.documentElement.dataset.scene = 'fallback'
    if (!started) {
      started = true
      onReady()
    }
  }

  // The single reduced-motion frame has no loop to notice a new size, so the canvas is also observed.
  const sizing = new ResizeObserver(resize)
  sizing.observe(canvas)
  resize()
  pose(reducedMotion ? SPLASH_TIMINGS.holdMs : 0)
  // Compile every program before the clock starts, so slow shader translation cannot skip the opening.
  // Programs depend on the output color space, so they compile against the composer's linear scene target.
  renderer.setRenderTarget(post.composer.renderTarget1)
  const warmUp = renderer.compileAsync(scene, camera)
  renderer.setRenderTarget(null)
  warmUp
    .then(() => {
      if (stopped) return
      post.exposure.value = 0
      post.composer.render()
      start()
    })
    .catch(fallback)

  return {
    finish: () => {
      skipped = true
      if (started && reducedMotion && !stopped) draw(performance.now())
    },
    stop: () => {
      stopped = true
      cancelAnimationFrame(frame)
      sizing.disconnect()
      for (const entry of animated) entry.dispose()
      disposeScene(scene)
      post.dispose()
      renderer.dispose()
    },
  }
}

/**
 * Start the procedural city, falling back to the static local brand when WebGL is unavailable.
 * @param canvas - target WebGL canvas; null selects the static fallback.
 * @param reducedMotion - render only the composed final frame when true.
 * @param onReady - called once when the timeline starts: after shader warm-up, or immediately on fallback.
 * @returns final-frame and disposal actions owned by the splash document.
 */
export function startSplashScene(canvas: HTMLCanvasElement | null, reducedMotion: boolean, onReady: () => void): SplashScene {
  if (canvas === null) {
    document.documentElement.dataset.scene = 'fallback'
    onReady()
    return staticScene
  }
  try {
    return renderScene(canvas, reducedMotion, onReady)
  } catch (error) {
    console.error('Tomato splash: WebGL initialization failed; using the static brand.', error)
    document.documentElement.dataset.scene = 'fallback'
    onReady()
    return staticScene
  }
}
