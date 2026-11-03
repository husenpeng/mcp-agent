---
description: "Muse 记忆包之上的每日工作回顾与未完成任务主动提醒：Host 服务、数据保留、辅助模型请求和浏览器界面。"
kind: "package-reference"
---

# @tomato/experimental-muse-insights

[English](README.md) | 中文

## 概述

为使用者提供跨会话的私有每日工作回顾，并定期提醒未完成任务。Host 服务读取当日顶层会话和当前 `todos` 投影，在 `tomato_muse_insights` 中按所有者和本地日期保留一份回顾，并保留该所有者最新的任务分析结果，再通过 `ctx.remote.museInsights` 提供给浏览器。Muse 包把它与记忆和目标聚焦一起挂载；浏览器侧增加一个全帧提示窗和一个右侧栏页面，页面包含回顾与未完成任务两个视图。该能力不写入任何 Session 事件，也不向模型暴露工具。

## 目录

- [使用本包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [维护者说明](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在“插件”中打开 **记忆与目标聚焦**。Muse 包会插入 Host 行 `optional-muse-insights`，并通过同一行加载本包的浏览器侧。配置也可以直接声明 `@tomato/experimental-muse-insights`。

该行需要提供任意查询后端的 `ctx.sessionQuery`、`ctx.storageDomain` 和 `ctx.llm`。`@tomato/tool-todo` 的 `todos` 投影提供未完成的会话待办；随产品提供的智能体预设会挂载它。可选的 `timer` 服务驱动后台运行：没有它时，Host 仍会响应 `snapshot()` 并在 `refresh()` 时运行两个生成器。

<a id="configuration"></a>
### 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `recapIntervalMinutes` | `30` | 两次每日回顾尝试之间的分钟数 |
| `taskIntervalMinutes` | `15` | 两次未完成任务分析之间的分钟数 |
| `initialDelaySeconds` | `5` | 首次后台尝试前的延迟秒数 |
| `lookbackDays` | `7` | 保留为证据的会话创建和回顾本地天数 |
| `maxSessions` | `20` | 每次回顾或分析读取的会话数，按最新优先 |
| `maxMessageChars` | `700` | 单条消息保留的字符数 |
| `maxMessagesPerSession` | `24` | 每个会话保留的消息数 |
| `maxInputBytes` | `48000` | 准备好的回顾输入的 UTF-8 字节上限 |
| `maxOutputTokens` | `800` | 单次回顾请求的输出 token 上限 |
| `timeoutMs` | `60000` | 回顾请求的端到端截止时间 |
| `maxTasks` | `30` | 每次分析保留的未完成任务数 |
| `maxRecapDays` | `30` | 每个所有者保留的回顾本地天数 |
| `provider`、`model` | 缺省 | 显式回顾路由；必须同时提供，否则使用最近一次会话请求路由 |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-muse-insights)是全部可接受字段的完整来源。

### 读取内容

每日回顾覆盖在回看窗口内创建的顶层会话。它只读取每个会话自己的事件（绝不读取 fork 继承前缀），保留 Host 本地日期内的直接人类消息和助手文本，并受 `maxSessions`、`maxMessagesPerSession` 和 `maxMessageChars` 限制。部署未指定路由时，它从这些会话中捕获最新的 `request/header` 路由。子智能体会话和 fork 种子不贡献文本。

未完成任务分析读取这些会话的 `todos` 投影：每个 `pending` 和 `in_progress` 项都会成为任务；`completed` 项会抑制规范化文本相同的回顾任务。当最近一份回顾位于回看窗口内时，它还会加入该回顾的 `openTasks`，因此模型提出的后续事项即使没有待办列表也会保留。

### 所有者与保留

在 `ctx.tomatoAccount` 指定账号时，记录属于已登录账号；Host 不使用账号时，记录属于 `local`。无人登录时，`snapshot()` 返回 `available: false`，Host 既不读取也不写入回顾记录；该身份词汇与 [`@tomato/experimental-memory`](../memory/README.zh.md) 一致。

每个所有者的每个本地日期保留一份回顾，每次写入后会清理超出 `maxRecapDays` 的日期。每个所有者只保留最新一次分析。删除存储记录会删除对应回顾或分析；此前的浏览器提示状态仍留在浏览器本地。

### 失败

回顾模型调用失败、超时或返回格式错误的 JSON 时，不会替换同一天已有的回顾；没有已有回顾时，Host 会保存基于会话的确定性回顾并记录失败。缺少路由也会生成确定性回顾。存储记录的键与其所有者和日期不一致，或记录未通过模式校验时，会拒绝打开存储域。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节——点击展开</summary>

Host 服务在激活时打开一个 `tomato_muse_insights` 存储域（版本 1，`single` 布局，表 `recaps` 和 `analyses`），并在已接受的任务全部结算后关闭。后台运行随 fiber 释放停止；同一个中止信号会取消语料读取和模型流，存储写入跟随运行的提交点。

辅助请求不属于任何 Session，但仍保留可重建的模型可见输入：存储的回顾携带精确的系统指令、框定后的用户输入、输出上限、路由和已接受响应文本。浏览器只收到面向 Client 的回顾、任务列表和状态标记，绝不会收到这些记录。

| 文件 | 负责 |
|---|---|
| [`src/index.ts`](src/index.ts) | Remote 服务、策略校验、后台节奏、所有者解析、保留和运行串行化 |
| [`src/collect.ts`](src/collect.ts) | 从 `ctx.sessionQuery` 进行有上限的当日和待办读取 |
| [`src/summarize.ts`](src/summarize.ts) | 提示词、输入截断、请求执行、JSON 解析和确定性回退 |
| [`src/analyze.ts`](src/analyze.ts) | 任务合并、去重、已完成项抑制和排序 |
| [`src/domain.ts`](src/domain.ts) | 存储域和记录模式 |
| [`src/client/index.ts`](src/client/index.ts) | Remote 挂载、页面类型和全帧提示窗 |
| [`src/client/controller.ts`](src/client/controller.ts) | 快照轮询、提示策略、显式刷新和右侧栏导航 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [记忆服务](../memory/README.zh.md)——本能力补充的所有者词汇、个人资料和工作区记录
- [记忆与目标聚焦包](../muse-bundle/README.zh.md)——挂载本行的随产品开关
- [会话查询](../../session-query/session-query/README.zh.md)——实时优先读取、观察和投影
- [会话投影](../../session/session-projection/README.zh.md)——分析读取的 `todos` 值
- [待办工具](../../todo/tool-todo/README.zh.md)——模型写入任务列表的方式
- [Typert Remote 方法](../../typert/protocol/README.zh.md)——`ctx.remote.museInsights` 背后的线路契约

-----

<a id="model-experience"></a>
## 模型体验

### 辅助每日回顾请求

#### 模型看到什么

每次被接受的回顾生成会产生一次辅助请求。系统指令定义回顾 JSON 对象；用户消息包含当日会话标题、用户文本和助手文本所组成的、经过框定和限长的 JSON。请求不包含工具，也不包含 Session 身份。

#### Token 影响

输入受 `maxInputBytes` 限制，输出受 `maxOutputTokens` 限制。该请求独立于每次会话请求，不会向智能体历史或工具结果添加文本。

#### KV 缓存影响

不会使任何会话前缀失效。辅助请求是独立分派，因此复用取决于提供方的缓存以及两次生成之间有多少受限输入保持相同。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- **会话创建窗口**——在回看窗口之前创建的长期会话即使今天仍在活动也不贡献内容。
- **仅文本证据**——工具调用、文件差异和图片内容不会被总结；只通过这些调用可见的工作可能被遗漏。
- **无跨设备同步**——记录保存在一台 Host 上，提示状态保存在一个浏览器中。
- **不是 Session 日志记录**——辅助请求可从存储的回顾重建，但不能从 Session 历史或 `sessionQuery` 重建。
- **基于文本匹配的抑制**——只有规范化文本相同时，已完成待办才会抑制回顾任务。
- **无模型路由预检**——当前 Host 无法服务的显式路由会退化为确定性回顾并记录失败。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者上下文——点击展开</summary>

无。

</details>
