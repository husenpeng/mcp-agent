/** Sidebar glyph for the multi-agent group-chat page. */

import type { ReactNode } from 'react'
import type { SidebarPanelIconOwnerProps } from '@tomato/client-ui-sidebar/client'
import { IconNewChatOutlineMedium } from '@tomato/client-ui-primitives'

/**
 * Render the collaboration entry glyph.
 * @param props - requested icon size and selection state.
 * @returns the group-chat icon.
 */
export function GroupChatPanelIcon({ size }: SidebarPanelIconOwnerProps): ReactNode {
  return <IconNewChatOutlineMedium size={size} />
}
