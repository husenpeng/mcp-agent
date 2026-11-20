---
description: "超级智能体的工作词汇：触发器、会话串、授权状、工单，以及每个工单等待的阶段。"
kind: "package-reference"
---

# @tomato/superagent

[English](README.md) | 中文

## 概述

为请求的工作命名，判定它能否开始，并推进到可复核结果。来源把事件翻译成按 `Thread` 分组的 `Trigger`——机器人面与应用面共用同一条 intake 判定路径；受理检查行动者与称呼方式；接受记录 `Mandate`；`Ticket` 从最新 `AssignmentReport` 推导阶段。人可以打断正在执行的运行，并用新的上下文继续同一张工单。内部审查与合并检查阻止未就绪成果到达人。本包不发起模型请求，不自带传输或持久化实现。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

写来源、执行器或存储工单的引擎时读这套词汇。这里没有任何插件被挂载：本包导出类型，以及任何调用方都能直接使用的阶段判定函数。

```ts
import { InMemoryStore, accept, assign, intake, report, ticketStage } from '@tomato/superagent'
import type { Mandate, Trigger } from '@tomato/superagent'

declare const trigger: Trigger
declare const id: Parameters<typeof accept>[1]['id']
declare const subject: string
declare const mandate: Mandate
declare const thread: Parameters<typeof accept>[1]['thread']
declare const worktree: string

const store = new InMemoryStore()
intake(store, trigger)
const ticket = accept(store, { id, subject, mandate, supervisor: 'owner-1', thread })
const assignment = assign(store, ticket.id, { session: 'worker-1', directory: worktree })
report(store, ticket.id, assignment.id, { state: 'ready', summary: 'PR open' })
ticketStage(store.ticket(ticket.id)!.ticket).stage
```

`Trigger` 只带来源真正知道的东西：该来源命名空间下的行动者、是否由人书写、如何称呼了智能体、所属的会话串、回复地址，以及引擎从不解读的来源自有 `meta`。

引擎通过 `SuperagentStore` 推进状态：`intake` 只存一次触发器并交给订阅了相关会话串的工单，`accept` 建立工单并订阅它来自的会话串，`assign` 绑定一次执行，`report` 记录这次执行的说法，`stop` 或 `end` 收尾。`InMemoryStore` 是参考实现，持久化提供方复现同样的四个操作。

执行者用文本回报：一轮结束时写一行 `REPORT: <state>`，`parseReport` 把它变成 assignment 报告。没有这一行就按 `waiting` 处理——它只是让出，不宣称结果，因此释放工单名额，后续消息可以开启下一轮；只有报 `progress` 的执行继续占位。

租约还带 `cancel()`：人停下这次执行时把它打断，执行报告 `dropped`，工单保持打开等下一条消息。`runAssignment` 接受 `context`——这个人累积的消息，`briefFor` 把它放进简报，`workerBriefText` 把它渲染为最新指示——以及 `onLease` 钩子，在驱动执行之前把租约交给调用方，让打断能够触及它。

`appTrigger` 把敲进部署自有 GUI 的请求规范化：`app` 来源上的一条直接的人类触发器，没有回复通道。`decideTriggers` 对已 intake 的触发器跑受理与接受的判定，因此机器人轮询（`runCycle`）与应用提交共用它；存储的 `triggers()` 读出全部已存事件，供详情视图使用。

在工单出现之前，可选的 `Supervisor` 先判断请求：它每轮以一行 `DECISION: <investigate|change|release> <这项工作是什么>` 表示一份工作，或用 `DECISION: reject <原因>` 拒绝。`runCycle` 按计划逐份开单，被拒绝的请求连同原因记录；没有判断者时，就按请求文本开一张单。

工单的工作经两个端口推进：`Worker` 租出一次执行，引擎把它记为一条 assignment；`Reviewer` 在任何⼈看到之前读这份就绪结果。`runAssignment` 负责租用、登记、驱动与回报——抛错的执行会把自己报成 failed 而不是逃逸；`runReview` 记录结论并返回判定，因此阻塞性的 `p0` 发现会把工作退回，直到轮次用尽。

`pollFeishu` 从 `BotGateway` 读一页入站事件并逐个交给引擎；`runCycle` 在其上加受理与接受，因此一次调用就完成“读服务、开新工单、让已有工单继续、或记录拒绝理由”。`admit` 是确定性判定：只有策略名单内的人发出的、称呼了智能体的消息才能起活，每次拒绝都带原因。`review` 在还有 `p0` 发现时把成果挡在人之外，并退回实现者直到轮次用尽。`mergeReadiness` 列出仍挡住变更的原因：草稿、检查未完成或失败、冲突、或阻塞性发现。合并始终需要人的批准，而这不是“就绪”的阻塞项。`mergeChange` 把这个答案变成一次合并：有阻塞项时拒绝，没有明确批准时拒绝，之后才请 `MergeExecutor` 执行合并并回报提交或未合并的原因。

`Ticket` 持有自己的状态而不跟随执行器会话，因此同一份工作可以交接、恢复，或经历多次执行。`Mandate` 不可变：更大的请求需要新工单。工单还记录接受它的 `supervisor` 会话；`createTicketSessionAccess` 把它变成部署发布的跨会话读取授权，于是主管能读自己工单跑过的会话，别的读不到。

-----

<a id="dev-note"></a>
## 开发备注

<details>
<summary>实现内部 —— 点击展开</summary>

`ticketStage` 只读传入的工单。它依次检查的行：工单已结束；报告为 ready；存在结构化的提问；报告为 blocked 或 failed 且无人回应；执行尚未开始或已经结束；其余情况视为执行进行中。`waitsForPerson` 回答更窄的问题——工单此刻是否在等人；`canStart` 回答新的执行能否立刻接手；被人停下的工单永不重启。

标识都是编译期品牌，`TicketId` 不能传给需要 `ThreadId` 的位置。本包不持有运行时身份、存储或 I/O；[src](src) 即完整契约。

</details>

-----

<a id="model-experience"></a>
## 模型体验

无：这套词汇本身不追加任何提示词、工具或上下文。

#### KV Cache 影响

读取这些类型不改变任何模型请求；提示词段落与工具 schema 由引擎、来源与执行器各自拥有。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **没有具体的执行器与审查者** —— `Worker` 与 `Reviewer` 是端口；实现它们的进程内智能体执行器与审查会话尚未建立。
- **没有持久化存储** —— 目前只有 `InMemoryStore`；存储后端是独立包。
- **没有持久化规则** —— 重放、崩溃恢复，以及已存触发器如何保持会话归属，由将来的提供方决定，不在本包内。