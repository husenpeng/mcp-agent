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
  /** Rendered diameter in px; defaults to 36 where the roster shows it. */
  readonly size?: number
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
 * @param props - display name, the bound specification's skills, and the diameter.
 * @returns role artwork when a skill is recognized, otherwise the name initial.
 */
export function RobotAvatar({ name, skills, size }: RobotAvatarProps): ReactNode {
  const artwork = robotAvatarArt(skills)
  const Art = artwork?.Art
  const dimensions = size === undefined ? undefined : { width: size, height: size, fontSize: size * 0.42 }
  return (
    <span className={css.avatar} data-art={artwork?.skill} style={dimensions} aria-hidden="true">
      {Art === undefined ? initial(name) : <Art />}
    </span>
  )
}
