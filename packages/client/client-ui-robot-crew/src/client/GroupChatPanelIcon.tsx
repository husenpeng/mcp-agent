/** Global panel icon that opens the multi-agent collaboration tab. */
import type { ReactNode } from 'react'
import type { SidebarPanelIconOwnerProps } from '@tomato/client-ui-sidebar/client'
import { IconNewChatOutlineMedium } from '@tomato/client-ui-primitives'

/**
 * Render the collaboration panel glyph.
 * @param props - requested size and panel selection state.
 * @returns the icon.
 */
export function GroupChatPanelIcon({ size }: SidebarPanelIconOwnerProps): ReactNode {
  return <IconNewChatOutlineMedium size={size} />
}
