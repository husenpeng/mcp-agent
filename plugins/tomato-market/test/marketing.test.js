import test from 'node:test'
import assert from 'node:assert/strict'
import { readMarketingCatalog } from '../index.js'
import { ENTRY_ID, mcpCommand, safeRelativePath, validateMarketingCatalog } from '../src/host/marketing.js'

const skill = (name = 'one') => ({
  id: 's', kind: 'skill', access: 'none', title: { en: 'S' }, description: { en: 'D' }, categories: ['a'],
  install: { type: 'skill', repo: 'o/r', commit: 'a'.repeat(40), skills: [{ name, path: `skills/${name}` }] },
})
const document = (...entries) => ({ format: 1, categories: [{ id: 'a', title: { en: 'A' } }], entries })

test('the bundled catalog validates and keeps the reviewed shape', () => {
  const { entries, categories } = readMarketingCatalog()
  assert.equal(entries.length, 107)
  assert.equal(categories.length, 11)
  assert.equal(entries.filter(entry => entry.access === 'login').length, 5)
  assert.ok(entries.every(entry => entry.access === 'none' || entry.setup !== undefined))
  const foundation = entries.filter(entry => entry.categories.includes('foundation'))
  assert.ok(foundation.every(entry => !entry.categories.includes('social-data')))
  assert.ok(entries.every(entry => ENTRY_ID.test(entry.id) && `mkt-${entry.id}`.length <= 32))
})

test('no catalog text or environment entry carries a credential value', () => {
  const text = JSON.stringify(readMarketingCatalog().entries)
  assert.doesNotMatch(text, /sk-[A-Za-z0-9]{20}|ghp_[A-Za-z0-9]{20}/)
  for (const entry of readMarketingCatalog().entries) {
    for (const name of entry.env ?? []) assert.match(name, /^[A-Z][A-Z0-9_]*$/)
  }
})

test('validation names the first invalid entry', () => {
  assert.throws(() => validateMarketingCatalog({ format: 2 }), /format must be 1/)
  assert.throws(() => validateMarketingCatalog(document({ ...skill(), access: 'paid' })), /entry s: unknown access/)
  assert.throws(() => validateMarketingCatalog(document({ ...skill(), access: 'login' })), /needs setup text/)
  assert.throws(() => validateMarketingCatalog(document({ ...skill(), categories: ['missing'] })), /declared categories/)
  assert.throws(() => validateMarketingCatalog(document(skill(), skill())), /duplicate id/)
  assert.throws(() => validateMarketingCatalog(document(skill(), { ...skill(), id: 't' })), /skill one is also installed by s/)
})

test('skill paths cannot leave the repository', () => {
  assert.ok(safeRelativePath(''))
  assert.ok(safeRelativePath('skills/a'))
  for (const path of ['/etc', '../a', 'a/../b', 'a//b', 'a\\b', '.', 'a/']) assert.equal(safeRelativePath(path), false, path)
  const invalid = skill()
  invalid.install.skills[0].path = '../outside'
  assert.throws(() => validateMarketingCatalog(document(invalid)), /path \.\.\/outside is invalid/)
})

test('an MCP install refuses unpinned or shell-shaped commands', () => {
  const mcp = install => ({ ...skill(), kind: 'mcp', install: { type: 'mcp', runner: 'npx', package: 'pkg', version: '1.0.0', ...install } })
  assert.equal(validateMarketingCatalog(document(mcp({}))).entries.length, 1)
  assert.throws(() => validateMarketingCatalog(document(mcp({ version: 'latest' }))), /version must be exact/)
  assert.throws(() => validateMarketingCatalog(document(mcp({ runner: 'bash' }))), /runner must be/)
  assert.throws(() => validateMarketingCatalog(document(mcp({ package: 'a;rm -rf' }))), /package is invalid/)
})

test('mcpCommand pins the package for both runners', () => {
  assert.deepEqual(mcpCommand({ runner: 'npx', package: '@a/b', version: '1.0.0' }), { command: 'npx', args: ['-y', '@a/b@1.0.0'] })
  assert.deepEqual(mcpCommand({ runner: 'npx', package: 'a', version: '1.0.0', bin: 'a-mcp', args: ['--x'] }),
    { command: 'npx', args: ['-y', '--package', 'a@1.0.0', 'a-mcp', '--x'] })
  assert.deepEqual(mcpCommand({ runner: 'uvx', package: 'a', version: '1.0', args: ['stdio'] }), { command: 'uvx', args: ['a==1.0', 'stdio'] })
  assert.deepEqual(mcpCommand({ runner: 'uvx', package: 'a', version: '1.0', bin: 'b' }), { command: 'uvx', args: ['--from', 'a==1.0', 'b'] })
})
