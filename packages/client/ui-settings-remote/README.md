---
description: "Settings page that supervises the Desktop Host's phone tunnel and shows the pairing link and its QR code."
kind: "package-reference"
---

# @tomato/client-ui-settings-remote

English | [中文](README.zh.md)

## Summary

Open **Settings → Phone** in the Desktop app to start or stop the shell-managed Cloudflare quick tunnel that lets Tomato Remote on a phone reach this Host from another network. The page shows the tunnel phase, the tokenized pairing link, and a QR code of that link, with a copy action for pasting into the phone. A browser build explains that only the Desktop app can host the connection.

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

The page registers in every composition as the `remote` settings section. In the Desktop app, **Start tunnel** asks the shell to launch `cloudflared`, and the page follows the shell's state: `off`, `starting`, `online`, or `failed`. While online it shows the pairing link together with its QR code; the phone scans the code or receives the pasted link, and both carry the Host's current launch token. **Stop tunnel** ends the process. The shell restarts a tunnel that stops on its own, and quitting the app always stops it.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The page reads `window.tomatoDesktop.remote`, exposed by the Desktop preload: `status`, `start`, `stop`, and `subscribe`. It mirrors that bridge into one observable snapshot, which the renderer binds to the page's `useRemote` hook; the plugin's apply closure subscribes on the first reader so a page that never mounts costs no shell traffic. The shell owns the tunnel process, the launch token, and the QR encoding; the page only renders them. Outside the app frame the preload exposes no bridge, so the page reports that the connection must be hosted by the Desktop app.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [desktop](../../../apps/desktop/README.md#remote-access) — the `remote` settings, the tunnel supervisor, and the watchdog.
- [connection](../connection/README.md) — the `/api` browser-trust fence the tunnel hostname must satisfy.
- [ui-settings](../ui-settings/README.md) — the settings scope and the `settings.section` slot this page fills.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings page that registers no model input.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Desktop-only hosting** — a browser build cannot start the tunnel or mint a pairing link; the page explains this instead of degrading.
- **The link belongs to one process** — restarting the Host or the tunnel changes the hostname and the token, so an already-paired phone must read the new link unless its stored cookie still matches the new authority.
- **The setting is not editable from the page** — `remote.tunnel` decides whether the tunnel starts with the app; the page's buttons control only the running process.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The shell composes the pairing link as `https://<tunnel host>/` plus the query of the authenticated URL it already receives from the Host child, so no new token channel exists. The QR image is generated in the main process from the same string so the renderer never receives a second credential copy.

</details>
