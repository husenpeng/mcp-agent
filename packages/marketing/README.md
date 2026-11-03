---
description: "The marketing package group: advertising and marketing integrations mounted from one settings section, plus the Plugins page that edits it."
kind: "package-group"
---

# marketing/ — Advertising and marketing integrations

English | [中文](README.zh.md)

## Summary

Connect advertising and marketing platforms to a profile as one switchable bundle. Every provider is off until someone switches it on in the Web Plugins page and fills the credentials it needs; an untouched installation gains no MCP server, no tool, and no prompt text. The group composes the MCP client, settings, and credentials subsystems rather than defining a subsystem of its own: the catalog is data, and each connection's behavior belongs to `@tomato/mcp-client`.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

Choose this group when a profile should reach Google Ads, Analytics, Meta/Instagram, TikTok, YouTube, X, or Mailchimp through MCP servers.

| Package | Role |
|---|---|
| [`marketing/`](marketing/README.md) | The Host plugin: provider catalog, settings section, credential resolution, and one child connection per enabled provider |
| [`marketing-app`](../bundle/marketing-app/README.md) | The bundle that mounts the plugin and its Plugins page |
| [`ui-settings-marketing`](../client/ui-settings-marketing/README.md) | The Plugins page that edits the section and writes its credentials |

-----

<a id="related-documentation"></a>
## Related documentation

- [MCP subsystem](../../docs/subsystems/mcp.md) — how an external server's tools reach the model, and the client's reconnection and failure behavior.
- [Credentials](../credentials/credentials/README.md) — where the secrets behind each provider live.
- [Settings](../settings/settings/README.md) — the volatile fields and the patch write a form performs.
- [Marketing integration design note](../../.agents/notes/implemented/architecture/2026-10-30-marketing-integration-bundle.md) — why one plugin mounts every provider instead of one bundle each.

-----

<a id="dev-note"></a>
## Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The catalog lives in `packages/marketing/marketing/src/providers.ts`; adding a provider means one catalog entry, its flat field names, and its settings fields. Keep the default reference names equal to the env names each server reads, so a deployment that exports them needs no page configuration.

</details>