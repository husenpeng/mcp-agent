---
description: "Install Playwright MCP browser tools with a Chromium per session."
kind: "package-bundle"
---

# @tomato/experimental-browser-use-playwright-bundle

English | [中文](README.zh.md)

## Summary

Add Playwright MCP browser tools to a profile on demand. Each live session owns a separate Chromium launched by the provider; the bundle mounts the shared [browser-use service](../../browser-use/browser-use/README.md) and the [Playwright provider](../browser-use-playwright-mcp/README.md). It is an Official on-demand bundle: the installation lists it without shipping it, and turning it on installs the package and its Playwright runtime. The bundle is experimental and requires an existing Chromium build.

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

Open **Plugins**, find **Playwright browser** among the Official bundles, and turn it on. The Host installs `@tomato/experimental-browser-use-playwright-bundle` at the running installation's version and selects its layer; turning it off deselects the layer and keeps the dependency installed. A source checkout installs a `link:` dependency, and a published installation pins the release version.

The bundled Playwright version expects a Chromium build. Run `npx playwright install chromium` once on the machine, or replace the provider row through a profile patch and set `executablePath`. Without a browser, each new session fails its MCP startup and reports the provider's launch error.

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
- [On-demand discovery decision](../../../.agents/notes/implemented/architecture/2026-10-27-official-on-demand-playwright-bundle.md) — why the bundle installs on request.

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
- Chromium is not installed by the bundle; the first session fails until the browser exists.
- Browser profiles, cookies, and pages are not restored from the Session log; resume starts fresh browser state.
- `mode: attach` is exclusive to one session and is not offered by the switch.
- The system prompt's `toolOrder` must leave browser tools under `<unlisted-tools>`; naming them explicitly fails prompt assembly for sessions without a browser connection.

<a id="dev-note"></a>
### Dev Note

None.
