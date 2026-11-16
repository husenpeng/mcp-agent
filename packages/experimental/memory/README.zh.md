---
description: "按账号隔离的画像与工作区记忆记录，供用户和维护者选择、配置或调试后续会话记住的内容。"
kind: "package-reference"
---

# @tomato/experimental-memory

[English](README.md) | 中文

## 概述

让后续会话保留已陈述的偏好、约束、决定和事实。记录保存在 `tomato_memory` 存储域中，从不写入会话日志；只有消费方注入或返回的内容才会到达模型。每条记录属于一个所有者：Host 通过 `ctx.tomatoAccount` 提供账号时是已登录账号，否则是唯一的本地所有者。`profile`（画像）记录描述这个人，会进入该所有者的每个工作区；`workspace` 记录属于一个稳定项目身份，并保留所属会话的规范化目录作为快照。请与 `@tomato/experimental-tool-memory` 一起挂载；单独挂载该服务不会添加任何工具或上下文。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与暂缓工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

在插件页开启**记忆与目标专注**组合包（`@tomato/experimental-muse-bundle`）。它会在 Host 上挂载此服务、其模型工具和目标专注。

### 何时选择

当人们在多个会话里反复给出相同的长期指令（例如品牌语气、外联规则或工作语言）时选择它。如果每个会话都应在没有早先上下文的情况下开始，或记忆必须跨设备跟随一个人，则不要使用：记录只保存在一个 Host 上。

### 配置

在 `@tomato/storage-domain` 之后挂载：

```yaml
- id: optional-memory
  name: '@tomato/experimental-memory'
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `maxRecallResults` | `10` | 一次搜索返回的记录数 |
| `maxPinnedRecords` | `20` | 一个工作区可供注入的置顶记录数 |
| `maxValueBytes` | `1024` | 一条记录值的 UTF-8 字节数 |
| `maxRecordsPerWorkspace` | `1000` | 每个所有者在每个工作区保存的记录数（含候选） |
| `maxProfileRecords` | `100` | 每个所有者保存的画像记录数（含候选） |
| `semanticWeight` | `0.35` | 混合搜索得分中向量相似度的权重；`0` 关闭语义排序 |
| `maxSemanticCandidates` | `50` | 一次语义搜索嵌入并重排的候选数 |
| `semanticFloor` | `0.35` | 词法查询未命中的记录所需的最低余弦相似度 |
| `maxEpisodesPerWorkspace` | `500` | 每个所有者、每个项目保存的情节数 |
| `maxEpisodeChars` | `8000` | 一条情节各文本字段合计可携带的字符数 |
| `episodeRetentionDays` | `90` | 情节保留天数，到期后剪除 |
| `historySummaries` | `1` | 一次历史选择考虑的总结数 |
| `historyEpisodes` | `5` | 一次历史选择考虑的情节数 |
| `maxEmbeddingVectors` | `2000` | 跨所有者与项目保留的缓存向量数；`0` 关闭持久化 |
| `versionRetentionDays` | `90` | 被取代版本保留天数；`0` 保留全部版本 |
| `maxVersionsPerRecord` | `10` | 每个身份保留的被取代版本数；当前版本不计入 |
| `summaryRetentionDays` | `365` | 总结情节保留天数；观察情节使用 `episodeRetentionDays` |
| `vecExtensionPath` | 已安装的平台包 | sqlite-vec 扩展路径（不含平台后缀）；未设置时加载随包的平台二进制，缺失则用进程内精确余弦 |
| `coldArchivePath` | 未设置 | 接收被修剪记录的月度 JSONL 目录；未设置时直接删除 |
| `coldArchiveRetentionMonths` | `6` | 保留的月度冷归档文件数 |
| `indexPath` | `<TOMATO_HOME>/memory/index-v1.sqlite` | FTS5 与向量检索用的 SQLite 侧车路径；仅当应用启动提供 harness home 或显式设置该字段时启用 |
| `indexEmbedBatch` | `32` | 一次 outbox 排队提交的嵌入数 |
| `indexEmbedRetryMs` | `5000` | 失败批次的重试延迟 |
| `refreshIntervalMs` | `1000` | 检查其他 Host 进程写入的最小间隔；`0` 表示从不重读 |
| `writeLockTimeoutMs` | `2000` | 等待其他 Host 进程写锁的上限，超时报 `write-busy` |
| `writeLockStaleMs` | `30000` | 崩溃进程留下的锁文件被接管前的最短年龄 |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-memory)是所有可接受字段的完整来源。

在**插件**页中，该行的**配置**页可以修改上表的每个字段；该页面来自 Muse 配置包的 [`Muse insights` 客户端](../muse-insights/README.zh.md#configuration)，仅在 Host 提供该条目的设置命名空间时出现。

要在搜索中混入向量相似度，请在本行旁挂载 [`@tomato/experimental-embeddings-http`](../embeddings-http/README.zh.md) 并配置服务与 key。提供方只负责计算向量；本服务把向量保存在本地并复用。没有提供方时服务保持词法匹配。

### 所有者与范围

`accessOf(session)` 回答一个会话现在能使用哪些记录。没有 `ctx.tomatoAccount`（没有网关，或网关未配置 auth_service）时，所有记录都属于本地所有者 `local`。有它时，所有者是已登录账号的 `account:<id>`，每次调用时读取，因此登录或切换账号从下一次操作起生效。确认退出登录后返回 `sign-in-required`，网关尚未验证账号状态时返回 `account-loading`；两种状态下消费方都不能读也不能写，且只有 `sign-in-required` 可以撤回快照。得到的视图包含该所有者的画像记录；会话有项目目录时，还包含该所有者在这个工作区的记录。`accessFor(path)` 是同一视图的目录版本：没有 Session 的运行（例如 crew run）按它的工作目录解析视图，目录不可用则退回仅有画像记录。本地所有者写入的记录不会出现在账号下，反之亦然。

### 记录与生命周期

一条记录包含 `owner`、`scope`（`profile`，或带稳定项目身份与规范化目录快照的 `workspace`）、`kind`（`preference`、`constraint`、`decision` 或 `fact`）、小写短横线格式的 `entity` 和 `key`、非空的 `value`、`status` 以及 `pinned` 标记。`active` 记录会进入搜索结果。`snapshot(view)` 选出消费方无需搜索即可注入的内容：所有生效的画像记录，再加上至多 `maxPinnedRecords` 条置顶的工作区记录。`candidate` 记录等待人工确认；只有生效的工作区记录可以置顶。owner、scope、entity 和 key 都相同的写入会关闭当前版本（写入 `validTo` 与 `supersededBy`），再追加一条带新 id 与创建时间的新版本；只有当前版本进入检索、快照与容量统计。替换还会修剪早于 `versionRetentionDays` 或超出 `maxVersionsPerRecord` 的被取代版本；设置 `coldArchivePath` 时先把每条被修剪对象追加到 `<path>/<YYYY-MM>.jsonl`，归档失败则保留在热存储等待下次重试，并删除早于 `coldArchiveRetentionMonths` 的月度文件。激活时会把同一身份多余的当前版本关闭、只保留最新一条，因此替换两次写入之间的崩溃可以自愈。`forget()` 删除该身份的全部版本，`versions(view, id)` 按新到旧列出它们。每条记录都会注明写入它的会话；对于引用写入，还会注明所引用的 `user/message`；由提升生成的记录还会注明提供事实的情节。`related(view, id, depth)` 从一条生效记录出发，走到同一 `entity` 的记录、同一会话写入的记录以及共享 `key` 的记录，最多两跳、至多 `maxRecallResults` 条。`duplicates(query)` 找出同一所有者、同一范围和同一 kind 中、与被写入值共享较多词（较多一方的 80% 以上）的生效记录，并排除该写入将要替换的那一条。`candidate` 可携带 `proposalFor`，指出确认后会替换其陈述的那条记录，因此与被推翻规则相悖的捕获是并列等待，而不是覆盖。重复陈述同一条候选内容会增加它的 `evidence` 计数而不是新建版本，因此重复只体现为同一条候选。`isDue(record)` 指出值得摆到人面前的候选：带 `proposalFor` 的，或被陈述多次且人未在同一计数上忽略过它的；`dismiss()` 记录这次忽略，之后再被陈述时该候选重新变为待处理。`stats(view)` 统计当前版本数、全部版本数、两个范围的上限，并报告缓存向量数。写入在 identity 查找之前先归一化 entity、key 与 value：标识符变为 NFKC 小写，空白与下划线收敛为单个短横线，陈述中的空白收敛为一个空格。归一化后仍不合法的 identity 或陈述，会以 `invalid-identifier` 或 `empty-value` 拒绝，而不是被存下。

项目身份在挂载 `ctx.workspaceRegistry` 时取注册表的 `WorkspaceId`，否则取由规范化目录派生的确定性 `pw:<digest>`；linked Git worktree 采用其 `.git` 文件经 `commondir` 指明的仓库的临时身份，因此按工单各自 checkout 的工作读写同一份项目历史，而常规 checkout、其下级目录和 submodule 仍各自独立。记忆域是版本 4，声明 `compatibleVersions: [1, 2, 3]`；情节域是版本 2，声明 `compatibleVersions: [1]`。激活时把 v2 之前的纯路径 scope 映射到解析出的身份，把 v3 之前的记录映射到版本起点，注册表稍后挂载时再把临时身份重映射为它的 id。可见性按身份比较，`path` 只作展示快照。既没有身份也没有路径的 scope 以 `invalid-scope` 拒绝。

### 项目历史

压缩后的工具调用以情节形式存放在 `tomato_memory_episodes` 域中，与显式记录分开。一条情节携带所有者、项目目录、类别（`observation` 或 `summary`）、类型、标题、副标题、叙述、事实、概念、读取与修改的文件、工具、内容指纹，以及来源 Session 与工具调用。`rememberEpisode()` 只追加；同一所有者、同一项目中重复的指纹只更新该记录的时间戳，因此重试的调用不会重复追加。`searchEpisodes()` 按词法覆盖率排序，挂载提供方时按相同 `semanticWeight`、`maxSemanticCandidates` 与 `semanticFloor` 限制混入向量相似度；它可按类别、时间与 `excludeSession` 过滤，并丢弃低于可选 `minScore` 的匹配，因此注入的索引不会重复当前会话自己的刚完成工作，也不会被单个词的巧合带偏。`episodeTimeline()` 以某个锚点为中心返回窗口。`history()` 选取最新的总结以及与会话首条消息最相关的情节，受 `historySummaries` 与 `historyEpisodes` 限制，并接受相同的 `excludeSession` 与 `minScore` 选项。`promote()` 把不同会话中首条事实词集重合达到 `DUPLICATE_COVERAGE` 的观察情节分组，为每组写入一条候选工作区记录（或复用已经陈述该事实、或已占用派生 `project/<concept>-<digest>` 键的记录），并给每个被分组的情节写入 `promotedTo`。被三个不同会话重复的同一条教训会成为一条 `pitfall` constraint 候选，其值注明重复次数；重复只决定主题，不决定权威，规则仍要等人确认后才进入会话。失败观察和只有退出码的事实永远不会提升：失败调用的首条事实是错误信息，不是关于项目的陈述。`rememberEpisode()` 会丢弃生效工作区记录已经陈述的事实，同一条陈述不会同时进入两条轨。早于 `episodeRetentionDays` 的观察情节与早于 `summaryRetentionDays` 的总结情节，在写入后续情节时被剪除，并走同一套冷归档。`forgetEpisode()` 删除一条。没有项目目录的会话没有情节。`rememberEpisode()` 在尺寸检查前用同样的规则归一化情节类型与每个文本字段，因此存下的情节是规范文本，空标题会以 `empty-value` 拒绝。

### 本地向量缓存

挂载 embedding 提供方后，服务在向量被使用前先存下每个计算出的向量：设置 `indexPath` 时存入侧车的 `vectors` 表，否则存入 `tomato_memory_vectors` 域。缓存向量按记录类别与 id 建键，并记录提供方模型、向量长度与记录的更新时间。搜索会读取候选的缓存向量，只发送查询以及向量缺失或过期的记录，并保存新算出的向量。记录内容变化、提供方模型不同或条目损坏时，该记录会重新嵌入。结构化记录与情节共用缓存但保留各自条目。删除记录、遗忘情节或剪除过期情节会删除其向量；`maxEmbeddingVectors` 通过丢弃最旧条目限制缓存大小。缓存读或写失败时搜索仍使用刚算出的向量继续工作，损坏条目会在下一次搜索时替换。向量从不离开本机；只有记录文本与查询会发送给提供方。

### 本地检索索引

设置 `indexPath` 后，服务打开一个本地 SQLite 文件，把每条记录与情节镜像到预切词的 FTS5 索引，并把每个当前对象排入嵌入 outbox。挂载 embedding 提供方后，worker 分批排空队列、把向量存到文本旁，失败批次在 `indexEmbedRetryMs` 后重试；提供方模型变化时丢弃全部向量并重新排队。无法写入重试状态时，服务关闭派生索引，检索继续读取权威域。`recall()` 与 `searchEpisodes()` 从 FTS5 取词法候选、从最近的已存向量取语义候选，因此词法窗口之外的同义表达也能进入排序池。索引缺失、过期或失败时退回内存扫描，激活时若 schema 版本、构建标记、行数或脏标记与域不一致则重建文件。索引是派生数据：删除文件是安全的，下次激活会重建。应用启动提供 `tomatoHomePath`，侧车默认位于 `<harness home>/memory/index-v1.sqlite`。向量排序在扩展加载成功时使用 sqlite-vec 的 `vec_distance_cosine`，否则使用当前范围内的进程内精确余弦。服务默认解析已安装的 `sqlite-vec` 平台包，并把 ASAR 路径改写为它的 unpacked 兄弟路径，因此打包后的 Host 会加载 `app.asar.unpacked` 旁的已签名二进制。

### 失败

`remember()` 以 `MemoryError` 拒绝，代码为 `invalid-identifier`、`invalid-scope`、`empty-value`、`value-too-large`、`workspace-full` 或 `profile-full`。当存储域不符合其 schema，或某个存储键与记录 id 不一致时，激活会被拒绝。没有头部目录、或其目录已不存在的会话只能看到画像记录。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

服务在激活时打开一个 `tomato_memory` 域（版本 4，声明 `compatibleVersions: [1, 2, 3]`，`per-record` 布局，表 `records`），并在释放时关闭；情节域保持版本 2。两个记忆域都按记录分别落盘，因此共享同一 TOMATO 主目录的多个 Host 进程是并列写入，而不是覆盖整份单元文件；两个域都会从旧的 `single` 布局文件做一次性引导，旧文件保持原样。存储域在一个进程内串行化写入，每次写入都在持久化之后才完成。`recall()`、`searchEpisodes()`、`history()` 与每轮快照最多按 `refreshIntervalMs` 向介质询问一次变更令牌，令牌变化时重读对应域，因此另一个 Host 进程写入的记录无需重启即可出现。`remember()` 先取得主目录下的锁文件，在锁内重读记录域再写入，因此两个进程不会同时留下同一个身份的两条生效版本。会话的项目是其不可变头部 `cwd` 解析出的规范化目录，每个会话只解析一次，并映射到 workspace 注册表的 id；没有注册表时使用临时的 `pw:` id。修改工作目录不会把会话移到另一个项目。所有者不做缓存：每次调用 `accessOf()` 时读取 `ctx.get('tomatoAccount')`，因此网关出现或消失时服务不会重新加载。

搜索按视图内每条生效记录包含的查询词比例排序，分词使用 `Intl.Segmenter` 对 entity、key 和 value 进行，再按新近程度排序。调用方可以附加其他说法；通过其他说法命中的得分是字面命中的 0.7 倍。挂载 embedding 提供方且 `semanticWeight` 大于 `0` 时，`recall()` 会嵌入最强的候选与查询，把余弦相似度混入每条得分，并丢弃查询未在词法上命中且相似度低于 `semanticFloor` 的记录。提供方缺失或失败时，词法结果保持不变。`recall()` 是异步的。

| 文件 | 负责 |
|---|---|
| [`src/index.ts`](src/index.ts) | `MemoryService`、限制、所有者与工作区解析 |
| [`src/storage.ts`](src/storage.ts) | 域声明、记录 schema、所有者品牌类型 |
| [`src/retrieval.ts`](src/retrieval.ts) | 分词与排序 |
| [`src/types.ts`](src/types.ts) | 请求类型与快照消息来源 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [记忆工具](../tool-memory/README.zh.md) — 模型工具、`/memory` 与快照注入
- [HTTP embedding 提供方](../embeddings-http/README.zh.md) — 搜索并入排序的向量
- [记忆与目标专注组合包](../muse-bundle/README.zh.md) — 随包发布的开关
- [存储子系统](../../../docs/subsystems/storage.zh.md) — 域、后端与 `ctx.memory` API
- [会话搜索工具](../tool-session-query/README.zh.md) — 读取早先的会话日志，而不是已保存的事实
- [Tomato 网关](../../tomato/gateway/README.zh.md) — `ctx.tomatoAccount` 账号来源

-----

<a id="model-experience"></a>
## 模型体验

间接地，通过 [`@tomato/experimental-tool-memory`](../tool-memory/README.zh.md)，由它负责所有工具、结果和注入的快照。

#### KV 缓存影响

该服务不添加请求内容；缓存影响由消费方负责。

## 已知限制与暂缓工作

<a id="known-limitations-and-deferred-work"></a>

- **单个 Host** — 记录不会跟随账号到其他设备；重命名或移动后的项目目录从没有工作区记忆开始。
- **最近验证的账号** — 所有者是网关最近验证的账号；如果一个 Host 的多个浏览器登录了不同账号，所有者会随每次验证切换。
- **可选的语义能力** — 没有挂载 embedding 提供方时服务保持词法匹配；挂载后，相似度取决于该提供方的模型，并会把记录文本与查询发送给它，而向量留在本地存储域中。
- **结构化关系** — `related()` 按相同的 entity、key 或写入会话连接记录；它不推断语义关联，也不跨越工作区边界。
- **词法提升** — `promote()` 只比较首条事实的词集；换了说法的转述不会被分组，候选记录也要等 `/memory confirm` 后才会进入快照。只有成功的观察会提升，因此重复的错误信息不会变成已保存事实。
- **忽略只对当时的证据计数生效** —— `dismiss()` 让候选在当时的计数上安静，之后再被陈述会重新变为待处理；它不会隐藏另一条陈述，而提案无论是否被忽略都待处理。
- **模型捕捉由消费方负责** — 服务只保存消费方写入的内容；模型可以提出哪些陈述、画像偏好是否立即生效，由 [`@tomato/experimental-tool-memory`](../tool-memory/README.zh.md) 决定。
- **词法重复提示** — `duplicates()` 只比较词集合；换了说法的改写不会被报告，而报告从不阻止或改变写入。
- **跨进程读取滞后一个检查间隔** — 另一个 Host 进程写入的记录，要等 `refreshIntervalMs` 与下一次异步读取之后才进入本进程的快照与检索；不提供变更令牌的后端从不重读。侧车索引合并而非替换行，因此记录已在别处被删除的索引行由读取方过滤，而不是被删除。同一身份的写入在锁文件内串行并重读域，较新版本会立即关闭较旧版本；在 `writeLockTimeoutMs` 内拿不到锁的写入报 `write-busy`。
- **按记录布局只能单向升级** — 早于该布局的版本只读未被改动的 `<unit>.json`，因此降级会看不到升级后写入的全部记录。引导会在旧文件旁留下 `<unit>.migrated.json`；降级前请先备份。
- **保留策略在写入时执行** — 被取代版本在下一次替换同一身份时修剪，过期情节在下一次写入同一项目的情节时修剪；没有周期清扫器，冷归档是只追加的月度 JSONL，没有导入路径。
- **全域扫描** — list、snapshot、related、stats 与 history 仍在内存中过滤全部记录；`indexPath` 把 recall 与情节检索移到 FTS5，其余读取仍由每工作区上限约束。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
