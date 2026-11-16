# Tomato Phone 近半年模型缓存实测

生成时间：2026-11-16T08:49:06Z；方法：每个模型 3 轮相同前缀（约 1.3k tokens）。先用 OpenAI 兼容协议，cached=0 时再用 Anthropic Messages 协议；只记录用量，不记录 Key。

## 结论摘要

- OpenAI 协议有缓存：10 个模型。
- OpenAI 无、Anthropic 协议有缓存：9 个模型（Claude 全系、DeepSeek-V4-Pro-0813、DeepSeek-V4.1-Flash）。
- 两种协议都没有缓存：14 个模型。
- 不可用/限流/协议不支持：4 个模型。

| 厂商 | 模型 | OpenAI cached | Anthropic cached | 结论 |
|---|---|---:|---:|---|
| DeepSeek | `DeepSeek-V4-Flash` | 0 | 0 | 无缓存（OpenAI 0） |
| DeepSeek | `DeepSeek-V4-Flash-0731` | 0 | 0 | 无缓存（OpenAI 0） |
| DeepSeek | `DeepSeek-V4-Pro` | 1024 | 0 | OpenAI 有缓存 |
| DeepSeek | `DeepSeek-V4-Pro-0813` | 0 | 1024 | Anthropic 有缓存（OpenAI 无） |
| DeepSeek | `DeepSeek-V4.1-Flash` | 0 (未上报缓存计数) | 1280 | Anthropic 有缓存（OpenAI 无） |
| DeepSeek | `DeepSeek-V4.1-Flash-1017` | 1280 | 0 | OpenAI 有缓存 |
| 字节/豆包 | `Doubao-Seed-2.0-pro` | 0 | 0 | 无缓存（OpenAI 0） |
| 字节/豆包 | `Doubao-Seed-2.0-Code` | 0 | 0 | 无缓存（OpenAI 0） |
| 字节/豆包 | `Doubao-Seed-2.1-pro` | 0 | 0 | 无缓存（OpenAI 0） |
| 字节/豆包 | `Doubao-Seed-2.1-turbo` | 0 | 0 | 无缓存（OpenAI 0） |
| 字节/豆包 | `Doubao-Seed-2.1-lite` | 0 | 0 | 无缓存（OpenAI 0） |
| MiniMax | `MiniMax-M2.7` | 0 | 0 (未上报缓存计数) | 无缓存（OpenAI 0） |
| MiniMax | `MiniMax-M3` | 1313 (未上报缓存计数) | 0 | OpenAI 有缓存 |
| MiniMax | `MiniMax-M3.1-Flash` | 1024 | 0 | OpenAI 有缓存 |
| Anthropic | `claude-opus-4-7` | 0 | 2841 | Anthropic 有缓存（OpenAI 无） |
| Anthropic | `claude-opus-4-8` | 0 | 2447 | Anthropic 有缓存（OpenAI 无） |
| Anthropic | `claude-opus-5` | 0 | 2446 | Anthropic 有缓存（OpenAI 无） |
| Anthropic | `claude-opus-5-5` | 0 | 2448 | Anthropic 有缓存（OpenAI 无） |
| Anthropic | `claude-sonnet-5` | 0 | 2513 | Anthropic 有缓存（OpenAI 无） |
| Anthropic | `claude-sonnet-5-5` | 0 | 2443 | Anthropic 有缓存（OpenAI 无） |
| Anthropic | `claude-haiku-5-5` | 0 | 2446 | Anthropic 有缓存（OpenAI 无） |
| Google | `gemini-3.5-flash` | 0 | 0 (HTTP 400) | 无缓存（OpenAI 0）；Anthropic 协议不支持 |
| Google | `gemini-3.7-flash` | 0 | 0 (HTTP 400) | 无缓存（OpenAI 0）；Anthropic 协议不支持 |
| Google | `gemini-3.8-flash` | 0 (HTTP 429) | 0 (HTTP 400) | 不可用/限流 |
| Google | `gemini-4-argon` | 0 (HTTP 403) | 0 (HTTP 400) | 不可用/限流 |
| OpenAI | `gpt-5.4` | 0 | 0 | 无缓存（OpenAI 0） |
| OpenAI | `gpt-5.4-mini` | 1152 | 0 | OpenAI 有缓存 |
| OpenAI | `gpt-5.5` | 1152 | 0 | OpenAI 有缓存 |
| OpenAI | `gpt-5.6-sol` | 0 (HTTP 400) | 0 (HTTP 400) | 不可用/限流 |
| OpenAI | `gpt-6-sol` | 0 (HTTP 400) | 0 (HTTP 400) | 不可用/限流 |
| 智谱 | `glm-5.3` | 0 (未上报缓存计数) | 0 (未上报缓存计数) | 无缓存（OpenAI 0） |
| Moonshot | `kimi-k2.6` | 1024 (未上报缓存计数) | 0 | OpenAI 有缓存 |
| Moonshot | `kimi-k3` | 1024 (未上报缓存计数) | 0 | OpenAI 有缓存 |
| Moonshot | `kimi-k3.1-pro` | 1024 (未上报缓存计数) | 0 | OpenAI 有缓存 |
| 阿里 | `qwen3.6-plus` | 0 (未上报缓存计数) | 0 (未上报缓存计数) | 无缓存（OpenAI 0） |
| 阿里 | `qwen3.7-flash` | 0 | 0 (未上报缓存计数) | 无缓存（OpenAI 0） |
| 阿里 | `qwen3.8-max` | 1024 | 0 | OpenAI 有缓存 |

说明：`未上报缓存计数` 表示某一步响应缺少缓存字段，但同一次尝试中已出现 cached>0，仍按有缓存计；`HTTP 429/403/400` 表示该协议或该模型在当前 Key 下不可用。

## 无缓存模型

- DeepSeek-V4-Flash、DeepSeek-V4-Flash-0731
- Doubao-Seed-2.0-pro、Doubao-Seed-2.0-Code、Doubao-Seed-2.1-pro、Doubao-Seed-2.1-turbo、Doubao-Seed-2.1-lite
- MiniMax-M2.7
- gpt-5.4
- glm-5.3
- qwen3.6-plus、qwen3.7-flash
- gemini-3.5-flash、gemini-3.7-flash

## 不可用/限流

- gemini-3.8-flash（OpenAI 429，Anthropic 400）
- gemini-4-argon（403）
- gpt-5.6-sol（400）
- gpt-6-sol（400）

## 修复建议

- 无缓存模型并非客户端能修复：稳定前缀、`cache_control`、`prompt_cache_key` 已按协议发送；上游未启用或未回报缓存。
- Claude 系列在 OpenAI 兼容入口不缓存，切到 Anthropic Messages 后全部命中；App 的协议切换与自动修复有效。
- DeepSeek-V4-Pro-0813、V4.1-Flash 同样需要 Anthropic 协议才命中；V4-Pro/V4.1-Flash-1017 在 OpenAI 协议即可命中。
- 豆包 2.x、DeepSeek V4 非 4.1、MiniMax M2.7、GPT-5.4、GLM-5.3、Qwen3.6/3.7、Gemini 3.5/3.7 在当前 relay 上两种协议都未命中；要缓存需换模型或让上游启用缓存。
