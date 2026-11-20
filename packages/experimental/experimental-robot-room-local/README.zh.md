---
description: "Storage-backed Robot Room provider：持久群聊日志、有界唤醒调度、持久成员 Session 与成员工具。"
kind: "package-reference"
---
# Robot Room Local

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-room-local` 在 `tomato_room` 存储域上实现 `ctx.rooms` 服务。它持久化群聊、不可变修订、可见消息日志、回合、读取游标、批准与守卫快照；路由人类消息；准入 A2A 提议；按群聊 floor 调度成员唤醒；按需为每个成员创建一个持久 Agent Session；并注册五个成员工具（`room_post`、`room_ask`、`room_reply`、`room_read`、`room_pass`）。

provider 强制执行本包的不变量：**成员模型只能提议一条消息；provider 写入日志、决定是否唤醒成员，并在唤醒开始前限制它的预算。** 它还拒绝一切能绕过群聊日志联系其他 Agent 的工具。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 storage backend 与 `@tomato/storage-domain` 之后挂载它，并让 Agent registry 与默认模型服务可用于执行：

```yaml
- name: '@tomato/storage-json'
- name: '@tomato/storage-domain'
- name: '@tomato/experimental-robot-room-local'
```

发布时校验完整规格，新群聊分配身份，已有群聊追加不可变修订。人类消息写入日志、开启或延续回合，并只在群聊 active 时唤醒被路由的成员。`messages(room, afterSeq?, limit?)` 按序列读取日志；每条成员消息携带产生它的 Session 与 turn 的 `sessionRef`，在此引用写入之前保存的行仍会报告该成员稳定的 Session（turn 为 0）。暂停会停止新的唤醒但不丢消息：消息仍写入日志并进入队列，恢复时排空队列。

### 成员执行

房间可选的 `capability` 块对每个成员的 `RobotSpec` 做收窄：工具 allow 取交集、deny 取并集、技能取交集，不在房间列表里的 MCP 服务器按工具名 deny，权限预设必须与机器人一致。

成员的 Session id 是 `room-<room id>-<member id>`。provider 在已持久化时恢复它，否则创建它，挂载 `room:charter` system prompt section，并注册群聊工具。它在成员 scope 里拒绝 `send_message`、`subagent`、`workflow` 与 Team 任务工具，因此群聊日志是联系其他 Agent 的唯一路径。

一次唤醒用成员的读取游标构建 `buildMemberInput`，运行预检预算，追加一条带成员 Session 与 turn 的 `activity` 消息，投递一条 user message，等待 turn 结束，记录实测用量，更新游标，并追加带同一引用的 finished activity。成员在本轮中发出的消息记录同一引用。群聊的 `routing.floor` 限制并发成员 turn；调度器合并同一成员的重复唤醒。成员 turn 超过 `guard.memberTurnTimeoutMs` 未结束会被取消，并以 `storm` 触发熔断。

### 工单、自审与验收

`work(room)` 为群聊页投影这些记录：每张工单一行，带成员、thread、主题、发起者、mandate 强度、最新报告状态、assignment 轮数与验收发现项。每次唤醒都在 `tomato_room_work` 域里按 superagent 词汇开一张工单：触发消息提供主题与 thread，人类触发记 `explicit` mandate，成员触发记 `proposed`。一轮成员工作对应一次 assignment，只有成员自己的自审放行，报告才是 `ready`。

每个结束的任务 turn 之后，同一成员 Session 里再跑一个自审 turn：成员以 `REVIEW: pass` 或 `REVIEW: fail` 结尾，并在失败时每条问题一行。未通过或缺少结论的结果不会投递；provider 在同一张工单上开新的 assignment，把发现项交回成员，最多 `review.maxRounds` 轮，之后写系统行把任务留给你裁决。出站 A2A 请求与回复在 turn 期间被暂存，只有自审通过才投递；未通过则丢弃并写一行未投递数量。

一条请求 thread 的全部工单都 `ready` 后，群聊里的 `reviewer` 成员跑一个验收 turn，用同样的结论格式作答。验收失败会把发现项作为新的 assignment 退回 worker；耗尽 `review.maxRounds` 后写系统行等待你处理。房间没有启用的 `reviewer` 成员时，记录为等待验收。`review.selfReview: false` 跳过自审 turn，`review.acceptance: false` 跳过验收；两项默认开启、默认三轮。

### 拒绝与批准

A2A 拒绝会追加一条带类型化 code 与 detail 的 `guard` 消息，并返回给工具调用方。接收方的 `requiresApproval` 命中发送者时，写入一条 `approval` 消息并等待 `approve`；批准的 envelope 正常发出，拒绝则追加系统说明。守卫触发后群聊停止、清空唤醒队列、追加触发记录，人类消息仍可记录但不会唤醒任何人。熔断与批准还会发出 `room/notice`，外部通知渠道插件可订阅并投递。

<a id="model-experience"></a>
## 模型体验

### 成员 turn

#### 模型看到什么

每次唤醒只投递一条由 `buildMemberInput` 构建的 user message：较早未读消息的摘要、最近窗口的原始群聊消息、唤醒原因与触发文本，以及结尾点名群聊工具的一行。成员的 system prompt 通过 `room:charter` section 携带群聊名称、章程、自身角色与成员名册；`room_ask` 与 `room_post` 接受成员名称或 id。工具结果报告受理、暂存状态或拒绝码与说明。任务 turn 结束后会收到一条承载自审指令的 user message；reviewer 成员会收到一条承载验收指令的 user message。挂载了 `ctx.llm` 时，provider 会让成员模型生成较早消息摘要；路由缺失、超时或模型失败时回退到确定性摘要。

#### Token 影响

每次唤醒一条有界 user message 加一条自审指令，每条完成的 thread 再加一条验收指令；唤醒本身受群聊上下文窗口与单条限制约束；预检会拒绝无法放进单轮、回合与成员日额的唤醒。后续 turn 用实测的 `assistant/message` 用量替代估算。

#### KV Cache 影响

每个成员 Session 只追加：system prompt 与更早历史保持稳定，每次唤醒追加一条 user message。恢复已持久化 Session 不重写任何内容。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与后续工作

- **进程内调度器**——唤醒在内存排队；重启会丢失排队唤醒，且不重放机器人连锁。守卫快照会写入，但重启不会继续被中断的成员 turn。
- **没有跨进程投递**——所有成员 Agent 都在 host 进程内运行；远程执行器与多 host 群聊后续再做。
- **只能收窄**——房间会应用成员的 `RobotSpec` 工具、技能与权限上限，并且只能收窄；房间侧若选择会放大机器人权限，会被忽略；权限预设不一致会让成员 turn 失败。
- **每次唤醒一条消息**——成员不能拉取无界历史；`room_read` 最多 50 条，并计入本轮。
- **没有流式 UI feed**——`room/changed` 在写入后发出；流式帧 controller 属于 Remote consumer。
- **A2A 暂存投递**——成员在 turn 中提出的请求或回复，只有该 turn 的自审通过后才到达对端；对端无法在同一 turn 内回答。
- **验收需要 reviewer**——没有启用的 `reviewer` 成员时，群聊不会完成验收；请求停在 ready 等待。

<a id="dev-note"></a>
### 开发备注

provider 用一条链串行化所有变更，读取前等待每次 storage-domain 写入，并把守卫计数保存在内存中、同时持久化快照供检查。下一阶段加入守卫恢复与 Remote controller。