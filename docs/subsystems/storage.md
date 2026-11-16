# Storage

English | [中文](storage.zh.md)

The storage subsystem persists everything that is not a session event log (session logs have their own seam — [persistence.md](persistence.md)). It is one optional capability, not part of the agent-loop spine, split as a [capability seam](../../.agents/notes/implemented/architecture/2026-06-13-capability-seams.md): the hub and Service Definition ([@tomato/storage](../../packages/storage/storage), `ctx.storage`), the Service Providers ([@tomato/storage-json](../../packages/storage/storage-json), registered as `json`, and [@tomato/storage-sqlite](../../packages/storage/storage-sqlite), registered as `sqlite`), and the Consumer data form ([@tomato/storage-domain](../../packages/storage/storage-domain), `ctx.storageDomain`, also reachable as `ctx.storage.domain`) — the backend contract's only Consumer and the typed API everything else uses. The hub performs no IO itself: backends own media, data forms own semantics, and product packages never touch backends directly. Design record: [domain KV storage Agent Note](../../.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md).

Source: [`packages/storage/storage/src/backend.ts`](../../packages/storage/storage/src/backend.ts) · [`packages/storage/storage-domain/src/spec.ts`](../../packages/storage/storage-domain/src/spec.ts) · [`packages/storage/storage-domain/src/events.ts`](../../packages/storage/storage-domain/src/events.ts)

## The hub: `ctx.storage`

`Storage` ([signatures](#ctxstorage--storage)) is a meeting point, not a store. `ctx.storage.backend` is a name → backend table: multiple backends stay mounted side by side, and which backend serves which consumer is that consumer's configuration (the domain layer's route table), never a hub-global choice. `register(name, backend)` returns the disposer; duplicate names and unknown lookups throw `StorageError`. Disposal only unregisters the name — the owning plugin closes the backend after unregistering. Each backend plugin also publishes a lifecycle-only service key (`storageBackendServiceKey(name)`), which form providers inject so their activation cannot race backend registration.

Data forms mount on the hub under a merge-extensible key map:

```ts type-equiv
/**
 * Data forms mountable on the hub, keyed by form name. Form owners extend
 * this map via declaration merging (the domain layer merges
 * `domain: DomainFacility`) and mount the facility in their `apply`.
 */
interface StorageForms {}
```

`mount(form, facility)` is an effect whose disposer unmounts; a second mount of the same key throws `duplicate-mount`. `form(form)` resolves a mounted facility and throws `form-not-mounted` until the owning plugin loads — assemblies order plugins accordingly rather than silently deferring. The domain layer merges `domain: DomainFacility`, so `ctx.storage.domain` and `ctx.storageDomain` are the same object.

## The backend contract

```ts type-equiv
/**
 * One registered backend. A backend owns exactly one medium and shares its
 * lifecycle across all facets; facets are optional members — a backend that
 * cannot serve a data kind simply omits it, and resolution fails loud instead.
 */
interface StorageBackend {
  /** Key-value operations; absent when this backend cannot serve them. */
  readonly kv?: KvFacet

  /**
   * Drain in-flight writes across all open units and release the medium.
   * Idempotent; concurrent and repeated calls resolve once teardown finishes.
   * @returns resolution after the medium is released.
   */
  close(): Promise<void>
}
```

A backend owns one medium (a file-tree root, a database file) and exposes optional operation groups; `kv` is the only shipped group. `KvFacet.open(descriptor)` opens one named unit — `KvUnitDescriptor` carries the name, current format version, optional compatible record versions, table names, and whether a global singleton slot exists — and returns a `KvUnit` with `loadAll`, `putRecord`, `deleteRecord`, `deleteRecords`, `setGlobal`, and `close`. Unit and table names must match `UNIT_NAME_RE` (safe as a file name and as a SQL identifier segment); record keys are opaque strings in the `single` layout and match `[a-zA-Z0-9_-]+` path segments in the `per-record` layout. A unit does not serialize concurrent writes — ordering belongs to the caller — but each single call is atomic on the medium; durability holds for single-record writes and whole-file publishes, while a `per-record` batch deletion relies on the filesystem persisting directory-entry updates. `deleteRecords` applies a whole batch in one call: it resolves once every listed record is absent from the readable state and the backend accepted the batch, and a rejection normally leaves the batch unapplied; a backend that cannot establish or restore the batch's state rejects with `unknown-state`, after which every later operation on that unit rejects with the same error until `close()` releases it (calls after close reject `closed`). A `single`-layout failure after the atomic replacement (a directory-fsync error) can leave the new file on the medium while the caller sees a rejection; the unit keeps its memory consistent and the next publish rewrites the file. A `single` medium whose stamp is neither the current version nor a declared compatible one rejects `version-mismatch`; a `per-record` document stamped outside that set reads as absent. A medium that cannot be parsed as the unit rejects `malformed-medium`. [`backend.ts`](../../packages/storage/storage/src/backend.ts) is the normative clause-by-clause contract, and the shared conformance suite in [`tests/contract.ts`](../../packages/storage/storage/tests/contract.ts) checks the shared clauses against each backend. The [json backend](../../packages/storage/storage-json/README.md) republishes one whole human-readable file per unit atomically; the [sqlite backend](../../packages/storage/storage-sqlite/README.md) stores one document per row in one database for frequently updated data.

## Declaring a domain

A domain is declared once by its owning package as a spec object — the single source of the domain's identity, layout, and record schemas (zod, so `z.infer` keeps consumer types un-duplicated):

```ts type-equiv
/** Static declaration of one domain: identity, version, and record layout. */
interface DomainSpec {
  /** Domain name; must match `UNIT_NAME_RE` (doubles as the backend unit name). */
  readonly name: string
  /** Current domain format version; reads accept it or a declared {@link compatibleVersions} entry. */
  readonly version: number
  /**
   * Medium layout for the backend unit: `single` (the default) stores the
   * whole unit as one document; `per-record` stores each record as its own
   * document, for units whose records are large, sparse, or individually
   * disposable — the projection cache — and scopes version checks per record
   * (an unaccepted record document is discarded, never migrated).
   */
  readonly layout?: 'single' | 'per-record'
  /**
   * Older domain versions whose stored records the current record schemas
   * also accept (the declaring owner vouches for that, typically by
   * declaring the fields older records lack as optional). A unit stamped
   * with a listed version opens instead of rejecting: `per-record` backends
   * read such record documents and accept a legacy whole-unit file for the
   * one-time bootstrap, `single` backends read the whole document, and the
   * next write stamps {@link version}. Records that fail the current schemas
   * still follow {@link invalidRecords}.
   */
  readonly compatibleVersions?: readonly number[]
  /**
   * What `open` does with a stored table record that fails its zod schema.
   * Absent (the default), the whole open rejects with `invalid-record` —
   * right for authoritative data. `'backup-and-skip'` is for domains whose
   * records are disposable derived data: the backend moves the record's
   * document aside (`KvUnit.backupRecord`), the failure is logged with
   * its cause, and the open continues with the record absent. A backend
   * without `backupRecord` (no per-record document to move) falls back
   * to the rejecting default. The global slot always rejects.
   */
  readonly invalidRecords?: 'backup-and-skip'
  /** Optional global singleton slot. */
  readonly global?: DomainGlobalSpec<unknown>
  /** Table declarations keyed by table name; each name must match `UNIT_NAME_RE`. */
  readonly tables: Record<string, DomainTableSpec>
}
```

`defineDomain(spec)` pins the spec's literal types and fails loud at the owner's module load, before any medium is touched: a domain or table name outside `UNIT_NAME_RE`, a version that is not a non-negative integer, or a global schema that accepts `null` all throw (`null` is the medium's "never written" sentinel, so a stored nullable global could not round-trip). `domainTable<K, V>(schema)` declares one table with a phantom compile-time key type (typically a [branded id](core.md#branded-ids)); `descriptorOf(spec)` projects the backend-facing unit descriptor.

<a id="domain-versioning"></a>
## Domain versioning

`version` names the current read/write format. `compatibleVersions` lists older versions whose records and global value the owner can decode with its current schemas; only nonnegative integers below `version` are allowed. Without that declaration, reads stay exact-version. Acceptance does not weaken record validation or permit a newer unknown version. Each row's saved fields must determine its meaning unambiguously; a unit stamp cannot distinguish different meanings of identical fields in mixed rows.

Ordinary compatible opens and reads do not restamp or normalize saved values. Whole-unit JSON publishes the current stamp and changed data in one atomic file replacement; SQLite commits its first updated unit stamp and mutation in one transaction; batch deletes always use one transaction. Deleting missing records or an empty batch does not advance the stamp. The stamp identifies an accepted format, not completion of value normalization; readers must accept mixed generations. A backend with a unit-wide stamp rejects an unsupported unit version.

Serialization failure before publication or successful SQLite rollback preserves the previous data and stamp. An I/O failure after JSON replacement, or a failure of SQLite rollback itself, can leave the saved outcome unknown despite rejection. Stop using and close the backend and its domains, then reopen to inspect saved state before deciding whether to retry. The backend READMEs define these failure cases.

JSON's `per-record` layout checks and stamps each document independently; an unsupported document reads as absent. Its existing whole-unit bootstrap is an exception to read-only loading: it copies accepted historical values into current-stamped documents without converting them. An existing declared table directory, even when empty, or a declared global document suppresses bootstrap. SQLite retains unit-wide version checks regardless of the layout request. See the [JSON backend](../../packages/storage/storage-json/README.md) and [SQLite backend](../../packages/storage/storage-sqlite/README.md) for layout and recovery behavior.

For a compatible successor, bump `version`, keep all still-readable stamps in `compatibleVersions`, and extend the same schema's decoding/defaults. Consumers normalize values when rewriting selected records; Storage does not assign application record versions. Verify historical and skipped upgrades, mixed values, reads without writes, failure rollback, restart, other-unit isolation, and unknown-version refusal. Table removal and layout changes require their own retention and upgrade policy; a compatible stamp alone does not define either.

A v2 unit may contain untouched v1 values. A v3 reader accepting stamp 2 must still decode those values; accepting stamp 1 is also necessary for users who skipped v2 entirely. Removing old decoding requires rewriting and validating every affected record, including those already under a current unit stamp. An incompatible change needs an explicit, recoverable upgrade before opening with the new schema; the storage domain has no value-migration runner.

Keep a consistent backup before writing a new format if return to an older reader is required: that reader can refuse the new stamp after the first mutation. Lowering a saved stamp by hand does not reverse value conversion. Domain compatibility does not migrate SQLite's physical schema or JSON envelope formats, and changing a backend route does not transfer stored data. Session-format migrations and SQLite physical-layout versioning have separate owners and do not migrate domain values.

## The open domain

```ts type-equiv
/** One open domain, typed by its spec. */
interface Domain<S extends DomainSpec> {
  /** Domain name from the spec. */
  readonly name: string
  /** Global singleton handle; a spec without `global` has no usable handle (`never`). */
  readonly global: DomainGlobalHandleOf<S>
  /**
   * Resolve one declared table handle. Handles are stable — repeated calls
   * return the same instance.
   * @param name - Declared table name.
   * @returns the typed table handle.
   */
  table<N extends keyof S['tables'] & string>(name: N): KvTable<TableKeyOf<S, N>, TableValueOf<S, N>>

  /**
   * Report the backend medium's change token. A caller compares two readings
   * to decide whether another process published since its mirror was loaded.
   * @returns the token, or `undefined` when the backend reports none.
   */
  changeStamp(): Promise<number | undefined>

  /**
   * Re-read the unit and replace this domain's in-memory mirror with the
   * stored state, after draining queued writes. Records are re-validated on
   * the way in, and no `domain/changed` event is emitted: the mirror caught up
   * with the medium instead of accepting a write.
   * @throws when the medium is unreadable or a stored record fails its schema.
   */
  reload(): Promise<void>

  /**
   * Close this domain: reject new writes immediately, drain already-queued
   * writes (their events still emit), release the backend unit, then free
   * the domain name for a later open. Idempotent — repeated calls share one
   * teardown. The consumer owns this call (typically as its own `ctx.effect`
   * disposer); the facility closes any domain left open when it unmounts.
   * @returns resolution after the unit is released.
   */
  close(): Promise<void>
}
```

Reads are synchronous from authoritative in-memory state: `KvTable` exposes `get`/`entries`/`keys`/`size` (snapshot iterators that stay stable while queued writes land), and the global handle's `get()` serves the spec's `initial` until the first `set` materializes the slot on the medium. Every write — `put`, `delete`, `deleteMany`, `update`, `global.set` — queues on one per-domain chain and reaches backend durability first, then mutates memory, then emits `domain/changed`; a rejected backend write leaves memory untouched, so reads never diverge from the medium; a backend that reports `unknown-state` instead quarantines the domain, and its reads and later writes reject until `close()` releases it. `update(key, fn)` is an atomic read-modify-write at its chain slot (a missing key rejects `missing-key`); `delete` of an absent key resolves `false` with no write and no event. `deleteMany(keys)` removes the present keys as one backend batch in one chain slot, resolves the removed count, and emits one `domain/changed` per removed key; a rejected backend write leaves every record in place and emits nothing; an `unknown-state` rejection quarantines the domain. Returned records are the stored objects themselves, not copies — replace via `put`/`update`, never mutate in place.

## The domain facility: `ctx.storageDomain`

`DomainFacility` ([signatures](#ctxstoragedomain--domainfacility)) opens declared domains over routed backends. Routing is the domain plugin's configuration, never the hub's: `backend` names the required default route and `routes` overrides it per domain name. `open(spec)` runs a strict sequence, each step failing the whole call: it rejects a name already open or still closing (`already-open`), resolves the route (`backend-not-found`), requires the backend's `kv` facet (`facet-unsupported`), opens the unit (backend `version-mismatch`/`malformed-medium` pass through), and validates every stored record and global against the spec's zod schemas (`invalid-record` with the offending table and key). The caller owns the returned handle and releases it with `Domain.close()`; domains still open when the plugin unmounts are closed by the facility, and a closed domain's name frees for reopening only after teardown fully completes. `get(name)` is an untyped diagnostic lookup onto the package-private `DomainImpl` runtime behind every typed handle; `closeAll()` is the unmount path.

## The change event: `domain/changed`

Every durable write emits one event strictly after the backend acknowledged durability, in the domain's write-chain order ([event entry](#domainchanged--emit)):

```ts type-equiv
/** Shared location fields of one durable domain change. */
interface DomainChangedBase {
  /** Owning domain name. */
  readonly domain: string
  /** Table name; `''` for a global-singleton write. */
  readonly table: string
  /** Record key; `''` for a global-singleton write. */
  readonly key: string
}
```

```ts type-equiv
/** One durable domain change; a closed union — switch on `operation`. */
type DomainChanged = DomainChangedPut | DomainChangedDeleted
```

`put` (inserts, overwrites, and global writes) carries the new snapshot in `value` — never the old value; a diffing consumer keeps its own previous snapshot. `deleted` is a tombstone with no value. The event is a notification, not a transaction participant: the commit point has passed at emission, so a synchronously throwing listener is contained with a logged warning rather than rejecting the already-durable write, and emitted values equal the in-memory state at emission. The event is in-process only; cross-process change push is a recorded limitation ([package README](../../packages/storage/storage-domain/README.md)).

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxcreatorfeedback--creatorfeedbackstore"></a>

### `ctx.creatorFeedback` — `CreatorFeedbackStore`

Durable feedback over one storage table.

```ts cordis-catalog
/**
 * List the records that apply to one client.
 * @param client - client to include; undefined includes host-wide records only.
 * @returns the matching records, newest first.
 */
list(client: string | undefined): FeedbackRecord[]

/**
 * Read the records that apply to one client, keyed by creator.
 * @param client - the brief's client, when it names one.
 * @returns the most specific record per creator.
 */
byCreator(client: string | undefined): Map<string, FeedbackRecord>

/**
 * Insert or replace the decision for one creator.
 * @param input - the reviewer's decision.
 * @param now - epoch milliseconds; tests replace it.
 * @returns the stored record.
 */
async record(input: FeedbackInput, now: number = Date.now()): Promise<FeedbackRecord>
```

Source: [`packages/marketing/tool-creator-search/src/feedback.ts`](../../packages/marketing/tool-creator-search/src/feedback.ts)

<a id="ctxembeddings--embeddings-abstract-seam"></a>

### `ctx.embeddings` — `Embeddings` (abstract seam)

Text-to-vector capability. A provider declares the model identity and vector length it returns, and embeds a batch in one operation.

```ts cordis-catalog
/**
 * Embed one batch of texts.
 * @param request - texts in caller order and the caller's cancellation.
 * @returns one vector per text, in the same order.
 * @throws {@link EmbeddingsError} when the provider cannot answer.
 */
abstract embed(request: EmbedRequest): Promise<readonly Float32Array[]>
```

Source: [`packages/experimental/embeddings/src/index.ts`](../../packages/experimental/embeddings/src/index.ts)

<a id="ctxmemory--memoryservice"></a>

### `ctx.memory` — `MemoryService`

Host-wide memory service. Every operation names the owner or view it acts on, and records of other owners and other workspaces are invisible to it. Writes are serialized by the storage domain and durable before they resolve.

```ts cordis-catalog
/**
 * Resolve which records a Session can use now.
 * @param session - Session whose original project directory scopes workspace records.
 * @returns the current owner's view, `sign-in-required` after a confirmed sign-out, or `account-loading`
 *   before the gateway has verified who is signed in.
 */
async accessOf(session: Session): Promise<MemoryAccess>

/**
 * Build the view a caller with no Session uses: the signed-in owner's profile
 * records, with no workspace. The phone's memory page reads through this when
 * the Session it follows has no project directory.
 * @returns the owner's profile-only access, `sign-in-required` after a confirmed sign-out, or `account-loading`
 *   before the gateway has verified who is signed in.
 */
accessProfile(): MemoryAccess

/**
 * Resolve which records work in one project directory can use now.
 *
 * A run without a Session asks by directory instead of by Session. An
 * unavailable directory leaves the owner's profile records only, the same
 * fallback a Session without one gets.
 * @param path - project directory the work happens in.
 * @returns the current owner's view, `sign-in-required` after a confirmed sign-out, or `account-loading`
 *   before the gateway has verified who is signed in.
 */
async accessFor(path: string): Promise<MemoryAccess>

/**
 * Store one record version, closing the current version of the same owner,
 * scope, entity, and key.
 * Entity, key, and value are normalized before the identity lookup.
 * @param request - owner, scope, statement, lifecycle state, and the write that justified it.
 * @returns the newly stored version; the superseded version keeps its id and gains `validTo` and `supersededBy`.
 * @throws {@link MemoryError} `invalid-identifier`, `empty-value`, `value-too-large`, `workspace-full`, `profile-full`, or `write-busy`.
 */
async remember(request: RememberRequest): Promise<MemoryRecord>

/**
 * Re-read the stored domains when another Host process may have written
 * since the last check. A backend that reports a change token makes this a
 * few `stat` calls per interval; one without a token is never re-read.
 * @returns resolution after this process's mirror matches the medium.
 */
async refresh(): Promise<void>

/**
 * Rank the view's active records against free text. A mounted embedding
 * provider blends vector similarity into the lexical score for the strongest
 * candidates; without one, or when the provider fails, ranking stays lexical.
 * @param request - view, query text, optional alternative wordings, kind filter, and cancellation.
 * @returns at most `maxRecallResults` records, best match first.
 */
async recall(request: RecallRequest): Promise<readonly MemoryRecord[]>

/**
 * Walk the relations of one active record: records about the same subject,
 * records written in the same Session, and records sharing the attribute.
 * Every hop reads only the view, so nothing of another owner or workspace is
 * reached. A candidate, or a record outside the view, reaches nothing.
 * @param view - owner and optional workspace that bound the walk.
 * @param id - starting record.
 * @param depth - hops to follow, from 1 to {@link MAX_RELATION_DEPTH}; defaults to one.
 * @returns reached records in discovery order, at most `maxRecallResults`.
 * @throws TypeError when `depth` is not an integer in range.
 */
related(view: MemoryView, id: MemoryIdType, depth: number = 1): readonly RelatedMemory[]

/**
 * Find active records of the same owner, scope, and kind whose value states
 * nearly the same thing as a pending write: the two values share at least
 * {@link DUPLICATE_COVERAGE} of the larger value's word set, and each holds
 * at least {@link MIN_DUPLICATE_TOKENS}. The record the write would replace
 * by `(entity, key)` is not a match. Detection is lexical and conservative;
 * it never rejects or changes a write.
 * @param query - owner, scope, kind, identifiers, and value of the pending write.
 * @returns matching records, best match first, at most `maxRecallResults`.
 */
duplicates(query: DuplicateQuery): readonly DuplicateMatch[]

/**
 * Count what the view stores and how much of its capacity that is.
 * @param view - owner and optional workspace.
 * @returns stored counts, both scope limits, and the oldest active update.
 */
stats(view: MemoryView): MemoryStats

/**
 * Every stored version of one record identity, newest first.
 * @param view - view that must see the record.
 * @param id - any version id of the identity.
 * @returns the versions including the given one, or an empty list when the view sees no such record.
 */
versions(view: MemoryView, id: MemoryIdType): readonly MemoryRecord[]

/**
 * Delete one record durably.
 * @param view - view that must see the record.
 * @param id - record to delete.
 * @returns whether the view saw the record.
 */
async forget(view: MemoryView, id: MemoryIdType): Promise<boolean>

/**
 * Change whether an active workspace record is pinned.
 * @param view - view that must see the record.
 * @param id - record to change.
 * @param pinned - new pin state.
 * @returns the updated record, or `undefined` when the view sees no active workspace record with that id.
 */
async setPinned(view: MemoryView, id: MemoryIdType, pinned: boolean): Promise<MemoryRecord | undefined>

/**
 * Activate a candidate. A candidate that names a `proposalFor` record
 * replaces that record's statement instead of adding one: the proposal's
 * value becomes the new version of the target's identity, and the proposal
 * is closed so the change stays traceable to the person who accepted it.
 * @param view - view that must see the record.
 * @param id - candidate to confirm.
 * @returns the active record, or `undefined` when the view sees no candidate with that id.
 */
async confirm(view: MemoryView, id: MemoryIdType): Promise<MemoryRecord | undefined>

/**
 * Enumerate every record a view sees, for human management.
 * @param view - owner and optional workspace.
 * @returns profile and workspace records, newest first.
 */
list(view: MemoryView): readonly MemoryRecord[]

/**
 * Store one compressed episode. A repeated fingerprint of the same owner and
 * project updates the earlier record's timestamp instead of appending.
 * Every text field is normalized before the size check and the fingerprint lookup.
 * @param request - owner, project, episode fields, fingerprint, and source.
 * @returns the stored episode.
 * @throws {@link MemoryError} `invalid-identifier`, `empty-value`, `episode-too-large`, or `episodes-full`.
 */
async rememberEpisode(request: RememberEpisodeRequest): Promise<EpisodeRecord>

/**
 * Promote repeated observation facts into candidate records. Two episodes
 * from different Sessions whose first facts share
 * {@link DUPLICATE_COVERAGE} of their words form one group; the group's fact
 * becomes one workspace record unless an active record already states it,
 * and every member is marked with the record it promoted into. Failure
 * observations and facts that only report an exit code never promote.
 * @param view - owner and project; a view without a project promotes nothing.
 * @returns the records created or reused, with the episodes each covers.
 */
async promote(view: MemoryView): Promise<readonly PromotionOutcome[]>

/**
 * Read one episode the view can see.
 * @param view - owner and optional project.
 * @param id - episode identity.
 * @returns the episode, or `undefined` when it is outside the view.
 */
episode(view: MemoryView, id: EpisodeIdType): EpisodeRecord | undefined

/**
 * List the view's episodes newest first, for human management and `/memory history`.
 * @param view - owner and optional project.
 * @returns every episode of the owner's project, newest first.
 */
listEpisodes(view: MemoryView): readonly EpisodeRecord[]

/**
 * Search the view's episodes by lexical text and, when a provider is mounted,
 * vector similarity. The same pool and fallback rules as record search apply.
 * `excludeSession` keeps the caller's own work out of the result, and
 * `minScore` drops weak single-word matches from recency-ordered pools.
 * @param request - view, text, optional kinds, time bounds, session exclusion, match floor, limit, and cancellation.
 * @returns at most `limit` episodes, best match first.
 */
async searchEpisodes(request: EpisodeSearchRequest): Promise<readonly EpisodeRecord[]>

/**
 * Read the episodes around one anchor, newest first.
 * @param request - view, optional anchor, window sizes, and kind filter.
 * @returns the window, at most `before + after + 1` episodes.
 */
episodeTimeline(request: EpisodeTimelineRequest): readonly EpisodeRecord[]

/**
 * Select the episodes one snapshot injects: the newest summaries and the
 * observations most relevant to the query, both bounded by configuration.
 * `excludeSession` keeps the Session's own episodes out of its snapshot, and
 * `minScore` drops single-word matches that only share a generic token.
 * @param view - owner and optional project.
 * @param text - the Session's first message, used for observation relevance.
 * @param options - the Session to exclude and the lowest lexical match kept.
 * @returns summaries first, then observations, newest first within each group.
 */
async history( view: MemoryView, text: string, options: { readonly excludeSession?: SessionId; readonly minScore?: number } = {}, ): Promise<readonly EpisodeRecord[]>

/**
 * Delete one episode.
 * @param view - owner and optional project.
 * @param id - episode identity.
 * @returns whether the view held the episode.
 */
async forgetEpisode(view: MemoryView, id: EpisodeIdType): Promise<boolean>

/**
 * Select the records a Session receives without searching.
 * @param view - owner and optional workspace.
 * @returns every active profile record, then at most `maxPinnedRecords` pinned workspace records; each group ordered by entity, then key.
 */
snapshot(view: MemoryView): readonly MemoryRecord[]
```

Types: [PromotionOutcome](../../packages/experimental/memory/README.md) · [Session](session.md) · [SessionId](core.md)

Source: [`packages/experimental/memory/src/index.ts`](../../packages/experimental/memory/src/index.ts)

<a id="ctxmuseinsights--museinsights"></a>

### `ctx.museInsights` — `MuseInsights`

Host service behind `ctx.remote.museInsights`.

`snapshot()` is a pure read of retained state; `refresh()` runs both operations now and waits for their accepted work. Both return the complete Client-facing value, so no separate change feed is needed.

```ts cordis-catalog
/**
 * Read the retained recap and latest task analysis for the current owner.
 * @param signal - caller cancellation, checked before the read.
 * @returns the complete Client-facing snapshot.
 */
@Remote snapshot(signal: AbortSignal): Promise<MuseInsightsSnapshot>

/**
 * Run the day's recap and the unfinished-task analysis now.
 * @param signal - caller cancellation, checked before and after the runs.
 * @returns the snapshot after the accepted runs.
 */
@Remote async refresh(signal: AbortSignal): Promise<MuseInsightsSnapshot>

/**
 * Probe one staged embedding endpoint from the Host, resolving its credential
 * the way the mounted provider does.
 * @param input - endpoint, model, expected length, and credential name.
 * @param signal - caller cancellation.
 * @returns whether a vector came back, its length, and the latency.
 */
@Remote async probeEmbeddings(input: EmbeddingsProbeInput, signal: AbortSignal): Promise<EmbeddingsProbeResult>

/**
 * Read the mounted provider's state and cumulative usage.
 * @param signal - caller cancellation, checked before the read.
 * @returns availability, the live switch, model identity, and counters.
 */
@Remote embeddingsStatus(signal: AbortSignal): Promise<EmbeddingsStatusView>
```

Types: [EmbeddingsProbeInput](../../packages/experimental/embeddings-http/README.md) · [EmbeddingsProbeResult](../../packages/experimental/embeddings-http/README.md) · [EmbeddingsStatusView](../../packages/experimental/muse-insights/README.md)

Source: [`packages/experimental/muse-insights/src/index.ts`](../../packages/experimental/muse-insights/src/index.ts)

<a id="ctxstorage--storage"></a>

### `ctx.storage` — `Storage`

The storage hub service. Backends register under `backend`; data forms mount under their `StorageForms` key and are reached as `ctx.storage.<form>`.

```ts cordis-catalog
/**
 * Mount a data-form facility on the hub. Mounting is an effect: the
 * returned disposer unmounts the form.
 * @param form - Form key declared in {@link StorageForms}.
 * @param facility - The facility instance to expose.
 * @returns the disposer that unmounts the form.
 */
mount<K extends keyof StorageForms>(form: K, facility: StorageForms[K]): () => void

/**
 * Resolve a mounted data form.
 * @param form - Form key declared in {@link StorageForms}.
 * @returns the mounted facility.
 */
form<K extends keyof StorageForms>(form: K): StorageForms[K]
```

Source: [`packages/storage/storage/src/index.ts`](../../packages/storage/storage/src/index.ts)

<a id="ctxstoragedomain--domainfacility"></a>

### `ctx.storageDomain` — `DomainFacility`

The mounted domain facility. Opens declared domains over routed backends; one facility instance owns the open-domain table and enforces single-open per domain name.

```ts cordis-catalog
/**
 * Open one declared domain. Steps, each failing the whole call: reject a
 * name that is already open (`already-open`); resolve the backend route
 * (`backend-not-found` passes through from the hub); require its `kv` facet
 * (`facet-unsupported`); open the unit projected from the spec (backend
 * `version-mismatch`/`malformed-medium` pass through); load and validate
 * every stored record against the spec's zod schemas (`invalid-record`
 * with the offending table and key — unless the spec declares
 * `invalidRecords: 'backup-and-skip'` and the unit can move documents aside, in
 * which case the failing record is backed up, logged, and skipped);
 * construct the domain.
 *
 * Lifecycle: the CALLER owns the returned handle and closes it via
 * `Domain.close()` (typically as its own `ctx.effect` disposer) — the
 * facility does not tie the domain to any consumer fiber. Domains still
 * open when the facility unmounts are closed by the plugin disposer.
 * @param spec - The domain declaration, typically from `defineDomain`.
 * @returns the opened domain handle, typed by the spec.
 */
async open<S extends DomainSpec>(spec: S): Promise<Domain<S>>

/**
 * Look up an open domain by name, untyped. Diagnostic surface; typed
 * consumers hold the handle returned by {@link open}.
 * @param name - Domain name.
 * @returns the open domain runtime, or `undefined` when not open.
 */
get(name: string): DomainImpl | undefined

/**
 * Close every domain still open on this facility. The unmount path for
 * consumers that never called `Domain.close()` themselves; closing is
 * idempotent, so double-closing an already-closed domain is harmless.
 * @returns resolution after every unit is released.
 */
async closeAll(): Promise<void>
```

Source: [`packages/storage/storage-domain/src/index.ts`](../../packages/storage/storage-domain/src/index.ts)

<a id="domain-events"></a>

### `domain/*` events

<a id="domainchanged--emit"></a>

#### `domain/changed` — emit

A domain record or the global singleton changed, emitted once per write strictly after the backend acknowledged durability. Events of one domain arrive in its write-chain order.

```ts cordis-catalog
/**
 * A domain record or the global singleton changed, emitted once per write
 * strictly after the backend acknowledged durability. Events of one
 * domain arrive in its write-chain order.
 * @param change - domain, table (`''` for global), key (`''` for global),
 * operation discriminant, and on `put` the new snapshot.
 * @mode emit
 */
'domain/changed'(change: DomainChanged): void
```

Source: [`packages/storage/storage-domain/src/events.ts`](../../packages/storage/storage-domain/src/events.ts)
<!-- END GENERATED cordis-surface -->
