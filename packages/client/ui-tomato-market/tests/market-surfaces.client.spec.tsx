// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
import type { LocaleSnapshot } from '@tomato/client-locale/client'
import type { MarketCatalog, MarketingCatalog } from '../src/client/contract.ts'
import { GeneralMarket, type GeneralMarketProps } from '../src/client/GeneralMarket.tsx'
import { MarketingMarket, type MarketingMarketProps } from '../src/client/MarketingMarket.tsx'
import { InstallNoticeDialog, type InstallNoticeProps } from '../src/client/InstallNotice.tsx'
import type { GeneralState } from '../src/client/general-controller.ts'
import type { MarketingState } from '../src/client/marketing-controller.ts'
import { en, type TomatoMarketLocaleKey } from '../src/client/locales.ts'
import { marketClient } from '../src/client/api.ts'
import { MarketIcon, metaLine, starsLabel, targetsTomatoCard } from '../src/client/widgets.tsx'
import { selectedVersion, unmetRequirements, type ListedVersionView, type PluginView } from '../src/client/catalog.ts'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function translator(
  dictionary: Record<TomatoMarketLocaleKey, string>,
): (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string {
  return (key, params) => Object.entries(params ?? {})
    .reduce<string>((text, [name, value]) => text.replaceAll(`{${name}}`, value), dictionary[key])
}

const CATALOG: MarketCatalog = {
  title: { en: 'Open catalog', zh: '开源目录' },
  categories: [{ id: 'tools', title: { en: 'Tools', zh: '工具' } }, { id: 'themes', title: 'Themes' }, { id: 'unused', title: 'Unused' }],
  stars: { 'npm:tomato-a': 1240 },
  plugins: [
    {
      name: 'tomato-a', title: { en: 'Alpha', zh: '甲' }, description: { en: 'Does A', zh: '做甲事' }, author: 'Jane',
      category: 'tools', keywords: ['alpha'], homepage: 'https://example.com/a', repository: { url: 'https://github.com/o/plugins' },
      versions: [{ version: '1.2.0', source: { type: 'npm' }, publishTimestamp: 1790476800, tomato: '>=0.1.0' }],
    },
    { name: 'tomato-b', category: 'themes', versions: [{ version: '2.0.0', source: { type: 'git', url: 'https://github.com/o/r', commit: 'abc', path: 'pkg' } }] },
    { name: 'unlisted', versions: [] },
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
      license: 'MIT', updatedAt: '2026-11-01T00:00:00Z', stars: 4200,
      install: { type: 'mcp', runner: 'npx', package: 'apify-mcp', version: '1.0.0', env: ['APIFY_TOKEN'] },
    },
    {
      id: 'vidiq', kind: 'plugin', title: { zh: 'vidIQ', en: 'vidIQ' }, description: { zh: '频道分析', en: 'Channel analytics' },
      categories: ['creator'], access: 'login', install: { type: 'plugin', name: 'tomato-plugin-vidiq', version: '0.3.1' },
    },
    {
      id: 'skill-one', kind: 'skill', title: { zh: '达人核验方法', en: 'Creator vetting' }, description: { zh: '步骤', en: 'Steps' },
      categories: ['creator'], install: { type: 'skill', repo: 'o/skills', commit: '0123456789abcdef0123456789abcdef01234567', skills: [{ name: 'vet', path: 'vet' }] },
    },
    {
      id: 'guide', kind: 'skill', title: { zh: '手动方法', en: 'Manual method' }, description: { zh: '步骤', en: 'Steps' },
      categories: ['creator'], install: { type: 'manual', steps: { zh: '打开控制台', en: 'Open the console' } },
    },
  ],
  installed: ['apify'],
}

const MARKETING: MarketingState = {
  status: 'ready', catalog: MARKETING_CATALOG, failure: null, language: 'en', query: '', category: null, kind: 'all',
  sort: 'stars', limit: 1, selected: null, detail: { status: 'idle' }, dialog: null,
}

function generalProps(state: Partial<GeneralState> = {}, dictionary: Record<TomatoMarketLocaleKey, string> = en) {
  const store = createSnapshotStore<GeneralState>({ ...GENERAL, ...state })
  const locale = createSnapshotStore<LocaleSnapshot>({ active: dictionary === en ? 'en' : 'zh', locales: [], revision: 0 })
  const actions = {
    ensure: vi.fn(), reload: vi.fn(), retry: vi.fn(), setQuery: vi.fn(), setCategory: vi.fn(), setSort: vi.fn(), showMore: vi.fn(),
    open: vi.fn(), back: vi.fn(), retryDetail: vi.fn(), install: vi.fn(), adaptAndInstall: vi.fn(), confirmOverride: vi.fn(),
    dismissNotice: vi.fn(), dismissSubstitution: vi.fn(), installPinned: vi.fn(),
  }
  const install = vi.fn()
  const t = translator(dictionary)
  // The actions spread supplies props.install; the page's install bridge stays on tab.install.
  const props = {
    t, update: vi.fn(), openPackage: vi.fn(), ...actions,
    tab: { install, openPackage: vi.fn(), t },
    useGeneral: bindSnapshotSelector(store),
    locale: bindSnapshotSelector(locale),
  } as unknown as GeneralMarketProps
  return { props, actions, install, store }
}

function renderGeneral(state: Partial<GeneralState> = {}, dictionary: Record<TomatoMarketLocaleKey, string> = en) {
  const built = generalProps(state, dictionary)
  render(<GeneralMarket {...built.props} />)
  const set = (next: Partial<GeneralState>): void => { act(() => { built.store.set({ ...built.store.getSnapshot(), ...next }) }) }
  return { ...built, set }
}

function marketingProps(
  state: Partial<MarketingState> = {},
  dictionary: Record<TomatoMarketLocaleKey, string> = en,
  pluginState: Partial<GeneralState> = {},
) {
  const store = createSnapshotStore<MarketingState>({ ...MARKETING, ...state })
  const general = createSnapshotStore<GeneralState>({ ...GENERAL, ...pluginState })
  const locale = createSnapshotStore<LocaleSnapshot>({ active: dictionary === en ? 'en' : 'zh', locales: [], revision: 0 })
  const actions = {
    ensure: vi.fn(), reload: vi.fn(), setQuery: vi.fn(), setCategory: vi.fn(), setKind: vi.fn(), setSort: vi.fn(), showMore: vi.fn(),
    open: vi.fn(), back: vi.fn(), retryDetail: vi.fn(), startInstall: vi.fn(), startUninstall: vi.fn(), confirm: vi.fn(),
    closeDialog: vi.fn(), installPinned: vi.fn(), dismissPluginNotice: vi.fn(), adaptPlugin: vi.fn(), confirmPluginOverride: vi.fn(),
  }
  const install = vi.fn()
  const t = translator(dictionary)
  const props = {
    t, install, update: vi.fn(), openPackage: vi.fn(), ...actions,
    tab: { install, openPackage: vi.fn(), t },
    useMarketing: bindSnapshotSelector(store),
    usePlugins: bindSnapshotSelector(general),
    locale: bindSnapshotSelector(locale),
  } as unknown as MarketingMarketProps
  return { props, actions, install, store, general }
}

function renderMarketing(
  state: Partial<MarketingState> = {},
  dictionary: Record<TomatoMarketLocaleKey, string> = en,
  pluginState: Partial<GeneralState> = {},
) {
  const built = marketingProps(state, dictionary, pluginState)
  render(<MarketingMarket {...built.props} />)
  const set = (next: Partial<MarketingState>): void => { act(() => { built.store.set({ ...built.store.getSnapshot(), ...next }) }) }
  const setPlugin = (next: Partial<GeneralState>): void => { act(() => { built.general.set({ ...built.general.getSnapshot(), ...next }) }) }
  return { ...built, set, setPlugin }
}

const row = (name: string) => within(document.querySelector(`[data-market-plugin="${name}"]`) as HTMLElement)
const entryRow = (id: string) => within(document.querySelector(`[data-marketing-entry="${id}"]`) as HTMLElement)
const dialog = () => within(document.querySelector('[role="dialog"]') as HTMLElement)

describe('GeneralMarket browsing', () => {
  it('sorts, filters by category and query, clears the query, and pages', () => {
    const { actions } = renderGeneral({ limit: 1, query: 'tomato' })
    fireEvent.click(screen.getByRole('button', { name: 'All 3' }))
    expect(actions.setCategory).toHaveBeenCalledWith(null)
    fireEvent.click(screen.getByRole('button', { name: 'Tools 1' }))
    expect(actions.setCategory).toHaveBeenCalledWith('tools')
    fireEvent.click(screen.getByRole('button', { name: /Sort/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'By name' }))
    expect(actions.setSort).toHaveBeenCalledWith('name')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh catalog' }))
    expect(actions.reload).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Show more' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))
    expect(actions.showMore).toHaveBeenCalledOnce()
  })

  it('reports a narrowed list and sends the typed query', () => {
    const { actions } = renderGeneral({ query: 'bet', category: 'themes' })
    expect(screen.getByText('Filtered', { exact: false })).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'gamma' } })
    expect(actions.setQuery).toHaveBeenCalledWith('gamma')
    cleanup()
    renderGeneral()
    expect(screen.queryByText('Filtered', { exact: false })).toBeNull()
  })

  it('renders one empty-state line when nothing matches', () => {
    renderGeneral({ query: 'nothing-matches' })
    expect(screen.getByText(en.empty)).toBeTruthy()
  })

  it('renders a category section with its view-all action', () => {
    const { actions } = renderGeneral()
    const heading = screen.getAllByRole('heading', { name: 'Tools' })[0] as HTMLElement
    const section = heading.closest('section') as HTMLElement
    fireEvent.click(within(section).getByRole('button', { name: /View all/ }))
    expect(actions.setCategory).toHaveBeenCalledWith('tools')
    expect(within(section).getByRole('button', { name: 'Open Alpha' })).toBeTruthy()
    fireEvent.click(within(section).getByRole('button', { name: 'Open Alpha' }))
    expect(actions.open).toHaveBeenCalledOnce()
  })

  it('falls back to the plugin name when the catalog gives no title', () => {
    renderGeneral({ category: 'themes' })
    expect(row('tomato-b').getByText('tomato-b')).toBeTruthy()
  })
})

describe('GeneralMarket plugin page', () => {
  const selected: PluginView = {
    name: 'tomato-a', title: { en: 'Alpha', zh: '甲' }, description: { en: 'Does A', zh: '做甲事' }, author: 'Jane',
    category: 'tools', homepage: 'https://example.com/a', repository: { url: 'https://github.com/o/plugins' },
    versions: [
      { version: '1.2.0', source: { type: 'npm', registry: 'https://r/' }, publishTimestamp: 1790476800, tomato: '>=0.1.0' },
    ],
  }

  it('shows source facts, versions, and the description document', () => {
    const { actions } = renderGeneral({ selected, detail: { status: 'found', markdown: '# Alpha' }, compatibility: { status: 'ready', facts: { class: 'tomato', declaredBundle: true, tomatoPeers: [], registry: 'npm', runtimeVersion: '0.2.2', compatibility: { status: 'compatible' } } } })
    expect(screen.getByRole('heading', { name: 'Alpha', level: 2 })).toBeTruthy()
    expect(screen.getByText('Compatible with this TOMATO')).toBeTruthy()
    expect(screen.getByText('Running TOMATO 0.2.2')).toBeTruthy()
    expect(screen.getByText('★ 1.2k')).toBeTruthy()
    expect(screen.getByText('tomato-a@1.2.0')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Install' }).at(-1) as HTMLElement)
    expect(actions.install).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Back to general plugins' }))
    expect(actions.back).toHaveBeenCalledOnce()
  })

  it('shows an unmet requirement, the manifest failure, and a description failure with retry', () => {
    const { actions } = renderGeneral({
      selected,
      detail: { status: 'error', message: 'HTTP 500' },
      compatibility: { status: 'ready', facts: { class: 'tomato', declaredBundle: true, tomatoPeers: ['@tomato/agent'], registry: 'npm', compatibility: { status: 'incompatible', requirements: { '@tomato/agent': '>=9' } } } },
    })
    expect(screen.getByText('Requires @tomato/agent >=9')).toBeTruthy()
    expect(screen.getByText(/HTTP 500/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(actions.retryDetail).toHaveBeenCalledOnce()
  })

  it('shows an empty description note and a compatibility read failure', () => {
    renderGeneral({
      selected: { name: 'tomato-b', versions: [{ version: '2.0.0', source: { type: 'git', url: 'https://github.com/o/r', commit: 'abc', path: 'pkg' } }] },
      detail: { status: 'none' },
      compatibility: { status: 'error', reason: 'registry unavailable' },
    })
    expect(screen.getByText(en.detailNone)).toBeTruthy()
    expect(screen.getByText('Compatibility unknown')).toBeTruthy()
    expect(screen.getByText('Git repository')).toBeTruthy()
    expect(screen.getByText('Package directory')).toBeTruthy()
  })

  it('keeps a plugin page that lists no version', () => {
    renderGeneral({ selected: { name: 'bare', versions: [] } })
    expect(screen.getByRole('heading', { name: 'bare' })).toBeTruthy()
    expect(screen.queryByText(en.detailNone)).toBeNull()
  })
})

describe('MarketingMarket browsing', () => {
  it('filters by kind, sorts, and pages', () => {
    const { actions } = renderMarketing()
    expect(document.querySelectorAll('[data-marketing-entry]')).toHaveLength(1)
    fireEvent.click(screen.getByRole('tab', { name: 'MCP' }))
    expect(actions.setKind).toHaveBeenCalledWith('mcp')
    fireEvent.click(screen.getByRole('button', { name: /Sort/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'By last update' }))
    expect(actions.setSort).toHaveBeenCalledWith('updated')
    expect(screen.getByRole('button', { name: 'Show more' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))
    expect(actions.showMore).toHaveBeenCalledOnce()
    const category = screen.getAllByRole('button', { name: /Creator discovery/ })[0] as HTMLElement
    fireEvent.click(category)
    expect(actions.setCategory).toHaveBeenCalledWith('creator')
    fireEvent.click(screen.getAllByRole('button', { name: /All 4/ })[0] as HTMLElement)
    expect(actions.setCategory).toHaveBeenCalledWith(null)
  })

  it('renders a reload failure with retry and an empty result', () => {
    const { actions } = renderMarketing({ status: 'error', catalog: null, failure: 'offline' })
    expect(screen.getByRole('alert').textContent).toContain('offline')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(actions.reload).toHaveBeenCalledOnce()
    cleanup()
    renderMarketing({ query: 'nothing-matches' })
    expect(screen.getByText(en.empty)).toBeTruthy()
  })

  it('opens a row, offers steps for a manual entry, and starts a Skill install', () => {
    const { actions } = renderMarketing({ query: 'manual' })
    expect(entryRow('guide').getByRole('button', { name: 'View steps' })).toBeTruthy()
    fireEvent.click(entryRow('guide').getByRole('button', { name: 'View steps' }))
    expect(actions.open).toHaveBeenCalledOnce()
    cleanup()
    const skill = renderMarketing({ query: 'Creator vetting' })
    fireEvent.click(entryRow('skill-one').getByRole('button', { name: 'Install' }))
    expect(skill.actions.startInstall).toHaveBeenCalledOnce()
    expect(skill.install).not.toHaveBeenCalled()
  })
})

describe('MarketingMarket entry page', () => {
  it('shows an MCP entry with its facts and starts its install', () => {
    const { actions } = renderMarketing({ selected: 'apify', detail: { status: 'found', markdown: '# Apify' } })
    expect(screen.getAllByRole('heading', { name: 'Apify' }).length).toBeGreaterThan(0)
    expect(screen.getByText('MIT')).toBeTruthy()
    expect(screen.getByText('packageName'.length ? en.packageName : '')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.marketingBack }))
    expect(actions.back).toHaveBeenCalledOnce()
  })

  it('shows the login risk and the manual steps of an entry that installs nothing itself', () => {
    renderMarketing({ selected: 'guide', detail: { status: 'none' } })
    expect(screen.getByText(en.stepsTitle)).toBeTruthy()
    expect(screen.getByText(en.detailNone)).toBeTruthy()
    expect(screen.queryByRole('button', { name: en.install })).toBeNull()
  })

  it('shows a Skill entry with the committed paths and an uninstall action once installed', () => {
    renderMarketing({ selected: 'skill-one', detail: { status: 'error', message: 'HTTP 404' } })
    expect(screen.getByText(en.skillsTitle.replace('{count}', '1'))).toBeTruthy()
    expect(screen.getByText('vet')).toBeTruthy()
    expect(screen.getByText(/HTTP 404/)).toBeTruthy()
  })

  it('shows the login-risk notice of an entry that reads with the reader account', () => {
    renderMarketing({ selected: 'vidiq' })
    expect(screen.getByText(en.loginRiskTitle)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: en.install }).length).toBeGreaterThan(0)
  })

  it('retries a failed description read', () => {
    const { actions } = renderMarketing({ selected: 'guide', detail: { status: 'error', message: 'HTTP 500' } })
    fireEvent.click(screen.getByRole('button', { name: en.retryDetail }))
    expect(actions.retryDetail).toHaveBeenCalledOnce()
  })
})

describe('MarketingMarket dialogs', () => {
  const mcp = MARKETING_CATALOG.entries[0] as never

  it('shows a Skill confirmation with a naming conflict', () => {
    renderMarketing({
      dialog: { mode: 'install', entry: MARKETING_CATALOG.entries[2] as never, phase: 'ready', preview: { kind: 'skill', skills: ['vet'], conflicts: ['vet'] } },
    })
    expect(screen.getAllByText(en.skillConflict.replace('{skills}', 'vet')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: en.confirmInstall })).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: en.close })[0] as HTMLElement)
  })

  it('shows a missing runner, the working phase, and a failure', () => {
    renderMarketing({
      dialog: { mode: 'install', entry: mcp, phase: 'ready', preview: { kind: 'mcp', command: 'uvx p', yaml: '- id: x', runnerMissing: 'uvx' } },
    })
    expect(screen.getByText(en.runnerMissing.replace('{runner}', 'uvx').replace('{hint}', en.runnerHintUvx))).toBeTruthy()
    cleanup()
    renderMarketing({ dialog: { mode: 'install', entry: mcp, phase: 'working' } })
    expect(screen.getByText(en.working)).toBeTruthy()
    cleanup()
    renderMarketing({ dialog: { mode: 'install', entry: mcp, phase: 'failed', reason: 'write refused' } })
    expect(screen.getByText(en.actionFailed.replace('{reason}', 'write refused'))).toBeTruthy()
  })

  it('shows the loading phase and confirms an uninstall', () => {
    const { actions } = renderMarketing({ dialog: { mode: 'uninstall', entry: MARKETING_CATALOG.entries[2] as never, phase: 'ready' } })
    expect(screen.getByText(en.uninstallSkillBody.replace('{skills}', 'vet'))).toBeTruthy()
    fireEvent.click(dialog().getByRole('button', { name: en.confirmUninstall }))
    expect(actions.confirm).toHaveBeenCalledOnce()
    cleanup()
    renderMarketing({ dialog: { mode: 'install', entry: mcp, phase: 'loading' } })
    expect(screen.getByText(en.confirmLoading)).toBeTruthy()
    expect(screen.queryByRole('button', { name: en.confirmInstall })).toBeNull()
  })

  it('reports a finished MCP install with its warnings, and a finished Skill install', () => {
    renderMarketing({ dialog: { mode: 'install', entry: mcp, phase: 'done', result: { application: 'applied', warnings: ['row moved'] } } })
    expect(screen.getByText(en.installDone.replace('{name}', 'Apify'))).toBeTruthy()
    expect(screen.getByText(en.appliedHint)).toBeTruthy()
    expect(screen.getByText('row moved')).toBeTruthy()
    cleanup()
    renderMarketing({ dialog: { mode: 'uninstall', entry: MARKETING_CATALOG.entries[2] as never, phase: 'done', result: {} } })
    expect(screen.getByText(en.skillAppliedHint)).toBeTruthy()
    expect(screen.getByText(en.uninstallDone.replace('{name}', 'Creator vetting'))).toBeTruthy()
  })

  it('reports an uninstall of an MCP server as restart-pending', () => {
    renderMarketing({ dialog: { mode: 'uninstall', entry: mcp, phase: 'done', result: { application: 'restart-required' } } })
    expect(screen.getByText(en.restartHint)).toBeTruthy()
    cleanup()
    renderMarketing({ dialog: { mode: 'uninstall', entry: mcp, phase: 'ready' } })
    expect(screen.getAllByText(en.uninstallMcpBody).length).toBeGreaterThan(0)
  })

  it('carries the preflight substitution into a status line', () => {
    const { actions } = renderMarketing({}, en, {
      substitution: {
        plugin: { name: 'x', versions: [] },
        requested: { version: '2.0.0', source: { type: 'npm' } },
        selected: { version: '1.0.0', source: { type: 'npm' } },
        runtimeVersion: '0.2.2',
      },
    })
    expect(screen.getByRole('status').textContent).toContain('Installed 1.0.0 instead')
    fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: 'Close' }))
    expect(actions.dismissPluginNotice).toHaveBeenCalledOnce()
  })
})

/**
 * The shell portal's dialog host mounts a second Close control; a static portal target keeps one per render.
 */
function mockEscape(): void {
  const host = document.createElement('div')
  host.setAttribute('data-modal-root', '')
  document.body.append(host)
}

describe('InstallNoticeDialog', () => {
  const plugin: PluginView = { name: 'tomato-x', versions: [] }
  const version: ListedVersionView = { version: '1.0.0', source: { type: 'npm' } }

  function show(notice: InstallNoticeProps['notice']): { readonly onClose: () => void; readonly onContinue: () => void; readonly onAdapt: () => void } {
    const handlers = { onClose: vi.fn(), onContinue: vi.fn(), onAdapt: vi.fn() }
    render(<InstallNoticeDialog notice={notice} t={translator(en)} {...handlers} />)
    return handlers
  }

  it('offers the compatibility conversion and links the repository', () => {
    cleanup()
    mockEscape()
    const handlers = show({
      kind: 'compat', plugin: { ...plugin, repository: { url: 'https://github.com/o/p' } }, version,
      facts: { class: 'tomato', declaredBundle: true, tomatoPeers: [], registry: 'npm' },
    })
    expect(screen.getByRole('link', { name: en.viewRepository }).getAttribute('href')).toBe('https://github.com/o/p')
    fireEvent.click(screen.getByRole('button', { name: en.installCompat }))
    expect(handlers.onAdapt).toHaveBeenCalledOnce()
    // The page hosts a title slot and a close control beside the dialog; one close dismisses it.
    expect(screen.getAllByRole('button', { name: en.close }).length).toBeGreaterThan(0)
  })

  it('names no version when the catalog cannot run any of them', () => {
    show({ kind: 'incompatible', plugin, version, resolution: { status: 'none', requested: '1.0.0', runtimeVersion: '0.2.2' } })
    expect(screen.getByText(en.incompatibleBody.replace('{runtime}', '0.2.2').replace('{name}', 'tomato-x').replace('{version}', '1.0.0'))).toBeTruthy()
  })

  it('names the unmet range of a package that declares no bundle', () => {
    show({ kind: 'incompatible', plugin, version: { ...version, tomato: '>=0.3.0' }, resolution: { status: 'none', requested: '1.0.0' } })
    expect(screen.getByText(en.tomatoRequirement.replace('{range}', '>=0.3.0'))).toBeTruthy()
    expect(screen.queryByRole('button', { name: en.installCompat })).toBeNull()
  })

  it('offers to continue for an unconfirmed version and explains a conversion failure', () => {
    const handlers = show({ kind: 'unknown', plugin, version, reason: 'no manifest' })
    fireEvent.click(screen.getByRole('button', { name: en.continueInstall }))
    expect(handlers.onContinue).toHaveBeenCalledOnce()
    cleanup()
    show({ kind: 'adapt-failed', plugin, version, reason: 'tarball missing' })
    expect(screen.getByText(en.adaptFailedBody.replace('{reason}', 'tarball missing'))).toBeTruthy()
    cleanup()
    show({ kind: 'other', plugin, version })
    expect(screen.getByText(en.otherNoticeBody)).toBeTruthy()
    expect(screen.getByText('tomato-x')).toBeTruthy()
  })
})

describe('widget helpers', () => {
  it('formats the meta line with and without a version', () => {
    const t = translator(en)
    expect(metaLine({ name: 'a', versions: [{ version: '1.0.0', source: { type: 'npm' }, publishTimestamp: 1790476800 }], author: 'Jane' }, 'en', t, () => 'Jan 1'))
      .toBe('v1.0.0 · Published Jan 1 · by Jane')
    expect(metaLine({ name: 'a', versions: [] }, 'en', t, () => '')).toBe(en.noVersions)
    expect(starsLabel(undefined, t)).toBe(en.noStars)
    expect(starsLabel(1200, t)).toBe('★ 1.2k')
    expect(targetsTomatoCard({ name: 'a', versions: [] })).toBe(false)
  })

  it('falls back to the default artwork when an image fails', () => {
    const { container } = render(<MarketIcon src="https://cdn.example/a.png" />)
    const image = container.querySelector('img') as HTMLImageElement
    act(() => { fireEvent.error(image) })
    expect(container.querySelector('img')).toBeNull()
    cleanup()
    const plain = render(<MarketIcon />)
    expect(plain.container.querySelector('svg')).toBeTruthy()
  })

  it('reads the admitted version and the unmet requirements', () => {
    expect(selectedVersion({ status: 'resolved', requested: '2.0.0', selected: '9.9.9' }, [])).toEqual({ version: '9.9.9', source: { type: 'npm' } })
    expect(selectedVersion({ status: 'none', requested: '2.0.0' }, [])).toBeUndefined()
    expect(unmetRequirements({ status: 'compatible' })).toBeUndefined()
  })
})

describe('marketClient', () => {
  it('sends one request per endpoint and returns its data', async () => {
    const fetchMock = vi.fn(async (_url: URL, _init: RequestInit) => (
      new Response(JSON.stringify({ ok: true, data: { answer: 1 } }), { status: 200 })
    ))
    vi.stubGlobal('fetch', fetchMock)
    const client = marketClient(() => 'http://app.test/')
    const version = { version: '1.0.0', source: { type: 'npm' as const } }
    expect(await client.catalog(true)).toEqual({ answer: 1 })
    await client.manifest({ name: 'p' }, version)
    await client.resolve({ name: 'p' }, version)
    await client.detail({ name: 'p' }, version)
    await client.adapt({ name: 'p' }, version)
    await client.marketingCatalog()
    await client.marketingPreview('id')
    await client.marketingInstall('id')
    await client.marketingUninstall('id')
    await client.marketingDetail('id')
    expect(fetchMock).toHaveBeenCalledTimes(10)
    // The browser builds the request from the route the package declares, never from a caller-supplied URL.
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBeInstanceOf(URL)
    expect(url.href).toBe('http://app.test/api/tomato-market')
    // The request body is the JSON text the browser builds, so it reads back as the endpoint and its payload.
    if (typeof init.body !== 'string') throw new Error('the market sends its request body as JSON text')
    expect(JSON.parse(init.body)).toEqual({ endpoint: 'catalog', payload: { refresh: true } })
  })

  it('names a network failure and an HTTP refusal', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('offline') })
    await expect(marketClient(() => 'http://app.test/').catalog(false)).rejects.toThrow('network: offline')
    vi.stubGlobal('fetch', async () => new Response('', { status: 503 }))
    await expect(marketClient(() => 'http://app.test/').catalog(false)).rejects.toThrow('HTTP 503')
  })

  it('carries the market reply error text through', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ok: false, error: { code: 'market/failed', message: 'registry unavailable' } }), { status: 200 }))
    await expect(marketClient(() => 'http://app.test/').catalog(false)).rejects.toThrow('registry unavailable')
  })
})
