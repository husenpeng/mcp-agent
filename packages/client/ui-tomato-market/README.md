---
description: "The Marketing plugins and General plugins tabs of the Web Plugins page: a curated marketing catalog and the open plugin catalog, installed through the page's own dialog."
kind: "package-reference"
---

# @tomato/client-ui-tomato-market

English | [中文](README.zh.md)

## Summary

Two tabs open the plugin markets inside the **Plugins** page, between **Installed** and **Discover**: **General market**, the open Tomato plugin catalog, then **Marketing market**, a curated catalog of open-source plugins, MCP servers, and Skills for overseas creator marketing. Each tab lists its catalog with search, filters, sort, and paging; opening an entry shows its facts, versions, and long description. Installing a plugin package hands an exact version to the Plugins page's install dialog, so the page keeps its one installation path; installing an MCP server or a Skill is done by [`@tomato/plugin-tomato-market`](../../../plugins/tomato-market/README.md) from the entry id the catalog pins.

## Table of Contents

- [Summary](#summary)
- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Open **Plugins** and choose either market tab. Both tabs render only while this package is mounted; it is part of the plugin markets bundle, so a profile without that bundle shows neither tab.

**Marketing market** counts the catalog by kind (**plugin**, **MCP**, **Skill**), filters by category, and searches names, platforms, categories, and skill names. Each row shows the entry's artwork, kind and access tags (**Free key needed**, **Self-hosted**, **Login needed**, **Manual install**, **Installed**), a two-line description, and its license, last update, and repository. The entry page shows the full description, the pinned package and version or the pinned commit, the Skills an install writes, the environment variables the entry reads, the account-risk notice for an entry that uses the reader's own login, and the repository README. **Install** on an MCP server or Skill opens a confirmation that shows the command that runs, the `cordis.patch.yml` rows it appends or the directories it writes, and any skill-name conflict; confirming runs the Host's install and reports whether the profile applied it now or after a restart. Uninstalling removes only what that entry installed.

**General market** browses the open catalog grouped by category, with search, category pills, and sorting by GitHub stars, last update, or name. Each plugin page shows its category, whether it targets TOMATO, the running TOMATO version, and whether the newest version is compatible with it, then its source facts, its listed versions, and its README. **Install** checks the version against the installer's own rules first: a compatible plugin opens the page's install dialog at its check screen; a plugin that only targets TOMATO offers the compatibility layer; a plugin that declares no bundle is refused; and a version whose compatibility the registries cannot confirm may still be installed deliberately. When the newest version needs a newer TOMATO, the tab substitutes the newest listed version that runs and says so above the list.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The tabs register into `plugins.tab`, the slot [`ui-plugin-manager`](../ui-plugin-manager/README.md) declares. Their owner props are the page's `install({ spec, registry?, title, version })` and `openPackage(name)`; a tab never installs anything itself. Every fact comes from the host half over the authenticated `api/tomato-market` route, whose request and reply types live in `@tomato/plugin-tomato-market/api` and reach the browser as types only, with the route string as the one inlined value.

Each tab has one React-free controller (`general-controller.ts`, `marketing-controller.ts`) that owns reads, filters, the open entry, and the preflight in a snapshot store; the registered component binds that store as `useGeneral` or `useMarketing` and receives the actions through injection. The views (`GeneralMarket.tsx`, `MarketingMarket.tsx`) are pure props components: the registered entry reads the state and the active locale once, then renders a view at one language, so a language switch remounts the derived view rather than re-deriving text inside it. `catalog.ts` and `marketing-search.ts` hold the pure catalog helpers: localized text, star lookup, search, ordering, category sections, install specs, and compatibility badges. The Marketing tab reuses the General tab's compatibility preflight for its plugin entries, so an entry that pins an incompatible package gets the same explanation as a catalog plugin. Both tabs merge the shared common vocabulary through the locale lookup chain; their own copy lives in `locales.ts`, with Chinese as the key source of truth.

-----

<a id="model-experience"></a>
## Model Experience

None, as the tabs render Host catalog facts and page install requests in the browser.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No index search across MCP servers and Skills.** Marketing search matches the bundled catalog only; the open catalog behind Discover and custom indexes is a separate tab.
- **No update path for MCP servers and Skills.** Their install is pinned to the reviewed version or commit, so an update means uninstalling and installing again.

The tab views render per language: each controller's injected `locale` seat reads the shell's locale snapshot, and the registered entry passes the active language down, because the framework re-renders entry bodies at a new locale revision but does not re-run their render functions' local derivation.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The two tabs live in one client package beside the catalog readers: the Host half answers over `/api/tomato-market`, and the browser half registers the tabs on `plugins.tab`. Installing a plugin package hands the page's own install dialog a stage, so the Plugins page keeps its one installation path.

</details>
