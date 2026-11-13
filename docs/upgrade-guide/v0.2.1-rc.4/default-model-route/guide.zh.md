---
kind: upgrade-guide
description: "基础组合预置 blueai-anthropic Claude 路由，并默认选用 claude-opus-5-5；每人在模型页存入自己的 BLUEAI_API_KEY。"
---

# 基础组合预置默认 Claude 路由

[English](guide.md) | 中文

## 变更

`@tomato/base` 现在为 `@tomato/llm-pi-ai` 配置一条路由 `blueai-anthropic`：以原生 `anthropic-messages` 访问 `https://bmc-llm-relay.bluemediagroup.cn`，`cacheRetention: short`。模型条目只写 `claude-opus-5-5`、`claude-sonnet-5-5` 与 `claude-haiku-5-5` 的 id；容量、模态、推理档位与提示缓存行为来自已安装的第一方目录。路由点名凭据引用 `BLUEAI_API_KEY`；安装包不含任何密钥。

`agent-default-model` 现在选用 `blueai-anthropic` / `claude-opus-5-5`，`reasoningEffort: high`，不再是空值。存入 key 之前，该路由不列出模型，其上的请求以 `MISSING_CREDENTIAL` 失败。

## 迁移

1. 没有 profile 级 `llm-pi-ai` 配置的用户打开**设置 → 模型**，在 **BlueAI Claude** 上填入自己的 key，保留默认模型即可。key 只存入本人的 `$TOMATO_HOME/.credentials.yaml`。
2. profile `cordis.patch.yml` 中已配置 `llm-pi-ai` 时，它整段替换 bundle 配置，因此那里没有预置路由。保留 profile 路由，或删除该行以采用预置路由。在模型页保存会把当时生效的完整配置（含预置路由）写进 profile；此后 bundle 对该路由的改动不会再到达该 profile。
3. 设置了 `agent-default-model` 的 profile 保留自己的选择。依赖空默认值让新会话先选模型的 profile，现在会以 `claude-opus-5-5` 开始。

验证：在全新的 `$TOMATO_HOME` 下，模型页显示 **BlueAI Claude** 且 key 缺失；填入 key 后，输入框选中 `claude-opus-5-5`，会话第二步报告非零的缓存读取 token。
