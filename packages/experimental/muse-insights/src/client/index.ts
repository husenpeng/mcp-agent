/**
 * Browser entry for the Muse insights: mounts the Host Remote contribution,
 * then one right-Sidebar page type and one frame-wide notice entry over a
 * single shared read source.
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
import { IconSparkleRegular } from '@tomato/client-ui-primitives'
import type { TypertRemoteContribution } from '@tomato/typert-protocol'
import type {} from '@tomato/api-remotes/client'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-sidebar-right/client'
import type {} from '@tomato/client-ui-workspace/client'
import type {} from './contract.ts'
import { createInsightsController, INSIGHTS_TAB_KIND } from './controller.ts'
import { InsightNotice, type NoticeInjected } from './InsightNotice.tsx'
import { InsightsTab, type InsightsTabInjected } from './InsightsTab.tsx'
import { DICTIONARIES, NS } from './locales.ts'
import { createInsightsSource } from './source.ts'

export type { InsightsTabParams } from './contract.ts'
export type { MuseInsightsKey } from './locales.ts'

/** Services the mounted browser contribution requires. */
export const inject = ['remote', 'slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'uiWorkspace']

/** Page type implementation identity; the id is also the body's slot key. */
const TAB_ID = '@tomato/experimental-muse-insights/recap'

/**
 * Register the locale dictionaries, polling controller, Sidebar page type, and
 * frame-wide notice over one source.
 * @param ctx - browser context that already carries the mounted Remote namespace.
 */
function registerUi(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), 'muse-insights: dictionaries')
  const t = ctx.locale.bind(NS)
  const source = createInsightsSource()
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
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: INSIGHTS_TAB_KIND,
    title: () => t('tab.title'),
    guide: [{
      id: 'recap',
      order: 20,
      title: () => t('guide.title'),
      description: () => t('guide.description'),
      icon: IconSparkleRegular,
    }],
  }), 'muse-insights: Sidebar page type')
  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TAB_ID,
    locale: NS,
    inject: (): InsightsTabInjected => ({
      hooks: source.hooks,
      onRefresh: signal => controller.refresh(signal),
    }),
  }, InsightsTab))
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
