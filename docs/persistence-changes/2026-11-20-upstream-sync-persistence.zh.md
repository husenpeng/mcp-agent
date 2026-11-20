---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-11-20-upstream-sync-persistence

[English](2026-11-20-upstream-sync-persistence.md) | 中文

## 概述

记录本次上游同步带来的 Session 持久化类型变更：LiveShare 阅者调用现在携带 share-viewer 身份变体；retry 来源只保留浏览器关联字段；三个合并进 MessageSourceMap 的成员——experimental-memory-dream、skill-catalog 的完整性标记、subagent-settled 的停止原因——进入这些消息列表；已移除的 DeepSeek 网页搜索插件不再写出其请求记录。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

```yaml persistence-change
schemaVersion: 1
id: 2026-11-20-upstream-sync-persistence
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-11-04-image-evidence"
    after: "b75001ef50c434d75ec4c79fffbcc65c0847a385056f7b9d6c20a7038d8c7f69"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-11-04-image-evidence"
    after: "4e611a4822b2496a924c639b3a4de28aadf3a2096d16d0f7897ef800adb4a6f9"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-11-04-image-evidence"
    after: "7553260011a5bf221587f52e348e76fd45e14995a43f3ec965f2289763ec894a"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-11-04-image-evidence"
    after: "73302ed9463eab6c9b2abb88f288b47cdf4faf17b10944561d858888573f0b3b"
    decision: same-version
  - root: "event:web/deepseek-search-llm-request"
    previous: "2026-10-13-deepseek-search-thinking"
    after: null
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

每一处结构差异在读写两个方向上都安全。`principal` 在 user 与 retry 来源上可选，缺少它仍读作用户本人的提问；新增的身份变体只有在调用方主动提供时才会被授权层拒绝，因为 PrincipalMap 可合并扩展，授权层按 `kind` 匹配。已有 retry 记录保留 `rpcId` 与 `clientTimeZone`，读取这两个字段的消费者不变，只是写入方不能再附带可选的 `principal`。多语言消息列表新增的来源都带 `kind` 判别字段，属于可扩展来源联合；旧版读取方遇到未知 kind 会按无归属消息呈现，与其他生产者声明的 kind 完全一致。`skill-catalog.incomplete` 与 `subagent-settled.stopReason` 均为可选，历史记录仍然有效；读到缺失时把目录视为完整、不给出停止原因，正是这些历史记录写入时的行为。`web/deepseek-search-llm-request` 始终只是已下线搜索插件的仅日志记录，没有读取方消费它，旧日志在其版本代际内保持原样。

<a id="verification"></a>
## 验证

pnpm exec vitest run packages/api/session-controller/tests packages/session/session-title-llm/tests packages/subagent/subagent/tests packages/skill/tool-skill/tests packages/experimental/memory-dream/tests packages/experimental/liveshare/tests：全部通过。pnpm run verify-persistence-catalog 已重新生成并校验清单。

<a id="dev-note"></a>
## 开发备注

无。
