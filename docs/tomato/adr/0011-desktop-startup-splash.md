# 0011. 桌面冷启动品牌开屏动画

- 状态：Accepted
- 日期：2026-10-29
- 影响范围：`apps/desktop/src/`、`apps/desktop/renderer/`、`apps/desktop/tsdown.config.ts`、`apps/desktop/tests/`

## 背景

桌面冷启动先创建主窗口但不显示，Host 就绪后才显示欢迎窗或工作区；在这段时间里屏幕上没有本应用的窗口。品牌素材已经就位：`@tomato/brand` 的 64×64 番茄路径、`Tomato AI` 字标、应用图标底板（[ADR 0010](0010-desktop-app-icon.md)）。本次为每次进程冷启动加入一段固定的品牌动画，让等待期有确定的起止与品牌信息，而不是空白或单纯遮罩。

## 决策

- **定位**：每次进程冷启动完整播放 2.2s 的品牌动画，不因 Host 提前就绪而缩短；播完停在终态，等 Host 就绪后交给第一个应用窗口。单实例的第二次启动、macOS Dock 重新激活不播放。
- **承载**：`app.whenReady()` 内、创建主窗口之前打开独立的无边框 `BrowserWindow`。窗口 1280×760，与主窗口同尺寸且不显式定位，登录态交接时窗口边缘不动；`frame: false`、不可缩放/最小化/最大化/全屏、`alwaysOnTop`、Windows `skipTaskbar`，`show: false` 配合同色 `backgroundColor` 避免首帧闪白。文档是 `renderer/splash.html` 的静态页面，无 React；`splash.ts` 只负责星尘 canvas、暂停与完成回报。
- **交接**：目标窗口（主窗或欢迎窗）显示后调用 `release()`；渲染器报告动画完成后 `setOpacity` 1→0、300ms 立方缓出，关闭 splash。渲染器在目标窗口可见后 6s 仍未报告时按完成处理；渲染进程退出、文档加载失败立即关闭。
- **视觉**：底板浅色 `#FBFBFB`、深色 `#1b1b1c`，跟随系统 `prefers-color-scheme`。番茄 224×224，渐变浅色 `#b71616→#fe5042`、深色 `#93000a→#de3730`；字标 `Tomato AI` 为 Montserrat Light 56px、字距 1.25px，与标志间距 48px；整组视觉中心位于窗口高度约 46%。标志几何与 `@tomato/brand` 的路径逐字节一致，由测试保证。
- **时间轴**：0–0.9s 从茎部描线——遮罩内 4 单位宽的白色描边沿路径做 `stroke-dashoffset`，带出实际线稿；0.9–1.45s 从茎心向外径向点亮，把 55% 不透明度的线稿带到满色；1.45–1.95s 字标淡入并上移 6px；1.95–2.2s 定格。星尘 canvas 约 280 颗、三层景深，全程向上漂移 3–10px，描线推进时最近的 12 颗依次亮起，1.45s 全场 120ms 微脉冲。浅色为暖灰微尘，深色为暖白星点；品牌红点缀 22 颗，占比 ≤8%。
- **等待态**：动画结束后 1.5s 仍未就绪时，字标下方 20px 淡入 112×2px、左右渐隐的渐变不确定线；星尘继续缓慢漂移与少量闪烁。
- **交互与豁免**：点击窗口或按 Esc 立即跳到终态；`prefers-reduced-motion` 只显示静态终态，400ms 后回报完成。开发态默认播放，`TOMATO_DESKTOP_SKIP_SPLASH=1` 跳过创建。
- **完成握手**：`splash-api.ts` 定义单向通道 `tomato-desktop:splash-animation-done`；`preload-splash.ts` 暴露 `window.tomatoSplash.notifyAnimationDone()`；主进程只接受来自 splash 窗口主 frame 且路径为 `renderer/splash.html` 的报告，重复报告不重复启动淡出。
- **异常从属**：splash 没有独立超时。fatal/恢复对话框、强制更新进入 blocking、退出路径都会立即关闭 splash，品牌动画不排在用户必须看到的界面之前。
- **深色例外**：开屏跟随系统外观；用户在应用设置里显式选择的主题此时还读不到，因此浅色系统 + 显式深色应用会出现一次明暗切换，这是本决策接受的缺口。

## 备选方案

- **主窗口内首屏动画**：要等主窗创建与页面加载，盖不住最早的空白期，还要处理 vibrancy 与 Windows titlebar overlay，页面切换也更复杂。
- **纯等待屏**：Host 就绪即关闭，快启动时动画几乎不可见，品牌投入失去意义。
- **固定时长且不等后端**：慢启动时动画结束后仍露出空白。
- **点阵汇聚或材质浮现**：点阵汇聚与描线概念冲突且容易流于科技感；材质浮现只是高级淡入。
- **透明窗口 / 440×440 图标卡**：透明窗在 Windows 的阴影与圆角不可靠；小窗与主窗交接有尺寸跳变。
- **恒为深色夜空**：星空观感更统一，但浅色用户要经历明暗切换，也放弃"放大的图标底板"这层呼应。

## 后果

- 冷启动增加一个 webContents 与 2.2s 的最低品牌时间；点击、Esc 与开发开关提供出口。
- 主窗口 1280×760 的几何被开屏复用；修改主窗口默认尺寸时需同步 `SPLASH_WIDTH`/`SPLASH_HEIGHT` 与星尘密度。
- 字标字体复用 welcome 构建产出的 `lib/welcome/brand-font.css` 与 Montserrat 字体文件；`bundle` 先构建 welcome，再构建 `lib/splash`。
- 渲染器与 shell 之间新增一条只读单向 IPC；splash 文档没有其他 IPC、导航权限或网络访问。
- 开屏占满 1280×760 且置顶，Host 就绪前的原生对话框与强制更新窗由异常路径直接关闭开屏来保证可见。

## 验证

- `pnpm exec vitest run apps/desktop/tests/splash-window.spec.ts apps/desktop/tests/splash-timeline.spec.ts apps/desktop/tests/splash-assets.spec.ts`：窗口选项、淡出曲线、跳过/异常关闭、时间轴顺序、星尘确定性、资源与品牌路径一致性。
- `pnpm exec tsc -b apps/desktop/tsconfig.host.json apps/desktop/tsconfig.client.json` 与 `pnpm --filter @tomato/desktop run bundle`：产出 `lib/splash/splash.js` 与 `lib/preload-splash.cjs`。
- 开发态 `TOMATO_DESKTOP_OPEN_DEVTOOLS=0 pnpm run start:desktop`：splash 出现并播完 2.2s，Host 就绪后 300ms 淡出进入主窗；点击与 Esc 跳终态；`TOMATO_DESKTOP_SKIP_SPLASH=1` 不出现开屏。
- 浅色与深色系统外观下目视检查；切换系统外观后重启复核底板与标志颜色。

## 未决

- 应用内显式主题与系统外观不一致时的明暗断裂尚未消除；如需消除，需要让开屏在 Web 主题落盘前读取用户主题偏好，或让应用主题在启动前写入 Desktop 设置。