/**
 * Apply validated plan operations to the memory store.
 * Respects the configured apply mode: report (dry-run), candidates, or full.
 * @module @tomato/memory-dream/apply
 */

import type { Context } from '@tomato/cordis'
import type { MemoryView, MemoryRecord } from '@tomato/experimental-memory'
import { EpisodeId, MemoryId, normalizeIdentifier, normalizeStatement } from '@tomato/experimental-memory'
import type { DreamPlan, DreamOpResult } from './types.ts'

/** How aggressively to apply the plan. */
export type ApplyMode = 'report' | 'candidates' | 'full'

/**
 * Apply the validated plan to the memory store.
 * @param ctx - context carrying `ctx.memory`.
 * @param view - memory view to operate on.
 * @param plan - validated plan.
 * @param mode - how aggressively to apply.
 * @param sessionId - session that triggered this dream run.
 * @returns results for each operation.
 */
export async function applyPlan(
  ctx: Context,
  view: MemoryView,
  plan: DreamPlan,
  mode: ApplyMode,
  sessionId: string,
): Promise<DreamOpResult[]> {
  const results: DreamOpResult[] = []

  if (mode === 'report') {
    for (const merge of plan.merges) {
      results.push({ op: { ...merge }, status: 'applied', detail: `[report] would merge ${merge.dropIds.length} records into ${merge.keepId}` })
    }
    for (const proposal of plan.proposals) {
      results.push({ op: { ...proposal }, status: 'applied', detail: `[report] would propose replacing ${proposal.targetId}` })
    }
    for (const promotion of plan.promotions) {
      results.push({ op: { ...promotion }, status: 'applied', detail: `[report] would promote ${promotion.episodeIds.length} episodes into a candidate record` })
    }
    for (const id of plan.pins) {
      results.push({ op: { kind: 'pin', ids: [id] }, status: 'applied', detail: `[report] would pin ${id}` })
    }
    for (const id of plan.unpins) {
      results.push({ op: { kind: 'unpin', ids: [id] }, status: 'applied', detail: `[report] would unpin ${id}` })
    }
    for (const id of plan.prunes) {
      results.push({ op: { kind: 'prune', ids: [id] }, status: 'applied', detail: `[report] would prune candidate ${id}` })
    }
    return results
  }

  // Apply proposals first (preserve evidence)
  for (const proposal of plan.proposals) {
    try {
      const target = ctx.memory.list(view).find(r => r.id === proposal.targetId)
      if (target === undefined) {
        results.push({ op: { ...proposal }, status: 'rejected', detail: 'target not found' })
        continue
      }
      const saved = await ctx.memory.remember({
        owner: view.owner,
        scope: target.scope,
        kind: target.kind,
        entity: 'proposal',
        key: `replace-${simpleHash(proposal.targetId)}`,
        value: proposal.value,
        status: 'candidate',
        pinned: false,
        source: { sessionId: sessionId as MemoryRecord['source']['sessionId'] },
        proposalFor: MemoryId(proposal.targetId),
      })
      results.push({ op: { ...proposal }, status: 'applied', detail: `stored candidate ${saved.id}` })
    } catch (error: unknown) {
      results.push({ op: { ...proposal }, status: 'failed', detail: String(error) })
    }
  }

  const workspaceScope = view.workspace === undefined
    ? undefined
    : { kind: 'workspace' as const, workspaceId: view.workspace.id, path: view.workspace.path }
  for (const promotion of plan.promotions) {
    if (workspaceScope === undefined) {
      results.push({ op: { ...promotion }, status: 'rejected', detail: 'this view has no workspace' })
      continue
    }
    try {
      const entity = normalizeIdentifier(promotion.entity)
      const key = normalizeIdentifier(promotion.key)
      const value = normalizeStatement(promotion.value)
      const duplicate = ctx.memory.duplicates({ owner: view.owner, scope: workspaceScope, kind: 'constraint', entity, key, value })
      if (duplicate.length > 0) {
        results.push({ op: { ...promotion }, status: 'rejected', detail: 'a stored record already states this' })
        continue
      }
      const saved = await ctx.memory.remember({
        owner: view.owner,
        scope: workspaceScope,
        kind: 'constraint',
        entity,
        key,
        value,
        status: 'candidate',
        pinned: false,
        source: { sessionId: sessionId as MemoryRecord['source']['sessionId'], episodeId: EpisodeId(String(promotion.episodeIds[0])) },
      })
      results.push({ op: { ...promotion }, status: 'applied', detail: `stored candidate ${saved.id}` })
    } catch (error: unknown) {
      results.push({ op: { ...promotion }, status: 'failed', detail: String(error) })
    }
  }

  // Apply merges (full mode only)
  if (mode === 'full') {
    for (const merge of plan.merges) {
      for (const dropId of merge.dropIds) {
        try {
          const deleted = await ctx.memory.forget(view, MemoryId(dropId))
          results.push({
            op: { ...merge },
            status: deleted ? 'applied' : 'rejected',
            detail: deleted ? `dropped ${dropId}` : `${dropId} not found`,
          })
        } catch (error: unknown) {
          results.push({ op: { ...merge }, status: 'failed', detail: String(error) })
        }
      }
    }
  }

  // Apply prunes
  for (const id of plan.prunes) {
    try {
      const record = ctx.memory.list(view).find(r => r.id === id)
      if (record?.status !== 'candidate') {
        results.push({ op: { kind: 'prune', ids: [id] }, status: 'rejected', detail: 'not a candidate' })
        continue
      }
      const deleted = await ctx.memory.forget(view, MemoryId(id))
      results.push({ op: { kind: 'prune', ids: [id] }, status: deleted ? 'applied' : 'rejected' })
    } catch (error: unknown) {
      results.push({ op: { kind: 'prune', ids: [id] }, status: 'failed', detail: String(error) })
    }
  }

  // Apply pins/unpins
  for (const id of plan.pins) {
    try {
      const result = await ctx.memory.setPinned(view, MemoryId(id), true)
      results.push({ op: { kind: 'pin', ids: [id] }, status: result !== undefined ? 'applied' : 'rejected' })
    } catch (error: unknown) {
      results.push({ op: { kind: 'pin', ids: [id] }, status: 'failed', detail: String(error) })
    }
  }
  for (const id of plan.unpins) {
    try {
      const result = await ctx.memory.setPinned(view, MemoryId(id), false)
      results.push({ op: { kind: 'unpin', ids: [id] }, status: result !== undefined ? 'applied' : 'rejected' })
    } catch (error: unknown) {
      results.push({ op: { kind: 'unpin', ids: [id] }, status: 'failed', detail: String(error) })
    }
  }

  return results
}

/** Simple string hash for proposal key derivation. */
function simpleHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).slice(0, 8)
}
