---
description: "在可选客户端装配中挂载生成的 robot Remote 贡献。"
kind: "package-reference"
---
# Robot Remote

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-remote` 是客户端行：在选择了 robot bundle 的浏览器装配中挂载生成的 `robot` Remote 贡献。它与 `@tomato/api-robot-controller/client` 分开，是因为后者 inject `remote.robot`：必须先安装命名空间，依赖它的插件才能激活。把挂载放在这个可选行里，也让共享客户端装配不残留任何 robot 包引用。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在与 `@tomato/api-robot-controller` 一同装配的浏览器组合中挂载本插件。它需要 `remote`；唯一行为是 `ctx.remote.$mount(robotRemote)`，并把贡献的释放函数作为卸载 effect 返回。

<a id="model-experience"></a>
## 模型体验

None, as 插件只挂载浏览器 Remote 描述符，不添加模型可见输入。

#### KV 缓存影响

无；插件从不组装或发送 provider 请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 贡献按插件实例挂载一次；第二个行挂载同一贡献会被 Gateway 以重复方法拒绝。
- 片段描述符由 Host face 生成，`@tomato/api-robot-controller` 的 Remote 方法变化后必须重跑 `pnpm run generate-typert` 再构建本包。

<a id="dev-note"></a>
### 开发备注

该独立行的作用是让挂载跟随 bundle 选择，而不进入共享的 client 装配：`@tomato/api-robot-controller/client` 注入 `remote.robot`，所以本包必须在该服务激活前安装命名空间。描述符由 Host face 生成，controller 的 Remote 方法变化后，这里需要重跑 `pnpm run generate-typert`。
