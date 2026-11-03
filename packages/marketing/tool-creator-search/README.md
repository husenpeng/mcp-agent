---
description: "Model-facing creator search tools over the company BFF: creator_search, creator_detail, and youtube_channel, authenticated by the Desktop session cookie and bounded by one documented request budget."
kind: "package-reference"
---

# @tomato/tool-creator-search

English | [中文](README.zh.md)

## Summary

`@tomato/tool-creator-search` gives the model creator scouting over the company BFF's `/api/v1/creator-search/*` endpoints. `creator_scout` turns a brief into a bounded multi-strategy search, merges and enriches what it finds, and returns a shortlist ranked against the brief with the evidence behind each creator. `creator_feedback` remembers accept, reject, and watch decisions so later runs honor them. The lower-level `creator_search`, `creator_detail`, and `youtube_channel` tools expose the single-point capabilities directly. The BFF owns the upstream credentials; this package owns the brief gate, search ladder, scoring, request budgets, and feedback store.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the package in a preset whose agent should reach the company BFF, with `TOMATO_SEARCH_GATEWAY_URL` (or `TOMATO_WEB_URL`) naming the origin. The shipped Web `standard` and `cordis` presets mount it; `minimal` does not.

### When to choose it

Choose this package when an agent works on creator discovery or creator vetting: it can search a niche by keyword, read one creator in full, and check a YouTube channel's public BrandConnect data. A profile without a signed-in Desktop shell keeps the tools visible and answers every call with sign-in guidance, because the BFF derives the caller's identity from that session.

### Minimal configuration

```yaml
- id: tool-creator-search
  name: '@tomato/tool-creator-search'
  config:
    timeoutMs: 60000
```

| Field | Default | Meaning |
|---|---|---|
| `baseURL` | `$TOMATO_SEARCH_GATEWAY_URL`, then `$TOMATO_WEB_URL` | BFF origin; an empty value leaves every call reporting that the origin is unconfigured |
| `timeoutMs` | `60000` | End-to-end budget for one request (ms), attached to each tool definition |
| `maxOutputChars` | `20000` | Cap on the complete rendered text of one call, in characters |
| `search` | `true` | Register `creator_search` |
| `detail` | `true` | Register `creator_detail` |
| `channel` | `true` | Register `youtube_channel` |
| `scout` | `true` | Register `creator_scout` |
| `feedback` | `true` | Register `creator_feedback` |
| `ingest` | `true` | Register `creator_ingest` for creators found outside the index |
| `scoutTimeoutMs` | `300000` | Budget for one multi-request scout call |
| `defaultFollowersMin` / `defaultFollowersMax` | `10000` / `200000` | Follower band a brief falls back to |
| `defaultMinEngagementRate` | `0.01` | Engagement floor a brief falls back to |
| `defaultTargetCount` | `10` | Creators a brief asks for when it states none |
| `depthFast` / `depthStandard` / `depthBroad` | built-in budgets | Per-depth `maxSearchCalls`, `pagesPerQuery`, `pageSize`, `enrichLimit`, `poolFactor` |
| `querySuffixes` | `[]` | Suffix phrases only the `broad` policy appends |
| `queryPolicy` | `balanced` | `strict` searches only the stated keywords, `balanced` recombines stated fields, `broad` may append `querySuffixes` |
| `feedbackBoost` | `10` | Score points a remembered acceptance adds |
| `weightFollowers` … `weightContactability` | `25/25/20/15/10/5` | Score weights; at least one must be above zero |
| `contactEnrichment` | `true` | Crawl the web for shortlisted creators whose email the index lacks |
| `contactLimit` | `5` | Most shortlisted creators one call crawls |
| `contactQueriesPerCreator` | `2` | Search requests one creator's crawl may spend |
| `contactFetchesPerCreator` | `2` | Page reads one creator's crawl may spend |
| `contactTimeoutMs` | `20000` | Budget for one creator's crawl |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatotool-creator-search) is the exhaustive source for every accepted field and its JSDoc.

### The three tools

- `creator_scout(brief, depth?)` enforces the brief (category, platforms, market), plans a bounded ladder of keyword, variant, wider-page, and relaxed runs under the stated query policy, deduplicates across platforms, enriches the strongest candidates, and returns a ranked shortlist. It returns questions instead of searching when an essential field is missing, and it never spends quota on that path.
- When the index states no email for a shortlisted creator, `creator_scout` searches and reads the creator's pages through the web tools' provider seam and takes the first plausible business email, recording the page and read time on the candidate. A profile without a web provider leaves the email unknown and says so in `caveats`.
- `creator_scout` also reports a hard call budget (`stats.budget`) and, when the pool stays short, an `escalation` block naming the phrases to take to `web_search`/`web_fetch`; `creator_ingest(brief, entries)` then scores those crawled creators through the same gates, weights, and remembered decisions.
- `creator_feedback(entries, client?)` records decisions in the plugin's durable storage domain: an accepted creator ranks higher next time, a rejected one is excluded with its reason, and omitting entries lists what is remembered.
- `creator_search(platform, query, page?, pageSize?)` spends one unit of the team's monthly group-API quota and returns the BFF's `{items, task_status?, pager?}` payload.
- `creator_detail(platform, creatorId)` spends one unit and returns one creator's group-API detail object.
- `youtube_channel(channel, languageCode?)` reads YCP public channel data and spends no group-API quota.

Each tool returns the canonical value `{source, traceId, data, quota?}`: `data` is the BFF payload with its upstream field names (snake_case for Blue, camelCase for YCP), `traceId` quotes the BFF trace for support, and `quota` is the monthly snapshot Blue endpoints report.

<a id="understand-the-implementation"></a>
## Understand the implementation

### Source map

| File | Owns |
|---|---|
| [`src/index.ts`](src/index.ts) | Plugin name, injection, config schema, origin resolution, and the Desktop-session read |
| [`src/bff.ts`](src/bff.ts) | Endpoint paths, the session cookie, fetch with `redirect: "error"`, the request budget, and the error mapping |
| [`src/tools.ts`](src/tools.ts) | Tool schemas, the BFF's input limits, rendered text, and pending-call titles |
| [`src/types.ts`](src/types.ts) | Envelope and quota types; no runtime code |

### Request and failure behavior

Every request carries `cookie: session_id=<desktop session>` and refuses redirects, so the session cookie cannot follow a redirected response to another origin. A caller cancellation aborts the request; the deployed `timeoutMs` bounds it otherwise.

| BFF answer | Tool failure | Retried by the tool |
|---|---|---|
| 401 / `UNAUTHENTICATED` | Ask the user to sign in again; no request is repeated | No |
| 429 / `BLUE_QUOTA_EXCEEDED` | Report the spent monthly quota and the last snapshot the BFF reported | No |
| 429 / `UPSTREAM_RATE_LIMITED`, 502, 504, timeouts, unreachable BFF | Report a transient failure and tell the model the identical request is worth retrying | No — the model decides whether to spend another quota unit |
| 400 / other 4xx | Report the BFF message and trace | No |
| 200 without a readable `{data, meta}` envelope | Report an unreadable response | No |

The tool never retries a request on its own: one Blue search can spend 45 seconds polling its upstream task, so a second attempt inside the same call would exceed any reasonable budget and would spend another quota unit without the caller's consent.

<a id="model-experience"></a>
## Model Experience

### Tool schemas

#### What the model sees

The model sees the generated [`creator_search`, `creator_detail`, and `youtube_channel` schemas](../../../docs/tool-catalog.md#tomatotool-creator-search). Limits the schema DSL cannot express — 1–200 characters for `query` and `creatorId`, 1–100,000 for `page`, 1–50 for `pageSize`, 2–20 for `languageCode`, and the channel form — are validated inside `execute`, so an invalid call fails with a model-readable message before any request reaches the BFF. Each tool supplies `presentCall`, so a pending card names the operation and its target; no `presentResult` is declared, and the completed call renders the generic card from the returned content.

#### Token effect

Each tool definition contributes one schema and one description to the request's tool block; the descriptions stay at three sentences. Results are compact JSON and are capped at `maxOutputChars` per call, so a large search page cannot flood the context: the cap cuts the payload and appends a truncation notice naming the deployed limit.

#### KV Cache effect

Tool definitions and the system prompt are stable for the life of the plugin, so the prompt prefix stays cacheable across turns. A result's content depends only on the BFF answer; the quota snapshot inside it changes the result text, not the prompt prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Scores rank evidence, not fit.** A candidate's score normalizes over the signals the BFF actually returned; coverage and status say how much of the brief each score rests on. A missing country, engagement, or email lowers coverage instead of being guessed.
- **Feedback is host-wide, not account-scoped.** Records live in the plugin's storage domain under the harness home; a record without a client applies to every client on that host, and deployments sharing one host profile share the store.
- **No lookalike expansion from a seed creator.** The two BFF detail endpoints do not expose similar creators, so discovery stays keyword, paging, and platform driven.
- **No filter vocabulary.** The Blue search endpoint accepts an upstream `filters` object, but its accepted keys are undocumented, so the tool exposes keywords and paging only. Exposing filters needs a documented key set first.
- **No automatic retry.** The tool reports transient failures instead of retrying, because a retry could double a 45-second upstream chain and the quota it spends. Deployments that want retries can add them around `tools/execute`.
- **Quota snapshot staleness.** A 429 quota answer carries no snapshot of its own, so the reported numbers come from the last successful Blue answer in this process, and they stay stale until the next success. The BFF counter itself resets monthly and is per process.
- **No custom Web card.** A dedicated card for creator results would need a Client presenter over persisted result metadata; the generic card currently shows the rendered text.
- **Blue detail `task_status`.** The BFF answers 504 `UPSTREAM_TIMEOUT` while the upstream detail task is still processing; the tool reports that transient failure rather than polling.

<a id="dev-note"></a>
### Dev Note

None.
