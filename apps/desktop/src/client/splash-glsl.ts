/** GLSL sources for the launch city: shared noise, sky, haze, and the building, ground, sky, prop, and panel surfaces. */

import { SPLASH_SHOP_WIDTH } from './splash-street.ts'

/**
 * Uniforms, hashes, noise, sky radiance, mark light, avenue lamp light, height haze, and lane placement shared by every
 * city surface. Materials that include it bind the shared `uTime`, `uDetail`, `uHoloPos`, `uHolo`, `uFogDensity`,
 * `uFogFalloff`, `uLamps`, and `uLampRows` uniform objects.
 */
export const CITY_COMMON_GLSL = /* glsl */ `
uniform float uTime;
uniform float uDetail;
uniform vec3 uHoloPos;
uniform float uHolo;
uniform float uFogDensity;
uniform float uFogFalloff;
// Avenue lamp heads: |x| of each head, head height, z of the first row, and row spacing toward -Z; uLampRows rows.
uniform vec4 uLamps;
uniform float uLampRows;

const vec3 HOLO_RGB = vec3(1.0, 0.075, 0.06);
const vec3 HAZE_LOW = vec3(0.2, 0.038, 0.052);
const vec3 HAZE_HIGH = vec3(0.028, 0.013, 0.042);
const vec3 LAMP_RGB = vec3(1.0, 0.7, 0.45);

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 blend = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(cell), hash12(cell + vec2(1.0, 0.0)), blend.x),
    mix(hash12(cell + vec2(0.0, 1.0)), hash12(cell + vec2(1.0, 1.0)), blend.x),
    blend.y);
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 6; octave++) {
    if (octave >= octaves) break;
    value += amplitude * valueNoise(p);
    p = p * 2.03 + vec2(17.13, 9.71);
    amplitude *= 0.5;
  }
  return value;
}

// Coverage of a line of half-width halfWidth at signed offset; sub-pixel lines widen to one pixel at reduced energy.
float lineCoverage(float offset, float halfWidth, float pixel) {
  float shown = max(halfWidth, pixel);
  return clamp((shown - abs(offset)) / pixel + 0.5, 0.0, 1.0) * (halfWidth / shown);
}

// Periodic lines; once the period spans only a few pixels they resolve to their average so distant grids never shimmer.
float gridLine(float coord, float period, float halfWidth, float pixel) {
  float offset = mod(coord + 0.5 * period, period) - 0.5 * period;
  float average = 2.0 * halfWidth / period;
  return mix(average, lineCoverage(offset, halfWidth, pixel), smoothstep(2.5, 7.0, period / pixel));
}

// Polluted night sky: red horizon glow, under-lit cloud deck, and the mark's glint.
vec3 skyRadiance(vec3 origin, vec3 direction, int cloudOctaves) {
  float rise = direction.y;
  vec3 color = mix(HAZE_LOW * 1.08, vec3(0.052, 0.012, 0.038), smoothstep(0.0, 0.16, rise));
  color = mix(color, vec3(0.005, 0.005, 0.013), smoothstep(0.12, 0.62, rise));
  color = mix(color, HAZE_LOW * 0.8, smoothstep(0.0, -0.25, rise));
  if (cloudOctaves > 0 && rise > 0.0) {
    vec2 drift = vec2(uTime * 0.008, uTime * 0.003);
    float density = smoothstep(0.42, 0.86, fbm(direction.xz / (rise + 0.09) * 1.5 + drift, cloudOctaves));
    vec3 underside = mix(vec3(0.24, 0.046, 0.056), vec3(0.042, 0.018, 0.05), smoothstep(0.03, 0.4, rise));
    color = mix(color, underside, density * smoothstep(0.0, 0.12, rise) * 0.9);
  }
  float toward = max(dot(direction, normalize(uHoloPos - origin)), 0.0);
  color += HOLO_RGB * uHolo * 0.02 * pow(toward, 40.0);
  return color;
}

// Red light the lit mark casts on nearby surfaces.
vec3 holoLight(vec3 position, vec3 normal) {
  vec3 toLight = uHoloPos - position;
  float distanceSq = dot(toLight, toLight);
  return HOLO_RGB * uHolo * 3200.0 / (distanceSq + 1200.0) * max(dot(normal, toLight * inversesqrt(distanceSq)), 0.0);
}

// Night-city fill: warm neon bounce from the streets below, cool sky light from above.
vec3 cityAmbient(vec3 normal, float height) {
  vec3 street = mix(vec3(0.42, 0.11, 0.14), vec3(0.16, 0.08, 0.15), smoothstep(0.0, 180.0, height));
  return mix(street, vec3(0.1, 0.1, 0.2), normal.y * 0.5 + 0.5);
}

// Light of the downward-facing avenue lamp heads in the three rows nearest the point: diffuse irradiance, and in
// specular a highlight of exponent shininess toward the eye along view. Points beyond the avenue get none.
vec3 lampLight(vec3 position, vec3 normal, vec3 view, float shininess, out vec3 specular) {
  specular = vec3(0.0);
  vec3 diffuse = vec3(0.0);
  if (abs(position.x) > 40.0 || position.y > 40.0) return diffuse;
  float row = floor((uLamps.z - position.z) / uLamps.w + 0.5);
  for (int offset = -1; offset <= 1; offset++) {
    float index = row + float(offset);
    if (index < 0.0 || index >= uLampRows) continue;
    for (int side = 0; side < 2; side++) {
      vec3 head = vec3(side == 0 ? -uLamps.x : uLamps.x, uLamps.y, uLamps.z - index * uLamps.w);
      vec3 toLight = head - position;
      float distanceSq = dot(toLight, toLight);
      vec3 direction = toLight * inversesqrt(distanceSq);
      float energy = 90.0 * smoothstep(-0.1, 0.45, direction.y) / (distanceSq + 6.0);
      diffuse += LAMP_RGB * energy * max(dot(normal, direction), 0.0);
      specular += LAMP_RGB * energy * pow(max(dot(normal, normalize(direction - view)), 0.0), shininess);
    }
  }
  return diffuse;
}

// Exponential height haze integrated along the eye ray.
float hazeAmount(vec3 position) {
  vec3 ray = position - cameraPosition;
  float rayLength = length(ray);
  float originY = max(cameraPosition.y, 0.0);
  float rise = ray.y / max(rayLength, 1e-3) * uFogFalloff;
  float path = abs(rise) < 1e-5 ? rayLength : (1.0 - exp(-rayLength * rise)) / rise;
  return 1.0 - exp(-uFogDensity * exp(-originY * uFogFalloff) * path);
}

vec3 hazeRadiance(vec3 position) {
  vec3 ray = position - cameraPosition;
  vec3 direction = ray / max(length(ray), 1e-3);
  float middle = max(cameraPosition.y, 0.0) + ray.y * 0.5;
  vec3 haze = mix(HAZE_LOW, HAZE_HIGH, smoothstep(0.0, 210.0, middle));
  float toward = max(dot(direction, normalize(uHoloPos - cameraPosition)), 0.0);
  return haze + HOLO_RGB * uHolo * 0.07 * pow(toward, 28.0);
}

vec3 applyHaze(vec3 color, vec3 position) {
  return mix(color, hazeRadiance(position), hazeAmount(position));
}

// Craft looping along a straight lane: lane = (origin, metres per second), motion = (direction x, direction z, phase, span).
// Craft shrink and dim within 24 m of either loop end, where they wrap. A negative bob phase keeps ground vehicles level.
vec3 lanePlacement(vec4 lane, vec4 motion, float bob, out vec3 forward, out vec3 right, out float presence) {
  forward = vec3(motion.x, 0.0, motion.y);
  right = vec3(motion.y, 0.0, -motion.x);
  float halfSpan = 0.5 * motion.w;
  float travelled = mod(motion.z + uTime * lane.w, motion.w) - halfSpan;
  presence = smoothstep(0.0, 24.0, halfSpan - abs(travelled));
  float hover = bob < 0.0 ? 0.0 : sin(uTime * 0.8 + bob) * 0.3;
  return lane.xyz + forward * travelled + vec3(0.0, hover, 0.0);
}
`

/**
 * Instanced building tiers: a unit box or cylinder with its base at y = 0, scaled, tapered, and placed per instance.
 * `aGrid` carries the tier's storey height, preferred cell width, wall finish, and flags (1 balconies, 2 geometric
 * relief on its avenue face) from `splashFacadeGrid`. `aStorefront` is 0 for tiers without shops, otherwise one more
 * than the fascia-atlas slot of the tier's first shop from `splashShopSlots`.
 */
export const FACADE_VERTEX_GLSL = /* glsl */ `
attribute vec3 aCenter;
attribute vec4 aSize;
attribute vec4 aStyle;
attribute vec4 aGrid;
attribute float aStorefront;
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying vec4 vGrid;
flat varying vec2 vTier;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;

void main() {
  vec3 local = position * aSize.xyz;
  vec3 surfaceNormal = normal;
  #ifdef RADIAL
  local.xz *= mix(1.0, aSize.w, position.y);
  float radius = 0.25 * (aSize.x + aSize.z);
  surfaceNormal.y += (1.0 - aSize.w) * radius / aSize.y * length(normal.xz);
  #endif
  vec3 world = aCenter + local;
  vStyle = aStyle;
  vSize = aSize;
  vGrid = aGrid;
  vTier = vec2(aCenter.y, aStorefront);
  vWorld = world;
  vLocal = local;
  vNormal = normalize(surfaceNormal);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

/**
 * Facades: interior-mapped rooms behind tinted Fresnel glass, office floors lit in zones, residential windows lit
 * individually, mullions, spandrels, blinds, shop fronts with lettered fascias from `uFascia`, and steady accent
 * lighting. Window detail resolves to its average once a window spans only a few pixels, so distant facades never
 * sparkle. `RADIAL` selects cylinder tiers.
 */
export const FACADE_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
uniform sampler2D uFascia;
uniform vec2 uFasciaGrid;
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying vec4 vGrid;
flat varying vec2 vTier;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;

const float PI = 3.14159265;
const float SHOP_WIDTH = ${SPLASH_SHOP_WIDTH.toFixed(2)};

vec3 neonTint(float h) {
  if (h < 0.42) return vec3(1.0, 0.08, 0.1);
  if (h < 0.68) return vec3(0.12, 0.72, 1.0);
  if (h < 0.86) return vec3(1.0, 0.24, 0.58);
  return vec3(1.0, 0.58, 0.16);
}

// Room light: each building is warm or cool; rare rooms are lit by coloured screens.
vec3 roomLight(bool warm, float tone, float pick) {
  vec3 tint = warm ? mix(vec3(1.0, 0.54, 0.24), vec3(1.0, 0.74, 0.5), tone) : mix(vec3(0.62, 0.78, 1.0), vec3(0.88, 0.94, 1.0), tone);
  if (pick > 0.975) tint = pick > 0.988 ? vec3(1.0, 0.22, 0.55) : vec3(0.2, 0.88, 1.0);
  return tint * (0.09 + 0.3 * tone * tone + 0.06 * pick);
}

// Ray exit from inside a room box spanning [-1, 1]^3; the window is the z = -1 face.
vec3 roomRadiance(vec2 cellUv, vec3 direction, vec3 light, float lit, float hash) {
  vec3 origin = vec3(cellUv * 2.0 - 1.0, -1.0);
  vec3 inverse = 1.0 / (direction + vec3(1e-5));
  vec3 exits = abs(inverse) - origin * inverse;
  float t = min(min(exits.x, exits.y), exits.z);
  vec3 hit = origin + direction * t;
  float depth = hit.z * 0.5 + 0.5;
  float shade;
  if (t == exits.z) {
    shade = 0.42 + 0.16 * hit.y;
    float furniture = step(hit.y, -0.42) * step(0.3, fract(hit.x * 1.7 + hash * 5.0));
    shade *= 1.0 - 0.45 * furniture;
  } else if (t == exits.y) {
    if (direction.y > 0.0) {
      float fixture = (1.0 - smoothstep(0.36, 0.48, abs(hit.x))) * (1.0 - smoothstep(0.14, 0.24, abs(hit.z - 0.15)));
      shade = 0.55 + 1.1 * fixture;
    } else {
      shade = 0.12 + 0.12 * depth;
    }
  } else {
    shade = 0.24 + 0.16 * depth;
  }
  vec3 dark = vec3(0.003, 0.004, 0.007) * (0.5 + depth);
  return mix(dark, light * shade, lit);
}

// Antialiased coverage of the rectangle rect = (x0, y0, x1, y1), in the units of uv and pixel.
float rectMask(vec2 uv, vec4 rect, vec2 pixel) {
  vec2 inside = smoothstep(rect.xy - pixel, rect.xy + pixel, uv) * (1.0 - smoothstep(rect.zw - pixel, rect.zw + pixel, uv));
  return inside.x * inside.y;
}

vec3 storefront(float u, float y, float seed, vec3 sky, float fresnel) {
  float shopCoord = u / SHOP_WIDTH;
  float shop = floor(shopCoord);
  float across = fract(shopCoord);
  float shopHash = hash12(vec2(shop, seed * 91.0));
  vec2 pixel = max(fwidth(vec2(shopCoord, y)), vec2(1e-4));
  float pixelU = max(fwidth(u), 1e-4);
  float glassMask = smoothstep(0.35 - pixel.y, 0.35 + pixel.y, y) * (1.0 - smoothstep(3.4 - pixel.y, 3.4 + pixel.y, y))
    * smoothstep(0.04 - pixel.x, 0.04 + pixel.x, across) * (1.0 - smoothstep(0.96 - pixel.x, 0.96 + pixel.x, across));
  vec3 tint = shopHash < 0.5 ? vec3(1.0, 0.68, 0.42) : shopHash < 0.82 ? vec3(0.78, 0.88, 1.0) : neonTint(fract(shopHash * 5.3));
  float ceiling = smoothstep(1.0, 3.3, y);
  float shelves = 1.0 - 0.45 * step(0.6, fract(y * 1.5 + shopHash * 3.0)) * step(0.45, y) * step(y, 2.4);
  vec3 interior = tint * (0.04 + 0.15 * ceiling) * shelves * (0.7 + 0.6 * hash11(shopHash * 13.0));
  float figure = step(0.64, valueNoise(vec2(u * 1.15 + shopHash * 40.0, 0.5))) * step(0.35, y) * step(y, 1.8);
  interior *= 1.0 - 0.75 * figure * step(0.35, fract(shopHash * 3.1));
  float open = step(0.14, fract(shopHash * 7.1));
  float ribs = mix(1.0, 0.7 + 0.3 * step(0.5, fract(y * 9.0)), smoothstep(30.0, 60.0, 1.0 / pixel.y));
  vec3 shutter = vec3(0.028) * ribs;
  float mullion = lineCoverage((fract(u / 1.6 + 0.5) - 0.5) * 1.6, 0.03, pixelU) * open;
  vec3 window = mix(mix(shutter, interior, open) * (1.0 - fresnel) + sky * fresnel, vec3(0.01), mullion);
  float band = smoothstep(3.8 - pixel.y, 3.8 + pixel.y, y) * (1.0 - smoothstep(5.0 - pixel.y, 5.0 + pixel.y, y));
  // Fascia board inset in the band; its lettering is this shop's slot of the fascia atlas, a coverage mask whose
  // blurrier mip doubles as the neon halo. Gradients come from the board coordinate, which is continuous within a shop.
  vec2 board = vec2((across - 0.05) / 0.9, (y - 3.86) / 1.08);
  vec2 boardPixel = max(fwidth(board), vec2(1e-4));
  float onBoard = rectMask(board, vec4(0.0, 0.0, 1.0, 1.0), boardPixel);
  float slot = vTier.y - 1.0 + shop;
  vec2 atlasCell = vec2(mod(slot, uFasciaGrid.x), floor(slot / uFasciaGrid.x));
  vec2 atlasUv = vec2((atlasCell.x + board.x) / uFasciaGrid.x, 1.0 - (atlasCell.y + 1.0 - board.y) / uFasciaGrid.y);
  vec2 gradientX = dFdx(board) / uFasciaGrid;
  vec2 gradientY = dFdy(board) / uFasciaGrid;
  float letters = textureGrad(uFascia, atlasUv, gradientX, gradientY).r * onBoard;
  float halo = textureGrad(uFascia, atlasUv, gradientX * 6.0, gradientY * 6.0).r * onBoard;
  float signKind = fract(shopHash * 11.3);
  vec3 ink = neonTint(fract(shopHash * 3.7));
  vec3 neonSign = vec3(0.012) + ink * (0.92 * letters + 0.3 * halo);
  vec3 boardLight = (shopHash < 0.5 ? vec3(1.0, 0.93, 0.82) : vec3(0.86, 0.9, 1.0)) * 0.2 * onBoard;
  vec3 lightbox = mix(vec3(0.016) + boardLight, ink * 0.03, letters);
  vec3 unlit = vec3(0.012) + vec3(0.035) * letters;
  vec3 signLight = signKind < 0.6 ? neonSign : signKind < 0.85 ? lightbox : unlit;
  vec3 strip = vec3(1.0, 0.82, 0.62) * 0.6 * lineCoverage(y - 3.62, 0.03, pixel.y) * open;
  // Open shops have a framed glass door mid-front; some fronts hang a striped awning over the glass.
  float doorOffset = abs(across - 0.5) * 6.5;
  float door = open * step(0.35, y) * step(y, 2.45) * lineCoverage(doorOffset - 0.62, 0.035, pixelU);
  door = max(door, open * lineCoverage(y - 2.45, 0.035, pixel.y) * step(doorOffset, 0.62));
  window = mix(window, vec3(0.05) + sky * 0.2, door);
  float awning = step(0.55, fract(shopHash * 5.7)) * step(0.05, across) * step(across, 0.95)
    * smoothstep(3.42 - pixel.y, 3.42 + pixel.y, y) * (1.0 - smoothstep(3.76 - pixel.y, 3.76 + pixel.y, y));
  vec3 canvas = mix(vec3(0.07, 0.066, 0.06), neonTint(fract(shopHash * 9.1)) * 0.05, gridLine(u, 0.7, 0.175, pixelU));
  vec3 front = mix(mix(vec3(0.018), window, glassMask), signLight, band) + strip;
  return mix(front, canvas * (0.6 + 0.4 * smoothstep(3.42, 3.76, y)), awning);
}

vec3 wallRadiance(vec3 normal, vec3 view) {
  float seed = vStyle.x;
  int facade = int(vStyle.y + 0.5);
  float litRatio = vStyle.z;
  int trim = int(vStyle.w + 0.5);
  vec3 tangent = vec3(normal.z, 0.0, -normal.x);
  #ifdef RADIAL
  float radius = 0.25 * (vSize.x + vSize.z);
  float faceWidth = 2.0 * PI * radius;
  float u = (atan(vLocal.z / vSize.z, vLocal.x / vSize.x + 1e-6) + PI) * radius;
  float faceId = 0.0;
  #else
  float faceWidth = abs(normal.x) > 0.5 ? vSize.z : vSize.x;
  float u = dot(vLocal, tangent) + faceWidth * 0.5;
  float faceId = dot(floor(normal + 0.5), vec3(1.0, 0.0, 2.0)) + 3.0;
  #endif
  float y = vWorld.y;
  bool office = facade != 1;
  bool warm = hash11(seed * 41.3) < 0.55;
  float buildingHash = hash11(seed * 61.7);
  int finish = int(vGrid.z + 0.5);
  // Balcony blocks have windows that reach the floor as doors.
  bool balconies = mod(vGrid.w, 2.0) > 0.5;

  float floorHeight = vGrid.x;
  float targetCell = vGrid.y;
  float cellWidth = faceWidth / max(1.0, floor(faceWidth / targetCell + 0.5));
  vec2 coord = vec2(u / cellWidth, y / floorHeight);
  vec2 cell = floor(coord);
  vec2 cellUv = fract(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-5));
  float detail = smoothstep(1.8, 5.5, 1.0 / max(pixel.x, pixel.y));

  vec4 window = facade == 1 ? (balconies ? vec4(0.18, 0.08, 0.82, 0.82) : vec4(0.2, 0.3, 0.8, 0.82))
    : facade == 2 ? vec4(0.0, 0.4, 1.0, 0.9)
    : facade == 3 ? vec4(0.05, 0.16, 0.95, 0.97)
    : vec4(0.03, 0.18, 0.97, 0.97);
  float windowArea = (window.z - window.x) * (window.w - window.y);

  float floorBias = hash12(vec2(cell.y, seed * 113.0 + faceId));
  float zoneCells = 3.0 + floor(hash11(seed * 7.7) * 5.0);
  float zone = floor(cell.x / zoneCells);
  float zoneHash = hash13(vec3(cell.y, zone, seed * 53.0 + faceId));
  float zoneTone = hash13(vec3(zone, cell.y, seed * 29.0 + faceId + 5.0));
  float roomHash = hash13(vec3(cell, seed * 197.0 + faceId * 7.0));
  float lit = office
    ? step(zoneHash, litRatio * (0.35 + 1.3 * floorBias)) * step(0.1, roomHash)
    : step(roomHash, litRatio * (0.5 + floorBias));

  vec3 reflected = reflect(view, normal);
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float f0 = facade == 1 ? 0.04 : 0.1;
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
  vec3 glassTint = hash11(seed * 3.3) < 0.5 ? vec3(0.72, 0.84, 1.0) : vec3(1.0, 0.84, 0.7);
  vec3 sky = skyRadiance(vWorld, reflected, 0) * glassTint;

  vec3 albedo;
  float sheen;
  if (facade == 1) {
    // Residential walls: board-marked concrete, small glazed tiles, or brick.
    float grime = fbm(vec2(u * 0.3, y * 0.04) + seed * 31.0, 3);
    float seam = lineCoverage(cellUv.x - 0.5, 0.012, pixel.x) * 0.5;
    albedo = finish == 1 ? vec3(0.15, 0.146, 0.14) * (0.85 + 0.3 * grime)
      : finish == 2 ? vec3(0.1, 0.046, 0.033) * (0.8 + 0.4 * grime)
      : vec3(0.055, 0.05, 0.052) * (0.6 + 0.8 * grime) * (1.0 - seam);
    sheen = finish == 1 ? 0.14 : 0.06;
  } else if (facade == 2) {
    albedo = vec3(0.03, 0.032, 0.038);
    sheen = 0.35;
  } else if (facade == 3) {
    albedo = vec3(0.012, 0.01, 0.014);
    sheen = 0.5;
  } else {
    albedo = vec3(0.018, 0.02, 0.026);
    sheen = 0.45;
  }
  float avenue = step(0.5, -normal.x * sign(vWorld.x)) * (1.0 - smoothstep(26.0, 70.0, abs(vWorld.x))) * step(-205.0, vWorld.z);
  vec3 neon = mix(vec3(1.0, 0.08, 0.1), vec3(0.1, 0.65, 1.0), smoothstep(0.35, 0.65, valueNoise(vec2(vWorld.z * 0.05, seed * 9.0))));
  vec3 spill = neon * 0.9 * exp(-max(y - 2.0, 0.0) / 14.0) * avenue;
  // The avenue lamps light the lower storeys of the frontage, matching the relief and props in front of it.
  vec3 lampGlint;
  vec3 lighting = cityAmbient(normal, y) + spill + holoLight(vWorld, normal) + lampLight(vWorld, normal, view, 8.0, lampGlint) * avenue;
  // Avenue faces of the frontage carry real balconies and condensers, so the shader leaves those to the geometry.
  bool relief = vGrid.w > 1.5 && avenue > 0.5;
  vec3 structure = albedo * lighting + sky * (0.04 + 0.5 * pow(1.0 - cosine, 5.0)) * sheen;

  vec3 averageTint = warm ? vec3(1.0, 0.62, 0.34) : vec3(0.74, 0.86, 1.0);
  vec3 averageGlass = averageTint * litRatio * 0.13 * (1.0 - fresnel) + sky * fresnel;
  vec3 color = mix(structure, averageGlass, windowArea);
  float pixelU = max(fwidth(u), 1e-4);
  float pixelY = max(fwidth(y), 1e-4);
  float sharp = detail * uDetail;
  if (sharp > 0.0) {
    vec2 cellMetres = vec2(cellWidth, floorHeight);
    vec2 pixelMetres = pixel * cellMetres;

    // Wall: precast panels two cells wide, glazed tiles, or running-bond brick, with rain streaks washed down from the sills.
    vec3 wallAlbedo;
    float joints;
    if (facade == 1 && finish == 1) {
      vec2 tile = vec2(u, y) / 0.2;
      joints = max(gridLine(u, 0.2, 0.007, pixelU), gridLine(y, 0.2, 0.007, pixelY));
      float tone = mix(1.0, 0.92 + 0.16 * hash12(floor(tile) + seed * 7.0), 1.0 - smoothstep(0.02, 0.05, pixelMetres.y));
      wallAlbedo = mix(albedo * tone, albedo * 0.62, joints);
    } else if (facade == 1 && finish == 2) {
      float course = floor(y / 0.075);
      float offset = mod(course, 2.0) * 0.12;
      joints = max(gridLine(y, 0.075, 0.006, pixelY), gridLine(u + offset, 0.24, 0.006, pixelU));
      float tone = mix(1.0, 0.78 + 0.44 * hash12(vec2(floor((u + offset) / 0.24), course) + seed * 5.0),
        1.0 - smoothstep(0.012, 0.035, pixelMetres.y));
      wallAlbedo = mix(albedo * tone, vec3(0.085, 0.08, 0.075), joints);
    } else {
      float panelTone = 0.84 + 0.32 * hash13(vec3(floor(cell.x * 0.5), cell.y, seed * 17.0 + faceId));
      joints = max(gridLine(y, floorHeight, 0.012, pixelY), gridLine(u, cellWidth * 2.0, 0.012, pixelU));
      wallAlbedo = albedo * panelTone * (1.0 - 0.45 * joints);
    }
    float streaks = smoothstep(0.5, 0.92, valueNoise(vec2(u * 3.4, y * 0.2 + seed * 13.0)));
    float belowSill = step(cellUv.y, window.y) * step(window.x, cellUv.x) * step(cellUv.x, window.z)
      * (1.0 - smoothstep(0.0, 1.6, (window.y - cellUv.y) * floorHeight));
    float grime = clamp(0.4 * streaks + 0.45 * belowSill * (0.4 + streaks), 0.0, 0.7);
    vec3 wall = wallAlbedo * (1.0 - grime) * lighting
      + sky * (0.04 + 0.5 * pow(1.0 - cosine, 5.0)) * (sheen + 0.3 * streaks);
    if (facade == 0) {
      // Curtain-wall spandrels are shadow-box glass with a lit slab edge at each floor.
      vec3 spandrel = vec3(0.008) * lighting + sky * (0.08 + 0.92 * pow(1.0 - cosine, 5.0)) * 0.7;
      wall = mix(spandrel, wall, 0.25) + vec3(0.9, 0.95, 1.0) * 0.12 * gridLine(y, floorHeight, 0.03, pixelY);
    }

    // Windows: the glass sits behind the wall face, so oblique rays meet the jambs, sill, or head first.
    float recess = facade == 1 ? 0.24 : 0.05;
    float facing = max(-dot(view, normal), 0.1);
    vec2 glassUv = cellUv + vec2(dot(view, tangent), view.y) * (recess / facing) / cellMetres;
    float opening = rectMask(cellUv, window, pixel);
    float onGlass = rectMask(glassUv, window, pixel);
    vec2 exits = max(window.xy - glassUv, glassUv - window.zw) * cellMetres;
    vec3 revealNormal = exits.x > exits.y
      ? tangent * sign(window.x + window.z - 2.0 * glassUv.x)
      : vec3(0.0, sign(window.y + window.w - 2.0 * glassUv.y), 0.0);
    vec3 metalFrame = vec3(0.05, 0.051, 0.056) * lighting + sky * 0.11;
    vec3 reveal = facade == 1
      ? albedo * 1.3 * (cityAmbient(revealNormal, y) + spill + holoLight(vWorld, revealNormal)) * 0.85
      : metalFrame;

    // Glazing: casements and transoms in aluminium frames; every pane tilts slightly, so reflections break per pane.
    vec2 paneUv = clamp((glassUv - window.xy) / (window.zw - window.xy), 0.0, 1.0);
    vec2 openingMetres = (window.zw - window.xy) * cellMetres;
    vec2 local = paneUv * openingMetres;
    float columns = facade == 1 || cellWidth > 1.7 ? 2.0 : 1.0;
    float transom = facade == 1 ? 0.7 : hash11(seed * 23.1) < 0.5 ? 0.84 : 2.0;
    float split = columns > 1.5 ? lineCoverage(local.x - 0.5 * openingMetres.x, 0.024, pixelMetres.x) : 0.0;
    float transomBar = lineCoverage(local.y - transom * openingMetres.y, 0.024, pixelMetres.y);
    vec2 edge = min(local, openingMetres - local);
    float rim = 1.0 - smoothstep(0.04 - pixelMetres.x, 0.04 + pixelMetres.x, min(edge.x, edge.y));
    float frame = max(max(split, transomBar), rim);
    vec2 paneId = vec2(step(0.5, paneUv.x) * (columns - 1.0), step(transom, paneUv.y));
    float paneHash = hash13(vec3(cell * 3.0 + paneId, seed * 31.0 + faceId));
    vec3 paneNormal = normalize(normal + tangent * (paneHash - 0.5) * 0.08 + vec3(0.0, (fract(paneHash * 7.31) - 0.5) * 0.06, 0.0));
    vec3 paneSky = skyRadiance(vWorld, reflect(view, paneNormal), 0) * glassTint;

    vec3 light = roomLight(warm, zoneTone, roomHash);
    float roomDepth = cellWidth * 1.25 + 1.6;
    vec3 roomDirection = vec3(dot(view, tangent) / (0.5 * cellWidth), view.y / (0.5 * floorHeight), -dot(view, normal) / (0.5 * roomDepth));
    vec3 room = roomRadiance(glassUv, roomDirection, light, lit, roomHash);
    float blindHash = hash13(vec3(cell.yx, seed * 7.0 + faceId + 3.0));
    float blindLevel = mix(window.y, window.w, 0.2 + 0.7 * fract(blindHash * 7.31));
    float blinds = step(blindHash, 0.16) * smoothstep(blindLevel - pixel.y, blindLevel + pixel.y, glassUv.y);
    float slats = mix(1.0, 0.72 + 0.28 * step(0.35, fract(glassUv.y * floorHeight * 5.0)), smoothstep(40.0, 80.0, 1.0 / pixel.y));
    room = mix(room, mix(vec3(0.008), light * (0.18 + 0.3 * glassUv.y), lit) * slats, blinds);
    vec3 glass = mix(room * (1.0 - fresnel) + paneSky * fresnel, metalFrame, frame);
    vec3 detailed = mix(wall, mix(reveal, glass, onGlass), opening);

    // Curtain walls on some towers carry projecting aluminium fins every third mullion.
    if (facade == 0 && buildingHash < 0.4) {
      float finEvery = cellWidth * 3.0;
      float finOffset = mod(u + 0.5 * finEvery, finEvery) - 0.5 * finEvery;
      float fin = 1.0 - smoothstep(0.07 - pixelU, 0.07 + pixelU, abs(finOffset));
      detailed = mix(detailed, vec3(0.08) * lighting + sky * 0.35, fin);
    }
    if (facade == 1) {
      // Drain pipes run down some cell joints, clamped by a bracket at every floor.
      float every = cellWidth * (4.0 + floor(hash11(seed * 3.9) * 3.0));
      float across = (mod(u + 0.5 * every, every) - 0.5 * every) / 0.06;
      float piped = step(buildingHash, 0.55);
      float pipe = piped * (1.0 - smoothstep(1.0 - pixelU / 0.06, 1.0, abs(across)));
      float bracket = piped * lineCoverage(fract(cellUv.y + 0.5) - 0.5, 0.02, pixel.y) * step(abs(across), 1.6);
      vec3 pipeNormal = normalize(tangent * across + normal * sqrt(max(1.0 - across * across, 0.0)));
      vec3 pipeColor = vec3(0.075, 0.074, 0.07) * (cityAmbient(pipeNormal, y) + spill + holoLight(vWorld, pipeNormal))
        + skyRadiance(vWorld, reflect(view, pipeNormal), 0) * 0.18;
      detailed = mix(detailed, pipeColor, max(pipe, bracket));
    }
    if (facade == 1 && !balconies && !relief) {
      // Air-conditioner condensers hang below some windows: a louvred casing with a round fan grille.
      vec2 unitMetres = vec2(0.82, 0.6);
      vec2 unitUv = (cellUv - vec2(0.48, 0.06)) * cellMetres / unitMetres;
      float unit = step(hash13(vec3(cell, seed * 43.0 + faceId)), 0.34) * rectMask(unitUv, vec4(0.0, 0.0, 1.0, 1.0), pixelMetres / unitMetres);
      vec2 fan = (unitUv - vec2(0.36, 0.5)) * unitMetres;
      float grille = (1.0 - smoothstep(0.2, 0.2 + pixelMetres.x, length(fan))) * (0.55 + 0.45 * gridLine(fan.y, 0.036, 0.009, pixelMetres.y));
      float louvres = step(0.72, unitUv.x) * gridLine(unitUv.y * unitMetres.y, 0.067, 0.017, pixelMetres.y);
      float shade = 1.0 - smoothstep(0.0, 0.08, unitUv.y * unitMetres.y);
      vec3 casing = vec3(0.12, 0.12, 0.118) * (1.0 - 0.7 * grille - 0.35 * louvres - 0.3 * shade) * lighting + sky * 0.05;
      detailed = mix(detailed, casing, unit);
    }
    if (balconies && !relief) {
      // Balconies: a slab edge at each floor and a railing of posts under a handrail.
      float height = cellUv.y * floorHeight;
      float slab = 1.0 - smoothstep(0.18 - pixelMetres.y, 0.18 + pixelMetres.y, height);
      float handrail = lineCoverage(height - 1.05, 0.025, pixelMetres.y);
      float posts = step(0.18, height) * step(height, 1.05) * gridLine(u, 0.13, 0.011, pixelU);
      vec3 slabColor = vec3(0.1, 0.098, 0.095) * 1.2 * lighting;
      detailed = mix(detailed, slabColor, slab);
      detailed = mix(detailed, vec3(0.07) * lighting + sky * 0.25, max(handrail, posts) * 0.9);
    }
    color = mix(color, detailed, sharp);
  }

  if (facade == 3) color += vec3(1.0, 0.06, 0.05) * 1.2 * gridLine(u, cellWidth * 4.0, 0.1, pixelU);
  if (trim == 1 || trim == 2) {
    #ifdef RADIAL
    float quarter = faceWidth * 0.25;
    float offset = mod(u, quarter);
    float edge = min(offset, quarter - offset);
    #else
    float edge = min(u, faceWidth - u);
    #endif
    vec3 strip = trim == 1 ? vec3(1.0, 0.07, 0.06) * 1.5 : vec3(0.1, 0.72, 1.0) * 1.25;
    color += strip * lineCoverage(edge - 0.12, 0.07, pixelU);
  } else if (trim == 3) {
    float below = vTier.x + vSize.y - y;
    color += vec3(1.0, 0.07, 0.06) * 1.5 * lineCoverage(below - 0.6, 0.22, pixelY);
  } else if (trim == 4) {
    vec3 led = hash11(seed * 5.1) < 0.5 ? vec3(0.15, 0.75, 1.0) : vec3(0.9, 0.95, 1.0);
    color += led * 0.5 * gridLine(y - floorHeight * window.y * 0.5, floorHeight * 2.0, 0.06, pixelY);
  } else if (trim == 5) {
    vec3 led = hash11(seed * 9.7) < 0.6 ? vec3(0.15, 0.75, 1.0) : vec3(1.0, 0.2, 0.5);
    color += led * 0.55 * gridLine(u, cellWidth * 3.0, 0.07, pixelU);
  }
  #ifndef RADIAL
  if (vTier.y > 0.5 && avenue > 0.5 && y < 5.6) color = storefront(u, y, seed, sky, fresnel);
  #endif
  return color;
}

vec3 roofRadiance(vec3 view) {
  float seed = vStyle.x;
  float grime = fbm(vWorld.xz * 0.12 + seed * 40.0, 3);
  vec3 albedo = vec3(0.045, 0.042, 0.046) * (0.65 + 0.6 * grime);
  #ifdef RADIAL
  vec2 footprint = vLocal.xz / (0.5 * vSize.xz * vSize.w);
  float edge = 0.5 * min(vSize.x, vSize.z) * vSize.w * (1.0 - length(footprint));
  #else
  vec2 sides = 0.5 * vSize.xz - abs(vLocal.xz);
  float edge = min(sides.x, sides.y);
  #endif
  float rim = 1.0 - smoothstep(0.0, 0.6, edge);
  vec3 color = albedo * (vec3(0.16, 0.08, 0.14) + holoLight(vWorld, vec3(0.0, 1.0, 0.0))) * (1.0 + 0.8 * rim);
  // Membrane seams and rain puddles mirroring the sky.
  vec2 pixelXZ = max(fwidth(vWorld.xz), vec2(1e-4));
  float seams = max(gridLine(vWorld.x, 1.8, 0.02, pixelXZ.x), gridLine(vWorld.z, 1.8, 0.02, pixelXZ.y));
  float puddle = smoothstep(0.58, 0.72, valueNoise(vWorld.xz * 0.3 + seed * 9.0)) * uDetail * (1.0 - rim);
  color = mix(color * (1.0 - 0.3 * seams), skyRadiance(vWorld, reflect(view, vec3(0.0, 1.0, 0.0)), 0) * 0.55, puddle * 0.7);
  // Helipads mark some large roofs; the ring stays faint so roofs never compete with the mark.
  float pad = step(24.0, min(vSize.x, vSize.z)) * step(0.72, hash11(seed * 17.0));
  float radius = length(vLocal.xz);
  float pixel = max(fwidth(radius), 1e-4);
  color += vec3(0.2, 0.75, 1.0) * 0.32 * pad * (lineCoverage(radius - 6.5, 0.16, pixel) + 0.5 * lineCoverage(radius - 5.6, 0.08, pixel));
  return color;
}

// Skybridge undersides carry rows of cool panel lights.
vec3 soffitRadiance() {
  float pixel = max(fwidth(vLocal.x), 1e-4);
  float row = fract(vLocal.x / 3.0 + 0.5) * 3.0 - 1.5;
  float inside = step(abs(vLocal.z), 0.32 * vSize.z);
  return vec3(0.012) + vec3(0.6, 0.85, 1.0) * 0.9 * lineCoverage(row, 0.25, pixel) * inside;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 color;
  if (normal.y > 0.5) color = roofRadiance(view);
  else if (normal.y < -0.5) color = soffitRadiance();
  else color = wallRadiance(normal, view);
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`

/** Ground plane projected into the reflector's mirrored render. */
export const GROUND_VERTEX_GLSL = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vReflection;
varying vec3 vWorld;

void main() {
  vReflection = textureMatrix * vec4(position, 1.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

/**
 * Wet asphalt: puddle mirrors bent by expanding raindrop rings near the camera, rough streaked reflections elsewhere,
 * worn lane paint, zebra crossings and stop lines at the cross streets, manhole covers, a cyan guide line, tiled
 * sidewalks, lamp pools, and shop-front neon spill. `color`, `tDiffuse`, and `textureMatrix` are bound by `Reflector`.
 */
export const GROUND_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform vec4 uStreet;
uniform vec2 uAvenue;
uniform vec3 uCrossings;
varying vec4 vReflection;
varying vec3 vWorld;

// Radial slope of the rings spreading where raindrops land, two staggered drop grids deep.
vec2 rainRipples(vec2 p, float time) {
  vec2 slope = vec2(0.0);
  for (int layer = 0; layer < 2; layer++) {
    vec2 q = p * 1.7 + float(layer) * 0.37;
    float h = hash12(floor(q) + float(layer) * 19.0);
    vec2 offset = fract(q) - 0.5 - (vec2(h, fract(h * 7.13)) - 0.5) * 0.3;
    float age = fract(time * 0.9 + h * 5.0);
    float radius = length(offset);
    float ring = exp(-pow((radius - age * 0.32) / 0.025, 2.0)) * (1.0 - age);
    slope += offset / max(radius, 1e-3) * ring;
  }
  return slope;
}

void main() {
  vec3 p = vWorld;
  vec3 view = normalize(p - cameraPosition);
  float across = abs(p.x);
  vec2 pixel = max(fwidth(p.xz), vec2(1e-4));
  float onAvenue = step(uAvenue.y, p.z) * step(p.z, uAvenue.x);
  float frontage = uStreet.w;
  float sidewalk = onAvenue * smoothstep(10.0 - pixel.x, 10.0 + pixel.x, across);
  float road = onAvenue * (1.0 - sidewalk);

  float puddle = smoothstep(0.5, 0.62, fbm(p.xz * 0.045 + vec2(3.1, 7.7), 4));
  float grainDetail = 1.0 - smoothstep(0.2, 0.8, max(pixel.x, pixel.y) * 1.2);
  float nearDetail = 1.0 - smoothstep(0.015, 0.05, max(pixel.x, pixel.y));
  float grain = mix(0.5, fbm(p.xz * 1.2, 3), grainDetail);
  float wet = mix(0.45, 1.0, puddle) * (1.0 - 0.4 * sidewalk);
  float roughness = mix(0.5, 0.03, puddle);

  vec2 ripple = vec2(valueNoise(p.xz * 1.6 + uTime * 0.25), valueNoise(p.xz * 1.6 + 9.2 - uTime * 0.25)) - 0.5;
  vec2 drops = rainRipples(p.xz, uTime) * nearDetail * (0.25 + 0.75 * puddle);
  vec2 uv = vReflection.xy / vReflection.w + ripple * 0.005 * (1.0 - 0.7 * puddle) * grainDetail + drops * 0.004;
  vec3 reflection = vec3(0.0);
  float weight = 0.0;
  for (int tap = -3; tap <= 3; tap++) {
    float offset = float(tap) / 3.0;
    float tapWeight = exp(-offset * offset * 2.0);
    reflection += textureLod(tDiffuse, uv + vec2(0.0, offset * roughness * 0.05), roughness * 4.0).rgb * tapWeight;
    weight += tapWeight;
  }
  reflection /= weight;
  float cosine = clamp(-view.y, 0.0, 1.0);
  float fresnel = 0.05 + 0.95 * pow(1.0 - cosine, 4.0);

  vec3 albedo = mix(vec3(0.02, 0.019, 0.022), vec3(0.05, 0.048, 0.052), sidewalk) * (0.7 + 0.6 * grain);
  // Zebra crossings and stop lines where the cross streets meet the avenue; lane paint stops at them.
  float crossingZ = min(min(abs(p.z - uCrossings.x), abs(p.z - uCrossings.y)), abs(p.z - uCrossings.z));
  float crossing = road * (1.0 - smoothstep(2.6 - pixel.y, 2.6 + pixel.y, crossingZ));
  float zebra = crossing * gridLine(p.x + 0.5, 1.0, 0.25, pixel.x) * step(across, 9.4);
  float stop = road * lineCoverage(crossingZ - 4.0, 0.2, pixel.y) * step(across, 9.4);
  float dash = smoothstep(0.0, pixel.y / 9.0 + 0.002, 0.42 - fract(p.z / 9.0));
  float lanes = ((lineCoverage(across - 3.35, 0.08, pixel.x) + lineCoverage(across - 6.75, 0.08, pixel.x)) * dash
    + lineCoverage(across - 9.55, 0.09, pixel.x)) * (1.0 - crossing);
  float centre = lineCoverage(across - 0.22, 0.06, pixel.x) * (1.0 - crossing);
  float wear = smoothstep(0.25, 0.6, valueNoise(p.xz * vec2(2.0, 0.4)));
  float curb = lineCoverage(across - 10.0, 0.08, pixel.x);
  float tiles = sidewalk * max(gridLine(p.z, 1.5, 0.02, pixel.y), gridLine(across, 1.5, 0.02, pixel.x)) * grainDetail;
  albedo = mix(albedo, vec3(0.42), (lanes * onAvenue + zebra + stop) * wear);
  albedo = mix(albedo, vec3(0.5, 0.36, 0.08), centre * onAvenue * wear);
  albedo = mix(albedo, vec3(0.12), curb * onAvenue);
  albedo *= 1.0 - 0.35 * tiles;
  // Manhole covers in the middle lanes: a cast-iron disc with a ring and a cross-hatched face.
  vec2 manhole = vec2(across - 5.05, p.z - 41.0 * floor(p.z / 41.0 + 0.5) - 7.0 * sign(p.x));
  float manholeRadius = length(manhole);
  float coverDetail = road * nearDetail;
  float cover = coverDetail * (1.0 - smoothstep(0.36 - pixel.x, 0.36 + pixel.x, manholeRadius));
  float hatch = max(gridLine(manhole.x + manhole.y, 0.09, 0.012, pixel.x), gridLine(manhole.x - manhole.y, 0.09, 0.012, pixel.x));
  albedo = mix(albedo, vec3(0.032, 0.03, 0.028) * (1.0 - 0.45 * hatch), cover);
  albedo = mix(albedo, vec3(0.012), coverDetail * lineCoverage(manholeRadius - 0.33, 0.02, pixel.x));
  float paint = clamp(lanes + centre + zebra + stop + cover, 0.0, 1.0) * onAvenue;

  vec3 light = vec3(0.3, 0.08, 0.1);
  float lampZ = p.z - uStreet.y * floor(p.z / uStreet.y + 0.5);
  float lampX = across - uStreet.x;
  light += vec3(1.0, 0.72, 0.46) * 2.6 * exp(-(lampX * lampX + lampZ * lampZ) / 32.0) * onAvenue;
  vec3 neon = mix(vec3(1.0, 0.08, 0.1), vec3(0.1, 0.65, 1.0), smoothstep(0.35, 0.65, valueNoise(vec2(p.z * 0.05, sign(p.x) * 4.0))));
  light += neon * 1.6 * exp(-max(frontage - across, 0.0) / 2.8) * step(across, frontage) * onAvenue;
  light += holoLight(p, vec3(0.0, 1.0, 0.0));

  float shine = wet * (1.0 - 0.6 * paint);
  vec3 radiance = albedo * light * (1.0 - 0.5 * shine) + reflection * color * fresnel * shine;
  // Ring crests catch a little more of the reflected light than the flat water around them.
  radiance += reflection * color * clamp(length(drops), 0.0, 1.0) * 0.15 * shine;
  float guideDash = step(0.5, fract(p.z / 4.0));
  radiance += vec3(0.1, 0.75, 1.0) * 1.1 * lineCoverage(p.x, 0.05, pixel.x) * guideDash * onAvenue * (1.0 - crossing);
  gl_FragColor = vec4(applyHaze(radiance, p), 1.0);
}
`

/** Sky dome centred on the rendering camera. */
export const SKY_VERTEX_GLSL = /* glsl */ `
varying vec3 vDirection;

void main() {
  vDirection = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`

/** Sky dome radiance; the mirrored ground render uses a cheaper cloud deck. */
export const SKY_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
varying vec3 vDirection;

void main() {
  gl_FragColor = vec4(skyRadiance(cameraPosition, normalize(vDirection), uDetail > 0.5 ? 5 : 2), 1.0);
}
`

/**
 * Instanced or single props placed by their model and instance matrices; `instanceColor`, when bound, tints the albedo.
 * `BEVEL` marks instances of the centred unit box, whose edge rounding needs each instance's size and axes.
 */
export const SOLID_VERTEX_GLSL = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTint;
varying vec3 vLocal;
#ifdef BEVEL
flat varying vec3 vExtent;
flat varying mat3 vAxes;
flat varying vec3 vFace;
flat varying vec3 vCentre;
#endif

void main() {
  mat4 model = modelMatrix;
  #ifdef USE_INSTANCING
  model = model * instanceMatrix;
  #endif
  vec4 world = model * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(model) * normal);
  vLocal = position;
  #ifdef BEVEL
  mat3 frame = mat3(model);
  vExtent = vec3(length(frame[0]), length(frame[1]), length(frame[2]));
  vAxes = mat3(frame[0] / vExtent.x, frame[1] / vExtent.y, frame[2] / vExtent.z);
  vFace = normal;
  vCentre = model[3].xyz;
  #endif
  #ifdef USE_INSTANCING_COLOR
  vTint = instanceColor;
  #else
  vTint = vec3(1.0);
  #endif
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

/**
 * Surfaces `SOLID_FRAGMENT_GLSL` draws, selected by the `uSurface` uniform. `plain` keeps the material's albedo and
 * emission; the others add their surface detail. One program draws every surface, so the splash compiles one variant
 * instead of eight.
 */
export const SOLID_SURFACE = {
  plain: 0,
  masonry: 1,
  steel: 2,
  fabric: 3,
  painted: 4,
  vending: 5,
  lantern: 6,
} as const

/** A surface kind from `SOLID_SURFACE`. */
export type SolidSurface = keyof typeof SOLID_SURFACE

const SOLID_SURFACE_GLSL = Object.entries(SOLID_SURFACE)
  .map(([name, value]) => `const int SURFACE_${name.toUpperCase()} = ${value};`)
  .join('\n')

/**
 * Props lit by city glow, the avenue lamps, and the mark, with a sky and lamp sheen and a uniform emissive term.
 * `BEVEL` rounds box edges within 3 cm; `uSurface` then adds its texture: `SURFACE_MASONRY` mottled concrete with rain
 * streaks and wet tops, `SURFACE_STEEL` painted steel with rust blooms and worn edges, `SURFACE_FABRIC` striped awning
 * canvas, `SURFACE_PAINTED` glossy enamel. `SURFACE_VENDING` replaces the emission with a vending machine's lit front,
 * and `SURFACE_LANTERN` with a ribbed paper lantern between dark caps.
 */
export const SOLID_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
uniform vec3 uAlbedo;
uniform vec3 uEmissive;
uniform float uSheen;
uniform int uSurface;
${SOLID_SURFACE_GLSL}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTint;
varying vec3 vLocal;
#ifdef BEVEL
flat varying vec3 vExtent;
flat varying mat3 vAxes;
flat varying vec3 vFace;
flat varying vec3 vCentre;
#endif

// Rectangle coverage for the vending front; rect = (x0, y0, x1, y1).
float frontRect(vec2 p, vec4 rect, vec2 pixel) {
  vec2 inside = smoothstep(rect.xy - pixel, rect.xy + pixel, p) * (1.0 - smoothstep(rect.zw - pixel, rect.zw + pixel, p));
  return inside.x * inside.y;
}

// A vending machine's lit front on its 0.8 x 1.4 m face, p in metres from the face centre: a header band, four shelves
// of drinks behind backlit glass, selection buttons, and the dark delivery flap.
vec3 vendingFront(vec2 p, float seed) {
  vec2 pixel = max(fwidth(p), vec2(1e-4));
  vec3 color = vec3(0.014);
  vec2 shelf = vec2((p.x + 0.34) / 0.136, (p.y + 0.08) / 0.14);
  vec2 cell = floor(shelf);
  vec2 inCell = fract(shelf);
  vec2 cellPixel = pixel / vec2(0.136, 0.14);
  float can = frontRect(inCell, vec4(0.24, 0.1, 0.76, 0.78), cellPixel);
  float pick = hash12(cell + seed * 17.0);
  vec3 label = pick < 0.25 ? vec3(0.8, 0.06, 0.06) : pick < 0.5 ? vec3(0.08, 0.32, 0.8) : pick < 0.75 ? vec3(0.85, 0.6, 0.08)
    : vec3(0.1, 0.62, 0.26);
  vec3 shelves = mix(vec3(0.34, 0.39, 0.44), label * 0.5, can) * (1.0 - 0.75 * lineCoverage(inCell.y - 0.03, 0.03, cellPixel.y));
  color = mix(color, shelves, frontRect(p, vec4(-0.34, -0.08, 0.34, 0.48), pixel));
  color = mix(color, vec3(0.42, 0.44, 0.48), frontRect(p, vec4(-0.34, 0.53, 0.34, 0.65), pixel));
  float buttons = frontRect(p, vec4(-0.3, -0.19, 0.3, -0.14), pixel) * step(0.45, fract((p.x + 0.3) / 0.1));
  color = mix(color, vec3(0.62, 0.34, 0.08), buttons);
  return mix(color, vec3(0.002), frontRect(p, vec4(-0.26, -0.56, 0.18, -0.42), pixel));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 metric = vec3(0.0);
  float edge = 0.0;
  #ifdef BEVEL
  // Within 3 cm of an edge (less on thin members) the face normal turns toward the neighbouring face.
  metric = vLocal * vExtent;
  vec3 inset = 0.5 * vExtent - abs(metric);
  float radius = min(0.03, 0.3 * min(vExtent.x, min(vExtent.y, vExtent.z)));
  vec3 bend = (1.0 - abs(vFace)) * (1.0 - clamp(inset / radius, 0.0, 1.0));
  edge = max(bend.x, max(bend.y, bend.z));
  normal = normalize(vAxes * normalize(vFace + sign(metric) * bend * 0.9));
  #endif
  vec3 facing = abs(normal);
  vec2 coord = facing.y > 0.7 ? vWorld.xz : facing.x > facing.z ? vWorld.zy : vWorld.xy;
  vec3 albedo = uAlbedo * vTint;
  float sheen = uSheen;
  vec3 emissive = uEmissive;
  if (uSurface == SURFACE_MASONRY) {
    float mottle = fbm(coord * 2.3, 3);
    float streaks = facing.y < 0.5 ? smoothstep(0.45, 0.8, valueNoise(vec2(coord.x * 5.0, coord.y * 0.35))) : 0.0;
    albedo *= (0.72 + 0.56 * mottle) * (1.12 - 0.45 * streaks) * (1.0 + 0.6 * edge);
    sheen += 0.25 * step(0.7, normal.y);
  } else if (uSurface == SURFACE_STEEL) {
    float rust = smoothstep(0.72, 0.9, valueNoise(coord * 3.1 + 7.0)) * (1.0 - 0.5 * smoothstep(0.0, 3.0, vWorld.y));
    albedo = mix(albedo * (0.85 + 0.3 * valueNoise(coord * 7.0)), vec3(0.11, 0.045, 0.02), 0.7 * rust) * (1.0 + 1.2 * edge);
  } else if (uSurface == SURFACE_FABRIC) {
    float stripe = step(0.5, fract(metric.z / 0.36 + 0.25));
    albedo = mix(albedo, vec3(0.42, 0.4, 0.36), 0.85 * stripe) * (0.9 + 0.2 * valueNoise(coord * 9.0));
  } else if (uSurface == SURFACE_PAINTED) {
    albedo *= 0.85 + 0.3 * valueNoise(coord * 11.0);
  }
  #ifdef BEVEL
  if (uSurface == SURFACE_VENDING) {
    emissive = facing.y < 0.5 && abs(vFace.x) > 0.5 ? vendingFront(metric.zy * vec2(-sign(vFace.x), 1.0), vCentre.z) : vec3(0.014);
  }
  #endif
  if (uSurface == SURFACE_LANTERN) {
    float around = atan(vLocal.z, vLocal.x + 1e-6) * 5.0 / 3.14159265;
    float ribs = gridLine(around, 1.0, 0.06, max(fwidth(around), 1e-4));
    float caps = smoothstep(0.15, 0.165, abs(vLocal.y));
    emissive = uEmissive * (0.75 + 0.25 * (1.0 - abs(vLocal.y) / 0.2)) * (1.0 - 0.6 * ribs) * (1.0 - caps);
    albedo = mix(albedo, vec3(0.3, 0.16, 0.03), caps);
  }
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  vec3 glint;
  vec3 lamps = lampLight(vWorld, normal, view, 40.0, glint);
  vec3 color = albedo * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal) + lamps)
    + (sky * fresnel + glint * (0.15 + 0.85 * fresnel)) * sheen + emissive;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`

/**
 * Instanced sign and screen quads turned by a per-instance yaw; `uPanelOffset` moves every instance together. Artwork
 * covers each panel at its own proportions: `uSlotAspect` is a slot's width over height, and the panel crops the
 * overflowing axis symmetrically instead of stretching the artwork.
 */
export const PANEL_VERTEX_GLSL = /* glsl */ `
uniform vec3 uPanelOffset;
uniform float uSlotAspect;
attribute vec4 aPanel;
attribute vec4 aShape;
flat varying vec2 vPanel;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  float c = cos(aPanel.w);
  float s = sin(aPanel.w);
  vec2 local = position.xy * aShape.xy;
  vec3 world = aPanel.xyz + uPanelOffset + vec3(local.x * c, local.y, -local.x * s);
  float aspect = aShape.x / aShape.y;
  vec2 cover = aspect > uSlotAspect ? vec2(1.0, uSlotAspect / aspect) : vec2(aspect / uSlotAspect, 1.0);
  vPanel = aShape.zw;
  vUv = 0.5 + (uv - 0.5) * cover;
  vWorld = world;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

/** Emissive atlas artwork; screens add fine scan lines and a slow brightness sweep. */
export const PANEL_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform float uScreen;
flat varying vec2 vPanel;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  float column = mod(vPanel.x, uGrid.x);
  float row = floor(vPanel.x / uGrid.x);
  vec2 uv = vec2((column + vUv.x) / uGrid.x, 1.0 - (row + 1.0 - vUv.y) / uGrid.y);
  vec3 color = texture2D(uAtlas, uv).rgb;
  if (uScreen > 0.5) {
    float lineCoord = vUv.y * 90.0;
    float lines = 1.0 - 0.14 * smoothstep(0.4, 0.9, abs(fract(lineCoord) - 0.5) * 2.0) * (1.0 - smoothstep(0.3, 0.7, fwidth(lineCoord)));
    float sweep = 0.86 + 0.14 * smoothstep(0.82, 1.0, 1.0 - abs(fract(vUv.y * 0.6 - uTime * 0.07) - 0.5) * 2.0);
    color *= lines * sweep;
  }
  gl_FragColor = vec4(applyHaze(color * vPanel.y, vWorld), 1.0);
}
`
