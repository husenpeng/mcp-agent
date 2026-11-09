/**
 * Ranking of active memory records against free text and optional
 * alternative wordings. Lexical matching uses `Intl.Segmenter` word segments,
 * lowercased, so Chinese and Latin text share one rule. The service may blend
 * those scores with vector similarity from an optional embedding provider;
 * this module owns the lexical score and the similarity arithmetic.
 */
import type { EpisodeRecord, MemoryRecord } from './storage.ts'

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

/** Score weight of a match through an alternative wording relative to the literal query. */
export const ALTERNATIVE_WEIGHT = 0.7

/**
 * Split text into lowercased word-like segments.
 * @param text - arbitrary user or record text.
 * @returns distinct word segments in first-occurrence order.
 */
export function memoryTokens(text: string): string[] {
  const tokens = new Set<string>()
  for (const segment of segmenter.segment(text.toLowerCase())) {
    if (segment.isWordLike === true) tokens.add(segment.segment)
  }
  return [...tokens]
}

/** Searchable text of one record: identifiers split at their separators, plus the value.
 * @param record - stored record whose text a provider embeds.
 * @returns one line combining the entity, key, and value.
 */
export function memoryEmbeddingText(record: MemoryRecord): string {
  return `${record.entity.replaceAll(/[:-]/gu, ' ')} ${record.key.replaceAll('-', ' ')} ${record.value}`
}

/** Searchable text of one episode.
 * @param episode - stored episode whose text a provider embeds.
 * @returns the type, title, subtitle, narrative, facts, concepts, files, and tool.
 */
export function episodeEmbeddingText(episode: EpisodeRecord): string {
  return [
    episode.type, episode.title, episode.subtitle ?? '', episode.narrative,
    ...episode.facts, ...episode.concepts, ...episode.filesRead, ...episode.filesModified, episode.tool ?? '',
  ].join(' ')
}

/** One record with its lexical or blended score. */
export interface ScoredMemory {
  /** Candidate record. */
  readonly record: MemoryRecord
  /** Best phrasing coverage, or the blended score when semantic ranking applied. */
  readonly score: number
}

/** One episode with its lexical or blended score. */
export interface ScoredEpisode {
  /** Candidate episode. */
  readonly record: EpisodeRecord
  /** Best phrasing coverage, or the blended score when semantic ranking applied. */
  readonly score: number
}

/** Fraction of a non-empty phrasing's tokens the text contains. */
function coverage(phrasing: readonly string[], tokens: ReadonlySet<string>): number {
  return phrasing.filter(token => tokens.has(token)).length / phrasing.length
}

/** Score items by the best phrasing coverage of their text. */
function scoreByText<T>(
  items: readonly T[],
  textOf: (item: T) => string,
  text: string,
  alternatives: readonly string[],
): { item: T; score: number }[] {
  const query = memoryTokens(text)
  const others = alternatives.map(memoryTokens).filter(tokens => tokens.length > 0)
  const scored = items.flatMap((item) => {
    if (query.length === 0) return [{ item, score: 0 }]
    const tokens = new Set(memoryTokens(textOf(item)))
    const score = Math.max(coverage(query, tokens), ...others.map(phrasing => coverage(phrasing, tokens) * ALTERNATIVE_WEIGHT))
    return score === 0 ? [] : [{ item, score }]
  })
  scored.sort((left, right) => right.score - left.score)
  return scored
}

/**
 * Fraction of the larger token set that both sets share, so either value
 * fitting inside the other scores 1. Empty sets score 0.
 * @param left - one token set, such as a pending value.
 * @param right - the other token set, such as a stored value.
 * @returns shared tokens over `max(left.size, right.size)`.
 */
export function tokenContainment(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const larger = Math.max(left.size, right.size)
  if (larger === 0) return 0
  const [smaller, other] = left.size <= right.size ? [left, right] : [right, left]
  let shared = 0
  for (const token of smaller) if (other.has(token)) shared += 1
  return shared / larger
}

/**
 * Score records by the best phrasing coverage: the literal query counts in
 * full, each alternative wording at {@link ALTERNATIVE_WEIGHT}. An empty query
 * keeps every record at score 0 so the caller can order by recency alone.
 * @param records - candidate active records of one scope.
 * @param text - free-text query.
 * @param alternatives - additional wordings of the same query.
 * @returns scored records, best match first; records matching no phrasing are dropped unless the query is empty.
 */
export function scoreMemories(
  records: readonly MemoryRecord[],
  text: string,
  alternatives: readonly string[] = [],
): ScoredMemory[] {
  return scoreByText(records, memoryEmbeddingText, text, alternatives)
    .map(entry => ({ record: entry.item, score: entry.score }))
    .sort((left, right) => right.score - left.score
      || right.record.updatedAt - left.record.updatedAt
      || left.record.id.localeCompare(right.record.id))
}

/**
 * Score episodes by the best phrasing coverage of their type, title, narrative, facts, concepts, and files.
 * @param episodes - candidate episodes of one project.
 * @param text - free-text query.
 * @param alternatives - additional wordings of the same query.
 * @returns scored episodes, best match first; episodes matching no phrasing are dropped unless the query is empty.
 */
export function scoreEpisodes(
  episodes: readonly EpisodeRecord[],
  text: string,
  alternatives: readonly string[] = [],
): ScoredEpisode[] {
  return scoreByText(episodes, episodeEmbeddingText, text, alternatives)
    .map(entry => ({ record: entry.item, score: entry.score }))
    .sort((left, right) => right.score - left.score
      || right.record.createdAt - left.record.createdAt
      || left.record.id.localeCompare(right.record.id))
}

/**
 * Rank records by the best phrasing coverage, keeping at most `limit`.
 * @param records - candidate active records of one scope.
 * @param text - free-text query.
 * @param limit - maximum records returned.
 * @param alternatives - additional wordings of the same query.
 * @returns at most `limit` records, best match first; records matching no phrasing are dropped.
 */
export function rankMemories(
  records: readonly MemoryRecord[],
  text: string,
  limit: number,
  alternatives: readonly string[] = [],
): MemoryRecord[] {
  return scoreMemories(records, text, alternatives).slice(0, limit).map(entry => entry.record)
}

/**
 * Cosine similarity of two vectors of the same length.
 * @param left - one vector.
 * @param right - the other vector.
 * @returns similarity from -1 to 1; a zero vector scores 0.
 * @throws TypeError when the vectors differ in length.
 */
export function cosineSimilarity(left: Float32Array, right: Float32Array): number {
  if (left.length !== right.length) {
    throw new TypeError(`experimental-memory: vectors differ in length (${left.length} and ${right.length})`)
  }
  if (left.length === 0) return 0
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let index = 0; index < left.length; index += 1) {
    /* v8 ignore next -- equal lengths place every index inside both vectors */
    const l = left[index] ?? 0
    /* v8 ignore next -- equal lengths place every index inside both vectors */
    const r = right[index] ?? 0
    dot += l * r
    leftNorm += l * l
    rightNorm += r * r
  }
  return leftNorm === 0 || rightNorm === 0 ? 0 : dot / Math.sqrt(leftNorm * rightNorm)
}
