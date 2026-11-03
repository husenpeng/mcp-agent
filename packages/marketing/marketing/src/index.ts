/**
 * Advertising and marketing integrations: mount the MCP servers a deployment
 * configured, one child per enabled provider, and leave every provider off
 * until its credentials resolve. The plugin owns no tools of its own; it reads
 * its settings section and hands each mount to `@tomato/mcp-client`, so the
 * model sees provider tools as `mcp__<provider>__<tool>`.
 *
 * Off is the default: an empty settings section mounts nothing and logs nothing,
 * which keeps a fresh profile exactly as it shipped.
 * @module @tomato/marketing
 */

import type { Context, Volatile } from '@tomato/cordis'
import z from '@tomato/schemastery'
import * as McpClient from '@tomato/mcp-client'
import { credentialRef } from '@tomato/credentials'
import { launchEnvironmentOf } from '@tomato/launch-environment'
import { planProviderMounts, PROVIDERS, selectionOf } from './providers.ts'
import type { ProviderMount, SkippedProvider } from './providers.ts'
import type { ProviderId } from './providers.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'marketing'

/** Settings namespace the Plugins page binds for this section. */
export const MARKETING_SETTINGS_NAMESPACE = 'marketing'

/**
 * Plugin config: the switches and credential references the Plugins page edits.
 * Fields are flat because the settings form model addresses top-level names.
 */
export interface Config {
  /** Mount the Google Ads server. */
  googleAdsEnabled: Volatile<boolean>
  /** Credential reference holding the Google Ads developer token. */
  googleAdsDeveloperTokenEnv: Volatile<string>
  /** Credential reference holding the service-account file path. */
  googleAdsCredentialsFileEnv: Volatile<string>
  /** Credential reference holding the login customer id, when one is used. */
  googleAdsLoginCustomerIdEnv: Volatile<string>
  /** Mount the Analytics server. */
  googleAnalyticsEnabled: Volatile<boolean>
  /** Credential reference holding the Analytics service-account file path. */
  googleAnalyticsCredentialsFileEnv: Volatile<string>
  /** Mount the Mosaic server serving Meta, Instagram, TikTok, YouTube, and X. */
  mosaicEnabled: Volatile<boolean>
  /** Credential reference holding the Meta access token. */
  mosaicMetaTokenEnv: Volatile<string>
  /** Credential reference holding the TikTok access token. */
  mosaicTiktokTokenEnv: Volatile<string>
  /** Credential reference holding the YouTube access token. */
  mosaicYoutubeTokenEnv: Volatile<string>
  /** Credential reference holding the X access token. */
  mosaicXTokenEnv: Volatile<string>
  /** Mount the Mailchimp server. */
  mailchimpEnabled: Volatile<boolean>
  /** Credential reference holding the Mailchimp API key. */
  mailchimpApiKeyEnv: Volatile<string>
  /** Credential reference holding the Mailchimp data-center prefix. */
  mailchimpServerPrefixEnv: Volatile<string>
}

export const Config = z.object({
  googleAdsEnabled: z.boolean().default(false).volatile(),
  googleAdsDeveloperTokenEnv: z.string().default('GOOGLE_ADS_DEVELOPER_TOKEN').volatile(),
  googleAdsCredentialsFileEnv: z.string().default('GOOGLE_APPLICATION_CREDENTIALS').volatile(),
  googleAdsLoginCustomerIdEnv: z.string().default('GOOGLE_ADS_LOGIN_CUSTOMER_ID').volatile(),
  googleAnalyticsEnabled: z.boolean().default(false).volatile(),
  googleAnalyticsCredentialsFileEnv: z.string().default('GOOGLE_APPLICATION_CREDENTIALS').volatile(),
  mosaicEnabled: z.boolean().default(false).volatile(),
  mosaicMetaTokenEnv: z.string().default('META_ACCESS_TOKEN').volatile(),
  mosaicTiktokTokenEnv: z.string().default('TIKTOK_ACCESS_TOKEN').volatile(),
  mosaicYoutubeTokenEnv: z.string().default('YOUTUBE_ACCESS_TOKEN').volatile(),
  mosaicXTokenEnv: z.string().default('X_ACCESS_TOKEN').volatile(),
  mailchimpEnabled: z.boolean().default(false).volatile(),
  mailchimpApiKeyEnv: z.string().default('MAILCHIMP_API_KEY').volatile(),
  mailchimpServerPrefixEnv: z.string().default('MAILCHIMP_SERVER_PREFIX').volatile(),
})

/**
 * Resolve one credential reference, preferring the credentials store and
 * falling back to the launch environment when the store is absent or holds no
 * value for the reference.
 * @param ctx - plugin context supplying the credential and environment planes.
 * @param ref - credential reference to resolve.
 * @returns the secret, or an empty string when nothing resolved one.
 */
async function resolveCredential(ctx: Context, ref: string): Promise<string> {
  const key = credentialRef(ref)
  const credentials = ctx.get('credentials')
  if (credentials !== undefined) {
    const stored = await credentials.resolve(key)
    if (stored !== undefined && stored.value.length > 0) return stored.value
  }
  return launchEnvironmentOf(ctx).get(key)?.value ?? ''
}

/**
 * Resolve the providers a configuration mounts, after credential resolution.
 * Pure apart from the credential and environment planes, so a composition test
 * can read the decision without starting a child process.
 * @param ctx - plugin context supplying the credential and environment planes.
 * @param config - the current settings section.
 * @returns the child configurations to create and the providers that stayed off.
 */
export async function resolveMounts(
  ctx: Context,
  config: Config,
): Promise<{ mounts: ProviderMount[]; skipped: SkippedProvider[] }> {
  const settings: Record<string, unknown> = {
    googleAdsEnabled: config.googleAdsEnabled.get(),
    googleAdsDeveloperTokenEnv: config.googleAdsDeveloperTokenEnv.get(),
    googleAdsCredentialsFileEnv: config.googleAdsCredentialsFileEnv.get(),
    googleAdsLoginCustomerIdEnv: config.googleAdsLoginCustomerIdEnv.get(),
    googleAnalyticsEnabled: config.googleAnalyticsEnabled.get(),
    googleAnalyticsCredentialsFileEnv: config.googleAnalyticsCredentialsFileEnv.get(),
    mosaicEnabled: config.mosaicEnabled.get(),
    mosaicMetaTokenEnv: config.mosaicMetaTokenEnv.get(),
    mosaicTiktokTokenEnv: config.mosaicTiktokTokenEnv.get(),
    mosaicYoutubeTokenEnv: config.mosaicYoutubeTokenEnv.get(),
    mosaicXTokenEnv: config.mosaicXTokenEnv.get(),
    mailchimpEnabled: config.mailchimpEnabled.get(),
    mailchimpApiKeyEnv: config.mailchimpApiKeyEnv.get(),
    mailchimpServerPrefixEnv: config.mailchimpServerPrefixEnv.get(),
  }
  const selection = {} as Record<ProviderId, { enabled: boolean; values: Record<string, string> }>
  for (const spec of PROVIDERS) {
    selection[spec.id] = await selectionOf(spec.id, settings, ref => resolveCredential(ctx, ref))
  }
  return planProviderMounts(selection)
}

/**
 * Mount every enabled provider whose credentials resolve.
 *
 * Mounting is effect-scoped: disposing this plugin disposes each child, which
 * unregisters its tools and ends its connection. A provider that is off, or
 * enabled without credentials, stays unmounted and is reported once at startup.
 * @param ctx - plugin context the child connections attach to.
 * @param config - the current settings section.
 * @returns nothing; children are created as effects of this fiber.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const { mounts, skipped } = await resolveMounts(ctx, config)
  for (const provider of skipped) {
    if (provider.missing.length > 0) {
      ctx.logger.warn('marketing: %s stays off; unresolved %s', provider.id, provider.missing.join(', '))
    }
  }
  for (const mount of mounts) {
    ctx.plugin(McpClient, {
      transport: 'stdio',
      serverName: mount.serverName,
      command: mount.command,
      args: [...mount.args],
      env: { ...mount.env },
    })
  }
}
