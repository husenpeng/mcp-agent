/** Resolve the Session behind one robot run for the page's conversation pane. */

import type { ISessions, SessionReference } from '@tomato/api-session-controller/client'
import type { SessionId } from '@tomato/session/types'

declare module '@tomato/api-session-controller/client' {
  interface SessionReferenceSourceMap {
    /** A robot run Session retained by the robot page while its conversation is open. */
    robotRun: unknown
  }
}

/**
 * Retain one run Session, re-reading the Host catalog once when the Client
 * holds no row for it. A run's row leaves the Client list when its Agent ends,
 * so a later selection would otherwise name an identity the Client refuses to
 * retain; the pull re-adds the persisted row.
 * @param sessions - Client Session Controller.
 * @param sessionId - Session the run record names.
 * @returns the owned reference, or undefined while no row or binding holds the Session.
 */
export async function retainRunSession(
  sessions: ISessions,
  sessionId: SessionId,
): Promise<SessionReference | undefined> {
  if (!holdsSession(sessions, sessionId)) await sessions.refresh()
  return holdsSession(sessions, sessionId)
    ? sessions.retain(sessionId, { source: 'robotRun' })
    : undefined
}

/**
 * Test whether the Client can retain one identity, without throwing or opening it.
 * @param sessions - Client Session Controller.
 * @param sessionId - identity a run record names.
 * @returns whether a retained binding or a catalog row already holds the Session.
 */
function holdsSession(sessions: ISessions, sessionId: SessionId): boolean {
  return sessions.binding(sessionId) !== undefined
    || sessions.list.getSnapshot().byId[sessionId] !== undefined
}
