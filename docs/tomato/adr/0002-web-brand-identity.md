# 0002. Web 端浏览器与安装标识改用番茄资源

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`apps/web/`、`apps/desktop/src/main.ts`

## 背景

Web 入口 `apps/web/index.html` 按明暗配色分别引用 `favicon.svg` 与 `favicon-dark.svg`，但两份文件仍是 dsh 的鲸鱼几何，只是换成了番茄红填充，浏览器标签页因此仍显示 dsh 标识。安装图标由 `render-app-icons.ts` 从桌面 tile（`apps/desktop/resources/icon.svg`）生成，manifest 与 iOS 元数据的产品名也仍是 `DeepSeek Harness` / `DSH`。`@tomato/brand` 与欢迎页字标已经使用番茄标记，浏览器可见身份与页面内品牌不一致。

## 决策

- **标签页**：`apps/web/public/favicon.svg` 与 `favicon-dark.svg` 改用与 `@tomato/brand` 相同的番茄路径，固定纯色填充：浅色 `#b71616`，深色 `#de3730`。两份文件除填充色外逐字节一致，供 `index.html` 的 `prefers-color-scheme` 媒体查询选择。`viewBox` 取图形包围盒并留 2 单位留白，方形裁切为 `3.9 4.4 56.2 56.2`（原路径画布 64×64），标记在 16px 标签页中占满宽度且垂直居中。
- **安装图标**：新增 `apps/web/assets/app-icon.svg`，沿用 1104×1104 画布、1024 单位 tile 与 40/32 内缩；tile 内放置同一番茄路径，深红 `#93000a` 到 `#fe5042` 的渐变。`render-app-icons.ts` 的 `TILE_SOURCE` 指向该文件，分组标记改为 `tile-shadow` 与 `mark-shadow`。四个安装 PNG 由脚本重新生成并提交。
- **安装身份**：`manifest.webmanifest` 的 `name` 与 `short_name` 改为 `Tomato AI`；`index.html` 的 `apple-mobile-web-app-title` 同为 `Tomato AI`。
- **Desktop**：`app://` 协议白名单补上 `/favicon-dark.svg`，否则深色系统下该请求 404，窗口内页面回退到浅色图标。

## 备选方案

- 标签页保留 64×64 原始画布：图形只占画布约三分之二宽度，16px 中标记过小。
- 标签页使用渐变填充：与侧栏标记一致，但 `pwa-manifest.e2e.ts` 用固定 `fill` 值校验明暗两版，且标签页不需要渐变细节。
- 安装图标沿用桌面 tile 源图：桌面资源仍是 dsh 鲸鱼，Web 安装图标会继续携带 dsh 标识。
- 红色方形底加白色标记：更醒目，但 `pwa-manifest.e2e.ts` 以浅色背景上的深色内容校验 maskable 安全区，且与现有裸标记用法不一致。

## 后果

浏览器可见的标签页、安装图标、安装名称与页面内品牌一致。安装图标仍保持浅色 tile 加红色标记，curves 抗锯齿校验与 maskable 安全区校验继续成立；`app-icons.spec.ts` 与 `pwa-manifest.e2e.ts` 的期望值随资源与名称同步更新。桌面应用的 Dock/任务栏图标与托盘图标仍来自 `apps/desktop/resources/` 下的 dsh 资源，本次未改动。

## 验证

- `pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons` 重新生成四个 PNG。
- `pnpm vitest run apps/web/tests/app-icons.spec.ts`：tile 裁切、maskable 缩放与文件尺寸断言通过。
- `pnpm vitest run --config vitest.web.config.ts apps/web/tests/pwa-manifest.e2e.ts`：安装元数据、四个图标的像素覆盖与安全区断言通过。
- 目视检查 16px / 32px / 64px 明暗 favicon，以及 192px / maskable 512px 安装图标。

## 未决

桌面应用的 Dock/任务栏图标与 Windows 托盘图标是否同步改为番茄资源，待产品确认。