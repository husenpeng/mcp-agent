---
kind: upgrade-guide
description: "Superagent 的 worker 租约必须实现 cancel()，存储必须实现 triggers()，runtime 接收应用提交且 bot 配置变为可选。"
---

# Superagent 端口获得取消能力与应用来源

[English](guide.md) | 中文

## 变更

`@tomato/superagent` 扩展了两个公开端口。`WorkerLease` 现在要求 `cancel(): void`：它中止人停下的那次执行，执行以 `dropped` 报告结束。`SuperagentStore` 现在要求 `triggers(): readonly Trigger[]`，按从旧到新读出全部已存触发器。`runAssignment` 接受可选的第四个参数，含 `context`（人的续跑消息）与 `onLease`（驱动执行前交出租约）。`WorkerBrief` 增加可选 `context`，由 `workerBriefText` 渲染进提示词。

`@tomato/superagent-runtime` 把 `bot` 变为可选：不配置时团队以纯应用模式运行，通过 `ctx.superagent.submit(text)` 与 `superagentTickets` Remote（`submit`、`detail`、`message`、`cancel`、`stop` 及 `watch` 流）接收请求。新增 `appUser` 配置，指定策略在 `app` 来源上放行的行动者。`TicketSummary` 增加 `running` 与 `stopped`。触及打开工单的飞书消息现在会以该消息为上下文继续这张工单的工作；此前只记录不执行。

`@tomato/client-ui-superagent` 不再只读：注入面增加 `actions`，面板可提交请求、跟随实时流，并提供打断、终止与发消息控件。

## 迁移

1. 自定义 `Worker` 实现为它返回的每个租约加上 `cancel()`；中止活动回合使执行报告 `dropped`，取消先于回合到达时不驱动回合、直接以 `dropped` 结束。
2. 自定义 `SuperagentStore` 实现加上 `triggers()`；不保存触发器的存储（如 room 工作存储）可以像拒绝 `trigger()` 一样拒绝这次读取。
3. 带 `bot` 配置挂载 `superagent-runtime` 的 profile 不受影响。要脱离飞书服务运行，去掉 `bot`、设 `pollSeconds: 0`，从工单面板提交请求；部署放行别的本地行动者时设置 `appUser`。
4. `TicketSummary` 的使用方读取两个新字段；既有字段含义不变。
5. 依赖“跟进消息只记录不执行”的飞书部署，现在会看到被触及的工单再次运行；要阻止继续，终止该工单。