# 0013. 记忆搜索用一次辅助模型请求扩展查询，再做词法排序

- 状态：Accepted
- 日期：2026-10-29
- 影响范围：`packages/experimental/tool-memory`、`packages/experimental/memory`

## 背景

[ADR 0012](0012-memory-and-focus.md) 的检索只按查询词命中比例排序：查询必须与记录有相同的词，同义词、换个说法或中英文混用都搜不到。例如记录写的是“邮件口吻要简短直接”，模型搜“邮件语气”就找不到。用户希望检索能“语义化”。

约束：仓库没有 embedding 提供方，也没有向量索引；模型可见内容必须能从会话日志重建（辅助模型请求同样要记录）；工具调用的取消必须生效；记忆服务只是存储，不应依赖模型。

## 决策

- **两段检索**：`memory_search` 先按字面查询调用 `ctx.memory.recall()`。仅当同时满足以下条件时才扩展：`queryExpansion` 开启、查询非空、字面结果少于 `maxRecallResults`、当前视图中至少有一条生效记录。
- **扩展请求**：通过 `ctx.llm.prepareCall()` 发送一次辅助请求，不带会话历史和工具，只带查询本身与固定系统文本 `EXPANSION_SYSTEM`（要求逐行给出同义词、近义说法和中英文同义表达）。路由默认是调用方智能体的当前模型；`expansionProvider` 与 `expansionModel` 必须成对配置，否则加载即报错。请求受 `expansionTimeoutMs`（默认 8000）与工具调用取消共同约束，输出上限为 `expansionMaxTokens`（默认 120）。
- **解析与排序**：回复按换行和中英文逗号、顿号、分号切分，去掉列表标记，去重（不区分大小写，排除原查询），每条最多 40 个字符，最多保留 `maxAlternatives`（默认 8）条。`rankMemories()` 对每条记录取“字面覆盖率”与“各说法覆盖率 × 0.7”中的最大值；得分为 0 的记录丢弃，同分按更新时间、再按 id 排序。匹配仍是 `Intl.Segmenter` 分词后的词法匹配。
- **记录**：每次扩展尝试都在结果被使用之前，以插件记录 `plugin:tool-memory/query-expansion` 写入调用方会话，内容包括路由、系统文本、查询、token 上限，以及得到的说法或失败原因。辅助请求的输入消息使用新的 `experimental-tool-memory` 来源类型（`@persistenceAttribution`），它从不出现在对话界面上。
- **失败处理**：模型报错、超时、回复为空或无法解析时，记录失败并回退到字面结果，搜索本身不失败；工具调用被取消时直接结束搜索。

## 备选方案

- **embedding + 向量索引**：需要新的提供方、索引存储、重建与迁移，并且要为每条记录记录 embedding 版本；记录规模只有每个工作区上千条，收益不足以抵消成本。
- **每次搜索都扩展**：字面查询已命中足够记录时，额外请求只增加延迟和费用。
- **让记忆服务直接调用模型**：会让存储服务依赖 `ctx.llm` 与模型路由；扩展属于面向模型的消费方，放在 tool-memory 中，服务只接收调用方提供的说法。
- **把扩展说法放进工具 schema，让主模型自己多次搜索**：主模型多一轮调用、多一份上下文，而且无法保证它会这么做。

## 后果

- 命中过少的搜索最多多一次辅助请求：约 50 个 token 的系统文本加查询，输出不超过 `expansionMaxTokens`；不影响调用方智能体的请求前缀。
- 通过其他说法命中的记录得分低于字面命中，因此字面结果仍排在前面。
- 扩展仍是词法匹配：模型只提出其他词，记忆仍需包含其中某个词。
- 扩展请求按调用方智能体的模型计费；可以用 `expansionProvider`/`expansionModel` 指定更便宜的模型。

## 验证

- `pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory`：覆盖扩展成功并记录、各跳过条件、字面结果已满、模型失败与超时回退、显式路由、无模型、工具调用取消、非 Error 抛出、推理块忽略和回复解析；两个包源码的单文件覆盖率均为 100%。
- `pnpm run verify-persistence-catalog`、`verify-config-catalog`、`verify-tool-catalog` 通过；新来源类型并入 `2026-10-29-memory-focus-attribution` 记录，决定为 `same-version`。

## 未决

- 记录规模或命中质量不够时，是否引入 embedding 检索。
