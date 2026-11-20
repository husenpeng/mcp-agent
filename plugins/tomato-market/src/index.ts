/**
 * Plugin markets, host half: reads the open Tomato Harness plugin catalog, its star counts, and one listed version's
 * registry facts and README; serves the bundled marketing catalog and installs its MCP and Skill entries. The browser
 * half reaches every endpoint over the authenticated `/api/tomato-market` route and names marketing entries by id only,
 * so no command ever reaches the Host from the page.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/client-connection'
import { ROUTE } from './api.ts'
import type { MarketCatalog, MarketRequest, MarketRoute, MarketVersion } from './api.ts'
import type { HttpReader, ReadOptions, TextRead } from './host/http.ts'
import { createAdapter } from './host/adapt.ts'
import { compactCatalog, DEFAULT_INDEX_URLS, DEFAULT_STAR_URLS, parseStars, readCatalog } from './host/catalog.ts'
import { createCache, fetchBytes, fetchJson, fetchText } from './host/http.ts'
import { candidateOrder, evaluateCompatibility, type Compatibility } from './host/compatibility.ts'
import { classifyManifest, DEFAULT_REGISTRIES, gitManifestCandidates, readManifest, readReadme, type ListedSource, type ManifestClass } from './host/registry.ts'
import { ENTRY_ID, readMarketingFile, readMarketingModule, validateMarketingCatalog } from './host/marketing.ts'
import { mcpCommand } from './host/marketing.ts'
import { createMcpInstaller, mcpRowYaml, onPath, type LiveProfile, type McpInstaller } from './host/mcp-install.ts'
import { readEntryReadme } from './host/marketing-readme.ts'
import { createSkillInstaller, type SkillInstaller } from './host/skill-install.ts'

export * from './api.ts'

/** Plugin name the Loader mounts this row as. */
export const name = 'plugin-tomato-market'

/** The shared connection service owns the route table; `connection` is optional because a non-Web composition has none. */
export const inject = ['connection']

/** The route the host half serves; the browser half reads `ROUTE` from the contract. */
export const ROUTE_PATH = `/${ROUTE}`
/** Most published versions one compatibility resolution reads; every candidate is a registry request. */
const RESOLVE_CANDIDATES = 8

/** Names the catalog may carry: npm names, or a repository entry's `owner/repo#path`. */
const LISTED_NAME = /^[^\s\u0000-\u001f]{1,300}$/
/** Exact SemVer versions, including prerelease and build suffixes. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

/** The market's read bounds and destinations; every field has a fixed default. */
export interface MarketOptions {
  /** Catalog mirrors, tried in order until one answers; defaults to the shipped mirrors. */
  readonly indexUrls?: readonly string[]
  /** GitHub star-count documents, tried in the same way. */
  readonly starUrls?: readonly string[]
  /** Deadline of one HTTP read, its body included. */
  readonly timeoutMs?: number
  /** How long a successful catalog, star, manifest, or README read stays cached. */
  readonly cacheTtlMs?: number
  /** Where Skill entries install; defaults to the user skill root below the tomato home. */
  readonly skillRoot?: string
}

/** The running profile's locations; without them MCP installs are refused. */
interface HostProfile {
  readonly dir: string
  readonly patchPath: string
  readonly home: string
  readonly installAnchor?: string
}

/** One listed version's published manifest, as the package declares it. */
type PublishedManifest = Record<string, unknown>

/** What install one entry would do, for the confirmation dialog. */
type MarketingPreview =
  | { readonly kind: 'mcp'; readonly command: string; readonly yaml: string; readonly runnerMissing?: string }
  | { readonly kind: 'skill'; readonly skills: readonly string[]; readonly conflicts: readonly string[] }

/** One entry's long description. */
type EntryDetail = { readonly status: 'found'; readonly markdown: string; readonly origin?: unknown } | { readonly status: 'none' }

/** The reading itself failed. */
/** One market's reads, caches, and installers. */
export interface Market {
  catalog(refresh?: boolean): Promise<MarketCatalog>
  runtime(): Promise<{ readonly version?: string }>
  manifest(packageName: string, version: string): Promise<ManifestClass & { readonly registry: string; readonly runtimeVersion?: string; readonly compatibility?: Compatibility }>
  resolve(packageName: string, version: string): Promise<unknown>
  adapt(packageName: string, version: string): Promise<{ readonly adapted: boolean; readonly spec: string; readonly changed?: number; readonly from?: string }>
  detail(packageName: string, version: string): Promise<EntryDetail>
  marketingCatalog(): Promise<{ readonly installed: readonly string[] } & ReturnType<typeof readMarketingModule>>
  marketingPreview(id: string): Promise<MarketingPreview>
  marketingInstall(id: string): Promise<unknown>
  marketingUninstall(id: string): Promise<unknown>
  marketingDetail(id: string): Promise<EntryDetail>
  /** Stop every in-flight HTTP read of this market. */
  dispose(): void
}

/** @returns the validated catalog that ships with this package. */
export function readMarketingCatalog(): ReturnType<typeof validateMarketingCatalog> {
  return validateMarketingCatalog(readMarketingFile())
}

/**
 * A workspace module the running installation may not carry.
 * @param specifier - module specifier resolved from this package.
 * @returns the module namespace, or undefined when the installation does not carry it.
 */
function optionalModule(specifier: string): Record<string, unknown> | undefined {
  try {
    return createRequire(import.meta.url)(specifier) as Record<string, unknown>
  } catch (error) {
    if ((error as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND') throw error
    return undefined
  }
}

/**
 * Per-key caches share one lifetime and one read.
 * @param map - the per-endpoint cache map.
 * @param key - the cache key.
 * @param ttlMs - lifetime of a successful read.
 * @param read - the read that fills it.
 * @returns the cache handle.
 */
function cacheFor<T>(
  map: Map<string, { get(refresh?: boolean): Promise<T> }>,
  key: string,
  ttlMs: number,
  read: () => Promise<T>,
): { get(refresh?: boolean): Promise<T> } {
  let cache = map.get(key)
  if (cache === undefined) {
    cache = createCache({ ttlMs, read })
    map.set(key, cache)
  }
  return cache
}

/**
 * @param config - catalog settings; every field has a fixed default.
 * @param host - what the running profile supplies.
 * @returns the market.
 */
export function createMarket(config: MarketOptions = {}, host: { profile?: HostProfile; liveProfile?: LiveProfile } = {}): Market {
  const timeoutMs = config.timeoutMs ?? 20_000
  const cacheTtlMs = config.cacheTtlMs ?? 10 * 60_000
  const root = host.profile?.home ?? process.env.TOMATO_HOME ?? join(homedir(), '.tomato')
  const controller = new AbortController()
  const adapter = createAdapter({
    fetchBytes: (url: string, options: ReadOptions = {}) => fetchBytes(url, { timeoutMs, ...options }),
    cacheDir: join(root, '.plugin-market', 'adapted'),
    timeoutMs,
    signal: controller.signal,
  })
  const readJson: HttpReader = (url, options = {}) => fetchJson(url, { timeoutMs, signal: controller.signal, ...options })
  const readText = (url: string, options: ReadOptions = {}): Promise<TextRead> => fetchText(url, { timeoutMs, signal: controller.signal, ...options })
  const catalogCache = createCache({
    ttlMs: cacheTtlMs,
    read: async () => {
      const { document, indexUrl } = await readCatalog(readJson, config.indexUrls ?? DEFAULT_INDEX_URLS, controller.signal)
      return compactCatalog(document, { indexUrl }) as unknown as MarketCatalog
    },
  })
  const starCache = createCache({
    ttlMs: cacheTtlMs,
    read: async () => {
      let lastError: unknown
      for (const url of config.starUrls ?? DEFAULT_STAR_URLS) {
        try {
          const { value } = await readJson(url, { maxBytes: 32 * 1024 * 1024 })
          return parseStars(value) as Record<string, number>
        } catch (error) {
          lastError = error
        }
      }
      throw lastError ?? new Error('no star document answered')
    },
  })
  const marketing = readMarketingCatalog()
  const entryOf = (id: string) => marketing.entries.find(candidate => candidate.id === id) ?? neverEntry(id)
  const skills: SkillInstaller = createSkillInstaller({
    skillRoot: config.skillRoot ?? join(root, 'skills'),
    readJson,
    readBytes: (url: string, options: ReadOptions = {}) => fetchBytes(url, { timeoutMs, signal: controller.signal, ...options }),
  })
  const mcp: McpInstaller | undefined = host.profile === undefined
    ? undefined
    : createMcpInstaller({
      patchPath: host.profile.patchPath,
      ...host.liveProfile === undefined ? {} : { profile: host.liveProfile },
    })
  const requireMcp = (): McpInstaller => mcp ?? (() => { throw new Error('MCP servers install into a tomato profile, and this process runs without one') })()
  let skillWrites: Promise<unknown> = Promise.resolve()
  /** One Skill write at a time, so two installs cannot race over a directory. */
  const skillWrite = <T>(operation: () => Promise<T>): Promise<T> => {
    const run = skillWrites.then(operation, operation)
    skillWrites = run.catch(() => undefined)
    return run
  }
  const installedPackages = async (): Promise<string[]> => {
    if (host.profile === undefined) return []
    try {
      const manifest = JSON.parse(await readFile(join(host.profile.dir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> }
      return Object.keys(manifest.dependencies ?? {})
    } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') throw error
      return []
    }
  }
  const detailCaches = new Map<string, { get(refresh?: boolean): Promise<EntryDetail> }>()
  const marketingDetailCaches = new Map<string, { get(refresh?: boolean): Promise<EntryDetail> }>()
  const versionManifestCaches = new Map<string, { get(refresh?: boolean): Promise<{ manifest: PublishedManifest; registry: string }> }>()
  const packumentCaches = new Map<string, { get(refresh?: boolean): Promise<{ registry: string; versions: string[] }> }>()
  let runtimeVersionRead: Promise<string | undefined> | undefined
  const runtimeVersion = (): Promise<string | undefined> => (runtimeVersionRead ??= (async () => {
    const anchor = host.profile?.installAnchor
    if (anchor === undefined) return undefined
    try {
      const manifest = JSON.parse(await readFile(anchor, 'utf8')) as { version?: unknown }
      return typeof manifest.version === 'string' && manifest.version.trim() !== '' ? manifest.version : undefined
    } catch {
      // An unreadable installation manifest leaves compatibility unknown; the installer checks again.
      return undefined
    }
  })())

  const publishedVersions = (packageName: string, registryHint?: string) =>
    cacheFor(packumentCaches, `${packageName}@${registryHint ?? ''}`, cacheTtlMs, async () => {
      const registries = DEFAULT_REGISTRIES
      const requested = registryHint === undefined ? registries : [registryHint, ...registries.filter(entry => entry !== registryHint)]
      const failures: string[] = []
      for (const registry of requested) {
        try {
          const { value } = await readJson(`${registry.replace(/\/$/, '')}/${encodeURIComponent(packageName)}`, { maxBytes: 8 * 1024 * 1024 })
          const published = (value as { versions?: Record<string, unknown> }).versions
          const versions = typeof published === 'object' && published !== null ? Object.keys(published) : []
          if (versions.length === 0) throw new Error('the registry lists no version')
          return { registry, versions }
        } catch (error) {
          failures.push(`${new URL(registry).host}: ${(error as Error).message}`)
        }
      }
      throw new Error(`registry unavailable (${failures.join('; ')})`)
    }).get()

  /** One listed version, whether the catalog lists it or the registry publishes it. */
  const listedVersion = async (packageName: string, version: string): Promise<MarketVersion> => {
    const pinned = marketing.entries.find(entry => entry.install.type === 'plugin'
      && entry.install.name === packageName && entry.install.version === version)
    if (pinned !== undefined) return { version, source: { type: 'npm' } }
    const catalog = await catalogCache.get()
    const plugin = catalog.plugins.find(entry => entry.name === packageName)
    if (plugin === undefined) throw new Error('package is not listed in the catalog')
    const listed = plugin.versions.find(entry => entry.version === version)
    if (listed !== undefined) return listed
    // The catalog keeps the newest versions; an older one still installs from its registry.
    const published = await publishedVersions(packageName, plugin.versions[0]?.source?.registry)
    if (!published.versions.includes(version)) throw new Error('version is not published for this package')
    return { version, source: { type: 'npm', registry: published.registry } }
  }

  /** One listed version's published manifest, from its own source. */
  const listedManifest = (packageName: string, version: string, source: ListedSource) =>
    cacheFor(versionManifestCaches, `${packageName}@${version}@${source.registry ?? ''}`, cacheTtlMs, async () => {
      if (source.type === 'git') {
        for (const url of gitManifestCandidates(source)) {
          try {
            const { value } = await readJson(url, { maxBytes: 4 * 1024 * 1024 })
            return { manifest: value as PublishedManifest, registry: 'git' }
          } catch { /* the pinned package.json is absent; the version stays unknown */ }
        }
        throw new Error('repository package.json is unavailable')
      }
      const registries = DEFAULT_REGISTRIES
      const requested = source.registry === undefined
        ? registries
        : [source.registry, ...registries.filter(entry => entry !== source.registry)]
      return readManifest(readJson, packageName, version, { registries: requested, signal: controller.signal })
    }).get()

  return {
    async catalog(refresh = false) {
      const [catalog, stars] = await Promise.all([
        catalogCache.get(refresh),
        starCache.get(refresh).catch(() => ({} as Record<string, number>)),
      ])
      return { ...catalog, stars }
    },
    async runtime() {
      const version = await runtimeVersion()
      return version === undefined ? {} : { version }
    },
    async manifest(packageName, version) {
      const listed = await listedVersion(packageName, version)
      const { manifest, registry } = await listedManifest(packageName, version, listed.source)
      const runtime = await runtimeVersion()
      return {
        ...classifyManifest(manifest),
        registry,
        ...runtime === undefined ? {} : { compatibility: evaluateCompatibility(manifest, runtime), runtimeVersion: runtime },
      }
    },
    async resolve(packageName, version) {
      const listed = await listedVersion(packageName, version)
      const runtime = await runtimeVersion()
      if (runtime === undefined) {
        return { status: 'unknown', requested: version, reason: 'the running installation names no TOMATO version', rejected: [] }
      }
      const rejected: object[] = []
      const judge = async (candidate: MarketVersion, requested: boolean): Promise<object | undefined> => {
        let manifest: PublishedManifest
        try {
          ({ manifest } = await listedManifest(packageName, candidate.version, candidate.source as ListedSource))
        } catch (error) {
          const reason = (error as Error).message
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
        rejected.push({
          version: candidate.version,
          ...verdict.status === 'incompatible' ? { requirements: verdict.requirements } : { reason: verdict.reason },
        })
        return undefined
      }
      const settled = await judge(listed, true)
      if (settled !== undefined) return settled
      // The catalog keeps the newest versions of each plugin; older releases come from the registry, so a newer
      // plugin release that needs a newer TOMATO still has a compatible predecessor to fall back to.
      const catalog = await catalogCache.get()
      let order = candidateOrder(catalog.plugins.find(entry => entry.name === packageName)?.versions ?? [], version)
      try {
        const published = await publishedVersions(packageName, listed.source.registry)
        const known = new Set(order.map(entry => entry.version))
        order = [...order, ...candidateOrder(
          published.versions.map(candidate => ({ version: candidate, source: { type: 'npm' as const, registry: published.registry } })),
          version,
        ).filter(entry => !known.has(entry.version))]
      } catch { /* the registry listed nothing; resolution stays within the catalog */ }
      for (const candidate of order.filter(entry => entry.version !== version).slice(0, RESOLVE_CANDIDATES - 1)) {
        const outcome = await judge(candidate, false)
        if (outcome !== undefined) return outcome
      }
      return { status: 'none', runtimeVersion: runtime, requested: version, rejected }
    },
    async adapt(packageName, version) {
      const listed = await listedVersion(packageName, version)
      if (listed.source.type !== 'npm') throw new Error('only npm-published versions can be adapted')
      const { manifest } = await listedManifest(packageName, version, listed.source)
      const tomato = manifest.tomato
      if (typeof tomato === 'object' && tomato !== null && (tomato as { bundle?: unknown }).bundle !== undefined) {
        return { adapted: false, spec: `${packageName}@${version}` }
      }
      const dist = manifest.dist
      const tarball = typeof dist === 'object' && dist !== null ? (dist as { tarball?: unknown }).tarball : undefined
      if (typeof tarball !== 'string' || !tarball.startsWith('https://')) {
        throw new Error('the registry names no https tarball for this version')
      }
      const result = await adapter.adapt(packageName, version, tarball)
      return { adapted: true, spec: result.file, changed: result.changed, from: tarball }
    },
    async detail(packageName, version) {
      const listed = await listedVersion(packageName, version)
      return cacheFor(detailCaches, `${packageName}@${version}`, cacheTtlMs, () => readReadme(readText, readJson, {
        name: packageName, version, source: listed.source, registries: DEFAULT_REGISTRIES, signal: controller.signal,
      }) as Promise<EntryDetail>).get()
    },
    async marketingCatalog() {
      const [mcpIds, skillEntries, packages] = await Promise.all([
        mcp === undefined ? Promise.resolve<string[]>([]) : mcp.installed(),
        skills.installed(),
        installedPackages(),
      ])
      const installed = marketing.entries.flatMap((entry) => {
        const install = entry.install
        switch (install.type) {
          case 'mcp': return mcpIds.includes(entry.id) ? [entry.id] : []
          case 'skill': return skillEntries.has(entry.id) ? [entry.id] : []
          case 'plugin': return install.name !== undefined && packages.includes(install.name) ? [entry.id] : []
          default: return []
        }
      })
      return { ...readMarketingModule(), installed } as { installed: readonly string[] } & ReturnType<typeof readMarketingModule>
    },
    async marketingPreview(id) {
      const entry = entryOf(id)
      switch (entry.install.type) {
        case 'mcp': {
          const { command, args } = mcpCommand(entry)
          return {
            kind: 'mcp',
            command: [command, ...args].join(' '),
            yaml: mcpRowYaml(entry),
            ...await onPath(command) ? {} : { runnerMissing: command },
          }
        }
        case 'skill':
          return {
            kind: 'skill',
            skills: (entry.install.skills ?? []).map(skill => skill.name),
            conflicts: [...await skills.conflicts(entry)],
          }
        default:
          throw new Error(`${id} has no one-click install`)
      }
    },
    async marketingInstall(id) {
      const entry = entryOf(id)
      switch (entry.install.type) {
        case 'mcp': return requireMcp().install(entry)
        case 'skill': return skillWrite(() => skills.install(entry))
        default: throw new Error(`${id} has no one-click install`)
      }
    },
    async marketingUninstall(id) {
      const entry = entryOf(id)
      switch (entry.install.type) {
        case 'mcp': return requireMcp().uninstall(entry.id)
        case 'skill': return skillWrite(() => skills.uninstall(entry))
        default: throw new Error(`${id} has no one-click removal`)
      }
    },
    async marketingDetail(id) {
      const entry = entryOf(id)
      return cacheFor(marketingDetailCaches, id, cacheTtlMs, () => readEntryReadme(entry, {
        readText, readJson, registries: DEFAULT_REGISTRIES, signal: controller.signal,
      }) as Promise<EntryDetail>).get()
    },
    dispose() {
      controller.abort()
    },
  }
}

/**
 * The catalog names no such entry.
 * @param id - the entry id.
 * @returns never.
 */
function neverEntry(id: unknown): never {
  throw new Error(`${String(id)} is not in the marketing catalog`)
}

/** One HMR service, as the market uses it. */
interface Hmr {
  runExclusive<T>(task: () => Promise<T>): Promise<T>
  reconcileProfile(ids: readonly string[]): Promise<{ warnings: readonly unknown[]; pending: readonly unknown[]; restartReason?: unknown }>
}

/**
 * Load the profile manifest lock the CLI and Plugin Manager share.
 * @param ctx - the Cordis host context.
 * @returns `withFileLock`, or a pass-through when the installation does not expose that package to plugins. The HMR
 *   queue still orders every writer in this process, so only a concurrent `tomato plugin` command loses its exclusion.
 */
function fileLock(ctx: Context): (file: string, operation: () => Promise<unknown>) => Promise<unknown> {
  const withFileLock = optionalModule('@tomato/atomic-write')?.withFileLock
  if (typeof withFileLock !== 'function') {
    ctx.logger?.warn?.('@tomato/atomic-write is not reachable; cordis.patch.yml writes rely on the HMR queue alone')
    return (_file, operation) => operation()
  }
  return withFileLock as (file: string, operation: () => Promise<unknown>) => Promise<unknown>
}

/**
 * The running profile's serialization and recomposition, in the Config Editor's order: the HMR queue, then the profile
 * manifest lock. A profile without HMR applies the file at its next start.
 * @param ctx - the Cordis host context.
 * @param profile - the running profile.
 * @returns `run` and `apply`, as the MCP installer takes them.
 */
function liveProfile(ctx: Context, profile: HostProfile): LiveProfile {
  return {
    run<T>(operation: () => Promise<T>): Promise<T> {
      const locked = () => fileLock(ctx)(join(profile.dir, 'package.json'), operation) as Promise<T>
      const hmr = ctx.get('hmr') as Hmr | undefined
      return hmr === undefined ? locked() : hmr.runExclusive(locked)
    },
    async apply(requiredIds) {
      const hmr = ctx.get('hmr') as Hmr | undefined
      if (hmr === undefined) return { application: 'restart-required', warnings: [] }
      const { warnings, pending, restartReason } = await hmr.reconcileProfile(requiredIds)
      return { application: restartReason === undefined && pending.length === 0 ? 'applied' : 'restart-required', warnings }
    },
  }
}

/**
 * One JSON reply.
 * @param body - serializable reply body.
 * @returns the HTTP response.
 */
function reply(body: object): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

/**
 * Validate one value the browser sent for a typed field.
 * @param value - the payload value.
 * @param pattern - the accepted form.
 * @param label - what the value names, for the error.
 * @returns the value.
 */
function field(value: unknown, pattern: RegExp, label: string): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`invalid ${label}`)
  return value
}

/**
 * Answer one request for the browser half.
 * @param market - the market to read.
 * @param request - the parsed request.
 * @returns the reply body.
 */
async function answer(market: Market, request: MarketRequest): Promise<object> {
  const { payload = {} } = request
  try {
    switch (request.endpoint) {
      case 'catalog':
        return { ok: true, data: await market.catalog(payload.refresh === true) }
      case 'manifest':
        return { ok: true, data: await market.manifest(field(payload.name, LISTED_NAME, 'package name'), field(payload.version, EXACT_VERSION, 'version')) }
      case 'resolve':
        return { ok: true, data: await market.resolve(field(payload.name, LISTED_NAME, 'package name'), field(payload.version, EXACT_VERSION, 'version')) }
      case 'detail':
        return { ok: true, data: await market.detail(field(payload.name, LISTED_NAME, 'package name'), field(payload.version, EXACT_VERSION, 'version')) }
      case 'adapt':
        return { ok: true, data: await market.adapt(field(payload.name, LISTED_NAME, 'package name'), field(payload.version, EXACT_VERSION, 'version')) }
      case 'marketing-catalog':
        return { ok: true, data: await market.marketingCatalog() }
      case 'marketing-preview':
        return { ok: true, data: await market.marketingPreview(field(payload.id, ENTRY_ID, 'entry id')) }
      case 'marketing-install':
        return { ok: true, data: await market.marketingInstall(field(payload.id, ENTRY_ID, 'entry id')) }
      case 'marketing-uninstall':
        return { ok: true, data: await market.marketingUninstall(field(payload.id, ENTRY_ID, 'entry id')) }
      case 'marketing-detail':
        return { ok: true, data: await market.marketingDetail(field(payload.id, ENTRY_ID, 'entry id')) }
      default:
        return { ok: false, error: { code: 'market/not-found', message: 'unknown endpoint' } }
    }
  } catch (error) {
    return { ok: false, error: { code: 'market/failed', message: error instanceof Error ? error.message : String(error) } }
  }
}

/**
 * Mount the market's host half.
 * @param ctx - the Cordis host context.
 * @param config - catalog settings, as {@link createMarket}.
 */
export function apply(ctx: Context, config: MarketOptions = {}): void {
  const profile = ctx.get('profileContext') as HostProfile | undefined
  const market = createMarket(config, profile === undefined ? {} : { profile, liveProfile: liveProfile(ctx, profile) })
  const connection = ctx.get('connection') as MarketRoute | undefined
  if (connection !== undefined) {
    ctx.effect(() => connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        const body: unknown = await request.json().catch(() => undefined)
        if (typeof body !== 'object' || body === null) {
          return reply({ ok: false, error: { code: 'market/invalid', message: 'request body is not a JSON object' } })
        }
        return reply(await answer(market, body as MarketRequest))
      },
    }), 'plugin-tomato-market: api route')
  }
  ctx.effect(() => () => { market.dispose() }, 'plugin-tomato-market: dispose')
}