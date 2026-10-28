/** Fixtures contain both spellings, so the codemod must never rewrite this file. */

import { describe, expect, it } from 'vitest'
import { isTomatoExcluded, rescopeLine, rescopeTomatoText } from './rescope-to-tomato.ts'

describe('package names', () => {
  it.each([
    ['@deepseek-ai/dsh-agent', '@tomato/agent'],
    ['@deepseek-ai/dsh-session-format-v0-to-v1', '@tomato/session-format-v0-to-v1'],
    ['@deepseek-ai/dsh', '@tomato/cli'],
    ['@deepseek-ai/dsh/', '@tomato/cli/'],
    ['@deepseek-ai/dsh-brand', '@tomato/branded'],
    ['@deepseek-ai/dsh-root', '@tomato/harness'],
    ['@deepseek-ai/dsh-subagent-dsh-sdk', '@tomato/subagent-sdk'],
    ['@deepseek-ai/cordis', '@tomato/cordis'],
    ['@deepseek-ai/cordis-plugin-loader', '@tomato/cordis-plugin-loader'],
    ['@deepseek-ai/node-addon-system', '@tomato/node-addon-system'],
    ['@deepseek-ai/website', '@tomato/website'],
  ])('%s becomes %s', (input, expected) => {
    expect(rescopeLine(input)).toBe(expected)
  })

  it('keeps the subpath', () => {
    expect(rescopeLine("'@deepseek-ai/dsh-api-gateway/stream-protocol'")).toBe("'@tomato/api-gateway/stream-protocol'")
  })

  it('does not confuse the exact dsh package with its siblings', () => {
    expect(rescopeLine('@deepseek-ai/dsh-agent')).toBe('@tomato/agent')
    expect(rescopeLine('@deepseek-ai/dshx')).toBe('@tomato/x')
  })
})

describe('third-party packages under the old scope', () => {
  it.each([
    '@deepseek-ai/libreoffice-kit',
    '@deepseek-ai/libreoffice-kit-darwin-arm64',
    '@deepseek-ai/libreoffice-kit-wasm',
    '@deepseek-ai/libreoffice-kit.createConverter',
  ])('leaves %s untouched', (input) => {
    expect(rescopeLine(input)).toBe(input)
  })
})

describe('runtime identifiers', () => {
  it.each([
    ['DSH_HOME', 'TOMATO_HOME'],
    ['DSH_ENV_PREFIX', 'TOMATO_ENV_PREFIX'],
    ['DshEnvironmentKey', 'TomatoEnvironmentKey'],
    ['DshBundleManifest', 'TomatoBundleManifest'],
    ['dshHome', 'tomatoHome'],
    ['dshDesktopAppId', 'tomatoDesktopAppId'],
    ['~/.dsh', '~/.tomato'],
    ['dsh.cmd', 'tomato.cmd'],
    ['dsh-v0.1.0-rc.5', 'tomato-v0.1.0-rc.5'],
    ['dsh-app://index.html', 'tomato-app://index.html'],
    ['dsh-resource://file/x', 'tomato-resource://file/x'],
    ['"dsh": { "profile": true }', '"tomato": { "profile": true }'],
    ['dsh.profile.bundles', 'tomato.profile.bundles'],
    ["'dsh.sessions.current'", "'tomato.sessions.current'"],
  ])('%s becomes %s', (input, expected) => {
    expect(rescopeLine(input)).toBe(expected)
  })

  it('renames bare package references to the new full name', () => {
    expect(rescopeLine('uses `dsh-agent` and `dsh-session-format`')).toBe('uses `@tomato/agent` and `@tomato/session-format`')
  })

  it('matches the longest package leaf first', () => {
    expect(rescopeLine('dsh-session-format-v0-to-v1')).toBe('@tomato/session-format-v0-to-v1')
  })
})

describe('DeepSeek identity', () => {
  it.each([
    'DEEPSEEK_API_KEY',
    'DEEPSEEK_BASE_URL',
    'https://api.deepseek.com/v1',
    'deepseek-v4-flash',
    'deepseek-official',
    'llm-deepseek',
    'github.com/deepseek-ai/deepseek-harness',
  ])('keeps %s', (input) => {
    expect(rescopeLine(input)).toBe(input)
  })

  it('renames the product name', () => {
    expect(rescopeLine('DeepSeek Harness (`dsh`)')).toBe('Tomato Harness (`tomato`)')
    expect(rescopeLine('DeepSeek 的插件树')).toBe('Tomato 的插件树')
  })
})

describe('rewrite contract', () => {
  it('is idempotent', () => {
    const once = rescopeTomatoText('@deepseek-ai/dsh-agent DSH_HOME dshHome ~/.dsh\n')
    expect(once.text).toBe('@tomato/agent TOMATO_HOME tomatoHome ~/.tomato\n')
    expect(rescopeTomatoText(once.text)).toEqual({ text: once.text, lines: 0 })
  })

  it('counts changed lines', () => {
    expect(rescopeTomatoText('untouched\n@deepseek-ai/dsh-agent\nDSH_HOME\n')).toEqual({
      text: 'untouched\n@tomato/agent\nTOMATO_HOME\n',
      lines: 2,
    })
  })
})

describe('file selection', () => {
  it.each([
    '.agents/notes/implemented/architecture/example.md',
    'docs/upgrade-guide/v0.2.0-rc.2/example/guide.md',
    'docs/tomato/adr/0001-example.md',
    'scripts/snapshots/example.jsonl',
    'scripts/rescope-to-tomato.ts',
    'scripts/rescope-vendor.ts',
    'docs/rescope.md',
    'docs/tomato/decisions.md',
    'pnpm-lock.yaml',
    'vendor/cordis/README.md',
    'packages/core/agent/README.i18n.yaml',
  ])('excludes %s', (file) => {
    expect(isTomatoExcluded(file)).toBe(true)
  })

  it.each([
    'packages/core/agent/src/index.ts',
    'packages/core/agent/package.json',
    'apps/desktop/cli/dsh',
    'apps/desktop/cli/dsh.cmd',
    'apps/desktop/config/development.env',
    'vendor/README.md',
    '.github/workflows/ci.yml',
    'snapshots/session/text-turn/cordis.yml',
  ])('includes %s', (file) => {
    expect(isTomatoExcluded(file)).toBe(false)
  })
})
