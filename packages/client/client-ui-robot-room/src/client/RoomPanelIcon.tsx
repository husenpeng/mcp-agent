/** Global panel icon that opens the Robot Room page. */
import type { ReactNode } from 'react'
import type { SidebarPanelIconOwnerProps } from '@tomato/client-ui-sidebar/client'
import { IconUsersOutlineMedium } from '@tomato/client-ui-primitives'

/**
 * Render the room panel glyph.
 * @param props - requested size and panel selection state.
 * @returns the icon.
 */
export function RoomPanelIcon({ size }: SidebarPanelIconOwnerProps): ReactNode {
  return <IconUsersOutlineMedium size={size} />
}
