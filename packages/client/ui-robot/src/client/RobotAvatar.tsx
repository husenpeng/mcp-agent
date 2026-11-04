/** Circular robot avatar: role artwork for a recognized skill, else the name initial. */
import type { ReactNode } from 'react'
import { robotAvatarArt } from './RobotAvatarArt.tsx'
import css from './RobotAvatar.module.css'

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** Props of one robot avatar. */
export interface RobotAvatarProps {
  /** Display name used for the fallback initial. */
  readonly name: string
  /** Skill ids from the robot's bound specification. */
  readonly skills: readonly string[]
}

/**
 * Take the first grapheme of a display name.
 * @param name - robot or template display name.
 * @returns the uppercased first grapheme, or `?` for a blank name.
 */
function initial(name: string): string {
  const first = graphemes.segment(name.trim())[Symbol.iterator]().next()
  return first.done === true ? '?' : first.value.segment.toUpperCase()
}

/**
 * Render a robot's avatar circle.
 * @param props - display name and the bound specification's skills.
 * @returns role artwork when a skill is recognized, otherwise the name initial.
 */
export function RobotAvatar({ name, skills }: RobotAvatarProps): ReactNode {
  const artwork = robotAvatarArt(skills)
  const Art = artwork?.Art
  return (
    <span className={css.avatar} data-art={artwork?.skill} aria-hidden="true">
      {Art === undefined ? initial(name) : <Art />}
    </span>
  )
}
