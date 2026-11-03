# Agent Note: 让 Playwright 浏览器组合包默认开启

Status: implemented

[English](2026-11-03-default-playwright-bundle.md) | 中文

## Problem

产品用户打开应用就需要浏览器工具：营销流程要查看页面、登录态界面与截图。[按需交付决策](2026-10-27-official-on-demand-playwright-bundle.zh.md)让组合包可被发现，却把可用浏览器隔在三步之后——先装组合包、再准备 Chromium、最后重启 Session。离线或未准备浏览器的机器拿到的是提供方启动失败，而不是可用的浏览器。

## Decision

Playwright 组合包改为随安装分发，并在 Web 与桌面 profile 默认开启。`@tomato/experimental-browser-use-playwright-bundle` 仍留在 `OPTIONAL_BUNDLES`，同时成为 `@tomato/cli` 的运行时依赖，并加入 `PROFILE_TEMPLATES.web.bundles`。`desktop` profile 由 Web 模板初始化，因此 Desktop 与 `tomato web` 的新 profile 默认选中浏览器层；插件页仍可关闭，关闭只取消选中、保留依赖。该包移出 `ON_DEMAND_BUNDLES`，离线目录不再提示安装步骤。

`DEFAULT_ENABLED_OPTIONAL_BUNDLES` 点名允许被随附模板选中的随附可选组合包，也是 `verify-default-product-isolation` 的声明例外：只有名单内的组合包及其声明的运行时依赖闭包可以进入默认产品与 Web 层；行里挂载但未声明为依赖的实验包仍会让检查失败。其余条目继续遵守“可选组合包不做模板层”的规则，因此“随安装分发”与“默认开启”仍是两件事。

桌面打包自行下载 Chromium。`prepare:playwright-browsers` 通过 provider 的 `@playwright/mcp` 依赖解析出 Playwright CLI，执行 `chromium --only-shell` 安装到共享构建缓存，再把完整安装复制到 `runtime/playwright-browsers`。Host 启动环境拿到指向该 registry 的 `PLAYWRIGHT_BROWSERS_PATH` 与指向其中 shell 的 `PLAYWRIGHT_MCP_EXECUTABLE_PATH`，除非启动环境已显式设置对应变量。后者是因为 `@playwright/mcp --browser chromium` 解析的是完整 Chrome for Testing 构建，而安装包只携带 shell；提供方在 headless 启动时改用该 shell。macOS 在应用签名前签署 registry 内的 Mach-O 文件，`chrome-headless-shell` 带 JIT entitlement；electron-builder 忽略该目录，打包 smoke 运行 `chrome-headless-shell --version`。

只有 Web 模板改变。`headless`、`sdk`、`acp` profile 保持原组合，已有 profile 保留自己的选择，因为模板只在 profile 首次创建时生效。

## Alternatives considered

**首次使用时下载 Chromium 而不是随包分发。** 安装包保持小巧，但每台机器都要在 Session 里等待网络下载，失败表现为浏览器工具不可用；随包分发让首次启动离线可用。

**分发完整 Chromium 而不是 headless shell。** 组合包固定 `headless: true`，可视窗口与更大的签名面服务不存在的随附配置；可见浏览器与 attach 仍是 profile patch 的配置。

**把两个包移出 experimental。** 这样能去掉隔离例外，但要重命名包、迁移目录、快照与发布家族条目。交付形态与成熟度是两个决策，本记录只改变前者。

## Consequences

安装包增加一个 headless shell（macOS arm64 解压后约 200MB）。新建 Web 或桌面 profile 的第一个 Session 就会初始化提供方，浏览器工具 schema 进入该请求前缀；关闭组合包后，后续 Session 回到原工具列表。Chromium 跟随固定的 Playwright 版本，升级 provider 必须重新构建并替换随包 registry。Desktop 之外的 `tomato web` 部署不带 registry，继续使用本机 Playwright 缓存或 `executablePath`。未准备运行时的机器上，Chromium 在关闭组合包或提供浏览器之前仍不可用。