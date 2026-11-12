/**
 * Robot Room page, browser half: registers the `room` panel, its dictionaries,
 * and the face over `ctx.roomRuns` and the Rbot roster.
 * @module @tomato/client-ui-robot-room/client
 */

import type { Context as ClientContext } from '@tomato/cordis'
import { brandString } from '@tomato/branded'
import type { SessionId } from '@tomato/session/types'
import type { MainPanelId } from '@tomato/client-ui-layout/client'
import type { RobotRunsSnapshot, RobotRunsSource } from '@tomato/api-robot-controller/client'
import type {} from '@tomato/api-robot-controller/client'
import type {} from '@tomato/api-robot-room-controller/client'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-workspace/client'
import { NS, en, zh } from './locales.ts'
import { RoomPage } from './RoomPage.tsx'
import { RoomPanelIcon } from './RoomPanelIcon.tsx'
import type { RoomInjected, RoomRobotCatalogSnapshot, RoomRobotCatalogSource, RoomRobotOption } from './types.ts'

/** Robot Room page key in the main keyed slot and the sidebar panel list. */
const PANEL_ID = 'room' as MainPanelId

/** Tomato Rbot panel key; the place where robots are created. */
const ROBOTS_PANEL_ID = 'robots' as MainPanelId

/** Required services: room state, Rbot roster, layout, slots, and copy. */
export const inject = ['roomRuns', 'robotRuns', 'locale', 'layout', 'slots', 'uiWorkspace']

/**
 * Project the Rbot roster onto the member picker's options.
 * @param snapshot - Rbot roster snapshot.
 * @returns selectable published revisions.
 */
function robotOptions(snapshot: RobotRunsSnapshot): readonly RoomRobotOption[] {
  return snapshot.specs.map(revision => ({
    spec: revision.ref.spec,
    revision: revision.ref.revision,
    name: revision.spec.name,
    mission: revision.spec.goal.mission,
  }))
}

/** Derived Rbot catalog with a stable snapshot identity. */
class RobotCatalog implements RoomRobotCatalogSource {
  private last: RobotRunsSnapshot | undefined
  private snapshot: RoomRobotCatalogSnapshot = { options: [] }

  /** @param source - the Rbot roster observable. */
  constructor(private readonly source: RobotRunsSource) {}

  getSnapshot(): RoomRobotCatalogSnapshot {
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
 * Register dictionaries, the room page, and its panel icon.
 * @param ctx - client root Context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-robot-room: dictionaries')
  const robots = new RobotCatalog(ctx.robotRuns.state)

  const face: RoomInjected = {
    hooks: { rooms: ctx.roomRuns.state, robots },
    actions: {
      publish: request => ctx.roomRuns.publish(request),
      post: request => ctx.roomRuns.post(request),
      messages: request => ctx.roomRuns.messages(request),
      pause: request => ctx.roomRuns.pause(request),
      resume: request => ctx.roomRuns.resume(request),
      relaxOnce: request => ctx.roomRuns.relaxOnce(request),
      endEpisode: request => ctx.roomRuns.endEpisode(request),
      approve: request => ctx.roomRuns.approve(request),
    },
    openRobots: () => { ctx.layout.selectPanel(ROBOTS_PANEL_ID) },
    openSession: (sessionId) => { ctx.uiWorkspace.openSession(brandString<SessionId>(sessionId)) },
  }

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    inject: () => face,
  }, RoomPage))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 43,
    locale: NS,
    label: () => t('nav'),
  }, RoomPanelIcon))
}
