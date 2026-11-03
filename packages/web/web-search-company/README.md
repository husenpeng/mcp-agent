---
description: "The company-gateway search provider: how the Host searches through the company BFF with the signed-in desktop session, and what the seam still owns."
kind: "package-reference"
---

# @tomato/web-search-company

English | [中文](README.zh.md)

## Summary

Use this package to let `ctx.web.search()` reach the company gateway. The gateway holds the search vendor and its credential, so this deployment needs no vendor key: the provider sends the query and the desktop's auth session to `POST /api/v1/search/web` and maps the gateway's normalized results to the seam's sources. It is the shipped search backend for deployments whose chat route is a third-party API that cannot carry a provider-side search tool.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Mount it beside `@tomato/web` and give it the gateway origin:

```yaml
- name: '@tomato/web'
- name: '@tomato/web-search-company'
  config:
    baseURL: https://test.tomatoai.vip
```

| Field | Default | Meaning |
|---|---|---|
| `baseURL` | `$TOMATO_SEARCH_GATEWAY_URL` | Gateway origin; `/api/v1/search/web` is appended. Empty keeps the provider unavailable. |
| `timeoutMs` | 45000 | End-to-end budget for one request, above the gateway's 40s upstream budget. |
| `maxResults` | (unset) | Default bound when a request carries none, from 1 through 20; a larger request bound is capped and reported as truncated. |
| `maxCharsPerResult` | 500 | Per-result excerpt budget forwarded as `maxCharsPerResult`; the gateway clamps to its own ceiling. |
| `maxChars` | 3000 | Total excerpt budget forwarded as `maxChars`; the gateway clamps to its own ceiling. |

The provider authenticates with the session the Desktop shell publishes to the Host (`ctx.desktopSession`), and its `ready()` reports whether one is present. A signed-out or session-less profile is therefore not ready: a model step neither declares nor dispatches `web_search`, while a call made outside a step fails with `WEB_PROVIDER_CREDENTIAL_MISSING`.

<a id="understand-the-implementation"></a>
## Understand the implementation

`search()` posts `{query, maxResults?, maxCharsPerResult?, maxChars?}` with a `session_id` cookie and refuses HTTP redirects, so the session never follows a redirect to another origin. The query must be 1–400 characters; a longer one is rejected before dispatch. The gateway answers `{data:{results:[…], truncated, answer?}, meta:{traceId, schemaVersion, budget}}` or `{error:{code,message,retryable}, meta:{traceId}}`.

Mapping: `url` is required (an entry without one is dropped), `title`, `snippet`, and `publishedAt` are copied when non-empty, `answer` becomes the result's `content`, and `truncated` carries the gateway's result-count flag; `@tomato/web` still enforces the request's own `maxResults` on top of it. A failure message keeps the gateway text, adds a retry hint when the gateway marks it retryable, and names the trace id when one is returned.

| Gateway response | Provider outcome |
|---|---|
| 200 | normalized sources, carrying the gateway's `truncated` flag |
| 400 `INVALID_QUERY` / `INVALID_MAX_RESULTS` / `INVALID_BODY` | `WEB_PROVIDER_ERROR` with the gateway's actionable message |
| 401 `UNAUTHENTICATED` | `WEB_PROVIDER_CREDENTIAL_MISSING` (sign in again) |
| 429 `RATE_LIMITED` | `WEB_PROVIDER_RATE_LIMITED` (retry later) |
| 502 `UPSTREAM_UNAVAILABLE` | `WEB_PROVIDER_ERROR` (retry later) |
| 503 `SEARCH_DISABLED` | `WEB_SEARCH_DISABLED` (the deployment disabled search) |
| 504 `UPSTREAM_TIMEOUT` | `WEB_PROVIDER_TIMEOUT` (retry later) |
| other non-2xx | `WEB_PROVIDER_ERROR` carrying the gateway message |
| abort | `WEB_ABORTED` |

<a id="model-experience"></a>
## Model Experience

Indirectly, through `@tomato/tool-web`, which renders this provider's URLs, titles, snippets, and optional answer, and bounds the complete text at `searchMaxOutputChars`. A missing session, a rate-limited upstream, a disabled endpoint, or a gateway failure reaches the model as the structured error message above; the provider adds no prompt text.

#### KV Cache effect

No direct invalidation; the named consumer owns any request-prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The provider is only as available as the company gateway; there is no vendor fallback inside this package.
- Per-user quota, usage accounting, and abuse limits belong to the gateway, not here.
- A session that expires mid-run fails the search until the user signs in again.

<a id="dev-note"></a>
### Dev Note

The default 45-second budget sits deliberately above the gateway's own 40-second tavily→google fallback chain, so a slow but successful search is not aborted before the gateway answers. `timeoutMs` bounds the whole gateway request, not the model tool budget, which `@tomato/tool-web` owns. `search()` never follows a redirect because the request carries the user's `session_id` cookie.
