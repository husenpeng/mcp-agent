---
description: "在可选客户端装配中挂载生成的 crew Remote contribution。"
kind: "package-reference"
---
# Robot Crew Remote

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-crew-remote` 是在选择机器人 bundle 的浏览器装配中挂载生成 `crew` Remote contribution 的客户端行。它独立于 `@tomato/api-robot-crew-controller/client`，因为该服务注入 `remote.crew`：命名空间必须先安装，插件才能依赖它。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 `@tomato/api-robot-crew-controller` 之后、`@tomato/client-ui-robot-crew` 之前选择该行。Node 半边是 Loader 可见的 no-op；client 半边在插件生命周期内挂载 contribution。

<a id="model-experience"></a>
## 模型体验

无，因为本包不携带模型可见文本。

#### KV Cache 影响

无；本包从不进入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **必须单独一行**：客户端插件不能在自己的 apply 中挂载 Remote contribution，同时又把该命名空间作为注入服务依赖。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

Node 半边刻意留空，使本包看起来是一行普通 Loader 行。浏览器半边挂载生成的 `crew` 贡献，Remote 描述符都在那里。

</details>
