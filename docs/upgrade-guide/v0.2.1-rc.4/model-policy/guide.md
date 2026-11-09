---
kind: upgrade-guide
description: "Custom gateway routes inherit first-party model capabilities and Anthropic cache markers; an optional modelPolicy allowlist refuses unlisted models with MODEL_NOT_ALLOWED."
---

# Custom routes inherit model capabilities, and a model policy can refuse models

English | [中文](guide.zh.md)

## Change

A `@tomato/llm-pi-ai` route that pi-ai does not ship now resolves each declared model id against the first-party catalog after folding gateway prefixes, dotted versions, and date or version suffixes. Capacities, modalities, and `promptCache` come from the vendor entry unless the model entry overrides them. Compatibility and reasoning metadata are inherited only when the route speaks the vendor's protocol; a protocol repoint keeps the deployment's own declarations. Routes pi-ai ships keep their own catalog authoritative.

An Anthropic Messages model reached through an OpenAI-compatible custom route now receives `cacheControlFormat: anthropic` unless the route or model already names the switch. A gateway that rejects the marker opts out with `cacheRetention: none`.

`modelPolicy` is a new optional plugin-level allowlist. When `enabled` is true:

- `local` names the deployment's current models, as a snapshot;
- `releaseDates` maps `provider/model` to an ISO date and permits every model at or after `recentSince` without a second list;
- `recent` remains an explicit dated addition when no manifest entry exists;
- every other configured model is refused.

`LlmModelInfo` and the browser `ModelCatalogModel` gain an optional `blockedReason`. `listModels` returns every configured model and marks refused pairs instead of filtering them; `modelAvailable` returns false for a blocked pair, and `prepareCall`/`stream` throws `MODEL_NOT_ALLOWED` before provider I/O. The composer renders a blocked model as a disabled row with localized reason copy.

## Migration

1. Review custom gateway routes after upgrading. Their models may now report the vendor's `contextWindow`, `maxTokens`, and modalities instead of the route fallbacks, and Anthropic models may start sending cache markers. Set explicit fields where the gateway serves a different capacity or does not accept the marker.
2. To enable an allowlist, add `modelPolicy` beside `providers` in the `llm-pi-ai` config and set `enabled: true`. Populate `local` with every model the deployment keeps; an unlisted model is refused even if it is already configured. Add dated `releaseDates` entries for recent models, or dated `recent` entries when no manifest exists. A release-date manifest requires `recentSince`; malformed keys and dates fail at load.
3. Update consumers of `LlmModelInfo` and `ModelCatalogModel` to handle `blockedReason`: do not offer a blocked model for selection or routing, and present the reason. `modelAvailable` already refuses it.
4. Expect `MODEL_NOT_ALLOWED` from a request whose route/model is outside the policy. The error occurs before any provider request; select an allowed model and retry. An omitted or `enabled: false` policy keeps every model available.
5. The policy covers `@tomato/llm-pi-ai` routes only. A `@tomato/llm-deepseek` route and other adapter families remain outside it.
6. Session format is unchanged. The new fields are request-time metadata and error codes; blocked models are not removed from a Session log.