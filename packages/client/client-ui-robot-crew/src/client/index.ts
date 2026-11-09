/**
 * Tomato Rbot crew studio, browser half: a crew roster, a workflow canvas, a
 * member and guardrail inspector, and a live flow ledger. All registry and run
 * state goes through the `crewRuns` client service; this plugin holds only
 * viewing state.
 */
import type { Context as ClientContext } from '@tomato/cordis'
import type { MainPanelId } from '@tomato/client-ui-layout/client'
import type { RobotRunsSnapshot, RobotRunsSource } from '@tomato/api-robot-controller/client'
import type { CrewEntry, CrewRunId } from '@tomato/experimental-robot-crew'
import type { RemoteResult } from '@tomato/typert-protocol'
import type {} from '@tomato/api-robot-controller/client'
import type {} from '@tomato/api-robot-crew-controller/client'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-workspace/client'
import { CrewPanelIcon } from './CrewPanelIcon.tsx'
import { CrewStudio } from './CrewStudio.tsx'
import { GroupChat } from './GroupChat.tsx'
import { GroupChatPanelIcon } from './GroupChatPanelIcon.tsx'
import { NS, en, zh } from './locales.ts'
import { createCrewLedgerTracker } from './ledger.ts'
import type { CrewLedgerSource } from './ledger.ts'
import type {
  CrewStudioInjected, GroupChatInjected, RobotCatalogSnapshot, RobotCatalogSource, RobotOption,
} from './types.ts'

/** Crew canvas page key in the main keyed slot and the sidebar panel list. */
export const PANEL_ID = 'crews' as MainPanelId

/** Multi-agent collaboration page key; the tab that starts tasks and reads the transcript. */
const COLLAB_PANEL_ID = 'collab' as MainPanelId

/** Required services: the crew roster, Session entry, layout, slots, copy, and the robot catalog. */
export const inject = ['crewRuns', 'locale', 'layout', 'slots', 'uiWorkspace', 'robotRuns']

/**
 * Project the robot roster onto the picker's option list.
 * @param snapshot - robot roster snapshot.
 * @returns the selectable published robots.
 */
function robotOptions(snapshot: RobotRunsSnapshot): readonly RobotOption[] {
  return snapshot.specs.map(revision => ({
    spec: revision.ref.spec,
    revision: revision.ref.revision,
    name: revision.spec.name,
  }))
}

/** Derived robot catalog that keeps its snapshot identity stable between roster changes. */
class RobotCatalog implements RobotCatalogSource {
  private last: RobotRunsSnapshot | undefined
  private snapshot: RobotCatalogSnapshot = { options: [] }

  /** @param source - the robot roster observable. */
  constructor(private readonly source: RobotRunsSource) {}

  getSnapshot(): RobotCatalogSnapshot {
    const current = this.source.getSnapshot()
    if (current !== this.last) {
      this.last = current
      this.snapshot = { options: robotOptions(current) }
    }
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    return this.source.subscribe(listener)
  }
}

/**
 * Client plugin body: register dictionaries, the main page, and its panel icon.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-robot-crew: dictionaries')
  const ledger = createCrewLedgerTracker((runId: CrewRunId): Promise<RemoteResult<readonly CrewEntry[]>> =>
    ctx.crewRuns.entries({ runId }))
  ctx.effect(() => () => ledger.dispose(), 'ui-robot-crew: ledger tracker')
  const collabLedger = createCrewLedgerTracker((runId: CrewRunId): Promise<RemoteResult<readonly CrewEntry[]>> =>
    ctx.crewRuns.entries({ runId }))
  ctx.effect(() => () => collabLedger.dispose(), 'ui-robot-crew: collaboration ledger tracker')
  const robots = new RobotCatalog(ctx.robotRuns.state)

  const face: CrewStudioInjected = {
    hooks: {
      registry: ctx.crewRuns.state,
      robots,
      ledger: ledger satisfies CrewLedgerSource,
    },
    actions: {
      publish: request => ctx.crewRuns.publish(request),
      start: request => ctx.crewRuns.start(request),
      cancel: request => ctx.crewRuns.cancel(request),
      track: (runId, live) => { ledger.track(runId, live) },
    },
    createWithConversation: () => {
      ctx.uiWorkspace.startSession(undefined, { prompt: t('compose.chatPrompt'), whenDraftExists: 'replace' })
    },
    workspaceRoot: () => undefined,
  }

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    inject: () => face,
  }, CrewStudio))

  const collabFace: GroupChatInjected = {
    hooks: {
      registry: ctx.crewRuns.state,
      ledger: collabLedger satisfies CrewLedgerSource,
    },
    actions: {
      publish: request => ctx.crewRuns.publish(request),
      start: request => ctx.crewRuns.start(request),
      cancel: request => ctx.crewRuns.cancel(request),
      track: (runId, live) => { collabLedger.track(runId, live) },
    },
    createWithConversation: () => {
      ctx.uiWorkspace.startSession(undefined, { prompt: t('compose.chatPrompt'), whenDraftExists: 'replace' })
    },
    openCanvas: () => { ctx.layout.selectPanel(PANEL_ID) },
    workspaceRoot: () => undefined,
  }

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: COLLAB_PANEL_ID,
    locale: NS,
    inject: () => collabFace,
  }, GroupChat))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: COLLAB_PANEL_ID,
    order: 44,
    locale: NS,
    label: () => t('group.nav'),
  }, GroupChatPanelIcon))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 45,
    locale: NS,
    label: () => t('nav'),
  }, CrewPanelIcon))
}
