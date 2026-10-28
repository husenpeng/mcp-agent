import { afterEach, expect, it, vi } from 'vitest'
import { readOnboardingApiKeyPresence } from '../src/client/onboarding-credentials.ts'

afterEach(() => { vi.unstubAllGlobals() })

it.each([false, true])('uses native login API-key presence (%s)', async (present) => {
  const hasApiKey = vi.fn(async () => present)
  vi.stubGlobal('tomatoOnboarding', { hasApiKey })
  expect(await readOnboardingApiKeyPresence()).toBe(present)
  expect(hasApiKey).toHaveBeenCalledOnce()
})

it('preserves a native login read failure instead of reporting absent credentials', async () => {
  vi.stubGlobal('tomatoOnboarding', { hasApiKey: async () => { throw new Error('metadata unavailable') } })
  await expect(readOnboardingApiKeyPresence()).rejects.toThrow('metadata unavailable')
})

it('rejects a missing native login bridge', async () => {
  vi.stubGlobal('tomatoOnboarding', undefined)
  await expect(readOnboardingApiKeyPresence()).rejects.toThrow('desktop login bridge unavailable')
})
