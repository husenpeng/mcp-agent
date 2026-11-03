/**
 * Ranking of active memory records against free text and optional
 * alternative wordings. Matching is lexical: `Intl.Segmenter` word segments,
 * lowercased, so Chinese and Latin text share one rule. Semantic reach comes
 * from the alternative wordings a caller supplies, not from embeddings.
 */
import type { MemoryRecord } from './storage.ts'

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

/** Searchable text of one record: identifiers split at their separators, plus the value. */
function recordText(record: MemoryRecord): string {
  return `${record.entity.replaceAll(/[:-]/gu, ' ')} ${record.key.replaceAll('-', ' ')} ${record.value}`
}

/** Fraction of a non-empty phrasing's tokens the record contains. */
function coverage(phrasing: readonly string[], tokens: ReadonlySet<string>): number {
  return phrasing.filter(token => tokens.has(token)).length / phrasing.length
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
 * Rank records by the best phrasing coverage: the literal query counts in
 * full, each alternative wording at {@link ALTERNATIVE_WEIGHT}. Ties break by
 * the most recent update, then by id. An empty query keeps every record and
 * orders them by recency alone.
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
  const query = memoryTokens(text)
  const others = alternatives.map(memoryTokens).filter(tokens => tokens.length > 0)
  const scored = records.flatMap((record) => {
    if (query.length === 0) return [{ record, score: 0 }]
    const tokens = new Set(memoryTokens(recordText(record)))
    const score = Math.max(coverage(query, tokens), ...others.map(phrasing => coverage(phrasing, tokens) * ALTERNATIVE_WEIGHT))
    return score === 0 ? [] : [{ record, score }]
  })
  scored.sort((left, right) => right.score - left.score
    || right.record.updatedAt - left.record.updatedAt
    || left.record.id.localeCompare(right.record.id))
  return scored.slice(0, limit).map(entry => entry.record)
}
