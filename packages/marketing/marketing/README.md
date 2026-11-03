---
description: "Advertising and marketing integrations for the harness: mount Google Ads, Analytics, Meta/Instagram, TikTok, YouTube, X, and Mailchimp MCP servers from this plugin's settings, off until configured."
kind: "package-reference"
---

# @tomato/marketing

English | [中文](README.zh.md)

## Summary

Use `@tomato/marketing` to give an agent advertising and marketing tools without hand-writing an MCP row for each platform. The plugin reads one settings section, resolves the credential reference behind each provider, and mounts `@tomato/mcp-client` once per provider that is switched on and resolvable. Every provider is off by default, so a profile that adds this package gains no tool, process, or prompt text until someone configures it. Model-facing tools arrive under the provider's namespace, such as `mcp__google-ads__search`.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

## Use this package

<a id="use-this-package"></a>

Mount the plugin in a composition that already loads `@tomato/mcp-client`. The [marketing bundle](../../bundle/marketing-app/README.md) does that, and adds the [Plugins page](../../client/ui-settings-marketing/README.md) that edits this section.

```yaml
- name: '@tomato/marketing'
  config:
    googleAdsEnabled: false
    googleAdsDeveloperTokenEnv: GOOGLE_ADS_DEVELOPER_TOKEN
    mosaicEnabled: false
    mosaicMetaTokenEnv: META_ACCESS_TOKEN
```

| Field | Default | Meaning |
|---|---|---|
| `googleAdsEnabled` | `false` | Mount the Google Ads server (`pipx run --spec google-ads-mcp==0.0.5 google-ads-mcp`). |
| `googleAdsDeveloperTokenEnv` | `GOOGLE_ADS_DEVELOPER_TOKEN` | Credential reference holding the developer token. |
| `googleAdsCredentialsFileEnv` | `GOOGLE_APPLICATION_CREDENTIALS` | Credential reference holding the service-account file path. |
| `googleAdsLoginCustomerIdEnv` | `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Credential reference holding the login customer id, when one is used. |
| `googleAnalyticsEnabled` | `false` | Mount the Analytics server (`pipx run --spec google-analytics-mcp google-analytics-mcp`). |
| `googleAnalyticsCredentialsFileEnv` | `GOOGLE_APPLICATION_CREDENTIALS` | Credential reference holding the service-account file path. |
| `mosaicEnabled` | `false` | Mount the Mosaic server (`npx -y -p @openpromo/ad-platforms-cli mosaic-ads-mcp`) for Meta, Instagram, TikTok, YouTube, and X. |
| `mosaicMetaTokenEnv` | `META_ACCESS_TOKEN` | Credential reference holding the Meta access token. |
| `mosaicTiktokTokenEnv` | `TIKTOK_ACCESS_TOKEN` | Credential reference holding the TikTok access token. |
| `mosaicYoutubeTokenEnv` | `YOUTUBE_ACCESS_TOKEN` | Credential reference holding the YouTube access token. |
| `mosaicXTokenEnv` | `X_ACCESS_TOKEN` | Credential reference holding the X access token. |
| `mailchimpEnabled` | `false` | Mount the Mailchimp server (`pipx run --spec mcp-mailchimp mcp-mailchimp`). |
| `mailchimpApiKeyEnv` | `MAILCHIMP_API_KEY` | Credential reference holding the API key. |
| `mailchimpServerPrefixEnv` | `MAILCHIMP_SERVER_PREFIX` | Credential reference holding the data-center prefix. |

### Credentials

A credential reference is a name, not a secret. The plugin resolves each reference through `ctx.credentials` and falls back to the launch environment when the credentials service is absent or holds no value. A literal therefore never enters `cordis.yml`, and a key written by the Plugins page is stored by the credentials domain.

A provider mounts only when its switch is on and every env name it requires resolved. The catalog decides what "requires" means: Google Ads needs its developer token, Analytics needs the key file path, Mailchimp needs its API key, and Mosaic mounts when any one of its four platform tokens resolves. A provider that stays off for lack of a credential logs one warning naming the unresolved env names.

### Failure behavior

A provider whose server cannot start does not stop the others or the host: `@tomato/mcp-client` reports the failure and its tools stay absent. The plugin logs a warning for a skipped provider and mounts nothing silently otherwise.

-----

## Understand the implementation

<a id="understand-the-implementation"></a>

<details>
<summary>Implementation internals — click to expand</summary>

The package splits into [providers.ts](src/providers.ts) — the catalog, the flat field names, and the pure planner — and [index.ts](src/index.ts), which resolves credentials and creates children. The split keeps the decision ("does this provider mount, and with what env") testable without a Cordis context; `tests/providers.spec.ts` covers it.

Fields are flat rather than nested per provider because the client settings form model addresses top-level fields only. The provider id, its switch field, and its env-to-reference field map live in one table, so a client page and the host plugin cannot disagree about names.

Mounting is effect-scoped: each child is created inside the plugin's fiber, so disposal unregisters its tools and ends its connection. A settings write changes the profile patch, which reloads the entry and re-runs `apply` with the new section.

</details>

-----

## Further Exploration

<a id="further-exploration"></a>

- [marketing-app bundle](../../bundle/marketing-app/README.md) — the bundle that mounts this plugin and the page.
- [Marketing settings page](../../client/ui-settings-marketing/README.md) — the Plugins page that edits this section and writes its credentials.
- [mcp-client](../../mcp/mcp-client/README.md) — the connection every provider mounts through.
- [credentials](../../credentials/README.md) — the reference seam the switches resolve through.

-----

## Model Experience

### Provider tools

#### What the model sees

Nothing while every provider is off, which is the default. A mounted provider publishes its own tool definitions through `@tomato/mcp-client` under `mcp__<serverName>__<tool>`; this package adds no tool, prompt section, or result text of its own.

#### Token effect

A mounted provider's schema cost is charged on every request from an Agent whose scope sees those tools. A settings save that mounts or disposes a provider adds or removes that whole schema set at once.

#### KV Cache effect

None while off. With a provider mounted the effect is `@tomato/mcp-client`'s: definitions stay prefix-stable until the mounted set changes, and a save that mounts or disposes a provider may invalidate reuse from the first changed schema token.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Commands follow upstream packaging.** The Google Ads and Mosaic commands were verified against their published packages; the Analytics and Mailchimp console script names were not. Both are regular fields on the settings section, so a rename is corrected by configuration rather than a code change.
- **No per-platform switch inside Mosaic.** One server serves all four platforms; the tokens decide which platforms work, and the page shows four credential controls for that reason.
- **Provider failures are only logged.** A server that cannot start leaves its tools absent without a page-level diagnostic; the Plugins page reports only the configured state of credentials.

### Dev Note

<a id="dev-note"></a>

<details>
<summary>Working context for maintainers — click to expand</summary>

The catalog is data, not policy: adding a provider means one entry in `PROVIDERS`, its field names in `PROVIDER_FIELDS`, and its section fields. Keep the default reference names identical to the env names the server reads, so a deployment that exports them needs no configuration.

</details>