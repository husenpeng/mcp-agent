# cordis.patch.yml thinking_level 修改记录（2026-11-02）

范围：仅最近半年（2026-05-02 之后）发布的模型。发布时间依据：
Anthropic newsroom（Opus 5.5 9/22、Sonnet 5.5 9/28、Haiku 5.5 10/7、Sonnet 5 ~6 月）、
DeepSeek changelog（V4-Flash-0731 7/31、V4-Pro-0813 8/13、V4.1-Flash 9/10、V4.1-Flash-1017 10/17）、
Azure Foundry 模型目录（gpt-5.6 7/9、gpt-6 9/22、gpt-6.1-sol 9/29；gpt-5.5 4/24 与 gpt-5.4 3/5 超窗）、
阿里云百炼快照日期（qwen3.7 5-7 月、qwen3.8-max 9/2；qwen3.6-plus 4/2 超窗）、
智谱文档（GLM-5.3 家族为当前代）、火山方舟当前代（Doubao-Seed-2.1）。
档位合法性以 relay 实测枚举为准（非法值触发 400 报错返回合法列表）。

## 已应用的修改（21 个模型 + 1 个新增）

| 模型 | 修改 | 依据（relay 实测） |
|---|---|---|
| glm-5.2, glm-5.3 | `off: none` | none→0 reasoning tokens；智谱枚举含 none |
| glm-5.3-flash, glm-5.3-flashx | `off: low` | 强制思考无法关闭（none 仍 22-24 rt）；low 为最轻档 |
| gpt-5.6-luna/sol/terra, gpt-6-luna, gpt-6-sol | 删 `max`，加 `off: none` + `xhigh` | 枚举 none/low/medium/high/xhigh（无 max） |
| gpt-6.1-sol | 删 `max`，加 `xhigh`（off 保持空值） | 枚举 low/medium/high/xhigh（无 none、无 max） |
| qwen3.7-flash, qwen3.7-max | 删 `max`，加 `off: none` + `xhigh` | 枚举 none/minimal/low/medium/high/xhigh |
| qwen3.8-max | `off: none`（保留 max） | 枚举含 none 与 max |
| claude-opus-5, claude-sonnet-5, claude-haiku-5-5 | `off: none` | none→ct=4 无思考；Bedrock 5.5 前代可用 |
| claude-opus-5-5, claude-sonnet-5-5 | `off: low` | none→400（thinking:disabled 不被 5.5 代接受）；low 实测 ct=4 |
| gemini-4-argon | `reasoningEfforts: false` | relay 无该模型 Gemini thinking 映射，任何 effort 都 400；仅 off 可用 |
| Doubao-Seed-2.1-pro, Doubao-Seed-2.1-turbo | `off: none` | none→ct=4 无思考 |
| Doubao-Seed-2.1-lite | 新增模型条目（relay 已有、原配置缺失） | 矩阵测试可用，max=200 |

未改动（在范围内但无有效修改）：kimi-k3 / kimi-k3.1-pro（枚举接受但 none 关不掉思考、
映射不稳定）、MiniMax-M3（上游忽略 reasoning_effort，无报错）、DeepSeek-V4 系近期快照
（现有 thinkingFormat: deepseek 配置已是最佳：off 真关、effort 生效）。

## 端到端验证

修改后以 glm-5.3 + off 起 subagent：4.0s、output 4 tokens、reasoning 0 字符、纯 text 块
（修改前同请求：8.4s、365 tokens、1278 字符 reasoning）。证明运行中的 app 已热加载
配置且 off:none 的 wire 映射生效。

## 超窗但已知的问题（未改，供后续处理）

- gpt-5/5-mini/5.1/5.2/5.4/5.4-mini/5.4-nano、o3、o4-mini：max 被上游拒绝（Invalid value: 'max'）
- gpt-4.1/4.1-mini/4.1-nano/4o/4o-mini：完全不接受 reasoning_effort 字段（建议 reasoningEfforts: false）
- gpt-5.2-chat：仅 medium 可用
- gpt-5/5.1/5.2/5.3-codex、o3-pro：chat completions 通道整体 400（operation unsupported）
- glm-5.1：上游不支持 reasoning_effort（字段被忽略，数据随机波动）
- qwen-turbo：持续 429 配额限流
- claude 4.x/5.x 经 Bedrock 随机出现 "Access to Anthropic models is not allowed for this account"（relay 后端账号路由问题）

回滚：`cp ~/.tomato/profiles/desktop/cordis.patch.yml.bak-thinking-fix ~/.tomato/profiles/desktop/cordis.patch.yml`
