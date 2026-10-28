---
description: "番茄同源本地网关：auth_service 会话路由、固定服务转发表，以及已验证用户身份注入。"
kind: "package-reference"
---

# @tomato/gateway

[English](README.md) | 中文

## 概述

`@tomato/gateway` 挂在 tomato Web Host 内、Connection 的 `/api` 前缀旁。它向浏览器提供同源的 `/api/auth/*` 登录、会话投影与登出路由，以及固定服务表驱动的 `/api/services/<service>/*` 转发。每个受保护请求都经 auth_service 校验并携带已验证用户 id；浏览器不能指定目标 host。Host RPC、模型请求、工具出站与 OTLP 遥测不经过本包。

## 目录

- [使用本包](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>

## 使用本包

在具备 `webServer` 与 `connection` 的浏览器 Host 中挂载：

```yaml
- id: tomato-gateway
  name: '@tomato/gateway'
  config:
    authServiceUrl: http://127.0.0.1:8003
    companyWebUrl: https://test.tomatoai.vip
    services:
      demo:
        baseURL: http://127.0.0.1:8010
        userIdInjection: query
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `authServiceUrl` | `''` | auth_service 基础地址；为空时登录不可用 |
| `companyWebUrl` | `''` | 公司 BFF 基础地址；为空时登录不可用 |
| `services` | `{}` | 按 URL 服务段索引的固定表；每项必须提供 `baseURL` |
| `verifyTimeoutMs` | `2000` | 会话校验超时 |
| `requestTimeoutMs` | `30000` | 上游请求超时 |
| `maxRequestBodyBytes` | `10485760` | body 注入时的缓冲上限 |
| `stateTtlMs` | `600000` | 登录尝试有效期 |

浏览器路由为 `/api/auth/start`、`/api/auth/callback`、`/api/auth/session`、`POST /api/auth/logout` 与 `/api/services/<service>/<path>`。auth 路由通过 Connection admission 只允许 owner；`/api/auth/callback` 例外，因为 BFF 回跳时没有 Host 会话，其 state/verifier/code 三元组就是授权依据。`auth` 不作为服务表条目，`/api/services/auth/*` 返回 404。

转发保留方法、query、JSON、SSE、multipart 与二进制 body；拒绝上游重定向，并在转发前剥离浏览器 cookie、authorization、forwarded 地址头与身份头，再加入 `X-Tomato-User-Id`。条目声明 `userIdInjection` 时，网关用已验证用户 id 覆盖对应 query 或 JSON body 字段。

## Model Experience

无。本包只承载浏览器认证与服务转发；模型请求仍由 Host 发往用户配置的提供方。

#### KV Cache effect

无；本包既不组装也不发送 provider 请求。

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **服务端 handoff 不在本包实现** —— auth_service 的 mint/redeem 与 BFF 的 `clientState`/`returnTo` 扩展属于外部契约；落地前登录显示不可用，不保留 mock 兜底。
- **仅 HTTP** —— 业务服务的 WebSocket 转发不支持；Connection 自己的 `/api/remote.mux` 保持直连。
- **流式响应没有大小上限** —— JSON body 注入有缓冲上限，流式响应依赖上游与客户端背压。
- **body 身份注入会缓冲 JSON** —— 最多读到配置上限；不支持 multipart 身份注入。
- **auth 路由绕过 Connection 的请求 waterfall** —— 精确 Web 路由注册在 Host webserver 上，Desktop 安装锁不覆盖它们。

<a id="dev-note"></a>

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

网关使用 Host webserver 的 exact/prefix 路由，因为 Connection 的 exact Fetch 注册表只支持 GET、HEAD、POST 且没有前缀匹配；admission 仍调用 Connection 自己的信任与浏览器认证检查。

</details>