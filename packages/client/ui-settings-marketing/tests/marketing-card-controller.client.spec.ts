import { describe, expect, it, vi } from 'vitest'
import type { SettingsFormPathOp, SettingsFormScope } from '@tomato/client-ui-primitives'
import { defaultReference, MarketingCardController } from '../src/client/marketing-card-controller.ts'
import type { MarketingCredentialPlane, MarketingSettings } from '../src/client/marketing-card-controller.ts'

/** One settings namespace, held in memory with the scope's revision fence. */
class FakeScope implements SettingsFormScope<MarketingSettings> {
  value: MarketingSettings
  writable = true
  revision = 1
  private readonly listeners = new Set<() => void>()

  constructor(value: MarketingSettings) {
    this.value = value
  }

  getSnapshot() {
    return {
      status: 'ready' as const,
      value: this.value,
      base: undefined,
      user: undefined,
      writable: this.writable,
      revision: this.revision,
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  async mutate(ops: readonly SettingsFormPathOp[]): Promise<boolean> {
    for (const op of ops) {
      const key = op.path[0]
      if (key === undefined) continue
      if (op.op === 'set') this.value = { ...this.value, [key]: op.value }
      else {
        const next: Record<string, unknown> = { ...this.value }
        Reflect.deleteProperty(next, key)
        this.value = next
      }
    }
    this.revision += 1
    this.emit()
    return true
  }

  /** Replace the whole section, as an external write would. */
  replace(next: MarketingSettings): void {
    this.value = next
    this.revision += 1
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

/** A credentials plane that records every write and answers from a fixed set. */
function fakeCredentials(configured: string[] = []): MarketingCredentialPlane & { writes: [string, string][] } {
  const writes: [string, string][] = []
  return {
    writes,
    async describe(refs) {
      return Object.fromEntries(refs.map(ref => [ref, { configured: configured.includes(ref), writable: true }]))
    },
    async set(ref, value) {
      writes.push([ref, value])
      if (!configured.includes(ref)) configured.push(ref)
    },
  }
}

/** Let the form's own asynchronous save settle. */
async function flush(): Promise<void> {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('MarketingCardController', () => {
  it('renders every provider off, with blank secrets, before anything is staged', () => {
    const controller = new MarketingCardController(new FakeScope({}), fakeCredentials())
    const state = controller.inject().hooks.marketingCard.getSnapshot()
    expect(state.available).toBe(true)
    expect(state.dirty).toBe(false)
    expect(state.providers.map(provider => provider.id)).toEqual(['googleAds', 'googleAnalytics', 'mosaic', 'mailchimp'])
    for (const provider of state.providers) {
      expect(provider.enabled).toBe(false)
      for (const secret of provider.secrets) {
        expect(secret.text).toBe('')
        expect(secret.configured).toBe(false)
        expect(secret.writable).toBe(true)
      }
    }
    controller.dispose()
  })

  it('stages a switch and writes it as a boolean on save', async () => {
    const scope = new FakeScope({})
    const controller = new MarketingCardController(scope, fakeCredentials())
    const face = controller.inject()
    face.setProvider('googleAds', true)
    expect(face.hooks.marketingCard.getSnapshot().dirty).toBe(true)
    face.save()
    await flush()
    expect(scope.value).toEqual({ googleAdsEnabled: true })
    expect(face.hooks.marketingCard.getSnapshot().providers[0]?.enabled).toBe(true)
    controller.dispose()
  })

  it('ignores a switch for an id the page does not render', () => {
    const controller = new MarketingCardController(new FakeScope({}), fakeCredentials())
    controller.inject().setProvider('unknown' as never, true)
    expect(controller.inject().hooks.marketingCard.getSnapshot().dirty).toBe(false)
    controller.dispose()
  })

  it('writes a staged credential under the reference the section names', async () => {
    const credentials = fakeCredentials()
    const controller = new MarketingCardController(new FakeScope({}), credentials)
    const face = controller.inject()
    face.edit('googleAdsDeveloperToken', 'dev-token')
    face.save()
    await flush()
    expect(credentials.writes).toEqual([['GOOGLE_ADS_DEVELOPER_TOKEN', 'dev-token']])
    expect(face.hooks.marketingCard.getSnapshot().providers[0]?.secrets[0]?.configured).toBe(true)
    controller.dispose()
  })

  it('follows a renamed reference instead of the default', async () => {
    const credentials = fakeCredentials()
    const controller = new MarketingCardController(new FakeScope({ googleAdsDeveloperTokenEnv: 'ACME_ADS_TOKEN' }), credentials)
    const face = controller.inject()
    face.edit('googleAdsDeveloperToken', 'acme')
    face.save()
    await flush()
    expect(credentials.writes).toEqual([['ACME_ADS_TOKEN', 'acme']])
    controller.dispose()
  })

  it('reports a credential the credentials domain already holds', async () => {
    const controller = new MarketingCardController(new FakeScope({}), fakeCredentials(['META_ACCESS_TOKEN']))
    await flush()
    const state = controller.inject().hooks.marketingCard.getSnapshot()
    const mosaic = state.providers.find(provider => provider.id === 'mosaic')
    expect(mosaic?.secrets.find(secret => secret.field === 'mosaicMetaToken')?.configured).toBe(true)
    expect(mosaic?.secrets.find(secret => secret.field === 'mosaicTiktokToken')?.configured).toBe(false)
    controller.dispose()
  })

  it('re-reads only the references it watches when the Host reports a change', async () => {
    const credentials = fakeCredentials()
    const controller = new MarketingCardController(new FakeScope({}), credentials)
    await flush()
    controller.refreshCredential('SOMEONE_ELSE')
    await flush()
    expect(controller.inject().hooks.marketingCard.getSnapshot().providers[0]?.secrets[0]?.configured).toBe(false)
    controller.dispose()
  })

  it('re-reads a watched reference the Host reports as changed', async () => {
    const credentials = fakeCredentials()
    const describe = vi.spyOn(credentials, 'describe')
    const controller = new MarketingCardController(new FakeScope({}), credentials)
    await flush()
    const before = describe.mock.calls.length
    controller.refreshCredential('META_ACCESS_TOKEN')
    await flush()
    expect(describe.mock.calls.length).toBeGreaterThan(before)
    controller.dispose()
  })

  it('stages a switch back off and resets a staged field', () => {
    const scope = new FakeScope({})
    const controller = new MarketingCardController(scope, fakeCredentials())
    const face = controller.inject()
    face.setProvider('googleAds', true)
    face.setProvider('googleAds', false)
    expect(face.hooks.marketingCard.getSnapshot().providers[0]?.enabled).toBe(false)
    face.edit('googleAdsEnabled', 'true')
    face.resetField('googleAdsEnabled')
    expect(face.hooks.marketingCard.getSnapshot().dirty).toBe(false)
    controller.dispose()
  })

  it('drops every staged edit on discard', () => {
    const controller = new MarketingCardController(new FakeScope({}), fakeCredentials())
    const face = controller.inject()
    face.setProvider('mailchimp', true)
    face.discard()
    expect(face.hooks.marketingCard.getSnapshot().dirty).toBe(false)
    expect(face.hooks.marketingCard.getSnapshot().providers[3]?.enabled).toBe(false)
    controller.dispose()
  })

  it('falls back to the placeholder reference for a field it does not know', () => {
    expect(defaultReference('unknownField' as keyof MarketingSettings)).toBe('MARKETING_CREDENTIAL')
  })

  it('marks a switch draft that is not a boolean as invalid', () => {
    const controller = new MarketingCardController(new FakeScope({}), fakeCredentials())
    const face = controller.inject()
    face.edit('googleAdsEnabled', 'maybe')
    expect(face.hooks.marketingCard.getSnapshot().invalid).toBe(true)
    controller.dispose()
  })

  it('reports an unwritten credential as unconfigured when the store describes nothing', async () => {
    const credentials: MarketingCredentialPlane = {
      describe: async () => ({}),
      set: async () => {},
    }
    const controller = new MarketingCardController(new FakeScope({}), credentials)
    const face = controller.inject()
    face.edit('googleAdsDeveloperToken', 'dev-token')
    face.save()
    await flush()
    expect(face.hooks.marketingCard.getSnapshot().providers[0]?.secrets[0]?.configured).toBe(false)
    controller.dispose()
  })

  it('publishes defaults for every reference the page watches', () => {
    expect({
      googleAdsDeveloperTokenEnv: defaultReference('googleAdsDeveloperTokenEnv'),
      googleAnalyticsCredentialsFileEnv: defaultReference('googleAnalyticsCredentialsFileEnv'),
      mosaicMetaTokenEnv: defaultReference('mosaicMetaTokenEnv'),
      mosaicTiktokTokenEnv: defaultReference('mosaicTiktokTokenEnv'),
      mosaicYoutubeTokenEnv: defaultReference('mosaicYoutubeTokenEnv'),
      mosaicXTokenEnv: defaultReference('mosaicXTokenEnv'),
      mailchimpApiKeyEnv: defaultReference('mailchimpApiKeyEnv'),
    }).toEqual({
      googleAdsDeveloperTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
      googleAnalyticsCredentialsFileEnv: 'GOOGLE_APPLICATION_CREDENTIALS',
      mosaicMetaTokenEnv: 'META_ACCESS_TOKEN',
      mosaicTiktokTokenEnv: 'TIKTOK_ACCESS_TOKEN',
      mosaicYoutubeTokenEnv: 'YOUTUBE_ACCESS_TOKEN',
      mosaicXTokenEnv: 'X_ACCESS_TOKEN',
      mailchimpApiKeyEnv: 'MAILCHIMP_API_KEY',
    })
  })
})
