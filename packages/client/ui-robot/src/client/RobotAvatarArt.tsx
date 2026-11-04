/**
 * Avatar artwork for the creator-marketing robot roles. Artwork is keyed by the
 * bundled skill a robot runs, so a hired copy keeps its template's artwork
 * without storing presentation fields in the robot specification.
 * @module @tomato/client-ui-robot
 */

import type { ReactNode } from 'react'

/** One skill's avatar artwork and the skill id that selects it. */
export interface RobotAvatarArtwork {
  /** Skill id that selects this artwork. */
  readonly skill: string
  /** Square glyph drawn inside the avatar circle. */
  readonly Art: () => ReactNode
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const badgeStroke = { ...stroke, strokeWidth: 1.3 } as const

/**
 * Wrap glyphs in the shared 22px decorative SVG.
 * @param props.children - glyph geometry drawn on the 24-unit grid.
 * @returns the sized SVG.
 */
function ArtworkFrame({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

/** Speech bubble with a share-of-voice chart. */
function BrandInsightArt(): ReactNode {
  return (
    <ArtworkFrame>
      <path {...stroke} d="M4.3 5.3h15.4a2.4 2.4 0 0 1 2.4 2.4v6.6a2.4 2.4 0 0 1-2.4 2.4h-8.2L7 20.4v-3.7H4.3a2.4 2.4 0 0 1-2.4-2.4V7.7a2.4 2.4 0 0 1 2.4-2.4Z" />
      <path {...stroke} d="M7.3 12.7v-2.2M10.9 12.7V8.9M14.5 12.7V6.7" />
      <circle cx="18.2" cy="9.6" r="1" fill="currentColor" />
    </ArtworkFrame>
  )
}

/** Creator profile with a spark. */
function InfluencerMarketingArt(): ReactNode {
  return (
    <ArtworkFrame>
      <circle {...stroke} cx="9.1" cy="8.1" r="2.75" />
      <path {...stroke} d="M3.7 20.3c.4-3.3 2.6-5.8 5.4-5.8s5 2.5 5.4 5.8" />
      <path d="M18.1 4.1l.95 2.95 2.95.95-2.95.95-.95 2.95-.95-2.95-2.95-.95 2.95-.95.95-2.95Z" fill="currentColor" />
    </ArtworkFrame>
  )
}

/** Ad frame with a magnifier. */
function CreativeIntelligenceArt(): ReactNode {
  return (
    <ArtworkFrame>
      <rect {...stroke} x="3.4" y="5.7" width="10.8" height="10.8" rx="2.2" />
      <circle cx="7.1" cy="9.2" r=".95" fill="currentColor" />
      <path {...stroke} d="M5.2 14.6l2.7-3.1 1.7 1.8 1.2-1.2 1.9 2.5" />
      <circle {...stroke} cx="17.4" cy="16.6" r="3.2" />
      <path {...stroke} d="M19.7 18.9l2.2 2.2" />
    </ArtworkFrame>
  )
}

/** TikTok note, the platform mark shared by the platform's two roles. */
function TikTokMark(): ReactNode {
  return (
    <>
      <path {...stroke} d="M10.9 4.4v9.1" />
      <circle {...stroke} cx="8.5" cy="13.5" r="2.4" />
      <path {...stroke} d="M10.9 4.8c.7 1.8 2.2 2.9 4.2 3" />
    </>
  )
}

/** Instagram camera, the platform mark shared by the platform's two roles. */
function InstagramMark(): ReactNode {
  return (
    <>
      <rect {...stroke} x="3" y="4.3" width="12" height="9.4" rx="2.6" />
      <path {...stroke} d="M5.9 4.3L7.1 2.1h4.8l1.2 2.2" />
      <circle {...stroke} cx="9" cy="9" r="2.6" />
      <circle cx="12.7" cy="6.5" r=".65" fill="currentColor" />
    </>
  )
}

/** X mark, the platform mark shared by the platform's two roles. */
function XMark(): ReactNode {
  return <path d="M4.1 4.2l11.4 11.4M15.5 4.2L4.1 15.6" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" />
}

/** YouTube play mark, the platform mark shared by the platform's two roles. */
function YouTubeMark(): ReactNode {
  return (
    <>
      <rect {...stroke} x="2.8" y="4.4" width="13.4" height="9.6" rx="3.2" />
      <path d="M7.6 6.8L11.6 9.2 7.6 11.6Z" fill="currentColor" />
    </>
  )
}

/** Product-selection cue: a cart on a surface-colored badge over the platform mark. */
function SelectionBadge(): ReactNode {
  return (
    <>
      <circle cx="18.6" cy="18.6" r="4.7" fill="var(--robot-avatar-surface)" />
      <g transform="translate(18.6 18.6)">
        <path {...badgeStroke} d="M-3.4-2.8h1.5l.9 4.3h4.4" />
        <path {...badgeStroke} d="M-1.2-.8h5.4l-.9 2.6h-3.9" />
        <circle cx="-.6" cy="2.8" r=".65" fill="currentColor" />
        <circle cx="2.4" cy="2.8" r=".65" fill="currentColor" />
      </g>
    </>
  )
}

/** Data-insight cue: a bar chart on a surface-colored badge over the platform mark. */
function InsightBadge(): ReactNode {
  return (
    <>
      <circle cx="18.6" cy="18.6" r="4.7" fill="var(--robot-avatar-surface)" />
      <g transform="translate(18.6 18.6)">
        <path {...badgeStroke} d="M-2.6 2.6v-2.2M0 2.6V-.2M2.6 2.6V-2.8" />
      </g>
    </>
  )
}

/** TikTok product selection: the note plus a shopping cart. */
function TikTokSelectionArt(): ReactNode {
  return <ArtworkFrame><TikTokMark /><SelectionBadge /></ArtworkFrame>
}

/** TikTok data insight: the note plus a bar chart. */
function TikTokInsightArt(): ReactNode {
  return <ArtworkFrame><TikTokMark /><InsightBadge /></ArtworkFrame>
}

/** Instagram product selection: the camera plus a shopping cart. */
function InstagramSelectionArt(): ReactNode {
  return <ArtworkFrame><InstagramMark /><SelectionBadge /></ArtworkFrame>
}

/** Instagram data insight: the camera plus a bar chart. */
function InstagramInsightArt(): ReactNode {
  return <ArtworkFrame><InstagramMark /><InsightBadge /></ArtworkFrame>
}

/** X product selection: the X plus a shopping cart. */
function XSelectionArt(): ReactNode {
  return <ArtworkFrame><XMark /><SelectionBadge /></ArtworkFrame>
}

/** X data insight: the X plus a bar chart. */
function XInsightArt(): ReactNode {
  return <ArtworkFrame><XMark /><InsightBadge /></ArtworkFrame>
}

/** YouTube product selection: the play mark plus a shopping cart. */
function YouTubeSelectionArt(): ReactNode {
  return <ArtworkFrame><YouTubeMark /><SelectionBadge /></ArtworkFrame>
}

/** YouTube data insight: the play mark plus a bar chart. */
function YouTubeInsightArt(): ReactNode {
  return <ArtworkFrame><YouTubeMark /><InsightBadge /></ArtworkFrame>
}

const ART_BY_SKILL: Readonly<Record<string, () => ReactNode>> = {
  'brand-insight': BrandInsightArt,
  'influencer-marketing': InfluencerMarketingArt,
  'creative-intelligence': CreativeIntelligenceArt,
  'tiktok-product-selection': TikTokSelectionArt,
  'tiktok-data-insight': TikTokInsightArt,
  'instagram-product-selection': InstagramSelectionArt,
  'instagram-data-insight': InstagramInsightArt,
  'x-product-selection': XSelectionArt,
  'x-data-insight': XInsightArt,
  'youtube-product-selection': YouTubeSelectionArt,
  'youtube-data-insight': YouTubeInsightArt,
}

/**
 * Select the artwork for a robot's primary recognized role.
 * @param skills - skill ids in the order the specification lists them.
 * @returns the first skill with artwork, or `undefined` when none is recognized.
 */
export function robotAvatarArt(skills: readonly string[]): RobotAvatarArtwork | undefined {
  for (const skill of skills) {
    const Art = ART_BY_SKILL[skill]
    if (Art !== undefined) return { skill, Art }
  }
  return undefined
}
