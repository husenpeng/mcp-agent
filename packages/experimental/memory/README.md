---
description: "Account-scoped profile and workspace memory records for users and maintainers choosing, configuring, or debugging what later sessions remember."
kind: "package-reference"
---

# @tomato/experimental-memory

English | [中文](README.zh.md)

## Summary

Keep stated preferences, constraints, decisions, and facts available to later sessions. Records live in the `tomato_memory` storage domain, never in a Session log; only what a consumer injects or returns reaches the model. Each record belongs to one owner: the signed-in account where the Host names accounts through `ctx.tomatoAccount`, or one local owner where it does not. A `profile` record describes the person and reaches every workspace of its owner; a `workspace` record belongs to the canonical original directory of its Session. Mount it with `@tomato/experimental-tool-memory`; the service alone adds no tool or context.

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

Choose it when people repeat the same standing instructions across sessions, such as a brand tone, an outreach rule, or the language they work in. Skip it when every session should start without earlier context, or when memory must follow a person across devices: records stay on one Host.

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
| `maxRecordsPerWorkspace` | `1000` | Stored records, including candidates, per owner and workspace |
| `maxProfileRecords` | `100` | Stored profile records, including candidates, per owner |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-memory) is the exhaustive source for every accepted field.

On the Plugins page, the row's **Configure** page edits every field of this table; the page is the Muse bundle's [`Muse insights` client](../muse-insights/README.md#configuration) and appears while the Host serves this entry's settings namespace.

### Owners and scopes

`accessOf(session)` answers which records a Session can use now. Without `ctx.tomatoAccount` (no gateway, or a gateway without auth_service) every record belongs to the local owner `local`. With it, the owner is `account:<id>` of the signed-in account, read at each call, so a sign-in or account switch applies from the next operation; while nobody is signed in, `accessOf()` answers `sign-in-required` and consumers must neither read nor write. The resulting view holds the owner's profile records and, when the Session has a project directory, the owner's records of that workspace. Records written under the local owner do not appear for an account, and the reverse.

### Records and lifecycle

A record has an `owner`, a `scope` (`profile`, or `workspace` with its canonical path), a `kind` (`preference`, `constraint`, `decision`, or `fact`), a lower-kebab-case `entity` and `key`, a non-empty `value`, a `status`, and a `pinned` flag. An `active` record reaches search. `snapshot(view)` selects what consumers inject without a search: every active profile record, then up to `maxPinnedRecords` pinned workspace records. A `candidate` waits until a person confirms it; only active workspace records can be pinned. A write with the same owner, scope, entity, and key replaces the earlier record and keeps its id and creation time. `forget()` deletes the record from storage. Each record names the Session that wrote it and, for quoted writes, the `user/message` it quoted. `related(view, id, depth)` walks from one active record to the records of the same `entity`, the records the same Session wrote, and the records sharing the `key`, following at most two hops and returning at most `maxRecallResults` records. `duplicates(query)` names active records of the same owner, scope, and kind whose value shares at least 80% of the larger value's words with a pending write, ignoring the record that write would replace. `stats(view)` counts what the view stores and reports both scope limits.

### Failures

`remember()` rejects with `MemoryError` code `value-too-large`, `workspace-full`, or `profile-full`. Activation rejects when the stored domain fails its schema or a stored key differs from its record id. A Session without a header directory, or whose directory no longer exists, sees only profile records.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The service opens one `tomato_memory` domain (version 1, `single` layout, table `records`) at activation and closes it on disposal. The storage domain serializes writes and resolves each one only after it is durable. A Session's workspace is the `realpath` of its immutable header `cwd`, resolved once per Session; a changed working directory does not move a Session to another workspace. The owner is not cached: `ctx.get('tomatoAccount')` is read at each `accessOf()` call, so the service never reloads when the gateway appears or disappears.

Search ranks the view's active records by the fraction of query words each contains, using `Intl.Segmenter` word segments over the entity, key, and value, then by recency. A caller may add alternative wordings; a match through one scores at 0.7 of a literal match. Matching stays lexical; there are no embeddings.

| File | Owns |
|---|---|
| [`src/index.ts`](src/index.ts) | `MemoryService`, limits, owner and workspace resolution |
| [`src/storage.ts`](src/storage.ts) | Domain declaration, record schema, owner brands |
| [`src/retrieval.ts`](src/retrieval.ts) | Tokenization and ranking |
| [`src/types.ts`](src/types.ts) | Request types and the snapshot message source |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Memory tools](../tool-memory/README.md) — model tools, `/memory`, and snapshot injection
- [Memory and goal focus bundle](../muse-bundle/README.md) — the shipped switch
- [Storage subsystem](../../../docs/subsystems/storage.md) — domains, backends, and the `ctx.memory` API
- [Session search tools](../tool-session-query/README.md) — reading earlier Session logs instead of saved facts
- [Tomato gateway](../../tomato/gateway/README.md) — the `ctx.tomatoAccount` account source

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through [`@tomato/experimental-tool-memory`](../tool-memory/README.md), which owns every tool, result, and injected snapshot.

#### KV Cache effect

The service adds no request content; cache effects belong to the consumer.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **One Host** — records do not follow an account to another device; a renamed or moved project directory starts without workspace memory.
- **Last verified account** — the owner is whichever account the gateway verified last; a Host whose browsers are signed in to different accounts switches owner with each verification.
- **Lexical search** — a query must share words with a record or with a caller-supplied wording; the service itself computes no similarity.
- **Structural relations** — `related()` connects records by equal entity, key, or writing Session; it neither infers semantic links nor reaches another workspace.
- **Lexical duplicate hints** — `duplicates()` compares word sets only; a paraphrase with different words is not reported, and a report never blocks or changes a write.
- **No cross-process write lock** — two Host processes sharing one TOMATO home can overwrite each other's memory writes, as for every JSON storage domain.
- **Whole-domain scans** — every read filters all records in memory; the per-workspace cap bounds the cost, not the domain size.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
