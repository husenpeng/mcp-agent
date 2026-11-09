---
description: "存储支持的 crew provider 与编排器：每个成员一个 Agent、持久流程账本、A2A 投递与循环保护。"
kind: "package-reference"
---
# Robot Crew Local

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-crew-local` 在 `tomato_crew` 存储域上实现 `ctx.crews` 服务，并在 Host 上执行已接受的运行。每次成员激活在自己的 Session 中创建一个 Agent，从运行的抽取记忆组合有界简报，把简报、步骤开始、步骤结果、记忆、交接、A2A、guard 和运行结束条目写入流程账本，并以 `succeeded`、`failed`、`tripped` 或 `cancelled` 结束运行。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在存储后端与 `@tomato/storage-domain` 之后挂载，并需要 Agent registry 与默认模型：

```yaml
- name: '@tomato/experimental-robot-crew-local'
```

发布时校验完整规格并保存不可变 revision。`start` 接受某个已发布 revision 的运行并立即返回；执行在 Host 上继续。`append` 在 provider 序列下记录一条账本条目，`entries` 按顺序返回，`cancel` 中止活动 Agent。启动时发现的非终态运行会以失败结算，因为其 Agent 无法跨进程重启存活。

每个成员可以借用已发布机器人的能力规格；provider 在创建 Agent 前解析该 revision，并应用其工具限制、技能选择、权限预设和任务。成员可以在一个轮次内通过 `crew_a2a_send` 工具向 peer 请求工作；该工具让信封经过同一循环保护，并同步返回 peer 回答。

`start` 执行前读取同一 crew 最近 5 个已结束运行的流程账本，把成员写下的 `DECISION:`/`CONSTRAINT:`/`OPEN:` 条目按新到旧去重、每种最多 12 条灌进该次运行的记忆，并记录一条 `data.carried` 账本条目；下一次运行的第一份简报因此带着上一轮的决定与约束。窗口之外的更早结论不再携带。

挂载 `@tomato/experimental-memory` 时，provider 还用 `accessFor(cwd)` 与 `history()` 把项目长期记忆渲染成 `crew:memory` 系统提示段（最多 2000 字符），并在运行成功结束后写回一条 `crew-run` summary 情节，来源指向该次运行。记忆读取或写入失败只记一条 `drift` 账本条目，从不改变运行的终态。

<a id="model-experience"></a>
## 模型体验

### 成员简报与 A2A 工具

#### 模型看到什么

系统提示携带 `composeBrief` 生成的成员简报，其中含前几轮携带的记忆。部署挂载长期记忆时，每个成员的提示还有一段 `crew:memory` 项目历史。每个非 observer 成员还会收到 `crew_a2a_send`，参数为 `to`、`intent`、`task`、`context`；结果是有界的 peer 回答或本地化循环保护拒绝。

#### Token 影响

一份简报最多 `memory.briefChars`；项目历史段额外最多 2000 字符。每个 A2A 请求增加一份 peer 简报和一个回答，都计入运行 token 预算。

#### KV Cache 影响

每次激活独立；系统提示简报在一个成员轮次内稳定。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **顺序图执行**：成员按拓扑顺序运行；独立分支不并发。
- **仅进程内 A2A**：peer 调用在同一 Host 运行，不能指向其他进程或组织。
- **不支持运行恢复**：Host 重启会把未完成运行结算为失败，而不是重建其 Agent。
- **携带窗口固定**：最近 5 个运行、每种 12 条；项目记忆写入是一条总结情节，不写回事实记录。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

执行器无法跨 Host 重启存活，因此挂载时把每个 queued 或 running 运行标记为失败并写明原因，而不是留下永远不会结束的运行。释放时会等每个已接受的运行落定，再关闭存储域。

</details>
