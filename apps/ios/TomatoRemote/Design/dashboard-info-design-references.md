# 后台 / 仪表盘信息样式设计参考

为 TomatoRemote 的「信息展示面」（会话/机器人/群聊列表、今日首页、记忆、定时任务、账号卡片、用量/进度 sheet）收集的设计参考。与 [ai-chat-design-references.md](ai-chat-design-references.md)（对话面）配套；规则落地见 [../rule.md](../rule.md) 与 [../agent.md](../agent.md)。

## 来源与可落地要点

### Apple HIG — Lists and tables
https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- 文件夹分组用 grouped 列表（header/footer/组间距）；行文本简洁，长内容进详情。
- 标识符/路径用**中间省略号** `.truncationMode(.middle)`，保留首尾。
- 行解剖：leading 图标 + 主标题 + 副标题；chevron=下钻，info=揭示细节（不导航）。
- 单列也要 header；「最相关项 + 查看全部」收长列表。

### Apple HIG — Layout
https://developer.apple.com/design/human-interface-guidelines/layout
- 重要=靠上靠前置；对齐/缩进表达层级；留白/容器/分隔线分组。
- 渐进披露（DisclosureGroup/嵌套/sheet）；控件与内容视觉区分。
- 动态字号下行可增高、横排可转纵排（ViewThatFits），不裁切。

### Apple HIG — Color
https://developer.apple.com/design/human-interface-guidelines/color
- **绝不只靠颜色**：状态=tint+图标+文字；一色一义；红=失败/绿=运行。
- 语义 label 层级（primary/secondary/tertiary）；三级背景层级；强调色克制。

### Apple HIG — Progress indicators
https://developer.apple.com/design/human-interface-guidelines/progress-indicators
- **可量化就用确定性进度**：目标轮次 `ProgressView(value:total:)` + 「第 X/Y 轮」。
- 不可量化用行内小 spinner；停住≠转圈，要给问题+补救；状态位置全 App 一致。

### NN/g — Dashboards (preattentive)
https://www.nngroup.com/articles/dashboards-preattentive/
- 本 App 属「运维仪表盘」：一眼回答「有没有失败/现在在跑什么」。
- 数量只用**长度/2D 位置**编码（token 用共享刻度横条）；不用圆环/仪表。
- 颜色区分类别不编码数量；色盲冗余编码；让异常「跳出来」（idle 保持安静）。

### IBM Carbon — Data table / Tag
https://carbondesignsystem.com/components/data-table/usage/ · https://carbondesignsystem.com/components/tag/usage/
- 统一行高密度；标题+描述置于表/列表上方；补充细节用展开行或专页。
- 列表加载用骨架非 spinner；<3 个动作内联图标按钮，≥3 收进 Menu。
- 状态 pill=容器+短标题+leading 图标；≤20 字符单行；只读不可点；每类别一色。

### Material Design 3 — Lists
https://m3.material.io/components/lists/guidelines
- 固定槽位解剖（leading→label→supporting→trailing），每行一致。
- trailing=元数据槽（时间/计数）；主操作占整行，辅助动作 trailing。
- contained 用间距、flat 用分隔线，不混用；滑动须有非滑动替代。

### Pencil & Paper — Data tables / Dashboards
https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables · https://pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards/
- 文本左对齐、**数量右对齐**；所有数值/计数/时间用 `.monospacedDigit()` 防抖动。
- 卡片解剖一致（标题左上/关键值突出/附件右上/脚注底部）；少数关键 KPI 才用大号粗体。
- 先分类表面（今日=监控+主页）：失败/逾期优先于总量；每卡片是其完整列表的入口。
- 每个模块都设计空态/加载态；移动端「策展而非压缩」，密集明细进 drill-in sheet。

## 本轮已落地
- 目标轮次 → 确定性线性进度条（`GoalRoundsProgress`，首页 + 进度 sheet）。
- `InfoRow` 数值右对齐 + 表格化数字；首页/记忆分区计数 `.monospacedDigit()`。
- 新建会话选择器路径 `.truncationMode(.middle)`（FolderLabel 已有）。
- 进度 sheet 子代理计数对比度提升、「停止」按钮 44pt 命中区。

> 说明：本 App 已实现大部分上述模式（状态 pill、卡片行、运行中品牌色渲染、相对时间、ProcessGroup 折叠、骨架屏），故本轮为「补齐少数真实缺口」，非重设计。