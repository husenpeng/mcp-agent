/**
 * Long-task memory: carry the decisions, constraints, and open questions of a
 * crew's finished runs into the next run, so a long chain of runs keeps its
 * anchors after every run-scoped brief has been forgotten. Pure projection over
 * the durable flow ledger; the provider decides which runs it reads.
 * @module @tomato/experimental-robot-crew
 */

import { bound } from './brief.ts'
import type { BriefMemory } from './brief.ts'
import type { CrewEntry, CrewRun } from './types.ts'

/** One finished run with the ledger entries it recorded. */
export interface CarriedRun {
  /** The run whose memory is carried; only its identity and state are read. */
  readonly run: Pick<CrewRun, 'id' | 'state'>
  /** Ledger entries in sequence order. */
  readonly entries: readonly CrewEntry[]
}

/** Budget of one carry: how many runs to read and how many items to keep per kind. */
export interface CarryLimits {
  /** Most recent finished runs read, newest last. */
  readonly maxRuns: number
  /** Most items kept per kind, newest first. */
  readonly maxItems: number
}

/** Ledger `data.memory` value → the brief section it belongs to. */
const KIND_OF: Readonly<Record<string, keyof BriefMemory>> = {
  decision: 'decisions',
  constraint: 'constraints',
  open: 'open',
}

/** Longest one carried item may be, matching extraction. */
const CARRIED_ITEM_CHARS = 240

/**
 * Read the task memory a next run starts from.
 *
 * Only entries a member's own extraction wrote are carried, so the memory stays
 * a set of statements members already made. Newest items win: they are read
 * first, deduplicated by text, and capped per kind.
 * @param runs - finished runs of one crew, oldest first.
 * @param limits - run count and per-kind item budget.
 * @returns the decisions, constraints, and open questions to seed a new run with.
 */
export function carryTaskMemory(runs: readonly CarriedRun[], limits: CarryLimits): BriefMemory {
  const decisions: string[] = []
  const constraints: string[] = []
  const open: string[] = []
  const buckets: Record<keyof BriefMemory, string[]> = { decisions, constraints, open }
  const window = runs.filter(candidate => candidate.run.state !== 'queued' && candidate.run.state !== 'running').slice(-limits.maxRuns)
  for (const candidate of [...window].reverse()) {
    for (const entry of [...candidate.entries].reverse()) {
      if (entry.kind !== 'memory') continue
      const target = KIND_OF[String(entry.data?.memory ?? '')]
      if (target === undefined) continue
      const text = bound(entry.text ?? '', CARRIED_ITEM_CHARS)
      if (text === '') continue
      const bucket = buckets[target]
      if (bucket.length >= limits.maxItems) continue
      if (bucket.some(existing => existing.toLowerCase() === text.toLowerCase())) continue
      bucket.push(text)
    }
  }
  return { decisions, constraints, open }
}

/**
 * Count the items one carry holds.
 * @param memory - carried memory.
 * @returns the item count across every kind.
 */
export function carriedCount(memory: BriefMemory): number {
  return memory.decisions.length + memory.constraints.length + memory.open.length
}
