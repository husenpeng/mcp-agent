---
description: "离线记忆整合（dreaming）：切分已存的记忆记录与会话历史，每个分块发一次有界模型请求得到合并/提案/提升计划并按其模式应用，供运行或配置 dreaming 的维护者阅读。"
kind: "package-reference"
---

# @tomato/memory-dream

[English](README.md) | 中文

## 概述

整合记忆服务已存的内容：收集上次运行以来的情节窗口、拼装 Session 总结链、构建合并、提案与提升目标的工作表，然后每个分块发一次模型调用，取得经校验的计划并按配置的模式应用。它依赖 `@tomato/experimental-memory` 与一条模型路由，默认关闭，游标保存在 `tomato_memory_dreams` 存储域中。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)
-----

<a id="use-this-package"></a>
## 使用本包

在 `@tomato/experimental-memory` 之后启用可选的 `@tomato/memory-dream` 插件。Muse bundle 会挂载它，其他组合需显式添加。`/memory dream status` 报告是否有一次运行到期，`/memory dream run` 启动一次；这两条命令来自 `@tomato/experimental-tool-memory`，它可选地查询该服务。

### 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `false` | 是否允许自动运行 |
| `applyMode` | `report` | `report` 只记录将要做什么，`candidates` 把提案写成候选，`full` 直接合并与提升 |
| `provider` / `model` | 无 | 显式路由；必须成对提供。缺省时读取触发 Session 的最后一次请求头 |
| `maxTokens` | `1500` | 每次调用的输出上限 |
| `timeoutMs` | `30000` | 每次调用的截止时间 |
| `maxTargetsPerChunk` | `12` | 一个分块包含的工作表目标数 |
| `maxPlanOps` | `12` | 一次回复中接受的计划操作数 |
| `maxChunksPerRun` | `1` | 一次运行处理的分块数 |
| `minIntervalHours` | `24` | 两次运行之间的间隔小时数 |
| `minNewEpisodes` | `8` | 判定到期所需的新情节数 |
| `maxChainChars` | `10000` | 总结链超过该长度即视为需要回填的空洞 |

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 —— 点击展开</summary>

一次运行从 dream 域的 global 槽读取游标，收集 `watermark` 之后窗口内的 Session，并拼装其总结链。回填空洞与整合目标工作表由记忆服务的记录与情节派生。目标被切分成块，每个分块成为一次请求，其回复被解析为计划；引用了该分块未携带的 id 的操作会被丢弃，计划按 `applyMode` 应用。游标、目标摘要与运行时间只在运行结束后推进，因此中断的运行会从同一分块继续。

</details>

-----

<a id="model-experience"></a>
## 模型体验

### Dream 请求

#### What the model sees

每个处理的分块一次请求，携带固定的整合指令、渲染后的目标及其记录或情节，以及 Session 总结链。回复是 JSON 计划，其操作引用该分块携带的 id。确切的请求、回复、路由与结果都以 `plugin:memory-dream/run` 记录，因此一次运行看到的输入可从 Session 日志重建。

#### Token effect

独立于回合：每个分块一次请求，受 `maxTargetsPerChunk`、`maxTokens` 与 `maxChunksPerRun` 限制；不进入对话。

#### KV Cache effect

无；每个分块是独立请求，共享的 system 文本是一次运行内唯一稳定的前缀。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 运行需要一条模型路由；既没有请求头又没有配置 `provider`/`model` 的 Session 会跳过运行，而不是猜测路由。
- 回填检测从不撰写缺失的总结：空洞只被报告，总结内容仍来自 capture 路径。
- `maxChunksPerRun` 默认为 `1`，较大的工作表需要多次运行才能覆盖完。
- 自动调度依赖记忆工具调用 `isDue()`；没有 `@tomato/experimental-tool-memory` 的组合没有自动触发。

### 开发备注

<a id="dev-note"></a>

<details>
<summary>维护者工作上下文 —— 点击展开</summary>

无。

</details>
