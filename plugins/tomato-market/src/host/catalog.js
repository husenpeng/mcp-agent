// Catalog reads: the open DeepSeek Harness plugin catalog (`index.json`, the
// format-1 plugin market index) and the star counts published beside it in
// `plugins.json`. Both are compacted before they travel to the browser.

/** Catalog mirrors in fallback order; the first that answers wins. */
export const DEFAULT_INDEX_URLS = [
  'https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json',
  'https://awesome-dsh-plugin.com/index.json',
  'https://dshmarket.com/index.json',
]

/** Star-count documents, in the same fallback order. */
export const DEFAULT_STAR_URLS = [
  'https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/plugins.json',
  'https://awesome-dsh-plugin.com/plugins.json',
]

/** Longest description kept per plugin; cards show two lines and the page shows the README. */
const DESCRIPTION_LIMIT = 400
/** Keywords kept per plugin for search. */
const KEYWORD_LIMIT = 12
/** Versions kept per plugin, newest first. */
const VERSION_LIMIT = 24

/** @param {unknown} value - candidate text. @returns {string | undefined} trimmed text, or undefined. */
function textOrUndefined(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/**
 * Keep the localized text a browser can display: a string, or a record of language to string with English.
 * @param {unknown} value - candidate localized text.
 * @returns {string | Record<string, string> | undefined} the kept text.
 */
function localized(value) {
  if (typeof value === 'string') return textOrUndefined(value)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const kept = {}
  for (const [language, entry] of Object.entries(value)) {
    if (typeof entry === 'string' && entry.trim() !== '') kept[language] = entry
  }
  return kept.en === undefined ? undefined : kept
}

/** @param {string | undefined} text - candidate. @param {number} limit - longest kept. @returns {string | undefined} trimmed text. */
function clipped(text, limit) {
  return text === undefined || text.length <= limit ? text : `${text.slice(0, limit - 1)}…`
}

/**
 * Trim one localized value, cutting long text.
 * @param {unknown} value - candidate localized text.
 * @returns {string | Record<string, string> | undefined} displayable text.
 */
function clippedLocalized(value) {
  const kept = localized(value)
  if (kept === undefined) return undefined
  if (typeof kept === 'string') return clipped(kept, DESCRIPTION_LIMIT)
  return Object.fromEntries(Object.entries(kept).map(([language, text]) => [language, clipped(text, DESCRIPTION_LIMIT)]))
}

/** Repository web URL as a `owner/repository` slug, for matching star counts. */
function repositorySlug(url) {
  if (typeof url !== 'string') return undefined
  const match = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/.exec(url)
  return match === null ? undefined : `${match[1].toLowerCase()}/${match[2].toLowerCase()}`
}

/**
 * Key one plugin's star entry: its npm name and its repository slug.
 * @param {{ npm?: unknown, url?: unknown }} entry - one catalog entry.
 * @returns {string[]} keys that identify it in {@link starCounts}.
 */
export function starKeys(entry) {
  const keys = []
  if (typeof entry?.npm === 'string' && entry.npm.trim() !== '') keys.push(`npm:${entry.npm.trim()}`)
  const slug = repositorySlug(entry?.url)
  if (slug !== undefined) keys.push(`gh:${slug}`)
  return keys
}

/**
 * The keys a market plugin matches in a star map.
 * @param {{ name: string, repository?: { url?: string } }} plugin - one market plugin.
 * @returns {string[]} lookup keys, most specific first.
 */
export function pluginStarKeys(plugin) {
  const keys = [`npm:${plugin.name}`]
  const slug = repositorySlug(plugin.repository?.url)
  if (slug !== undefined) keys.push(`gh:${slug}`)
  return keys
}

/**
 * Build a compact star map from the catalog's `plugins.json`.
 * @param {unknown} document - the parsed document.
 * @returns {Record<string, number>} keys from {@link starKeys} to GitHub star counts.
 */
export function parseStars(document) {
  const entries = Array.isArray(document?.plugins) ? document.plugins : Array.isArray(document) ? document : []
  const stars = {}
  for (const entry of entries) {
    const count = typeof entry?.stars === 'number' && Number.isFinite(entry.stars) && entry.stars >= 0 ? entry.stars : undefined
    if (count === undefined) continue
    for (const key of starKeys(entry)) stars[key] = count
  }
  return stars
}

/**
 * Validate and trim a format-1 market index for the browser.
 * @param {unknown} document - the parsed index.
 * @param {{ indexUrl: string }} options - the URL that answered, to resolve relative icons.
 * @returns {{ title: unknown, description?: unknown, categories: Array<{ id: string, title: unknown }>, plugins: object[] }} the catalog.
 * @throws {Error} when the document is not a format-1 index.
 */
export function compactCatalog(document, { indexUrl }) {
  if (typeof document !== 'object' || document === null || document.format !== 1 || !Array.isArray(document.plugins)) {
    throw new Error('not a format-1 plugin market index')
  }
  const declared = typeof document.metadata === 'object' && document.metadata !== null ? document.metadata : {}
  const categories = Object.entries(declared.categories ?? {}).map(([id, value]) => ({
    id,
    title: localized(value?.title) ?? { en: id },
  }))
  const plugins = []
  for (const raw of document.plugins) {
    const name = typeof raw?.name === 'string' ? raw.name.trim() : ''
    if (name === '' || !Array.isArray(raw.versions)) continue
    const metadata = typeof raw.metadata === 'object' && raw.metadata !== null ? raw.metadata : {}
    const versions = raw.versions
      .filter(version => typeof version?.version === 'string' && version.source !== undefined)
      .sort((left, right) => (right.publishTimestamp ?? 0) - (left.publishTimestamp ?? 0))
      .slice(0, VERSION_LIMIT)
      .map(version => ({
        version: version.version,
        publishTimestamp: version.publishTimestamp,
        source: {
          type: version.source.type,
          ...version.source.registry === undefined ? {} : { registry: version.source.registry },
          ...version.source.url === undefined ? {} : { url: version.source.url },
          ...version.source.commit === undefined ? {} : { commit: version.source.commit },
          ...version.source.path === undefined ? {} : { path: version.source.path },
        },
        ...typeof version.engines?.dsh === 'string' ? { dsh: version.engines.dsh } : {},
        ...typeof version.engines?.tomato === 'string' ? { tomato: version.engines.tomato } : {},
      }))
    if (versions.length === 0) continue
    const icon = localized(raw.icon)
    plugins.push({
      name,
      ...localized(raw.title) === undefined ? {} : { title: clippedLocalized(raw.title) },
      ...localized(raw.description) === undefined ? {} : { description: clippedLocalized(raw.description) },
      ...icon === undefined ? {} : { icon: resolveIcon(icon, indexUrl) },
      ...textOrUndefined(raw.author) === undefined ? {} : { author: textOrUndefined(raw.author) },
      ...textOrUndefined(raw.homepage) === undefined ? {} : { homepage: textOrUndefined(raw.homepage) },
      ...typeof raw.repository?.url === 'string' ? {
        repository: {
          url: raw.repository.url,
          ...typeof raw.repository.directory === 'string' ? { directory: raw.repository.directory } : {},
        },
      } : {},
      ...typeof metadata.category === 'string' ? { category: metadata.category } : {},
      keywords: Array.isArray(metadata.keywords) ? metadata.keywords.filter(word => typeof word === 'string').slice(0, KEYWORD_LIMIT) : [],
      versions,
    })
  }
  return {
    title: localized(document.title) ?? { en: 'Plugin market' },
    ...localized(document.description) === undefined ? {} : { description: localized(document.description) },
    categories,
    plugins,
  }
}

/**
 * Resolve a relative icon against the index that declared it.
 * @param {string} icon - an absolute URL, inline `data:` URL, or relative reference.
 * @returns {string} the URL the browser can load.
 */
export function resolveIcon(icon, indexUrl) {
  if (icon.startsWith('data:') || icon.startsWith('http://') || icon.startsWith('https://')) return icon
  try {
    return new URL(icon, indexUrl).href
  } catch {
    return icon
  }
}

/**
 * Read the first catalog mirror that answers.
 * @param {typeof fetchText} read - the HTTP reader.
 * @param {string[]} urls - mirrors in order.
 * @param {AbortSignal} [signal] - disposal signal.
 * @returns {Promise<{ document: unknown, indexUrl: string }>} the parsed document and its URL.
 * @throws {Error} when no mirror answered.
 */
export async function readCatalog(read, urls, signal) {
  let lastError
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