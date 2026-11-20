---
description: "进程内的超级智能体执行器——一个工单、一个子 Agent、一行报告。"
kind: "package-reference"
---

# @tomato/superagent-local

[English](README.md) | 中文

## 概述

在一个子 Agent 中运行一张 superagent 工单，并以同样方式审查结果。Worker 执行简报并返回报告，Reviewer 评估就绪结果，Supervisor 决定请求变成什么工作。`createStorageStore(ctx)` 打开持久化的 `tomato_superagent` 域，使触发器与工单在重启后保留。引擎负责调度与 assignment 语义；本包负责进程内回合与存储。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

```ts
import { createInProcessWorker, createStorageStore } from '@tomato/superagent-local'
import type { TicketId } from '@tomato/superagent'

declare const ctx: Parameters<typeof createStorageStore>[0]
declare const directory: string
declare const model: { readonly provider: string; readonly model: string }
declare const provider: string
declare const ticketId: TicketId
declare function runAssignment(
  store: Awaited<ReturnType<typeof createStorageStore>>, ticket: TicketId, worker: ReturnType<typeof createInProcessWorker>,
): Promise<unknown>

const store = await createStorageStore(ctx)
const worker = createInProcessWorker(ctx, { directoryOf: async () => directory, model: { provider, model: model.model } })
const ticket = await runAssignment(store, ticketId, worker)
await store.flush()
```

`@tomato/superagent` 的 `InMemoryStore` 仍是测试用的轻量实现。

执行器需要已挂载的 `ctx.agents` 工厂与 `ctx.sessions`。模型路由是必填项：由调用方指定而不是继承部署默认值，因此没人配置过的执行无法启动。

审查者的一轮为每个问题写一行 `FINDING: <severity> <path>:<line> <摘要>`，并以 `REVIEW: pass` 或 `REVIEW: fail` 收尾。

执行器的一轮以一行 `REPORT: <state> - <摘要>` 收尾。引擎的 `parseReport` 读取它；没有标记行的一轮按 `waiting` 处理，从而释放工单名额供下一条消息启动下一轮。

租约的 `cancel()` 以人自己的取消停下这次执行：它中止活动回合，回合报告 `dropped`；回合开始前就被取消的执行直接以 `dropped` 结束，不驱动任何回合。工单的执行位保持释放，下一条消息开启全新的一次执行。

-----

<a id="dev-note"></a>
## 开发备注

<details>
<summary>实现内部 —— 点击展开</summary>

`lease()` 为每次执行创建一个 Agent，会话 id 由工单派生；它订阅该会话的事件并返回 `{ session, directory, run, cancel }`。`run()` 用 `workerBriefText` 写入简报，等待 `whenIdle()`，刷新会话，然后返回 `reportOf(turn)`。`cancel()` 记录这次取消并调用 Agent 自己的 `cancel({ kind: 'user' })`；被中止的回合以 `aborted` 原因结束，`reportOf` 把它读成 `dropped`。审查者共用同一个回合驱动器，只是把文本交给 `parseReview`，两个端口因此以同样方式读取一个完成的回合。释放在 `finally` 中执行且幂等，因此同一租约不会被重复释放。可选的生命周期 `signal` 会在取消后拒绝创建 Agent，并释放取消期间创建的晚到句柄；它不会中止已接纳的回合。

`createStorageStore` 在内存里保留一份可写镜像，使引擎的同步读取保持同步；每次写入按序排队，介质拒绝时记录日志而不是让调用方失败。`flush()` 在排队的写入落盘后完成；重启就是在同一介质上新建一个 Host，重新打开域后触发器与工单都在。

`reportOf` 读取这一轮的结束方式：`completed` 交给报告行判定，`aborted` 变成 `dropped`，错误带上 code 与 message，完全没有结束事件则算失败。来自其他会话的文本会被过滤掉，执行者因此不会读到别人的回合。

</details>

-----

<a id="model-experience"></a>
## 模型体验

每次执行触达模型一次：简报是一条 user 消息，且执行只读取自己会话的助手文本。

#### KV Cache 影响

每次执行都是没有历史回合的新会话，因此两个工单收到同一份简报时会发出两次独立的首个请求，而不会复用同一段对话。

-----

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **每个 Host 一个目录** —— 该 Host 的每次执行都在选项指定的目录里进行；按工单分目录的 worktree 属于调用方的准备步骤。
- **执行运行可取消，判断轮与审查轮不行** —— 只有 worker 租约带 `cancel()`；判断轮或审查轮会跑完。