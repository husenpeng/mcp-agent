import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ROUTE, apply, createMarket, readMarketingCatalog } from '../index.js'

/** Mount the plugin against a fake host and return a caller of its route. */
function mount(services = {}) {
  let route
  const disposers = []
  apply({
    connection: { fetch: { register: (options) => { route = options; return () => {} } } },
    effect: (callback) => { disposers.push(callback()) },
    get: name => services[name],
  }, {})
  return {
    route,
    call: async (endpoint, payload) => (await route.fetch(new Request('http://host/', {
      method: 'POST', body: JSON.stringify({ endpoint, payload }),
    }))).json(),
    dispose: () => { for (const dispose of disposers) dispose?.() },
  }
}

const mcpEntry = readMarketingCatalog().entries.find(entry => entry.install.type === 'mcp')

test('the route serves the bundled catalog and marks nothing installed in an empty profile', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-market-route-'))
  const host = mount({ profileContext: { dir: directory, patchPath: join(directory, 'cordis.patch.yml'), home: directory } })
  try {
    assert.equal(host.route.path, ROUTE)
    const { ok, data } = await host.call('marketing-catalog')
    assert.equal(ok, true)
    assert.equal(data.entries.length, 107)
    assert.deepEqual(data.installed, [])
  } finally {
    host.dispose()
    await rm(directory, { recursive: true, force: true })
  }
})

test('the browser chooses an entry, never a command', async () => {
  const host = mount()
  try {
    const refused = await host.call('marketing-install', { id: '../../evil' })
    assert.deepEqual([refused.ok, refused.error.message], [false, 'invalid entry id'])
    const unknown = await host.call('marketing-install', { id: 'not-in-the-catalog', command: 'rm', args: ['-rf'] })
    assert.equal(unknown.error.message, 'not-in-the-catalog is not in the marketing catalog')
    const manual = readMarketingCatalog().entries.find(entry => entry.install.type === 'manual')
    assert.match((await host.call('marketing-install', { id: manual.id })).error.message, /no one-click install/)
    assert.match((await host.call('marketing-uninstall', { id: manual.id })).error.message, /no one-click removal/)
  } finally {
    host.dispose()
  }
})

test('MCP installs need a profile', async () => {
  const host = mount()
  try {
    assert.match((await host.call('marketing-install', { id: mcpEntry.id })).error.message, /without one/)
  } finally {
    host.dispose()
  }
})

test('the preview shows the row that install writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-market-route-'))
  const patchPath = join(directory, 'cordis.patch.yml')
  await writeFile(patchPath, '[]\n')
  const market = createMarket({ home: directory }, { profile: { dir: directory, patchPath, home: directory } })
  try {
    const preview = await market.marketingPreview(mcpEntry.id)
    await market.marketingInstall(mcpEntry.id)
    assert.equal(await readFile(patchPath, 'utf8'), preview.yaml)
    assert.deepEqual((await market.marketingCatalog()).installed, [mcpEntry.id])
    await market.marketingUninstall(mcpEntry.id)
    assert.equal(await readFile(patchPath, 'utf8'), '[]\n')
  } finally {
    market.dispose()
    await rm(directory, { recursive: true, force: true })
  }
})

test('catalog plugins are read from their pinned version without the online catalog', async () => {
  const plugin = readMarketingCatalog().entries.find(entry => entry.install.type === 'plugin')
  const market = createMarket({ indexUrls: [], registries: [] })
  try {
    // An empty registry list fails after the listing check, which proves the pinned pair was accepted.
    await assert.rejects(market.manifest(plugin.install.name, plugin.install.version), /registry unavailable/)
    await assert.rejects(market.manifest(plugin.install.name, '0.0.0-unlisted'), /no catalog|listed/)
  } finally {
    market.dispose()
  }
})

test('a live profile installs through the HMR queue even when the lock package is unreachable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-market-route-'))
  const patchPath = join(directory, 'cordis.patch.yml')
  await writeFile(patchPath, '[]\n')
  const queued = []
  const reconciled = []
  const host = mount({
    profileContext: { dir: directory, patchPath, home: directory },
    hmr: {
      runExclusive: (operation) => { queued.push('exclusive'); return operation() },
      reconcileProfile: async (ids) => { reconciled.push(ids); return { warnings: ['note'], pending: [] } },
    },
  })
  try {
    const { ok, data } = await host.call('marketing-install', { id: mcpEntry.id })
    assert.equal(ok, true)
    assert.deepEqual([data.application, data.warnings], ['applied', ['note']])
    assert.deepEqual(queued, ['exclusive'])
    assert.deepEqual(reconciled, [[`mkt-mcp-${mcpEntry.id}`]])
  } finally {
    host.dispose()
    await rm(directory, { recursive: true, force: true })
  }
})
