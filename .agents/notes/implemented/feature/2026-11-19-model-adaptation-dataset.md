# Agent Note: Third-party model adaptation dataset and one-click actions

Status: implemented

English | [中文](2026-11-19-model-adaptation-dataset.zh.md)

## Problem

A third-party OpenAI-compatible gateway serves models the installed pi-ai catalog has not caught up with — a vendor's newest release or a relay alias. Catalog materialization gives such a model no reasoning capability and no wire-compatibility switches, so it answers as a plain text model, and a deployment adopting a relay hand-writes `reasoningEfforts`, `input`, and per-family `compat` for every model id. The `modelPolicy` allowlist compounds this: a configured model missing from `modelPolicy.local` is refused with `MODEL_NOT_ALLOWED` before any provider I/O. Both are repetitive, error-prone, and recur whenever the endpoint adds a model.

## Decision

[`@tomato/llm-pi-ai`](../../../../packages/llm/llm-pi-ai/README.md) owns a code-maintained adaptation dataset, [`src/adaptation.ts`](../../../../packages/llm/llm-pi-ai/src/adaptation.ts), keyed by canonical model-id family. Each entry stores the reasoning depth levels and the protocol parameters that make them dispatch, expressed as profile fields. The dialect is the OpenAI-compatible gateway one — `reasoning_effort` with `off` sending nothing, plus DeepSeek's native `thinking` toggle — because that is the lowest common denominator a third-party relay speaks and the pattern a deployment verifies model by model when it adopts one. The values mirror each family's current first-party catalog generation; Anthropic Messages routes receive the same levels (pi-ai maps them to adaptive effort or a thinking budget) plus Claude's `forceAdaptiveThinking`. Modalities under-claim rather than over-claim, with a vision marker widening the ids that name it, following the existing `DEFAULT_INPUT` rationale.

The dataset is exposed through the `llm` service seam the same way discovery is: `registerModelAdaptation(settingsNs, adapt)` and `adaptModels(settingsNs, request)`, Remote `llm/adaptModels`. The namespace key lets a provider being added ask before its route exists, and keeps the business rule in the owning adapter rather than the generic runtime or the browser. Adaptation is a pure function of the draft — it reads nothing stored and writes nothing — so the configuration surface remains the only writer through `settings.mutate`.

Advice is minimal-diff by construction. It names only fields the draft leaves unset and no catalog entry already supplies: an unknown model is filled from its family; a catalog model on its own protocol is left to the catalog (its compat is authoritative); a catalog model repointed to another protocol keeps its inherited reasoning but receives the family's switches, because a repoint inherits no catalog compat. A row's own declarations and any switch the route already sets are never restated. This is what lets the same action serve a fresh relay and a partially hand-tuned route without overwriting either.

The Models page's pi-ai model list offers **Adapt models** and **Update models** beside the existing fetch picker. Both commit through the card's existing Apply path rather than a parallel writer, so validation, revision fencing, and credential handling stay in one place. The commit mirrors `modelPolicy.local` even when no profile field changed, which is what admits a model already configured but blocked by the allowlist — the original failure. An unchanged list on a route that still inherits its catalog keeps inheriting it instead of pinning every row into the user layer. Update adds every newly listed id, matching the fetch picker's select-all default and the deployment's own practice of listing non-chat ids as plain rows; the dataset declines to advise reasoning for non-chat models.

## Alternatives considered

**Resolution-time automatic adaptation.** Silently changing wire behavior for stored profiles contradicts the explicit-configuration posture and would surprise a deployment whose gateway rejects a family dialect. The dataset applies only through the deliberate one-click actions, and its advice is editable like any profile field.

**Per-id reasoning inference for unknown models.** The family template assumes the current generation reasons; a non-reasoning variant is declared with `reasoningEfforts: false`. Inferring capability from an id substring would guess wrong silently, so the dataset declines to advise non-chat models and leaves unrecognized families alone.

**Gateway-specific dialect detection beyond the family table.** Left to pi-ai's own baseURL detection and the route's `compat`. A curated URL table would rot faster than the family table and duplicate detection pi-ai already owns.

**A browser-side dataset.** A feature plugin cannot runtime-import another package's values, and business rules belong in the owning adapter. The seam registration keeps the dataset host-side and the Models page a pure consumer of advice.

## Consequences

A deployment adopting a relay replaces per-model hand-editing with one click, and a configured-but-blocked model is admitted by the same save. The cost is a curated table that must be refreshed as vendors ship generations; until then a brand-new family falls back to no advice rather than a wrong guess. The minimal-diff gate makes the action safe to re-run — it never overwrites a tuned row — but it also cannot repair a wrong declaration already present, which stays a manual edit. The allowlist mirror on every quick-action commit adds one settings write even when no field changed.

## Verification

[`adaptation.spec.ts`](../../../../packages/llm/llm-pi-ai/tests/adaptation.spec.ts) pins the dataset and the minimal-diff gates; the `llm` topology spec pins the registration, dedup, and Remote failure mapping; the pi-ai loader-composition spec exercises `adaptModels` through the real Loader; and the Models-page quick-actions spec pins the merge, commit, allowlist mirror, and notices.