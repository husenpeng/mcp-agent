---
description: "面向 Harness 的广告与营销集成：依据插件自身的设置挂载 Google Ads、Analytics、Meta/Instagram、TikTok、YouTube、X 与 Mailchimp 的 MCP 服务，未配置即不启用。"
kind: "package-reference"
---

# @tomato/marketing

[English](README.md) | 中文

## 概述

`@tomato/marketing` 让智能体获得广告与营销工具，而不必为每个平台手写一条 MCP 行。插件读取同一个设置段，解析每个 provider 背后的凭据引用，并对「已开启且凭据可解析」的 provider 各挂载一次 `@tomato/mcp-client`。所有 provider 默认关闭，因此仅加入本包不会新增任何工具、进程或提示词文本。模型看到的工具按 provider 命名空间出现，例如 `mcp__google-ads__search`。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

## 使用本包

<a id="use-this-package"></a>

在已加载 `@tomato/mcp-client` 的组合中挂载本插件。[营销 bundle](../../bundle/marketing-app/README.zh.md) 已经这样组合，并附带编辑本设置段的[插件页](../../client/ui-settings-marketing/README.zh.md)。

```yaml
- name: '@tomato/marketing'
  config:
    googleAdsEnabled: false
    googleAdsDeveloperTokenEnv: GOOGLE_ADS_DEVELOPER_TOKEN
    mosaicEnabled: false
    mosaicMetaTokenEnv: META_ACCESS_TOKEN
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `googleAdsEnabled` | `false` | 挂载 Google Ads 服务（`pipx run --spec google-ads-mcp==0.0.5 google-ads-mcp`）。 |
| `googleAdsDeveloperTokenEnv` | `GOOGLE_ADS_DEVELOPER_TOKEN` | 存放开发者令牌的凭据引用。 |
| `googleAdsCredentialsFileEnv` | `GOOGLE_APPLICATION_CREDENTIALS` | 存放服务账号文件路径的凭据引用。 |
| `googleAdsLoginCustomerIdEnv` | `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | 使用登录客户号时存放其值的凭据引用。 |
| `googleAnalyticsEnabled` | `false` | 挂载 Analytics 服务（`pipx run --spec google-analytics-mcp google-analytics-mcp`）。 |
| `googleAnalyticsCredentialsFileEnv` | `GOOGLE_APPLICATION_CREDENTIALS` | 存放服务账号文件路径的凭据引用。 |
| `mosaicEnabled` | `false` | 挂载 Mosaic 服务（`npx -y -p @openpromo/ad-platforms-cli mosaic-ads-mcp`），覆盖 Meta、Instagram、TikTok、YouTube 与 X。 |
| `mosaicMetaTokenEnv` | `META_ACCESS_TOKEN` | 存放 Meta 访问令牌的凭据引用。 |
| `mosaicTiktokTokenEnv` | `TIKTOK_ACCESS_TOKEN` | 存放 TikTok 访问令牌的凭据引用。 |
| `mosaicYoutubeTokenEnv` | `YOUTUBE_ACCESS_TOKEN` | 存放 YouTube 访问令牌的凭据引用。 |
| `mosaicXTokenEnv` | `X_ACCESS_TOKEN` | 存放 X 访问令牌的凭据引用。 |
| `mailchimpEnabled` | `false` | 挂载 Mailchimp 服务（`pipx run --spec mcp-mailchimp mcp-mailchimp`）。 |
| `mailchimpApiKeyEnv` | `MAILCHIMP_API_KEY` | 存放 API Key 的凭据引用。 |
| `mailchimpServerPrefixEnv` | `MAILCHIMP_SERVER_PREFIX` | 存放数据中心前缀的凭据引用。 |

### 凭据

凭据引用是名字，不是密钥。插件通过 `ctx.credentials` 解析每个引用；凭据服务缺席或没有取值时回落到启动环境。因此密钥字面量不会进入 `cordis.yml`，由插件页写入的密钥由凭据域保存。

只有开关打开且它需要的每个环境变量都解析成功，provider 才会挂载。目录决定「需要」的含义：Google Ads 需要开发者令牌，Analytics 需要密钥文件路径，Mailchimp 需要 API Key；Mosaic 只要四个平台令牌中任意一个解析成功即可挂载。因缺少凭据而未挂载的 provider 会记录一条警告，列出未解析的环境变量名。

### 失败行为

某个 provider 的服务启动失败，不会影响其他 provider 或宿主：`@tomato/mcp-client` 报告该失败，其工具保持缺席。被跳过的 provider 由本插件记录一条警告，其余情况不产生任何隐式挂载。

-----

## 理解实现

<a id="understand-the-implementation"></a>

<details>
<summary>实现内部——点击展开</summary>

本包分为两部分：[providers.ts](src/providers.ts) 是目录、扁平字段名与纯计划器；[index.ts](src/index.ts) 负责解析凭据并创建子连接。这样的拆分让「这个 provider 是否挂载、带什么环境变量」的判断无需 Cordis 上下文即可测试，`tests/providers.spec.ts` 覆盖了它。

字段采用扁平结构而非按 provider 嵌套，因为客户端设置表单模型只寻址顶层字段。provider 的 id、开关字段与环境变量到引用的映射集中在同一张表，客户端页与宿主插件因此不会对命名产生分歧。

挂载是 effect 作用域的：每个子连接创建在插件自己的 fiber 内，因此卸载时注销其工具并结束连接。保存设置会改写 profile patch，进而重载该条目并以新设置重新执行 `apply`。

</details>

-----

## 进一步探索

<a id="further-exploration"></a>

- [marketing-app bundle](../../bundle/marketing-app/README.zh.md) —— 挂载本插件与该页面。
- [营销设置页](../../client/ui-settings-marketing/README.zh.md) —— 编辑本设置段并写入凭据的插件页。
- [mcp-client](../../mcp/mcp-client/README.zh.md) —— 每个 provider 挂载时经过的连接。
- [credentials](../../credentials/README.zh.md) —— 开关解析所依赖的引用接缝。

-----

## 模型体验

<a id="model-experience"></a>

### Provider 工具

#### 模型看到什么

所有 provider 关闭时什么也没有，而这是默认状态。已挂载的 provider 通过 `@tomato/mcp-client` 以 `mcp__<serverName>__<tool>` 发布自己的工具定义；本包不新增工具、提示词段或结果文本。

#### Token 影响

已挂载 provider 的 schema 成本会在可见该工具的 Agent 的每次请求上计费。一次把 provider 挂载或卸载的设置保存，会整体增删这组 schema。

#### KV Cache 影响

关闭时无。已挂载 provider 的影响由 `@tomato/mcp-client` 负责：定义在挂载集合变化前保持前缀稳定，挂载或卸载 provider 的保存可能从第一个变化的 schema token 起失效。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **命令沿用上游打包方式。** Google Ads 与 Mosaic 的命令已按其发布包核验；Analytics 与 Mailchimp 的控制台脚本名未核验。两者都是设置段上的普通字段，上游改名时按配置修正即可，不需要改代码。
- **Mosaic 内部没有分平台开关。** 一个服务覆盖四个平台，令牌决定哪些平台可用；插件页因此展示四个凭据控件。
- **provider 失败只记录日志。** 启动失败的服务只表现为工具缺席，插件页没有对应诊断；页面只报告凭据的已配置状态。

### 开发备注

<a id="dev-note"></a>

<details>
<summary>维护者工作上下文——点击展开</summary>

目录是数据而非策略：新增 provider 需要一条 `PROVIDERS` 条目、`PROVIDER_FIELDS` 中的字段名，以及对应设置字段。保持默认引用名与服务读取的环境变量名一致，已在环境中导出的部署就无需额外配置。

</details>