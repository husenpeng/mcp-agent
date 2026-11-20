/**
 * Parse and validate the model's consolidation plan.
 * @module @tomato/memory-dream/plan
 */

import { z } from 'zod'
import { isMemoryIdentifier, normalizeIdentifier, normalizeStatement } from '@tomato/experimental-memory'
import type { DreamPlan } from './types.ts'

const mergeSchema = z.object({
  keepId: z.string().min(1),
  dropIds: z.array(z.string().min(1)).min(1).max(5),
  reason: z.string().max(300),
}).strict()

const proposalSchema = z.object({
  targetId: z.string().min(1),
  value: z.string().min(1).max(200),
  reason: z.string().max(300),
  evidence: z.array(z.string().min(1)).min(1).max(5),
}).strict()

const promotionSchema = z.object({
  episodeIds: z.array(z.string().min(1)).min(1).max(5),
  entity: z.string().min(1),
  key: z.string().min(1),
  value: z.string().min(1).max(200),
  reason: z.string().max(300),
}).strict()

const planSchema = z.object({
  merges: z.array(mergeSchema).max(3).optional(),
  proposals: z.array(proposalSchema).max(8).optional(),
  promotions: z.array(promotionSchema).max(4).optional(),
  pins: z.array(z.string().min(1)).max(5).optional(),
  unpins: z.array(z.string().min(1)).max(5).optional(),
  prunes: z.array(z.string().min(1)).max(8).optional(),
  notes: z.array(z.string().max(300)).max(3).optional(),
}).strict()

/**
 * Parse the model's reply into a validated plan.
 * Tolerates code fences and surrounding prose.
 * @param reply - raw model reply text.
 * @returns the validated plan, or `undefined` when the reply holds no valid JSON.
 */
export function parseDreamPlan(reply: string): DreamPlan | undefined {
  // Strip code fences
  let text = reply.trim()
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch !== null && fenceMatch[1] !== undefined) text = fenceMatch[1].trim()

  // Find JSON object boundaries
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return undefined
  }

  const result = planSchema.safeParse(parsed)
  if (!result.success) return undefined

  const data = result.data
  return {
    merges: (data.merges ?? []).map(m => ({ kind: 'merge' as const, ...m })),
    proposals: (data.proposals ?? []).map(p => ({ kind: 'proposal' as const, ...p })),
    promotions: (data.promotions ?? []).map(p => ({ kind: 'promote' as const, ...p })),
    pins: data.pins ?? [],
    unpins: data.unpins ?? [],
    prunes: data.prunes ?? [],
    notes: data.notes ?? [],
  }
}

/**
 * Validate plan operations against the set of known record and episode ids.
 * Drops operations referencing unknown ids.
 * @param plan - the parsed plan.
 * @param knownIds - set of valid record and episode ids from the input.
 * @param maxOps - maximum total operations to keep.
 * @returns filtered plan with only valid operations.
 */
export function validatePlanOps(plan: DreamPlan, knownIds: ReadonlySet<string>, maxOps: number): DreamPlan {
  let opCount = 0
  const validMerges = plan.merges.filter((m) => {
    if (opCount >= maxOps) return false
    if (!knownIds.has(m.keepId)) return false
    if (!m.dropIds.every(id => knownIds.has(id))) return false
    if (m.dropIds.includes(m.keepId)) return false
    opCount++
    return true
  })
  const validProposals = plan.proposals.filter((p) => {
    if (opCount >= maxOps) return false
    if (!knownIds.has(p.targetId)) return false
    if (!p.evidence.every(id => knownIds.has(id))) return false
    opCount++
    return true
  })
  const validPromotions = plan.promotions.filter((p) => {
    if (opCount >= maxOps) return false
    if (!p.episodeIds.every(id => knownIds.has(id))) return false
    const entity = normalizeIdentifier(p.entity)
    const key = normalizeIdentifier(p.key)
    if (!isMemoryIdentifier(entity) || !isMemoryIdentifier(key)) return false
    if (normalizeStatement(p.value) === '') return false
    opCount++
    return true
  })
  const validPins = plan.pins.filter((id) => {
    if (opCount >= maxOps) return false
    if (!knownIds.has(id)) return false
    opCount++
    return true
  })
  const validUnpins = plan.unpins.filter((id) => {
    if (opCount >= maxOps) return false
    if (!knownIds.has(id)) return false
    opCount++
    return true
  })
  const validPrunes = plan.prunes.filter((id) => {
    if (opCount >= maxOps) return false
    if (!knownIds.has(id)) return false
    opCount++
    return true
  })

  return {
    merges: validMerges,
    proposals: validProposals,
    promotions: validPromotions,
    pins: validPins,
    unpins: validUnpins,
    prunes: validPrunes,
    notes: plan.notes,
  }
}
