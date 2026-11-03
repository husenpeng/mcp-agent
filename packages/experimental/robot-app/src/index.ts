/**
 * The Tomato Rbot bundle. The package's substance is `cordis.patch.yml`, which
 * inserts the registry, runtime, triggers, Remote controller, robot page, and
 * the model-facing creation tool. As a mounted row it also registers the
 * bundled `robot-creation` skill so a creation Session in any workspace can
 * load the interview flow.
 * @module @tomato/experimental-robot-app
 */

import { readFileSync } from 'node:fs'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/skill'

/** Plugin name registered with the Loader. */
export const name = 'experimental-robot-app'

/** The Host skill registry this bundle contributes to. */
export const inject = ['skills']

/** Shipped skill file; `lib/index.js` sits one directory below the package root. */
const SKILL_FILE = new URL('../skills/robot-creation/SKILL.md', import.meta.url)

/** Parsed parts of one skill file. */
interface ShippedSkill {
  readonly name: string
  readonly description: string
  readonly content: string
}

/**
 * Read the frontmatter name and description and the body of the shipped skill.
 * @returns the fields `ctx.skills.register` requires.
 * @throws when the skill file or one of its required parts is missing.
 */
function readShippedSkill(): ShippedSkill {
  const raw = readFileSync(SKILL_FILE, 'utf8')
  const match = /^---\n(?<front>[\s\S]*?)\n---\n\n?(?<body>[\s\S]*)$/u.exec(raw)
  const front = match?.groups?.front
  const content = match?.groups?.body?.trim()
  const skillName = front === undefined ? undefined : /^name:\s*(?<name>.+)$/mu.exec(front)?.groups?.name?.trim()
  const description = front === undefined ? undefined : /^description:\s*(?<description>.+)$/mu.exec(front)?.groups?.description?.trim()
  if (skillName === undefined || description === undefined || content === undefined || content === '') {
    throw new Error('experimental-robot-app: skills/robot-creation/SKILL.md is missing its frontmatter or body')
  }
  return { name: skillName, description, content }
}

/**
 * Register the bundle's creation skill for the lifetime of the mounting fiber.
 * @param ctx - Context carrying the Host skill registry.
 */
export function apply(ctx: Context): void {
  const skill = readShippedSkill()
  ctx.effect(() => ctx.skills.register({ source: 'bundled', ...skill }), 'experimental-robot-app: robot-creation skill')
}
