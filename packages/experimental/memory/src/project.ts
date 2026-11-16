/**
 * Stable project identity for memory scopes. The workspace registry's id wins
 * when that service is composed; otherwise the canonical directory yields a
 * deterministic provisional id, and a linked Git worktree borrows the identity
 * of the repository it belongs to. Records stored before domain v2 carry only a
 * path and are mapped to a resolved identity during activation.
 */
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
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
 * Read the `gitdir:` pointer a linked worktree and a submodule write in place
 * of a `.git` directory.
 * @param path - Project directory holding the `.git` file.
 * @returns the path it names, or `undefined` when the directory has no pointer file.
 */
async function gitDirPointer(path: string): Promise<string | undefined> {
  try {
    return /^gitdir:\s*(\S.*?)\s*$/mu.exec(await readFile(join(path, '.git'), 'utf8'))?.[1]
  } catch {
    // A conventional checkout has a `.git` directory, and a directory outside Git has none; neither is a linked worktree.
    return undefined
  }
}

/**
 * Resolve a path through `realpath`, reporting an unreadable path as absent
 * instead of failing the caller that only needs an identity.
 * @param path - Path to canonicalize.
 * @returns the canonical path, or `undefined` when it does not resolve.
 */
async function canonicalPath(path: string): Promise<string | undefined> {
  try {
    return await realpath(path)
  } catch {
    // A stale or absent path names no repository; the caller falls back to the directory's own identity.
    return undefined
  }
}

/**
 * Read the `commondir` file of one linked worktree gitdir, which names the
 * repository's own gitdir relative to it.
 * @param gitDir - Canonical gitdir the `.git` file named.
 * @returns the trimmed repository gitdir, or `undefined` when the gitdir has no such file.
 */
async function commonGitDir(gitDir: string): Promise<string | undefined> {
  try {
    return (await readFile(join(gitDir, 'commondir'), 'utf8')).trim()
  } catch {
    // A submodule's gitdir carries no `commondir`: it names a repository of its own rather than a parent's.
    return undefined
  }
}

/**
 * Canonical directory of the repository a linked Git worktree belongs to.
 * A worktree holds a `.git` file naming a directory under the repository's
 * `worktrees` collection, whose `commondir` file names the repository's own
 * `gitdir`. A conventional checkout has a `.git` directory instead, a
 * submodule's `gitdir` carries no `commondir`, and a directory outside Git has
 * no `.git` at all; each of those yields `undefined` so its identity stays the
 * directory's own.
 * @param path - Canonical project directory.
 * @returns the canonical repository directory, or `undefined` when the path is not a linked worktree.
 */
export async function repositoryRootOf(path: string): Promise<string | undefined> {
  const pointer = await gitDirPointer(path)
  if (pointer === undefined) return undefined
  const gitDir = await canonicalPath(isAbsolute(pointer) ? pointer : resolve(path, pointer))
  if (gitDir === undefined) return undefined
  const common = await commonGitDir(gitDir)
  if (common === undefined || common === '') return undefined
  const commonDir = await canonicalPath(resolve(gitDir, common))
  if (commonDir === undefined) return undefined
  return dirname(commonDir)
}

/**
 * Resolve one canonical directory to its project identity. A mounted workspace
 * registry supplies the stable id; a missing registry, an unregistered
 * directory, or a failed lookup falls back to the provisional id, so memory
 * keeps working in compositions without a workspace registry. A linked Git
 * worktree shares the provisional identity of the repository it belongs to, so
 * work that runs in per-ticket checkouts reads and writes one project history.
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
  const repository = await repositoryRootOf(path)
  if (repository !== undefined) return { id: provisionalProjectId(repository), path }
  return { id: provisionalProjectId(path), path }
}
