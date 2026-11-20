---
description: "Account-scoped profile and workspace memory records for users and maintainers choosing, configuring, or debugging what later sessions remember."
kind: "package-reference"
---

# @tomato/experimental-memory

English | [中文](README.zh.md)

## Summary

Keep stated preferences, constraints, decisions, and facts available to later sessions. Records live in the `tomato_memory` storage domain, never in a Session log; only what a consumer injects or returns reaches the model. Each record belongs to one owner: the signed-in account where the Host names accounts through `ctx.tomatoAccount`, or one local owner where it does not. A `profile` record describes the person and reaches every workspace of its owner; a `workspace` record belongs to one stable project identity and keeps its Session's canonical directory as a snapshot. Mount it with `@tomato/experimental-tool-memory`; the service alone adds no tool or context.

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
| `versionRetentionDays` | `90` | Days a superseded record version is kept; `0` keeps every version |
| `maxVersionsPerRecord` | `10` | Superseded versions kept per identity; the current version does not count |
| `summaryRetentionDays` | `365` | Days a summary episode is kept; observations use `episodeRetentionDays` |
| `vecExtensionPath` | installed platform package | sqlite-vec extension path, without the platform suffix; unset loads the packaged platform binary when available and otherwise uses exact in-process cosine |
| `coldArchivePath` | unset | Directory that receives pruned records as monthly JSONL; unset deletes them |
| `coldArchiveRetentionMonths` | `6` | Monthly cold-archive files retained |
| `indexPath` | `<TOMATO_HOME>/memory/index-v1.sqlite` | SQLite sidecar path for FTS5 and vector retrieval; it opens only when application boot provides a harness home or this field is set explicitly |
| `indexEmbedBatch` | `32` | Embeddings one outbox drain submits |
| `indexEmbedRetryMs` | `5000` | Delay before retrying a failed outbox batch |
| `refreshIntervalMs` | `1000` | Minimum delay between medium change checks for another Host process's writes; `0` never re-reads |
| `writeLockTimeoutMs` | `2000` | Wait for another Host process's memory write lock before failing with `write-busy` |
| `writeLockStaleMs` | `30000` | Age after which a lock file left by a crashed process is stolen |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-memory) is the exhaustive source for every accepted field.

On the Plugins page, the row's **Configure** page edits every field of this table; the page is the Muse bundle's [`Muse insights` client](../muse-insights/README.md#configuration) and appears while the Host serves this entry's settings namespace.

To blend vector similarity into search, mount [`@tomato/experimental-embeddings-http`](../embeddings-http/README.md) beside this row and configure the service and key. The provider computes vectors; this service stores them locally and reuses them. Without a provider the service stays lexical.

### Owners and scopes

`accessOf(session)` answers which records a Session can use now. Without `ctx.tomatoAccount` (no gateway, or a gateway without auth_service) every record belongs to the local owner `local`. With it, the owner is `account:<id>` of the signed-in account, read at each call, so a sign-in or account switch applies from the next operation. A confirmed sign-out answers `sign-in-required`, and an account state the gateway has not verified yet answers `account-loading`; consumers must neither read nor write in either state, and only `sign-in-required` may withdraw a snapshot. The resulting view holds the owner's profile records and, when the Session has a project directory, the owner's records of that workspace. `accessFor(path)` resolves the same view by directory, so a run without a Session (a crew run) asks with its working directory and falls back to profile records when that directory is unavailable. Records written under the local owner do not appear for an account, and the reverse.

### Records and lifecycle

A record has an `owner`, a `scope` (`profile`, or `workspace` with its stable project identity and canonical directory snapshot), a `kind` (`preference`, `constraint`, `decision`, or `fact`), a lower-kebab-case `entity` and `key`, a non-empty `value`, a `status`, and a `pinned` flag. An `active` record reaches search. `snapshot(view)` selects what consumers inject without a search: every active profile record, then up to `maxPinnedRecords` pinned workspace records. A `candidate` waits until a person confirms it; only active workspace records can be pinned. A write with the same owner, scope, entity, and key closes the current version (`validTo` plus `supersededBy`) and appends a new version with its own id and creation time; only the current version reaches search, the snapshot, and capacity counts. A replacement also trims superseded versions older than `versionRetentionDays` and beyond `maxVersionsPerRecord`; with `coldArchivePath` set, each trimmed object is appended to `<path>/<YYYY-MM>.jsonl` first, a failed archive keeps it hot for a later retry, and files older than `coldArchiveRetentionMonths` are deleted. Activation closes every extra current version of one identity, keeping the newest, so a crash between the two writes of a replacement self-heals. `forget()` deletes every version of the identity, and `versions(view, id)` lists them newest first. Each record names the Session that wrote it, the `user/message` it quoted for quoted writes, and, for a promoted record, the episode that supplied the fact. `related(view, id, depth)` walks from one active record to the records of the same `entity`, the records the same Session wrote, and the records sharing the `key`, following at most two hops and returning at most `maxRecallResults` records. `duplicates(query)` names active records of the same owner, scope, and kind whose value shares at least 80% of the larger value's words with a pending write, ignoring the record that write would replace. A `candidate` may carry `proposalFor`, the record whose confirmation would replace its statement, so a contradicted capture waits beside the rule it disputes instead of overwriting it. Restating the same candidate statement bumps its `evidence` count instead of storing a second version, so repetition reaches a person as one candidate. `isDue(record)` names the candidates worth putting in front of a person: one that carries a `proposalFor`, or one stated more than once that a person has not already dismissed at that count; `dismiss()` records that dismissal and a later statement makes the candidate due again. `stats(view)` counts current versions, every stored version, both scope limits, and the cached-vector count. Entity, key, and value are normalized before the identity lookup: identifiers become NFKC lowercase with whitespace and underscores collapsed into single hyphens, and statement whitespace collapses into one space. An identity or statement that normalization cannot make valid rejects with `invalid-identifier` or `empty-value` instead of being stored.

A workspace identity is the registry's `WorkspaceId` when `ctx.workspaceRegistry` is mounted, otherwise a deterministic `pw:<digest>` of the canonical directory, and a linked Git worktree takes the provisional identity of the repository its `.git` file names through `commondir`, so work in per-ticket checkouts reads and writes one project history; a conventional checkout, a directory below one, and a submodule keep their own. The memory domain is version 4 with `compatibleVersions: [1, 2, 3]`; the episode domain is version 2 with `compatibleVersions: [1]`. Activation maps pre-v2 path-only scopes to a resolved identity, maps pre-v3 records to a version start, and a registry that mounts later re-maps provisional ids to its own. Visibility compares identities; `path` is a display snapshot. A scope that supplies neither an identity nor a path rejects with `invalid-scope`.

### Project history

Compressed tool calls are stored as episodes in the `tomato_memory_episodes` domain, separate from explicit records. An episode carries its owner, project directory, kind (`observation` or `summary`), type, title, subtitle, narrative, facts, concepts, files read and modified, tool, content fingerprint, and source Session and tool call. `rememberEpisode()` appends; a repeated fingerprint of the same owner and project only updates that record's timestamp, so a retried call does not append twice. `searchEpisodes()` ranks by lexical coverage and, with a mounted provider, vector similarity under the same `semanticWeight`, `maxSemanticCandidates`, and `semanticFloor` limits; it filters by kind, time, and `excludeSession`, and drops ranked matches below an optional `minScore`, so an injected index never repeats the asking Session's own work or a one-word coincidence. `episodeTimeline()` widens a window around one anchor. `history()` selects the newest summaries and the observations most relevant to the session's first message, bounded by `historySummaries` and `historyEpisodes`, and accepts the same `excludeSession` and `minScore` options. `promote()` groups observation episodes from different Sessions whose first facts share `DUPLICATE_COVERAGE` of their words, writes one candidate workspace record per group (or reuses the record that already states it or carries the derived `project/<concept>-<digest>` key), and marks every grouped episode with its `promotedTo` record. A lesson three different Sessions repeat becomes one `pitfall` constraint candidate whose value names the repetition count; repetition selects the subject, never the authority, so the rule still reaches a Session only after a person confirms it. Failure observations and facts that only report an exit code never promote: a failed call's first fact is an error message, not a statement about the project. `rememberEpisode()` drops a fact an active workspace record already states, so the same statement does not enter both tracks. Observations older than `episodeRetentionDays` and summaries older than `summaryRetentionDays` are pruned when a later episode is written, with the same cold-archive handoff. `forgetEpisode()` deletes one. A Session without a project directory has no episodes. `rememberEpisode()` normalizes the episode type and every text field the same way, then clips each field and list to its stored bound before the size check, so a stored episode is canonical text that satisfies the episode schema; an empty title rejects with `empty-value` and an over-long type with `invalid-identifier`.

### Local vector cache

When an embedding provider is mounted, the service stores each computed vector before using it: in the sidecar's `vectors` table when `indexPath` is set, otherwise in the `tomato_memory_vectors` domain. A cached vector is keyed by its record family and id, and records the provider model, vector length, and the record's update time. A search reads cached vectors for its candidates, sends only the query and the records whose vector is missing or stale, and stores the newly computed vectors. A changed record, a different provider model, or a corrupt entry re-embeds that record. Structured records and episodes share the cache but keep separate entries. Deleting a record, forgetting an episode, or pruning an expired episode removes its vector; `maxEmbeddingVectors` keeps the cache bounded by dropping the oldest entries. A failed cache read or write leaves search working with freshly computed vectors, and a corrupt entry is replaced on the next search. Vectors never leave the machine; only record text and the query are sent to the provider.

### Local search index

When `indexPath` is set, the service opens one local SQLite file, mirrors every record and episode into FTS5 over pre-tokenized text, and queues each current object in an embedding outbox. A mounted embedding provider drains that queue in batches, stores vectors beside the text, and retries a failed batch after `indexEmbedRetryMs`; a changed provider model drops every vector and queues every object again. If the service cannot write that retry state, it closes the derived index and search continues over the authoritative domains. `recall()` and `searchEpisodes()` read lexical candidates from FTS5 and semantic candidates from the nearest stored vectors, so a paraphrase outside the lexical window can still enter the ranking pool. A missing, stale, or failed index falls back to the in-memory scan, and activation rebuilds the file when its schema version, build marker, row counts, or dirty marker disagree with the domains. The index is derived data: deleting the file is safe and the next activation rebuilds it. Application boot supplies `tomatoHomePath`, which defaults the sidecar to `<harness home>/memory/index-v1.sqlite`. Vector ranking uses sqlite-vec's `vec_distance_cosine` when the extension loads, and exact in-process cosine over the scoped rows otherwise. The service resolves the installed `sqlite-vec` platform package by default and rewrites an ASAR path to its unpacked sibling, so the packaged Host loads the signed binary beside `app.asar.unpacked`.

### Failures

`remember()` rejects with `MemoryError` code `invalid-identifier`, `invalid-scope`, `empty-value`, `value-too-large`, `workspace-full`, or `profile-full`. Activation rejects when the stored domain fails its schema or a stored key differs from its record id. A Session without a header directory, or whose directory no longer exists, sees only profile records.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The service opens one `tomato_memory` domain (version 4 with `compatibleVersions: [1, 2, 3]`, `per-record` layout, table `records`) at activation and closes it on disposal; the episode domain stays at version 2. Both memory domains publish one document per record, so Host processes sharing one tomato home write beside each other instead of replacing a whole-unit file; each domain bootstraps once from a legacy `single`-layout file, which stays untouched. The storage domain serializes writes within one process and resolves each one only after it is durable. `recall()`, `searchEpisodes()`, `history()`, and the turn snapshot ask the medium for a change token at most once per `refreshIntervalMs` and re-read a domain whose token moved, so another Host process's record appears without a restart. `remember()` takes a lock file under the home and re-reads the record domain inside it before writing, so two processes cannot both leave a current version of one identity. A Session's project is its immutable header `cwd` resolved once per Session and mapped to the workspace registry's id, or to a provisional `pw:` id without that registry; a changed working directory does not move a Session. The owner is not cached: `ctx.get('tomatoAccount')` is read at each `accessOf()` call, so the service never reloads when the gateway appears or disappears.

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
- **Lexical promotion** — `promote()` compares word sets of first facts only; a paraphrase in different words is not grouped, and a candidate waits for `/memory confirm` before it reaches a snapshot. Only successful observations promote, so a repeated error message never becomes a saved fact.
- **Dismissal speaks for one evidence count** — `dismiss()` silences a candidate at the count it had, so a later restatement makes it due again; it never hides a different statement, and a proposal is due regardless of dismissal.
- **Model capture is consumer-owned** — the service stores whatever a consumer writes; which statements a model may propose, and whether a profile preference becomes active, belongs to [`@tomato/experimental-tool-memory`](../tool-memory/README.md).
- **Lexical duplicate hints** — `duplicates()` compares word sets only; a paraphrase with different words is not reported, and a report never blocks or changes a write.
- **Cross-process reads lag one check interval** — a record another Host process writes reaches this one's snapshot and search after `refreshIntervalMs` and the next async read; a backend that reports no change token is never re-read. The sidecar merges rows instead of replacing them, so a row whose record was deleted elsewhere is filtered by readers rather than removed. Writes to one identity serialize on a lock file and re-read the domain under it, so the newer version closes the older one immediately; a write that cannot take the lock within `writeLockTimeoutMs` fails with `write-busy`.
- **The per-record layout upgrades one way** — a build that predates it reads only the untouched `<unit>.json`, so a downgrade hides every record written after the upgrade. The bootstrap leaves `<unit>.migrated.json` beside the legacy file; back up before downgrading.
- **Retention runs on write** — superseded versions are trimmed on the next replacement of their identity, and expired episodes on the next episode write of their project; there is no periodic sweeper, and the cold archive is append-only monthly JSONL with no import path.
- **Whole-domain scans** — list, snapshot, related, stats, and history still filter all records in memory; `indexPath` moves recall and episode search onto FTS5, while the per-workspace cap bounds the rest.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
