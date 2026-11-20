// Catalog reads: the open Tomato Harness plugin catalog (`index.json`, the
// format-1 plugin market index) and the star counts published beside it in
// `plugins.json`. Both are compacted before they travel to the browser.

import type { MarketCatalog, MarketCatalogCategory, MarketPlugin, MarketVersion } from '../api.ts'
import type { HttpReader } from './http.ts'

/** Catalog mirrors in fallback order; the first that answers wins. */
export const DEFAULT_INDEX_URLS: readonly string[] = [
  'https://cdn.jsdelivr.net/npm/tomato-plugin-catalog/index.json',
  'https://awesome-tomato-plugin.com/index.json',
  'https://dshmarket.com/index.json',
]

/** Star-count documents, in the same fallback order. */
export const DEFAULT_STAR_URLS: readonly string[] = [
  'https://cdn.jsdelivr.net/npm/tomato-plugin-catalog/plugins.json',
  'https://awesome-tomato-plugin.com/plugins.json',
]

/** Longest description kept per plugin; cards show two lines and the page shows the README. */
const DESCRIPTION_LIMIT = 400
/** Keywords kept per plugin for search. */
const KEYWORD_LIMIT = 12
/** Versions kept per plugin, newest first. */
const VERSION_LIMIT = 24

/** One entry of the star document or of the index itself. */
interface EntryLike {
  readonly npm?: unknown
  readonly url?: unknown
  readonly stars?: unknown
  readonly name?: unknown
  readonly [field: string]: unknown
}

/** One listed version as the index publishes it. */
interface VersionLike {
  readonly version?: unknown
  readonly source?: Record<string, unknown>
  readonly publishTimestamp?: unknown
  readonly engines?: { readonly tomato?: unknown }
  readonly [field: string]: unknown
}

/** The parsed format-1 index. */
interface IndexLike {
  readonly format?: unknown
  readonly plugins?: readonly EntryLike[]
  readonly categories?: Record<string, { readonly title?: unknown }>
  readonly metadata?: { readonly categories?: Record<string, { readonly title?: unknown }> }
  readonly [field: string]: unknown
}

/**
 * @param value - candidate text.
 * @returns trimmed text, or undefined.
 */
function textOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/**
 * Keep the localized text a browser can display: a string, or a record of language to string with English.
 * @param value - candidate localized text.
 * @returns the kept text.
 */
function localized(value: unknown): string | Record<string, string> | undefined {
  if (typeof value === 'string') return textOrUndefined(value)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const kept: Record<string, string> = {}
  for (const [language, entry] of Object.entries(value)) {
    if (typeof entry === 'string' && entry.trim() !== '') kept[language] = entry
  }
  return kept.en === undefined ? undefined : kept
}

/**
 * @param text - candidate.
 * @param limit - longest kept.
 * @returns trimmed text, cut at the limit.
 */
function clipped(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`
}

/**
 * Trim one localized value, cutting long text.
 * @param value - candidate localized text.
 * @returns displayable text.
 */
function clippedLocalized(value: unknown): string | Record<string, string> | undefined {
  const kept = localized(value)
  if (kept === undefined) return undefined
  if (typeof kept === 'string') return clipped(kept, DESCRIPTION_LIMIT)
  return Object.fromEntries(Object.entries(kept).map(([language, text]) => [language, clipped(text, DESCRIPTION_LIMIT)]))
}

/**
 * Repository web URL as a `owner/repository` slug, for matching star counts.
 * @param url - candidate URL.
 * @returns the lowercased slug, or undefined.
 */
function repositorySlug(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const match = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/.exec(url)
  const owner = match?.[1]
  const name = match?.[2]
  return owner === undefined || name === undefined ? undefined : `${owner.toLowerCase()}/${name.toLowerCase()}`
}

/**
 * Key one plugin's star entry: its npm name and its repository slug.
 * @param entry - one catalog entry.
 * @returns keys that identify it in the star map.
 */
export function starKeys(entry: EntryLike): string[] {
  const keys: string[] = []
  if (typeof entry.npm === 'string' && entry.npm.trim() !== '') keys.push(`npm:${entry.npm.trim()}`)
  const slug = repositorySlug(entry.url)
  if (slug !== undefined) keys.push(`gh:${slug}`)
  return keys
}

/**
 * The keys a market plugin matches in a star map.
 * @param plugin - one market plugin.
 * @returns lookup keys, most specific first.
 */
export function pluginStarKeys(plugin: Pick<MarketPlugin, 'name'> & { readonly repository?: { readonly url?: string } }): string[] {
  const keys = [`npm:${plugin.name}`]
  const slug = repositorySlug(plugin.repository?.url)
  if (slug !== undefined) keys.push(`gh:${slug}`)
  return keys
}

/**
 * Build a compact star map from the catalog's `plugins.json`.
 * @param document - the parsed document.
 * @returns keys from {@link starKeys} to GitHub star counts.
 */
export function parseStars(document: unknown): Record<string, number> {
  const list: readonly EntryLike[] = Array.isArray(document)
    ? document as readonly EntryLike[]
    : typeof document === 'object' && document !== null && Array.isArray((document as { plugins?: unknown }).plugins)
      ? (document as { plugins: readonly EntryLike[] }).plugins
      : []
  const stars: Record<string, number> = {}
  for (const entry of list) {
    const count = typeof entry.stars === 'number' && Number.isFinite(entry.stars) && entry.stars >= 0 ? entry.stars : undefined
    if (count === undefined) continue
    const keys = starKeys(entry)
    for (const key of keys) stars[key] = count
  }
  return stars
}

/**
 * Validate and trim a format-1 market index for the browser.
 * @param document - the parsed index.
 * @param options - the URL that answered, to resolve relative icons.
 * @returns the catalog.
 * @throws {Error} when the document is not a format-1 index.
 */
export function compactCatalog(document: unknown, { indexUrl }: { readonly indexUrl: string }): MarketCatalog {
  if (typeof document !== 'object' || document === null
    || (document as IndexLike).format !== 1 || !Array.isArray((document as IndexLike).plugins)) {
    throw new Error('not a format-1 plugin market index')
  }
  const index = document as IndexLike
  const declared = typeof index.metadata === 'object' && index.metadata !== null ? index.metadata : {}
  const categories: MarketCatalogCategory[] = Object.entries(declared.categories ?? {}).map(([id, value]) => ({
    id,
    title: localized(value?.title) ?? { en: id },
  }))
  const plugins: MarketPlugin[] = []
  for (const raw of index.plugins ?? []) {
    const name = textOrUndefined(raw.name)
    if (name === undefined || !Array.isArray(raw.versions)) continue
    const metadata = typeof raw.metadata === 'object' && raw.metadata !== null
      ? raw.metadata as Record<string, unknown>
      : {}
    const versions: MarketVersion[] = (raw.versions as readonly VersionLike[])
      .flatMap((version) => {
        const value = textOrUndefined(version.version)
        const source = version.source
        if (value === undefined || source === undefined) return []
        const { type } = source
        if (type !== 'npm' && type !== 'git') return []
        const kind: 'npm' | 'git' = type
        const fields = (['registry', 'url', 'commit', 'path'] as const)
          .flatMap(key => textOrUndefined(source[key]) === undefined ? [] : [[key, textOrUndefined(source[key])] as const])
        const engine = textOrUndefined(version.engines?.tomato)
        return [{
          version: value,
          source: { type: kind, ...Object.fromEntries(fields) } as MarketVersion['source'],
          ...typeof version.publishTimestamp === 'number' ? { publishTimestamp: version.publishTimestamp } : {},
          ...engine === undefined ? {} : { tomato: engine },
        }]
      })
      .sort((left, right) => (right.publishTimestamp ?? 0) - (left.publishTimestamp ?? 0))
      .slice(0, VERSION_LIMIT)
    if (versions.length === 0) continue
    const icon = localized(raw.icon)
    const iconUrl = typeof icon === 'string' ? icon : undefined
    const repository = typeof raw.repository === 'object' && raw.repository !== null
      ? raw.repository as Record<string, unknown>
      : undefined
    const author = textOrUndefined(raw.author)
    const homepage = textOrUndefined(raw.homepage)
    const category = textOrUndefined(metadata.category)
    const title = clippedLocalized(raw.title)
    const description = clippedLocalized(raw.description)
    plugins.push({
      name,
      ...title === undefined ? {} : { title },
      ...description === undefined ? {} : { description },
      ...iconUrl === undefined ? {} : { icon: resolveIcon(iconUrl, indexUrl) },
      ...author === undefined ? {} : { author },
      ...homepage === undefined ? {} : { homepage },
      ...typeof repository?.url !== 'string' ? {} : {
        repository: {
          url: repository.url,
          ...typeof repository.directory === 'string' ? { directory: repository.directory } : {},
        },
      },
      ...category === undefined ? {} : { category },
      keywords: Array.isArray(metadata.keywords)
        ? (metadata.keywords as readonly unknown[]).flatMap(word => textOrUndefined(word) ?? []).slice(0, KEYWORD_LIMIT)
        : [],
      versions,
    })
  }
  const title = localized(index.title)
  const description = localized(index.description)
  return {
    title: title ?? { en: 'Plugin market' },
    ...description === undefined ? {} : { description },
    categories,
    plugins,
    stars: {},
  }
}

/**
 * Resolve a relative icon against the index that declared it.
 * @param icon - an absolute URL, inline `data:` URL, or relative reference.
 * @param indexUrl - the answering index.
 * @returns the URL the browser can load.
 */
export function resolveIcon(icon: string, indexUrl: string): string {
  if (icon.startsWith('data:') || icon.startsWith('http://') || icon.startsWith('https://')) return icon
  try {
    return new URL(icon, indexUrl).href
  } catch {
    return icon
  }
}

/**
 * Read the first catalog mirror that answers.
 * @param read - the HTTP reader.
 * @param urls - mirrors in order.
 * @param signal - disposal signal.
 * @returns the parsed document and its URL.
 * @throws {Error} when no mirror answered.
 */
export async function readCatalog(
  read: HttpReader,
  urls: readonly string[],
  signal?: AbortSignal,
): Promise<{ document: unknown; indexUrl: string }> {
  let lastError: unknown
  for (const url of urls) {
    try {
      const { value } = await read(url, { signal, maxBytes: 16 * 1024 * 1024 })
      return { document: value, indexUrl: url }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError ?? new Error('no catalog mirror answered')
}