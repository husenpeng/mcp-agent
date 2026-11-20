/**
 * Curated adaptation data for third-party gateway models, and the advice that
 * applies it to a provider draft.
 *
 * The installed pi-ai catalog describes first-party models; a gateway serving a
 * model the catalog has not caught up with — a vendor's newest release, or a
 * relay alias — resolves with no reasoning capability and no wire-compatibility
 * switches, so it answers as a plain text model. This module is the code-owned
 * dataset that fills that gap: per model family it stores the protocol
 * parameters (the reasoning wire dialect and the switches that make it
 * dispatch) and the reasoning depth levels the family's current generation
 * offers, expressed as `@tomato/llm-pi-ai` profile fields.
 *
 * The dialect is the OpenAI-compatible gateway one: a relay that reads
 * `reasoning_effort` and accepts the vendor's native reasoning toggle where it
 * has one (DeepSeek's `thinking`). It is the lowest common denominator a
 * third-party OpenAI-compatible endpoint speaks, and the pattern a deployment
 * verifies model by model when it adopts a relay. Anthropic Messages routes
 * receive the same levels (pi-ai maps them to adaptive effort or a thinking
 * budget) plus the adaptive-thinking switch for Claude. Other protocols receive
 * modality advice only.
 *
 * Advice is a pure function of the draft: it reads nothing stored and writes
 * nothing. It names only fields the draft leaves unset AND no catalog entry
 * already supplies, so adopting it never overwrites a deployment's own
 * declaration or a first-party capability. The configuration surface offers the
 * reply for adoption; `cordis.patch.yml` remains the only thing that decides
 * what a route serves.
 *
 * @module @tomato/llm-pi-ai/adaptation
 */

import type {
  LlmModelAdaptation,
  LlmModelAdaptationRequest,
  LlmModelAdaptationTarget,
} from '@tomato/llm'
import type { JsonValue } from '@tomato/util-values'
import { catalogBaseFor, catalogSharedApi, canonicalModelId } from './catalog.ts'
import type { PiAiModality, PiAiReasoningEfforts, PiAiThinkingFormat } from './catalog.ts'

/**
 * Reasoning depth every adapted chat model offers on a gateway that reads
 * `reasoning_effort`: each level sends its own name, and `off` sends nothing
 * (the parameter's absence is "do not think" for most vendors). A family whose
 * vendor spells `off` differently overrides that one value.
 */
const STANDARD_EFFORTS: PiAiReasoningEfforts = {
  off: null,
  low: 'low',
  medium: 'medium',
  high: 'high',
  max: 'max',
}

/** One model family's adaptation template, keyed by canonical-id pattern. */
interface AdaptationFamily {
  /** Matches the canonical model id (lowercased, gateway prefix and version suffixes folded). */
  readonly pattern: RegExp
  /** Request modalities the family's current generation accepts. */
  readonly input: readonly PiAiModality[]
  /** Wire spelling of `off` on an OpenAI-compatible gateway; null sends nothing. */
  readonly off?: string | null
  /** Reasoning wire dialect the family needs beyond `reasoning_effort`; OpenAI-compatible routes only. */
  readonly thinkingFormat?: PiAiThinkingFormat
  /** Whether the family's current generation uses Anthropic adaptive thinking rather than a token budget. */
  readonly adaptive?: boolean
}

/**
 * The adaptation dataset, in match order. Each entry mirrors the family's
 * current first-party catalog generation (pi-ai's `qwen-token-plan`, `deepseek`,
 * `zai`, `moonshotai`, `minimax`, `anthropic`, `openai`, and `google` entries)
 * and the relay dialect a deployment verifies when it adopts a third-party
 * gateway. A model id matches at most one family; the first match wins.
 *
 * Modalities under-claim rather than over-claim: a family whose vision support
 * varies by variant declares text only, and the vision marker below widens the
 * ids that name it. Declaring images a gateway refuses costs a mid-turn
 * rejection after the message is durable; declaring text only refuses the image
 * before it is attached, naming the model.
 */
const ADAPTATION_FAMILIES: readonly AdaptationFamily[] = [
  { pattern: /^claude/, input: ['text', 'image'], adaptive: true },
  { pattern: /^(?:gpt|chatgpt|o\d)/, input: ['text', 'image'] },
  { pattern: /^gemini/, input: ['text', 'image'] },
  { pattern: /^deepseek/, input: ['text'], thinkingFormat: 'deepseek' },
  { pattern: /^qwen/, input: ['text', 'image'] },
  { pattern: /^kimi/, input: ['text', 'image'] },
  { pattern: /^glm/, input: ['text'], off: 'none' },
  { pattern: /^minimax/, input: ['text', 'image'] },
  { pattern: /^doubao/, input: ['text'] },
  { pattern: /^grok/, input: ['text', 'image'] },
  { pattern: /^(?:mistral|codestral|magistral)/, input: ['text'] },
]

/**
 * Canonical-id markers of a model that cannot serve a conversation: embedding,
 * rerank, image-generation, speech, and moderation models. A gateway lists them
 * beside chat models; adaptation skips them rather than declaring reasoning
 * levels they reject.
 */
const NON_CHAT_PATTERN = /(?:embedding|rerank|seedream|dall-e|whisper|moderation|(?:^|[-.])image(?:[-.]|$)|(?:^|[-.])tts(?:[-.]|$))/

/** Canonical-id markers of a vision variant inside a text-only family. */
const VISION_PATTERN = /vision|(?:^|[-.])vl(?:[-.]|$)/

/** The family one canonical model id belongs to, or undefined for an unrecognized family. */
function familyFor(canonical: string): AdaptationFamily | undefined {
  return ADAPTATION_FAMILIES.find(family => family.pattern.test(canonical))
}

/** The modalities a family declares for one id, widened for a named vision variant. */
function familyInput(family: AdaptationFamily, canonical: string): readonly PiAiModality[] {
  if (family.input.includes('image') || !VISION_PATTERN.test(canonical)) return family.input
  return [...family.input, 'image']
}

/** Whether a draft row already declares reasoning levels (a dict, not `false` or absent). */
function declaresEfforts(target: LlmModelAdaptationTarget): boolean {
  // The request crosses the Remote JSON boundary, where a valueless null can
  // arrive outside the static type; it declares nothing.
  const efforts: unknown = target.reasoningEfforts
  return typeof efforts === 'object' && efforts !== null
}

/**
 * Advise the profile fields one provider draft is missing to serve its models
 * with their families' protocol parameters and reasoning levels.
 *
 * A model the catalog already describes inherits its reasoning and modalities
 * through catalog materialization, so it receives no reasoning or modality
 * advice; only a model the catalog does not describe is filled from the dataset.
 * Wire-compatibility switches are advised only for an unknown model or one
 * repointed to another protocol, per field against the row and the route, so a
 * switch either layer already sets is never restated and a native catalog
 * model's authoritative compat is left untouched. Reasoning levels are advised
 * only for the OpenAI-compatible and Anthropic Messages protocols; every other
 * protocol receives modality advice only. A non-chat model and an unrecognized
 * family receive nothing.
 * @param request - the effective route facts and drafted rows, in list order.
 * @returns one advice entry per model with something to declare, in request order;
 *   a complete model yields no entry.
 */
export function adaptModels(request: LlmModelAdaptationRequest): readonly LlmModelAdaptation[] {
  const advice: LlmModelAdaptation[] = []
  for (const target of request.models) {
    if (target.id.length === 0) continue
    const canonical = canonicalModelId(target.id)
    if (NON_CHAT_PATTERN.test(canonical)) continue
    const family = familyFor(canonical)
    if (family === undefined) continue
    const base = catalogBaseFor(request.provider, target.id)
    const api = request.api ?? base?.api ?? catalogSharedApi(request.provider)
    let input: readonly PiAiModality[] | undefined
    let reasoningEfforts: PiAiReasoningEfforts | undefined
    let compat: Record<string, JsonValue> | undefined

    // Reasoning rides the catalog entry whenever one exists; the dataset fills
    // only a model the catalog does not describe, and only on a protocol whose
    // dispatch reads the level map.
    const reasons = base?.reasoning === true || declaresEfforts(target)
    if (base === undefined && target.reasoningEfforts === undefined
      && (api === 'openai-completions' || api === 'anthropic-messages')) {
      reasoningEfforts = api === 'anthropic-messages'
        ? { ...STANDARD_EFFORTS }
        : { ...STANDARD_EFFORTS, off: family.off ?? null }
    }

    // Switches that make the reasoning dispatch land, each missing from the row
    // and the route. A model the catalog describes on its own protocol inherits
    // its catalog compat, which is authoritative, so it receives no switch
    // advice; only an unknown model or one repointed to another protocol (which
    // inherits no catalog compat) is filled from the family dialect.
    const fills = base === undefined || base.api !== api
    const wanted: Record<string, JsonValue | undefined> = {}
    if (fills && api === 'openai-completions' && (reasons || reasoningEfforts !== undefined)) {
      wanted.supportsReasoningEffort = true
      if (family.thinkingFormat !== undefined) wanted.thinkingFormat = family.thinkingFormat
    } else if (fills && api === 'anthropic-messages' && family.adaptive === true) {
      wanted.forceAdaptiveThinking = true
    }
    const switches: Record<string, JsonValue> = {}
    for (const [field, value] of Object.entries(wanted)) {
      if (value === undefined) continue
      if (target.compat?.[field] !== undefined) continue
      if (request.compat?.[field] !== undefined) continue
      switches[field] = value
    }
    if (Object.keys(switches).length > 0) compat = switches

    // Modalities fill only an unknown model whose effective fallback is narrower
    // than the family declares; a catalog entry's or a row's own list stands.
    if (base === undefined && target.input === undefined) {
      const fallback = request.defaultInput ?? ['text']
      const declared = familyInput(family, canonical)
      if (declared.includes('image') && !fallback.includes('image')) input = declared
    }

    if (input !== undefined || reasoningEfforts !== undefined || compat !== undefined) {
      advice.push({
        id: target.id,
        ...input === undefined ? {} : { input },
        ...reasoningEfforts === undefined ? {} : { reasoningEfforts },
        ...compat === undefined ? {} : { compat },
      })
    }
  }
  return advice
}
