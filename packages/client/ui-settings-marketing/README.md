---
description: "The Marketing settings page on the tomato web client's Plugins page: one switch per advertising or marketing provider and its credential references."
kind: "package-reference"
---

# @tomato/client-ui-settings-marketing

English | [中文](README.zh.md)

## Summary

Open **Plugins** in the sidebar and select **Marketing** to switch advertising and marketing providers on and to fill the credentials each one needs. The page stages what is typed and writes it only on save; credentials are written through the credentials domain rather than the settings document, so a literal never rides a response. The page exists while the Host serves the `marketing` namespace, which the [marketing plugin](../../marketing/marketing/README.md) supplies.

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

The **Marketing** card in the Official group opens the page. It renders one group per provider — Google Ads, Google Analytics 4, Meta/Instagram/TikTok/YouTube/X, and Mailchimp — each with an **Enable** switch and the credential controls that provider reads.

A credential control starts blank on every load and reports only whether a credential is configured under the reference the section names; a blank draft keeps the stored value. A reference the section renames is addressed by its new name, so a deployment that exports its own env names needs no page change. Every control is disabled while the credentials domain reports it unwritable, such as a value the process environment supplies.

Nothing is written until **Save**; leaving the page drops the drafts. One save writes the staged switches to the settings section and each staged credential to its reference, and the provider's MCP server mounts or unmounts as a result of the recomposition.

-----

## Understand the implementation

<a id="understand-the-implementation"></a>

<details>
<summary>Implementation internals — click to expand</summary>

The Host half is an empty `apply`, present only so the package holds a Loader row the client module system serves the browser half for. The browser half binds the `marketing` namespace through `ctx.configForms.get` and keeps one `SettingsFormModel` of `ui-primitives` over it in `MarketingCardController`. Switches are boolean fields staged as their own text; the seven credential controls are the form's secret specs, whose writes go to `remote.credentials.set` under the reference the corresponding section field names, with success read back from `remote.credentials.describe`.

The controller takes a narrow credential plane instead of the browser context, so package tests drive it with an in-memory scope and a recording plane and no renderer. The page registers into the Plugins page's `plugins.item` slot through `ctx.configForms.whileServed`.

</details>

-----

## Further Exploration

<a id="further-exploration"></a>

- [marketing plugin](../../marketing/marketing/README.md) — the namespace, fields, and credential resolution this page edits.
- [ui-plugin-manager](../ui-plugin-manager/README.md) — the Plugins page and the `plugins.item` slot.
- [ui-primitives](../ui-primitives/README.md) — the settings form model and fields the page renders.
- [credentials](../../credentials/README.md) — the reference seam each credential control writes through.

-----

## Model Experience

None, as the package is a browser-side settings surface that registers no model surface.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No provider start diagnostics.** The page reports credential state only; a server that fails to start leaves its tools absent without a page-level message.
- **No command overrides.** The MCP command and package for each provider stay in the Host catalog; only switches and credential references are editable here.
- **Two languages.** The page ships English and Simplified Chinese dictionaries; other Web locales fall back to English.

-----

### Dev Note

<a id="dev-note"></a>

<details>
<summary>Working context for maintainers — click to expand</summary>

The controller takes the credentials plane as a parameter only so tests can drive it without a browser context; production passes an adapter over `remote.credentials`. Keep the provider table and the Host catalog's field names in step: a renamed section field reaches this page as an unknown reference rather than an error.

</details>
