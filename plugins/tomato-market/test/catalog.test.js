import test from 'node:test'
import assert from 'node:assert/strict'
import { compactCatalog, parseStars, pluginStarKeys, readCatalog, resolveIcon } from '../src/host/catalog.js'

test('parseStars keys npm names and repository slugs', () => {
  const stars = parseStars({
    plugins: [
      { npm: 'dsh-context', url: 'https://github.com/owner/repo', stars: 120 },
      { npm: null, url: 'https://github.com/Other/Project.git', stars: 7 },
      { url: 'https://gitlab.com/team/project', stars: 3 },
      { npm: 'no-stars' },
    ],
  })
  assert.deepEqual(stars, { 'npm:dsh-context': 120, 'gh:owner/repo': 120, 'gh:other/project': 7 })
})

test('pluginStarKeys prefers the package name and then the repository', () => {
  assert.deepEqual(pluginStarKeys({ name: 'pkg', repository: { url: 'https://github.com/Owner/Repo' } }), ['npm:pkg', 'gh:owner/repo'])
  assert.deepEqual(pluginStarKeys({ name: 'pkg' }), ['npm:pkg'])
})

test('resolveIcon resolves relative icons and keeps data and absolute URLs', () => {
  assert.equal(resolveIcon('icons/a.svg', 'https://market.example/deep/index.json'), 'https://market.example/deep/icons/a.svg')
  assert.equal(resolveIcon('data:image/svg+xml;base64,AA', 'https://market.example/index.json'), 'data:image/svg+xml;base64,AA')
  assert.equal(resolveIcon('https://other.example/a.png', 'https://market.example/index.json'), 'https://other.example/a.png')
})

test('compactCatalog keeps display fields, trims versions, and drops unknown members', () => {
  const catalog = compactCatalog({
    format: 1,
    title: { en: 'Catalog', zh: '目录' },
    metadata: {
      categories: { ui: { title: { en: 'UI' } }, tools: { title: { zh: '工具', en: 'Tools' } } },
      labels: { ignored: { title: { en: 'Ignored' } } },
      sortKeys: {},
    },
    plugins: [
      {
        name: 'pkg',
        title: { en: 'Package', zh: '包' },
        description: { en: 'x'.repeat(1000), zh: '说明' },
        icon: 'icons/pkg.svg',
        author: 'Author',
        homepage: 'https://example.com',
        repository: { url: 'https://github.com/o/r', directory: 'packages/pkg' },
        metadata: { category: 'ui', keywords: ['a', 'b'], labels: [], sortKeys: {} },
        versions: Array.from({ length: 30 }, (_, index) => ({
          version: `1.0.${index}`,
          publishTimestamp: index,
          source: { type: 'npm', registry: 'https://registry.example' },
          engines: { dsh: '>=0.2.0', tomato: '>=0.1.0' },
        })),
        unknown: 'dropped',
      },
      { name: 'no-versions', versions: [] },
      { title: 'nameless', versions: [] },
    ],
  }, { indexUrl: 'https://market.example/index.json' })
  assert.deepEqual(catalog.title, { en: 'Catalog', zh: '目录' })
  assert.deepEqual(catalog.categories, [
    { id: 'ui', title: { en: 'UI' } },
    { id: 'tools', title: { zh: '工具', en: 'Tools' } },
  ])
  assert.equal(catalog.plugins.length, 1)
  const [kept] = catalog.plugins
  assert.equal(kept.name, 'pkg')
  assert.equal(kept.icon, 'https://market.example/icons/pkg.svg')
  assert.equal(kept.repository.directory, 'packages/pkg')
  assert.equal(kept.versions.length, 24)
  assert.equal(kept.versions[0].dsh, '>=0.2.0')
  assert.equal(kept.versions[0].tomato, '>=0.1.0')
  assert.deepEqual(kept.keywords, ['a', 'b'])
  assert.ok(kept.description.en.length <= 400)
  assert.equal(kept.unknown, undefined)
})

test('compactCatalog rejects documents that are not format-1 indexes', () => {
  assert.throws(() => compactCatalog({ format: 2, plugins: [] }, { indexUrl: 'https://x.test/index.json' }), /format-1/)
  assert.throws(() => compactCatalog({ format: 1 }, { indexUrl: 'https://x.test/index.json' }), /format-1/)
  assert.throws(() => compactCatalog(null, { indexUrl: 'https://x.test/index.json' }), /format-1/)
})

test('readCatalog falls back through mirrors and reports the one that answered', async () => {
  const tried = []
  const read = async (url) => {
    tried.push(url)
    if (url.includes('first')) throw new Error('down')
    return { value: { format: 1, title: 'ok', plugins: [] } }
  }
  const result = await readCatalog(read, ['https://first.example/index.json', 'https://second.example/index.json'])
  assert.deepEqual(tried, ['https://first.example/index.json', 'https://second.example/index.json'])
  assert.equal(result.indexUrl, 'https://second.example/index.json')
  assert.equal(result.document.format, 1)
  await assert.rejects(readCatalog(async () => { throw new Error('down') }, ['https://x.test/index.json']), /down/)
})
test('compactCatalog orders versions newest first', () => {
  const catalog = compactCatalog({
    format: 1,
    title: 'x',
    plugins: [{ name: 'pkg', versions: [
      { version: '1.0.0', publishTimestamp: 10, source: { type: 'npm' } },
      { version: '2.0.0', publishTimestamp: 30, source: { type: 'npm' } },
      { version: '1.5.0', publishTimestamp: 20, source: { type: 'npm' } },
    ] }],
  }, { indexUrl: 'https://x.test/index.json' })
  assert.deepEqual(catalog.plugins[0].versions.map(version => version.version), ['2.0.0', '1.5.0', '1.0.0'])
})
