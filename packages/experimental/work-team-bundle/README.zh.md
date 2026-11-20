---
description: "可选的工作团队层：基于机器人的工作团队，支持对话式创建机器人、编队画布与团队页签，以及工作团队设置页。"
kind: "package-bundle"
---

# @tomato/work-team-bundle

[English](README.md) | 中文

## 概述

在 Rbot 包之上增加基于机器人的工作团队：在对话中描述团队角色，`work_team_create` 工具会为每个角色创建一个机器人，并发布把它们连接起来的编队。本层挂载编队工作流（提供方、Remote 控制器、画布与团队页签）、工作团队设置页，并用工作团队页签替换协作空间页签。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 Web 或 Desktop 的插件中启用 **工作团队**（置于 Rbot 包之上）。左侧栏的协作空间页签被替换为 **工作团队 / Work teams** 页签；画布从该页签打开，**通过对话创建** 会打开一个会话，其智能体用 `work_team_create` 构建团队。工作团队设置页（位于插件设置）编辑应用于新创建机器人的默认模型路由与权限约束，并可重新配置每个机器人的模型路由。

新团队机器人的默认路由为 `blueai` / `DeepSeek-V4.1-Flash-1017`；可在设置页实时编辑，并经 profile 的 Cordis patch 持久化。禁用本层会移除其各行；`tomato_crew` 与 `tomato_robot` 存储域保留数据，再次选择即可恢复团队与机器人。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

[`cordis.patch.yml`](cordis.patch.yml) 禁用协作空间 UI 行，并贡献存储-backed 编队提供方、其 Remote 传输、生成的编队控制器、编队工具、工作团队工具、编队 UI 包与工作团队设置页。工作团队工具从其 volatile Config 读取实时默认路由；设置页经共享配置表单编辑该 Config。

</details>

-----

<a id="model-experience"></a>
## 模型体验

Indirectly, through the crew packages and the work-team tool, which own the member brief, the ledger, and the creation schema.

#### KV Cache effect

The layer adds no request content itself.

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- 编队运行在 Host 重启后不会恢复：提供方把每个非终态运行结算为失败。
- 编辑团队默认值不会重新发布已创建的机器人；需在设置页单独重新配置那些机器人。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

None.

</details>