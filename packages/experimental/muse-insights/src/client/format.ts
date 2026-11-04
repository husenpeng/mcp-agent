/** Display formatting and recap lookups shared by the notice and both Sidebar pages. */

import type { DailyRecap, RecapSessionHighlight, RecapWorkItem } from '../types.ts'

/**
 * Format one Host-local day for display without shifting it across the browser's zone.
 * @param day - `YYYY-MM-DD`.
 * @param locale - BCP 47 locale.
 * @returns a localized long date.
 */
export function formatDay(day: string, locale: string): string {
  const date = new Date(`${day}T12:00:00`)
  if (Number.isNaN(date.getTime())) return day
  return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(date)
}

/**
 * Format one instant as a short local time.
 * @param time - Unix epoch milliseconds.
 * @param locale - BCP 47 locale.
 * @returns a localized hour and minute.
 */
export function formatTime(time: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(time))
}

/**
 * The Sessions one work item came from, resolved against the recap's highlights.
 * @param recap - the recap that listed the item.
 * @param item - the work item.
 * @returns the matching highlights in the item's order; empty when none resolve.
 */
export function workItemSessions(recap: DailyRecap, item: RecapWorkItem): RecapSessionHighlight[] {
  return item.sessionIds
    .map(sessionId => recap.sessions.find(session => session.sessionId === sessionId))
    .filter((session): session is RecapSessionHighlight => session !== undefined)
}
