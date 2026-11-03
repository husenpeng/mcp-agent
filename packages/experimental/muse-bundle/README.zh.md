---
description: "在 Web 或 Desktop profile 中一并开启按账号隔离、跨会话的画像与工作区记忆，以及目标轮次专注。"
kind: "package-bundle"
---

# @tomato/experimental-muse-bundle

[English](README.md) | 中文

## 概述

让智能体在多个会话之间记住已陈述的偏好、决定和关于这个人的事实：画像记忆适用于每个工作区，工作区记忆只属于一个项目目录；Host 提供账号时，记忆归已登录账号所有。防止长目标反复执行失败的调用，并提供每日工作回顾和未完成任务提醒。该配置层插入四个 Host 行：记忆及其工具、目标专注，以及带提示窗和右侧栏页面的每日洞察。Web 和 Desktop 随附此配置包，默认关闭，且不在默认插件列表中展示。它为每次请求增加三个工具 schema；只有 profile 配置 `approvalTools` 时才在调用工具前征求审批；每日洞察行不增加模型工具。

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

### 安装到 profile

在**插件**页打开实验性插件列表，打开**记忆与目标专注**的开关。TOMATO 使用随包提供的版本，无需下载。也可在目标 [profile](../../boot/app-boot/README.zh.md#profiles) 的 `package.json` 中，将包名加入 `tomato.profile.bundles`。开启 HMR 时选择即时生效；否则需重启应用。关闭时移除其配置层；已保存的记忆仍保留在存储中。

这些行需要基础组合中的存储、目标、审批、命令、会话查询和 LLM 服务，所有随附的 Web 和 Desktop profile 都会挂载它们。可选的 timer 服务驱动每日洞察的后台运行。

### 你会得到什么

| 行 id | 包 | 新增 |
|---|---|---|
| `optional-memory` | [`@tomato/experimental-memory`](../memory/README.zh.md) | 基于 `tomato_memory` 存储域的 `ctx.memory`，先按所有者、再按画像或工作区隔离 |
| `optional-tool-memory` | [`@tomato/experimental-tool-memory`](../tool-memory/README.zh.md) | 带查询扩展的 `memory_search`、`memory_write`、`memory_forget`、`/memory` 与画像和置顶记忆注入 |
| `optional-focus` | [`@tomato/experimental-focus`](../focus/README.zh.md) | 目标轮次失败记录、重复失败提醒与可选的按工具审批 |
| `optional-muse-insights` | [`@tomato/experimental-muse-insights`](../muse-insights/README.zh.md) | 每日回顾服务、未完成任务分析、一个全帧提示窗和一个右侧栏页面 |

如需在调用高成本工具前征求确认，可在 profile 的 `cordis.patch.yml` 中覆盖专注行：

```yaml
- id: optional-focus
  config:
    approvalTools: ['mcp__hicreator__*']
```

每日洞察行接受自己的范围参数和可选的显式回顾路由；[`@tomato/experimental-muse-insights`](../muse-insights/README.zh.md#configuration) 中的默认值无需覆盖。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

[`cordis.patch.yml`](cordis.patch.yml) 在 Host 层插入这四行，因此它们的工具注册在全局工具层，包括 minimal 在内的每个预设都会获得这些工具。每日洞察行通过同一个包加载浏览器侧。后续 profile 补丁按 id 覆盖这些行。[profile 组合器](../../boot/app-boot/README.zh.md)负责补丁顺序和错误。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

[记忆服务](../memory/README.zh.md) · [记忆工具](../tool-memory/README.zh.md) · [目标专注](../focus/README.zh.md) · [Muse 洞察](../muse-insights/README.zh.md)

-----

<a id="model-experience"></a>
## 模型体验

间接地，通过记忆工具、目标专注和每日洞察回顾请求，由它们负责所有工具、结果、注入的上下文和辅助请求。

#### KV 缓存影响

该配置层不向会话请求添加内容；每日洞察行会在所有会话之外分派一次辅助每日回顾请求，详见[其包说明](../muse-insights/README.zh.md#model-experience)。开启或关闭它会改变活动会话的工具列表，从而使其已缓存的请求前缀失效一次。

## 已知限制与暂缓工作

<a id="known-limitations-and-deferred-work"></a>

- 记忆的范围是单个 Host 上的一个项目目录；它不会跟随登录账号或其他设备。
- 每日回顾只读取在其回看窗口内创建的会话，其提示状态保存在浏览器本地。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者上下文 — 点击展开</summary>

无。

</details>
