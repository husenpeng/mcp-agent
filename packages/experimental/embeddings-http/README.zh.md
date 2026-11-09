---
description: "ctx.embeddings 的 OpenAI 兼容 HTTP 提供方：批量请求、凭据解析与响应校验。"
kind: "package-reference"
---

# @tomato/experimental-embeddings-http

[English](README.md) | 中文

## 概述

把 `ctx.embeddings` 变成一个批量 `POST <baseUrl>/embeddings` 客户端，适用于任何 OpenAI 兼容端点，包括 Ollama 这类回环服务。提供方按 `batchSize` 拆分批次，把每条文本截到 `maxInputChars`，通过凭据引用解析 bearer key，并在消费方看到结果之前校验每个返回向量。挂载后记忆服务会自动使用它，把返回的向量存入本地存储域，并且只重新发送查询与向量缺失或过期的记录。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

把它作为 Host 行挂载。Muse 配置包把它与记忆一起提供，默认禁用并指向本机 Ollama；启用该行后，它会把配置提供给 Plugins 的**向量提供方**页面。该页只读显示运行中的端点、模型、向量长度与凭据名，开关语义检索，并从浏览器发送一次测试嵌入请求。模型与长度保留为 Host 配置字段，供未来迁移，不作为页面控件。回环端点不需要 key 时无需其他服务；远程端点应通过 `apiKeyEnv` 命名其 key。

```yaml
- name: '@tomato/experimental-embeddings-http'
  config:
    baseUrl: http://127.0.0.1:11434/v1
    model: nomic-embed-text
    dimensions: 768
```

| 字段 | 默认 | 含义 |
|---|---|---|
| `baseUrl` | 必填 | OpenAI 兼容基础地址；提供方追加 `/embeddings` |
| `model` | 必填 | 端点接受的 embedding 模型 id |
| `apiKeyEnv` | 未设置 | 保存 bearer key 的凭据引用；省略则不发送授权头 |
| `dimensions` | `0` | 期望的向量长度；`0` 采用第一次响应的长度 |
| `enabled` | `true` | 记忆搜索是否可以使用该提供方；`false` 时仍挂载但搜索保持词法 |
| `timeoutMs` | `15000` | 单次 HTTP 请求的截止时间 |
| `batchSize` | `32` | 每次 HTTP 请求的文本数 |
| `maxInputChars` | `4000` | 发送前每条文本保留的字符数 |

生成的[配置目录](../../../docs/config-catalog.zh.md#tomatoexperimental-embeddings-http)是全部接受字段的完整来源。

远程端点必须使用 HTTPS；只有 `localhost`、`127.0.0.1` 与 `::1` 接受明文 HTTP。key 先经 `ctx.credentials` 解析，再经启动环境解析，因此保存的值无需重启即可用于下一次请求。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

`embed` 对空批次直接返回，否则按 `batchSize` 切片逐次发送请求，并保持调用方顺序。每次请求用 `AbortSignal.any` 合并调用方信号与超时，发送 `{ model, input }`，只接受数量与向量长度同请求一致的 `data` 数组，元素为 `{ index, embedding }`；显式 `dimensions` 也必须一致。失败分类为 `provider`（HTTP 错误、网络、缺少凭据）、`timeout` 或 `invalid-response`（非 JSON 响应体、数量或长度不符、格式错误或重复索引）。调用方取消按原样向上抛出。提供方从不重试。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Embedding 接缝](../embeddings/README.zh.md) —— 本包实现的契约。
- [记忆服务](../memory/README.zh.md) —— 把这些向量并入搜索。

-----

<a id="model-experience"></a>
## 模型体验

无；提供方只响应消费方的 embedding 调用，任何对模型可见的影响都由消费方拥有。

#### KV Cache effect

无。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- **单一端点与模型** —— 一行服务一个模型；第二个模型需要另一个 Host。
- **没有缓存或去重** —— 重复文本每次都会重新嵌入。
- **截断是静默的** —— 超过 `maxInputChars` 的文本在发送前被丢弃。
- **不重试** —— 暂时性的提供方失败会到达消费方，由它回退到自己的词法行为。
- **隐私** —— 记录文本离开本机；端点及其运营方拥有这些数据。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

每次 `embed()` 按 `batchSize` 把文本拆成多个请求，且从不重试；非回环的 `baseUrl` 必须使用 HTTPS，bearer key 来自凭据引用。`dimensions` 在部署未设置时保持 0，由首次响应给出向量长度。

</details>
