---
description: "Offline memory consolidation: chunk stored memory records and history, ask one bounded model call per chunk for a merge/proposal/promotion plan, and apply it, for maintainers running or configuring dreaming."
kind: "package-reference"
---

# @tomato/memory-dream

English | [中文](README.zh.md)

## Summary

Consolidate what the memory service stored: collect the episode window since the last run, assemble Session summary chains, build a worklist of merge, proposal, and promotion targets, and ask one model call per chunk for a validated plan applied under the configured mode. It requires `@tomato/experimental-memory` and a model route, ships switched off, and keeps its cursor in the `tomato_memory_dreams` storage domain.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)
-----

<a id="use-this-package"></a>
## Use this package

Enable the optional `@tomato/memory-dream` plugin after `@tomato/experimental-memory`. The Muse bundle mounts it; any other composition adds it explicitly. `/memory dream status` reports whether a run is due, and `/memory dream run` starts one; both come from `@tomato/experimental-tool-memory`, which looks the service up optionally.

### Configuration

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `false` | Whether automatic runs are allowed at all |
| `applyMode` | `report` | `report` records what a run would do, `candidates` writes proposals as candidates, `full` merges and promotes directly |
| `provider` / `model` | none | Explicit route; both or neither. Absent reads the triggering Session's last request header |
| `maxTokens` | `1500` | Output-token cap per call |
| `timeoutMs` | `30000` | Deadline per call |
| `maxTargetsPerChunk` | `12` | Worklist targets in one chunk |
| `maxPlanOps` | `12` | Plan operations accepted from one reply |
| `maxChunksPerRun` | `1` | Chunks one run processes |
| `minIntervalHours` | `24` | Hours between runs |
| `minNewEpisodes` | `8` | New episodes needed before a run is due |
| `maxChainChars` | `10000` | Summary-chain length before a chain counts as a backfill gap |

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

A run reads the cursor from the dream domain's global slot, collects the Sessions in the window since `watermark`, and assembles their summary chains. Backfill gaps and the worklist of consolidation targets are derived from the memory service's records and episodes. Targets are chunked, and each chunk becomes one request whose reply is parsed into a plan; operations naming ids the chunk did not carry are dropped, and the plan is applied under `applyMode`. The cursor, the target digest, and the run time advance only after the run settles, so an interrupted run resumes at the same chunk.

</details>

-----

<a id="model-experience"></a>
## Model Experience

### Dream request

#### What the model sees

One request per processed chunk, carrying a fixed consolidation instruction, the rendered targets and their records or episodes, and the Session summary chains. The reply is a JSON plan whose operations name ids the chunk carried. The exact request, replies, route, and outcome are logged as `plugin:memory-dream/run`, so the input a run saw is reconstructable from the Session log.

#### Token effect

Separate from the turn: one request per chunk, bounded by `maxTargetsPerChunk`, `maxTokens`, and `maxChunksPerRun`; nothing enters the conversation.

#### KV Cache effect

None; each chunk is its own request, and the shared system text is the only stable prefix within one run.

## Known Limitations and Deferred Work

- A run needs a model route; a Session without a request header and no configured `provider`/`model` skips the run instead of guessing.
- Backfill detection never authors a missing summary: gaps are reported, and summary content still comes from the capture path.
- `maxChunksPerRun` defaults to `1`, so a large worklist takes several runs to cover.
- Automatic scheduling depends on the memory tools calling `isDue()`; a composition without `@tomato/experimental-tool-memory` has no automatic trigger.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
