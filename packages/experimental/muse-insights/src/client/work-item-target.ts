/**
 * Resolve the work item one detail tab shows.
 *
 * The Sidebar persists a tab's layout record but not the navigation parameters
 * its opener passed, so a restored tab falls back to the binding this page kind
 * last wrote for that layout id. The body and the chip resolve the same target,
 * so a reopened tab names and draws one item.
 * @module @tomato/experimental-muse-insights/client/work-item-target
 */

import { useMemo } from 'react'
import type { SidebarRightNavigationParams, TabId } from '@tomato/client-ui-sidebar-right/client'
import type { SessionId } from '@tomato/session/types'
import { workItemParams } from './contract.ts'
import type { WorkItemTabBindings, WorkItemTabTarget } from './work-item-bindings.ts'

/** The layout and navigation fields one detail tab carries. */
export interface WorkItemTabSource {
  /** The layout record's own id, which a stored binding is keyed by. */
  readonly id: TabId
  /** Navigation the tab's last open carried; a restored record carries no parameters. */
  readonly navigation: { readonly params: SidebarRightNavigationParams; readonly revision: number }
}

/** The work item one detail tab resolves. */
export interface WorkItemTabResolution {
  /** The item this tab's last open named; undefined for a restored record or another type's parameters. */
  readonly navigation: WorkItemTabTarget | undefined
  /** The item to show: the navigation's, or the binding a restored record last wrote. */
  readonly params: WorkItemTabTarget | undefined
}

/**
 * Resolve the work item one detail tab shows from its navigation or its stored binding.
 * @param sessionId - the Session holding the tab.
 * @param tab - the tab's layout identity and its last navigation.
 * @param bindings - provider-owned binding store for restored detail tabs.
 * @returns the navigation's item and the item to show.
 */
export function useWorkItemTarget(
  sessionId: SessionId,
  tab: WorkItemTabSource,
  bindings: WorkItemTabBindings,
): WorkItemTabResolution {
  const navigation = workItemParams(tab.navigation.params)
  const navigated = tab.navigation.params !== undefined
  const recovered = useMemo(
    () => navigated ? undefined : bindings.read(sessionId, tab.id),
    [bindings, sessionId, tab.id, navigated, tab.navigation.revision],
  )
  return { navigation, params: navigation ?? recovered }
}
