# Tomato AI 方案决策

本文件记录将上游 DeepSeek Harness 改造成番茄内部桌面 agent「Tomato AI」时定下的决策。事实以本仓库源码为准；基线是上游 `22ddee3792`（`0.2.1-rc.3` 之后 1533 个提交），一次性导入，不合并上游。

后续改动在代码完成后同一改动内补充 [ADR](adr/README.md)；本文件继续描述当前运行行为，ADR 记录已实现的决策与后果。

## 产品

- **定位**：替代既有 tomatoAgent（OpenClaw 硬分叉），服务「找达人 → 看详情 → 写邮件 → 跟进」的业务流程。
- **名称**：产品名 Tomato AI / 番茄 Agent；仓库内全部包使用 `@tomato/*` 命名。
- **语言**：简体中文默认，保留英文；沿用上游的 locale 机制，按操作系统语言自动选择。
- **模型人格**：把 `system-prompt` 的 `personaPrefix` 与四个内置预设的人格行从 coding agent 改为达人营销助手。工具集不变，模型仍可读写文件、执行命令。
- **范围**：M1 只验证壳与插件链路，不接业务；M2 接 MCP 网关与达人工具卡。

## 仓库与工程

- **形态**：最小偏离硬分叉，就地初始化 `/Users/underdog/engineering/tomatoHarness`。
- **导入**：`git archive` 导出全部 19188 个跟踪文件，新建 git 仓库，首个提交即基线，不带上游历史。
- **同步**：一次性导入，不合并上游；上游更新只作参考阅读。
- **一方代码**：自有包位于 `packages/tomato/<name>/`；仓库内全部包使用 `@tomato/*`，命名规则见 [ADR 0009](adr/0009-tomato-namespace.md)；规范沿用仓库的 [packages/AGENTS.md](../../packages/AGENTS.md)。
- **命名**：仓库内 `DSH` / `dsh` / `@deepseek-ai` 命名统一为 `TOMATO` / `tomato` / `@tomato`；DeepSeek 供应商身份、上游仓库链接与历史记录保留；技能目录名 `.agents/skills/dsh-*` 保留（归档笔记链接到它们，且归档内容不可改）（[ADR 0009](adr/0009-tomato-namespace.md)）。
- **改动落点**：直接编辑 `packages/bundle/base/cordis.patch.yml` 与 `packages/bundle/web-app/cordis.patch.yml`，不为改造另加 bundle 层。

## 架构与集成

- **前端**：复用上游的客户端插件与全部入口，不隐藏 Trajectory、Workflow、插件市场、Agent Preset、终端或文件侧栏。
- **工作区**：保留原生多工作区语义。
- **模型**：基础 `llm-pi-ai` 不预置路由。用户在「设置 → 模型」的 **自定义模型 API** 中声明第三方 OpenAI 或 Anthropic 兼容端点与模型清单；路由写入当前 profile 的 `cordis.patch.yml`，API Key 经 `credentials.set` 只写入 `$TOMATO_HOME/.credentials.yaml` 的 `<ROUTE>_API_KEY`。`agent-default-model` 初始为空，用户在模型选择器中选定后写回 profile。基础组合不再包含 mock 模型路由或占位模型。
- **业务**：MCP 网关，沿用 tomatoAgent 已定的 `kol_capabilities` / `kol_search` / `kol_detail` / `kol_summary` 契约，`streamable-http` 传输，`Authorization: Bearer <每人令牌>`。
- **hiCreator（可选）**：web 补丁层的 `mcp-hicreator` 行接 hiCreator 远程 MCP，提供达人发现、详情、邮箱与收藏夹工具；未设置 `HICREATOR_API_KEY` 时整行停用，仅作公司网关落地前的验证数据源（[ADR 0007](adr/0007-hicreator-mcp.md)）。
- **浏览器**：Playwright MCP 以官方按需组合包提供，插件页未安装时即可离线看到；打开开关才安装并挂载 `@tomato/browser-use` 与固定 `launch`/`headless` 提供方，首次使用需本机已有 Chromium 构建。同一 profile 只能有一个 browser-use 提供方（[ADR 0006](adr/0006-playwright-browser-bundle.md)）。
- **登录**：新增 Host 内同源网关 `@tomato/gateway`，浏览器只访问 `/api/auth/*` 与 `/api/services/*`。飞书 OAuth 仍由公司 BFF 承接；公司 BFF 通过 auth_service 的一次性 handoff code 把会话交给本地网关，本地网关用 `state + verifier` 兑换。Web 写 httpOnly `tomato_session` cookie；Desktop 主进程把 sessionId 存 `safeStorage` 并注入 `X-Tomato-Session`，不再写 Host 凭证库。新增 `@tomato/account` 提供侧栏入口与设置账户页，三态展示并在服务不可用时提示重试。上游的 `deepseek-account`、`deepseek-account-platform`、`llm-deepseek-account`、`llm-deepseek` 与欢迎页的 API key 流程全部停用。
- **遥测**：关闭上游全部外发（`session-log-deepseek`、`session-telemetry-otel`、`product-analytics`、`host-product-telemetry-otel`）。新增 `@tomato/telemetry` 把 `turn/*`、`tool/*` 折叠成 OTLP traces，发到内部 relay 端点，由服务端转发 Langfuse；Langfuse 密钥只在服务端。`endpoint` 为空时不注册监听。
- **权限**：开放 `read-only` / `workspace-write` / `danger-full-access` 三档切换，默认 `workspace-write` + `ask`。

## UI 与资源

- **设计系统**：只搬 client-monorepo 的设计 token（暖红 `#c01a12`、圆角、字体栈）作为后续业务卡片的视觉基线，不搬 React 19 + antd v6 组件代码（上游客户端是 React 18 + CSS Modules）。
- **品牌**：新增 `@tomato/brand` 客户端插件，占用 `sidebar.brand.mark`、`sidebar.brand.name`、`conversation.hero.brand.mark` 三个槽；`ui-brand-official` 从 roster 停用。
- **品牌资源**：mark 取自 client-monorepo 的 `apps/web/public/img/fav.svg`（单色化以继承 `currentColor`）；欢迎页字标重写为 `apps/desktop/renderer/assets/welcome-brand.svg`；浏览器标签页 `apps/web/public/favicon{,-dark}.svg` 使用同一路径，浅色 `#b71616`、深色 `#de3730`；PWA 安装图标由 `apps/web/assets/app-icon.svg` 生成，manifest 与 iOS 安装名均为 `Tomato AI`（[ADR 0002](adr/0002-web-brand-identity.md)）。
- **业务 UI（M2）**：`kol_search` / `kol_detail` 各自注册到 `tool.call.toolview`，详情走右侧栏标签页。

## 交付

- **分发**：macOS arm64 内部开发包，不签名、不公证、不接自动更新。
- **载荷**：保留 Desktop 的 primary-runtime（Python、Office 库、pnpm）与全部内置能力。
- **外部依赖**：登录依赖外部 auth_service 与公司 BFF 的 handoff 契约；模型由用户配置的第三方 API 提供；OTLP relay 由部署方提供；MCP 网关不接。产品代码不保留 mock 回退。
- **验收**：人工验证六个场景，见 [m1-acceptance.md](m1-acceptance.md)。
- **交付物**：代码 + 本文件 + 验收文档。

## 已知风险

- **上游对照消失**：一次性导入后无法与上游 diff，台账类文档失去对照基准。定位问题时以本仓库为准。
- **产品观感偏开发者工具**：保留全部入口与多工作区，业务用户会看到 Trajectory、插件市场、终端侧栏与目录选择。
- **外部依赖未定排期**：auth_service/BFF 的 handoff 端点、OTLP relay 与 MCP 网关都依赖服务端团队；handoff 落地前登录不可用。
- **shell 暴露**：权限可提到 `danger-full-access`，模型输出直接驱动本机命令。接受该风险的前提是内部员工使用。

## M2 预告（不在本次实现）

1. 联调 MCP 网关，接入 `kol_*` 四个工具。
2. 写 `@tomato/ui-kol` 客户端插件：搜索结果表格卡 + 达人详情右侧栏。
3. 服务端实现 auth_service/BFF handoff 契约与 OTLP relay；网关按固定服务表逐步接入业务服务。
4. 邮件草拟与跟进任务（需要确认是否复用 `email_service`）。
