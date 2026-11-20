/** Register the ticket panel over a generated Remote contribution. */

import type { Context as ClientContext } from '@tomato/cordis'
import type { TypertRemoteContribution } from '@tomato/typert-protocol'
import type {} from '@tomato/api-remotes/client'
import type {} from '@tomato/superagent-runtime/remote'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-sidebar-right/client'
import type {} from '@tomato/client-ui-slots'
import { IconUsersOutlineRegular } from '@tomato/client-ui-primitives'
import { TicketsTab } from './TicketsTab.tsx'
import type { TicketsTabInjected } from './TicketsTab.tsx'
import { en, TICKETS_NS as NS, zh } from './ticket-locales.ts'
import { createTicketController } from './tickets.ts'

/** Services needed before mounting the generated Remote contribution. */
export const inject = ['remote', 'locale', 'sidebarRightTabs', 'slots']

/** Identity of the sidebar page this plugin contributes. */
const TICKETS_TAB_ID = '@tomato/client-ui-superagent/tickets'

/** Register the panel after its generated Remote namespace becomes available. */
function registerUi(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'superagent-tickets: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TICKETS_TAB_ID,
    kind: 'superagent-tickets',
    priority: 'builtin',
    title: () => t('tab.title'),
    guide: [{
      id: 'tickets', order: 50, title: () => t('tab.title'),
      description: () => t('guide.description'), icon: IconUsersOutlineRegular,
    }],
  }), 'superagent-tickets: page type')

  const controller = createTicketController(ctx.remote.superagentTickets)
  ctx.effect(() => () => { controller.dispose() }, 'superagent-tickets: reads')
  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TICKETS_TAB_ID,
    locale: NS,
    inject: (): TicketsTabInjected => {
      void controller.refresh()
      controller.watch()
      return {
        hooks: { tickets: controller.source },
        refresh: () => controller.refresh(),
        actions: controller.actions,
      }
    },
  }, TicketsTab))
}

/**
 * Mount the Remote and panel for one plugin lifetime.
 * @param ctx - browser plugin context.
 * @param contribution - generated Host Remote definitions for `superagentTickets`.
 * @returns disposer that withdraws the panel before unmounting the Remote.
 */
export async function mountSuperagentTickets(
  ctx: ClientContext,
  contribution: TypertRemoteContribution,
): Promise<() => Promise<void>> {
  const unmountRemote = await ctx.remote.$mount(contribution)
  const ui = ctx.inject(['remote.superagentTickets', ...inject.slice(1)], (child) => { registerUi(child) })
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
