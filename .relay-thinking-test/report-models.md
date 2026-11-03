# blueai relay thinking_level 测试：逐模型结果

判定图例: ✅ 生效=思考量随档位变化; ○=参数被接受但无任何思考; ❌/⚠️=请求被拒; think-ev = usage.reasoning_tokens + reasoning_content 字符数

| 模型 | off | low | med | high | max | 判定 | 备注 |
|---|---|---|---|---|---|---|---|
| claude-opus-4-5-20251101 | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ⚠️ 后端不稳定 | Bedrock "Access to Anthropic models is not allowed" 随机出现；与档位无关 |
| claude-haiku-4-5-20251001 | 0 | 194 | 199 | 186 | 187 | ✅ 生效 |  |
| claude-opus-4-7 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| claude-haiku-5-5 | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ⚠️ 后端不稳定 | Bedrock "Access to Anthropic models is not allowed" 随机出现；与档位无关 |
| claude-opus-4-8 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| claude-opus-4-6-v1 | 0 | 0 | 0 | 41 | 42 | △ 微弱/无梯度 |  |
| claude-opus-5 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| claude-opus-5-5 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| claude-sonnet-4-5-20250929 | 0 | 259 | 251 | 256 | 317 | ✅ 生效 |  |
| claude-sonnet-4-6 | 0 | 0 | 41 | 41 | 66 | ✅ 生效 |  |
| claude-sonnet-5 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| claude-sonnet-5-5 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| DeepSeek-R1 | 0 | 268 | 283 | 283 | 294 | ✅ 生效 |  |
| DeepSeek-V3 | 0 | 134 | 239 | 273 | 250 | ✅ 生效 |  |
| DeepSeek-V3.1 | 0 | 396 | 310 | 251 | 237 | ✅ 生效 |  |
| DeepSeek-V3.2 | 0 | 101 | 114 | 130 | 110 | ✅ 生效 |  |
| DeepSeek-V4-Flash | 0 | 130 | 169 | 136 | 181 | ✅ 生效 |  |
| DeepSeek-V4-Flash-0731 | 0 | 281 | 132 | 127 | 128 | ✅ 生效 |  |
| DeepSeek-V4-Pro | 0 | 352 | 130 | 130 | 145 | ✅ 生效 |  |
| DeepSeek-V4-Pro-0813 | 0 | 147 | 128 | 121 | 128 | ✅ 生效 |  |
| DeepSeek-V4.1-Flash | 0 | 123 | 143 | 108 | 126 | ✅ 生效 |  |
| DeepSeek-V4.1-Flash-1017 | 0 | 117 | 131 | 127 | 157 | ✅ 生效 |  |
| Doubao-1.5-pro-32k | 0 | 226 | 276 | 512 | 303 | ✅ 生效 |  |
| Doubao-lite-128k | 0 | 442 | 554 | 383 | 351 | ✅ 生效 |  |
| Doubao-1.5-vision-pro-32k | 0 | 293 | 300 | 383 | 234 | ✅ 生效 |  |
| Doubao-lite-32k | 411 | 375 | 505 | 186 | 183 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-lite-4k | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| Doubao-pro-128k | 0 | 194 | 208 | 387 | 196 | ✅ 生效 |  |
| Doubao-pro-32k | 0 | 150 | 266 | 214 | 205 | ✅ 生效 |  |
| Doubao-pro-4k | 0 | 271 | 240 | 325 | 293 | ✅ 生效 |  |
| Doubao-Seed-1.6 | 251 | 172 | 180 | 296 | 250 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-1.6-flash | 544 | 418 | 428 | 188 | 288 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-1.6-lite | 393 | 222 | 616 | 393 | 389 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-1.6-thinking | 258 | 170 | 316 | 268 | 302 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-1.6-vision | 144 | 140 | 275 | 322 | 285 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-1.8 | 253 | 135 | 313 | 265 | 260 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.0-Code | 423 | 389 | 396 | 456 | 442 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.0-mini | 354 | 384 | 515 | 323 | 203 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.0-lite | 319 | 151 | 271 | 290 | 293 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.0-pro | 414 | 214 | 310 | 508 | 563 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.1-lite | 473 | 91 | 779 | 675 | 431 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.1-turbo | 126 | 130 | 182 | 200 | 205 | ✅ 生效 |  |
| Doubao-Seed-Evolving | 104 | 104 | 97 | 79 | 80 | △ 微弱/无梯度 |  |
| gemini-2.5-flash | 291 | 238 | 313 | 327 | 319 | ✅ 生效 | off=默认思考未关闭 |
| Doubao-Seed-2.1-pro | 964 | 233 | 445 | 417 | 475 | ✅ 生效 | off=默认思考未关闭 |
| gemini-3-flash-preview | 385 | 346 | 232 | 421 | 678 | ✅ 生效 | off=默认思考未关闭 |
| gemini-2.5-pro | 565 | 544 | 573 | 612 | 580 | ✅ 生效 | off=默认思考未关闭 |
| gemini-3.5-flash | 265 | 232 | 291 | 355 | 418 | ✅ 生效 | off=默认思考未关闭 |
| gemini-3.1-pro-preview | 263 | 289 | 273 | 287 | 416 | ✅ 生效 |  |
| gemini-3.7-flash | 123 | 54 | 170 | 203 | 182 | ✅ 生效 | off=默认思考未关闭 |
| glm-5.1 | 296 | 395 | 177 | 277 | 871 | ✅ 生效 | off=默认思考未关闭 |
| gemini-3.8-flash | 171 | 0 | 174 | 339 | 352 | ✅ 生效 | off=默认思考未关闭 |
| glm-5.2 | 680 | 153 | 308 | 328 | 481 | ✅ 生效 | off=默认思考未关闭 |
| gemini-4-argon | 127 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 档位全被拒 | relay 无该模型的 Gemini thinking 映射 |
| glm-5.3 | 69 | 63 | 61 | 61 | 69 | △ 微弱/无梯度 | low→0；med/high 固定小思考；max≈默认 |
| glm-5.3-flash | 95 | 56 | 62 | 62 | 86 | △ 微弱/无梯度 | low→0；med/high 固定小思考；max≈默认 |
| glm-5.3-flashx | 84 | 58 | 57 | 61 | 81 | △ 微弱/无梯度 | low→0；med/high 固定小思考；max≈默认 |
| gpt-4.1 | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 字段被拒 | Unrecognized request argument: reasoning_effort |
| gpt-4.1-mini | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 字段被拒 | Unrecognized request argument: reasoning_effort |
| gpt-4.1-nano | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 字段被拒 | Unrecognized request argument: reasoning_effort |
| gpt-4o-mini | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 字段被拒 | Unrecognized request argument: reasoning_effort |
| gpt-4o | 0 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 字段被拒 | Unrecognized request argument: reasoning_effort |
| gpt-5-codex | ✗400 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 通道不可用 | 任何请求（含 off）都 400: operation unsupported；与档位无关 |
| gpt-5 | 64 | 0 | 64 | 64 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5-mini | 64 | 0 | 64 | 64 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5.1 | 0 | 0 | 26 | 41 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5.1-codex | ✗400 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 通道不可用 | 任何请求（含 off）都 400: operation unsupported；与档位无关 |
| gpt-5.2 | 0 | 0 | 0 | 22 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5.2-chat | 0 | ✗400 | 0 | ✗400 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| gpt-5.2-codex | ✗400 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 通道不可用 | 任何请求（含 off）都 400: operation unsupported；与档位无关 |
| gpt-5.3-codex | ✗400 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 通道不可用 | 任何请求（含 off）都 400: operation unsupported；与档位无关 |
| gpt-5.4 | 0 | 24 | 22 | 28 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5.4-mini | 0 | 28 | 24 | 31 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5.4-nano | 0 | 19 | 20 | 18 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| gpt-5.6-luna | 26 | 25 | 25 | 26 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| gpt-5.6-sol | 0 | 0 | 0 | 0 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| gpt-5.6-terra | 26 | 19 | 25 | 24 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| gpt-6-luna | 23 | 19 | 21 | 26 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| gpt-6.1-sol | 18 | 6 | 16 | 21 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| kimi-k2.5 | 103 | 94 | 94 | 84 | 132 | △ 微弱/无梯度 |  |
| kimi-k3 | 152 | 144 | 117 | 123 | 8 | ✅ 生效 | off=默认思考未关闭 |
| kimi-k2.6 | 623 | 356 | 639 | 598 | 719 | ✅ 生效 | off=默认思考未关闭 |
| gpt-5.5 | 26 | 26 | 26 | 29 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| gpt-6-sol | 0 | 0 | 0 | 17 | ✗400 | ⚠️ max 被拒 | Unsupported value: 'reasoning_effort' does not support 'max' with this |
| kimi-k3.1-pro | 62 | 105 | 130 | 116 | 62 | ✅ 生效 |  |
| MiniMax-M2.1 | 321 | 195 | 502 | 255 | 405 | ✅ 生效 | off=默认思考未关闭 |
| MiniMax-M2 | 549 | 308 | 248 | 453 | 496 | ✅ 生效 | off=默认思考未关闭 |
| MiniMax-M2.1-lightning | 342 | 465 | 432 | 614 | 563 | ✅ 生效 |  |
| MiniMax-M3 | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| MiniMax-M2.5 | 277 | 361 | 393 | 364 | 310 | ✅ 生效 |  |
| MiniMax-M2.7 | 278 | 334 | 239 | 654 | 527 | ✅ 生效 | off=默认思考未关闭 |
| o3 | 0 | 0 | 0 | 0 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| o3-pro | ✗400 | ✗400 | ✗400 | ✗400 | ✗400 | ❌ 通道不可用 | 任何请求（含 off）都 400: operation unsupported；与档位无关 |
| o4-mini | 64 | 64 | 64 | 64 | ✗400 | ⚠️ max 被拒 | Invalid value: 'max'. Supported values are: 'low', 'medium', 'high', a |
| qwen-max | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| qwen-plus | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| qwen-turbo | ✗429 | ✗429 | ✗429 | ✗429 | ✗429 | ⏳ 无法测试 | 持续 429 配额限流 |
| qwen3-vl-plus | 0 | 2205 | 1977 | 2421 | ✗400 | ⚠️ max 被拒 | 'reasoning_effort' must be one of: 'none', 'minimal', 'low', 'medium', |
| qwen3.5-omni-flash | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| qwen3.5-omni-plus | 0 | 0 | 0 | 0 | 0 | ○ 全档无思考 | 各档均 200 但无 reasoning 证据（参数被静默忽略或非推理模型） |
| qwen3.8-max | 197 | 100 | 320 | 197 | 200 | ✅ 生效 | off=默认思考未关闭 |
| qwen3.7-flash | 1081 | 664 | 2315 | 954 | ✗400 | ⚠️ max 被拒 | 'reasoning_effort' must be one of: 'none', 'minimal', 'low', 'medium', |
| qwen3.7-max | 863 | 1429 | 1025 | 927 | ✗400 | ⚠️ max 被拒 | 'reasoning_effort' must be one of: 'none', 'minimal', 'low', 'medium', |
| qwen3.6-plus | 1160 | 1109 | 1017 | 1116 | ✗400 | ⚠️ max 被拒 | 'reasoning_effort' must be one of: 'none', 'minimal', 'low', 'medium', |
