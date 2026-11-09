import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMarket } from '../index.js'

const INDEX_URL = 'https://index.test/index.json'
const REGISTRY = 'https://registry.test'
const RUNTIME = '0.2.1-rc.3'

/**
 * The catalog entry under test: one plugin published across the given versions.
 * @param {string[]} versions - versions to list, newest first.
 * @returns {object} a format-1 index.
 */
function indexOf(versions) {
  return {
    format: 1,
    title: { en: 'Test catalog' },
    plugins: [{
      name: 'dsh-better-sidebar',
      versions: versions.map((version, at) => ({ version, publishTimestamp: versions.length - at, source: { type: 'npm' } })),
    }],
  }
}

/** Manifests by version: 0.30.x needs a newer runtime than the one under test. */
const MANIFESTS = {
  '0.30.1': { peerDependencies: { '@deepseek-ai/dsh-agent': '^0.2.2-rc.1' } },
  '0.30.0': { peerDependencies: { '@deepseek-ai/dsh-agent': '^0.2.2-rc.1' } },
  '0.28.2': { peerDependencies: { '@deepseek-ai/dsh-agent': '^0.2.1-rc.1' } },
}

/** @param {unknown} body - JSON body. @returns {Response} a JSON response. */
function json(body) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
}

/**
 * Serve the catalog, the registry packument, and the registry manifests from memory for one test.
 * @param {object} index - the catalog document.
 * @param {Record<string, object>} [manifests] - published manifests by version; defaults to {@link MANIFESTS}.
 * @returns {() => void} the stub's removal.
 */
function stubNetwork(index, manifests = MANIFESTS) {
  const original = globalThis.fetch
  globalThis.fetch = async (url) => {
    const parsed = new URL(String(url))
    if (`${parsed.origin}${parsed.pathname}` === INDEX_URL) return json(index)
    if (parsed.origin === REGISTRY) {
      const segments = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent)
      if (segments.length === 1) return json({ name: segments[0], versions: Object.fromEntries(Object.keys(manifests).map(version => [version, {}])) })
      const manifest = manifests[segments[1]]
      if (manifest !== undefined) return json({ name: segments[0], ...manifest })
    }
    return new Response('', { status: 404 })
  }
  return () => { globalThis.fetch = original }
}

/**
 * Build one market against a temporary profile whose installation states `version`.
 * @param {{ version?: string }} [installation] - the version the installation manifest states.
 * @returns {Promise<{ market: object, dir: string }>} the market and its temporary home.
 */
async function marketFor(installation = { version: RUNTIME }) {
  const dir = await mkdtemp(join(tmpdir(), 'tomato-market-resolve-'))
  const installAnchor = join(dir, 'installation.json')
  if (installation.version !== undefined) {
    await writeFile(installAnchor, JSON.stringify({ name: '@tomato/harness', version: installation.version }))
  }
  const market = createMarket({
    indexUrls: [INDEX_URL],
    starUrls: [INDEX_URL],
    registries: [REGISTRY],
    home: dir,
    timeoutMs: 5000,
  }, {
    profile: { dir, patchPath: join(dir, 'cordis.patch.yml'), home: dir, installAnchor },
  })
  return { market, dir }
}

test('resolution falls back to the newest version this TOMATO admits', async () => {
  const restore = stubNetwork(indexOf(['0.30.1', '0.30.0', '0.28.2']))
  const { market, dir } = await marketFor()
  try {
    const resolution = await market.resolve('dsh-better-sidebar', '0.30.1')
    assert.equal(resolution.status, 'resolved')
    assert.equal(resolution.runtimeVersion, RUNTIME)
    assert.equal(resolution.requested, '0.30.1')
    assert.equal(resolution.selected, '0.28.2')
    assert.deepEqual(resolution.rejected.map(entry => entry.version), ['0.30.1', '0.30.0'])
    assert.deepEqual(resolution.rejected[0].requirements, { '@tomato/agent': '^0.2.2-rc.1' })
  } finally {
    restore()
    market.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('a version this TOMATO admits resolves to itself', async () => {
  const restore = stubNetwork(indexOf(['0.28.2']))
  const { market, dir } = await marketFor()
  try {
    assert.deepEqual(await market.resolve('dsh-better-sidebar', '0.28.2'), {
      status: 'resolved',
      runtimeVersion: RUNTIME,
      requested: '0.28.2',
      selected: '0.28.2',
      rejected: [],
    })
  } finally {
    restore()
    market.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('resolution reports when no published version is compatible', async () => {
  const incompatible = { '0.30.1': MANIFESTS['0.30.1'], '0.30.0': MANIFESTS['0.30.0'] }
  const restore = stubNetwork(indexOf(['0.30.1', '0.30.0']), incompatible)
  const { market, dir } = await marketFor()
  try {
    const resolution = await market.resolve('dsh-better-sidebar', '0.30.1')
    assert.equal(resolution.status, 'none')
    assert.deepEqual(resolution.rejected.map(entry => entry.version), ['0.30.1', '0.30.0'])
  } finally {
    restore()
    market.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('a catalog listing only the newest release still falls back through the registry', async () => {
  const restore = stubNetwork(indexOf(['0.30.1']))
  const { market, dir } = await marketFor()
  try {
    const resolution = await market.resolve('dsh-better-sidebar', '0.30.1')
    assert.equal(resolution.status, 'resolved')
    assert.equal(resolution.selected, '0.28.2')
    assert.deepEqual(resolution.rejected.map(entry => entry.version), ['0.30.1', '0.30.0'])
    const older = await market.manifest('dsh-better-sidebar', '0.28.2')
    assert.deepEqual(older.compatibility, { status: 'compatible' })
    await assert.rejects(market.manifest('dsh-better-sidebar', '0.27.0'), /not published for this package/)
    await assert.rejects(market.manifest('unlisted-package', '1.0.0'), /not listed in the catalog/)
  } finally {
    restore()
    market.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('a missing installation version leaves resolution unknown', async () => {
  const restore = stubNetwork(indexOf(['0.28.2']))
  const { market, dir } = await marketFor({})
  try {
    const resolution = await market.resolve('dsh-better-sidebar', '0.28.2')
    assert.equal(resolution.status, 'unknown')
    assert.equal(resolution.runtimeVersion, undefined)
  } finally {
    restore()
    market.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('manifest reads report whether this TOMATO admits the version', async () => {
  const restore = stubNetwork(indexOf(['0.30.1', '0.28.2']))
  const { market, dir } = await marketFor()
  try {
    const refused = await market.manifest('dsh-better-sidebar', '0.30.1')
    assert.equal(refused.runtimeVersion, RUNTIME)
    assert.deepEqual(refused.compatibility, { status: 'incompatible', requirements: { '@tomato/agent': '^0.2.2-rc.1' } })
    const admitted = await market.manifest('dsh-better-sidebar', '0.28.2')
    assert.deepEqual(admitted.compatibility, { status: 'compatible' })
  } finally {
    restore()
    market.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})