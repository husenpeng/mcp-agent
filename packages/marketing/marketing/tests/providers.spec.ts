import { describe, expect, it } from 'vitest'
import { planProviderMounts, PROVIDER_FIELDS, PROVIDERS, selectionOf } from '../src/providers.ts'
import type { ProviderId } from '../src/providers.ts'

/** Every provider off, with no credential values resolved. */
function offSelection(): Record<ProviderId, { enabled: boolean; values: Record<string, string> }> {
  return {
    googleAds: { enabled: false, values: {} },
    googleAnalytics: { enabled: false, values: {} },
    mosaic: { enabled: false, values: {} },
    mailchimp: { enabled: false, values: {} },
  }
}

describe('provider catalog', () => {
  it('names every provider once with a distinct, wire-safe namespace', () => {
    const ids = PROVIDERS.map(provider => provider.id)
    const names = PROVIDERS.map(provider => provider.serverName)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name).toMatch(/^[A-Za-z0-9_-]{1,32}$/)
  })

  it('gives every provider a switch field and a field for each env var it needs', () => {
    for (const spec of PROVIDERS) {
      const fields = PROVIDER_FIELDS[spec.id]
      expect(fields.enabled.length).toBeGreaterThan(0)
      for (const envName of [...spec.credentials, ...spec.optional]) {
        expect(fields.refs[envName]).toBeTypeOf('string')
      }
    }
  })
})

describe('selectionOf', () => {
  it('reads nothing and resolves no credential while the provider is off', async () => {
    const resolved: string[] = []
    const selection = await selectionOf('googleAds', { googleAdsEnabled: false }, async (ref) => {
      resolved.push(ref)
      return 'secret'
    })
    expect(selection).toEqual({ enabled: false, values: {} })
    expect(resolved).toEqual([])
  })

  it('resolves each declared reference once the provider is on', async () => {
    const selection = await selectionOf('mailchimp', {
      mailchimpEnabled: true,
      mailchimpApiKeyEnv: 'MAILCHIMP_API_KEY',
      mailchimpServerPrefixEnv: 'MAILCHIMP_SERVER_PREFIX',
    }, async ref => ref === 'MAILCHIMP_API_KEY' ? 'key' : 'us1')
    expect(selection).toEqual({
      enabled: true,
      values: { MAILCHIMP_API_KEY: 'key', MAILCHIMP_SERVER_PREFIX: 'us1' },
    })
  })

  it('leaves a reference that is not a string unresolved', async () => {
    const selection = await selectionOf('mosaic', {
      mosaicEnabled: true,
      mosaicMetaTokenEnv: undefined,
      mosaicTiktokTokenEnv: '',
      mosaicYoutubeTokenEnv: 'YOUTUBE_ACCESS_TOKEN',
      mosaicXTokenEnv: 42,
    }, async () => 'token')
    expect(selection.values).toEqual({
      META_ACCESS_TOKEN: '',
      TIKTOK_ACCESS_TOKEN: '',
      YOUTUBE_ACCESS_TOKEN: 'token',
      X_ACCESS_TOKEN: '',
    })
  })
})

describe('planProviderMounts', () => {
  it('mounts nothing when every provider is off', () => {
    const plan = planProviderMounts(offSelection())
    expect(plan.mounts).toEqual([])
    expect(plan.skipped.map(entry => entry.id)).toEqual(PROVIDERS.map(provider => provider.id))
    for (const entry of plan.skipped) expect(entry.missing).toEqual([])
  })

  it('mounts an enabled provider with only the resolved env names', () => {
    const selection = offSelection()
    selection.googleAds = {
      enabled: true,
      values: {
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        GOOGLE_APPLICATION_CREDENTIALS: '',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '1234567890',
      },
    }
    const plan = planProviderMounts(selection)
    expect(plan.mounts).toEqual([{
      id: 'googleAds',
      serverName: 'google-ads',
      command: 'pipx',
      args: ['run', '--spec', 'google-ads-mcp==0.0.5', 'google-ads-mcp'],
      env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token', GOOGLE_ADS_LOGIN_CUSTOMER_ID: '1234567890' },
    }])
  })

  it('keeps an enabled provider off while a required env name is unresolved', () => {
    const selection = offSelection()
    selection.googleAds = { enabled: true, values: { GOOGLE_ADS_DEVELOPER_TOKEN: '' } }
    const plan = planProviderMounts(selection)
    expect(plan.mounts).toEqual([])
    expect(plan.skipped.find(entry => entry.id === 'googleAds')?.missing).toEqual(['GOOGLE_ADS_DEVELOPER_TOKEN'])
  })

  it('mounts Mosaic when one platform token resolves and reports every optional name when none does', () => {
    const selection = offSelection()
    selection.mosaic = { enabled: true, values: { META_ACCESS_TOKEN: 'meta', TIKTOK_ACCESS_TOKEN: '' } }
    expect(planProviderMounts(selection).mounts).toEqual([{
      id: 'mosaic',
      serverName: 'mosaic-ads',
      command: 'npx',
      args: ['-y', '-p', '@openpromo/ad-platforms-cli', 'mosaic-ads-mcp'],
      env: { META_ACCESS_TOKEN: 'meta' },
    }])

    selection.mosaic = { enabled: true, values: {} }
    const skipped = planProviderMounts(selection).skipped.find(entry => entry.id === 'mosaic')
    expect(skipped?.missing).toEqual(['META_ACCESS_TOKEN', 'TIKTOK_ACCESS_TOKEN', 'YOUTUBE_ACCESS_TOKEN', 'X_ACCESS_TOKEN'])
  })

  it('treats an absent required name as unresolved', () => {
    const selection = offSelection()
    selection.googleAds = { enabled: true, values: {} }
    const plan = planProviderMounts(selection)
    expect(plan.mounts).toEqual([])
    expect(plan.skipped.find(entry => entry.id === 'googleAds')?.missing).toEqual(['GOOGLE_ADS_DEVELOPER_TOKEN'])
  })

  it('omits an env name the selection never resolved at all', () => {
    const selection = offSelection()
    selection.googleAds = { enabled: true, values: { GOOGLE_ADS_DEVELOPER_TOKEN: 'only-the-token' } }
    const plan = planProviderMounts(selection)
    expect(plan.mounts[0]?.env).toEqual({ GOOGLE_ADS_DEVELOPER_TOKEN: 'only-the-token' })
  })

  it('mounts several enabled providers in catalog order', () => {
    const selection = offSelection()
    selection.googleAnalytics = { enabled: true, values: { GOOGLE_APPLICATION_CREDENTIALS: '/tmp/key.json' } }
    selection.mailchimp = { enabled: true, values: { MAILCHIMP_API_KEY: 'key', MAILCHIMP_SERVER_PREFIX: 'us1' } }
    const plan = planProviderMounts(selection)
    expect(plan.mounts.map(mount => mount.id)).toEqual(['googleAnalytics', 'mailchimp'])
    expect(plan.mounts[1]?.env).toEqual({ MAILCHIMP_API_KEY: 'key', MAILCHIMP_SERVER_PREFIX: 'us1' })
  })
})
