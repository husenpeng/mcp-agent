# TomatoRemote iOS 设计规则（rule.md）

本文件把苹果官方《Human Interface Guidelines》(HIG) 提炼成可逐条核对的设计规则，供本 App 的所有页面遵循。配套的执行流程见 [agent.md](agent.md)。

对话面与后台信息面的竞品/业界设计参考另见 [Design/ai-chat-design-references.md](Design/ai-chat-design-references.md)（OpenAI/Anthropic/Google/Apple/NN/g/Mobbin）与 [Design/dashboard-info-design-references.md](Design/dashboard-info-design-references.md)（Apple/NN/g/Carbon/Material/Pencil&Paper）。

- 规则来源全部为 `developer.apple.com` 官方页面，逐节标注链接；完整来源清单见文末。
- 标注 **【官方数值】** 的是苹果明确写出的数字；标注 **【惯例】** 的是社区常见解读，苹果未在对应页面给出该数字。
- 本 App 的既有约定与少数「有意偏离」见文末「项目适配」，偏离处不得被当成违规改回。

---

## 1. 布局与留白（Layout）
来源：[layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- 重要内容靠上、靠前置边缘；用系统组件让 RTL 语言自动翻转。
- 所有可交互元素与关键内容必须落在安全区内，不被灵动岛、状态栏、工具栏、标签栏遮挡。
- 全屏背景可延伸到工具栏/标签栏之下，但用滚动边缘效果（scroll edge effect）而非不透明色块来抬升控件。
- 以尺寸类别（compact/regular）驱动布局，不要按设备型号或横竖屏硬编码。
- 用留白、容器、分隔线分组相关项；用对齐与缩进表达层级。
- 渐进披露：用菜单、嵌套视图、可滚动分区，而不是一次摊开所有选项。
- 布局随动态字号生长：横向相邻元素在超大字号下改为纵向堆叠，行高可增高，不裁切文本。
- 【惯例】iPhone 常见侧边距 16pt；苹果该页未给出 iPhone 固定边距数值。

## 2. 字体与动态字号（Typography / Dynamic Type）
来源：[typography](https://developer.apple.com/design/human-interface-guidelines/typography)（Dynamic Type  guidance 已并入本页）
- 【官方数值】正文默认 17pt；iOS 文本不得小于 11pt。
- 用内建文本样式（`.body`/`.headline`/`.footnote`/`.caption`…）而非固定字号，自动支持动态字号与粗体文本。
- 字重用 Regular/Medium/Semibold/Bold；避免 Ultralight/Thin/Light，尤其小字号。
- 三行及以上文本不要用过紧行距。
- 用 `.bold()` 等符号特征强调，而非切换字体族；尽量少用字体族。
- SF Symbol 字重与相邻文本字重一致。
- 在全部动态字号（含 AX1–AX5 无障碍字号）下验证布局；可滚动区域的文本不要截断，除非另有视图呈现全文。
- 无障碍字号下把「图标+文本+时间」的横排改为堆叠（`isAccessibilityCategory`）。

## 3. 颜色与对比度（Color）
来源：[color](https://developer.apple.com/design/human-interface-guidelines/color)
- 不硬编码系统色 RGB；用语义色 API。自定义色必须提供浅色+深色（及增强对比度）变体。
- 语义色按用途使用：不要把 `separator` 当文本色、`secondaryLabel` 当背景色。
- 分组列表用 grouped 背景层级，普通视图用 base 背景。
- 文本用 label/secondary/tertiary 等前景层级色。
- 不要只靠颜色传达状态或可交互性；配文字、形状或图标。
- 强调色克制使用：只给主操作按钮上强调色，不要给多个工具栏控件都上色。
- 一种颜色固定一种含义；不要用「可点击」的颜色去渲染不可点击文本。

## 4. 深色模式（Dark Mode）
来源：[dark-mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- 不做 App 内明暗开关；跟随系统外观（含运行中的自动切换）。
- 【官方数值】两种外观下前景/背景对比度至少 4.5:1；自定义色尤其小字号争取 7:1。
- 用系统/自适应背景与 label 层级色，不用固定灰。
- 在「增强对比度」「降低透明度」开启（分别及同时）下测试深色模式。
- 用 SF Symbol（自动适配深色）并以动态色着色。

## 5. 无障碍（Accessibility）
来源：[accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- 【官方数值】点击目标默认 44×44pt；绝不低于 28×28pt 最小值。
- 【官方数值】带边框控件周围约 12pt 留白、无边框控件可见边缘约 24pt 留白，防误触。
- 【官方数值】对比度：≤17pt 文本需 4.5:1；18pt 或任意粗体文本需 3:1。
- 支持至少 200% 文本放大；自定义字体默认 ≥17pt、最小 ≥11pt。
- 每个有意义的元素给 VoiceOver 描述；用 Accessibility Inspector 审查。
- 每个手势操作都要有按钮/语音/键盘等替代（如滑动删除旁另有删除按钮）。
- 不要自动消失的定时 UI；用明确的用户操作关闭视图。
- 「减弱动态效果」开启时：用淡入淡出替代位移/缩放转场，避免重复动画。
- 不只靠颜色传义（红绿、蓝橙对色盲不友好）；加形状/图标。

## 6. 图标（SF Symbols）
来源：[sf-symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
- 优先 SF Symbol 而非手绘图标；与 San Francisco 文本对齐、随动态字号缩放。
- 符号字重与相邻文本一致；用 `imageScale` 调整强调。
- 选中态用 fill 变体，工具栏/列表用 outline；系统容器自动选择时交给系统。
- 明确渲染模式（单色/层级/调色板/多色）并以系统色着色。
- 小尺寸用带圈/带框变体提升可读性。
- 动画克制，仅用于传达状态/反馈；自定义符号给无障碍标签。

## 7. 材质与玻璃（Materials）
来源：[materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Liquid Glass 只用于功能层（工具栏/标签栏/导航），不用于内容层背景。
- 文本多的组件用 `regular` 玻璃；`clear` 仅用于富媒体背景之上。
- 内容层叠加用标准材质（ultraThin/thin/regular/thick）；材质上用 vibrant 前景色，不用普通灰。
- 按语义目的选材质，而非它恰好呈现的颜色。

## 8. 导航与工具栏（Navigation / Toolbars）
来源：[toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)（navigation-bars 指引已并入本页）
- 返回用标准 Back 符号，不写「Back」文字；模态用标准 Close 符号。
- 标题按内容/目的命名，不用 App 名；【官方数值】标题尽量 <15 字符。
- 导航控件在 leading，重要动作在 trailing；【官方数值】最多 3 个控件分组。
- 只把最重要动作放进 iPhone 工具栏，其余收进 More 菜单。
- 恰好一个主操作用 `.prominent` 样式并置于 trailing。
- 优先无边框 SF Symbol；文字按钮与符号按钮分组隔开。
- 少用自定义工具栏背景/着色；用滚动边缘效果分隔内容。

## 9. 标签栏（Tab bars）
来源：[tab-bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars/)
- 标签只用于顶层分区导航，不用于当前视图的动作。
- 切换分区时保持标签栏可见；仅模态可覆盖它。
- 标签数量少到 iPhone 不出现 overflow「More」；避免溢出标签。
- 内容不可用时不要禁用/隐藏标签；显示空分区并说明原因。
- 每个标签单词标签 + SF Symbol，优先 fill 符号。
- 红色徽章只留给关键新信息，不用于常规计数。

## 10. 列表与集合（Lists / Collections）
来源：[lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)、[collections](https://developer.apple.com/design/human-interface-guidelines/collections)
- 文本内容用列表；尺寸差异大/图片为主用集合。
- 设置式分组数据用 grouped 列表（头/尾/组间距）；SwiftUI `.insetGrouped` 是常见实现【惯例】。
- 行文本简洁避免截断；只显示标题，长内容进详情视图。
- 必须截断时考虑中间省略号，保留首尾。
- 层级下钻用 chevron 披露指示符；info 按钮只用于揭示该行细节，不用于导航。
- 不要同时用尾部字母索引和尾部行控件（点击冲突）。
- 增删/重排用标准动画；不要在用户浏览时动态改布局（除非响应用户操作）。
- 【惯例】常被引用的 44pt 最小行高来自 layout/accessibility，而非本页数值。

## 11. 滚动（Scroll views）
来源：[scroll-views](https://developer.apple.com/design/human-interface-guidelines/scroll-views)
- 支持系统滚动手势与回弹；不做破坏它们的自定义滚动。
- 让可滚动性可见：边缘露出部分内容示意还有更多。
- 不要同向嵌套滚动视图；横向套纵向（或反之）可以。
- 自动滚动只滚到把新选中/插入点带入视野即可，保留上下文。
- 缩放设合理 min/max。
- 滚动边缘效果只用在滚动视图位于浮动栏之后的场景，一个视图一个效果。

## 12. 搜索（Search fields）
来源：[search-fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)
- 三种 iOS 放置位置按需选择：标签栏搜索标签、工具栏按钮/字段、内联字段。
- 视图内过滤把内联搜索字段置于被过滤列表正上方。
- 边输入边搜索、持续细化结果；输入前显示最近搜索。
- 结果按相关度排序；用占位文本说明搜索范围（`searchable(text:placement:prompt:)`）。

## 13. 按钮（Buttons）
来源：[buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- 【官方数值】每个按钮点击区域至少 44×44pt。
- 【官方数值】每视图突出（强调填充）按钮保持 1–2 个；最可能的动作用突出样式。
- 同等选项用样式而非大小区分首选；选项按钮尺寸一致。
- 自定义按钮必须有可见按压态。
- 主角色只给最可能的非破坏性动作；破坏性按钮绝不给主角色。
- 破坏性动作用 destructive 角色（系统红）；主角色用 App 强调色。
- 标签用动词开头的简短词组；熟悉动作用熟悉 SF Symbol。
- 点击后不能立即完成的动作，在按钮内显示活动指示器（可换标签）。

## 14. 文本输入（Text fields）
来源：[text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- 小而具体的输入用 text field，大段文本用 text view。
- 占位文本说明用途，另给持久标签（占位符输入后消失）。
- 敏感数据（密码）一律 `SecureField`。
- 字段宽度匹配预期文本；多字段纵向堆叠、宽度一致、间距均匀。
- 键盘类型匹配内容；尾部给 Clear 按钮一键清空。
- 在正确时机校验（邮箱离开字段时、用户名/密码离开前）。

## 15. 模态与 Sheets（Modality / Sheets）
来源：[modality](https://developer.apple.com/design/human-interface-guidelines/modality)、[sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- 只在有明确收益时模态：关键信息、确认动作、窄范围任务。
- 模态任务简单短小，不做「App 中的 App」导航层级。
- 始终给明显关闭方式：iPhone 顶部工具栏按钮和/或下滑。
- 模态视图按任务命名；关闭可能丢失内容时拦截并给出处置（保存/放弃）。
- 一次只呈现一个 sheet/一个 alert；先关旧的再开新的。
- 【官方数值】系统 detent：large=全高，medium≈半高；可拉伸 sheet 带 grabber。
- 支持下滑关闭；有未保存更改时先用 action sheet 确认。
- iPhone sheet 顶栏 Cancel 在 leading、Done 在 trailing；Done 必配 Cancel/Back。

## 16. 警告与操作表（Alerts / Action sheets）
来源：[alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)、[action-sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets)
- alert 只用于关键且可操作的信息；纯告知用内联指示。
- 常见且可撤销的破坏性动作不必 alert；罕见且不可撤销的才 alert。
- 不在启动时弹 alert；启动问题用缓存/占位内容 + 非侵入标签。
- 【官方数值】alert 最多 3 个按钮；标题不超过 2 行、不滚动。
- 按钮用具体动词（Delete/Erase）；取消按钮恒为「Cancel」且不作默认。
- 用户主动发起的动作有多个相关选项时用 action sheet（`confirmationDialog`），不用 alert。
- action sheet 破坏性按钮用 destructive 并置顶；Cancel 置底；按钮少、不滚动。

## 17. 加载与进度（Loading / Progress）
来源：[loading](https://developer.apple.com/design/human-interface-guidelines/loading)、[progress-indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)
- 立即呈现占位/骨架，真实内容到达即替换；加载时绝不白屏。
- 内容后台加载时允许使用 App 其他部分。
- 超过「片刻」的加载显示进度指示：时长已知用确定性，未知用非确定性。
- 进度准确、匀速推进；指示器保持动，停住要说明问题与补救。
- 时长可知即从非确定切确定；不要中途在 spinner 与进度条间切换。
- 给简洁具体的描述，不用「加载中」这类含糊标签；进度位置全 App 一致。
- 可安全中止时给 Cancel；指示器只在操作期间可见，完成即移除。
- 下拉刷新之外仍做自动周期更新。

## 18. 触感反馈（Haptics）
来源：[playing-haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- 只用系统触感且语义正确：notification（成功/警告/错误）用于任务结果，impact 用于碰撞/吸附，selection 用于改值。
- 在结果发生那一刻触发 notification 触感；全 App 建立一致因果映射。
- 触感强度与伴随动画匹配；App 内偏好短触感、绑定离散事件。
- 不过度使用；触感可选、可关闭，关闭后 App 仍完全可用。
- 标准开关/滑杆/选择器用内建触感，不重复造。

## 19. 手势（Gestures）
来源：[gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
- 保持标准手势语义：tap=激活、swipe=揭示动作/关闭/滚动、drag=移动、长按=上下文、双击/捏合=缩放。
- 重要动作绝不只靠手势；给按钮/语音/键盘/Switch Control 替代。
- 手势中给即时、可预测的反馈；手势不可用时可见地表明。
- 自定义手势只用于高频专门任务，且可发现、简单、独特。
- 不冲突/不挪用系统手势（边缘滑动、三指撤销/拷贝、摇动撤销）。

## 20. 启动与引导（Launching / Onboarding）
来源：[launching](https://developer.apple.com/design/human-interface-guidelines/launching)、[onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- 启动要快；launch screen 与首屏几乎一致（同布局/方向/外观），避免闪变。
- launch screen 无文本、无品牌 logo（除非是首屏固定部分）；不是 splash。
- 重启恢复先前状态（含滚动位置与视图状态）。
- 引导快、有趣、可选，发生在启动之后；用交互教学而非读说明。
- 优先上下文提示（TipKit）而非一次性大流程；跳过的教程不再自动弹。
- 提供合理默认、推迟非必要设置；权限在上下文中请求。

---

## 项目适配（本 App 的约定与有意偏离）

这些是 TomatoRemote 的既定做法，审查时视为「符合」，不要按通用 HIG 改回：

- **语义色层**：颜色统一走 `TomatoToken`（镜像 Web 客户端 `--dsw-alias-*`，见 `Design/Tokens.swift`，由脚本生成，勿手改）；圆角走 `TomatoRadius`。这相当于本 App 的语义色系统，满足「语义色 + 浅/深变体」要求。
- **无页面标题（有意偏离）**：按业主要求，各页不展示左上角标题文案（`navigationTitle("")`）。HIG 建议顶层用大标题，但此处业主偏好优先；**不要重新加回标题**。分区用 section header 自解释。
- **浮动标签球（有意偏离）**：导航用 `Design/FloatingTabBar.swift` 的浮动球而非系统标签栏；系统 tabBar 被隐藏。内容延伸到其下并用 `contentMargins`/`safeAreaInset` 留出 clearance。
- **共享组件**：卡片 `TomatoCard`、按压态 `TomatoPressableStyle`、sheet `tomatoSheet()`/`SheetHeader`、确认 `tomatoConfirm`、空态 `EmptyPlaceholder`、骨架 `ChatSkeleton`、错误 `ErrorBanner`。新页面优先复用，不自造颜色/圆角。
- **点击目标**：视觉控件可小于 44pt，但必须用 `.contentShape(...inset(by:))` 或外层 `.frame(minHeight:44)` 把命中区扩到 ≥44pt（现有 Mermaid/composer 控件即此做法）。
- **触感**：发送用 rigid impact、完成用 success notification（见 `ChatView`/`ComposerView`）；新增结果反馈沿用该映射。

## 完整来源清单（官方 developer.apple.com）
1. https://developer.apple.com/design/human-interface-guidelines/layout
2. https://developer.apple.com/design/human-interface-guidelines/typography
3. https://developer.apple.com/design/human-interface-guidelines/color
4. https://developer.apple.com/design/human-interface-guidelines/dark-mode
5. https://developer.apple.com/design/human-interface-guidelines/accessibility
6. https://developer.apple.com/design/human-interface-guidelines/sf-symbols
7. https://developer.apple.com/design/human-interface-guidelines/materials
8. https://developer.apple.com/design/human-interface-guidelines/toolbars
9. https://developer.apple.com/design/human-interface-guidelines/navigation-bars （现并入 toolbars）
10. https://developer.apple.com/design/human-interface-guidelines/tab-bars/
11. https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
12. https://developer.apple.com/design/human-interface-guidelines/collections
13. https://developer.apple.com/design/human-interface-guidelines/scroll-views
14. https://developer.apple.com/design/human-interface-guidelines/search-fields
15. https://developer.apple.com/design/human-interface-guidelines/sidebars
16. https://developer.apple.com/design/human-interface-guidelines/split-views
17. https://developer.apple.com/design/human-interface-guidelines/buttons
18. https://developer.apple.com/design/human-interface-guidelines/text-fields
19. https://developer.apple.com/design/human-interface-guidelines/sheets
20. https://developer.apple.com/design/human-interface-guidelines/alerts
21. https://developer.apple.com/design/human-interface-guidelines/action-sheets
22. https://developer.apple.com/design/human-interface-guidelines/loading
23. https://developer.apple.com/design/human-interface-guidelines/progress-indicators
24. https://developer.apple.com/design/human-interface-guidelines/playing-haptics
25. https://developer.apple.com/design/human-interface-guidelines/modality
26. https://developer.apple.com/design/human-interface-guidelines/onboarding
27. https://developer.apple.com/design/human-interface-guidelines/launching
28. https://developer.apple.com/design/human-interface-guidelines/gestures

> 注：`dynamic-type` 与 `lists-and-collections` 两个 slug 已 404，前者并入 typography，后者由 lists-and-tables + collections 承接；`haptics` 官方 slug 为 `playing-haptics`。