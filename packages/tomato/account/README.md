---
description: "Tomato's sidebar account launcher and Account settings page over the local gateway's auth_service session."
kind: "package-reference"
---

# @tomato/account

English | [中文](README.zh.md)

## Summary

`@tomato/account` is the browser-side account surface. It keeps one React-free snapshot over the local gateway's `/api/auth/session` route and registers a sidebar launcher plus an Account settings section. The page shows signed-in, signed-out, and sign-in-service-unavailable states; it offers sign-in, sign-out, retry, and no profile editing. Web opens the gateway login in a popup; Desktop calls the `dshDesktop.account` preload bridge so the main process owns the isolated window and the stored session.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>

## Use this package

Mount it in the browser roster after `ui-settings` and `locale`. It registers two slots:

| Slot | Surface |
|---|---|
| `settings.launcher` | Sidebar account entry and menu |
| `settings.section` | Account page inside Settings |

The client service keeps `loading`, `signed-in`, `signed-out`, and `unavailable` states. It reads the gateway on mount, on window focus, and after the login popup posts `tomato-auth-result`; it never polls. Sign-out calls `POST /api/auth/logout` on Web or the Desktop bridge, then refreshes the projection. A remote revoke that auth_service does not confirm becomes a dismissible notice.

The renderer never receives the session id: Web keeps it in the httpOnly `tomato_session` cookie, and Desktop stores it in `safeStorage` behind the main process.

## Model Experience

None, as the package only presents account state and issues browser authentication commands.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Read-only profile** — the page shows the auth_service `name`, `email`, and `avatarUrl`; it does not call `PATCH /profile`.
- **No server-side session cache** — every read hits `/api/auth/session`; a slow auth_service delays the launcher.
- **Avatar loads from its provider URL** — there is no image proxy; a blocked avatar falls back to an initial.
- **Extra locales are English placeholders** — the package ships complete keys, but only `en` and `zh` carry reviewed copy.

<a id="dev-note"></a>

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The Desktop bridge is optional: a page without `dshDesktop.account` uses the same-origin popup path. The two paths share the controller and slot components, so only the sign-in and sign-out commands branch.

</details>