/** Marketing catalog views: kind filters, access tags, search, ordering, and the plugin a pinned entry names. All pure. */
import type { MarketPlugin, MarketingEntry } from './contract.ts'
import type { PluginView } from './catalog.ts'

/** Filter values of the kind control. */
export type MarketingKindFilter = 'all' | 'plugin' | 'mcp' | 'skill'
/** The orders the marketing list offers. */
export type MarketingSort = 'stars' | 'updated' | 'name'
/** The kinds a catalog entry declares. */
export type MarketingKind = 'plugin' | 'mcp' | 'skill'

/** How one entry reaches its data. */
const ACCESS_TAGS: Readonly<Record<string, { readonly key: 'accessFreeKey' | 'accessSelfHosted' | 'accessLogin'; readonly tone: 'info' | 'warning' | 'danger' }>> = {
  'free-key': { key: 'accessFreeKey', tone: 'info' },
  'self-hosted': { key: 'accessSelfHosted', tone: 'warning' },
  'login': { key: 'accessLogin', tone: 'danger' },
}

/**
 * The access tag one entry shows.
 * @param access - the entry's access.
 * @returns the tag's copy key and tone, or none for a freely usable entry.
 */
export function accessTag(access: MarketingEntry['access']): { readonly key: 'accessFreeKey' | 'accessSelfHosted' | 'accessLogin'; readonly tone: 'info' | 'warning' | 'danger' } | undefined {
  return access === undefined ? undefined : ACCESS_TAGS[access]
}

/**
 * The copy key naming one kind.
 * @param kind - the entry kind.
 * @returns the key.
 */
export function kindKey(kind: MarketingKind): 'kindPlugin' | 'kindMcp' | 'kindSkill' {
  switch (kind) {
    case 'plugin': return 'kindPlugin'
    case 'mcp': return 'kindMcp'
    case 'skill': return 'kindSkill'
  }
}

/**
 * Whether the tab can install one entry itself.
 * @param entry - the entry.
 * @returns whether one click installs it.
 */
export function oneClick(entry: Pick<MarketingEntry, 'install'>): boolean {
  return entry.install.type !== 'manual'
}

/**
 * The plugin package one entry installs.
 * @param entry - an entry whose install type is `plugin`.
 * @returns the catalog plugin and listed version the Plugins page's preflight reads.
 */
export function pluginTarget(entry: Pick<MarketingEntry, 'install'>): { readonly plugin: PluginView; readonly version: { readonly version: string; readonly source: { readonly type: 'npm' } } } {
  const install = entry.install
  if (install.type !== 'plugin') {
    throw new Error('this entry installs no plugin package')
  }
  return {
    plugin: { name: install.name, versions: [{ version: install.version, source: { type: 'npm' } }] },
    version: { version: install.version, source: { type: 'npm' } },
  }
}

/**
 * Entries matching one search, category, and kind.
 * @param entries - catalog entries.
 * @param filters - the query, the category, the kind, the declared categories, and the language to search in.
 * @returns the matching entries.
 */
export function filterEntries(
  entries: readonly MarketingEntry[],
  filters: {
    readonly query?: string
    readonly category?: string | null
    readonly kind?: MarketingKindFilter
    readonly categories: readonly { readonly id: string; readonly title?: Readonly<Record<string, string>> }[]
    readonly language: string
  },
): readonly MarketingEntry[] {
  const words = normalizeQuery(filters.query)
  const category = filters.category ?? null
  const kind = filters.kind ?? 'all'
  const categoryTitles = new Map(filters.categories.map(category => [category.id, titleOf(category.title, filters.language)]))
  return entries.filter(entry => matches(entry, { kind, category, words, language: filters.language, categoryTitles }))
}

/** One filter applied to one entry. */
interface EntryFilter {
  readonly kind: MarketingKindFilter
  readonly category: string | null
  readonly words: readonly string[]
  readonly language: string
  readonly categoryTitles: ReadonlyMap<string, string>
}

/**
 * Whether one entry answers the filter.
 * @param entry - one catalog entry.
 * @param filter - the active kind, category, words, and language.
 * @returns whether the entry stays listed.
 */
function matches(entry: MarketingEntry, filter: EntryFilter): boolean {
  const kindMatches = filter.kind === 'all' || entry.kind === filter.kind
  const categoryMatches = filter.category === null || entry.categories.includes(filter.category)
  if (!kindMatches || !categoryMatches) return false
  const text = searchableText(entry, filter.language, filter.categoryTitles)
  return filter.words.every(word => text.includes(word))
}

/**
 * The words one search matches, each in lower case.
 * @param query - the reader's search text; absent means no search.
 * @returns the words; empty when the text holds none.
 */
function normalizeQuery(query: string | undefined): string[] {
  return (query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/**
 * Every text one entry is searched by.
 * @param entry - one catalog entry.
 * @param language - the language the search reads titles in.
 * @param categoryTitles - declared category titles by id.
 * @returns the text, lower case and newline-separated.
 */
function searchableText(
  entry: MarketingEntry,
  language: string,
  categoryTitles: ReadonlyMap<string, string>,
): string {
  const title = entry.title[language] ?? entry.title['en']
  const description = entry.description[language] ?? entry.description['en']
  const tokens = [title, description]
  for (const id of entry.categories) tokens.push(id, categoryTitles.get(id) ?? '')
  for (const platform of entry.platforms ?? []) tokens.push(platform)
  if (entry.install.type === 'skill') for (const skill of entry.install.skills) tokens.push(skill.name)
  return tokens.join('\n').toLowerCase()
}

/**
 * A declared category's title in one language.
 * @param title - the declaration's localized text.
 * @param language - the language asked for.
 * @returns the title, or an empty string when the declaration omits one.
 */
function titleOf(title: Readonly<Record<string, string>> | undefined, language: string): string {
  if (title === undefined) return ''
  return title[language] ?? title['en'] ?? ''
}

/**
 * Count entries per category.
 * @param entries - catalog entries.
 * @returns category id to count.
 */
export function entryCounts(entries: readonly MarketingEntry[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const category of entry.categories) counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  return counts
}

/**
 * Order entries for display.
 * @param entries - entries to order.
 * @param sort - display order.
 * @param language - UI language, for name collation.
 * @returns a new ordered array; entries without stars follow all others.
 */
export function sortEntries(entries: readonly MarketingEntry[], sort: MarketingSort, language: string): readonly MarketingEntry[] {
  const collator = new Intl.Collator(language)
  const label = (entry: MarketingEntry): string => entry.title[language] ?? entry.title['en'] ?? entry.id
  const byName = (left: MarketingEntry, right: MarketingEntry): number => collator.compare(label(left), label(right))
  const ordered = [...entries]
  switch (sort) {
    case 'stars':
      return ordered.sort((left, right) => {
        const a = left.stars
        const b = right.stars
        if (a === undefined || b === undefined) {
          if (a !== b) return a === undefined ? 1 : -1
        } else if (a !== b) return b - a
        return byName(left, right)
      })
    case 'updated':
      return ordered.sort((left, right) => (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '') || byName(left, right))
    case 'name':
      return ordered.sort(byName)
  }
}

export type { MarketPlugin }
