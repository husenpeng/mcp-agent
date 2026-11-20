# Agent Note: Custom-route protocol advice is endpoint-driven, not model-driven

Status: implemented

English | [中文](2026-11-19-custom-route-protocol-advice.zh.md)

## Problem

A hand-declared pi-ai route names one wire protocol for its whole endpoint, and the Models create form required the user to pick it from a dropdown with no default. Users who do not know the protocol vocabulary pick wrong: a relay serving `gpt-6` over an OpenAI upstream rejects an Anthropic Messages route's `max_tokens` with `unsupported_parameter`, because the output-cap field spelling follows the protocol, not the model. The request that surfaced this carried a relay request id, so the failure was a protocol mismatch at the gateway, not a model fault.

The tempting fix is a code table mapping each model id to its protocol, applied automatically and hidden from the user. That table cannot exist: the same model id is served over different protocols by different endpoints — `claude` over `anthropic-messages` at Anthropic, `openai-completions` at most relays, `bedrock-converse-stream` at Bedrock; `gpt` over `openai-responses` at OpenAI and `openai-completions` at relays. Protocol is a function of the endpoint and the model together, and a one-dimensional model table answers wrong for every endpoint but one.

## Decision

Protocol stays a route-level property. The create form prefills it from the endpoint, and the user overrides it in place; nothing rewrites a stored route.

[`@tomato/llm-pi-ai`](../../../../packages/llm/llm-pi-ai/README.md) reports `sharedProtocol` on each configurable-provider directory entry whose installed catalog models agree on one protocol a hand-declared route may name (`catalogSharedApi`, filtered to `supportedProtocols()`); a mixed catalog such as OpenRouter, or a shared protocol the configuration shape cannot express such as Mistral Conversations, reports none. The field is an optional addition to [`LlmConfigurableProvider`](../../../../packages/llm/llm/src/types.ts), carried by the existing directory detach and wire re-export.

The browser derives the advice rather than receiving a computed table: [`protocol-advice.ts`](../../../../packages/client/ui-settings-models/src/client/protocol-advice.ts) pairs each directory entry's `defaultBaseURL` hostname with its `sharedProtocol`, drops a hostname two providers disagree on, and matches the typed endpoint by exact hostname — lowercased, ignoring port and path — falling back to the first offered protocol for any unknown host. Exact matching is deliberate: pi-ai's own `detectCompat` uses substring `baseUrl.includes(...)`, which would mistake `api.anthropic.com.evil-relay.example` for Anthropic. The fallback is the OpenAI-compatible gateway dialect, the lowest common denominator relays speak, and the first entry of `supportedProtocols()` for exactly this reason.

[`CustomProviderCard`](../../../../packages/client/ui-settings-models/src/client/CustomProviderCard.tsx) holds the protocol field in an automatic state until the user explicitly selects: automatic recomputes on every endpoint edit, a manual choice sticks through later endpoint edits. A static **?** tooltip states the rule. When **Fetch available models** fails while automatic, [`ModelListEditor`](../../../../packages/client/ui-settings-models/src/client/ModelListEditor.tsx) appends a deterministic suggestion to try the other common relay shape (OpenAI Chat Completions ↔ Anthropic Messages); a manual choice gets none. The advice touches only the custom-API create form — catalog routes and the DeepSeek card carry their own protocols and show no route-level protocol field.

## Alternatives considered

**A model-id→protocol table, applied automatically and hidden.** Rejected because protocol is endpoint-dependent: the table misconfigures `claude` on every OpenAI-speaking relay and `gpt` on every Anthropic-shaped relay, and hiding the field removes the only correction path. The endpoint-hostname advice keeps the common case zero-effort while leaving the override visible.

**Re-pointing existing routes through one-click adapt.** Rejected because a relay legitimately serves a family over a non-native protocol, so a family-default conflict rule would flag correct configurations endlessly, and changing a route's protocol also changes its endpoint path shape and auth headers — not a side-effect-free field suggestion. Adaptation continues to never propose a protocol; the advice is creation-time only.

**A hand-written hostname table.** Rejected because `PROVIDER_DATA` already carries every catalog endpoint and `catalogSharedApi` already answers the shared protocol; a second copy would drift on each pi-ai upgrade and miss counter-intuitive facts such as MiniMax's native endpoint speaking `anthropic-messages`. Derivation has one home per fact and upgrades with the catalog.

**Host-computed advice map or a dedicated Remote.** Rejected because the form already fetches the directory through `listProviders`; one optional scalar per entry lets the client derive the table with no extra round trip, keeping hostname matching — pure presentation logic — in the browser. A discovery-time suggestion was rejected outright: discovery needs a protocol before it can send a request.

**Suffix or path-aware hostname matching.** Rejected because regional variants are already separate directory entries, `/v1` appears on Anthropic-native relays too, and suffix matching reintroduces the substring misidentification exact matching exists to prevent.

## Consequences

The common relay case needs no protocol knowledge: an unknown host takes the OpenAI-compatible fallback, which is what most relays speak, and a known vendor endpoint takes its native protocol. The cost is that a same-host multi-protocol endpoint (MiniMax) can prefill wrong once, and an Anthropic-native relay unknown to the catalog falls back to OpenAI until the user switches — both corrected in place, after which the choice sticks. The visible field and the failure suggestion are the correction paths; there is no silent auto-switch and no credential re-send under a different auth shape.

The directory gains a wire-visible optional field, so SDK consumers may read `sharedProtocol` and must treat its absence as "no advice". The create form's aria output gains the help button, pinned by the `declared-create` Models-settings golden. The advice is advisory only: `cordis.patch.yml` and the stored profile remain the sole authority over what a route serves.

## Related

- [Third-party model adaptation dataset](2026-11-19-model-adaptation-dataset.md) — the sibling configuration-time advice that fills reasoning and compat, and likewise never proposes a protocol.
