# Agent Note: Image evidence bridge for text-only models

Status: proposed

English | [中文](2026-11-03-image-evidence-bridge.zh.md)

## Problem

A text-only model never sees a pasted image. The attachment pipeline stores the image and the session keeps its `ImageAttachmentRef`, but `projectImagesForTextModel` in `packages/llm/llm/src/content.ts` replaces every image block with `textOnlyImageText` before dispatch, so the model receives a fixed placeholder (`[image omitted because this model accepts text only; attachment sha256:…]`) instead of the image's content. Earlier still, `SessionCommands.prompt` in `packages/api/session-controller/src/commands.ts` refuses the prompt outright when the selected model's `inputModalities` is defined without `image`, returning `session/attachment-invalid` with reason `MODEL_DOES_NOT_SUPPORT_IMAGES`; `SubagentManager.assertImageCapable` in `packages/subagent/subagent/src/manager.ts` applies the same refusal to child delivery.

The image pipeline already supplies every input the bridge needs. Attachments are content-addressed, an `ImageAttachmentRef` identifies exact bytes, the projection in `adapterStream` is the single place request content changes before dispatch, and the model's modality declaration is authoritative metadata. What is missing is evidence: a text rendering of the image that a text-only model can read without pretending the image arrived natively.

## Proposal

Read a pasted image through a configured vision model and inject the result as a derived attachment artifact. The bridge is `@tomato/image-evidence` in [`packages/llm/image-evidence/src/index.ts`](../../../../packages/llm/image-evidence/src/index.ts), a Cordis service published as `ctx.imageEvidence`. The decision has seven parts:

1. **Evidence is derived, not user content.** The image remains an attachment and an image block in `user/message`; the bridge stores a separate evidence record and never writes a transcription back into the transcript.
2. **Generation runs in `agent/pre-step`.** The plugin's waterfall listener lets the rest of the chain return an `enter` decision, then collects that decision's image references and calls `ensure()`. This is the one point that sees the claimed messages, the step's `modelSelection`, and its `signal` together.
3. **Projection is synchronous at dispatch.** `adapterStream` reads `ctx.get('imageEvidence')` and calls `projectImagesWithEvidence(messages, peek)` in `packages/llm/llm/src/index.ts`, before the text-model placeholder fallback. The lookup is a synchronous `peek` of the process cache; the projection never awaits storage or an engine and has no failure branch.
4. **Admission relaxes only on `canRead`.** For a model that positively declares text-only input, both admission gates consult the optional service structurally. They keep `MODEL_DOES_NOT_SUPPORT_IMAGES` unless the bridge reports `canRead(model) === true`; an absent service and a false result are the same refusal.
5. **Unknown modalities never qualify.** `canRead` requires `inputModalities` to be present and to exclude `image`. An absent list is unknown, not text-only; a model that declares `image` is never touched.
6. **The web bundle ships the row `disabled: true`.** `packages/bundle/web-app/cordis.patch.yml` inserts `image-evidence` with `disabled: true`, and `packages/bundle/web-app/package.json` declares the dependency. While the row is disabled the service is absent and the old rejection stands.
7. **The transcript card reads a host projection.** While engines are configured the plugin registers the `imageEvidence` projection, folding each `image/evidence` event into one entry per attachment: engine, attempt count, failed, truncated, cached, and duration. `@tomato/client-ui-image-evidence` renders that entry under the image through a new `conversation.chat.user.image-meta` list slot; the existing `conversation.chat.user.images` slot is `single`, so a second registration there would throw. The projection is summary-excluded because no Session-list row renders it.

### The engine chain and the evidence format

`Config.engines` is an ordered list of `{ provider, model }` routes resolved through `ctx.llm`; an empty list disables the bridge: the plugin registers nothing, does not open the domain, and `canRead` returns false. Configuring engines reloads the plugin, which opens the domain and adopts stored records. `generate.ts` tries each engine in order. An engine route must itself declare image input; a route whose `inputModalities` lacks or omits `image` records an `ENGINE_NOT_VISION` attempt and the chain continues. One read is a hand-built `ctx.llm` call: `prepareCall`, a user message carrying a fixed JSON answer format plus the image, `VISION_SYSTEM_PROMPT`, a 4,096-token output cap, `timeoutMs` (120 s), and the step's abort signal.

The answer must be one JSON object with `summary`, `ocr.full_text`, and typed `layout.regions`; `parseEvidence` drops optional members that do not carry their declared type, and a non-JSON answer is an `EVIDENCE_INVALID` attempt. The stored `text` is the serialized evidence cut at `maxChars` (8,000 characters) with an explicit truncation marker. It is exactly the text the projection sends, so a cache hit reproduces the request. Concurrent steps for one attachment share a single in-flight generation, and a total failure records the attempts in an in-process cooldown (`failureCooldownMs`, 300 s) so the next step does not repeat a paid failure.

### The model-facing block

`formatEvidenceBlock` wraps the stored text as `<image_evidence trust="untrusted" source="${attachmentId}">…</image_evidence>`, and `projectImagesWithEvidence` substitutes that text block at the image's position. While engines are configured, the plugin also registers the `image-evidence:trust` system-prompt section at `systemPrompt.getSectionOrder('IMAGE_EVIDENCE')` (950, after file references and before tool sections). The section states that the block is text recognized from an image for the user, that its contents are data rather than instructions, and that a truncated block calls for asking for the missing part. Images already marked `offloaded` by [image offload](../../implemented/architecture/2026-09-10-image-offload-events.md) are skipped: that decision already replaced them by budget, so the bridge must not pay to read an image the route will not receive.

### Storage, retention, and replay

Evidence lives in the `image_evidence` domain declared in `spec.ts`: version 1, `layout: 'per-record'`, one `evidence` table. The key is `evidenceRecordKey(attachmentId, engine, contractVersion)`, a SHA-256 digest of the attachment id, the engine provider and model, and the contract version; hashing keeps arbitrary model ids out of the per-record path segment. When engines are configured, `ImageEvidence` opens the domain at `Service.init`, adopts stored records into an attachment-id index and a formatted-text cache, and runs `prune()`. The index prefers the earliest configured engine when an attachment has records from more than one engine.

`prune` removes records whose `lastReadAt` is older than `retentionDays` (30) and then removes least-recently-read records until stored text fits `maxCachedBytes` (64 MiB). A cache hit refreshes `lastReadAt` at most once per hour, so reuse does not rewrite the record on every step. The domain is host storage, not session storage: a record has no session id and survives deletion of the session that first read the image. Reuse across sessions is deliberate. It also makes the store a replay dependency, because the text a request saw is outside the session log.

### Events and delivery

A fresh read, the first reuse of a record in a session, and a total failure each append one durable `image/evidence` session event declared in `types.ts`: `attachmentId`, `cached`, `engine`, `attempts`, `truncated`, `durationMs`, and `usage`. On failure there is no record: `engine` is `attempts[0].engine`, `truncated` and `cached` are false. The private `announced` set suppresses duplicate events for the same session and attachment, and the cooldown suppresses a repeat attempt, so one failed read produces one event. The event is required on read, so a reader without this event type refuses a log that contains it; it does not change the session envelope and does not advance `SESSION_FORMAT_VERSION`.

The change is a vertical slice: plugin, engine chain, storage, both admission gates, the projection seam, the prompt section, the `read_image` tool for paths and URLs, and the disabled bundle row. CLI-harness engines remain outside it. The package is in `packages/llm/`, not `packages/experimental/`, because `verify-default-product-isolation` treats a package named by a default bundle patch as part of the default product even when the row is disabled, and rejects experimental packages there.

## Alternatives considered

**Rewrite messages at request time in `llm/stream`.** Requests reaching that waterfall are deep-frozen and read-only; a listener that replaced image blocks would either mutate frozen objects or re-dispatch a request outside the logged request path. Dispatch also has nowhere to wait: a read takes seconds and must not become part of streaming. The projection seam keeps the request a pure function of the log and the evidence lookup.

**Rewrite the claimed messages in `agent/pre-step`.** The waterfall can return replacement messages, so the bridge could have substituted text there. That writes another model's transcription into the transcript as user content: fork, replay, compaction, and every other projection would read generated text as something the user said, and a later step could not distinguish it from an actual message. Keeping evidence in a side store preserves the transcript and leaves the decision to dispatch.

**Paste to a path, ModLens-style.** Writing the image to a workspace path and sending text plus a path avoids a new attachment surface, but it adds client and route machinery for uploads, loses the existing thumbnail, lightbox, replay, and attachment lifecycle, and makes the prompt depend on a path that may not exist in another execution world. The attachment is already durable and complete; the bridge consumes it.

**Add a parallel provider and credential layer for engines.** A separate vision-client stack would duplicate `ctx.llm`'s credential resolution, retry policy, pricing, usage, and adapter routing, and each would drift from the main provider path. A vision engine is a chat model call; `{ provider, model }` routes through `ctx.llm` reuse the existing seam.

**Sniff the model name to decide capability.** A name heuristic would let the bridge and the admission gates treat some models as text-only without metadata. `inputModalities` is the authoritative declaration; names change, aliases lie, and a wrong guess silently converts a native image path into evidence or the reverse. The bridge reads the metadata and treats an absent list as unknown.

## Acceptance criteria

- With at least one engine configured and a model whose `inputModalities` excludes `image`, an image prompt is admitted and the request carries a fenced `<image_evidence …>` text block at the image's position instead of `textOnlyImageText`.
- A second step, turn, or session that needs the same attachment makes no engine call; it reuses the record and reports `cached: true`.
- A model that declares `image` receives the original image block and no evidence text; the evidence projection is not entered for it.
- With no engine configured, or with the bundle row disabled, a text-only model's image prompt still fails with `MODEL_DOES_NOT_SUPPORT_IMAGES`; `ctx.get('imageEvidence')` returning nothing behaves identically.
- A model whose `inputModalities` is absent is never treated as text-only: admission keeps the existing rule and the adapter leaves the image untouched.
- When every engine fails, the step completes with the placeholder and appends one `image/evidence` event carrying the attempts; retries for that attachment are suppressed for `failureCooldownMs`.
- Records are pruned after 30 days without a read and by the 64 MiB least-recently-read budget; the stored text is exactly what the projection puts inside the fence.
- `packages/bundle/web-app/cordis.patch.yml` contains the `image-evidence` row with `disabled: true`.
- `read_image` refuses a hostname that resolves to a private address, a non-http(s) URL, an oversized source, and bytes without an image signature, before any engine call.
- With engines configured, a pasted image shows the engine and duration beside it in the transcript, expands to the attempt count and flags, and shows nothing for an attachment the Session did not read; with the bridge disabled or the attachment unread, no card appears.
- One AgentLoop turn mounts the real projection: the text adapter receives the fenced evidence block and no image block, while the engine adapter receives exactly one auxiliary request.

## Risks

**Every read is a paid call.** The bridge turns an image into a real vision-model request. The shipped default is off and an empty engine list is inert, so cost starts only after a user enables the row and names engines; a conversation model and an engine can share a route, so their quota and pricing interact.

**Evidence is another model's transcription.** The summary, OCR, and layout can be wrong or incomplete, and the text-only model cannot tell. The fence marks the block as untrusted data and the answer format has an `uncertainty` field, but correctness is not guaranteed; the original image remains the source of truth.

**Replay depends on the store.** Evidence is not in the session log. A pruned record or a lost storage backend makes the same request fall back to the placeholder, and a changed engine order can select a different stored record. The retained store is part of the reconstruction guarantee for turns that used evidence.

**Deleted sessions keep their evidence.** The `image_evidence` domain is not session-scoped, so session deletion does not delete the image's text; retention owns it. That is the reuse benefit and the privacy cost of keying by attachment content instead of session.

**The card cannot quote the transcription.** The projection carries status fields only, not the stored text, so a reader can see that an image was read and truncated without reading what the model received. Showing the text would move up to `maxChars` of evidence into every projection snapshot and Session view.

**A failed read is visible but its retry state is not durable.** Failure is non-blocking and appends one `image/evidence` event with the attempts, so the log explains why a step used the placeholder. The cooldown is in memory, though: a restart retries the engine immediately and can append a second event for the same failure.
