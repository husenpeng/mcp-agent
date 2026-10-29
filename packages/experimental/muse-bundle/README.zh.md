---
description: "在 Web 或 Desktop profile 中一并开启按账号隔离、跨会话的画像与工作区记忆，以及目标轮次专注。"
kind: "package-bundle"
---

# @tomato/experimental-muse-bundle

[English](README.md) | 中文

## 概述

让智能体在多个会话之间记住已陈述的偏好、决定和关于这个人的事实：画像记忆适用于每个工作区，工作区记忆只属于一个项目目录；Host 提供账号时，记忆归已登录账号所有。并防止长目标反复执行失败的调用。该配置层插入三个 Host 行：记忆服务、其工具和 `/memory` 命令，以及目标专注。Web 和 Desktop 随附此配置包，默认关闭，且不在默认插件列表中展示。它为每次请求增加三个工具 schema；在 profile 配置 `approvalTools` 之前不会征求任何审批。

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

在**插件 → 添加插件**中输入 `@tomato/experimental-muse-bundle`，选择**安装**，再选择**立即启用**。TOMATO 使用随包提供的版本，无需再次下载。也可在目标 [profile](../../boot/app-boot/README.zh.md#profiles) 的 `package.json` 中，将包名加入 `tomato.profile.bundles`。开启 HMR 时选择即时生效；否则需重启应用。关闭时移除其配置层；已保存的记忆仍保留在存储中。

这些行需要基础组合中的存储、目标、审批和命令服务，所有随附的 Web 和 Desktop profile 都会挂载它们。

### 你会得到什么

| 行 id | 包 | 新增 |
|---|---|---|
| `optional-memory` | [`@tomato/experimental-memory`](../memory/README.zh.md) | 基于 `tomato_memory` 存储域的 `ctx.memory`，先按所有者、再按画像或工作区隔离 |
| `optional-tool-memory` | [`@tomato/experimental-tool-memory`](../tool-memory/README.zh.md) | 带查询扩展的 `memory_search`、`memory_write`、`memory_forget`、`/memory` 与画像和置顶记忆注入 |
| `optional-focus` | [`@tomato/experimental-focus`](../focus/README.zh.md) | 目标轮次失败记录、重复失败提醒与可选的按工具审批 |

如需在调用高成本工具前征求确认，可在 profile 的 `cordis.patch.yml` 中覆盖专注行：

```yaml
- id: optional-focus
  config:
    approvalTools: ['mcp__hicreator__*']
```

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 — 点击展开</summary>

[`cordis.patch.yml`](cordis.patch.yml) 在 Host 层插入这三行，因此它们的工具注册在全局工具层，包括 minimal 在内的每个预设都会获得这些工具。后续 profile 补丁按 id 覆盖这些行。[profile 组合器](../../boot/app-boot/README.zh.md)负责补丁顺序和错误。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

[记忆服务](../memory/README.zh.md) · [记忆工具](../tool-memory/README.zh.md) · [目标专注](../focus/README.zh.md)

-----

<a id="model-experience"></a>
## 模型体验

间接地，通过[记忆工具](../tool-memory/README.zh.md)和[目标专注](../focus/README.zh.md)，由它们负责所有工具、结果和注入的上下文。

#### KV 缓存影响

该配置层本身不添加请求内容。开启或关闭它会改变活动会话的工具列表，从而使其已缓存的请求前缀失效一次。

## 已知限制与暂缓工作

<a id="known-limitations-and-deferred-work"></a>

- 记忆的范围是单个 Host 上的一个项目目录；它不会跟随登录账号或其他设备。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者上下文 — 点击展开</summary>

无。

</details>
