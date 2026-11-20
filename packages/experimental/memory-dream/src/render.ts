/**
 * Render worklist chunks into bounded model input text.
 * Conservative token estimation: CJK ~1 token/char, ASCII ~4 chars/token.
 * @module @tomato/memory-dream/render
 */

import type { Context } from '@tomato/cordis'
import type { MemoryView, MemoryRecord, EpisodeRecord } from '@tomato/experimental-memory'
import type { DreamTarget, SessionSummaryChain } from './types.ts'

/**
 * Conservative token estimate for a text string.
 * @param text - the text to measure.
 * @returns an estimate four characters to the token.
 */
export function estimateTokens(text: string): number {
  let tokens = 0
  for (const char of text) {
    const code = char.charCodeAt(0)
    // CJK Unified Ideographs, Hiragana, Katakana, CJK punctuation
    if (
      (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3040 && code <= 0x30FF)
      || (code >= 0x3000 && code <= 0x303F) || (code >= 0xFF00 && code <= 0xFFEF)
    ) {
      tokens += 1
    } else {
      tokens += 0.25 // ~4 chars per token for ASCII
    }
  }
  return Math.ceil(tokens)
}

/** Render one target's records into model input lines. */
function renderTargetRecords(
  ctx: Context,
  view: MemoryView,
  target: DreamTarget,
): { text: string; tokens: number } {
  const records = ctx.memory.list(view)
  const recordMap = new Map(records.map(r => [r.id, r]))
  const lines: string[] = [`## target: ${target.id} (${target.reason})`, target.summary]

  for (const id of target.recordIds) {
    const record = recordMap.get(id as MemoryRecord['id'])
    if (record === undefined) continue
    const pinned = record.pinned ? ' pinned=yes' : ''
    const evidence = record.evidence !== undefined ? ` evidence=${record.evidence}` : ''
    const proposal = record.proposalFor !== undefined ? ` proposalFor=${record.proposalFor}` : ''
    const updated = new Date(record.updatedAt).toISOString().slice(0, 10)
    lines.push(`- id=${record.id} kind=${record.kind} entity=${record.entity} key=${record.key} status=${record.status} updated=${updated}${pinned}${evidence}${proposal}`)
    lines.push(`  value: ${record.value}`)
  }

  // Add evidence episodes (bounded)
  const episodes = ctx.memory.listEpisodes(view)
  const episodeMap = new Map(episodes.map(e => [e.id, e]))
  let episodeCount = 0
  for (const id of target.episodeIds) {
    if (episodeCount >= 5) break
    const episode = episodeMap.get(id as EpisodeRecord['id'])
    if (episode === undefined) continue
    lines.push(`  evidence episode=${episode.id} kind=${episode.kind} title="${episode.title}" facts=[${episode.facts.join('; ')}]`)
    episodeCount++
  }

  const text = lines.join('\n')
  return { text, tokens: estimateTokens(text) }
}

/** Render summary chains as context for the model. */
function renderSummaryContext(chains: ReadonlyMap<string, SessionSummaryChain>): string {
  const lines: string[] = ['## session summaries']
  for (const [, chain] of chains) {
    if (chain.summaries.length === 0) continue
    lines.push(`session=${chain.sessionId}:`)
    for (const summary of chain.summaries.slice(0, 3)) {
      lines.push(`  ${summary.title}: ${summary.facts.join('; ')}`)
    }
  }
  return lines.join('\n')
}

/**
 * Render a chunk of targets into a single model input, respecting the token budget.
 * @param ctx - context carrying `ctx.memory`.
 * @param view - memory view.
 * @param targets - targets in this chunk.
 * @param chains - session summary chains for context.
 * @param tokenBudget - maximum tokens for the rendered input.
 * @returns the rendered input text and its token count.
 */
export function renderChunk(
  ctx: Context,
  view: MemoryView,
  targets: readonly DreamTarget[],
  chains: ReadonlyMap<string, SessionSummaryChain>,
  tokenBudget: number,
): { input: string; tokens: number } {
  const summaryText = renderSummaryContext(chains)
  let tokens = estimateTokens(summaryText)
  const parts: string[] = [summaryText]

  for (const target of targets) {
    const rendered = renderTargetRecords(ctx, view, target)
    if (tokens + rendered.tokens > tokenBudget) {
      parts.push(`\n[${targets.length - parts.length + 1} more targets omitted due to token budget]`)
      break
    }
    parts.push(rendered.text)
    tokens += rendered.tokens
  }

  const input = parts.join('\n\n')
  return { input, tokens: estimateTokens(input) }
}
