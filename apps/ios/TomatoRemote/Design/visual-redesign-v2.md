# TomatoRemote 视觉重构 v2

日期：2026-11-20
状态：代码已落地，构建、单测、UI 回归与截图验证完成。
上一版：`product-experience-redesign.md`（功能动线仍有效，视觉层被本轮替换）。

## 1. 本轮要解决的问题

产品负责人对第一版视觉给出明确否定，并给出统一标准与参考：

1. 首页「个人记忆」白卡和「进行中」粉卡不统一，**以「进行中」组件为标准**。
2. 页面存在不必要留白，需要压缩。
3. 记忆待确认的黄色卡、目标卡蓝色「进行中」胶囊色调不适配。
4. 以千问 App 参考截图为参照，基于 Tomato 主题色重新设计，不要被现有样式束缚。

参考图提供的不是配色，而是密度和层级：白底、浅灰 hairline、裸线性图标、分组小标题、紧凑行高、列表行不套厚卡、品牌色只出现在关键动作上。

## 2. 新视觉原则

- **安静底色**：页面接近暖白 `#FAFAF8`，内容卡纯白，分隔线 `#E8E6E3`。深色模式沿用原有暗色阶梯。
- **品牌色只做强调**：Tomato 红用于可点击入口、运行态、主按钮和选中态；普通内容不再铺红底或渐变。
- **一种入口卡**：所有“进入某个功能/状态”的入口共用 `TomatoActionEntry`，解剖来自用户指定的「进行中」卡。
- **状态色收敛**：运行/活跃 = 品牌红；完成 = 绿；失败/熔断 = 红；空闲 = 中性灰。蓝色只保留给纯信息提示，不再表示运行。黄色不再做大面积卡片。
- **更紧的行**：卡片圆角从 20 收到 16，hero 从 28 收到 20；列表 section spacing、行 insets、卡内 padding 全面下调。
- **设置类页面回归裸行**：图标不再套色块，分组之间用 hairline，而不是每行一张卡。

## 3. 标准入口卡 `TomatoActionEntry`

位置：`Design/Primitives.swift`。

解剖：

- HStack spacing 12。
- `IconChip` 36pt，圆角约 10pt，软色底，无额外描边。
- 标题 `.subheadline.semibold`，单行。
- 副标题 `.caption`，单行，可省略。
- 右侧可选计数 badge + `chevron.right`。
- padding H14 / V12。
- 背景 `TomatoBrand.soft`，圆角 `TomatoCorner.card`，边框 `TomatoLine.brandSoft` 1pt。

使用点：

- 首页「个人记忆」。
- 首页「Agent 在等你」。
- 会话列表「进行中」入口。

这三处现在共享同一组件，不再各自手写卡片。

## 4. 关键页面改动

### 首页

- 每日摘要 hero 去掉红色渐变和品牌描边，改为白卡 + hairline，padding 16。
- 「个人记忆」「Agent 在等你」改用标准入口卡。
- 目标卡状态从蓝色 `.info` 改为品牌 `.active`；卡内 padding 16→14，间距 12→8。
- 进行中任务的小圆点从蓝色改为品牌红。
- section spacing 10→6，普通行 insets 上下 2→1，hero 底部留白 10→4。

### 会话列表

- 「进行中」入口改用标准入口卡，并和全页左右 20pt 对齐。
- 最近完成行改为参考抽屉式的_plain history_：裸气泡图标、标题、一行预览、时间，无外卡。
- 项目内会话行改为紧凑白卡；运行中仍用品牌软底 + 品牌描边。
- 文件夹行、最近完成标题、会话行的左右 insets 统一为 20pt，上下留白压缩。

### 进行中页

- 行卡圆角统一到 `TomatoCorner.card`，运行中品牌软底 + 描边，刚完成回到中性底。
- 标题、预览、时间字号下调，padding H12 / V10。
- 页面背景从旧 token 切到 `TomatoSurface.page`。

### 记忆页

- 待确认卡从黄色 `warning.fill` 改为品牌软底 + 品牌描边，图标改红。
- 生效中保持白卡 + hairline。
- 行内 padding 14→H12/V10，文本间距 6→4。
- section spacing 10→8，普通行 insets 上下 2→1，观察卡 padding 14→12。

### 智能体 / 群聊

- 行标题统一 `.subheadline.semibold`，描述 `.footnote`，padding H12 / V10。
- 运行中智能体使用 `.active` 品牌红；准备中也不再使用蓝色。
- 熔断群聊从黄色警告底改为错误红软底。
- 机器人运行态 `runStateTone` 中 running/queued/waiting/finalizing 统一 `.active`。

### 账号页

- 「个人与设备」从外包卡改为裸线性图标 + hairline 分组行，贴近参考设置页。
- profile / host 卡 padding 18→14，内部间距压缩。
- 页面主 VStack spacing 18→14。
- 未启用状态不再使用黄色 warn pill。

### 会话详情

- 运行中 pill 从 `.warn` 改为 `.active`。
- 目标 sheet 的状态同步改为 `.active`，卡片 padding 和间距压缩。

## 5. 组件层改动

- `TomatoCorner.card` 20→16，`hero` 28→20。
- `TomatoSurface.page/subtle/variant/hairline` 调为更暖、更安静的浅色。
- `IconChip` 默认 36pt，去掉描边，软底透明度 0.12→0.10。
- `StatusPill` 新增 `.active`，去掉胶囊描边，padding 收紧；`.info` 默认图标改为 info.circle，不再用 play.circle 表示运行。
- `SessionStateBadge` 去掉描边。
- `TomatoHero` 去渐变、去品牌描边、去阴影。

## 6. 保持不变的约束

- 不恢复左上角页面大标题。
- 保留右下角浮动标签球。
- 保留既有 accessibilityIdentifier 和功能路径。
- 支持深色模式。
- 不改动业务逻辑、网络层和配对流程。

## 7. 验证结论

- 构建：`xcodebuild build`（iPhone 17 模拟器，iOS 27）成功，日志 `.derived/build-v2-fix.log`、`.derived/build-v2-chat.log`。
- 单元测试：132 项全部通过，`TEST SUCCEEDED`，日志 `.derived/unit-tests-v2.log`。
- UI 回归：第一轮锁定的 16 项选择器组合在修正前后各跑一次，均 0 failures（`.derived/ui-tests-v2.log`、`.derived/ui-tests-v2-fix.log`）。对话留白修正后补跑 `ChatRowsTests` 全类 7 项、`ComposerLayoutTests`、`SessionOpenTests`，均通过（`.derived/ui-tests-v2-chatrows.log`、`.derived/ui-tests-v2-chat.log`）。
- 截图：`.derived/redesign-v2-shots/` 共 8 张，浅色首页 / 会话列表 / 记忆页 / 账号页 / 智能体 / 群聊 / 对话详情 / 深色首页，已逐张人工查看。
- 入口卡一致性：首页「个人记忆」、首页待处理、会话列表「进行中」三处共享 `TomatoActionEntry`，截图确认外观统一、单 chevron。
- 色调：记忆待确认改品牌软底红图标，目标卡「进行中」改品牌红胶囊，深色下层次正常。
- 留白：首页 / 记忆 / 会话 / 账号行高与 section 间距压缩后截图确认更紧凑；对话页短会话不再底部留白。

## 8. 本轮补充修正

- **双 chevron**：首页记忆入口与账号设置入口原先在 `NavigationLink` 内再画 chevron，和系统自带箭头重叠。改为 `Button` + 路径 / `navigationDestination` 驱动，只保留一个 chevron。
- **对话短会话留白**：`ChatView` 原先无条件 `.defaultScrollAnchor(.bottom)` 并在 follow 时 `scrollTo(bottom)`，短会话被推到底部、顶部留下大片空白。改为按 `transcriptHeight > viewportHeight` 判断：不溢出时从顶部读，溢出时才跟随最新行。
- **空态留白**：`EmptyPlaceholder` 垂直 padding 36→24，智能体 / 群聊空页更紧凑。
- **预览 Mock 补齐**：`.derived/mock-preview.mjs` 补 `permissionPresets/catalog`、`session/modelCatalog`，消除对话页「Host 上没有这个接口」红字；s3 补 Mermaid 流程图、s2 补系统注入通知，使 `ChatRowsTests` 富文本 / 上下文用例在预览夹具下也能通过。这些只影响预览夹具，不改业务代码。

## 9. 已知限制

- `xcodebuild test` 跑 UI 用例时，日志写满 `Executed N tests, with 0 failures` 后进程偶尔不退出；以日志用例级结果为准，确认通过后手动结束进程释放模拟器。
- 安装后首次冷启动截图可能拍到白屏或配对页，需暖启动 + 更长等待再拍；白屏不代表代码回归。