# Agent Note: Rbot agents own multi-agent collaboration

Status: implemented

[English](2026-11-10-rbot-agent-collaboration-orchestration.md) | 中文

## Problem

多智能体协作最初是一个画布图编辑器：协作规格带着画布坐标（`CrewNode.at`），成员可以是没有任何智能体支撑的空白角色，协作页要靠切到画布才能创建或编辑协作。产品模型正好相反：Tomato Rbot 负责创建智能体，多智能体协作是对这些智能体的编排。由画布拥有协作定义，会把展示状态绑进持久规格，并允许一个没有任何智能体的协作存在。

## Decision

`@tomato/client-ui-robot-crew` 只注册 `collab` 协作页；`crews` 画布面板及其可拖拽图随 `CrewCanvas`、画布几何和一句话组合器一起移除。页面从已发布 Rbot 名单添加成员，按交接顺序排列，并把该顺序保存为已发布交接；设置检查器保存每个成员绑定的 Rbot revision、职责、这一步的交付任务、类型、轮次和预算，以及共享的交付、循环护栏、记忆与 A2A 设置。

发布要求每个成员声明一个已发布 Rbot revision。`validateCrewSpec` 保持结构校验，因为它在 provider 打开存储时也会运行，所以该规则之前发布的 revision 仍可读取；`requireRobotMembers` 是 provider 在 `publish` 中额外施加的发布规则。未绑定 Rbot 成员的已存 revision 仍沿 provider 的兼容路径运行，编辑器要求绑定后才能重新发布该 revision。

`CrewNode.at` 从词汇中移除。画布坐标属于展示状态；带旧字段的已存 JSON 会被忽略，因此不需要数据迁移。

`robot_crew_create` 改为接收成员的 `robot`（名称或规格 id）与可选 `robotRevision`，在 `ctx.robots` 中解析；未知 Rbot 会带着已发布名称被拒绝，而不是发布一个空白智能体。工具仍可编排任意图；协作编辑器有意只暴露线性的交接链。

## Alternatives considered

**把画布保留为只读视图。** 这样能保留画布组件与布局状态但不能编辑，而协作页仍需要自己的 Rbot 编排编辑器，画布只会成为同一条链的第二个渲染器，且没有产品归属。Desktop 打包配置早已移除该面板。

**在结构校验器中强制 Rbot 绑定。** 更严格的类型级校验会让 provider 打开存储时对每个早先发布的协作失败，把产品规则变成功能不可用。把结构校验与发布规则分开，既保留旧运行可读，又让每次新发布都是真正的编排。

**在页面里保留任意图编辑。** 没有画布的有向无环图编辑器需要为每个成员提供后继选择器，也能表达分叉。为了页面保持一份可读列表，这次延期；`robot_crew_create` 仍为需要分叉的调用方发布图。

## Consequences

协作始终是对已有智能体的编排，创建协作不可能悄悄写出空白智能体；空状态会把用户送回 Tomato Rbot。产品失去画布的拖拽定位与一句话组合器，改由成员顺序和链路提示承担。对话编排对模型更严格：未知 `robot` 会变成带已发布名称反馈的拒绝调用。已有 revision 仍可加载和运行，但重新发布需要为每个成员绑定 Rbot；包 README 与升级指南记录该迁移。协作规格不再携带展示状态，未来的视图可以直接渲染同一 revision 而不改变持久数据。
