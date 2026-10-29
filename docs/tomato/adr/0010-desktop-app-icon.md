# 0010. 桌面应用图标改用番茄资源

- 状态：Accepted
- 日期：2026-10-28
- 影响范围：`apps/desktop/resources/`、`apps/desktop/scripts/render-tray-icon.ts`、`apps/desktop/tests/application-icon.spec.ts`

## 背景

[ADR 0002](0002-web-brand-identity.md) 把 Web 标签页与安装图标换成番茄资源，桌面图标留作未决。`apps/desktop/resources/` 下的 `icon.svg`、`icon-macos.svg`、`icon-windows.svg`、对应 PNG 与 `tray-windows.ico` 仍是 dsh 鲸鱼，打包后的 macOS Dock、Finder、关于面板，以及 Windows 任务栏、安装程序与托盘都显示 dsh 标识。

## 决策

- **原稿**：`resources/icon.svg` 与 Web 安装底板 `apps/web/assets/app-icon.svg` 逐字节一致：1104×1104 画布、1024 单位浅色底板，底板内是 `@tomato/brand` 的番茄路径。`resources/icon.png` 是它的 1104×1104 导出。
- **平台适配**：`icon-macos.svg` 与 `icon-windows.svg` 保留原有的平台变换，只替换底板内的图形与渐变。macOS 版缩放 0.8046875、四边留 100 像素、圆角 230（缩放后约 185），对应 Apple 图标网格；Windows 版缩放 0.9375、四边留 32 像素、圆角 192，并保留托盘渲染器读取的 `tray-glyph` 分组。两份 PNG 由 sharp 按 1:1 导出为透明 1024×1024，electron-builder 继续由它们生成 ICNS 与 ICO。
- **托盘**：`render-tray-icon.ts` 的放大系数由 1.2 改为 1.15。外环是番茄标志最宽的部分，占底板宽度的 84%；放大 1.2 时外环越出底板，1.15 时两侧各留约 16 个画布单位。`tray-windows.ico` 由 `pnpm run render:tray-icon` 重新生成。
- **一致性检查**：`application-icon.spec.ts` 断言 `icon.svg` 与 Web 安装底板逐字节一致、两个平台 SVG 含原稿的同一条番茄路径、两个平台 PNG 为 1024×1024 RGBA。

## 备选方案

- 重新绘制番茄图形：与侧栏、标签页和 Web 安装图标的品牌标志不一致，新字形还需设计师确认。
- Web 脚本改回读取桌面原稿并删除 `apps/web/assets/app-icon.svg`：可消除副本，但会改变 ADR 0002 确定的 Web 资源归属，并需同步修改 Web 测试，超出本次范围。
- 托盘保持放大 1.2：外环在 64 像素位图中只越出底板约 0.2 像素，肉眼难以察觉，但图形已越出底板背景。
- 红色底板配白色标志：小尺寸更醒目，但与 Web 安装图标不一致。

## 后果

- 打包后的 macOS Dock、Finder、关于面板，以及 Windows 任务栏、安装程序、卸载程序与托盘统一显示番茄标志，与 Web 安装图标相同。
- 番茄标志是线条图形。16 像素托盘位图中线宽不足 1 像素，可辨识度低于原来的实心鲸鱼剪影，24 像素起可以辨认；要改善需另做小尺寸字形。
- 原稿有两份副本，由测试保证一致。修改底板时两份文件一起改，并重新导出桌面 PNG、托盘 ICO 与 Web 安装 PNG。
- macOS 从应用包读取图标，未打包的开发态 Dock 仍显示 Electron 图标；Windows 开发态的窗口与关于面板读取 `resources/icon-windows.png`，直接显示新图标。
- Windows 安装页面的品牌图片 `installer/assets/brand*.png` 与 `uninstaller-sidebar.png` 不在本次范围。

## 验证

- 在 `apps/desktop` 执行 `pnpm run render:tray-icon` 重新生成托盘 ICO；三张 PNG 由 sharp 从对应 SVG 按 1:1 导出。
- `pnpm exec vitest run apps/desktop/tests/application-icon.spec.ts apps/desktop/tests/tray-icon.spec.ts apps/desktop/tests/installer-packaging.spec.ts` 通过；篡改原稿、平台路径或 PNG 尺寸时，`application-icon.spec.ts` 的三条断言各自失败。
- 在 1024 画布中按 1.15 放大后，番茄标志的不透明像素横向范围为 48–975，位于底板 32–991 之内；按 1.2 放大时有 255 个不透明像素落在底板外。
- 目视检查浅色与深色背景下 16–256 像素的 macOS 图标，以及浅色与深色任务栏上 16–64 像素的托盘位图。

## 未决

- 原稿 `mark-fill` 渐变使用 `userSpaceOnUse`，坐标按底板坐标系书写，而路径自身带缩放变换，渐变实际落在路径的 64 单位坐标系中，整个标志只取第一个色标，渲染为 `#93000A` 纯色，与 ADR 0002 描述的“`#93000a` 到 `#fe5042` 的渐变”不符。Web 安装图标与桌面图标的显示效果一致；是否改为真实渐变，需同时修改两份原稿并重新导出全部 PNG，待产品确认。
