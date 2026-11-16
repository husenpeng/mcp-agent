---
description: "进程内的超级智能体团队——读机器人服务、规划、执行、审查，全在一个 Host 里。"
kind: "package-reference"
---

# @tomato/superagent-runtime

[English](README.md) | 中文

## 摘要

在一个 Host 里跑一支完整的团队：按节奏读机器人服务，判断每个请求变成什么工作，执行每张被受理工单的活儿，并审查它。本包把引擎、进程内提供方与持久化存储组合起来；它只负责这些环节的顺序，以及每一步失败时的收容。被拒绝的请求会被记录而不是丢弃，没到就绪的工作记录其状态，就绪的结果只有在内部审查放行之后才会到达人面前。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

```yml
- id: team
  plugin: '@tomato/superagent-runtime'
  config:
    directory: .
    provider: deepseek
    model: deepseek-chat
    allowedSenders: [ou_owner]
    bot: { baseUrl: http://127.0.0.1:8013, userId: tomato-supervisor }
    pollSeconds: 15
    botOpenId: ou_bot
    replies: true
```

Host 需要已经挂载 `ctx.agents`、`ctx.sessions` 与 `ctx.storageDomain`。发布的 `ctx.botGateway` 存在时用它，否则按配置的身份通过 HTTP 读取机器人服务。

开启 `replies` 后团队在请求到来的会话里作答：一条消息说明它开了什么、工作到了什么状态，或者为什么没有接。被服务拒绝的回复只记日志，不抛出。

`ctx.superagent.runOnce()` 手动跑一轮——测试与 CLI 都用这个形状；`ctx.superagent.tickets()` 列出已存下的一切。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 —— 点击展开</summary>

`apply` 先发布服务再打开域：第一轮打开存储，`tickets()` 读取已打开的内容，释放时关闭它。主管 Agent 在首次使用时以工单所指的会话 id 创建，释放时一并释放。一轮先读机器人服务，用主管作为判断者跑 intake，然后把每张被受理的工单交给 `runAssignment`，并在报告为就绪时交给 `runReview`。配置了 `pollSeconds` 时由定时器驱动这一轮；仍有一轮在跑时到达的时钟会被跳过，失败的一轮只记录日志而不停止节奏，释放插件会清除定时器。

每张工单把 `superagent-supervisor` 记为主管，因此读报告的人也能通过 `createTicketSessionAccess` 读到这次工作跑过的会话。

</details>

-----

## 模型体验

间接地：每张被受理的工单花掉三轮——判断轮、执行轮与审查轮。

#### KV Cache 影响

这三轮各自都是没有更早上下文的新会话，因此一个请求开出两张工单时会形成两条彼此独立的“判断到审查”链路，而不复用同一段对话。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **隔离需要 worktree 服务** —— 开启 `isolate` 时每张工单通过 `ctx.worktrees` 取得自己的 checkout，且以主管 Agent 为调用者；没有该服务的 Host 会拒绝挂载，而不是悄悄共用一个目录。
- **没有合并步骤** —— 审查过的工单停在人这里；没有东西会创建或合并变更请求。
- **只有一个机器人来源** —— 只读飞书事件；接入其他来源需要各自的网关与话题词汇。
- **回复只代表一轮** —— 之后才完成、或等人回答后才继续的工单不会再通告一次；工作推进时没有东西重新接上那段对话。
