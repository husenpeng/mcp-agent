---
description: "Robot Room 页面：持久协作空间、成员配置、监控、批准与循环守卫恢复。"
kind: "package-reference"
---
# Robot Room UI

[English](README.md) | 中文

## 概述

`@tomato/client-ui-robot-room` 注册 `room` 页面及其侧边栏入口。页面列出协作空间与已发布 Rbot，渲染一个协作空间的可见日志，发送人类消息，并检查熔断器、成员用量、守卫阈值与设置。成员抽屉编辑只能收紧机器人自身能力的协作空间级覆盖；新建协作空间对话框从已发布 Rbot 组装第一个修订。

页面从 `ctx.roomRuns.state` 读协作空间，从 `ctx.robotRuns.state` 读 Rbot 名单，所有命令都经 `ctx.roomRuns`。它只保存选择、草稿与临时 UI 状态。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 `@tomato/api-robot-room-controller/client`、`@tomato/experimental-robot-room-remote` 与 Tomato Rbot bundle 之后挂载。页面出现在侧边栏的 **协作空间 / Rooms**。

日志区分人类消息、成员发言、异步 A2A 接力卡片、回复、活动摘要、守卫触发与批准卡片。主区提供 **对话** 与 **工单** 切换：工单页按请求 thread 分组列出该空间的工作记录，包括成员、主题、报告状态、assignment 轮数与验收发现项。检查器有 **监控** 与 **成员**；从房间头部打开的 **设置** 抽屉承载基础配置（路由、审核、工作目录）与高级数值（循环防护、预算、上下文）。工作目录字段在部署提供系统目录选择器时直接打开它，否则保留手输路径。高级段还承载能力字段：技能、MCP 服务器与工具 allow/deny 都是部署实时目录里的勾选清单，任何选择只会收窄成员的 Rbot，不会放大。熔断横幅提供 **恢复**、**本回合放宽一次**、**结束回合**。成员抽屉编辑身份、角色、唤醒规则、可 @ 的成员、需要批准的成员，以及单轮/日额预算。

活动行与成员消息各自携带 provider 记录的 `sessionRef`；点击任一处的 **打开会话** 或消息头像，会在工作区中选中该成员的完整会话。没有记录引用的行不显示入口。

页面在选中协作空间时每秒读取一次消息，因此本地 provider 不需要额外的流；协作空间快照本身由 controller 流式驱动。

<a id="model-experience"></a>
## 模型体验

### Room 页面

#### 模型看到什么

无；页面渲染浏览器状态，不携带 prompt 文本、工具 schema 或模型可见结果。

#### Token 影响

无；页面从不进入模型请求。

#### KV Cache 影响

无；页面从不写入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与后续工作

- **一秒消息读取**——页面在选中时轮询 `messages`；消息增量流后续再做。
- **添加成员打开 Rbot 面板**——成员页链接到 Tomato Rbot，而不是内嵌机器人创建器；创建后的新成员通过协作空间编辑器加入。
- **设置是扁平表单**——页面直接编辑守卫、预算、上下文与路由字段；设计原型里的档位切换尚未暴露。

<a id="dev-note"></a>
### 开发备注

页面是单个 slot 组件，颜色、角色、唤醒与 intent 标签由纯函数派生。所有产品文案都在 `room` 语言字典里；组件内没有硬编码字符串。
