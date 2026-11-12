# Agent Note: Prompt-cache dialect and tool-with-effort capability are endpoint facts

Status: implemented

English | [中文](2026-11-12-prompt-cache-dialect-and-tool-effort-capability.zh.md)

## Problem

Two request-shaping facts belong to the endpoint, not to the model, and the adapter could not express either.

Prompt caching was inferred from a model family: [`defaultCacheCompat`](../../../../packages/llm/llm-pi-ai/src/catalog.ts) applied Anthropic `cache_control` markers whenever a canonical id matched an `anthropic-messages` catalog entry on an `openai-completions` route. That covers Claude behind a gateway and nothing else. An OpenAI-family model on a relay, a gateway that re-exports a Claude model under a private alias, or an endpoint that caches only with `prompt_cache_key` had no way to declare what it honors, so caching was either absent or dependent on an inference that could not see the endpoint.

Tool pairing was invisible in both directions. Some OpenAI-compatible relays refuse function tools together with `reasoning_effort` — `Function tools with reasoning_effort are not supported for gpt-6.1-sol in /v1/chat/completions. To use function tools, use /v1/responses or set reasoning_effort to 'none'` — and an agent turn always declares tools, so such a model fails every step at a non-`off` effort. No compat switch said so: `supportsReasoningEffort` states that the field is accepted, not that it is accepted beside tools. The deployment had to remember the rule, and a wrong choice ended in a failed turn carrying `INVALID_REQUEST`.

## Decision

- `cache` is a route-level default with a per-model override. `dialect` names the marker the endpoint honors: `anthropic` (breakpoints on the system prompt, last tool, and last message; `openai-completions` only), `key` (`prompt_cache_key`, pinning long retention on `openai-completions` because that is the only condition under which pi-ai emits the key there), `implicit` (send nothing; the endpoint reuses a stable prefix itself), and `none` (send nothing and set request retention to `none`). `retention` overrides the route's `cacheRetention` for one model, which a route-wide value cannot do for a route mixing cached and uncached models.
- The Anthropic inference survives only as a last resort: with no dialect declared at either layer, an Anthropic catalog model on an `openai-completions` route still receives the marker. Every declared dialect replaces it.
- `toolsWithReasoning: never` records the refusal, per route with a per-model override. The adapter then sends the request without an effort and reports the degradation through `onCapabilityDegrade`, which the plugin logs.
- A provider 400 matching the refusal wording is learned for the process: the adapter retries the same turn once without the effort, then remembers the pair. A retry is allowed only while the attempt produced no content, because replaying a stream whose text already reached the transcript would duplicate it.
- `@tomato/llm-pi-ai/openai-probe` probes both OpenAI protocols for reachability, tool use, the tool/effort pairing, cache reads, and `prompt_cache_key` acceptance, and renders the route configuration those observations support. `scripts/probe-endpoint.ts` runs it.

## Alternatives considered

**One switch per marker field.** Exposing `cacheControlFormat` and `supportsLongCacheRetention` directly was already possible and is what every deployment had to do; it names pi-ai's fields rather than the endpoint's behavior, and it cannot express `implicit` or `none` at all.

**Always sending the key on custom routes.** A cache key is harmless where it is ignored and a 400 where it is rejected; probing answers which, and the dialect keeps the answer in configuration.

**Dropping the thinking levels of a model that refuses tools beside an effort.** It removes the choice entirely, though the same model thinks when the request carries no tools, and it would misreport the model's capability in every selector.

**Retrying after content streamed.** The turn would emit its text twice while the transcript recorded one copy, and the second attempt would bill the whole prefix again.

**Persisting the learned refusal.** It is an observation about a running endpoint; a durable record would need invalidation when the gateway is upgraded, and a probe is the cheaper source of truth.

## Testing

- A declared `anthropic` dialect on `openai-completions` emits breakpoints on the system prompt, the last tool, and the last message; the same dialect on `anthropic-messages` fails resolution naming the protocol that already carries them.
- A declared `key` dialect on `openai-completions` emits `prompt_cache_key` and a 24h retention, and refuses short retention; on `openai-responses` it adds no switch.
- A declared `none` dialect emits neither marker nor key, and refuses a contradicting retention.
- One model's `retention` overrides the route's, and one model's `toolsWithReasoning` overrides the route's.
- With no declaration, an Anthropic catalog model on an `openai-completions` route keeps the inferred marker.
- `toolsWithReasoning: never` sends no effort for a request carrying tools and keeps the effort when the request carries none.
- A 400 whose message states the refusal is retried exactly once without the effort, and the next request on the same process sends none; an unrelated 400 is not retried.
- The probe reads cache counts from `prompt_tokens_details.cached_tokens`, `prompt_cache_hit_tokens`, or `cache_read_input_tokens`, and renders `api: openai-responses` when only that protocol accepts the tool/effort pairing.

## Risks

- **A declared dialect is a claim until a cache read proves it.** A gateway may accept `cache_control` and not honor it; only `cacheReadTokens` on a repeated prefix is evidence, which is why the probe measures instead of inferring.
- **`key` on `openai-completions` also sends `prompt_cache_retention: 24h`.** A gateway that rejects the field needs `implicit` or `none`; the probe reports key acceptance before a deployment relies on it.
- **The learned refusal is process-scoped.** A restarted process pays one refused request per route and model before it stops sending the effort.
- **A retry doubles the bill for the failed attempt.** It buys a completed turn instead of a failed one, which is the trade a provider retry policy already makes.
- **`implicit` states nothing about the prefix itself.** Prefix stability still depends on prompt admission and tool ordering, which this field does not control.

## Consequences

- Cache behavior is configuration, so a probe result pastes into a route instead of requiring an adapter change.
- The Anthropic inference is no longer the mechanism, only the fallback; a deployment that wants a different marker for the same model states it and wins.
- A route may mix cached and uncached models, and may refuse the tool/effort pairing on one model only.
- The partial supersession of [Model allowlist and cross-provider capability fallback](../../proposed/architecture/2026-11-05-model-allowlist-and-catalog-capability-fallback.md) is its cache bullet: the marker is no longer only inferred, it is declarable and probeable. That note stays active for the allowlist mechanism.