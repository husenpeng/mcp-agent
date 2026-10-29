---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-10-29-memory-focus-attribution

[English](2026-10-29-memory-focus-attribution.md) | 中文

## 概述

向已记录的模型上下文添加 experimental-memory、experimental-focus 与 experimental-tool-memory 三种归属类型。

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
    after: "b51e45845d3f93a468e074920e35b10bc0eccff54996e5b58a58d1fa04d79c7e"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-28-tomato-namespace"
    after: "ff42e532e68e4974890e489a57673e7245d18b1ad5d065d16616141b3e3f579d"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-28-tomato-namespace"
    after: "86642fe542042af40c12990a7389131d6254093e19af555d83b67042b01d64e8"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-28-tomato-namespace"
    after: "5e9e1a01674a4a8c7b534c5a34ecc3cb08fb17efb83ff2383b36edc727b43c82"
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

已有消息和记录不变。未挂载记忆或专注插件的读取方会保留 experimental-memory 与 experimental-focus 来源类型及其 JSON 元数据，并把记录的文本作为普通上下文。每个写入方只读取自己的类型：记忆工具用它抑制未变化的快照，专注插件用它标注失败记录和提醒。experimental-tool-memory 类型只标记辅助查询扩展请求的输入，从不出现在对话界面上；该请求及其结果以可忽略的插件记录 plugin:tool-memory/query-expansion 记入日志。任何类型都不授予权限，也不改变回放解释。

<a id="verification"></a>
## 验证

pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory packages/experimental/focus packages/experimental/muse-bundle packages/tomato/gateway：所有测试通过，memory、tool-memory、focus 源码以及网关账号状态覆盖率 100%。组合包测试通过真实 profile Loader 启动随包发布的行，并断言模型请求中已记录的画像与置顶快照以及目标轮次失败记录。

<a id="dev-note"></a>
## 开发备注

无。
