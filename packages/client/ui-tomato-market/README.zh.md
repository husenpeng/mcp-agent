---
description: "Web 插件页的营销插件市场与通用插件市场两个标签页：精选营销清单与开源插件目录，安装统一走插件页自己的安装对话框。"
kind: "package-reference"
---

# @tomato/client-ui-tomato-market

[English](README.md) | 中文

<a id="summary"></a>
## 概述

**插件** 页在 **已安装** 与 **发现** 之间多了两个标签页：先是 **通用市场**，然后是 **营销市场**。两者都按分类浏览、支持搜索、筛选、排序与分页；点开条目可以看到事实信息、版本与说明文档。安装插件包时，标签页把精确版本交给插件页自己的安装对话框，页面只有这一条安装路径；安装 MCP 服务器与 Skill 由 [`@tomato/plugin-tomato-market`](../../../plugins/tomato-market/README.zh.md) 按清单固定的条目 id 完成。

## 目录

- [概述](#summary)
- [使用](#use-this-package)
- [实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用

打开 **插件**，选择任一市场标签页。两个标签页只在本包挂载时出现；本包属于插件市场组合包，profile 不挂载该组合包时两个标签页都不显示。

**营销市场** 按类型（插件 / MCP / Skill）计数，按分类筛选，搜索名称、平台、分类与子技能名。每行显示图标、类型与准入标签（需免费 key、需自部署、需登录、手动安装、已安装）、两行描述，以及许可证、最近更新与仓库。条目页显示完整描述、固定版本或固定 commit、安装会写入的 Skill、条目读取的环境变量、使用读者自己登录态的条目的账号风险提示，以及仓库 README。MCP 服务器与 Skill 的 **安装** 先打开确认弹窗，显示将运行的命令、追加到 `cordis.patch.yml` 的行或写入的目录，以及技能重名冲突；确认后由 Host 执行，并说明当前 profile 已生效还是需要重启。卸载只删除该条目安装的内容。

**通用市场** 按分类分组浏览开源目录，支持搜索、分类胶囊，以及按 GitHub 星标、最近更新或名称排序。插件页显示分类、是否面向 TOMATO、运行中的 TOMATO 版本、最新版本是否兼容，然后是来源信息、版本列表与 README。**安装** 先用安装器自身的规则检查版本：兼容的插件在插件页安装对话框的检查页打开；只面向 TOMATO 的插件提供兼容层；未声明 bundle 的包被拒绝；注册表无法确认兼容性的版本仍可选择继续安装。最新版本需要更新的 TOMATO 时，标签页会自动改用能运行的最新已列版本，并在列表上方说明。

-----

<a id="understand-the-implementation"></a>
## 实现

两个标签页注册到 [`ui-plugin-manager`](../ui-plugin-manager/README.zh.md) 声明的 `plugins.tab`。父级 props 是插件页的 `install({ spec, registry?, title, version })` 与 `openPackage(name)`；标签页自身从不安装。所有事实都来自 Host 半在经过鉴权的 `api/tomato-market` 路由上返回的数据；请求与回复类型定义在 `@tomato/plugin-tomato-market/api`，浏览器侧只引用类型，唯一内联的值是路由字符串。

每个标签页有一个不依赖 React 的控制器（`general-controller.ts`、`marketing-controller.ts`），在快照 store 里保管读取结果、筛选、打开的条目与安装前检查；注册的组件把它绑定为 `useGeneral` 或 `useMarketing`，操作通过注入获得。视图（`GeneralMarket.tsx`、`MarketingMarket.tsx`）是纯 props 组件：注册的入口读一次状态与当前语言，再以单一语言渲染视图，语言切换时重建派生视图，而不是在视图内部重新推导文案。纯函数在 `catalog.ts` 与 `marketing-search.ts` 中：本地化文本、星标查找、搜索、排序、分类分组、安装规格与兼容性标签。营销标签页复用通用标签页的兼容性检查，因此固定的插件包得到与目录插件相同的解释。两个标签页通过 locale 查找链使用公共词汇；自己的文案在 `locales.ts`，以中文为 key 源。

-----

<a id="model-experience"></a>
## 模型体验

无：本包只在浏览器中渲染 Host 数据，不向模型请求添加任何内容。

#### KV Cache 影响

无。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与待办

- **不在 MCP 服务器与 Skill 上做索引搜索。** 营销搜索只匹配随包清单；发现标签页与自定义索引是另一套入口。
- **MCP 服务器与 Skill 没有更新路径。** 安装固定到审核过的版本或 commit，更新需要卸载后重装。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>给维护者的工作背景——点击展开</summary>

两个标签页与目录读取同在一个客户端包：Host 半经 `/api/tomato-market` 作答，浏览器半把标签页注册到 `plugins.tab`。安装插件包时只把阶段交给插件页自己的安装对话框，页面因此保持唯一一条安装路径。

</details>
