/**
 * Stable project identity for memory scopes. The workspace registry's id wins
 * when that service is composed; otherwise the canonical directory yields a
 * deterministic provisional id. Records stored before domain v2 carry only a
 * path and are mapped to a resolved identity during activation.
 */
import { createHash } from 'node:crypto'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/workspace'
import type { EpisodeScope, MemoryScope, MemoryWorkspace, ProjectId } from './types.ts'

/** A scope that carries a project identity; profile scopes have none. */
export type ProjectScope = Exclude<MemoryScope, { readonly kind: 'profile' }> | EpisodeScope

/**
 * Stable identity of a record or episode scope, derived from the path for legacy rows.
 * @param scope - non-profile scope.
 * @returns the stored identity, or the deterministic provisional id of its path.
 */
export function scopeProjectId(scope: ProjectScope): ProjectId {
  if (scope.workspaceId !== undefined) return scope.workspaceId
  /* v8 ignore next -- the record schema requires a workspaceId or a path */
  if (scope.path === undefined) throw new Error('experimental-memory: a project scope carries no identity')
  return provisionalProjectId(scope.path)
}

/**
 * Brand one project identity.
 * @param id - opaque identity string.
 * @returns the branded identity.
 */
export function ProjectId(id: string): ProjectId {
  return id as ProjectId
}

/** Prefix of a path-derived provisional project identity. */
export const PROVISIONAL_PREFIX = 'pw:'

/**
 * Deterministic provisional identity of one canonical directory.
 * @param path - canonical project directory.
 * @returns `pw:<32 hex chars>` derived from the path.
 */
export function provisionalProjectId(path: string): ProjectId {
  return ProjectId(`${PROVISIONAL_PREFIX}${createHash('sha256').update(path).digest('hex').slice(0, 32)}`)
}

/**
 * Resolve one canonical directory to its project identity. A mounted workspace
 * registry supplies the stable id; a missing registry, an unregistered
 * directory, or a failed lookup falls back to the provisional id, so memory
 * keeps working in compositions without a workspace registry.
 * @param ctx - context that may carry `ctx.workspaceRegistry`.
 * @param path - canonical project directory.
 * @returns the resolved identity and the path it belongs to.
 */
export async function resolveMemoryWorkspace(ctx: Context, path: string): Promise<MemoryWorkspace> {
  const registry = ctx.get('workspaceRegistry')
  if (registry !== undefined) {
    try {
      const workspace = await registry.resolveByPath(path)
      if (workspace !== undefined) return { id: ProjectId(String(workspace.id)), path: workspace.path }
    } catch (error: unknown) {
      ctx.logger.warn(`experimental-memory: workspace lookup for "${path}" failed: ${String(error)}`)
    }
  }
  return { id: provisionalProjectId(path), path }
}
