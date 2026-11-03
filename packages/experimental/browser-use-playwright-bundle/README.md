---
description: "Install Playwright MCP browser tools with a Chromium per session."
kind: "package-bundle"
---

# @tomato/experimental-browser-use-playwright-bundle

English | [中文](README.zh.md)

## Summary

Add Playwright MCP browser tools to a Web or Desktop profile. Each live session owns a separate Chromium launched by the provider; the bundle mounts the shared [browser-use service](../../browser-use/browser-use/README.md) and the [Playwright provider](../browser-use-playwright-mcp/README.md). It is a shipped Official bundle that the Web profile selects by default: the installation carries the package and its Playwright runtime, new Web and Desktop profiles start with the layer, and switching it off only deselects the layer. The bundle is experimental. Desktop installers carry the Chromium headless shell; other deployments expect an existing Chromium build.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

New Web and Desktop profiles start with **Playwright browser** selected; **Plugins** switches it off and back on. Turning it off deselects the layer and keeps the dependency installed, because the installation ships it as a runtime dependency. `DEFAULT_ENABLED_OPTIONAL_BUNDLES` records that default selection, and another profile selects the bundle by name through `tomato plugin`.

Desktop installers place the Playwright headless shell in `runtime/playwright-browsers` and set `PLAYWRIGHT_BROWSERS_PATH` for the Host; an inherited value wins. Deployments without that registry, such as `tomato web` or a custom profile, fall back to Playwright's own cache: run `npx playwright install chromium` once on the machine, or replace the provider row through a profile patch and set `executablePath`. Without a browser, each new session fails its MCP startup and reports the provider's launch error.

The bundle fixes `mode: launch` and `headless: true`. To run a visible browser or attach to an existing one, keep this bundle off and mount the provider in a profile patch with `mode: attach` and `endpoint`, or with `headless: false`; see the [provider configuration](../browser-use-playwright-mcp/README.md#use-this-package). Only one browser-use provider can be registered: activating this bundle beside another provider fails with the registered provider's name.

Sessions created after activation initialize their MCP client; active sessions do not adopt the browser. Restart or create a session after enabling the bundle.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The patch inserts the service and a launch provider row with `headless: true`. [Browser use](../../../docs/subsystems/browser-use.md) owns provider selection, Session ownership, and MCP initialization; the [provider](../browser-use-playwright-mcp/README.md) owns the pinned upstream server, tool schemas, and browser behavior. Disposing the provider stops tool admission, closes launched browsers, and releases the registration.

-----

<a id="further-exploration"></a>
## Further Exploration

- [Browser use](../../../docs/subsystems/browser-use.md) — provider selection and Session ownership.
- [Playwright MCP provider](../browser-use-playwright-mcp/README.md) — launch, attach, and timeout configuration.
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) — upstream browser behavior and browser installation.
- [Default-on bundle decision](../../../docs/tomato/adr/0016-default-playwright-bundle.md) — why the bundle ships and starts selected.

-----

<a id="model-experience"></a>
## Model Experience

### Browser tools and screenshots

#### What the model sees

Sessions receive the upstream Playwright MCP tools under `mcp__playwright-mcp__<tool>` names. Page snapshots are text; screenshots are images that follow the normal attachment and presentation rules. Tool calls share the session's MCP client and queue.

#### Token effect

Activation adds the Playwright tool schemas to new sessions' requests. Deactivation stops tool admission and closes the provider's browsers; sessions themselves stay intact.

#### KV Cache effect

Enabling or disabling the bundle changes the tool list of new sessions, invalidating their cached request prefix once.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- No configuration page: launch, headless, attach, executable discovery, and timeouts are fixed by the bundle row or a profile patch.
- Desktop installers ship the headless shell only; a visible browser or `mode: attach` needs a profile patch, and non-Desktop deployments still require a local Chromium build.
- Browser profiles, cookies, and pages are not restored from the Session log; resume starts fresh browser state.
- `mode: attach` is exclusive to one session and is not offered by the switch.
- The system prompt's `toolOrder` must leave browser tools under `<unlisted-tools>`; naming them explicitly fails prompt assembly for sessions without a browser connection.

<a id="dev-note"></a>
### Dev Note

None.
