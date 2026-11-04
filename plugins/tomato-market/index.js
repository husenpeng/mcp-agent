// Tomato Market host half: reads the open DeepSeek Harness plugin catalog, its
// star counts, and one listed version's registry facts and README; serves the
// bundled marketing catalog and installs its MCP and Skill entries. The browser
// half reaches both over the authenticated `api/tomato-market` route and names
// marketing entries by id only.
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
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
import { ENTRY_ID, mcpCommand, validateMarketingCatalog } from './src/host/marketing.js'
import { createMcpInstaller, mcpRowYaml, onPath } from './src/host/mcp-install.js'
import { createSkillInstaller } from './src/host/skill-install.js'
import { readEntryReadme } from './src/host/marketing-readme.js'

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
 * Validate a marketing entry id coming from the browser.
 * @param {unknown} value - candidate.
 * @returns {string} the id.
 * @throws {Error} when the value is not an entry id.
 */
function entryId(value) {
  if (typeof value !== 'string' || !ENTRY_ID.test(value)) throw new Error('invalid entry id')
  return value
}

/** @returns {{ categories: object[], entries: object[] }} the validated catalog that ships with this package. */
export function readMarketingCatalog() {
  return validateMarketingCatalog(JSON.parse(readFileSync(new URL('./src/host/marketing-catalog.json', import.meta.url), 'utf8')))
}

/**
 * Build the market's reads and caches.
 * @param {object} [config] - catalog settings; every field has a fixed default.
 * @param {string[]} [config.indexUrls] - catalog mirrors in fallback order.
 * @param {string[]} [config.starUrls] - star-count documents in fallback order.
 * @param {number} [config.timeoutMs] - deadline of one HTTP read.
 * @param {number} [config.cacheTtlMs] - lifetime of a successful catalog, star, or manifest read.
 * @param {string} [config.skillRoot] - where Skills install; defaults to `<home>/skills`.
 * @param {object} [host] - what the running profile supplies.
 * @param {{ dir: string, patchPath: string, home: string }} [host.profile] - the running profile's locations; without
 *   them MCP installs are refused.
 * @param {object} [host.liveProfile] - serialization and recomposition, as {@link createMcpInstaller} takes them.
 * @returns {object} the market reads plus `dispose`.
 */
export function createMarket(config = {}, host = {}) {
  const indexUrls = config.indexUrls ?? DEFAULT_INDEX_URLS
  const starUrls = config.starUrls ?? DEFAULT_STAR_URLS
  const timeoutMs = config.timeoutMs ?? 20_000
  const cacheTtlMs = config.cacheTtlMs ?? 10 * 60_000
  const registries = config.registries ?? DEFAULT_REGISTRIES
  const home = config.home ?? host.profile?.home ?? process.env.TOMATO_HOME ?? join(homedir(), '.tomato')
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
  const marketing = readMarketingCatalog()
  const entryOf = (id) => {
    const entry = marketing.entries.find(candidate => candidate.id === id)
    if (entry === undefined) throw new Error(`${id} is not in the marketing catalog`)
    return entry
  }
  const skills = createSkillInstaller({
    skillRoot: config.skillRoot ?? join(home, 'skills'),
    readJson,
    readBytes: (url, options = {}) => fetchBytes(url, { timeoutMs, signal: controller.signal, ...options }),
  })
  const mcp = host.profile === undefined
    ? undefined
    : createMcpInstaller({ patchPath: host.profile.patchPath, ...host.liveProfile === undefined ? {} : { profile: host.liveProfile } })
  const requireMcp = () => {
    if (mcp === undefined) throw new Error('MCP servers install into a tomato profile, and this process runs without one')
    return mcp
  }
  let skillWrites = Promise.resolve()
  /** One Skill write at a time, so two installs cannot race over a directory. */
  const skillWrite = (operation) => {
    const run = skillWrites.then(operation, operation)
    skillWrites = run.catch(() => {})
    return run
  }
  /** Package names the running profile declares. */
  const installedPackages = async () => {
    if (host.profile === undefined) return []
    try {
      return Object.keys(JSON.parse(await readFile(join(host.profile.dir, 'package.json'), 'utf8')).dependencies ?? {})
    } catch (error) {
      if (error?.code === 'ENOENT') return []
      throw error
    }
  }
  const marketingDetailCaches = new Map()
  const manifestCaches = new Map()
  const rawManifestCaches = new Map()
  const detailCaches = new Map()

  /** One version the catalog lists; names and versions outside the catalog are refused before any read. */
  const listedVersion = async (name, version) => {
    const pinned = marketing.entries.find(entry => entry.install.type === 'plugin' && entry.install.name === name && entry.install.version === version)
    if (pinned !== undefined) return { version, source: { type: 'npm' } }
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
    /** The curated catalog and what the running profile already has of it. */
    async marketingCatalog() {
      const [mcpIds, skillEntries, packages] = await Promise.all([mcp?.installed() ?? [], skills.installed(), installedPackages()])
      const installed = marketing.entries.flatMap((entry) => {
        switch (entry.install.type) {
          case 'mcp': return mcpIds.includes(entry.id) ? [entry.id] : []
          case 'skill': return skillEntries.has(entry.id) ? [entry.id] : []
          case 'plugin': return packages.includes(entry.install.name) ? [entry.id] : []
          default: return []
        }
      })
      return { ...marketing, installed }
    },
    /** What installing one entry would do, for the confirmation dialog. */
    async marketingPreview(id) {
      const entry = entryOf(id)
      switch (entry.install.type) {
        case 'mcp': {
          const { command, args } = mcpCommand(entry.install)
          return {
            kind: 'mcp',
            command: [command, ...args].join(' '),
            yaml: mcpRowYaml(entry),
            runnerMissing: await onPath(command) ? undefined : command,
          }
        }
        case 'skill':
          return { kind: 'skill', skills: entry.install.skills.map(skill => skill.name), conflicts: await skills.conflicts(entry) }
        default:
          throw new Error(`${id} has no one-click install`)
      }
    },
    /** Install one MCP or Skill entry. */
    async marketingInstall(id) {
      const entry = entryOf(id)
      switch (entry.install.type) {
        case 'mcp': return requireMcp().install(entry)
        case 'skill': return skillWrite(() => skills.install(entry))
        default: throw new Error(`${id} has no one-click install`)
      }
    },
    /** Remove what one MCP or Skill entry installed. */
    async marketingUninstall(id) {
      const entry = entryOf(id)
      switch (entry.install.type) {
        case 'mcp': return requireMcp().uninstall(entry.id)
        case 'skill': return skillWrite(() => skills.uninstall(entry))
        default: throw new Error(`${id} has no one-click removal`)
      }
    },
    /** One entry's long description. */
    async marketingDetail(id) {
      const entry = entryOf(id)
      return cacheFor(marketingDetailCaches, id, () => readEntryReadme(entry, {
        readText, readJson, registries, signal: controller.signal,
      })).get()
    },
    dispose() {
      controller.abort()
    },
  }
}

/**
 * Load the profile manifest lock the CLI and Plugin Manager share.
 * @param {object} ctx - the Cordis host context.
 * @returns {Promise<(file: string, operation: () => Promise<object>) => Promise<object>>} `withFileLock`, or a pass-through
 *   when the running installation does not expose the package to plugins. The HMR queue still orders every writer in
 *   this process, so only a concurrent `tomato plugin` command loses its exclusion.
 */
async function manifestLock(ctx) {
  try {
    return (await import('@tomato/atomic-write')).withFileLock
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error
    ctx.logger?.warn?.('@tomato/atomic-write is not reachable; cordis.patch.yml writes rely on the HMR queue alone')
    return (_file, operation) => operation()
  }
}

/**
 * The running profile's serialization and recomposition, in the Config
 * Editor's order: the HMR queue, then the profile manifest lock. A profile
 * without HMR applies the file at its next start.
 * @param {object} ctx - the Cordis host context.
 * @param {{ dir: string }} profile - the running profile.
 * @returns {object} `run` and `apply`, as {@link createMcpInstaller} takes them.
 */
function liveProfile(ctx, profile) {
  return {
    run(operation) {
      const locked = async () => (await manifestLock(ctx))(join(profile.dir, 'package.json'), operation)
      const hmr = ctx.get('hmr')
      return hmr === undefined ? locked() : hmr.runExclusive(locked)
    },
    async apply(requiredIds) {
      const hmr = ctx.get('hmr')
      if (hmr === undefined) return { application: 'restart-required', warnings: [] }
      const { warnings, pending, restartReason } = await hmr.reconcileProfile(requiredIds)
      return { application: restartReason === undefined && pending.length === 0 ? 'applied' : 'restart-required', warnings }
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
  const profile = ctx.get('profileContext')
  const market = createMarket(config, profile === undefined ? {} : { profile, liveProfile: liveProfile(ctx, profile) })
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
          case 'marketing-catalog':
            return reply({ ok: true, data: await market.marketingCatalog() })
          case 'marketing-preview':
            return reply({ ok: true, data: await market.marketingPreview(entryId(payload.id)) })
          case 'marketing-install':
            return reply({ ok: true, data: await market.marketingInstall(entryId(payload.id)) })
          case 'marketing-uninstall':
            return reply({ ok: true, data: await market.marketingUninstall(entryId(payload.id)) })
          case 'marketing-detail':
            return reply({ ok: true, data: await market.marketingDetail(entryId(payload.id)) })
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