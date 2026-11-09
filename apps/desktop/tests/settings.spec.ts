import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import * as fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, onTestFinished, vi } from 'vitest'
import { readDesktopSettings } from '../src/settings.ts'

vi.mock('node:fs', async importOriginal => ({ ...await importOriginal<typeof import('node:fs')>() }))

beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { vi.restoreAllMocks() })

function fixture() {
  const userData = mkdtempSync(join(tmpdir(), 'tomato-desktop-settings-'))
  onTestFinished(() => { rmSync(userData, { recursive: true, force: true }) })
  const directory = join(userData, 'desktop')
  mkdirSync(directory)
  return { userData, path: join(directory, 'settings.json') }
}

it('creates a discoverable default file on first launch without touching other preferences', () => {
  const { userData, path } = fixture()
  rmSync(join(userData, 'desktop'), { recursive: true })
  writeFileSync(join(userData, 'keybindings.json'), 'existing shortcuts\n')
  expect(readDesktopSettings(userData)).toEqual({
    updates: { allowTestAuthPopupWindow: false },
    remote: { listenPort: 43_110, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: false },
  })
  expect(readFileSync(path, 'utf8')).toBe(`{
  "updates": {
    "allowTestAuthPopupWindow": false
  },
  "remote": {
    "listenPort": 43110,
    "keepAwake": false,
    "launchAtLogin": false,
    "trustedHosts": [],
    "tunnel": false
  }
}
`)
  expect(readFileSync(join(userData, 'keybindings.json'), 'utf8')).toBe('existing shortcuts\n')
})

it.each(['{}', '{"updates": {}}', '{"other": 1, "updates": {"other": true}}'])('defaults an older document without rewriting it: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(readDesktopSettings(userData)).toEqual({
    updates: { allowTestAuthPopupWindow: false },
    remote: { listenPort: 43_110, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: false },
  })
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it('reads each remote posture field independently', () => {
  const { userData, path } = fixture()
  type Remote = { listenPort: number; keepAwake: boolean; launchAtLogin: boolean; trustedHosts: readonly string[]; tunnel: boolean }
  const cases: readonly [Record<string, unknown>, Remote][] = [
    [{}, { listenPort: 43_110, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: false }],
    [{ listenPort: 0 }, { listenPort: 0, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: false }],
    [{ keepAwake: true }, { listenPort: 43_110, keepAwake: true, launchAtLogin: false, trustedHosts: [], tunnel: false }],
    [{ launchAtLogin: true }, { listenPort: 43_110, keepAwake: false, launchAtLogin: true, trustedHosts: [], tunnel: false }],
    [{ trustedHosts: ['hub.example'] }, { listenPort: 43_110, keepAwake: false, launchAtLogin: false, trustedHosts: ['hub.example'], tunnel: false }],
    [{ tunnel: true }, { listenPort: 43_110, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: true }],
    [{ listenPort: 65_535, keepAwake: true, launchAtLogin: true, trustedHosts: ['a.example', 'b.example:8443'] },
      { listenPort: 65_535, keepAwake: true, launchAtLogin: true, trustedHosts: ['a.example', 'b.example:8443'], tunnel: false }],
  ]
  for (const [remote, expected] of cases) {
    writeFileSync(path, JSON.stringify({ remote }))
    expect(readDesktopSettings(userData).remote).toEqual(expected)
  }
})

it.each([
  '{"remote":null}',
  '{"remote":[]}',
  '{"remote":{"listenPort":"43110"}}',
  '{"remote":{"listenPort":43110.5}}',
  '{"remote":{"listenPort":-1}}',
  '{"remote":{"listenPort":65536}}',
  '{"remote":{"keepAwake":"true"}}',
  '{"remote":{"launchAtLogin":1}}',
  '{"remote":{"trustedHosts":"hub.example"}}',
  '{"remote":{"trustedHosts":[""]}}',
  '{"remote":{"trustedHosts":[1]}}',
  '{"remote":{"tunnel":"on"}}',
])('rejects an invalid remote posture and keeps the original document: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(readDesktopSettings(userData).remote).toEqual({
    listenPort: 43_110, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: false,
  })
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), expect.any(Error))
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it('loads explicit opt-in and opt-out on the next read without changing an earlier process snapshot', () => {
  const { userData, path } = fixture()
  for (const allow of [true, false]) {
    const raw = JSON.stringify({ updates: { allowTestAuthPopupWindow: allow }, custom: 'preserve' })
    writeFileSync(path, raw)
    expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(allow)
    expect(readFileSync(path, 'utf8')).toBe(raw)
  }
  const previous = readDesktopSettings(userData)
  writeFileSync(path, '{"updates":{"allowTestAuthPopupWindow":true}}')
  expect(previous.updates.allowTestAuthPopupWindow).toBe(false)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(true)
})

it.each(['', '{', 'null', '[]', '{"updates":null}', '{"updates":[]}',
  '{"updates":{"allowTestAuthPopupWindow":"false"}}', '{"updates":{"allowTestAuthPopupWindow":1}}',
  '{"updates":{"allowTestAuthPopupWindow":null}}'])('reports invalid settings with their path and preserves the original: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), expect.any(Error))
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it('reports filesystem errors instead of replacing unreadable settings', () => {
  const { userData, path } = fixture()
  mkdirSync(path)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), expect.any(Error))
  expect(fs.statSync(path).isDirectory()).toBe(true)
})

it.each(['mkdirSync', 'writeFileSync'] as const)('continues with disabled popups when %s fails', (operation) => {
  const { userData, path } = fixture()
  const failure = Object.assign(new Error('settings creation denied'), { code: 'EACCES' })
  vi.spyOn(fs, operation).mockImplementation(() => { throw failure })
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), failure)
})

it('continues with defaults even when warning output fails', () => {
  const { userData, path } = fixture()
  writeFileSync(path, '{')
  vi.mocked(console.warn).mockImplementation(() => { throw new Error('output unavailable') })
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(readFileSync(path, 'utf8')).toBe('{')
})
