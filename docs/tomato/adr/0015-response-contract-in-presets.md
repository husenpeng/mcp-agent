# 0015. 内置预设统一回答契约

- 状态：Accepted
- 日期：2026-11-02
- 影响范围：`packages/bundle/web-app/presets/*.patch.yml`、`packages/preset/agent-preset/tests/response-contract.spec.ts`、`packages/bundle/web-app/README.md`

## 背景

打包应用的使用反馈是回复冗余、关键点不突出。本机 8 个工作区 86 条最终答复的统计是：中位 2,009 字符、p90 4,278 字符、最长 12,120 字符；只有 2 条在第一句给出结论；64% 带标题、55% 带表格。现有 `standard` / `ptc` / `cordis` 预设的人格只有一句身份描述，没有任何输出风格约束。

预设的 persona section 是 scope 级注册，会 shadow 部署级 `personaPrefix` / `personaSuffix`；技能按需加载，只作为目录条目出现，不能承担每轮生效的规则。因此回答风格只能落在预设自己的 persona 配置上。

## 决策

在 `standard`、`ptc`、`cordis` 三个预设的 `persona.suffix` 写入同一段英文回答契约，`minimal` 保持 `complete: true` 的固定提示不变。契约要求：

- 首句给出结论、结果或建议；多个要点时先放最影响决策的一条；禁止状态播报开场。
- 只保留影响决策或指导行动的信息；去掉复述提问、工具旁白、用户已知背景、结尾重复总结。
- 一两句能答完就直接说；更长的回答最多三节（结论、依据、下一步），空节省略，段内用短段落或列表，表格只用于三项以上对比。
- 只有用户要求细节、结论依赖非显然机制、或用户需要核验时才展开；其余支撑材料放进 `present` 的文件。工具指令与既定输出格式优先。

契约不设行数上限，约束的是结构与信息取舍。

## 备选方案

- **新增全局 response-contract section 包**：单点维护、未来预设自动继承，但需要新增 prompt order（或改核心包），且全局 section 会作用于所有 agent，包括子代理。否决。
- **只写用户级 `~/.tomato/AGENTS.md`**：不需要发布即可生效，但不是产品默认，每个用户都要自行配置，且 `minimal` 未挂 `agent-instructions`。否决。
- **用 Creator 模式建自定义预设**：只对作者本人可见，无法成为随包默认。否决。
- **结构化卡片协议（模型输出字段，客户端渲染）**：最可控，但需要改客户端渲染、模型可见契约与快照，成本高于本轮目标。否决。

## 后果

- 三个预设的会话都会在系统提示末尾看到这段约 1,053 字符的固定文本；它位于 order 10200，静态内容，不引入每次请求的变量，也不新增工具。
- 子代理默认继承父会话的 preset，因此也会看到契约；措辞以“用户”为对象，且不设行数上限，不会截断子代理给父 agent 的报告。
- `minimal` 与 headless、ACP、SDK 组合不加载这些预设，行为不变。
- 部署级 `personaPrefix` / `personaSuffix` 仍被预设 shadow；契约不要在部署配置里重复维护。

## 验证

- `pnpm exec vitest run packages/preset/agent-preset/tests/response-contract.spec.ts`：三个预设的 suffix 与契约逐字相等，`minimal` 的 suffix 缺失且 `complete: true`。
- `pnpm run test:snapshot`：现有快照的 `system-prompt.expected.md` 使用测试专用 composition，不包含内置预设的真实 persona，预期无漂移。
- 打包后按六条固定问题（寒暄、事实、单步操作、对比分析、方案设计、报告）对比首句是否结论、是否三节、有无状态播报与字符数。

## 未决

若模型遵循度不足，再评估结构化最终答复工具或客户端摘要卡；本轮不引入。
