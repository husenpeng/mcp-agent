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
| `semanticWeight` | `0.35` | Weight of vector similarity in a blended search score; `0` disables semantic ranking |
| `maxSemanticCandidates` | `50` | Candidates one semantic search embeds and reranks |
| `semanticFloor` | `0.35` | Minimum cosine similarity for a record the lexical query does not match |
| `maxEpisodesPerWorkspace` | `500` | Stored episodes per owner and project |
| `maxEpisodeChars` | `8000` | Characters one episode may carry across its text fields |
| `episodeRetentionDays` | `90` | Days an episode is retained before pruning |
| `historySummaries` | `1` | Summaries one history selection considers |
| `historyEpisodes` | `5` | Episodes one history selection considers |
| `maxEmbeddingVectors` | `2000` | Cached vectors kept across owners and projects; `0` disables persistence |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-memory) is the exhaustive source for every accepted field.

On the Plugins page, the row's **Configure** page edits every field of this table; the page is the Muse bundle's [`Muse insights` client](../muse-insights/README.md#configuration) and appears while the Host serves this entry's settings namespace.

To blend vector similarity into search, mount [`@tomato/experimental-embeddings-http`](../embeddings-http/README.md) beside this row and configure the service and key. The provider computes vectors; this service stores them locally and reuses them. Without a provider the service stays lexical.

### Owners and scopes

`accessOf(session)` answers which records a Session can use now. Without `ctx.tomatoAccount` (no gateway, or a gateway without auth_service) every record belongs to the local owner `local`. With it, the owner is `account:<id>` of the signed-in account, read at each call, so a sign-in or account switch applies from the next operation; while nobody is signed in, `accessOf()` answers `sign-in-required` and consumers must neither read nor write. The resulting view holds the owner's profile records and, when the Session has a project directory, the owner's records of that workspace. `accessFor(path)` resolves the same view by directory, so a run without a Session (a crew run) asks with its working directory and falls back to profile records when that directory is unavailable. Records written under the local owner do not appear for an account, and the reverse.

### Records and lifecycle

A record has an `owner`, a `scope` (`profile`, or `workspace` with its canonical path), a `kind` (`preference`, `constraint`, `decision`, or `fact`), a lower-kebab-case `entity` and `key`, a non-empty `value`, a `status`, and a `pinned` flag. An `active` record reaches search. `snapshot(view)` selects what consumers inject without a search: every active profile record, then up to `maxPinnedRecords` pinned workspace records. A `candidate` waits until a person confirms it; only active workspace records can be pinned. A write with the same owner, scope, entity, and key replaces the earlier record and keeps its id and creation time. `forget()` deletes the record from storage. Each record names the Session that wrote it, the `user/message` it quoted for quoted writes, and, for a promoted record, the episode that supplied the fact. `related(view, id, depth)` walks from one active record to the records of the same `entity`, the records the same Session wrote, and the records sharing the `key`, following at most two hops and returning at most `maxRecallResults` records. `duplicates(query)` names active records of the same owner, scope, and kind whose value shares at least 80% of the larger value's words with a pending write, ignoring the record that write would replace. `stats(view)` counts what the view stores, reports both scope limits, and reports the cached-vector count.

### Project history

Compressed tool calls are stored as episodes in the `tomato_memory_episodes` domain, separate from explicit records. An episode carries its owner, project directory, kind (`observation` or `summary`), type, title, subtitle, narrative, facts, concepts, files read and modified, tool, content fingerprint, and source Session and tool call. `rememberEpisode()` appends; a repeated fingerprint of the same owner and project only updates that record's timestamp, so a retried call does not append twice. `searchEpisodes()` ranks by lexical coverage and, with a mounted provider, vector similarity under the same `semanticWeight`, `maxSemanticCandidates`, and `semanticFloor` limits; it filters by kind and time. `episodeTimeline()` widens a window around one anchor. `history()` selects the newest summaries and the observations most relevant to the session's first message, bounded by `historySummaries` and `historyEpisodes`. `promote()` groups observation episodes from different Sessions whose first facts share `DUPLICATE_COVERAGE` of their words, writes one candidate workspace record per group (or reuses the record that already states it or carries the derived `project/<concept>-<digest>` key), and marks every grouped episode with its `promotedTo` record. `rememberEpisode()` drops a fact an active workspace record already states, so the same statement does not enter both tracks. Episodes older than `episodeRetentionDays` are pruned when a later episode is written. `forgetEpisode()` deletes one. A Session without a project directory has no episodes.

### Local vector cache

When an embedding provider is mounted, the service stores each computed vector in the `tomato_memory_vectors` domain before using it. A cached vector is keyed by its record family and id, and records the provider model, vector length, and the record's update time. A search reads cached vectors for its candidates, sends only the query and the records whose vector is missing or stale, and stores the newly computed vectors. A changed record, a different provider model, or a corrupt entry re-embeds that record. Structured records and episodes share the cache but keep separate entries. Deleting a record, forgetting an episode, or pruning an expired episode removes its vector; `maxEmbeddingVectors` keeps the cache bounded by dropping the oldest entries. A failed cache read or write leaves search working with freshly computed vectors, and a corrupt entry is replaced on the next search. Vectors never leave the machine; only record text and the query are sent to the provider.

### Failures

`remember()` rejects with `MemoryError` code `value-too-large`, `workspace-full`, or `profile-full`. Activation rejects when the stored domain fails its schema or a stored key differs from its record id. A Session without a header directory, or whose directory no longer exists, sees only profile records.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The service opens one `tomato_memory` domain (version 1, `single` layout, table `records`) at activation and closes it on disposal. The storage domain serializes writes and resolves each one only after it is durable. A Session's workspace is the `realpath` of its immutable header `cwd`, resolved once per Session; a changed working directory does not move a Session to another workspace. The owner is not cached: `ctx.get('tomatoAccount')` is read at each `accessOf()` call, so the service never reloads when the gateway appears or disappears.

Search ranks the view's active records by the fraction of query words each contains, using `Intl.Segmenter` word segments over the entity, key, and value, then by recency. A caller may add alternative wordings; a match through one scores at 0.7 of a literal match. When an embedding provider is mounted and `semanticWeight` is above `0`, `recall()` embeds the strongest candidates and the query, blends cosine similarity into each score, and drops a record the query does not match lexically unless its similarity reaches `semanticFloor`. A missing or failed provider leaves the lexical result unchanged. `recall()` is asynchronous.

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
- [HTTP embedding provider](../embeddings-http/README.md) — vectors that search blends into its ranking
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
- **Optional semantic reach** — without a mounted embedding provider the service stays lexical; with one, similarity depends on that provider's model and sends record text and the query to it, while vectors stay in the local storage domain.
- **Structural relations** — `related()` connects records by equal entity, key, or writing Session; it neither infers semantic links nor reaches another workspace.
- **Lexical promotion** — `promote()` compares word sets of first facts only; a paraphrase in different words is not grouped, and a candidate waits for `/memory confirm` before it reaches a snapshot.
- **Lexical duplicate hints** — `duplicates()` compares word sets only; a paraphrase with different words is not reported, and a report never blocks or changes a write.
- **No cross-process write lock** — two Host processes sharing one TOMATO home can overwrite each other's memory writes, as for every JSON storage domain.
- **Whole-domain scans** — every read filters all records in memory; the per-workspace cap bounds the cost, not the domain size.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
