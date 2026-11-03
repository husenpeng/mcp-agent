---
description: "The advertising and marketing bundle: mounts @tomato/marketing and its Plugins page, with every provider off until configured."
kind: "package-bundle"
---

# @tomato/marketing-app

English | [中文](README.zh.md)

## Summary

Use `@tomato/marketing-app` to add advertising and marketing integrations to a profile as one switchable bundle. The bundle's patch adds two rows: the [marketing plugin](../../marketing/marketing/README.md), which mounts a provider's MCP server only after that provider is on and its credentials resolve, and the [Marketing settings page](../../client/ui-settings-marketing/README.md), which edits the plugin's section from the Web Plugins page. Installing the bundle changes no tool: every provider stays off until someone configures it.

## Table of Contents

- [Use this package](#use-this-package)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

## Use this package

<a id="use-this-package"></a>

Add the bundle to a profile that already carries `@tomato/base` and, for the settings page, `@tomato/web-app`.

```sh
pnpm tomato plugin --profile web add @tomato/marketing-app
```

Then open **Plugins → Marketing** and switch on a provider, filling the credentials it needs. The bundle is not part of any shipped profile template, so it applies to the profiles that select it and leaves every other profile untouched.

A profile without the Web client still loads the Host row; it simply has no page to configure the section, and every provider stays off.

-----

## Further Exploration

<a id="further-exploration"></a>

- [marketing plugin](../../marketing/marketing/README.md) — the catalog, settings fields, and credential resolution.
- [Marketing settings page](../../client/ui-settings-marketing/README.md) — the page that edits the section.
- [web-app bundle](../web-app/README.md) — the Web composition the page needs.
- [mcp-client](../../mcp/mcp-client/README.md) — the connection each provider mounts.

-----

## Model Experience

### Provider tools

#### What the model sees

Nothing until a provider is configured on the Plugins page. The bundle contributes no tool, prompt section, or result text of its own; a configured provider publishes its definitions through the marketing plugin and `@tomato/mcp-client`.

#### Token effect

Zero on a profile that configures no provider. Each configured provider adds its schema cost to every request from an Agent whose scope sees those tools.

#### KV Cache effect

None while every provider is off; a mounted provider's definitions stay prefix-stable until the mounted set changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Not offered in the Official plugin list.** The bundle is a workspace package rather than a published one, so the Plugins page does not list it for on-demand installation; add it to a profile explicitly.
- **No provider diagnostics on the page.** The page reports whether credentials are configured; a server that fails to start reports only through the Host log.

-----

### Dev Note

<a id="dev-note"></a>

<details>
<summary>Working context for maintainers — click to expand</summary>

The bundle carries no runtime API: its patch and its `tomato.bundle.patch` field are the whole contract. A provider added to the catalog needs no change here.

</details>
