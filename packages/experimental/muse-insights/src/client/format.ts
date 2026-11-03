/** Display formatting shared by the notice and both Sidebar pages. */

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
 * The recap list's one-line brief for a work item: the first line of its detail
 * that carries prose. A model-written detail may be block text, so a fenced line
 * is skipped rather than shown as the item's summary; the item's own page shows
 * the detail complete.
 * @param detail - the item's full detail.
 * @returns the line to show under the title, or the empty string without prose.
 */
export function workItemBrief(detail: string): string {
  for (const line of detail.split('\n')) {
    const text = line.trim()
    if (text !== '' && !text.startsWith('```')) return text
  }
  return ''
}
