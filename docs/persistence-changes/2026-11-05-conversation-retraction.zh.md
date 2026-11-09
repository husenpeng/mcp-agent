---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-11-05-conversation-retraction

[English](2026-11-05-conversation-retraction.md) | 中文

## 概述

新增持久化的 conversation/retraction 事件，让用户把末尾这一轮对话从派生模型历史中撤回。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

```yaml persistence-change
schemaVersion: 1
id: 2026-11-05-conversation-retraction
baseline: false
changes:
  - root: "event:conversation/retraction"
    previous: null
    after: "ed99eec168ee791a94081ab3cd56e505975271dd69177c89d7937cfb93133737"
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

仅新增事件类型。没有撤回事件的会话，其模型历史与之前完全一致。旧 V4 读取器遇到不在已知集合、且没有 ignorable 标记的事件时，会在恢复、修改或恢复性截断之前拒绝该会话，因此不会把撤回的提示词重新当作模型输入。Session 头部仍为 V4，现有事件、属性与载荷含义均未改变。

<a id="verification"></a>
## 验证

表层折叠、派生历史、session-query 分类、V4 生命周期关系、命令校验和 Web Chat 渲染覆盖了撤回、仅叶节点限制、替换节点拒绝以及 fork 边界拒绝。持久化 schema 抽取把新根报告为无前驱的新增。

<a id="dev-note"></a>
## 开发备注

无。
