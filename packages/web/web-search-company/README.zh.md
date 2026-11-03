---
description: "公司网关搜索提供方：Host 如何用已登录的桌面会话经公司 BFF 搜索，以及哪些契约仍由 seam 拥有。"
kind: "package-reference"
---

# @tomato/web-search-company

[English](README.md) | 中文

## 概述

用这个包让 `ctx.web.search()` 走公司网关。网关持有搜索供应商及其凭据，所以该部署不需要任何供应商 key：提供方只把查询和桌面登录会话发到 `POST /api/v1/search/web`，再把网关归一化的结果映射成 seam 的 sources。对于聊天路由是第三方 API、无法携带提供方侧搜索工具的部署，它就是随产品提供的搜索后端。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用本包

与 `@tomato/web` 一同挂载，并给出网关源站：

```yaml
- name: '@tomato/web'
- name: '@tomato/web-search-company'
  config:
    baseURL: https://test.tomatoai.vip
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `baseURL` | `$TOMATO_SEARCH_GATEWAY_URL` | 网关源站；追加 `/api/v1/search/web`。为空则提供方不可用。 |
| `timeoutMs` | 45000 | 单次请求的端到端预算，高于网关自身的 40 秒上游预算。 |
| `maxResults` | （不设） | 请求未带条数时的默认上限，1 至 20；请求上限更大时会被夹取并标记为 truncated。 |
| `maxCharsPerResult` | 500 | 以 `maxCharsPerResult` 转发的单条节选预算；网关会按自身上限再夹取。 |
| `maxChars` | 3000 | 以 `maxChars` 转发的节选总量预算；网关会按自身上限再夹取。 |

提供方用桌面外壳发布给 Host 的会话（`ctx.desktopSession`）鉴权，其 `ready()` 报告当前是否存在该会话。因此未登录或没有会话的组合不算 ready：模型步骤既不声明也不派发 `web_search`，而步骤之外直接调用会以 `WEB_PROVIDER_CREDENTIAL_MISSING` 失败。

<a id="understand-the-implementation"></a>
## 理解实现

`search()` 发送 `{query, maxResults?, maxCharsPerResult?, maxChars?}` 并携带 `session_id` cookie，且拒绝跟随 HTTP 重定向，会话不会被转发到另一个源站。查询必须为 1–400 字符，超长在派发前即被拒绝。网关返回 `{data:{results:[…], truncated, answer?}, meta:{traceId, schemaVersion, budget}}` 或 `{error:{code,message,retryable}, meta:{traceId}}`。

映射：`url` 必填（缺少则丢弃该条），`title`、`snippet`、`publishedAt` 非空才复制；`answer` 成为结果的 `content`；`truncated` 透传网关的条数截断标记，请求自身的 `maxResults` 仍由 `@tomato/web` 在其上收紧。失败消息保留网关原文；网关标记可重试时追加重试提示，返回 trace id 时一并写明。

| 网关响应 | 提供方结果 |
|---|---|
| 200 | 归一化后的 sources，并携带网关的 `truncated` 标记 |
| 400 `INVALID_QUERY` / `INVALID_MAX_RESULTS` / `INVALID_BODY` | 携带网关可操作消息的 `WEB_PROVIDER_ERROR` |
| 401 `UNAUTHENTICATED` | `WEB_PROVIDER_CREDENTIAL_MISSING`（需重新登录） |
| 429 `RATE_LIMITED` | `WEB_PROVIDER_RATE_LIMITED`（稍后重试） |
| 502 `UPSTREAM_UNAVAILABLE` | `WEB_PROVIDER_ERROR`（稍后重试） |
| 503 `SEARCH_DISABLED` | `WEB_SEARCH_DISABLED`（部署未开启搜索） |
| 504 `UPSTREAM_TIMEOUT` | `WEB_PROVIDER_TIMEOUT`（稍后重试） |
| 其它非 2xx | 携带网关消息的 `WEB_PROVIDER_ERROR` |
| 取消 | `WEB_ABORTED` |

<a id="model-experience"></a>
## 模型体验

间接经 `@tomato/tool-web` 呈现本提供方的 URL、标题、节选与可选答案，并把完整文本限制在 `searchMaxOutputChars`。会话缺失、上游限流、搜索端点关闭或网关故障，以对应结构化错误消息到达模型；本提供方不新增任何提示词文本。

#### KV 缓存影响

无直接失效；任何请求前缀变化由上述消费方拥有。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 提供方的可用性完全取决于公司网关；本包内没有供应商兜底。
- 按用户配额、用量记账与滥用限制属于网关，不在本包。
- 会话中途过期会让搜索失败，直到用户重新登录。

<a id="dev-note"></a>
### 开发备注

默认 45 秒预算刻意高于网关自身的 40 秒 tavily→google 兜底链，使慢但成功的搜索不会在网关回答前被中止。`timeoutMs` 限定的是整个网关请求，而不是模型工具预算——后者由 `@tomato/tool-web` 掌管。`search()` 从不跟随重定向，因为请求携带用户的 `session_id` cookie。
