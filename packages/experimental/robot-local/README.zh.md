---
description: "内存中的机器人规格注册服务，带不可变 revision、idle 实例化与 run 接受。"
kind: "package-reference"
---

# @tomato/experimental-robot-local

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-local` 是 [`ctx.robots`](../robot/README.zh.md) 服务定义的存储提供者。它校验规格、发布不可变 revision、以 `idle` 实例化机器人，并接受与取消 run。记录保存在持久的 `tomato_robot` 存储域中；它不执行工作，也不添加提示、工具或传输。

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

在 `@tomato/storage-domain` 与存储后端之后挂载本插件；它等待 `storageDomain`、打开 `tomato_robot` 域，并注册为 `ctx.robots`。

- 每个消费者注入 `robots` 并调用[服务定义](../robot/README.zh.md)声明的操作。
- 提供者没有配置字段，也没有 bundle 入口。
- `parseRobotSpec` 与 `RobotSpecValidationError` 已导出，调用方可在发布前预检规格。

发布与其他最新规格同名的规格会失败；更新规格保留其身份，并要求把当前最新 revision 作为 `previous`。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

校验先对每个字段运行 Zod schema，再检查跨字段不变量：声明列表中的重复项、同时出现在 `allow` 与 `deny` 的工具，以及没有触发条件的 goal。被拒绝的规格抛出带字段路径的 `RobotSpecValidationError`。成功的发布在规格进入存储前深冻结它，因此调用方之后的修改无法改变 revision。

提供者打开 `tomato_robot` 域，不保留独立的可变状态：revision、机器人与 run 都从域中已校验的内存表读取，每次写入在其 Promise 解决前已经持久。域在打开时校验每条存储记录，因此损坏记录会拒绝激活而不是被跳过。提供者自有的单一链串行化变更，所以并发发布无法同时通过同名检查，并发启动也无法同时占用同一个机器人。

revision 是以规格身份与 revision 号为键的追加行。每次读取时推导每个规格的最新 revision，`specs()` 按首次发布顺序为每个规格返回一项。实例化把一个机器人绑定到精确的已发布 revision，并以 `idle` 返回。

`start` 为每个机器人接受一个 run 并记录为 `queued`；存在未终态 run 期间，`robot()` 与 `robots()` 报告 `running`。`cancel` 把 run 更新为 `cancelled` 并记录 `endedAt`，机器人因此重新报告 `idle`。`finish` 记录执行器的终态及其输出或错误详情；已经处于终态的 run 保持原状态。取消已经处于终态的 run 不写入地返回。重启后的提供者读取同一个域，报告相同的 revision、机器人与 run。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [`@tomato/experimental-robot`](../robot/README.zh.md)——服务定义、类型与契约。
- [机器人平台](../../../docs/subsystems/robot.zh.md)——规格、revision、生命周期与 agent-to-agent 字段。
- [机器人平台产品架构](../../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.zh.md)——运行时、A2A、记忆与交付决策。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本内存提供者不注册提示、工具或模型上下文。

#### KV Cache 影响

本提供者不改变任何模型请求；运行时提供者拥有它添加的提示段落与工具 schema。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **需要存储** —— 组合必须提供 `storageDomain` 与一个服务 `kv` facet 的后端；没有内存回退。
- **没有执行器** —— 已接受的 run 保持 `queued`，直到执行器结算它。挂载 [`@tomato/experimental-robot-runtime`](../robot-runtime/README.zh.md) 来驱动排队 run；本提供者自身不执行任何工作。
- **每个机器人一个活跃 run** —— `GoalSpec.maxConcurrentRuns` 尚未执行；在活跃 run 被取消前，第二次 `start` 会被拒绝。
- **没有 agent-to-agent 传输** —— 信封、邮箱、投递保证与对端预算随 A2A 包提供。
- **没有 Session 日志控制面** —— 持久状态保存在 `tomato_robot` 存储域中。架构提案里的 `robot-control` Session kind 与投影需要持久 Session kind 变更，尚未实现。
- **没有导出 JSON Schema** —— 校验基于 Zod 且属于提供者；需要可移植 schema 的消费者要等待已发布的契约。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>