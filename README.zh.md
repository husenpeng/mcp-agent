# Tomato Harness

[English](README.md) | 中文

Tomato Harness 是面向达人营销团队的内部桌面 agent。它在 Electron 外壳里运行 DeepSeek Harness（`dsh`）运行时，用公司账号登录，所有模型请求都走公司中转站，并把 turn 与工具活动上报到内部 OTLP relay，由 relay 转发 Langfuse。

本仓库是 `deepseek-harness` 在提交 `22ddee3792` 的一次性硬分叉，不合并上游。上游包保留 `@deepseek-ai/*` 命名，番茄自有包使用 `@tomato/*`。全部分叉决策记录在 [docs/tomato/decisions.md](docs/tomato/decisions.md)。

## Summary

- **外壳**：`apps/desktop`（Electron 主进程、preload、欢迎窗、更新、打包）与 `apps/desktop-host`（启动 `desktop` profile 的私有 Node Host 进程）。
- **运行时**：dsh 的 Cordis 插件树。模型适配器、工具注册表、会话日志乃至 agent 循环本身都是插件，由多层 bundle 组成的 profile 挂载。
- **产品界面**：dsh Web 客户端，由 Host 提供、通过 `dsh-app://` 方案加载；DeepSeek 账号、会话日志上传与产品分析各行已停用。
- **公司集成**：`@tomato/brand`（侧栏与首页标志）、`@tomato/telemetry`（turn 与工具 span），以及外壳的 `tomato-auth.ts`（浏览器登录、令牌交换、凭证写入）。

## Table of Contents

- [架构](#architecture)
- [设计决策](#design-decisions)
- [前置条件](#prerequisites)
- [初始化](#initialize)
- [运行](#run)
- [本地服务](#local-services)
- [日志与开发者模式](#logging-and-developer-mode)
- [生产化清单](#production-readiness)
- [故障排查](#troubleshooting)

<a id="architecture"></a>

## 架构

### 进程

| 进程 | 负责 | 不负责 |
|---|---|---|
| Electron 主进程（`apps/desktop`） | 窗口、托盘、菜单、快捷键、单实例、profile 初始化、凭证存储、更新与退出策略 | agent 行为、会话、工具、模型调用 |
| Preload 脚本 | 渲染进程到主进程的白名单 IPC 桥接 | 任何业务逻辑 |
| 渲染进程（dsh Web 客户端） | 对话、工具卡、审批、设置、会话导航 | 凭证、文件系统访问 |
| Host（`apps/desktop-host`） | dsh 运行时：agent 循环、会话、工具、模型请求、HTTP 与 WebSocket 服务 | 窗口、托盘、原生对话框 |
| 公司登录服务 | 身份、会话策略、令牌签发 | 本机上的任何东西 |
| 公司模型中转站 | 模型路由、按人配额、计量 | 业务数据 |
| 公司 OTLP relay | trace 映射、Langfuse 凭证、脱敏 | 客户端状态 |

Host 监听系统分配的环回端口；主进程用一次性 cookie 认证一次，然后把 `dsh-app://app/` 文档发出的应用 HTTP 请求转发过去。主进程与 Host 之间的 Node IPC 只承载启动注入、就绪、关停与退出检查。

### Profile 组合

profile 是一叠 bundle 层，每层都是一个按 id 插入或覆盖的 `cordis.patch.yml`：

```text
$DSH_HOME/profiles/desktop/package.json      dsh.profile.bundles = [dsh-base, dsh-web-app]
        │
        ├── @deepseek-ai/dsh-base        shared core: llm, session, tools, shell, fs, permissions, telemetry seams
        ├── @deepseek-ai/dsh-web-app     browser surface: host controllers, web server, the client plugin roster
        │     ├── presets/standard.patch.yml   per-session agent composition
        │     ├── presets/ptc.patch.yml
        │     ├── presets/minimal.patch.yml
        │     └── presets/cordis.patch.yml
        └── $DSH_HOME/profiles/desktop/cordis.patch.yml   user and deployment overrides (last write wins)
```

番茄的改动直接写在两个随仓库发布的 bundle 文件里，因此新建 profile 天然继承，不需要额外一层：

| 行 | 改动 |
|---|---|
| `system-prompt` 与四个预设 | 人格改为达人营销助手 |
| `agent-default-model` | `tomato-relay` / `tomato-chat` |
| `llm-pi-ai` | 一条手写路由：`api: openai-completions`、`apiKeyEnv: TOMATO_RELAY_API_KEY`、`baseURL` 指向本地 mock |
| `deepseek-account`、`llm-deepseek`、`llm-deepseek-account`、`deepseek-llm-api-extensions`、`session-log-deepseek`、`plugin-package-inventory-deepseek` | `disabled: true` |
| `session-telemetry-otel`、`product-analytics`、`desktop-product-telemetry` | `disabled: true` |
| `web-search-deepseek`、`web-deepseek-api` | `disabled: true`；HTTP fetch 保留 |
| `tomato-telemetry` | 新增行：把 span 发往 `TOMATO_OTLP_ENDPOINT` |
| `ui-brand-official` | `disabled: true`；三个品牌槽由 `@tomato/brand` 提供 |
| `ui-settings-account`、`account-controller` | `disabled: true` |

### 能力接缝

每个能力都由三个角色组成，扩展只依赖定义，不依赖具体 provider：

- **定义** —— 带 `ctx.<key>` 与共享类型的 Cordis `Service`，如 `ctx.agent`、`ctx.session`、`ctx.tools`、`ctx.llm`、`ctx.settings`、`ctx.credentials`、`ctx.slots`、`ctx.theme`。
- **Provider** —— 唯一的具体实现，如 `ctx.llm` 背后的 `dsh-llm-pi-ai`、`ctx.sessions` 背后的 `dsh-session-persistence-jsonl`。
- **Consumer** —— 只注入定义的模型可见工具或 UI 插件。

因此替换一个 provider 会同时移动整个世界：换掉 shell provider，Bash、PTY 与 LSP 一起迁移。

### 模型可见即已记录

会话日志是只追加的事件流。任何进入模型请求的内容都必须能从该日志重建，所以插件以普通 user 或 system 角色事件贡献上下文，而不是另开旁路。两点后果与本项目直接相关：

- `@tomato/telemetry` 只读 `session/event`，从不写入，因此无法改变模型看到的内容。
- 压缩、注解与重放都作用于同一份日志，长对话因此可复现。

### 线程与生命周期

- 每次注册都走 `ctx.effect()` 并返回 disposer，卸载插件只撤下它自己加的东西。
- 配置随 profile 重载；模块根目录需要显式开启。
- 会话以 JSONL 存在 `$DSH_HOME/sessions`；桌面端把状态放在开发或打包的 Harness home，绝不写用户日常使用的 `~/.dsh`。

### 客户端插件组合

Web 客户端本身就是一个 Cordis 应用。`dsh-client-modules` 扫描所有声明 `dsh.client` 的已挂载行，组合出 `window.__DSH_BOOT__`，并在 `/plugins/<id>/client.js` 提供各浏览器 bundle。UI 组合使用带类型的槽位：

| 槽位 | 声明方 | 占位 |
|---|---|---|
| `sidebar.brand.mark`、`sidebar.brand.name` | `ui-sidebar` | `@tomato/brand` |
| `conversation.hero.brand.mark` | `ui-conversation` | `@tomato/brand` |
| `tool.call.toolview`（按工具名索引） | `ui-tool` | 内置卡片；未来业务卡片 |

UI 插件只向自己未声明的槽位注册，并通过 `ctx.slots.inject` 等待声明方的生命周期，因此占位随声明方一起出现与撤下。

<a id="design-decisions"></a>

## 设计决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 仓库模型 | 一次性硬分叉，不合并上游 | 产品已结构性分叉，台账式对照没有参照物 |
| 产品代码 | `packages/tomato/*`、`@tomato/*` | 与上游一眼可分，又不必全仓改名 |
| 改动位置 | 直接改两个随仓库发布的 bundle | 只有一处可读；另加一层反而藏住分歧 |
| 模型接入 | `llm-pi-ai` 一条手写路由 | 内核零改动；中转站本就是 OpenAI 兼容端点 |
| 模型清单 | 从 `GET /v1/models` 发现 | 目录由中转站拥有，写死会漂移 |
| 登录 | 公司桌面令牌端点，浏览器跳回环监听 | 不内嵌浏览器，凭证不进 URL，令牌不经过渲染进程 |
| 令牌存储 | Electron `safeStorage` + Host 凭证库 | 欢迎窗在 Host 启动前就能回答“是否已登录”；路由每次请求解析同一份值 |
| 遥测 | 自写 OTLP 上报到内部 relay | Langfuse 凭证留在服务端；dsh 自带通道全关 |
| 品牌 | 槽位占位 + 单色图形 | 槽位组合是受支持的方式；`currentColor` 自动跟随两套主题 |
| 分发 | macOS arm64 未签名包，无自动更新 | 内部使用；签名与 feed 属于生产化工作 |

<a id="prerequisites"></a>

## 前置条件

| 要求 | 版本 | 说明 |
|---|---|---|
| Node.js | `>= 24.9.0`（仓库 `engines`） | 打包运行时自带独立 Node |
| pnpm | `11.28.5` | 根清单里的 `packageManager`；`corepack enable` 即可 |
| Git | 较新版本 | 构建会把提交哈希写进客户端产物 |
| macOS | arm64 | 唯一分发目标；外壳在上游也支持 Windows |
| 磁盘 | 约 3 GB | `node_modules`、构建缓存、Electron（约 300 MB）、primary runtime 载荷 |
| 网络 | npm 源、PyPI、Electron 发布主机 | 载荷按固定版本下载；可用内部镜像 |

首次运行无需其它准备：本地 mock 同时提供模型、登录与 relay，因此不需要任何凭证。

<a id="initialize"></a>

## 初始化

```sh
git clone <this repository> tomatoHarness
cd tomatoHarness
corepack enable
pnpm install
pnpm run build:artifacts      # Host, Client bundles, and the Web frontend (~30 s warm)
```

`build:artifacts` 产出 `apps/web/dist`、各 `packages/*/*/lib`、`apps/cli/lib`、`apps/desktop/lib` 与 `apps/desktop-host/lib`。`pnpm run build` 还会记录客户端产物摘要。

若 Electron 二进制下载卡住，换镜像后只重装该包：

```sh
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
  pnpm --filter @deepseek-ai/dsh-desktop exec install-electron
```

<a id="run"></a>

## 运行

<a id="run-from-source"></a>

### 从源码运行

两个终端：

```sh
# 1) local stand-ins for the relay, the login service, and the OTLP sink
pnpm run mock:tomato

# 2) the desktop application (builds, prepares the payload, launches Electron)
TOMATO_OTLP_ENDPOINT=http://127.0.0.1:4010/v1/traces \
TOMATO_AUTH_URL=http://127.0.0.1:4010 \
pnpm run dev:desktop
```

`dev:desktop` 会跑一次产物构建，在 `apps/desktop/.desktop-build/development` 下生成一次性工程，首次使用时准备 primary runtime（数百 MB 下载），然后启动 Electron，环境变量如下：

| 变量 | 开发默认值 | 用途 |
|---|---|---|
| `DSH_HOME` | `apps/desktop/.desktop-build/development/home` | 会话、设置、凭证 |
| `DSH_DESKTOP_USER_DATA_DIR` | `…/development/electron-user-data` | Chromium 配置与令牌文件 |
| `DSH_DESKTOP_PRIMARY_RUNTIME_DIR` | `…/targets/mac-arm64/runtime/primary-runtime` | Python、Office 库、pnpm；未打包启动必需 |
| `DSH_DESKTOP_MAIN_INSPECT_PORT` | `9229` | 主进程调试器 |
| `DSH_DESKTOP_RENDERER_DEBUG_PORT` | `9222` | 渲染进程调试协议 |
| `DSH_DESKTOP_HOST_INSPECT_PORT` | `9230` | Host 进程调试器 |
| `DSH_DESKTOP_OPEN_DEVTOOLS` | `1` | 启动时打开独立 DevTools 窗口 |

后续启动可用 `pnpm run start:desktop` 跳过重新构建。

<a id="local-services"></a>

## 本地服务

`pnpm run mock:tomato` 在 4010 端口用一个进程同时提供三个外部依赖：

| 路由 | 提供 |
|---|---|
| `GET /v1/models` | 供模型选择页使用的双模型目录 |
| `POST /v1/chat/completions` | OpenAI 兼容 SSE；提示中出现「列出目录」时产生一次 `bash` 工具调用 |
| `GET /desktop/authorize` | 登录页；立即批准并带 code 跳回 CLI 监听地址 |
| `POST /desktop/token` | 用该 code 换令牌 |
| `POST /v1/traces` | 接收 OTLP 批次并记录大小 |

接入真实公司服务只需改三处：路由的 `baseURL`（模型页或 profile patch）、`TOMATO_AUTH_URL`、`TOMATO_OTLP_ENDPOINT`。

<a id="logging-and-developer-mode"></a>

## 日志与开发者模式

### 诊断日志

外壳在平台日志目录下按天写一份滚动文本日志（macOS 为 `~/Library/Logs/Tomato Harness/`，Windows 在 Electron 日志路径下的 `%APPDATA%\Tomato Harness\logs`）：

```text
2026-10-24T05:12:31.481Z [info] shell started (version 0.2.1-rc.3, developer=true) { electron: '44.7.0', ... }
2026-10-24T05:12:32.907Z [host] stdout: dsh web listening on http://127.0.0.1:52341
2026-10-24T05:12:33.010Z [info] host ready at http://127.0.0.1:52341
2026-10-24T05:13:02.114Z [renderer] http://dsh-app:3951/…:1 Uncaught TypeError: …
2026-10-24T05:13:02.115Z [error] fatal (renderer) Error: …
```

记录的通道：`info`（生命周期）、`host`（Host 的 stdout 与 stderr，同时原样透传到终端）、`renderer`（错误级控制台行，带 bundle 位置）、`warn`、`error`（未捕获异常、未处理 rejection 与所有致命路径）。文件到 8 MB 滚动，按修改时间保留五份。写入前会对凭证形态的片段做脱敏：Bearer 令牌、`sk-…` 密钥、`TOMATO_RELAY_API_KEY=…` 赋值与 `?token=` 查询值。

### 开发者模式

开发者模式会加一个「开发者」子菜单，并让打包版也能打开 DevTools：

| 入口 | 效果 |
|---|---|
| `TOMATO_DEVELOPER_MODE=1` | 打包版开启（未打包启动默认开启，设为 `0` 可关） |
| 开发者 → 打开开发者工具（`CmdOrCtrl+Alt+I`） | 打开渲染进程 DevTools 窗口 |
| 开发者 → 检查元素（`CmdOrCtrl+Shift+C`） | 转发浏览器的元素选择快捷键 |
| 开发者 → 刷新页面（`CmdOrCtrl+R`） | 重新加载应用文档 |
| 开发者 → 在访达中显示日志 / 打开日志文件 | 定位或打开当天诊断日志 |

### 从日志行定位客户端代码

客户端 bundle 构建时生成 sourcemap，sources 被改写为 `../../../packages/<group>/<package>/src/…`，且 `sourcesContent` 内嵌原始 TSX；`dsh-client-modules` 在 bundle 旁以 `/plugins/<id>/client.js.map` 提供映射。因此日志里的位置有两条回溯路径：

1. **日志里**：`http://dsh-app:…/plugins/@tomato/brand/client.js:42` 给出插件与 bundle 行号。打开 `packages/tomato/brand/src/client/…`，DevTools → Sources 里的映射会落到准确的 TSX 行。
2. **DevTools 里**：应用文档打开时，Sources 会直接列出 `packages/…` 文件（映射内嵌了源码），断点与抛错都落在作者写的那一行，而不是打包结果。

Host 侧可用 `DSH_DESKTOP_HOST_INSPECT_PORT` 挂上 Node 调试器，Host 堆栈指向 `packages/…/lib/*.js`，同样有对应映射。

<a id="production-readiness"></a>

## 生产化清单

M1 是内部使用、未签名、未发布的构建。以下缺口按对推广的阻塞程度排列。

### 阻塞项

1. **服务端端点** —— 桌面令牌端点（`/desktop/authorize`、`/desktop/token`）、内部 OTLP relay 与业务 MCP 网关目前都是 mock。三者都需要真实实现、确定的令牌有效期与吊销机制。
2. **签名与公证** —— 未签名包会在每台机器上被 Gatekeeper 拦住，非技术用户无法安装。签名需要 Developer ID 证书、`notarize` 与稳定的 bundle id（`DSH_DESKTOP_APP_ID`）。
3. **更新通道** —— 没有 feed、没有更新策略、没有回滚。发布意味着选定 feed 主机、通道名，以及更新是否强制。
4. **静态凭证保护** —— `safeStorage` 不可用时（Linux 无 keyring，或钥匙串被锁）令牌文件退化为明文。打包的 macOS 版有钥匙串访问权，但该退化路径应改为拒绝启动而非静默降级。
5. **权限姿态** —— `danger-full-access` 允许模型输出直接驱动本机命令。生产构建应隐藏该档位，或要求逐机显式解锁。

### 重要项

6. **崩溃上报** —— 崩溃报告只写本地、从不上传。生产需要一条可选的带脱敏上传路径，规则与诊断日志一致。
7. **遥测内容策略** —— span 刻意只带耗时与结果。若要采集 prompt 或回复，脱敏与留存是产品决策，不是工程默认值。
8. **会话数据生命周期** —— JSONL 会话在 Harness home 下持续累积，没有留存策略、导出或按人配额。
9. **业务 UI** —— MCP 工具的业务卡片与右侧栏详情属 M2；在此之前业务结果只渲染为通用 JSON 卡片。
10. **本地化覆盖** —— 外壳支持八种语言，但业务文案与新产品名只审阅了中英文。
11. **模型目录漂移** —— 占位模型 `tomato-chat` 只能通过中转站的列表解析。中转站离线或不提供列表时，选择器会停在一个网关未必支持的模型上。
12. **可访问性与键盘** —— 欢迎流程与开发者菜单未经过仓库的 UI 审查技能覆盖，发布前应做一次屏幕阅读器检查。

### 可选项

13. **可复现构建** —— 客户端产物摘要已记录，但 primary runtime 载荷是下载而非随仓库提供；内部镜像加固定校验和可让离线构建可行。
14. **Windows** —— 上游代码路径存在，但本项目未验证；打包、签名与安装器不在 M1 范围。
15. **测试深度** —— 外壳有单元与真实 Host 验收测试，但没有任何针对打包应用的端到端运行。

<a id="troubleshooting"></a>

## 故障排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `Downloading Electron binary...` 长时间不结束 | 发布主机慢或被阻断 | 按上文用 `ELECTRON_MIRROR` 重装 |
| `dev:desktop` 报 `The operation was aborted due to timeout` | primary runtime 下载超时 | 先跑 `pnpm --filter @deepseek-ai/dsh-desktop run prepare:primary-runtime`，或调大 `DSH_RESOURCE_DOWNLOAD_TIMEOUT_MS` |
| 欢迎窗出现但登录从不返回 | `TOMATO_AUTH_URL` 上没有登录服务 | 启动 `pnpm run mock:tomato`，确认端口一致 |
| 对话回复报缺少凭证 | 令牌没有写进 Host 凭证库 | 重新登录；交换时外壳会写入 `TOMATO_RELAY_API_KEY` |
| 模型列表为空 | 中转站没有 `/v1/models` | 用 `curl $TOMATO_RELAY_BASE_URL/models` 确认 |
| 找不到日志 | `app.setAppLogsPath()` 决定平台目录 | 跑 `pnpm run dev:desktop`，看它打印的 `userData` 路径，日志就在旁边 |

## License

上游 dsh 采用 MIT 许可；见 [LICENSE](LICENSE) 与 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
