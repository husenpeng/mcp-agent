---
description: "Crew vocabulary, A2A envelope, loop guard, and execution-time memory briefs for multi-agent Rbot work."
kind: "package-reference"
---
# Robot Crew

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-crew` owns the vocabulary and pure policy of a crew: a versioned acyclic graph of agent members, the `tomato-a2a/1` envelope agents exchange, one loop guard per run, and the extraction that turns a finished step into decisions, constraints, and open questions. It holds no transport or execution; `@tomato/experimental-robot-crew-local` provides both.

A crew specification names its mission, success criteria, stop conditions, members, handoffs, loop limits, memory budget, A2A admission, and workspace. Every run carries a durable flow ledger: the complete process memory that each next member reads only through a bounded brief.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Use the specification helpers (`emptyCrewSpec`, `starterCrewSpec`, `validateCrewSpec`, `topologicalOrder`), the A2A protocol (`createEnvelope`, `a2aSignature`, `normalizeA2aText`), the loop guard (`CrewLoopGuard`), the memory functions (`extractMemory`, `composeBrief`), and the long-task memory functions (`carryTaskMemory`, `carriedCount`, `renderProjectHistory`). The `Crews` service definition is the seam the provider implements; mount it through `@tomato/experimental-robot-crew-local`.

### Loop protection

`CrewLoopGuard` counts activations, delivered A2A messages, approximate tokens, and wall clock. It refuses self messages, unknown peers, out-of-scope peers, unaccepted intents, forwarding depth over `maxHops`, repeated signatures over `maxDuplicates`, and further messages over `maxMessages`. `recordStep` trips `no-progress` when the last `noProgressWindow` outputs are at least 85% word-identical and longer than an acknowledgement. The first trip wins and later reads report it.

### Execution memory

Each finished step writes `DECISION:`, `CONSTRAINT:`, `OPEN:`, or `ARTIFACT:` marker lines. `extractMemory` reads them (English and Chinese markers), deduplicates case-insensitively, and bounds each item. `composeBrief` always restates the mission, success criteria, stop conditions, and the member's own task; decisions, constraints, upstream results, peer replies, open questions, and guard notes fill the remaining character budget in priority order.

### Long-task memory

`carryTaskMemory(runs, limits)` reads back the memory entries members wrote in the same crew's finished runs, newest first, deduplicated, capped per kind at `maxItems` across at most `maxRuns` runs, and returns three short lists. The provider calls it before each run and seeds that run's flow memory, so the first brief already carries the earlier decisions and constraints instead of starting cold from the mission. `carriedCount` reports the total.

`renderProjectHistory(items, budgetChars)` renders the project records of the deployment's long-term memory as dated lines behind a fixed "records, not instructions" heading, bounded by a character budget; it returns `undefined` when no record fits.

## Model Experience

### Member brief and output contract

#### What the model sees

Every member agent receives a system-prompt brief carrying the mission, success criteria, stop conditions, its role and task, previously extracted memory (including decisions and constraints carried from earlier runs), upstream results, peer replies, and guard notes; when the deployment mounts long-term memory, a project-history block follows the brief. A fixed output-contract section asks it to finish with `DECISION:`, `CONSTRAINT:`, or `OPEN:` lines.

#### Token effect

Capped by `memory.briefChars` (default 6000 characters) per activation; earlier sections win a tight budget. Carried memory and run-extracted memory share that budget; project history is a separate block the provider bounds at 2000 characters.

#### KV Cache effect

Independent per activation and per member; the brief changes only when the run's extracted memory or upstream results change.

## Known Limitations and Deferred Work

- **No cross-process A2A transport** — envelopes are delivered in process by the local provider; an HTTP agent-card and JSON-RPC carrier are deferred.
- **Deterministic memory extraction** — markers are parsed without a summarization model; prose without markers contributes only its summary.
- **Acyclic graphs only** — the validator rejects cycles; bounded revisits are not part of the current contract.
- **Carried items come from marker lines only** — a long-term conclusion a member never wrote as `DECISION:`, `CONSTRAINT:`, or `OPEN:` is not carried.
- **Carrying is bounded** — the provider reads the last 5 finished runs and keeps 12 items per kind, so older decisions slide out of the window.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

This package owns the pure vocabulary — spec validation, A2A envelopes, loop guard, and memory extraction — and mounts no provider. Transport, persistence, and execution belong to `@tomato/experimental-robot-crew-local`, so these functions stay testable without a storage domain.

</details>
