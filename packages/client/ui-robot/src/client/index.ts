/**
 * Tomato Rbot plugin, browser half: the robot roster in the left sidebar, the
 * `robots` main page with its six-block specification editor, the run list, and
 * a robot conversation surface bound to a run's Session. All registry state and
 * control calls go through the `robotRuns` client service; this plugin holds no
 * transport state of its own.
 */
import type { Context as ClientContext } from '@tomato/cordis'
import type { MainPanelId } from '@tomato/client-ui-layout/client'
import type { SessionReference } from '@tomato/api-session-controller/client'
import type {} from '@tomato/api-remotes/client'
import type {} from '@tomato/api-remote-access/client'
import type {} from '@tomato/api-robot-controller/client'
import type {} from '@tomato/api-session-controller/client'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-workspace/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-session/client'
import type {} from '@tomato/client-ui-sidebar/client'
import { RobotConversation } from './RobotConversation.tsx'
import { RobotPage, type RobotReferenceOption } from './RobotPage.tsx'
import { RobotPanelIcon } from './RobotPanelIcon.tsx'
import { RobotSidebar } from './RobotSidebar.tsx'
import { createRobotPageStore } from './store.ts'
import { en, NS, zh } from './locales.ts'

/** Robot page key in the main keyed slot and the sidebar panel list. */
export const PANEL_ID = 'robots' as MainPanelId

declare module '@tomato/client-ui-slots' {
  interface SlotMap {
    /**
     * The run Conversation mounted inside the robot page, bound to one run's
     * Session by the enclosing SessionProvider. Declared by this package's
     * `robots` main entry; this package registers the occupant.
     */
    'robots.conversation': { kind: 'single'; scope: 'session' }
  }
}

declare module '@tomato/api-session-controller/client' {
  interface SessionReferenceSourceMap {
    /** A robot run Session retained by the robot page while its conversation is open. */
    robotRun: unknown
  }
}

/** Required services: the robot registry and control, Session retention, reference catalogs, layout, slots, and copy. */
export const inject = [
  'slots', 'locale', 'layout', 'robotRuns', 'sessions', 'uiWorkspace',
  'remote.permissionPresets', 'remote.skills',
]

/**
 * Client plugin body: register the dictionaries, the panel, the roster, and the
 * conversation host.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-robot: dictionaries')
  const handle = createRobotPageStore()
  const instance = handle.create()
  const store = { ...handle, create: () => instance }
  const injected = () => ({
    hooks: { robotPage: instance, registry: ctx.robotRuns.state },
    createWithConversation: () => {
      ctx.uiWorkspace.startSession(undefined, {
        prompt: t('roster.createWithChatPrompt'),
        whenDraftExists: 'replace',
      })
    },
    references: async () => {
      const presets: RobotReferenceOption[] = []
      const catalog = await ctx.remote.permissionPresets.catalog()
      if (catalog.ok) {
        for (const option of catalog.value.options) presets.push({ value: option.value, label: option.name })
      }
      const current = Object.values(ctx.sessions.list.getSnapshot().byId)
        .find(row => (row.retainedBy.mainView ?? 0) > 0)?.id
      const skills: string[] = []
      if (current !== undefined) {
        const listed = await ctx.remote.skills.list({ sessionId: current, brief: true })
        if (listed.ok) for (const skill of listed.value.skills) skills.push(skill.name)
      }
      return { presets, skills }
    },
    registryActions: {
      publish: ctx.robotRuns.publish.bind(ctx.robotRuns),
      instantiate: ctx.robotRuns.instantiate.bind(ctx.robotRuns),
      rebind: ctx.robotRuns.rebind.bind(ctx.robotRuns),
      start: ctx.robotRuns.start.bind(ctx.robotRuns),
      cancel: ctx.robotRuns.cancel.bind(ctx.robotRuns),
      // The page releases the reference when the run selection or the page unmounts.
      retainSession: (sessionId: Parameters<typeof ctx.sessions.retain>[0]): SessionReference =>
        ctx.sessions.retain(sessionId, { source: 'robotRun' }),
    },
  })

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    store,
    children: { 'robots.conversation': { kind: 'single', scope: 'session' } },
    inject: injected,
  }, RobotPage))

  ctx.slots.inject('robots.conversation', () => ctx.slots.register({
    name: 'robots.conversation',
    locale: NS,
  }, RobotConversation))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 40,
    locale: NS,
    label: () => t('nav'),
  }, RobotPanelIcon))

  ctx.slots.inject('sidebar.robots', () => ctx.slots.register({
    name: 'sidebar.robots',
    locale: NS,
    store,
    inject: () => ({
      hooks: { registry: ctx.robotRuns.state, robotPage: instance },
      selectPanel: () => { ctx.layout.selectPanel(PANEL_ID) },
    }),
  }, RobotSidebar))
}
