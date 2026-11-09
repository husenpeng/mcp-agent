---
description: "The Feishu gateway account provider that projects a verified browser session into the Host account service without exposing credentials."
kind: "package-reference"
---

# @tomato/account-gateway

English | [中文](README.zh.md)

## Summary

`@tomato/account-gateway` provides `ctx.account` from the local gateway's verified Feishu account. The gateway owns browser sign-in, the httpOnly session cookie, verification, and logout; this package only projects the resulting signed-in user into the Host account seam. It never stores or returns a model credential: `resolveToken` is always empty, so model requests continue to use the configured third-party API keys.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>

## Use this package

Mount it after `@tomato/gateway` in a browser-facing Host. It waits for `ctx.tomatoAccount`, so a Host without auth configuration keeps it inactive:

```yaml
- id: tomato-gateway
  name: '@tomato/gateway'
  config:
    authServiceUrl: https://auth.example
    companyWebUrl: https://company.example
    services: {}

- id: account-gateway
  name: '@tomato/account-gateway'
  config:
    usageUrl: https://example/usage
    topUpUrl: https://example/top-up
```

| Field | Default | Meaning |
|---|---|---|
| `usageUrl` | `''` | Usage destination shown by the account surface |
| `topUpUrl` | `''` | Top-up destination shown by the account surface |

`getState` returns `credential-stored` while the gateway reports a verified user, and `signed-out` otherwise. `getProfile` maps the gateway user ID, name, email, and avatar. `startSignIn` returns an attempt whose `authorizeUrl` is the gateway's `/api/auth/start` route, with `desktop=1` for the Desktop window. The provider marks the attempt succeeded when the gateway reports the user; it marks a waiting attempt failed when the gateway reports signed-out. `cancelSignIn` only changes this provider's attempt.

`watch` follows the gateway account state. A transition from signed-in to signed-out emits `account/signed-out`, which account-aware task cancellation consumes. `getDeviceIdentity` returns the installation's anonymous ID, the verified account ID when present, and the OS release. `getBalance` and `getUnnotifiedBonuses` return `null`; Feishu authentication does not provide Platform wallet or bonus data.

## Dev Note

The provider is deliberately a projection, not an authentication implementation. Feishu OAuth, PKCE state, session cookies, auth_service verification, and forwarding stay in `@tomato/gateway`; duplicating them here would create a second login authority and a second place to leak tokens. The account seam exists for Host consumers such as product analytics and future account-scoped features, not for browser login.

## Model Experience

None, as the provider only projects a verified browser session and never enters model prompts, Session logs, or tool results.

#### KV Cache effect

No model request prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No model credential** — Feishu auth_service authorizes the gateway session, not third-party model endpoints. A model route must use its own API key; `resolveToken` never returns a token.
- **Sign-out is browser-owned** — `signOut` clears only this provider's attempt and projected state; the gateway's `POST /api/auth/logout` clears the browser cookie. Account UIs that need remote logout call the gateway route.
- **No wallet or bonus projection** — `getBalance`, `getUnnotifiedBonuses`, and `ackBonusNotified` are intentionally empty; the seam keeps the methods for other deployments.
- **One account per Host** — like `ctx.tomatoAccount`, the projection follows the latest verified browser session.
- **Unknown before first verification** — the gateway reports `unknown` until it verifies a session or learns there is none; this provider treats it as signed-out for account state.

<a id="dev-note"></a>
