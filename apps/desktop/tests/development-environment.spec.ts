import { describe, expect, it } from 'vitest'
import { withoutReleaseSettings } from '../scripts/development-environment.ts'

describe('development environment projection', () => {
  it('drops packaging identity, update policy, signing, and download settings', () => {
    const projected = withoutReleaseSettings({
      PATH: 'build-tools',
      TOMATO_HOME: '/tmp/home',
      TOMATO_DESKTOP_NPM_REGISTRY: 'https://registry.example',
      TOMATO_DESKTOP_APP_ID: 'vip.tomatoai.desktop',
      TOMATO_DESKTOP_AUTO_UPDATE_ENV: 'test',
      TOMATO_DESKTOP_AUTH_SERVICE_URL: 'http://localhost:8020',
      TOMATO_DESKTOP_TOMATO_WEB_URL: 'http://localhost:3000',
      TOMATO_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN: 'https://policy.example',
      TOMATO_DESKTOP_MANDATORY_UPDATE_CONFIG: '{}',
      TOMATO_DESKTOP_MACOS_PACK_CONCURRENCY: '4',
      TOMATO_DESKTOP_WINDOWS_COMPRESSION_LEVEL: '3',
      TOMATO_DESKTOP_UNSIGNED: '1',
      TOMATO_DESKTOP_UPDATE_CHANNEL: 'latest',
      APPLE_ID: 'person@example.com',
      CSC_LINK: 'certificate.p12',
      DOWNLOAD_TEST_ORIGIN: 'https://downloads.example',
    })
    expect(projected).toEqual({
      PATH: 'build-tools',
      TOMATO_HOME: '/tmp/home',
      TOMATO_DESKTOP_NPM_REGISTRY: 'https://registry.example',
    })
  })
})
