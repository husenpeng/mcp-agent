---
description: "把飞书网关已验证的浏览器会话投影到 Host account service、且不暴露凭据的账号 provider。"
kind: "package-reference"
---

# @tomato/account-gateway

[English](README.md) | 中文

## 概述

`@tomato/account-gateway` 从本地网关已验证的飞书账号提供 `ctx.account`。浏览器登录、httpOnly 会话 cookie、验证和退出都由网关负责；本包只把登录用户投影到 Host 账号 seam。它从不保存或返回模型凭据：`resolveToken` 始终为空，模型请求继续使用已配置的第三方 API key。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发说明](#dev-note)

<a id="use-this-package"></a>

## 使用本包

在面向浏览器的 Host 中挂载于 `@tomato/gateway` 之后。它会等待 `ctx.tomatoAccount`，因此未配置认证的 Host 会让它保持不活动：

```yaml
- id: tomato-gateway
  name: '@tomato/gateway'
  config:
    authServiceUrl: https://auth.example
    companyWebUrl: https://company.example
    services: {}

- id: account-gateway
  name: '@tomato/account-gateway'
  config:
    usageUrl: https://example/usage
    topUpUrl: https://example/top-up
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `usageUrl` | `''` | 账号界面展示的用量地址 |
| `topUpUrl` | `''` | 账号界面展示的充值地址 |

网关报告已验证用户时，`getState` 返回 `credential-stored`，否则返回 `signed-out`。`getProfile` 映射网关用户的 ID、名称、邮箱和头像。`startSignIn` 返回的 attempt 的 `authorizeUrl` 指向网关 `/api/auth/start`，Desktop 窗口带 `desktop=1`。网关报告用户后，provider 把 attempt 标记为成功；网关报告退出后，等待中的 attempt 标记为失败。`cancelSignIn` 只修改本 provider 的 attempt。

`watch` 跟随网关账号状态。已登录转为退出时发出 `account/signed-out`，供账号相关任务取消消费。`getDeviceIdentity` 返回安装级匿名 ID、已登录时的账号 ID，以及 OS release。`getBalance` 与 `getUnnotifiedBonuses` 返回 `null`；飞书认证不提供 Platform 钱包或奖励数据。

<a id="dev-note"></a>
## 开发备注

本 provider 有意只做投影，不实现认证。飞书 OAuth、PKCE state、会话 cookie、auth_service 验证与转发都留在 `@tomato/gateway`；在这里复制会制造第二个登录权威和第二个 token 泄漏点。账号 seam 服务于 product analytics 等 Host 消费者与未来的账号范围功能，不服务于浏览器登录。

<a id="model-experience"></a>
## 模型体验

无，因为该 provider 只投影已验证的浏览器会话，不进入模型提示、Session 日志或工具结果。

#### KV Cache effect

不改变模型请求前缀。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **没有模型凭据**：飞书 auth_service 授权的是网关会话，不是第三方模型端点。模型路由必须使用自己的 API key；`resolveToken` 永不返回 token。
- **退出由浏览器负责**：`signOut` 只清除本 provider 的 attempt 与投影状态；网关 `POST /api/auth/logout` 清除浏览器 cookie。需要远端退出的账号 UI 调用网关路由。
- **没有钱包或奖励投影**：`getBalance`、`getUnnotifiedBonuses` 与 `ackBonusNotified` 有意为空；seam 为其他部署保留这些方法。
- **一个 Host 一个账号**：与 `ctx.tomatoAccount` 一样，投影跟随最近一次已验证的浏览器会话。
- **首次验证前为 unknown**：网关在验证会话或确认无会话前报告 `unknown`；本 provider 在账号状态中把它视为已退出。

<a id="dev-note"></a>
