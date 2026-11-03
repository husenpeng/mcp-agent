// Tomato Market host half: reads the open DeepSeek Harness plugin catalog, its
// star counts, and one listed version's registry facts and README, and serves
// them to the browser half over the authenticated `api/tomato-market` route.
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createCache, fetchBytes, fetchJson, fetchText } from './src/host/http.js'
import { createAdapter } from './src/host/adapt.js'
import {
  DEFAULT_INDEX_URLS, DEFAULT_STAR_URLS, compactCatalog, parseStars, readCatalog,
} from './src/host/catalog.js'
import {
  DEFAULT_REGISTRIES, classifyManifest, gitManifestCandidates, readManifest, readReadme,
} from './src/host/registry.js'

export { compactCatalog, parseStars } from './src/host/catalog.js'
export { classifyManifest, readmeCandidates, stripFrontMatter } from './src/host/registry.js'

/** The authenticated route the browser half calls. */
export const ROUTE = '/api/tomato-market'

export const name = 'tomato-market'

/** The shared connection service owns the route table. */
export const inject = ['connection']

/** Names the catalog may carry: npm names, or a repository entry's `owner/repo#path`. */
const LISTED_NAME = /^[^\s\u0000-\u001f]{1,300}$/
/** Exact SemVer versions, including prerelease and build suffixes. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

/**
 * Validate a package name coming from the browser.
 * @param {unknown} value - candidate.
 * @returns {string} the name.
 * @throws {Error} when the value is not a package name.
 */
function packageName(value) {
  if (typeof value !== 'string' || !LISTED_NAME.test(value)) throw new Error('invalid package name')
  return value
}

/**
 * Validate an exact version coming from the browser.
 * @param {unknown} value - candidate.
 * @returns {string} the version.
 * @throws {Error} when the value is not an exact version.
 */
function exactVersion(value) {
  if (typeof value !== 'string' || !EXACT_VERSION.test(value)) throw new Error('invalid version')
  return value
}

/**
 * Build the market's reads and caches.
 * @param {object} [config] - catalog settings; every field has a fixed default.
 * @param {string[]} [config.indexUrls] - catalog mirrors in fallback order.
 * @param {string[]} [config.starUrls] - star-count documents in fallback order.
 * @param {number} [config.timeoutMs] - deadline of one HTTP read.
 * @param {number} [config.cacheTtlMs] - lifetime of a successful catalog, star, or manifest read.
 * @returns {object} the market reads plus `dispose`.
 */
export function createMarket(config = {}) {
  const indexUrls = config.indexUrls ?? DEFAULT_INDEX_URLS
  const starUrls = config.starUrls ?? DEFAULT_STAR_URLS
  const timeoutMs = config.timeoutMs ?? 20_000
  const cacheTtlMs = config.cacheTtlMs ?? 10 * 60_000
  const registries = config.registries ?? DEFAULT_REGISTRIES
  const home = config.home ?? process.env.TOMATO_HOME ?? join(homedir(), '.tomato')
  const adaptDir = config.adaptDir ?? join(home, '.plugin-market', 'adapted')
  const controller = new AbortController()
  const adapter = createAdapter({
    fetchBytes: (url, options = {}) => fetchBytes(url, { timeoutMs, ...options }),
    cacheDir: adaptDir,
    timeoutMs,
    signal: controller.signal,
  })
  const readJson = (url, options = {}) => fetchJson(url, { timeoutMs, signal: controller.signal, ...options })
  const readText = (url, options = {}) => fetchText(url, { timeoutMs, signal: controller.signal, ...options })

  const catalogCache = createCache({
    ttlMs: cacheTtlMs,
    read: async () => {
      const { document, indexUrl } = await readCatalog(readJson, indexUrls, controller.signal)
      return compactCatalog(document, { indexUrl })
    },
  })
  const starCache = createCache({
    ttlMs: cacheTtlMs,
    read: async () => {
      let lastError
      for (const url of starUrls) {
        try {
          const { value } = await readJson(url, { maxBytes: 32 * 1024 * 1024 })
          return parseStars(value)
        } catch (error) {
          lastError = error
        }
      }
      throw lastError ?? new Error('no star document answered')
    },
  })
  const manifestCaches = new Map()
  const rawManifestCaches = new Map()
  const detailCaches = new Map()

  /** One version the catalog lists; names and versions outside the catalog are refused before any read. */
  const listedVersion = async (name, version) => {
    const catalog = await catalogCache.get()
    const plugin = catalog.plugins.find(entry => entry.name === name)
    const listed = plugin?.versions.find(entry => entry.version === version)
    if (listed === undefined) throw new Error('version is not listed in the catalog')
    return listed
  }

  /** Per-name caches keep a slow registry from delaying unrelated plugins. */
  const cacheFor = (map, key, read) => {
    let cache = map.get(key)
    if (cache === undefined) {
      cache = createCache({ ttlMs: cacheTtlMs, read })
      map.set(key, cache)
    }
    return cache
  }

  return {
    /** One catalog page, with star counts merged in. */
    async catalog(refresh = false) {
      const [catalog, stars] = await Promise.all([
        catalogCache.get(refresh),
        starCache.get(refresh).catch(() => ({})),
      ])
      return { ...catalog, stars }
    },
    /** Which harness one listed version targets. */
    async manifest(name, version) {
      const listed = await listedVersion(name, version)
      const catalogRegistry = listed.source.registry
      const cache = cacheFor(manifestCaches, `${name}@${version}@${catalogRegistry ?? ''}`, async () => {
        if (listed.source.type === 'git') {
          for (const url of gitManifestCandidates(listed.source)) {
            try {
              const { value } = await readJson(url, { maxBytes: 4 * 1024 * 1024 })
              return { manifest: value, registry: 'git' }
            } catch { /* the pinned package.json is absent; the version stays unknown */ }
          }
          throw new Error('repository package.json is unavailable')
        }
        const requested = catalogRegistry === undefined ? registries : [catalogRegistry, ...registries.filter(entry => entry !== catalogRegistry)]
        return readManifest(readJson, name, version, { registries: requested, signal: controller.signal })
      })
      const { manifest, registry: answered } = await cache.get()
      return { ...classifyManifest(manifest), registry: answered }
    },
    /** Convert one listed DeepSeek Harness version into a Tomato-installable tarball. */
    async adapt(name, version) {
      const listed = await listedVersion(name, version)
      if (listed.source.type !== 'npm') throw new Error('only npm-published versions can be adapted')
      const cache = cacheFor(rawManifestCaches, `${name}@${version}`, async () => {
        const requested = listed.source.registry === undefined
          ? registries
          : [listed.source.registry, ...registries.filter(entry => entry !== listed.source.registry)]
        return readManifest(readJson, name, version, { registries: requested, signal: controller.signal })
      })
      const { manifest } = await cache.get()
      if (typeof manifest.tomato === 'object' && manifest.tomato !== null && manifest.tomato.bundle !== undefined) {
        return { adapted: false, spec: `${name}@${version}` }
      }
      const tarball = manifest?.dist?.tarball
      if (typeof tarball !== 'string' || !tarball.startsWith('https://')) {
        throw new Error('the registry names no https tarball for this version')
      }
      const result = await adapter.adapt(name, version, tarball)
      return { adapted: true, spec: result.file, changed: result.changed, from: tarball }
    },
    /** One listed version's README. */
    async detail(name, version) {
      const listed = await listedVersion(name, version)
      const cache = cacheFor(detailCaches, `${name}@${version}`, () => readReadme(readText, readJson, {
        name, version, source: listed.source, registries, signal: controller.signal,
      }))
      return cache.get()
    },
    dispose() {
      controller.abort()
    },
  }
}

/**
 * One JSON reply.
 * @param {unknown} body - serializable reply body.
 * @returns {Response} the HTTP response.
 */
function reply(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

/**
 * Mount the market's host half.
 * @param {object} ctx - the Cordis host context.
 * @param {object} [config] - catalog settings, as {@link createMarket}.
 */
export function apply(ctx, config = {}) {
  const market = createMarket(config)
  ctx.effect(() => ctx.connection.fetch.register({
    path: ROUTE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      let body
      try {
        body = await request.json()
      } catch {
        return reply({ ok: false, error: { code: 'market/invalid', message: 'request body is not JSON' } })
      }
      const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : ''
      const payload = body?.payload ?? {}
      try {
        switch (endpoint) {
          case 'catalog':
            return reply({ ok: true, data: await market.catalog(payload.refresh === true) })
          case 'manifest':
            return reply({
              ok: true,
              data: await market.manifest(packageName(payload.name), exactVersion(payload.version)),
            })
          case 'detail':
            return reply({ ok: true, data: await market.detail(packageName(payload.name), exactVersion(payload.version)) })
          case 'adapt':
            return reply({ ok: true, data: await market.adapt(packageName(payload.name), exactVersion(payload.version)) })
          default:
            return reply({ ok: false, error: { code: 'market/not-found', message: `unknown endpoint ${endpoint}` } })
        }
      } catch (error) {
        return reply({ ok: false, error: { code: 'market/failed', message: error?.message ?? String(error) } })
      }
    },
  }), 'tomato-market: api route')
  ctx.effect(() => () => { market.dispose() }, 'tomato-market: dispose')
}