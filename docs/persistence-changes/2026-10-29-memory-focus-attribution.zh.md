---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-10-29-memory-focus-attribution

[English](2026-10-29-memory-focus-attribution.md) | 中文

## 概述

为已记录的模型上下文新增 experimental-memory 与 experimental-focus 两个归属来源类型。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

```yaml persistence-change
schemaVersion: 1
id: 2026-10-29-memory-focus-attribution
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-28-tomato-namespace"
    after: "edd257f0e29e7f57c5f5d131e95dd8ef0c69aa73a86753971005b471f850c3db"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-28-tomato-namespace"
    after: "86877e6a31f0e29ec48c4e75929297b0e69523b684bb8cdc2a776b8e8ed01f5a"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-28-tomato-namespace"
    after: "62e6e682a6ab93b4b25a1b604fd700abe031f792c18de76841556962696c94d7"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-28-tomato-namespace"
    after: "c349e1235c48af8b64f1e5c36955488940daf633fd9d703b7a9e2714073cd551"
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

已有消息和记录不变。未加载记忆或专注插件的读取方会保留这两个来源类型及其 JSON 元数据，并把记录的文本作为普通上下文派生。每个生产方只读取自己的类型：记忆工具用它避免重复注入未变化的置顶快照，专注插件用它标注失败记录和提醒。两个类型都不授予权限，也不改变回放语义。

<a id="verification"></a>
## 验证

pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory packages/experimental/focus packages/experimental/muse-bundle：51 个测试通过，源码覆盖率 100%。组合包测试通过真实 profile Loader 启动随包发布的行，并断言模型请求中包含已记录的置顶快照和目标轮次失败记录。

<a id="dev-note"></a>
## 开发备注

无。
