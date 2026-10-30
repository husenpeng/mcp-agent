/** GLSL sources for the landmark towers and the flying craft, train, and airship. */

import { CITY_COMMON_GLSL } from './splash-glsl.ts'

/** Landmark meshes placed by their model matrix. */
export const LANDMARK_VERTEX_GLSL = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

/**
 * Landmark surfaces, selected by one define: `PEARL_SPHERE` (glass spheres with LED parallels), `PEARL_COLUMN`
 * (shafts with LED strips and rings), `TWIST` (twisting curtain wall with a helix of corner light), or `PLANAR`
 * (gate and opener facades; `DIAGRID` adds the gate's lattice). Angular coordinates put their branch cut on +X, the
 * side facing away from the camera.
 */
export const LANDMARK_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
uniform float uSeed;
uniform vec2 uAxis;
uniform float uRadius;
uniform float uTwistRate;
varying vec3 vWorld;
varying vec3 vNormal;

const float PI = 3.14159265;
const vec3 PEARL_PINK = vec3(1.0, 0.16, 0.42);
const vec3 LED_CYAN = vec3(0.18, 0.82, 1.0);

// Glass curtain wall with office floors lit in zones; resolves to its average when cells span a few pixels.
vec3 curtainWall(float u, float y, float cellWidth, float floorHeight, float litRatio, bool warm, vec3 normal, vec3 view) {
  vec2 coord = vec2(u / cellWidth, y / floorHeight);
  vec2 cell = floor(coord);
  vec2 cellUv = fract(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-5));
  float detail = smoothstep(1.8, 5.5, 1.0 / max(pixel.x, pixel.y)) * uDetail;
  vec2 inside = smoothstep(vec2(0.04, 0.18) - pixel, vec2(0.04, 0.18) + pixel, cellUv)
    * (1.0 - smoothstep(vec2(0.96) - pixel, vec2(0.96) + pixel, cellUv));
  float zone = floor(cell.x / 5.0);
  float zoneHash = hash13(vec3(cell.y, zone, uSeed * 53.0));
  float tone = hash13(vec3(zone, cell.y, uSeed * 29.0 + 5.0));
  float lit = step(zoneHash, litRatio * (0.35 + 1.3 * hash12(vec2(cell.y, uSeed * 113.0))))
    * step(0.1, hash13(vec3(cell, uSeed * 197.0)));
  vec3 tint = warm ? mix(vec3(1.0, 0.54, 0.24), vec3(1.0, 0.74, 0.5), tone) : mix(vec3(0.62, 0.78, 1.0), vec3(0.88, 0.94, 1.0), tone);
  vec3 room = tint * (0.09 + 0.3 * tone * tone) * lit * (0.75 + 0.25 * cellUv.y);
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float fresnel = 0.1 + 0.9 * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0) * vec3(0.78, 0.86, 1.0);
  vec3 frame = vec3(0.02, 0.022, 0.028) * (cityAmbient(normal, y) + holoLight(vWorld, normal)) + sky * 0.25;
  vec3 glass = room * (1.0 - fresnel) + sky * fresnel;
  vec3 average = mix(frame, tint * litRatio * 0.12 * (1.0 - fresnel) + sky * fresnel, 0.75);
  return mix(average, mix(frame, glass, inside.x * inside.y), detail);
}

vec3 metal(vec3 normal, vec3 view, vec3 albedo, float sheen) {
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  return albedo * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal)) + sky * sheen * (0.05 + 0.95 * pow(1.0 - cosine, 5.0));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 color;
  #if defined(PEARL_SPHERE)
  float latitude = asin(clamp(normal.y, -1.0, 1.0));
  // The epsilon keeps atan defined at the poles, whose normals have no horizontal part.
  float longitude = atan(-normal.z, -normal.x + 1e-6);
  vec2 coord = vec2(longitude / (2.0 * PI) * 40.0, latitude / PI * 20.0);
  vec2 cell = floor(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-4));
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float fresnel = 0.08 + 0.92 * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  float glow = step(hash12(cell + uSeed * 17.0), 0.34) * (0.4 + 0.6 * hash12(cell.yx + 3.0));
  float panelDetail = smoothstep(2.0, 6.0, 1.0 / max(pixel.x, pixel.y));
  vec3 inner = PEARL_PINK * 0.2 * mix(0.37, glow, panelDetail) * (0.6 + 0.4 * smoothstep(-0.6, 0.6, normal.y));
  vec3 glass = inner * (1.0 - fresnel) + sky * fresnel;
  float frame = max(gridLine(coord.x, 1.0, 0.035, pixel.x), gridLine(coord.y, 1.0, 0.035, pixel.y));
  color = mix(glass, metal(normal, view, vec3(0.05), 0.4), frame);
  color += PEARL_PINK * 1.35 * gridLine(coord.y, 3.0, 0.06, pixel.y);
  color += LED_CYAN * 1.1 * lineCoverage(latitude, 0.02, max(fwidth(latitude), 1e-4));
  #elif defined(PEARL_COLUMN)
  float angle = atan(-normal.z, -normal.x + 1e-6);
  float strips = gridLine(angle, 2.0 * PI / 3.0, 0.07, max(fwidth(angle), 1e-4));
  float rings = gridLine(vWorld.y, 18.0, 0.22, max(fwidth(vWorld.y), 1e-4));
  color = metal(normal, view, vec3(0.06, 0.058, 0.064), 0.55) + LED_CYAN * 0.85 * strips + PEARL_PINK * 1.0 * rings;
  #elif defined(TWIST)
  vec2 offset = vWorld.xz - uAxis;
  float angle = atan(-offset.y, -offset.x + 1e-6) - uTwistRate * vWorld.y;
  float u = angle * uRadius;
  if (normal.y > 0.6) {
    color = metal(normal, view, vec3(0.04), 0.2);
  } else {
    color = curtainWall(u, vWorld.y, 1.8, 4.2, 0.3, false, normal, view);
    float angularPixel = max(fwidth(angle), 1e-4);
    color += vec3(0.75, 0.95, 1.0) * 1.25 * gridLine(angle - PI / 3.0, 2.0 * PI / 3.0, 0.011, angularPixel);
    color += LED_CYAN * 0.8 * gridLine(vWorld.y, 52.0, 0.3, max(fwidth(vWorld.y), 1e-4));
  }
  #elif defined(PLANAR)
  if (normal.y > 0.7) {
    color = metal(normal, view, vec3(0.04), 0.2);
  } else if (normal.y < -0.7) {
    float pixel = max(fwidth(vWorld.x), 1e-4);
    color = vec3(0.012) + vec3(0.6, 0.85, 1.0) * 0.7 * gridLine(vWorld.x, 3.0, 0.2, pixel);
  } else {
    vec3 tangent = normalize(vec3(normal.z, 0.0, -normal.x));
    float u = dot(vWorld, tangent);
    color = curtainWall(u, vWorld.y, 1.7, 4.0, 0.34, hash11(uSeed) < 0.5, normal, view);
    #ifdef DIAGRID
    float rising = u + vWorld.y * 0.9;
    float falling = u - vWorld.y * 0.9;
    float lattice = max(gridLine(rising, 16.0, 0.16, max(fwidth(rising), 1e-4)), gridLine(falling, 16.0, 0.16, max(fwidth(falling), 1e-4)));
    color = mix(color, metal(normal, view, vec3(0.05), 0.4), lattice * 0.8) + LED_CYAN * 0.38 * lattice;
    #else
    color += vec3(0.85, 0.92, 1.0) * 0.32 * gridLine(vWorld.y, 12.0, 0.08, max(fwidth(vWorld.y), 1e-4));
    #endif
  }
  #endif
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`

/**
 * Craft hulls. `LANE` instances follow their lane like `CRAFT_LIGHT_VERTEX_GLSL` lights do; otherwise the model matrix
 * places the mesh and `uPaint` colours it. `aGlow` carries per-vertex emission in rgb and the surface kind in alpha:
 * 0 painted, 1 glass, 2 trim lit in the craft's accent colour at intensity `aGlow.r`, 3 black rubber and plastic,
 * 4 bright metal.
 */
export const CRAFT_VERTEX_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
attribute vec4 aGlow;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vGlow;
varying vec3 vPaint;
varying vec3 vModel;
#ifdef LANE
attribute vec4 aLane;
attribute vec4 aMotion;
attribute vec4 aCraft;
#else
uniform vec3 uPaint;
#endif

void main() {
  #ifdef LANE
  vec3 forward;
  vec3 right;
  float presence;
  vec3 origin = lanePlacement(aLane, aMotion, aCraft.w, forward, right, presence);
  vec3 local = position * presence;
  vec3 world = origin + right * local.x + vec3(0.0, local.y, 0.0) + forward * local.z;
  vNormal = normalize(right * normal.x + vec3(0.0, normal.y, 0.0) + forward * normal.z);
  vPaint = aCraft.rgb;
  #else
  vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vPaint = uPaint;
  #endif
  vWorld = world;
  vGlow = aGlow;
  vModel = position;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

/**
 * Clear-coated paint, tinted glass, or bright metal reflecting the sky, lit by the city and the avenue lamps, plus
 * per-vertex emission. One define per craft kind (`SPINNER`, `HAULER`, `BLIMP`, `TRAIN`, `CAR`) draws its panel seams
 * in model space; spinners also carry a livery stripe, and cars paint their glass house's roof and shade their rims.
 * Seams resolve to their average once they span a few pixels.
 */
export const CRAFT_FRAGMENT_GLSL = /* glsl */ `
${CITY_COMMON_GLSL}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vGlow;
varying vec3 vPaint;
varying vec3 vModel;

// One accent colour per craft, picked from its paint.
vec3 accentColour(vec3 paint) {
  float pick = fract(dot(paint, vec3(13.1, 7.7, 29.3)) * 3.17);
  return pick < 0.3 ? vec3(0.12, 0.72, 1.0) : pick < 0.55 ? vec3(1.0, 0.16, 0.5) : pick < 0.8 ? vec3(1.0, 0.07, 0.06) : vec3(1.0, 0.5, 0.12);
}

// Panel seams of each craft kind in its model frame: 1 on a seam.
float panelSeams(vec3 p) {
  vec3 pixel = max(fwidth(p), vec3(1e-4));
  #if defined(SPINNER)
  // Rings around the hull, the waist seam, and a door outline on each flank.
  float rings = gridLine(p.z + 0.15, 0.95, 0.008, pixel.z);
  float waist = lineCoverage(p.y - 0.02, 0.008, pixel.y);
  vec2 door = vec2(p.z - 0.15, p.y + 0.02);
  float doorEdge = max(lineCoverage(abs(door.x) - 0.62, 0.008, pixel.z) * step(abs(door.y), 0.24),
    lineCoverage(abs(door.y) - 0.24, 0.008, pixel.y) * step(abs(door.x), 0.62)) * step(0.6, abs(p.x));
  return max(max(rings, waist), doorEdge);
  #elif defined(HAULER)
  // Corrugated container walls between panel joints, and the cab's panel lines.
  float corrugation = gridLine(p.z, 0.28, 0.035, pixel.z) * step(p.z, 2.55) * step(1.75, abs(p.x));
  float joints = max(gridLine(p.y + 0.2, 0.9, 0.01, pixel.y), gridLine(p.z + 0.3, 2.3, 0.012, pixel.z));
  return max(0.6 * corrugation, joints);
  #elif defined(BLIMP)
  // Envelope gores around the hull axis and the frames inside them.
  float around = atan(p.z, p.y + 1e-6) * 6.0 / 3.14159265;
  float gores = gridLine(around, 1.0, 0.012, max(fwidth(around), 1e-4));
  return 0.7 * max(gores, gridLine(p.x, 2.4, 0.02, pixel.x));
  #elif defined(TRAIN)
  return gridLine(p.x, 2.2, 0.01, pixel.x) * step(abs(p.y), 1.5);
  #elif defined(CAR)
  // Door shut lines on both flanks below the waist, and the bonnet and boot lid outlines on top.
  float flank = step(0.8, abs(p.x)) * step(0.34, p.y) * step(p.y, 0.92);
  float doors = max(max(lineCoverage(p.z - 0.98, 0.006, pixel.z), lineCoverage(p.z + 0.27, 0.006, pixel.z)),
    lineCoverage(p.z + 1.0, 0.006, pixel.z)) * flank;
  float top = step(0.7, p.y) * step(abs(p.x), 0.8);
  float lidSides = lineCoverage(abs(p.x) - 0.68, 0.006, pixel.x) * (step(1.05, p.z) + step(p.z, -1.5));
  float bootFront = lineCoverage(p.z + 1.5, 0.006, pixel.z) * step(abs(p.x), 0.68);
  return max(doors, max(lidSides, bootFront) * top);
  #else
  return 0.0;
  #endif
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  float metal = step(3.5, vGlow.a);
  float black = step(2.5, vGlow.a) * (1.0 - metal);
  float trim = step(1.5, vGlow.a) * (1.0 - black) * (1.0 - metal);
  float glass = clamp(vGlow.a, 0.0, 1.0) * (1.0 - trim) * (1.0 - black) * (1.0 - metal);
  #ifdef CAR
  // The glass house's upward faces are the painted roof.
  glass *= 1.0 - smoothstep(0.8, 0.9, normal.y);
  #endif
  float painted = (1.0 - glass) * (1.0 - trim) * (1.0 - black) * (1.0 - metal) * step(dot(vGlow.rgb, vec3(1.0)), 0.0);
  vec3 accent = accentColour(vPaint);
  float seams = panelSeams(vModel) * painted;
  #ifdef SPINNER
  // Half the spinners wear a livery stripe along both flanks in their accent colour.
  float stripe = step(0.5, fract(dot(vPaint, vec3(5.3, 11.7, 3.1)))) * painted * step(0.6, abs(vModel.x))
    * (1.0 - smoothstep(0.06 - fwidth(vModel.y), 0.06 + fwidth(vModel.y), abs(vModel.y + 0.12)));
  #else
  float stripe = 0.0;
  #endif
  float fresnel = mix(0.06, 0.08, glass) + (1.0 - mix(0.06, 0.08, glass)) * pow(1.0 - cosine, 5.0);
  vec3 reflected = reflect(view, normal);
  vec3 sky = skyRadiance(vWorld, reflected, 0);
  // Near the camera the clear coat also mirrors the lit windows of the canyon walls, which shows the hull's curvature.
  float bearing = atan(reflected.z, reflected.x + 1e-6);
  float windows = step(0.6, valueNoise(vec2(bearing * 9.0, reflected.y * 14.0)));
  float near = 1.0 - smoothstep(30.0, 120.0, length(vWorld - cameraPosition));
  vec3 glints = mix(vec3(1.0, 0.62, 0.34), vec3(0.62, 0.8, 1.0), step(0.5, valueNoise(vec2(bearing * 3.0, 7.0))));
  sky += glints * 0.35 * windows * near * (1.0 - smoothstep(0.0, 0.45, abs(reflected.y)));
  vec3 paint = mix(mix(vPaint, accent * 0.32, stripe), vec3(0.006, 0.008, 0.012), glass) * (1.0 - 0.6 * seams);
  paint = mix(paint, vec3(0.012), black);
  // Bright metal: a dark base under a strong mirror reflection.
  paint = mix(paint, vec3(0.03), metal);
  fresnel = mix(fresnel, 0.55 + 0.45 * pow(1.0 - cosine, 5.0), metal);
  #ifdef CAR
  // Wheel rims: a hub and a darker spoke ring blurred by the wheel's spin.
  vec2 hub = vec2(vModel.z - sign(vModel.z) * 1.38, vModel.y - 0.33);
  float rimRadius = length(hub);
  paint *= 1.0 - metal * 0.75 * smoothstep(0.06, 0.08, rimRadius) * (1.0 - smoothstep(0.16, 0.18, rimRadius));
  #endif
  vec3 emission = mix(vGlow.rgb, accent * vGlow.r, trim);
  #ifdef BLIMP
  // LED strips run along the gores above and below the screen, tracing the envelope.
  float around = atan(vModel.z, vModel.y + 1e-6) * 6.0 / 3.14159265;
  float aroundPixel = max(fwidth(around), 1e-4);
  float led = max(lineCoverage(abs(around) - 1.5, 0.03, aroundPixel), lineCoverage(abs(around) - 4.5, 0.03, aroundPixel));
  emission += vec3(0.12, 0.7, 1.0) * 0.9 * led * painted * step(abs(vModel.x), 10.0);
  #endif
  // The avenue lamps light the hull and leave a sharp highlight on its clear coat, glass, and metal.
  vec3 highlight;
  vec3 lamps = lampLight(vWorld, normal, view, mix(90.0, 240.0, max(glass, metal)), highlight);
  vec3 color = paint * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal) + lamps) * (1.0 - fresnel)
    + (sky * fresnel * mix(0.7, 1.0, max(glass, metal)) + highlight * (0.2 + 0.8 * fresnel)) * (1.0 - 0.5 * seams)
    + emission;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`
