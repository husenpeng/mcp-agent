# Agent Note: 机器人运行的暂停、纠正与工作目录

Status: implemented

[English](2026-11-04-robot-run-pause-and-multiturn.md) | 中文

## 问题

机器人的一次运行在它的单个回合结束时结束。看到机器人走错方向的人只能取消运行，而取消会把运行置为 `cancelled` 并销毁持有上下文的 Agent：纠正后的重试从一条空 Session 开始。Host 也没有暂停运行的能力，所以"打断"要么结束运行，要么什么也没做。

工作目录还有第二个缺陷。`@tomato/experimental-robot-runtime` 只在规格声明了工作区根目录时才写 `meta.cwd`；营销模板和默认规格都不声明。Session 历史接口把没有 `cwd` 的头部当作不存在的 Session，于是这些运行的会话报 `session/not-found`，无论如何都打不开。

人也看不到执行者的进展：没有任何 provider 操作会写非终态，所以一条运行在整个执行期间都报告 `queued`。

## 决定

**运行的工作目录。** 运行时为每次运行解析一个目录：规格的第一个工作区根目录，否则部署的第一个已注册工作区，否则 Host 进程目录。Agent 总是记录它，因此运行的会话历史与产物都能被检查。创建路径直接预填规格，而不是把选择留给运行时：`robot_create` 继承调用方 Session 的 `cwd`，`robot.hire` 对没有固定根目录的模板接受可选的 `workspaceRoot`，规格编辑器则用页面正在查看的工作区填充空的 `workspaceRoots`。

**Session 可达性。** Session 历史不再把没有 `cwd` 的头部当作 `session/not-found`；日志是否存在决定可达性。附件 Remote 保留它更窄的"`prepared` 且无 `cwd`"判据。

**执行者进展。** `ctx.robots.advance(run, state)` 记录 `running`、`waiting` 或 `finalizing`；终态运行保持原状态。`waiting` 表示运行在等待人工输入，且执行者让它的 Agent 保持存活。`robot-local` 把它实现为忽略终态行的状态写入。

**多回合运行。** 只要运行未到终态，执行者就让它的 Agent 保持存活，并且只在两种情况下结算：回合自然结束且没有暂停（用最后一个回合的结果调用 `finish`），或运行被取消。`waiting` 之后的中止会让运行与 Agent 原地保留，下一条纠正继续同一条 Session。暂停受运行时 `pauseTimeoutMs` 约束（默认 30 分钟）：等待过期会把运行结算为 `cancelled`，并留下说明等待过期的错误。

**Host 侧控制。** `robot.interrupt` 先记录 `waiting`，再中止当前回合，这样执行者读到的是暂停，而不是把中止当成已结算的回合；它保留 inbox。`robot.correct` 把消息投递给该运行自己的存活 Agent——等待中发 `queue`，运行中发 `steer`——并记录 `running`。没有存活 Agent 的运行时被以 `robot/conflict` 拒绝，而不是冷恢复出一条无人结算的 Session。

## 备选方案

**打断即结束运行，再开一次纠正后的运行。** 否决：纠正会从空 Session 开始。一次运行只拥有一条 Session，因此第二次运行无法续写第一次运行的日志，而人想纠正的上下文恰恰是新 Session 丢掉的东西。

**只做 steer，不做暂停。** 否决：`agent.steer` 在下一个步骤边界才投递，管不住一个跑很久的工具调用。想让它停下手头动作的人需要中止回合，而 Host 早已有保留 inbox 的 `agent.cancel`。

**暂停只保存在客户端状态里。** 否决：刷新或另一个客户端会看到运行仍在执行，而执行者会把它当作正常完成结算。暂停是关于运行的持久事实，属于运行记录。

**通过控制器写暂停状态。** 否决：回合只归执行者拥有。控制器可以记录暂停，但无法在某个回合之后自行报告运行状态。

**让两次运行共享一条 Session 来续跑。** 否决：机器人架构保持一次运行一条 Session，使每次运行都能从一条日志重建；共享日志会把两次运行的输入、输出与结果混在一起。

## 后果

- 一次运行现在跨越多个回合，直到结算。机器人运行时与 UI README 中"一次运行一个回合"的限制不再成立；运行追踪仍然是一条 Session、一次运行。
- 暂停中的运行占着机器人唯一的执行槽和它的 Agent。有界等待避免被遗忘的暂停永久阻塞机器人，过期暂停以 `cancelled` 结束并附带说明性的 `error`。
- Remote 命名空间上出现了 `robot.interrupt` 与 `robot.correct`；没有存活 Agent 的部署会拒绝两者，而不是假装投递成功。
- 纠正等待中的运行会排队一个回合；纠正运行中的运行会 steer 当前回合，所以同一个动作对调用方呈现不同的落点。
- 机器人页把每次运行当作任务呈现：两栏的运行列表与详情、由运行 Session 的 Chat 节点折叠出的业务语言进展列表，以及 `interrupt`、`correct`、`stop` 控件。详情通过 `ctx.uiConversation.binding(sessionId).target('chat')` 读取已注册的 Chat 目标，因此必须挂载 `@tomato/client-ui-chat`；技术详情开关保存在浏览器存储而非 profile 设置。

## 测试

- `packages/experimental/robot-runtime/tests/runtime.spec.ts` 覆盖兜底顺序、保留 Agent 直到纠正继续运行的暂停，以及让运行结算的过期暂停。
- `packages/experimental/robot-local/tests/local.spec.ts` 覆盖执行者进展与终态运行保持状态。
- `packages/api/robot-controller/tests/interrupt-correct.host.spec.ts` 覆盖暂停顺序、纠正落点与各拒绝路径。
- `packages/api/session-controller/tests/session-cold.host.spec.ts` 覆盖无 `cwd` 的已存 Session。
- `packages/experimental/tool-robot/tests/robot-tool.spec.ts` 覆盖继承的创建目录；`packages/api/robot-controller/tests/controller.host.spec.ts` 覆盖无根目录的招聘。
- `packages/client/ui-robot/tests/run-detail.client.spec.tsx` 覆盖详情各状态、控件与步骤折叠；`packages/client/ui-robot/tests/page.client.spec.tsx` 覆盖运行列表与招聘目录。