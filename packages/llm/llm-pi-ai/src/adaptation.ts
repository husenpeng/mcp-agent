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
 * modality advice only, and only OpenAI-compatible or Responses routes take the
 * instruction-role switch.
 *
 * The route dialect goes beyond reasoning. pi-ai reads an endpoint it does not
 * recognize as OpenAI itself: a reasoning model's instructions carry the
 * `developer` role, and an `openai-completions` conversation has no place for
 * instructions after it starts. Those switches describe the route rather than a
 * model — every model of the route sends the same role and message order — so
 * the reply states them once on the route and the configuration surface writes
 * them there.
 *
 * Advice is a pure function of the draft: it reads nothing stored and writes
 * nothing. It names only fields the draft leaves unset AND no catalog entry
 * already supplies, per field, so adopting it never overwrites a deployment's
 * own declaration or a first-party capability. The configuration surface offers
 * the reply for adoption; `cordis.patch.yml` remains the only thing that
 * decides what a route serves.
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

/** The OpenAI-compatible wire switches a gateway needs, and nothing a field already states. */
interface CompletionsDialect {
  /** Whether the endpoint accepts the `developer` instruction role. */
  supportsDeveloperRole: boolean
  /** Whether the endpoint reads `reasoning_effort`. */
  supportsReasoningEffort?: boolean
  /** Reasoning parameter format the endpoint expects. */
  thinkingFormat?: PiAiThinkingFormat
}

/**
 * The switches a route needs to serve its models, in the order they are
 * written, each skipped when the route already states it.
 * @param api - the protocol the route speaks.
 * @param dialect - what that protocol's route needs beyond pi-ai's detection.
 * @param route - the switches the route already declares.
 * @returns the switches to write on the route; empty when it declares them all.
 */
function missingSwitches(
  api: string,
  dialect: CompletionsDialect,
  route: LlmModelAdaptationRequest['compat'],
): Record<string, JsonValue> {
  const switches: Record<string, JsonValue> = {}
  const offer = (field: string, value: JsonValue | undefined): void => {
    if (value === undefined || route?.[field] !== undefined) return
    switches[field] = value
  }
  if (api === 'openai-completions') {
    offer('supportsDeveloperRole', dialect.supportsDeveloperRole)
    offer('supportsReasoningEffort', dialect.supportsReasoningEffort)
    offer('thinkingFormat', dialect.thinkingFormat)
    return switches
  }
  if (api === 'openai-responses') offer('supportsDeveloperRole', dialect.supportsDeveloperRole)
  return switches
}

/**
 * Advise the profile fields one provider draft is missing to serve its models
 * with their families' protocol parameters and reasoning levels, plus the route
 * switches no declaration on either layer states.
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
 * family receive no row advice.
 *
 * The route switches answer pi-ai's detection, which treats an endpoint it does
 * not recognize as OpenAI itself and then sends a reasoning model's
 * instructions as the `developer` role and places later instructions mid
 * message list. They are advised whenever no family-declared row covers them,
 * reduce to one wire spelling when every family agrees, and are filled from the
 * draft's standard gateway dialect when no family declared a row.
 * @param request - the effective route facts and drafted rows, in list order.
 * @returns one entry per model with something to declare, in request order, then
 *   zero or one entry naming the route with `route: true`; a complete draft
 *   yields no entry.
 */
/**
 * Whether a row or the route already states one switch, which is then never restated.
 * @param field - compat field name.
 * @param target - the drafted row.
 * @param request - the effective route facts.
 * @returns true when either layer sets the field.
 */
function declares(
  field: string,
  target: LlmModelAdaptationTarget,
  request: LlmModelAdaptationRequest,
): boolean {
  return target.compat?.[field] !== undefined || request.compat?.[field] !== undefined
}

/**
 * The route dialect implied by the families that declared a row: each switch is
 * advised as `false` when any family needs it off, since one route cannot serve
 * both roles to one endpoint, and a wire spelling only when every family that
 * named one agrees. With no family row, the standard gateway needs the switches
 * pi-ai's detection would otherwise get wrong — the endpoint is not OpenAI
 * itself, so it takes `system` and needs later instructions folded in.
 * Later instruction messages need no switch: `supportsMidConvoSystemMessages` is
 * catalog-owned, so an unrecognized endpoint folds them into a user message.
 * @param dialects - one entry per family-declared reasoning row, in request order.
 * @returns the switches the route needs beyond what it states.
 */
function routeDialect(dialects: readonly CompletionsDialect[]): CompletionsDialect {
  const standard: CompletionsDialect = { supportsDeveloperRole: false }
  if (dialects.length === 0) return { ...standard, supportsReasoningEffort: true }
  const formats = new Set(dialects.flatMap(dialect => dialect.thinkingFormat === undefined ? [] : [dialect.thinkingFormat]))
  const [format] = formats
  return {
    ...standard,
    supportsReasoningEffort: dialects.some(dialect => dialect.supportsReasoningEffort === true),
    ...formats.size === 1 && format !== undefined ? { thinkingFormat: format } : {},
  }
}

/**
 * The protocol a draft speaks when neither the form nor the route's catalog
 * names one. A route with no catalog models is the gateway case this dataset
 * exists for, so it receives the OpenAI-compatible switches; one whose catalog
 * models disagree on the protocol receives none, since no single set fits it.
 * @param request - the effective route facts.
 * @returns the protocol whose route switches the draft needs.
 */
function inferApi(request: LlmModelAdaptationRequest): string {
  const protocols = request.models.flatMap((model) => {
    const base = catalogBaseFor(request.provider, model.id)
    return base === undefined ? [] : [base.api]
  })
  if (protocols.length === 0) return 'openai-completions'
  return protocols.every(protocol => protocol === protocols[0]) ? protocols[0] ?? 'unknown' : 'unknown'
}

/**
 * Advise the profile fields one provider draft is missing to serve its models
 * with their families' protocol parameters and reasoning levels, and the route
 * switches no declaration on either layer states.
 *
 * A model the catalog already describes inherits its reasoning and modalities
 * through catalog materialization, so it receives no reasoning or modality
 * advice; only a model the catalog does not describe is filled from the dataset.
 * Row switches are advised only for an unknown model or one repointed to another
 * protocol, because a repoint inherits no catalog compat, and only on a
 * single-model request restating a switch the route already declared: there the
 * next reply must find the row complete rather than advise it again. Any other
 * draft leaves those switches to the route entry. Reasoning levels are advised
 * only for the OpenAI-compatible and Anthropic Messages protocols; every other
 * protocol receives modality advice only. A non-chat model and an unrecognized
 * family receive no row advice.
 *
 * The route switches answer pi-ai's detection, which treats an endpoint it does
 * not recognize as OpenAI itself. A route whose dialect no row declared receives
 * the standard gateway dialect; one whose families declared rows receives their
 * switch values when every family that named one agrees.
 * @param request - the effective route facts and drafted rows, in list order.
 * @returns one entry per model with something to declare, in request order, then
 *   at most one entry naming the route with `route: true`; a complete draft
 *   yields no entry.
 */
/**
 * Whether one wire protocol serves chat completions, the protocols whose models
 * a person attaches an image to.
 * @param api - the resolved wire protocol.
 * @returns whether the protocol is a chat protocol.
 */
function isChatProtocol(api: string): boolean {
  return api === 'openai-completions' || api === 'openai-responses' || api === 'azure-openai-responses'
    || api === 'openai-codex-responses' || api === 'anthropic-messages' || api === 'mistral-conversations'
}

export function adaptModels(request: LlmModelAdaptationRequest): readonly LlmModelAdaptation[] {
  const advice: LlmModelAdaptation[] = []
  const dialects: CompletionsDialect[] = []
  const routeApi = request.api ?? catalogSharedApi(request.provider)
  for (const target of request.models) {
    if (target.id.length === 0) continue
    const canonical = canonicalModelId(target.id)
    if (NON_CHAT_PATTERN.test(canonical)) continue
    const base = catalogBaseFor(request.provider, target.id)
    const api = routeApi ?? base?.api ?? 'openai-completions'
    let input: readonly PiAiModality[] | undefined
    let reasoningEfforts: PiAiReasoningEfforts | undefined
    let compat: Record<string, JsonValue> | undefined

    const family = familyFor(canonical)
    if (family === undefined) {
      // A family the dataset does not know still reads images on a chat protocol:
      // a gateway's newest model usually does, and a text-only one shows up as a
      // refused request the person can act on, not as a model that silently
      // cannot take an image at all.
      const declared = request.defaultInput ?? ['text']
      if (base === undefined && target.input === undefined && isChatProtocol(api) && !declared.includes('image')) {
        advice.push({ id: target.id, input: ['text', 'image'] })
      }
      continue
    }

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

    // The protocol a model speaks decides whether any switch is its own. A model
    // the catalog describes on its own protocol inherits its catalog compat,
    // which is authoritative, so it declares no dialect; only an unknown model or
    // one repointed to another protocol (which inherits no catalog compat) does.
    const fills = base === undefined || base.api !== api
    const reasoning = fills && (reasons || reasoningEfforts !== undefined)
    if (reasoning && api === 'anthropic-messages') {
      dialects.push({ supportsDeveloperRole: false })
      const switches: Record<string, JsonValue> = {}
      if (family.adaptive === true && !declares('forceAdaptiveThinking', target, request)) {
        switches['forceAdaptiveThinking'] = true
      }
      if (Object.keys(switches).length > 0) compat = switches
    } else if (reasoning) {
      // pi-ai sends a reasoning model's instructions as `developer` only when
      // the endpoint claims that role, so the gateway dialect states both.
      const dialect: CompletionsDialect = {
        supportsDeveloperRole: false,
        supportsReasoningEffort: true,
        ...family.thinkingFormat === undefined ? {} : { thinkingFormat: family.thinkingFormat },
      }
      dialects.push(dialect)
      // The route states these switches itself: one dialect serves the whole
      // endpoint. A row restates them only on a single-model request, the shape
      // the configuration surface sends once the route entry is written. There the
      // route facts already carry them, and the next reply must find the row
      // complete rather than advise it again.
      const inherited = request.models.length === 1 && request.compat !== undefined
        ? Object.fromEntries(Object.entries(missingSwitches(
          api, { supportsDeveloperRole: false, supportsReasoningEffort: true }, request.compat,
        )).filter(([field]) => target.compat?.[field] === undefined))
        : {}
      if (Object.keys(inherited).length > 0) compat = inherited
    }

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

  const route = missingSwitches(routeApi ?? inferApi(request), routeDialect(dialects), request.compat)
  if (Object.keys(route).length > 0) advice.push({ route: true, compat: route })
  return advice
}
