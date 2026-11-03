import test from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyManifest, gitManifestCandidates, manifestCandidates, readManifest, readReadme, readmeCandidates, stripFrontMatter,
} from '../src/host/registry.js'

test('classifyManifest tells a Tomato bundle from a DeepSeek Harness one', () => {
  assert.equal(classifyManifest({
    tomato: { bundle: { patch: './cordis.patch.yml' } },
    peerDependencies: { '@tomato/cordis': '*' },
    engines: { tomato: '>=0.2.1-rc.3' },
  }).class, 'tomato')
  const dsh = classifyManifest({
    dsh: { bundle: { patch: './cordis.patch.yml' } },
    peerDependencies: { '@deepseek-ai/cordis': '*', '@deepseek-ai/dsh-session': '*' },
    engines: { dsh: '>=0.2.1-rc.2' },
  })
  assert.equal(dsh.class, 'dsh')
  assert.equal(dsh.dshRange, '>=0.2.1-rc.2')
  assert.deepEqual(dsh.deepseekPeers, ['@deepseek-ai/cordis', '@deepseek-ai/dsh-session'])
  assert.equal(classifyManifest({ name: 'plain' }).class, 'other')
  assert.equal(classifyManifest({ peerDependencies: { '@deepseek-ai/cordis': '*' } }).class, 'dsh')
  assert.equal(classifyManifest(undefined).class, 'unknown')
  assert.equal(classifyManifest({ deprecated: 'old' }).deprecated, 'old')
})

test('stripFrontMatter removes only a leading YAML block', () => {
  assert.equal(stripFrontMatter('---\ntitle: x\n---\n# Body\n'), '# Body\n')
  assert.equal(stripFrontMatter('# Body\n'), '# Body\n')
  assert.equal(stripFrontMatter('---\ntitle: x'), '---\ntitle: x')
})

test('manifestCandidates encodes scoped names and keeps registry order', () => {
  assert.deepEqual(manifestCandidates('@scope/pkg', '1.2.3', ['https://a.test', 'https://b.test/']), [
    { registry: 'https://a.test', url: 'https://a.test/%40scope%2Fpkg/1.2.3' },
    { registry: 'https://b.test/', url: 'https://b.test/%40scope%2Fpkg/1.2.3' },
  ])
})

test('readmeCandidates reads a pinned Git README first, then the npm file CDNs', () => {
  const candidates = readmeCandidates({
    name: 'pkg',
    version: '1.0.0',
    source: { type: 'git', url: 'https://github.com/o/r', commit: 'a'.repeat(40), path: '/packages/pkg/' },
  })
  assert.equal(candidates[0].url, `https://raw.githubusercontent.com/o/r/${'a'.repeat(40)}/packages/pkg/README.md`)
  assert.equal(candidates[0].hint, 'repository')
  assert.ok(candidates.some(candidate => candidate.url === 'https://cdn.jsdelivr.net/npm/pkg@1.0.0/README.md'))
  assert.deepEqual(readmeCandidates({ name: 'pkg', version: '1.0.0', source: { type: 'npm' } }).map(c => c.hint),
    ['https://cdn.jsdelivr.net/npm', 'https://unpkg.com', 'npmmirror'])
})

test('readManifest falls back to the next registry and names every failure', async () => {
  const reads = []
  const read = async (url) => {
    reads.push(url)
    if (url.startsWith('https://official.test')) throw new Error('offline')
    return { value: { tomato: { bundle: { patch: './p.yml' } } } }
  }
  const result = await readManifest(read, 'pkg', '1.0.0', { registries: ['https://official.test', 'https://mirror.test'] })
  assert.equal(result.registry, 'https://mirror.test')
  assert.equal(reads.length, 2)
  await assert.rejects(
    readManifest(async () => { throw new Error('offline') }, 'pkg', '1.0.0', { registries: ['https://a.test', 'https://b.test'] }),
    /a\.test: offline; b\.test: offline/,
  )
})

test('readReadme falls back to the registry readme and reports none', async () => {
  const found = await readReadme(
    async url => { if (url.includes('jsdelivr')) throw new Error('missing'); return { text: '\uFEFF# Title\ntext' } },
    async () => { throw new Error('unused') },
    { name: 'pkg', version: '1.0.0', source: { type: 'npm' } },
  )
  assert.equal(found.status, 'found')
  assert.equal(found.markdown, '\uFEFF# Title\ntext')
  assert.equal(found.origin, 'https://unpkg.com')

  const registry = await readReadme(
    async () => { throw new Error('no file') },
    async () => ({ value: { readme: '# From registry' } }),
    { name: 'pkg', version: '1.0.0', source: { type: 'npm' } },
  )
  assert.equal(registry.markdown, '# From registry')
  assert.equal(registry.origin, 'registry')

  const none = await readReadme(
    async () => { throw new Error('no file') },
    async () => { throw new Error('no registry') },
    { name: 'pkg', version: '1.0.0', source: { type: 'npm' } },
  )
  assert.deepEqual(none, { status: 'none' })
})
test('gitManifestCandidates reads the pinned package.json of a GitHub monorepo', () => {
  assert.deepEqual(gitManifestCandidates({ url: 'https://github.com/o/r', commit: 'b'.repeat(40), path: 'packages/x' }),
    [`https://raw.githubusercontent.com/o/r/${'b'.repeat(40)}/packages/x/package.json`])
  assert.deepEqual(gitManifestCandidates({ url: 'https://gitlab.com/o/r', commit: 'b'.repeat(40) }), [])
})
