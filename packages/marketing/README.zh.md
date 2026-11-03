---
description: "营销包组：由一个设置段挂载的广告与营销集成，以及编辑该设置段的插件页。"
kind: "package-group"
---

# marketing/ — 广告与营销集成

[English](README.md) | 中文

## 概述

以一个可开关的 bundle 把广告与营销平台接入 profile。所有 provider 在有人在 Web 插件页打开它并填写所需凭据之前保持关闭；未改动的安装不会新增 MCP 服务、工具或提示词文本。本组组合 MCP 客户端、设置与凭据三个子系统，而不定义自己的子系统：目录是数据，每条连接的行为属于 `@tomato/mcp-client`。

## 目录

- [包](#packages)
- [相关文档](#related-documentation)
- [开发备注](#dev-note)

-----

<a id="packages"></a>
## 包

当 profile 需要通过 MCP 服务访问 Google Ads、Analytics、Meta/Instagram、TikTok、YouTube、X 或 Mailchimp 时，选择本组。

| 包 | 作用 |
|---|---|
| [`marketing/`](marketing/README.zh.md) | 宿主插件：provider 目录、设置段、凭据解析，以及每个已启用 provider 一条子连接 |
| [`marketing-app`](../bundle/marketing-app/README.zh.md) | 挂载该插件及其插件页的 bundle |
| [`ui-settings-marketing`](../client/ui-settings-marketing/README.zh.md) | 编辑设置段并写入凭据的插件页 |

-----

<a id="related-documentation"></a>
## 相关文档

- [MCP 子系统](../../docs/subsystems/mcp.zh.md) —— 外部服务的工具如何抵达模型，以及客户端的重连与失败行为。
- [凭据](../credentials/credentials/README.zh.md) —— 每个 provider 背后的密钥存放处。
- [设置](../settings/settings/README.zh.md) —— volatile 字段与表单执行的 patch 写入。
- [营销集成设计说明](../../.agents/notes/implemented/architecture/2026-10-30-marketing-integration-bundle.zh.md) —— 为什么用一个插件挂载全部 provider，而不是各做一个 bundle。

-----

<a id="dev-note"></a>
## 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

目录位于 `packages/marketing/marketing/src/providers.ts`；新增 provider 需要一条目录条目、其扁平字段名与对应设置字段。保持默认引用名与服务读取的环境变量名一致，已在环境中导出的部署就无需在页面上配置。

</details>