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
import { candidateOrder, evaluateCompatibility } from './src/host/compatibility.js'
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
/** Most published versions one compatibility resolution reads; every candidate is a registry request. */
const RESOLVE_CANDIDATES = 8

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
 * @param {{ dir: string, patchPath: string, home: string, installAnchor?: string }} [host.profile] - the running
 *   profile's locations; without them MCP installs are refused. `installAnchor` is the installation's
 *   `package.json`, whose `version` is the runtime every compatibility decision compares against.
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
  const versionManifestCaches = new Map()
  const packumentCaches = new Map()
  const detailCaches = new Map()

  /** The running installation's version, read once from the manifest its launcher named. */
  let runtimeVersionRead
  const runtimeVersion = () => {
    if (runtimeVersionRead === undefined) {
      runtimeVersionRead = (async () => {
        const anchor = host.profile?.installAnchor
        if (anchor === undefined) return undefined
        try {
          const manifest = JSON.parse(await readFile(anchor, 'utf8'))
          return typeof manifest.version === 'string' && manifest.version.trim() !== '' ? manifest.version : undefined
        } catch {
          // An unreadable installation manifest leaves compatibility unknown; the installer checks again.
          return undefined
        }
      })()
    }
    return runtimeVersionRead
  }

  /**
   * The versions a registry publishes for one catalog name.
   * @param {string} name - package name, already listed in the catalog.
   * @param {string} [registryHint] - the registry the catalog entry names, asked first.
   * @returns {Promise<{ registry: string, versions: string[] }>} the answering registry and its published versions.
   * @throws {Error} naming the registries when none lists the package.
   */
  const publishedVersions = async (name, registryHint) => {
    const cache = cacheFor(packumentCaches, `${name}@${registryHint ?? ''}`, async () => {
      const requested = registryHint === undefined ? registries : [registryHint, ...registries.filter(entry => entry !== registryHint)]
      const failures = []
      for (const registry of requested) {
        try {
          const { value } = await readJson(`${registry.replace(/\/$/, '')}/${encodeURIComponent(name)}`, { maxBytes: 8 * 1024 * 1024 })
          const versions = typeof value?.versions === 'object' && value.versions !== null ? Object.keys(value.versions) : []
          if (versions.length === 0) throw new Error('the registry lists no version')
          return { registry, versions }
        } catch (error) {
          failures.push(`${new URL(registry).host}: ${error?.message ?? error}`)
        }
      }
      throw new Error(`registry unavailable (${failures.join('; ')})`)
    })
    return cache.get()
  }

  /**
   * One version of a catalog entry, whether the catalog lists that version or the registry publishes it.
   * @param {string} name - package name.
   * @param {string} version - exact version.
   * @returns {Promise<object>} the listed entry, or a registry-sourced entry with the same fields.
   * @throws {Error} when the name is not listed, or the registry does not publish that version.
   */
  const listedVersion = async (name, version) => {
    const pinned = marketing.entries.find(entry => entry.install.type === 'plugin' && entry.install.name === name && entry.install.version === version)
    if (pinned !== undefined) return { version, source: { type: 'npm' } }
    const catalog = await catalogCache.get()
    const plugin = catalog.plugins.find(entry => entry.name === name)
    if (plugin === undefined) throw new Error('package is not listed in the catalog')
    const listed = plugin.versions.find(entry => entry.version === version)
    if (listed !== undefined) return listed
    // The catalog keeps the newest 24 versions; an older one still installs from its registry.
    const published = await publishedVersions(name, plugin.versions[0]?.source?.registry)
    if (!published.versions.includes(version)) throw new Error('version is not published for this package')
    return { version, source: { type: 'npm', registry: published.registry } }
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

  /**
   * One listed version's published manifest, from its own source.
   * @param {string} name - package name.
   * @param {string} version - exact version.
   * @param {{ type: string, registry?: string, url?: string, commit?: string, path?: string }} source - the listed source.
   * @returns {Promise<{ manifest: object, registry: string }>} the manifest and the origin that answered.
   */
  const listedManifest = async (name, version, source) => {
    const cache = cacheFor(versionManifestCaches, `${name}@${version}@${source.registry ?? ''}`, async () => {
      if (source.type === 'git') {
        for (const url of gitManifestCandidates(source)) {
          try {
            const { value } = await readJson(url, { maxBytes: 4 * 1024 * 1024 })
            return { manifest: value, registry: 'git' }
          } catch { /* the pinned package.json is absent; the version stays unknown */ }
        }
        throw new Error('repository package.json is unavailable')
      }
      const requested = source.registry === undefined ? registries : [source.registry, ...registries.filter(entry => entry !== source.registry)]
      return readManifest(readJson, name, version, { registries: requested, signal: controller.signal })
    })
    return cache.get()
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
    /** What the running TOMATO is, and whether it admits the version asked for. */
    async runtime() {
      const version = await runtimeVersion()
      return version === undefined ? {} : { version }
    },
    /** Which harness one listed version targets, and whether the running TOMATO admits it. */
    async manifest(name, version) {
      const listed = await listedVersion(name, version)
      const { manifest, registry: answered } = await listedManifest(name, version, listed.source)
      const runtime = await runtimeVersion()
      return {
        ...classifyManifest(manifest),
        registry: answered,
        ...runtime === undefined ? {} : { compatibility: evaluateCompatibility(manifest, runtime), runtimeVersion: runtime },
      }
    },
    /** The newest version the running TOMATO admits, starting from the one asked for. */
    async resolve(name, version) {
      const listed = await listedVersion(name, version)
      const runtime = await runtimeVersion()
      if (runtime === undefined) {
        return { status: 'unknown', requested: version, reason: 'the running installation names no TOMATO version', rejected: [] }
      }
      const rejected = []

      /**
       * Judge one candidate, reporting the outcome only when it settles the resolution.
       * @param {{ version: string, source: object }} candidate - the version to judge.
       * @param {boolean} requested - whether it is the version the reader chose.
       * @returns {Promise<object | undefined>} the resolution outcome, or undefined to keep looking.
       */
      const judge = async (candidate, requested) => {
        let manifest
        try {
          ({ manifest } = await listedManifest(name, candidate.version, candidate.source))
        } catch (error) {
          const reason = error?.message ?? String(error)
          if (requested) return { status: 'unknown', runtimeVersion: runtime, requested: version, reason, rejected }
          rejected.push({ version: candidate.version, reason })
          return undefined
        }
        const verdict = evaluateCompatibility(manifest, runtime)
        if (verdict.status === 'compatible') {
          return { status: 'resolved', runtimeVersion: runtime, requested: version, selected: candidate.version, rejected }
        }
        if (verdict.status === 'unknown' && requested) {
          return { status: 'unknown', runtimeVersion: runtime, requested: version, reason: verdict.reason, rejected }
        }
        rejected.push({ version: candidate.version, ...verdict.status === 'incompatible' ? { requirements: verdict.requirements } : { reason: verdict.reason } })
        return undefined
      }

      const settled = await judge(listed, true)
      if (settled !== undefined) return settled
      // The catalog keeps the newest versions of each plugin; older releases come from the registry so a
      // newer plugin release that needs a newer TOMATO still has a compatible predecessor to fall back to.
      const catalog = await catalogCache.get()
      let order = candidateOrder(catalog.plugins.find(entry => entry.name === name)?.versions ?? [], version)
      try {
        const published = await publishedVersions(name, listed.source.registry)
        const known = new Set(order.map(entry => entry.version))
        order = [...order, ...candidateOrder(
          published.versions.map(entry => ({ version: entry, source: { type: 'npm', registry: published.registry } })),
          version,
        ).filter(entry => !known.has(entry.version))]
      } catch { /* the registry listed nothing; resolution stays within the catalog */ }
      for (const candidate of order.filter(entry => entry.version !== version).slice(0, RESOLVE_CANDIDATES - 1)) {
        const outcome = await judge(candidate, false)
        if (outcome !== undefined) return outcome
      }
      return { status: 'none', runtimeVersion: runtime, requested: version, rejected }
    },
    /** Convert one listed DeepSeek Harness version into a Tomato-installable tarball. */
    async adapt(name, version) {
      const listed = await listedVersion(name, version)
      if (listed.source.type !== 'npm') throw new Error('only npm-published versions can be adapted')
      const { manifest } = await listedManifest(name, version, listed.source)
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
          case 'resolve':
            return reply({
              ok: true,
              data: await market.resolve(packageName(payload.name), exactVersion(payload.version)),
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