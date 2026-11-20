---
kind: upgrade-guide
description: "可配置提供商目录新增 sharedProtocol，自定义模型 API 创建表单按端点主机名预填协议。"
---

# 自定义路由按端点预填协议

[English](guide.md) | 中文

## 变更

`LlmConfigurableProvider`（由 `@tomato/llm/types` 与 `@tomato/api-remotes/client` 导出）新增可选字段 `sharedProtocol: string`。当某目录提供商的目录模型共用一种手工声明路由可命名的协议时，`llm-pi-ai` 报告该字段；混协议目录、或配置形状无法表达的协议则不报告。该字段为增量添加：既有消费方与已存 profile 不受影响。

Models 页的**自定义模型 API**创建表单据此预填协议字段，而非留空：自动态下按端点主机名精确匹配目录中 `defaultBaseURL` 主机名与 `sharedProtocol` 的配对，未知主机回退到第一个可选协议。手动选择后粘滞，再改端点也不重算。标签旁的 **?** 说明该规则；自动态下**获取可用模型**失败时，附上改用另一种常见中转形状的建议（OpenAI Chat Completions ↔ Anthropic Messages）。目录路由与 DeepSeek 卡片不变。

## 迁移

1. 无需更改配置。已声明路由保留其已存 `api`；建议只预填创建表单，绝不改写既有路由。
2. 读取目录的 SDK 消费方可读取 `entry.sharedProtocol`；将其缺省视为「无建议」而非某种协议。
3. 确认方式：打开**添加模型提供商 → 自定义模型 API**，输入目录端点如 `https://api.anthropic.com`，协议应预填为 Anthropic Messages；输入未知中转主机，应回退到 OpenAI Chat Completions。
