---
description: "从对话发布多 Agent crew 图的模型工具 robot_crew_create。"
kind: "package-reference"
---
# Tool: Robot Crew Create

[English](README.md) | 中文

## 概述

`@tomato/experimental-tool-robot-crew` 注册 `robot_crew_create`，从名称、任务、成功标准、2–6 个成员及其交接发布 crew 规格。它要求顶层 Agent 的直接人类轮次，因此委派或无人值守轮次不能发布 crew。聊天编排与画布因此产出版本一致的规格。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 crew provider 可用（`ctx.crews`）且模型应能从对话组合 crew 的位置挂载。成员 id 是小写 slug；边必须无环。成员可以命名已发布机器人规格与 revision，以借用其能力。

<a id="model-experience"></a>
## 模型体验

### `robot_crew_create`

#### 模型看到什么

工具描述要求一个小型 Agent 图，并说明每个成员共享任务与抽取记忆。参数为 `name`、`mission`、`description`、`successCriteria`、`nodes`（`id`、`label`、`role`、`instruction`、`kind`，可选 `robotSpec`/`robotRevision`）和 `edges`（`from`、`to`、`kind`）。结果给出规格 id、revision、crew 名称和成员数；被拒绝的规格报告每个字段路径。

#### Token 影响

只有工具 schema 和一条结果追加到调用 Session。

#### KV Cache 影响

工具 schema 是稳定前缀；只有追加结果在调用后使缓存失效。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **不启动运行**：工具只发布 crew；启动仍是页面操作。
- **成员单轮**：工具把每个成员固定为一轮，并使用推荐的 token 上限。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

工具经 `ctx.crews` 发布，每次发布变更都经过同一份 `validateCrewSpec` 校验，因此聊天里创建的 crew 仍可在画布工作室中编辑。权限检查会拒绝任何不是其自身开放轮次中活跃驱动 Agent 的调用方。

</details>
