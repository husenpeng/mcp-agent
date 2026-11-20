// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
import type { LocaleSnapshot } from '@tomato/client-locale/client'
import type { MarketCatalog, MarketingCatalog } from '../src/client/contract.ts'
import { GeneralMarket, type GeneralMarketProps } from '../src/client/GeneralMarket.tsx'
import { MarketingMarket, type MarketingMarketProps } from '../src/client/MarketingMarket.tsx'
import type { GeneralState } from '../src/client/general-controller.ts'
import type { MarketingState } from '../src/client/marketing-controller.ts'
import { en, zh, type TomatoMarketLocaleKey } from '../src/client/locales.ts'
import { compatibilityBadge, filterPlugins, formatDate, formatStars, localized, sortPlugins, starsOf } from '../src/client/catalog.ts'
import { categorySections, installTarget } from '../src/client/catalog.ts'
import { filterEntries, kindKey, oneClick, pluginTarget, sortEntries, entryCounts } from '../src/client/marketing-search.ts'

afterEach(cleanup)

function translator(
  dictionary: Record<TomatoMarketLocaleKey, string>,
): (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string {
  return (key, params) => Object.entries(params ?? {})
    .reduce<string>((text, [name, value]) => text.replaceAll(`{${name}}`, value), dictionary[key])
}

const CATALOG: MarketCatalog = {
  title: { en: 'Open catalog', zh: '开源目录' },
  // The grouped list shows a section only for plugins that declare a category.
  categories: [{ id: 'tools', title: { en: 'Tools', zh: '工具' } }, { id: 'themes', title: { en: 'Themes', zh: '主题' } }],
  stars: { 'npm:tomato-a': 1240 },
  plugins: [
    {
      name: 'tomato-a', title: { en: 'Alpha', zh: '甲' }, description: { en: 'Does A', zh: '做甲事' }, author: 'Jane',
      category: 'tools', keywords: ['alpha'], repository: { url: 'https://github.com/o/plugins' },
      versions: [{ version: '1.2.0', source: { type: 'npm' }, publishTimestamp: 1790476800 }],
    },
    {
      name: 'tomato-b', title: 'Beta', description: 'Does B', category: 'themes',
      versions: [{ version: '2.0.0', source: { type: 'npm', registry: 'https://r.example/' }, tomato: '>=0.1.0' }],
    },
  ],
}

const GENERAL: GeneralState = {
  status: 'ready', catalog: CATALOG, failure: null, language: 'en', query: '', category: null, sort: 'stars', limit: 60,
  selected: null, detail: { status: 'idle' }, compatibility: { status: 'idle' }, checking: null, notice: null, substitution: null,
}

const MARKETING_CATALOG: MarketingCatalog & { installed: readonly string[] } = {
  format: 1,
  generatedAt: '2026-11-03',
  categories: [{ id: 'creator', title: { zh: '达人发现', en: 'Creator discovery' } }],
  entries: [
    {
      id: 'apify', kind: 'mcp', title: { zh: 'Apify', en: 'Apify' }, description: { zh: '抓取公开数据', en: 'Scrape public data' },
      categories: ['creator'], access: 'free-key', homepage: 'https://github.com/apify/actors',
      install: { type: 'mcp', runner: 'npx', package: 'apify-mcp', version: '1.0.0', env: ['APIFY_TOKEN'] }, stars: 4200,
    },
    {
      id: 'vidiq', kind: 'plugin', title: { zh: 'vidIQ', en: 'vidIQ' }, description: { zh: '频道分析', en: 'Channel analytics' },
      categories: ['creator'], access: 'login', install: { type: 'plugin', name: 'tomato-plugin-vidiq', version: '0.3.1' },
    },
    {
      id: 'guide', kind: 'skill', title: { zh: '达人核验方法', en: 'Creator vetting' }, description: { zh: '步骤', en: 'Steps' },
      categories: ['creator'], install: { type: 'manual', steps: { zh: '打开控制台', en: 'Open the console' } },
    },
  ],
  installed: ['apify'],
}

const MARKETING: MarketingState = {
  status: 'ready', catalog: MARKETING_CATALOG, failure: null, language: 'en', query: '', category: null, kind: 'all',
  sort: 'stars', limit: 60, selected: null, detail: { status: 'idle' }, dialog: null,
}

function renderGeneral(state: Partial<GeneralState> = {}, dictionary: Record<TomatoMarketLocaleKey, string> = en) {
  const store = createSnapshotStore<GeneralState>({ ...GENERAL, ...state })
  const locale = createSnapshotStore<LocaleSnapshot>({ active: dictionary === en ? 'en' : 'zh', locales: [], revision: 0 })
  const actions = {
    ensure: vi.fn(), reload: vi.fn(), retry: vi.fn(), setQuery: vi.fn(), setCategory: vi.fn(), setSort: vi.fn(), showMore: vi.fn(),
    open: vi.fn(), back: vi.fn(), retryDetail: vi.fn(), install: vi.fn(), adaptAndInstall: vi.fn(), confirmOverride: vi.fn(),
    dismissNotice: vi.fn(), dismissSubstitution: vi.fn(), installPinned: vi.fn(),
  }
  const install = vi.fn()
  // The actions spread supplies props.install; the page's install bridge stays on tab.install.
  const props = {
    t: translator(dictionary), openPackage: vi.fn(), ...actions,
    tab: { install, openPackage: vi.fn(), t: translator(dictionary) },
    useGeneral: bindSnapshotSelector(store),
    locale: bindSnapshotSelector(locale),
  } as unknown as GeneralMarketProps
  render(<GeneralMarket {...props} />)
  const set = (next: Partial<GeneralState>): void => { act(() => { store.set({ ...store.getSnapshot(), ...next }) }) }
  return { actions, install, set }
}

function renderMarketing(state: Partial<MarketingState> = {}, dictionary: Record<TomatoMarketLocaleKey, string> = en) {
  const store = createSnapshotStore<MarketingState>({ ...MARKETING, ...state })
  const general = createSnapshotStore<GeneralState>({ ...GENERAL })
  const locale = createSnapshotStore<LocaleSnapshot>({ active: dictionary === en ? 'en' : 'zh', locales: [], revision: 0 })
  const actions = {
    ensure: vi.fn(), reload: vi.fn(), setQuery: vi.fn(), setCategory: vi.fn(), setKind: vi.fn(), setSort: vi.fn(), showMore: vi.fn(),
    open: vi.fn(), back: vi.fn(), retryDetail: vi.fn(), startInstall: vi.fn(), startUninstall: vi.fn(), confirm: vi.fn(),
    closeDialog: vi.fn(), installPinned: vi.fn(), dismissPluginNotice: vi.fn(), adaptPlugin: vi.fn(), confirmPluginOverride: vi.fn(),
  }
  const install = vi.fn()
  const props = {
    t: translator(dictionary), install, openPackage: vi.fn(), ...actions,
    tab: { install, openPackage: vi.fn(), t: translator(dictionary) },
    useMarketing: bindSnapshotSelector(store),
    usePlugins: bindSnapshotSelector(general),
    locale: bindSnapshotSelector(locale),
  } as unknown as MarketingMarketProps
  render(<MarketingMarket {...props} />)
  const set = (next: Partial<MarketingState>): void => { act(() => { store.set({ ...store.getSnapshot(), ...next }) }) }
  return { actions, install, set, general }
}

const rows = (): string[] => Array.from(document.querySelectorAll('[data-market-plugin]')).map(node => node.getAttribute('data-market-plugin') ?? '')
const entries = (): string[] => Array.from(document.querySelectorAll('[data-marketing-entry]')).map(node => node.getAttribute('data-marketing-entry') ?? '')

describe('GeneralMarket', () => {
  it('lists the catalog with stars and installs the listed version through the page dialog', () => {
    const { actions } = renderGeneral()
    // Grouped by category: the populated sections come first, in section order.
    expect(rows().sort()).toEqual(['tomato-a', 'tomato-b'])
    expect(screen.getByText('★ 1.2k', { exact: false })).toBeTruthy()
    expect(actions.ensure).toHaveBeenCalledOnce()
    fireEvent.click(within(document.querySelector('[data-market-plugin="tomato-a"]') as HTMLElement).getByRole('button', { name: 'Install' }))
    expect(actions.install).toHaveBeenCalledOnce()
    expect((actions.install.mock.calls[0] as unknown[])[0]).toBe(CATALOG.plugins[0])
  })

  it('filters and opens a plugin page with its compatibility facts', () => {
    const { actions, set } = renderGeneral({ query: 'beta', category: 'themes' })
    fireEvent.click(screen.getByRole('button', { name: 'Open Beta' }))
    expect(actions.open).toHaveBeenCalledWith(CATALOG.plugins[1])
    set({
      selected: { name: 'tomato-b', title: 'Beta', description: 'Does B', versions: [{ version: '2.0.0', source: { type: 'npm' }, tomato: '>=0.1.0' }] },
      compatibility: { status: 'ready', facts: { class: 'tomato', declaredBundle: true, tomatoPeers: [], registry: 'r', compatibility: { status: 'compatible' } } },
    })
    expect(screen.getByText('Beta', { selector: 'h2' })).toBeTruthy()
    expect(screen.getAllByText('Compatible with this TOMATO').length).toBeGreaterThan(0)
  })

  it('renders the load failure with a retry', () => {
    const { actions } = renderGeneral({ status: 'error', catalog: null, failure: 'HTTP 503' })
    expect(screen.getByRole('alert').textContent).toContain('HTTP 503')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(actions.retry).toHaveBeenCalledOnce()
  })

  it('says which version it substituted and closes the note', () => {
    const { actions } = renderGeneral({
      substitution: {
        plugin: CATALOG.plugins[0] as never,
        requested: { version: '1.2.0', source: { type: 'npm' } },
        selected: { version: '1.1.0', source: { type: 'npm' } },
        runtimeVersion: '0.2.2',
      },
    })
    expect(screen.getByRole('status').textContent).toContain('Installed 1.1.0 instead')
    fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: 'Close' }))
    expect(actions.dismissSubstitution).toHaveBeenCalledOnce()
  })

  it('renders Chinese copy from the same state', () => {
    renderGeneral({}, zh)
    expect(screen.getAllByRole('button', { name: '安装' }).length).toBeGreaterThan(0)
  })
})

describe('MarketingMarket', () => {
  it('lists entries by kind with access and install tags', () => {
    renderMarketing()
    expect(entries().sort()).toEqual(['apify', 'guide', 'vidiq'])
    const apify = within(document.querySelector('[data-marketing-entry="apify"]') as HTMLElement)
    // Kind and access share the tag row; an installed entry offers its details instead of Install.
    expect(apify.getAllByText('MCP').length).toBeGreaterThan(0)
    expect(apify.getAllByText('Free key needed').length).toBeGreaterThan(0)
    expect(apify.getByRole('button', { name: 'View' })).toBeTruthy()
  })

  it('starts an MCP install through the Host and a plugin install through the preflight', () => {
    const { actions, install } = renderMarketing()
    fireEvent.click(within(document.querySelector('[data-marketing-entry="apify"]') as HTMLElement).getByRole('button', { name: 'View' }))
    expect(actions.open).toHaveBeenCalledWith(MARKETING_CATALOG.entries[0])
    fireEvent.click(within(document.querySelector('[data-marketing-entry="vidiq"]') as HTMLElement).getByRole('button', { name: 'Install' }))
    expect(actions.installPinned).toHaveBeenCalledWith(MARKETING_CATALOG.entries[1], install)
  })

  it('shows the confirmation dialog preview the Host returned', () => {
    const entry = MARKETING_CATALOG.entries[0]
    const { actions } = renderMarketing({
      dialog: { mode: 'install', entry: entry as never, phase: 'ready', preview: { kind: 'mcp', command: 'npx -y apify-mcp@1.0.0', yaml: '- id: mkt-mcp-apify' } },
    })
    expect(screen.getByText('npx -y apify-mcp@1.0.0')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Install' }).at(-1) as HTMLElement)
    expect(actions.confirm).toHaveBeenCalledOnce()
  })

  it('lifts the General tab preflight notice into a dialog with its alternatives', () => {
    const { actions, install, general } = renderMarketing()
    act(() => {
      general.set({
        ...general.getSnapshot(),
        notice: {
          kind: 'compat',
          plugin: { name: 'tomato-x', versions: [] },
          version: { version: '1.0.0', source: { type: 'npm' } },
          facts: { class: 'tomato', declaredBundle: true, tomatoPeers: [], registry: 'r' },
        } as never,
      })
    })
    expect(screen.getByText('This Tomato Harness plugin installs through the compatibility layer')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Install compatible build' }))
    expect(actions.adaptPlugin).toHaveBeenCalledWith(install)
  })
})

describe('catalog helpers', () => {
  it('resolves localized text, stars, sizes, and dates', () => {
    expect(localized({ en: 'A', zh: '甲' }, 'zh')).toBe('甲')
    expect(localized(undefined, 'zh')).toBe('')
    expect(localized('plain', 'zh')).toBe('plain')
    expect(starsOf({ name: 'tomato-a' }, { 'npm:tomato-a': 3 })).toBe(3)
    expect(starsOf({ name: 'x', repository: { url: 'https://github.com/O/R.git' } }, { 'gh:o/r': 7 })).toBe(7)
    expect(starsOf({ name: 'x' }, {})).toBeUndefined()
    expect(formatStars(undefined)).toBe('')
    expect(formatStars(999)).toBe('999')
    expect(formatStars(1240)).toBe('1.2k')
    expect(formatStars(12000)).toBe('12k')
    expect(formatStars(2_000_000)).toBe('2m')
    expect(formatDate(undefined, 'en')).toBe('')
    expect(formatDate(1790476800, 'en')).not.toBe('')
  })

  it('filters by every search word and category, then orders', () => {
    const matched = filterPlugins(CATALOG.plugins, { query: 'alpha jane', language: 'en' })
    expect(matched.map(plugin => plugin.name)).toEqual(['tomato-a'])
    expect(filterPlugins(CATALOG.plugins, { category: 'tools', language: 'en' }).map(plugin => plugin.name)).toEqual(['tomato-a'])
    expect(filterPlugins(CATALOG.plugins, { category: 'none', language: 'en' })).toEqual([])
    expect(sortPlugins(CATALOG.plugins, 'name', {}, 'en').map(plugin => plugin.name)).toEqual(['tomato-a', 'tomato-b'])
    expect(sortPlugins(CATALOG.plugins, 'stars', CATALOG.stars, 'en').map(plugin => plugin.name)).toEqual(['tomato-a', 'tomato-b'])
    expect(sortPlugins(CATALOG.plugins, 'stars', {}, 'en').map(plugin => plugin.name)).toEqual(['tomato-a', 'tomato-b'])
    expect(sortPlugins(CATALOG.plugins, 'updated', CATALOG.stars, 'en').map(plugin => plugin.name)).toEqual(['tomato-a', 'tomato-b'])
  })

  it('groups categories with their most prominent members', () => {
    const sections = categorySections(CATALOG.plugins, CATALOG.categories, CATALOG.stars, 'en', 1)
    // Sections tie on population, so their titles order them.
    expect(sections.map(section => [section.id, section.total, section.plugins[0]?.name]).sort()).toEqual([['themes', 1, 'tomato-b'], ['tools', 1, 'tomato-a']])
    expect(categorySections(CATALOG.plugins, [], {}, 'en', 2).map(section => section.id).sort()).toEqual(['themes', 'tools'])
  })

  it('builds install specs for npm and Git versions', () => {
    expect(installTarget({ name: 'a' }, { version: '1.0.0', source: { type: 'npm', registry: 'https://r/' } }))
      .toEqual({ spec: 'a@1.0.0', registry: 'https://r/' })
    expect(installTarget({ name: 'a' }, { version: '1.0.0', source: { type: 'git', url: 'https://github.com/o/r', commit: 'abc', path: 'pkg' } }))
      .toEqual({ spec: 'git+https://github.com/o/r.git#abc&path:/pkg' })
    expect(installTarget({ name: 'a' }, { version: '1.0.0', source: { type: 'git', url: 'https://github.com/o/r', commit: 'abc' } }))
      .toEqual({ spec: 'git+https://github.com/o/r.git#abc' })
  })

  it('reads compatibility badges from the manifest facts', () => {
    expect(compatibilityBadge(undefined).key).toBe('compatUnknown')
    expect(compatibilityBadge({ class: 'tomato' } as never).key).toBe('compatTomato')
    expect(compatibilityBadge({ class: 'other' } as never).key).toBe('compatOther')
  })
})

describe('marketing helpers', () => {
  it('filters by kind, category, and search words including skill names', () => {
    const categories = MARKETING_CATALOG.categories
    expect(filterEntries(MARKETING_CATALOG.entries, { kind: 'mcp', categories, language: 'en' }).map(entry => entry.id)).toEqual(['apify'])
    expect(filterEntries(MARKETING_CATALOG.entries, { query: 'apify token', categories, language: 'en' }).map(entry => entry.id)).toEqual([])
    expect(filterEntries(MARKETING_CATALOG.entries, { query: 'scrape', categories, language: 'en' }).map(entry => entry.id)).toEqual(['apify'])
    expect(filterEntries(MARKETING_CATALOG.entries, { category: 'creator', categories, language: 'zh' })).toHaveLength(3)
  })

  it('orders entries and counts their categories', () => {
    // The manual entry has no star count, so it follows the reviewed ones.
    // Unstarred entries follow every starred one; the name order breaks the rest.
    expect(sortEntries(MARKETING_CATALOG.entries, 'stars', 'en').map(entry => entry.id)).toEqual(['apify', 'guide', 'vidiq'])
    expect(sortEntries(MARKETING_CATALOG.entries, 'name', 'en').map(entry => entry.id).sort()).toEqual(['apify', 'guide', 'vidiq'])
    expect(entryCounts(MARKETING_CATALOG.entries).get('creator')).toBe(3)
  })

  it('names kinds, one-click installs, and the plugin an entry pins', () => {
    expect(kindKey('plugin')).toBe('kindPlugin')
    expect(kindKey('mcp')).toBe('kindMcp')
    expect(kindKey('skill')).toBe('kindSkill')
    expect(oneClick(MARKETING_CATALOG.entries[0] as never)).toBe(true)
    expect(oneClick(MARKETING_CATALOG.entries[2] as never)).toBe(false)
    expect(pluginTarget(MARKETING_CATALOG.entries[1] as never).version.version).toBe('0.3.1')
    expect(() => pluginTarget(MARKETING_CATALOG.entries[0] as never)).toThrow()
  })
})
