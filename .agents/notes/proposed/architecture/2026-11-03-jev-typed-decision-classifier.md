# Agent Note: Jev-style typed decision classifier seam

Status: proposed

English | [中文](2026-11-03-jev-typed-decision-classifier.zh.md)

## Problem

The harness has one model seam, `ctx.llm`, and it streams chat completions. Every closed-set judgment is therefore phrased as a chat request and parsed back: `@tomato/experimental-auto-review` sends a fixed policy plus the whole pending action, asks for one JSON object, and re-validates the member set by hand ([source](../../../../packages/experimental/auto-review/src/index.ts)). Generation latency and output tokens pay for an answer that is enumerable in advance and, once malformed, fails the call.

The dependency every installation already has, `@earendil-works/pi-ai`, ships a second model kind for this: `ClassifierModel` (`type: 'classifier'`), `Models.classify()`, and four classifier APIs — `typesafe-system-one`, `cloudflare-workers-ai-system-one`, `llama-cpp-classify`, `openai-decisions`. Its catalog carries TypeSafe's hosted `jev-latest` at `https://api.typesafe.ai/v1/` with a 64,000-token state window, and `@tomato/llm-pi-ai` deliberately drops that route from chat because `servesChat()` requires a chat model ([catalog](../../../../packages/llm/llm-pi-ai/src/catalog.ts)). The harness therefore carries a working Jev client it cannot reach, while its only typed-decision path is a chat completion parsed by hand.

## Proposal

Add a second model seam, `ctx.classifier`, modelled on the `ctx.llm` provider registry, and move the typed-decision consumers onto it. Phase one is `@tomato/experimental-auto-review`; phase two is tool-result pruning.

### The seam

`@tomato/experimental-classifier` defines the service and owns the vocabulary: a request is `{ state, questions, model? }` where each question is `choice` (instructions plus a criteria map), `score` (instructions plus ordered criteria), or `bool` (instructions plus true/false criteria); a verdict is the per-question typed answer with its probabilities and confidence. Providers register on the service and return a disposer, duplicate names throw, and an unregistered provider fails loud rather than falling back to chat. The request and verdict types mirror pi-ai's `ClassifierContext` and `ClassifierResult` deliberately: the seam is provider-neutral, and pi-ai is one implementation rather than the contract.

`@tomato/experimental-classifier-pi-ai` implements the seam over `Models.classify()`, so the four installed classifier APIs are configuration, not code: `typesafe-system-one` for hosted Jev, `llama-cpp-classify` for a local `llama-server`, `cloudflare-workers-ai-system-one` and `openai-decisions` for the other vendors that speak the same typed contract. Provider, model, base URL, credential reference, timeout, confidence floor, and fail-closed behavior are `Config` fields; nothing is a constant.

### Zero configuration

Mounting the bundle is the only step a deployment takes. At activation the provider resolves its backend in a fixed order: an endpoint named in config, then a healthy local endpoint on the documented ports, then a model already in the cache, then a first-run download whose tier follows total unified memory. A missing backend is not a crash: the consumer stays on the chat path and one visible status line names the missing backend and why. Config fields override the resolution; they never gate whether it works.

### Logging and replay

A verdict changes what the harness does, so it must be reconstructable. The seam appends one `decision/verdict` session event per call carrying the purpose, provider, model, question ids, answers, the confidence floor in force, and the latency; consumers reference that seq. Replay reads the verdict and never calls the classifier again, the same rule compaction already follows for its logged decisions. The event is ignorable for readers that do not know it, because it explains a decision rather than replacing history.

### First consumer: Auto review

`classifyRisk` becomes two questions over the same frozen snapshot it already builds: `risk` as a `choice` over low, medium, and high with the current policy text as criteria, and `authorized` as a `bool` over whether a current user or direct-parent instruction authorizes this exact action and scope. The decision table stays the one the policy already states: high denies; low allows; medium allows only when `authorized` is true; any answer below `confidenceFloor` resolves to ask under the `ask` approval policy and to deny under `never`. The verdict may only reduce permission — `ToolGuard` and the approval path are unchanged, and a classifier failure keeps today's fail-closed behavior.

### Tool-result pruning

`@tomato/compaction-tool-result-pruner` currently trims by character budget with no model call ([source](../../../../packages/compaction/compaction-tool-result-pruner/src/index.ts)). A second phase asks one `score` question per oversized result — keep, truncate, delete — and records the verdict next to the existing shadow-price event, so the trimmed projection stays replayable. This phase waits for the seam to leave the experimental group: a release package cannot depend on an experimental one, so the pruner change lands together with that promotion.

## Self-hosting on macOS

TypeSafe's Jev has no open weights: the installed catalog exposes one hosted classifier id, `jev-latest`, at `api.typesafe.ai`, and nothing to vendor. What runs locally is the independent Open-Jev release (MIT code, with a decision head, LoRA adapters, and calibration over pinned Qwen base weights) or Simple Jev, which reads next-token logits from any Hugging Face model. The untrained `kyegomez/open-jev` is architecture only.

A local server needs no new client code. Open-Jev answers TypeSafe's wire shape at `POST /v1/systemone`, and pi-ai's `typesafe-system-one` transport posts `{ model, ...request }` to `${baseUrl}/systemone`, so pointing the route's base URL at `http://127.0.0.1:8791/v1` with a placeholder credential reaches the local process. Compatibility is partial, so each question kind needs one smoke request before the provider is trusted.

None of these routes traverses the chat gateway. A third-party provider with no Jev route stays the chat transport, while the classifier endpoint is a separate loopback service, so replacing, rate-limiting, or losing that gateway does not take typed decisions with it.

llama.cpp is the shortest offline route and needs no Python. `llama-server` exposes the tokenizer, template, and log-probability endpoints `llama-cpp-classify` already calls, so a local GGUF model answers the same typed questions without a decision head or a runtime download. Its answers are a chat model's label distribution rather than a trained decision head, so it fits triage before it fits an authorization gate.

Local hardware is bounded by the MPS path, not by model quality. The only documented Apple Silicon configuration is the 2B package with `--device mps` and `JEV_TORCH_DTYPE=float32`; MPS has no bitsandbytes 4-bit or 8-bit loading, so the 16 GB CUDA placement recipe does not transfer.

| Unified memory | Package | Evidence |
|---|---|---|
| 8 GB | none | 2B float32 weights alone are about 8 GB |
| 16–24 GB | 2B, `--device mps`, float32, `--max-length 4096` | The documented configuration; no published Mac latency |
| 32–36 GB | 2B comfortable; 9B only as an experiment at reduced precision | 9B float32 weights are about 36 GB, and the float16 path is numerically unverified |
| 48–64 GB | 9B at float32, or float16 with headroom | The 16 GB CUDA placement recipe does not apply to MPS |
| 96–128 GB | 9B comfortable; 27B bf16 marginal | 27B v1.1 peaked at 54.1 GiB for one request on H100 |
| 192 GB | 27B bf16 | Still unverified on MPS |

For a team, the cheaper split is a Linux GPU host serving Open-Jev while the Mac runs only the harness: the client change is the same base URL, and the 9B fits on one 16 GB card there with the contributor's placement settings.

## Alternatives considered

**MCP server instead of a seam.** `jkudish/jev-mcp` and `itsmostafa/typesafe-mcp` expose typed judgment as MCP tools, which needs no core change. It also puts the call at a point the model chooses, so it cannot gate a tool call before dispatch, it spends context on tool definitions and results, and it makes the verdict advisory. Worth using to benchmark question design, not as the integration.

**Keep chat plus JSON.** Status quo. It works, and it is the only option for judgments that need prose. It costs a full generation per decision, needs the hand-written parser auto review carries, and cannot use the 64,000-token state window as a single prefill.

**Self-host Open-Jev.** `Zefan-Cai/Open-Jev` is MIT-licensed code with released LoRA adapters, a decision head, and calibration over pinned Qwen base weights, served as `/v1/systemone` ([repository](https://github.com/Zefan-Cai/Open-Jev)). It removes data egress, but adds a GPU service, and its own public comparison puts 27B v1.1 below hosted Jev on JevBench. It is a provider variant once the seam exists, not the first integration.

**Local `llama-cpp-classify` now.** Already installed, and it reads label log-probabilities from `llama-server` without generating an answer. Its quality is whatever the served model is, so it fits a cheap local triage provider and not the authorization gate until benchmarked on retained sessions.

**Hard-code Jev into Auto review.** One package, no seam. The next consumer would copy the client, the config, and the logging.

## Acceptance criteria

- `ctx.classifier` returns typed answers for the three question kinds, dispatches to a configured provider, and fails loudly on an unknown provider, a malformed config, or a provider that returns no answer for a question id.
- Auto review on the classifier path produces the same deny/ask/allow outcomes as the chat reviewer on a retained corpus, with the confidence floor and fail-closed setting named in its config.
- Every verdict that changed behavior appears once in the session log, and replaying the session reproduces the decisions without a classifier call.
- Removing the provider package restores today's behavior with no other configuration change.
- Model-visible changes carry an updated recorded-session snapshot, and the new packages meet the per-file coverage gate.

## Risks

- **A verdict is not a permission grant.** Jev confidence is a margin, not a probability that the answer is right, and the reviewed state contains untrusted tool output, so an injected instruction can move the answer. The mitigation is structural: deterministic guards and approvals still run, a verdict can only reduce permission, and high risk stays deny-only.
- **Data egress.** Auto review's state includes tool arguments and session facts. Sending that to `api.typesafe.ai` creates a trust boundary that a local provider avoids; the provider choice is a deployment decision, not a default.
- **Calibration drift.** The confidence floor is meaningful only on data from this deployment. A floor copied from documentation can silently allow what should ask; it has to be measured on retained sessions and re-measured when the provider or model changes.
- **Accounting.** The installed catalog prices `jev-latest` at zero, so token-meter would report a false zero cost. Either the provider reports usage faithfully or the seam records cost as unknown instead of free.
- **Two model seams.** `ctx.llm` and `ctx.classifier` must not grow overlapping responsibilities; the rule is that a request needing generated text goes to `ctx.llm`, and one needing an enumerable answer goes to `ctx.classifier`.