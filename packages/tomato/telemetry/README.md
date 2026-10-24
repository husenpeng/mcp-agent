---
description: "Turn and tool spans for Tomato Harness, folded from durable session events and posted to the internal OTLP relay."
kind: "package-reference"
---

# @tomato/telemetry

English | [中文](README.zh.md)

## Summary

This package reports what Tomato Harness agents did: one span per turn and one child span per completed tool call, sent as OTLP/HTTP JSON to the internal relay that forwards to Langfuse. It derives everything from durable session events, sends no session content, and never delays the agent loop: a failing relay logs one warning and drops the batch.

## Table of Contents

- [Use this package](#use-this-package)
- [What is recorded](#what-is-recorded)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>

## Use this package

Mount the plugin on the Host plane with an `endpoint`:

```yaml
- id: tomato-telemetry
  name: '@tomato/telemetry'
  config:
    endpoint: !!js process.env.TOMATO_OTLP_ENDPOINT ?? ''
    token: !!js process.env.TOMATO_OTLP_TOKEN
    serviceName: tomato-harness
```

| Field | Default | Meaning |
|---|---|---|
| `endpoint` | `''` | Full OTLP traces URL; empty unmounts the listener |
| `token` | absent | Bearer token for the relay |
| `serviceName` | `tomato-harness` | `service.name` on every batch |
| `flushIntervalMs` | `2000` | Delay after the first span of a batch |
| `maxBatchSpans` | `64` | Spans per request; a full batch sends immediately |
| `timeoutMs` | `5000` | Per-request transport timeout |

The endpoint is the relay, never Langfuse directly: the relay holds the Langfuse credentials. With an empty endpoint the plugin registers nothing and the process makes no telemetry request.

<a id="what-is-recorded"></a>

## What is recorded

| Span | Parent | Attributes |
|---|---|---|
| `turn` | — | `session.id`, `turn`, `turn.end_kind` |
| `tool <name>` | the turn span | `session.id`, `turn`, `tool.name`, `tool.call_id`, `tool.is_error` |

A turn span opens at `turn/start` and closes at `turn/end`; a tool span opens at `tool/call` and closes at `tool/result`. A tool call still open when its turn ends is emitted with an error status. Prompt text, tool arguments, and tool output are not recorded: the spans describe timing and outcome, not content.

Plugin disposal closes every open turn before the final batch is sent, so a graceful quit does not lose in-flight spans.

<a id="model-experience"></a>

## Model Experience

None, as the plugin only observes already-committed session events and sends them outside any model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No content capture** — spans carry timing and outcome only. Prompt/response capture needs a deliberate decision about redaction and storage first.
- **Best-effort delivery** — there is no durable outbox; a relay outage loses the batches produced while it is down.
- **One span per tool call** — nested subagent turns produce their own traces through their own sessions, not as children of the parent turn.
