/**
 * Collect sessions within the time window and assemble their summary chains
 * from stored summary episodes. No model calls.
 * @module @tomato/memory-dream/collect
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/session-query'
import type { MemoryView } from '@tomato/experimental-memory'
import type { SessionSummaryChain } from './types.ts'

/** Sessions in the window that belong to this workspace. */
export interface WindowSession {
  readonly sessionId: string
  readonly createdAt: number
  readonly cwd?: string
}

/**
 * List sessions created within the window, filtered to the workspace.
 * @param ctx - context carrying `ctx.sessionQuery`.
 * @param view - memory view to scope the collection.
 * @param since - epoch-millisecond lower bound on session creation.
 * @param signal - cancellation.
 * @returns sessions in the window, newest first.
 */
export async function collectWindowSessions(
  ctx: Context,
  view: MemoryView,
  since: number,
  signal?: AbortSignal,
): Promise<WindowSession[]> {
  const records = await ctx.sessionQuery.listSessions(signal)
  const workspacePath = view.workspace?.path
  return records
    .filter(record => record.header.createdAt >= since)
    .filter((record) => {
      if (workspacePath === undefined) return true
      const cwd = record.header.cwd
      if (cwd === undefined) return false
      return cwd === workspacePath || cwd.startsWith(workspacePath + '/')
    })
    .map(record => ({
      sessionId: record.header.id,
      createdAt: record.header.createdAt,
      ...(record.header.cwd !== undefined ? { cwd: record.header.cwd } : {}),
    }))
}

/**
 * Assemble summary chains for the given sessions from stored summary episodes.
 * Groups summary episodes by session, sorts by creation time.
 * @param ctx - context carrying `ctx.memory`.
 * @param view - memory view to search episodes in.
 * @param sessions - sessions to assemble chains for.
 * @returns chains keyed by session id.
 */
export function assembleSummaryChains(
  ctx: Context,
  view: MemoryView,
  sessions: readonly WindowSession[],
): Map<string, SessionSummaryChain> {
  const sessionIds = new Set(sessions.map(s => s.sessionId))
  const chains = new Map<string, SessionSummaryChain>()
  for (const session of sessions) {
    chains.set(session.sessionId, { sessionId: session.sessionId, summaries: [], totalChars: 0 })
  }
  const allEpisodes = ctx.memory.listEpisodes(view)
  for (const episode of allEpisodes) {
    if (episode.kind !== 'summary') continue
    if (!sessionIds.has(episode.source.sessionId)) continue
    const chain = chains.get(episode.source.sessionId)
    if (chain === undefined) continue
    const entry = {
      id: episode.id,
      title: episode.title,
      narrative: episode.narrative,
      facts: episode.facts,
      createdAt: episode.createdAt,
    }
    const updated = {
      ...chain,
      summaries: [...chain.summaries, entry].sort((a, b) => a.createdAt - b.createdAt),
      totalChars: chain.totalChars + episode.title.length + episode.narrative.length + episode.facts.join('').length,
    }
    chains.set(episode.source.sessionId, updated)
  }
  return chains
}
