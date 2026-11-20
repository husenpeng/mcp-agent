# 开源组件设计与模块切分参考

为「高级质感」升级收集的开源设计系统 / SwiftUI 组件库参考，以及 Design 层的模块切分依据。配套 [../rule.md](../rule.md)、[../agent.md](../agent.md)、[ai-chat-design-references.md](ai-chat-design-references.md)、[dashboard-info-design-references.md](dashboard-info-design-references.md)。

## 来源与可落地要点

### shadcn/ui（Card / Badge / Button / Skeleton / Theming）
https://ui.shadcn.com/docs/components/card · /badge · /button · https://ui.shadcn.com/docs/theming
- 卡片配方：`rounded-xl border bg-card shadow-sm`——一个圆角 token、1px 语义边框、**最弱一档阴影**；高级=克制，边框做主要分隔，阴影若有若无。
- 间距单一变量（16/20/24/32）；组合优于配置（Card/Header/Title/Description/Action 分离）。
- 徽章解剖：capsule、图标 12pt + 4pt 间隙 + 12pt medium 标签、H8/V2 内边距；图标/内联 spinner 一等公民；语义色对（bg-primary/text-primary-foreground）。
- 按钮：交互态=同一 token 的透明度阶梯；disabled=opacity-50；按压 spring（iOS 转译）。
- 主题：语义「表面/前景」成对 token；暗色=同 token 换值，组件不分支 colorScheme；圆角单一 base 派生。

### Radix UI Themes（Theme / Spacing / Shadows）
https://www.radix-ui.com/themes/docs/theme/overview · /spacing · /shadows
- 整 App 外观≈5 个旋钮（accent/gray/panel/density/radius）；**单强调色 +  monochrome 底**是系统级决策。
- 组件三档 classic/solid/soft 表达重要性；90% 用 soft（tint-alpha），solid 强调留给每屏唯一主操作。
- 间距刻度 4/8/12/16/24/32/40/48/64。
- **阴影 6 档**：卡片=2、浮层=4–5、对话=6；每档=1px 零模糊 hairline 环 + 接触阴影 + 环境阴影（负 spread 防光晕）；暗色重写阴影而不仅是颜色；inset 档含底部内高光。

### Vercel Geist（Color / Typography / Materials）
https://vercel.com/geist/introduction · /colors · /typography · /materials
- 12 档色阶固定角色：1–3 组件背景（徽章用 2–3）、4–6 边框、7–8 高对比填充、9–10 文本/图标。→ IconChip：tint 低档填充 + 高档字形。
- 灰 vs 透明灰：文本/图标/填充/边框用实灰，阴影/叠加才用透明灰；**边框只画一次**；**阴影保持半透明**（不透明阴影留灰晕）。
- 角色化字体（heading/button/label/copy）；数字用 tabular；三级文本用 label12 + 大写 + tracking。
- Material=按角色捆绑 radius+fill+stroke+shadow 的 elevation 预设；不叠加两层 material；选最低够用的档。

### Linear — How we redesigned the Linear UI
https://linear.app/blog/how-we-redesigned-the-linear-ui
- 用 LCH 从 base/accent/contrast 三输入生成主题；限制 chrome 彩色，文本/中性图标在浅色更深、深色更浅（治「寡淡」）。
- 标题用 Display 面（iOS 用字重/tracking 对比表达）；**对齐是隐形的高级**——图标 chip/标题/pill/chevron 跨行共享前置边与垂直中心。

### Pow / SwiftUI-Shimmer / SPIndicator（SwiftUI 效果库）
https://github.com/movingparts-io/Pow · https://github.com/markiv/SwiftUI-Shimmer · https://github.com/ivanvorobei/SPIndicator
- Pow：`.changeEffect(.shine/.shake/.jump, value:)` 值驱动效果；`.ping` 直播脉冲环；触感与视觉成对。
- Shimmer：骨架=真实布局 `.redacted(.placeholder)` + shimmer；周期 1.5s、band 0.2；单一 `.shimmering()` 修饰任意视图。
- SPIndicator：系统级瞬态反馈（done/error + 配对触感），binding 驱动、全局 appearance 配置。

## Design 层模块切分（tokens → primitives → patterns → screens）
开源共同律：**原始值只在 tokens 层**；组件 one-per-file、variant 枚举驱动、只读 token；组合图案单独一层；主题注入一次、组件不分支 colorScheme；预览画廊即测试。

本 App 落地（本轮）：
```
Design/
├── Tokens.swift        生成的语义色/圆角（唯一原始值，勿手改）
├── Primitives.swift    原子：TomatoCard(elevated)/TomatoHero/IconChip/tomatoDepth/
│                       TomatoPressableStyle(spring)/按钮/InfoRow/SectionHeader/
│                       RunningDot/StatusPill(带图标)/SessionStateBadge(带图标)/
│                       SkeletonBlock/tomatoShimmer
├── Patterns.swift      组合：ErrorBanner/NoticeBar/EmptyPlaceholder/ConversationWelcome/
│                       GoalRoundsProgress/PageHeader/PageCaption/ChatSkeleton/relativeTime
├── Glass.swift         导航层材质桥（iOS26 Liquid Glass / 旧版 thin material）
├── SheetChrome.swift   sheet 统一外观
├── FloatingTabBar.swift 浮动标签球
└── ConfirmCard.swift / WindowSafeArea.swift
```
依赖方向严格向下：screens → patterns → primitives → tokens。

## 西红柿主题移植（client-monorepo）

`packages/ui/src/styles/{colors,tokens,theme}.css` 是本产品的真实设计语言，与 harness 生成的 `Tokens.swift` 有两点差异，已由 `Design/Surfaces.swift` 补齐：

| 维度 | 生成 token（darwin 平台） | client-monorepo（西红柿） | iOS 采用 |
|---|---|---|---|
| 线条 | 黑 alpha 4–16% | 实线暖灰 `#E1E3E5` / `#C5C7C9` | `TomatoLine.hairline/strong` |
| 品牌软底 | 无 | `primary-soft 8%` + 边框 28% | `TomatoBrand.soft/softBorder` |
| 状态色 | 单色 tint + opacity | container / on-container 成对 | `TomatoContainer.*` |
| 圆角 | 8/14/16/24/32 | 8/16/24/32 | `TomatoCorner.chip/control/card/hero` |
| 阴影 | 黑 alpha | 暖石板 `rgba(17,24,39,.04/.10)` | `TomatoShadow.flat/raised/floating` |
| 面色 | 冷白/冷灰 | `#F9FAFB`/`#FFFFFF`/`#F3F4F6` | `TomatoSurface.page/card/variant` |

暗色版按同一感知逻辑推导（client-monorepo 只发布浅色主题）：线用白 alpha 10–16%，container 用状态色 16% alpha + 状态色文字。

## 本轮已落地的高级化
- 卡片 depth：hairline + 接触/环境双层阴影 + 顶部微 sheen（`elevated`/`tomatoDepth`）。
- `TomatoHero` 渐变 hero（首页今日回顾）；`IconChip`  tinted 圆角方块图标（会话/机器人/群聊/记忆行）。
- `StatusPill`/`SessionStateBadge` 加状态图标（图标+文字+色，绝不仅靠色）。
- 按压改 spring；骨架加 shimmer；分区标签加 tracking。
- 未引入新 SPM 依赖（shimmer/spring/hero 均自绘，基于既有 TomatoToken）。