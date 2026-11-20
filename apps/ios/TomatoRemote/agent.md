# TomatoRemote iOS UI 执行指南（agent.md）

面向改动本 App 界面的 AI agent / 开发者。目标：让每次 UI 改动都符合 [rule.md](rule.md)（苹果官方 HIG 提炼），并沿用本 App 的既有设计语言。改动前先读本文件与 rule.md。

## 0. 工作区与构建
- 源码根：`apps/ios/TomatoRemote/`（本目录）。工程文件在上一级 `apps/ios/TomatoRemote.xcodeproj`，由 `apps/ios/project.yml`（XcodeGen）生成。
- 新增源文件放进现有目录即可被 XcodeGen 收录；**不要**把调试残留（截图、mock 脚本、`.derived`）留在会被打包的位置。构建产物放 `.derived/`（已在 project.yml 排除）。
- 构建验证（模拟器，免签名）：
  ```sh
  xcodebuild -project ../TomatoRemote.xcodeproj -scheme TomatoRemote \
    -destination 'platform=iOS Simulator,name=iPhone 17' \
    -derivedDataPath .derived build
  ```
- 视觉自查：`xcrun simctl install booted <app>` + `xcrun simctl launch booted ai.tomato.remote -TOMATO_NO_LOCK -TOMATO_PREVIEW_PAIRING <mockURL> -TOMATO_OPEN_URL tomato://memory`，再 `xcrun simctl io booted screenshot`。Mock Host 可参考 `.derived/mock-host.mjs`（会话/记忆/今日等端点）。
- 行为变更要同步改对应 UI 测试（`../TomatoRemoteUITests/`）；测试锚点优先用稳定的 `accessibilityIdentifier`，不要依赖导航标题文本（本 App 无页面标题）。

## 1. 改动流程
1. **读规则**：先读 rule.md 相关小节，明确本次改动涉及哪些规则。
2. **审计**：对照规则找出当前页面的具体违规点（点击目标、对比度、字号、无障碍、模态、反馈等），列出清单。
3. **最小改动**：只做规则驱动、可核对的 targeted 修改；优先复用共享组件，不引入新颜色/圆角/字体。
4. **构建**：跑上面的 xcodebuild，确保 `BUILD SUCCEEDED`。
5. **视觉/测试验证**：能截图就截图核对；改了行为就更新并说明测试。
6. **自查**：按第 4 节清单过一遍，再报告完成。

## 2. 本 App 设计语言（必须沿用）
- **模块切分**（tokens → primitives → patterns → screens，依赖严格向下）：`Design/Tokens.swift`（生成的基础色阶）→ `Design/Surfaces.swift`（西红柿主题层）→ `Design/Primitives.swift`（原子）→ `Design/Patterns.swift`（组合图案）→ 各 screen。新增原子放 Primitives、组合放 Patterns，**不要**再堆回一个大杂烩；原始颜色/圆角/阴影值只进 Tokens/Surfaces。参考见 [Design/oss-component-design-references.md](Design/oss-component-design-references.md)。
- **西红柿主题（务必优先用这层）**：`Design/Surfaces.swift` 从 `client-monorepo` 的 `packages/ui/src/styles` 移植，补上生成 token 缺失的部分——`TomatoLine`（实线暖灰 hairline/strong/brandSoft，替代黑 alpha 线）、`TomatoSurface`（page/card/variant/subtle 暖白与暖灰）、`TomatoContainer`（状态容器/前景成对色，保证对比）、`TomatoCorner`（8/16/24/32 圆角，产品尺度）、`TomatoShadow`（暖石板色 flat/raised/floating）、`TomatoBrand`（soft/softBorder/solid）。
  - 新写组件时：**线用 `TomatoLine`、面用 `TomatoSurface`、状态色用 `TomatoContainer`、圆角用 `TomatoCorner`、阴影用 `TomatoShadow`**；不要再用 `TomatoToken.borderL*`（黑 alpha）或硬编码 `TomatoRadius` 画卡片。
- **颜色**：一律 `TomatoToken.*`（脚本生成，勿手改）。文本层级：`labelPrimary`（主）、`labelSecondary`/`labelCaption`（次级/说明）、`labelDimmed`（仅装饰，如 chevron/分隔点）。
  - ⚠️ **承载信息的文本（计数、时间、副标题、范围标签）不要用 `labelDimmed`**——它在浅色下对比度远低于 4.5:1。用 `labelCaption` 或更深。`labelDimmed` 只留给纯装饰元素。
- **圆角**：`TomatoRadius.*`（xs4/sm8/md14/lg16/panel24/xl24）。
- **卡片/高级质感**：堆叠卡片用 `TomatoCard`（flat：bgLayer1 + borderL2 细线）；独立/重点卡片用 `TomatoCard(elevated: true)` 或 `.tomatoDepth()`（hairline + 接触/环境双层阴影 + 顶部微 sheen）。每屏唯一 hero 用 `TomatoHero`（品牌色渐变 wash）。列表行前置图标用 `IconChip`（tinted 圆角方块）。**阴影保持半透明、边框只画一次、不叠两层 material。**
- **状态徽章**：`StatusPill`/`SessionStateBadge` 已带状态图标（图标+文字+色，绝不仅靠色）；可传 `symbol:` 覆盖。
- **按压态**：自定义按钮用 `TomatoPressableStyle()`（spring），保证可见按压反馈。
- **加载**：骨架 `SkeletonBlock`/`ChatSkeleton` 自带 `tomatoShimmer()`；shimmer 只用于会被真实内容替换的瞬态骨架。
- **点击目标**：视觉控件可小于 44pt，但命中区必须 ≥44pt——用 `.contentShape(Circle().inset(by: -n))` 或 `.frame(minHeight: 44)` + `.contentShape(Rectangle())`。参考 `MermaidView`/`ComposerView` 的既有做法。
- **sheet**：`tomatoSheet()` / `tomatoFullSheet()` + `SheetHeader(title:onClose:)`；确认用 `tomatoConfirm`；破坏性操作用 `confirmationDialog` 且带取消。
- **空态/加载/错误**：`EmptyPlaceholder`、`ChatSkeleton`/`SkeletonBlock`、`ErrorBanner`/`NoticeBar`。加载绝不白屏。
- **图标**：SF Symbol，字重与相邻文本一致；选中用 fill、列表/工具栏用 outline。
- **触感**：发送=rigid impact，任务完成=success notification，失败=error notification，待处理=warning。新增结果反馈沿用此映射，别滥加。

## 3. 有意偏离 HIG（不要改回）
- **无页面标题**：各页 `navigationTitle("")`，业主明确要求去掉左上角标题文案。分区用 section header 自解释。**不要重新加标题。**
- **浮动标签球**：导航用 `FloatingTabBar` 浮动球，系统 tabBar 隐藏；内容用 `contentMargins`/`safeAreaInset` 留 clearance。不要换成系统标签栏。
- **记忆页**：列表为干净卡片（内容两行 + 范围标签 + chevron），确认/删除在详情页 + 滑动快捷操作；技术标识 `entity/key` 只在详情页出现。保持此结构。

## 4. 完成前自查清单
- [ ] 所有可点元素命中区 ≥44pt（小视觉控件已用 contentShape/frame 扩展）。
- [ ] 承载信息的文本对比度达标（不用 labelDimmed 渲染计数/时间/副标题）。
- [ ] 文本用内建文本样式，支持动态字号；无 <11pt 文本；超大字号不裁切关键内容。
- [ ] 颜色全走 TomatoToken，浅/深外观都正常；不只靠颜色传义。
- [ ] 每视图突出按钮 ≤2；破坏性动作非主角色、有确认与取消。
- [ ] 模态一次一个、有明显关闭；sheet 有 grabber/下滑关闭。
- [ ] 加载有骨架/占位，长任务有进度；空态有说明。
- [ ] 手势操作有按钮替代；VoiceOver 标签齐全，section header 加 `.accessibilityAddTraits(.isHeader)`。
- [ ] 触感按语义映射、克制；「减弱动态效果」下不播放位移/缩放动画。
- [ ] 未重新引入页面标题；未把浮动球换成系统标签栏。
- [ ] xcodebuild `BUILD SUCCEEDED`；行为变更已同步 UI 测试。

## 5. 常见违规 → 修复对照
| 违规 | 修复 |
|---|---|
| 按钮 `.frame(minHeight: 36)` | 提到 44，或 `.contentShape` 外扩 |
| 34pt 圆形关闭/发送按钮无外扩 | `.contentShape(Circle().inset(by: -5))` |
| 计数/时间用 `labelDimmed` | 改 `labelCaption` |
| section header 无无障碍头 trait | 加 `.accessibilityAddTraits(.isHeader)` |
| 确认/删除成功无反馈 | 结果刻触发 `UINotificationFeedbackGenerator().notificationOccurred(.success)` |
| 自造颜色/圆角 | 换 `TomatoToken`/`TomatoRadius`/`TomatoCard` |
| 用导航标题做测试锚点 | 改用稳定 `accessibilityIdentifier` |