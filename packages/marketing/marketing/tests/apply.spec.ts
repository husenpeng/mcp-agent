/**
 * The mount loop and its warning: one child per resolved provider, and one
 * warning naming the env a switched-on provider could not resolve.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import { apply, resolveMounts } from '../src/index.ts'
import type { Config } from '../src/index.ts'

/** A volatile field reading one fixed value. */
function vol<T>(value: T): { get: () => T } {
  return { get: () => value }
}

/** A config section with every provider off unless the test overrides it. */
function config(overrides: Partial<Record<keyof Config, boolean | string>> = {}): Config {
  const read = (key: keyof Config, fallback: boolean | string): boolean | string => overrides[key] ?? fallback
  return {
    googleAdsEnabled: vol(read('googleAdsEnabled', false) as boolean),
    googleAdsDeveloperTokenEnv: vol(read('googleAdsDeveloperTokenEnv', 'GOOGLE_ADS_DEVELOPER_TOKEN') as string),
    googleAdsCredentialsFileEnv: vol(read('googleAdsCredentialsFileEnv', 'GOOGLE_APPLICATION_CREDENTIALS') as string),
    googleAdsLoginCustomerIdEnv: vol(read('googleAdsLoginCustomerIdEnv', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID') as string),
    googleAnalyticsEnabled: vol(read('googleAnalyticsEnabled', false) as boolean),
    googleAnalyticsCredentialsFileEnv: vol(read('googleAnalyticsCredentialsFileEnv', 'GOOGLE_APPLICATION_CREDENTIALS') as string),
    mosaicEnabled: vol(read('mosaicEnabled', false) as boolean),
    mosaicMetaTokenEnv: vol(read('mosaicMetaTokenEnv', 'META_ACCESS_TOKEN') as string),
    mosaicTiktokTokenEnv: vol(read('mosaicTiktokTokenEnv', 'TIKTOK_ACCESS_TOKEN') as string),
    mosaicYoutubeTokenEnv: vol(read('mosaicYoutubeTokenEnv', 'YOUTUBE_ACCESS_TOKEN') as string),
    mosaicXTokenEnv: vol(read('mosaicXTokenEnv', 'X_ACCESS_TOKEN') as string),
    mailchimpEnabled: vol(read('mailchimpEnabled', false) as boolean),
    mailchimpApiKeyEnv: vol(read('mailchimpApiKeyEnv', 'MAILCHIMP_API_KEY') as string),
    mailchimpServerPrefixEnv: vol(read('mailchimpServerPrefixEnv', 'MAILCHIMP_SERVER_PREFIX') as string),
  }
}

const saved = { ...process.env }

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in saved)) Reflect.deleteProperty(process.env, key)
  }
  for (const [key, value] of Object.entries(saved)) process.env[key] = value
})

describe('apply', () => {
  it('creates one stdio child per resolved provider', async () => {
    process.env.MARKETING_TEST_META = 'meta-from-environment'
    const ctx = new Context()
    const mounted: unknown[] = []
    // A live no-op fiber stands in for each child mount: the spec asserts which
    // configurations reach ctx.plugin without starting an MCP child process.
    const inert = ctx.plugin({ apply() {} })
    vi.spyOn(ctx, 'plugin').mockImplementation((_plugin, childConfig) => {
      mounted.push(childConfig)
      return inert
    })
    await apply(ctx, config({ mosaicEnabled: true, mosaicMetaTokenEnv: 'MARKETING_TEST_META' }))

    expect(mounted).toEqual([{
      transport: 'stdio',
      serverName: 'mosaic-ads',
      command: 'npx',
      args: ['-y', '-p', '@openpromo/ad-platforms-cli', 'mosaic-ads-mcp'],
      env: { META_ACCESS_TOKEN: 'meta-from-environment' },
    }])
  })

  it('mounts nothing and warns once while an enabled provider has no credential', async () => {
    const ctx = new Context()
    const warn = vi.spyOn(ctx.logger, 'warn').mockImplementation(() => {})
    await apply(ctx, config({ googleAdsEnabled: true }))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]).toEqual([
      'marketing: %s stays off; unresolved %s', 'googleAds', 'GOOGLE_ADS_DEVELOPER_TOKEN',
    ])
  })

  it('stays silent when every provider is off', async () => {
    const ctx = new Context()
    const warn = vi.spyOn(ctx.logger, 'warn').mockImplementation(() => {})
    await apply(ctx, config())

    expect(warn).not.toHaveBeenCalled()
    expect(await resolveMounts(ctx, config())).toEqual({
      mounts: [],
      skipped: [
        { id: 'googleAds', missing: [] },
        { id: 'googleAnalytics', missing: [] },
        { id: 'mosaic', missing: [] },
        { id: 'mailchimp', missing: [] },
      ],
    })
  })
})
