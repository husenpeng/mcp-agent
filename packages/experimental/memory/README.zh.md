---
description: "按工作区隔离的跨会话记忆记录，供用户和维护者选择、配置或调试后续会话记住的内容。"
kind: "package-reference"
---

# @tomato/experimental-memory

[English](README.md) | 中文

## 概述

让同一项目目录下的后续会话保留已陈述的偏好、约束、决定和事实。记录保存在 `tomato_memory` 存储域中，从不写入会话日志；只有消费方注入或返回的内容才会到达模型。每条记录按所属会话的规范化原始目录隔离，其他目录看不到它。写入相同的 entity 和 key 会替换之前的值。请与 `@tomato/experimental-tool-memory` 一起挂载；单独挂载该服务不会添加任何工具或上下文。

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

当同一项目中的人们在多个会话里反复给出相同的长期指令（例如品牌语气或外联规则）时选择它。如果每个会话都应在没有早先上下文的情况下开始，或记忆必须跨项目、跨设备跟随一个人，则不要使用：范围是单个 Host 上的一个项目目录。

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
| `maxRecordsPerWorkspace` | `1000` | 每个工作区保存的记录数（含候选） |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-memory)是所有可接受字段的完整来源。

### 记录与生命周期

一条记录包含 `kind`（`preference`、`constraint`、`decision` 或 `fact`）、小写短横线格式的 `entity` 和 `key`、非空的 `value`、`status` 以及 `pinned` 标记。`active` 记录会进入搜索结果；置顶时还会进入注入的快照。`candidate` 记录等待人工确认；只有生效的记录可以置顶。`remember()` 替换记录时保留原有 id 和创建时间。`forget()` 从存储中删除记录。每条记录都会注明写入它的会话；对于引用写入，还会注明所引用的 `user/message`。

### 失败

`remember()` 以 `MemoryError` 拒绝，代码为 `value-too-large` 或 `workspace-full`。当存储域不符合其 schema，或某个存储键与记录 id 不一致时，激活会被拒绝。没有头部目录、或其目录已不存在的会话没有工作区；消费方将其视为没有记忆。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

服务在激活时打开一个 `tomato_memory` 域（版本 1，`single` 布局，表 `records`），并在释放时关闭。存储域串行化写入，每次写入都在持久化之后才完成。会话的工作区是其不可变头部 `cwd` 的 `realpath`，每个会话只解析一次；修改工作目录不会把会话移到另一个工作区。

搜索按每条生效记录包含的查询词比例排序，分词使用 `Intl.Segmenter` 对 entity、key 和 value 进行，再按新近程度排序。匹配是词法匹配，没有语义相似度。

| 文件 | 负责 |
|---|---|
| [`src/index.ts`](src/index.ts) | `MemoryService`、限制、工作区解析 |
| [`src/storage.ts`](src/storage.ts) | 域声明与记录 schema |
| [`src/retrieval.ts`](src/retrieval.ts) | 分词与排序 |
| [`src/types.ts`](src/types.ts) | 请求类型与快照消息来源 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [记忆工具](../tool-memory/README.zh.md) — 模型工具、`/memory` 与置顶注入
- [记忆与目标专注组合包](../muse-bundle/README.zh.md) — 随包发布的开关
- [存储子系统](../../../docs/subsystems/storage.zh.md) — 域、后端与 `ctx.memory` API
- [会话搜索工具](../tool-session-query/README.zh.md) — 读取早先的会话日志，而不是已保存的事实

-----

<a id="model-experience"></a>
## 模型体验

间接地，通过 [`@tomato/experimental-tool-memory`](../tool-memory/README.zh.md)，由它负责所有工具、结果和注入的快照。

#### KV 缓存影响

该服务不添加请求内容；缓存影响由消费方负责。

## 已知限制与暂缓工作

<a id="known-limitations-and-deferred-work"></a>

- **单个 Host、单个目录** — 记录不会跟随登录账号、其他设备或其他项目目录；重命名或移动后的项目目录从没有记忆开始。
- **词法搜索** — 查询必须与记录有相同的词；同义词和改写不会匹配。
- **没有跨进程写锁** — 共享同一 TOMATO 主目录的两个 Host 进程可能互相覆盖记忆写入，这与所有 JSON 存储域相同。
- **全域扫描** — 每次读取都会在内存中过滤全部记录；每个工作区的上限限制了开销，而不是域的大小。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
