---
description: "Tomato Rbot crew 工作室：工作流画布、成员与护栏检查器、一句话组合和实时流程账本。"
kind: "package-reference"
---
# Robot Crew Studio

[English](README.md) | 中文

## 概述

`@tomato/client-ui-robot-crew` 注册 `collab` 协作标签页与 `crews` 画布工作室，两者各有侧栏入口。协作标签页把每个已发布 crew 当作一个群聊，支持手动建群、对话建群和开发模板建群，在群聊里开启任务，并把该次运行渲染成成员汇报与主 agent 答复的对话。工作室以 chips 展示成员，提供可拖拽的交接边画布、crew/成员/交接检查器、一句话组合器，以及所选运行的实时流程账本。registry 与运行状态来自 `ctx.crewRuns`；插件只保留查看状态。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在 `@tomato/api-robot-crew-controller` 与 `@tomato/experimental-robot-crew-remote` 之后选择该行。页面需要机器人 roster 才能提供机器人绑定；未选择机器人时所有成员使用默认能力。“在聊天中组合”会打开一个 Session，其 agent 可调用 `robot_crew_create`；工具发布后新 crew 出现在 roster。

协作标签页把已发布 crew 列为群聊。「手动建群」打开画布；「自动建群」打开一个 Session，其 agent 用 `robot_crew_create` 发布 crew；「用开发模板建群」直接发布一个五人群：主 agent 立项派活，开发、测试、审核各自交付，主 agent 再汇总派下一轮。输入框里的任务会启动一次运行，对话就是该次运行的流程账本，按成员标签渲染：步骤结果读作汇报，交接写明双方。最后的派活可以一键作为下一轮任务，但那是新开一次运行，不是在同一次运行内继续。

检查器编辑任务、成功标准、停止条件、运行提示、工作区、循环上限、记忆预算和 A2A 准入。保存前所有更改都是本地的；保存会发布 revision。运行需要已保存 revision，并打开账本。

<a id="dev-note"></a>
## 开发备注

页面在自己的控制器中暂存编辑器状态；roster 与运行账本经 `ctx.crewRuns` 到达，发布与运行动词仍走生成的 `crew` Remote 命名空间。画布布局只存在于客户端，不持久化。线格式类型来自 `@tomato/experimental-robot-crew/types`，因此 bundle 不会触达 Host 运行时代码。

<a id="model-experience"></a>
## 模型体验

无，因为本包渲染浏览器状态，不携带模型可见文本。

#### KV Cache 影响

无；本包从不进入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **画布不可缩放**：成员可拖拽并自动布局，但大图可能需要滚动。
- **没有内联运行回答**：账本显示步骤文本；成员对话通过其 Session 记录打开，本页不内嵌。
- **一句话组合是确定性的**：它拆分并串联子句；更深的组合走聊天。
