# Agent Note: Ship Playwright browser tools as an on-demand Official bundle

Status: implemented

English | [中文](2026-10-27-official-on-demand-playwright-bundle.zh.md)

## Problem

The Playwright MCP provider works but is unreachable from the product: a profile must name the service and the provider by hand, so the Plugins page neither lists nor installs it. Shipping it with every installation is also unsuitable, because the provider pulls a Playwright runtime and expects a Chromium build that most installations never use.

## Decision

`ON_DEMAND_BUNDLES` admits `@deepseek-ai/dsh-experimental-browser-use-playwright-bundle` to the Official catalog. The bundle is installed only when a person turns it on in Plugins; the catalog entry carries package-owned localized metadata and the icon, so discovery works offline. Source installations link the checkout package, and published installations pin the running DSH version, as the [on-demand decision](2026-10-05-official-on-demand-bundles.md) describes.

The bundle patch inserts the shared `dsh-browser-use` service and one Playwright provider with `mode: launch` and `headless: true`. A Session created after activation owns an isolated Chromium; turning the bundle off deselects its layer, and Remove stays separate. The switch exposes no configuration form: visible-browser and attach modes remain explicit profile compositions, consistent with the [optional-bundle admission decision](2026-09-21-experimental-capabilities-as-optional-bundles.md), which keeps external browser providers out of the installation-carried list.

The bundle does not install a browser build. Providers start Playwright's Chromium from the Playwright cache or an explicit `executablePath`, and the package README names the first-use installation step. The provider remains the sole browser-use registrant; a second provider fails activation.

## Alternatives considered

**Ship the bundle with every installation (`OPTIONAL_BUNDLES`).** The switch would work offline, but every installation would carry the Playwright runtime and browser expectations for a capability most people never enable; the optional-bundle decision already excludes external browser providers for this cost.

**Add each browser provider as its own on-demand bundle.** A Chrome DevTools or Stagehand bundle would duplicate catalog, metadata, and patch maintenance before a product request exists; only Playwright was requested, and later providers can follow the same mechanism.

**Keep manual profile patches and document them.** Installation cost stays zero, but the provider remains undiscoverable in the Plugins page and every profile repeats package names, versions, and patch text.

**Automate the Chromium download during activation.** Running Playwright's installer from a bundle switch adds a network download and a second failure surface, while the pinned Playwright version owns which build is required; the README states the command instead.

## Consequences

Discovery and installation need no package resolution; the first activation needs a registry or a prepared checkout, plus an existing Chromium build. Profiles that never enable the bundle pay nothing. The fixed launch and headless configuration is the usable default; visible or attached browsers require a profile patch. Browser state stays Session-scoped and is not restored from the log. The patch composition test and the catalog projection test cover admission, row order, fixed configuration, and offline metadata.
