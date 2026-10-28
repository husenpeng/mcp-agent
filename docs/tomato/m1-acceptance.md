# M1 验收清单

M1 的目标是跑通「壳 → 登录 → 会话 → 模型 → 工具卡 → 登出」这条链路。业务工具不在本期。

## 前置

```sh
nvm use 24                # 满足 engines.node >= 24.9.0
pnpm install
pnpm run build:artifacts  # 构建 Host / Client / Web 产物
# 另开终端启动外部 auth_service 与公司 BFF；两者的地址填入下方变量
AUTH_SERVICE_URL=http://127.0.0.1:8003 \
TOMATO_WEB_URL=http://localhost:3000 \
pnpm run dev:desktop
```

登录链路只经过 Host 的同源网关：

| 路由 | 用途 |
|---|---|
| `GET /api/auth/start` | 生成 state/verifier，跳转公司 BFF |
| `GET /api/auth/callback` | 兑换一次性 handoff code，写 `tomato_session` |
| `GET /api/auth/session` | 三态账户投影，内部调用 auth_service `session/verify` |
| `POST /api/auth/logout` | 尽力吊销 auth_service 会话并清 cookie |
| `/api/services/<service>/<path>` | 固定服务表转发，注入已验证 userId |

`dev:desktop` 首次运行会准备 Electron 与 primary-runtime，可能下载数百 MB；后续启动走缓存。开发态的 Harness home 在 `apps/desktop/.desktop-build/development/home`，不会污染日常使用的 `~/.dsh`。

模型不在网关中：启动后在「设置 → 模型」用 **Add model provider → Custom model API** 配置一个第三方 OpenAI 或 Anthropic 兼容端点，再在输入框的模型选择器里选中一个模型。

## 六个场景

| # | 场景 | 通过标准 |
|---|---|---|
| 1 | 启动 | 欢迎窗打开，显示番茄标志与「Tomato AI」；中文环境下文案为中文（`welcomeDescription` 为「达人营销，从找人到跟进。」）；DevTools 无未捕获异常 |
| 2 | 登录 | 点「登录」后隔离窗口打开 Host 的 `/api/auth/start`，经公司 BFF 完成飞书授权；网关回调写入 `tomato_session`；`userData/tomato-auth.json` 出现会话，侧栏显示姓名/邮箱 |
| 3 | 模型 | 在「设置 → 模型」配置第三方端点后，其模型出现在模型选择器中；选中后下一轮请求命中同一 provider/model |
| 4 | 会话 | 新建会话发送「你好」，收到流式回复；界面无缺 key 警告 |
| 5 | 工具 | 使用支持工具调用的模型发送「列出目录」，模型调用 `bash`；审批卡片出现并可批准；工具卡渲染命令与退出码 |
| 6 | 登出 | 在侧栏或设置页退出登录；工作区保持打开并显示未登录，`userData/tomato-auth.json` 被清空；远端 `session/revoke` 成功或被标记为未确认 |

## 额外检查

- **无外发遥测**：`grep -R "deepseeksvc\|deepseek.com" apps/desktop/.desktop-build/development/home` 无命中；若配置了 `TOMATO_OTLP_ENDPOINT`，真实 relay 至少收到一条含 `turn` span 的批次。
- **品牌完整**：侧栏 mark、会话首页 hero、窗口标题、About 面板均为番茄品牌；`grep -R "DeepSeek" packages/tomato apps/desktop/src` 只剩上游包引用。
- **权限切换**：设置里切换三档权限，新会话按所选档位运行；`danger-full-access` 下不再弹审批。

## 失败处理

- 场景 2 失败：确认 `AUTH_SERVICE_URL` 与 `TOMATO_WEB_URL` 已填入，且 BFF 已实现 `/api/auth/feishu/start` 的 `clientState`/`returnTo` 与 auth_service 的 handoff mint/redeem；网关回调应写入 `tomato_session`。
- 场景 4 失败：先确认「设置 → 模型」里该路由已保存、密钥状态为已配置；再用 **Fetch available models** 或直接请求该端点的模型列表，确认模型 id 与输入框选择器一致。
- 场景 5 失败：确认 `bash` 工具在当前平台未被禁用（Windows 上应为 `pwsh`）；未注册工具走通用卡属预期。
