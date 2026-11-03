/**
 * Right-Sidebar page parameters and the narrowing helper its body uses.
 *
 * The Sidebar records navigation parameters unvalidated, so the body treats
 * every value as absent unless it names one of the two views.
 * @module @tomato/experimental-muse-insights/client/contract
 */

import type { SidebarRightNavigationParams } from '@tomato/client-ui-sidebar-right/client'
import type { InsightsView } from './source.ts'

/** What opening the Muse insights page accepts. */
export interface InsightsTabParams {
  /** View to show; omission opens the daily recap. */
  readonly view?: InsightsView
}

declare module '@tomato/client-ui-sidebar-right/client' {
  interface SidebarRightTabParamsMap {
    /** Muse insights detail page; both views share one tab type. */
    'muse-insights': InsightsTabParams
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
