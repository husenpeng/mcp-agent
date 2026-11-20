# Agent Note：超级智能体团队接收应用请求与人的控制

Status: implemented

[English](2026-11-19-superagent-app-source-person-control.md) | 中文

## 问题

超级智能体团队此前只读一个来源：从机器人服务轮询的飞书事件。没有该服务的桌面部署无法启动工作，工单面板只读，进行中的运行无法停下，工单话题上的跟进消息只被记录而不继续工作。产品目标是：应用可以触发并观察完整流程、中途打断运行，并以手动输入的上下文从当前节点继续。

[room 工作循环笔记](2026-11-17-room-superagent-work-cycle.zh.md)拥有 room 对引擎的复用；本笔记记录团队 runtime 自己的来源与控制面，不改变 room。

## 决定

引擎补齐应用面需要的部件，runtime 负责组合：

- `appTrigger` 把 GUI 提交规范化为 `app` 来源上的一条直接的人类触发器，没有回复通道。`decideTriggers` 对已 intake 的触发器跑受理与接受，因此 `runCycle`（飞书）与 `submit`（应用）共用一条判定路径；策略始终在 `app` 上放行所配置的 `appUser`。
- `WorkerBrief.context` 携带人累积的消息；`workerBriefText` 把它渲染为同一主题上的最新指示。`WorkerLease.cancel()` 中止一次运行：本地 worker 调用 Agent 的 `cancel({ kind: 'user' })`，被中止的回合报告 `dropped`；先于回合到达的取消不驱动回合、直接以 `dropped` 结束。`runAssignment` 接受 `context` 与 `onLease` 钩子，让 runtime 能够触及租约。
- `SuperagentStore.triggers()` 读出全部已存事件；room 工作存储像拒绝 `trigger()` 一样拒绝它，因为那里的受理由 room 守卫拥有。
- runtime 的 `bot` 配置变为可选。一个工作泵按队列顺序一次跑一张工单；运行期间到达的消息累积为下一次运行的上下文，`continued` 轮判定把新消息连同被触及的工单入队。`submit`、`message`、`cancel`、`stop`、`detail` 位于 `SuperagentTeam` 与 `superagentTickets` Remote；`watch` 通过 `superagent/changed` 事件对每次已提交的变更流式产出一帧。`cancel` 只中止打开的执行，否则以 `superagent/not-running` 拒绝；`stop` 保持引擎的永久语义。
- 工单面板提交请求、跟随 `watch`、打开一张工单的流程（授权、运行、审查、消息），并提供打断、终止与消息框。桌面开发项目在 `TOMATO_SUPERAGENT_BOT_URL` 为空时写入纯应用补丁。

## 曾考虑的替代方案

**轮询工单列表而非流式跟随。** 轮询更简单，但两次读取之间显示过期阶段，也失去了观察运行的意义。Remote 已支持流方法，room 控制器的 `watch` 模式验证了这个形状；面板改为跟随已提交的变更。

**把取消做成永久终止。** 引擎的 `stop` 永不恢复，与“从当前节点继续”矛盾。取消通过既有的报告路径记录 `dropped`，工单保持阶段语义、执行位释放给下一条消息；永久终止仍是独立操作。

**连判断轮与审查轮一起取消。** 那些回合很短，触及它们需要给 `Reviewer` 与 `Supervisor` 端口加租约形状。worker 租约承载长阶段；没有打开的执行时取消被拒绝，限制被记录而不是隐藏。

**为应用请求单开一条 intake 路径。** 给 GUI 单独写受理与接受循环会与飞书路径漂移。抽出 `decideTriggers` 让两个来源共用一条判定路径。

## 后果

- 打开工单话题上的飞书跟进现在会以该消息为上下文再次运行工单；依赖“只记录不执行”的部署必须终止工单才能阻止继续。
- 一个 Host 一次跑一个执行；提交的请求排队等待，面板把它显示为排队中的工作。
- 续跑上下文随新会话的简报传递，而不是复用对话，因此每次运行保持引擎的 KV 缓存隔离。
- 主管会话的工单记录在泵排空时以及每次人的操作后写入，而不只在轮末。

## 验证

`packages/experimental/superagent/tests/app-source.spec.ts` 覆盖应用触发器、共用判定、续跑上下文与租约钩子；`packages/experimental/superagent-local/tests/worker.spec.ts` 覆盖回合前与回合中的取消；`packages/experimental/superagent-runtime/tests/app.spec.ts` 覆盖纯应用挂载、提交、消息续跑、打断后继续、累积上下文、终止、详情、Remote 操作、watch 流与飞书续跑；`packages/experimental/client-ui-superagent/tests` 覆盖控制器的流与操作，以及面板的输入框、流程视图与控件；`apps/desktop/tests/development-project.spec.ts` 覆盖纯应用补丁。