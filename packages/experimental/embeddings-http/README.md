---
description: "The OpenAI-compatible HTTP embeddings provider for ctx.embeddings: batched requests, credential resolution, and response validation."
kind: "package-reference"
---

# @tomato/experimental-embeddings-http

English | [中文](README.zh.md)

## Summary

Turns `ctx.embeddings` into one batched `POST <baseUrl>/embeddings` client for any OpenAI-compatible endpoint, including a loopback server such as Ollama. The provider splits a batch by `batchSize`, truncates each text to `maxInputChars`, resolves its bearer key from a credential reference, and validates every returned vector before a consumer sees it. The memory service uses it automatically once it is mounted, stores the returned vectors in its local storage domain, and re-sends only the query and records whose vector is missing or stale.

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

Mount it as a Host row. It needs no other service for a loopback endpoint without a key; a remote endpoint should name its key through `apiKeyEnv`. The Muse bundle ships this row beside memory, disabled by default with a local Ollama endpoint; enabling the row serves its configuration to the **Embedding provider** page in Plugins. That page displays the running endpoint, model, vector length, and credential name read-only, switches semantic search on or off, and sends one test embedding from the browser. The model and length stay Host configuration fields for a future migration rather than page controls.

```yaml
- name: '@tomato/experimental-embeddings-http'
  config:
    baseUrl: http://127.0.0.1:11434/v1
    model: nomic-embed-text
    dimensions: 768
```

| Field | Default | Meaning |
|---|---|---|
| `baseUrl` | required | OpenAI-compatible base URL; the provider appends `/embeddings` |
| `model` | required | Embedding model id the endpoint accepts |
| `apiKeyEnv` | unset | Credential reference holding the bearer key; omitted sends no authorization |
| `dimensions` | `0` | Expected vector length; `0` accepts the first response's length |
| `enabled` | `true` | Whether memory search may use the provider; `false` keeps it mounted but search stays lexical |
| `timeoutMs` | `15000` | Deadline of one HTTP request |
| `batchSize` | `32` | Texts per HTTP request |
| `maxInputChars` | `4000` | Characters kept from one text before sending |

The generated [configuration catalog](../../../docs/config-catalog.md#tomatoexperimental-embeddings-http) is the exhaustive source for every accepted field.

A remote endpoint must use HTTPS; plain HTTP is accepted only for `localhost`, `127.0.0.1`, and `::1`. The page's **Test connection** runs in the browser, so it verifies the recommended loopback path directly; a remote endpoint that refuses cross-origin requests reports that refusal, while the Host still uses the endpoint normally after a save. The key resolves first through `ctx.credentials` and then through the launch environment, so a stored value reaches the next request without a restart.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`embed` returns early for an empty batch and otherwise sends one request per `batchSize` slice, preserving caller order. Each request replaces the abort signal with `AbortSignal.any` over the caller's signal and a timeout, sends `{ model, input }`, and accepts only a `data` array of `{ index, embedding }` entries whose count and vector lengths match the request; an explicit `dimensions` must match too. Failures are classified as `provider` (HTTP error, network, missing credential), `timeout`, or `invalid-response` (non-JSON body, count or length mismatch, malformed or duplicate index). A caller cancellation is rethrown unchanged. The provider never retries.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Embedding seam](../embeddings/README.md) — the contract this package implements.
- [Memory service](../memory/README.md) — blends these vectors into search.

-----

<a id="model-experience"></a>
## Model Experience

None, as the provider answers embedding calls for a consumer that owns any model-visible effect.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Single endpoint and model** — one row serves one model; a second model needs another Host.
- **No cache or dedupe** — repeated texts are re-embedded on every call.
- **Truncation is silent** — text beyond `maxInputChars` is dropped before sending.
- **No retry** — a transient provider failure reaches the consumer, which falls back to its own lexical behavior.
- **Privacy** — record text leaves the machine; the endpoint and its operator own that data.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

One `embed()` call splits its texts by `batchSize` into separate requests and never retries; a non-loopback `baseUrl` must use HTTPS and the bearer key comes from a credential reference. `dimensions` stays 0 until the deployment sets it, and the first response supplies the vector length.

</details>
