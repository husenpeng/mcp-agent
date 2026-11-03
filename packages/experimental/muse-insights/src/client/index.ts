/**
 * Browser entry for the Muse insights: mounts the Host Remote contribution,
 * then one right-Sidebar page type, the detail page of one recap work item, and
 * one frame-wide notice over a single shared read source.
 *
 * The Remote contribution is mounted here rather than in the central
 * `@tomato/api-remotes` assembly because this capability is optional and
 * experimental; the assembly cannot depend on it. The UI waits for the
 * namespace with `ctx.inject` after the mount, so a failed mount never leaves
 * registrations behind.
 * @module @tomato/experimental-muse-insights/client
 */

import type { Context as ClientContext } from '@tomato/cordis'
import remote from '@tomato/experimental-muse-insights/remote'
import type { TypertRemoteContribution } from '@tomato/typert-protocol'
import type {} from '@tomato/api-remotes/client'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-sidebar-right/client'
import type {} from '@tomato/client-ui-workspace/client'
import type {} from './contract.ts'
import { createInsightsController } from './controller.ts'
import { INSIGHTS_TAB_ID, INSIGHTS_TAB_KIND, insightsDefinition, WORK_ITEM_TAB_ID, workItemDefinition } from './definition.ts'
import { InsightNotice, type NoticeInjected } from './InsightNotice.tsx'
import { InsightsTab, type InsightsTabInjected } from './InsightsTab.tsx'
import { DICTIONARIES, NS } from './locales.ts'
import { createInsightsSource } from './source.ts'
import { WorkItemTabBindings } from './work-item-bindings.ts'
import { WorkItemTab, type WorkItemTabInjected } from './WorkItemTab.tsx'
import { WorkItemTabTitle, type WorkItemTabTitleInjected } from './WorkItemTabTitle.tsx'

export type { InsightsTabParams, WorkItemTabParams } from './contract.ts'
export type { MuseInsightsKey } from './locales.ts'

/** Services the mounted browser contribution requires. */
export const inject = ['remote', 'slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'uiWorkspace']

/**
 * Register the locale dictionaries, polling controller, both Sidebar page types,
 * and frame-wide notice over one source.
 * @param ctx - browser context that already carries the mounted Remote namespace.
 */
function registerUi(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), 'muse-insights: dictionaries')
  const t = ctx.locale.bind(NS)
  const source = createInsightsSource()
  // A detail page the reload restored carries no navigation parameters, so its
  // kind remembers the item each tab last showed for as long as that layout lives.
  const workItemBindings = new WorkItemTabBindings(
    sessionId => ctx.sidebarRight.tabsIn(sessionId).map(tab => tab.id),
  )
  const controller = createInsightsController({
    snapshot: signal => ctx.remote.museInsights.snapshot(signal),
    refresh: signal => ctx.remote.museInsights.refresh(signal),
    mounted: ctx.sidebarRight.mounted,
    openTab: (view) => { ctx.sidebarRight.openTab(INSIGHTS_TAB_KIND, { params: { view } }) },
    startSession: () => { ctx.uiWorkspace.startSession() },
    onReset: listener => ctx.on('connection/reset', listener),
    warn: (message, error) => {
      ctx.logger.warn(`muse-insights: ${message}: ${error instanceof Error ? error.message : String(error)}`)
    },
  }, source)
  ctx.effect(() => () => { controller.dispose() }, 'muse-insights: polling')
  ctx.effect(() => ctx.sidebarRightTabs.register(insightsDefinition(t)), 'muse-insights: Sidebar page type')
  ctx.effect(() => ctx.sidebarRightTabs.register(workItemDefinition(t)), 'muse-insights: work item page type')
  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: INSIGHTS_TAB_ID,
    locale: NS,
    inject: (): InsightsTabInjected => ({
      hooks: source.hooks,
      onRefresh: signal => controller.refresh(signal),
    }),
  }, InsightsTab))
  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: WORK_ITEM_TAB_ID,
    locale: NS,
    inject: (): WorkItemTabInjected => ({
      hooks: source.hooks,
      workItemBindings,
      onRefresh: signal => controller.refresh(signal),
    }),
  }, WorkItemTab))
  ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab.title',
    key: WORK_ITEM_TAB_ID,
    locale: NS,
    inject: (): WorkItemTabTitleInjected => ({ workItemBindings }),
  }, WorkItemTabTitle))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'muse-insights.notice',
    locale: NS,
    inject: (): NoticeInjected => ({
      hooks: source.hooks,
      onOpen: (view) => { controller.open(view) },
      onDismiss: source.actions.dismissNotice,
    }),
  }, InsightNotice))
}

/**
 * Mount the generated Remote contribution and then its browser surfaces.
 * @param ctx - browser plugin context.
 * @param contribution - generated Host Remote definitions for `museInsights`.
 * @returns disposer that withdraws the surfaces before the Remote contribution.
 */
export async function mountInsights(ctx: ClientContext, contribution: TypertRemoteContribution): Promise<() => Promise<void>> {
  const unmountRemote = await ctx.remote.$mount(contribution)
  const ui = ctx.inject(['remote.museInsights', ...inject.slice(1)], (child) => { registerUi(child) })
  try {
    await ui
  } catch (error: unknown) {
    await ui.dispose()
    await unmountRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await unmountRemote()
  }
}

/**
 * Mount the capability into the browser composition.
 * @param ctx - browser plugin context.
 * @returns disposer joining the surfaces and the Remote contribution.
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  return await mountInsights(ctx, remote)
}
