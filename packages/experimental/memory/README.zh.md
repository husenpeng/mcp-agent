---
description: "按账号隔离的画像与工作区记忆记录，供用户和维护者选择、配置或调试后续会话记住的内容。"
kind: "package-reference"
---

# @tomato/experimental-memory

[English](README.md) | 中文

## 概述

让后续会话保留已陈述的偏好、约束、决定和事实。记录保存在 `tomato_memory` 存储域中，从不写入会话日志；只有消费方注入或返回的内容才会到达模型。每条记录属于一个所有者：Host 通过 `ctx.tomatoAccount` 提供账号时是已登录账号，否则是唯一的本地所有者。`profile`（画像）记录描述这个人，会进入该所有者的每个工作区；`workspace` 记录属于所属会话的规范化原始目录。请与 `@tomato/experimental-tool-memory` 一起挂载；单独挂载该服务不会添加任何工具或上下文。

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

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-memory)是所有可接受字段的完整来源。

在**插件**页中，该行的**配置**页可以修改上表的每个字段；该页面来自 Muse 配置包的 [`Muse insights` 客户端](../muse-insights/README.zh.md#configuration)，仅在 Host 提供该条目的设置命名空间时出现。

要在搜索中混入向量相似度，请在本行旁挂载 [`@tomato/experimental-embeddings-http`](../embeddings-http/README.zh.md) 并配置服务与 key。提供方只负责计算向量；本服务把向量保存在本地并复用。没有提供方时服务保持词法匹配。

### 所有者与范围

`accessOf(session)` 回答一个会话现在能使用哪些记录。没有 `ctx.tomatoAccount`（没有网关，或网关未配置 auth_service）时，所有记录都属于本地所有者 `local`。有它时，所有者是已登录账号的 `account:<id>`，每次调用时读取，因此登录或切换账号从下一次操作起生效；无人登录时，`accessOf()` 返回 `sign-in-required`，消费方既不能读也不能写。得到的视图包含该所有者的画像记录；会话有项目目录时，还包含该所有者在这个工作区的记录。`accessFor(path)` 是同一视图的目录版本：没有 Session 的运行（例如 crew run）按它的工作目录解析视图，目录不可用则退回仅有画像记录。本地所有者写入的记录不会出现在账号下，反之亦然。

### 记录与生命周期

一条记录包含 `owner`、`scope`（`profile`，或带规范化路径的 `workspace`）、`kind`（`preference`、`constraint`、`decision` 或 `fact`）、小写短横线格式的 `entity` 和 `key`、非空的 `value`、`status` 以及 `pinned` 标记。`active` 记录会进入搜索结果。`snapshot(view)` 选出消费方无需搜索即可注入的内容：所有生效的画像记录，再加上至多 `maxPinnedRecords` 条置顶的工作区记录。`candidate` 记录等待人工确认；只有生效的工作区记录可以置顶。owner、scope、entity 和 key 都相同的写入会替换之前的记录，并保留其 id 和创建时间。`forget()` 从存储中删除记录。每条记录都会注明写入它的会话；对于引用写入，还会注明所引用的 `user/message`；由提升生成的记录还会注明提供事实的情节。`related(view, id, depth)` 从一条生效记录出发，走到同一 `entity` 的记录、同一会话写入的记录以及共享 `key` 的记录，最多两跳、至多 `maxRecallResults` 条。`duplicates(query)` 找出同一所有者、同一范围和同一 kind 中、与被写入值共享较多词（较多一方的 80% 以上）的生效记录，并排除该写入将要替换的那一条。`stats(view)` 统计视图存储的内容，报告两个范围的上限，并报告缓存向量数。

### 项目历史

压缩后的工具调用以情节形式存放在 `tomato_memory_episodes` 域中，与显式记录分开。一条情节携带所有者、项目目录、类别（`observation` 或 `summary`）、类型、标题、副标题、叙述、事实、概念、读取与修改的文件、工具、内容指纹，以及来源 Session 与工具调用。`rememberEpisode()` 只追加；同一所有者、同一项目中重复的指纹只更新该记录的时间戳，因此重试的调用不会重复追加。`searchEpisodes()` 按词法覆盖率排序，挂载提供方时按相同 `semanticWeight`、`maxSemanticCandidates` 与 `semanticFloor` 限制混入向量相似度；它可按类别与时间过滤。`episodeTimeline()` 以某个锚点为中心返回窗口。`history()` 选取最新的总结以及与会话首条消息最相关的情节，受 `historySummaries` 与 `historyEpisodes` 限制。`promote()` 把不同会话中首条事实词集重合达到 `DUPLICATE_COVERAGE` 的观察情节分组，为每组写入一条候选工作区记录（或复用已经陈述该事实、或已占用派生 `project/<concept>-<digest>` 键的记录），并给每个被分组的情节写入 `promotedTo`。`rememberEpisode()` 会丢弃生效工作区记录已经陈述的事实，同一条陈述不会同时进入两条轨。早于 `episodeRetentionDays` 的情节在写入后续情节时被剪除。`forgetEpisode()` 删除一条。没有项目目录的会话没有情节。

### 本地向量缓存

挂载 embedding 提供方后，服务在向量被使用前把每个计算出的向量存入 `tomato_memory_vectors` 域。缓存向量按记录类别与 id 建键，并记录提供方模型、向量长度与记录的更新时间。搜索会读取候选的缓存向量，只发送查询以及向量缺失或过期的记录，并保存新算出的向量。记录内容变化、提供方模型不同或条目损坏时，该记录会重新嵌入。结构化记录与情节共用缓存但保留各自条目。删除记录、遗忘情节或剪除过期情节会删除其向量；`maxEmbeddingVectors` 通过丢弃最旧条目限制缓存大小。缓存读或写失败时搜索仍使用刚算出的向量继续工作，损坏条目会在下一次搜索时替换。向量从不离开本机；只有记录文本与查询会发送给提供方。

### 失败

`remember()` 以 `MemoryError` 拒绝，代码为 `value-too-large`、`workspace-full` 或 `profile-full`。当存储域不符合其 schema，或某个存储键与记录 id 不一致时，激活会被拒绝。没有头部目录、或其目录已不存在的会话只能看到画像记录。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

服务在激活时打开一个 `tomato_memory` 域（版本 1，`single` 布局，表 `records`），并在释放时关闭。存储域串行化写入，每次写入都在持久化之后才完成。会话的工作区是其不可变头部 `cwd` 的 `realpath`，每个会话只解析一次；修改工作目录不会把会话移到另一个工作区。所有者不做缓存：每次调用 `accessOf()` 时读取 `ctx.get('tomatoAccount')`，因此网关出现或消失时服务不会重新加载。

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
- **词法提升** — `promote()` 只比较首条事实的词集；换了说法的转述不会被分组，候选记录也要等 `/memory confirm` 后才会进入快照。
- **词法重复提示** — `duplicates()` 只比较词集合；换了说法的改写不会被报告，而报告从不阻止或改变写入。
- **没有跨进程写锁** — 共享同一 TOMATO 主目录的两个 Host 进程可能互相覆盖记忆写入，这与所有 JSON 存储域相同。
- **全域扫描** — 每次读取都会在内存中过滤全部记录；每个工作区的上限限制了开销，而不是域的大小。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
