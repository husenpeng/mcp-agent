/** Global panel icon that opens the crew studio. */
import type { ReactNode } from 'react'
import type { SidebarPanelIconOwnerProps } from '@tomato/client-ui-sidebar/client'
import { IconUsersOutlineMedium } from '@tomato/client-ui-primitives'

/**
 * Render the crew panel glyph.
 * @param props - requested size and panel selection state.
 * @returns the icon.
 */
export function CrewPanelIcon({ size }: SidebarPanelIconOwnerProps): ReactNode {
  return <IconUsersOutlineMedium size={size} />
}
