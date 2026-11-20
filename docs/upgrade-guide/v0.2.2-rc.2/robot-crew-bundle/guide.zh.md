---
kind: upgrade-guide
description: "Rbot bundle 不再挂载协作群聊流程；需要保留群聊标签页、画布、控制器与 agent 工具时启用新的「机器人协作团队」bundle。"
---

# 协作群聊流程移到独立 bundle

[English](guide.md) | 中文

## 变更

`@tomato/experimental-robot-app` 不再提供协作群聊流程。它保留机器人注册表、运行时、触发器、模板、机器人页与协作空间。协作群聊的五条行——基于存储的协作提供方、其 Remote 传输、生成的协作控制器、agent 协作工具，以及带流程画布与群聊标签页的协作页——现在位于可选 bundle `@tomato/experimental-robot-crew-bundle`。

因此，只选 Rbot bundle 的 profile 左侧边栏不再出现协作群聊标签页，也不再暴露 `crew` Remote 命名空间，agent 也没有协作工具可用。持久化的 `tomato_crew` 域保留全部已存协作群与运行记录；数据不删除、不迁移。

## 迁移

1. 如需保留协作群聊流程，在 profile 的 bundle 列表中加入 `@tomato/experimental-robot-crew-bundle`，或在 Web 或桌面端的「插件」里启用 **机器人协作团队**。
2. 确认左侧边栏出现协作群聊标签页、能从该标签页打开画布，且 agent 可以调用协作工具。
3. 从未使用协作群聊的 profile 无需任何操作：不选这个 bundle 就是新的默认。