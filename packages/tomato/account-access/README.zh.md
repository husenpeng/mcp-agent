---
description: "从本地网关会话展示已验证角色与数字额度的飞书账号权限设置区块。"
kind: "package-reference"
---
# Account Access

[English](README.md) | 中文

## 概述

`@tomato/client-ui-account-access` 在现有飞书账号页旁增加一个 **权限** 设置区块。它读取 `/api/auth/session`，渲染 auth_service 为已登录用户验证的 `roles` 与 `quotas`。它不执行登录、退出或凭据处理；这些由 `@tomato/account` 与 `@tomato/gateway` 负责。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在浏览器装配中挂载于 locale 与 settings shell 之后；它注册 id 为 `account-access` 的 `settings.section`，无需配置。区块展示加载、未登录、不可用、角色与额度状态。缺少 `roles` 或 `quotas` 字段时显示为空列表，而不是错误。

<a id="model-experience"></a>
## 模型体验

无，因为本包只渲染浏览器状态，不携带模型可见文本。

#### KV Cache 影响

无；本包从不进入模型请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **只读投影**：区块展示角色与额度；执行发生在 Host 策略中，不在此配置。
- **每次挂载读取会话**：打开时读取网关路由且不轮询；角色变化在下次打开或聚焦刷新时出现。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

Host 半边刻意留空：本包经 `exports["./client"]` 交付，只注册一行 `order: -9` 的 `settings.section`。角色与额度由网关的 auth 会话验证，页面从不存储或编辑它们。

</details>
