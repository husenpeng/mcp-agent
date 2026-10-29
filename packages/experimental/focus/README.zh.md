---
description: "目标轮次失败记录、重复失败提醒与按工具审批，供维护者选择、配置或调试长时间运行的目标。"
kind: "package-reference"
---

# @tomato/experimental-focus

[English](README.md) | 中文

## 概述

防止长目标反复执行同一个失败的调用。在自动目标轮次中，每个新轮次都会带上该目标的失败记录；同一调用以同样方式失败两次时，智能体会收到提醒：更换做法、询问用户，或报告阻塞原因。配置的工具在每次调用前还会征求审批。该插件不安排轮次，也不重试任何调用；继续执行及其轮次上限仍由 `@tomato/goal-round-driver` 负责。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与暂缓工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

在插件页开启**记忆与目标专注**组合包；它会把此插件挂载到 Host 上的目标服务旁边。

### 何时选择

当目标在无人值守的情况下跨多个轮次运行，且工具可能反复失败（例如额度不足或数据缺失）时选择它。如果目标很短，或每个轮次都由人引导，则不要使用。失败记录和提醒只在会话的第一个目标轮次之后生效。

### 配置

```yaml
- id: optional-focus
  name: '@tomato/experimental-focus'
  config:
    approvalTools: ['mcp__hicreator__*']
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `repeatedFailureThreshold` | `2` | 同一调用连续相同失败多少次后提醒 |
| `maxLedgerEntries` | `5` | 失败记录中列出的不同失败数 |
| `maxMessageChars` | `200` | 失败记录中引用的失败消息字符数 |
| `approvalTools` | `[]` | 每次调用前需要审批的工具名（支持 `*` 通配） |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-focus)是所有可接受字段的完整来源。

### 失败标识

失败由工具名、规范化后的参数和失败代码共同标识；取消不算失败。某个工具的任意一次成功都会重置该工具的连续失败计数。脚本内部的嵌套调用只通过其外层调用计数。

### 审批

名称匹配 `approvalTools` 的调用，会在其他所有 pre-execute 策略都允许之后，通过组合中的审批服务征求审批；之前的拒绝仍然是拒绝。没有审批服务，或审批策略为 `never` 时，该调用会被拒绝。没有智能体的调用不会征求审批。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

一个仅限 Host 的会话投影 `experimentalFocus` 从已记录的事件折叠出失败记录：另一个目标的目标轮次 `user/message` 会重置它，`tool/call` 记录调用标识直到对应的 `tool/result`，失败结果会更新匹配的条目。因此，失败记录在恢复后仍然有效，且无需读取历史。

`tools/post-execute` 监听器在 waterfall 中最先运行：它计算该结果将产生的条目，委托下游，再把提醒添加到最终决定上，包括下游的阻止决定。`agent/pre-step` 监听器会把失败记录追加到接纳了同一目标的目标轮次消息的步骤中。

| 文件 | 负责 |
|---|---|
| [`src/index.ts`](src/index.ts) | 投影、失败记录、提醒与审批监听器 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [目标服务](../../goal/goal/README.zh.md) — 目标阶段与轮次上限
- [目标轮次驱动](../../goal/goal-round-driver/README.zh.md) — 轮次何时开始和停止
- [审批服务](../../interaction/user-approval/README.zh.md) — 策略与应答方
- [重复调用提醒](../../guard/repeat-tool-reminder/README.zh.md) — 不论结果如何的相同调用
- [记忆与目标专注组合包](../muse-bundle/README.zh.md) — 随包发布的开关

-----

<a id="model-experience"></a>
## 模型体验

### 目标轮次失败记录

#### 模型看到什么

当某一步接纳了一个目标轮次，且该目标已有记录的失败时，一条用户角色的快照会跟在轮次消息之后。快照以下面的标题开头；随后每个失败占一行，格式为 `- <tool> failed <count>× (<code>, latest in round <round>): <message>`，最近的在前。

##### 失败记录标题

```markdown
Failures so far in this goal (do not repeat a failed call unchanged; change the approach, ask the user, or report the blocker):
```

#### Token 影响

每个有失败的目标轮次最多 `maxLedgerEntries` 行，每行的消息最多 `maxMessageChars` 个字符；没有失败的轮次不增加任何内容。

#### KV 缓存影响

只追加：失败记录跟在轮次消息之后，早先的前缀仍可复用。

### 重复失败提醒

#### 模型看到什么

当目标进行中某个调用以同样方式连续失败 `repeatedFailureThreshold` 次或更多时，一条通知会跟在其工具结果之后：

##### 提醒文本

```markdown
The <tool> call has now failed <count> times in a row with the same arguments and the same error (<code>). Repeating it unchanged will fail again. Inspect the error, then change the arguments or the approach, ask the user for what is missing, or report the blocker.
```

#### Token 影响

达到或超过阈值的每次重复失败一条简短通知。

#### KV 缓存影响

只追加，位于工具结果之后。

### 审批拒绝

#### 模型看到什么

被拒绝或无人应答的调用会把审批服务的拒绝文本作为工具结果返回，例如 `the user rejected tool "send_email"`。

#### Token 影响

每个被拒绝的调用一个错误结果。

#### KV 缓存影响

只追加，取代工具本身的结果。

## 已知限制与暂缓工作

<a id="known-limitations-and-deferred-work"></a>

- **仅限目标轮次** — 自动目标轮次之外的失败既没有失败记录，也没有提醒。
- **精确标识** — 以略有不同的参数再次失败的调用会开始一个新条目；近似重复不会被归并。
- **按名称审批** — `approvalTools` 只匹配工具名；它无法根据参数区分只读的 MCP 调用和写入调用。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
