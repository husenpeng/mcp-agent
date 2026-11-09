# Agent Note: Long-term memory for Muse and Rbot

Status: proposed

English | [中文](2026-11-05-long-term-memory-for-muse-and-robots.zh.md)

## Problem

The Muse bundle owns personal facts and a daily recap, and Rbot owns versioned robots that run in their own Sessions. Both stop short of long-term memory in three ways.

**What is stored is only what someone stated.** [`@tomato/experimental-memory`](../../../../packages/experimental/memory/README.md) records a preference, constraint, decision, or fact when the model quotes the person's words, and keeps a candidate until a person confirms it ([ADR 0012](../../../../docs/tomato/adr/0012-memory-and-focus.md)). Post-turn capture reads the person's text of a finished turn and proposes up to three candidates ([turn-capture note](../../implemented/feature/2026-11-03-muse-turn-capture.md)); the project index lists the subjects the workspace already holds ([project-index note](../../implemented/feature/2026-11-03-muse-project-index.md)). None of them records what a session tried, which command failed, or which approach worked. [`@tomato/experimental-tool-memory`](../../../../packages/experimental/tool-memory/README.md) therefore injects a snapshot that cannot answer "what happened here before", and [`muse-insights`](../../../../packages/experimental/muse-insights/README.md) writes a recap that never flows back into memory.

**Retrieval is lexical and injection is not task-aware.** Search ranks by shared word segments, with an optional model query expansion ([ADR 0013](../../../../docs/tomato/adr/0013-memory-query-expansion.md)). Every first step of a turn injects the same snapshot: every profile record plus pinned workspace records. A long workspace accumulates more records than `maxSnapshotBytes` admits, so relevance never decides what reaches the model.

**Robots start cold and cannot share what they learn.** A robot specification already declares `memory.read`, `memory.write`, `memory.retentionDays`, and `memory.recall` ([spec types](../../../../packages/experimental/robot/src/types.ts)), but [`robot-runtime`](../../../../packages/experimental/robot-runtime/src/index.ts) injects only the `robot:mission` section and enforces none of the memory fields. Each run begins without earlier decisions, failures, or open tasks; two robots working the same task cannot read each other's findings; and a run's outcome is never written back. The in-progress crew packages already extract `DECISION:`, `CONSTRAINT:`, and `OPEN:` lines from a finished step and compose a bounded brief for each activation from a run-scoped flow ledger; that memory ends with the run, so the next crew or the next run of the same member starts from the mission again. The ["memory views are not implemented" limitation](../../../../packages/client/ui-robot/README.md) also leaves both pages without a browsing surface: facts are reachable only through `/memory` in a conversation.

The local `claude-mem` checkout (v15.9.0, commit `d8bf121ae`, [upstream](https://github.com/thedotmack/claude-mem)) shows the missing pipeline: capture tool use, compress it into structured observations, retrieve progressively (search, timeline, read), and inject a bounded history at session start. Its shape cannot be adopted as-is: it runs a separate Bun worker with its own model provider, keys data by device and project rather than account, stores vectors in Chroma, and keeps observer requests outside any session log. [ADR 0013](../../../../docs/tomato/adr/0013-memory-query-expansion.md) rejected embeddings and vector indexes for the record volume it sized; that rejection assumed facts only, and it does not settle whether session history is worth the cost.

## Proposal

Add one long-term-memory layer with four parts, used by both surfaces:

1. **Two record families, one read surface.** Explicit facts keep their current write rules and the existing turn capture. A new episodic family stores observations and session summaries produced by episode capture. One service returns both.
2. **A native episode pipeline.** Capture, compression, retrieval, and injection run in the Host process, use `ctx.llm` with plugin records, are off by default, and are bounded per Session.
3. **Namespaced scopes and a frozen run brief.** Robot runs read granted namespaces, write back candidates at finalize, and share a team namespace; the spec's memory fields become enforced.
4. **Two page surfaces over one client package.** The Muse page gains a memory view, and the Rbot page gains a memory mode plus a run-memory trace.

### Records, scopes, and write policy

| Family | Kinds | Scope | Writer | Activation |
|---|---|---|---|---|
| Fact | `preference`, `constraint`, `decision`, `fact` | `profile`, `workspace` | Model tool with the person's quote | Active on quote match, otherwise candidate |
| Fact | `decision`, `constraint`, `fact` | `robot:<id>`, `team:<id>`, `task:<id>` | Robot tools and run writeback | Active with source; `constraint` stays candidate outside `task` |
| Episode | `observation`, `summary` | `project`, `robot:<id>`, `team:<id>`, `task:<id>` | Capture pipeline | Active after compression; review gate optional |

- Every record keeps its owner (account where the Host names one, otherwise the local owner), its scope, its source (Session, message, tool call, run), a content fingerprint, and an optional expiry.
- Episodes add the fields `type`, `title`, `subtitle`, `narrative`, `facts`, `concepts`, `filesRead`, `filesModified`, and the tool name.
- Facts keep `entity`/`key` uniqueness and replace-on-write semantics. Episodes dedupe by fingerprint and are append-only. A promoted episode is a fact written with the episode id as its source; promotion is explicit.
- Retention is per scope and comes from configuration; expired episodes are pruned on the same schedule as recap pruning.
- Facts stay in the `tomato_memory` domain. Episodes go to a new `tomato_memory_episodes` domain, so retention, deletion, and format changes never touch explicit memory. The service composes one view over both.

### Episode capture and compression

- Episode capture is a separate pipeline from the implemented fact capture. `capture` keeps reading only the person's text and keeps its quote gate; `episodeCapture`, also off by default, reads tool activity. Neither pipeline writes the other's family: fact capture writes candidates, episode capture writes episodes, and only an explicit promotion turns one into the other.
- `tools/post-execute` observes top-level, successful, state-changing tools (`edit`, `write`, `bash`, task tools) and skips read-only tools, subagent Sessions, and calls whose input carries a private-marker tag. `agent/turn-stopping` enqueues one summary for the finished turn.
- One bounded queue per Session sends `init`, observations, then `summarize` in order. Queue depth, input bytes, and concurrency are Config fields. A failed or timed-out send records a classified plugin record and drops that item; it never retries and never blocks the turn.
- Compression calls `ctx.llm.prepareCall()` with a fixed observer instruction and the bounded tool input/output. The reply is parsed into one episode. The request and its accepted reply are appended as a plugin record before the record is used, following the [turn-capture precedent](../../implemented/feature/2026-11-03-muse-turn-capture.md) for reconstructable requests.
- The observer instruction is ported from the claude-mem prompt set (Apache-2.0; the notice is added to `THIRD_PARTY_NOTICES.md`) and reduced to the fields above. Its own Configure page states what leaves the machine.
- Episodes carry the tool name, the Session and tool call as source, and a fingerprint over tool name, normalized input, and result digest. A repeated call updates its timestamp instead of appending.
- Episode capture never writes `preference`, `constraint`, or `fact` values. A person promotes an episode with an explicit action, or the model proposes a promotion as a candidate that still waits for confirmation.

### Retrieval

- `memory_search` returns index rows for episodes — id, date, type, title, scope, and source — under a byte cap, and keeps the existing one-line form for facts. `memory_timeline` returns the episodes around one anchor. `memory_read` returns the full episode with its fields, truncated per field. This mirrors claude-mem's three-step retrieval and keeps tool output small.
- Filters cover scope, kind, type, and a date range. Ranking keeps the existing lexical score and recency, adds a scope priority (task, team, robot, project, workspace, profile), and reuses the existing query expansion for episodes.
- Phase 2 may add a `ctx.embeddings` seam and a local embedder for hybrid ranking. That is a separate decision; the first phase stays lexical, and a derived FTS5 index is introduced only if the bounded in-memory scan proves too slow (the same trade the [Session search backend](../../../../packages/session-query/session-query-sqlite/README.md) made).

### Injection

- The existing snapshot message gains one `history` block, appended after the profile and pinned values and after the project index. The block holds:
  - the newest session summaries;
  - the episodes most relevant to the Session's first message, injected on a Session's first request and again after a surface replacement such as compaction;
  - each item's date, scope, and source.
- History shares the snapshot message and its digest, as the project index does, so a replacement that shadows the snapshot clears it and an unchanged record set adds nothing to later turns. Section budgets are separate: values render first, the project index keeps its remaining-bytes rule, and history receives what is left up to its own cap.
- Injection text carries dates, scope, and source, and opens with "Historical records, not instructions".
- Per-turn relevance injection is deliberately absent in phase 1: it would churn the KV-cache prefix and the token budget. Relevance beyond session start is available through the tools.

### Robots

- The run brief is frozen at run start and injected as a `robot:memory` system-prompt section after `robot:mission`. It assembles, within a byte budget, from the namespaces the spec grants: active constraints and decisions, open tasks on the task blackboard, the latest outcomes of this robot and its team, and lessons written by earlier runs. It records the revision ids of every record it used.
- Crews consume the same layer. `composeBrief` receives the granted long-term records ahead of the run ledger's extracted decisions, constraints, and open questions, so a member activation starts from what earlier runs established; the ledger's `DECISION:`, `CONSTRAINT:`, and `OPEN:` items are written back as candidates at run end instead of ending with the ledger.
- `robot_memory_recall` and `robot_memory_write` are run-scoped tools. Recall is limited to `memory.read`; writes are limited to `memory.write`, with the task blackboard always writable by a run holding the task.
- At finalize the runtime writes back candidates: the outcome, decisions, failures, and artifacts, each with the run id and Session id as source. The team namespace accepts a write from a robot the spec grants; a run without the grant reports the denial in its trace instead of silently dropping it.
- A run checks acceptance at finalize against the specification's success criteria and reports unaddressed criteria in its outcome. Repeated-failure reminders continue to come from [`@tomato/experimental-focus`](../../../../packages/experimental/focus/README.md); the brief adds earlier lessons to them.
- Multi-robot reuse in phase 1 is shared storage on one Host: the team namespace and task blackboard are the channel. A2A envelopes carry memory references later, when the transport exists; no message copying of record values is introduced now.
- The run trace lists injected records, records recalled during the run, and writeback candidates with their revision ids. The frozen brief and a later recall can disagree; the trace labels which revision each request used.

### Packages and seams

| Package | Role |
|---|---|
| `@tomato/memory-core` (new) | Record, scope, and namespace types; ranking; rendering; byte budgets; dedupe; promotion rules. No I/O. |
| `@tomato/experimental-memory` | Provider over both domains: owners, scopes, write policy, snapshot, search, related, duplicates, stats. |
| `@tomato/experimental-memory-capture` (new) | Event capture, queue, observer request, parsing, fingerprint dedupe. |
| `@tomato/experimental-tool-memory` | Fact tools, `/memory`, snapshot injection; adds search, timeline, read, and promote for episodes. |
| `@tomato/experimental-robot-memory` (new) | Robot namespace policy, run brief assembly, writeback, finalize acceptance check; consumes `ctx.memory` and hooks `robot-runtime`. |
| `@tomato/experimental-robot-crew` / `-local` | Consume the layer: long-term records feed `composeBrief`, and extracted step memory is written back at run end. |
| `@tomato/api-memory-controller` (new) | `memory` Remote namespace: list, search, detail, confirm, pin, forget, promote. |
| `@tomato/client-ui-memory` (new) | Shared list, filters, detail, and actions used by both pages. |
| `@tomato/experimental-muse-insights` | Mounts the memory view in the Muse page; adds the recap-to-candidates action. |
| `@tomato/client-ui-robot` | Adds the memory mode and the run-memory trace to the Rbot page. |

- `ctx.memory` stays the single capability. `robot-memory` is a policy and assembly layer over it, not a second store. This supersedes decision 4 of the [robot platform note](../architecture/2026-10-29-robot-platform-product-architecture.md): its concern was write semantics, and a per-scope writer policy plus a separate episodes domain addresses that without splitting the read surface or duplicating ranking and rendering.
- No package imports a concrete provider across a seam. Capture and robot memory depend on the service, not on the storage implementation.

### Muse page

The current page is one right-Sidebar tab with a two-option `SegmentedControl` for the recap and unfinished-task views ([`InsightsTab`](../../../../packages/experimental/muse-insights/src/client/InsightsTab.tsx)). It gains a third option, `记忆`, and the tab keeps its refresh action.

- Toolbar: the view switch, a search field, a scope filter, and refresh. Search runs on submit; the filter is a menu of `全部`, `画像`, `本项目`, `历史`, `待确认`.
- Body sections, in order: `待确认` with confirm and ignore actions; `我的画像`; `本项目`; `项目历史` grouped by local day; `已过期`, collapsed and read-only.
- A row shows the type mark, title, scope, source, and age. Picking one opens a detail tab beside the page, following the existing work-item detail pattern, which keeps the list scrolled in place.
- The detail tab shows the narrative, facts, concepts, files, source Session link, revision, and actions: confirm, pin or unpin, forget, and promote an episode to a fact.
- The recap view adds one action, `生成候选记忆`, which reads the stored recap and proposes facts and tasks as candidates. Nothing is promoted without a person's confirmation.
- States match the existing page: signed out, loading, error with retry, empty per section, and a capture-off notice in the history section that links to the Configure page.
- Copy names what capture records and where it goes; the Configure page carries the on/off switch and the byte and retention bounds.

### Rbot page

The current detail area switches between the run conversation, the gallery, and the specification editor, with the run rail on the left ([`RobotPage`](../../../../packages/client/ui-robot/src/client/RobotPage.tsx)). The robot header gains a two-option control, `运行` and `记忆`, shown only when a robot is selected. The rail keeps listing runs in both modes. The crew studio's flow ledger gains the same memory section beside its run entries.

- Memory mode shows namespace chips for `本机器人`, `团队`, `任务`, and `个人`, a search field, a candidate-only filter, and a record list. A record row shows its type, title, source run or Session, and age; selecting it opens a detail pane in the same area with the same actions as the Muse detail.
- The run detail gains a collapsible `本次运行记忆` section listing injected records, recalled records, and writeback candidates with revision ids. A failed namespace grant appears there as a denial, not as an empty list.
- The specification editor's memory block becomes functional: namespace pickers backed by the registry, a recall-mode picker (`none`, `keyword`, and later `hybrid`), and a retention field. Publishing validates that every read or write namespace exists; a run whose grant fails does not silently start without memory.
- Both pages mount `@tomato/client-ui-memory`, so row, detail, filter, and action behavior do not diverge.

### Delivery phases

- **Phase 1** (two weeks): `memory-core`, the episodes domain, capture and compression with plugin records, search/timeline/read tools, the composed snapshot with the history section, the Muse memory view, and the Remote namespace.
- **Phase 2** (two to three weeks): robot namespaces and spec enforcement, the frozen run brief, recall and write tools, writeback, the finalize acceptance check, the run-memory trace, and the Rbot memory mode.
- **Phase 3** (optional): the `ctx.embeddings` seam and a local embedder for hybrid ranking; team memory over A2A references once the transport exists; recap-driven candidate generation tuned against real recaps.

## Alternatives considered

**Keep claude-mem as a sidecar provider** — rejected for the product path. It keeps a Bun worker, its own provider and API keys, device-level project keys, and Chroma outside the Host; the two pages would then read records through a second service with no account isolation, and capture would remain invisible to the Session log. It remains a one-week pilot option to measure observation quality.

**Add more lexical facts only, without episodes** — rejected. It cannot answer what a session tried or which approach failed, leaves the recap one-way, and keeps robot runs cold. The record model is not the bottleneck; the missing pipeline is.

**Give robots their own service and store** — the earlier robot note's decision. Rejected now because cross-robot reuse and one page need one read model; a per-scope write policy preserves the original concern, and an episodes domain keeps retention and deletion separate. Two stores would duplicate ranking, rendering, budgets, and the client.

**Use Chroma as the vector store** — rejected. It adds a second process, a data lifecycle, and a protocol surface ([claude-mem's own architecture](https://github.com/thedotmack/claude-mem) needs an MCP manager for it). A derived SQLite FTS5 index plus optional in-process embeddings covers the bounded corpus, and keeps keyless replay working.

**Inject history on every turn** — rejected for phase 1. It churns the KV-cache prefix and spends tokens on records the turn may not need. Session-start injection plus tools keeps the prefix stable; per-turn relevance can be added behind a Config switch if evidence supports it.

**Automatically write facts from capture** — rejected. It would break the quote-confirmation rule of [ADR 0012](../../../../docs/tomato/adr/0012-memory-and-focus.md) and turn the observer's guesses into standing constraints. Automation is confined to episodes and candidates.

## Acceptance criteria

- The Muse memory view lists facts and episodes, filters by scope and candidate state, opens a detail tab, and confirms, pins, forgets, or promotes a record. Signed out, it shows the same denial the other Muse views show.
- A Session's first request injects the history section within its byte budget; a later search and read retrieves an episode from an earlier Session, with its source and date.
- Capture is off by default. When on, each observer request appears as a plugin record before its result is used; no turn waits on capture; a timeout or failure is visible in the record and in the Configure page status.
- A robot run's first request carries the `robot:memory` section built from granted namespaces; the run trace lists the revision ids of injected, recalled, and written records. A second run of the same robot, and a peer robot holding the same team grant, read a decision written by the first.
- A crew run places long-term records ahead of its ledger memory in every member brief, and its extracted decisions and constraints appear as candidates in the team namespace after the run.
- A read or write outside the grant is denied, and the denial appears in the run trace. Expired records stop being recalled and disappear from both pages.
- Keyless recorded-session snapshots cover the episode tools, the composed snapshot with its history section, and the run brief where the robot bundle joins a snapshot profile; any new message source updates both SDK projections. The Muse bundle's composition test and browser tests cover the injection and the two pages, as they do for the existing recap and capture rows.
- Every bound is a Config field with a Configure page; no constant in the plugins decides a deployment-varying value.

## Risks

- **Memory poisoning and stale constraints.** An observer or a robot can record a wrong lesson that later runs treat as guidance. Every record carries a source and a confidence, constraints outside the task blackboard stay candidates, and the pages expose forget and expiry. The brief labels each record with its revision.
- **Cost and token growth.** Capture adds one model call per captured tool batch and one per turn; history injection spends part of every first request. Both are off or bounded by Config, and the trace reports bytes and calls.
- **Privacy.** The observer reads tool input and output, which can contain credentials or customer data. Capture skips private-marker input, truncates fields, defaults off, documents the provider route, and prefers a local route; the Configure page states that capture sends data to a model.
- **ADR conflict.** [ADR 0012](../../../../docs/tomato/adr/0012-memory-and-focus.md) rejected per-turn background extraction, and [ADR 0013](../../../../docs/tomato/adr/0013-memory-query-expansion.md) rejected embeddings. This proposal narrows the first to opt-in episodic capture with logged requests and confines facts to the existing rule; embedding work stays a separate, later decision.
- **Record volume.** Episodes grow with tool use. Retention, per-scope caps, and dedupe bound the store; a derived FTS5 index is the next step if the in-memory scan exceeds its budget.
- **Robot behavior change.** Enabling memory changes a run's prompt prefix and invalidates its cache once per revision; existing robots with empty namespaces keep today's behavior. Publishing a spec with a namespace that does not exist fails instead of starting a run without memory.
- **Traceability.** A frozen brief and a later recall can disagree. The trace labels the revision each request used, and the brief records ids rather than copied text.
- **Two memory paths in a crew.** The run ledger and the long-term layer both carry decisions and constraints. The brief orders long-term records first and labels each source; the ledger remains the run-scoped record, so a member never reads the same item twice without a source.
- **Page scope.** Two surfaces over one client package add shared state and test matrix; the alternative (two independent views) would drift in behavior and vocabulary.