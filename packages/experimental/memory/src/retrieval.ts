/**
 * Ranking of active memory records against free text. Matching is lexical:
 * `Intl.Segmenter` word segments, lowercased, so Chinese and Latin text share
 * one rule. There is no semantic or embedding similarity.
 */
import type { MemoryRecord } from './storage.ts'

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

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

/**
 * Rank records by the fraction of query tokens each one contains, breaking
 * ties by the most recent update. An empty query keeps every record and orders
 * them by recency alone.
 * @param records - candidate active records of one workspace.
 * @param text - free-text query.
 * @param limit - maximum records returned.
 * @returns at most `limit` records, best match first; records matching no query token are dropped.
 */
export function rankMemories(records: readonly MemoryRecord[], text: string, limit: number): MemoryRecord[] {
  const query = memoryTokens(text)
  const scored = records.flatMap((record) => {
    if (query.length === 0) return [{ record, score: 0 }]
    const tokens = new Set(memoryTokens(recordText(record)))
    const hits = query.filter(token => tokens.has(token)).length
    return hits === 0 ? [] : [{ record, score: hits / query.length }]
  })
  scored.sort((left, right) => right.score - left.score
    || right.record.updatedAt - left.record.updatedAt
    || left.record.id.localeCompare(right.record.id))
  return scored.slice(0, limit).map(entry => entry.record)
}
