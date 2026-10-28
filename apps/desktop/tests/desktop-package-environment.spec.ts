import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadDesktopPackageEnvironment, localMacOSPackageEnvironment, validateDesktopPackageEnvironment } from '../scripts/desktop-package-environment.mjs'
import { resolveWindowsPackageSettings } from '../scripts/windows-package-settings.mjs'

const WINDOWS = { platform: 'win32', arch: 'x64' } as const
const MACOS = { platform: 'darwin', arch: 'arm64' } as const
const POLICY = { TOMATO_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN: 'https://policy.example.com',
  TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG: JSON.stringify({ allowedAuthOrigins: ['https://login.example.com'] }) }
const RELEASE = { ...POLICY, TOMATO_DESKTOP_APP_ID: 'com.example.desktop', DOWNLOAD_TEST_ORIGIN: 'https://updates.example.com',
  DOWNLOAD_TEST_RELEASE_ID: '0123456789abcdef0123456789abcdef' }
const MAC_IDENTITY = { TOMATO_DESKTOP_MACOS_SIGNING_IDENTITY: 'Example Company (TEAMID1234)', TOMATO_DESKTOP_MACOS_TEAM_ID: 'TEAMID1234' }

async function withDirectory(action: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'desktop-env-'))
  try {
    await action(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

describe('Desktop local packaging configuration', () => {
  it('treats the file as defaults and lets a personal Windows compression value win', async () => {
    expect(resolveWindowsPackageSettings({}).compressionLevel).toBe(3)
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), 'TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL=3\n')
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', {}, directory)).compressionLevel).toBe(3)
      const personal = loadDesktopPackageEnvironment('win32', { TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL: '5' }, directory)
      expect(resolveWindowsPackageSettings(personal).compressionLevel).toBe(5)
    })
  })

  it('reads a preset beside the platform templates when no machine configuration is set', async () => {
    await withDirectory(async (directory) => {
      await mkdir(join(directory, 'config', 'windows-packaging'), { recursive: true })
      await writeFile(join(directory, 'config', 'windows-packaging', 'test.env'),
        'TOMATO_DESKTOP_AUTO_UPDATE_ENV=test\nTOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL=9\n')
      const selected = loadDesktopPackageEnvironment('win32', { TOMATO_PACKAGING_PRESET: 'test' }, directory, { unsigned: true })
      expect(resolveWindowsPackageSettings(selected).compressionLevel).toBe(9)
      const personal = loadDesktopPackageEnvironment('win32',
        { TOMATO_PACKAGING_PRESET: 'test', TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL: '5' }, directory, { unsigned: true })
      expect(resolveWindowsPackageSettings(personal).compressionLevel).toBe(5)
    })
  })

  it.each([
    ['win32', 'test', 'windows-packaging'],
    ['win32', 'production', 'windows-packaging'],
    ['darwin', 'test', 'macos-packaging'],
    ['darwin', 'production', 'macos-packaging'],
  ] as const)('accepts the committed %s %s template', async (platform, preset, directoryName) => {
    await withDirectory(async (directory) => {
      const target = join(directory, 'config', directoryName, `${preset}.env`)
      await mkdir(join(directory, 'config', directoryName), { recursive: true })
      await writeFile(target, await readFile(new URL(`../config/${directoryName}/${preset}.env.example`, import.meta.url), 'utf8'))
      const selected = loadDesktopPackageEnvironment(platform, { TOMATO_PACKAGING_PRESET: preset }, directory, { unsigned: true })
      expect(selected.TOMATO_DESKTOP_AUTO_UPDATE_ENV).toBe(preset)
    })
  })

  it('lets a personal release setting override the selected preset file', async () => {
    await withDirectory(async (directory) => {
      await mkdir(join(directory, 'presets'))
      await writeFile(join(directory, 'presets', 'test.env'),
        'TOMATO_DESKTOP_AUTO_UPDATE_ENV=test\nTOMATO_DESKTOP_APP_ID=com.example.file\n')
      const parent = { TOMATO_PACKAGING_CONFIG_DIR: directory, TOMATO_PACKAGING_PRESET: 'test',
        TOMATO_DESKTOP_APP_ID: 'com.example.personal' }
      expect(loadDesktopPackageEnvironment('win32', parent, directory, { unsigned: true }).TOMATO_DESKTOP_APP_ID)
        .toBe('com.example.personal')
      const fileOnly = { TOMATO_PACKAGING_CONFIG_DIR: directory, TOMATO_PACKAGING_PRESET: 'test' }
      expect(loadDesktopPackageEnvironment('win32', fileOnly, directory, { unsigned: true }).TOMATO_DESKTOP_APP_ID)
        .toBe('com.example.file')
    })
  })

  it.each(['3', '7'])('applies an explicit Windows workflow compression override %s', async (value) => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), 'TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL=5\n')
      const selected = loadDesktopPackageEnvironment('win32', { PACKAGE_WINDOWS_COMPRESSION_LEVEL: value }, directory)
      expect(resolveWindowsPackageSettings(selected).compressionLevel).toBe(Number(value))
      const unchanged = loadDesktopPackageEnvironment('win32', { PACKAGE_WINDOWS_COMPRESSION_LEVEL: '' }, directory)
      expect(resolveWindowsPackageSettings(unchanged).compressionLevel).toBe(5)
    })
  })

  it.each(['0', '5', '7', '9'])('retains explicit Windows file compression %s outside the workflow', async (value) => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), `TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL=${value}\n`)
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', {}, directory)).compressionLevel).toBe(Number(value))
    })
  })

  it('keeps the legacy builder override below the file-owned Windows setting', () => {
    expect(resolveWindowsPackageSettings({ ELECTRON_BUILDER_COMPRESSION_LEVEL: '7' }).compressionLevel).toBe(7)
    expect(resolveWindowsPackageSettings({ ELECTRON_BUILDER_COMPRESSION_LEVEL: '7', TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL: '3' }).compressionLevel).toBe(3)
  })

  it.each(['test', 'production'])('uses the same Windows compression defaults and overrides for %s', async (preset) => {
    await withDirectory(async (directory) => {
      await mkdir(join(directory, 'presets'))
      const path = join(directory, 'presets', `${preset}.env`)
      const parent = { TOMATO_PACKAGING_CONFIG_DIR: directory, TOMATO_PACKAGING_PRESET: preset }
      await writeFile(path, `TOMATO_DESKTOP_AUTO_UPDATE_ENV=${preset}\n`)
      const load = (environment: NodeJS.ProcessEnv) => resolveWindowsPackageSettings(
        loadDesktopPackageEnvironment('win32', environment, directory, { unsigned: true }),
      ).compressionLevel
      expect(load(parent)).toBe(3)
      await writeFile(path, `TOMATO_DESKTOP_AUTO_UPDATE_ENV=${preset}\nTOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL=9\n`)
      expect(load(parent)).toBe(9)
      expect(load({ ...parent, PACKAGE_WINDOWS_COMPRESSION_LEVEL: '3' })).toBe(3)
      expect(load({ ...parent, PACKAGE_WINDOWS_COMPRESSION_LEVEL: '7' })).toBe(7)
    })
  })

  it.each([' ', '0', '5', '9', '-1', '10', '3.5', '03', 'fast'])('rejects invalid workflow compression %j before reading settings', (value) => {
    expect(() => loadDesktopPackageEnvironment('win32', { PACKAGE_WINDOWS_COMPRESSION_LEVEL: value }, 'missing-settings'))
      .toThrow('PACKAGE_WINDOWS_COMPRESSION_LEVEL')
  })

  it('rejects a Windows compression override for macOS before reading settings', () => {
    expect(() => loadDesktopPackageEnvironment('darwin', { PACKAGE_WINDOWS_COMPRESSION_LEVEL: '3' }, 'missing-settings'))
      .toThrow('PACKAGE_WINDOWS_COMPRESSION_LEVEL')
  })
  it.each(['', '-1', '10', '3.5', '03', 'fast'])('rejects invalid compression %j before preparation', (value) => {
    const selected = { ...RELEASE, TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL: value }
    expect(() => { validateDesktopPackageEnvironment(selected, WINDOWS, { unsigned: true }) })
      .toThrow('COMPRESSION_LEVEL')
  })

  it.each(['', ' ', 'relative/cache'])('rejects invalid package caches before any signing mode %j', (directory) => {
    for (const target of [WINDOWS, MACOS]) {
      for (const options of [{ unsigned: true }, { prepareOnly: true }, {}]) {
        expect(() => { validateDesktopPackageEnvironment({ TOMATO_DESKTOP_PACKAGE_CACHE_DIR: directory }, target, options) })
          .toThrow('TOMATO_DESKTOP_PACKAGE_CACHE_DIR')
      }
    }
  })

  it('preserves the machine package cache when loading a release file', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), '')
      expect(loadDesktopPackageEnvironment('win32', { TOMATO_DESKTOP_PACKAGE_CACHE_DIR: directory }, directory))
        .toEqual({ TOMATO_DESKTOP_PACKAGE_CACHE_DIR: directory })
    })
  })
  it('selects macOS local defaults while excluding inherited release settings and retaining build networking', () => {
    const parent = {
      PATH: 'build-tools', HTTPS_PROXY: 'http://proxy.example:8080', TOMATO_DESKTOP_NPM_REGISTRY: 'https://registry.npmmirror.com',
      TOMATO_DESKTOP_APP_ID: 'com.example.release', TOMATO_DESKTOP_UNSIGNED: '0',
      TOMATO_DESKTOP_AUTO_UPDATE_ENV: 'production', TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG: 'invalid-json',
      TOMATO_DESKTOP_MANDATORY_UPDATE_PROD_ORIGIN: 'https://policy.example.com',
      TOMATO_DESKTOP_MACOS_SIGNING_IDENTITY: 'Release identity', CSC_LINK: 'missing.p12',
      APPLE_API_KEY: 'missing.p8', DOWNLOAD_PROD_UNKNOWN: 'unused-secret',
    }
    const local = localMacOSPackageEnvironment(parent)
    expect(local).toEqual({
      PATH: parent.PATH, HTTPS_PROXY: parent.HTTPS_PROXY, TOMATO_DESKTOP_NPM_REGISTRY: parent.TOMATO_DESKTOP_NPM_REGISTRY,
      TOMATO_DESKTOP_APP_ID: 'vip.tomatoai.harness', TOMATO_DESKTOP_UNSIGNED: '1',
    })
    expect(() => { validateDesktopPackageEnvironment(local, MACOS, { unsigned: true }) }).not.toThrow()
    expect(parent.TOMATO_DESKTOP_UNSIGNED).toBe('0')
    expect(parent.TOMATO_DESKTOP_APP_ID).toBe('com.example.release')
  })

  it('takes cache concurrency from the Windows file and lets a personal value win', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), '')
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', {}, directory)).signatureCacheConcurrency).toBe(4)
      await writeFile(join(directory, '.env.windows'), 'TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY=2\n')
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', {}, directory)).signatureCacheConcurrency).toBe(2)
      const parent = { TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: '8' }
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', parent, directory)).signatureCacheConcurrency).toBe(8)
    })
  })

  it('takes pack concurrency from the Windows file and lets a personal value win', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), '')
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', {}, directory)).packConcurrency).toBe(4)
      await writeFile(join(directory, '.env.windows'), 'TOMATO_DESKTOP_WINDOWS_PACK_CONCURRENCY=2\n')
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', {}, directory)).packConcurrency).toBe(2)
      const parent = { TOMATO_DESKTOP_WINDOWS_PACK_CONCURRENCY: '8' }
      expect(resolveWindowsPackageSettings(loadDesktopPackageEnvironment('win32', parent, directory)).packConcurrency).toBe(8)
    })
  })

  it.each(['', '0', '-1', '1.5', 'Infinity', '01', '9007199254740992'])('rejects invalid pack concurrency %s', (value) => {
    expect(() => resolveWindowsPackageSettings({ TOMATO_DESKTOP_WINDOWS_PACK_CONCURRENCY: value })).toThrow('PACK_CONCURRENCY')
    for (const options of [{ unsigned: true }, { prepareOnly: true }]) {
      expect(() => {
        validateDesktopPackageEnvironment({ ...RELEASE, TOMATO_DESKTOP_WINDOWS_PACK_CONCURRENCY: value }, WINDOWS, options)
      }).toThrow('PACK_CONCURRENCY')
    }
  })

  it.each(['1', '2', '4', '8'])('accepts cache concurrency %s', (value) => {
    const settings = resolveWindowsPackageSettings({ TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: value })
    expect(settings.signatureCacheConcurrency).toBe(Number(value))
  })

  it.each(['', '0', '-1', '9', '1.5', 'Infinity', '01'])('rejects invalid cache concurrency %s', (value) => {
    expect(() => resolveWindowsPackageSettings({ TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: value })).toThrow('integer from 1 to 8')
    for (const options of [{ unsigned: true }, { prepareOnly: true }]) {
      expect(() => {
        validateDesktopPackageEnvironment({ ...RELEASE, TOMATO_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: value }, WINDOWS, options)
      }).toThrow('integer from 1 to 8')
    }
  })

  it('loads the platform file, keeps literal secrets, and drops unrelated release values', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.windows'), '\uFEFFTOMATO_DESKTOP_APP_ID=com.example.windows\r\nTOMATO_DESKTOP_WINDOWS_TOKEN_PIN=" #!$%&literal "\r\nTOMATO_DESKTOP_WINDOWS_CER_FILE="keys/public certificate.cer"\r\n')
      await writeFile(join(directory, '.env.macos'), 'TOMATO_DESKTOP_APP_ID=com.example.mac\nAPPLE_KEYCHAIN_PROFILE=release\nCSC_LINK=keys/signing.p12\nCSC_KEY_PASSWORD=" # literal "\n')
      const winParent = {
        PATH: 'build-tools', APPLE_ID: 'stale-apple-id', CSC_LINK: 'stale-certificate',
        DOWNLOAD_PROD_UNKNOWN: 'unused-secret', dsh_desktop_mandatory_update_config: 'stale-policy',
      }
      expect(loadDesktopPackageEnvironment('win32', winParent, directory)).toEqual({
        PATH: 'build-tools', TOMATO_DESKTOP_APP_ID: 'com.example.windows',
        TOMATO_DESKTOP_WINDOWS_TOKEN_PIN: ' #!$%&literal ',
        TOMATO_DESKTOP_WINDOWS_CER_FILE: join(directory, 'keys', 'public certificate.cer'),
      })
      expect(loadDesktopPackageEnvironment('darwin', { PATH: 'build-tools' }, directory)).toEqual({
        PATH: 'build-tools', TOMATO_DESKTOP_APP_ID: 'com.example.mac', APPLE_KEYCHAIN_PROFILE: 'release',
        CSC_LINK: join(directory, 'keys/signing.p12'), CSC_KEY_PASSWORD: ' # literal ',
      })
      const personal = loadDesktopPackageEnvironment('win32', { TOMATO_DESKTOP_APP_ID: 'com.example.personal' }, directory)
      expect(personal.TOMATO_DESKTOP_APP_ID).toBe('com.example.personal')
      expect(winParent).not.toHaveProperty('TOMATO_DESKTOP_WINDOWS_TOKEN_PIN')
    })
  })

  it.each(['win32', 'darwin'] as const)('prefers a personal %s release ID over the file and rejects an absent ID', async (platform) => {
    await withDirectory(async (directory) => {
      const settings = Object.entries(RELEASE).map(([name, value]) => `${name}='${value}'`).join('\n') + '\n'
      const file = join(directory, platform === 'win32' ? '.env.windows' : '.env.macos')
      const personal = 'a'.repeat(32)
      await writeFile(file, settings)
      expect(loadDesktopPackageEnvironment(platform, { DOWNLOAD_TEST_RELEASE_ID: personal }, directory).DOWNLOAD_TEST_RELEASE_ID)
        .toBe(personal)
      expect(loadDesktopPackageEnvironment(platform, {}, directory).DOWNLOAD_TEST_RELEASE_ID)
        .toBe(RELEASE.DOWNLOAD_TEST_RELEASE_ID)
      await writeFile(file, settings.replace(`DOWNLOAD_TEST_RELEASE_ID='${RELEASE.DOWNLOAD_TEST_RELEASE_ID}'\n`, ''))
      const missing = loadDesktopPackageEnvironment(platform, {}, directory)
      expect(missing.DOWNLOAD_TEST_RELEASE_ID).toBeUndefined()
      expect(() => {
        validateDesktopPackageEnvironment(missing, platform === 'win32' ? WINDOWS : MACOS)
      }).toThrow(/DOWNLOAD_TEST_RELEASE_ID/u)
      expect(loadDesktopPackageEnvironment(platform, { DOWNLOAD_TEST_RELEASE_ID: personal }, directory).DOWNLOAD_TEST_RELEASE_ID)
        .toBe(personal)
    })
  })

  it('lets personal policy settings override the file without changing the parent', async () => {
    await withDirectory(async (directory) => {
      const windowsPolicy = JSON.stringify({ intervalMs: 5000, allowedPageOrigins: ['https://download.example.invalid'] })
      const macPolicy = JSON.stringify({ intervalMs: 6000, allowedPageOrigins: ['https://download.example.invalid'] })
      const personalPolicy = JSON.stringify({ intervalMs: 7000, allowedPageOrigins: ['https://download.example.invalid'] })
      const origins = { TOMATO_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN: 'https://test.example.invalid',
        TOMATO_DESKTOP_MANDATORY_UPDATE_PROD_ORIGIN: 'https://prod.example.invalid' }
      const lines = Object.entries(origins).map(([key, value]) => `${key}=${value}\n`).join('')
      await writeFile(join(directory, '.env.windows'), `${lines}TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG='${windowsPolicy}'\n`)
      await writeFile(join(directory, '.env.macos'), `${lines}TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG='${macPolicy}'\n`)
      expect(loadDesktopPackageEnvironment('win32', {}, directory)).toEqual({ ...origins, TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG: windowsPolicy })
      expect(loadDesktopPackageEnvironment('darwin', {}, directory)).toEqual({ ...origins, TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG: macPolicy })
      const parent = { TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG: personalPolicy }
      expect(loadDesktopPackageEnvironment('win32', parent, directory).TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG).toBe(personalPolicy)
      expect(parent.TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG).toBe(personalPolicy)
    })
  })

  it('requires the local file even when ambient configuration exists and rejects other-platform fields', async () => {
    await withDirectory(async (directory) => {
      expect(() => loadDesktopPackageEnvironment('win32', RELEASE, directory)).toThrow(/copy .*\.env.windows.example/u)
      await writeFile(join(directory, '.env.windows'), 'APPLE_APP_SPECIFIC_PASSWORD=secret-sentinel\n')
      expect(() => loadDesktopPackageEnvironment('win32', {}, directory)).toThrow(/unsupported setting APPLE_APP_SPECIFIC_PASSWORD/u)
      expect(() => loadDesktopPackageEnvironment('win32', {}, directory)).not.toThrow(/secret-sentinel/u)
    })
  })

  it('checks application and update configuration before Windows credentials while preserving unsigned and preparation modes', () => {
    expect(() => {
      validateDesktopPackageEnvironment({}, WINDOWS, { unsigned: true })
    }).toThrow(/TOMATO_DESKTOP_APP_ID/u)
    expect(() => {
      validateDesktopPackageEnvironment({ TOMATO_DESKTOP_APP_ID: 'invalid' }, WINDOWS)
    }).toThrow(/reverse-DNS/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...POLICY, TOMATO_DESKTOP_APP_ID: RELEASE.TOMATO_DESKTOP_APP_ID }, WINDOWS)
    }).toThrow(/DOWNLOAD_TEST_ORIGIN/u)
    expect(() => {
      validateDesktopPackageEnvironment(RELEASE, WINDOWS)
    }).toThrow(/TOMATO_DESKTOP_WINDOWS_CER_FILE/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...POLICY, TOMATO_DESKTOP_APP_ID: RELEASE.TOMATO_DESKTOP_APP_ID }, WINDOWS, { unsigned: true })
    }).not.toThrow()
    expect(() => {
      validateDesktopPackageEnvironment({ ...POLICY, TOMATO_DESKTOP_APP_ID: RELEASE.TOMATO_DESKTOP_APP_ID }, WINDOWS, { prepareOnly: true })
    }).not.toThrow()
  })

  it('accepts unsigned macOS configuration without Apple or update policy settings while keeping release validation', () => {
    const local = localMacOSPackageEnvironment({})
    expect(() => { validateDesktopPackageEnvironment(local, MACOS, { unsigned: true }) }).not.toThrow()
    expect(() => { validateDesktopPackageEnvironment(local, MACOS) })
      .toThrow('TOMATO_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN')
    expect(() => { validateDesktopPackageEnvironment(RELEASE, MACOS) }).toThrow('TOMATO_DESKTOP_MACOS_SIGNING_IDENTITY')
  })

  it('accepts one local npm registry mirror and rejects other registry forms', () => {
    const release = { ...POLICY, TOMATO_DESKTOP_APP_ID: RELEASE.TOMATO_DESKTOP_APP_ID }
    expect(() => {
      validateDesktopPackageEnvironment({ ...release, TOMATO_DESKTOP_NPM_REGISTRY: 'https://registry.npmmirror.com/' }, WINDOWS, { unsigned: true })
    }).not.toThrow()
    for (const value of ['http://registry.example.com/', 'https://registry.example.com/path', 'https://user:secret@registry.example.com/', 'not-a-url']) {
      expect(() => {
        validateDesktopPackageEnvironment({ ...release, TOMATO_DESKTOP_NPM_REGISTRY: value }, WINDOWS, { unsigned: true })
      }).toThrow(/TOMATO_DESKTOP_NPM_REGISTRY/u)
    }
  })

  it('rejects incomplete macOS identity and credentials and checks referenced files without contacting Apple', async () => {
    expect(() => {
      validateDesktopPackageEnvironment(RELEASE, MACOS)
    }).toThrow(/TOMATO_DESKTOP_MACOS_SIGNING_IDENTITY/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...RELEASE, ...MAC_IDENTITY }, MACOS)
    }).toThrow(/macOS packaging requires/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...RELEASE, ...MAC_IDENTITY, APPLE_API_KEY: 'missing.p8' }, MACOS)
    }).toThrow(/APPLE_API_KEY_ID/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...RELEASE, ...MAC_IDENTITY, APPLE_KEYCHAIN_PROFILE: 'release' }, MACOS)
    }).toThrow(/CSC_LINK/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...RELEASE, ...MAC_IDENTITY, APPLE_KEYCHAIN_PROFILE: 'release', APPLE_API_KEY: '' }, MACOS)
    }).toThrow(/exactly one macOS notarization strategy/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...RELEASE, ...MAC_IDENTITY, APPLE_ID: 'user@example.com', APPLE_APP_SPECIFIC_PASSWORD: 'fixture', APPLE_TEAM_ID: 'TEAMID1234' }, MACOS)
    }).toThrow(/CSC_LINK/u)
    await withDirectory(async (directory) => {
      const appleApiKey = join(directory, 'AuthKey.p8')
      const environment = { ...RELEASE, ...MAC_IDENTITY, CSC_LINK: appleApiKey, CSC_KEY_PASSWORD: '', APPLE_API_KEY: appleApiKey, APPLE_API_KEY_ID: 'TEST123456', APPLE_API_ISSUER: '11111111-2222-3333-4444-555555555555' }
      expect(() => {
        validateDesktopPackageEnvironment(environment, MACOS)
      }).toThrow(/APPLE_API_KEY must identify a readable local file/u)
      await writeFile(appleApiKey, 'local-file-fixture')
      expect(() => {
        validateDesktopPackageEnvironment(environment, MACOS)
      }).not.toThrow()
      expect(() => {
        validateDesktopPackageEnvironment({ ...environment, CSC_KEY_PASSWORD: undefined }, MACOS)
      }).toThrow(/CSC_KEY_PASSWORD/u)
      expect(() => { validateDesktopPackageEnvironment({ ...environment, CSC_LINK: directory }, MACOS) }).toThrow(/CSC_LINK/u)
      expect(() => { validateDesktopPackageEnvironment({ ...environment, CSC_LINK: 'missing.p12' }, MACOS, { prepareOnly: true }) }).toThrow(/CSC_LINK/u)
      expect(() => {
        validateDesktopPackageEnvironment({ ...RELEASE, ...MAC_IDENTITY, APPLE_KEYCHAIN_PROFILE: 'release', APPLE_KEYCHAIN: directory }, MACOS)
      }).toThrow(/APPLE_KEYCHAIN/u)
    })
  })
})

it('reads macOS tuning from the file and lets a personal value win before signing credentials', async () => {
  await withDirectory(async (directory) => {
    await writeFile(join(directory, '.env.macos'), 'TOMATO_DESKTOP_MACOS_PACK_CONCURRENCY=2\nTOMATO_DESKTOP_MACOS_DOWNLOAD_PROXY=http://proxy.example:8080\nTOMATO_DESKTOP_MACOS_NOTARIZATION_PROXY=\n')
    const fileOnly = loadDesktopPackageEnvironment('darwin', {}, directory)
    expect(fileOnly.TOMATO_DESKTOP_MACOS_PACK_CONCURRENCY).toBe('2')
    expect(fileOnly.TOMATO_DESKTOP_MACOS_NOTARIZATION_PROXY).toBe('')
    const personal = loadDesktopPackageEnvironment('darwin', { TOMATO_DESKTOP_MACOS_PACK_CONCURRENCY: '99' }, directory)
    expect(personal.TOMATO_DESKTOP_MACOS_PACK_CONCURRENCY).toBe('99')
    expect(() =>{  validateDesktopPackageEnvironment({ ...RELEASE, TOMATO_DESKTOP_MACOS_PACK_CONCURRENCY: '' }, MACOS) }).toThrow('PACK_CONCURRENCY')
    expect(() =>{  validateDesktopPackageEnvironment({ ...RELEASE, TOMATO_DESKTOP_MACOS_NOTARIZATION_PROXY: 'socks5://localhost:8080' }, MACOS) }).toThrow('NOTARIZATION_PROXY')
  })
})

it('rejects an explicit invalid macOS cache before signing while leaving unsigned builds independent', () => {
  const environment = { ...RELEASE, TOMATO_DESKTOP_MACOS_SIGNATURE_CACHE_DIR: '' }
  for (const options of [{}, { prepareOnly: true }]) {
    expect(() => { validateDesktopPackageEnvironment(environment, MACOS, options) }).toThrow('SIGNATURE_CACHE_DIR')
  }
  expect(() => { validateDesktopPackageEnvironment(environment, MACOS, { unsigned: true }) }).not.toThrow()
})

it('skips Apple credentials but still requires signing credentials for unnotarized packages', async () => {
  await withDirectory(async (directory) => {
    const certificate = join(directory, 'signing.p12')
    await writeFile(certificate, 'fixture')
    const environment = { ...RELEASE, ...MAC_IDENTITY, CSC_LINK: certificate, CSC_KEY_PASSWORD: '' }
    expect(() => { validateDesktopPackageEnvironment(environment, MACOS, { skipNotarization: true }) }).not.toThrow()
    expect(() => { validateDesktopPackageEnvironment(environment, MACOS) }).toThrow()
    expect(() => {
      validateDesktopPackageEnvironment({ ...environment, CSC_LINK: undefined }, MACOS, { skipNotarization: true })
    }).toThrow(/CSC_LINK/u)
    expect(() => {
      validateDesktopPackageEnvironment({ ...environment, CSC_KEY_PASSWORD: undefined }, MACOS, { skipNotarization: true })
    }).toThrow(/CSC_KEY_PASSWORD/u)
  })
})

it('takes ZIP compression from the Mac file and lets a personal value win', async () => {
  await withDirectory(async (directory) => {
    await writeFile(join(directory, '.env.macos'), 'TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL=5\n')
    expect(loadDesktopPackageEnvironment('darwin', {}, directory).TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL).toBe('5')
    expect(loadDesktopPackageEnvironment('darwin', { TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL: '9' }, directory)
      .TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL).toBe('9')
    await writeFile(join(directory, '.env.macos'), '')
    expect(loadDesktopPackageEnvironment('darwin', { TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL: '9' }, directory)
      .TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL).toBe('9')
  })
})

it.each(['', 'relative-cache'])('rejects invalid build cache paths during preflight (%s)', (cache) => {
  expect(() => { validateDesktopPackageEnvironment({ ...RELEASE, TOMATO_DESKTOP_PACKAGE_CACHE_DIR: cache }, MACOS, { unsigned: true }) })
    .toThrow('TOMATO_DESKTOP_PACKAGE_CACHE_DIR must be a nonempty absolute directory')
})

it.each(['3', '7'])('applies the workflow ZIP choice %s over the Mac file setting', async (level) => {
  await withDirectory(async (directory) => {
    await writeFile(join(directory, '.env.macos'), 'TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL=5\n')
    const loaded = loadDesktopPackageEnvironment('darwin', { PACKAGE_MACOS_ZIP_COMPRESSION_LEVEL: level }, directory)
    expect(loaded.TOMATO_DESKTOP_MACOS_ZIP_COMPRESSION_LEVEL).toBe(level)
  })
})

it.each(['', '3', '7'])('rejects Mac workflow ZIP choice %j on Windows before reading settings', (level) => {
  expect(() => loadDesktopPackageEnvironment('win32', { PACKAGE_MACOS_ZIP_COMPRESSION_LEVEL: level }, 'missing-settings'))
    .toThrow('PACKAGE_MACOS_ZIP_COMPRESSION_LEVEL requires macOS')
})

it.each(['', '0', '9', 'invalid'])('rejects unsupported workflow ZIP choice %j', async (level) => {
  await withDirectory(async (directory) => {
    await writeFile(join(directory, '.env.macos'), '')
    expect(() => loadDesktopPackageEnvironment('darwin', { PACKAGE_MACOS_ZIP_COMPRESSION_LEVEL: level }, directory))
      .toThrow('workflow ZIP compression must be 3 or 7')
  })
})
