/**
 * Tomato Rbot plugin, browser half: the robot roster in the left sidebar, the
 * `robots` main page with its template and robot gallery, guided creation
 * flow, six-block specification editor, and run list, a robot conversation
 * surface bound to a run's Session, and the `robot_create` transcript row.
 * All registry state and control calls go through the `robotRuns` client
 * service; this plugin holds no transport state of its own.
 */
import { brandString } from '@tomato/branded'
import type { Context as ClientContext } from '@tomato/cordis'
import type { MainPanelId } from '@tomato/client-ui-layout/client'
import type { SessionReference } from '@tomato/api-session-controller/client'
import type { RobotId, RobotTemplate, Run } from '@tomato/api-robot-controller/client'
import type { SessionId } from '@tomato/session/types'
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
import { RobotCreateRow, type RobotCreateRowInjected } from './RobotCreateRow.tsx'
import { RobotPage, type RobotReferenceOption } from './RobotPage.tsx'
import { RobotRunPanel } from './RobotRunPanel.tsx'
import type { RobotIdentity, RunDetailActions } from './RunDetail.tsx'
import { RobotPanelIcon } from './RobotPanelIcon.tsx'
import { retainRunSession } from './run-session.ts'
import { robotModelCatalog, type RobotModelCatalog } from './model-catalog.ts'
import { createRobotPageStore } from './store.ts'
import { templateTextFor } from './template-text.ts'
import { en, NS, zh } from './locales.ts'

/** Robot page key in the main keyed slot and the sidebar panel list. */
export const PANEL_ID = 'robots' as MainPanelId

declare module '@tomato/client-ui-slots' {
  interface SlotMap {
    /**
     * One run's task-style detail, bound to the run's Session by the enclosing
     * SessionProvider. Declared by this package's `robots` main entry; this
     * package registers the occupant.
     */
    'robots.run': {
      kind: 'single'
      scope: 'session'
      owner: { run: Run; robot: RobotIdentity; actions: RunDetailActions; startBlocked: boolean; hasRuns: boolean }
    }
  }
}

/**
 * Required services: the robot registry and control, Session retention, the
 * gateway and the permission and model catalogs it carries, layout, slots, and
 * copy. `remote` is required alongside its namespaces because the editor reads
 * them through the gateway service; injecting only `remote.permissionPresets`
 * leaves `ctx.remote` unreachable, so every catalog read failed and the
 * skill, plugin, and MCP pickers opened empty.
 */
export const inject = [
  'slots', 'locale', 'layout', 'robotRuns', 'sessions', 'uiWorkspace', 'uiConversation',
  'remote', 'remote.permissionPresets', 'remote.session',
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
    locale: () => ctx.locale.getSnapshot().active,
    templateText: (template: RobotTemplate) => templateTextFor(template, ctx.locale.getSnapshot().active),
    listDirectory: (path?: string, signal?: AbortSignal) => ctx.uiWorkspace.listDirectory(path, signal),
    pickDirectory: () => ctx.uiWorkspace.pickDirectory(),
    references: async () => {
      const presets: RobotReferenceOption[] = []
      const catalog = await ctx.remote.permissionPresets.catalog()
      if (catalog.ok) {
        for (const option of catalog.value.options) presets.push({ value: option.value, label: option.name })
      }
      // Project skills depend on the Workspace the viewed Session belongs to;
      // without one the Host still lists deployment-wide sources.
      const cwd = Object.values(ctx.sessions.list.getSnapshot().byId)
        .find(row => (row.retainedBy.mainView ?? 0) > 0)?.cwd
      const local = await ctx.robotRuns.capabilities(cwd === undefined ? {} : { cwd })
      // The same catalog the composer model selector reads: it lists the
      // providers this deployment can route, including third-party API
      // providers configured in Settings. A failed read leaves the editor
      // usable with the deployment default as its only choice.
      let models: RobotModelCatalog | undefined
      try {
        const catalog = await ctx.remote.session.modelCatalog()
        if (catalog.ok) models = robotModelCatalog(catalog.value)
      } catch (error: unknown) {
        // A transport failure must not discard the capability and preset lists
        // that already loaded; the model field falls back to the deployment default.
        ctx.logger.warn(`ui-robot: model catalog read failed: ${String(error)}`)
      }
      return {
        presets,
        capabilities: local.ok
          ? local.value
          : { skills: [], plugins: [], tools: [], mcpServers: [], workspaceRoots: [] },
        ...models === undefined ? {} : { models },
        ...(cwd === undefined ? {} : { defaultWorkspaceRoot: cwd }),
      }
    },
    registryActions: {
      publish: ctx.robotRuns.publish.bind(ctx.robotRuns),
      instantiate: ctx.robotRuns.instantiate.bind(ctx.robotRuns),
      rebind: ctx.robotRuns.rebind.bind(ctx.robotRuns),
      install: ctx.robotRuns.install.bind(ctx.robotRuns),
      remove: ctx.robotRuns.remove.bind(ctx.robotRuns),
      hire: ctx.robotRuns.hire.bind(ctx.robotRuns),
      start: ctx.robotRuns.start.bind(ctx.robotRuns),
      cancel: ctx.robotRuns.cancel.bind(ctx.robotRuns),
      interrupt: ctx.robotRuns.interrupt.bind(ctx.robotRuns),
      correct: ctx.robotRuns.correct.bind(ctx.robotRuns),
      // The page releases the reference when the run selection or the page unmounts.
      retainSession: (sessionId: SessionId): Promise<SessionReference | undefined> =>
        retainRunSession(ctx.sessions, sessionId),
    },
  })

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    store,
    children: { 'robots.run': { kind: 'single', scope: 'session' } },
    inject: injected,
  }, RobotPage))

  ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
    name: 'tool.call.toolview',
    key: 'robot_create',
    locale: NS,
    inject: (): RobotCreateRowInjected => ({
      // The tool card lives in a conversation, so one click both selects the
      // robot the call named and reveals the panel that owns its runs.
      openRobot: (robotId) => {
        instance.actions.selectRobot(brandString<RobotId>(robotId))
        ctx.layout.selectPanel(PANEL_ID)
      },
    }),
  }, RobotCreateRow))

  ctx.slots.inject('robots.run', () => ctx.slots.register({
    name: 'robots.run',
    locale: NS,
    inject: (sessionId: SessionId) => ({
      hooks: { runChat: ctx.uiConversation.binding(sessionId).target('chat') },
    }),
  }, RobotRunPanel))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 40,
    locale: NS,
    label: () => t('nav'),
  }, RobotPanelIcon))
}
