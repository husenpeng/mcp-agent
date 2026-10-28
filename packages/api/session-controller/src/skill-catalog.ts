/** Session-addressed, cold-readable skill catalog Remote. */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/agent-preset-registry/types'
import { SessionQueryError } from '@tomato/session-query'
import {
  isSkillName, isUserInvocable,
  type SkillDefinition, type SkillRegistry, type SkillSummary, type SkillUpdatePatch,
} from '@tomato/skill'
import type {} from '@tomato/working-directory'
import type { ScopeKey } from '@tomato/scope'
import { Remote, RemoteError, TypertRemoteService } from '@tomato/typert-protocol'
import type {
  SkillEntry, SkillGetRequest, SkillGetValue, SkillListRequest, SkillListValue,
  SkillSaveRequest, SkillSaveValue,
} from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host owner of the Session-addressed `skills` Remote namespace. */
    sessionSkillCatalog: SessionSkillCatalog
  }
}

/**
 * Sources whose files this product lets a person edit from the Skills panel.
 * Project, custom, bundled, and virtual roots stay read-only: editing them
 * would modify repository files or packaged assets the user did not select.
 */
const PERSONAL_SKILL_SOURCES: ReadonlySet<string> = new Set(['user-tomato', 'user-agents'])

/** Largest accepted routing description, in characters. */
const MAX_SKILL_DESCRIPTION_LENGTH = 4096

/** Largest accepted extra routing hint, in characters. */
const MAX_SKILL_WHEN_TO_USE_LENGTH = 4096

/** Largest accepted instruction body, in UTF-8 bytes. */
const MAX_SKILL_CONTENT_BYTES = 256 * 1024

/** One resolved catalog view: the registry, its lookup context, and its scope-lease cleanup. */
interface SkillView {
  readonly registry: SkillRegistry
  readonly cwd: string
  readonly scope: ScopeKey | undefined
  readonly dispose: () => Promise<void>
}

/** Host service backing `ctx.remote.skills` without activating a cold Agent. */
export class SessionSkillCatalog extends TypertRemoteService {
  static inject = ['agents', 'sessionQuery', 'typert', 'workingDirectory']

  /**
   * @param ctx - Host context carrying Session reads and optional skill/preset services.
   */
  constructor(ctx: Context) {
    super(ctx, 'sessionSkillCatalog', { namespace: 'skills' })
  }

  /**
   * List the skills visible to one Session composition.
   * @param request - Session identity whose cwd and preset select the catalog view.
   * @param signal - caller lifetime carried by the Remote transport; admitted catalog reads retain their existing completion semantics.
   * @returns skill metadata without loading bodies. User-invocable skills only
   *   unless `includeModelOnly` requests the complete catalog.
   * @throws RemoteError when the Session cannot be inspected or no registry can serve it.
   */
  @Remote
  async list(request: SkillListRequest, signal: AbortSignal): Promise<SkillListValue> {
    return await this.withView(request.sessionId, signal, async (view) => {
      try {
        const skills = await view.registry.list({ cwd: view.cwd, scope: view.scope })
        const visible = request.includeModelOnly === true ? skills : skills.filter(isUserInvocable)
        const brief = request.brief === true
        return { skills: visible.map(skill => this.entryOf(skill, !brief)) }
      } catch (error: unknown) {
        throw new RemoteError('gateway/internal', `skill listing failed: ${String(error)}`, {})
      }
    })
  }

  /**
   * Read one skill's display metadata and instruction body.
   * @param request - Session identity and the kebab-case skill name.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the skill definition, including its Markdown body.
   * @throws RemoteError when the Session cannot be inspected, no registry can serve it, or the skill is absent.
   */
  @Remote
  async get(request: SkillGetRequest, signal: AbortSignal): Promise<SkillGetValue> {
    return await this.withView(request.sessionId, signal, async (view) => {
      let skill: SkillDefinition | undefined
      try {
        skill = await view.registry.get(request.name, { cwd: view.cwd, scope: view.scope, signal })
      } catch (error: unknown) {
        throw new RemoteError('gateway/internal', `skill read failed: ${String(error)}`, {})
      }
      if (skill === undefined) {
        throw new RemoteError('skill/not-found', `skill "${request.name}" is not available to this Session`, {
          name: request.name,
        })
      }
      return this.detailOf(skill)
    })
  }

  /**
   * Rewrite one personal skill's description, routing hint, and body through
   * its owning provider. The Host resolves the file from the winning catalog
   * entry, so the request never supplies a path.
   * @param request - Session identity, skill name, and replacement fields.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the saved skill as a fresh read.
   * @throws RemoteError when the request is invalid, the Session cannot be inspected,
   *   the skill is absent, or its source/provider is not editable.
   */
  @Remote
  async save(request: SkillSaveRequest, signal: AbortSignal): Promise<SkillSaveValue> {
    const description = request.description.trim()
    const whenToUse = request.whenToUse === undefined || request.whenToUse === null
      ? request.whenToUse
      : request.whenToUse.trim()
    this.validateSave(request.name, description, whenToUse, request.content)
    return await this.withView(request.sessionId, signal, async (view) => {
      let current: SkillSummary | undefined
      try {
        const catalog = await view.registry.snapshot({ cwd: view.cwd, scope: view.scope, signal })
        current = catalog.skills.find(skill => skill.name === request.name)
      } catch (error: unknown) {
        throw new RemoteError('gateway/internal', `skill lookup failed: ${String(error)}`, {})
      }
      if (current === undefined) {
        throw new RemoteError('skill/not-found', `skill "${request.name}" is not available to this Session`, {
          name: request.name,
        })
      }
      if (!this.editable(current)) {
        throw new RemoteError('skill/not-editable', `skill "${request.name}" is not stored in a personal skill directory`, {
          name: request.name,
        })
      }
      const patch: SkillUpdatePatch = {
        description,
        content: request.content,
        ...whenToUse === undefined ? {} : { whenToUse },
      }
      let updated: SkillDefinition | undefined
      try {
        updated = await view.registry.update(request.name, patch, { cwd: view.cwd, scope: view.scope, signal })
      } catch (error: unknown) {
        throw new RemoteError('gateway/internal', `skill save failed: ${String(error)}`, {})
      }
      if (updated === undefined) {
        throw new RemoteError('skill/not-found', `skill "${request.name}" disappeared before it could be saved`, {
          name: request.name,
        })
      }
      return this.detailOf(updated)
    })
  }

  /**
   * Run one read against a resolved view and release any preset-scope lease.
   * @param sessionId - Session whose composition selects the registry.
   * @param signal - caller lifetime.
   * @param run - the operation to perform.
   * @returns the operation's result.
   */
  private async withView<T>(
    sessionId: SkillListRequest['sessionId'],
    signal: AbortSignal,
    run: (view: SkillView) => Promise<T>,
  ): Promise<T> {
    const view = await this.viewFor(sessionId, signal)
    try {
      return await run(view)
    } finally {
      await view.dispose()
    }
  }

  private validateSave(name: string, description: string, whenToUse: string | null | undefined, content: string): void {
    if (!isSkillName(name)) this.invalid(`skill name "${name}" is not kebab-case`)
    if (description === '') this.invalid('skill description must not be empty')
    if (description.length > MAX_SKILL_DESCRIPTION_LENGTH) {
      this.invalid(`skill description exceeds ${MAX_SKILL_DESCRIPTION_LENGTH} characters`)
    }
    if (whenToUse !== undefined && whenToUse !== null && whenToUse.length > MAX_SKILL_WHEN_TO_USE_LENGTH) {
      this.invalid(`skill whenToUse exceeds ${MAX_SKILL_WHEN_TO_USE_LENGTH} characters`)
    }
    if (Buffer.byteLength(content, 'utf8') > MAX_SKILL_CONTENT_BYTES) {
      this.invalid(`skill body exceeds ${MAX_SKILL_CONTENT_BYTES} UTF-8 bytes`)
    }
  }

  private invalid(reason: string): never {
    throw new RemoteError('skill/invalid', reason, { reason })
  }

  private entryOf(skill: SkillSummary, includeDescription = true): SkillEntry {
    return {
      name: skill.name,
      ...skill.path === undefined ? {} : { path: skill.path },
      ...includeDescription ? { description: skill.description } : {},
      ...skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse },
      modelInvocable: skill.invocation.modelInvocable,
      userInvocable: skill.invocation.userInvocable,
      source: skill.source,
      editable: this.editable(skill),
    }
  }

  private detailOf(skill: SkillDefinition): SkillGetValue {
    return { ...this.entryOf(skill), description: skill.description, content: skill.content }
  }

  private editable(skill: SkillSummary): boolean {
    return skill.path !== undefined
      && skill.updatable === true
      && PERSONAL_SKILL_SOURCES.has(skill.source)
  }

  /** Resolve the Session's cwd, preset scope, and skill registry without activating a cold Agent. */
  private async viewFor(sessionId: SkillListRequest['sessionId'], signal: AbortSignal): Promise<SkillView> {
    let cwd: string
    let agentPreset: string | undefined
    try {
      using observation = await this.ctx.sessionQuery.observeSession(sessionId)
      if (observation.projections === undefined) {
        throw new Error('skill catalog requires a projected Session observation')
      }
      cwd = observation.projections.values.workingDirectory
        ?? observation.header.cwd
        ?? this.ctx.workingDirectory.defaultDirectory
      agentPreset = observation.projections.values.agentPreset ?? undefined
      const live = this.ctx.agents.get(sessionId)
      if (live !== undefined) cwd = await this.ctx.workingDirectory.ensure(live, signal)
    } catch (error: unknown) {
      if (error instanceof SessionQueryError
        && error.code === 'SESSION_QUERY_SESSION_NOT_FOUND') {
        throw new RemoteError('session/not-found', `session "${sessionId}" not found`, { sessionId })
      }
      throw new RemoteError(
        'gateway/internal',
        `session "${sessionId}" could not be inspected: ${String(error)}`,
        {},
      )
    }

    const live = this.ctx.agents.get(sessionId)
    const presets = this.ctx.get('agentPresets')
    const scoped = live === undefined ? undefined : presets?.serviceFor(live, 'skills')
    const registry = scoped ?? this.ctx.get('skills')
    if (registry === undefined) {
      throw new RemoteError(
        'gateway/internal',
        'skill registry is absent: neither this session\'s agent preset nor the host composition mounts @tomato/skill',
        {},
      )
    }
    const lease = live === undefined ? await this.scopeFor(agentPreset) : undefined
    return {
      registry,
      cwd,
      scope: live ?? lease?.key,
      dispose: async () => {
        if (lease !== undefined) await lease[Symbol.asyncDispose]()
      },
    }
  }

  /** Resolve a live or standing preset scope without creating an Agent. */
  private async scopeFor(
    agentPreset: string | undefined,
  ): Promise<({ key: ScopeKey } & AsyncDisposable) | undefined> {
    const presets = this.ctx.get('agentPresets')
    if (presets === undefined) return undefined
    try {
      return await presets.acquireScope(agentPreset)
    } catch {
      // An unknown or unusable recorded preset falls back to the global registry.
      return undefined
    }
  }
}

export default SessionSkillCatalog
