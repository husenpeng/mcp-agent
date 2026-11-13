---
kind: upgrade-guide
description: "记忆注入在账号加载期间保留已送达快照，追加与请求相关的记录，排除本会话自己的情节，并把画像偏好捕捉为生效记录。"
---

# 记忆注入跟随已验证的账号与当前轮次

[English](guide.md) | 中文

## 变更

两个记忆包改变了每一轮收到什么，以及捕捉保存什么。

| 之前 | 之后 |
|---|---|
| 网关尚未验证浏览器时返回 `sign-in-required` | 验证前返回 `account-loading`；只有确认退出登录后才返回 `sign-in-required`。恢复的会话不会在启动期间注入清除通知。 |
| 只携带画像与置顶工作区记录 | 追加最多 `maxRelevantRecords` 条生效工作区记录，其文本至少覆盖本轮首条人的消息的 `minRelevantScore` |
| 历史与索引会点名任何词法命中，包括本会话自己的卡片 | 两者都排除当前会话、丢弃低于 `minHistoryScore` 的匹配，并按标题只保留一行 |
| `promote()` 对所有观察事实分组 | 失败观察和只有退出码的事实永不提升 |
| Muse 配置包保持捕捉关闭 | 它设置 `capture: true`：每个结束回合一次有界请求，携带工具活动摘要与已保存事实 |
| 捕捉把每条陈述存为候选 | 当 `captureProfileActive` 开启时，带原话验证的画像陈述立即生效；已有画像值会被替换，而工作区候选永不覆盖 |
| 清除文本称更早的记忆不再适用 | 现在称本轮不展示记忆，更早的记忆可能不再适用 |

观察卡现在会在开头的 `cd … &&` 之后命名真正的命令，并索引它涉及的路径。

## 迁移

1. 直接挂载这两个包的 profile 无需修改。要保持之前的请求数，在 `optional-tool-memory` 上设置 `capture: false`。
2. 每个对 `MemoryAccess` 的穷举 switch 都要处理 `account-loading`：保留已展示的界面并重试。
3. 用 `/memory forget <id>` 删除更早的失败调用提升写下的候选；本次变更会阻止新的候选，但会保留已存记录。
4. 新的上限：`maxRelevantRecords`（`5`，`0` 关闭）、`minRelevantScore`（`0.25`）、`minHistoryScore`（`0.25`）、`captureProfileActive`（`true`）与 `captureMaxToolBytes`（`1200`）。
5. 更早轮次陈述的偏好仍需要重新陈述或 `/memory confirm`。

验证：恢复的会话在账号加载时继续显示已记住的记录；匹配的未置顶记录出现在 `Saved memories relevant to this request` 下；捕捉到的画像陈述在下一轮快照中为生效状态。
