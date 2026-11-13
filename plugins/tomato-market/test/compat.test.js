import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as tar from 'tar'
import {
  adaptManifest, isRewrittenFile, mapPackageName, mapSpecifier, normalizeHarnessMetadata, rewriteText,
} from '../src/host/compat.js'
import { adaptedFileName, createAdapter, safeArchiveEntry } from '../src/host/adapt.js'

test('mapPackageName follows the Tomato rescope table', () => {
  assert.equal(mapPackageName('@tomato/cli'), '@tomato/cli')
  assert.equal(mapPackageName('@tomato/branded'), '@tomato/branded')
  assert.equal(mapPackageName('@tomato/harness'), '@tomato/harness')
  assert.equal(mapPackageName('@tomato/subagent-sdk'), '@tomato/subagent-sdk')
  assert.equal(mapPackageName('@tomato/x'), '@tomato/x')
  assert.equal(mapPackageName('@tomato/client-ui-primitives'), '@tomato/client-ui-primitives')
  assert.equal(mapPackageName('@tomato/cordis'), '@tomato/cordis')
  assert.equal(mapPackageName('@tomato/schemastery'), '@tomato/schemastery')
  assert.equal(mapPackageName('@cordisjs/plugin-loader'), '@tomato/cordis-plugin-loader')
  assert.equal(mapPackageName('@cordisjs/plugin-custom'), '@tomato/cordis-plugin-custom')
  assert.equal(mapPackageName('@deepseek-ai/libreoffice-kit'), '@deepseek-ai/libreoffice-kit')
  assert.equal(mapPackageName('@deepseek-ai/libreoffice-kit-darwin-arm64'), '@deepseek-ai/libreoffice-kit-darwin-arm64')
  assert.equal(mapPackageName('react'), 'react')
})

test('mapSpecifier keeps subpaths and leaves unknown packages alone', () => {
  assert.equal(mapSpecifier('@tomato/session/types'), '@tomato/session/types')
  assert.equal(mapSpecifier('@tomato/client-ui-primitives'), '@tomato/client-ui-primitives')
  assert.equal(mapSpecifier('@deepseek-ai/libreoffice-kit/style.css'), '@deepseek-ai/libreoffice-kit/style.css')
  assert.equal(mapSpecifier('node:fs'), 'node:fs')
  assert.equal(mapSpecifier('./local.js'), './local.js')
})

test('rewriteText changes imports, YAML rows, and JSON, but not repository URLs', () => {
  const text = [
    "import { Context } from '@tomato/cordis'",
    "const schema = require('@tomato/schemastery')",
    "    - name: '@tomato/session'",
    '{"peer": "@tomato/client-locale"}',
    'https://github.com/deepseek-ai/deepseek-harness',
  ].join('\n')
  const rewritten = rewriteText(text)
  assert.match(rewritten, /from '@tomato\/cordis'/)
  assert.match(rewritten, /require\('@tomato\/schemastery'\)/)
  assert.match(rewritten, /name: '@tomato\/session'/)
  assert.match(rewritten, /"@tomato\/client-locale"/)
  assert.match(rewritten, /https:\/\/github\.com\/deepseek-ai\/deepseek-harness/)
  assert.equal(rewriteText(rewritten), rewritten)
})

test('normalizeHarnessMetadata maps client injects and profile bundles', () => {
  const normalized = normalizeHarnessMetadata({
    bundle: { patch: './cordis.patch.yml' },
    client: { platform: 'web', inject: ['@tomato/client-locale'], external: ['@tomato/api-remotes'] },
    profile: { bundles: ['@tomato/x', '@tomato/base'] },
  })
  assert.deepEqual(normalized.client.inject, ['@tomato/client-locale'])
  assert.deepEqual(normalized.client.external, ['@tomato/api-remotes'])
  assert.deepEqual(normalized.profile.bundles, ['@tomato/x', '@tomato/base'])
})

test('adaptManifest produces an installable Tomato manifest', () => {
  const { manifest, adapted } = adaptManifest({
    name: 'tomato-demo',
    version: '1.0.0',
    engines: { tomato: '>=0.2.1-rc.2', node: '>=22' },
    peerDependencies: { '@tomato/cordis': '*', react: '^18' },
    dependencies: { '@tomato/session': '^0.2.0', 'left-pad': '^1' },
    tomato: { bundle: { patch: './cordis.patch.yml' }, client: { platform: 'web', inject: ['@tomato/client-locale'] } },
  })
  assert.equal(adapted, true)
  assert.equal(manifest.tomato, undefined)
  assert.deepEqual(manifest.tomato.client.inject, ['@tomato/client-locale'])
  assert.deepEqual(manifest.peerDependencies, {
    '@tomato/cordis': '*',
    react: '^18',
    '@tomato/session': '^0.2.0',
  })
  assert.deepEqual(manifest.dependencies, { 'left-pad': '^1' })
  assert.equal(manifest.engines.tomato, '>=0.2.1-rc.2')
  assert.equal(manifest.engines.tomato, undefined)
})

test('adaptManifest keeps an existing Tomato manifest and refuses what cannot load', () => {
  const already = adaptManifest({ name: 'demo', tomato: { bundle: { patch: './p.yml' } } })
  assert.equal(already.adapted, false)
  assert.throws(() => adaptManifest({ name: 'demo' }), /neither tomato nor tomato/)
  assert.throws(() => adaptManifest({ name: 'demo', tomato: { client: { platform: 'web' } } }), /no bundle patch/)
  assert.throws(() => adaptManifest(null), /not a JSON object/)
})

test('safeArchiveEntry refuses absolute and parent paths', () => {
  assert.equal(safeArchiveEntry('package/lib/index.js'), true)
  assert.equal(safeArchiveEntry('package/../escape'), false)
  assert.equal(safeArchiveEntry('/etc/passwd'), false)
  assert.equal(safeArchiveEntry('C:\\temp\\x'), false)
})

test('adaptedFileName is filesystem safe for scoped names', () => {
  assert.equal(adaptedFileName('tomato-status-rotator', '0.38.0'), 'tomato-status-rotator-0.38.0-tomato.tgz')
  assert.equal(adaptedFileName('@scope/pkg', '1.0.0'), 'scope-pkg-1.0.0-tomato.tgz')
})

test('isRewrittenFile covers code and metadata text', () => {
  assert.equal(isRewrittenFile('package/lib/client.js'), true)
  assert.equal(isRewrittenFile('package/cordis.patch.yml'), true)
  assert.equal(isRewrittenFile('package/package.json'), true)
  assert.equal(isRewrittenFile('package/logo.png'), false)
})

test('createAdapter builds a Tomato tarball without executing package code', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'market-adapt-test-'))
  try {
    const source = join(workspace, 'source')
    const packageDir = join(source, 'package')
    await mkdir(join(packageDir, 'lib'), { recursive: true })
    await writeFile(join(packageDir, 'package.json'), JSON.stringify({
      name: 'tomato-demo',
      version: '1.2.3',
      type: 'module',
      main: 'lib/index.js',
      exports: { '.': './lib/index.js', './client': './lib/client.js' },
      peerDependencies: { '@tomato/cordis': '*' },
      tomato: { bundle: { patch: './cordis.patch.yml' }, client: { platform: 'web', inject: ['@tomato/client-locale'] } },
    }))
    await writeFile(join(packageDir, 'cordis.patch.yml'), "- insert:\n    - name: '@tomato/session'\n")
    await writeFile(join(packageDir, 'lib', 'index.js'), "export * from '@tomato/schemastery'\n")
    await writeFile(join(packageDir, 'lib', 'client.js'), "module.exports = require('@tomato/client-ui-primitives')\n")
    const archive = join(workspace, 'source.tgz')
    await tar.c({ gzip: true, file: archive, cwd: source }, ['package'])

    const adapter = createAdapter({
      cacheDir: join(workspace, 'out'),
      fetchBytes: async () => ({ bytes: new Uint8Array(await readFile(archive)) }),
    })
    const first = await adapter.adapt('tomato-demo', '1.2.3', 'https://registry.example/tomato-demo.tgz')
    assert.match(first.file, /tomato-demo-1\.2\.3-tomato\.tgz$/)
    assert.equal(first.changed, 3)

    const extracted = join(workspace, 'check')
    await mkdir(extracted)
    await tar.x({ file: first.file, cwd: extracted })
    const manifest = JSON.parse(await readFile(join(extracted, 'package', 'package.json'), 'utf8'))
    assert.equal(manifest.tomato, undefined)
    assert.deepEqual(manifest.tomato.client.inject, ['@tomato/client-locale'])
    assert.deepEqual(manifest.peerDependencies, { '@tomato/cordis': '*' })
    assert.match(await readFile(join(extracted, 'package', 'lib', 'index.js'), 'utf8'), /@tomato\/schemastery/)
    assert.match(await readFile(join(extracted, 'package', 'lib', 'client.js'), 'utf8'), /@tomato\/client-ui-primitives/)
    assert.match(await readFile(join(extracted, 'package', 'cordis.patch.yml'), 'utf8'), /@tomato\/session/)

    // The cache answers a second call without another download.
    let downloads = 0
    const cached = createAdapter({
      cacheDir: join(workspace, 'out'),
      fetchBytes: async () => { downloads += 1; return { bytes: new Uint8Array() } },
    })
    const second = await cached.adapt('tomato-demo', '1.2.3', 'https://registry.example/tomato-demo.tgz')
    assert.equal(second.file, first.file)
    assert.equal(downloads, 0)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})
