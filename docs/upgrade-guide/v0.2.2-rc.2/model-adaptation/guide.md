---
kind: upgrade-guide
description: "The Models page gains one-click adapt and update actions backed by a code-owned family adaptation dataset and a new llm/adaptModels Remote."
---

# One-click model adaptation and update for third-party gateways

English | [中文](guide.zh.md)

## Change

`@tomato/llm-pi-ai` ships a code-owned adaptation dataset that stores, per model family, the reasoning depth levels and the protocol parameters that make them dispatch on a third-party gateway. A gateway model the installed pi-ai catalog has not caught up with previously resolved with no reasoning capability and no wire-compatibility switches; the dataset fills that gap. The dialect is the OpenAI-compatible gateway one (`reasoning_effort`, plus DeepSeek's native `thinking` toggle); Anthropic Messages routes receive the same levels plus Claude's adaptive-thinking switch.

The `llm` service gains `registerModelAdaptation(settingsNs, adapt)` and `adaptModels(settingsNs, request)`, exposed to the browser as the `llm/adaptModels` Remote. Like model discovery, adaptation reads and writes nothing stored: the request carries the provider draft and the reply is per-model profile-field advice. Advice names only fields the draft leaves unset and no catalog entry already supplies, so it never overwrites a deployment's own declaration or a first-party capability. New failure codes `NO_ADAPTATION`, `INVALID_ADAPTATION`, and `DUPLICATE_ADAPTATION` join `LLM_FAILURE_CODES`, and a refused Remote carries `llm/model-adaptation-rejected`.

The Models page's pi-ai model list gains two one-click actions beside **Fetch available models**. **Adapt models** applies the advice to the drafted rows and commits through the same save path as Apply. **Update models** asks the endpoint what it serves, adds the models the list does not name yet, adapts the merged list, and commits. Both mirror the deployment `modelPolicy.local` allowlist even when no profile field changed, so a model already configured but blocked by the allowlist is admitted. An unchanged list on a route that still inherits its catalog keeps inheriting it.

## Migration

1. No configuration change is required. Existing profiles resolve exactly as before; the dataset only advises fields a draft leaves unset, and a catalog model on its own protocol is left to the catalog.
2. To adapt a third-party route, open its editor card, expand **Customized settings → Model options**, and click **Adapt models**. To pull in models the endpoint newly serves, click **Update models**. Review the rows and the outcome notice beside the list; the actions commit immediately and keep the card open.
3. Adapter families that mount their own settings namespace can register adaptation through `ctx.llm.registerModelAdaptation`; the offer is disposed with the fiber. A namespace with no registered adaptation refuses `adaptModels` with `NO_ADAPTATION`.
4. The Session format is unchanged. Adaptation is configuration-time advice; it adds no session event and removes no logged model.