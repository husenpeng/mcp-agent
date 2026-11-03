/**
 * Browser-local bookkeeping for proactive notices: which day's recap was
 * already announced and when the unfinished-task notice last appeared.
 *
 * This is presentation state, not insight data. It survives reloads so the
 * same day does not announce twice and a dismissal holds its cooldown, and a
 * missing or malformed entry only means "announce normally".
 * @module @tomato/experimental-muse-insights/client/notice-state
 */

/** Storage key for this feature's notice bookkeeping. */
export const NOTICE_STORAGE_KEY = 'tomato.muse-insights.v1'

/** What the controller remembers between page loads. */
export interface NoticeMemory {
  /** Local day whose recap notice was already shown, or null. */
  readonly recapDay: string | null
  /** Unix epoch milliseconds when the unfinished-task notice was last shown, or 0. */
  readonly lastReminderAt: number
}

/** Empty memory, used without storage or after an unreadable value. */
const EMPTY: NoticeMemory = { recapDay: null, lastReminderAt: 0 }

/** The browser storage this feature uses, or undefined outside a browser. */
function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage
}

/**
 * Read the retained notice memory.
 * @returns validated memory, or the empty value when absent, malformed, or unreadable.
 */
export function readNoticeMemory(): NoticeMemory {
  const target = storage()
  if (target === undefined) return EMPTY
  try {
    const raw = target.getItem(NOTICE_STORAGE_KEY)
    if (raw === null) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object') return EMPTY
    const value = parsed as { recapDay?: unknown; lastReminderAt?: unknown }
    return {
      recapDay: typeof value.recapDay === 'string' ? value.recapDay : null,
      lastReminderAt: typeof value.lastReminderAt === 'number' && Number.isFinite(value.lastReminderAt)
        ? Math.max(0, value.lastReminderAt)
        : 0,
    }
  } catch (_error: unknown) {
    // Presentation bookkeeping may only cause a repeat announcement.
    return EMPTY
  }
}

/**
 * Replace the retained notice memory.
 * @param memory - complete next value.
 */
export function writeNoticeMemory(memory: NoticeMemory): void {
  const target = storage()
  if (target === undefined) return
  try {
    target.setItem(NOTICE_STORAGE_KEY, JSON.stringify(memory))
  } catch (_error: unknown) {
    // Quota and private-mode failures only cost a repeat announcement.
  }
}
