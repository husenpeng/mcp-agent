// Whether one published plugin version may run on the running TOMATO release.
//
// The rule is the installer's, in `packages/boot/app-boot/src/plugin-compatibility.ts`:
// an own `engines.tomato` range decides alone, otherwise every TOMATO peer package must match the
// runtime version. Published manifests still use DeepSeek Harness names, so peers are mapped the
// same way {@link adaptManifest} maps them; a package under the old scope that TOMATO does not
// rename stays a third-party peer and is left alone. Vendored packages carry their pinned upstream
// versions instead of the runtime's, so their peers say nothing about the release.
import semver from 'semver'
import { mapPackageName } from './compat.js'

/** Vendored packages versioned by their pinned source, not by the TOMATO runtime release. */
const VENDORED_PACKAGE = /^@tomato\/(?:cordis(?:-plugin-[a-z0-9-]+)?|cosmokit|schemastery)$/u

/** Peer ranges that mean "whatever the running runtime supplies". */
const RUNTIME_RANGE = new Set(['workspace:^', 'workspace:~', 'workspace:*'])

/** @param {unknown} value - candidate. @returns {boolean} whether it is a plain object. */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Whether the running version satisfies one range; a malformed or empty range never does.
 * @param {string} runtimeVersion - the running TOMATO version.
 * @param {string} range - the declared range.
 * @returns {boolean} whether the range admits the runtime.
 */
function satisfies(runtimeVersion, range) {
  if (range.trim() === '') return false
  try {
    return semver.satisfies(runtimeVersion, range, { includePrerelease: true })
  } catch {
    return false
  }
}

/**
 * The requirements a published manifest declares, in TOMATO terms.
 * @param {Record<string, unknown>} manifest - the published `package.json`.
 * @returns {{ kind: 'engine' | 'peers', ranges: Record<string, string> }} the declared ranges,
 *   keyed `engines.tomato` for an engine declaration and by mapped peer name otherwise.
 * @throws {Error} when a declaration is not a record of string ranges.
 */
function declaredRanges(manifest) {
  const engines = manifest.engines === undefined ? {} : manifest.engines
  if (!isRecord(engines)) throw new Error('engines is not an object')
  // Adaptation renames `engines.dsh` to `engines.tomato`; both select the same runtime.
  const engine = Object.hasOwn(engines, 'tomato') ? engines.tomato : engines.dsh
  if (engine !== undefined) {
    if (typeof engine !== 'string') throw new Error('engines.tomato is not a string')
    return { kind: 'engine', ranges: { 'engines.tomato': engine } }
  }
  const peers = manifest.peerDependencies === undefined ? {} : manifest.peerDependencies
  if (!isRecord(peers)) throw new Error('peerDependencies is not an object')
  const ranges = {}
  for (const [name, range] of Object.entries(peers)) {
    if (typeof range !== 'string') throw new Error(`peerDependencies[${JSON.stringify(name)}] is not a string`)
    const mapped = mapPackageName(name)
    if (mapped !== '@tomato/cli' && !mapped.startsWith('@tomato/')) continue
    if (VENDORED_PACKAGE.test(mapped)) continue
    ranges[mapped] = range
  }
  return { kind: 'peers', ranges }
}

/**
 * Judge one published manifest against the running TOMATO version.
 * @param {object} manifest - the published `package.json`.
 * @param {string} runtimeVersion - the running TOMATO version.
 * @returns {{ status: 'compatible' }
 *   | { status: 'incompatible', requirements: Record<string, string> }
 *   | { status: 'unknown', reason: string }} the verdict; `requirements` holds only the
 *   declarations the runtime does not satisfy, as the installer reports them.
 */
export function evaluateCompatibility(manifest, runtimeVersion) {
  if (!isRecord(manifest)) return { status: 'unknown', reason: 'the manifest is not an object' }
  if (semver.valid(runtimeVersion) === null) return { status: 'unknown', reason: `invalid TOMATO version ${JSON.stringify(runtimeVersion)}` }
  let declared
  try {
    declared = declaredRanges(manifest)
  } catch (error) {
    return { status: 'unknown', reason: error?.message ?? String(error) }
  }
  const requirements = {}
  for (const [name, range] of Object.entries(declared.ranges)) {
    const requirement = declared.kind === 'peers' && RUNTIME_RANGE.has(range) ? runtimeVersion : range
    if (!satisfies(runtimeVersion, requirement)) requirements[name] = range
  }
  if (Object.keys(requirements).length === 0) return { status: 'compatible' }
  return { status: 'incompatible', requirements }
}

/**
 * Order candidate versions newest first, keeping the requested one at the front.
 * @param {Array<{ version: string }>} versions - listed versions.
 * @param {string} requested - the version the reader asked for.
 * @returns {Array<{ version: string }>} the search order; the requested version is absent from the list it names.
 */
export function candidateOrder(versions, requested) {
  const rest = versions
    .filter(entry => entry.version !== requested)
    .sort((left, right) => {
      const valid = { left: semver.valid(left.version), right: semver.valid(right.version) }
      if (valid.left === null || valid.right === null) {
        if (valid.left === valid.right) return 0
        return valid.left === null ? 1 : -1
      }
      return semver.rcompare(valid.left, valid.right, { includePrerelease: true })
    })
  return [...versions.filter(entry => entry.version === requested), ...rest]
}