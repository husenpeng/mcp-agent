---
description: "Plugin markets host half: catalog readers and installers behind the authenticated `/api/tomato-market` route for the Marketing plugins and General plugins tabs."
kind: "package-reference"
---

# @tomato/plugin-tomato-market

English | [中文](README.zh.md)

## Summary

The host half of the plugin markets: it reads the open Tomato plugin catalog and its GitHub star counts, reads one listed version's published manifest and README, serves the curated marketing catalog bundled with the package, and installs that catalog's MCP servers and Skills. The Web and Desktop profiles mount it as part of their shipped bundle list, so the [General market and Marketing market tabs](../../packages/client/ui-tomato-market/README.md) appear in the Plugins page without installing anything.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Open **Plugins → General market** or **Plugins → Marketing market**. The tabs ask this package for every fact over the authenticated `POST /api/tomato-market` route; the browser never chooses a command.

### Marketing catalog

The catalog is bundled at `src/host/marketing-catalog.json` and needs no network to browse. Each entry names its kind (plugin, MCP server, or Skill), its categories, how it is reached (free, free key, self-hosted, or the reader's own login), and one install. A plugin entry declares an exact npm package and version, which the tab hands to the Plugins page's own install dialog. An MCP entry declares an `npx` or `uvx` runner, an exact package and version, and the environment variable names it reads; installing it appends one `@tomato/mcp-client` row with id `mkt-mcp-<id>` and server name `mkt-<id>` inside a comment-marked block of the running profile's `cordis.patch.yml`. A Skill entry declares a GitHub repository, a full commit, and the skill directories the entry installs; installing downloads them through jsDelivr into `$TOMATO_HOME/skills/<name>` with a `.tomato-market.json` marker, and uninstalling removes only marked directories the entry installed. A manual entry carries written steps and installs nothing.

Every MCP write copies the previous file to `cordis.patch.yml.bak-tomato-market`, replaces it through a temporary file and a rename inside the HMR queue and the profile manifest lock, and restores it when the profile refuses the new configuration. Text outside the market block stays byte for byte, and a block edited by hand stops the write with the reason. Credentials never reach the file: entries declare variable names only, and the row passes them from the Host environment with an `!!js` expression because MCP children drop credential-shaped names.

### General catalog and installs

The open catalog comes from the `tomato-plugin-catalog` npm package on jsDelivr, with `awesome-tomato-plugin.com` and `dshmarket.com` as fallbacks; star counts come from the `plugins.json` published beside it. One read keeps the newest 24 versions per plugin, a 400-character description, and its keywords. The tab renders the catalog's facts and asks this package to read one version's manifest, resolve which listed version the running TOMATO admits, read its README, or convert it through the compatibility layer.

A version's compatibility uses the installer's own rule, against the `version` in the profile's `installAnchor` manifest: its `engines.tomato` range alone when the package declares one, otherwise every `@tomato/*` peer range, with the vendored Cordis packages exempt. Resolution starts from the version the reader chose, then walks the catalog's remaining versions and the older versions the registry publishes, newest first, reading at most eight manifests, and answers with the first one the running TOMATO admits. A package that only declares Tomato Harness metadata is converted on request: this package downloads that version's tarball, rejects unsafe or oversized archives, rewrites package names, peer dependencies, and text imports to the Tomato names, repacks it under one `package/` root, and returns a `file:` spec for the page's install dialog. Conversion reads and rewrites text only; it never executes package code.

### Configuration

The `tomato-market` row accepts these fields; every one has a fixed default:

| Field | Default | Meaning |
|---|---|---|
| `indexUrls` | jsDelivr's `tomato-plugin-catalog/index.json`, then awesome-tomato-plugin.com, then dshmarket.com | Catalog mirrors in fallback order |
| `starUrls` | jsDelivr's `tomato-plugin-catalog/plugins.json`, then awesome-tomato-plugin.com | Star-document mirrors |
| `timeoutMs` | `20000` | Deadline of one HTTP read, body included |
| `cacheTtlMs` | `600000` | Lifetime of a successful catalog, star, manifest, or README read |
| `skillRoot` | `$TOMATO_HOME/skills` | Where Skill entries install |

Registries are fixed: `registry.npmjs.org` first, then `registry.npmmirror.com`. The route accepts only catalog-listed `name@version` pairs and marketing entry ids; it never accepts a URL or a command from the browser.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The package is one function plugin: `inject` requires `connection` and reads `profileContext`, `hmr`, and `@tomato/atomic-write` with `ctx.get`, because the non-Web official compositions mount no browser route and their reads still serve the Desktop packaging probe. One market object owns the AbortController of every HTTP read, the caches, the registry fallbacks, the compatibility adapter's cache directory (`$TOMATO_HOME/.plugin-market/adapted`), and the two installers; the route handler validates each payload field against the shapes in `src/api.ts` before calling it, and disposal aborts the reads.

`src/api.ts` is the shared web contract: request and reply types, the `ManifestFacts`, `Resolution`, and `MarketingPreview` replies, the `MarketTabProps` owner props of the Plugins page's tabs, and the `ROUTE` constant the browser half inlines. The host serves the route at `/${ROUTE}`.

The source map:

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Plugin entry, market object, route handler |
| [`src/api.ts`](src/api.ts) | Shared request, reply, and tab-props contract |
| [`src/host/catalog.ts`](src/host/catalog.ts) | Catalog mirrors, compaction, star map |
| [`src/host/http.ts`](src/host/http.ts) | Bounded HTTP reads and the read cache |
| [`src/host/registry.ts`](src/host/registry.ts) | Manifest classes and README candidates |
| [`src/host/compatibility.ts`](src/host/compatibility.ts) | The installer's compatibility rule and candidate order |
| [`src/host/compat.ts`](src/host/compat.ts) | Tomato Harness → Tomato naming |
| [`src/host/adapt.ts`](src/host/adapt.ts) | Tarball conversion |
| [`src/host/marketing.ts`](src/host/marketing.ts) | Bundled catalog validation and MCP commands |
| [`src/host/marketing-readme.ts`](src/host/marketing-readme.ts) | One entry's long description |
| [`src/host/mcp-install.ts`](src/host/mcp-install.ts) | `cordis.patch.yml` rows |
| [`src/host/skill-install.ts`](src/host/skill-install.ts) | Skill directories |

-----

<a id="model-experience"></a>
## Model Experience

None, as the market serves the Plugins page tabs and nothing it reads or installs reaches a model request.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Compatibility is a manifest judgement.** The rule reads declared ranges only, exactly as the installer does, so a plugin whose ranges fit but whose internals assume another harness can still fail to load.
- **Resolution reads at most eight manifests per install.** Older versions the registry publishes can remain unreachable when every candidate within that bound is incompatible.
- **MCP servers and Skills have no update path.** Each install is pinned to the reviewed version or commit; updating means uninstalling and installing again.
- **A converted package keeps its `file:` origin.** After the compatibility-layer install, the Plugins page lists the local tarball, so updating means installing from the market again.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The bundle ships as `@tomato/plugin-tomato-market`; the bundle a release before 0.2.2 mounted in the Desktop profile, `tomato-market`, was a separately packed plugin whose browser half could not load. Desktop rewrites a profile that still names the former bundle, and the former package stays retired.

</details>