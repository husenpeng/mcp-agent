/**
 * Right-Sidebar page parameters and the narrowing helpers their bodies use.
 *
 * The Sidebar records navigation parameters unvalidated, so each body treats
 * every value as absent unless it names what that page type shows.
 * @module @tomato/experimental-muse-insights/client/contract
 */

import type { SidebarRightNavigationParams, SidebarRightTabParamsMap } from '@tomato/client-ui-sidebar-right/client'
import type { InsightsView } from './source.ts'

/** What opening the Muse insights page accepts. */
export interface InsightsTabParams {
  /** View to show; omission opens the daily recap. */
  readonly view?: InsightsView
}

/**
 * What opening one work item's detail page accepts: the recap that listed it
 * and the item's title, which that recap keeps unique.
 */
export interface WorkItemTabParams {
  /** Local calendar day key of the recap that listed the item. */
  readonly day: string
  /** The item's title as the recap lists it. */
  readonly title: string
}

declare module '@tomato/client-ui-sidebar-right/client' {
  interface SidebarRightTabParamsMap {
    /** Muse insights detail page; both views share one tab type. */
    'muse-insights': InsightsTabParams
    /** One recap work item, named by its day and title. */
    museInsightsWorkItem: WorkItemTabParams
  }
}

/**
 * Read one recorded view from unvalidated navigation parameters.
 * @param params - the navigation record's parameters.
 * @returns the named view, or undefined for a restored tab or another type's parameters.
 */
export function recordedView(params: SidebarRightNavigationParams): InsightsView | undefined {
  if (params === undefined || !('view' in params)) return undefined
  return params.view
}

/**
 * Read one work item's identity from unvalidated navigation parameters.
 * @param params - the navigation record's parameters.
 * @returns the day and title the open named, or undefined for a restored tab or another type's parameters.
 */
export function workItemParams(params: SidebarRightNavigationParams): SidebarRightTabParamsMap['museInsightsWorkItem'] | undefined {
  if (params === undefined || !('day' in params) || !('title' in params)) return undefined
  return { day: params.day, title: params.title }
}
