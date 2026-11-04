/**
 * Pure views of the marketing catalog: search, filters, ordering, and the
 * bridge to the plugin install flow. No React and no network.
 */
import { localized } from './search.js'

/**
 * The lowercased text one entry matches against.
 * @param {object} entry - a catalog entry.
 * @param {Map<string, string>} categoryTitles - category id to localized title.
 * @param {string} language - UI language.
 * @returns {string} the search text.
 */
function entryText(entry, categoryTitles, language) {
  return [
    entry.id,
    localized(entry.title, 'en'),
    localized(entry.title, language),
    localized(entry.description, 'en'),
    localized(entry.description, language),
    entry.repository,
    entry.install.package ?? entry.install.name ?? '',
    ...entry.categories.map(id => categoryTitles.get(id) ?? id),
    ...(entry.install.skills ?? []).map(skill => skill.name),
  ].join('\n').toLowerCase()
}

/**
 * Filter entries by category, type, and every search word.
 * @param {object[]} entries - catalog entries.
 * @param {object} filters - active filters.
 * @param {string} [filters.query] - search text.
 * @param {string | null} [filters.category] - category id.
 * @param {'all' | 'plugin' | 'mcp' | 'skill'} [filters.kind] - entry kind.
 * @param {Array<{ id: string, title: unknown }>} filters.categories - declared categories.
 * @param {string} filters.language - UI language.
 * @returns {object[]} matches in catalog order.
 */
export function filterEntries(entries, { query = '', category = null, kind = 'all', categories, language }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const titles = new Map(categories.map(entry => [entry.id, localized(entry.title, language)]))
  return entries.filter((entry) => {
    if (kind !== 'all' && entry.kind !== kind) return false
    if (category !== null && !entry.categories.includes(category)) return false
    if (words.length === 0) return true
    const text = entryText(entry, titles, language)
    return words.every(word => text.includes(word))
  })
}

/**
 * Order entries for display.
 * @param {object[]} entries - entries to order.
 * @param {'stars' | 'updated' | 'name'} sort - display order.
 * @param {string} language - UI language, for name collation.
 * @returns {object[]} a new ordered array.
 */
export function sortEntries(entries, sort, language) {
  const collator = new Intl.Collator(language)
  const byName = (a, b) => collator.compare(localized(a.title, language), localized(b.title, language))
  const ordered = [...entries]
  switch (sort) {
    case 'updated': return ordered.sort((a, b) => b.pushedAt.localeCompare(a.pushedAt) || byName(a, b))
    case 'name': return ordered.sort(byName)
    default: return ordered.sort((a, b) => b.stars - a.stars || byName(a, b))
  }
}

/**
 * Count entries per category, after the type filter and before the category one.
 * @param {object[]} entries - catalog entries.
 * @returns {Map<string, number>} category id to count.
 */
export function entryCounts(entries) {
  const counts = new Map()
  for (const entry of entries) {
    for (const id of entry.categories) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

/**
 * Whether an entry installs with one click.
 * @param {object} entry - a catalog entry.
 * @returns {boolean} false for entries that need the manual steps.
 */
export function oneClick(entry) {
  return entry.install.type !== 'manual'
}

/**
 * The plugin record the general market's install flow takes.
 * @param {object} entry - a catalog entry whose install type is `plugin`.
 * @returns {{ plugin: object, version: object }} the plugin and its pinned version.
 */
export function pluginTarget(entry) {
  const version = { version: entry.install.version, source: { type: 'npm' } }
  return {
    plugin: { name: entry.install.name, title: entry.title, repository: { url: entry.repository }, versions: [version] },
    version,
  }
}

/**
 * The display key of an entry's access requirement.
 * @param {string} access - the entry's `access`.
 * @returns {{ key: string, tone: string } | undefined} translation key and tag tone; undefined when nothing is required.
 */
export function accessTag(access) {
  switch (access) {
    case 'free-key': return { key: 'accessFreeKey', tone: 'info' }
    case 'self-hosted': return { key: 'accessSelfHosted', tone: 'neutral' }
    case 'login': return { key: 'accessLogin', tone: 'warning' }
    default: return undefined
  }
}

/** @param {string} kind - the entry's `kind`. @returns {string} its translation key. */
export function kindKey(kind) {
  switch (kind) {
    case 'plugin': return 'kindPlugin'
    case 'mcp': return 'kindMcp'
    default: return 'kindSkill'
  }
}
