/**
 * The work item page's chip: the title of the item its tab names, or the page's
 * own label when neither its navigation nor its stored binding resolves one.
 * Registered under `sidebar.right.pane.tab.title`; without it the chip would show
 * the constant text the definition captured at open time, which names no item.
 * @module @tomato/experimental-muse-insights/client/WorkItemTabTitle
 */

import type { ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { WorkItemTabBindings } from './work-item-bindings.ts'
import { useWorkItemTarget } from './work-item-target.ts'

/** What the chip reads beyond its tab information. */
export interface WorkItemTabTitleInjected {
  /** Durable binding from one detail page to the item it last showed. */
  readonly workItemBindings: WorkItemTabBindings
}

/** Props of the work item page's chip. */
export type WorkItemTabTitleProps = PropsRuntime<'sidebar.right.pane.tab.title'>
  & PropsLocale<'museInsights'>
  & InjectFace<WorkItemTabTitleInjected>

/**
 * Render the shown item's title as the chip text.
 * @param props - tab information, the binding store, and localized copy.
 * @returns the item's title, or the page's label without a resolvable item.
 */
export function WorkItemTabTitle({ sessionId, useTabInfo, workItemBindings, t }: WorkItemTabTitleProps): ReactNode {
  const { tab } = useTabInfo()
  const { params } = useWorkItemTarget(sessionId, tab, workItemBindings)
  return params?.title ?? t('workItem.tabTitle')
}
