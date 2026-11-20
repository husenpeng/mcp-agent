---
description: "进程内的超级智能体团队——接收机器人或应用请求、规划、执行、审查，并允许人中途介入。"
kind: "package-reference"
---

# @tomato/superagent-runtime

[English](README.md) | 中文

## 概述

在一个 Host 里跑一支完整的团队：按节奏读机器人服务，或接收应用提交的请求，判断每个请求变成什么工作，执行每张被受理工单的活儿，并审查它。本包把引擎、进程内提供方与持久化存储组合起来；它只负责它们的顺序与每一步失败的收容。被拒绝的请求会被记录，就绪的结果只有在内部审查放行之后才会到达人面前。在应用里观察的人可以打断正在执行的运行、给工单补充新的上下文，并看着下一次运行从中继续。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
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

省略 `bot` 即以纯应用模式运行：请求改由工单面板的输入框提交，`pollSeconds: 0` 让团队在没有提交时保持空闲。

```yml
- id: team
  plugin: '@tomato/superagent-runtime'
  config:
    directory: .
    provider: deepseek
    model: deepseek-chat
    pollSeconds: 0
```

Host 需要已经挂载 `ctx.agents`、`ctx.sessions`、`ctx.storageDomain`，以及能解析所配模型路由的 LLM 服务。路由不可用时会拒绝挂载，不启动轮询。发布的 `ctx.botGateway` 存在时用它，否则按配置通过 HTTP 读取机器人服务；没有配置 `bot` 时哪个都不读。策略始终在 `app` 来源上放行所配置的 `appUser`。

开启 `replies` 后团队在请求到来的会话里作答：一条消息说明它开了什么、工作到了什么状态，或者为什么没有接。被服务拒绝的回复只记日志，不抛出。应用提交没有回复通道；面板在提交的地方读取工作。

`ctx.superagent.runOnce()` 手动跑一轮——测试与 CLI 都用这个形状；`ctx.superagent.tickets()` 列出已打开域中的所有内容。人的操作在同一个服务上：`submit(text)` 受理一条应用请求并排队其工作，`message(ticket, text)` 加入工单的话题并以该上下文继续它，`cancel(ticket)` 打断正在执行的运行但保留工单，`stop(ticket)` 彻底终止它，`detail(ticket)` 读取授权、每次运行与报告、最近一次审查以及话题消息。

浏览器客户端调用 `ctx.remote.superagentTickets`：`list` 与上述五个操作，另有 `watch`——一个流，立即产出一帧 `TicketsFrame`，之后每次已提交的变更再产出一帧。这个 Remote 首次读取时会打开持久化存储。

-----

<a id="dev-note"></a>
## 开发备注

<details>
<summary>实现内部 —— 点击展开</summary>

`apply` 先发布工单 Remote，再发布团队与打开域：挂载期间的浏览器读取会打开存储，需要团队的操作等挂载完成，`tickets()` 只读已打开的存储，打开失败可以重试。释放会停止新的读取和轮询，等待已接纳的操作，然后关闭存储与主管 Agent。主管 Agent 在首次使用时以工单所指的会话 id 创建，释放时一并释放。

一个工作泵按队列顺序一次跑一张工单。一轮先读机器人服务（配置了的话），用主管作为判断者跑 intake，并把每张被受理的工单入队；`continued` 判定把新消息作为上下文，将触及的工单入队。`submit` 通过引擎的 `decideTriggers` 走同一条 intake 判定路径。运行期间到达的消息累积为下一次运行的上下文，结束的运行在有待处理上下文时把自己的工单重新入队。每次运行交给 `runAssignment`，报告为就绪时再交给 `runReview`；一张工单的失败只记日志，队列其余部分照常运行。配置了 `pollSeconds` 时由定时器驱动一轮；仍有一轮在跑时到达的时钟会被跳过，失败的一轮只记录日志而不停止节奏，释放插件会清除定时器。

`cancel` 通过 `runAssignment` 暴露的 `onLease` 钩子触及正在执行的租约；租约尚未存在时请求的打断会在它出现的那一刻生效。被打断的运行报告 `dropped`，释放工单的执行位而不终止工单。每次已提交的变更发出 `superagent/changed`；泵排空时把工单列表记录到主管会话上，`submit`、`message`、`stop` 也各自记录。

每张工单把 `superagent-supervisor` 记为主管，因此读报告的人也能通过 `createTicketSessionAccess` 读到这次工作跑过的会话。

</details>

-----

<a id="model-experience"></a>
## 模型体验

间接地：每张被受理的工单花掉三轮——判断轮、执行轮与审查轮。一次续跑再加一个执行轮（报告就绪时再加一次审查）；它的简报把这个人累积的消息作为同一主题上的最新指示。

#### KV Cache 影响

这三轮各自都是没有更早上下文的新会话，因此一个请求开出两张工单时会形成两条彼此独立的“判断到审查”链路，而不复用同一段对话。续跑也是新会话：上下文随简报传递，而不是复用对话。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **隔离需要 worktree 服务** —— 开启 `isolate` 时每张工单通过 `ctx.worktrees` 取得自己的 checkout，且以主管 Agent 为调用者；没有该服务的 Host 会拒绝挂载，而不是悄悄共用一个目录。
- **没有合并步骤** —— 审查过的工单停在人这里；没有东西会创建或合并变更请求。
- **两个来源** —— 飞书事件与应用提交；接入其他来源需要各自的网关与话题词汇。
- **打断只触及执行运行** —— 正在进行的判断轮或审查轮会跑完；没有打开的执行时 `cancel` 以 `superagent/not-running` 拒绝。
- **回复只代表一轮** —— 之后才完成、或等人回答后才继续的工单不会在机器人会话里再通告一次；应用面板通过 `watch` 跟随每次变更。
