/** The packaging adapter, the hashed NSIS sources, and the shipped NSIS text must agree on one tomato identifier set. */
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { NSIS_SOURCES } from '../scripts/nsis-sources.ts'

const appRoot = fileURLToPath(new URL('..', import.meta.url))
const pathOf = (path: string): string => relative(appRoot, path).replaceAll('\\', '/')
const sources = [...NSIS_SOURCES, join(appRoot, 'tests/fixtures/installer-directory-smoke.nsi')]
  .map(path => [pathOf(path), readFileSync(path, 'utf8')] as const)
const adapter = readFileSync(join(appRoot, 'scripts', 'windows-directory-installer.mjs'), 'utf8')

/** Names electron-builder or the adapter defines at packaging time, after these sources load. */
const INJECTED = ['TOMATO_SEVENZIP_PATH', 'TOMATO_SEVENZIP_LICENSE_DIR', 'TOMATO_UPDATER_CACHE_NAME']

it.each(sources)('%s carries no legacy dsh identifier', (path, text) => {
  expect(text, path).not.toMatch(/dsh/i)
})

it('hashes every NSIS source the desktop ships', () => {
  const shipped = [
    ...['installer.nsh', 'installer-directories.nsh'].map(name => `scripts/${name}`),
    ...readdirSync(join(appRoot, 'installer')).filter(name => name.endsWith('.nsh')).map(name => `installer/${name}`),
  ].sort()
  expect(NSIS_SOURCES.map(pathOf).sort(), 'NSIS_SOURCES').toEqual(shipped)
})

it('declares every macro and function the adapter inserts', () => {
  const declared = sources.flatMap(([, text]) => [...text.matchAll(/^(?:!macro|Function)\s+(\w+)/gm)].map(([, name]) => name))
  const inserted = [...adapter.matchAll(/!insertmacro\s+(tomato\w+)|Call (tomato\w+)/g)].map(([, macro, call]) => macro ?? call)
  expect(inserted.length).toBeGreaterThan(0)
  for (const name of new Set(inserted)) expect(declared, name).toContain(name)
})

it('resolves every tomato define to a source or packaging definition', () => {
  const text = sources.map(([, source]) => source).join('\n')
  const declared = [...text.matchAll(/!define\s+(TOMATO_\w+)/g)].map(([, name]) => name)
  const referenced = [...new Set([...text.matchAll(/\$\{(TOMATO_\w+)\}/g)].map(([, name]) => name))]
  expect(referenced.length).toBeGreaterThan(0)
  for (const name of referenced) expect([...declared, ...INJECTED], name).toContain(name)
  for (const name of INJECTED) expect(adapter, name).toContain(`!define ${name}`)
})
