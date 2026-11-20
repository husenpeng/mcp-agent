/**
 * Backfill: detect sessions that need a summary (missing or oversized chains)
 * and produce summary episodes for them. Model calls happen only for gaps.
 * @module @tomato/memory-dream/backfill
 */

import type { SessionSummaryChain } from './types.ts'

/** A session that needs backfill. */
export interface BackfillGap {
  readonly sessionId: string
  readonly reason: 'no-summary' | 'chain-too-large'
  readonly existingChainChars: number
}

/**
 * Detect sessions in the window that lack a summary or whose chain exceeds
 * the budget. Sessions with a reasonable chain are skipped.
 * @param chains - assembled summary chains.
 * @param maxChainChars - maximum characters a chain can carry before it needs compression.
 * @returns sessions needing backfill.
 */
export function detectBackfillGaps(
  chains: ReadonlyMap<string, SessionSummaryChain>,
  maxChainChars: number,
): BackfillGap[] {
  const gaps: BackfillGap[] = []
  for (const [sessionId, chain] of chains) {
    if (chain.summaries.length === 0) {
      gaps.push({ sessionId, reason: 'no-summary', existingChainChars: 0 })
    } else if (chain.totalChars > maxChainChars) {
      gaps.push({ sessionId, reason: 'chain-too-large', existingChainChars: chain.totalChars })
    }
  }
  return gaps
}

/**
 * Format a session's summary chain as a single text block for the model.
 * @param chain - the chain to format.
 * @returns formatted text.
 */
export function formatSummaryChain(chain: SessionSummaryChain): string {
  const lines: string[] = [`Session: ${chain.sessionId}`]
  for (const summary of chain.summaries) {
    lines.push(`  [${new Date(summary.createdAt).toISOString().slice(0, 10)}] ${summary.title}`)
    if (summary.facts.length > 0) {
      lines.push(`    facts: ${summary.facts.join('; ')}`)
    }
  }
  return lines.join('\n')
}
