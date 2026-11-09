---
description: "Storage-backed crew provider and orchestrator: one Agent per member, a durable flow ledger, A2A delivery, and loop protection."
kind: "package-reference"
---
# Robot Crew Local

English | [中文](README.zh.md)

## Summary

`@tomato/experimental-robot-crew-local` implements the `ctx.crews` service over a `tomato_crew` storage domain and executes accepted runs on the Host. Each member activation creates one Agent in its own Session, composes a bounded brief from the run's extracted memory, records brief, step start, step result, memory, handoff, A2A, guard, and run-end entries into the flow ledger, and settles the run as `succeeded`, `failed`, `tripped`, or `cancelled`.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it after a storage backend and `@tomato/storage-domain`, with an Agent registry and a default model:

```yaml
- name: '@tomato/experimental-robot-crew-local'
```

Publication validates the complete specification and stores an immutable revision. `start` accepts a run for a published revision and returns immediately; execution continues on the Host. `append` records one ledger entry under the provider's sequence, `entries` returns them in order, and `cancel` aborts the live Agent. A non-terminal run found at startup is settled as failed, because its Agents cannot survive a process restart.

Each member may borrow a published robot's capability specification; the provider resolves that revision before the Agent is created and applies its tool restriction, skill selection, permission preset, and mission. Members can ask peers for work inside a turn through the `crew_a2a_send` tool, which routes the envelope through the same loop guard and returns the peer's answer synchronously.

Before `start` executes, the provider reads the flow ledgers of the same crew's last 5 finished runs and seeds the new run's memory with the members' `DECISION:`, `CONSTRAINT:`, and `OPEN:` entries, newest first, deduplicated, capped at 12 items per kind. It records one `data.carried` ledger entry, so the first brief of every run carries the earlier decisions instead of starting cold; conclusions older than the window are not carried.

With `@tomato/experimental-memory` mounted, the provider also renders the project history into a `crew:memory` system-prompt section through `accessFor(cwd)` and `history()` (at most 2000 characters), and writes one `crew-run` summary episode after a successful run, sourced to that run. A failed read or write only records a `drift` ledger entry and never changes the run's terminal state.

## Model Experience

### Member brief and A2A tool

#### What the model sees

The system prompt carries the member brief produced by `composeBrief`, including memory carried from earlier runs. When long-term memory is mounted, each member's prompt also holds a `crew:memory` project-history block. Every non-observer member also receives `crew_a2a_send` with `to`, `intent`, `task`, and `context` parameters; its result is the peer's bounded answer or a localized loop-guard refusal.

#### Token effect

One brief up to `memory.briefChars`; the project-history block adds at most 2000 characters. Each A2A request adds one peer brief and one answer, both charged against the run's token budget.

#### KV Cache effect

Independent per activation; the system-prompt brief is stable for one member's turn.

## Known Limitations and Deferred Work

- **Sequential graph execution** — members run in topological order; independent branches do not execute concurrently.
- **In-process A2A only** — peer calls run in the same Host and cannot target another process or organization.
- **No run resume** — a Host restart settles unfinished runs as failed instead of rebuilding their Agents.
- **The carry window is fixed** — the last 5 runs and 12 items per kind; project-memory write-back is one summary episode, never fact records.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

An executor cannot survive a Host restart, so mounting marks every queued or running run failed with an explicit error instead of leaving a run that never ends. Disposal waits for every accepted run to settle before it closes the storage domain.

</details>
