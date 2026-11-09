/**
 * Choosing the newest published version of one plugin that the running TOMATO
 * admits. `tomato plugin` and the running Plugin Manager share this walk so a
 * version refusal leads to the same fallback in both: the one people see in
 * the Plugins page and the one the CLI prints.
 *
 * Registry transport is the caller's: each supplies the published versions and
 * a manifest reader, both through `pnpm view` inside the profile, so a lookup
 * keeps the registry, proxy, and authentication settings of the installation.
 */

import semver from 'semver'
import { evaluatePluginCompatibility } from '@tomato/app-boot'

/** Most published versions one resolution reads; every candidate costs a registry request. */
export const RESOLUTION_LIMIT = 8

/** One published version a resolution tried and did not select. */
export interface VersionRejection {
  version: string
  /** Present when the version declared requirements the running runtime does not satisfy. */
  requirements?: Record<string, string>
  /** Present when the version's manifest could not be read or validated. */
  reason?: string
}

/** What a resolution settled on, and why the newer candidates did not qualify. */
export interface VersionResolution {
  /** `unknown` means the first candidate could not be judged, so the caller's own check still decides. */
  status: 'resolved' | 'none' | 'unknown'
  runtimeVersion: string
  /** The exact version the caller named, when it named one rather than a range. */
  requested?: string
  /** The selected version: the newest candidate the running runtime admits. */
  selected?: string
  /** Every candidate read before `selected`, newest first. */
  rejected: VersionRejection[]
  /** Present with `unknown`: why the first candidate could not be judged. */
  reason?: string
}

/** The inputs a resolution reads. */
export interface ResolutionRequest {
  /** Every published version the registry lists, in any order. */
  versions: readonly string[]
  /**
   * Read one version's manifest.
   * @param version - exact published version.
   * @returns the manifest with the fields a compatibility check reads.
   */
  manifestOf: (version: string) => Promise<object>
  /** The running TOMATO version. */
  runtimeVersion: string
  /** The profile's exact-version exemptions, as `readProfileVersionExemptions` returns them. */
  exemptions?: Readonly<Record<string, readonly string[]>>
  /** A range the caller named; versions outside it are not candidates. */
  range?: string
  /** The exact version the caller named; it is tried before the rest. */
  requested?: string
  /** Bound on the candidates read; defaults to {@link RESOLUTION_LIMIT}. */
  limit?: number
  /**
   * Refuse one candidate the caller cannot install whatever its requirements say, such as a version
   * that declares no bundle or a prerelease an automatic choice must not make.
   * @param manifest - the candidate's manifest.
   * @param version - the candidate's version.
   * @returns why the candidate is ineligible, or undefined to judge it.
   */
  skip?: (manifest: object, version: string) => string | undefined
}

/**
 * The versions to try, newest first, with the requested one first when the caller named it.
 * Versions inside the named range come first; the rest follow, because a range no published version
 * can satisfy is exactly when the fallback is needed.
 * @param versions - every published version.
 * @param options - the range and exact version the caller named.
 * @returns the candidate order; malformed versions and a malformed range leave nothing to try.
 */
export function candidateVersions(
  versions: readonly string[],
  options: { range?: string; requested?: string } = {},
): string[] {
  const admits = (version: string): boolean => {
    if (options.range === undefined) return true
    try {
      return semver.satisfies(version, options.range, { includePrerelease: true })
    } catch {
      // A range the registry cannot express admits no version, so every version follows it.
      return false
    }
  }
  const published = versions
    .filter(version => semver.valid(version) !== null)
    .sort((left, right) => semver.rcompare(left, right))
  const ordered = [...published.filter(version => admits(version)), ...published.filter(version => !admits(version))]
  const requested = options.requested
  if (requested === undefined || !ordered.includes(requested)) return ordered
  return [requested, ...ordered.filter(version => version !== requested)]
}

/**
 * Walk the published versions until one is admitted by the running runtime.
 * @param request - the published versions, the manifest reader, the runtime version, and what the caller named.
 * @returns the selected version, every rejection read before it, or why the walk stopped without one.
 */
export async function resolveCompatibleVersion(request: ResolutionRequest): Promise<VersionResolution> {
  const limit = request.limit ?? RESOLUTION_LIMIT
  const candidates = candidateVersions(request.versions, request)
  const rejected: VersionRejection[] = []
  const base = {
    runtimeVersion: request.runtimeVersion,
    ...request.requested === undefined ? {} : { requested: request.requested },
  }
  if (candidates.length === 0) return { ...base, status: 'none', rejected }
  for (const [index, version] of candidates.slice(0, limit).entries()) {
    let judged: ReturnType<typeof evaluatePluginCompatibility> | undefined
    let judgedManifest: object
    try {
      judgedManifest = await request.manifestOf(version)
      judged = evaluatePluginCompatibility(judgedManifest, request.exemptions ?? {}, request.runtimeVersion)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      // The candidate the caller asked for decides on its own: an unreadable one leaves the verdict unknown.
      if (index === 0) return { ...base, status: 'unknown', rejected, reason }
      rejected.push({ version, reason })
      continue
    }
    if (request.skip !== undefined) {
      const refusal = request.skip(judgedManifest, version)
      if (refusal !== undefined) {
        rejected.push({ version, reason: refusal })
        continue
      }
    }
    if (judged === undefined || judged.exempted) return { ...base, status: 'resolved', selected: version, rejected }
    rejected.push({ version, requirements: judged.requirements })
  }
  return { ...base, status: 'none', rejected }
}
