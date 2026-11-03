/** Global panel icon that opens the robot page. */
import type { ReactNode } from 'react'
import type { SidebarPanelIconOwnerProps } from '@tomato/client-ui-sidebar/client'

/**
 * Render the robot panel glyph.
 * @param props - requested size and panel selection state.
 * @returns the icon.
 */
export function RobotPanelIcon({ size }: SidebarPanelIconOwnerProps): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 7V4" />
      <path d="M8 19v2M16 19v2" />
    </svg>
  )
}
