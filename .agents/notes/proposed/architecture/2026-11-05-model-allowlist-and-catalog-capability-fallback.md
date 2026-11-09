# Agent Note: Model allowlist and cross-provider capability fallback

Status: proposed

English | [中文](2026-11-05-model-allowlist-and-catalog-capability-fallback.zh.md)

## Problem

A custom gateway route is not a pi-ai catalog provider. Before this change its Claude models fell back to the route-level `contextWindow` and `maxTokens` guesses (1M/128k), inherited no catalog compatibility block, and relied on the deployment to spell out every reasoning and capacity field. That made a correct model run with the wrong window and no Anthropic cache markers; the OpenAI-compatible path billed the whole history as uncached input even though the vendor model supports prompt caching.

The same freedom makes selection ungoverned. A route accepts every configured model, so a deployment that wants only its local list plus recently released models has no shared place to express that. Hiding models in one surface leaves direct requests and manual configuration unguarded.

## Proposal

### Capability fallback by canonical model id

A custom route resolves each declared model id against a first-party catalog entry after folding gateway prefixes, dots in version numbers, and date or version suffixes. Capacities, modalities, and `promptCache` come from the vendor entry unless the model entry overrides them; compatibility and reasoning metadata are inherited only when the route speaks the vendor's protocol, because a repointed model's wire switches are protocol-specific. The route keeps its own protocol, endpoint, and credential. A route pi-ai ships keeps its own catalog authoritative; an id it does not list never borrows another provider's capabilities. A family map restricts inheritance to the vendor's own providers, so a reseller's output cap cannot become the model's capability.

When the matched entry is an Anthropic Messages model on an OpenAI-compatible route, the adapter applies `cacheControlFormat: anthropic` unless the route or model names the switch. A gateway that rejects the marker opts the route out with `cacheRetention: none`.

### Allowlist with a release-date manifest

`modelPolicy` in `@tomato/llm-pi-ai` is a deny-by-default allowlist. `local` is the deployment's current local model list, a snapshot rather than a live view of configured routes, so a later configuration edit cannot widen it. `releaseDates` maps `provider/model` to an ISO date and permits every model at or after `recentSince` without a second list. `recent` remains an explicit dated addition when no manifest entry exists. Malformed keys, dates, or a date manifest without a cutoff fail at load.

The adapter lists every configured model but marks a refused pair with `blockedReason`; the catalog projection carries that field, and the composer renders a disabled row with localized copy. `modelAvailable` refuses a blocked selection, and `prepareCall`/`stream` throws `MODEL_NOT_ALLOWED` before provider I/O, so a manually configured blocked model cannot reach the network.

## Alternatives considered

- **Leave capability correction to per-route YAML.** Every deployment would restate capacities, cache format, and reasoning for every model, and a new 2026 model would inherit the old guesses until someone noticed. The catalog already carries those facts; copying them into each profile is the drift this removes.
- **Filter `listModels` and hide blocked models.** Hiding keeps the selector clean but gives the user no reason why a configured model disappeared, and a manual selection still needs a separate guard. Keeping the row with a reason makes the policy inspectable.
- **Hardcode release dates in the adapter.** Release data changes faster than the package and is provider-specific. A configuration manifest keeps the adapter free of a stale vendor calendar; a future release feed can generate the manifest instead of editing code.
- **Fall back across protocols at request time.** Retrying a failed native call on the OpenAI-compatible route can duplicate a billed request or a provider side effect, and it hides the failure that the native probe exists to report. Protocol choice stays a configuration decision; the probe reports feasibility first.

## Acceptance criteria

- A custom route naming a first-party model id inherits its capacities, modalities, and prompt-cache behavior; explicit entry fields win.
- Same-protocol custom routes inherit the vendor compatibility block, including mid-conversation updates; a protocol repoint does not.
- An Anthropic catalog model on an OpenAI-compatible custom route receives `cacheControlFormat: anthropic` unless explicitly configured.
- An enabled policy permits `local` membership and dated models at or after `recentSince`; every other configured model is `blockedReason`-marked, disabled in the selector, refused by `modelAvailable`, and fails `prepareCall`/`stream` with `MODEL_NOT_ALLOWED` before any provider request.
- An omitted or disabled policy leaves the adapter unrestricted; an enabled policy with empty lists and no dates denies every model.

## Risks

- **The cache marker is advisory.** A gateway can accept `cache_control` and still not honor it. Only a live `cacheReadTokens` observation proves caching; a route that fails it needs the native `/v1/messages` protocol, not a different marker shape.
- **The release manifest is external data.** Dates can be wrong, stale, or use a different model id than the relay. A wrong date changes the allowlist silently; the manifest needs an owner and a refresh path.
- **The allowlist covers `@tomato/llm-pi-ai` routes only.** A `@tomato/llm-deepseek` route is outside it; a deployment serving models through both adapters needs a policy at a higher seam.
- **`local` is a snapshot.** Adding a model to the provider list later is blocked until the allowlist is updated. That is the intended failure mode, but it needs a configuration workflow rather than an implicit refresh.
- **A blocked row is visible.** The policy is no longer silent; a deployment that expected hidden models now sees disabled rows and must explain the reason copy.
- **Capability inheritance is a hint, not a guarantee.** A gateway can re-export a model with a different quantization or output cap; the vendor match can overstate what the endpoint serves. Explicit fields remain the corrective.