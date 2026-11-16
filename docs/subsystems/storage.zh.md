# 存储

[English](storage.md) | 中文

存储子系统持久保存一切不属于会话事件日志的数据（会话日志有自己的 seam——见 [persistence.md](persistence.zh.md)）。它是一项可选能力，不属于 agent loop（智能体循环）主干，并按[能力 seam](../../.agents/notes/implemented/architecture/2026-06-13-capability-seams.zh.md) 拆分：枢纽（hub）与 Service Definition（[@tomato/storage](../../packages/storage/storage)，`ctx.storage`）、Service Provider（注册为 `json` 的 [@tomato/storage-json](../../packages/storage/storage-json) 与注册为 `sqlite` 的 [@tomato/storage-sqlite](../../packages/storage/storage-sqlite)），以及 Consumer 数据形式（[@tomato/storage-domain](../../packages/storage/storage-domain)，`ctx.storageDomain`，也可经 `ctx.storage.domain` 访问）——它是后端约定的唯一 Consumer，也是其他一切所使用的类型化 API。枢纽自身不做任何 IO：后端拥有介质，数据形式拥有语义，产品包绝不直接触碰后端。设计记录：[领域 KV 存储 Agent Note](../../.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.zh.md)。

源码：[`packages/storage/storage/src/backend.ts`](../../packages/storage/storage/src/backend.ts) · [`packages/storage/storage-domain/src/spec.ts`](../../packages/storage/storage-domain/src/spec.ts) · [`packages/storage/storage-domain/src/events.ts`](../../packages/storage/storage-domain/src/events.ts)

## 枢纽：`ctx.storage`

`Storage`（[签名](#ctxstorage--storage)）是汇合点，不是存储本体。`ctx.storage.backend` 是一张名称 → 后端的表：多个后端并排保持挂载，哪个后端服务哪个消费方由该消费方自己的配置决定（即领域层的路由表），绝不是枢纽全局的选择。`register(name, backend)` 返回 disposer；重复名称与查找未知名称都抛出 `StorageError`。dispose（资源释放）只注销名称——由拥有它的插件在注销之后自行关闭后端。每个后端插件还会发布一个仅用于生命周期的服务键（`storageBackendServiceKey(name)`），数据形式提供方注入它，使自身激活不会与后端注册发生竞态。

数据形式以一张可合并扩展的键 map 挂载到枢纽上：

```ts type-equiv
/**
 * Data forms mountable on the hub, keyed by form name. Form owners extend
 * this map via declaration merging (the domain layer merges
 * `domain: DomainFacility`) and mount the facility in their `apply`.
 */
interface StorageForms {}
```

`mount(form, facility)` 是一个 effect，其 disposer 负责卸载；对同一键的第二次挂载抛出 `duplicate-mount`。`form(form)` 解析已挂载的 facility，在拥有插件加载之前抛出 `form-not-mounted`——组合方应据此安排插件顺序，而不是静默推迟。领域层合并 `domain: DomainFacility`，因此 `ctx.storage.domain` 与 `ctx.storageDomain` 是同一个对象。

## 后端约定

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

一个后端拥有一个介质（一棵文件树的根目录、一个数据库文件），并提供可选的操作组；`kv` 是唯一已交付的操作组。`KvFacet.open(descriptor)` 打开一个具名 unit——`KvUnitDescriptor` 携带名称、当前格式版本、可选的兼容记录版本、表名清单，以及是否存在全局单例 slot——并返回提供 `loadAll`、`putRecord`、`deleteRecord`、`deleteRecords`、`setGlobal` 和 `close` 的 `KvUnit`。unit 名与表名必须匹配 `UNIT_NAME_RE`（既可安全用作文件名，也可安全用作 SQL 标识符片段）；记录键在 `single` 布局中是不透明字符串，在 `per-record` 布局中则是匹配 `[a-zA-Z0-9_-]+` 的路径片段。unit 不对并发写入做串行化——顺序由调用方负责——但每次单独调用在介质上都是原子的；单记录写入与整文件发布在 resolve 后即已持久，`per-record` 批量删除则依赖文件系统对目录项更新的持久化。`deleteRecords` 以一次调用应用整批删除：所有列出的记录都从可读状态消失且后端接受该批后才 resolve，拒绝时通常整批未应用；无法建立或恢复批次状态的批量删除会以 `unknown-state` 拒绝，之后该 unit 的所有操作都以同一错误拒绝，直到 `close()` 释放它（关闭后的调用以 `closed` 拒绝）。`single` 布局在原子替换之后失败（目录 fsync 错误）时，新文件可能已落在介质上而调用方看到拒绝；unit 的内存保持一致，下一次发布会重写该文件。`single` 介质的版本戳既非当前版本也不在声明的兼容集合内时拒绝 `version-mismatch`；`per-record` 文档的版本在该集合之外时读作不存在。无法按该 unit 解析的介质拒绝 `malformed-medium`。[`backend.ts`](../../packages/storage/storage/src/backend.ts) 是逐条款的规范性约定，[`tests/contract.ts`](../../packages/storage/storage/tests/contract.ts) 中的共享一致性套件会针对每个后端检查共享条款。[json 后端](../../packages/storage/storage-json/README.zh.md)以原子方式为每个 unit 整文件重新发布一份人类可读文件；[sqlite 后端](../../packages/storage/storage-sqlite/README.zh.md)在单个数据库中每行存储一份文档，用于频繁更新的数据。

## 声明领域

领域由其拥有包声明一次，形式是一个 spec 对象——它是该领域的身份、布局和记录 schema 的单一来源（schema 用 zod 编写，因此 `z.infer` 让消费方类型无需重复声明）：

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

`defineDomain(spec)` 固定 spec 的字面量类型，并在拥有方的模块加载时、任何介质被触碰之前就明确报错：领域名或表名不匹配 `UNIT_NAME_RE`、版本不是非负整数、global schema 接受 `null`，这些都会抛出（`null` 是介质的「从未写入」哨兵值，可空的 global 一旦存储就无法往返还原）。`domainTable<K, V>(schema)` 声明一张表，其键类型是仅存在于编译期的 phantom 类型（通常是[品牌化 id](core.zh.md#branded-ids)）；`descriptorOf(spec)` 投影出面向后端的 unit 描述符。

<a id="domain-versioning"></a>
## 领域版本

`version` 表示当前读写格式。`compatibleVersions` 列出拥有方可用当前 schema 解码其记录和全局值的旧版本；只允许小于 `version` 的非负整数。不声明兼容版本时，读取仍要求精确版本。接受旧版本不放宽记录校验，也不允许更新的未知版本。每行已存字段必须能无歧义地确定其含义；单元版本戳无法在混合行中区分相同字段的不同含义。

普通兼容打开和读取不会重新盖戳或规范化已存值。整单元 JSON 用一次原子文件替换发布当前版本戳和修改后的数据；SQLite 将首次单元版本更新与修改放在同一事务中提交；批量删除始终使用一个事务。删除不存在的记录或空批次不会推进版本戳。版本戳标识可接受格式，不代表值规范化已经完成；读取器必须接受混合代际。采用单元级版本戳的后端会拒绝不支持的单元版本。

发布前的序列化失败或成功的 SQLite 回滚会保留原有数据与版本戳。JSON 替换后的 I/O 失败或 SQLite 回滚本身失败时，即使操作被拒绝，已存结果也可能未知。必须停止使用并关闭后端及其领域，然后重新打开检查已存状态，再决定是否重试。各后端 README 定义了这些失败情况。

JSON 的 `per-record` 布局独立检查和标记每份文档；不支持的文档读取为缺失。其已有整单元引导是只读加载的例外：它将接受的历史值复制到当前版本文档中，不转换其中的值。已有的已声明表目录（即使为空）或已声明全局文档会禁止引导。SQLite 无论布局请求为何都保持单元级版本检查。布局与恢复行为见 [JSON 后端](../../packages/storage/storage-json/README.zh.md)和 [SQLite 后端](../../packages/storage/storage-sqlite/README.zh.md)。

兼容后继版本需提升 `version`、在 `compatibleVersions` 中保留仍可读的版本戳，并扩展同一 schema 的解码和默认规则。消费者在重写选定记录时规范化值；Storage 不分配应用记录版本。验证历史版本与跨版本升级、混合值、不写入的读取、失败回滚、重启、其他单元隔离和未知版本拒绝。删表与布局变更各自需要保留及升级策略；兼容版本戳本身不定义这些策略。

v2 单元可能包含未改动的 v1 值。接受版本戳 2 的 v3 读取器仍须解码这些值；对于跳过 v2 的用户，还必须接受版本戳 1。移除旧解码逻辑前必须重写并验证全部受影响记录，包括已处于当前单元版本戳下的记录。不兼容变更需要在用新 schema 打开前执行明确且可恢复的升级；存储领域没有值迁移执行器。

如果需要回到旧读取器，必须在写入新格式前保留一致的备份：首次修改后，旧读取器可能拒绝新的版本戳。手工降低已存版本戳不会逆转值转换。领域兼容性不迁移 SQLite 物理 schema 或 JSON 外层格式，更改后端路由也不会转移已存数据。Session 格式迁移与 SQLite 物理布局版本各有拥有方，不迁移领域值。

## 打开的领域

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

读取是同步的，来自权威的内存态：`KvTable` 暴露 `get`/`entries`/`keys`/`size`（快照迭代器，在排队写入落地期间保持稳定），global 句柄的 `get()` 在第一次 `set` 将 slot 物化到介质之前一直返回 spec 的 `initial`。每次写入——`put`、`delete`、`deleteMany`、`update`、`global.set`——都在同一条逐领域写链上排队，先在后端完成持久化，再更新内存，最后发出 `domain/changed`；后端写入被拒时内存原样不动，因此读取绝不会偏离介质；若后端报告 `unknown-state`，领域会被隔离，读取与后续写入都会拒绝，直到 `close()` 释放它。`update(key, fn)` 在其写链 slot 上是一次原子的读-改-写（键缺失时拒绝 `missing-key`）；`delete` 一个不存在的键 resolve 为 `false`，不产生写入也不产生事件。`deleteMany(keys)` 在一个写链 slot 内把存在的键作为一次后端批量删除移除，resolve 为移除数量，并为每个被移除的键发一次 `domain/changed`；后端写入被拒时所有记录保持原样，也不发事件；`unknown-state` 拒绝会隔离整个领域。返回的记录就是存储的对象本身，不是副本——请经 `put`/`update` 整体替换，绝不要就地修改。

## 领域 facility：`ctx.storageDomain`

`DomainFacility`（[签名](#ctxstoragedomain--domainfacility)）在经过路由的后端之上打开已声明的领域。路由是领域插件的配置，绝不属于枢纽：`backend` 指定必填的默认路由，`routes` 按领域名逐个覆盖。`open(spec)` 按严格顺序执行，每一步失败都使整个调用失败：拒绝已打开或仍在关闭中的名称（`already-open`），解析路由（`backend-not-found`），要求后端具备 `kv` facet（`facet-unsupported`），打开 unit（后端的 `version-mismatch`/`malformed-medium` 原样透传），并按 spec 的 zod schema 校验每条已存储记录和 global（`invalid-record`，附带出错的表与键）。调用方拥有返回的句柄，并用 `Domain.close()` 释放它；插件卸载时仍处于打开状态的领域由 facility 负责关闭，已关闭领域的名称只有在拆除完全结束后才释放出来供重新打开。`get(name)` 是无类型的诊断查找，命中的是每个类型化句柄背后包内私有的 `DomainImpl` 运行时；`closeAll()` 是卸载路径。

## 变更事件：`domain/changed`

每次持久写入都发出一个事件，严格发生在后端确认持久性之后，顺序遵循该领域的写链（[事件条目](#domainchanged--emit)）：

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

`put`（插入、覆写和 global 写入）在 `value` 中携带新快照——绝不携带旧值；需要做差异比较的消费方自行保留上一份快照。`deleted` 是不携带值的墓碑。该事件是通知，不是事务参与者：发出时提交点已经过去，因此同步抛出的监听器会被兜住并记录一条警告，而不会让已经持久的写入被拒绝；发出的值等于发出时刻的内存态。该事件仅限进程内；跨进程的变更推送是一项已记录的限制（[包 README](../../packages/storage/storage-domain/README.zh.md)）。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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

Types: [PromotionOutcome](../../packages/experimental/memory/README.zh.md) · [Session](session.zh.md) · [SessionId](core.zh.md)

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

Types: [EmbeddingsProbeInput](../../packages/experimental/embeddings-http/README.zh.md) · [EmbeddingsProbeResult](../../packages/experimental/embeddings-http/README.zh.md) · [EmbeddingsStatusView](../../packages/experimental/muse-insights/README.zh.md)

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
