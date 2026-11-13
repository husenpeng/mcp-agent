---
description: "在可选客户端装配中挂载生成的 room Remote 贡献。"
kind: "package-reference"
---
# Robot Room Remote

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-room-remote` 是挂载生成的 `room` Remote 贡献的可选客户端行。Host 入口是普通的 Loader 可见空实现，使包出现在组合中；浏览器入口把贡献安装到 `ctx.remote`，并在插件生命周期内保持。贡献与 `ctx.roomRuns` 客户端服务位于 `@tomato/api-robot-room-controller`。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在客户端装配中，于 `@tomato/api-robot-room-controller` 与 `@tomato/api-gateway` 之后挂载：

```yaml
- name: '@tomato/experimental-robot-room-remote'
- name: '@tomato/client-ui-robot-room'
```

浏览器半调用 `ctx.remote.$mount(roomRemote)` 并返回卸载 disposer，因此禁用该行会移除命名空间及其暴露的全部方法。

<a id="model-experience"></a>
## 模型体验

### Remote 挂载

#### 模型看到什么

无；本包挂载浏览器传输，不携带 prompt 文本或工具 schema。

#### Token 影响

无；挂载 Remote 命名空间不进入模型请求。

#### KV Cache 影响

无；本包从不写入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与后续工作

- **不在默认组合中**——该行是可选；未挂载它的构建没有 `room` 命名空间，Room 页面无法解析 `ctx.roomRuns`。
- **一个命名空间**——同一客户端中第二个 controller 包不能再挂载第二个 `room` 命名空间。

<a id="dev-note"></a>
### 开发备注

本包只用于把 room 命名空间挡在共享客户端装配之外。Node 入口是空实现；浏览器入口是生成的贡献挂载。
