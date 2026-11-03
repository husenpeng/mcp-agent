---
description: "营销与广告 bundle：挂载 @tomato/marketing 及其插件页，所有 provider 在配置前保持关闭。"
kind: "package-bundle"
---

# @tomato/marketing-app

[English](README.md) | 中文

## 概述

`@tomato/marketing-app` 以一个可开关的 bundle 把广告与营销集成加入 profile。它的 patch 增加两行：[营销插件](../../marketing/marketing/README.zh.md)——只有当 provider 已开启且凭据可解析时才挂载其 MCP 服务；以及[营销设置页](../../client/ui-settings-marketing/README.zh.md)——在 Web 插件页编辑该插件的设置段。安装 bundle 不改变任何工具：所有 provider 在配置前保持关闭。

## 目录

- [使用本包](#use-this-package)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

## 使用本包

<a id="use-this-package"></a>

把 bundle 加入已带有 `@tomato/base`、且为使用设置页而带有 `@tomato/web-app` 的 profile。

```sh
pnpm tomato plugin --profile web add @tomato/marketing-app
```

随后打开 **插件 → 营销**，开启某个 provider 并填写它需要的凭据。该 bundle 不属于任何出厂 profile 模板，因此只作用于选择它的 profile，不影响其他 profile。

没有 Web 客户端的 profile 仍会加载宿主行；只是没有可编辑该设置段的页面，所有 provider 保持关闭。

-----

## 进一步探索

<a id="further-exploration"></a>

- [营销插件](../../marketing/marketing/README.zh.md) —— 目录、设置字段与凭据解析。
- [营销设置页](../../client/ui-settings-marketing/README.zh.md) —— 编辑该设置段的页面。
- [web-app bundle](../web-app/README.zh.md) —— 该页面所需的 Web 组合。
- [mcp-client](../../mcp/mcp-client/README.zh.md) —— 每个 provider 挂载时经过的连接。

-----

## 模型体验

<a id="model-experience"></a>

### Provider 工具

#### 模型看到什么

在插件页配置某个 provider 之前，什么也没有。bundle 自身不贡献工具、提示词段或结果文本；已配置的 provider 通过营销插件与 `@tomato/mcp-client` 发布其定义。

#### Token 影响

未配置任何 provider 的 profile 为零。每个已配置 provider 会为可见其工具的 Agent 的每次请求增加对应 schema 成本。

#### KV Cache 影响

provider 全关时无；已挂载 provider 的定义在挂载集合变化前保持前缀稳定。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **不出现在官方插件列表。** 该 bundle 是工作区包而非已发布包，插件页不会列出它供按需安装；请显式加入 profile。
- **页面上没有 provider 诊断。** 页面只报告凭据是否已配置；启动失败的服务只通过宿主日志报告。

-----

### 开发备注

<a id="dev-note"></a>

<details>
<summary>维护者工作上下文——点击展开</summary>

bundle 没有运行时 API：它的 patch 与 `tomato.bundle.patch` 字段就是全部契约。目录新增 provider 不需要改动这里。

</details>
