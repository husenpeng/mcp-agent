/** Login origins sealed by each packaging environment. */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveDesktopLoginEnvironment } from '../scripts/desktop-release-environment.mjs'
import { loadDesktopPackageEnvironment } from '../scripts/desktop-package-environment.mjs'

const LOGIN = {
  TOMATO_DESKTOP_AUTH_SERVICE_URL: 'https://auth.example.com/',
  TOMATO_DESKTOP_TOMATO_WEB_URL: 'https://app.example.com',
}

describe('packaged login environment', () => {
  it('normalizes both origins', () => {
    expect(resolveDesktopLoginEnvironment(LOGIN)).toEqual({
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
    })
  })

  it('requires the origins together and rejects non-origin values', () => {
    expect(resolveDesktopLoginEnvironment({})).toEqual({ authServiceUrl: '', tomatoWebUrl: '' })
    expect(() => resolveDesktopLoginEnvironment({ TOMATO_DESKTOP_AUTH_SERVICE_URL: 'https://auth.example.com' }))
      .toThrow(/set together/)
    expect(() => resolveDesktopLoginEnvironment({ ...LOGIN, TOMATO_DESKTOP_TOMATO_WEB_URL: 'https://app.example.com/ui' }))
      .toThrow(/without credentials, path, query, or fragment/)
    expect(() => resolveDesktopLoginEnvironment({ ...LOGIN, TOMATO_DESKTOP_AUTH_SERVICE_URL: 'ftp://auth.example.com' }))
      .toThrow(/HTTP\(S\) origin/)
  })

  it('bakes the origins into the packaged manifest', async () => {
    const { createElectronBuilderConfig } = await import('../scripts/electron-builder-config.mjs')
    const config = createElectronBuilderConfig({
      TOMATO_DESKTOP_APP_ID: 'com.example.login',
      TOMATO_DESKTOP_UNSIGNED: '1',
      TOMATO_DESKTOP_TARGET_PLATFORM: 'darwin',
      TOMATO_DESKTOP_TARGET_ARCH: 'arm64',
      ...LOGIN,
    }, 'darwin', 'arm64')
    expect(config.extraMetadata).toMatchObject({
      tomatoAuthServiceUrl: 'https://auth.example.com',
      tomatoTomatoWebUrl: 'https://app.example.com',
    })
  })

  it('omits login metadata when a local unsigned build leaves them empty', async () => {
    const { createElectronBuilderConfig } = await import('../scripts/electron-builder-config.mjs')
    const config = createElectronBuilderConfig({
      TOMATO_DESKTOP_APP_ID: 'com.example.login',
      TOMATO_DESKTOP_UNSIGNED: '1',
      TOMATO_DESKTOP_TARGET_PLATFORM: 'darwin',
      TOMATO_DESKTOP_TARGET_ARCH: 'arm64',
    }, 'darwin', 'arm64')
    expect(config.extraMetadata).not.toHaveProperty('tomatoAuthServiceUrl')
    expect(config.extraMetadata).not.toHaveProperty('tomatoTomatoWebUrl')
  })

  it('accepts the origins in a machine preset and never inherits ambient ones', async () => {
    const root = await mkdtemp(join(tmpdir(), 'login-preset-'))
    try {
      await mkdir(join(root, 'presets'))
      await writeFile(join(root, 'presets/test.env'),
        'TOMATO_DESKTOP_AUTO_UPDATE_ENV=test\nDSH_DESKTOP_AUTH_SERVICE_URL=https://auth.example.com\nDSH_DESKTOP_TOMATO_WEB_URL=https://app.example.com\n')
      const selected = loadDesktopPackageEnvironment('darwin', {
        TOMATO_PACKAGING_PRESET: 'test',
        TOMATO_PACKAGING_CONFIG_DIR: root,
        TOMATO_DESKTOP_AUTH_SERVICE_URL: 'https://ambient.example.com',
        TOMATO_DESKTOP_TOMATO_WEB_URL: 'https://ambient.example.com',
      }, root, { unsigned: true })
      expect(selected.TOMATO_DESKTOP_AUTH_SERVICE_URL).toBe('https://auth.example.com')
      expect(selected.TOMATO_DESKTOP_TOMATO_WEB_URL).toBe('https://app.example.com')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
