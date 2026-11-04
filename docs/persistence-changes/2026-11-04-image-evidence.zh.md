---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-11-04-image-evidence

[English](2026-11-04-image-evidence.md) | 中文

## 概述

向已记录的模型上下文新增 image-evidence 日志事件与归属类型。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

```yaml persistence-change
schemaVersion: 1
id: 2026-11-04-image-evidence
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-29-memory-focus-attribution"
    after: "1e7476b2b4ddc982aac967cd5ad26b4d31ccfc87fb25c68e9ee4b468118f28d9"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-29-memory-focus-attribution"
    after: "da5aeac9717470c7e7dfddf229d82bc2064f6f235cc182fbbeddaab56ac5707a"
    decision: same-version
  - root: "event:image/evidence"
    previous: null
    after: "293fc1c00c43d7945f9069adce482ef3c4d7b08ca13d6e411800007f9c785040"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-29-memory-focus-attribution"
    after: "07d1980452c7af1d700aa048d87285cacfd680ae4b50a368e20aa8f7a92f4654"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-29-memory-focus-attribution"
    after: "978741f47f1f603abc1fc38d88d0865b3d4fc66b2018739d85c72e20a27beb81"
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

已有消息与记录不变；新类型与事件只在挂载 image-evidence 插件时写入。未挂载该插件的读取方会保留 @tomato/image-evidence 来源类型及其 JSON 元数据，并把记录的文本按普通上下文推导，与此前的插件归属类型一致。image/evidence 是只写入日志的持久记录：它从不携带 surfaceOp，不增加模型历史，只有插件自己的投影会折叠它；它记录引擎身份、各次尝试的结果和用量，不包含图片字节。该类型只标记辅助视觉请求的输入，不授予权限，也不改变回放解释。

<a id="verification"></a>
## 验证

pnpm exec vitest run packages/llm/image-evidence packages/core/session/tests：27 个测试文件、610 个测试通过，其中包括从会话日志读回 image/evidence 的组合测试和折叠该事件的投影测试。

<a id="dev-note"></a>
## 开发备注

无。
