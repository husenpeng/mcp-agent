/**
 * Creator-marketing robot templates and the bundled skills their runs load.
 * Mounting the plugin registers every skill directory under `skills/` as a
 * bundled skill provider and every template whose skill ships here with
 * `ctx.robotTemplates`; unloading removes both.
 * @module @tomato/experimental-robot-templates-marketing
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@tomato/cordis'
import type { RobotTemplate } from '@tomato/experimental-robot'
import type {} from '@tomato/experimental-robot/templates'
import { BUNDLED_SKILL_RANK, type SkillCandidate, type SkillProvider } from '@tomato/skill'
import { MARKETING_TEMPLATES } from './templates.ts'

export { MARKETING_TEMPLATES } from './templates.ts'

/** Plugin name registered with the Loader. */
export const name = 'experimental-robot-templates-marketing'

/** Services this plugin contributes to. */
export const inject = ['robotTemplates', 'skills']

/** Skill provider label shown in skill catalogs. */
const PROVIDER = 'tomato-marketing'

/** Shipped skills root; `lib/index.js` sits one directory below the package root. */
const SKILLS_ROOT = fileURLToPath(new URL('../skills/', import.meta.url))

interface ParsedSkill {
  readonly name: string
  readonly description: string
  readonly content: string
}

/**
 * Split one SKILL.md into its frontmatter fields and body.
 * @param raw - complete file text.
 * @param path - file path used in failure messages.
 * @returns the name, description, and trimmed body.
 * @throws when the frontmatter, its `name` or `description`, or the body is missing.
 */
function parseSkill(raw: string, path: string): ParsedSkill {
  const match = /^---\r?\n(?<front>[\s\S]*?)\r?\n---\r?\n(?<body>[\s\S]*)$/u.exec(raw)
  const front = match?.groups?.front ?? ''
  const skillName = /^name:\s*(?<value>.+)$/mu.exec(front)?.groups?.value?.trim()
  const description = /^description:\s*(?<value>.+)$/mu.exec(front)?.groups?.value?.trim().replace(/^"(?<inner>.*)"$/u, '$<inner>')
  const content = match?.groups?.body?.trim()
  if (skillName === undefined || description === undefined || content === undefined || content === '') {
    throw new Error(`${name}: ${path} is missing its name, description, or body`)
  }
  return { name: skillName, description, content }
}

/**
 * Read every shipped skill directory's catalog entry.
 * @param root - absolute directory whose skill children each hold a `SKILL.md`.
 * @returns one bundled candidate per child directory that holds a `SKILL.md`, sorted by name.
 * @throws when a skill directory's file is malformed or names a different skill.
 */
export function readMarketingSkills(root: string = SKILLS_ROOT): readonly SkillCandidate[] {
  return readdirSync(root)
    .filter(entry => statSync(join(root, entry)).isDirectory() && existsSync(join(root, entry, 'SKILL.md')))
    .sort()
    .map((directoryName) => {
      const directory = join(root, directoryName)
      const path = join(directory, 'SKILL.md')
      const skill = parseSkill(readFileSync(path, 'utf8'), path)
      if (skill.name !== directoryName) throw new Error(`${name}: ${path} declares "${skill.name}" instead of "${directoryName}"`)
      return {
        name: skill.name,
        description: skill.description,
        invocation: { modelInvocable: true, userInvocable: true },
        provider: PROVIDER,
        source: 'bundled',
        rank: BUNDLED_SKILL_RANK,
        resourceBase: { kind: 'directory', path: directory.split(sep).join('/') },
        locator: path,
      }
    })
}

/**
 * Select the templates whose every skill ships with this package, so a hired
 * robot never names a skill its run cannot load.
 * @param skills - shipped skill catalog entries.
 * @returns templates in display order whose skills are all present.
 */
export function availableTemplates(skills: readonly SkillCandidate[]): readonly RobotTemplate[] {
  const shipped = new Set(skills.map(skill => skill.name))
  return MARKETING_TEMPLATES.filter(template => template.spec.capability.skills.every(skill => shipped.has(skill)))
}

/**
 * Register the marketing templates and skills for the mounting fiber's lifetime.
 * @param ctx - Context carrying the template and skill registries.
 */
export function apply(ctx: Context): void {
  const candidates = readMarketingSkills()
  for (const template of availableTemplates(candidates)) {
    ctx.effect(() => ctx.robotTemplates.register(template), `${name}: template ${template.id}`)
  }
  const provider: SkillProvider = {
    name: PROVIDER,
    list: () => Promise.resolve(candidates),
    async get(candidate, options) {
      const { rank: _rank, locator, ...summary } = candidate
      const path = String(locator)
      const raw = await readFile(path, { encoding: 'utf8', signal: options.signal })
      return { ...summary, content: parseSkill(raw, path).content }
    },
  }
  ctx.skills.registerProvider(() => provider)
}
