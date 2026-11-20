# Agent Note: 自定义路由的协议建议由端点决定，而非模型

Status: implemented

[English](2026-11-19-custom-route-protocol-advice.md) | 中文

## Problem

手工声明的 pi-ai 路由为其整个端点命名一种 wire 协议，而 Models 创建表单要求用户从无默认值的下拉框中挑选。不懂协议词汇的用户会选错：一个经 OpenAI 上游服务 `gpt-6` 的中转站，会以 `unsupported_parameter` 拒绝 Anthropic Messages 路由的 `max_tokens`，因为输出上限字段的拼写跟随协议而非模型。暴露此问题的请求携带中转站 request id，因此失败是网关处的协议不匹配，而非模型故障。

诱人的修法是一张把每个模型 id 映射到其协议的代码表，自动应用并对用户隐藏。这张表无法存在：同一模型 id 在不同端点走不同协议——`claude` 在 Anthropic 走 `anthropic-messages`、在多数中转站走 `openai-completions`、在 Bedrock 走 `bedrock-converse-stream`；`gpt` 在 OpenAI 走 `openai-responses`、在中转站走 `openai-completions`。协议是端点与模型共同的函数，一维模型表对除一个之外的所有端点都答错。

## Decision

协议仍是路由级属性。创建表单按端点预填，用户就地覆盖；任何机制都不改写已存路由。

[`@tomato/llm-pi-ai`](../../../../packages/llm/llm-pi-ai/README.zh.md) 在每个可配置提供商目录条目上报告 `sharedProtocol`，前提是其已安装目录模型共用一种手工声明路由可命名的协议（`catalogSharedApi`，过滤到 `supportedProtocols()`）；混协议目录（如 OpenRouter）、或配置形状无法表达的共用协议（如 Mistral Conversations）则不报告。该字段是 [`LlmConfigurableProvider`](../../../../packages/llm/llm/src/types.ts) 的可选增量，由既有目录 detach 与 wire 重导出携带。

浏览器自行派生建议，而非接收一张算好的表：[`protocol-advice.ts`](../../../../packages/client/ui-settings-models/src/client/protocol-advice.ts) 把每个目录条目的 `defaultBaseURL` 主机名与其 `sharedProtocol` 配对，丢弃两个提供商意见相左的主机名，并按精确主机名匹配所填端点——小写、忽略端口与路径——未知主机一律回退到第一个可选协议。精确匹配是刻意的：pi-ai 自己的 `detectCompat` 用子串 `baseUrl.includes(...)`，会把 `api.anthropic.com.evil-relay.example` 误判成 Anthropic。回退值是 OpenAI 兼容网关方言，即多数中转站所说的最低公约数，也正是 `supportedProtocols()` 把它排第一的原因。

[`CustomProviderCard`](../../../../packages/client/ui-settings-models/src/client/CustomProviderCard.tsx) 让协议字段处于自动态，直到用户显式选择：自动态随每次端点编辑重算，手动选择在此后的端点编辑中粘滞。标签旁的静态 **?** 悬停说明该规则。**获取可用模型**在自动态下失败时，[`ModelListEditor`](../../../../packages/client/ui-settings-models/src/client/ModelListEditor.tsx) 在失败文本后附上改用另一种常见中转形状的确定性建议（OpenAI Chat Completions ↔ Anthropic Messages）；手动态不给建议。建议只作用于自定义 API 创建表单——目录路由与 DeepSeek 卡片自带协议，不显示路由级协议字段。

## Alternatives considered

**模型 id→协议表，自动应用并隐藏。** 否决，因为协议依赖端点：该表会在每个说 OpenAI 的中转站上配错 `claude`、在每个 Anthropic 形状的中转站上配错 `gpt`，而隐藏字段会移除唯一的纠正路径。端点主机名建议让常见场景零心智，同时把覆盖入口留在明面。

**经一键适配改指既有路由协议。** 否决，因为中转站合法地以非原生协议服务某家族，家族默认冲突规则会无休止地标记正确配置；且改路由协议还会改其端点路径形状与鉴权头——不是无副作用的字段建议。适配继续绝不建议协议；建议只在创建时生效。

**手写主机名表。** 否决，因为 `PROVIDER_DATA` 已携带每个目录端点、`catalogSharedApi` 已能回答共用协议；第二份副本会在每次 pi-ai 升级时漂移，并漏掉反直觉事实（如 MiniMax 原生端点说 `anthropic-messages`）。派生让一个事实一个家，并随目录升级。

**Host 算好的建议映射或专用 Remote。** 否决，因为表单已经经 `listProviders` 取回目录；每条目一个可选标量即可让客户端零额外往返地派生表，把主机名匹配——纯展示逻辑——留在浏览器。发现时给建议被直接否决：发现要先有协议才能发请求。

**后缀或路径感知的主机名匹配。** 否决，因为区域变体本就是独立目录条目，`/v1` 也出现在 Anthropic 原生中转站上，而后缀匹配会重新引入精确匹配所要防止的子串误判。

## Consequences

常见中转场景无需协议知识：未知主机取 OpenAI 兼容回退（多数中转站所说），已知厂商端点取其原生协议。代价是同主机多协议端点（MiniMax）可能预填错一次，目录未收录的 Anthropic 原生中转站会先回退到 OpenAI 直到用户切换——两者都就地纠正，此后选择粘滞。明面字段与失败建议是纠正路径；没有静默自动切换，也没有以不同鉴权形状重发凭据。

目录新增一个 wire 可见的可选字段，SDK 消费方可读取 `sharedProtocol`，并须将其缺省视为「无建议」。创建表单的 aria 输出新增帮助按钮，由 `declared-create` Models-settings golden 钉住。建议仅供参考：`cordis.patch.yml` 与已存 profile 仍是路由服务内容的唯一权威。

## Related

- [第三方模型适配数据集](2026-11-19-model-adaptation-dataset.zh.md)——填充推理与 compat 的姊妹配置期建议，同样绝不建议协议。
