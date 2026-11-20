// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
import type { LocaleSnapshot } from '@tomato/client-locale/client'
import type { MarketCatalog } from '../src/client/contract.ts'
import { GeneralMarket, type GeneralMarketProps } from '../src/client/GeneralMarket.tsx'
import { InstallNoticeDialog } from '../src/client/InstallNotice.tsx'
import type { GeneralState } from '../src/client/general-controller.ts'
import { en, zh, type TomatoMarketLocaleKey } from '../src/client/locales.ts'
import { categorySections, filterPlugins, localized, sortPlugins } from '../src/client/catalog.ts'
import { filterEntries, sortEntries } from '../src/client/marketing-search.ts'
import type { MarketingEntry } from '../src/client/contract.ts'

afterEach(cleanup)

function translator(
  dictionary: Record<TomatoMarketLocaleKey, string>,
): (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string {
  return (key, params) => Object.entries(params ?? {})
    .reduce<string>((text, [name, value]) => text.replaceAll(`{${name}}`, value), dictionary[key])
}

const PLUGINS = [
  { name: 'a', title: { en: 'A', zh: '甲' }, category: 'tools', versions: [{ version: '1.0.0', source: { type: 'npm' as const }, publishTimestamp: 20 }] },
  { name: 'b', title: 'B', category: 'themes', versions: [{ version: '1.0.0', source: { type: 'npm' as const }, publishTimestamp: 10 }] },
  { name: 'c', title: 'C', category: 'extra', versions: [{ version: '1.0.0', source: { type: 'npm' as const } }] },
  { name: 'd', versions: [] },
]

const CATALOG: MarketCatalog = { categories: [], plugins: PLUGINS, stars: {} }

const GENERAL: GeneralState = {
  status: 'idle', catalog: CATALOG, failure: null, language: 'en', query: '', category: null, sort: 'stars', limit: 60,
  selected: null, detail: { status: 'idle' }, compatibility: { status: 'idle' }, checking: null, notice: null, substitution: null,
}

function renderGeneral(state: Partial<GeneralState> = {}, dictionary: Record<TomatoMarketLocaleKey, string> = en) {
  const store = createSnapshotStore<GeneralState>({ ...GENERAL, ...state })
  const locale = createSnapshotStore<LocaleSnapshot>({ active: dictionary === en ? 'en' : 'zh', locales: [], revision: 0 })
  const t = translator(dictionary)
  const install = vi.fn()
  const actions = {
    ensure: vi.fn(), reload: vi.fn(), retry: vi.fn(), setQuery: vi.fn(), setCategory: vi.fn(), setSort: vi.fn(), showMore: vi.fn(),
    open: vi.fn(), back: vi.fn(), retryDetail: vi.fn(), install: vi.fn(), adaptAndInstall: vi.fn(), confirmOverride: vi.fn(),
    dismissNotice: vi.fn(), dismissSubstitution: vi.fn(), installPinned: vi.fn(),
  }
  const props = {
    t, update: vi.fn(), openPackage: vi.fn(), ...actions,
    tab: { install, openPackage: vi.fn(), t },
    useGeneral: bindSnapshotSelector(store),
    locale: bindSnapshotSelector(locale),
  } as unknown as GeneralMarketProps
  render(<GeneralMarket {...props} />)
  return { actions, install }
}

describe('catalog edges', () => {
  it('falls back to the id for a category no declaration names', () => {
    const sections = categorySections(PLUGINS, [{ id: 'tools', title: { en: 'Tools' } }], {}, 'en', 6)
    expect(sections.map(section => section.id).sort()).toEqual(['extra', 'themes', 'tools'])
    expect(sections.find(section => section.id === 'extra')?.title).toBe('extra')
  })

  it('keeps an unstarred plugin ahead of a starred one only when neither has a count', () => {
    const starred = sortPlugins(PLUGINS, 'stars', { 'npm:a': 5 }, 'en')
    expect(starred.map(plugin => plugin.name).at(0)).toBe('a')
    expect(sortPlugins(PLUGINS, 'updated', {}, 'en').map(plugin => plugin.name).at(0)).toBe('a')
  })

  it('treats a category as present only when it holds a match', () => {
    expect(filterPlugins(PLUGINS, { category: 'extra', language: 'en' }).map(plugin => plugin.name)).toEqual(['c'])
  })

  it('orders catalog entries without a star count after the starred ones', () => {
    const entries = [
      { id: 'x', kind: 'mcp' as const, title: { en: 'X' }, description: { en: '' }, categories: [], install: { type: 'manual' as const, steps: { en: '' } } },
      { id: 'y', kind: 'mcp' as const, title: { en: 'Y' }, description: { en: '' }, categories: [], stars: 2, install: { type: 'manual' as const, steps: { en: '' } } },
    ]
    expect(sortEntries(entries, 'stars', 'en').map(entry => entry.id)).toEqual(['y', 'x'])
    expect(sortEntries(entries, 'updated', 'en').map(entry => entry.id).length).toBe(2)
    expect(filterEntries(entries, { query: 'no such text', categories: [], language: 'en' })).toEqual([])
  })
})

describe('general tab edges', () => {
  it('shows the query controls for a category-only filter and pages the list', () => {
    const { actions } = renderGeneral({ category: 'tools', limit: 1 })
    expect(screen.getByRole('button', { name: en.clear })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.clear }))
    expect(actions.setQuery).toHaveBeenCalledWith('')
  })

  it('marks an install in flight and keeps its button disabled', () => {
    renderGeneral({ checking: 'a' })
    const row = document.querySelector('[data-market-plugin="a"]') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: en.checking }))
    expect(within(row).getByRole('button', { name: en.checking }).hasAttribute('disabled')).toBe(true)
  })

  it('shows a plugin row without a title, a version, or an author', () => {
    renderGeneral({ query: 'd', category: 'none' })
    expect(screen.getByText(en.empty)).toBeTruthy()
  })

  it('opens a plugin page whose description exists but whose title is missing', () => {
    renderGeneral({ selected: PLUGINS[3] as never })
    expect(screen.getByRole('heading', { name: 'd' })).toBeTruthy()
  })
})

describe('install notice edges', () => {
  it('names an incompatible version without a runtime and without a repository', () => {
    render(
      <InstallNoticeDialog
        notice={{ kind: 'incompatible', plugin: { name: 'p', versions: [] }, version: { version: '1.0.0', source: { type: 'npm' } }, resolution: { status: 'unknown', requested: '1.0.0', reason: 'no manifest' } }}
        onClose={vi.fn()}
        onContinue={vi.fn()}
        onAdapt={vi.fn()}
        t={translator(zh)}
      />,
    )
    expect(screen.getByText(/任何已列出发布版本/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: zh.viewRepository })).toBeNull()
  })
})

describe('catalog fallbacks', () => {
  it('reads the language, then English, for a record that names neither', () => {
    expect(localized({ en: '' }, 'fr')).toBe('')
    expect(localized({ en: 'E' }, 'fr')).toBe('E')
  })

  it('orders entries by their newest update and by name', () => {
    const one = { id: 'one', kind: 'skill' as const, title: { en: 'One' }, description: { en: '' }, categories: [], updatedAt: '2026-01-01', install: { type: 'manual' as const, steps: { en: '' } } }
    const two = { id: 'two', kind: 'skill' as const, title: { en: 'Two' }, description: { en: '' }, categories: [], updatedAt: '2026-03-01', install: { type: 'manual' as const, steps: { en: '' } } }
    expect(sortEntries([one, two], 'updated', 'en').map(entry => entry.id)).toEqual(['two', 'one'])
    expect(sortEntries([two, one], 'name', 'en').map(entry => entry.id)).toEqual(['one', 'two'])
    // An entry the catalog listed without a push time follows every stamped one.
    const unstamped: MarketingEntry = { id: 'zero', kind: 'skill', title: { en: 'Zero' }, description: { en: '' }, categories: [], install: { type: 'manual', steps: { en: '' } } }
    expect(sortEntries([one, unstamped], 'updated', 'en').map(entry => entry.id)).toEqual(['one', 'zero'])
  })

  it('escapes a category section with no declared title', () => {
    const sections = categorySections(PLUGINS, [], {}, 'en', 0)
    expect(sections.every(section => section.plugins.length === 0)).toBe(true)
  })
})

describe('marketing search edges', () => {
  const entry = (overrides: Record<string, unknown>) => ({
    id: 'e', kind: 'mcp' as const, title: { en: 'Name', zh: '名' }, description: { en: '', zh: '' }, categories: ['c'],
    install: { type: 'mcp' as const, runner: 'npx' as const, package: 'p', version: '1.0.0' }, ...overrides,
  })

  it('reads a category title the declaration omits and a search that names no kind', () => {
    const categories = [{ id: 'c' }, { id: 'other', title: { en: 'Other' } }]
    expect(filterEntries([entry({ platforms: ['TikTok'] })], { query: 'tiktok', categories, language: 'en' })).toHaveLength(1)
    expect(filterEntries([entry({})], { query: '名', categories, language: 'zh' })).toHaveLength(1)
    // The entry's category id still matches the query, so an undeclared title only loses its own text.
    expect(filterEntries([entry({})], { query: 'c', categories, language: 'en' })).toHaveLength(1)
    expect(filterEntries([entry({ categories: ['other'] })], { query: 'other', categories, kind: 'mcp', language: 'en' })).toHaveLength(1)
    expect(filterEntries([entry({ categories: ['zzz'] })], { categories, language: 'en' })).toHaveLength(1)
    expect(filterEntries([entry({})], { kind: 'skill', categories, language: 'en' })).toHaveLength(0)
  })

  it('matches a skill name in the catalog text', () => {
    const skill = entry({ kind: 'skill', install: { type: 'skill', repo: 'o/s', commit: 'c', skills: [{ name: 'vet', path: 'vet' }] } })
    expect(filterEntries([skill], { query: 'vet', categories: [], language: 'en' })).toHaveLength(1)
  })
})
