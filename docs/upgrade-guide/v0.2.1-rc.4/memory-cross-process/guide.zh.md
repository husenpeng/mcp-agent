---
kind: upgrade-guide
description: "记忆记录改为一条记录一个文档，写锁串行化并发 Host 进程，召回按间隔重读；降级版本只能读到冻结的旧文件。"
---

# 记忆在多个 Host 进程并存时不再丢写

[English](guide.md) | 中文

## 变更

`@tomato/experimental-memory` 现在按多个 Host 进程共享同一 TOMATO 主目录的方式保存记录。

| 变更前 | 变更后 | 含义 |
|---|---|---|
| 每次写都整份重写 `tomato_memory.json` / `tomato_memory_episodes.json` | 每条记录一个带版本戳的文档：`<unit>/<table>/<key>.json` | 一次写入只动自己的文档，不再重新发布别的进程写入的记录 |
| 跨进程后写者覆盖 | `remember()` 先取 `<TOMATO_HOME>/memory/write.lock`，在锁内重读记录域 | 两个进程不会同时留下同一个身份的两条生效版本；锁在 `writeLockTimeoutMs` 内拿不到时报 `write-busy` |
| 激活时加载一次的内存镜像 | `recall()`、`searchEpisodes()`、`history()` 与每轮快照在介质令牌变化时重读，最多每 `refreshIntervalMs` 一次 | 另一个进程写入的记录无需重启即可进入检索与快照；`0` 关闭重读 |
| 侧车打不开则整个激活失败 | 侧车以 5 秒 busy timeout 打开、重建时合并行、失败时退回域扫描 | 记忆工具保持可用；重建不再抹掉其他进程写入的索引行 |

旧的整份单元文件不会被删除或改写：首次激活把记录复制进新目录，并在旁边留下 `<unit>.migrated.json`。

## 迁移

1. 无需改动，也没有配置变化。引导每个单元只跑一次，并把每条复制过来的记录打上当前域版本。
2. 降级前请备份 `<TOMATO_HOME>/storages`。早于本次变更的版本只读未被改动的旧 `<unit>.json`，因此看不到升级后写入的记录，而它自己的写入也会落到本版本不再读取的文件里。
3. 多个进程必须共享同一个 `TOMATO_HOME` 才能串行化写入：锁在主目录下，不在路由后的存储根目录旁。所有写同一份记忆存储的进程都要指向同一个主目录。
4. `write-busy` 表示别的进程占锁超过 `writeLockTimeoutMs`；重试写入即可，不要当作数据丢失。
