---
description: "公司网关抓取提供方：Host 如何带着桌面登录态经公司 BFF 抓取页面，以及 seam 仍然负责什么。"
kind: "package-reference"
---

# @tomato/web-fetch-company

[English](README.md) | 中文

## 概述

用这个包让 `ctx.web.fetch()` 走公司网关。网关持有抓取供应商（firecrawl 抓取、tavily 精读）及其凭证，因此本部署不需要任何供应商 key：提供方只把 URL 与桌面登录态发往 `POST /api/v1/fetch/web`，再把网关抽好的正文映射成 seam 的结果。它是 `@tomato/web-search-company` 的抓取对应物，适用于模型要读的页面必须由服务端取回、而不是走用户本机网络的部署。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用本包

与 `@tomato/web` 一起挂载，并给它网关 origin：

```yaml
- name: '@tomato/web'
  config:
    fetchProvider: company
- name: '@tomato/web-fetch-company'
  config:
    baseURL: https://test.tomatoai.vip
```

`baseURL` 缺省回落到 `$TOMATO_SEARCH_GATEWAY_URL`，也就是搜索提供方已经在读的那个 origin。

seam 只 pin 一个抓取提供方，且不在提供方之间兜底。与 `@tomato/web-fetch-http` 同时注册而不 pin `fetchProvider`，下一次抓取会以 `WEB_PROVIDER_AMBIGUOUS` 失败；因此一个 profile 要么保留本地提供方，要么切换到本包。

桌面壳发布登录会话；没有会话时 `ready()` 为 false，模型步骤既不声明也不派发 `web_fetch`，直接调用则以 `WEB_PROVIDER_CREDENTIAL_MISSING` 失败。

<a id="understand-the-implementation"></a>
## 理解实现

提供方把 `{url}` 连同 `session_id` cookie 发往 `POST /api/v1/fetch/web`，并把 `data` 映射为 `WebFetchResult`：`text` 落到 `text` 正文分支，`truncated` 原样透传，`statusCode` 按网关给的值转发。请求携带凭证，因此**从不跟随重定向**。

网关回公司统一的 `{data, meta}` / `{error}` 信封。401 或 `UNAUTHENTICATED` 映射为 `WEB_PROVIDER_CREDENTIAL_MISSING`；`RATE_LIMITED`、`UPSTREAM_TIMEOUT`、`INVALID_URL`、`FETCH_DISABLED` 各自映射到对应的 seam 错误码。配置的 `timeoutMs` 缺省 50 秒，高于网关自身 45 秒预算（firecrawl 202 轮询链加 tavily 兜底），避免慢而成功的抓取被提前中断。

<a id="model-experience"></a>
## 模型体验

### 页面抓取

#### 模型看到什么

`@tomato/tool-web` 呈现本提供方抽取的页面正文，带 `Fetched <url> (HTTP <status>)` 头，正文被网关截断时追加截断尾注。会话缺失、上游限流、抓取端点关闭或网关故障，以对应结构化错误消息到达模型；本提供方不新增提示词文本，也不暴露供应商名称。

#### Token 影响

返回正文是网关抽取好的 markdown 或纯文本，且离开服务前已被 BFF 截断，因此 token 成本取决于抽取后的页面，而不是本地提供方要转换的原始 HTML。

#### KV 缓存影响

无直接失效；任何请求前缀变化由上述消费方拥有。提供方转为未就绪会让 `web_fetch` 退出声明工具集，从而失效一次该请求前缀。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与后续工作

- **状态码真实性。** `WebFetchResult.statusCode` 没有「未知」分支。网关把 tavily 兜底标记为 `statusCodeSource: 'assumed'` 并填 200，但 seam 没有字段承载这个区别，渲染出的头无法区分观测到的响应码与假定值。
- **没有页面标题。** 网关会返回标题，seam 无处安放。
- **没有按请求的抽取控制。** `WebFetchRequest` 只有 URL，抽取深度与字符上限由网关决定。
- **成本闸门。** firecrawl 按页计费。搜索与抓取共用同一份网关额度，所以 BFF 把它们记在同一个进程内 UTC 日计数器里（`BLUE_GATEWAY_BUDGET_ENABLED`、`BLUE_GATEWAY_DAILY_QUOTA`，默认 500），耗尽时在打供应商之前回 429 `GATEWAY_QUOTA_EXCEEDED`；计数随重启归零、多副本之间不共享，供应商自身的额度仍是最终上限。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

基础组合把 `fetchProvider: http` 固定住，启用本提供方因此是组合决策，而不是依赖变更。网关把搜索与抓取记在同一份每日额度里，本提供方因此与搜索提供方共用这份额度。

</details>
