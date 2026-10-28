---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-10-28-tomato-namespace

[English](2026-10-28-tomato-namespace.md) | 中文

## 概述

把会话标题消息的来源 kind 从 `dsh-session-title-llm` 改为 `@tomato/session-title-llm`。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

```yaml persistence-change
schemaVersion: 1
id: 2026-10-28-tomato-namespace
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-22-action-card-status"
    after: "996ff51295d8c4bbe3caa4fb2cd0facc9c7b6d22806aa2efe4c3354dfed53013"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-22-action-card-status"
    after: "1896fea192821ffd98706a7d67e48e83fc538ee231f537da0f0ea48dd4336018"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-22-action-card-status"
    after: "c2b8789dfe88043e92fb88aa38176e6b93040984e07cae9f929607181231b288"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-22-action-card-status"
    after: "660d9583025ca7231c1b7f5f02c4db95201a854a2e93ad80dec0d3dc399e9e54"
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

读写的两个方向都安全。v3→v4 迁移会把已发布 V3 的插件 id 与直接 source kind 改写为新值。已经以 v4 写入的会话保留旧 kind，而 `MessageSourceMap` 仍声明它，因此当前 reader 同时接受两种拼写；新的写入使用新 kind。判别值是显式枚举，不需要提升 header 版本。

<a id="verification"></a>
## 验证

pnpm exec vitest run packages/session/session-format-v3-to-v4 packages/session/session-title-llm packages/session/session-format-v0-to-v1：517 个测试通过。

<a id="dev-note"></a>
## 开发备注

无。
