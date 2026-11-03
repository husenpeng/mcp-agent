/**
 * The Marketing page's staged form over the `marketing` settings namespace:
 * one switch per provider and, for each provider, the credentials written
 * through the credentials domain rather than into the settings section.
 *
 * A switch stages the `enabled` field; the Host mounts the provider's MCP
 * server only when the saved state is on *and* every required credential
 * resolves at load. A credential literal never rides a response, so the page
 * learns only whether one is configured under the reference the section names.
 */

import { createSnapshotStore, type SnapshotStore } from '@tomato/client-store'
import {
  SettingsFormModel,
  type SettingsFieldSpec,
  type SettingsFieldState,
  type SettingsFormActions,
  type SettingsFormScope,
  type SettingsFormShell,
} from '@tomato/client-ui-primitives'
import type { MarketingSettingsLocaleKey } from './locales.ts'

/** Settings namespace the Host plugin serves. */
export const MARKETING_NS = 'marketing'

/** Provider ids, mirrored from the Host plugin; a client package must not import one. */
export type ProviderId = 'googleAds' | 'googleAnalytics' | 'mosaic' | 'mailchimp'

/** The `marketing` section fields this page stages. */
export interface MarketingSettings {
  /** Google Ads switch. */
  googleAdsEnabled?: boolean
  /** Reference holding the Google Ads developer token. */
  googleAdsDeveloperTokenEnv?: string
  /** Google Analytics switch. */
  googleAnalyticsEnabled?: boolean
  /** Reference holding the Analytics service-account file path. */
  googleAnalyticsCredentialsFileEnv?: string
  /** Mosaic switch. */
  mosaicEnabled?: boolean
  /** Reference holding the Meta access token. */
  mosaicMetaTokenEnv?: string
  /** Reference holding the TikTok access token. */
  mosaicTiktokTokenEnv?: string
  /** Reference holding the YouTube access token. */
  mosaicYoutubeTokenEnv?: string
  /** Reference holding the X access token. */
  mosaicXTokenEnv?: string
  /** Mailchimp switch. */
  mailchimpEnabled?: boolean
  /** Reference holding the Mailchimp API key. */
  mailchimpApiKeyEnv?: string
}

/** One write-only credential control on the page. */
interface SecretSpec {
  /** Form field the control stages under. */
  field: string
  /** Section field naming the reference this control writes. */
  refField: keyof MarketingSettings
  /** Label key. */
  label: MarketingSettingsLocaleKey
  /** Hint key. */
  hint: MarketingSettingsLocaleKey
}

/** One provider group on the page. */
interface ProviderCard {
  /** Provider id. */
  id: ProviderId
  /** Section field the switch stages. */
  enableField: keyof MarketingSettings
  /** Group title key. */
  title: MarketingSettingsLocaleKey
  /** Group hint key. */
  hint: MarketingSettingsLocaleKey
  /** Credential controls in render order. */
  secrets: readonly SecretSpec[]
}

/** Default reference per section field, used when the section names none. */
const DEFAULT_REFS: Readonly<Record<string, string>> = {
  googleAdsDeveloperTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
  googleAnalyticsCredentialsFileEnv: 'GOOGLE_APPLICATION_CREDENTIALS',
  mosaicMetaTokenEnv: 'META_ACCESS_TOKEN',
  mosaicTiktokTokenEnv: 'TIKTOK_ACCESS_TOKEN',
  mosaicYoutubeTokenEnv: 'YOUTUBE_ACCESS_TOKEN',
  mosaicXTokenEnv: 'X_ACCESS_TOKEN',
  mailchimpApiKeyEnv: 'MAILCHIMP_API_KEY',
}

/**
 * The reference the page writes under when the section names none.
 * @param refField - section field that may name a reference.
 * @returns the reference to address.
 */
export function defaultReference(refField: keyof MarketingSettings): string {
  return DEFAULT_REFS[refField] ?? 'MARKETING_CREDENTIAL'
}

/** The page's provider groups, in render order. */
export const PROVIDERS: readonly ProviderCard[] = [
  {
    id: 'googleAds',
    enableField: 'googleAdsEnabled',
    title: 'googleAds',
    hint: 'googleAdsHint',
    secrets: [{
      field: 'googleAdsDeveloperToken',
      refField: 'googleAdsDeveloperTokenEnv',
      label: 'googleAdsDeveloperToken',
      hint: 'googleAdsDeveloperTokenHint',
    }],
  },
  {
    id: 'googleAnalytics',
    enableField: 'googleAnalyticsEnabled',
    title: 'googleAnalytics',
    hint: 'googleAnalyticsHint',
    secrets: [{
      field: 'googleAnalyticsCredentialsFile',
      refField: 'googleAnalyticsCredentialsFileEnv',
      label: 'googleAnalyticsCredentials',
      hint: 'googleAnalyticsCredentialsHint',
    }],
  },
  {
    id: 'mosaic',
    enableField: 'mosaicEnabled',
    title: 'mosaic',
    hint: 'mosaicHint',
    secrets: [
      { field: 'mosaicMetaToken', refField: 'mosaicMetaTokenEnv', label: 'mosaicMetaToken', hint: 'mosaicTokenHint' },
      { field: 'mosaicTiktokToken', refField: 'mosaicTiktokTokenEnv', label: 'mosaicTiktokToken', hint: 'mosaicTokenHint' },
      { field: 'mosaicYoutubeToken', refField: 'mosaicYoutubeTokenEnv', label: 'mosaicYoutubeToken', hint: 'mosaicTokenHint' },
      { field: 'mosaicXToken', refField: 'mosaicXTokenEnv', label: 'mosaicXToken', hint: 'mosaicTokenHint' },
    ],
  },
  {
    id: 'mailchimp',
    enableField: 'mailchimpEnabled',
    title: 'mailchimp',
    hint: 'mailchimpHint',
    secrets: [{
      field: 'mailchimpApiKey',
      refField: 'mailchimpApiKeyEnv',
      label: 'mailchimpApiKey',
      hint: 'mailchimpApiKeyHint',
    }],
  },
]

/** One credential control as the page renders it. */
export interface MarketingSecretState {
  /** Form field this control stages under. */
  field: string
  /** Staged literal, blank until typed. */
  text: string
  /** Whether the Host reports a configured credential under the reference. */
  configured: boolean
  /** Whether the credentials domain accepts a write; false disables the control. */
  writable: boolean
}

/** One provider group as the page renders it. */
export interface MarketingProviderState {
  /** Provider id. */
  id: ProviderId
  /** Staged switch position. */
  enabled: boolean
  /** The group's credential controls. */
  secrets: MarketingSecretState[]
}

/** What the Marketing page renders. */
export interface MarketingCardState extends SettingsFormShell {
  /** Provider groups in render order. */
  providers: MarketingProviderState[]
}

/** The registration-side face the page's slot entry injects. */
export interface MarketingCardFace extends SettingsFormActions {
  hooks: {
    /** Page snapshot bound by the renderer as useMarketingCard. */
    marketingCard: SnapshotStore<MarketingCardState>
  }
  /** Stage a provider switch. */
  setProvider: (id: ProviderId, enabled: boolean) => void
}

/** The credentials-domain reads and writes this page performs. */
export interface MarketingCredentialPlane {
  /**
   * Ask whether each reference is configured and writable.
   * @param refs - references to describe.
   * @returns the answer per reference; a missing entry counts as unconfigured.
   */
  describe: (refs: string[]) => Promise<Record<string, { configured: boolean; writable: boolean } | undefined>>
  /**
   * Write one literal under a reference.
   * @param ref - reference to write.
   * @param value - literal to store.
   * @returns settlement after the write.
   */
  set: (ref: string, value: string) => Promise<void>
}

/** What the credentials domain last reported for one reference. */
interface CredentialAnswer {
  /** Whether any layer supplies a value. */
  configured: boolean
  /** Whether a write from this client can affect it. */
  writable: boolean
}

/** A boolean field staged as its own text, because the form model stores text. */
function settingsBooleanField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => value === true ? 'true' : 'false',
    parse: text => text === 'true' || text === 'false' ? { kind: 'set', value: text === 'true' } : undefined,
  }
}

/** Bridges the settings scope and the credentials domain onto the page. */
export class MarketingCardController {
  private readonly form: SettingsFormModel<MarketingSettings>
  private readonly store: SnapshotStore<MarketingCardState>
  private readonly unsubscribe: (() => void)[]
  private answers: Readonly<Record<string, CredentialAnswer>> = {}

  /**
   * @param scope - the bound settings scope for the `marketing` namespace.
   * @param ctx - the page plugin's context, whose `remote.credentials` namespace
   * answers for every reference the section names.
   */
  constructor(
    private readonly scope: SettingsFormScope<MarketingSettings>,
    private readonly credentials: MarketingCredentialPlane,
  ) {
    const switches = PROVIDERS.map(provider => settingsBooleanField(provider.enableField))
    const secrets = PROVIDERS.flatMap(provider => provider.secrets.map(secret => ({
      field: secret.field,
      write: (text: string) => this.writeCredential(secret.refField, text),
    })))
    this.form = new SettingsFormModel(scope, switches, secrets)
    this.store = createSnapshotStore(this.projection())
    const publish = () => { this.store.set(this.projection()) }
    this.unsubscribe = [
      this.form.bind(() => this.form.shell()).subscribe(publish),
      scope.subscribe(() => { void this.readCredentials() }),
    ]
    void this.readCredentials()
  }

  /**
   * The reference one section field names, or the provider default.
   * @param refField - section field naming the reference.
   * @returns the reference to address.
   */
  private refOf(refField: keyof MarketingSettings): string {
    const declared = this.scope.getSnapshot().value?.[refField]
    if (typeof declared === 'string' && declared.length > 0) return declared
    return defaultReference(refField)
  }

  /** Every reference the page watches, in render order. */
  private refs(): string[] {
    return PROVIDERS.flatMap(provider => provider.secrets.map(secret => this.refOf(secret.refField)))
  }

  /**
   * Ask the credentials domain about every reference the section names.
   *
   * Answers are stored per reference rather than as one blob: a section edit
   * can rename a reference between the request and its response, and two reads
   * can settle out of order.
   */
  private async readCredentials(): Promise<void> {
    const described = await this.credentials.describe(this.refs())
    const answers: Record<string, CredentialAnswer> = {}
    for (const ref of this.refs()) {
      const view = described[ref]
      answers[ref] = { configured: view?.configured ?? false, writable: view?.writable ?? true }
    }
    this.answers = answers
    this.store.set(this.projection())
  }

  private projection(): MarketingCardState {
    return {
      ...this.form.shell(),
      providers: PROVIDERS.map(provider => ({
        id: provider.id,
        enabled: this.form.field(provider.enableField).text === 'true',
        secrets: provider.secrets.map((secret) => {
          const answer = this.answers[this.refOf(secret.refField)]
          return {
            field: secret.field,
            text: this.form.field(secret.field).text,
            configured: answer?.configured ?? false,
            writable: answer?.writable ?? true,
          }
        }),
      })),
    }
  }

  /**
   * Write one staged credential, then re-read the state the page reports.
   * @param refField - section field naming the reference to write.
   * @param value - the staged literal.
   * @returns whether the Host accepted the write; a refusal rejects instead.
   */
  private async writeCredential(refField: keyof MarketingSettings, value: string): Promise<boolean> {
    const ref = this.refOf(refField)
    await this.credentials.set(ref, value)
    await this.readCredentials()
    return true
  }

  /**
   * Re-read after the Host reports a change to a reference this page watches.
   * @param ref - the reference the Host reports as changed.
   */
  refreshCredential(ref: string): void {
    if (!this.refs().includes(ref)) return
    void this.readCredentials()
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's snapshot and its form actions.
   */
  inject(): MarketingCardFace {
    return {
      hooks: { marketingCard: this.store },
      edit: (field, text) => { this.form.actions().edit(field, text) },
      resetField: (field) => { this.form.actions().resetField(field) },
      setProvider: (id, enabled) => {
        const provider = PROVIDERS.find(candidate => candidate.id === id)
        if (provider !== undefined) this.form.actions().edit(provider.enableField, enabled ? 'true' : 'false')
      },
      save: () => { void this.form.save() },
      discard: () => { this.form.actions().discard() },
    }
  }

  /** Release configuration subscriptions. */
  dispose(): void {
    for (const off of this.unsubscribe) off()
    this.form.dispose()
  }
}

/** One field rendered by the page, exposed for its component's typing. */
export type { SettingsFieldState }
