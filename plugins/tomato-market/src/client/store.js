/** Tab state and actions: catalog load, query, selection, detail reads, and install preflight. */
import { adaptVersion, readCatalog, readDetail, readManifest, resolveVersion } from './api.js'
import { installTarget, latestVersion, localized } from './search.js'

/**
 * A minimal observable store, compatible with `useSyncExternalStore`.
 * @param {object} initial - starting state.
 * @returns {{ get: () => object, set: (next: object) => void, subscribe: (listener: () => void) => () => void }} the store.
 */
export function createStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    get: () => state,
    set(next) {
      state = next
      for (const listener of [...listeners]) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

/**
 * Build the tab controller.
 * @param {{ t: Function, language: () => string }} i18n - translator and active language.
 * @returns {object} store, actions, and the page install bridge.
 */
export function createController(i18n) {
  const store = createStore({
    status: 'idle',
    catalog: null,
    failure: null,
    language: i18n.language(),
    query: '',
    category: null,
    sort: 'stars',
    limit: 60,
    selected: null,
    detail: { status: 'idle' },
    compat: { status: 'idle' },
    checking: null,
    notice: null,
    substitution: null,
  })
  let loadToken = 0
  let detailToken = 0

  const set = (patch) => { store.set({ ...store.get(), ...patch }) }
  const state = () => store.get()

  const load = async (refresh = false) => {
    const token = ++loadToken
    set({ status: state().catalog === null ? 'loading' : state().status, failure: null })
    try {
      const catalog = await readCatalog(refresh)
      if (token !== loadToken) return
      set({ status: 'ready', catalog, failure: null })
    } catch (error) {
      if (token !== loadToken) return
      set({ status: 'error', failure: error?.message ?? String(error) })
    }
  }

  const open = async (plugin) => {
    const token = ++detailToken
    const version = latestVersion(plugin)
    set({
      selected: plugin,
      detail: { status: 'loading' },
      compat: { status: 'loading' },
    })
    if (version !== undefined) {
      readDetail(plugin, version).then(
        detail => { if (token === detailToken) set({ detail: detail.status === 'found' ? { status: 'found', markdown: detail.markdown } : { status: 'none' } }) },
        error => { if (token === detailToken) set({ detail: { status: 'error', message: error?.message ?? String(error) } }) },
      )
      readManifest(plugin, version).then(
        compat => { if (token === detailToken) set({ compat: { status: 'ready', data: compat } }) },
        error => { if (token === detailToken) set({ compat: { status: 'error', reason: error?.message ?? String(error) } }) },
      )
    }
  }

  const retryDetail = () => {
    const plugin = state().selected
    if (plugin === null) return
    void open(plugin)
  }

  /** Install one version, switching first to a listed version the running TOMATO admits. */
  const install = async (plugin, version, installFn) => {
    if (state().checking !== null) return
    set({ checking: plugin.name, notice: null })
    const resolution = await resolveVersion(plugin, version).catch(error => ({ status: 'unknown', reason: error?.message ?? String(error) }))
    if (resolution.status === 'none') {
      set({ checking: null, notice: { kind: 'incompatible', plugin, version, resolution } })
      return
    }
    const selected = resolution.status === 'resolved'
      ? plugin.versions.find(entry => entry.version === resolution.selected)
        ?? { version: resolution.selected, source: { type: 'npm' } }
      : undefined
    const chosen = selected ?? version
    if (chosen.version !== version.version) {
      set({ substitution: { plugin, requested: version, selected: chosen, runtimeVersion: resolution.runtimeVersion } })
    }
    let compat
    try {
      compat = await readManifest(plugin, chosen)
    } catch (error) {
      set({
        checking: null,
        notice: {
          kind: 'unknown',
          plugin,
          version: chosen,
          reason: error?.message ?? String(error),
        },
      })
      return
    }
    const title = localized(plugin.title, state().language) || plugin.name
    const target = installTarget(plugin, chosen)
    if (compat.class === 'tomato') {
      set({ checking: null })
      installFn({ ...target, title, version: chosen.version })
      return
    }
    set({
      checking: null,
      notice: {
        kind: compat.class === 'dsh' ? 'compat' : 'other',
        plugin,
        version: chosen,
        compat,
      },
    })
  }

  const adaptAndInstall = async (installFn) => {
    const notice = state().notice
    if (notice === null || notice.kind !== 'compat') return
    const { plugin, version } = notice
    set({ checking: plugin.name, notice: null })
    try {
      const adapted = await adaptVersion(plugin, version)
      set({ checking: null })
      installFn({
        spec: adapted.spec,
        title: localized(plugin.title, state().language) || plugin.name,
        version: version.version,
      })
    } catch (error) {
      set({
        checking: null,
        notice: { kind: 'adapt-failed', plugin, version, reason: error?.message ?? String(error) },
      })
    }
  }

  const confirmOverride = (installFn) => {
    const notice = state().notice
    if (notice === null || notice.kind !== 'unknown') return
    const { plugin, version } = notice
    const title = localized(plugin.title, state().language) || plugin.name
    set({ notice: null })
    installFn({ ...installTarget(plugin, version), title, version: version.version })
  }

  return {
    store,
    getState: state,
    ensure: () => {
      if (state().status === 'idle') void load()
    },
    reload: () => { void load(true) },
    retry: () => { void load(false) },
    setLanguage: (language) => { if (language !== state().language) set({ language }) },
    setQuery: (query) => { set({ query, limit: 60 }) },
    setCategory: (category) => { set({ category, query: '', limit: 60 }) },
    setSort: (sort) => { set({ sort }) },
    showMore: () => { set({ limit: state().limit + 60 }) },
    open,
    back: () => {
      detailToken += 1
      set({ selected: null, detail: { status: 'idle' }, compat: { status: 'idle' } })
    },
    retryDetail,
    install,
    adaptAndInstall,
    confirmOverride,
    dismissNotice: () => { set({ notice: null }) },
    dismissSubstitution: () => { set({ substitution: null }) },
  }
}