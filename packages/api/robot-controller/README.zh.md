---
description: "Host robot Remote controller：把整份注册表快照、规格发布、实例化、重新绑定与 run 控制镜像到浏览器。"
kind: "package-reference"
---
# Robot Controller

[English](README.md) | 中文

## 概述

`@tomato/api-robot-controller` 持有 Host 的 `ctx.robotController` 服务，以及建立在 `@tomato/experimental-robot` seam 之上的生成 Client `ctx.remote.robot` 命名空间。`robot.watch` 推送整份注册表帧——每个规格的最新修订、全部 robot、全部 run、全部已注册模板——打开时一次，此后每次 `robot/changed` 事件再一次。`publish`、`instantiate`、`rebind`、`start`、`cancel`、`interrupt`、`correct`、`hire`、`capabilities` 镜像 seam 的操作：被拒绝的规格以 `robot/spec-invalid` 返回并携带 provider 的字段问题，缺失记录返回 `robot/not-found`，状态拒绝返回 `robot/conflict`。Client 半边安装 `ctx.robotRuns`，即 robot 页面渲染所用的快照与控制服务。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

Host controller 必须在 `@tomato/experimental-robot` provider 之后挂载：它 inject `robots` 与 `typert`，生成的 `robot` 命名空间是浏览器唯一使用的接口。`robot.watch(signal)` 在挂载期间没有自然结束；由 carrier 关闭，重连后的第一帧已经是完整的注册表。所有请求与返回值都是 JSON，客户端无需额外读取即可从帧重建界面。

`hire` 从可选的 `robotTemplates` 注册表读取模板，按请求的语言填入文案，并以本地化的模板名命名 robot；重名时依次追加 ` 2`、` 3` 等后缀。显式传入的 `name` 原样使用，重名时与普通发布一样报冲突。模板不存在、或部署中没有注册表时返回 `robot/not-found`，此时帧中的 `templates` 为空列表。

`capabilities` 把本地可选项投影给规格编辑器：请求工作区可见的技能、已注册的工具名、已配置的 MCP 服务器名，以及工作区目录。每个来源都是可选的，缺失时贡献空列表而不是让读取失败；Client 会传入当前查看 Session 的目录，以便包含项目级技能。

Client 入口只在装配选择了 `remote.robot` 的地方挂载；它为应用生命周期开启一条可重连的快照流，并把 RPC 透传暴露为 `RemoteResult` 值。服务名为 `robotRuns`，为浏览器上下文保留未来的 `ctx.robots` 槽位给客户端领域服务。

<a id="dev-note"></a>
## 开发备注

controller 不持有状态：读取是 `ctx.robots` 的投影，`watch` 在 `robot/changed` 后重新读取。校验与持久化属于 seam；controller 只把失败翻译成 Remote 错误码，并组装整份集合帧。线类型位于 `src/types.ts`，通过 `@tomato/experimental-robot/types` 引入领域词汇，使 client bundle 不会触达 Host 运行时代码。

<a id="model-experience"></a>
## 模型体验

无。该命名空间只承载浏览器控制面调用与注册表快照；robot run 的模型上下文由 runtime 包组装。

#### KV 缓存影响

controller 从不组装或发送 provider 请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- `robot.watch` 推送整份注册表帧；没有按记录的订阅、增量帧或分页，注册表很大时每帧都会整体传输。
- run 的保留与历史裁剪属于 provider 的职责；controller 只返回 `ctx.robots.runs` 列出的内容。
- robot 操作尚未声明 Remote 访问角色；需要这类控制的部署必须先在给出资源类型后再把命名空间暴露给不受信任的 Peer。
