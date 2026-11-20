/**
 * ORIENT: build the consolidation worklist from current records and episodes.
 * Pure computation, no model calls.
 * @module @tomato/memory-dream/worklist
 */

import type { Context } from '@tomato/cordis'
import type { MemoryView } from '@tomato/experimental-memory'
import type { DreamTarget } from './types.ts'

/** Options for worklist construction. */
export interface WorklistOptions {
  /** Maximum pinned records before flagging. */
  readonly maxPinnedRecords: number
  /** Candidate age in days before flagging as stale. */
  readonly staleCandidateDays: number
  /** Minimum evidence count for a repeated-fact target. */
  readonly minRepeatedFactEvidence: number
}

/** Attribute overlap at which two active records count as naming the same attribute. */
export const CONFLICT_KEY_SIMILARITY = 0.6

/**
 * Token overlap of two lower-kebab-case attributes, ignoring word order.
 * @param left - one attribute.
 * @param right - the other attribute.
 * @returns Jaccard overlap from 0 to 1.
 */
export function keySimilarity(left: string, right: string): number {
  const tokensOf = (value: string): Set<string> => new Set(value.split('-').filter(token => token !== ''))
  const a = tokensOf(left)
  const b = tokensOf(right)
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const token of a) if (b.has(token)) shared++
  return shared / (a.size + b.size - shared)
}

/** Default worklist options. */
export const DEFAULT_WORKLIST_OPTIONS: WorklistOptions = {
  maxPinnedRecords: 20,
  staleCandidateDays: 30,
  minRepeatedFactEvidence: 2,
}

/**
 * Build the consolidation worklist by scanning records and episodes.
 * @param ctx - context carrying `ctx.memory`.
 * @param view - memory view to scan.
 * @param options - thresholds for flagging targets.
 * @returns consolidation targets.
 */
export function buildWorklist(
  ctx: Context,
  view: MemoryView,
  options: WorklistOptions = DEFAULT_WORKLIST_OPTIONS,
): DreamTarget[] {
  const records = ctx.memory.list(view)
  const targets: DreamTarget[] = []

  // 1. Duplicate clusters: use the service's own duplicates() for each active record
  const activeRecords = records.filter(r => r.status === 'active')
  const seen = new Set<string>()
  for (const record of activeRecords) {
    if (seen.has(record.id)) continue
    const dupes = ctx.memory.duplicates({
      owner: record.owner,
      scope: record.scope,
      kind: record.kind,
      entity: record.entity,
      key: record.key,
      value: record.value,
    })
    if (dupes.length === 0) continue
    const clusterIds = [record.id, ...dupes.map(d => d.record.id)]
    for (const id of clusterIds) seen.add(id)
    targets.push({
      id: `dup-${record.id}`,
      reason: 'duplicate-cluster',
      recordIds: clusterIds,
      episodeIds: [],
      summary: `${clusterIds.length} records share similar content: "${record.entity}/${record.key}"`,
    })
  }

  // 2. Identity conflicts: same subject and near-identical attribute, different statement
  for (let left = 0; left < activeRecords.length; left++) {
    for (let right = left + 1; right < activeRecords.length; right++) {
      const first = activeRecords[left]
      const second = activeRecords[right]
      if (first === undefined || second === undefined) continue
      if (first.entity !== second.entity || first.kind !== second.kind) continue
      if (first.scope.kind !== second.scope.kind) continue
      if (first.value.trim() === second.value.trim()) continue
      if (keySimilarity(first.key, second.key) < CONFLICT_KEY_SIMILARITY) continue
      targets.push({
        id: `conflict-${first.id}-${second.id}`,
        reason: 'identity-conflict',
        recordIds: [first.id, second.id],
        episodeIds: [],
        summary: `Two active records for "${first.entity}" disagree: "${first.key}" says "${first.value.slice(0, 60)}" while "${second.key}" says "${second.value.slice(0, 60)}"`,
      })
    }
  }

  // 3. Stale candidates
  const now = Date.now()
  const staleThreshold = now - options.staleCandidateDays * 86400000
  const candidates = records.filter(r => r.status === 'candidate')
  for (const candidate of candidates) {
    if (candidate.createdAt < staleThreshold && (candidate.evidence ?? 1) <= 1) {
      targets.push({
        id: `stale-${candidate.id}`,
        reason: 'stale-candidate',
        recordIds: [candidate.id],
        episodeIds: [],
        summary: `Candidate "${candidate.entity}/${candidate.key}" created ${Math.round((now - candidate.createdAt) / 86400000)}d ago with evidence=${candidate.evidence ?? 1}`,
      })
    }
  }

  // 3. Pinned over budget
  const pinned = activeRecords.filter(r => r.pinned && r.scope.kind === 'workspace')
  if (pinned.length > options.maxPinnedRecords) {
    targets.push({
      id: 'pinned-over-budget',
      reason: 'pinned-over-budget',
      recordIds: pinned.map(r => r.id),
      episodeIds: [],
      summary: `${pinned.length} pinned records exceeds budget of ${options.maxPinnedRecords}`,
    })
  }

  // 4. Repeated unpromoted facts from episodes
  const episodes = ctx.memory.listEpisodes(view)
  const factCounts = new Map<string, { count: number; episodeIds: string[] }>()
  for (const episode of episodes) {
    if (episode.kind !== 'observation') continue
    if (episode.promotedTo !== undefined) continue
    for (const fact of episode.facts) {
      const key = fact.toLowerCase().trim()
      if (!isConsolidatableFact(key)) continue
      const existing = factCounts.get(key)
      if (existing !== undefined) {
        existing.count++
        existing.episodeIds.push(episode.id)
      } else {
        factCounts.set(key, { count: 1, episodeIds: [episode.id] })
      }
    }
  }
  for (const [fact, info] of factCounts) {
    if (info.count >= options.minRepeatedFactEvidence) {
      targets.push({
        id: `fact-${simpleHash(fact)}`,
        reason: 'repeated-fact',
        recordIds: [],
        episodeIds: info.episodeIds,
        summary: `Fact repeated ${info.count}x across episodes, never promoted: "${fact.slice(0, 80)}"`,
      })
    }
  }

  return targets
}

/**
 * Whether a repeated fact is worth a consolidation target. A shell exit code
 * is a report about one call, not a statement about the project, and the
 * service's own promotion rule already refuses it.
 * @param fact - lower-cased fact text from an observation episode.
 * @returns `false` for exit-code-only noise, `true` otherwise.
 */
export function isConsolidatableFact(fact: string): boolean {
  return !/^exit\s+\d+$/u.test(fact)
}

/** Simple string hash for target id derivation. */
function simpleHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 8)
}
