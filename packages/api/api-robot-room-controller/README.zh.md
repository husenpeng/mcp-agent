---
description: "面向浏览器客户端的 Robot Room Remote 流、发布、发言、批准与消息读取。"
kind: "package-reference"
---
# Robot Room Controller

[English](README.md) | 中文

## 概述

`@tomato/api-robot-room-controller` 拥有生成的 `room` Remote 命名空间。Host controller 以整帧流式发送当前群聊，并提供发布、人类发言、暂停/恢复、放宽/结束、批准与消息读取。客户端半安装 `ctx.roomRuns`：一条可重连的快照流加上 RPC 透传。controller 不持有领域状态；每次读取都投影 `ctx.rooms`。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发说明](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 `@tomato/experimental-robot-room-local` 之后挂载 Host controller，并通过 `@tomato/experimental-robot-room-remote` 挂载客户端贡献：

```yaml
- name: '@tomato/experimental-robot-room-local'
- name: '@tomato/api-robot-room-controller'
- name: '@tomato/experimental-robot-room-remote'
- name: '@tomato/client-ui-robot-room'
```

Host 方法包括 `rooms`、`room`、`publish`、`post`、`messages`、`pause`、`resume`、`relaxOnce`、`endEpisode`、`approve` 与 `watch` 流。发布被拒绝时携带 `room/spec-invalid` 和全部字段问题；未知记录携带 `room/not-found`；群聊当前状态拒绝操作时携带 `room/conflict`。

客户端服务暴露 `ctx.roomRuns.state`（`{ rooms }`）与同样的方法，每个方法返回 `RemoteResult`。

<a id="model-experience"></a>
## 模型体验

### Room Remote

#### 模型看到什么

无；controller 是面向浏览器的投影，不携带 system prompt 文本或工具 schema。

#### Token 影响

无；controller 的任何操作都不进入模型请求。

#### KV Cache 影响

无；controller 从不写入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与后续工作

- **整群帧**——`watch` 每次变化都发送全部群聊；消息不随帧发送，而是通过单独的 `messages` 读取。
- **没有乐观并发**——发布不携带期望修订号；最后一个写入者替换规格，provider 的修订号是唯一顺序。
- **轮询兜底**——客户端快照由流驱动，但页面仍以一秒间隔读取消息，因为流不携带消息增量。

<a id="dev-note"></a>
### 开发备注

Host controller 是一个薄的 `TypertRemoteService`；每个方法委托给 `ctx.rooms`。客户端服务沿用 crew controller 的模式：一条 `$stream` 代喂给 `RoomRunsModel`，RPC 方法返回 `RemoteResult`，页面不必包装 carrier 失败。
