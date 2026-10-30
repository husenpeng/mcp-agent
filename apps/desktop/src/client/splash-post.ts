/**
 * HDR post-processing for the splash: a multisampled scene target, a non-finite guard, highlight-only bloom, and a lens
 * grade with sharpening.
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

/** Composer and the grade controls the scene animates. */
export interface SplashPost {
  readonly composer: EffectComposer
  /** Linear exposure multiplier; 0 renders black. */
  readonly exposure: { value: number }
  /** Ambient seconds that animate the dither pattern. */
  readonly time: { value: number }
  /**
   * Resize every target.
   * @param width - CSS pixel width.
   * @param height - CSS pixel height.
   * @param pixelRatio - device pixels per CSS pixel.
   */
  setSize(width: number, height: number, pixelRatio: number): void
  dispose(): void
}

const GRADE_VERTEX_GLSL = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * ACES fitted tone curve (Hill), contrast-adaptive sharpening, vignette, cool shadow toning, sRGB encoding, and dither.
 * Sharpening follows AMD FidelityFX CAS on the tone-mapped image: it restores edges the MSAA resolve and bloom soften,
 * and its weight falls off where the neighbourhood already spans the full range, so highlights do not ring.
 */
const GRADE_FRAGMENT_GLSL = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uExposure;
uniform float uTime;
uniform vec2 uTexel;
varying vec2 vUv;

const float SHARPEN_PEAK = -1.0 / 6.0;

vec3 rrtAndOdtFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}

vec3 acesFilmic(vec3 color) {
  const mat3 inputMatrix = mat3(
    vec3(0.59719, 0.07600, 0.02840),
    vec3(0.35458, 0.90834, 0.13383),
    vec3(0.04823, 0.01566, 0.83777));
  const mat3 outputMatrix = mat3(
    vec3(1.60475, -0.10208, -0.00327),
    vec3(-0.53108, 1.10813, -0.07276),
    vec3(-0.07367, -0.00605, 1.07602));
  return clamp(outputMatrix * rrtAndOdtFit(inputMatrix * (color / 0.6)), 0.0, 1.0);
}

vec3 srgbEncode(vec3 color) {
  return mix(color * 12.92, 1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), color));
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 toneMapped(vec2 uv) {
  return acesFilmic(texture2D(tDiffuse, uv).rgb * uExposure);
}

void main() {
  vec3 centre = toneMapped(vUv);
  vec3 north = toneMapped(vUv + vec2(0.0, uTexel.y));
  vec3 south = toneMapped(vUv - vec2(0.0, uTexel.y));
  vec3 east = toneMapped(vUv + vec2(uTexel.x, 0.0));
  vec3 west = toneMapped(vUv - vec2(uTexel.x, 0.0));
  vec3 low = min(centre, min(min(north, south), min(east, west)));
  vec3 high = max(centre, max(max(north, south), max(east, west)));
  vec3 weight = sqrt(clamp(min(low, 1.0 - high) / max(high, vec3(1e-4)), 0.0, 1.0)) * SHARPEN_PEAK;
  vec3 color = max((centre + (north + south + east + west) * weight) / (1.0 + 4.0 * weight), 0.0);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color *= mix(vec3(0.93, 1.0, 1.14), vec3(1.0), smoothstep(0.0, 0.3, luma));
  vec2 centred = vUv - 0.5;
  color *= 1.0 - 0.45 * smoothstep(0.08, 0.42, dot(centred, centred));
  color = srgbEncode(color);
  color += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 61.0) - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(color, 1.0);
}
`

/**
 * Replace non-finite radiance before bloom: one NaN pixel would otherwise spread through every blur level into a
 * black blotch, and infinities would flood the bloom.
 */
const SANITIZE_FRAGMENT_GLSL = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  color = mix(color, vec3(0.0), vec3(isnan(color)));
  gl_FragColor = vec4(clamp(color, 0.0, 64.0), 1.0);
}
`

/**
 * Build the post chain. The scene renders into a 4× multisampled half-float target; bloom only lifts radiance above 1.
 * @param renderer - renderer that owns every target.
 * @param scene - city scene.
 * @param camera - city camera.
 * @returns the composer, its grade controls, and resize/dispose actions.
 */
export function createSplashPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): SplashPost {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))
  const sanitize = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: GRADE_VERTEX_GLSL,
    fragmentShader: SANITIZE_FRAGMENT_GLSL,
    depthTest: false,
    depthWrite: false,
  })
  const sanitizePass = new ShaderPass(sanitize)
  composer.addPass(sanitizePass)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.32, 1.0)
  composer.addPass(bloom)
  const exposure = { value: 0 }
  const time = { value: 0 }
  const texel = { value: new THREE.Vector2(1, 1) }
  const grade = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uExposure: exposure, uTime: time, uTexel: texel },
    vertexShader: GRADE_VERTEX_GLSL,
    fragmentShader: GRADE_FRAGMENT_GLSL,
    depthTest: false,
    depthWrite: false,
  })
  const gradePass = new ShaderPass(grade)
  composer.addPass(gradePass)
  return {
    composer,
    exposure,
    time,
    setSize: (width, height, pixelRatio) => {
      composer.setPixelRatio(pixelRatio)
      composer.setSize(width, height)
      texel.value.set(1 / Math.max(1, Math.floor(width * pixelRatio)), 1 / Math.max(1, Math.floor(height * pixelRatio)))
    },
    dispose: () => {
      sanitizePass.dispose()
      sanitize.dispose()
      bloom.dispose()
      gradePass.dispose()
      grade.dispose()
      composer.dispose()
    },
  }
}
