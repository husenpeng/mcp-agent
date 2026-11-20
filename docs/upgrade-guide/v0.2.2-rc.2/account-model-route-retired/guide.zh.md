---
kind: upgrade-guide
description: "账号 LLM 路由退役；默认模型初始化改用已注册的第三方 API 提供方，账号退出登录快照随之移除。"
---

# 账号模型路由退役

[English](guide.md) | 中文

## 变更

产品不再挂载账号专用的 LLM 提供方。`@tomato/llm-deepseek-account` 与其 `deepseek-account` 路由不再参与组合，`snapshots/sdk/account-provider-signout` 场景及其 fixture 一并退役。

当所有提供方都没有配置 API key 时，`initializeDefaultModel()` 现在从已注册提供方目录中选择第一个可用模型，不再等待账号登录，也不再优先选择账号模型。凭据检查不再对账号路由做特殊处理。

## 迁移

1. 配置部署实际使用的第三方 API 提供方与模型；账号身份界面不再提供模型路由。
2. 删除 profile 中引用 `@tomato/llm-deepseek-account` 的行或 overlay；缺失的包不再有替代路由。
3. 从本地工具中移除对已退役 `account-provider-signout` 快照的引用。包含旧路由的历史会话记录保持为历史记录。