---
description: "插件市场 Host 半：为营销插件市场与通用插件市场标签页提供目录读取、兼容性判定与安装，经 `/api/tomato-market` 鉴权路由访问。"
kind: "package-reference"
---

# @tomato/plugin-tomato-market

[English](README.md) | 中文

## 概要

插件市场的 Host 半：读取开源 Tomato 插件目录及其 GitHub 星标，读取某个已列版本发布的清单与 README，提供随包打包的营销清单，并安装该清单里的 MCP 服务器与 Skill。Web 与 Desktop profile 把它写进出厂组合包，因此 [通用市场与营销市场标签页](../../packages/client/ui-tomato-market/README.zh.md) 无需安装就出现在插件页。

## 目录

- [使用](#use-this-package)
- [实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发说明](#dev-note)

-----

<a id="use-this-package"></a>
## 使用

打开 **插件 → 通用市场** 或 **插件 → 营销市场**。标签页通过鉴权的 `POST /api/tomato-market` 路由向本包索取全部事实；浏览器从不选择命令。

### 营销清单

清单随包打包在 `src/host/marketing-catalog.json`，浏览不需要联网。每条条目声明类型（插件、MCP 服务器或 Skill）、分类、准入方式（免费、需免费 key、需自部署、使用读者自己的登录态）与一种安装方式。插件条目声明精确的 npm 包与版本，标签页把它交给插件页自己的安装对话框。MCP 条目声明 `npx` 或 `uvx` 运行器、精确的包与版本，以及它读取的环境变量名；安装会在运行中 profile 的 `cordis.patch.yml` 里一段带注释标记的区块中追加一行 `@tomato/mcp-client`，行 id 为 `mkt-mcp-<id>`，服务器名为 `mkt-<id>`。Skill 条目声明 GitHub 仓库、完整 commit 与要安装的技能目录；安装通过 jsDelivr 下载到 `$TOMATO_HOME/skills/<name>` 并写入 `.tomato-market.json` 标记，卸载只删除该条目安装过的带标记目录。手动安装条目只给出步骤，不安装任何东西。

每次写入 MCP 都先把原文件复制为 `cordis.patch.yml.bak-tomato-market`，在 HMR 队列与 profile 清单锁内用临时文件加重命名整体替换，profile 拒绝新配置时恢复原文件。市场区块以外的文字逐字节保留，区块被手动修改时停止写入并说明原因。凭据从不写入文件：条目只声明变量名，行里用 `!!js` 表达式从 Host 环境读取，因为 MCP 子进程会丢掉形似凭据的环境变量名。

### 通用目录与安装

开源目录来自 jsDelivr 上的 `tomato-plugin-catalog` npm 包，依次回退到 `awesome-tomato-plugin.com` 与 `dshmarket.com`；星标来自同源发布的 `plugins.json`。一次读取为每个插件保留最新 24 个版本、400 字符的描述与关键词。标签页渲染目录事实，并向本包索取某个版本的清单、判定运行中的 TOMATO 接受哪个已列版本、读取 README，或经兼容层转换。

版本兼容性使用安装器自身的规则，对照 profile `installAnchor` 清单里的 `version`：包声明了 `engines.tomato` 就只看这条范围，否则检查每个 `@tomato/*` peer 范围，内置的 vendored Cordis 包除外。判定从读者选择的版本开始，然后依次尝试目录里其余版本与注册表发布的更早版本，最多读取 8 份清单，返回运行中 TOMATO 接受的第一个版本。只声明 Tomato Harness 元数据的包可以按需转换：本包下载该版本的 tarball，拒绝不安全的条目与超限的压缩包，把包名、peer 依赖与文本导入改写成 Tomato 命名，以单一 `package/` 根目录重新打包，并返回 `file:` 规格交给插件页的安装对话框。转换只读写文本，从不执行包代码。

### 配置

`tomato-market` 行接受以下字段，每个都有固定默认值：

| 字段 | 默认 | 含义 |
|---|---|---|
| `indexUrls` | jsDelivr 的 `tomato-plugin-catalog/index.json`，其次 awesome-tomato-plugin.com、dshmarket.com | 目录镜像，按顺序回退 |
| `starUrls` | jsDelivr 的 `tomato-plugin-catalog/plugins.json`，其次 awesome-tomato-plugin.com | 星标文档镜像 |
| `timeoutMs` | `20000` | 单次 HTTP 读取（含正文）的上限 |
| `cacheTtlMs` | `600000` | 目录、星标、清单与 README 读取成功后的缓存时间 |
| `skillRoot` | `$TOMATO_HOME/skills` | Skill 条目的安装目录 |

注册表固定：先用 `registry.npmjs.org`，再用 `registry.npmmirror.com`。路由只接受目录里列出的 `name@version` 与营销条目 id，从不接受浏览器传来的 URL 或命令。

-----

<a id="understand-the-implementation"></a>
## 实现

本包是一个函数插件：`inject` 只列出 `connection`，非 Web 的官方组合没有浏览器路由时路由注册被跳过，而读取仍服务于 Desktop 打包检查。一个 market 对象保管每次 HTTP 读取的 AbortController、缓存、注册表回退、兼容层缓存目录（`$TOMATO_HOME/.plugin-market/adapted`）与两个安装器；路由在调用前按 `src/api.ts` 的形状校验每个字段，卸载时中止读取。

`src/api.ts` 是共享的 Web 契约：请求与回复类型、`ManifestFacts`、`Resolution`、`MarketingPreview`，插件页标签页的父级 props `MarketTabProps`，以及浏览器半内联的 `ROUTE`。Host 在 `/${ROUTE}` 提供路由。

源码一览：

| 文件 | 作用 |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件入口、market 对象、路由处理 |
| [`src/api.ts`](src/api.ts) | 共享的请求、回复与标签页 props 契约 |
| [`src/host/catalog.ts`](src/host/catalog.ts) | 目录镜像、压缩与星标表 |
| [`src/host/http.ts`](src/host/http.ts) | 有上限的 HTTP 读取与读取缓存 |
| [`src/host/registry.ts`](src/host/registry.ts) | 清单分类与 README 候选 |
| [`src/host/compatibility.ts`](src/host/compatibility.ts) | 安装器的兼容规则与候选顺序 |
| [`src/host/compat.ts`](src/host/compat.ts) | Tomato Harness → Tomato 改名 |
| [`src/host/adapt.ts`](src/host/adapt.ts) | tarball 转换 |
| [`src/host/marketing.ts`](src/host/marketing.ts) | 随包清单校验与 MCP 命令 |
| [`src/host/marketing-readme.ts`](src/host/marketing-readme.ts) | 条目的长说明 |
| [`src/host/mcp-install.ts`](src/host/mcp-install.ts) | `cordis.patch.yml` 行 |
| [`src/host/skill-install.ts`](src/host/skill-install.ts) | Skill 目录 |

-----

<a id="model-experience"></a>
## 模型体验

无：营销市场与通用市场的 Host 半只服务插件页的标签页，不向模型请求添加任何内容。

#### KV Cache 影响

无：本包读取或安装的内容都不会进入模型请求。

-----

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与待办

- **兼容性只是清单判断。** 规则只读声明的范围，与安装器一致，因此声明满足但内部假设另一套 harness 的插件仍可能加载失败。
- **每次安装最多读 8 份清单。** 若这个范围内的候选都不兼容，注册表里更早的版本可能无法到达。
- **MCP 服务器与 Skill 没有更新路径。** 每次安装固定到审核过的版本或 commit，更新需要卸载后重装。
- **转换后的包保留 `file:` 来源。** 经兼容层安装后，插件页显示的是本地 tarball，更新需要重新从市场安装。

<a id="dev-note"></a>
### 开发说明

<details>
<summary>给维护者的工作背景——点击展开</summary>

本组合包以 `@tomato/plugin-tomato-market` 发布。0.2.2 之前的版本在 Desktop profile 里挂载的是单独打包的插件 `tomato-market`，它的浏览器半无法加载。Desktop 现在会改写仍然写着旧组合包的 profile，旧包保持退役状态。

</details>
