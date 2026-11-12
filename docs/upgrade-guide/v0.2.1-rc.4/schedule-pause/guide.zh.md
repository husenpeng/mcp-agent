---
kind: upgrade-guide
description: "定时任务增加持久化的暂停状态，排期存储域因此升到版本 2，降级后的桌面端会丢弃这些任务行。"
---

# 定时任务可以暂停

English | [中文](guide.md)

## 变更

提醒现在可以暂停与恢复。`@tomato/schedule` 把状态存为任务行上的 `pausedAt` 时刻，保留规则，设置期间不安排定时器；恢复时按恢复时刻重新锚定规则。Remote 命名空间新增 `create`、`pause`、`resume`，`schedule/catalog` 的每条记录都带 `paused` 与 `pausedAt`。

| 之前 | 之后 | 含义 |
|---|---|---|
| `schedule/*` 没有暂停状态 | 任务行 `pausedAt?: string`，目录项 `paused: boolean` | 暂停的任务仍可见，且永远不会到期 |
| 排期存储域版本 1 | 排期存储域版本 2，兼容版本 `[1]` | 新读者按原样打开版本 1 的行 |
| `schedule/catalog` 项没有 `paused` | 每一项都带 `paused` | 暂停功能之前创建的任务读作 `paused: false` |

## 迁移

1. 无需改动：已有任务以未暂停状态打开，存储域在下次写入时把文件重写为版本 2 标记。
2. 不要把这台写过暂停任务（或新任务）的桌面端降级到更早的版本。旧读者会拒绝未知的 `pausedAt` 键，导致整个排期存储域打不开，提醒会停止投递，直到新桌面端再次运行。
3. 读取 `schedule/catalog` 的集成现在可能看到 `paused: true`；应理解为「已激活但未上弦」，而不是已结束（`status: 'inactive'`）。
