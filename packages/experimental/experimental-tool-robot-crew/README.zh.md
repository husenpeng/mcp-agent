---
description: "把已发布 Tomato Rbot 智能体从对话编排成 crew 的模型工具 robot_crew_create。"
kind: "package-reference"
---
# Tool: Robot Crew Create

[English](README.md) | 中文

## 概述

`@tomato/experimental-tool-robot-crew` 注册 `robot_crew_create`，从名称、任务、成功标准、2–6 个成员及其交接把已发布 Tomato Rbot 智能体编排成 crew 规格。每个成员都声明它作为哪个已有 Rbot 运行，工具按名称或规格 id 从部署的 Rbot registry 解析；工具绝不会新建智能体。它要求顶层 Agent 的直接人类轮次，因此委派或无人值守轮次不能发布 crew。聊天编排与协作编辑器因此产出版本一致的规格。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 crew provider（`ctx.crews`）与 Rbot registry（`ctx.robots`）都可用、且模型应能从对话编排智能体的位置挂载。成员 id 是小写 slug；边必须无环。每个成员的 `robot` 按名称或规格 id 指定一个已发布 Rbot，可选的 `robotRevision` 固定某个 revision；未知 Rbot 会被拒绝并列出已发布名称。

<a id="model-experience"></a>
## 模型体验

### `robot_crew_create`

#### 模型看到什么

工具描述要求一个小型已发布 Rbot 智能体图，并说明每个成员共享任务与抽取记忆。参数为 `name`、`mission`、`description`、`successCriteria`、`nodes`（`id`、`label`、`role`、`instruction`、`kind`，必填 `robot`，可选 `robotRevision`）和 `edges`（`from`、`to`、`kind`）。结果给出规格 id、revision、crew 名称和成员数；被拒绝的规格报告每个字段路径，未知 Rbot 会报告已发布名称。

#### Token 影响

只有工具 schema 和一条结果追加到调用 Session。

#### KV Cache 影响

工具 schema 是稳定前缀；只有追加结果在调用后使缓存失效。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **不启动运行**：工具只发布 crew；启动仍是页面操作。
- **不创建智能体**：每个成员都必须已在 Tomato Rbot 中存在；工具不能替它写任务、能力或权限。
- **每个成员固定一个 revision**：成员在发布时固定一个 Rbot revision；后续新 revision 不会移动它。
- **成员单轮**：工具把每个成员固定为一轮，并使用推荐的 token 上限。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

工具经 `ctx.crews` 发布，每次发布变更都经过同一份 `validateCrewSpec` 校验，因此聊天里创建的 crew 仍可在画布工作室中编辑。权限检查会拒绝任何不是其自身开放轮次中活跃驱动 Agent 的调用方。

</details>
