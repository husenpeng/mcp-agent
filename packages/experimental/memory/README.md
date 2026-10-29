---
description: "Workspace-scoped cross-session memory records for users and maintainers choosing, configuring, or debugging what later sessions remember."
kind: "package-reference"
---

# @tomato/experimental-memory

English | [中文](README.zh.md)

## Summary

Keep stated preferences, constraints, decisions, and facts available to later sessions that share a project directory. Records live in the `tomato_memory` storage domain, never in a Session log; only what a consumer injects or returns reaches the model. Each record is scoped by the canonical original directory of its Session, so other directories cannot see it. Writing the same entity and key replaces the earlier value. Mount it with `@tomato/experimental-tool-memory`; the service alone adds no tool or context.

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

Switch on the **Memory and goal focus** bundle (`@tomato/experimental-muse-bundle`) in Plugins. It mounts this service, its model tools, and goal focus on the Host.

### When to choose it

Choose it when people repeat the same standing instructions across sessions in one project, such as a brand tone or an outreach rule. Skip it when every session should start without earlier context, or when memory must follow a person across projects or devices: scope is one project directory on one Host.

### Configuration

Mount it after `@tomato/storage-domain`:

```yaml
- id: optional-memory
  name: '@tomato/experimental-memory'
```

| Field | Default | Meaning |
|---|---|---|
| `maxRecallResults` | `10` | Records one search returns |
| `maxPinnedRecords` | `20` | Pinned records a workspace exposes for injection |
| `maxValueBytes` | `1024` | UTF-8 bytes of one record value |
| `maxRecordsPerWorkspace` | `1000` | Stored records, including candidates, per workspace |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-memory) is the exhaustive source for every accepted field.

### Records and lifecycle

A record has a `kind` (`preference`, `constraint`, `decision`, or `fact`), a lower-kebab-case `entity` and `key`, a non-empty `value`, a `status`, and a `pinned` flag. An `active` record reaches search and, when pinned, the injected snapshot. A `candidate` waits until a person confirms it; only active records can be pinned. `remember()` keeps the earlier id and creation time when it replaces a record. `forget()` deletes the record from storage. Each record names the Session that wrote it and, for quoted writes, the `user/message` it quoted.

### Failures

`remember()` rejects with `MemoryError` code `value-too-large` or `workspace-full`. Activation rejects when the stored domain fails its schema or a stored key differs from its record id. A Session without a header directory, or whose directory no longer exists, has no workspace; consumers treat it as having no memory.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The service opens one `tomato_memory` domain (version 1, `single` layout, table `records`) at activation and closes it on disposal. The storage domain serializes writes and resolves each one only after it is durable. A Session's workspace is the `realpath` of its immutable header `cwd`, resolved once per Session; a changed working directory does not move a Session to another workspace.

Search ranks active records by the fraction of query words each contains, using `Intl.Segmenter` word segments over the entity, key, and value, then by recency. Matching is lexical; there is no semantic similarity.

| File | Owns |
|---|---|
| [`src/index.ts`](src/index.ts) | `MemoryService`, limits, workspace resolution |
| [`src/storage.ts`](src/storage.ts) | Domain declaration and record schema |
| [`src/retrieval.ts`](src/retrieval.ts) | Tokenization and ranking |
| [`src/types.ts`](src/types.ts) | Request types and the snapshot message source |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Memory tools](../tool-memory/README.md) — model tools, `/memory`, and pinned injection
- [Memory and goal focus bundle](../muse-bundle/README.md) — the shipped switch
- [Storage subsystem](../../../docs/subsystems/storage.md) — domains, backends, and the `ctx.memory` API
- [Session search tools](../tool-session-query/README.md) — reading earlier Session logs instead of saved facts

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through [`@tomato/experimental-tool-memory`](../tool-memory/README.md), which owns every tool, result, and injected snapshot.

#### KV Cache effect

The service adds no request content; cache effects belong to the consumer.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **One Host, one directory** — records do not follow a signed-in account, another device, or another project directory; a renamed or moved project directory starts without memory.
- **Lexical search** — a query must share words with a record; synonyms and paraphrases do not match.
- **No cross-process write lock** — two Host processes sharing one TOMATO home can overwrite each other's memory writes, as for every JSON storage domain.
- **Whole-domain scans** — every read filters all records in memory; the per-workspace cap bounds the cost, not the domain size.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
