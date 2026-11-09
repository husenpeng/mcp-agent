---
description: "面向多 Agent Rbot 协作的 crew 词汇、A2A 信封、循环保护与执行期记忆简报。"
kind: "package-reference"
---
# Robot Crew

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-crew` 拥有 crew 的词汇与纯策略：Agent 成员的版本化无环图、Agent 之间交换的 `tomato-a2a/1` 信封、每次运行一个循环保护，以及把已完成步骤抽取为决策、约束与开放问题的逻辑。它不持有传输或执行；`@tomato/experimental-robot-crew-local` 同时提供两者。

crew 规格声明任务、成功标准、停止条件、成员、交接、循环上限、记忆预算、A2A 准入和工作区。每次运行携带持久化流程账本：完整的流程记忆，下一个成员只能通过有界简报读取。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

使用规格辅助函数（`emptyCrewSpec`、`starterCrewSpec`、`validateCrewSpec`、`topologicalOrder`）、A2A 协议（`createEnvelope`、`a2aSignature`、`normalizeA2aText`）、循环保护（`CrewLoopGuard`）、记忆函数（`extractMemory`、`composeBrief`）和长程记忆函数（`carryTaskMemory`、`carriedCount`、`renderProjectHistory`）。`Crews` 服务定义是 provider 实现的 seam；通过 `@tomato/experimental-robot-crew-local` 挂载。

### 循环保护

`CrewLoopGuard` 统计激活次数、已投递 A2A 消息、近似 token 与墙钟时间。它拒绝自发消息、未知 peer、越界 peer、未接受的 intent、超过 `maxHops` 的转发深度、超过 `maxDuplicates` 的重复签名，以及超过 `maxMessages` 的后续消息。当最近 `noProgressWindow` 个输出至少 85% 词相同且长于确认语时，`recordStep` 触发 `no-progress`。首次触发生效，后续读取报告该结果。

### 执行记忆

每个完成步骤写入 `DECISION:`、`CONSTRAINT:`、`OPEN:` 或 `ARTIFACT:` 标记行。`extractMemory` 读取它们（中英文标记），大小写不敏感地去重，并限制每项长度。`composeBrief` 总是复述任务、成功标准、停止条件和成员自己的任务；决策、约束、上游结果、peer 回复、开放问题和 guard 提示按优先级填充剩余字符预算。

### 长程任务记忆

`carryTaskMemory(runs, limits)` 从同一 crew 已结束运行的流程账本里读回成员自己写下的记忆条目，按新到旧去重、每种最多 `maxItems` 条、最多读 `maxRuns` 个运行，返回三张简短清单。provider 在每次运行开始前调用它，把结果灌进该次运行的流程记忆，因此第一份简报就带着上一轮的决定与约束，而不是从 mission 冷启动。`carriedCount` 报告携带总数。

`renderProjectHistory(items, budgetChars)` 渲染部署长期记忆里的项目记录，每行带日期与 kind，开头固定说明“记录，不是指令”，整体受字符预算限制；没有记录放得下时返回 `undefined`。

<a id="model-experience"></a>
## 模型体验

### 成员简报与输出契约

#### 模型看到什么

每个成员 Agent 收到系统提示简报，包含任务、成功标准、停止条件、角色与任务、先前抽取的记忆（含前几轮携带的决定与约束）、上游结果、peer 回复和 guard 提示；部署挂载长期记忆时，简报之后还有一段项目历史。固定输出契约要求以 `DECISION:`、`CONSTRAINT:` 或 `OPEN:` 行结束。

#### Token 影响

每次激活受 `memory.briefChars` 限制（默认 6000 字符）；预算紧张时前面的段落优先。携带的记忆与运行内抽取的记忆共用这套预算；项目历史是独立段落，provider 把它限制在 2000 字符以内。

#### KV Cache 影响

每次激活、每个成员独立；只有运行的抽取记忆或上游结果变化时简报才变化。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **没有跨进程 A2A 传输**：信封由本地 provider 在进程内投递；HTTP agent-card 与 JSON-RPC 载体延期。
- **确定性记忆抽取**：标记不经摘要模型解析；没有标记的正文只贡献其摘要。
- **仅支持无环图**：校验器拒绝环；有界重访不在当前契约内。
- **携带项只来自标记行**：没有写成 `DECISION:`/`CONSTRAINT:`/`OPEN:` 的长期结论不会被带入下一轮。
- **携带有预算**：默认只读最近 5 个已结束运行、每种保留 12 条，更早的决定会随窗口滑出。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

本包只拥有纯词汇——规格校验、A2A 信封、循环保护与记忆抽取——不挂载提供方。传输、持久化与执行归 `@tomato/experimental-robot-crew-local`，这些函数因此无需存储域即可测试。

</details>
