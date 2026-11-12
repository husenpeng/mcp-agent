---
description: "Robot Room 的词汇与纯策略：群聊规格、A2A v2 信封、准入、循环守卫、预算与成员上下文。"
kind: "package-reference"
---
# Robot Room

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-room` 拥有持久群聊的词汇与纯策略：带已发布 Rbot 成员的版本化群聊规格、成员之间交换的 `tomato-a2a/2` 信封、决定一条消息被投递还是被拒绝的准入管线、限制深度/轮次/消息/token/墙钟/速率/待回复/重复/乒乓/原地打转的守卫、单轮与单回合预算，以及成员一次唤醒所读的增量上下文。它不持有传输、持久化或执行；`@tomato/experimental-robot-room-local` 提供这些。

这里所有函数背后的不变量：**成员模型只能提议一条消息；是否投递、唤醒谁、这次唤醒能花多少，由宿主决定。**

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

使用规格助手（`emptyRoomSpec`、`validateRoomSpec`、`requireRoomSpec`、`ROOM_PRESETS`）、A2A v2 协议（`createEnvelopeV2`、`roomSignature`、`clampText`）、准入与守卫（`RoomGuard`、`routeHuman`、`wakeMatches`、`similarity`）、预算算术（`grantFor`、`preflight`、`softLimitCrossed`）以及上下文构建（`buildMemberInput`、`visibleTo`、`unreadCount`）。`Rooms` 服务定义是 provider 实现的接缝。

### 群聊规格

一个群聊声明章程、二到十二个成员、每个成员的已发布 Rbot 修订、角色、唤醒规则、A2A 权限、单轮与日额预算、可选模型覆盖，以及群聊的路由、守卫、预算与上下文上限。校验器一次报告全部字段问题。成员在群聊级的 A2A 权限只能收紧机器人自身的 `position.callers` 与 `a2a` 限制；provider 取交集。

### A2A v2

`createEnvelopeV2` 构建不可变信封，携带 `request`、`delegate`、`handoff`、`inform` 或 `reply`，一到 `routing.maxFanout` 个接收方，最多 4000 字符的任务、最多 8000 字符的上下文、按引用传递的交付物、因果深度、token 授予、截止时间与归一化签名。`inform` 不唤醒接收方；`reply` 只唤醒正在等它的发送方。投递是异步的：发送方的工具返回受理结果，而不是对方的回答。

### 准入与守卫

`RoomGuard.admit` 在任何计数变化之前跑完整管线：成员与接收方存在、熔断状态、ACL 与接受的 intent、深度、扇出、回合轮次/消息/token/时间、成员速率、接收方待回复上限、重复签名、对子乒乓与授予衰减。拒绝是带一句话说明的类型化拒绝码；成功准入会消耗速率桶，记录消息、深度、签名、对子交替与待回复。`recordTurn` 累加实测 token 与文本，在最近窗口近乎相同时触发 `no-progress`，`check` 执行墙钟限制。熔断器走 `closed → open → half-open → closed`；`resume` 进入半开，`settle` 关闭，`relaxOnce` 把当前回合的上限提高 50% 而不改规格。

### 预算与授予

`grantFor` 让一个请求最多拿到发送方本回合剩余预算的一半，且不超过发送方的单轮输入上限，因此每层委派拿到的额度严格小于上一层。`preflight` 在已知提示加预期输出无法放进单轮、回合或成员日额时拒绝唤醒。adapter 报告实测用量时，实测值替代估算值。

### 成员上下文

`buildMemberInput` 为每次唤醒生成一条有界用户消息：窗口之外未读消息的确定性摘要、最近窗口的原始消息、唤醒原因及其触发文本，以及可用的群聊工具。私聊 A2A 只对发送方与接收方可见；所有消息对操作者可见。`unreadCount` 与 `visibleTo` 支撑 provider 的调度和 UI 的角标。

<a id="model-experience"></a>
## 模型体验

### 成员输入

#### 模型看到什么

provider 投递一条由 `buildMemberInput` 构建的用户消息：较早未读消息的摘要、配置窗口内的原始消息（逐条截断）、唤醒原因与触发文本，以及结尾一行点名 `room_post`、`room_ask`、`room_reply` 与 `room_pass`。成员既未发送也未接收的私聊 A2A 不会出现。

#### Token 影响

受 `context.window` 条原始消息、每条 `context.messageChars`、摘要 `context.summaryChars` 与唤醒消息 `context.triggerChars` 限制；预检会拒绝无法放进单轮、回合与成员日额的唤醒。

#### KV Cache 影响

每个成员 Session 只追加：system prompt 与更早历史保持稳定，每次唤醒追加一条消息。新的群聊修订或改变的唤醒原因不会重写更早的轮次。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与后续工作

- **只有策略**——本包不做投递、持久化、调度或模型调用；`@tomato/experimental-robot-room-local` 拥有这些，并且必须记录每一条已投递消息。
- **确定性摘要**——`fallbackSummary` 保留消息头与首行，不调用摘要模型；provider 可以用模型替换，但必须保持同样的字符上限。
- **乒乓检测是成对的**——乒乓只统计一个无序对子的交替次数；三个及以上成员的环只受深度、轮次与无进展窗口约束。
- **没有分词器**——`estimateTokens` 是在 adapter 未报告用量时使用的稳定长度启发式；只有实测用量才让预算精确。

<a id="dev-note"></a>
### 开发备注

纯函数，无 I/O、无定时器、无全局状态；`RoomGuard` 每个群聊一个实例，计数在每次回合开始时重置，熔断器、速率桶与成员日额跨回合保留。测试使用注入的时钟，因此不依赖真实时间。