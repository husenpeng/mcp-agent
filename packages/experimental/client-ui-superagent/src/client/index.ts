import type {} from '@tomato/api-remotes/client'
import type {} from '@tomato/client-ui-session/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-renderer/client'
/**
 * Registers the team's ticket panel as a right-sidebar page. It reads the list
 * the runtime logs into a Session, so no Host endpoint is involved.
 * @module @tomato/client-ui-superagent/client
 */
import type { Context as ClientContext } from '@tomato/cordis'
import type { SessionId } from '@tomato/session/types'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-sidebar-right/client'
import type {} from '@tomato/client-ui-slots'
import type {} from '@tomato/client-store'
import { TicketsTab } from './TicketsTab.tsx'
import type { TicketsTabInjected } from './TicketsTab.tsx'
import { en, TICKETS_NS as NS, zh } from './ticket-locales.ts'
import { latestTickets } from './tickets.ts'
import type { TicketRow } from './tickets.ts'

export const inject = ['locale', 'sessions', 'sidebarRightTabs', 'slots']

/** Identity of the sidebar page this plugin contributes. */
export const TICKETS_TAB_ID = '@tomato/client-ui-superagent/tickets'

/** Live rows over one Session's event window. */
interface TicketSource {
  readonly getSnapshot: () => readonly TicketRow[]
  readonly subscribe: (listener: () => void) => () => void
}

/**
 * Mount the ticket panel.
 * @param ctx - browser context carrying locale, sessions, and the sidebar registry.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'superagent-tickets: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TICKETS_TAB_ID,
    kind: 'superagent-tickets',
    priority: 'builtin',
    title: () => t('tab.title'),
  }), 'superagent-tickets: page type')

  const sources = new Map<SessionId, TicketSource>()
  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TICKETS_TAB_ID,
    locale: NS,
    inject: (sessionId: SessionId): TicketsTabInjected => {
      let source = sources.get(sessionId)
      if (source === undefined) {
        const binding = ctx.sessions.binding(sessionId)
        if (binding === undefined) throw new Error(`superagent-tickets: session "${sessionId}" is unavailable`)
        const listeners = new Set<() => void>()
        let rows: readonly TicketRow[] = latestTickets(binding.eventSource.getSnapshot().entries)
        const stop = binding.eventSource.subscribe(() => {
          const next = latestTickets(binding.eventSource.getSnapshot().entries)
          if (next === rows) return
          rows = next
          for (const listener of listeners) listener()
        })
        source = {
          getSnapshot: () => rows,
          subscribe: (listener) => {
            listeners.add(listener)
            return () => {
              listeners.delete(listener)
              if (listeners.size === 0) stop()
            }
          },
        }
        sources.set(sessionId, source)
      }
      return { tickets: source }
    },
  }, TicketsTab))
}
