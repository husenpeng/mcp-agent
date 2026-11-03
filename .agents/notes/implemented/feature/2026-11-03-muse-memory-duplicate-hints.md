# Agent Note: Muse memory duplicate hints

Status: implemented

English | [中文](2026-11-03-muse-memory-duplicate-hints.zh.md)

## Problem

A write replaced a record only when `(scope, entity, key)` matched exactly. The model phrases the same standing rule under a new key or subject often enough that the store accumulated paraphrases: search returned several near-identical lines, and the per-workspace cap filled with restatements. Hindsight's consolidation layer merges such statements, but its engine spends a model call on every write.

## Decision

`MemoryService.duplicates(query)` compares a pending write with the active records of the same owner, scope, and kind. Both values must hold at least `MIN_DUPLICATE_TOKENS` (3) word segments and share at least `DUPLICATE_COVERAGE` (0.8) of the larger value's words; the pair the write would replace is excluded. Detection is lexical, synchronous, and never blocks or changes the write.

`memory_write` still stores the record and appends `Similar saved memories: …; use memory_forget when one is superseded.`, naming at most three matches. The hint rides the write result rather than a separate tool, so the agent sees it exactly when it can act on it.

## Alternatives considered

**A model consolidation pass on each write.** That is Hindsight's approach. It costs one request per write, adds latency to a tool call, and its output is not verifiable against the user's words; `duplicates()` spends no request.

**Reject a write that overlaps.** Silently dropping what the user asked to remember is worse than storing a duplicate; a hint leaves the decision with the agent that knows the current request.

**Exact normalized-value match.** Deterministic, but it misses reordered or lightly reworded statements, which are the common case.

**Embedding similarity.** The package has no embedding provider, and an index lifecycle is disproportionate for a hint.

**A separate `memory_duplicates` tool.** A fifth schema on every request would answer a question the write result already answers.

## Consequences

- The rule is conservative: paraphrases with different words are not reported, and `DUPLICATE_COVERAGE` trades recall for precision so a false match cannot talk the agent into deleting a distinct memory. The [package README](../../../../packages/experimental/memory/README.md) owns the limitation.
- The hint is model-visible, so the `memory_write` description, the write result, both package READMEs, and both tool catalogs change. No storage, configuration, or tool-count change is involved.
- Duplicate detection reads the whole owner and scope on every write, like every other read; the per-scope caps bound it.
- Coverage stays at 100%. The [relations and health note](2026-11-03-muse-memory-relations-and-health.md) records the layer this one extends.