// Judging one published plugin version against the running TOMATO: the same rules
// the plugin installer applies, so the market never hands it a version it refuses,
// and a fallback to an older listed version when a release needs a newer harness.

import semver from 'semver'
import { mapPackageName } from './compat.ts'

/** Vendored packages versioned by their pinned source, not by the TOMATO runtime release. */
const VENDORED = /^@tomato\/(?:cordis(?:-plugin-[a-z0-9-]+)?|cosmokit|schemastery)$/u

/** Peer ranges that mean "whatever the running runtime supplies". */
const RUNTIME_RANGE = new Set(['workspace:^', 'workspace:~', 'workspace:*', '*', 'latest'])

/** Whether a value is a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Whether the running version satisfies one range; a malformed or empty range never does.
 * @param runtimeVersion - the running TOMATO version.
 * @param range - the declared range.
 * @returns whether the range admits the runtime.
 */
function satisfies(runtimeVersion: string, range: string): boolean {
  if (range.trim() === '') return false
  try {
    return semver.satisfies(runtimeVersion, range, { includePrerelease: true } as semver.RangeOptions)
  } catch {
    return false
  }
}

/**
 * The declarations of one manifest that gate its compatibility, most specific first: `engines.tomato` when the
 * package names it, otherwise its `@tomato/*` peers.
 * @param manifest - the published `package.json`.
 * @returns the ranges to satisfy.
 */
function declaredRanges(manifest: Record<string, unknown>): { kind: 'engine' | 'peers'; ranges: Readonly<Record<string, string>> } {
  const engines = isRecord(manifest.engines) ? manifest.engines : {}
  if (Object.hasOwn(engines, 'tomato')) {
    const engine = engines.tomato
    if (typeof engine !== 'string') throw new Error('engines.tomato is not a string')
    return { kind: 'engine', ranges: { 'engines.tomato': engine } }
  }
  const peers = isRecord(manifest.peerDependencies) ? manifest.peerDependencies : {}
  const ranges: Record<string, string> = {}
  for (const [name, value] of Object.entries(peers)) {
    if (typeof value !== 'string') continue
    if (VENDORED.test(name)) continue
    if (RUNTIME_RANGE.has(value.trim())) continue
    const mapped = mapPackageName(name)
    if (mapped !== '@tomato/cli' && !mapped.startsWith('@tomato/')) continue
    ranges[mapped] = value
  }
  return { kind: 'peers', ranges }
}

/** The verdict for one published version. */
export type Compatibility =
  | { readonly status: 'compatible' }
  | { readonly status: 'incompatible'; readonly requirements: Readonly<Record<string, string>> }
  | { readonly status: 'unknown'; readonly reason: string }

/**
 * Judge one published manifest against the running TOMATO version.
 * @param manifest - the published `package.json`.
 * @param runtimeVersion - the running TOMATO version.
 * @returns the verdict; `requirements` holds only the declarations the runtime does not satisfy.
 */
export function evaluateCompatibility(manifest: unknown, runtimeVersion: string): Compatibility {
  if (!isRecord(manifest)) return { status: 'unknown', reason: 'the manifest is not an object' }
  if (semver.valid(runtimeVersion) === null) return { status: 'unknown', reason: `invalid TOMATO version ${JSON.stringify(runtimeVersion)}` }
  let declared: ReturnType<typeof declaredRanges>
  try {
    declared = declaredRanges(manifest)
  } catch (error) {
    return { status: 'unknown', reason: (error as Error).message }
  }
  const requirements: Record<string, string> = {}
  for (const [name, range] of Object.entries(declared.ranges)) {
    if (!satisfies(runtimeVersion, range)) requirements[name] = range
  }
  return Object.keys(requirements).length === 0 ? { status: 'compatible' } : { status: 'incompatible', requirements }
}

/**
 * Order candidate versions newest first, keeping the requested one at the front.
 * @param versions - listed versions.
 * @param requested - the version the reader asked for.
 * @returns the search order, the requested version first.
 */
export function candidateOrder<T extends { readonly version: string }>(versions: readonly T[], requested: string): readonly T[] {
  const rest = [...versions.filter(entry => entry.version !== requested)].sort((left, right) => {
    const validLeft = semver.valid(left.version)
    const validRight = semver.valid(right.version)
    if (validLeft === null || validRight === null) return validLeft === validRight ? 0 : validLeft === null ? 1 : -1
    return semver.rcompare(validLeft, validRight, { includePrerelease: true } as semver.RangeOptions)
  })
  return [...versions.filter(entry => entry.version === requested), ...rest]
}