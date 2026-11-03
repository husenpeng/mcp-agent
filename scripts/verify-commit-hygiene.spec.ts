import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { emitSource, pathViolations, verifyCommitHygiene } from './verify-commit-hygiene.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function git(root: string, ...args: string[]): void {
  execFileSync('git', args, { cwd: root, stdio: 'pipe' })
}

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'tomato-commit-hygiene-'))
  roots.push(root)
  git(root, 'init', '--quiet')
  git(root, 'config', 'user.email', 'spec@example.invalid')
  git(root, 'config', 'user.name', 'spec')
  write(root, files)
  git(root, 'add', '--all')
  git(root, 'commit', '--quiet', '--no-verify', '-m', 'base')
  return root
}

function write(root: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
}

function stage(root: string, files: Record<string, string>): void {
  write(root, files)
  git(root, 'add', '--all', '--force')
}

function rules(root: string, cached: boolean): string[] {
  return verifyCommitHygiene(root, cached).map(violation => `${violation.file}${violation.line === undefined ? '' : `:${String(violation.line)}`} ${violation.rule}`)
}

describe('path rules', () => {
  it('rejects compiler emit beside its TypeScript source under src/', () => {
    const indexed = new Set(['packages/g/p/src/index.ts', 'packages/g/p/src/view.tsx', 'packages/g/p/src/index.d.ts'])
    expect(emitSource('packages/g/p/src/index.d.ts', indexed)).toBe('packages/g/p/src/index.ts')
    expect(emitSource('packages/g/p/src/index.js.map', indexed)).toBe('packages/g/p/src/index.ts')
    expect(emitSource('packages/g/p/src/view.js', indexed)).toBe('packages/g/p/src/view.tsx')
  })

  it.each([
    ['a hand-written ambient declaration', 'packages/g/p/src/css-modules.d.ts'],
    ['a test fixture beside its wrapper', 'packages/g/p/tests/fixtures/mod.mjs'],
    ['a JavaScript-only plugin source', 'plugins/market/src/host/http.js'],
  ])('accepts %s', (_name, file) => {
    const indexed = new Set([file, 'packages/g/p/tests/fixtures/mod.ts'])
    expect(pathViolations([file], indexed)).toEqual([])
  })

  it.each([
    ['packages/g/p/node_modules/x/index.js', 'dependency directory'],
    ['packages/g/p/lib/index.js', 'build output directory'],
    ['apps/web/dist/index.html', 'build output directory'],
    ['plugins/market/market-0.2.0.tgz', 'packed tarball'],
    ['packages/g/p/tsconfig.tsbuildinfo', 'TypeScript build info'],
    ['desktop-test-logs/run.txt', 'log file'],
    ['apps/desktop/trace.log', 'log file'],
    ['scratch/try.ts', 'local debugging file'],
    ['packages/g/p/tests/probe.local.ts', 'local debugging file'],
    ['packages/g/p/tests/probe.scratch.spec.ts', 'local debugging file'],
  ])('rejects %s as a %s', (file, rule) => {
    expect(pathViolations([file], new Set([file])).map(violation => violation.rule)).toEqual([rule])
  })
})

describe('repository scan', () => {
  it('passes a clean tree in both modes', () => {
    const root = repository({ 'packages/g/p/src/index.ts': 'export const ready = true\n' })
    expect(rules(root, false)).toEqual([])
    expect(rules(root, true)).toEqual([])
  })

  it('rejects staged emit, focused tests, breakpoints, and markers by line', () => {
    const root = repository({ 'packages/g/p/src/index.ts': 'export const ready = true\n' })
    stage(root, {
      'packages/g/p/src/index.d.ts': 'export declare const ready = true\n',
      'packages/g/p/tests/a.spec.ts': 'describe("a", () => {\n  it.only("b", () => {})\n  describe.skip.only("c", () => {})\n})\n',
      'packages/g/p/src/debug.ts': 'export function f(): void {\n  debugger\n}\n// NOCOMMIT: local probe\n',
      'python/pkg/run.py': 'import pdb\nbreakpoint()\n',
    })
    expect(rules(root, true)).toEqual([
      'packages/g/p/src/index.d.ts build output beside source',
      'packages/g/p/tests/a.spec.ts:2 focused test',
      'packages/g/p/tests/a.spec.ts:3 focused test',
      'packages/g/p/src/debug.ts:2 debugger statement',
      'python/pkg/run.py:1 Python breakpoint',
      'python/pkg/run.py:2 Python breakpoint',
      'packages/g/p/src/debug.ts:4 nocommit marker',
    ])
  })

  it('accepts look-alikes that are not debugging residue', () => {
    const root = repository({ 'packages/g/p/src/index.ts': 'export const ready = true\n' })
    stage(root, {
      'packages/g/p/src/look.ts': [
        'const options = { only: true }',
        'export const filter = list.only(value)',
        'export const label = "debugger"',
        "send(agent, 'do not commit')",
        '',
      ].join('\n'),
    })
    expect(rules(root, true)).toEqual([])
  })

  it('checks only staged additions in cached mode and every tracked file otherwise', () => {
    const root = repository({ 'packages/g/p/tests/a.spec.ts': 'it.only("old", () => {})\n' })
    stage(root, { 'packages/g/p/src/index.ts': 'export const ready = true\n' })
    expect(rules(root, true)).toEqual([])
    expect(rules(root, false)).toEqual(['packages/g/p/tests/a.spec.ts:1 focused test'])
  })

  it('leaves vendored sources to upstream style', () => {
    const root = repository({ 'vendor/lib-a/src/index.ts': 'debugger\n' })
    expect(rules(root, false)).toEqual([])
  })
})
