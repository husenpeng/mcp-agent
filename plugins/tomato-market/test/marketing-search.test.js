import test from 'node:test'
import assert from 'node:assert/strict'
import { accessTag, entryCounts, filterEntries, kindKey, oneClick, pluginTarget, sortEntries } from '../src/client/marketing-search.js'
import { DICTIONARIES } from '../src/client/i18n.js'

const categories = [{ id: 'video', title: { zh: '视频', en: 'Video' } }, { id: 'seo', title: { zh: '搜索', en: 'Search' } }]
const entries = [
  { id: 'a', kind: 'mcp', title: { en: 'Alpha', zh: '甲' }, description: { en: 'TikTok reader' }, repository: 'https://github.com/o/a', stars: 5, pushedAt: '2026-01-01', categories: ['video'], install: { type: 'mcp', package: 'alpha-pkg' } },
  { id: 'b', kind: 'skill', title: { en: 'Beta' }, description: { en: 'Keywords' }, repository: 'https://github.com/o/b', stars: 50, pushedAt: '2026-03-01', categories: ['video', 'seo'], install: { type: 'skill', skills: [{ name: 'cold-email', path: 'x' }] } },
  { id: 'c', kind: 'plugin', title: { en: 'Gamma' }, description: { en: 'Plugin' }, repository: 'https://github.com/o/c', stars: 50, pushedAt: '2026-02-01', categories: ['seo'], install: { type: 'manual' } },
]
const ids = list => list.map(entry => entry.id)
const filter = filters => ids(filterEntries(entries, { categories, language: 'zh', ...filters }))

test('an entry appears under every category it names', () => {
  assert.deepEqual(filter({ category: 'video' }), ['a', 'b'])
  assert.deepEqual(filter({ category: 'seo' }), ['b', 'c'])
  assert.deepEqual([...entryCounts(entries)], [['video', 2], ['seo', 2]])
})

test('type, category, and search combine', () => {
  assert.deepEqual(filter({ kind: 'skill' }), ['b'])
  assert.deepEqual(filter({ kind: 'skill', category: 'seo' }), ['b'])
  assert.deepEqual(filter({ kind: 'mcp', category: 'seo' }), [])
})

test('search reaches English text, package, skill, and category names in either language', () => {
  assert.deepEqual(filter({ query: 'tiktok' }), ['a'])
  assert.deepEqual(filter({ query: 'alpha-pkg' }), ['a'])
  assert.deepEqual(filter({ query: 'cold-email' }), ['b'])
  assert.deepEqual(filter({ query: '搜索' }), ['b', 'c'])
  assert.deepEqual(filter({ query: 'tiktok 甲' }), ['a'])
})

test('sorting breaks star ties by name and handles dates', () => {
  assert.deepEqual(ids(sortEntries(entries, 'stars', 'en')), ['b', 'c', 'a'])
  assert.deepEqual(ids(sortEntries(entries, 'updated', 'en')), ['b', 'c', 'a'])
  assert.deepEqual(ids(sortEntries(entries, 'name', 'en')), ['a', 'b', 'c'])
})

test('manual entries offer no one-click install', () => {
  assert.equal(oneClick(entries[0]), true)
  assert.equal(oneClick(entries[2]), false)
})

test('pluginTarget hands the general install flow the pinned version', () => {
  const { plugin, version } = pluginTarget({ title: { en: 'P' }, repository: 'https://github.com/o/p', install: { type: 'plugin', name: 'pkg', version: '1.2.3' } })
  assert.equal(plugin.name, 'pkg')
  assert.deepEqual(plugin.versions, [version])
  assert.deepEqual(version, { version: '1.2.3', source: { type: 'npm' } })
})

test('every access and kind label exists in both languages', () => {
  const keys = [...['free-key', 'self-hosted', 'login'].map(access => accessTag(access).key), ...['plugin', 'mcp', 'skill'].map(kindKey)]
  assert.equal(accessTag('none'), undefined)
  for (const key of keys) {
    assert.ok(DICTIONARIES.zh[key] !== undefined, key)
    assert.ok(DICTIONARIES.en[key] !== undefined, key)
  }
})

test('both dictionaries declare the same keys and tab names', () => {
  assert.deepEqual(Object.keys(DICTIONARIES.zh).sort(), Object.keys(DICTIONARIES.en).sort())
  assert.equal(DICTIONARIES.zh.tab, '通用插件市场')
  assert.equal(DICTIONARIES.zh.marketingTab, '营销插件市场')
  assert.equal(DICTIONARIES.en.tab, 'General plugins')
  assert.equal(DICTIONARIES.en.marketingTab, 'Marketing plugins')
})
