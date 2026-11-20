/**
 * Marketing plugins tab state: the curated catalog, its filters, entry pages, and the install and uninstall dialogs.
 * The tab never names a command of its own: installing a plugin package goes through the Plugins page's dialog, and an
 * MCP server or Skill is installed by the Host from the entry id the catalog pins.
 */
import type { Context as ClientContext } from '@tomato/cordis'
import { createSnapshotStore, type SnapshotStore } from '@tomato/client-store'
import type { LocaleSnapshot } from '@tomato/client-locale/client'
import type { MarketTabProps, MarketingCatalog, MarketingEntry, MarketingInstall, MarketingPreview } from './contract.ts'
import type { GeneralController, GeneralState } from './general-controller.ts'
import type { TomatoMarketLocaleKey } from './locales.ts'
import type { MarketClient, MarketingResult } from './api.ts'
import { filterEntries, kindKey, oneClick, pluginTarget, sortEntries, type MarketingKind, type MarketingKindFilter, type MarketingSort } from './marketing-search.ts'

/** The read of one entry's description document. */
export type EntryRead =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'found'; readonly markdown: string }
  | { readonly status: 'none' }
  | { readonly status: 'error'; readonly message: string }

/** The confirmation dialog one entry's install or uninstall shows. */
export type ActionDialog =
  | { readonly mode: 'install'; readonly entry: MarketingEntry; readonly phase: 'loading' }
  | { readonly mode: 'install'; readonly entry: MarketingEntry; readonly phase: 'ready'; readonly preview: MarketingPreview }
  | { readonly mode: 'install' | 'uninstall'; readonly entry: MarketingEntry; readonly phase: 'working' }
  | { readonly mode: 'install' | 'uninstall'; readonly entry: MarketingEntry; readonly phase: 'done'; readonly result: MarketingResult }
  | { readonly mode: 'install' | 'uninstall'; readonly entry: MarketingEntry; readonly phase: 'failed'; readonly reason: string }
  | { readonly mode: 'uninstall'; readonly entry: MarketingEntry; readonly phase: 'ready' }

/** What the Marketing plugins tab shows. */
export interface MarketingState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly catalog: ({ readonly installed: readonly string[] } & MarketingCatalog) | null
  readonly failure: string | null
  readonly language: string
  readonly query: string
  readonly category: string | null
  readonly kind: MarketingKindFilter
  readonly sort: MarketingSort
  readonly limit: number
  readonly selected: string | null
  readonly detail: EntryRead
  readonly dialog: ActionDialog | null
}

/** Rows added by one "show more". */
const PAGE = 60

/** What the Marketing plugins tab receives through injection. */
export interface MarketingFace {
  /**
   * The active locale, bound as `useLocale`; the tab formats dates and picks copy from it.
   * @param select - reads one value from the locale snapshot.
   * @returns the selected value.
   */
  readonly locale: (select: (snapshot: LocaleSnapshot) => string) => string
  /** The owner props the tab renders: the page's install bridge and translator. */
  readonly t: (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string
  readonly hooks: {
    /** Tab state, bound as `useMarketing`. */
    readonly marketing: SnapshotStore<MarketingState>
    /** The General tab's preflight state, bound as `usePluginState`: which plugin package a check runs for. */
    readonly plugins: SnapshotStore<GeneralState>
  }
  /** Read the catalog once the tab first renders. */
  readonly ensure: () => void
  readonly reload: () => void
  readonly setQuery: (query: string) => void
  readonly setCategory: (category: string | null) => void
  readonly setKind: (kind: MarketingKindFilter) => void
  readonly setSort: (sort: MarketingSort) => void
  readonly showMore: () => void
  readonly open: (entry: MarketingEntry) => void
  readonly back: () => void
  readonly retryDetail: () => void
  /** Confirm one entry's install with the Host after showing what it would do. */
  readonly startInstall: (entry: MarketingEntry) => void
  /** Confirm one entry's uninstall. */
  readonly startUninstall: (entry: MarketingEntry) => void
  readonly confirm: () => void
  readonly closeDialog: () => void
  /**
   * Preflight and install the plugin package one entry pins, through the General tab's rules.
   * @param entry - the entry.
   * @param install - the page's install dialog bridge.
   */
  readonly installPinned: (entry: MarketingEntry, install: MarketTabProps['install']) => void
  /** Close a refused plugin notice the General tab raised. */
  readonly dismissPluginNotice: () => void
  /** Install the compatible build of a plugin the General tab refused. */
  readonly adaptPlugin: (install: MarketTabProps['install']) => void
  /** Install a plugin version the General tab could not confirm. */
  readonly confirmPluginOverride: (install: MarketTabProps['install']) => void
}

const INITIAL: MarketingState = {
  status: 'idle',
  catalog: null,
  failure: null,
  language: 'zh',
  query: '',
  category: null,
  kind: 'all',
  sort: 'stars',
  limit: PAGE,
  selected: null,
  detail: { status: 'idle' },
  dialog: null,
}

/**
 * Marketing plugins tab state and actions.
 * @param ctx - the browser plugin context.
 */
export class MarketingController {
  /** The tab state, bound as `useMarketing`. */
  readonly store: SnapshotStore<MarketingState> = createSnapshotStore<MarketingState>(INITIAL)
  private loadToken = 0
  private detailToken = 0
  private dialogToken = 0
  private readonly language: () => string
  /**
   * The face value the framework injects. One value per controller keeps the state the framework binds and the
   * handlers a view calls on the same object across renders.
   */
  private faceValue: MarketingFace | undefined

  /**
   * @param ctx - the browser plugin context, whose locale the language follows.
   * @param market - the Host reads.
   * @param general - the General tab, whose preflight this tab reuses for plugin entries.
   * @param bind - binds this tab's dictionary, so the state carries the page's one `t` seat.
   */
  constructor(
    ctx: ClientContext,
    private readonly market: MarketClient,
    private readonly general: GeneralController,
    private readonly bind: () => MarketingFace['t'],
  ) {
    this.language = () => ctx.locale.getSnapshot().active
    this.store.set({ ...INITIAL, language: this.language() })
  }

  /**
   * The state snapshot.
   * @returns the current state.
   */
  private state(): MarketingState {
    return this.store.getSnapshot()
  }

  /**
   * Patch the state.
   * @param next - the fields to change.
   */
  private set(next: Partial<MarketingState>): void {
    this.store.set({ ...this.state(), ...next })
  }

  /**
   * What the tab's component receives through injection.
   * @returns the inject face.
   */
  face(): MarketingFace {
    const cached = this.faceValue
    if (cached !== undefined) return cached
    const general = this.general.face()
    const face: MarketingFace = {
      locale: general.locale,
      t: this.bind(),
      hooks: { marketing: this.store, plugins: this.general.store },
      ensure: () => { if (this.state().status === 'idle') void this.load() },
      reload: () => { void this.load() },
      setQuery: (query) => { this.set({ query, limit: PAGE }) },
      setCategory: (category) => { this.set({ category, limit: PAGE }) },
      setKind: (kind) => { this.set({ kind, limit: PAGE }) },
      setSort: (sort) => { this.set({ sort }) },
      showMore: () => { this.set({ limit: this.state().limit + PAGE }) },
      open: (entry) => { this.openEntry(entry) },
      back: () => {
        this.detailToken += 1
        this.set({ selected: null, detail: { status: 'idle' } })
      },
      retryDetail: () => {
        const entry = this.state().catalog?.entries.find(candidate => candidate.id === this.state().selected)
        if (entry !== undefined) this.openEntry(entry)
      },
      startInstall: (entry) => { void this.startInstall(entry) },
      startUninstall: (entry) => {
        this.dialogToken += 1
        this.set({ dialog: { mode: 'uninstall', entry, phase: 'ready' } })
      },
      confirm: () => { void this.confirm() },
      closeDialog: () => {
        // A running install keeps going on the Host; closing only stops showing it.
        this.dialogToken += 1
        this.set({ dialog: null })
      },
      // The General tab owns the preflight state; these forward to it so an entry behaves like a catalog plugin.
      installPinned: (entry, install) => { general.installPinned(entry, install) },
      dismissPluginNotice: () => { general.dismissNotice() },
      adaptPlugin: (install) => { general.adaptAndInstall(install) },
      confirmPluginOverride: (install) => { general.confirmOverride(install) },
    }
    this.faceValue = face
    return face
  }

  /**
   * Follow the active language.
   * @param language - the shell's active language.
   */
  setLanguage(language: string): void {
    if (language !== this.state().language) this.set({ language })
  }

  /** Invalidate in-flight reads. */
  dispose(): void {
    this.loadToken += 1
    this.detailToken += 1
    this.dialogToken += 1
  }

  /** Read the catalog and which entries this profile already has. */
  private async load(): Promise<void> {
    const token = ++this.loadToken
    this.set({ status: this.state().catalog === null ? 'loading' : this.state().status, failure: null })
    const settled = await this.market.marketingCatalog()
      .then((catalog): { catalog: MarketingState['catalog'] } | { failure: string } => ({ catalog }))
      .catch((error: unknown) => ({ failure: (error as Error).message }))
    if (token !== this.loadToken) return
    if ('catalog' in settled) this.set({ status: 'ready', catalog: settled.catalog })
    else this.set({ status: 'error', failure: settled.failure })
  }

  /**
   * Open one entry's page.
   * @param entry - the entry.
   */
  private openEntry(entry: MarketingEntry): void {
    const token = ++this.detailToken
    this.set({ selected: entry.id, detail: { status: 'loading' } })
    const settle = async (): Promise<void> => {
      const detail = await this.market.marketingDetail(entry.id).then(
        (read): EntryRead => (read.status === 'found' ? { status: 'found', markdown: read.markdown } : { status: 'none' }),
        (error: unknown): EntryRead => ({ status: 'error', message: (error as Error).message }),
      )
      if (token === this.detailToken) this.set({ detail })
    }
    void settle()
  }

  /**
   * Read what installing one entry would do, then show the confirmation.
   * @param entry - the entry.
   */
  private async startInstall(entry: MarketingEntry): Promise<void> {
    const token = ++this.dialogToken
    this.set({ dialog: { mode: 'install', entry, phase: 'loading' } })
    const preview = await this.market.marketingPreview(entry.id).then(
      (ready): ActionDialog => ({ mode: 'install', entry, phase: 'ready', preview: ready }),
      (error: unknown): ActionDialog => ({ mode: 'install', entry, phase: 'failed', reason: (error as Error).message }),
    )
    if (token === this.dialogToken) this.set({ dialog: preview })
  }

  /** Run the confirmed action; the dialog stays open on its result. */
  private async confirm(): Promise<void> {
    const dialog = this.state().dialog
    if (dialog === null || dialog.phase !== 'ready') return
    const token = ++this.dialogToken
    const entry = dialog.entry
    this.set({ dialog: { mode: dialog.mode, entry, phase: 'working' } })
    const call = dialog.mode === 'install' ? this.market.marketingInstall(entry.id) : this.market.marketingUninstall(entry.id)
    const settled = await call
      .then((result): { result: MarketingResult } | { reason: string } => ({ result }))
      .catch((error: unknown) => ({ reason: (error as Error).message }))
    await this.load()
    if (token !== this.dialogToken) return
    this.set({
      dialog: 'reason' in settled
        ? { mode: dialog.mode, entry, phase: 'failed', reason: settled.reason }
        : { mode: dialog.mode, entry, phase: 'done', result: settled.result },
    })
  }
}

/**
 * The catalog entries the tab lists, filtered and ordered.
 * @param state - the tab state.
 * @returns the visible entries before the page limit.
 */
export function listedEntries(state: MarketingState): readonly MarketingEntry[] {
  const catalog = state.catalog
  if (catalog === null) return []
  return sortEntries(
    filterEntries(catalog.entries, {
      query: state.query,
      category: state.category,
      kind: state.kind,
      categories: catalog.categories,
      language: state.language,
    }),
    state.sort,
    state.language,
  )
}

export type { MarketingEntry, MarketingInstall, MarketingKind, MarketingKindFilter, MarketingSort }
export { kindKey, oneClick, pluginTarget }
