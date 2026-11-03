/**
 * Durable recovery for a restored work-item tab.
 *
 * The Sidebar persists a tab's layout record — its own id, kind, contentId, and
 * title — but not the navigation parameters its opener passed, so a tab restored
 * by a reload names no work item. This page type therefore remembers which item
 * it last showed, keyed by the Session holding the tab and the layout record's
 * id: both return with the restored layout, and the layout's minted counter does
 * not reuse an id for as long as that layout lives, so the association outlives
 * the reload that dropped the parameters. The contentId cannot serve as this key
 * because every tab of one page kind records the same one.
 *
 * One storage key per Session holds one entry per tab id. A write keeps only
 * entries whose tab a non-empty list of committed ids still holds, so a tab the
 * Session closed leaves no entry behind. Only the recap day and the item's title
 * are stored: the detail text comes from the shared snapshot, so a reopened tab
 * shows the current generation of that item.
 * @module @tomato/experimental-muse-insights/client/work-item-bindings
 */

import type { TabId } from '@tomato/client-ui-sidebar-right/client'
import type { SessionId } from '@tomato/session/types'

/** One work item a detail tab showed. */
export interface WorkItemTabTarget {
  /** Local calendar day key of the recap that listed the item. */
  readonly day: string
  /** The item's title as that recap lists it. */
  readonly title: string
}

/** Entries keyed by the layout record's id. */
type Entries = Map<TabId, WorkItemTabTarget>

/** Storage prefix; one key per Session holds that Session's entries. */
const PREFIX = 'tomato.muse-insights.work-item-tab.v1.'

/**
 * The committed tab ids of one Session, read when an entry is stored so a closed
 * tab leaves none behind. `undefined` and an empty list both skip that removal:
 * `ctx.sidebarRight.tabsIn` returns the empty list for a Session whose layout is
 * not adopted as well as for one whose adopted layout holds no tabs, and pruning
 * against that answer would drop entries a restored tab still resolves through.
 */
export type WorkItemTabLiveIds = (sessionId: SessionId) => readonly string[] | undefined

/**
 * Narrow one stored value to a work item target.
 * @param value - one member of a stored Session document.
 * @returns the target, or undefined for a value this store did not write.
 */
function targetOf(value: unknown): WorkItemTabTarget | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const day = 'day' in value ? value.day : undefined
  const title = 'title' in value ? value.title : undefined
  if (typeof day !== 'string' || typeof title !== 'string') return undefined
  return { day, title }
}

/**
 * Narrow one stored Session document to its well-formed entries.
 * @param raw - stored text.
 * @returns the entries it holds; unparseable text and malformed values are dropped.
 */
function entriesOf(raw: string): Entries {
  const entries: Entries = new Map()
  let document: unknown
  try {
    document = JSON.parse(raw)
  } catch (_invalidJson) {
    return entries
  }
  if (typeof document !== 'object' || document === null) return entries
  for (const [tabId, value] of Object.entries(document)) {
    const target = targetOf(value)
    if (target !== undefined) entries.set(tabId as TabId, target)
  }
  return entries
}

/**
 * Read one Session's stored text.
 * @param sessionId - the Session holding the tabs.
 * @returns its document, or undefined when nothing is saved or storage is unreachable.
 */
function storedText(sessionId: SessionId): string | undefined {
  if (typeof localStorage === 'undefined') return undefined
  try {
    return localStorage.getItem(PREFIX + sessionId) ?? undefined
  } catch (_storageUnavailable) {
    return undefined
  }
}

/**
 * Write one Session's entries, removing the key instead of storing an empty
 * document. A storage failure is reported and leaves the window value usable.
 * @param sessionId - the Session holding the tabs.
 * @param entries - the complete set to store.
 */
function persist(sessionId: SessionId, entries: Entries): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (entries.size === 0) localStorage.removeItem(PREFIX + sessionId)
    else localStorage.setItem(PREFIX + sessionId, JSON.stringify(Object.fromEntries(entries)))
  } catch (error) {
    console.error('Work item tab binding persistence failed:', error)
  }
}

/**
 * Drop entries of tabs the Session's committed layout no longer holds.
 * @param entries - the complete set being stored.
 * @param live - the committed tab ids, or undefined while that layout is unknown.
 * @returns the entries to keep.
 */
function prune(entries: Entries, live: readonly string[] | undefined): Entries {
  if (live === undefined || live.length === 0) return entries
  return new Map([...entries].filter(([tabId]) => live.includes(tabId)))
}

/**
 * The work item each detail tab page last showed, kept in this window and in
 * browser storage.
 *
 * The window copy is authoritative for this window's reads: it keeps the value
 * usable when storage is absent or rejects writes, and it avoids reparsing the
 * stored document on every render.
 */
export class WorkItemTabBindings {
  private readonly cache = new Map<SessionId, Entries>()

  /**
   * @param liveTabIds - the committed layout's tab ids for one Session, read when an entry is stored.
   */
  constructor(private readonly liveTabIds?: WorkItemTabLiveIds) {}

  /**
   * Read the work item one page last showed.
   * @param sessionId - the Session holding the tab.
   * @param tabId - the restored layout record's own id.
   * @returns the target to show, or undefined when the page has no stored entry.
   */
  read(sessionId: SessionId, tabId: TabId): WorkItemTabTarget | undefined {
    return this.entries(sessionId).get(tabId)
  }

  /**
   * Record the work item one page now shows.
   * @param sessionId - the Session holding the tab.
   * @param tabId - the navigated layout record's own id.
   * @param target - the item the navigation named.
   */
  write(sessionId: SessionId, tabId: TabId, target: WorkItemTabTarget): void {
    const entries = new Map(this.entries(sessionId))
    entries.set(tabId, target)
    const kept = prune(entries, this.liveTabIds?.(sessionId))
    this.cache.set(sessionId, kept)
    persist(sessionId, kept)
  }

  /**
   * One Session's entries, from this window or from storage.
   * @param sessionId - the Session holding the tabs.
   * @returns its entries, empty when nothing is saved or storage is unreachable.
   */
  private entries(sessionId: SessionId): Entries {
    const cached = this.cache.get(sessionId)
    if (cached !== undefined) return cached
    const raw = storedText(sessionId)
    const entries = raw === undefined ? new Map<TabId, WorkItemTabTarget>() : entriesOf(raw)
    this.cache.set(sessionId, entries)
    return entries
  }
}
