---
description: "有版本机器人规格、机器人实例、run 与 agent-to-agent 契约字段的服务定义。"
kind: "package-reference"
---

# @tomato/experimental-robot

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot` 定义机器人平台的持久词汇与 `ctx.robots` 服务契约：有版本的规格、绑定到某一个精确 revision 的机器人实例、带明确生命周期状态的 run，以及 agent-to-agent 准入字段。它不添加提供者、持久化、执行、传输、工具或提示文本；这些全部由已安装的提供者拥有。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

本包是服务定义，不是提供者。加载一个由插件继承 `Robots` 的包；该子类注册为 `ctx.robots` 并实现每个抽象操作。

- 消费者注入 `robots`，调用 `publish`、`revision`、`specs`、`instantiate`、`robot`、`robots`、`start`、`cancel`、`finish`、`run` 和 `runs`。
- 服务没有配置字段。
- `isTerminalRunState` 是纯谓词，任何进程无需该服务即可调用。

提供者负责规格校验、持久化、执行和传输。本包只声明调用方可以依赖的行为。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

抽象类构造函数绑定 Cordis 服务 key，因此同一 context 中的第二个提供者会按标准重复服务规则报错。实现本身是四条契约：

- 已发布的 revision 只追加。revision `n + 1` 取代 `n`，已有 revision 永不改变。
- `instantiate` 把一个机器人绑定到一个精确 revision。发布更新的 revision 不会移动已有机器人。
- `start` 只从 `idle` 接受 run；机器人在 `provisioning`、`paused`、`failed` 或 `stopped` 时拒绝。
- `cancel` 是协作式的。已经到达终态的 run 保持该状态。

身份是编译期品牌，因此 `RobotId` 不能用在期望 `RunId` 的位置。本包没有运行时身份、存储或 I/O。[源码](src/index.ts)与[类型](src/types.ts)就是完整契约。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [机器人平台产品架构](../../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.zh.md)——产品形态、运行时、A2A、记忆与交付决策。
- [Agent Teams](../agent-team/README.zh.md)——本契约在生产机器人中取代的实验性会话内 roster、邮箱与任务看板。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本服务定义不添加自己的提示、工具或上下文。

#### KV Cache 影响

安装本定义不会改变任何模型请求；提供者拥有自己的提示段落与工具 schema。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **本包没有提供者** —— 单独加载它不会创建 `ctx.robots` 服务。必须由提供者继承 `Robots`；在安装之前不存在任何机器人操作。
- **没有持久化或控制面日志** —— revision、机器人和 run 只作为契约类型存在。持久存储、回放与投影属于提供者。
- **没有校验实现** —— 契约要求 `publish` 做校验，但 schema 与诊断属于提供者。
- **没有 agent-to-agent 传输** —— 信封、邮箱、投递与重试字段随 A2A 包提供。
- **没有客户端界面** —— 机队视图、机器人详情、任务看板、run 追踪与收件箱在客户端包落地前不存在。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>