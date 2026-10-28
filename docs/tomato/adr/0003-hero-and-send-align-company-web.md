# 0003. 空会话 hero 与发送键对齐公司 Web 的视觉

- 状态：Accepted（空会话 hero 点阵的静态部分由 [0004](0004-hero-dot-field-interaction.md) 接替；发送键决策不变）
- 日期：2026-10-27
- 影响范围：`packages/client/ui-conversation/src/client/skeleton/`（`ConversationRoot.module.css`、`InputBar.module.css`、`InputBar.tsx`）

## 背景

New Session 的空会话页与公司 Web（`client-monorepo`）的 `/strategy`、`/conversation` 首屏承担同一类场景，但两边的视觉不一致：

- 公司 Web 的 `/strategy` 首屏在纯白底上铺一层 4px、间距 42px（节距 46px）的点阵，关键内容与输入框浮在其上；dsh 的空会话页没有这层点阵，页面显得空。
- 公司 Web 的发送键（`BriefChainlitView.tsx` 的 `Button`）用品牌红渐变圆钮：可用时为实心渐变，禁用时 40% 不透明，生成中换成旋转 loading 图标（点击仍执行停止）。dsh 的发送键是蓝色的 info 填充，且生成中显示方块停止图标。

Tomato AI 以公司 Web 的设计 token 作为业务视觉基线，这两处差异会让首屏不像同一产品，需要对齐。

## 决策

### 空会话页背景

`ConversationRoot` 的 `.root` 仅在 `data-phase="hero"` 时铺点阵：`radial-gradient` 画直径 4px 的圆点，`background-size: 46px 46px`，`background-position: center`；颜色取主题 token `--dsw-alias-border-l3`（浅色下叠在白底约等于 `#e3e4e4`，与公司 Web 的 `#e4e4e4` 一致；深色下自动变成低对比度的浅色点）。

hero 态下 `.composerSeat` 的顶部渐隐（原本用于会话态滚动遮罩）置空，避免它在点阵上画出一条白带。`active`、`settling` 两态保持原来的纯底色。

点阵最初是静态 CSS 背景；指针推开/回弹/点击冲击波由 [0004](0004-hero-dot-field-interaction.md) 的 canvas 交互接替，静态 CSS 保留为 canvas 不可用时的 fallback。

### 发送键

`InputBar` 的主发送键改为与公司 Web 发送 `Button` 相同的外观与状态：

- 填充：`background-color: var(--dsw-alias-button-primary-fill)` 之上叠 `background-image: var(--dsw-brand-gradient-cta)`；浅色与公司 Web 的 `linear-gradient(to right, #ff2828, #fd795c)` 相同，深色沿用主题的深红渐变。
- 字形保持白色，禁用态 `opacity: 0.4`（与公司 Web 的 `disabled:opacity-40` 相同）。
- 悬停不改变填充；按下时在原有的 `translateY(-2px)` 上叠加 `scale(0.97)`，过渡只覆盖 transform 与 opacity。
- hero 变体的圆钮取公司 Web 的 38px 尺寸；会话态保留 dsh 自己的 34px（不改动输入卡已有布局）。
- 生成中且主操作是 Stop（草稿为空或输入不可用）时，按钮渲染 `IconLoadingOutlineRegular` 并旋转；`prefers-reduced-motion: reduce` 下不旋转。空草稿之外的运行态仍按 dsh 的语义显示 Queue / Steer Send。

## 备选方案

- 固定纯白或 `#fafafa` 画布作背景：公司 Web 的首屏本身就是白底加点阵，单换底色无法对齐；点阵才是可见差异。
- 直接移植 `DotFieldBackground` 的 canvas 交互：当时需要 gsap 或自写惯性物理与逐点动画，超出“背景观感”的范围，交互延后；后由 [0004](0004-hero-dot-field-interaction.md) 以自写弹簧实现。
- 保留蓝色 info 填充：与公司 Web 的发送键仍不一致，且与番茄品牌 CTA 冲突。
- 会话态发送键也放大到公司 Web 的 40px / 24px 字形：会改动输入卡行的既有几何，超出本次“状态对齐”的范围。

## 后果

- 浅色下 hero 页与公司 Web 首屏的底色、点距一致；深色下点阵与按钮跟随番茄主题，不会出现只在深色下刺眼的固定浅色点。
- 静态点阵没有指针交互；该缺口由 [0004](0004-hero-dot-field-interaction.md) 的 canvas 交互补齐。
- 生成中不再显示方块停止图标，停止语义由按钮的 `aria-label` / tooltip 与点击行为承载；会话视图的 Trajectory、队列等不受影响。
- 发送键不再使用 `--dsw-alias-button-info-fill`；该 token 仍被目录浏览器与提问组件使用。

## 验证

- `pnpm exec vitest run packages/client/ui-conversation/tests`：全部通过，含新增的“运行中 Stop 渲染 loading 图标、Send 恢复箭头”断言。
- `pnpm run typecheck`、`pnpm run build:artifacts`：通过。
- 浏览器目视：浅色 / 深色 hero 页点阵可见，发送键在禁用（40% 透明）、可用（红渐变）、hero（38px）三种状态与公司 Web 一致；进入会话后点阵消失、发送键为 34px。

## 未决

会话态发送键是否要跟随公司 Web 的 40px / 24px 规格，待产品确认。