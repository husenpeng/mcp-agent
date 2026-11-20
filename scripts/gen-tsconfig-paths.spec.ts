import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  collectPackageAliases,
  collectPackageNames,
  mappedSpecifiers,
  renderAliases,
  uncoveredPackages,
  writeRegion,
} from './gen-tsconfig-paths.ts'

const root = resolve(import.meta.dirname, '..')

describe('generated tsconfig package aliases', () => {
  it('maps each package to its own source directory', () => {
    const aliases = collectPackageAliases()
    expect(aliases.length).toBeGreaterThan(100)
    const session = aliases.find(alias => alias.specifier === '@tomato/session')
    expect(session).toEqual({
      specifier: '@tomato/session',
      source: './packages/core/session/src',
    })
    // Sorted, so a package added anywhere lands in a stable spot in the diff.
    expect([...aliases].sort((a, b) => a.specifier.localeCompare(b.specifier))).toEqual(aliases)
    // Only packages named after their directory: the rest carry hand-written
    // aliases, because the removed wildcards could never have resolved them.
    expect(aliases.some(alias => alias.specifier === '@tomato/typert-protocol')).toBe(false)
  })

  it('yields to a hand-written alias and closes without a trailing comma', () => {
    const aliases = [
      { specifier: '@tomato/a', source: './packages/g/a/src' },
      { specifier: '@tomato/b', source: './packages/g/b/src' },
      { specifier: '@tomato/c', source: './packages/g/c/src' },
    ]
    const body = renderAliases(aliases, new Set(['@tomato/a']))

    expect(body).toBe([
      '      "@tomato/b": ["./packages/g/b/src"]',
      '      "@tomato/c": ["./packages/g/c/src"]',
    ].join(',\n'))
    expect(body.endsWith(',')).toBe(false)
  })

  it('replaces only the marked region', () => {
    // The region behaves like any other member of `paths`: it trails a comma while members follow it.
    const text = [
      '{',
      '  "paths": {',
      '      // BEGIN generated package aliases — pnpm run gen-tsconfig-paths',
      '      "stale": ["gone"]',
      '      // END generated package aliases',
      '      "@tomato/handwritten": ["./packages/g/hand/src"]',
      '  },',
      '  "after": 2',
      '}',
    ].join('\n')

    const next = writeRegion(text, '      "fresh": ["kept"]')

    expect(next).toContain('  "after": 2')
    expect(next).toContain('"fresh": ["kept"],')
    expect(next).toContain('"@tomato/handwritten": ["./packages/g/hand/src"]')
    expect(next).not.toContain('stale')
    expect(() => { JSON.parse(next.replace(/^\s*\/\/.*$/gm, '')) }).not.toThrow()
  })

  it('wraps a hand-maintained alias block in the markers on its first write', () => {
    const text = [
      '{',
      '  "paths": {',
      '      "@tomato/a": ["./packages/g/a/src"],',
      '      "@tomato/b": ["./packages/g/b/src"],',
      '      "@tomato/handwritten": ["./packages/g/hand/src"]',
      '  }',
      '}',
    ].join('\n')

    const next = writeRegion(text, '      "@tomato/a": ["./packages/g/a/src"]')

    expect(next).toContain('// BEGIN generated package aliases')
    expect(next).toContain('// END generated package aliases')
    // The generated member comes before the hand-written ones, which keep their own trailing comma.
    expect(next.indexOf('@tomato/a')).toBeLessThan(next.indexOf('@tomato/handwritten'))
    expect(next).toContain('"@tomato/b": ["./packages/g/b/src"],')
    expect(next).toContain('"@tomato/handwritten": ["./packages/g/hand/src"]')
  })

  it('keeps hand-written members after the region valid on every rewrite', () => {
    const text = [
      '{',
      '  "paths": {',
      '      // BEGIN generated package aliases — pnpm run gen-tsconfig-paths',
      '      "@tomato/a": ["./packages/g/a/src"]',
      '      // END generated package aliases',
      '      "@tomato/b": ["./packages/g/b/src"],',
      '      "@tomato/handwritten": ["./packages/g/hand/src"]',
      '  }',
      '}',
    ].join('\n')

    const next = writeRegion(text, '      "@tomato/a": ["./packages/g/a/src"]')

    // The rewritten text parses once its line comments, the only non-JSON syntax here, are dropped.
    expect(() => { JSON.parse(next.replace(/^\s*\/\/.*$/gm, '')) }).not.toThrow()
  })

  it('refuses a config without the region markers', () => {
    expect(() => writeRegion('{}', '')).toThrow('missing the generated-region markers')
  })

  it('names a package that no alias covers', () => {
    // Deleting the group wildcards removed the fallback that used to resolve a
    // package nobody had aliased. A package whose name does not match its
    // directory is skipped by the generator, so without this check it would
    // resolve through the workspace symlink to built lib/types instead.
    expect(uncoveredPackages(
      ['@tomato/a', '@tomato/b'],
      new Set(['@tomato/a']),
    )).toEqual(['@tomato/b'])

    expect(uncoveredPackages(['@tomato/a'], new Set(['@tomato/a']))).toEqual([])
  })

  it('covers every workspace package in the committed config', () => {
    const config = readFileSync(resolve(root, 'tsconfig.base.json'), 'utf8')
    // Includes the packages the generator skips because their name does not
    // match their directory: those carry hand-written aliases.
    const names = collectPackageNames()
    expect(names).toContain('@tomato/typert-protocol')
    expect(uncoveredPackages(names, mappedSpecifiers(config))).toEqual([])
  })

  it('leaves no wildcard that probes every package group', () => {
    const config = readFileSync(resolve(root, 'tsconfig.base.json'), 'utf8')
    // A wildcard lists one candidate per group, so resolving a package late in
    // the list costs a filesystem probe — and under tsx a decorated module
    // error — for every group before it.
    expect(config).not.toContain('"@tomato/*":')
  })
})
