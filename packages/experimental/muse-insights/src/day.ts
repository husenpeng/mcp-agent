/**
 * Host-local calendar-day boundaries for recap and lookback windows.
 * @module @tomato/experimental-muse-insights/day
 */

/** One local calendar day, represented as an inclusive start and exclusive end instant. */
export interface DayRange {
  /** `YYYY-MM-DD` in the Host's local time zone. */
  readonly key: string
  /** Local midnight opening the day, in Unix epoch milliseconds. */
  readonly start: number
  /** Local midnight opening the next day, in Unix epoch milliseconds. */
  readonly end: number
}

/**
 * Resolve the local day containing one instant.
 * @param now - Unix epoch milliseconds.
 * @returns the day key and its half-open instant range.
 */
export function dayRange(now: number): DayRange {
  const date = new Date(now)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
  return { key: dayKey(date), start, end }
}

/** Local calendar representation of one date, `YYYY-MM-DD`. */
function dayKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Whole local days to subtract from an instant, preserving local time of day across DST changes.
 * @param now - Unix epoch milliseconds.
 * @param days - non-negative whole days.
 * @returns the instant that many local days earlier.
 */
export function daysBefore(now: number, days: number): number {
  const date = new Date(now)
  return new Date(
    date.getFullYear(), date.getMonth(), date.getDate() - days,
    date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(),
  ).getTime()
}
