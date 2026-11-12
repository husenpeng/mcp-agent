/**
 * Deterministic operational lessons from tool outcomes. A broad `glob` that
 * returns a capped or large result becomes one project-history episode, without
 * an auxiliary model request, so a later Session can see that the tree is large
 * and start with `list_dir` or a narrower search.
 * @module @tomato/experimental-tool-memory/lessons
 */

import { createHash } from 'node:crypto'

/** Default path count at which a glob becomes a lesson. */
export const GLOB_LESSON_MIN_PATHS = 200

/** Most lessons one Session records. */
export const LESSON_MAX_PER_SESSION = 5

/** One lesson before it is stored as an episode. */
export interface LessonDraft {
  /** One-line title. */
  readonly title: string
  /** What happened and what to do next. */
  readonly narrative: string
  /** Durable statements. */
  readonly facts: readonly string[]
  /** Searchable keywords. */
  readonly concepts: readonly string[]
  /** Content fingerprint used to update a repeated lesson instead of appending. */
  readonly fingerprint: string
}

/** The parts of a glob result meta the lesson reads. */
interface GlobMeta {
  readonly shape?: unknown
  readonly truncated?: unknown
  readonly total?: unknown
}

/**
 * Read the capped glob result meta from an opaque tool result `meta`.
 * @param meta - the tool result's presentation meta.
 * @returns the total and truncation state, or `undefined` for another shape.
 */
function globOutcome(meta: unknown): { total: number; truncated: boolean } | undefined {
  if (typeof meta !== 'object' || meta === null) return undefined
  const value = meta as GlobMeta
  if (value.shape !== 'paths') return undefined
  const total = typeof value.total === 'number' && Number.isFinite(value.total) ? value.total : 0
  return { total, truncated: value.truncated === true }
}

/**
 * Build one lesson from a finished glob call.
 * @param args - the call's parsed arguments.
 * @param meta - the tool result's presentation meta.
 * @param minPaths - path count at or above which the result is worth remembering.
 * @returns the lesson, or `undefined` for a focused search.
 */
export function globLesson(args: unknown, meta: unknown, minPaths: number = GLOB_LESSON_MIN_PATHS): LessonDraft | undefined {
  const outcome = globOutcome(meta)
  if (outcome === undefined) return undefined
  if (!outcome.truncated && outcome.total < minPaths) return undefined
  const pattern = typeof args === 'object' && args !== null
    ? (args as { pattern?: unknown }).pattern
    : undefined
  const root = typeof args === 'object' && args !== null
    ? (args as { path?: unknown }).path
    : undefined
  const patternText = typeof pattern === 'string' && pattern.trim() !== '' ? pattern : '*'
  const rootText = typeof root === 'string' && root.trim() !== '' ? root : '.'
  const paths = outcome.total
  const fingerprint = createHash('sha256').update(`glob\u0000${rootText}\u0000${patternText}`).digest('hex')
  return {
    title: `Broad glob returned ${paths} paths`,
    narrative: `A glob for "${patternText}" under "${rootText}" returned ${paths} paths${outcome.truncated ? ' and was capped' : ''}. `
      + 'For "what is in this directory", use list_dir first; for file discovery, add path, depth, or exclude before searching the whole tree.',
    facts: [`glob "${patternText}" returned ${paths} paths`],
    concepts: ['file-search', 'glob', 'navigation'],
    fingerprint,
  }
}

/** One failed call followed by a successful retry in the same turn. */
export interface RetryPair {
  /** Tool both calls used. */
  readonly tool: string
  /** Normalized failure of the first call. */
  readonly failure: string
  /** Stable identity of the arguments both calls aimed at. */
  readonly target: string
}

/**
 * Build one lesson from a turn that failed a call and then succeeded with the
 * same tool and target. The lesson names the failure and the retry so a later
 * Session starts from the working approach.
 * @param pair - tool, normalized failure, and target identity.
 * @returns the lesson to store as an episode.
 */
export function retryLesson(pair: RetryPair): LessonDraft {
  const fingerprint = createHash('sha256').update(`retry\u0000${pair.tool}\u0000${pair.target}\u0000${pair.failure}`).digest('hex')
  return {
    title: `${pair.tool} retry succeeded after a failure`,
    narrative: `The ${pair.tool} call failed first with "${pair.failure}"; retrying the same target then succeeded. `
      + 'Check the retry arguments or environment before repeating the first attempt.',
    facts: [`${pair.tool} failed first: ${pair.failure}`],
    concepts: [pair.tool, 'retry', 'failure'],
    fingerprint,
  }
}
