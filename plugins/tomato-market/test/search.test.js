import test from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryCounts, categorySections, filterPlugins, formatDate, formatStars, installTarget, latestVersion, localized, searchText,
  sortPlugins, starsOf, targetsDeepSeek,
} from '../src/client/search.js'

const plugin = (name, { title, description, category, keywords = [], repo, versions } = {}) => ({
  name,
  ...title === undefined ? {} : { title },
  ...description === undefined ? {} : { description },
  ...category === undefined ? {} : { category },
  ...repo === undefined ? {} : { repository: { url: repo } },
  keywords,
  versions: versions ?? [{ version: '1.0.0', publishTimestamp: 1, source: { type: 'npm' } }],
})

test('localized resolves the active language, then English, then a string', () => {
  assert.equal(localized({ zh: '中文', en: 'English' }, 'zh'), '中文')
  assert.equal(localized({ zh: '中文', en: 'English' }, 'ja'), 'English')
  assert.equal(localized('plain', 'zh'), 'plain')
  assert.equal(localized(undefined, 'zh'), '')
})

test('starsOf matches a package name before a repository slug', () => {
  const stars = { 'npm:dsh-context': 12, 'gh:owner/repo': 34 }
  assert.equal(starsOf(plugin('dsh-context'), stars), 12)
  assert.equal(starsOf(plugin('other', { repo: 'https://github.com/Owner/Repo.git' }), stars), 34)
  assert.equal(starsOf(plugin('other'), stars), undefined)
})

test('formatStars compacts large counts', () => {
  assert.equal(formatStars(0), '0')
  assert.equal(formatStars(999), '999')
  assert.equal(formatStars(1234), '1.2k')
  assert.equal(formatStars(42_000), '42k')
  assert.equal(formatStars(2_400_000), '2.4m')
  assert.equal(formatStars(undefined), '')
})

test('filterPlugins matches every search word across fields and honors the category', () => {
  const plugins = [
    plugin('dsh-context', { title: { en: 'Context dashboard', zh: '上下文看板' }, description: { en: 'Inspect tokens', zh: '查看令牌' }, category: 'ui', keywords: ['memory'] }),
    plugin('dsh-star', { title: { en: 'Star widget' }, category: 'ui' }),
  ]
  assert.deepEqual(filterPlugins(plugins, { query: 'context token', language: 'en' }).map(p => p.name), ['dsh-context'])
  assert.deepEqual(filterPlugins(plugins, { query: '星', language: 'zh' }).map(p => p.name), [])
  assert.deepEqual(filterPlugins(plugins, { query: '看板', language: 'zh' }).map(p => p.name), ['dsh-context'])
  assert.deepEqual(filterPlugins(plugins, { query: '', category: 'ui', language: 'en' }).map(p => p.name), ['dsh-context', 'dsh-star'])
  assert.equal(filterPlugins(plugins, { query: 'absent', language: 'en' }).length, 0)
})

test('searchText is cached per plugin and language', () => {
  const one = plugin('pkg', { title: { zh: '甲', en: 'A' } })
  assert.match(searchText(one, 'zh'), /甲/)
  assert.match(searchText(one, 'en'), /a/)
  assert.equal(searchText(one, 'zh'), searchText(one, 'zh'))
})

test('sortPlugins orders by stars, update time, and name', () => {
  const stars = { 'npm:a': 5, 'npm:b': 50 }
  const a = plugin('a', { title: 'Alpha', versions: [{ version: '1.0.0', publishTimestamp: 10, source: { type: 'npm' } }] })
  const b = plugin('b', { title: 'Beta', versions: [{ version: '1.0.0', publishTimestamp: 20, source: { type: 'npm' } }] })
  const c = plugin('c', { title: 'Gamma', versions: [{ version: '1.0.0', publishTimestamp: 30, source: { type: 'npm' } }] })
  assert.deepEqual(sortPlugins([a, c, b], 'stars', stars, 'en').map(p => p.name), ['b', 'a', 'c'])
  assert.deepEqual(sortPlugins([a, c, b], 'updated', stars, 'en').map(p => p.name), ['c', 'b', 'a'])
  assert.deepEqual(sortPlugins([b, c, a], 'name', stars, 'en').map(p => p.name), ['a', 'b', 'c'])
  assert.deepEqual(sortPlugins([a, b], 'name', stars, 'en'), [a, b])
})

test('categorySections counts, orders, and limits each category', () => {
  const plugins = [
    plugin('a', { category: 'ui' }),
    plugin('b', { category: 'ui' }),
    plugin('c', { category: 'tools' }),
    plugin('d'),
  ]
  const categories = [{ id: 'ui', title: { en: 'UI' } }, { id: 'tools', title: { en: 'Tools' } }, { id: 'empty', title: { en: 'Empty' } }]
  assert.deepEqual([...categoryCounts(plugins)], [['ui', 2], ['tools', 1]])
  const sections = categorySections(plugins, categories, {}, 'en', 1)
  assert.deepEqual(sections.map(section => section.id), ['ui', 'tools'])
  assert.equal(sections[0].total, 2)
  assert.equal(sections[0].plugins.length, 1)
})

test('installTarget names the npm spec and registry, or the pinned commit', () => {
  assert.deepEqual(installTarget(plugin('pkg'), { version: '1.2.3', source: { type: 'npm', registry: 'https://mirror.example' } }),
    { spec: 'pkg@1.2.3', registry: 'https://mirror.example' })
  assert.deepEqual(installTarget(plugin('pkg'), {
    version: '1.2.3',
    source: { type: 'git', url: 'https://github.com/o/r', commit: 'a'.repeat(40), path: 'packages/x' },
  }), { spec: `git+https://github.com/o/r.git#${'a'.repeat(40)}&path:/packages/x` })
})

test('targetsDeepSeek and latestVersion read the catalog version facts', () => {
  const one = plugin('pkg', { versions: [
    { version: '2.0.0', publishTimestamp: 2, source: { type: 'npm' }, dsh: '>=0.2.0' },
    { version: '1.0.0', publishTimestamp: 1, source: { type: 'npm' } },
  ] })
  assert.equal(latestVersion(one).version, '2.0.0')
  assert.equal(targetsDeepSeek(latestVersion(one)), true)
  assert.equal(targetsDeepSeek(latestVersion(plugin('pkg'))), false)
})
test('formatDate reads publish times as Unix seconds', () => {
  const text = formatDate(1793549803, 'en')
  assert.match(text, /2026/)
})

test('categorySections applies the chosen order inside each section', () => {
  const plugins = [
    plugin('a', { title: 'Zeta', category: 'ui' }),
    plugin('b', { title: 'Alpha', category: 'ui' }),
  ]
  const categories = [{ id: 'ui', title: { en: 'UI' } }]
  assert.deepEqual(categorySections(plugins, categories, { 'npm:a': 10 }, 'en', 5)[0].plugins.map(p => p.name), ['a', 'b'])
  assert.deepEqual(categorySections(plugins, categories, { 'npm:a': 10 }, 'en', 5, 'name')[0].plugins.map(p => p.name), ['b', 'a'])
})
