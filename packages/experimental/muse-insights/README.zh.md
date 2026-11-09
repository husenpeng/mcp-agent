---
description: "Muse 记忆包之上的窗口化工作回顾与未完成任务主动提醒：Host 服务、数据保留、辅助模型请求和浏览器界面。"
kind: "package-reference"
---

# @tomato/experimental-muse-insights

[English](README.md) | 中文

## 概述

提供跨会话的私有窗口化工作回顾，并提醒未完成任务。Host 把每次运行的新证据合并进当天保留的回顾，在 `tomato_muse_insights` 中保留最新的未完成任务分析，并通过 `ctx.remote.museInsights` 提供给浏览器。Muse 包把它与记忆和目标聚焦一起挂载。浏览器侧增加回顾提示窗、右侧栏回顾与任务视图、工作项详情页、列出本会话快照与过程的只读**记忆**视图，以及 Muse 配置包各行的配置页。它不写入 Session 事件，也不向模型暴露工具。

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

该行需要提供任意查询后端的 `ctx.sessionQuery`、`ctx.storageDomain` 和 `ctx.llm`。`@tomato/tool-todo` 的 `todos` 投影提供未完成的会话待办；随产品提供的智能体预设会挂载它。可选的 `timer` 服务驱动总结运行：没有它时，Host 仍会响应 `snapshot()`，并在轮询的 Client 发现当天回顾早于总结间隔时运行一次总结。写入配置会按新的节奏重启计时器。

<a id="configuration"></a>
### 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `recapNoticeMinutes` | `240` | 两次回顾弹窗之间的分钟数 |
| `summaryIntervalMinutes` | `120` | 两次总结运行之间的分钟数；每次把新证据合并进当天回顾并刷新未完成任务 |
| `initialDelaySeconds` | `5` | 激活或节奏变化后首次后台运行前的延迟秒数 |
| `lookbackDays` | `7` | 保留为证据的会话创建和回顾本地天数 |
| `maxSessions` | `20` | 每次总结运行读取的会话数，按最新优先 |
| `maxMessageChars` | `700` | 单条消息保留的字符数 |
| `maxMessagesPerSession` | `24` | 每个会话保留的消息数 |
| `maxInputBytes` | `48000` | 准备好的回顾输入的 UTF-8 字节上限 |
| `maxOutputTokens` | `4096` | 单次回顾请求的输出 token 上限 |
| `timeoutMs` | `60000` | 回顾请求的端到端截止时间 |
| `maxTasks` | `30` | 每次分析保留的未完成任务数 |
| `maxRecapDays` | `30` | 每个所有者保留的回顾本地天数 |
| `provider`、`model` | `blueai`、`DeepSeek-V4.1-Flash-1017` | 显式回顾路由；页面会列出 Models 页面已配置的路由 |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-muse-insights)是全部可接受字段的完整来源。所有字段都是 volatile 的：在插件页该行的**配置**页中修改会写入当前 profile 的 `cordis.patch.yml`，运行中的服务不重挂载即采用新值——改动节奏时只重启后台计时器。弹窗间隔随每次快照下发到浏览器，所以保存后无需刷新页面即可改变提示节奏。

回顾路由默认使用部署的 `blueai` 网关模型。两半必须同时提供；页面会阻止只保存其中一半。提供商和模型下拉框列出 `llm-pi-ai` 设置段声明的提供商与模型，若已存路由不在该段中，它仍会保持可选，保存不会悄悄替换它。Host 无法服务的路由会退化为确定性回顾并记录失败。

浏览器侧还会注册**记忆**对话视图：它只从会话自己的事件窗口派生行，因此只展示 Host 已记录的内容，不增加 Host 端点，也不需要额外配置。

同一个浏览器侧还为 Muse 配置包中另外三行提供配置页（它们只声明了 Config schema）：`optional-memory` 的存储与召回上限、`optional-tool-memory` 的快照、搜索扩展与回合捕获、`optional-focus` 的重复失败提醒与审批模式。记忆工具的扩展路由同样从已配置的提供商与模型中选择；两者都留空则跟随调用智能体的模型。每个**配置**页只编辑自己条目的设置命名空间，写入当前 profile 的 `cordis.patch.yml`；某行只有在 Host 提供该命名空间时才出现，若其键已被其他注册占用则保留原有页面。每个上限都由插件自身的 Config 校验，超出范围的值会被 Host 拒绝而不会保存。

### 读取内容

每次总结运行只读取比已保留回顾更新的当日证据：在回看窗口内创建的顶层会话、这些会话自己的事件（绝不读取 fork 继承前缀），以及晚于已保留回顾最新来源时刻的人类消息和助手文本。当天第一次运行读取整日。每次运行都受 `maxSessions`、`maxMessagesPerSession`、`maxMessageChars` 和 `maxInputBytes` 限制。

限长后的请求携带当天到目前为止的回顾以及新会话。模型返回完整更新后的回顾，因此工作项在多次运行之间保持措辞，并在新消息确定结果时更新状态。Host 把新增消息数加到保留总数、按身份合并会话摘要，并保留最新的模型交换。由于每次运行只看到新证据，长日子的输入保持有界，而不是反复读取并截断整天。

未完成任务分析读取这些会话的 `todos` 投影：每个 `pending` 和 `in_progress` 项都会成为任务；`completed` 项会抑制规范化文本相同的回顾任务。当最近一份回顾位于回看窗口内时，它还会加入该回顾的 `openTasks`，因此模型提出的后续事项即使没有待办列表也会保留。

### 所有者与保留

在 `ctx.tomatoAccount` 指定账号时，记录属于已登录账号；Host 不使用账号时，记录属于 `local`。无人登录时，`snapshot()` 返回 `available: false`，Host 既不读取也不写入回顾记录；该身份词汇与 [`@tomato/experimental-memory`](../memory/README.zh.md) 一致。

每个所有者的每个本地日期保留一份回顾；每次运行替换当天的版本，每次写入后会清理超出 `maxRecapDays` 的日期。存储保持格式版本 1，其读取器接受两种已存工作项形式：旧工作项的标题作为问题、详情作为方案，当前工作项保留问题、结论、方案和会话。每个所有者只保留最新一次分析。删除存储记录会删除对应回顾或分析；此前的浏览器提示状态仍留在浏览器本地。

### 失败

回顾模型调用失败、超时或返回格式错误的 JSON 时，不会替换同一天已有的回顾；没有已有回顾时，Host 会保存确定性回顾并记录失败。缺少路由也会生成确定性回顾。没有新文本的运行不写入任何内容。存储记录的键与其所有者和日期不一致，或记录未通过模式校验时，会拒绝打开存储域。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节——点击展开</summary>

Host 服务在激活时打开一个 `tomato_muse_insights` 存储域（版本 1，`single` 布局，表 `recaps` 和 `analyses`），并在已接受的任务全部结算后关闭。后台运行随 fiber 释放停止；同一个中止信号会取消语料读取和模型流，存储写入跟随运行的提交点。

辅助请求不属于任何 Session，但仍保留可重建的模型可见输入：存储的回顾携带精确的系统指令、框定后的用户输入、输出上限、路由和已接受响应文本。由于一次运行会发送当天此前的回顾和仅新会话，存储的输入就是模型为该版本看到的完整材料。浏览器只收到面向 Client 的回顾、任务列表和状态标记，绝不会收到这些记录。

| 文件 | 负责 |
|---|---|
| [`src/index.ts`](src/index.ts) | Remote 服务、策略校验、后台节奏、所有者解析、保留、运行串行化和窗口合并 |
| [`src/collect.ts`](src/collect.ts) | 从 `ctx.sessionQuery` 进行有上限的当日窗口和待办读取 |
| [`src/summarize.ts`](src/summarize.ts) | 提示词、此前回顾的框定、输入截断、请求执行、JSON 解析和确定性回退 |
| [`src/analyze.ts`](src/analyze.ts) | 任务合并、去重、已完成项抑制和排序 |
| [`src/domain.ts`](src/domain.ts) | 存储域和记录模式 |
| [`src/client/index.ts`](src/client/index.ts) | Remote 挂载、两个页面类型、全帧提示窗和路由目录 |
| [`src/client/controller.ts`](src/client/controller.ts) | 快照轮询、弹窗策略、显式刷新和右侧栏导航 |
| [`src/client/route-catalog.ts`](src/client/route-catalog.ts) | 从 `llm-pi-ai` 设置段读取的提供商与模型选项 |
| [`src/client/WorkItemTab.tsx`](src/client/WorkItemTab.tsx) | 单个工作项的详情页，以及让它保持最新的回顾查找 |
| [`src/client/work-item-bindings.ts`](src/client/work-item-bindings.ts) | 每个详情页显示过的工作项，使重新加载的标签页仍指向同一项 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [记忆服务](../memory/README.zh.md)——本能力补充的所有者词汇、个人资料和工作区记录
- [记忆与目标聚焦包](../muse-bundle/README.zh.md)——挂载本行的随产品开关
- [会话查询](../../session-query/session-query/README.zh.md)——实时优先读取、观察和投影
- [会话投影](../../session/session-projection/README.zh.md)——分析读取的 `todos` 值
- [待办工具](../../todo/tool-todo/README.zh.md)——模型写入任务列表的方式
- [模型选择](../../client/ui-model-selection/README.zh.md)——声明本页所提供路由的 Models 页面
- [Typert Remote 方法](../../typert/protocol/README.zh.md)——`ctx.remote.museInsights` 背后的线路契约

-----

<a id="model-experience"></a>
## 模型体验

### 辅助回顾请求

#### 模型看到什么

每次发现新证据的总结运行会产生一次辅助请求。系统指令定义回顾 JSON 对象，以及如何把新会话并入当天此前的回顾。用户消息包含限长 JSON：`previousRecap`（当天当前回顾，首次运行时缺省）和 `newSessions`（每项带 id、标题和用户与助手文本）。返回的每个工作项写明一个问题、得到的结论、解决方式，以及它来自哪些会话 id。请求不包含工具，除这些 id 外也不包含 Session 身份。

#### Token 影响

先裁剪新会话消息，再裁剪此前回顾的工作项细节，最后输入受 `maxInputBytes` 限制，输出受 `maxOutputTokens` 限制。该请求独立于每次会话请求，不会向智能体历史或工具结果添加文本。

#### KV 缓存影响

不会使任何会话前缀失效。辅助请求是独立分派，因此复用取决于提供方的缓存，以及此前回顾和新证据在两次运行之间有多少保持相同。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- **默认路由与部署绑定**——默认的 `blueai` / `DeepSeek-V4.1-Flash-1017` 组合假定部署配置了该网关。没有该路由的 profile 会退化为确定性回顾，直到选择另一个路由。
- **每天一个版本**——每次运行替换当天回顾；更早的版本及其精确模型交换不会保留。
- **证据不变时弹窗不变**——即使某次运行没有新增证据，弹窗间隔仍会重复最新回顾。
- **会话创建窗口**——在回看窗口之前创建的长期会话即使今天仍在活动也不贡献内容。
- **仅文本证据**——工具调用、文件差异和图片内容不会被总结；只通过这些调用可见的工作可能被遗漏。
- **没有模型就没有结论**——确定性回顾以会话标题命名工作项，并把该会话的最后一条消息作为方案；由于没有人分析该会话，它不给出结论。
- **无跨设备同步**——记录保存在一台 Host 上，提示状态保存在一个浏览器中。
- **不是 Session 日志记录**——辅助请求可从存储的回顾重建，但不能从 Session 历史或 `sessionQuery` 重建。
- **基于文本匹配的抑制**——只有规范化文本相同时，已完成待办才会抑制回顾任务。
- **无模型路由预检**——当前 Host 无法服务的显式路由会退化为确定性回顾并记录失败。
- **配置页按组合包行注册**——各页注册在 `@tomato/experimental-muse-bundle#<行 id>` 下，因此用其他行 id 直接挂载某行的 profile 需在 `cordis.patch.yml` 中直接修改其字段。
- **行配置页需要该浏览器侧**——记忆、记忆工具和目标专注的配置页随本浏览器侧提供；只挂载这些行而不启用 Muse 配置包的 profile 需自行组合页面。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者上下文——点击展开</summary>

无。

</details>