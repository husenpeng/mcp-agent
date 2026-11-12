# Agent Note: 提示词缓存方言与「工具+推理」能力属于端点事实

Status: implemented

[English](2026-11-12-prompt-cache-dialect-and-tool-effort-capability.md) | 中文

## 问题

有两个塑造请求的事实属于端点而非模型，而适配器两个都无法表达。

提示词缓存原先按模型家族推断：[`defaultCacheCompat`](../../../../packages/llm/llm-pi-ai/src/catalog.ts) 只要规范 id 匹配到 `anthropic-messages` 目录条目、且路由是 `openai-completions`，就加上 Anthropic 的 `cache_control` 标记。这只覆盖网关背后的 Claude。relay 上的 OpenAI 系模型、用私有别名转售 Claude 模型的网关、以及只在 `prompt_cache_key` 下缓存的端点，都没有办法声明自己接受什么，于是缓存要么不存在，要么依赖一个看不见端点的推断。

工具配对在两个方向上都是不可见的。部分 OpenAI 兼容 relay 拒绝函数工具与 `reasoning_effort` 同时出现——`Function tools with reasoning_effort are not supported for gpt-6.1-sol in /v1/chat/completions. To use function tools, use /v1/responses or set reasoning_effort to 'none'`——而 Agent 回合始终声明工具，因此这类模型在任何非 `off` 强度下每一步都失败。没有任何 compat 开关能表达这一点：`supportsReasoningEffort` 表示该字段被接受，不表示它与工具同时被接受。部署只能记住这条规则，选错就以携带 `INVALID_REQUEST` 的失败回合收场。

## 决策

- `cache` 是路由级默认值，并允许逐模型覆盖。`dialect` 指定端点接受的标记：`anthropic`（系统提示词、最后一个工具与最后一条消息上的断点；仅 `openai-completions`）、`key`（`prompt_cache_key`，在 `openai-completions` 上固定长保留期，因为那是 pi-ai 在该协议发送该键的唯一条件）、`implicit`（不发送内容；端点自行复用稳定前缀）与 `none`（不发送内容，并把请求保留期设为 `none`）。`retention` 为单个模型覆盖路由的 `cacheRetention`，这是路由级单一值无法做到的事——它无法描述同时包含已缓存与未缓存模型的路由。
- Anthropic 推断只作为最后兜底保留：两层都没有声明方言时，`openai-completions` 路由上的 Anthropic 目录模型仍会得到该标记。任何显式声明的方言都会替换它。
- `toolsWithReasoning: never` 记录该拒绝，路由级并允许逐模型覆盖。适配器随后发送不带推理强度的请求，并通过 `onCapabilityDegrade` 报告降级，由插件写入日志。
- 匹配该拒绝措辞的提供方 400 会在进程内被学习：适配器把同一回合去掉推理强度重试一次，然后记住该配对。只有在该次尝试尚未产出内容时才允许重试，因为重放一段文本已经进入转录的流会重复它。
- `@tomato/llm-pi-ai/openai-probe` 探测两个 OpenAI 协议的可达性、工具使用、工具/推理强度配对、缓存读取与 `prompt_cache_key` 接受情况，并渲染这些观测支持的配置。`scripts/probe-endpoint.ts` 运行它。

## 考虑过的替代方案

**为每个标记字段提供一个开关。** 直接暴露 `cacheControlFormat` 与 `supportsLongCacheRetention` 本来就可以，也正是每个部署此前必须做的事；它命名的是 pi-ai 的字段而非端点的行为，而且完全无法表达 `implicit` 或 `none`。

**在自定义路由上始终发送缓存键。** 被忽略的地方无害，被拒绝的地方就是 400；探测能回答是哪种，方言把答案留在配置里。

**把一个拒绝该配对的模型的思考等级全部去掉。** 这等于取消了选择，可同一模型在请求不带工具时仍然会思考，而且会在每个选择器里错误描述该模型的能力。

**在内容已经流式输出后重试。** 该回合会输出两遍文本，而转录只记录一份，第二次尝试还会重新计费整个前缀。

**持久化学到的拒绝。** 那是关于运行中端点的观测；持久记录需要在网关升级时失效处理，而探测是更便宜的真相来源。

## 测试

- 在 `openai-completions` 上声明 `anthropic` 方言，会在系统提示词、最后一个工具与最后一条消息上发断点；同一方言在 `anthropic-messages` 上会让解析失败并指出该协议本身已携带断点。
- 在 `openai-completions` 上声明 `key` 方言，会发送 `prompt_cache_key` 与 24 小时保留期，并拒绝短保留期；在 `openai-responses` 上不添加任何开关。
- 声明 `none` 方言既不发送标记也不发送键，并拒绝与之矛盾的保留期。
- 单个模型的 `retention` 覆盖路由的默认值，单个模型的 `toolsWithReasoning` 覆盖路由的默认值。
- 没有任何声明时，`openai-completions` 路由上的 Anthropic 目录模型保留推断出的标记。
- `toolsWithReasoning: never` 对携带工具的请求不发送推理强度，对不带工具的请求保留推理强度。
- 措辞为该拒绝的 400 会恰好重试一次且不带推理强度，同一进程的下一次请求不再发送；无关的 400 不重试。
- 探测从 `prompt_tokens_details.cached_tokens`、`prompt_cache_hit_tokens` 或 `cache_read_input_tokens` 读取缓存计数，并且只在 `openai-responses` 接受工具/强度配对时渲染 `api: openai-responses`。

## 风险

- **声明的方言在被缓存读取证明前只是声明。** 网关可能接受 `cache_control` 却不执行；只有重复前缀上的 `cacheReadTokens` 才是证据，这也是探测去实测而不去推断的原因。
- **`openai-completions` 上的 `key` 还会发送 `prompt_cache_retention: 24h`。** 拒绝该字段的网关需要改用 `implicit` 或 `none`；探测会在部署依赖该键之前报告其是否被接受。
- **学到的拒绝只在进程内。** 重启后的进程会在每条路由与模型上先付出一次被拒请求，然后才停止发送该推理强度。
- **重试会让失败的那次尝试计费翻倍。** 它换来一个完成的回合而非失败的回合，这与提供方重试策略本来就做的取舍相同。
- **`implicit` 没有说明前缀本身的任何性质。** 前缀稳定性仍然取决于提示词纳入与工具顺序，本字段不控制它们。

## 影响

- 缓存行为成为配置，因此探测结果可以粘贴进路由，而不需要改适配器。
- Anthropic 推断不再是机制，只是兜底；部署若想为同一模型使用别的标记，声明即可胜出。
- 一条路由可以混用已缓存与未缓存模型，也可以只让一个模型拒绝工具/强度配对。
- 对[模型允许清单与跨提供方能力回退](../../proposed/architecture/2026-11-05-model-allowlist-and-catalog-capability-fallback.zh.md)构成部分取代的是它的缓存条目：标记不再只能推断，而是可声明、可探测。那条笔记仍因允许清单机制而保持活跃。