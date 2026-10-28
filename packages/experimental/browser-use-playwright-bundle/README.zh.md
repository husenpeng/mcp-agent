---
description: "按需安装 Playwright MCP 浏览器工具，每个会话独立 Chromium。"
kind: "package-bundle"
---

# @tomato/experimental-browser-use-playwright-bundle

[English](README.md) | 中文

## 概述

按需为 profile 添加 Playwright MCP 浏览器工具。每个活动 Session 拥有由提供方启动的独立 Chromium；本组合包挂载共享的 [browser-use 服务](../../browser-use/browser-use/README.zh.md) 与 [Playwright 提供方](../browser-use-playwright-mcp/README.zh.md)。它是官方按需组合包：安装器只列出、不随包分发，打开开关时才安装本包及其 Playwright 运行时。本包为实验性，并要求本机已有 Chromium 构建。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

打开 **插件**，在官方组合包中找到 **Playwright 浏览器** 并打开开关。Host 会按当前安装版本安装 `@tomato/experimental-browser-use-playwright-bundle` 并选中其层；关闭开关只取消选中，依赖仍保留。源码工作区安装 `link:` 依赖，正式安装则固定到发布版本。

本包固定使用的 Playwright 版本需要对应的 Chromium 构建。先在本机运行一次 `npx playwright install chromium`，或用 profile patch 替换提供方行并设置 `executablePath`。缺少浏览器时，每个新 Session 的 MCP 启动都会失败，并报告提供方的启动错误。

本包固定 `mode: launch` 与 `headless: true`。需要可见浏览器或连接已有浏览器时，保持本包关闭，改为在 profile patch 中挂载提供方并设置 `mode: attach` 与 `endpoint`，或设置 `headless: false`；参见[提供方配置](../browser-use-playwright-mcp/README.zh.md#use-this-package)。同一时刻只能注册一个 browser-use 提供方：本包与其他提供方同时激活会以已注册提供方的名称失败。

激活后创建的 Session 才会初始化 MCP 客户端；活动中的 Session 不会接管浏览器。启用后请重启或新建 Session。

-----

<a id="understand-the-implementation"></a>
## 理解实现

补丁插入服务行与 `headless: true` 的 launch 提供方行。[浏览器操作](../../../docs/subsystems/browser-use.zh.md)拥有提供方选择、Session 所有权与 MCP 初始化；[提供方](../browser-use-playwright-mcp/README.zh.md)拥有固定版本的上游服务、工具 schema 与浏览器行为。提供方卸载时停止接收工具调用、关闭已启动浏览器并释放注册。

-----

<a id="further-exploration"></a>
## 进一步探索

- [浏览器操作](../../../docs/subsystems/browser-use.zh.md)——提供方选择与 Session 所有权。
- [Playwright MCP 提供方](../browser-use-playwright-mcp/README.zh.md)——launch、attach 与超时配置。
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)——上游浏览器行为与浏览器安装。
- [按需发现决策](../../../.agents/notes/implemented/architecture/2026-10-27-official-on-demand-playwright-bundle.zh.md)——本包为何按需安装。

-----

<a id="model-experience"></a>
## 模型体验

### 浏览器工具与截图

#### What the model sees

Session 获得上游 Playwright MCP 工具，名称为 `mcp__playwright-mcp__<tool>`。页面快照为文本；截图为图像，遵循常规附件与呈现规则。工具调用共享该 Session 的 MCP 客户端与队列。

#### Token effect

激活会把 Playwright 工具 schema 加入新 Session 的请求。停用会停止接收工具调用并关闭提供方拥有的浏览器；Session 本身保持完整。

#### KV Cache effect

启用或停用本包会改变新 Session 的工具列表，使其缓存请求前缀失效一次。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 没有配置页：launch、headless、attach、可执行文件发现与超时都由组合包行或 profile patch 固定。
- 本包不安装 Chromium；浏览器缺失时首个 Session 会失败。
- 浏览器 profile、Cookie 与页面不会从 Session 日志恢复；恢复会得到全新的浏览器状态。
- `mode: attach` 同一时刻只能被一个 Session 占用，开关不提供该模式。
- 系统提示的 `toolOrder` 必须把浏览器工具留在 `<unlisted-tools>`；显式列出会使无浏览器连接的 Session 在组装提示时失败。

<a id="dev-note"></a>
### 开发备注

无。
