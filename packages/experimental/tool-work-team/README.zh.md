---
description: "面向模型的 work_team_create 工具：从对话中创建团队所需的机器人，并把它们发布为一个机器人编队。"
kind: "package-reference"
---
# Tool: Work Team Create

[English](README.md) | 中文

## 概述

`@tomato/tool-work-team` 注册 `work_team_create`，把一段对团队的描述变成完整、可运行的工作团队：它为每个成员创建一个 Tomato Rbot（使命、模型路由与权限约束），并发布把它们连接起来的编队。与只能绑定已发布 Rbot 的 `robot_crew_create` 不同，本工具会创建缺失的智能体，因此在对话中描述团队角色即可同时得到机器人和编队。它要求顶层智能体上的直接人类回合，委托或无人值守的回合不能创建团队。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在具备编队提供方（`ctx.crews`）、Rbot 注册表（`ctx.robots`）与智能体注册表，且模型应能从对话构建团队的地方挂载它。`work-team-bundle` 会把它与编队层、工作团队设置页一起挂载。

团队默认值是可在设置页实时编辑的 Config 字段，经profile 的 Cordis patch 持久化：`defaultProvider`（默认 `blueai`）、`defaultModel`（默认 `DeepSeek-V4.1-Flash-1017`）、`permissionPreset`（默认 `workspace-write`）、`sandbox`（默认 `workspace`）。除非成员自行指定 `provider`/`model`，每个创建的机器人都使用这些默认值。修改在下次创建时生效，无需重新挂载。

成员 id 为小写 slug；边必须保持无环。未给出边时，成员按顺序串联。机器人显示名在已发布规格中保持唯一，冲突时追加数字后缀。

<a id="model-experience"></a>
## 模型体验

### [`work_team_create`](../../../docs/tool-catalog.zh.md#tomatotool-work-team)

#### 模型看到什么

工具描述要求一个角色团队，并说明它为每个成员创建一个 Rbot、发布把它们连接起来的编队。参数为 `name`、`mission`、`description`、`successCriteria`、`members`（`id`、`label`、`role`、`instruction`，可选 `kind`、`provider`、`model`、`maxTurns`、`budgetTokens`）与 `edges`（`from`、`to`、`kind`）。成员未指定 `maxTurns` 或 `budgetTokens` 时为一轮、60000 token；范围由编队校验，`maxTurns` 须在 1 到 8 之间。结果给出规格 id、修订号、团队名、成员数，以及它创建的机器人。被拒绝的规格逐字段路径报错；少于两个成员由成员数检查拒绝，更多成员只受编队自身的节点上限约束。

#### Token 影响

只有工具 schema 和一次结果追加到调用会话。

#### KV 缓存影响

工具 schema 是稳定前缀；只有追加的结果在调用后使缓存失效。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **不启动运行**——工具发布团队；启动运行仍是页面操作。
- **每成员一个修订**——每个成员固定为它创建的机器人修订；之后的机器人修订不会移动它。
- **成员默认单回合**——除非调用为该成员指定 `maxTurns` 或 `budgetTokens`，每个成员默认一轮、60000 token。
- **默认值在创建时应用**——之后编辑团队默认值不会重新发布已创建的机器人；需单独重新配置那些机器人。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

工具经 `ctx.robots.publish` + `instantiate` 发布机器人，经 `ctx.crews.publish` 发布编队；同一个 `validateCrewSpec` 守护每个发布的修订，因此在对话中创建的团队仍可在编队画布中编辑。权限检查拒绝任何不是自身开放回合的实时驱动智能体、且没有直接人类消息的调用方。

</details>