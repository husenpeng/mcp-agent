/** Marketing tab state and actions: catalog load, filters, entry pages, and the install and uninstall dialogs. */
import {
  installMarketingEntry, previewMarketingEntry, readMarketingCatalog, readMarketingDetail, uninstallMarketingEntry,
} from './api.js'
import { createStore } from './store.js'

/** Rows added by one "show more". */
const PAGE = 60

/**
 * Build the marketing tab controller.
 * @param {{ language: () => string }} i18n - the active language.
 * @returns {object} store and actions.
 */
export function createMarketingController(i18n) {
  const store = createStore({
    status: 'idle',
    catalog: null,
    failure: null,
    language: i18n.language(),
    query: '',
    category: null,
    kind: 'all',
    sort: 'stars',
    limit: PAGE,
    selected: null,
    detail: { status: 'idle' },
    dialog: null,
  })
  let loadToken = 0
  let detailToken = 0
  let dialogToken = 0
  const state = () => store.get()
  const set = (patch) => { store.set({ ...state(), ...patch }) }

  const load = async () => {
    const token = ++loadToken
    set({ status: state().catalog === null ? 'loading' : state().status, failure: null })
    try {
      const catalog = await readMarketingCatalog()
      if (token === loadToken) set({ status: 'ready', catalog })
    } catch (error) {
      if (token === loadToken) set({ status: 'error', failure: error?.message ?? String(error) })
    }
  }

  const open = (entry) => {
    const token = ++detailToken
    set({ selected: entry.id, detail: { status: 'loading' } })
    readMarketingDetail(entry.id).then(
      (detail) => { if (token === detailToken) set({ detail: detail.status === 'found' ? { status: 'found', markdown: detail.markdown } : { status: 'none' } }) },
      (error) => { if (token === detailToken) set({ detail: { status: 'error', message: error?.message ?? String(error) } }) },
    )
  }

  const startInstall = async (entry) => {
    const token = ++dialogToken
    set({ dialog: { mode: 'install', entry, phase: 'loading' } })
    try {
      const preview = await previewMarketingEntry(entry.id)
      if (token === dialogToken) set({ dialog: { mode: 'install', entry, phase: 'ready', preview } })
    } catch (error) {
      if (token === dialogToken) set({ dialog: { mode: 'install', entry, phase: 'failed', reason: error?.message ?? String(error) } })
    }
  }

  /** Run the confirmed action; the dialog stays open on its result. */
  const confirm = async () => {
    const dialog = state().dialog
    if (dialog === null || dialog.phase !== 'ready') return
    const token = ++dialogToken
    set({ dialog: { ...dialog, phase: 'working' } })
    try {
      const result = dialog.mode === 'install' ? await installMarketingEntry(dialog.entry.id) : await uninstallMarketingEntry(dialog.entry.id)
      await load()
      if (token === dialogToken) set({ dialog: { ...dialog, phase: 'done', result } })
    } catch (error) {
      await load()
      if (token === dialogToken) set({ dialog: { ...dialog, phase: 'failed', reason: error?.message ?? String(error) } })
    }
  }

  return {
    store,
    ensure: () => { if (state().status === 'idle') void load() },
    reload: () => { void load() },
    setLanguage: (language) => { if (language !== state().language) set({ language }) },
    setQuery: (query) => { set({ query, limit: PAGE }) },
    setCategory: (category) => { set({ category, limit: PAGE }) },
    setKind: (kind) => { set({ kind, limit: PAGE }) },
    setSort: (sort) => { set({ sort }) },
    showMore: () => { set({ limit: state().limit + PAGE }) },
    open,
    retryDetail: () => {
      const entry = state().catalog?.entries.find(candidate => candidate.id === state().selected)
      if (entry !== undefined) open(entry)
    },
    back: () => {
      detailToken += 1
      set({ selected: null, detail: { status: 'idle' } })
    },
    startInstall,
    startUninstall: (entry) => {
      dialogToken += 1
      set({ dialog: { mode: 'uninstall', entry, phase: 'ready' } })
    },
    confirm,
    closeDialog: () => {
      // A running install keeps going on the Host; closing only stops showing it.
      dialogToken += 1
      set({ dialog: null })
    },
  }
}
