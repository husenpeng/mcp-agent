# 0016. Playwright 浏览器随安装分发并在 Web/桌面默认启用

- 状态：Accepted
- 日期：2026-11-03
- 影响范围：`packages/util/official-bundles/`、`apps/cli/package.json`、`apps/desktop/`（运行时准备、签名与 smoke）、`packages/experimental/browser-use-playwright-bundle/`、插件页与浏览器操作文档

## 背景

[ADR 0006](0006-playwright-browser-bundle.md) 把 Playwright 浏览器按需组合包放进 `ON_DEMAND_BUNDLES`：插件页离线可见，打开开关才安装，用户首次使用前还要自行准备 Chromium。代价是所有 Web/Desktop 用户开箱都用不到浏览器能力——营销团队最常做的抓取、登录态页面操作与截图需要先联网安装、再手工装浏览器。

产品现在要求桌面安装包与 `tomato web` 新建 profile 默认就带浏览器工具，并且不依赖用户机器上已有的 Playwright 缓存。因此本 ADR 推翻 0006 的交付形态，保留其组合包结构（服务 + 固定 `launch`/`headless` 提供方）与版本固定方式。

## 决策

- **随安装分发**：`@tomato/experimental-browser-use-playwright-bundle` 从 `ON_DEMAND_BUNDLES` 移入 `OPTIONAL_BUNDLES`，并加入 `apps/cli` 的运行时依赖。桌面安装包按现有闭包规则打进 provider、`@playwright/mcp` 与 Playwright 运行时。
- **默认启用**：新增 `DEFAULT_ENABLED_OPTIONAL_BUNDLES`，只允许名单内的随附可选组合包被随附模板选中；`PROFILE_TEMPLATES.web.bundles` 追加该包。`desktop` profile 由 Web 模板初始化，因此 Desktop 与 `tomato web` 的新 profile 默认启用。用户仍可在插件页关闭：关闭只取消选中，依赖保留，永不可卸载。
- **隔离例外收窄为声明清单**：`verify-default-product-isolation` 原先只允许“随安装提供、默认关闭、不被模板选中”的实验包；现在名单内的组合包及其声明的运行时依赖闭包可以进入默认产品与 Web 模板，名单外的实验包继续被拒绝。行里挂载但未声明为依赖的实验包不在闭包内，仍报错。
- **Chromium 随桌面安装包分发**：新增 `prepare:playwright-browsers`，用 provider 固定的 Playwright CLI 执行 `playwright install chromium --only-shell`，把 headless shell 复制到 `runtime/playwright-browsers`；共享构建缓存 `.desktop-build/downloads/playwright-browsers` 复用下载。组合包固定 `headless: true`，因此只分发 headless shell，不分发可显示窗口的完整 Chromium。
- **运行时接线**：桌面 Host 启动环境注入 `PLAYWRIGHT_BROWSERS_PATH` 指向随包 registry；启动环境已显式设置的该变量优先，便于排障或改用本机浏览器。未打包启动使用目标 runtime 旁的副本，没有副本时回落到 Playwright 的用户缓存。
- **签名与验收**：macOS 签名阶段对 registry 内的 Mach-O 逐个签名，`chrome-headless-shell` 带 JIT entitlement，`electron-builder` 忽略该目录以避免二次签名；打包 smoke 运行 `chrome-headless-shell --version`，确认字节、架构与签名可用。
- **范围**：仅 `web` 模板默认启用。`headless`、`sdk`、`acp` 模板不变；已有 profile 不迁移，默认值只作用于新建 profile，用户可在插件页自行开启。

## 备选方案

- **保持按需安装、只补文档**：安装仍需要联网与用户手工准备浏览器，达不到开箱可用。
- **把两个包移出 experimental 再设为默认层**：没有例外规则，但要重命名包、迁移目录、快照与发布家族；交付形态与包成熟度是两件事，先把前者定下来，重命名可以另做。
- **打包完整 Chromium**：多出约一倍体积并扩大签名面，而组合包只启动 headless shell；需要可视窗口或 attach 的用户仍走 profile patch。
- **运行时按需下载 Chromium**：把网络失败面放进首次会话，并且与安装包体积无关的机器也要重复下载。

## 后果

- 安装包多出一个 headless shell（macOS arm64 解压后约 200MB），DMG/EXE 明显增大；首次会话不再需要联网安装浏览器。
- 默认启用的 profile 第一个 Session 就会初始化浏览器工具，工具 schema 进入请求前缀；关闭后新 Session 不再获得浏览器工具。
- Chromium 版本由 `@playwright/mcp` 固定的 Playwright 版本决定。升级 provider 必须重新准备浏览器；`prepare:playwright-browsers` 从同一 provider 解析 CLI，因此构建始终下载配套 revision。
- `tomato web` 的非桌面部署不携带 Chromium，仍依赖本机 Playwright 缓存或 `executablePath`；在没有缓存的机器上，新 Session 会因提供方启动失败而创建失败，需要安装浏览器或关闭组合包。这一差别由 `PLAYWRIGHT_BROWSERS_PATH` 的有无体现。
- `@tomato/browser-use` 服务随之进入默认产品，`scripts/product-package-policy.ts` 里该包的 `optional` 声明被移除。
- 同一 profile 仍只能注册一个 browser-use 提供方；本组合包与其他提供方同时激活会以已注册提供方的名称失败。

## 验证

- `pnpm exec vitest run packages/util/official-bundles/tests/official-bundles.spec.ts packages/experimental/webworker-packer/tests/profile-image.spec.ts packages/boot/plugin-manager/tests/manager.spec.ts scripts/verify-default-product-isolation.spec.ts apps/desktop/tests/playwright-browsers.spec.ts`
- `pnpm run verify-default-product-isolation`：Web 模板连同名单内组合包的行一起通过，名单外实验包被拒绝。
- `pnpm run verify-official-bundle-catalog`：按需目录不再包含该包。
- `pnpm run package:desktop:mac:arm64:unsigned` 或对应 CI 任务：`Resources/runtime/playwright-browsers` 存在，打包 smoke 打印 headless shell 版本；插件页显示 Playwright 浏览器已启用且可关闭。

## 未决

- 是否把 Chromium 也纳入非桌面的 Web 部署镜像。
- 已有 profile 的默认启用迁移：目前只有新建 profile 自动开启。
- Linux 桌面目标仍不在支持范围内。