/**
 * Pure catalog views: localized text, GitHub star lookup, keyword search,
 * ordering, and category sections. No React and no network, so the behavior is
 * testable in Node.
 */

/**
 * Resolve a catalog text value in the active language.
 * @param {string | Record<string, string> | undefined} value - catalog text.
 * @param {string} language - active UI language.
 * @returns {string} the best available text.
 */
export function localized(value, language) {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  return value[language] ?? value.en ?? Object.values(value)[0] ?? ''
}

/**
 * The version a card presents: the first listed version, which the catalog orders newest first.
 * @param {{ versions: Array<object> }} plugin - one plugin.
 * @returns {object | undefined} that version.
 */
export function latestVersion(plugin) {
  return plugin.versions[0]
}

/**
 * Read a plugin's GitHub stars from the star map.
 * @param {{ name: string, repository?: { url?: string } }} plugin - one plugin.
 * @param {Record<string, number>} stars - keys `npm:<name>` or `gh:<owner>/<repo>`.
 * @returns {number | undefined} the count.
 */
export function starsOf(plugin, stars) {
  const direct = stars[`npm:${plugin.name}`]
  if (direct !== undefined) return direct
  const slug = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(plugin.repository?.url ?? '')
  if (slug === null) return undefined
  return stars[`gh:${slug[1].toLowerCase()}/${slug[2].toLowerCase()}`]
}

/** @param {number | undefined} count - star count. @returns {string} compacted count such as `1.2k`. */
export function formatStars(count) {
  if (count === undefined) return ''
  if (count < 1000) return String(count)
  if (count < 1_000_000) return `${(count / 1000).toFixed(count < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
}

/** @param {number} timestamp - Unix seconds, as the index format declares publish times. @param {string} language - UI language. @returns {string} local date. */
export function formatDate(timestamp, language) {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return ''
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(timestamp * 1000))
}

const searchTexts = new WeakMap()

/**
 * The lowercased search text of one plugin in one language.
 * @param {object} plugin - one plugin.
 * @param {string} language - UI language.
 * @returns {string} text matched by {@link filterPlugins}.
 */
export function searchText(plugin, language) {
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
 * @param {object[]} plugins - catalog plugins.
 * @param {{ query?: string, category?: string | null, language: string }} filters - active filters.
 * @returns {object[]} matching plugins in catalog order.
 */
export function filterPlugins(plugins, { query = '', category = null, language }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0 && category === null) return plugins
  return plugins.filter(plugin => {
    if (category !== null && plugin.category !== category) return false
    if (words.length === 0) return true
    const text = searchText(plugin, language)
    return words.every(word => text.includes(word))
  })
}

/**
 * Order plugins for display.
 * @param {object[]} plugins - plugins to order.
 * @param {'stars' | 'updated' | 'name'} sort - display order.
 * @param {Record<string, number>} stars - star map.
 * @param {string} language - UI language, for name collation.
 * @returns {object[]} a new ordered array; plugins without stars follow all others.
 */
export function sortPlugins(plugins, sort, stars, language) {
  const collator = new Intl.Collator(language)
  const byName = (a, b) => collator.compare(localized(a.title, language) || a.name, localized(b.title, language) || b.name)
  const ordered = [...plugins]
  switch (sort) {
    case 'stars':
      return ordered.sort((a, b) => {
        const left = starsOf(a, stars)
        const right = starsOf(b, stars)
        if (left === undefined || right === undefined) {
          if (left !== right) return left === undefined ? 1 : -1
        } else if (left !== right) return right - left
        return byName(a, b)
      })
    case 'updated':
      return ordered.sort((a, b) => (latestVersion(b)?.publishTimestamp ?? 0) - (latestVersion(a)?.publishTimestamp ?? 0) || byName(a, b))
    case 'name':
      return ordered.sort(byName)
    default:
      return ordered
  }
}

/**
 * Count plugins per declared category.
 * @param {object[]} plugins - catalog plugins.
 * @returns {Map<string, number>} category id to count; undeclared categories are absent.
 */
export function categoryCounts(plugins) {
  const counts = new Map()
  for (const plugin of plugins) {
    if (plugin.category === undefined) continue
    counts.set(plugin.category, (counts.get(plugin.category) ?? 0) + 1)
  }
  return counts
}

/**
 * One browse section per category, most populated first.
 * @param {object[]} plugins - catalog plugins.
 * @param {Array<{ id: string, title: unknown }>} categories - declared categories.
 * @param {Record<string, number>} stars - star map.
 * @param {string} language - UI language.
 * @param {number} limit - plugins shown per section.
 * @param {'stars' | 'updated' | 'name'} sort - order inside each section.
 * @returns {Array<{ id: string, title: string, count: number, plugins: object[], total: number }>} sections.
 */
export function categorySections(plugins, categories, stars, language, limit, sort = 'stars') {
  const counts = categoryCounts(plugins)
  const declared = categories.filter(category => counts.has(category.id))
  const titleOf = new Map(declared.map(category => [category.id, localized(category.title, language)]))
  const extra = [...counts.keys()].filter(id => !titleOf.has(id))
  for (const id of extra) titleOf.set(id, id)
  return [...titleOf.keys()]
    .map(id => {
      const members = sortPlugins(plugins.filter(plugin => plugin.category === id), sort, stars, language)
      return { id, title: titleOf.get(id) ?? id, count: counts.get(id) ?? 0, total: members.length, plugins: members.slice(0, limit) }
    })
    .sort((a, b) => b.total - a.total || new Intl.Collator(language).compare(a.title, b.title))
}

/**
 * Whether a version declares DeepSeek Harness requirements in the catalog.
 * @param {object} version - one listed version.
 * @returns {boolean} whether `engines.dsh` is present.
 */
export function targetsDeepSeek(version) {
  return typeof version?.dsh === 'string'
}

/**
 * The install arguments for one version.
 * @param {{ name: string }} plugin - the plugin.
 * @param {object} version - the listed version.
 * @returns {{ spec: string, registry?: string }} what the Plugins page's install dialog needs.
 */
export function installTarget(plugin, version) {
  if (version.source.type === 'git') {
    return { spec: `git+${version.source.url}.git#${version.source.commit}${version.source.path === undefined ? '' : `&path:/${version.source.path}`}` }
  }
  return {
    spec: `${plugin.name}@${version.version}`,
    ...version.source.registry === undefined ? {} : { registry: version.source.registry },
  }
}