/** Tomato brand occupants: the sidebar mark, name, and hero mark. */
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { TOMATO_MARK_PATH, TOMATO_MARK_VIEWBOX } from './mark.ts'

/** Product name shown beside the sidebar mark; brand names are not translated. */
const BRAND_NAME = 'Tomato Harness'

/**
 * Render the tomato glyph at the requested edge length.
 * @param props - size in px and optional host class preserving surrounding geometry.
 * @returns the glyph svg (decorative; the name is announced separately).
 */
export function TomatoMark({ size, className }: HeroBrandMarkOwnerProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox={`0 0 ${String(TOMATO_MARK_VIEWBOX.width)} ${String(TOMATO_MARK_VIEWBOX.height)}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={TOMATO_MARK_PATH} fill="currentColor" />
    </svg>
  )
}

/**
 * Render the sidebar brand mark through the same glyph.
 * @param props - host-supplied mark presentation.
 * @returns the glyph svg.
 */
export function TomatoSidebarMark({ size }: SidebarBrandMarkOwnerProps) {
  return <TomatoMark size={size} />
}

/**
 * Render the product name beside the sidebar mark.
 * @returns the product name as text.
 */
export function TomatoBrandName() {
  return <span translate="no">{BRAND_NAME}</span>
}
