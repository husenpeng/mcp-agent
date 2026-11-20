/**
 * General plugins tab state: the open catalog, the query, selection, detail reads, and the install preflight. The tab
 * asks the Host for every fact and hands a plugin package to the Plugins page's own install dialog, which is the only
 * place that installs anything.
 */
import type { Context as ClientContext } from '@tomato/cordis'
import { createSnapshotStore, type SnapshotStore } from '@tomato/client-store'
import type { LocaleSnapshot } from '@tomato/client-locale/client'
import type { MarketTabProps, MarketingEntry } from './contract.ts'
import type { TomatoMarketLocaleKey } from './locales.ts'
import type { MarketClient, ManifestFacts, Resolution } from './api.ts'
import {
  installTarget, latestVersion, localized, selectedVersion, type ListedVersionView, type MarketSort, type PluginView,
} from './catalog.ts'

/** The read of one plugin page's description document. */
export type DetailRead =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'found'; readonly markdown: string }
  | { readonly status: 'none' }
  | { readonly status: 'error'; readonly message: string }

/** What the tab refuses or explains before it hands a version to the installer. */
export type InstallNotice =
  | { readonly kind: 'compat'; readonly plugin: PluginView; readonly version: ListedVersionView; readonly facts: ManifestFacts }
  | { readonly kind: 'other'; readonly plugin: PluginView; readonly version: ListedVersionView }
  | { readonly kind: 'adapt-failed'; readonly plugin: PluginView; readonly version: ListedVersionView; readonly reason: string }
  | { readonly kind: 'incompatible'; readonly plugin: PluginView; readonly version: ListedVersionView; readonly resolution: Resolution }
  | { readonly kind: 'unknown'; readonly plugin: PluginView; readonly version: ListedVersionView; readonly reason: string }

/** A version the tab substituted for the one the reader asked for. */
export interface Substitution {
  readonly plugin: PluginView
  readonly requested: ListedVersionView
  readonly selected: ListedVersionView
  readonly runtimeVersion: string | undefined
}

/**
 * The note that names a version the preflight installed instead of the one asked for.
 * @param plugin - the plugin.
 * @param requested - the version the reader asked for.
 * @param selected - the version the running TOMATO admits.
 * @param resolution - the Host's resolution.
 * @returns the note.
 */
function substituted(
  plugin: PluginView,
  requested: ListedVersionView,
  selected: ListedVersionView,
  resolution: Resolution,
): Substitution {
  return {
    plugin,
    requested,
    selected,
    // A resolved answer names the running TOMATO; an unconfirmed one cannot.
    runtimeVersion: resolution.status === 'resolved' ? resolution.runtimeVersion : undefined,
  }
}

/**
 * What the preflight reports for one version's manifest read.
 * @param outcome - the read's facts, or the failure.
 * @param plugin - the plugin the preflight checked.
 * @param version - the version it checked.
 * @returns the notice to publish.
 */
function describe(outcome: ManifestFacts | Error, plugin: PluginView, version: ListedVersionView): InstallNotice {
  if (outcome instanceof Error) return { kind: 'unknown', plugin, version, reason: outcome.message }
  if (outcome.class === 'other') return { kind: 'other', plugin, version }
  return { kind: 'compat', plugin, version, facts: outcome }
}

/** The plugin page's manifest read. */
export type CompatibilityRead =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly facts: ManifestFacts }
  | { readonly status: 'error'; readonly reason: string }

/** The open catalog as the tab lists it. */
export interface GeneralCatalogView {
  readonly title?: Readonly<Record<string, string>> | string
  readonly categories: readonly { readonly id: string; readonly title?: Readonly<Record<string, string>> | string }[]
  readonly plugins: readonly PluginView[]
  readonly stars: Readonly<Record<string, number>>
}

/** What the General plugins tab shows. */
export interface GeneralState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly catalog: GeneralCatalogView | null
  readonly failure: string | null
  readonly language: string
  readonly query: string
  readonly category: string | null
  readonly sort: MarketSort
  readonly limit: number
  readonly selected: PluginView | null
  readonly detail: DetailRead
  readonly compatibility: CompatibilityRead
  readonly checking: string | null
  readonly notice: InstallNotice | null
  readonly substitution: Substitution | null
}

/** One row of "show more" in the general list. */
const PAGE_SIZE = 60

/** What the General plugins tab receives through injection. */
export interface GeneralFace {
  /**
   * The active locale, bound as `useLocale`; the tabs format dates and pick copy from it.
   * @param select - reads one value from the locale snapshot.
   * @returns the selected value.
   */
  readonly locale: (select: (snapshot: LocaleSnapshot) => string) => string
  /** The tab's dictionary, so the rendered view and its helpers translate through one seat. */
  readonly t: (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string
  readonly hooks: {
    /** Tab state, bound as `useGeneral`. */
    readonly general: SnapshotStore<GeneralState>
  }
  /** Read the catalog once the tab first renders. */
  readonly ensure: () => void
  /** Read the catalog again, bypassing the Host's cache. */
  readonly reload: () => void
  /** Read the catalog again after a failure. */
  readonly retry: () => void
  readonly setQuery: (query: string) => void
  readonly setCategory: (category: string | null) => void
  readonly setSort: (sort: MarketSort) => void
  readonly showMore: () => void
  readonly open: (plugin: PluginView) => void
  readonly back: () => void
  readonly retryDetail: () => void
  /** Check one version and hand it to the page's install dialog, or explain why it cannot be installed. */
  readonly install: (plugin: PluginView, version: ListedVersionView, install: MarketTabProps['install']) => void
  /** Install the version the compatibility notice offered instead. */
  readonly adaptAndInstall: (install: MarketTabProps['install']) => void
  /** Install a version the Host could not confirm, after the reader chose to continue. */
  readonly confirmOverride: (install: MarketTabProps['install']) => void
  readonly dismissNotice: () => void
  readonly dismissSubstitution: () => void
  /**
   * Install one plugin package the catalog pins, through the catalog plugin of the same name, so an entry gets the
   * same compatibility check as the General tab's own rows. Without that catalog entry nothing starts.
   * @param entry - the catalog entry whose install declares the package and version.
   * @param install - the page's install dialog bridge.
   */
  readonly installPinned: (entry: MarketingEntry, install: MarketTabProps['install']) => void
}

const INITIAL: GeneralState = {
  status: 'idle',
  catalog: null,
  failure: null,
  language: 'zh',
  query: '',
  category: null,
  sort: 'stars',
  limit: PAGE_SIZE,
  selected: null,
  detail: { status: 'idle' },
  compatibility: { status: 'idle' },
  checking: null,
  notice: null,
  substitution: null,
}

/**
 * General plugins tab state and actions.
 * Reads every fact from the Host and never decides compatibility itself: the Host applies the installer's rules.
 */
export class GeneralController {
  /** The tab state, bound as `useGeneral`. */
  readonly store: SnapshotStore<GeneralState> = createSnapshotStore<GeneralState>(INITIAL)
  private loadToken = 0
  private detailToken = 0
  private readonly language: () => string
  /** The shell's locale snapshot, read by the injected `useLocale` at call time. */
  private readonly localeSnapshot: () => LocaleSnapshot
  /**
   * The preflight that started a check, so a panel rendering again does not restart it:
   * the tab's face is rebuilt on every render, and a restart would let two checks race for the button.
   */
  /**
   * The face value the framework injects. One value per controller keeps the state the framework binds
   * and the handlers a view calls on the same object, so a render neither restarts a check nor loses one.
   */
  private faceValue: GeneralFace | undefined

  /**
   * @param ctx - the browser plugin context, whose locale the language follows.
   * @param market - the Host reads.
   * @param bind - binds this tab's dictionary, so a rendered view carries the page's one `t` seat.
   */
  constructor(
    ctx: ClientContext,
    private readonly market: MarketClient,
    private readonly bind: () => GeneralFace['t'],
  ) {
    this.localeSnapshot = () => ctx.locale.getSnapshot()
    this.language = () => this.localeSnapshot().active
    this.store.set({ ...INITIAL, language: this.language() })
  }

  /**
   * The state snapshot.
   * @returns the current state.
   */
  private state(): GeneralState {
    return this.store.getSnapshot()
  }

  /**
   * Patch the state.
   * @param next - the fields to change.
   */
  private set(next: Partial<GeneralState>): void {
    this.store.set({ ...this.state(), ...next })
  }


  /**
   * What the tab's component receives through injection.
   * @returns the inject face.
   */
  face(): GeneralFace {
    return this.faceValue ??= this.createFace()
  }

  /**
   * Build the inject face once; the framework keeps this identity for the plugin's lifetime.
   * @returns the inject face.
   */
  private createFace(): GeneralFace {
    return {
      locale: this.selectLanguage,
      t: this.bind(),
      hooks: { general: this.store },
      ensure: () => { this.ensure() },
      reload: () => { this.reload() },
      retry: () => { this.retry() },
      setQuery: (query) => { this.setQuery(query) },
      setCategory: (category) => { this.setCategory(category) },
      setSort: (sort) => { this.setSort(sort) },
      showMore: () => { this.showMore() },
      open: (plugin) => { this.open(plugin) },
      back: () => { this.back() },
      retryDetail: () => { this.retryDetail() },
      install: (plugin, version, install) => { void this.install(plugin, version, install) },
      adaptAndInstall: (install) => { void this.adaptAndInstall(install) },
      confirmOverride: (install) => { this.confirmOverride(install) },
      dismissNotice: () => { this.dismissNotice() },
      dismissSubstitution: () => { this.dismissSubstitution() },
      installPinned: (entry, install) => { this.installPinned(entry, install) },
    }
  }

  /** Read the catalog once the tab first renders. */
  private readonly ensure = (): void => { if (this.state().status === 'idle') void this.load() }

  /** Read the catalog again, bypassing the Host's cache. */
  private readonly reload = (): void => { void this.load(true) }

  /** Read the catalog again after a failure. */
  private readonly retry = (): void => { void this.load(false) }

  /** @param query - the search text. */
  private readonly setQuery = (query: string): void => { this.set({ query, limit: PAGE_SIZE }) }

  /** @param category - the category filter, or null for every category; choosing one clears the search text. */
  private readonly setCategory = (category: string | null): void => { this.set({ category, query: '', limit: PAGE_SIZE }) }

  /** @param sort - the list order. */
  private readonly setSort = (sort: MarketSort): void => { this.set({ sort }) }

  /** Page the general list by one window. */
  private readonly showMore = (): void => { this.set({ limit: this.state().limit + PAGE_SIZE }) }

  /** @param plugin - the plugin whose page opens. */
  private readonly open = (plugin: PluginView): void => { this.openPlugin(plugin) }

  /** Leave a plugin page for the list. */
  private readonly back = (): void => {
    this.detailToken += 1
    this.set({ selected: null, detail: { status: 'idle' }, compatibility: { status: 'idle' } })
  }

  /** Read the open plugin page again. */
  private readonly retryDetail = (): void => {
    const plugin = this.state().selected
    if (plugin !== null) this.openPlugin(plugin)
  }

  /** Clear the install notice. */
  private readonly dismissNotice = (): void => { this.set({ notice: null }) }

  /** Clear the substituted-version note. */
  private readonly dismissSubstitution = (): void => { this.set({ substitution: null }) }

  /**
   * Read one value from the shell's locale snapshot; the injected `useLocale` seat.
   * @param select - the value to read.
   * @returns the selected value.
   */
  private readonly selectLanguage = (select: (snapshot: LocaleSnapshot) => string): string => select(this.localeSnapshot())

  /**
   * Follow the active language.
   * @param language - the shell's active language.
   */
  setLanguage(language: string): void {
    if (language !== this.state().language) this.set({ language })
  }

  /** Release nothing but the in-flight reads, which the tokens already invalidate. */
  dispose(): void {
    this.loadToken += 1
    this.detailToken += 1
  }

  /**
   * Read the catalog.
   * @param refresh - bypass the Host's cache.
   */
  private async load(refresh = false): Promise<void> {
    const token = ++this.loadToken
    this.set({ status: this.state().catalog === null ? 'loading' : this.state().status, failure: null })
    const settled = await this.market.catalog(refresh)
      .then((catalog): { catalog: GeneralCatalogView } | { failure: string } => ({ catalog }))
      .catch((error: unknown) => ({ failure: (error as Error).message }))
    // A newer read owns the state.
    if (token !== this.loadToken) return
    if ('catalog' in settled) this.set({ status: 'ready', catalog: settled.catalog, failure: null })
    else this.set({ status: 'error', failure: settled.failure })
  }

  /**
   * Open one plugin's page and read its description and manifest facts.
   * @param plugin - the plugin.
   */
  private openPlugin(plugin: PluginView): void {
    const token = ++this.detailToken
    const version = latestVersion(plugin)
    this.set({ selected: plugin, detail: { status: 'loading' }, compatibility: { status: 'loading' } })
    if (version === undefined) return
    const settle = async (): Promise<void> => {
      const [detail, facts] = await Promise.allSettled([this.market.detail(plugin, version), this.market.manifest(plugin, version)])
      if (token !== this.detailToken) return
      this.set({
        detail: detail.status === 'fulfilled'
          ? (detail.value.status === 'found' ? { status: 'found', markdown: detail.value.markdown } : { status: 'none' })
          : { status: 'error', message: (detail.reason as Error).message },
        compatibility: facts.status === 'fulfilled'
          ? { status: 'ready', facts: facts.value }
          : { status: 'error', reason: (facts.reason as Error).message },
      })
    }
    void settle()
  }

  /**
   * Check one version, then install it or explain the refusal.
   * @param plugin - the plugin.
   * @param version - the version the reader asked for.
   * @param install - the page's install dialog bridge.
   */
  private async install(plugin: PluginView, version: ListedVersionView, install: MarketTabProps['install']): Promise<void> {
    if (this.state().checking !== null) return
    this.set({ checking: plugin.name, notice: null })
    const resolution = await this.market.resolve(plugin, version)
    if (resolution.status === 'none') {
      this.set({ notice: { kind: 'incompatible', plugin, version, resolution }, checking: null })
      return
    }
    const chosen = selectedVersion(resolution, plugin.versions) ?? version
    if (chosen.version !== version.version) this.set({ substitution: substituted(plugin, version, chosen, resolution) })
    const outcome = await this.market.manifest(plugin, chosen).then(
      (facts): ManifestFacts | Error => facts,
      (error: unknown) => error as Error,
    )
    this.set({
      notice: describe(outcome, plugin, chosen),
      checking: null,
    })
    // A bundle-installable package goes to the page's install dialog, which owns its own progress.
    if (outcome instanceof Error || !(outcome.class === 'tomato' && outcome.declaredBundle)) return
    install({
      ...installTarget(plugin, chosen),
      title: localized(plugin.title, this.state().language) || plugin.name,
      version: chosen.version,
    })
  }

  /**
   * Preflight the plugin one catalog entry pins, then install it or explain the refusal.
   * @param entry - the entry.
   * @param install - the page's install dialog bridge.
   */
  private installPinned(entry: MarketingEntry, install: MarketTabProps['install']): void {
    const declared = entry.install
    if (declared.type !== 'plugin') return
    // The catalog lists the plugin's other versions; a plugin the catalog omits cannot be checked, so it waits for
    // the General tab to list it before any install starts.
    const name = declared.name
    const plugin = this.state().catalog?.plugins.find(candidate => candidate.name === name)
    if (plugin === undefined) return
    // The pinned version comes from the entry; the catalog supplies the rest of the plugin the preflight reads.
    const chosen = { version: declared.version, source: { type: 'npm' as const } }
    void this.install({ ...plugin, title: plugin.title ?? entry.title }, chosen, install)
  }

  /**
   * Convert a TOMATO version through the compatibility layer and hand it to the installer.
   * @param install - the page's install dialog bridge.
   */
  private async adaptAndInstall(install: MarketTabProps['install']): Promise<void> {
    const notice = this.state().notice
    if (notice?.kind !== 'compat') return
    const { plugin, version } = notice
    this.set({ checking: plugin.name, notice: null })
    try {
      const adapted = await this.market.adapt(plugin, version)
      this.set({ checking: null })
      install({
        spec: adapted.spec,
        title: localized(plugin.title, this.state().language) || plugin.name,
        version: version.version,
      })
    } catch (error) {
      this.set({ checking: null, notice: { kind: 'adapt-failed', plugin, version, reason: (error as Error).message } })
    }
  }

  /**
   * Install a version whose compatibility the Host could not confirm.
   * @param install - the page's install dialog bridge.
   */
  private confirmOverride(install: MarketTabProps['install']): void {
    const notice = this.state().notice
    if (notice?.kind !== 'unknown') return
    const { plugin, version } = notice
    this.set({ notice: null })
    install({
      ...installTarget(plugin, version),
      title: localized(plugin.title, this.state().language) || plugin.name,
      version: version.version,
    })
  }
}
