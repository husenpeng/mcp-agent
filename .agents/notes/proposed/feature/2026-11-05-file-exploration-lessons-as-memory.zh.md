# Agent Note: 把文件探索经验作为长期记忆

Status: proposed

[English](2026-11-05-file-exploration-lessons-as-memory.md) | 中文

## 问题

[长期记忆提案](2026-11-05-long-term-memory-for-muse-and-robots.zh.md) 为 Muse 增加了情节捕捉，并计划让机器人复用。本地 claude-mem checkout（v15.9.0，commit `d8bf121ae`，[上游](https://github.com/thedotmack/claude-mem)）提供了它所改造的管线：捕捉工具结果、压缩、渐进检索，并注入有界历史。本记录写下第一个支撑情节层的具体实例，以及它暴露的工具面缺陷。

一个在本仓库工作的 Agent 试图通过浏览器 JavaScript 而不是文件系统工具回答“这个目录里有什么”。原因不是模型偏好：

- **没有目录原语。** 文件系统工具集只有 `read`、`write`、`edit`、`read_image`、`glob` 与 `grep`。`glob` 自己的描述是“Find files, not directories”（[glob.ts](../../../../packages/fs/tool-fs-search/src/glob.ts)），因此“列出这个目录”没有便宜的调用。
- **glob 不会收敛。** 它只有 `pattern` 与 `path`；默认包含隐藏与忽略文件，不含 `/` 的模式按任意深度的 basename 匹配，裸 `*` 会遍历整棵树。观察到的调用返回了 840 条路径，界面显示 100 条，其余写入 spill 文件。
- **`read` 总是重发。** 每次调用都完整渲染窗口（[read.ts](../../../../packages/fs/tool-fs/src/read.ts)）；观察策略已经按 Session 记录版本，但没有“已送达读取”状态把未变化的文件变成一条简短通知。
- **默认值被所有 Agent 共享。** `@tomato/tool-fs` 与 `@tomato/tool-fs-search` 为所有 profile 注册面向模型的工具与提示段。rbot 配置修不了每个 Agent 继承的默认值，也没有任何机器人设置能阻止模型构造另一次全树 glob。

同一个实例也说明了情节层的用途：下一个会话没有记录这棵树很大、宽 glob 会溢出，于是重复付出成本。

## 提案

### 工具面

- **`list_dir`**（`@tomato/tool-fs`）：有界目录视图，参数为 `path`、`depth`（默认一层）、`all`、`exclude` 与 `limit`。默认跳过隐藏名称与配置的构建目录，从不返回文件内容，并注册自己的提示段，告诉模型先从这里开始再搜索。配置键：`list`、`listDepth`、`listMaxDepth`、`listMaxEntries`、`listExcludes`。
- **收窄 `glob`**（`@tomato/tool-fs-search`）：schema 增加 `depth`、`exclude` 与 `hidden`。`depth` 映射到 ripgrep 的 `--max-depth`；`exclude` 追加否定 glob；`hidden: false` 去掉 `--hidden` 与 `--no-ignore`，让忽略规则与点名称跳过生效。配置上限：`globMaxDepth`、`globMaxExcludes`。默认命令不变，因此现有快照与行为保持稳定。
- **提示指导**先点名 `list_dir`，并告诉模型传 `depth` 或 `exclude`，而不是裸递归模式。
- **`read` 的送达状态**暂缓：正确实现必须以 Session 表面代次为键，而不只是文件版本，否则压缩之后的读取会抑制模型已经不再拥有的内容。观察策略的版本是必要条件，但不充分。

### 确定性经验

- 成功但结果被截断、或路径数达到 `lessonGlobMinPaths` 的 `glob`，会成为一条 `discovery` 情节，标题形如 `Broad glob returned 840 paths`，叙述提示后续会话先用 `list_dir` 或更窄的搜索。
- 经验来自工具自己的结果元数据（`total`、`truncated`），因此不花费辅助模型请求，也能从结果复现。指纹是搜索根与模式，重复搜索会更新之前的情节而不是追加。
- `@tomato/experimental-tool-memory` 拥有监听器。`lessonCapture` 默认开启，`lessonMaxPerSession` 限制写入，现有项目历史注入会把经验带进后续会话的首个请求。
- 这是情节层第一个非 LLM 生产者。它补充而不是替代工具观察捕捉与显式事实规则：经验是 observation，永远不是 `preference`、`constraint` 或 `fact`，也不需要人的原话。

### Personal memory 执行

- 显式事实保留原话确认的写入路径。经验与工具观察是情节，存放在 `tomato_memory_episodes`，由同一历史预算选择，并与其他情节走相同的词法与向量排序。
- 经验监听器每次调用读取一次记忆访问状态，遵守登录与项目范围，因此未登录的 Host 不会写入错误所有者。
- 确定性生产者运行在捕捉队列之外，因此不会延迟工具结果；写入失败只记录日志，工具结果仍然返回。

## 考虑过的替代方案

**只改系统提示** — 否决。提示能降低全树 glob 的概率，但回答不了“这里有什么”；缺失的原语才是根因。

**写机器人专属指南** — 否决。工具默认值与提示段属于共享包，机器人规格无法阻止模型用新模式调用 `glob`。

**用 observer 模型压缩宽搜索** — 本场景否决。路径数与截断标志已经在工具结果里；模型请求只增加成本、延迟和不可确定的记录，而事实已经已知。

**直接禁止宽 glob** — 否决。有些任务确实需要全树搜索；解法是便宜的目录视图与收窄参数，而不是禁止。

**只按文件版本去重 `read`** — 否决为不安全。版本不能证明先前内容仍在模型表面上；实现要等表面代次感知的送达状态。

## 验收标准

- `list_dir` 对假树默认列一层，遵守 depth、`all`、`exclude` 与 `limit`，报告截断，且从不读取文件内容；`list: false` 时其 schema 与提示段消失。
- `glob` 接受 `depth`、`exclude` 与 `hidden`，按配置上限校验，并生成预期 argv；默认 argv 不变。
- 经真实 `tools/post-execute` waterfall 的截断或大结果 glob 存下一条经验情节，重复模式更新它，`lessonMaxPerSession` 限制后续写入；聚焦 glob、委派 Agent、无项目会话或 `lessonCapture: false` 不存任何内容。
- 后续会话的快照能在 `maxHistoryBytes` 内通过现有项目历史块携带经验。
- 测试覆盖新工具、schema 校验、提示指导、经验派生、监听器限制与存储；配置目录与工具目录重新生成。

## 风险

- **经验噪声。** 每次超过阈值的搜索都会写一条情节。每会话上限与指纹更新限制它，但大量宽搜索的项目会积累 discovery 情节；每项目情节上限与保留期仍然生效。
- **过期建议。** 树变小后经验仍说“这棵树很大”。它是有日期的 observation，不是 constraint，注入也把历史标为不是指令。
- **工具耦合。** 经验监听器按名称 `glob` 与结果元数据识别；换用其他搜索提供方不会产生经验，改名元数据字段会静默停止经验；工具目录测试与 README 固定该契约。
- **暂缓的 read 去重。** 重复的完整读取仍在。朴素的版本校验比它节省的成本更糟，因为压缩后的会话可能失去模型编辑所需的内容。
- **没有目录内容。** `list_dir` 只列名称；内容仍需 `read`，模式仍需 `glob`。阻止错误首调的是指导顺序，而不是合并工具。