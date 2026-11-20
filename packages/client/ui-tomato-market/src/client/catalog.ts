/**
 * Catalog views shared by both market tabs: localized text, star lookup, keyword search, ordering, category sections,
 * version formatting, and the install spec one listed version needs. All pure, so the behavior is testable in Node.
 */
import type { MarkdownLabels } from '@tomato/client-ui-primitives'
import type { ManifestFacts, MarketPlugin, MarketVersion, Resolution, ResolutionVerdict } from './contract.ts'
import type { TomatoMarketLocaleKey } from './locales.ts'

/**
 * The chrome of a catalog document's Markdown.
 * @param t - the tabs' dictionary.
 * @returns the labels.
 */
export function catalogMarkdownLabels(
  t: (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string,
): MarkdownLabels {
  return {
    code: {
      copyLabel: t('codeCopy'),
      copiedLabel: t('codeCopied'),
      toolbarLabels: { codeLabel: t('codeBlock'), wrapLabel: t('codeWrap'), unwrapLabel: t('codeUnwrap') },
    },
    footnotes: t('footnotes'),
  }
}

/** Localized or plain catalog text. */
export type CatalogText = string | Readonly<Record<string, string>> | undefined

/** One catalog version as the open catalog lists it. */
export interface ListedVersionView extends MarketVersion {
  /** Publish time in Unix seconds. */
  readonly publishTimestamp?: number
}

/** A plugin entry of the open catalog, with the optional fields a card reads. */
export interface PluginView extends MarketPlugin {
  readonly icon?: string
  readonly homepage?: string
  readonly versions: readonly ListedVersionView[]
}

/**
 * Resolve a catalog text value in the active language.
 * @param value - catalog text.
 * @param language - active UI language.
 * @returns the best available text.
 */
export function localized(value: CatalogText, language: string): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  // The contract keeps English on every record the Host sends, so it is the fallback after the language.
  return value[language] ?? value.en ?? ''
}

/**
 * The version a card presents: the first listed version, which the catalog orders newest first.
 * @param plugin - one plugin.
 * @returns that version.
 */
export function latestVersion(plugin: { readonly versions: readonly ListedVersionView[] }): ListedVersionView | undefined {
  return plugin.versions[0]
}

/**
 * Read a plugin's GitHub stars from the star map.
 * @param plugin - one plugin.
 * @param stars - keys `npm:<name>` or `gh:<owner>/<repo>`.
 * @returns the count.
 */
export function starsOf(
  plugin: { readonly name: string; readonly repository?: { readonly url?: string } },
  stars: Readonly<Record<string, number>>,
): number | undefined {
  const direct = stars[`npm:${plugin.name}`]
  if (direct !== undefined) return direct
  const slug = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(plugin.repository?.url ?? '')
  const owner = slug?.[1]
  const name = slug?.[2]
  return owner === undefined || name === undefined ? undefined : stars[`gh:${owner.toLowerCase()}/${name.toLowerCase()}`]
}

/**
 * A star count as the listing shows it.
 * @param count - star count; absent when no document names the package.
 * @returns the compacted count such as `1.2k`, or an empty string.
 */
export function formatStars(count: number | undefined): string {
  if (count === undefined) return ''
  if (count < 1000) return String(count)
  if (count < 1_000_000) return `${(count / 1000).toFixed(count < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
}

/**
 * A publish time as the listing shows it.
 * @param timestamp - Unix seconds, as the index format declares publish times.
 * @param language - UI language.
 * @returns the local date, or an empty string when the index stamped none.
 */
export function formatDate(timestamp: number | undefined, language: string): string {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return ''
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(timestamp * 1000))
}

/** Search texts already computed, per plugin and language. */
const searchTexts = new WeakMap<object, Map<string, string>>()

/**
 * The lowercased search text of one plugin in one language.
 * @param plugin - one plugin.
 * @param language - UI language.
 * @returns the text {@link filterPlugins} matches.
 */
export function searchText(plugin: PluginView, language: string): string {
  let byLanguage = searchTexts.get(plugin)
  if (byLanguage === undefined) {
    byLanguage = new Map()
    searchTexts.set(plugin, byLanguage)
  }
  let text = byLanguage.get(language)
  if (text === undefined) {
    text = [
      plugin.name,
      localized(plugin.title, language),
      localized(plugin.description, language),
      plugin.author ?? '',
      plugin.category ?? '',
      ...(plugin.keywords ?? []),
    ].join('\n').toLowerCase()
    byLanguage.set(language, text)
  }
  return text
}

/**
 * Filter plugins by category and every search word.
 * @param plugins - catalog plugins.
 * @param filters - the query, the category, and the language the search reads titles in.
 * @returns matching plugins in catalog order.
 */
export function filterPlugins(
  plugins: readonly PluginView[],
  filters: { readonly query?: string; readonly category?: string | null; readonly language: string },
): readonly PluginView[] {
  const { query = '', category = null, language } = filters
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0 && category === null) return plugins
  return plugins.filter((plugin) => {
    if (category !== null && plugin.category !== category) return false
    if (words.length === 0) return true
    const text = searchText(plugin, language)
    return words.every(word => text.includes(word))
  })
}

/** The orders a market list offers. */
export type MarketSort = 'stars' | 'updated' | 'name'

/**
 * Order plugins for display.
 * @param plugins - plugins to order.
 * @param sort - display order.
 * @param stars - star map.
 * @param language - UI language, for name collation.
 * @returns a new ordered array; plugins without stars follow all others.
 */
export function sortPlugins(
  plugins: readonly PluginView[],
  sort: MarketSort,
  stars: Readonly<Record<string, number>>,
  language: string,
): readonly PluginView[] {
  const collator = new Intl.Collator(language)
  const byName = (left: PluginView, right: PluginView): number =>
    collator.compare(localized(left.title, language) || left.name, localized(right.title, language) || right.name)
  const ordered = [...plugins]
  if (sort === 'updated') {
    return ordered.sort((left, right) => updatedAt(right) - updatedAt(left) || byName(left, right))
  }
  if (sort === 'name') return ordered.sort(byName)
  // Unstarred plugins follow every starred one, then the name order breaks the rest.
  return ordered.sort((left, right) => starKey(left, stars) - starKey(right, stars) || byName(left, right))
}

/**
 * @param plugin - one plugin.
 * @returns its newest publish time in seconds, or 0 when it lists no timestamp.
 */
function updatedAt(plugin: PluginView): number {
  return latestVersion(plugin)?.publishTimestamp ?? 0
}

/**
 * The descending star count a star sort compares; a plugin with no count ranks after every counted one.
 * @param plugin - one plugin.
 * @param stars - star map.
 * @returns the comparison key.
 */
function starKey(plugin: PluginView, stars: Readonly<Record<string, number>>): number {
  return -(starsOf(plugin, stars) ?? Number.MIN_SAFE_INTEGER)
}

/**
 * Count plugins per declared category.
 * @param plugins - catalog plugins.
 * @returns category id to count; undeclared categories are absent.
 */
export function categoryCounts(plugins: readonly PluginView[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const plugin of plugins) {
    if (plugin.category === undefined) continue
    counts.set(plugin.category, (counts.get(plugin.category) ?? 0) + 1)
  }
  return counts
}

/** One browse section: a category with its most prominent members. */
export interface CategorySection {
  readonly id: string
  readonly title: string
  readonly count: number
  readonly total: number
  readonly plugins: readonly PluginView[]
}

/**
 * One browse section per category, most populated first.
 * @param plugins - catalog plugins.
 * @param categories - declared categories.
 * @param stars - star map.
 * @param language - UI language.
 * @param limit - plugins shown per section.
 * @param sort - order inside each section.
 * @returns the sections.
 */
export function categorySections(
  plugins: readonly PluginView[],
  categories: readonly { readonly id: string; readonly title?: CatalogText }[],
  stars: Readonly<Record<string, number>>,
  language: string,
  limit: number,
  sort: MarketSort = 'stars',
): readonly CategorySection[] {
  const counts = categoryCounts(plugins)
  // Every counted id gets a title: its declaration, or its own id for an undeclared category.
  const titleOf = new Map<string, string>([...counts.keys()].map(id => [id, id]))
  for (const category of categories) {
    if (titleOf.has(category.id)) titleOf.set(category.id, localized(category.title, language))
  }
  const collator = new Intl.Collator(language)
  return [...titleOf.entries()]
    .map(([id, title]) => {
      const members = sortPlugins(plugins.filter(plugin => plugin.category === id), sort, stars, language)
      return { id, title, count: members.length, total: members.length, plugins: members.slice(0, limit) }
    })
    .sort((left, right) => right.total - left.total || collator.compare(left.title, right.title))
}

/**
 * Whether a version declares TOMATO requirements in the catalog.
 * @param version - one listed version.
 * @returns whether `engines.tomato` is present.
 */
export function targetsTomato(version: ListedVersionView | undefined): boolean {
  return typeof version?.tomato === 'string'
}

/**
 * One unmet declaration, as the copy key and its parameters name it.
 * @param requirements - unmet declarations, keyed `engines.tomato` or by peer name.
 * @returns the label to render, or none.
 */
export function requirementOf(
  requirements: Readonly<Record<string, string>> | undefined,
): { readonly key: 'tomatoRequirement' | 'peerRequirement'; readonly params: Readonly<Record<string, string>> } | undefined {
  const entries = Object.entries(requirements ?? {})
  const engine = entries.find(([name]) => name === 'engines.tomato')
  if (engine !== undefined) return { key: 'tomatoRequirement', params: { range: engine[1] } }
  const [first] = entries
  return first === undefined ? undefined : { key: 'peerRequirement', params: { peer: first[0], range: first[1] } }
}

/**
 * The install arguments for one version.
 * @param plugin - the plugin.
 * @param version - the listed version.
 * @returns what the Plugins page's install dialog needs.
 */
export function installTarget(
  plugin: { readonly name: string },
  version: ListedVersionView,
): { readonly spec: string; readonly registry?: string } {
  if (version.source.type === 'git') {
    // A Git source always carries its repository and commit; only the package directory is optional.
    const { url, commit, path: directory } = version.source
    const path = directory === undefined ? '' : `&path:/${directory}`
    return { spec: `git+${String(url)}.git#${String(commit)}${path}` }
  }
  return {
    spec: `${plugin.name}@${version.version}`,
    ...version.source.registry === undefined ? {} : { registry: version.source.registry },
  }
}

/**
 * What the compatibility badge reports for one manifest read.
 * @param facts - the read, or the failure's reason.
 * @returns the copy key and the tag tone.
 */
export function compatibilityBadge(facts: ManifestFacts | undefined): { readonly key: 'compatTomato' | 'compatOther' | 'compatUnknown'; readonly tone: 'success' | 'neutral' | 'quiet' } {
  if (facts === undefined) return { key: 'compatUnknown', tone: 'quiet' }
  return facts.class === 'tomato' ? { key: 'compatTomato', tone: 'success' } : { key: 'compatOther', tone: 'neutral' }
}

/**
 * The resolution to a listed version's verdict.
 * @param resolution - the Host's resolution.
 * @param versions - the versions the catalog lists.
 * @returns the selected version's record, or undefined when none was compatible.
 */
export function selectedVersion(resolution: Resolution, versions: readonly ListedVersionView[]): ListedVersionView | undefined {
  if (resolution.status !== 'resolved') return undefined
  return versions.find(entry => entry.version === resolution.selected) ?? { version: resolution.selected, source: { type: 'npm' } }
}

/**
 * Whether a verdict names unmet requirements.
 * @param verdict - the version's compatibility.
 * @returns the unmet declarations, or undefined.
 */
export function unmetRequirements(verdict: ResolutionVerdict | undefined): Readonly<Record<string, string>> | undefined {
  return verdict?.status === 'incompatible' ? verdict.requirements : undefined
}
