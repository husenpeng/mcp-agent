# Agent Note: Muse 与 Rbot 的长期记忆

Status: proposed

[English](2026-11-05-long-term-memory-for-muse-and-robots.md) | 中文

## 问题

Muse 包拥有个人事实与每日回顾，Rbot 拥有按版本发布、在各自 Session 中运行的机器人。两者都在三个方向上停在长期记忆的门口。

**存下来的只有人说过的内容。** [`@tomato/experimental-memory`](../../../../packages/experimental/memory/README.zh.md) 只在模型引用用户原话时记录偏好、约束、决定或事实，并保留候选直到有人确认（[ADR 0012](../../../../docs/tomato/adr/0012-memory-and-focus.md)）。回合后的捕捉读取该回合中用户的文本并最多提出三个候选（[turn-capture 记录](../../implemented/feature/2026-11-03-muse-turn-capture.zh.md)）；项目索引列出本工作区已有的主题（[project-index 记录](../../implemented/feature/2026-11-03-muse-project-index.zh.md)）。它们都没有记录某个会话试过什么、哪条命令失败、哪种做法奏效。[`@tomato/experimental-tool-memory`](../../../../packages/experimental/tool-memory/README.zh.md) 因此注入一份无法回答“这里之前发生过什么”的快照，而 [`muse-insights`](../../../../packages/experimental/muse-insights/README.zh.md) 生成的回顾从不回流到记忆。

**检索是词法的，注入与任务无关。** 搜索按共享词段排序，可选一次模型查询扩展（[ADR 0013](../../../../docs/tomato/adr/0013-memory-query-expansion.md)）。每个回合的第一步注入同一份快照：全部画像记录加上置顶的工作区记录。工作区积累到超过 `maxSnapshotBytes` 能容纳的记录后，相关性从不参与决定哪些内容到达模型。

**机器人冷启动，学到的内容无法共享。** 机器人规格已经声明了 `memory.read`、`memory.write`、`memory.retentionDays` 与 `memory.recall`（[规格类型](../../../../packages/experimental/robot/src/types.ts)），但 [`robot-runtime`](../../../../packages/experimental/robot-runtime/src/index.ts) 只注入 `robot:mission` 段，不执行任何记忆字段。每次运行都在没有先前决定、失败或未完成任务的情况下开始；两个机器人处理同一任务时读不到彼此的发现；运行结果也从不回写。进行中的 crew 包已经从完成的步骤里抽取 `DECISION:`、`CONSTRAINT:` 与 `OPEN:` 行，并为每次激活从运行作用域的流程账本组装有界简报；那份记忆随运行结束而消失，下一次 crew 或同一成员的下一运行又要从 mission 重新开始。[“记忆视图尚未实现”的限制](../../../../packages/client/ui-robot/README.zh.md) 还让两个页面都没有浏览入口：事实只能通过在对话里执行 `/memory` 触达。

本地 `claude-mem` checkout（v15.9.0，commit `d8bf121ae`，[上游](https://github.com/thedotmack/claude-mem)）展示了缺失的管线：捕捉工具使用、压缩成结构化 observation、渐进检索（search、timeline、read）、在会话开始时注入有界历史。它的形态不能照搬：它运行独立的 Bun worker，使用自己的模型提供方，按设备与项目而非账号给数据分区，把向量存进 Chroma，并把 observer 请求放在任何会话日志之外。[ADR 0013](../../../../docs/tomato/adr/0013-memory-query-expansion.md) 针对它评估的记录规模否决了 embedding 与向量索引；那次否决只假设事实，并未判断会话历史是否值得这份成本。

## 提案

增加一层长期记忆，由四部分组成，两个界面共用：

1. **两类记录，一个读取面。** 显式事实保留当前写入规则与已有的回合捕捉。新的情节类记录 observation 与 session summary，由情节捕捉产生。一个服务同时返回两者。
2. **原生情节管线。** 捕捉、压缩、检索与注入在 Host 进程内运行，使用 `ctx.llm` 并写插件记录，默认关闭，按 Session 设上限。
3. **命名空间作用域与冻结的运行简报。** 机器人运行读取被授予的命名空间，在收尾时回写候选，并共享团队命名空间；规格中的记忆字段开始被执行。
4. **两个页面共用一个客户端包。** Muse 页面增加记忆视图，Rbot 页面增加记忆模式与运行记忆轨迹。

### 记录、作用域与写入策略

| 类别 | kind | 作用域 | 写入者 | 激活 |
|---|---|---|---|---|
| 事实 | `preference`、`constraint`、`decision`、`fact` | `profile`、`workspace` | 带用户原话的模型工具 | 原话匹配即生效，否则为候选 |
| 事实 | `decision`、`constraint`、`fact` | `robot:<id>`、`team:<id>`、`task:<id>` | 机器人工具与运行回写 | 带来源即生效；`constraint` 在 `task` 之外保持候选 |
| 情节 | `observation`、`summary` | `project`、`robot:<id>`、`team:<id>`、`task:<id>` | 情节捕捉管线 | 压缩后生效；可选审阅门 |

- 每条记录保留其 owner（Host 命名账号时为账号，否则为本地 owner）、作用域、来源（Session、message、tool call、run）、内容指纹与可选过期时间。
- 情节记录增加 `type`、`title`、`subtitle`、`narrative`、`facts`、`concepts`、`filesRead`、`filesModified` 与工具名。
- 事实保留 `entity`/`key` 唯一性与写入即替换的语义。情节按指纹去重且只追加。被提升的情节是按其 id 作为来源写入的事实；提升是显式动作。
- 保留期按作用域由配置决定；过期情节与回顾清理使用同一节奏剪除。
- 事实仍留在 `tomato_memory` 域。情节进入新的 `tomato_memory_episodes` 域，因此保留、删除与格式变更永不触碰显式记忆。服务在两者之上组合出一个视图。

### 情节捕捉与压缩

- 情节捕捉与已实现的事实捕捉是两条独立管线。`capture` 继续只读用户文本并保留其原话门；`episodeCapture` 同样默认关闭，读取工具活动。两条管线不写对方的记录类别：事实捕捉写候选，情节捕捉写情节，只有显式提升能让其一变成另一类。
- `tools/post-execute` 观察顶层、成功、改变状态的工具（`edit`、`write`、`bash`、任务类工具），跳过只读工具、子代理 Session 与输入带私有标记的调用。`agent/turn-stopping` 为结束的回合排入一条 summary。
- 每个 Session 一条有界队列，按顺序发送 `init`、observations、`summarize`。队列深度、输入字节与并发是 Config 字段。发送失败或超时写一条分类插件记录并丢弃该项；不重试，也不阻塞回合。
- 压缩调用 `ctx.llm.prepareCall()`，带固定 observer 指令与有界的工具输入/输出。回复解析为一条情节。请求与接受的回复在记录被使用之前写成插件记录，沿用 [turn-capture 先例](../../implemented/feature/2026-11-03-muse-turn-capture.zh.md) 的可重建做法。
- observer 指令从 claude-mem 的提示词集移植（Apache-2.0；在 `THIRD_PARTY_NOTICES.md` 增加声明），并缩减到上面的字段。它自己的 Configure 页说明哪些内容离开本机。
- 情节记录工具名、以 Session 与 tool call 为来源，以及基于工具名、归一化输入与结果摘要的指纹。重复调用更新时间戳而不是追加。
- 情节捕捉永不写入 `preference`、`constraint` 或 `fact` 值。人称通过显式动作提升情节，或模型把提升作为候选提出，仍需确认。

### 检索

- `memory_search` 对情节返回索引行——id、日期、类型、标题、作用域与来源——并受字节上限约束，对事实保留现有的一行形式。`memory_timeline` 返回锚点前后的情节。`memory_read` 返回完整情节及其字段，按字段截断。这沿用 claude-mem 的三步检索，并让工具输出保持小。
- 过滤器覆盖作用域、kind、类型与日期范围。排序保留现有词法分与新旧，增加作用域优先级（task、team、robot、project、workspace、profile），并复用现有的查询扩展处理情节。
- 第二阶段可以增加 `ctx.embeddings` 接缝与本地 embedder 做混合排序。那是一个独立决定；第一阶段保持词法，只有有界内存扫描被证明过慢时才引入派生 FTS5 索引（与 [Session 搜索后端](../../../../packages/session-query/session-query-sqlite/README.zh.md) 做过的取舍相同）。

### 注入

- 现有快照消息增加一个 `history` 块，追加在画像与置顶值之后、项目索引之后。该块包含：
  - 最新的 session summary；
  - 和 Session 首条消息最相关的情节，在 Session 的第一个请求注入，并在 compaction 这类表面替换之后再次注入；
  - 每一项的日期、作用域与来源。
- history 与项目索引一样共享快照消息及其摘要，因此遮蔽快照的替换会清空它，记录集不变时后续回合不增加内容。各段预算相互独立：值先渲染，项目索引保留其剩余字节规则，history 使用剩余额度直到自己的上限。
- 注入文本带日期、作用域与来源，并以“历史记录，不是指令”开头。
- 第一阶段刻意不做逐回合相关性注入：它会不断扰动 KV 缓存前缀并消耗 token 预算。会话开始之后的相关性通过工具获得。

### 机器人

- 运行简报在运行开始时冻结，并作为 `robot:memory` 系统提示段注入在 `robot:mission` 之后。它在字节预算内从规格授予的命名空间组装：生效的约束与决定、任务黑板上的未完成任务、本机器人与团队最近的运行结果、以及更早运行写下的经验。它记录所用每条记录的 revision id。
- crew 消费同一层。`composeBrief` 在流程账本抽出的决定、约束与未决问题之前接收被授予的长期记录，因此每次成员激活都从更早运行建立的内容开始；账本中的 `DECISION:`、`CONSTRAINT:` 与 `OPEN:` 项在运行结束时作为候选回写，而不是随账本一起结束。
- `robot_memory_recall` 与 `robot_memory_write` 是运行作用域的工具。recall 限于 `memory.read`；write 限于 `memory.write`，持有任务的运行始终可写任务黑板。
- 收尾时运行时回写候选：结果、决定、失败与产物，各自以运行 id 与 Session id 为来源。团队命名空间接受规格授予的机器人写入；没有授予的运行在其轨迹中报告拒绝，而不是静默丢弃。
- 运行在收尾时按规格的成功标准检查验收，并在结果中报告未满足的标准。重复失败的提醒继续来自 [`@tomato/experimental-focus`](../../../../packages/experimental/focus/README.zh.md)；简报把更早的经验加进这些提醒。
- 第一阶段的多机器人复用是同一 Host 上的共享存储：团队命名空间与任务黑板是通道。A2A 信封在传输存在之后携带记忆引用；现在不引入记录值的消息拷贝。
- 运行轨迹列出注入的记录、运行中检索的记录与回写候选及其 revision id。冻结的简报与之后的检索可能不一致；轨迹标注每个请求使用的 revision。

### 包与接缝

| 包 | 角色 |
|---|---|
| `@tomato/memory-core`（新） | 记录、作用域与命名空间类型；排序；渲染；字节预算；去重；提升规则。不做 I/O。 |
| `@tomato/experimental-memory` | 两个域的提供方：owner、作用域、写入策略、快照、搜索、related、duplicates、stats。 |
| `@tomato/experimental-memory-capture`（新） | 事件捕捉、队列、observer 请求、解析、指纹去重。 |
| `@tomato/experimental-tool-memory` | 事实工具、`/memory`、快照注入；增加情节的 search、timeline、read 与 promote。 |
| `@tomato/experimental-robot-memory`（新） | 机器人命名空间策略、运行简报组装、回写、收尾验收检查；消费 `ctx.memory` 并挂接 `robot-runtime`。 |
| `@tomato/experimental-robot-crew` / `-local` | 消费该层：长期记录进入 `composeBrief`，抽取的步骤记忆在运行结束时回写。 |
| `@tomato/api-memory-controller`（新） | `memory` Remote 命名空间：list、search、detail、confirm、pin、forget、promote。 |
| `@tomato/client-ui-memory`（新） | 两个页面共用的列表、过滤器、详情与动作。 |
| `@tomato/experimental-muse-insights` | 在 Muse 页面挂载记忆视图；增加回顾生成候选的动作。 |
| `@tomato/client-ui-robot` | 在 Rbot 页面增加记忆模式与运行记忆轨迹。 |

- `ctx.memory` 仍是唯一的能力。`robot-memory` 是其上的策略与组装层，不是第二个存储。这取代 [机器人平台记录](../architecture/2026-10-29-robot-platform-product-architecture.zh.md) 的第 4 项决定：它担心的是写入语义，而按作用域的写入策略加上独立的情节域解决了这一点，同时不拆分读取面，也不复制排序与渲染。
- 没有包跨接缝导入具体提供方。捕捉与机器人记忆依赖服务，而不是存储实现。

### Muse 页面

当前页面是一个右侧栏标签，用两选项 `SegmentedControl` 切换回顾与未完成任务两个视图（[`InsightsTab`](../../../../packages/experimental/muse-insights/src/client/InsightsTab.tsx)）。它增加第三个选项 `记忆`，标签保留刷新动作。

- 工具栏：视图切换、搜索框、作用域过滤与刷新。搜索在提交时执行；过滤器是 `全部`、`画像`、`本项目`、`历史`、`待确认` 的菜单。
- 正文分区按顺序为：带确认与忽略动作的 `待确认`；`我的画像`；`本项目`；按本地日期分组的 `项目历史`；折叠且只读的 `已过期`。
- 一行显示类型标记、标题、作用域、来源与时间。选中后在页面旁打开详情标签，沿用已有的 work-item 详情模式，列表保持原滚动位置。
- 详情标签显示叙述、事实、概念、文件、来源 Session 链接、revision 与动作：确认、置顶或取消置顶、遗忘、把情节提升为事实。
- 回顾视图增加一个动作 `生成候选记忆`，读取已存的回顾并把事实与任务作为候选提出。没有人的确认，任何内容都不会被提升。
- 状态与现有页面一致：未登录、加载中、可重试的错误、各分区空态，以及历史分区中的关闭捕捉提示，链接到 Configure 页。
- 文案说明捕捉记录什么、去往何处；Configure 页承载开关以及字节与保留上限。

### Rbot 页面

当前详情区在运行对话、卡片画廊与规格编辑器之间切换，左侧是运行轨道（[`RobotPage`](../../../../packages/client/ui-robot/src/client/RobotPage.tsx)）。机器人头部增加两选项控件 `运行` 与 `记忆`，只在选中机器人时显示。两种模式下轨道都继续列出运行。crew 工作室的流程账本在其运行条目旁增加同一记忆分区。

- 记忆模式显示 `本机器人`、`团队`、`任务`、`个人` 的命名空间标签、搜索框、仅看候选过滤与记录列表。记录行显示类型、标题、来源运行或 Session 与时间；选中后在同一区域打开详情面板，动作与 Muse 详情一致。
- 运行详情增加可折叠的 `本次运行记忆` 分区，列出注入记录、检索记录与回写候选及其 revision id。被拒绝的命名空间授予在那里显示为拒绝，而不是空列表。
- 规格编辑器的记忆块开始生效：由注册表支撑的命名空间选择器、召回模式选择器（`none`、`keyword`，之后 `hybrid`）与保留字段。发布时校验每个读或写命名空间都存在；授予失败的运行不会静默地无记忆启动。
- 两个页面都挂载 `@tomato/client-ui-memory`，因此行、详情、过滤与动作行为不会分叉。

### 交付阶段

- **第一阶段**（两周）：`memory-core`、情节域、带插件记录的捕捉与压缩、search/timeline/read 工具、带 history 段的组合快照、Muse 记忆视图与 Remote 命名空间。
- **第二阶段**（两到三周）：机器人命名空间与规格执行、冻结的运行简报、recall 与 write 工具、回写、收尾验收检查、运行记忆轨迹与 Rbot 记忆模式。
- **第三阶段**（可选）：`ctx.embeddings` 接缝与本地 embedder 做混合排序；传输存在后的基于 A2A 引用的团队记忆；按真实回顾调整回顾驱动的候选生成。

## 考虑过的替代方案

**把 claude-mem 保留为侧挂提供方** — 产品路径上否决。它保留 Bun worker、自己的提供方与 API key、设备级项目键以及 Host 之外的 Chroma；两个页面将不得不通过第二个服务读取记录，且没有账号隔离，捕捉也永远不出现在 Session 日志里。它仍可作为一周的试点选项，用来测量 observation 质量。

**只增加更多词法事实，不做情节** — 否决。它回答不了会话试过什么、哪种做法失败，让回顾保持单向，也让机器人继续冷启动。瓶颈不是记录模型，而是缺失的管线。

**给机器人独立服务与存储** — 即早先机器人记录的决定。现在否决，因为跨机器人复用与单一页面需要一个读取模型；按作用域的写入策略保留了原来的顾虑，独立的情节域把保留与删除隔开。两个存储会复制排序、渲染、预算与客户端。

**用 Chroma 作为向量存储** — 否决。它增加第二个进程、数据生命周期与协议面（[claude-mem 自身的架构](https://github.com/thedotmack/claude-mem) 需要 MCP 管理器来管理它）。派生 SQLite FTS5 索引加可选的进程内 embedding 足以覆盖有界语料，并让无密钥回放继续工作。

**每个回合都注入历史** — 第一阶段否决。它会不断扰动 KV 缓存前缀，并把 token 花在当回合可能不需要的记录上。会话开始注入加工具让前缀保持稳定；如果证据支持，可以用 Config 开关增加逐回合相关性。

**从捕捉自动写入事实** — 否决。它会破坏 [ADR 0012](../../../../docs/tomato/adr/0012-memory-and-focus.md) 的原话确认规则，把 observer 的猜测变成长期约束。自动化只限于情节与候选。

## 验收标准

- Muse 记忆视图列出事实与情节，可按作用域与候选状态过滤，打开详情标签，并确认、置顶、遗忘或提升记录。未登录时显示与其他 Muse 视图相同的拒绝。
- Session 的第一个请求在字节预算内注入 history 段；之后的 search 与 read 能取回早先 Session 的情节，并带来源与日期。
- 捕捉默认关闭。开启时，每个 observer 请求在结果被使用之前显示为插件记录；没有回合等待捕捉；超时或失败在记录与 Configure 页状态中都可见。
- 机器人运行的第一个请求携带由被授予命名空间构建的 `robot:memory` 段；运行轨迹列出注入、检索与写入记录的 revision id。同一机器人的第二次运行，以及持有同一团队授予的同伴机器人，能读到第一次运行写下的决定。
- crew 运行在每个成员简报中把长期记录放在账本记忆之前，运行结束后其抽取的决定与约束作为候选出现在团队命名空间。
- 授予之外的读写被拒绝，拒绝出现在运行轨迹中。过期记录不再被检索，并从两个页面消失。
- 无密钥的录制会话快照覆盖情节工具、带 history 段的组合快照，以及机器人包加入快照 profile 时的运行简报；任何新消息来源都更新两套 SDK 投影。Muse 包的真实组合测试与浏览器测试覆盖注入与两个页面，与现有回顾和捕捉行相同。
- 每个上限都是带 Configure 页的 Config 字段；插件中没有常量决定随部署变化的值。

## 风险

- **记忆污染与过期约束。** observer 或机器人可能记录一条错误的经验，后续运行把它当作指导。每条记录带来源与置信度，任务黑板之外的约束保持候选，页面提供遗忘与过期入口。简报为每条记录标注 revision。
- **成本与 token 增长。** 捕捉为每一批捕捉到的工具与每个回合各增加一次模型调用；历史注入花掉每个首请求的一部分。两者都默认关闭或受 Config 限制，轨迹报告字节与调用数。
- **隐私。** observer 读取工具输入与输出，其中可能含凭据或客户数据。捕捉跳过带私有标记的输入、截断字段、默认关闭、记录提供方路由，并优先本地路由；Configure 页说明捕捉会把数据发送给模型。
- **与 ADR 冲突。** [ADR 0012](../../../../docs/tomato/adr/0012-memory-and-focus.md) 否决了逐回合后台抽取，[ADR 0013](../../../../docs/tomato/adr/0013-memory-query-expansion.md) 否决了 embedding。本提案把前者收窄为可选、请求被记录的情节捕捉，并把事实限制在现有规则内；embedding 工作留作独立的后续决定。
- **记录规模。** 情节随工具使用增长。保留期、按作用域上限与去重约束存储；如果内存扫描超出预算，下一步是派生 FTS5 索引。
- **机器人行为变化。** 启用记忆会改变运行的提示词前缀，并在每个 revision 失效一次缓存；命名空间为空的现有机器人保持当前行为。发布带不存在命名空间的规格会失败，而不是无记忆启动运行。
- **可追溯性。** 冻结的简报与之后的检索可能不一致。轨迹标注每个请求使用的 revision，简报记录 id 而不是拷贝文本。
- **编队中的两条记忆路径。** 流程账本与长期层都承载决定与约束。简报把长期记录排在前面并标注来源；账本仍是运行作用域的记录，因此成员不会在没有来源的情况下重复读到同一项。
- **页面范围。** 一个客户端包上的两个界面增加共享状态与测试矩阵；另一种做法（两个独立视图）会在行为与词汇上分叉。