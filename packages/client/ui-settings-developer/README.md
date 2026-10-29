---
description: "The development-only Settings page that records this page's gateway exchanges and shows the client composition."
kind: "package-reference"
---

# @tomato/client-ui-settings-developer

English | [中文](README.zh.md)

## Summary

Open **Settings → Developer** in the unpackaged desktop development build to turn on gateway recording and inspect this page's unary RPC exchanges, connection stream frames, and client composition. The switch is volatile: it never writes the profile, and the page does not register at all in a packaged build.

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

The page appears only when the desktop bridge reports `tomatoDesktop.development`, which the unpackaged launcher sets. **Record gateway calls** attaches an observer to `ctx.connection`; while it is off, no observation runs. **Gateway calls** lists each completed unary RPC with its endpoint and duration, each WebSocket frame with its direction, and keeps the complete request, response, or frame payload behind the row. **Clear** drops the retained list. **Page information** refreshes release identity, module and plugin row counts, connection state, the active panel, the session count, and the live Slot tree. Turning the switch on also opens a floating panel at the frame's bottom-right, so the log stays visible after Settings closes; closing that panel turns recording off.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host half registers a volatile `enabled` field in the `ui-settings-developer` namespace through `ctx.settings.configure({ auto: false })`, so no settings page is generated and the value never reaches a profile patch. The browser half reads it through `ctx.configForms.get(NS)` and derives a boolean snapshot. `ctx.connection.observe` delivers one observation per completed RPC and per socket frame; the page keeps the newest 2000 in a `createSnapshotStore` flushed once per animation frame and counts the dropped older ones. Page facts are read on demand through `readPageInfo`, which takes the boot manifest, connection state, layout panel, session list, and `ctx.slots.snapshot()`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-settings](../ui-settings/README.md) — the settings scope and configuration forms the switch writes through.
- [connection](../connection/README.md) — the transport that supplies `ctx.connection.observe`.
- [modules](../modules/README.md) — the boot manifest the page reports.
- [ui-layout](../ui-layout/README.md) — the panel selection the page reports.
- [slots](../../../docs/subsystems/slots.md) — the Slot tree the page renders.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side diagnostics surface that registers no model input.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Observations cover this page's transport only** — the list holds unary RPC and connection socket traffic; non-RPC fetches and other clients on the same Host stay in DevTools.
- **The retained list is bounded by count** — the newest 2000 observations are kept and the page reports how many older ones were dropped; payloads are not redacted because the page exists only in development builds.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The development flag rides `tomatoDesktop.development` (set from `TOMATO_DESKTOP_DEV_APP` by `scripts/dev.ts`), not `app.isPackaged`, so even an unpackaged release artifact never shows the page.

</details>
