/**
 * The Tomato Rbot bundle. The package's substance is `cordis.patch.yml`, which
 * inserts the registry, runtime, triggers, Remote controller, robot page, and
 * the model-facing creation tool. As a mounted row it also registers the bundled
 * `robot-creation` and `grilling` skills, so a creation Session in any workspace
 * can load the interview flow and its grilling method.
 * @module @tomato/experimental-robot-app
 */

import { readFileSync } from 'node:fs'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/skill'

/** Plugin name registered with the Loader. */
export const name = 'experimental-robot-app'

/** The Host skill registry this bundle contributes to. */
export const inject = ['skills']

/** Bundled skills, each in `skills/<name>/SKILL.md`; `lib/index.js` sits one directory below the package root. */
const SHIPPED_SKILLS = ['robot-creation', 'grilling'] as const

/** Parsed parts of one skill file. */
interface ShippedSkill {
  readonly name: string
  readonly description: string
  readonly content: string
}

/**
 * Read the frontmatter name and description and the body of one shipped skill.
 * @param name - folder name under `skills/`, which the frontmatter must repeat.
 * @returns the fields `ctx.skills.register` requires.
 * @throws when the skill file is missing, its parts are incomplete, or its
 *   frontmatter names another skill.
 */
function readShippedSkill(name: string): ShippedSkill {
  const raw = readFileSync(new URL(`../skills/${name}/SKILL.md`, import.meta.url), 'utf8')
  const match = /^---\n(?<front>[\s\S]*?)\n---\n\n?(?<body>[\s\S]*)$/u.exec(raw)
  const front = match?.groups?.front
  const content = match?.groups?.body?.trim()
  const skillName = front === undefined ? undefined : /^name:\s*(?<name>.+)$/mu.exec(front)?.groups?.name?.trim()
  const description = front === undefined ? undefined : /^description:\s*(?<description>.+)$/mu.exec(front)?.groups?.description?.trim()
  if (skillName === undefined || description === undefined || content === undefined || content === '') {
    throw new Error(`experimental-robot-app: skills/${name}/SKILL.md is missing its frontmatter or body`)
  }
  if (skillName !== name) {
    throw new Error(`experimental-robot-app: skills/${name}/SKILL.md names itself "${skillName}"`)
  }
  return { name: skillName, description, content }
}

/**
 * Register the bundle's shipped skills for the lifetime of the mounting fiber:
 * the creation interview and the grilling method it follows.
 * @param ctx - Context carrying the Host skill registry.
 */
export function apply(ctx: Context): void {
  for (const name of SHIPPED_SKILLS) {
    const skill = readShippedSkill(name)
    ctx.effect(() => ctx.skills.register({ source: 'bundled', ...skill }), `experimental-robot-app: ${skill.name} skill`)
  }
}
