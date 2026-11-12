/**
 * Tomato robot templates and bundled skills adapted from Anthropic's
 * `knowledge-work-plugins` repository. Mounting the plugin registers every
 * vendored role's skills as one bundled provider and one hireable template per
 * role; unloading removes both. The vendored `plugins/` tree stays byte-for-byte
 * upstream so a new upstream commit can replace it and customization happens in
 * this package's copy or in the vendored Markdown.
 * @module @tomato/experimental-robot-templates-knowledge-work
 */

import { fileURLToPath } from 'node:url'
import type { Context } from '@tomato/cordis'
import type { RobotTemplate } from '@tomato/experimental-robot'
import type {} from '@tomato/experimental-robot/templates'
import { BUNDLED_SKILL_RANK, type SkillCandidate, type SkillProvider } from '@tomato/skill'
import { readPlugins } from './plugins.ts'
import { ROLE_COPY, roleTemplate } from './templates.ts'

/** Plugin name registered with the Loader. */
export const name = 'experimental-robot-templates-knowledge-work'

/** Services this plugin contributes to. */
export const inject = ['robotTemplates', 'skills']

/** Skill provider label shown in skill catalogs. */
const PROVIDER = 'tomato-knowledge-work'

/** Vendored plugins root; `lib/index.js` sits one directory below the package root. */
export const PLUGINS_ROOT = fileURLToPath(new URL('../plugins/', import.meta.url))

/** One composed catalog: hireable templates plus the skill bodies they can load. */
export interface KnowledgeWorkCatalog {
  /** One template per vendored role, in role order. */
  readonly templates: readonly RobotTemplate[]
  /** One candidate per shipped skill, in role and directory order. */
  readonly candidates: readonly SkillCandidate[]
  /** Skill locator to instruction body, already rewritten for a Tomato run. */
  readonly bodies: ReadonlyMap<string, string>
}

/**
 * Build every template, skill candidate, and instruction body from the vendored plugins.
 * @param root - vendored plugin root directory.
 * @returns the composed catalog.
 * @throws when a vendored role has no template copy or ships no skills.
 */
export function compose(root: string = PLUGINS_ROOT): KnowledgeWorkCatalog {
  const plugins = readPlugins(root)
  const templates: RobotTemplate[] = []
  const candidates: SkillCandidate[] = []
  const bodies = new Map<string, string>()
  for (const plugin of plugins) {
    const copy = ROLE_COPY[plugin.id]
    if (copy === undefined) throw new Error(`${name}: ${plugin.id} has no template copy; add it to ROLE_COPY`)
    templates.push(roleTemplate(plugin.id, copy, plugin.skills.map(skill => skill.name)))
    for (const skill of plugin.skills) {
      const locator = `${skill.directory}/SKILL.md`
      bodies.set(locator, skill.body)
      candidates.push({
        name: skill.name,
        description: skill.description,
        invocation: { modelInvocable: true, userInvocable: true },
        provider: PROVIDER,
        source: 'bundled',
        rank: BUNDLED_SKILL_RANK,
        resourceBase: { kind: 'directory', path: skill.directory },
        locator,
      })
    }
  }
  return { templates, candidates, bodies }
}

/**
 * Register the templates and their bundled skills for the mounting fiber's lifetime.
 * @param ctx - Context carrying the template and skill registries.
 */
export function apply(ctx: Context): void {
  const { templates, candidates, bodies } = compose()
  for (const template of templates) {
    ctx.effect(() => ctx.robotTemplates.register(template), `${name}: template ${template.id}`)
  }
  const provider: SkillProvider = {
    name: PROVIDER,
    list: () => Promise.resolve(candidates),
    get(candidate) {
      const { rank: _rank, locator, ...summary } = candidate
      const path = String(locator)
      const content = bodies.get(path)
      /* v8 ignore next -- every candidate is created from the same catalog */
      if (content === undefined) throw new Error(`${name}: no body was read for ${path}`)
      return Promise.resolve({ ...summary, content })
    },
  }
  ctx.skills.registerProvider(() => provider)
}
