import { afterEach, expect, it, vi } from 'vitest'
import { desktopClientMetadata, desktopClientVersion } from '../src/client-metadata.ts'

afterEach(() => { vi.unstubAllEnvs() })

it('reports the inlined client build version and the requested language', () => {
  vi.stubEnv('TOMATO_CLIENT_VERSION', '1.2.3')
  expect(desktopClientVersion()).toBe('1.2.3')
  expect(desktopClientMetadata('zh-CN')).toMatchObject({ version: '1.2.3', locale: 'zh-CN',
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60 })
})

it('refuses a build that carries no client version instead of guessing one', () => {
  vi.stubEnv('TOMATO_CLIENT_VERSION', undefined)
  expect(() => desktopClientVersion()).toThrow(/TOMATO_CLIENT_VERSION/)
  vi.stubEnv('TOMATO_CLIENT_VERSION', '')
  expect(() => desktopClientMetadata('en')).toThrow(/TOMATO_CLIENT_VERSION/)
})
