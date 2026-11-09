---
description: "The company-gateway fetch provider: how the Host retrieves pages through the company BFF with the signed-in desktop session, and what the seam still owns."
kind: "package-reference"
---

# @tomato/web-fetch-company

English | [中文](README.zh.md)

## Summary

Use this package to let `ctx.web.fetch()` reach the company gateway. The gateway owns the fetch vendors (firecrawl scrape, tavily extract) and their credentials, so this deployment needs no vendor key: the provider sends the URL plus the desktop's auth session to `POST /api/v1/fetch/web` and maps the gateway's extracted body to the seam's result. It is the fetch counterpart of `@tomato/web-search-company` for deployments where model-facing pages must be retrieved server-side rather than from the user's own network.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

Mount it beside `@tomato/web` and give it the gateway origin:

```yaml
- name: '@tomato/web'
  config:
    fetchProvider: company
- name: '@tomato/web-fetch-company'
  config:
    baseURL: https://test.tomatoai.vip
```

`baseURL` falls back to `$TOMATO_SEARCH_GATEWAY_URL`, the origin the search provider already reads.

The seam pins exactly one fetch provider and never falls back between providers. Registering this provider beside `@tomato/web-fetch-http` without pinning `fetchProvider` fails the next fetch with `WEB_PROVIDER_AMBIGUOUS`, so a profile either keeps the local provider or switches to this one.

The Desktop shell publishes the auth session; without one, `ready()` is false, a model step neither declares nor dispatches `web_fetch`, and a direct call fails with `WEB_PROVIDER_CREDENTIAL_MISSING`.

<a id="understand-the-implementation"></a>
## Understand the implementation

The provider posts `{url}` with the `session_id` cookie to `POST /api/v1/fetch/web` and maps `data` to `WebFetchResult`: `text` becomes the `text` body arm, `truncated` passes through, and `statusCode` is forwarded as sent. Redirects are never followed, because the request carries a credential.

The gateway answers the company `{data, meta}` / `{error}` envelope. A 401 or `UNAUTHENTICATED` becomes `WEB_PROVIDER_CREDENTIAL_MISSING`; `RATE_LIMITED`, `UPSTREAM_TIMEOUT`, `INVALID_URL`, and `FETCH_DISABLED` map to their seam codes. The configured `timeoutMs` defaults to 50 seconds, above the gateway's own 45-second budget (a firecrawl 202 poll chain plus a tavily fallback), so a slow but successful fetch is not aborted early.

<a id="model-experience"></a>
## Model Experience

### Page retrieval

#### What the model sees

`@tomato/tool-web` renders this provider's extracted page text with the `Fetched <url> (HTTP <status>)` header and the truncation footer when the gateway capped the body. A signed-out session, a rate-limited upstream, a disabled endpoint, or a gateway failure reaches the model as the structured error message above; the provider adds no prompt text and no vendor name.

#### Token effect

The returned body is the gateway's extracted markdown or plain text, capped by the BFF before it leaves the service, so token cost follows the extracted page rather than the raw HTML the local provider would convert.

#### KV Cache effect

No direct invalidation; the named consumer owns any request-prefix changes. A provider that stops being ready leaves the declared tool set, which invalidates that request prefix once.

## Known Limitations and Deferred Work

- **Status code fidelity.** `WebFetchResult.statusCode` has no "unknown" arm. The gateway marks its tavily fallback as `statusCodeSource: 'assumed'` and fills 200, but the seam has no field to carry that distinction, so the rendered header cannot tell an observed response from an assumed one.
- **No page title.** The gateway returns one; the seam has nowhere to put it.
- **No per-request extraction controls.** `WebFetchRequest` carries only a URL, so the gateway decides extraction depth and the character cap.
- **Cost guard.** Firecrawl bills per page. Search and fetch share one gateway allowance, so the BFF counts both in one process-wide UTC-day bucket (`BLUE_GATEWAY_BUDGET_ENABLED`, `BLUE_GATEWAY_DAILY_QUOTA`, default 500) and answers 429 `GATEWAY_QUOTA_EXCEEDED` before reaching a vendor; the count resets on restart and is not shared across replicas, so the vendor's own quota stays the final limit.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Base compositions pin `fetchProvider: http`, so enabling this provider is a composition decision rather than a dependency change. The gateway counts search and fetch in one daily budget, which means this provider shares the search provider's allowance.

</details>
