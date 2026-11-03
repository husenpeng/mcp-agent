# Agent Note: Ship the Playwright browser bundle switched on

Status: implemented

English | [中文](2026-11-03-default-playwright-bundle.zh.md)

## Problem

Product users need browser tools the moment they open the application: marketing workflows inspect pages, sign-in-protected screens, and screenshots. The [on-demand delivery decision](2026-10-27-official-on-demand-playwright-bundle.md) made the bundle discoverable but left three steps between a person and a working browser — install the bundle, prepare a Chromium build, restart the Session. Offline or unqualified machines reported a provider launch failure instead of a working browser.

## Decision

The Playwright bundle is now shipped and on by default for the Web and Desktop profile. `@tomato/experimental-browser-use-playwright-bundle` stays in `OPTIONAL_BUNDLES`, becomes a runtime dependency of `@tomato/cli`, and joins `PROFILE_TEMPLATES.web.bundles`. The `desktop` profile initializes from the Web template, so Desktop and `tomato web` start new profiles with the browser layer selected; the Plugins page still switches it off, which deselects the layer and keeps the dependency. The bundle leaves `ON_DEMAND_BUNDLES`, so the offline catalog no longer advertises an installation step.

`DEFAULT_ENABLED_OPTIONAL_BUNDLES` names the shipped optional bundles a template may select. It is the declared exception in `verify-default-product-isolation`: only the named bundle and its declared runtime dependency closure may compose into the default product and the Web layers; an experimental row the bundle mounts without declaring that dependency still fails the check. The prior rule — an optional bundle is never a template layer — remains for every other entry, so shipping a bundle stays separate from switching it on.

Desktop packaging downloads Chromium itself. `prepare:playwright-browsers` runs the Playwright CLI resolved through the provider's `@playwright/mcp` dependency, installs `chromium --only-shell` into the shared build cache, and copies the complete installation to `runtime/playwright-browsers`. The Host receives `PLAYWRIGHT_BROWSERS_PATH` for that registry unless the launch environment already set it. macOS signing covers the registry's Mach-O files before the application is signed, with the JIT entitlement on `chrome-headless-shell`; electron-builder ignores the directory, and the packaged smoke runs `chrome-headless-shell --version`.

Only the Web template changes. `headless`, `sdk`, and `acp` profiles keep their compositions, and existing profiles keep their selection because a template applies when a profile is first created.

## Alternatives considered

**Download Chromium on first use instead of packaging it.** The installation stays small, but every machine pays a network download inside a Session, and failure appears as a broken browser tool. Packaging keeps first launch offline.

**Ship full Chromium rather than the headless shell.** The bundle fixes `headless: true`, so the visible browser and its larger signing surface serve no shipped configuration. Visible and attached browsers remain profile-patch configurations.

**Promote both packages out of experimental.** That removes the isolation exception but renames packages, moves directories, snapshots, and release-family entries. Delivery form and maturity are separate decisions; this note changes only the first.

## Consequences

Installers grow by one headless shell (about 200 MB unpacked on macOS arm64). A new Web or Desktop profile initializes the provider on its first Session, so browser tool schemas join that request's prefix; switching the bundle off returns later Sessions to the previous tool list. Chromium follows the pinned Playwright version, so a provider upgrade requires a new build to replace the shipped registry. `tomato web` deployments outside Desktop carry no registry and keep using the machine's Playwright cache or `executablePath`. Chromium remains unavailable on machines without the prepared runtime until the bundle is off or a browser is supplied.