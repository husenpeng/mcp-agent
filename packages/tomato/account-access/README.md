---
description: "Feishu account access settings section showing verified roles and numeric quotas from the local gateway session."
kind: "package-reference"
---
# Account Access

English | [中文](README.zh.md)

## Summary

`@tomato/client-ui-account-access` adds an **Access** settings section beside the existing Feishu account page. It reads `/api/auth/session` and renders the `roles` and `quotas` fields that auth_service verifies for the signed-in user. It does not perform login, logout, or credential handling; `@tomato/account` and `@tomato/gateway` own those.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the package in the browser assembly after the locale and settings shell; it registers `settings.section` with id `account-access` and requires no configuration. The section shows loading, signed-out, unavailable, roles, and quota states. A missing `roles` or `quotas` field renders as an empty list rather than an error.

<a id="model-experience"></a>
## Model Experience

None, as account credentials affect HTTP authentication and never enter model prompts, Session logs, or tool results.

#### KV Cache effect

No model request prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Read-only projection** — the section displays roles and quotas; enforcement happens in Host policy and is not configured here.
- **Session fetch per mount** — the section reads the gateway route when opened and does not poll; a role change appears on the next open or focus refresh.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The Host half is empty on purpose: the package ships through `exports["./client"]` and registers one `settings.section` row at order -9. The gateway auth session verifies roles and quotas, so the page never stores or edits them.

</details>
