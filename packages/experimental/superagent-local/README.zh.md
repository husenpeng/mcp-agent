---
description: "进程内的超级智能体执行器——一个工单、一个子 Agent、一行报告。"
kind: "package-reference"
---

# @tomato/superagent-local

[English](README.md) | 中文

## 摘要

让一个超级智能体工单在本 Host 的一个子 Agent 里运行，并用同样的方式审查它的结果。`createInProcessWorker` 给出引擎所需的 `Worker`：租用一次执行会按调用方指定的目录建立一个会话，执行把工单简报交给它，等待该回合结束，读取那一轮写下的报告行，然后无论发生什么都释放 Agent。`createInProcessReviewer` 给出 `Reviewer`：一个子 Agent 读就绪结果并写下结论行。`createInProcessSupervisor` 给出 `Supervisor`：一个子 Agent 读请求并决定它变成哪些工作。它还带持久化存储：`createStorageStore(ctx)` 打开 `tomato_superagent` 域，为引擎给出一个重启后触发器与工单仍在的 `SuperagentStore`。本包不负责调度；assignment 仍由引擎记录，报告与结论的含义也由引擎判定。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

```ts
const store = await createStorageStore(ctx)
const worker = createInProcessWorker(ctx, { directory, model: { provider, model } })
const ticket = await runAssignment(store, ticketId, worker)
await store.flush()
```

`@tomato/superagent` 的 `InMemoryStore` 仍是测试用的轻量实现。

执行器需要已挂载的 `ctx.agents` 工厂与 `ctx.sessions`。模型路由是必填项：由调用方指定而不是继承部署默认值，因此没人配置过的执行无法启动。

审查者的一轮为每个问题写一行 `FINDING: <severity> <path>:<line> <摘要>`，并以 `REVIEW: pass` 或 `REVIEW: fail` 收尾。

执行器的一轮以一行 `REPORT: <state> - <摘要>` 收尾。引擎的 `parseReport` 读取它；没有标记行的一轮按 `waiting` 处理，从而释放工单名额供下一条消息启动下一轮。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 —— 点击展开</summary>

`lease()` 为每次执行创建一个 Agent，会话 id 由工单派生；它订阅该会话的事件并返回 `{ session, directory, run }`。`run()` 用 `workerBriefText` 写入简报，等待 `whenIdle()`，刷新会话，然后返回 `reportOf(turn)`。释放在 `finally` 中执行且幂等，因此同一租约不会被重复释放。

`createStorageStore` 在内存里保留一份可写镜像，使引擎的同步读取保持同步；每次写入按序排队，介质拒绝时记录日志而不是让调用方失败。`flush()` 在排队的写入落盘后完成；重启就是在同一介质上新建一个 Host，重新打开域后触发器与工单都在。

`reportOf` 读取这一轮的结束方式：`completed` 交给报告行判定，`aborted` 变成 `dropped`，错误带上 code 与 message，完全没有结束事件则算失败。来自其他会话的文本会被过滤掉，执行者因此不会读到别人的回合。

</details>

-----

## 模型体验

每次执行触达模型一次：简报是一条 user 消息，且执行只读取自己会话的助手文本。

#### KV Cache 影响

每次执行都是没有历史回合的新会话，因此两个工单收到同一份简报时会发出两次独立的首个请求，而不会复用同一段对话。

-----

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **每个 Host 一个目录** —— 该 Host 的每次执行都在选项指定的目录里进行；按工单分目录的 worktree 属于调用方的准备步骤。
- **没有取消** —— 执行会一直跑到回合结束；停止进行中的工单尚未接通。