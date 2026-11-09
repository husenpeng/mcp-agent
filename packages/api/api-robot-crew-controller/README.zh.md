---
description: "面向浏览器客户端的 Crew Remote roster 流、规格发布、启动/取消运行与流程账本读取。"
kind: "package-reference"
---
# Robot Crew Controller

[English](README.md) | 中文

## 概述

`@tomato/api-robot-crew-controller` 在 `@tomato/experimental-robot-crew` seam 上拥有 Host `ctx.crewController` 与生成的 `crew` Remote 命名空间。`crew.watch` 在打开时以及每次 `crew/changed` 后流式发送完整 roster 帧（每个 crew 的最新 revision 与每个 run）。`publish`、`start`、`cancel`、`revision`、`runs` 和 `entries` 镜像该 seam；被拒绝的规格以带字段问题的 `crew/spec-invalid` 到达，缺失记录为 `crew/not-found`，被拒绝的状态变更为 `crew/conflict`。Client 半边为工作室安装 `ctx.crewRuns`。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在 crew provider 之后挂载 Host controller；它注入 `crews` 与 `typert`。在浏览器装配中先挂载 `@tomato/experimental-robot-crew-remote`，再让 `@tomato/client-ui-robot-crew` 依赖 `remote.crew`。所有值都是 JSON，因此重连 generation 的第一帧已携带完整 roster。账本条目按 run 通过 `entries` 读取而不是流式发送，因为一个 run 可以产生数百条条目。

<a id="dev-note"></a>
## 开发备注

控制器不持有状态：所有读取都投影自 `ctx.crews`，`watch` 在 `crew/changed` 后推送整帧 roster。注册表负责校验、持久化与运行生命周期；控制器只把提供方失败翻译成 `crew/...` Remote 代码与规格问题列表，`entries` 按需读取某次运行的流程账本而不是流式推送。线格式类型位于 `src/types.ts`，通过 `@tomato/experimental-robot-crew/types` 引入 crew 词汇，使客户端 bundle 不会触达 Host 运行时代码。

<a id="model-experience"></a>
## 模型体验

无，因为本包只承载浏览器传输，不携带模型可见文本。

#### KV Cache 影响

无；本包从不进入模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- **没有账本流**：客户端通过 `entries` 重读所选 run 的条目；活动 run 的条目由客户端轮询获得。
- **帧内没有按 run 过滤**：每帧携带所有 run，对当前 roster 规模是正确的。
