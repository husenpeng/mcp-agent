---
description: "仅在开发版出现的设置页：记录本页面的网关调用并显示客户端组成。"
kind: "package-reference"
---

# @tomato/client-ui-settings-developer

[English](README.md) | 中文

## 概述

在未打包的桌面开发版中打开 **设置 → 开发者**，可以开启网关记录，查看本页面的一元 RPC 调用、连接流帧与客户端组成。开关是 volatile 的：不会写入 profile；打包版中该页面完全不注册。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

只有当桌面桥报告 `tomatoDesktop.development`（由未打包启动器设置）时页面才出现。**记录网关调用** 会给 `ctx.connection` 挂上观察器；关闭时不产生任何观察开销。**网关调用** 列出每次完成的一元 RPC（endpoint 与耗时）以及每个 WebSocket 帧（方向），行内展开可以看到完整的请求、响应或帧载荷。**清空** 丢弃已保留列表。**页面信息** 刷新版本标识、模块与插件行数、连接状态、当前面板、会话数与实时 Slot 树。打开开关时还会在窗口右下角打开一个浮动面板，设置页关闭后记录仍然可见；关闭该面板即停止记录。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节 —— 点击展开</summary>

Host 半通过 `ctx.settings.configure({ auto: false })` 在 `ui-settings-developer` 命名空间注册一个 volatile 的 `enabled` 字段，因此不会生成设置页，值也不会写入 profile patch。浏览器半通过 `ctx.configForms.get(NS)` 读取，并派生出布尔快照。`ctx.connection.observe` 每次完成的一元 RPC 与每个 socket 帧各产生一条观察；页面用 `createSnapshotStore` 保留最新 2000 条，每个动画帧最多刷新一次，并统计被丢弃的较早记录。页面信息按需通过 `readPageInfo` 读取，来源为启动清单、连接状态、布局面板、会话列表与 `ctx.slots.snapshot()`。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-settings](../ui-settings/README.zh.md) —— 开关写入所经的设置作用域与配置表单。
- [connection](../connection/README.zh.md) —— 提供 `ctx.connection.observe` 的传输层。
- [modules](../modules/README.zh.md) —— 页面报告的启动清单。
- [ui-layout](../ui-layout/README.zh.md) —— 页面报告的面板选择。
- [slots](../../../docs/subsystems/slots.zh.md) —— 页面渲染的 Slot 树。

-----

<a id="model-experience"></a>
## 模型体验

无。本包是浏览器侧的诊断界面，不注册任何模型输入。

#### KV Cache 影响

无；本包既不组装也不发送 provider 请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **观察范围仅限本页面的传输层** —— 列表包含一元 RPC 与连接 socket 流量；非 RPC 的 fetch 以及同一 Host 上的其他客户端仍需在 DevTools 查看。
- **保留列表按条数封顶** —— 只保留最新 2000 条，页面会显示被丢弃的较早记录数；载荷不做脱敏，因为该页面只存在于开发版。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作背景 —— 点击展开</summary>

开发标志来自 `tomatoDesktop.development`（由 `scripts/dev.ts` 从 `TOMATO_DESKTOP_DEV_APP` 设置），而不是 `app.isPackaged`，因此即使是未签名的发布产物也不会显示该页面。

</details>
