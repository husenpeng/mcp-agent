---
kind: upgrade-guide
description: "The base composition ships the blueai-anthropic Claude route and selects claude-opus-5-5 as the default model; each person stores their own BLUEAI_API_KEY on the Models page."
---

# The base composition ships a default Claude route

English | [中文](guide.zh.md)

## Change

`@tomato/base` now configures `@tomato/llm-pi-ai` with one route, `blueai-anthropic`, that speaks native `anthropic-messages` to `https://bmc-llm-relay.bluemediagroup.cn` with `cacheRetention: short`. Its model entries name only `claude-opus-5-5`, `claude-sonnet-5-5`, and `claude-haiku-5-5`; capacities, modalities, reasoning efforts, and prompt-cache behavior come from the installed first-party catalog. The route names the credential reference `BLUEAI_API_KEY`; the package carries no key.

`agent-default-model` now selects `blueai-anthropic` / `claude-opus-5-5` with `reasoningEffort: high` instead of an empty pair. Until the key is stored, the route lists no models and a request on it fails with `MISSING_CREDENTIAL`.

## Migration

1. A person without a profile `llm-pi-ai` config opens **Settings → Models**, enters their own key on **BlueAI Claude**, and keeps the default model. The key is stored only in their `$TOMATO_HOME/.credentials.yaml`.
2. A profile `cordis.patch.yml` that already configures `llm-pi-ai` replaces the whole bundle config, so the shipped route is absent there. Keep the profile routes, or delete that row to adopt the shipped route. A Models-page save writes the complete config in effect, the shipped route included, into the profile; later bundle changes to the route then do not reach that profile.
3. A profile that sets `agent-default-model` keeps its own selection. A profile that relied on the empty default to make a new Session ask for a model now starts on `claude-opus-5-5`.

Verify: on a fresh `$TOMATO_HOME`, the Models page shows **BlueAI Claude** with a missing key; after entering a key, the composer selects `claude-opus-5-5`, and a second step of a Session reports nonzero cache-read tokens.
