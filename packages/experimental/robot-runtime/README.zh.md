---
description: "为排队的机器人 run 各自组合一个 Agent 执行，并记录其结果。"
kind: "package-reference"
---

# @tomato/experimental-robot-runtime

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-runtime` 把 [`@tomato/experimental-robot-local`](../robot-local/README.zh.md) 中排队的 run 转化为 Agent turn。它在加载时扫描排队 run、跟随后续 run 写入、为每个 run 创建一个 Agent、把绑定的规格应用到该 Agent、驱动一个 turn，并通过 `ctx.robots.finish` 结算 run。

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

在同一组合中，于 `@tomato/experimental-robot-local` 与 Agent 工厂（`@tomato/agent-loop`）之后挂载本插件。它需要 `agentDefaultModel`、`agents`、`robots` 与 `sessions`。

- 插件没有配置字段。
- run 处于 `queued` 时被认领；runtime 创建 Agent、驱动其 turn，然后把 run 结算为 `succeeded`、`failed` 或 `cancelled`。
- 取消 run 会在提供者中结算它，并中止该 run 拥有的 Agent。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

每个 run 在 `robot-run-<uuid>` 身份下获得一条新 Session，以及由 Agent 工厂组合的一个 Agent。规格贡献 Agent 的工作目录（存在时取第一个 workspace 根）、一个提示段落、工具准入掩码、权限预设，以及由 `agentDefaultModel` 选出的默认模型。

`allow` 非空时成为允许掩码；否则 `deny` 非空时成为拒绝掩码。规格点名了组合中不存在的工具时，run 会失败，而不是静默放行。挂载了可选的 `permissionPresets` 服务时，权限预设通过它应用。

runtime 只监听该 Agent 的已提交 `session/event`。最后一段助手文本成为 run 输出；最后一个 `turn/end` 原因决定结果：`completed` 成功，`error` 以提供者 code 与 message 失败，`aborted` 结算为 `cancelled`，其他原因以该 kind 失败。turn 结束时没有 `turn/end` 事件的 run 失败。Agent 创建或 turn 驱动失败会以错误消息把 run 结算为 `failed`。

排队 run 通过两条路径发现：插件加载时扫描一次，之后跟随 `tomato_robot` 的 `runs` 表上的 `domain/changed` 写入。进程内记账阻止同一个 run 被认领两次。卸载插件会释放它仍拥有的每个 Agent。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [`@tomato/experimental-robot`](../robot/README.zh.md)——服务定义、类型与契约。
- [`@tomato/experimental-robot-local`](../robot-local/README.zh.md)——本 runtime 消费的持久规格与 run 注册。
- [机器人平台](../../../docs/subsystems/robot.zh.md)——规格、revision、生命周期与 agent-to-agent 字段。
- [机器人平台产品架构](../../../.agents/notes/proposed/architecture/2026-10-29-robot-platform-product-architecture.zh.md)——运行时、A2A、记忆与交付决策。

-----

<a id="model-experience"></a>
## 模型体验

### 机器人任务提示段落

#### 模型看到的内容

一个名为 `robot:mission`、order 为 `-500` 的段落，由绑定规格生成；后三个标题仅在其列表非空时出现。

##### 机器人任务段落

```markdown
## Robot mission
<mission>

## Success criteria
- <criterion>

## Stop conditions
- <condition>

## Output acceptance
- <acceptance>
```

#### Token 影响

把任务文本以及每条成功判据、停止条件与验收项各一个条目加入该 run 的每次模型请求。

#### KV Cache 影响

该段落在同一规格 revision 内稳定，因此延长可复用的请求前缀；发布 revision 或修改这些列表会替换文本，并使从该段落起的复用失效。

### 工具准入

#### 模型看到的内容

只有被 `capability.tools` 准入的工具可见：`allow` 非空时把模型限制在这些名称内，`deny` 从可见集合中移除名称。

#### Token 影响

通过省略被拒绝的工具减少工具 schema token。

#### KV Cache 影响

修改任一列表会改变可见工具 schema，并使从第一个变化的 schema token 起的复用失效。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **每个 run 一个 turn** —— `GoalSpec.strategy` 尚未解释；runtime 从不计划、循环或恢复 run。
- **只有默认模型** —— 规格尚无每机器人模型字段；每个 run 都使用 `agentDefaultModel.currentSelection()`。
- **不执行预算** —— token、时间、成本与工具调用预算记录在规格中，但未执行。
- **单进程认领** —— 两个共享同一存储后端的主机可能执行同一个排队 run；没有跨进程租约。
- **没有记忆或 A2A** —— 记忆 namespace 与 agent-to-agent 信封尚未实现。
- **没有触发器或调度器** —— run 只通过提供者的 `start` 到达；cron、事件、webhook 与依赖触发均未实现。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>