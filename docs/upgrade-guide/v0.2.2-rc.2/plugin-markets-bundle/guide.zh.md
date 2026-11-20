---
kind: upgrade-guide
description: "插件市场改为随 Web 与 Desktop profile 出厂的 @tomato/plugin-tomato-market 组合包；单独安装的 tomato-market 插件退役。"
---

# 插件市场随 Web 与 Desktop profile 出厂

[English](guide.md) | 中文

## 变更

营销插件市场与通用插件市场两个标签页原先需要单独打包的 `tomato-market` 插件，用 `tomato plugin add` 加入 profile。它的浏览器半无法通过客户端模块表加载，所以列了它的 profile 仍然看不到这两个标签页。

现在该组合包是 `@tomato/plugin-tomato-market`，作为工作区包由 Web profile 模板挂载，Desktop profile 也以该模板起始。新建的 Web 或 Desktop profile 无需安装任何东西，就在 **已安装** 与 **发现** 之间看到 **通用市场** 与 **营销市场**。浏览器半是客户端包 `@tomato/client-ui-tomato-market`。

`@tomato/plugin-tomato-market` 提供 Host 路由；它的客户端包渲染标签页。移除组合包的行会同时失去两个标签页，把行换到别处时两半都要保留。

## 迁移

1. 用 `tomato --profile <name>` 启动一次每个 profile。仍写着 `tomato-market` 的 Desktop profile 会被改写成 `@tomato/plugin-tomato-market`，无需手工修改；固定该包版本的 profile 要把条目改为 `@tomato/plugin-tomato-market`。
2. 用 `tomato plugin --profile <name> remove tomato-market` 从 profile 的 `package.json` 依赖里移除 `tomato-market` 条目；原包不再提供本版本可加载的组合包。
3. 市场行的覆盖配置改写到新行 id `plugin-tomato-market` 下。`indexUrls`、`starUrls`、`timeoutMs`、`cacheTtlMs`、`skillRoot` 这些字段名与默认值保持不变。
4. 确认：插件页在 **已安装** 之后列出 **通用市场** 与 **营销市场**，且 `tomato --profile <name> --dump-config` 显示 `plugin-tomato-market` 行已挂载。
