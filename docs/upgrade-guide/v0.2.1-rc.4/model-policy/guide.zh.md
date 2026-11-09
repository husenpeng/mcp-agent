---
kind: upgrade-guide
description: "自定义网关路由继承第一方模型能力与 Anthropic 缓存标记；可选的 modelPolicy 允许清单会以 MODEL_NOT_ALLOWED 拒绝未列出的模型。"
---

# 自定义路由继承模型能力，模型策略可以拒绝模型

[English](guide.md) | 中文

## 变更

pi-ai 未提供的 `@tomato/llm-pi-ai` 路由现在会在折叠网关前缀、点号版本和日期/版本后缀之后，用每个声明的模型 id 查询第一方 catalog。容量、模态和 `promptCache` 在模型条目未覆盖时来自厂商条目。兼容性与推理元数据只在路由使用厂商协议时继承；协议改接保留部署自己的声明。pi-ai 已提供的路由以自身目录为准。

通过 OpenAI 兼容自定义路由访问的 Anthropic Messages 模型，现在会在路由或模型未点名该开关时收到 `cacheControlFormat: anthropic`。若网关拒绝该标记，可用 `cacheRetention: none` 退出。

`modelPolicy` 是新的可选插件级允许清单。`enabled` 为 true 时：

- `local` 以快照方式点名部署当前模型；
- `releaseDates` 以 `provider/model` 为键记录 ISO 日期，放行所有日期不早于 `recentSince` 的模型，无需第二份列表；
- `recent` 保留为没有清单条目时的显式日期补充；
- 其他每个已配置模型都被拒绝。

`LlmModelInfo` 与浏览器 `ModelCatalogModel` 新增可选 `blockedReason`。`listModels` 返回所有已配置模型并标记被拒绝的组合，而不是过滤掉它们；`modelAvailable` 对带 `blockedReason` 的组合返回 false，`prepareCall`/`stream` 会在提供方 I/O 之前抛出 `MODEL_NOT_ALLOWED`。输入框把被拦截模型渲染为带本地化原因的禁用行。

## 迁移

1. 升级后检查自定义网关路由。它们的模型可能改为报告厂商的 `contextWindow`、`maxTokens` 和模态，而不是路由回退值；Anthropic 模型也可能开始发送缓存标记。若网关提供不同容量或不接受该标记，请显式设置字段。
2. 要启用允许清单，在 `llm-pi-ai` 配置的 `providers` 旁加入 `modelPolicy` 并设 `enabled: true`。把部署保留的每个模型写入 `local`；未列出的模型即使已配置也会被拒绝。为近期模型加入带日期的 `releaseDates` 条目，或在没有清单时加入带日期的 `recent` 条目。发布日期清单需要 `recentSince`；格式错误的键和日期会在加载时失败。
3. 更新 `LlmModelInfo` 与 `ModelCatalogModel` 的消费方以处理 `blockedReason`：不要提供被拦截模型用于选择或路由，并展示原因。`modelAvailable` 已经会拒绝它。
4. 路由/模型不在策略内时，请求会返回 `MODEL_NOT_ALLOWED`。错误发生在任何提供方请求之前；选择允许的模型后重试。省略策略或 `enabled: false` 时所有模型可用。
5. 策略只覆盖 `@tomato/llm-pi-ai` 路由。`@tomato/llm-deepseek` 路由和其他适配器族不在其范围内。
6. Session 格式不变。新字段是请求时元数据和错误码；被拦截模型不会从 Session 日志中移除。