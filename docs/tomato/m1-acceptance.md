# M1 验收清单

M1 的目标是跑通「壳 → 登录 → 会话 → 模型 → 工具卡 → 登出」这条链路。业务工具不在本期。

## 前置

```sh
nvm use 24                # 满足 engines.node >= 24.9.0
pnpm install
pnpm run build:artifacts  # 构建 Host / Client / Web 产物
pnpm run mock:tomato      # 本地 mock：模型、登录、OTLP relay（默认 :4010）
pnpm run dev:desktop      # 另一个终端
```

`mock:tomato` 一个进程同时提供：

| 路由 | 用途 | 对应配置 |
|---|---|---|
| `GET /v1/models` | 模型清单 | `llm-pi-ai` 的模型发现 |
| `POST /v1/chat/completions` | OpenAI 兼容流式对话（含一次 `bash` 工具调用） | `tomato-relay` 路由 |
| `GET /desktop/authorize` | 登录页（直接 302 回环 callback） | 壳的登录流程 |
| `POST /desktop/token` | 授权码换令牌 | 同上 |
| `POST /v1/traces` | OTLP 落点 | `@tomato/telemetry` |

`dev:desktop` 首次运行会准备 Electron 与 primary-runtime，可能下载数百 MB；后续启动走缓存。开发态的 Harness home 在 `apps/desktop/.desktop-build/development/home`，不会污染日常使用的 `~/.dsh`。

## 六个场景

| # | 场景 | 通过标准 |
|---|---|---|
| 1 | 启动 | 欢迎窗打开，显示番茄标志与「Tomato Harness」；中文环境下文案为中文（`welcomeDescription` 为「达人营销，从找人到跟进。」）；DevTools 无未捕获异常 |
| 2 | 登录 | 点「登录」后系统浏览器打开 mock 登录页并立即回跳；回环 callback 收到授权码，`POST /desktop/token` 成功；应用进入工作区，`$DSH_HOME/.credentials.yaml` 内出现 `TOMATO_RELAY_API_KEY` |
| 3 | 会话 | 新建会话发送「你好」，收到流式回复；界面无缺 key 警告 |
| 4 | 模型 | `/model` 列表含 `tomato-chat` 与 `tomato-reasoner`（来自 mock 的 `/v1/models`）；选中后下一轮请求命中同一模型 |
| 5 | 工具 | 发送含「列出目录」的请求，模型调用 `bash`；审批卡片出现并可批准；工具卡渲染命令与退出码 |
| 6 | 登出 | 关闭欢迎窗后重新启动应用仍停在欢迎窗（登录态保存在 `userData/tomato-auth.json`）；删除该文件或点「稍后配置」之外的登出入口后回到未登录态 |

## 额外检查

- **无外发遥测**：`grep -R "deepseeksvc\|deepseek.com" apps/desktop/.desktop-build/development/home` 无命中；mock 的 `/v1/traces` 至少收到一条含 `turn` span 的批次。
- **品牌完整**：侧栏 mark、会话首页 hero、窗口标题、About 面板均为番茄品牌；`grep -R "DeepSeek" packages/tomato apps/desktop/src` 只剩上游包引用。
- **权限切换**：设置里切换三档权限，新会话按所选档位运行；`danger-full-access` 下不再弹审批。

## 失败处理

- 场景 2 失败：先看 `dev:desktop` 的终端输出与 mock 输出，确认 `TOMATO_AUTH_URL`（默认 `http://127.0.0.1:4010`）与 mock 端口一致；回环 callback 端口由壳随机分配，只接受 `state` 匹配的回调。
- 场景 4 失败：先 `curl http://127.0.0.1:4010/v1/models` 确认返回 `{ data: [...] }`；再确认 `agent-default-model.provider` 与 `llm-pi-ai` 的 route 键同为 `tomato-relay`。
- 场景 5 失败：确认 `bash` 工具在当前平台未被禁用（Windows 上应为 `pwsh`）；未注册工具走通用卡属预期。
