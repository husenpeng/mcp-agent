---
description: "Evidence status beside a pasted image in the Chat transcript: which vision engine read it, how long the read took, and whether the read failed, was reused, or was truncated."
kind: package-reference
---

# @tomato/client-ui-image-evidence

English | [中文](README.zh.md)

## Summary

When the image-evidence bridge reads a pasted image for a text-only model, this plugin shows what happened under that image: the engine, the time, and whether the model received a complete, truncated, reused, or missing reading. It renders nothing while the bridge is disabled or has not read the attachment. Expanding the status shows the attempt count and the note that explains a placeholder. The card reads the Host-computed `imageEvidence` projection only and sends no request of its own.

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

The shipped Web profile includes this plugin beside Chat, so the card appears wherever a user-message image is rendered.

### When to choose it

Choose it when a deployment enables the [image-evidence bridge](../../llm/image-evidence/README.md) and users should see why a text-only model answered about an image. The plugin owns presentation only: enabling the bridge, choosing engines, and paying for reads belong to the Host plugin. It needs no configuration, and removing the row removes the card without affecting the read or the request.

### Minimal configuration

The Web bundle already mounts the row; a custom composition adds it next to `@tomato/client-ui-chat`.

```yaml
- id: ui-image-evidence
  name: '@tomato/client-ui-image-evidence'
```

The plugin registers one entry in the `conversation.chat.user.image-meta` list slot that Chat declares under each durable user-message image. A local preview that has no attachment yet shows no entry.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The browser half registers one `imageEvidence` dictionary and one list entry on `conversation.chat.user.image-meta`, through `ctx.slots.inject` so it waits for Chat's declaration and leaves with the plugin fiber. The component selects its own attachment from the Host-computed `imageEvidence` projection with `useProjection`, so the render path holds no subscription and another image's update does not re-render this one.

| File | Role |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | Registration, dictionary, and inject declaration |
| [`src/client/ImageEvidenceBadge.tsx`](src/client/ImageEvidenceBadge.tsx) | Status line, expansion, and projection lookup |
| [`src/client/locales.ts`](src/client/locales.ts) | `imageEvidence` dictionaries for the shipped languages |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the card alone is not enough.

- [@tomato/image-evidence](../../llm/image-evidence/README.md) — the bridge that reads images, stores evidence, and projects it into the request.
- [Session projection](../../../docs/subsystems/session-projection.md) — how the Host computes `imageEvidence` and the client reads it by key.
- [Slots](../../../docs/subsystems/slots.md) — declarations, child slots, and how `ctx.slots.inject` waits for another package's declaration.
- [ui-chat](../ui-chat/README.md) — the Chat target that declares the image slots and renders the user-message content Factory.
- [ui-attachment](../ui-attachment/README.md) — the shipped gallery that renders each image the card sits under.

-----

<a id="model-experience"></a>
## Model Experience

None, as this plugin draws Host-computed projection values beside an image and registers no prompt, tool, or request content.

#### KV Cache effect

None; the card neither constructs nor sends model requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

The card reports facts the Host already computed; it never adds data of its own.

- **The evidence text is not in the card** — the projection carries the engine, attempts, flags, and time, not the stored transcription. The expanded details therefore explain the read instead of quoting it; showing the text would require carrying it through the projection or a new Remote.
- **Nothing appears while the bridge is disabled** — without a registered `imageEvidence` projection the lookup returns nothing, so an image keeps its plain thumbnail and the card stays silent.
- **Reused records show no time** — a cache hit makes no engine call, so the card reports `reused` rather than a misleading `0s`.
- **A reported read stays visible for the Session** — entries are keyed by attachment id, so a read reported once remains in the projection after the transcript row scrolls out of the window.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The status line follows the design in [the bridge Agent Note](../../../.agents/notes/proposed/architecture/2026-11-03-image-evidence-bridge.md); the expansion originally expected to show the transcription, which the projection deliberately does not carry.

</details>
