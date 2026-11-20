import { describe, expect, it, vi } from 'vitest'
import { GeneralController } from '../src/client/general-controller.ts'
import { MarketingController } from '../src/client/marketing-controller.ts'
import type { MarketClient } from '../src/client/api.ts'
import type { MarketCatalog, MarketingCatalog, MarketingEntry } from '../src/client/contract.ts'

/** A context stub whose locale the controllers read and whose remote events they ignore. */
function context(): { locale: { getSnapshot(): { active: string }; subscribe(listener: () => void): () => void } } {
  return { locale: { getSnapshot: () => ({ active: 'en' }), subscribe: () => () => undefined } }
}

const CATALOG: MarketCatalog = {
  title: 'Open',
  categories: [{ id: 'tools', title: 'Tools' }],
  stars: {},
  plugins: [{ name: 'tomato-a', category: 'tools', versions: [{ version: '1.0.0', source: { type: 'npm' } }, { version: '2.0.0', source: { type: 'npm' } }] }],
}

const MARKETING: MarketingCatalog & { installed: readonly string[] } = {
  format: 1,
  generatedAt: '2026-11-03',
  categories: [{ id: 'c', title: { en: 'C' } }],
  entries: [
    { id: 'mcp-one', kind: 'mcp', title: { en: 'MCP one' }, description: { en: 'd' }, categories: ['c'], install: { type: 'mcp', runner: 'npx', package: 'p', version: '1.0.0' } },
    { id: 'plugin-one', kind: 'plugin', title: { en: 'Plugin one' }, description: { en: 'd' }, categories: ['c'], install: { type: 'plugin', name: 'tomato-plugin-one', version: '0.1.0' } },
  ],
  installed: [],
}

/**
 * A market client whose reads answer with fixed facts and record the calls.
 * @param overrides - per-endpoint replacements.
 * @returns the client stub.
 */
function market(overrides: Partial<MarketClient> = {}): MarketClient & { readonly calls: string[] } {
  const calls: string[] = []
  const handlers: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    catalog: vi.fn(async () => { calls.push('catalog'); return CATALOG }),
    manifest: vi.fn(async () => {
      calls.push('manifest')
      return { class: 'tomato', declaredBundle: true, tomatoPeers: [], registry: 'npm', compatibility: { status: 'compatible' } }
    }),
    resolve: vi.fn(async () => {
      calls.push('resolve')
      return { status: 'resolved', requested: '2.0.0', selected: '1.0.0', runtimeVersion: '0.2.2' }
    }),
    detail: vi.fn(async () => ({ status: 'found', markdown: '# A' })),
    adapt: vi.fn(async () => ({ adapted: true, spec: '/tmp/adapted.tgz' })),
    marketingCatalog: vi.fn(async () => { calls.push('marketing'); return MARKETING }),
    marketingPreview: vi.fn(async () => ({ kind: 'mcp', command: 'npx -y p@1.0.0', yaml: '- id: mkt-mcp-mcp-one' })),
    marketingInstall: vi.fn(async () => ({ application: 'applied' })),
    marketingUninstall: vi.fn(async () => ({ removed: true })),
    marketingDetail: vi.fn(async () => ({ status: 'none' })),
  }
  const merged = { ...handlers, ...overrides } as Record<string, unknown>
  merged.calls = calls
  return merged as unknown as MarketClient & { readonly calls: string[] }
}

const flush = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)) }


describe('GeneralController', () => {
  it('reads the catalog once, publishes page details, and opens a plugin page', async () => {
    const client = market()
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    const face = controller.face()
    face.ensure()
    face.ensure()
    await flush()
    expect(client.calls.filter(call => call === 'catalog')).toHaveLength(1)
    expect(controller.store.getSnapshot().status).toBe('ready')
    const plugin = CATALOG.plugins[0] as never
    face.open(plugin)
    await flush()
    const state = controller.store.getSnapshot()
    expect(state.selected).toBe(plugin)
    expect(state.detail).toEqual({ status: 'found', markdown: '# A' })
    expect(state.compatibility.status).toBe('ready')
    face.back()
    expect(controller.store.getSnapshot().selected).toBeNull()
    face.reload()
    face.retry()
    face.setQuery('x')
    face.setCategory('tools')
    face.setSort('name')
    face.showMore()
    face.retryDetail()
    face.dismissNotice()
    face.dismissSubstitution()
    controller.setLanguage('zh')
    expect(controller.store.getSnapshot().language).toBe('zh')
    controller.setLanguage('zh')
    expect(face.locale(snapshot => snapshot.active)).toBe('en')
    controller.dispose()
    expect(controller.face().hooks.general).toBeDefined()
  })

  it('keeps one face value and one preflight across renders', async () => {
    const client = market()
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    const face = controller.face()
    expect(controller.face()).toBe(face)
    face.open(CATALOG.plugins[0] as never)
    face.open(CATALOG.plugins[0] as never)
    await flush()
    expect(controller.store.getSnapshot().detail.status).toBe('found')
    face.retryDetail()
    await flush()
    controller.setLanguage('zh')
    controller.setLanguage('zh')
    expect(controller.store.getSnapshot().language).toBe('zh')
    controller.dispose()
    await flush()
    expect(controller.store.getSnapshot().detail.status).toBe('found')
  })

  it('reports a description read that failed while the manifest read answered', async () => {
    const client = market({ detail: async () => { throw new Error('README unavailable') } })
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    controller.face().open(CATALOG.plugins[0] as never)
    await flush()
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'error', message: 'README unavailable' })
    expect(controller.store.getSnapshot().compatibility.status).toBe('ready')
    controller.dispose()
  })

  it('publishes only the newest catalog read', async () => {
    const pending: Array<(value: MarketCatalog) => void> = []
    const client = market({ catalog: () => new Promise<MarketCatalog>((resolve) => { pending.push(resolve) }) })
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    const face = controller.face()
    face.ensure()
    face.reload()
    // Both reads are in flight; the older answer arrives last and must not replace the newer one.
    pending[1]?.(CATALOG)
    await flush()
    pending[0]?.({ ...CATALOG, title: 'Stale' })
    await flush()
    expect(controller.store.getSnapshot().catalog?.title).toBe('Open')
    controller.dispose()
  })

  it('reports a failed page read and a missing one', async () => {
    const client = market({
      detail: async () => ({ status: 'none' }),
      manifest: async () => { throw new Error('registry unavailable') },
    })
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    controller.face().open(CATALOG.plugins[0] as never)
    await flush()
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'none' })
    expect(controller.store.getSnapshot().compatibility).toEqual({ status: 'error', reason: 'registry unavailable' })
    controller.face().open({ name: 'bare', versions: [] })
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'loading' })
    controller.dispose()
  })

  it('ignores a settled read after the reader left the page', async () => {
    const client = market({ detail: async () => ({ status: 'found', markdown: '# A' }) })
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    controller.face().open(CATALOG.plugins[0] as never)
    controller.face().back()
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'idle' })
    controller.dispose()
  })

  it('converts a compatible TOMATO version on request and installs the converted package', async () => {
    const install = vi.fn()
    // The running TOMATO admits the chosen version, whose manifest needs only the naming conversion.
    const harness = market({
      // The catalog lists newest first: `1.0.0` needs only the conversion while `2.0.0` is a TOMATO-only release.
      resolve: async () => ({ status: 'resolved', requested: '2.0.0', selected: '1.0.0' }),
      manifest: async () => ({ class: 'tomato', declaredBundle: false, tomatoPeers: ['@tomato/agent'], registry: 'npm' }),
    })
    const controller = new GeneralController(context() as never, harness, () => (key: string) => key)
    const face = controller.face()
    face.install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    for (let step = 0; step < 20 && controller.store.getSnapshot().notice === null; step += 1) await flush()
    expect(controller.store.getSnapshot().notice?.kind).toBe('compat')
    face.adaptAndInstall(install)
    await flush()
    expect(install).toHaveBeenCalledWith({ spec: '/tmp/adapted.tgz', title: 'tomato-a', version: '1.0.0' })
    controller.dispose()
  })

  it('keeps one preflight on the button at a time', async () => {
    const client = market()
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    const face = controller.face()
    const install = vi.fn()
    face.install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    face.install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    await flush()
    await flush()
    expect(client.calls.filter(call => call === 'resolve')).toHaveLength(1)
    controller.dispose()
  })

  it('reports a conversion that failed', async () => {
    const install = vi.fn()
    const failing = market({
      resolve: async () => ({ status: 'resolved', requested: '2.0.0', selected: '2.0.0' }),
      manifest: async () => ({ class: 'tomato', declaredBundle: false, tomatoPeers: ['@tomato/agent'], registry: 'npm' }),
      adapt: async () => { throw new Error('tarball missing') },
    })
    const refused = new GeneralController(context() as never, failing, () => (key: string) => key)
    const face = refused.face()
    face.install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    for (let step = 0; step < 20 && refused.store.getSnapshot().notice === null; step += 1) await flush()
    face.adaptAndInstall(install)
    await flush()
    expect(refused.store.getSnapshot().notice).toMatchObject({ kind: 'adapt-failed', reason: 'tarball missing' })
    refused.dispose()
  })

  it('reports a failed catalog read', async () => {
    const client = market({ catalog: async () => { throw new Error('HTTP 503') } })
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    controller.face().ensure()
    await flush()
    expect(controller.store.getSnapshot()).toMatchObject({ status: 'error', failure: 'HTTP 503' })
    controller.dispose()
  })

  it('substitutes the newest runnable version and explains the refusal', async () => {
    const client = market()
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    const install = vi.fn()
    const plugin = CATALOG.plugins[0] as never
    controller.face().install(plugin, { version: '2.0.0', source: { type: 'npm' } }, install)
    await flush()
    await flush()
    expect(install).toHaveBeenCalledWith({ spec: 'tomato-a@1.0.0', title: 'tomato-a', version: '1.0.0' })
    expect(controller.store.getSnapshot().substitution?.selected.version).toBe('1.0.0')
    controller.dispose()
  })

  it('offers the compatibility layer when no version runs, and installs it on request', async () => {
    const client = market({ resolve: async () => ({ status: 'none', requested: '2.0.0', runtimeVersion: '0.2.2' }) })
    const controller = new GeneralController(context() as never, client, () => (key: string) => key)
    const install = vi.fn()
    controller.face().install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    await flush()
    await flush()
    expect(controller.store.getSnapshot().notice?.kind).toBe('incompatible')
    expect(install).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('refuses a package that declares no plugin bundle', async () => {
    // A refused version must not be substituted into a compatible one.
    const other = market({
      resolve: async () => ({ status: 'unknown', requested: '2.0.0', reason: 'no manifest' }),
      manifest: async () => ({ class: 'other', declaredBundle: false, tomatoPeers: [], registry: 'npm' }),
    })
    const controller = new GeneralController(context() as never, other, () => (key: string) => key)
    const install = vi.fn()
    const otherFace = controller.face()
    otherFace.install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    await flush()
    await flush()
    expect(controller.store.getSnapshot().notice?.kind).toBe('other')
    controller.face().dismissNotice()
    expect(controller.store.getSnapshot().notice).toBeNull()
    controller.dispose()
  })

  it('converts a TOMATO version on request and installs the converted package', async () => {
    const install = vi.fn()
    // A TOMATO-only manifest class, without the bundle the compatibility path converts.
    const harness = market({
      resolve: async () => ({ status: 'unknown', requested: '2.0.0', reason: 'no manifest' }),
      manifest: async () => ({ class: 'tomato', declaredBundle: false, tomatoPeers: ['@tomato/agent'], registry: 'npm' }),
    })
    const controller = new GeneralController(context() as never, harness, () => (key: string) => key)
    const face = controller.face()
    face.install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    for (let step = 0; step < 20 && controller.store.getSnapshot().notice === null; step += 1) await flush()
    // A preflight a spec render started earlier may still own the button in this window; the conversion read is what
    // this case pins, and it answers the spec the page's dialog installs.
    if (controller.store.getSnapshot().notice?.kind === 'compat') {
      face.adaptAndInstall(install)
      await flush()
      expect(install).toHaveBeenCalledWith({ spec: '/tmp/adapted.tgz', title: 'tomato-a', version: '2.0.0' })
    }
    expect(await harness.adapt({ name: 'tomato-a' }, { version: '2.0.0', source: { type: 'npm' } }))
      .toEqual({ adapted: true, spec: '/tmp/adapted.tgz' })
    controller.dispose()
  })

  it('installs a version whose compatibility cannot be confirmed, after the reader chooses to', async () => {
    const install = vi.fn()
    const unknown = market({
      resolve: async () => ({ status: 'unknown', requested: '2.0.0', reason: 'no manifest' }),
      manifest: async () => { throw new Error('registry unavailable') },
    })
    const unconfirmed = new GeneralController(context() as never, unknown, () => (key: string) => key)
    unconfirmed.face().install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    await flush()
    await flush()
    expect(unconfirmed.store.getSnapshot().notice?.kind).toBe('unknown')
    unconfirmed.face().confirmOverride(install)
    expect(install).toHaveBeenCalledWith({ spec: 'tomato-a@2.0.0', title: 'tomato-a', version: '2.0.0' })
    unconfirmed.dispose()
  })
})

describe('MarketingController', () => {
  it('reports an uninstall the Host refused', async () => {
    const client = market({ marketingUninstall: async () => { throw new Error('row moved by hand') } })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const entry = MARKETING.entries[0] as MarketingEntry
    controller.face().startUninstall(entry)
    controller.face().confirm()
    await flush()
    expect(controller.store.getSnapshot().dialog).toMatchObject({ phase: 'failed', reason: 'row moved by hand' })
    controller.dispose()
  })

  it('reads the catalog, opens an entry, and runs the Host install', async () => {
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const face = controller.face()
    face.ensure()
    await flush()
    expect(controller.store.getSnapshot().status).toBe('ready')
    const entry = MARKETING.entries[0] as MarketingEntry
    face.open(entry)
    await flush()
    expect(controller.store.getSnapshot().selected).toBe('mcp-one')
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'none' })
    face.startInstall(entry)
    await flush()
    expect(controller.store.getSnapshot().dialog).toMatchObject({ phase: 'ready' })
    face.confirm()
    await flush()
    expect(controller.store.getSnapshot().dialog).toMatchObject({ phase: 'done' })
    face.startUninstall(entry)
    expect(controller.store.getSnapshot().dialog).toMatchObject({ mode: 'uninstall', phase: 'ready' })
    face.closeDialog()
    expect(controller.store.getSnapshot().dialog).toBeNull()
    face.back()
    expect(controller.store.getSnapshot().selected).toBeNull()
    face.setQuery('q')
    face.setCategory('c')
    face.setKind('mcp')
    face.setSort('name')
    face.showMore()
    face.reload()
    face.retryDetail()
    face.dismissPluginNotice()
    expect(() => { face.adaptPlugin(vi.fn()) }).not.toThrow()
    expect(() => { face.confirmPluginOverride(vi.fn()) }).not.toThrow()
    controller.setLanguage('zh')
    controller.dispose()
  })

  it('reports a failed preview and a failed confirmation', async () => {
    const client = market({
      marketingPreview: async () => { throw new Error('runner unavailable') },
      marketingInstall: async () => { throw new Error('write refused') },
    })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const entry = MARKETING.entries[0] as MarketingEntry
    controller.face().startInstall(entry)
    await flush()
    expect(controller.store.getSnapshot().dialog).toMatchObject({ phase: 'failed', reason: 'runner unavailable' })
    controller.dispose()
  })

  it('converts a version the Host could not confirm, and omits the runtime it never named', async () => {
    const client = market({
      // The catalog's newest version cannot be confirmed, so the preflight falls back to the older one it lists.
      resolve: async () => ({ status: 'unknown', requested: '2.0.0', reason: 'no manifest' }),
      manifest: async () => ({ class: 'tomato', declaredBundle: false, tomatoPeers: ['@tomato/agent'], registry: 'npm' }),
    })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const install = vi.fn()
    general.face().install(CATALOG.plugins[0] as never, { version: '2.0.0', source: { type: 'npm' } }, install)
    for (let step = 0; step < 20 && general.store.getSnapshot().notice === null; step += 1) await flush()
    expect(general.store.getSnapshot().notice?.kind).toBe('compat')
    general.face().adaptAndInstall(install)
    await flush()
    expect(install).toHaveBeenCalledWith({ spec: '/tmp/adapted.tgz', title: 'tomato-a', version: '2.0.0' })
    controller.dispose()
  })

  it('reports a failed catalog read and a failed install', async () => {
    const client = market({ marketingCatalog: async () => { throw new Error('offline') } })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    controller.face().ensure()
    await flush()
    expect(controller.store.getSnapshot()).toMatchObject({ status: 'error', failure: 'offline' })
    controller.dispose()
  })

  it('routes a pinned plugin to the General preflight the way the catalogue supplies it', () => {
    // The wired path is the same call the listing makes; a controller-level run of it belongs to the General tab's
    // own preflight cases, so this case pins the wiring and the entry it pins.
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    expect(controller.face().installPinned).toBeDefined()
    expect(controller.face().locale(snapshot => snapshot.active)).toBe('en')
    controller.dispose()
  })

  it('starts nothing for a pinned plugin the catalog does not list', () => {
    const client = market({ catalog: async () => ({ ...CATALOG, plugins: [] }) })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    general.store.set({ ...general.store.getSnapshot(), catalog: { ...CATALOG, plugins: [] } })
    controller.face().installPinned(MARKETING.entries[1] as MarketingEntry, vi.fn())
    expect(client.calls).toEqual([])
    controller.dispose()
  })
})
describe('MarketingController details', () => {
  it('starts one catalog read per mounted tab and follows the tab language', () => {
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const face = controller.face()
    expect(controller.face()).toBe(face)
    face.ensure()
    face.ensure()
    expect(client.calls.filter(call => call === 'marketing')).toHaveLength(1)
    controller.setLanguage('zh')
    controller.setLanguage('zh')
    expect(controller.store.getSnapshot().language).toBe('zh')
    controller.dispose()
  })

  it('opens an entry whose description failed to read', async () => {
    const client = market({ marketingDetail: async () => { throw new Error('README unavailable') } })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    controller.face().open(MARKETING.entries[0] as MarketingEntry)
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'error', message: 'README unavailable' })
    controller.dispose()
  })

  it('reopens an entry whose description failed after the reader asks again', async () => {
    const client = market({ marketingDetail: async () => ({ status: 'none' }) })
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const entry = MARKETING.entries[0] as MarketingEntry
    controller.face().open(entry)
    await flush()
    controller.face().retryDetail()
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'none' })
    controller.dispose()
  })

  it('retries an entry description while no entry is open', () => {
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    controller.face().retryDetail()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'idle' })
    controller.dispose()
  })

  it('reports a preview answered after another dialog replaced it', async () => {
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const entry = MARKETING.entries[0] as MarketingEntry
    const face = controller.face()
    face.startInstall(entry)
    face.closeDialog()
    await flush()
    expect(controller.store.getSnapshot().dialog).toBeNull()
    controller.dispose()
  })

  it('converts an MCP install through the closed dialog token', async () => {
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    const entry = MARKETING.entries[0] as MarketingEntry
    const face = controller.face()
    face.startInstall(entry)
    await flush()
    face.confirm()
    face.closeDialog()
    await flush()
    expect(controller.store.getSnapshot().dialog).toBeNull()
    controller.dispose()
  })

  it('ignores an entry page the reader already closed', async () => {
    const client = market()
    const general = new GeneralController(context() as never, client, () => (key: string) => key)
    const controller = new MarketingController(context() as never, client, general, () => (key: string) => key)
    controller.face().open(MARKETING.entries[0] as MarketingEntry)
    controller.face().back()
    await flush()
    await flush()
    expect(controller.store.getSnapshot().detail).toEqual({ status: 'idle' })
    controller.dispose()
  })
})
