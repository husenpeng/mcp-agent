---
description: "番茄 Harness 的 turn 与工具 span：从持久会话事件折叠，发往公司内部 OTLP relay。"
kind: "package-reference"
---

# @tomato/telemetry

[English](README.md) | 中文

## 概述

本包记录番茄 Harness 的 agent 行为：每轮一个 span，每个完成的工具调用一个子 span，以 OTLP/HTTP JSON 发往内部 relay，再由 relay 转发 Langfuse。所有内容都从持久会话事件推导，不发会话正文，也不阻塞 agent 循环：relay 故障只打一条警告并丢弃该批。

## 目录

- [使用本包](#use-this-package)
- [记录什么](#what-is-recorded)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>

## 使用本包

在 Host 侧挂载并给出 `endpoint`：

```yaml
- id: tomato-telemetry
  name: '@tomato/telemetry'
  config:
    endpoint: !!js process.env.TOMATO_OTLP_ENDPOINT ?? ''
    token: !!js process.env.TOMATO_OTLP_TOKEN
    serviceName: tomato-harness
```

| 字段 | 默认 | 含义 |
|---|---|---|
| `endpoint` | `''` | 完整 OTLP traces 地址；空值即不挂载监听 |
| `token` | 无 | relay 的 Bearer 令牌 |
| `serviceName` | `tomato-harness` | 每批的 `service.name` |
| `flushIntervalMs` | `2000` | 一批首个 span 之后的发送延迟 |
| `maxBatchSpans` | `64` | 单请求 span 上限；满批立即发送 |
| `timeoutMs` | `5000` | 单请求超时 |

地址指向 relay，不直连 Langfuse：Langfuse 凭证只存在于 relay 侧。`endpoint` 为空时插件不注册任何监听，进程不会发出任何遥测请求。

<a id="what-is-recorded"></a>

## 记录什么

| Span | 父级 | 属性 |
|---|---|---|
| `turn` | — | `session.id`、`turn`、`turn.end_kind` |
| `tool <name>` | turn span | `session.id`、`turn`、`tool.name`、`tool.call_id`、`tool.is_error` |

turn span 在 `turn/start` 打开、`turn/end` 关闭；tool span 在 `tool/call` 打开、`tool/result` 关闭。turn 结束时仍未完成的工具调用会以错误状态发出。prompt 文本、工具参数与工具输出都不记录：span 只描述耗时与结果，不描述内容。

插件卸载时会先关闭所有未结束的 turn 再发出最后一批，因此正常退出不会丢失在途 span。

<a id="model-experience"></a>

## Model Experience

None, as the package only observes already-committed session events and sends them outside any model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **不采集内容** —— span 只带耗时与结果。要采集 prompt/回复，得先就脱敏与存储做一次明确决策。
- **尽力投递** —— 没有持久发件箱；relay 故障期间的批次会丢失。
- **每个工具调用一个 span** —— 嵌套子 agent 的 turn 通过各自的会话形成独立 trace，不挂在父 turn 之下。

<a id="dev-note"></a>

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
