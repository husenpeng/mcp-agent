# Agent Note: Muse memory relations, evidence, and storage health

Status: implemented

English | [中文](2026-11-03-muse-memory-relations-and-health.zh.md)

## Problem

`tomato_memory` stores one row per record. The model can search those rows by words, but a record stays isolated: nothing connects it to the decision written beside it, its stored `source` never reaches the model or the person, and no surface reports how much of the store is in use. Hindsight closes those gaps by organizing memory into layers — entity relations, quoted evidence, consolidation, project knowledge pages — behind a service. The layers, not the HTTP boundary, are what a local plugin can reproduce.

## Decision

Add the read-only layers to `@tomato/experimental-memory` and its consumer without a storage change, a configuration change, or an auxiliary model request.

`related(view, id, depth)` walks from one active record to the records of the same `entity`, the records the same Session wrote, and the records sharing the `key`. The walk stays inside the view, visits each record once, follows at most `MAX_RELATION_DEPTH` (2) hops, and returns at most `maxRecallResults` records in discovery order. A candidate, or a record outside the view, reaches nothing.

`memory_related` is the fourth tool. It returns each reached record with the edge, the hop count, and the writing Session, plus the quoted message when the write named one; a delegated agent may read it because nothing in it changes memory. `stats(view)` and `/memory stats` report stored, active, candidate, and pinned counts, both scope limits, and the oldest active update. `/memory show <id>` prints one record with its Session and quoted message so a person can verify why a memory exists.

Every edge is derived from fields a record already carries, so no edge table, index, or migration is introduced.

## Alternatives considered

**Embeddings or a vector index for related records.** The package has no embedding provider, and adding one turns a zero-dependency experimental plugin into one that needs an index lifecycle, a model route, and a reindex policy. Structural edges answer "what was decided around this" without that cost.

**Persist edges in a second table.** Edges are a pure function of `entity`, `key`, and `source.sessionId`; storing them would duplicate the record and need maintenance on every write and delete.

**Let a model infer the links.** The same text could be linked semantically, but the request cost lands on every write and the result is not verifiable. It remains possible later as a candidate-producing pass.

**A `memory_status` tool.** The counts serve a person deciding what to clean up, not a model doing a task; a fifth schema would spend prefix tokens on every request for no task-relevant content.

**Include candidates in the walk.** Candidates are invisible to later Sessions by design; walking into them would leak unconfirmed content into the model surface through a side door.

## Consequences

- Every request carries four memory tool schemas instead of three. Search, write, and snapshot paths are unchanged, so the KV-cache effect stays confined to the tool list.
- Relations are structural: two records that mean the same thing but share no entity, key, or Session stay unconnected, and a two-hop walk misses longer chains. The [package README](../../../../packages/experimental/memory/README.md) owns the limitation.
- `stats()` reads the whole view like every other read; the per-scope caps bound the cost, not the domain size.
- Coverage for both packages stays at 100%. No shipped snapshot profile mounts the Muse bundle, so no recorded-session snapshot changes; the bundle's real-composition test boots this row with the scripted model.
- This change stops at read-only surfaces. Lexical duplicate hints followed in the [duplicate-hints note](2026-11-03-muse-memory-duplicate-hints.md), the deterministic workspace index in the [project-index note](2026-11-03-muse-project-index.md), and post-turn capture in the [turn-capture note](2026-11-03-muse-turn-capture.md). A model-written knowledge page remains absent.