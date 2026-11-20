# Agent Note: Room 用工单记录成员工作，并接入 superagent 引擎

Status: implemented

[English](2026-11-17-room-superagent-work-cycle.md) | 中文

## 问题

Room provider 负责调度成员唤醒并把每条消息写进一份日志，但日志里没有关于「成员被要求做什么、产出了什么、结果有没有被检查」的持久记录。两条产品要求需要这份记录：每个完成的任务必须先通过成员自己的自审；成员发出的 A2A 消息必须等自审放行后才能到达下一个成员。

superagent 引擎已经有了「有名的工作」所需的词汇：带不可变 `Mandate` 的 `Ticket`、串行的 `Assignment`、每次运行的 `Report`，以及带阻塞性发现的 `ReviewVerdict`。在房间里复用它，可以只维护一套工作词汇，而不必发明第二套；同时不把房间改造成「工单优先」的产品形态。

[机器人平台架构](../../proposed/architecture/2026-10-29-robot-platform-product-architecture.zh.md)把房间描述为带运行、审批与 A2A 的产品面；[协作编排 note](2026-11-10-rbot-agent-collaboration-orchestration.zh.md)负责协作页与 Rbot 绑定。本 note 记录房间新增的工作层，不改变两者。

## 决策

Room provider 保留 `ctx.rooms`、房间日志、准入、预算与 A2A 信封，并按成员回合使用 superagent 引擎：

- 每次唤醒在房间自有的 `tomato_room_work` 域里按 `SuperagentStore` 的实现开一张工单。触发消息提供主题与 `room` thread；人类触发记 `explicit` mandate，成员触发记 `proposed`。该域与 `tomato_superagent` 分开，房间因此从不与飞书团队共享引擎的内存镜像。
- 一轮成员工作对应一次 assignment。provider 从回合合成报告：`failed`、`dropped`、`blocked` 或 `ready`，其中 `ready` 必须有一次解析通过的自审。成员从不书写 `REPORT:` 标记。
- 每个结束的任务 turn 之后，在同一成员 Session 里再跑一个自审 turn，以 `REVIEW: pass` 或 `REVIEW: fail` 结尾，失败时每条问题一行。未通过或缺少结论时，provider 在同一张工单上开新的 assignment 并把发现项交回成员，最多 `review.maxRounds` 轮。出站 A2A 请求与回复在回合期间暂存，只有自审通过才投递。
- 一条请求 thread 的全部工单都 `ready` 后，房间的 `reviewer` 成员跑一个验收 turn，用同样的结论格式。验收失败会把发现项作为新的 assignment 退回 worker；轮数耗尽后写系统行把任务留给你。房间没有启用的 reviewer 时，记录为等待验收。
- `RoomSpec.capability` 对每个成员的 Rbot 修订做收窄：工具 allow 取交集、deny 取并集、技能取交集、房间未点名的 MCP 服务器按工具名 deny，权限预设必须与机器人一致，否则成员 turn 失败。房间从不放大机器人权限。
- `RoomSpec.review` 是可选字段：`selfReview`、`acceptance`、`maxRounds` 默认为开、开、三轮，因此在这个字段之前写入的既有 revision 继续可用。新工单读取房间当前配置；一次 assignment 沿用其启动时的配置。

协作群聊流程从 Rbot bundle 移到 `@tomato/experimental-robot-crew-bundle`，该 bundle 默认关闭；因此只选 Rbot 层的 profile 会挂载房间，但没有第二个群聊标签页，也没有协作工具。

## 考虑过的替代方案

**保留房间自有的工作词汇。** 再建一张房间任务表并自定状态名，会与引擎的 ticket、assignment、report 与 verdict 形状重复并逐渐偏离。复用引擎只维护一套词汇与一套阶段判定。

**只卡最终结果，不卡 A2A 消息。** 先投递委派、事后评审，会让未经审核的消息到达下一个成员，而这正是要求禁止的情形。暂存出站消息的代价是对端无法在同一回合内回答，因此对端在回合结束后回答。

**把自审放在全新 Session。** 独立的评审 Session 读结果更客观，但成员必须修改自己的工作，发现项针对的正是它刚产出的内容。同一 Session 保留这份上下文，且只多一个回合而不是再加载一次上下文。

## 影响

- 成员模型可以在自己的回合里提出 A2A 消息，但对端只有在自审放行后才会听到；对端无法在同一回合内回答。
- 房间日志会增加面向使用者的系统行：自审通过、返工、未投递数量与验收结果。自审与验收正文不会进入房间日志。
- 工单记录能跨重启保留，但被中断的成员回合仍不重放：该工单的最后一次 assignment 保留它已经写下的报告。
- 验收需要 reviewer 成员；没有时请求停在 ready 等待。

## 验证

`packages/experimental/experimental-robot-room-local/tests/work.spec.ts` 覆盖域存储、thread、结论解析与报告合成；`review.spec.ts` 覆盖通过、失败、返工、轮数预算、关闭自审与缺少 reviewer 的路径；`outbound.spec.ts` 覆盖 A2A 暂存与丢弃投递；`spec.spec.ts` 覆盖 review 与 capability 的校验；`capability.spec.ts` 覆盖求交、MCP deny、预设应用与预设不一致。