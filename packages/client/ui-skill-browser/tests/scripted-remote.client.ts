/** Scripted `skills` Remote for panel tests; no DOM assumptions. */
import { vi } from 'vitest'
import type { Mock } from 'vitest'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { RemoteFailure, SkillEntry, SkillGetValue } from '@tomato/api-remotes/client'
import type { SkillBrowserRemote } from '../src/client/face.ts'

/** Catalog entries the default script returns. */
export const CATALOG: readonly SkillEntry[] = [
  {
    name: 'alpha', description: 'Alpha flow.', source: 'user-agents', path: '/home/u/.agents/skills/alpha/SKILL.md',
    modelInvocable: true, userInvocable: true, editable: true,
  },
  {
    name: 'beta', description: 'Beta flow.', whenToUse: 'Before shipping.', source: 'project-agents', path: '/work/.agents/skills/beta/SKILL.md',
    modelInvocable: true, userInvocable: true, editable: false,
  },
  {
    name: 'gamma', description: 'Gamma flow.', source: 'bundled',
    modelInvocable: true, userInvocable: false, editable: false,
  },
]

/**
 * One skill's detail as the Remote returns it.
 * @param entry - the catalog entry to expand.
 * @returns the detail value.
 */
export function detailOf(entry: SkillEntry): SkillGetValue {
  return { ...entry, description: entry.description ?? '', content: `# ${entry.name}\n\n${entry.description ?? ''}` }
}

/**
 * A typed-looking failure for scripted error branches.
 * @param code - Remote error code.
 * @param message - failure message.
 * @returns the failure value.
 */
export function failure(code: string, message: string): RemoteFailure {
  return { code, message, details: {} } as RemoteFailure
}

/** Scripted Remote methods plus their spies. */
export interface ScriptedRemote {
  readonly remote: SkillBrowserRemote
  readonly list: Mock
  readonly get: Mock
  readonly save: Mock
}

/**
 * Build a Remote whose three skill methods resolve from mutable scripts.
 * @param entries - catalog the default list resolves.
 * @returns the Remote face and the methods behind it.
 */
/** One entry as a `brief` catalog read returns it. */
export function briefOf(entry: SkillEntry): SkillEntry {
  return {
    name: entry.name,
    ...entry.path === undefined ? {} : { path: entry.path },
    ...entry.whenToUse === undefined ? {} : { whenToUse: entry.whenToUse },
    modelInvocable: entry.modelInvocable,
    userInvocable: entry.userInvocable,
    source: entry.source,
    editable: entry.editable,
  }
}

/** The default catalog as a `brief` read returns it. */
export const BRIEF_CATALOG: readonly SkillEntry[] = CATALOG.map(briefOf)

export function scriptedRemote(entries: readonly SkillEntry[] = CATALOG): ScriptedRemote {
  const list = vi.fn(async (request?: { readonly brief?: boolean }): Promise<RemoteResult<{ readonly skills: readonly SkillEntry[] }>> =>
    ({ ok: true, value: { skills: request?.brief === true ? entries.map(briefOf) : entries } }))
  const get = vi.fn(async (request: { readonly name: string }): Promise<RemoteResult<SkillGetValue>> => {
    const entry = entries.find(candidate => candidate.name === request.name)
    return entry === undefined
      ? { ok: false, error: failure('skill/not-found', `skill "${request.name}" is not available`) }
      : { ok: true, value: detailOf(entry) }
  })
  const save = vi.fn(async (request: {
    readonly name: string
    readonly description: string
    readonly whenToUse?: string | null
    readonly content: string
  }): Promise<RemoteResult<SkillGetValue>> => {
    const entry = entries.find(candidate => candidate.name === request.name)
    if (entry === undefined) return { ok: false, error: failure('skill/not-found', `skill "${request.name}" is not available`) }
    return {
      ok: true,
      value: {
        ...detailOf(entry),
        description: request.description,
        ...request.whenToUse === undefined || request.whenToUse === null ? {} : { whenToUse: request.whenToUse },
        content: request.content,
      },
    }
  })
  const remote = { skills: { list, get, save } } as unknown as SkillBrowserRemote
  return { remote, list, get, save }
}
