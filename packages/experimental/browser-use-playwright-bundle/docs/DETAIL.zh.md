# Playwright 浏览器

打开本组合包会安装 Playwright MCP 提供方，并为每个新 Session 提供独立的隔离 Chromium。提供方默认以 headless 模式启动；激活后创建的 Session 在其后续轮次中复用该连接，直到停用提供方或重启应用。

首次启动需要本包所用 Playwright 版本可识别的 Chromium 构建。先运行一次 `npx playwright install chromium`，或通过 profile patch 以 `executablePath` 指向已有的 Chromium 或 Chrome 可执行文件。

浏览器 profile、Cookie 与页面只存在于运行中的 Session。重启后恢复 Session 会得到全新的浏览器状态。同一 profile 只能激活一个 browser-use 提供方；attach 模式、可见浏览器设置以及系统提示对浏览器工具名的约束见本包 README。
