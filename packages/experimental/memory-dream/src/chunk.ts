/**
 * Split the worklist into chunks sized to fit within a model's context window.
 * Targets sharing records stay in the same chunk (connected components).
 * @module @tomato/memory-dream/chunk
 */

import type { DreamTarget, DreamChunk } from './types.ts'
import { estimateTokens } from './render.ts'

/** Options for chunking. */
export interface ChunkOptions {
  /** Maximum targets per chunk. */
  readonly maxTargetsPerChunk: number
  /** Maximum estimated tokens per chunk. */
  readonly maxTokensPerChunk: number
}

/** Default chunk options. */
export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  maxTargetsPerChunk: 12,
  maxTokensPerChunk: 4000,
}

/**
 * Split targets into chunks using connected-component analysis.
 * Targets that share record ids must stay in the same chunk.
 * @param targets - all consolidation targets.
 * @param options - chunk size limits.
 * @returns chunks of targets.
 */
export function chunkWorklist(
  targets: readonly DreamTarget[],
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS,
): DreamChunk[] {
  if (targets.length === 0) return []

  // Build adjacency: targets sharing any record id are connected
  const recordToTargets = new Map<string, number[]>()
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]
    if (target === undefined) continue
    for (const recordId of target.recordIds) {
      const existing = recordToTargets.get(recordId) ?? []
      existing.push(i)
      recordToTargets.set(recordId, existing)
    }
  }

  // Union-find to group connected targets
  const parent: number[] = Array.from({ length: targets.length }, (_, i) => i)
  function find(x: number): number {
    let root = x
    let next = parent[root]
    while (next !== undefined && next !== root) {
      root = next
      next = parent[root]
    }
    return root
  }
  function union(a: number, b: number): void {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  for (const indices of recordToTargets.values()) {
    const first = indices[0]
    if (first === undefined) continue
    for (let i = 1; i < indices.length; i++) {
      const idx = indices[i]
      if (idx !== undefined) union(first, idx)
    }
  }

  // Group by component
  const components = new Map<number, number[]>()
  for (let i = 0; i < targets.length; i++) {
    const root = find(i)
    const group = components.get(root) ?? []
    group.push(i)
    components.set(root, group)
  }

  // Pack components into chunks respecting size limits
  const chunks: DreamChunk[] = []
  let currentTargets: DreamTarget[] = []
  let currentTokens = 0

  for (const [, indices] of components) {
    const componentTargets = indices
      .map(i => targets[i])
      .filter((t): t is DreamTarget => t !== undefined)
    const componentTokens = componentTargets.reduce(
      (sum, t) => sum + estimateTokens(t.summary) + t.recordIds.length * 20,
      0,
    )

    if (currentTargets.length + componentTargets.length > options.maxTargetsPerChunk
      || currentTokens + componentTokens > options.maxTokensPerChunk) {
      if (currentTargets.length > 0) {
        chunks.push({ index: chunks.length, targets: [...currentTargets], estimatedTokens: currentTokens })
        currentTargets = []
        currentTokens = 0
      }
    }

    currentTargets.push(...componentTargets)
    currentTokens += componentTokens
  }

  if (currentTargets.length > 0) {
    chunks.push({ index: chunks.length, targets: currentTargets, estimatedTokens: currentTokens })
  }

  return chunks
}

/**
 * Compute a digest of the worklist for cursor invalidation.
 * @param targets - all targets.
 * @returns a deterministic digest string.
 */
export function worklistDigest(targets: readonly DreamTarget[]): string {
  const parts = targets.map(t => `${t.id}:${t.recordIds.join(',')}`)
  return parts.sort().join('|')
}
