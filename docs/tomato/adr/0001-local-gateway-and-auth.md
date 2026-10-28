# 0001. 本地同源网关与 auth_service 登录态

- 状态：Accepted
- 日期：2026-10-26
- 影响范围：`packages/tomato/*`、`packages/bundle/web-app`、`apps/desktop`、`apps/web`、跨仓 auth_service 与公司 BFF 契约

## 背景

Tomato AI 目前没有“承接浏览器请求的本地网关”。浏览器只访问 dsh Host 的 `/api`（Typert RPC）与 `/api/remote.mux`；模型请求由 Host 直连提供方，工具与遥测各自直连；`scripts/mock-tomato` 是一个写死响应的假服务，不是转发层。

Web 页面没有登录态展示，是因为组合显式停用了 `ui-settings-account` 与 `account-controller`，不是渲染缺失。Desktop 的欢迎窗单独维护一套登录流程，Web 与工作区之间没有共享登录态。

登录服务在 services-monorepo 的 `auth_service`，飞书 OAuth 由 client-monorepo 的 Web BFF 承接。本次要求：浏览器所有对内/对外请求先到本地网关；登录信息与登录验证都来自 auth_service；删除本地网关中的产品 mock。

## 决策

### 网关位置与范围

新增 `@tomato/gateway`，挂在 dsh Host 内，与 Web UI 同源。浏览器请求只走 `/api/auth/*` 与 `/api/services/<service>/*`；不新增独立端口，不做 UI 反代。

网关只承接浏览器发起的业务与登录请求。Host 既有 `/api` Typert RPC、`/api/remote.mux`、模型请求、工具出站与 OTLP 遥测保持现状，不经过网关，也不做登录校验。

新增服务只改固定服务表，浏览器不能指定目标 host。`auth` 条目为内部专用，禁止通过 `/api/services/auth/*` 暴露；浏览器只能使用 `/api/auth/*` 的专用路由。首期转发完整 HTTP 方法、请求体、响应体、SSE、multipart 与二进制；不支持业务 WebSocket；不跟随上游重定向。

### 登录与会话

只支持飞书 SSO。公司 BFF 继续承接飞书 OAuth 回调；auth_service 是会话与一次性 handoff code 的唯一权威。

本地网关在 `/api/auth/start` 生成 `state` 与 `code_verifier`，保存 verifier，只把 challenge 与 loopback 回调地址交给公司 BFF。BFF 在 OAuth 成功后调用 auth_service 的 handoff mint，拿到一次性 code，302 回本地网关回调；本地网关带 code 与 verifier 兑换 auth_service `sessionId`。

会话值就是 auth_service `sessionId`，不另建本地会话表。Web 写入 httpOnly `tomato_session` cookie（`SameSite=Lax`，`Secure` 跟随协议，会话级）；Desktop 主进程把同一个 sessionId 存入 `safeStorage`，转发请求时注入 `X-Tomato-Session`，渲染进程永远拿不到。Desktop 不再写 `TOMATO_RELAY_API_KEY` 或 Host 凭证库。

每个受保护请求都调用 auth_service `/api/v1/auth/session/verify`；无效或超时按未登录/服务不可用处理，不做 TTL 缓存。登出先尽力调用 `/api/v1/auth/session/revoke`，无论远端成功与否都清本地 cookie/safeStorage；远端失败只提示“远端未确认吊销”。

### 客户端展示

新建 Tomato 账户 UI，占用侧栏底部入口与设置「账户」页，不复活 DeepSeek 账户包。状态固定为三态：已登录（`name`/`email`/`avatarUrl`）、未登录、登录服务不可用（可重试）。首期只读，不接资料编辑；只提供登录、登出、重试。

Web 登录用弹窗打开 `/api/auth/start`，回调页通过 `postMessage` 通知 opener 并自关；弹窗被拦截时回退整页跳转。Desktop 工作区通过新增的最小 preload/IPC 打开欢迎窗，再由认证后端打开隔离飞书窗口；窗口完成回调后主进程读取一次 `tomato_session` cookie 并销毁分区。欢迎窗保留，入口统一到同一后端。

未登录不阻断本地会话、模型与工具；只有经网关调用公司服务时返回 401。工作区登出后留在原地，不回到欢迎窗。

### 配置与 mock

`authServiceUrl` 与 `companyWebUrl` 都留空，由部署者填入；任一为空仍可启动，登录态显示“服务不可用”，不保留任何默认外部地址。

删除 `scripts/mock-tomato` 目录与 `package.json` 的 `mock:tomato`；README 与 `docs/tomato/*` 改为启动 services-monorepo 的 auth_service 与公司 BFF。测试内的 fake/fixture 保留，但它们不得成为产品运行路径。

跨仓范围：本仓已实现网关、账户 UI 与 Desktop 转发；auth_service 与公司 BFF 的 handoff 契约写入 [auth-handoff-contract.md](../auth-handoff-contract.md)，服务端实现前登录不可用，没有 mock 兜底。

## 实现

- `packages/tomato/gateway`：Host 内同源路由与固定服务表；`/api/auth/start`、`/callback`、`/session`、`/logout`，以及 `/api/services/<service>/*`。auth 条目只存在于内部配置，不通过通用代理暴露。
- `packages/tomato/account`：Client service 快照、侧栏账户入口、设置「账户」页、三态展示、登录/登出/重试与本地化文案。Web 登录使用弹窗；Desktop 通过 `dshDesktop.account` preload 入口打开欢迎窗。
- `apps/desktop`：隔离登录窗口安装 Host 认证 cookie，回调后读取一次 `tomato_session`；sessionId 只存 `safeStorage`，`forwardWebRequest` 注入 `X-Tomato-Session` 并剔除渲染进程同名头；工作区登出留在原地。
- 删除 `scripts/mock-tomato` 与 `mock:tomato`；产品运行路径不再包含 mock 登录、mock 模型或 mock OTLP。

## 对外契约

本地网关：

| 路由 | 行为 |
|---|---|
| `GET /api/auth/start` | 生成 state/verifier，302 到公司 BFF start，带 `clientState` 与 `returnTo` |
| `GET /api/auth/callback?state=...&code=...` | 用 state 查找 verifier，兑换 code，写 `tomato_session`，返回通知页 |
| `GET /api/auth/session` | 200 `{status:'signed-in', user}` 或 `{status:'signed-out'}`；验证服务不可用返回 503 |
| `POST /api/auth/logout` | 吊销远端会话并清本地，返回 `{remoteRevoked: boolean}` |

公司 BFF：

| 路由 | 行为 |
|---|---|
| `GET /api/auth/feishu/start` | 接受 `clientState` 与 `returnTo`；`returnTo` 仅允许 loopback 白名单 |
| `GET /api/auth/feishu/callback` | 完成飞书换码后调用 auth_service handoff mint，302 回 `returnTo&code=...` |

auth_service：

| 路由 | 请求 | 响应 |
|---|---|---|
| `POST /api/v1/auth/handoff/mint` | `{sessionId, challenge, returnTo}` | `{code, expiresInSec}`；code 一次性、短 TTL |
| `POST /api/v1/auth/handoff/redeem` | `{code, verifier, returnTo}` | `{sessionId}`；失败返回 400/401 |

## 备选方案

- **独立 :4010 网关反代全部**：浏览器与 UI 变跨源，Desktop 的 `dsh-app://`、WebSocket 与 Host 绝对地址都要重做，否决。
- **浏览器 localStorage 存 sessionId**：XSS 可直接窃取，否决。
- **本地固定端口飞书回调**：需要把 loopback 地址注册进飞书，多实例与端口冲突，否决。
- **公司 BFF 直接把 sessionId 放 URL**：会话值进入浏览器历史/日志，否决。
- **保留 `mock:tomato` 作为回退**：与删除产品 mock 的目标冲突，否决。

## 后果

- 服务端 handoff 契约落地前，登录按钮只能显示“服务不可用”；这是本轮的明确代价。
- BFF 必须维护 loopback `returnTo` 白名单，auth_service 必须把 code 绑定到 verifier、returnTo 与短 TTL；否则同机监听者可抢 code。
- 通用代理必须固定服务表、剥离浏览器自带的 cookie/authorization/身份头、拒绝上游重定向；否则会变成开放代理。
- Web 关闭浏览器即失去登录态，Desktop 重启后仍登录，两端持久化策略不同。
- 网关路由注册在 Host webserver 上：auth 与 `/api/services` 因此支持任意 HTTP 方法并复用 Connection admission，但不经过 Connection 的 exact Fetch registry 与 request waterfall；Desktop 安装锁不覆盖这些路由。
- 业务 WebSocket 首期不支持；需要时另立 ADR。

## 验证

- 网关单测：服务表路由、auth 内部专用、state/verifier、cookie 属性、身份注入覆盖、超时/大小限制、上游错误映射、日志脱敏。
- 真实组合测试：`apps/web/tests/account-gateway.e2e.ts` 启动 web-app Host 与 fake auth_service/BFF/service，验证登录 handoff、`/api/auth/session`、`/api/services` 转发、auth 内部专用与未登录 401。
- Desktop 测试：`apps/desktop/tests/tomato-auth.spec.ts` 验证隔离窗口安装 Host cookie、回调后读取一次 `tomato_session`、`safeStorage` 写入与登出；`preload-app.spec.ts` 覆盖账户桥。
- Web/UI 测试：`packages/tomato/account/tests/account.client.spec.tsx` 覆盖三态与登出/重试；弹窗通知与回退由 controller 处理。
- 删除检查：全仓无 `mock:tomato`、`tomato-relay`、`tomato-chat`、mock 登录路由；文档与脚本同步。
- 文档 gate：`pnpm run test:docs`、`pnpm run verify-cordis-config`、`pnpm run build:check`。

本轮实现已执行并通过上述 gateway、UI、Desktop 与文档检查；服务端 handoff 契约仍未实现，因此登录态按不可用处理。

## 未决

- auth_service 与 BFF 的实际实现排期；在落地前登录不可用。
- 外部服务条目的凭证注入方式；首期只配 auth，后续按服务表逐条定义。
- 业务服务出现 WebSocket 需求时再立 ADR。