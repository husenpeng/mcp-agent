---
description: "embedding 能力接缝（ctx.embeddings）：把文本批次转成向量，供本地语义排序使用，供维护者添加提供方或消费方。"
kind: "package-reference"
---

# @tomato/experimental-embeddings

[English](README.md) | 中文

## 概述

定义可选的 `ctx.embeddings` 服务：提供方把一批文本转成声明长度的向量。消费方通过 `ctx.get('embeddings')` 读取它，因此没有提供方的组合仍保留词法行为。本包只提供契约；[`@tomato/experimental-embeddings-http`](../embeddings-http/README.zh.md) 是第一个提供方。

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

### 加入组合

挂载一个提供方。本包没有配置，也不会自行注册服务。

### 嵌入一批文本

```ts
import type { Context } from '@tomato/cordis'

declare const ctx: Context

const embeddings = ctx.get('embeddings')
if (embeddings !== undefined) {
  const vectors = await embeddings.embed({ texts: ['brand tone', 'budget approval'] })
}
```

提供方按调用方顺序为每条文本返回一个向量。`model` 是提供方的模型标识，`dimensions` 是向量长度；`0` 表示提供方只在第一次响应后才知道长度。

### 编写提供方

继承 `Embeddings`，调用 `super(ctx, 'embeddings')`，并实现 `embed`。预期失败用 `EmbeddingsError` 报告，code 为 `timeout`、`provider` 或 `invalid-response`；调用方取消按自身的 abort 错误向上传播。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

该类继承 Cordis `Service`，因此同一 context 中的第二个提供方会按标准重复服务规则抛错。`embed` 接收调用方文本与可选的 `AbortSignal`；批处理、传输、超时与响应校验都由提供方负责。契约不要求缓存，也不规定重试：由消费方决定一次失败的 embedding 是否降级自己的功能。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [HTTP 提供方](../embeddings-http/README.zh.md) —— 带凭据解析的 OpenAI 兼容端点。
- [记忆服务](../memory/README.zh.md) —— 第一个消费方，把向量相似度并入记忆搜索。

-----

<a id="model-experience"></a>
## 模型体验

无；该接缝声明一个可选的向量服务，不添加提示词、工具或上下文。

#### KV Cache effect

无。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- **本包没有提供方** —— 只挂载本包的组合没有 `ctx.embeddings`，每个消费方都会回退。
- **没有批处理或重试策略** —— 两者都由提供方拥有；接缝不做承诺。
- **相似度未定义** —— 向量是不透明的数值；如何比较由消费方定义。
- **每个 Host 一个提供方** —— 重复服务规则不允许按工作区或按模型路由。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

消费方通过 `ctx.get('embeddings')` 取得这个可选服务，没有提供方的组合仍能运行。传输由提供方拥有并上报累计用量；seam 不加重试，也不缓存向量。

</details>
