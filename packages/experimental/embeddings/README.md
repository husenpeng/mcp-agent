---
description: "The embedding capability seam (ctx.embeddings) that turns text batches into vectors for local semantic ranking, for maintainers adding a provider or consuming one."
kind: "package-reference"
---

# @tomato/experimental-embeddings

English | [中文](README.zh.md)

## Summary

Defines the optional `ctx.embeddings` service: a provider turns one batch of texts into vectors of one declared length. Consumers read it through `ctx.get('embeddings')`, so a composition without a provider keeps its lexical behavior. This package ships the contract only; [`@tomato/experimental-embeddings-http`](../embeddings-http/README.md) is the first provider.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

### Add it to your composition

Mount one provider. This package has no configuration and registers no service by itself.

### Embed a batch

```ts
import type { Context } from '@tomato/cordis'

declare const ctx: Context

const embeddings = ctx.get('embeddings')
if (embeddings !== undefined) {
  const vectors = await embeddings.embed({ texts: ['brand tone', 'budget approval'] })
}
```

A provider returns one vector per text in caller order. `model` names the provider's model, and `dimensions` states the vector length; `0` means the provider only knows it after its first response.

### Write a provider

Subclass `Embeddings`, call `super(ctx, 'embeddings')`, and implement `embed`. Report expected failures as `EmbeddingsError` with `timeout`, `provider`, or `invalid-response`; a caller cancellation propagates as its own abort error.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The class extends Cordis `Service`, so a second provider in one context throws under the standard duplicate-service rule. `embed` receives the caller's texts and an optional `AbortSignal`; the provider owns batching, transport, timeouts, and response validation. The contract carries no caching requirement and no retry policy: a consumer decides whether a failed embedding degrades its own feature.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [HTTP provider](../embeddings-http/README.md) — an OpenAI-compatible endpoint with credential resolution.
- [Memory service](../memory/README.md) — the first consumer, which blends vector similarity into memory search.

-----

<a id="model-experience"></a>
## Model Experience

None, as the seam declares an optional vector service without adding prompt text, tools, or context.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No provider here** — a composition that mounts only this package has no `ctx.embeddings` and every consumer falls back.
- **No batching or retry policy** — each provider owns both; the seam promises neither.
- **Unspecified similarity** — vectors are opaque numbers; consumers define how they compare them.
- **One provider per Host** — the duplicate-service rule allows no per-workspace or per-model routing.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Consumers reach the optional service through `ctx.get('embeddings')`, so a composition without a provider still runs. Providers own transport and report cumulative usage; the seam adds no retry and no vector cache.

</details>
