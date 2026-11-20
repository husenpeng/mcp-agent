// npm and Git reads of one listed plugin version: whether it declares a Tomato
// bundle, which harness it targets, and the README a reader sees before install.

import type { HttpReader, ReadOptions, TextRead } from './http.ts'

/** npm registries in fallback order. */
export const DEFAULT_REGISTRIES: readonly string[] = ['https://registry.npmjs.org', 'https://registry.npmmirror.com']
/** README CDNs in fallback order. */
export const README_CDNS: readonly string[] = ['https://cdn.jsdelivr.net/npm', 'https://unpkg.com']
/** Largest README this market keeps. */
export const README_MAX_BYTES = 512 * 1024

/** Where one listed version comes from. */
export interface ListedSource {
  readonly type: 'npm' | 'git'
  readonly registry?: string
  readonly url?: string
  readonly commit?: string
  readonly path?: string
}

/** One listed version. */
export interface ListedVersion {
  readonly version: string
  readonly source: ListedSource
}

/** A text reader; tests supply their own. */
export type TextReader = (url: string, options?: ReadOptions) => Promise<TextRead>

/** What one published manifest declares about the harness it runs on. */
export interface ManifestClass {
  /** `tomato` when the package declares `tomato.bundle` or targets TOMATO peers, `other` when it declares none. */
  readonly class: 'tomato' | 'other' | 'unknown'
  readonly bundlePatch?: string
  readonly declaredBundle: boolean
  readonly tomatoRange?: string
  readonly tomatoPeers: readonly string[]
  readonly deprecated?: string
  readonly version?: string
}

/**
 * @param text - README text.
 * @returns the text without its leading YAML front matter.
 */
export function stripFrontMatter(text: string): string {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

/**
 * The raw `package.json` reads for one npm version, in fallback order.
 * @param name - package name.
 * @param version - exact version.
 * @param registries - npm registries in order.
 * @returns the reads, in order.
 */
export function manifestCandidates(name: string, version: string, registries: readonly string[] = DEFAULT_REGISTRIES): Array<{ registry: string; url: string }> {
  return registries.map(registry => ({
    registry,
    url: `${registry.replace(/\/$/, '')}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
  }))
}

/**
 * Whether a manifest declares a harness bundle, and the facts the market shows.
 * @param manifest - one version's registry manifest.
 * @returns the compatibility record.
 */
export function classifyManifest(manifest: unknown): ManifestClass {
  if (typeof manifest !== 'object' || manifest === null) return { class: 'unknown', declaredBundle: false, tomatoPeers: [] }
  const record = manifest as Record<string, unknown>
  const tomato = typeof record.tomato === 'object' && record.tomato !== null ? record.tomato as Record<string, unknown> : undefined
  const peers = typeof record.peerDependencies === 'object' && record.peerDependencies !== null
    ? record.peerDependencies as Record<string, unknown>
    : {}
  const tomatoPeers = Object.keys(peers).filter(peer => peer.startsWith('@tomato/'))
  const engines = typeof record.engines === 'object' && record.engines !== null ? record.engines as Record<string, unknown> : {}
  const bundle = typeof tomato?.bundle === 'object' && tomato.bundle !== null ? tomato.bundle as Record<string, unknown> : undefined
  const declaredBundle = tomato?.bundle !== undefined
  const patch = typeof bundle?.patch === 'string' ? bundle.patch : undefined
  return {
    class: declaredBundle || tomatoPeers.length > 0 ? 'tomato' : 'other',
    ...patch === undefined ? {} : { bundlePatch: patch },
    declaredBundle,
    ...typeof engines.tomato === 'string' ? { tomatoRange: engines.tomato } : {},
    tomatoPeers,
    ...typeof record.deprecated === 'string' ? { deprecated: record.deprecated } : {},
    ...typeof record.version === 'string' ? { version: record.version } : {},
  }
}

/**
 * The README reads for one listed version, most specific first.
 * @param request - the version.
 * @returns candidate reads.
 */
export function readmeCandidates(request: ListedVersion): Array<{ url: string; hint: string }> {
  const { source } = request
  const candidates: Array<{ url: string; hint: string }> = []
  if (source.type === 'git' && typeof source.url === 'string' && typeof source.commit === 'string') {
    const slug = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/.exec(source.url)
    if (slug !== null) {
      const directory = typeof source.path === 'string' && source.path !== '.' ? `${source.path.replace(/^\/+|\/+$/g, '')}/` : ''
      candidates.push({
        url: `https://raw.githubusercontent.com/${slug[1]}/${slug[2]}/${source.commit}/${directory}README.md`,
        hint: 'repository',
      })
    }
  }
  const packageSpec = `${String((request as unknown as { name?: string }).name)}@${request.version}`
  for (const cdn of README_CDNS) candidates.push({ url: `${cdn}/${packageSpec}/README.md`, hint: cdn })
  candidates.push({ url: `https://registry.npmmirror.com/${packageSpec}/files/README.md`, hint: 'npmmirror' })
  return candidates
}

/**
 * The raw `package.json` paths of a Git-sourced version on GitHub, in fallback order.
 * @param source - the version's Git source.
 * @returns raw file URLs; empty when the repository is not on GitHub.
 */
export function gitManifestCandidates(source: ListedSource): string[] {
  if (typeof source.url !== 'string') return []
  const slug = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/.exec(source.url)
  if (slug === null || typeof source.commit !== 'string') return []
  const directory = typeof source.path === 'string' && source.path !== '.' ? `${source.path.replace(/^\/+|\/+$/g, '')}/` : ''
  return [`https://raw.githubusercontent.com/${slug[1]}/${slug[2]}/${source.commit}/${directory}package.json`]
}

/**
 * Read the first manifest registry that answers.
 * @param read - the JSON reader.
 * @param name - package name.
 * @param version - exact version.
 * @param options - registry order and disposal.
 * @returns the manifest and the registry that answered.
 * @throws {Error} naming every registry when none answered.
 */
export async function readManifest(
  read: HttpReader,
  name: string,
  version: string,
  options: { readonly registries?: readonly string[]; readonly signal?: AbortSignal } = {},
): Promise<{ manifest: Record<string, unknown>; registry: string }> {
  const failures: string[] = []
  for (const { registry, url } of manifestCandidates(name, version, options.registries ?? DEFAULT_REGISTRIES)) {
    try {
      const { value } = await read(url, { signal: options.signal, maxBytes: 4 * 1024 * 1024 })
      if (typeof value !== 'object' || value === null) throw new Error('manifest is not a JSON object')
      return { manifest: value as Record<string, unknown>, registry }
    } catch (error) {
      failures.push(`${new URL(registry).host}: ${(error as Error).message}`)
    }
  }
  throw new Error(`registry unavailable for ${name}@${version} (${failures.join('; ')})`)
}

/**
 * Read one version's README from its repository or the package CDNs.
 * @param readText - the text reader.
 * @param _readJson - the JSON reader, unused by the npm spellings.
 * @param request - the package, version, and source.
 * @returns the document, or `none` when no spelling exists.
 */
export async function readReadme(
  readText: TextReader,
  _readJson: HttpReader,
  request: {
    readonly name: string
    readonly version: string
    readonly source: ListedSource
    readonly registries?: readonly string[]
    readonly signal?: AbortSignal | undefined
  },
): Promise<{ status: 'found'; markdown: string; origin: string } | { status: 'none' }> {
  for (const { url, hint } of readmeCandidates({ version: request.version, source: request.source, ...{ name: request.name } } as ListedVersion & { name: string })) {
    try {
      const { text } = await readText(url, { signal: request.signal, maxBytes: README_MAX_BYTES })
      if (text.trim() !== '') return { status: 'found', markdown: stripFrontMatter(text), origin: hint }
    } catch { /* this spelling is absent; the next one may exist */ }
  }
  return { status: 'none' }
}
