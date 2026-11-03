/**
 * Static faces of this package's two right-Sidebar page types: the two-view
 * insights page and the detail page of one recap work item.
 *
 * Both are page types, opened by kind rather than by resource address. A
 * definition captures its chip text at open time and cannot read navigation
 * parameters, so the work-item page replaces that constant through
 * `sidebar.right.pane.tab.title` with the item its tab names.
 * @module @tomato/experimental-muse-insights/client/definition
 */

import type { TranslateNS } from '@tomato/client-locale/client'
import { IconSparkleRegular } from '@tomato/client-ui-primitives'
import type { SidebarRightTabDefinition } from '@tomato/client-ui-sidebar-right/client'
import type {} from './locales.ts'

/** Implementation identity of the insights page; the id is also its slot key. */
export const INSIGHTS_TAB_ID = '@tomato/experimental-muse-insights/recap'

/** Page kind the notices, the guide, and a missing-item page open. */
export const INSIGHTS_TAB_KIND = 'muse-insights'

/** Implementation identity of one work item's detail page. */
export const WORK_ITEM_TAB_ID = '@tomato/experimental-muse-insights/work-item'

/** Page kind the recap list opens one work item in. */
export const WORK_ITEM_TAB_KIND = 'museInsightsWorkItem'

/**
 * The two-view insights page: its title and its guide card.
 * @param t - namespace-bound translate, read fresh on every title call.
 * @returns the definition to register.
 */
export function insightsDefinition(t: TranslateNS<'museInsights'>): SidebarRightTabDefinition {
  return {
    id: INSIGHTS_TAB_ID,
    kind: INSIGHTS_TAB_KIND,
    priority: 'builtin',
    title: () => t('tab.title'),
    guide: [{
      id: 'recap',
      order: 20,
      title: () => t('guide.title'),
      description: () => t('guide.description'),
      icon: IconSparkleRegular,
    }],
  }
}

/**
 * One recap work item's detail page; the chip's live text comes from its title
 * registration.
 * @param t - namespace-bound translate, read fresh on every title call.
 * @returns the definition to register.
 */
export function workItemDefinition(t: TranslateNS<'museInsights'>): SidebarRightTabDefinition {
  return {
    id: WORK_ITEM_TAB_ID,
    kind: WORK_ITEM_TAB_KIND,
    priority: 'builtin',
    title: () => t('workItem.tabTitle'),
  }
}
