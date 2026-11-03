/**
 * The plugin's resolution seam against a real Cordis context: settings become
 * child configurations, credentials resolve from the launch environment, and a
 * provider without one stays off. No child process starts here.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import type { Config } from '../src/index.ts'
import { resolveMounts } from '../src/index.ts'

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

describe('resolveMounts', () => {
  it('mounts nothing for an unconfigured installation', async () => {
    const plan = await resolveMounts(new Context(), config())
    expect(plan.mounts).toEqual([])
    expect(plan.skipped.map(entry => entry.id)).toEqual(['googleAds', 'googleAnalytics', 'mosaic', 'mailchimp'])
  })

  it('resolves a launch-environment credential into the child env', async () => {
    process.env.MARKETING_TEST_META = 'meta-from-environment'
    const plan = await resolveMounts(new Context(), config({
      mosaicEnabled: true,
      mosaicMetaTokenEnv: 'MARKETING_TEST_META',
      mosaicTiktokTokenEnv: 'MARKETING_TEST_TIKTOK',
    }))
    expect(plan.mounts).toEqual([{
      id: 'mosaic',
      serverName: 'mosaic-ads',
      command: 'npx',
      args: ['-y', '-p', '@openpromo/ad-platforms-cli', 'mosaic-ads-mcp'],
      env: { META_ACCESS_TOKEN: 'meta-from-environment' },
    }])
    expect(plan.skipped.find(entry => entry.id === 'mosaic')).toBeUndefined()
  })

  it('keeps an enabled provider off and names the env it could not resolve', async () => {
    const plan = await resolveMounts(new Context(), config({ googleAdsEnabled: true }))
    expect(plan.mounts).toEqual([])
    expect(plan.skipped.find(entry => entry.id === 'googleAds')?.missing).toEqual(['GOOGLE_ADS_DEVELOPER_TOKEN'])
  })

  it('mounts two providers in catalog order when both resolve', async () => {
    process.env.MARKETING_TEST_MAILCHIMP = 'mailchimp-key'
    const plan = await resolveMounts(new Context(), config({
      googleAdsEnabled: true,
      googleAdsDeveloperTokenEnv: 'MARKETING_TEST_ADS',
      mailchimpEnabled: true,
      mailchimpApiKeyEnv: 'MARKETING_TEST_MAILCHIMP',
    }))
    expect(plan.mounts.map(mount => mount.id)).toEqual(['mailchimp'])
    expect(plan.skipped.find(entry => entry.id === 'googleAds')?.missing).toEqual(['GOOGLE_ADS_DEVELOPER_TOKEN'])
  })
})

describe('resolveMounts with the credentials service', () => {
  it('prefers a stored credential over the launch environment', async () => {
    process.env.MARKETING_TEST_STORED = 'from-environment'
    const ctx = new Context()
    ctx.provide('credentials', {
      resolve: async (ref: string) => ref === 'MARKETING_TEST_STORED' ? { value: 'from-store' } : undefined,
    } as never)
    const plan = await resolveMounts(ctx, config({
      mosaicEnabled: true,
      mosaicMetaTokenEnv: 'MARKETING_TEST_STORED',
      mosaicTiktokTokenEnv: 'MARKETING_TEST_EMPTY',
    }))
    expect(plan.mounts[0]?.env).toEqual({ META_ACCESS_TOKEN: 'from-store' })
  })

  it('falls back to the environment when the store holds no value for the reference', async () => {
    process.env.MARKETING_TEST_FALLBACK = 'from-environment'
    const ctx = new Context()
    ctx.provide('credentials', {
      resolve: async () => ({ value: '' }),
    } as never)
    const plan = await resolveMounts(ctx, config({
      mosaicEnabled: true,
      mosaicMetaTokenEnv: 'MARKETING_TEST_FALLBACK',
      mosaicTiktokTokenEnv: 'MARKETING_TEST_FALLBACK',
    }))
    expect(plan.mounts[0]?.env).toEqual({ META_ACCESS_TOKEN: 'from-environment', TIKTOK_ACCESS_TOKEN: 'from-environment' })
  })
})
