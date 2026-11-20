---
kind: upgrade-guide
description: "The configurable-provider directory gains sharedProtocol, and the custom-API create form prefills its protocol from the endpoint hostname."
---

# Custom routes prefill their protocol from the endpoint

English | [中文](guide.zh.md)

## Change

`LlmConfigurableProvider` (exported by `@tomato/llm/types` and `@tomato/api-remotes/client`) gains an optional `sharedProtocol: string`. `llm-pi-ai` reports it for a catalog provider whose shipped models agree on one protocol a hand-declared route may name; a mixed catalog or a protocol the configuration shape cannot express reports none. The field is additive: existing consumers and stored profiles are unaffected.

The Models page's **Custom model API** create form uses it. The protocol field is now prefilled rather than blank: while automatic it matches the endpoint's exact hostname against the directory's `defaultBaseURL` hosts paired with `sharedProtocol`, falling back to the first offered protocol for an unknown host. A manual choice sticks through later endpoint edits. A **?** beside the label explains the rule, and a failed **Fetch available models** in automatic mode suggests the other common relay shape (OpenAI Chat Completions ↔ Anthropic Messages). Catalog routes and the DeepSeek card are unchanged.

## Migration

1. No configuration change is required. A route already declared keeps its stored `api`; the advice only prefills the create form and never rewrites an existing route.
2. SDK consumers reading the directory may read `entry.sharedProtocol`; treat its absence as "no advice" rather than a protocol.
3. To confirm: open **Add model provider → Custom model API**, enter a catalog endpoint such as `https://api.anthropic.com`, and check the protocol prefills to Anthropic Messages; enter an unknown relay host and check it falls back to OpenAI Chat Completions.
