# 0006. Playwright 浏览器按需组合包

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`packages/experimental/browser-use-playwright-bundle/`、`packages/util/official-bundles/`、插件页与浏览器操作文档

## 背景

`dsh-browser-use` 与 `@deepseek-ai/dsh-experimental-browser-use-playwright-mcp` 已存在，但只能由 profile 手写挂载。Tomato 的 Web/Desktop 用户在插件页看不到浏览器能力，也无法安装；同时 Playwright MCP 会带入 Playwright 运行时并要求本机 Chromium 构建，不适合随每次安装分发。

仓库既有决策把外部浏览器提供方排除在随安装分发（`OPTIONAL_BUNDLES`）之外，并把自带较重运行时的官方集成放入按需目录（`ON_DEMAND_BUNDLES`）。本次沿用该机制。

## 决策

- 新增实验性组合包 `@deepseek-ai/dsh-experimental-browser-use-playwright-bundle`，声明 `dsh.bundle.patch`、图标、8 种语言的标题与描述，以及本地详情文档。
- 将其加入 `ON_DEMAND_BUNDLES`，由 `pnpm run gen-official-bundle-catalog` 生成离线目录；插件页在安装前即可显示，打开开关才安装并选中该层。
- 补丁固定挂载两个行：共享服务 `@deepseek-ai/dsh-browser-use` 与提供方 `@deepseek-ai/dsh-experimental-browser-use-playwright-mcp`，配置为 `mode: launch`、`headless: true`。
- 组合包不安装 Chromium；首次使用前由用户在机器上执行 `npx playwright install chromium`，或通过 profile patch 用 `executablePath` 指向已有浏览器。
- 不提供组合包配置表单。需要可见浏览器或 `mode: attach` 时，保持组合包关闭，改为在 profile patch 中挂载提供方并显式配置。
- 同一 profile 只能注册一个 browser-use 提供方；第二个提供方激活失败。

## 备选方案

- 放进 `OPTIONAL_BUNDLES` 随安装分发：会让所有安装承担 Playwright 运行时与浏览器要求，违反既有可选组合包准入决策。
- 保留手工 profile patch 并仅补文档：安装仍不可从插件页发现，用户需要自己维护包名、版本与补丁。
- 在激活时自动下载 Chromium：把网络下载与额外失败面引入开关，且所需构建由固定版本 Playwright 决定，不应由 DSH 重复管理。
- 同时为 Chrome DevTools MCP 与 Stagehand 建按需包：当前只有 Playwright 有明确需求，先只准入一个，后续提供方沿用同一机制。

## 后果

- 未启用组合包的 profile 不增加安装体积或运行时依赖。
- 首次激活需要能访问 registry（或已准备好的源码工作区）并已有 Chromium；缺失时新 Session 的 MCP 启动失败并报告提供方错误。
- 插件页可以离线展示标题、描述、图标与详情；安装后由既有插件管理器流程处理 Registry 兜底、取消、构建脚本授权与重启提示。
- 浏览器状态仅属于运行中的 Session，重启或恢复不保留 Cookie 与页面。
- 系统提示的 `toolOrder` 必须把浏览器工具留在 `<unlisted-tools>`，否则无浏览器连接的 Session 可能组装提示失败。

## 验证

- `pnpm exec vitest run packages/experimental/browser-use-playwright-bundle/tests/patch.spec.ts`：补丁行顺序、固定配置与 Loader 导入顺序。
- `pnpm exec vitest run packages/util/official-bundles/tests/official-bundles.spec.ts`：目录包含新包且元数据完整。
- `pnpm run gen-official-bundle-catalog` 与 `pnpm run verify-official-bundle-catalog`：目录由包内元数据生成且没有漂移。
- `pnpm run verify-package-meta`：图标、locale 元数据、资源导出与发布文件有效。
- 插件页手工验收：未安装时离线可见 Playwright 浏览器条目；打开开关触发安装与层选中；新 Session 获得浏览器工具；关闭开关后新 Session 不再获得。

## 未决

- Chromium 自动安装暂不纳入组合包，后续若提供受管安装需要单独的下载与失败策略。
- 可见浏览器、attach 端点与超时仍只能通过 profile patch 配置，是否提供组合包配置页尚未决定。
