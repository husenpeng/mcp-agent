---
description: "面向模型的 robot_create 与 robot_update 工具：用基础字段与能力列表创建 Tomato Rbot，并在之后修改这些列表。"
kind: "package-reference"
---

# @tomato/experimental-tool-robot

[English](README.md) | 中文

## 概述

新增 `robot_create` 与 `robot_update` 工具，让创建会话把四项回答——名称、描述、任务目标、成功标准——以及用户点名的技能、插件、MCP 服务器直接变成已发布的规格和已实例化的机器人，并在之后修改既有机器人的这些列表。它会拒绝空白或占位的名称与任务目标，而不是发布一个空壳；成功结果还会把机器人标识记录为展示元数据，客户端因此能渲染一行并提供「打开机器人」。其余高级项全部来自共享的通用默认值，后续修改在机器人页的「高级配置」中完成。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

`@tomato/experimental-robot-app` 组合包在机器人注册表旁插入这一行：

```yaml
- id: robot-tool
  name: '@tomato/experimental-tool-robot'
```

插件依赖 `agents`、`robots` 与 `tools`。该组合包同时提供引导问答的 `robot-creation` 技能，因此开启组合包会同时挂载这两个界面。

| 参数 | 必填 | 含义 |
|---|---|---|
| `name` | 是 | 显示名称，在机器人之间唯一 |
| `description` | 否 | 一句话简介 |
| `mission` | 是 | 每次运行追求的目标 |
| `successCriteria` | 否 | 一次运行必须满足的可观察条件 |
| `skills` | 否 | 每次运行加载的技能 |
| `plugins` | 否 | 机器人依赖的插件模块名 |
| `mcpServers` | 否 | 机器人可使用的 MCP 服务器 |

一次调用会发布规格并实例化该修订，返回机器人 id、规格 id 与修订号。能力列表会去除首尾空白并去重；省略时沿用共享的空默认值。声明了任一项的机器人必须先在其页面安装，因为安装会校验部署能否解析它们。名称与任务目标必须是真实回答：空白值或占位文本 `New robot` / `Describe what this robot does.` 会以 `ROBOT_SPEC_INVALID` 拒绝，并指明需要补问的字段。成功标准会去除首尾空白，空列表则省略。其余字段来自 `@tomato/experimental-robot` 的 `emptyRobotSpec()`，因此对话创建的机器人和手动创建的机器人运行同一套高级配置。成功结果还会在 `tool/result` 事件上记录 `{ robotId, name }` 展示元数据；`@tomato/client-ui-robot` 据此渲染带「打开机器人」的一行，而不把该元数据暴露给模型。

它把调用方 Session 的 `cwd` 记录为机器人的第一个工作区根目录，机器人因此在对话所在的工作区里工作；没有该目录的 Session 会让规格的根目录保持为空，由 runtime 在每次运行时解析兜底目录。`robot_update` 接收 `robot`（名称或 id）以及任意 `skills`、`plugins`、`mcpServers`。它只替换传入的列表、发布最新修订并重绑定机器人，同时提示新修订需要安装；名称匹配到多个机器人时会要求改传 id。两个工具都只在调用方是存活的顶层 Agent、且当前打开的回合中包含人类消息时执行；被委托或无人的回合不能修改机器人。工具注册、发布与实例化都归属于挂载 fiber 及其 provider。

<a id="model-experience"></a>
## 模型体验

### robot_create 与 robot_update

#### 模型看到什么

每个工具一条描述和参数 schema（`robot_create`、`robot_update`）。创建结果给出机器人名称、规格修订号与机器人标识；更新结果给出重新发布的修订号与安装要求。provider 拒绝时带上每个无效字段的路径。

#### Token 影响

每次请求携带一条短 schema。对话只增加用户给出的四项回答。

#### KV 缓存影响

schema 在回合与会话之间保持不变；创建不会增加 system prompt 段落，也不会在工具结果之外新增请求文本。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 本工具只收集四项基础字段，不暴露触发器、工具、权限、预算、记忆或 Agent 间通信设置；这些仍由机器人页的「高级配置」负责。

<a id="dev-note"></a>
### 开发备注

`robot_create` 在经 `ctx.robots` 发布前，要通过与其它 Host 侧 robot 工具调用相同的权限校验——当前打开的轮次里存在存活的顶层 agent 和直接的人类消息。工具把四项回答与三个能力列表映射到 `emptyRobotSpec()` 的默认值，不持有其他高级字段；编辑器新增字段不会改变本工具的 schema。
