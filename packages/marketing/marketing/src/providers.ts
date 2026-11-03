/**
 * The advertising and marketing MCP servers this plugin can mount, and the pure
 * planner that turns one provider selection into the child configurations
 * `@tomato/mcp-client` receives. Keeping the catalog and the plan free of ctx
 * lets the settings page and tests share one description of a provider.
 * @module @tomato/marketing/providers
 */

/** Provider ids the settings form and the plan use as stable keys. */
export type ProviderId = 'googleAds' | 'googleAnalytics' | 'mosaic' | 'mailchimp'

/**
 * One mountable provider: where its server comes from, which namespace its
 * tools take, and which env vars carry its credentials.
 */
export interface ProviderSpec {
  /** Stable key in configuration and the settings page. */
  id: ProviderId
  /** Title shown in logs and the settings page. */
  title: string
  /**
   * Namespace for model-facing tool names (`mcp__<serverName>__<tool>`).
   * Must match `[A-Za-z0-9_-]{1,32}`.
   */
  serverName: string
  /** Executable that starts the server. */
  command: string
  /** Arguments passed to {@link command} without shell interpolation. */
  args: readonly string[]
  /**
   * Env var names the server needs at least one of. The plan refuses the mount
   * when every one of them resolves empty.
   */
  credentials: readonly string[]
  /**
   * Env var names forwarded when they resolve. A provider whose credentials are
   * all empty still mounts when one of these resolves.
   */
  optional: readonly string[]
}

/**
 * The shipped catalog. Commands and package names follow each upstream's
 * published README; a renamed console script is corrected through the provider
 * fields on the settings page rather than by editing this table.
 */
export const PROVIDERS: readonly ProviderSpec[] = [
  {
    id: 'googleAds',
    title: 'Google Ads',
    serverName: 'google-ads',
    command: 'pipx',
    args: ['run', '--spec', 'google-ads-mcp==0.0.5', 'google-ads-mcp'],
    credentials: ['GOOGLE_ADS_DEVELOPER_TOKEN'],
    optional: ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID'],
  },
  {
    id: 'googleAnalytics',
    title: 'Google Analytics 4',
    serverName: 'google-analytics',
    command: 'pipx',
    args: ['run', '--spec', 'google-analytics-mcp', 'google-analytics-mcp'],
    credentials: ['GOOGLE_APPLICATION_CREDENTIALS'],
    optional: [],
  },
  {
    id: 'mosaic',
    title: 'Meta, Instagram, TikTok, YouTube, X',
    serverName: 'mosaic-ads',
    command: 'npx',
    args: ['-y', '-p', '@openpromo/ad-platforms-cli', 'mosaic-ads-mcp'],
    credentials: [],
    optional: ['META_ACCESS_TOKEN', 'TIKTOK_ACCESS_TOKEN', 'YOUTUBE_ACCESS_TOKEN', 'X_ACCESS_TOKEN'],
  },
  {
    id: 'mailchimp',
    title: 'Mailchimp',
    serverName: 'mailchimp',
    command: 'pipx',
    args: ['run', '--spec', 'mcp-mailchimp', 'mcp-mailchimp'],
    credentials: ['MAILCHIMP_API_KEY'],
    optional: ['MAILCHIMP_SERVER_PREFIX'],
  },
]

/**
 * The flat settings fields one provider section owns. Flat rather than nested
 * because the settings form model addresses top-level fields only.
 */
export interface ProviderFields {
  /** Switch field name. */
  enabled: string
  /** Env name to the field naming that env's credential reference. */
  refs: Readonly<Record<string, string>>
}

/** Field names per provider, in the order the settings page renders them. */
export const PROVIDER_FIELDS: Readonly<Record<ProviderId, ProviderFields>> = {
  googleAds: {
    enabled: 'googleAdsEnabled',
    refs: {
      GOOGLE_ADS_DEVELOPER_TOKEN: 'googleAdsDeveloperTokenEnv',
      GOOGLE_APPLICATION_CREDENTIALS: 'googleAdsCredentialsFileEnv',
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: 'googleAdsLoginCustomerIdEnv',
    },
  },
  googleAnalytics: {
    enabled: 'googleAnalyticsEnabled',
    refs: { GOOGLE_APPLICATION_CREDENTIALS: 'googleAnalyticsCredentialsFileEnv' },
  },
  mosaic: {
    enabled: 'mosaicEnabled',
    refs: {
      META_ACCESS_TOKEN: 'mosaicMetaTokenEnv',
      TIKTOK_ACCESS_TOKEN: 'mosaicTiktokTokenEnv',
      YOUTUBE_ACCESS_TOKEN: 'mosaicYoutubeTokenEnv',
      X_ACCESS_TOKEN: 'mosaicXTokenEnv',
    },
  },
  mailchimp: {
    enabled: 'mailchimpEnabled',
    refs: {
      MAILCHIMP_API_KEY: 'mailchimpApiKeyEnv',
      MAILCHIMP_SERVER_PREFIX: 'mailchimpServerPrefixEnv',
    },
  },
}

/** One resolved child configuration, ready for `@tomato/mcp-client`. */
export interface ProviderMount {
  /** Provider the mount came from. */
  id: ProviderId
  /** Namespace for the mounted server's tool names. */
  serverName: string
  /** Executable that starts the server. */
  command: string
  /** Arguments passed to {@link command}. */
  args: readonly string[]
  /** Extra env vars merged over the scrubbed ambient environment. */
  env: Readonly<Record<string, string>>
}

/** A provider that stayed unmounted, with every env name it could not resolve. */
export interface SkippedProvider {
  /** Provider that stayed unmounted. */
  id: ProviderId
  /** Env names that resolved empty; empty when the provider was simply off. */
  missing: readonly string[]
}

/**
 * Unwrap one provider's switches and credential references into the selection
 * the planner reads.
 * @param id - provider whose fields are read.
 * @param settings - every resolved top-level field value.
 * @param resolve - resolves one credential reference to its secret.
 * @returns the provider's enablement and its env values.
 */
export async function selectionOf(
  id: ProviderId,
  settings: Readonly<Record<string, unknown>>,
  resolve: (ref: string) => Promise<string>,
): Promise<{ enabled: boolean; values: Record<string, string> }> {
  const fields = PROVIDER_FIELDS[id]
  const enabled = settings[fields.enabled] === true
  if (!enabled) return { enabled, values: {} }
  const values: Record<string, string> = {}
  for (const [envName, field] of Object.entries(fields.refs)) {
    const ref = settings[field]
    values[envName] = typeof ref === 'string' && ref.length > 0 ? await resolve(ref) : ''
  }
  return { enabled, values }
}

/**
 * Turn one provider selection into child configurations.
 * A disabled provider is skipped without reading its values; an enabled one
 * mounts only when every required env name resolved, and — for a provider with
 * no required names — at least one optional name did.
 * @param selection - Per-provider enablement and the env values resolved for it.
 * @returns The mounts to create and the providers that stayed off.
 */
export function planProviderMounts(
  selection: Readonly<Record<ProviderId, { enabled: boolean; values: Readonly<Record<string, string>> }>>,
): { mounts: ProviderMount[]; skipped: SkippedProvider[] } {
  const mounts: ProviderMount[] = []
  const skipped: SkippedProvider[] = []
  for (const spec of PROVIDERS) {
    const chosen = selection[spec.id]
    if (!chosen.enabled) {
      skipped.push({ id: spec.id, missing: [] })
      continue
    }
    const missing = spec.credentials.filter(name => (chosen.values[name] ?? '').length === 0)
    const optional = spec.optional.filter(name => (chosen.values[name] ?? '').length > 0)
    if (missing.length > 0 || (spec.credentials.length === 0 && optional.length === 0)) {
      skipped.push({ id: spec.id, missing: missing.length > 0 ? missing : spec.optional })
      continue
    }
    const env: Record<string, string> = {}
    // Both lists here hold only names whose value is non-empty: the required
    // names passed the `missing` filter and `optional` is filtered on a value.
    for (const name of [...spec.credentials, ...optional]) env[name] = chosen.values[name] as string
    mounts.push({ id: spec.id, serverName: spec.serverName, command: spec.command, args: spec.args, env })
  }
  return { mounts, skipped }
}
