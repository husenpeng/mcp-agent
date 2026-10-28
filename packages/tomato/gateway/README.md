---
description: "Tomato's same-origin local gateway: auth_service session routes, a fixed service forwarding table, and verified-user injection."
kind: "package-reference"
---

# @tomato/gateway

English | [中文](README.zh.md)

## Summary

`@tomato/gateway` mounts in the dsh Web Host beside Connection's `/api` prefix. It gives the browser a same-origin `/api/auth/*` surface for Feishu login, session projection, and logout, and a fixed-table `/api/services/<service>/*` forwarder for company services. Every protected request is verified with auth_service and carries the verified user id; the browser never supplies a target host. Host RPC, model requests, tool egress, and OTLP telemetry stay outside this package.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>

## Use this package

Mount it in a browser-facing Host with `webServer` and `connection` available:

```yaml
- id: tomato-gateway
  name: '@tomato/gateway'
  config:
    authServiceUrl: http://127.0.0.1:8003
    companyWebUrl: https://test.tomatoai.vip
    services:
      demo:
        baseURL: http://127.0.0.1:8010
        userIdInjection: query
```

| Field | Default | Meaning |
|---|---|---|
| `authServiceUrl` | `''` | auth_service base URL; empty keeps login unavailable |
| `companyWebUrl` | `''` | Company BFF base URL; empty keeps login unavailable |
| `services` | `{}` | Fixed table keyed by the URL's service segment; each entry needs `baseURL` |
| `verifyTimeoutMs` | `2000` | Session-verification timeout |
| `requestTimeoutMs` | `30000` | Upstream request timeout |
| `maxRequestBodyBytes` | `10485760` | Buffered-body cap for body injection |
| `stateTtlMs` | `600000` | Login-attempt lifetime |

The browser routes are `/api/auth/start`, `/api/auth/callback`, `/api/auth/session`, `POST /api/auth/logout`, and `/api/services/<service>/<path>`. Auth routes are owner-only through Connection admission; `/api/auth/callback` is exempt because the BFF redirects to it without a Host session, and its state/verifier/code pair is the authority. The `auth` service is not a table entry and `/api/services/auth/*` returns 404.

Forwarding preserves methods, query, JSON, SSE, multipart, and binary bodies; it refuses upstream redirects and strips browser cookies, authorization, forwarded-address headers, and identity headers before adding `X-Tomato-User-Id`. When an entry declares `userIdInjection`, the gateway overwrites that query or JSON-body field with the verified user id.

## Model Experience

None, as the package only carries browser authentication and service forwarding; model requests remain between the Host and the configured provider.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Server handoff is not implemented here** — auth_service mint/redeem and the BFF `clientState`/`returnTo` extension are external contracts; until they ship, login reports unavailable and no mock fallback exists.
- **HTTP only** — WebSocket forwarding to business services is unsupported; Connection's own `/api/remote.mux` stays direct.
- **No response-size cap on streaming** — buffered body injection is bounded, but streamed responses rely on upstream and client backpressure.
- **Identity injection buffers JSON** — body injection reads the whole request up to the cap; multipart identity injection is unsupported.
- **Auth routes bypass the Connection request waterfall** — exact Web routes are registered on the Host webserver, so the Desktop install lock does not cover them.

<a id="dev-note"></a>

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The gateway uses Host webserver exact/prefix routes because Connection's exact Fetch registry supports only GET, HEAD, and POST and has no prefix match; the admission call is still Connection's own trust and browser-auth check.

</details>