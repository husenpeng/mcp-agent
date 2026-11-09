---
kind: upgrade-guide
description: "Muse 回顾现在把回顾弹窗节奏与总结运行节奏分开，只总结新增证据，并把回顾路由默认设为部署的 blueai 网关模型。"
---

# Muse 回顾拆分弹窗节奏与总结节奏

[English](guide.md) | 中文

## 变更

`@tomato/experimental-muse-insights` 替换了两个配置键，并改变两种节奏的含义。

| 变更前 | 变更后 | 含义 |
|---|---|---|
| `recapIntervalMinutes`（`30`） | `recapNoticeMinutes`（`240`） | 浏览器中两次回顾弹窗之间的分钟数 |
| `taskIntervalMinutes`（`15`） | `summaryIntervalMinutes`（`120`） | 两次总结运行之间的分钟数；每次刷新当天回顾与未完成任务 |

总结运行现在只读取比已保留回顾更新的当天证据，并合并进当天的回顾，因此长日子的输入保持有界，而不是反复读取并截断整天。请求携带当天此前的回顾与新增会话；工作项在多次运行之间保持措辞，并在新消息确定结果时更新状态。没有新文本的运行不写入任何内容。

回顾弹窗不再每天只提示一次，而是每隔 `recapNoticeMinutes` 重复最新回顾；未完成任务提醒使用同一间隔。Host 在每次快照中下发该间隔，所以保存后的间隔无需刷新页面即可改变提示节奏。

`provider` 与 `model` 现在默认是 `blueai` 和 `DeepSeek-V4.1-Flash-1017`，即随产品部署配置的路由。两者仍需同时提供，配置页会列出 `llm-pi-ai` 设置段声明的提供商与模型，而不再使用自由文本。Host 无法服务的路由仍会退化为确定性回顾并记录失败。

## 迁移

1. 在所有设置它们的 `cordis.patch.yml` 或 overlay 中改键：`recapIntervalMinutes` → `recapNoticeMinutes`，`taskIntervalMinutes` → `summaryIntervalMinutes`。补丁会整段替换该行的 `config`，因此只写旧键的行会失去这些值并回退到新的默认值（`240` 与 `120`）。
2. 把 `recapNoticeMinutes` 设为期望的弹窗节奏。旧值表示生成重试间隔，而不是弹窗节奏；4 小时一次回顾弹窗为 `240`。最小值仍是 1 分钟。
3. 把 `summaryIntervalMinutes` 设为新增会话证据进入当天回顾的频率。此前回顾会被就地替换，不再有单独的重试键。
4. 如果部署没有配置 `blueai` 网关，请重新检查 `provider` 与 `model`。在该行的配置页选择已配置的路由，或在 `cordis.patch.yml` 中设置该组合；只清空一半会在加载时被拒绝。
5. 预期回顾页在总结运行后显示同一天回顾的新版本，提示按弹窗间隔重复。存储记录保持格式版本 1，无需数据迁移。

验证该行以新键加载、配置页保存时显示已配置路由，并且新增会话文本后的下一次运行会更新回顾的消息数与版本。