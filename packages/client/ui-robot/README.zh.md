---
description: "Tomato Rbot 页面：左侧栏机器人名册、基础/高级规格编辑器、会话创建，以及独立于工作区对话的机器人对话界面。"
kind: "package-reference"
---
# Robot UI

[English](README.md) | 中文

## 概述

`@tomato/client-ui-robot` 是 Tomato Rbot 的浏览器插件。它注册 `robots` 主面板及其 `sidebar.panellist` 图标，把已定义的 robot 填入 `sidebar.robots` 座位，并通过绑定到 run Session 的 `SessionProvider` 渲染每次运行的对话，使 robot 对话不进入工作区会话列表。编辑器默认展示四项基础字段，其余高级区块收在同一个标签页，provider 的字段问题映射回所属面板；保存时发布修订并创建新实例或重绑被编辑的 robot。会话创建按钮会新开一个带内置 `robot-creation` 技能的会话。注册表状态与控制调用都经 `ctx.robotRuns`，插件本身不持有传输状态。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在与 `@tomato/api-robot-controller` 及 `@tomato/experimental-robot` provider 一同装配的浏览器组合中挂载本插件。它需要 `slots`、`locale`、`layout`、`robotRuns`、`sessions` 与 `uiWorkspace`。

手动创建时，编辑器默认打开「基础配置」：名称、描述、任务目标与成功标准。其余区块留在「高级配置」，使用 [`emptyRobotSpec()`](../../experimental/robot/src/spec.ts) 的通用默认值；两个标签页共用同一份草稿，若 provider 的 issue 落在基础路径之外，编辑器会自动切到高级页。只有访问快照允许 `session/create` 时才显示会话创建；它通过 `uiWorkspace.startSession` 带上 robot-creation 引导语，新会话因此携带负责访谈并调用 `robot_create` 的技能。页面可从侧栏图标或 roster 行进入；点击行会打开 robot 页面并选中该 robot。

页面的 robot 对话使用共享的 embedded Conversation 工厂，切换到固定 chat 视图，并用绑定到所选 run `sessionId` 的 SessionProvider 包裹。页面只在 run 被选中期间以 `robotRun` 引用源保留该 Session，并在卸载时释放。

<a id="dev-note"></a>
## 开发备注

页面选择 store 投影为 `useRobotPage`；store 实例同时提供 PropsStore 的 `actions`。注册表数据是 `robotRuns` 快照，由整份 `robot.watch` 帧替换，名册与运行状态因此无需轮询即可收敛。工作区浏览器会排除摘要携带 `robotRun` 投影的 Session，该投影由 runtime 从 run 的日志记录写入。

<a id="model-experience"></a>
## 模型体验

### 运行使命

#### 模型看到什么

页面本身不添加任何内容。robot run 的模型看到的是 `@tomato/experimental-robot-runtime` 由规格中的使命、成功标准、停止条件与输出验收组装的 `robot:mission` 系统提示区段。

#### Token 影响

每个 run 一个提示区段，大小由编辑器写入的规格文本决定；页面自身不增加 token。

#### KV 缓存影响

同一修订内该区段稳定。发布并重绑新修订会改变提示前缀，下一次 run 从新的缓存开始。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- robot runtime 每次运行只执行一轮；对话是运行记录，继续交互需要启动新的 run。
- 多数规格字段会被持久化，但 runtime 尚未执行它们；编辑器没有标注这一点。
- 任务板、审批、A2A 传输与记忆视图尚未实现。
