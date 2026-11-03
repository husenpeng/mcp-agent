# Agent Note: Muse project memory index at turn start

Status: implemented

English | [中文](2026-11-03-muse-project-index.zh.md)

## Problem

The turn snapshot shows profile memories and pinned workspace values, but the model cannot see which other subjects this project has memories about. It either searches blind, searching the same obvious words every session, or does not search at all. Hindsight answers this with knowledge pages: an LLM-maintained wiki the agent reads before it starts. That page costs a model request per change and a cache to keep current, which this experimental layer will not pay.

## Decision

When `projectIndex` is on, the turn snapshot message continues after the recorded snapshot with a subject index of the workspace:

```text
Project memories by subject (counts only; memory_search returns the values):
- client:acme: 4 (budget, contact, deadline, email-tone)
```

A subject appears once it holds at least `MIN_INDEXED_RECORDS` (2) active workspace memories. Lines order by count, then subject name; at most `MAX_INDEXED_SUBJECTS` (8) subjects and `MAX_INDEXED_ATTRIBUTES` (6) attributes each, with `…` when more exist, and `(<count> more subjects omitted; memory_search by subject.)` when subjects are cut. The index carries subjects, counts, and attribute names only — never values.

The index shares the existing snapshot message and its digest, so an unchanged record set still adds nothing to later turns. Values take precedence for the byte budget: the snapshot renders first, and the index receives at most the remaining bytes up to 1024, so it disappears rather than pushing a pinned memory out. `projectIndex` is a validated config field defaulting to true.

## Alternatives considered

**List values for every subject.** That duplicates what `memory_search` returns, grows with the store, and spends the snapshot budget on content the model may not need; counts and attribute names orient the search without the dump.

**Generate the page with a model.** Hindsight's knowledge pages read better, but a request per record change, a revision cache, and unverifiable rewrites are disproportionate for an experimental turn snapshot. The deterministic index can grow into a model-written page later without changing the message source or digest.

**Inject the index as a second message.** It would need its own source kind, snapshot bookkeeping, and duplicate suppression; the existing message already has all three.

**Always render the index regardless of the snapshot.** It would compete with pinned values for the same budget; values the person pinned are more important than a pointer to unpinned ones.

**Index every subject, including single-record ones.** Most subjects begin with one record, so the index would list nearly everything and lose its orienting value.

## Consequences

- The index lists names and counts, not statements: a subject with one memory is invisible, and two memories about different subjects are not related by the index.
- When the snapshot fills `maxSnapshotBytes`, no index appears; the configured byte cap governs both parts.
- The text is model-visible, so the package README's snapshot contract, both README languages, the config catalog in both languages, and the snapshot tests change. No tool schema, storage, or tool-count change is involved.
- Coverage stays at 100%. The [relations note](2026-11-03-muse-memory-relations-and-health.md) records the layers this one extends; the [duplicate-hints note](2026-11-03-muse-memory-duplicate-hints.md) records write-time consolidation.