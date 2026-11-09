---
description: "Windowed work recaps and proactive unfinished-task nudges over the Muse memory bundle: the Host service, its retention, the auxiliary model request, and the browser surfaces."
kind: "package-reference"
---

# @tomato/experimental-muse-insights

English | [中文](README.zh.md)

## Summary

Give a private windowed work recap and reminders of unfinished tasks across Sessions. The Host folds each run's new evidence into the day's retained recap, keeps the latest unfinished-task analysis in `tomato_muse_insights`, and exposes both through `ctx.remote.museInsights`. The Muse bundle mounts it beside memory and goal focus. The browser half adds recap notices, Sidebar recap and task views, a work-item detail page, a read-only **Memory** view of this Session's snapshots and passes, and the configure pages for the Muse bundle's rows. It writes no Session events and exposes no model tool.

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

The row needs `ctx.sessionQuery` with any query backend, `ctx.storageDomain`, and `ctx.llm`. The `todos` projection from `@tomato/tool-todo` supplies unfinished Session todos; the shipped agent presets mount it. The optional `timer` service drives summary runs: without it, the Host still answers `snapshot()` and runs a summary when the polling Client sees the day's recap older than the summary interval. A configuration write restarts the timer at the new cadence.

<a id="configuration"></a>
### Configuration

| Field | Default | Meaning |
|---|---|---|
| `recapNoticeMinutes` | `240` | Minutes between recap popups |
| `summaryIntervalMinutes` | `120` | Minutes between summary runs that fold new evidence into today's recap and refresh unfinished tasks |
| `initialDelaySeconds` | `5` | Delay before the first background run after activation or a cadence change |
| `lookbackDays` | `7` | Local days of Session creation and recaps retained as evidence |
| `maxSessions` | `20` | Sessions read per summary run, newest first |
| `maxMessageChars` | `700` | Characters kept from one message |
| `maxMessagesPerSession` | `24` | Messages retained per Session |
| `maxInputBytes` | `48000` | UTF-8 ceiling for the prepared recap input |
| `maxOutputTokens` | `4096` | Output-token cap for one recap request |
| `timeoutMs` | `60000` | End-to-end recap request deadline |
| `maxTasks` | `30` | Unfinished tasks retained per analysis |
| `maxRecapDays` | `30` | Retained local days of recaps per owner |
| `provider`, `model` | `blueai`, `DeepSeek-V4.1-Flash-1017` | Explicit recap route; the page offers the routes the Models page configures |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-muse-insights) is the exhaustive source for every accepted field. Every field is volatile: **Configure** on the row's page in Plugins edits them through the active profile's `cordis.patch.yml`, and the running service adopts the change without a remount — a changed cadence restarts only the background timers. The popup interval reaches the browser through each snapshot, so a save changes the notice cadence without a page reload.

The recap route defaults to the deployment's `blueai` gateway model. Both halves are required; the page blocks a save that would store only one. The provider and model selects list the providers and models declared in the `llm-pi-ai` settings section, and a stored route the section does not list stays selectable so a save never silently replaces it. A route the Host cannot serve degrades to the deterministic recap with a logged failure.

The browser half also registers the **Memory** conversation view: it derives rows from the Session's own event window, so it shows only what the Host logged, adds no Host endpoint, and needs no extra configuration.

The same browser half also pages the three sibling Muse bundle rows, which declare only a Config schema: `optional-memory` for stored and recalled records, `optional-tool-memory` for the snapshot, search expansion, and turn capture, and `optional-focus` for the repeated-failure reminders and the approval patterns. The memory tools' expansion route is chosen from the same configured providers and models; leaving both fields empty follows the calling agent's model. Each **Configure** page edits its own entry's settings namespace through the active profile's `cordis.patch.yml`; a row appears only while the Host serves that namespace, and a row whose key another registration already holds keeps that page. Every bound is validated by the plugin's own Config, so a value outside its range is refused by the Host rather than stored.

### What it reads

Each summary run reads only the day's evidence newer than the retained recap: the top-level Sessions created inside the lookback window, their own events (never a fork-inherited prefix), and the human and assistant text messages after the retained recap's latest source instant. The day's first run reads the whole day. Bounds apply to each run: `maxSessions`, `maxMessagesPerSession`, `maxMessageChars`, and `maxInputBytes`.

The bounded request carries the day's recap so far plus the new Sessions. The model returns the complete updated recap, so work items keep their wording across runs and their status changes when new messages settle them. The Host adds the new message count to the retained total, merges Session highlights by identity, and keeps the latest model exchange. Because each run sees only new evidence, a long day's input stays bounded instead of re-reading and truncating the whole day.

The unfinished-task analysis reads the `todos` projection of those Sessions: every `pending` and `in_progress` item becomes a task, and a `completed` item suppresses recap wording with the same normalized text. It also adds the latest recap's `openTasks` when that recap is inside the lookback window, so a model-stated follow-up survives even when no todo list names it.

### Owners and retention

Records belong to the signed-in account where `ctx.tomatoAccount` names one, and to `local` where the Host names no accounts. While nobody is signed in, `snapshot()` reports `available: false` and the Host neither reads nor writes insight records; the vocabulary matches [`@tomato/experimental-memory`](../memory/README.md).

One recap is retained per owner and local day; each run replaces that day's revision, and the last `maxRecapDays` days are pruned after each write. The store keeps format version 1, whose reader accepts both stored work-item forms: an older item's title becomes its problem and its detail becomes its solution, while a current item keeps its problem, conclusion, solution, and Sessions. One latest analysis is retained per owner. Deleting a stored record removes the recap or analysis; earlier browser notice state remains browser-local.

### Failures

A recap model call that fails, times out, or returns malformed JSON never replaces an existing recap for the same day; without an existing recap, the Host stores the deterministic recap and logs the failure. A missing route also produces the deterministic recap. A run with no new text writes nothing. A stored domain record whose key disagrees with its owner and day, or that fails its schema, rejects domain opening.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

The Host service opens one `tomato_muse_insights` domain (version 1, `single` layout, tables `recaps` and `analyses`) during activation and closes it after accepted runs settle. Background runs stop on fiber disposal; the same abort signal cancels corpus reads and the model stream, and stored writes follow the run's commit.

The auxiliary request keeps the model-visible input reconstructable even though the request belongs to no Session: the stored recap carries the exact system instruction, framed user input, output cap, route, and accepted response text. Because a run sends the day's prior recap and only the new Sessions, the stored input is the complete material the model saw for that revision. The browser receives only the Client-facing recap, the task list, and flags; it never receives those records.

| File | Owns |
|---|---|
| [`src/index.ts`](src/index.ts) | Remote service, policy validation, background cadence, owner resolution, retention, run serialization, and window merging |
| [`src/collect.ts`](src/collect.ts) | Bounded day-window and todo reads from `ctx.sessionQuery` |
| [`src/summarize.ts`](src/summarize.ts) | Prompt, prior-recap framing, input truncation, request execution, JSON parsing, and deterministic fallback |
| [`src/analyze.ts`](src/analyze.ts) | Task merge, deduplication, completed-item suppression, and ordering |
| [`src/domain.ts`](src/domain.ts) | Storage domain and record schemas |
| [`src/client/index.ts`](src/client/index.ts) | Remote mount, both page types, the frame-wide notice, and the route catalog |
| [`src/client/controller.ts`](src/client/controller.ts) | Snapshot polling, popup policy, explicit refresh, and Sidebar navigation |
| [`src/client/route-catalog.ts`](src/client/route-catalog.ts) | Provider and model choices read from the `llm-pi-ai` settings section |
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
- [Model selection](../../client/ui-model-selection/README.md) — the Models page that declares the routes this page offers
- [Typert Remote methods](../../typert/protocol/README.md) — the wire contract behind `ctx.remote.museInsights`

-----

<a id="model-experience"></a>
## Model Experience

### Auxiliary recap request

#### What the model sees

One auxiliary request per summary run that found new evidence. The system instruction defines the recap JSON object and how to fold new Sessions into the day's prior recap. The user message contains the bounded JSON of `previousRecap` (the day's current recap, absent on the first run) and `newSessions` (each with its id, title, and user and assistant text). Each returned work item names one problem, the conclusion it reached, how it was solved, and the Session ids it came from. The request names no tools and no Session identity beyond those ids.

#### Token effect

The input is capped by `maxInputBytes` after the new-Session messages and then the prior recap's work-item detail are trimmed. The output is capped by `maxOutputTokens`. The request is separate from every conversation request and adds no text to agent history or tool results.

#### KV Cache effect

No conversation prefix is invalidated. The auxiliary request is its own dispatch, so reuse depends on the provider's cache and on how much of the prior recap and new evidence stay identical between runs.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Deployment-specific default route** — the default `blueai` / `DeepSeek-V4.1-Flash-1017` pair assumes the deployment configures that gateway. A profile without it falls back to the deterministic recap until another route is selected.
- **One revision per day** — each run replaces today's recap; earlier revisions and their exact model exchanges are not retained.
- **Unchanged evidence, unchanged popup** — a popup interval repeats the latest recap even when no run added new evidence.
- **Created-Session window** — a long-running Session created before the lookback window contributes nothing, even when it was active today.
- **Text-only evidence** — tool calls, file diffs, and image content are not summarized; work visible only through those calls may be missed.
- **No conclusion without a model** — the deterministic recap names each Session's title and keeps its last message as the solution; it states no conclusion because nobody analyzed the Session.
- **No cross-device sync** — records live on one Host, and notice bookkeeping lives in one browser.
- **Not a Session-log record** — the auxiliary request is reconstructable from the stored recap, not from Session history or `sessionQuery`.
- **Wording-based suppression** — a completed todo suppresses a recap task only when their normalized text matches.
- **No model route discovery preflight** — an explicit route that the current Host cannot serve degrades to the deterministic recap and a logged failure.
- **Configure pages key off the bundle rows** — the pages register under `@tomato/experimental-muse-bundle#<row id>`, so a profile that mounts a row under another id edits its fields in `cordis.patch.yml` directly.
- **Row pages need the client half** — the memory, memory-tool, and goal-focus pages arrive with this browser half only; a profile that mounts those rows without the Muse bundle composes its own pages.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context — click to expand</summary>

None.

</details>