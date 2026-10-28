/**
 * The Skills tab's view state: the fetched catalog, the open detail, and how
 * many cards the reader has scrolled through.
 *
 * One bucket per tab id because two Skills tabs in one Session browse and edit
 * independently. Async settlement and bucket cleanup live in `face.ts`; this
 * module only declares state and the write set.
 */
import { defineStore, type EngineStoreHandle } from '@tomato/client-store'
import type { RemoteFailure } from '@tomato/api-remotes/client'
import type { SkillEntry, SkillGetValue } from '@tomato/api-remotes/client'
import type { TabId } from '@tomato/client-ui-dockkit'

/** Cards revealed before the reader scrolls to the sentinel. */
export const SKILL_PAGE_SIZE = 24

/** The catalog as one tab knows it; `failure` can accompany retained cards after a failed refresh. */
export interface SkillListState {
  readonly phase: 'loading' | 'ready' | 'failed'
  readonly skills: readonly SkillEntry[]
  readonly failure?: RemoteFailure
}

/** The open skill, its save state, or the reason the read failed. `idle` shows the list. */
export type SkillDetailState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly name: string }
  | {
    readonly status: 'ready'
    readonly skill: SkillGetValue
    readonly saving: boolean
    readonly failure?: RemoteFailure
  }
  | { readonly status: 'failed'; readonly name: string; readonly failure: RemoteFailure }

/** One tab's list, detail, and scroll-lazy cursor. */
export interface SkillBrowserTabState {
  list: SkillListState
  detail: SkillDetailState
  /** Number of cards currently mounted; grows by {@link SKILL_PAGE_SIZE}. */
  visible: number
}

/** Every Skills tab's state, keyed by tab id. */
export interface SkillBrowserState {
  byTab: Record<TabId, SkillBrowserTabState>
}

/** The store's write set; every action names the tab it writes. */
type SkillBrowserActions = {
  start: (draft: SkillBrowserState, tabId: TabId) => void
  listing: (draft: SkillBrowserState, tabId: TabId) => void
  listed: (draft: SkillBrowserState, tabId: TabId, skills: readonly SkillEntry[]) => void
  listFailed: (draft: SkillBrowserState, tabId: TabId, failure: RemoteFailure) => void
  showMore: (draft: SkillBrowserState, tabId: TabId) => void
  opening: (draft: SkillBrowserState, tabId: TabId, name: string) => void
  opened: (draft: SkillBrowserState, tabId: TabId, skill: SkillGetValue) => void
  detailFailed: (draft: SkillBrowserState, tabId: TabId, name: string, failure: RemoteFailure) => void
  closeDetail: (draft: SkillBrowserState, tabId: TabId) => void
  saving: (draft: SkillBrowserState, tabId: TabId) => void
  saved: (draft: SkillBrowserState, tabId: TabId, skill: SkillGetValue) => void
  saveFailed: (draft: SkillBrowserState, tabId: TabId, failure: RemoteFailure) => void
  forget: (draft: SkillBrowserState, tabId: TabId) => void
}

/**
 * One tab's bucket.
 * @param state - the draft.
 * @param tabId - the tab being written.
 * @returns the tab's state.
 */
function bucket(state: SkillBrowserState, tabId: TabId): SkillBrowserTabState {
  const tab = state.byTab[tabId]
  if (tab === undefined) throw new Error(`ui-skill-browser: no state for tab "${tabId}"`)
  return tab
}

/**
 * Project one saved detail back onto its list card, replacing only what the
 * save can change.
 * @param entry - the card currently shown.
 * @param skill - the saved skill.
 * @returns the card to show after the save.
 */
function cardOf(entry: SkillEntry, skill: SkillGetValue): SkillEntry {
  return {
    name: entry.name,
    ...entry.path === undefined ? {} : { path: entry.path },
    description: skill.description,
    ...skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse },
    modelInvocable: entry.modelInvocable,
    userInvocable: entry.userInvocable,
    source: entry.source,
    editable: entry.editable,
  }
}

/**
 * Declare the Skills tab's store.
 * @returns the store handle to declare on the registration.
 */
export function createSkillBrowserStore(): EngineStoreHandle<SkillBrowserState, SkillBrowserActions> {
  return defineStore({
    init: (): SkillBrowserState => ({ byTab: {} }),
    actions: {
      /** Seed one tab at its first read. */
      start: (d, tabId) => {
        d.byTab[tabId] = {
          list: { phase: 'loading', skills: [] },
          detail: { status: 'idle' },
          visible: SKILL_PAGE_SIZE,
        }
      },
      /** Mark the catalog as being read again, retaining cards already shown. */
      listing: (d, tabId) => {
        const tab = bucket(d, tabId)
        if (tab.list.phase !== 'loading') tab.list = { phase: 'loading', skills: tab.list.skills }
      },
      /** Record a complete catalog and rewind the lazy cursor. */
      listed: (d, tabId, skills) => {
        const tab = bucket(d, tabId)
        tab.list = { phase: 'ready', skills }
        tab.visible = SKILL_PAGE_SIZE
      },
      /** Record a catalog read failure, keeping retained cards visible. */
      listFailed: (d, tabId, failure) => {
        const tab = bucket(d, tabId)
        tab.list = tab.list.skills.length > 0
          ? { phase: 'ready', skills: tab.list.skills, failure }
          : { phase: 'failed', skills: [], failure }
      },
      /** Reveal the next card batch. */
      showMore: (d, tabId) => {
        const tab = bucket(d, tabId)
        tab.visible = Math.min(tab.visible + SKILL_PAGE_SIZE, tab.list.skills.length)
      },
      /** Show the loading state for one skill. */
      opening: (d, tabId, name) => {
        bucket(d, tabId).detail = { status: 'loading', name }
      },
      /** Show one loaded skill. */
      opened: (d, tabId, skill) => {
        bucket(d, tabId).detail = { status: 'ready', skill, saving: false }
      },
      /** Record why one skill could not be loaded. */
      detailFailed: (d, tabId, name, failure) => {
        bucket(d, tabId).detail = { status: 'failed', name, failure }
      },
      /** Return to the list. */
      closeDetail: (d, tabId) => {
        bucket(d, tabId).detail = { status: 'idle' }
      },
      /** Mark the open detail as being saved. */
      saving: (d, tabId) => {
        const tab = bucket(d, tabId)
        if (tab.detail.status === 'ready') tab.detail = { status: 'ready', skill: tab.detail.skill, saving: true }
      },
      /** Publish the saved skill and its updated card. */
      saved: (d, tabId, skill) => {
        const tab = bucket(d, tabId)
        tab.detail = { status: 'ready', skill, saving: false }
        tab.list = {
          ...tab.list,
          skills: tab.list.skills.map(entry => entry.name === skill.name ? cardOf(entry, skill) : entry),
        }
      },
      /** Keep the detail open and report a failed save. */
      saveFailed: (d, tabId, failure) => {
        const tab = bucket(d, tabId)
        if (tab.detail.status === 'ready') tab.detail = { ...tab.detail, saving: false, failure }
      },
      /** Drop one tab's bucket when its record disappears. */
      forget: (d, tabId) => {
        d.byTab = Object.fromEntries(Object.entries(d.byTab).filter(([id]) => id !== tabId))
      },
    },
  })
}
