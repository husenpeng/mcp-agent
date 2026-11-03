---
description: "Daily work recaps and proactive unfinished-task nudges over the Muse memory bundle: the Host service, its retention, the auxiliary model request, and the browser surfaces."
kind: "package-reference"
---

# @tomato/experimental-muse-insights

English | [中文](README.zh.md)

## Summary

Give the person a private daily work recap and periodic reminders of unfinished tasks across Sessions. The Host service reads the day's top-level conversations and the `todos` projection, stores one retained recap per owner and local day plus the latest analysis in `tomato_muse_insights`, and exposes both through `ctx.remote.museInsights`. The Muse bundle mounts it beside memory and goal focus. The browser half adds a frame-wide notice, a Sidebar page with recap and unfinished-task views, and a work-item detail page. It writes no Session events and exposes no model tool.

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

Switch on **Memory and goal focus** in Plugins. The Muse bundle adds the Host row `optional-muse-insights` and loads this package's browser half through the same row. A profile may instead name `@tomato/experimental-muse-insights` directly.

The row needs `ctx.sessionQuery` with any query backend, `ctx.storageDomain`, and `ctx.llm`. The `todos` projection from `@tomato/tool-todo` supplies unfinished Session todos; the shipped agent presets mount it. The optional `timer` service drives background runs: without it, the Host still answers `snapshot()` and runs both generators on `refresh()`.

<a id="configuration"></a>
### Configuration

| Field | Default | Meaning |
|---|---|---|
| `recapIntervalMinutes` | `30` | Minutes between daily-recap attempts |
| `taskIntervalMinutes` | `15` | Minutes between unfinished-task analyses |
| `initialDelaySeconds` | `5` | Delay before the first background attempt |
| `lookbackDays` | `7` | Local days of Session creation and recaps retained as evidence |
| `maxSessions` | `20` | Sessions read per recap or analysis, newest first |
| `maxMessageChars` | `700` | Characters kept from one message |
| `maxMessagesPerSession` | `24` | Messages retained per Session |
| `maxInputBytes` | `48000` | UTF-8 ceiling for the prepared recap input |
| `maxOutputTokens` | `800` | Output-token cap for one recap request |
| `timeoutMs` | `60000` | End-to-end recap request deadline |
| `maxTasks` | `30` | Unfinished tasks retained per analysis |
| `maxRecapDays` | `30` | Retained local days of recaps per owner |
| `provider`, `model` | absent | Explicit recap route; both or neither, otherwise the latest Session request route |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-muse-insights) is the exhaustive source for every accepted field.

### What it reads

A daily recap covers top-level Sessions created inside the lookback window. From each Session it reads its own events only (never a fork-inherited prefix), keeps direct human messages and assistant text inside the Host-local day, and bounds the result by `maxSessions`, `maxMessagesPerSession`, and `maxMessageChars`. It captures the latest `request/header` route among those Sessions when the deployment names none. Subagent Sessions and fork seeds contribute no text.

The unfinished-task analysis reads the `todos` projection of those Sessions: every `pending` and `in_progress` item becomes a task, and a `completed` item suppresses recap wording with the same normalized text. It also adds the latest recap's `openTasks` when that recap is inside the lookback window, so a model-stated follow-up survives even when no todo list names it.

### Owners and retention

Records belong to the signed-in account where `ctx.tomatoAccount` names one, and to `local` where the Host names no accounts. While nobody is signed in, `snapshot()` reports `available: false` and the Host neither reads nor writes insight records; the vocabulary matches [`@tomato/experimental-memory`](../memory/README.md).

One recap is retained per owner and local day, and the last `maxRecapDays` days are pruned after each write. One latest analysis is retained per owner. Deleting a stored record removes the recap or analysis; earlier browser notice state remains browser-local.

### Failures

A recap model call that fails, times out, or returns malformed JSON never replaces an existing recap for the same day; without an existing recap, the Host stores the deterministic Session-based recap and logs the failure. A missing route also produces the deterministic recap. A stored domain record whose key disagrees with its owner and day, or that fails its schema, rejects domain opening.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

The Host service opens one `tomato_muse_insights` domain (version 1, `single` layout, tables `recaps` and `analyses`) during activation and closes it after accepted runs settle. Background runs stop on fiber disposal; the same abort signal cancels corpus reads and the model stream, and stored writes follow the run's commit.

The auxiliary request keeps the model-visible input reconstructable even though the request belongs to no Session: the stored recap carries the exact system instruction, framed user input, output cap, route, and accepted response text. The browser receives only the Client-facing recap, the task list, and flags; it never receives those records.

| File | Owns |
|---|---|
| [`src/index.ts`](src/index.ts) | Remote service, policy validation, background cadence, owner resolution, retention, and run serialization |
| [`src/collect.ts`](src/collect.ts) | Bounded day and todo reads from `ctx.sessionQuery` |
| [`src/summarize.ts`](src/summarize.ts) | Prompt, input truncation, request execution, JSON parsing, and deterministic fallback |
| [`src/analyze.ts`](src/analyze.ts) | Task merge, deduplication, completed-item suppression, and ordering |
| [`src/domain.ts`](src/domain.ts) | Storage domain and record schemas |
| [`src/client/index.ts`](src/client/index.ts) | Remote mount, both page types, and frame-wide notice |
| [`src/client/controller.ts`](src/client/controller.ts) | Snapshot polling, notice policy, explicit refresh, and Sidebar navigation |
| [`src/client/WorkItemTab.tsx`](src/client/WorkItemTab.tsx) | One work item's detail page and the recap lookup that keeps it current |
| [`src/client/work-item-bindings.ts`](src/client/work-item-bindings.ts) | The item each detail page showed, so a reloaded tab names the same one |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Memory service](../memory/README.md) — the owner vocabulary and the profile and workspace records this capability complements
- [Memory and goal focus bundle](../muse-bundle/README.md) — the shipped switch that mounts this row
- [Session query](../../session-query/session-query/README.md) — live-preferred reads, observations, and projections
- [Session projection](../../session/session-projection/README.md) — the `todos` value read by the analysis
- [Todo tool](../../todo/tool-todo/README.md) — how the model writes the task list
- [Typert Remote methods](../../typert/protocol/README.md) — the wire contract behind `ctx.remote.museInsights`

-----

<a id="model-experience"></a>
## Model Experience

### Auxiliary daily-recap request

#### What the model sees

One auxiliary request per accepted recap generation. The system instruction defines the recap JSON object; the user message contains the framed, bounded JSON of the day's Session titles and user and assistant text. The request names no tools and no Session identity.

#### Token effect

The input is capped by `maxInputBytes`; the output by `maxOutputTokens`. The request is separate from every conversation request and adds no text to agent history or tool results.

#### KV Cache effect

No conversation prefix is invalidated. The auxiliary request is its own dispatch, so reuse depends on the provider's cache and on how much of the bounded input stays identical between generations.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Created-Session window** — a long-running Session created before the lookback window contributes nothing, even when it was active today.
- **Text-only evidence** — tool calls, file diffs, and image content are not summarized; work visible only through those calls may be missed.
- **No cross-device sync** — records live on one Host, and notice bookkeeping lives in one browser.
- **Not a Session-log record** — the auxiliary request is reconstructable from the stored recap, not from Session history or `sessionQuery`.
- **Wording-based suppression** — a completed todo suppresses a recap task only when their normalized text matches.
- **No model route discovery preflight** — an explicit route that the current Host cannot serve degrades to the deterministic recap and a logged failure.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context — click to expand</summary>

None.

</details>