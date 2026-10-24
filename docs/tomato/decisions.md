# Tomato Harness 方案决策

本文件记录将 DeepSeek Harness（下称 dsh）改造成番茄内部桌面 agent「Tomato Harness」时定下的决策。事实以本仓库源码为准；基线是 dsh `22ddee3792`（`dsh-v0.2.1-rc.3` 之后 1533 个提交），一次性导入，不合并上游。

## 产品

- **定位**：替代既有 tomatoAgent（OpenClaw 硬分叉），服务「找达人 → 看详情 → 写邮件 → 跟进」的业务流程。
- **名称**：产品名 Tomato Harness / 番茄 Agent；新包前缀 `@tomato/*`。
- **语言**：简体中文默认，保留英文；沿用 dsh 的 locale 机制，按操作系统语言自动选择。
- **模型人格**：把 `system-prompt` 的 `personaPrefix` 与四个内置预设的人格行从 coding agent 改为达人营销助手。工具集不变，模型仍可读写文件、执行命令。
- **范围**：M1 只验证壳与插件链路，不接业务；M2 接 MCP 网关与达人工具卡。

## 仓库与工程

- **形态**：最小偏离硬分叉，就地初始化 `/Users/underdog/engineering/tomatoHarness`。
- **导入**：`git archive` 导出全部 19188 个跟踪文件，新建 git 仓库，首个提交即基线，不带上游历史。
- **同步**：一次性导入，不合并上游；上游更新只作参考阅读。
- **一方代码**：`packages/tomato/<name>/`，包名 `@tomato/*`；规范沿用 dsh 的 [packages/AGENTS.md](../../packages/AGENTS.md)。
- **改动落点**：直接编辑 `packages/bundle/base/cordis.patch.yml` 与 `packages/bundle/web-app/cordis.patch.yml`，不为改造另加 bundle 层。

## 架构与集成

- **前端**：复用 dsh 的客户端插件与全部入口，不隐藏 Trajectory、Workflow、插件市场、Agent Preset、终端或文件侧栏。
- **工作区**：保留 dsh 原生多工作区语义。
- **模型**：`llm-pi-ai` 自定义 route `tomato-relay`，`api: openai-completions`，`baseURL` 在基础层指向本地 mock（`http://127.0.0.1:4010/v1`），密钥通过 `apiKeyEnv: TOMATO_RELAY_API_KEY` 解析；部署用 Models 页把该路由的 `baseURL` 写进当前 profile 的 `cordis.patch.yml`。模型清单由中转站的 `GET /v1/models` 动态发现，基础层只留一个占位模型 `tomato-chat` 使路由可用。
- **业务**：MCP 网关，沿用 tomatoAgent 已定的 `kol_capabilities` / `kol_search` / `kol_detail` / `kol_summary` 契约，`streamable-http` 传输，`Authorization: Bearer <每人令牌>`。
- **登录**：公司登录服务新增桌面令牌端点（一次性授权码换 PAT）。壳在 welcome window 点「登录」后打开系统浏览器，浏览器回跳壳监听的 `127.0.0.1:<随机端口>/callback`，壳用 code 换 token、`safeStorage` 加密写入 `userData/tomato-auth.json`，并通过 Host RPC 写入凭证 `TOMATO_RELAY_API_KEY`。dsh 的 `deepseek-account`、`deepseek-account-platform`、`llm-deepseek-account`、`llm-deepseek` 与欢迎页的 API key 流程全部停用。
- **遥测**：关闭 dsh 全部外发（`session-log-deepseek`、`session-telemetry-otel`、`product-analytics`、`host-product-telemetry-otel`）。新增 `@tomato/telemetry` 把 `turn/*`、`tool/*` 折叠成 OTLP traces，发到内部 relay 端点，由服务端转发 Langfuse；Langfuse 密钥只在服务端。`endpoint` 为空时不注册监听。
- **权限**：开放 `read-only` / `workspace-write` / `danger-full-access` 三档切换，默认 `workspace-write` + `ask`。

## UI 与资源

- **设计系统**：只搬 client-monorepo 的设计 token（暖红 `#c01a12`、圆角、字体栈）作为后续业务卡片的视觉基线，不搬 React 19 + antd v6 组件代码（dsh 客户端是 React 18 + CSS Modules）。
- **品牌**：新增 `@tomato/brand` 客户端插件，占用 `sidebar.brand.mark`、`sidebar.brand.name`、`conversation.hero.brand.mark` 三个槽；`ui-brand-official` 从 roster 停用。
- **品牌资源**：mark 取自 client-monorepo 的 `apps/web/public/img/fav.svg`（单色化以继承 `currentColor`）；欢迎页字标重写为 `apps/desktop/renderer/assets/welcome-brand.svg`。
- **业务 UI（M2）**：`kol_search` / `kol_detail` 各自注册到 `tool.call.toolview`，详情走右侧栏标签页。

## 交付

- **分发**：macOS arm64 内部开发包，不签名、不公证、不接自动更新。
- **载荷**：保留 dsh Desktop 的 primary-runtime（Python、Office 库、pnpm）与全部内置能力。
- **外部依赖**：M1 全用本地 mock——`pnpm run mock:tomato` 一个进程同时提供模型、登录与 OTLP relay；MCP 网关不接。
- **验收**：人工验证六个场景，见 [m1-acceptance.md](m1-acceptance.md)。
- **交付物**：代码 + 本文件 + 验收文档。

## 已知风险

- **上游对照消失**：一次性导入后无法与上游 diff，台账类文档失去对照基准。定位问题时以本仓库为准。
- **产品观感偏开发者工具**：保留全部入口与多工作区，业务用户会看到 Trajectory、插件市场、终端侧栏与目录选择。
- **外部依赖未定排期**：桌面令牌端点、relay 端点、MCP 网关的真实实现都排在 M1 之后，且依赖服务端团队。
- **shell 暴露**：权限可提到 `danger-full-access`，模型输出直接驱动本机命令。接受该风险的前提是内部员工使用。

## M2 预告（不在本次实现）

1. 联调 MCP 网关，接入 `kol_*` 四个工具。
2. 写 `@tomato/ui-kol` 客户端插件：搜索结果表格卡 + 达人详情右侧栏。
3. 服务端提供桌面令牌端点与 relay 端点，替换本地 mock。
4. 邮件草拟与跟进任务（需要确认是否复用 `email_service`）。
