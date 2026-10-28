# auth_service handoff 契约

本文件定义本地网关与公司 BFF、auth_service 之间的一次性 handoff 契约。状态：auth_service
侧已实现（mint/redeem）；BFF 接入后登录即可用。

## 拓扑

```text
浏览器 / Desktop
  │ GET /api/auth/start
  ▼
本地网关（tomato Host，同源）
  │ 302 带 clientState + returnTo
  ▼
公司 BFF /api/auth/feishu/start
  │ 飞书 OAuth
  ▼
公司 BFF /api/auth/feishu/callback
  │ POST /api/v1/auth/handoff/mint
  ▼
auth_service
  │ {code}
  ▼
公司 BFF 302 到 returnTo&code=...
  │
  ▼
本地网关 /api/auth/callback
  │ POST /api/v1/auth/handoff/redeem {code, verifier, returnTo}
  ▼
auth_service → {sessionId}
```

## 角色与职责

- **本地网关**：生成 `state` 与 `code_verifier`，保存 verifier，发起 BFF start，校验回调 state，兑换 code，写 Web cookie 或交给 Desktop 主进程。
- **公司 BFF**：持有飞书 OAuth 回调与 state cookie；把本地网关的 challenge 与 returnTo 带入 OAuth 流程；成功后调用 auth_service mint。
- **auth_service**：会话与 handoff code 的唯一权威；校验 sessionId，签发一次性 code，兑换时校验 verifier 与 returnTo，返回 sessionId。

## BFF start 扩展

`GET {companyWebUrl}/api/auth/feishu/start`

新增查询参数：

| 参数 | 必填 | 含义 |
|---|---|---|
| `clientState` | 是 | 本地网关 verifier 的 challenge，base64url 编码 |
| `returnTo` | 是 | 本地网关回调的绝对 URL，仅允许 loopback |

`returnTo` 允许范围：`http://127.0.0.1:<port>/api/auth/callback?state=<state>`、`http://localhost:<port>/api/auth/callback?state=<state>`、`http://[::1]:<port>/api/auth/callback?state=<state>`；必须无 userinfo、除 `state` 与可选 `desktop=1` 外无 query、无 fragment；端口任意。其他 origin 或参数一律 400。BFF 回跳时必须保留原 query 并追加 `code`。

BFF 把 `clientState` 与 `returnTo` 绑定进自己的 state cookie，回调时读取；不得把 sessionId 放进 URL。

## auth_service mint

`POST /api/v1/auth/handoff/mint`

请求：

```json
{
  "sessionId": "string",
  "challenge": "base64url(sha256(verifier))",
  "returnTo": "http://127.0.0.1:3080/api/auth/callback?state=state-value"
}
```

响应：

```json
{
  "code": "base64url-random",
  "expiresInSec": 60
}
```

约束：

- `sessionId` 必须通过 `session/verify` 且有效；无效返回 401。
- `challenge` 必须是非空 base64url 字符串，长度固定为 SHA-256 摘要长度；否则 400。
- `returnTo` 按 BFF 的 loopback 规则再校验一次；否则 400。
- code 一次性、TTL 60 秒；存储绑定 `sessionId`、`challenge`、`returnTo`。
- 同一 session 的并发 mint 允许，但每个 code 只能兑换一次。
- `mint` 只允许 BFF 调用：生产环境走内网或 `X-Internal-Token`，不接受浏览器 CORS。
- `redeem` 只允许本地网关（服务端）调用，**不要求内部 token**——`code` + `verifier` +
  `returnTo` 本身就是能力凭证；浏览器不能直接调用 auth_service。

## auth_service redeem

`POST /api/v1/auth/handoff/redeem`

请求：

```json
{
  "code": "base64url-random",
  "verifier": "base64url-random",
  "returnTo": "http://127.0.0.1:3080/api/auth/callback?state=state-value"
}
```

响应：

```json
{
  "sessionId": "string"
}
```

约束：

- 原子取出并删除 code（例如 Redis `GETDEL`）；重复兑换返回 400。
- 校验 `sha256(verifier)` 与存储的 challenge 等值，比较使用常量时间。
- 校验 `returnTo` 与 mint 时记录的值逐字一致；否则 400。
- code 过期返回 400；返回体不区分“过期、已用、verifier 错误”，避免探测。
- 成功后不再校验 session 有效性；调用方随后用 `/session/verify` 获取用户信息。

## 本地网关路由

| 路由 | 行为 |
|---|---|
| `GET /api/auth/start` | 生成 state/verifier，302 到 BFF start |
| `GET /api/auth/callback?state=...&code=...` | 用 query 中的 state 查找 verifier，调 redeem，写 `tomato_session` cookie，返回通知页 |
| `GET /api/auth/session` | 读 cookie 或 Desktop 头，调 `/session/verify`，返回三态 |
| `POST /api/auth/logout` | 调 `/session/revoke`，清本地会话，返回 `{remoteRevoked}` |

`GET /api/auth/session` 响应：

```json
{ "status": "signed-in", "user": { "id": "string", "email": "string", "name": "string|null", "avatarUrl": "string|null", "language": "string|null" } }
```

```json
{ "status": "signed-out" }
```

auth_service 不可达、超时或 5xx 时返回 HTTP 503 与 `{ "status": "unavailable" }`。

## 错误码

| HTTP | 含义 |
|---|---|
| 400 | state 不匹配、code 无效/过期/已用、verifier 不匹配、returnTo 不在白名单 |
| 401 | sessionId 无效、登出会话已失效 |
| 403 | 飞书拒绝、邮箱缺失、租户不允许 |
| 502/503 | auth_service 或 BFF 不可达、响应形状不符 |

错误响应不得包含 sessionId、verifier、code 或上游原始异常。

## 存储与过期

- auth_service 用现有 Redis（或等价存储）保存 handoff code；键包含 code 的哈希，值为 `sessionId`、challenge、returnTo、过期时间。
- TTL 60 秒，单次读取删除；不进入数据库、不写日志。
- 本地网关的 state 与 verifier 只存进程内存，TTL 10 分钟；进程退出即失效。state 不是秘密，写在 returnTo 的 query 中；verifier 永不离开网关，兑换时绑定 challenge。

## 安全边界

- `returnTo` 只允许 loopback，防止 code 被送到任意远端。
- verifier 只存在本地网关；code 被同机其他进程截获也无法兑换。
- sessionId 不进 URL、不进浏览器历史、不进 localStorage、不进日志。
- BFF 不为本地网关设置 session cookie；cookie 只由本地网关在自身 origin 写入。
- 生产环境 `mint` 需要服务端鉴权（内网或内部 token）；`redeem` 由本地网关调用，不绑定内部
  token；二者浏览器均不能直接调用 auth_service。

## 本地开发

1. 启动 services-monorepo 的 auth_service（默认 8003）。
2. 启动 client-monorepo 的 BFF，并把 `AUTH_SERVICE_URL` 指向 auth_service。
3. 在本地网关配置中填入 `authServiceUrl` 与 `companyWebUrl`；两者留空时登录态显示“服务不可用”。

## 未决

- BFF 与 auth_service 的实际实现排期。
- mint/redeem 的生产鉴权形式（内部 token 或网络边界）。
- 是否需要把 `language` 从 verify 结果同步到本地 locale；当前不自动覆盖。