# Agent Note: Muse 记忆的重复提示

Status: implemented

[English](2026-11-03-muse-memory-duplicate-hints.md) | 中文

## 问题

只有当 `(scope, entity, key)` 完全相同时，写入才会替换已有记录。模型经常把同一条长期规则换个 key 或换个主体重新表述，存储里于是积累了大量改写：搜索返回几条几乎相同的行，每个工作区的上限也被重复陈述填满。Hindsight 的合并精炼层会合并这类陈述，但它的引擎在每次写入时都要花一次模型调用。

## 决定

`MemoryService.duplicates(query)` 把一次待写入值与同一所有者、同一范围、同一 kind 的生效记录比较。两边的值都必须至少包含 `MIN_DUPLICATE_TOKENS`（3）个词段，并且共享较多一方至少 `DUPLICATE_COVERAGE`（0.8）的词；这次写入将要替换的那一条不算匹配。检测是词法的、同步的，且从不阻止或改变写入。

`memory_write` 仍然保存记录，并追加 `Similar saved memories: …; use memory_forget when one is superseded.`，最多点名三条匹配。提示随写入结果返回，而不是另设工具，这样智能体正好在能采取行动时看到它。

## 考虑过的替代方案

**每次写入都跑一次模型合并精炼。** 这是 Hindsight 的做法。它每次写入多一次请求，给工具调用增加延迟，而且产出无法对照用户原话验证；`duplicates()` 不花任何请求。

**拒绝重叠写入。** 悄悄丢掉用户要求记住的内容，比留下一条重复更糟；提示把决定留给了解当前请求的智能体。

**只做归一化后的精确相等。** 确定性强，但会漏掉词序不同或轻微改写的陈述，而这正是常见情况。

**向量相似度。** 该包没有 embedding 提供方，为一个提示维护索引生命周期并不成比例。

**单独的 `memory_duplicates` 工具。** 第 5 个 schema 会在每次请求上重复回答写入结果已经回答的问题。

## 后果

- 规则是保守的：换了说法的改写不会被报告，`DUPLICATE_COVERAGE` 用召回换精确度，避免错误匹配让智能体删掉一条本不相干的记忆。该限制由[包 README](../../../../packages/experimental/memory/README.zh.md) 负责记录。
- 提示是模型可见的，因此 `memory_write` 的描述、写入结果、两个包的 README 以及两份工具目录都会变化。不涉及存储、配置或工具数量的变化。
- 重复检测在每次写入时读取整个所有者与范围，与其他读取一样；各范围的上限限制了开销。
- 覆盖率保持 100%。本层扩展的层次记录在[关系与健康笔记](2026-11-03-muse-memory-relations-and-health.zh.md)。