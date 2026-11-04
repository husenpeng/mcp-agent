/**
 * Browser entry for the Muse insights: mounts the Host Remote contribution,
 * then one right-Sidebar page type, the detail page of one recap work item, one
 * frame-wide notice over a single shared read source, and one configuration
 * page per Muse bundle row on the Plugins page: the insights row's own page
 * beside a schema page for memory, its tools, and goal focus.
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
import type {} from '@tomato/client-ui-plugin-manager/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-settings/client'
import type {} from '@tomato/client-ui-sidebar-right/client'
import type {} from '@tomato/client-ui-workspace/client'
import type {} from './contract.ts'
import type { ConfigForms } from '@tomato/client-ui-settings/client'
import { CONFIG_ENTRY, CONFIG_ROW_KEY, MuseInsightsConfigController } from './config-form.ts'
import { MuseInsightsConfigPage } from './ConfigPage.tsx'
import { RowConfigPage } from './RowConfigPage.tsx'
import { ROW_PAGES, RowFormController, type RowPage } from './row-form.ts'
import { registeredRowKeys, rowConfigKey, MUSE_BUNDLE } from './row-config.ts'
import { createInsightsController } from './controller.ts'
import { INSIGHTS_TAB_ID, INSIGHTS_TAB_KIND, insightsDefinition, WORK_ITEM_TAB_ID, workItemDefinition } from './definition.ts'
import { InsightNotice, type NoticeInjected } from './InsightNotice.tsx'
import { InsightsTab, type InsightsTabInjected } from './InsightsTab.tsx'
import { DICTIONARIES, NS, type MuseInsightsKey } from './locales.ts'
import { createInsightsSource } from './source.ts'
import { WorkItemTabBindings } from './work-item-bindings.ts'
import { WorkItemTab, type WorkItemTabInjected } from './WorkItemTab.tsx'
import { WorkItemTabTitle, type WorkItemTabTitleInjected } from './WorkItemTabTitle.tsx'

export type { InsightsTabParams, WorkItemTabParams } from './contract.ts'
export type { MuseInsightsKey } from './locales.ts'
export type { MuseInsightsConfig, MuseInsightsConfigFace, MuseInsightsConfigState } from './config-form.ts'

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
  // The rows' Configure pages exist only while the Host serves their settings
  // namespaces, and only where Settings provides the shared configuration
  // forms. A profile without that client surface keeps the insight surfaces above.
  ctx.inject(['configForms'], (configCtx) => {
    const config = new MuseInsightsConfigController(configCtx.configForms.get(CONFIG_ENTRY))
    configCtx.effect(() => () => { config.dispose() }, 'muse-insights: configuration form')
    configCtx.effect(() => configCtx.configForms.whileServed([CONFIG_ENTRY], () => configCtx.slots.inject('plugins.row.config', () => configCtx.slots.register({
      name: 'plugins.row.config',
      key: CONFIG_ROW_KEY,
      locale: NS,
      inject: () => config.inject(),
    }, MuseInsightsConfigPage))), 'muse-insights: configuration page')
    registerSchemaRows(configCtx, configCtx.configForms, configCtx.locale.bind(NS), configCtx.slots.inject.bind(configCtx.slots))
  })
}

/** A slot injection owned by the plugin that calls it: effects end with the plugin, not with one page. */
type SlotInject = (key: 'plugins.row.config', callback: () => Iterable<() => void>) => () => void

/** The rows this client half pages beside the insights row. */
const SCHEMA_ROW_IDS: readonly string[] = ROW_PAGES.map(page => page.row)

/**
 * Register one page per Muse row that declares only a Config schema, for every
 * row the Host serves whose key no other registration holds. Each page edits its
 * own namespace, so a row whose plugin is absent shows no page.
 * @param ctx - the browser context whose slot ledger and clock the pages observe.
 * @param forms - the shared configuration forms.
 * @param t - translate bound to the row copy dictionary.
 * @param mount - the slot injection the pages register through, owned by the calling plugin.
 */
function registerSchemaRows(
  ctx: ClientContext, forms: ConfigForms, t: (key: MuseInsightsKey) => string, mount: SlotInject,
): void {
  ctx.effect(() => forms.whileServed(SCHEMA_ROW_IDS, () => serveRows(forms, t, ctx, mount)), 'muse-insights: row pages')
}

/** How long a row page waits for a live registration to publish before it owns the key. */
export const ROW_PAGE_SETTLE_MS = 250

/**
 * Register the row pages no live entry holds. A companion that ships a row's page
 * loads beside this one, so a key held by neither at the moment this runs may
 * still be about to register; the pages wait one settle step and re-read the
 * ledger before taking their keys.
 * @param forms - the shared configuration forms.
 * @param t - translate bound to the row copy dictionary.
 * @param ctx - the browser context whose slot ledger the pages re-read.
 * @param mount - the slot injection the pages register through.
 * @returns the disposer withdrawing the pages.
 */
function serveRows(
  forms: ConfigForms, t: (key: MuseInsightsKey) => string, ctx: ClientContext, mount: SlotInject,
): () => void {
  let off: (() => void) | undefined
  const register = (owned: readonly RowPage[]): void => {
    off = mount('plugins.row.config', function* () {
      for (const page of owned) {
        const key = rowConfigKey(MUSE_BUNDLE, page.row)
        if (registeredRowKeys(ctx).has(key)) continue
        const controller = new RowFormController(forms.get(page.row), page.sections, () => t(page.title))
        yield () => { controller.dispose() }
        yield ctx.slots.register({
          name: 'plugins.row.config',
          key,
          locale: NS,
          inject: () => ({ ...controller.inject(), controller }),
        }, RowConfigPage)
      }
    })
  }
  const free = (): readonly RowPage[] =>
    ROW_PAGES.filter(page => !registeredRowKeys(ctx).has(rowConfigKey(MUSE_BUNDLE, page.row)))
  if (free().length === 0) return () => { off?.() }
  const timer = setTimeout(() => { register(free()) }, ROW_PAGE_SETTLE_MS)
  return () => {
    clearTimeout(timer)
    off?.()
  }
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
