# 0008. macOS 桌面壳子：标题栏露出品牌并降低窗口高度

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`apps/desktop/src/`、`apps/desktop/renderer/`、`packages/client/ui-sidebar/`

## 背景

两个桌面窗口在 macOS 上都用 `hiddenInset` 隐藏系统标题栏，红绿灯直接浮在页面顶部，但品牌没有落在红绿灯所在的那条区域内：

- 欢迎窗口的 42px `.titlebar` 只是拖拽条，全空；`Tomato AI` 的 logo + 文字要再往下约 130px 才出现在左侧品牌面板里。
- 主窗口侧栏顶部 52px 的 macOS 顶栏只放收起按钮，品牌在它下面的 60px `logoRow` 里；展开态头部合计约 100px，比内容本身更抢眼。

同时两个窗口的默认高度偏高：欢迎窗口固定 1000×700，主窗口默认 1280×820，在 13 寸 macOS 屏幕上几乎占满高度，居中的登录内容上下留白过大。

## 决策

- 欢迎窗口在 42px 标题条内展示 `Tomato AI` 标识：18px 番茄 mark + 13px/500 文字，macOS 左侧留 92px 避开红绿灯，Windows/Linux 左侧留 16px；Windows 原生按钮在右侧，不需要让位。左侧品牌面板原有的大号 logo（36px + 22px wordmark）保留，标题条是窗口 chrome，面板是页面内容。
- 欢迎 preload 通过 `WelcomeApi.platform` 暴露 `process.platform`；`welcome.tsx` 在首次渲染前写入 `html[data-platform]`。preload 执行时 `document.documentElement` 还不存在，不能在 preload 里直接写。标题条留白由 `html[data-platform='darwin']` 分支控制。
- 欢迎窗口尺寸改为 1000×640（`useContentSize`）。为在 640 下容纳中英文入口页与错误行，收紧垂直节奏：`authCard` 34→30px、`loginCard`/`statusCard` 间距 24→20px、`feishuPanel` 16→12px、`authPane` 48/40→32/24px、`brandPanel` 64/40→56/32px，并把两个面板改为 `justify-content: safe center` + 纵向滚动，内容超长时滚动而不是上下裁切。
- 主窗口 macOS：品牌移入 52px 顶栏（左 88px 避开红绿灯、`space-between` 让开关留在右端），darwin 下不再渲染 `logoRow`，展开态头部从约 100px 降到 52px；全屏时红绿灯消失，顶栏留白回落到 12px。非 darwin（Web、Windows）保持原布局。
- 主窗口默认尺寸 1280×820 → 1280×760。

## 备选方案

- 标题条只放文字、保留面板 logo 不动：已采用，只是把标题条的文字做到 13px/500，避免与下方 22px wordmark 争夺视觉重心。删除面板 logo 的方案会让左侧营销面板失去品牌锚点。
- 主窗口保留 `logoRow` 并在顶栏再放一次品牌：同名标识上下相隔约 50px，重复更明显，也保留 100px 头部。
- 维持欢迎窗口 700 高：减小标题条留白即可，但用户反馈的“整体太高”仍然成立；640 与 16:10 比例接近，收紧间距后中英文入口页都放得下。
- 用 renderer 判断 `navigator.userAgent` 代替显式 platform：不可测且与 `data-platform` 约定不一致。

## 后果

- macOS 上两个窗口的品牌都落在红绿灯同一行；主窗口头部少 48px，欢迎窗口矮 60px。
- 英文欢迎页的品牌面板在 640 高度下接近底边（面板内容约 602px，可用 598px），依赖 `safe center` + 滚动兜底；中文与常规英文入口页留有余量。
- `WelcomeApi` 新增只读 `platform` 字段；欢迎 preload 与渲染器同改。
- Windows 欢迎窗口的标题条从纯拖拽条变成带品牌的可拖拽条，红绿灯/窗口按钮位置未变。

## 验证

- `pnpm exec vitest run packages/client/ui-sidebar/tests/sidebar-root.client.spec.tsx packages/client/ui-sidebar/tests/sidebar-styles.client.spec.ts apps/desktop/tests/welcome-renderer.client.spec.tsx apps/desktop/tests/welcome-window.spec.ts`：darwin 下品牌与开关同处一个拖拽行、欢迎窗口尺寸与内嵌页面文案。
- `pnpm exec vitest run apps/desktop/tests/preload.e2e.ts`：欢迎 preload 暴露 `platform` 且不再在无 documentElement 时崩溃。
- 开发态 `pnpm run dev:desktop` 启动后截图核对：欢迎窗口 1000×640 顶部出现 `Tomato AI`；主窗口 1280×760、侧栏顶部 52px 内品牌与红绿灯同行。
- 中英文入口页在 640 高度下均不裁切（含错误行）。

## 未决

无。