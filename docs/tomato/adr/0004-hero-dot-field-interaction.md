# 0004. 空会话 hero 点阵接入指针交互动效

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`packages/client/ui-conversation/src/client/skeleton/`、`apps/web/tests/`

## 背景

[ADR 0003](0003-hero-and-send-align-company-web.md) 把空会话 hero 背景对齐到公司 Web `/strategy` 的 4px / 46px 点阵，但只做了静态 CSS，明确延后 `DotFieldBackground` 的鼠标交互。静态背景在首屏可见，却缺少公司 Web 的“指针附近变红 → 快速移动推开 → 弹性回位 → 点击冲击波”反馈，两个产品在同一场景下的手感不一致。

参考实现使用 canvas + GSAP InertiaPlugin。仓库没有动画库，依赖政策要求新依赖应净删除自有实现；点阵交互是新增能力，没有可删除的既有代码，因此本次用自写弹簧物理实现，`package.json` 不变。

## 决策

- **挂载**：`ConversationMainPanel` 在 `phase === 'hero'` 时把 `<DotField />` 渲染为 `.root` 的第一个直接子元素。canvas `position:absolute; inset:0; z-index:-1; pointer-events:none`；hero 阶段的 `.root` 增加 `isolation: isolate`，把负层限制在列内、画在列背景之上和所有内容之下。`active` / `settling` 不挂 canvas，也不改变原有层叠。
- **CSS fallback**：保留 hero 的 `radial-gradient` 点阵。canvas 只有在尺寸 > 0、拿到 2D context、成功解析颜色并画完第一帧后，才设置 `data-ready`；`ConversationRoot` 用 `:has(> [data-dot-field][data-ready])` 隐藏 CSS 点阵。context 或颜色不可用时 fallback 保持，两套点阵不会同时可见。
- **物理模型**：纯函数模块 `dot-field.ts`，canvas host 只负责像素与事件。推开分两段：临界阻尼 `ω=16, ζ=1` 追到目标（约 0.45s，`pushTimeout=0.7s` 兜底），再以 `ω=3.136, ζ=0.638` 回弹到 0；该 return 弹簧从静止偏移出发，首次过零 0.9375s、首次过冲约 7%，与 `elastic.out(1, 0.75)` 的关键点一致。半隐式欧拉、固定子步 `1/120s`、单帧上限 `0.05s`。
- **触发**：proximity 170px 内按指针速度插值到 `--dsw-brand-mark-end`；`speed > 10` 时推开，目标 = 静止向量 + `v * 0.005`，单次位移上限 256px；点击产生半径 50、强度 20、线性衰减的冲击波。`push` 阶段拒绝重复触发，`return` 阶段可重推。
- **帧调度**：按需 RAF。静止时不排帧；指针移动、点击、主题或尺寸变化触发一次绘制或动画循环，所有点回 idle 后停止。DPR 上限 2；指针 50ms 节流；resize 220ms 防抖；`mousemove`/`click` 监听 window 并丢弃 canvas 界外事件，`documentElement` 的 `mouseleave` 清除高亮。
- **主题**：用 `MutationObserver` 观察 `document.body` 的 `data-ds-dark-theme` 与 inline `style`（ThemePresenter 的公开 DOM 投影），通过离屏 probe 把 `--dsw-alias-border-l3` / `--dsw-brand-mark-end` 解析成具体通道。不为一个颜色信号新增 `theme` inject，避免波及所有 `runtime.mount` 测试。
- **减少动效**：挂载时读取一次 `prefers-reduced-motion: reduce`；为真时仍画一帧静态点阵，但不挂指针监听、不启动 RAF，resize 与主题变化仍同步重绘。
- **测试**：纯模型数值单测覆盖网格、采样、推开、冲击、弹簧时序与颜色解析；jsdom 组件测试覆盖 0×0、context 缺失、DPR 上限、resize 防抖、指针推开、点击、界外清除、主题重绘、reduced motion 与卸载清理；CSS 契约测试锁定 isolation、fallback 与命中属性；真实浏览器 e2e 断言 `data-ready`、`pointer-events:none`、`z-index:-1`、CSS fallback 已隐藏以及 composer 仍可被 `elementFromPoint` 命中。

## 备选方案

- 引入 gsap + InertiaPlugin：与参考实现逐行一致，但属于新增能力型依赖，不符合“净删除”条件，且把动画库带进所有 Web 客户端 bundle。
- 每个点一个 DOM 元素 + CSS transition：数百个节点参与布局与命中，成本高于单个 canvas。
- 持续 60fps RAF：实现更简单，但空会话页长时间空闲时也持续唤醒合成；按需调度在静止时为零帧。
- 把点阵交互放进 `HeroShell`：该组件位于 composer 栈内，不是全屏容器，点阵只能覆盖输入区，无法对齐公司 Web 的整页背景。
- 为颜色新增 `theme` 服务注入：`ui-conversation` 的 inject 会扩散到全部测试装配，而基础 token 仍要读 computed style，收益只有一次变更信号。

## 后果

- 空会话首屏与公司 Web 的视觉和手感对齐；进入会话后点阵与交互完全消失。
- canvas 不参与命中，composer、发送键、工作区选择器与现有 Playwright 点击不受影响。
- `isolation` 只存在于 hero；hero 内非 portal 的高 z-index `fixed` 浮层会被限制在列内。当前产品浮层（菜单、Tooltip、Modal、Toast）均 portal 到 body，没有触发该边界。
- 主题切换依赖 body DOM 投影；自定义主题若只改样式表、不经过 ThemePresenter，画布颜色不会自动跟随。
- 跨显示器 DPR 变化若没有触发 resize，不会立即重新计算 backing store。
- 运行中切换 reduced-motion 偏好只在下次挂载生效（当前只采样一次）。

## 验证

- `pnpm exec vitest run packages/client/ui-conversation/tests/dot-field.client.spec.ts packages/client/ui-conversation/tests/dot-field.component.client.spec.tsx packages/client/ui-conversation/tests/dot-field-styles.client.spec.ts packages/client/ui-conversation/tests/skeleton.client.spec.tsx`
- `pnpm run typecheck`、`pnpm run build:artifacts`。
- `pnpm exec vitest run --config vitest.web.config.ts apps/web/tests/startup-auto-selection.e2e.ts apps/web/tests/composer-focus.e2e.ts apps/web/tests/lifecycle-chrome.e2e.ts`：hero ARIA golden 不变，canvas 命中与 fallback 断言通过。
- 浏览器目视：指针靠近点变红、快速移动推开后回弹、点击冲击波、进入会话点阵消失、reduced motion 为静态帧。

## 未决

- embedded occurrence 是否需要同样的交互点阵。
- 触摸与手写笔是否只保留点击冲击波、还是也要拖动推开。
- 运行中切换 reduced-motion 偏好是否要即时响应。
- 跨显示器 DPR 变化在无 resize 事件时的重绘时机。