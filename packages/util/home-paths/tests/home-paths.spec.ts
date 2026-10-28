import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AGENTS_HOME_DIR_NAME,
  DEFAULT_AGENTS_HOME_DISPLAY,
  DEFAULT_TOMATO_HOME_DISPLAY,
  TOMATO_HOME_DIR_NAME,
  agentsHomeDisplay,
  canonicalizeWatchPath,
  defaultAgentsHome,
  defaultTomatoHome,
  tomatoCachePath,
  tomatoHomeDisplay,
  tomatoHomePath,
  expandHomePath,
  resolveAgentsHome,
  resolveTomatoHome,
} from '@tomato/home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('tomato path helpers', () => {
  it('owns the shared default TOMATO home directory name', () => {
    expect(TOMATO_HOME_DIR_NAME).toBe('.tomato')
    expect(DEFAULT_TOMATO_HOME_DISPLAY).toBe('~/.tomato')
    expect(defaultTomatoHome()).toBe(join(homedir(), '.tomato'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.tomato')).toBe(join(homedir(), '.tomato'))
    expect(expandHomePath('~\\.tomato')).toBe(join(homedir(), '.tomato'))
    expect(expandHomePath('/tmp/.tomato')).toBe('/tmp/.tomato')
    expect(expandHomePath('~other/.tomato')).toBe('~other/.tomato')
  })

  it('resolves explicit path before TOMATO_HOME and the default', () => {
    const envHome = join(homedir(), 'env-tomato')

    expect(resolveTomatoHome('/tmp/explicit-tomato', { TOMATO_HOME: '~/env-tomato' })).toBe(resolve('/tmp/explicit-tomato'))
    expect(resolveTomatoHome(undefined, { TOMATO_HOME: '~/env-tomato' })).toBe(envHome)
    expect(resolveTomatoHome(undefined, {})).toBe(defaultTomatoHome())
  })

  it('treats an empty or whitespace-only TOMATO_HOME as unset', () => {
    expect(resolveTomatoHome(undefined, { TOMATO_HOME: '' })).toBe(defaultTomatoHome())
    expect(resolveTomatoHome(undefined, { TOMATO_HOME: '   ' })).toBe(defaultTomatoHome())
  })

  it('joins child segments onto the resolved TOMATO_HOME', () => {
    vi.stubEnv('TOMATO_HOME', '~/env-tomato')
    expect(tomatoHomePath()).toBe(join(homedir(), 'env-tomato'))
    expect(tomatoHomePath('storages', 'cache')).toBe(join(homedir(), 'env-tomato', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(tomatoHomeDisplay(resolve(defaultTomatoHome()))).toBe('~/.tomato')
    expect(tomatoHomeDisplay('/some/other/root')).toBe('$TOMATO_HOME')
  })

  it('owns the shared default agents home directory name', () => {
    expect(AGENTS_HOME_DIR_NAME).toBe('.agents')
    expect(DEFAULT_AGENTS_HOME_DISPLAY).toBe('~/.agents')
    expect(defaultAgentsHome()).toBe(join(homedir(), '.agents'))
  })

  it('resolves an explicit agents home before TOMATO_AGENTS_HOME and the default', () => {
    const envHome = join(homedir(), 'env-agents')

    expect(resolveAgentsHome('/tmp/explicit-agents', { TOMATO_AGENTS_HOME: '~/env-agents' })).toBe(resolve('/tmp/explicit-agents'))
    expect(resolveAgentsHome(undefined, { TOMATO_AGENTS_HOME: '~/env-agents' })).toBe(envHome)
    expect(resolveAgentsHome(undefined, {})).toBe(defaultAgentsHome())
  })

  it('treats an empty or whitespace-only TOMATO_AGENTS_HOME as unset', () => {
    expect(resolveAgentsHome(undefined, { TOMATO_AGENTS_HOME: '' })).toBe(defaultAgentsHome())
    expect(resolveAgentsHome(undefined, { TOMATO_AGENTS_HOME: '   ' })).toBe(defaultAgentsHome())
  })

  it('labels a resolved agents home by whether it is the default root', () => {
    expect(agentsHomeDisplay(resolve(defaultAgentsHome()))).toBe('~/.agents')
    expect(agentsHomeDisplay('/some/other/root')).toBe('$TOMATO_AGENTS_HOME')
  })

  it.each([
    [undefined, join(homedir(), '.tomato')],
    ['', join(homedir(), '.tomato')],
    ['   ', join(homedir(), '.tomato')],
    ['~/env-tomato', join(homedir(), 'env-tomato')],
    ['./relative-tomato', resolve('./relative-tomato')],
  ] as const)('resolves cache paths with TOMATO_HOME=%j', (home, expectedHome) => {
    vi.stubEnv('TOMATO_HOME', home)
    try {
      expect(tomatoCachePath()).toBe(join(expectedHome, 'cache'))
      expect(tomatoCachePath('models', 'index.json')).toBe(join(expectedHome, 'cache', 'models', 'index.json'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('resolves configured cache homes before the environment', () => {
    vi.stubEnv('TOMATO_HOME', '~/env-tomato')
    try {
      expect(tomatoCachePath({ tomatoHome: '~/explicit-tomato' })).toBe(join(homedir(), 'explicit-tomato', 'cache'))
      expect(tomatoCachePath({ tomatoHome: './explicit-tomato' }, 'attachments', 'request-images'))
        .toBe(resolve('./explicit-tomato/cache/attachments/request-images'))
      expect(tomatoCachePath({}, 'attachments')).toBe(join(homedir(), 'env-tomato', 'cache', 'attachments'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'tomato-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(alias)).resolves.toBe(await realpath(target))
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
