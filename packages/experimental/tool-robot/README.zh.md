---
description: "面向模型的 robot_create 工具：用四项基础字段发布并实例化一个 Tomato Rbot。"
kind: "package-reference"
---

# @tomato/experimental-tool-robot

[English](README.md) | 中文

## 概述

新增一个 `robot_create` 工具，让创建会话把四项回答——名称、描述、任务目标、成功标准——直接变成已发布的规格和已实例化的机器人。其余高级项全部来自共享的通用默认值，后续修改在机器人页的「高级配置」中完成。

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

一次调用会发布规格并实例化该修订，返回机器人 id、规格 id 与修订号。其余字段来自 `@tomato/experimental-robot` 的 `emptyRobotSpec()`，因此对话创建的机器人和未改动的基础表单运行同一套配置。

只有当调用方是存活的顶层 Agent、且当前打开的回合中包含人类消息时才会执行；被委托或无人的回合不能创建机器人。工具注册、发布与实例化都归属于挂载 fiber 及其 provider。

<a id="model-experience"></a>
## 模型体验

### robot_create

#### 模型看到什么

一条 `robot_create` 工具描述和参数 schema。结果给出创建的机器人名称、规格修订号与机器人标识；provider 拒绝时带上每个无效字段的路径。

#### Token 影响

每次请求携带一条短 schema。对话只增加用户给出的四项回答。

#### KV 缓存影响

schema 在回合与会话之间保持不变；创建不会增加 system prompt 段落，也不会在工具结果之外新增请求文本。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 本工具只收集四项基础字段，不暴露触发器、工具、权限、预算、记忆或 Agent 间通信设置；这些仍由机器人页的「高级配置」负责。

<a id="dev-note"></a>
### 开发备注

`robot_create` 在经 `ctx.robots` 发布前，要通过与其它 Host 侧 robot 工具调用相同的权限校验——当前打开的轮次里存在存活的顶层 agent 和直接的人类消息。工具把四项回答映射到 `emptyRobotSpec()` 的默认值，不持有任何高级字段；编辑器新增字段不会改变本工具的 schema。
