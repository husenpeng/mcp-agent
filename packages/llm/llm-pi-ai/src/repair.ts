/**
 * Protocol refusals one request can repair and retry without asking.
 *
 * A person adding a third-party gateway cannot know which role carries the
 * system prompt, which field caps the output, or whether the far end reads an
 * image; the refusal is the first place that fact appears. Diagnosing it here
 * turns the first failing request into the working one, and the switch it
 * writes is the same one **Adapt models** would have written ahead of time.
 *
 * Only a refusal that names its cause and a switch this harness may configure
 * is repaired. Everything else keeps the provider's own error: guessing wastes
 * a retry and hides the real message behind a second failure.
 *
 * @module @tomato/llm-pi-ai/repair
 */

import type { PiAiModality } from './config.ts'

/**
 * What a provider refused, as the switch that answers it.
 *
 * `summary` names the refusal for a log line and for the config write's
 * description; the two fields beside it are what the retried request adds.
 */
export interface PiAiRepair {
  /** The refusal this repair answers. */
  readonly summary: 'developer-role' | 'output-token-field' | 'image-input'
  /** Route switches to write, on an `openai-completions` route. */
  readonly compat?: {
    readonly supportsDeveloperRole?: false
    readonly maxTokensField?: 'max_tokens'
  }
  /** Input modalities to narrow, when the endpoint refuses images. */
  readonly input?: readonly PiAiModality[]
}

/** Refusals that carry a usable status, including the ones pi-ai rethrows bare. */
function statusOf(error: unknown): number | undefined {
  for (let current: unknown = error; current !== null && current !== undefined; current = causeOf(current)) {
    const status = (current as { status?: unknown }).status
    if (typeof status === 'number') return status
  }
  return undefined
}

/** One error's `cause`, when it has one. */
function causeOf(error: unknown): unknown {
  return typeof error === 'object' && error !== null ? (error as { cause?: unknown }).cause : undefined
}

/** Every message in an error's cause chain, joined for matching. */
function messagesOf(error: unknown): string {
  const parts: string[] = []
  for (let current: unknown = error; current !== null && current !== undefined; current = causeOf(current)) {
    const message = (current as { message?: unknown }).message
    if (typeof message === 'string') parts.push(message)
    else if (typeof current === 'string') parts.push(current)
  }
  return parts.join(' | ')
}

/** A refusal, in the words gateways use for one. */
const REFUSAL = /(?:not supported|unsupported|does not support|doesn't support|invalid|unknown|unexpected|not allowed)/i

/**
 * Read one provider failure as the switch that would have prevented it.
 *
 * A 4xx is the provider stating the request is wrong; a 5xx, a timeout, a
 * quota, or a credential failure states something else, and none of them is
 * repaired here. A failure carrying no status is still read, because pi-ai
 * rethrows several refusals without one, and the message patterns are narrow
 * enough that a stray mention cannot pass for a refusal.
 * @param error - the failure a provider request raised.
 * @returns the repair to retry with, or undefined when the failure is not one.
 */
export function diagnoseProviderFailure(error: unknown): PiAiRepair | undefined {
  const status = statusOf(error)
  if (status !== undefined && (status < 400 || status >= 500)) return undefined
  const text = messagesOf(error)
  if (text.length === 0) return undefined
  // The `developer` role is the one field whose repair costs a request: a
  // gateway that rejects the role names it beside the word it refuses.
  if (/developer/i.test(text) && /role/i.test(text) && REFUSAL.test(text)) {
    return { summary: 'developer-role', compat: { supportsDeveloperRole: false } }
  }
  // The output cap rides `max_completion_tokens` by pi-ai's own default, so a
  // server that only knows `max_tokens` refuses the field by name.
  if (/max_completion_tokens/i.test(text) && REFUSAL.test(text)) {
    return { summary: 'output-token-field', compat: { maxTokensField: 'max_tokens' } }
  }
  // An image refusal is about the modality, not the picture: a size, pixel, or
  // format complaint names the limit and is left to the caller to fix.
  if (/image/i.test(text) && REFUSAL.test(text) && !/pixel|byte|size|dimension|resolution|format/i.test(text)) {
    return { summary: 'image-input', input: ['text'] }
  }
  return undefined
}
/** The config fields one repair writes on a route. */
export interface PiAiRepairPatch<M> {
  /** Route switches to merge into the route's `compat`. */
  readonly compat?: PiAiRepair['compat']
  /** The route's whole model list, with one entry's input narrowed. */
  readonly models?: readonly M[]
}

/**
 * The config write that settles a repair, or undefined when the route needs none.
 *
 * A switch the route already states is not written again: the repair answered
 * the request, and a second identical write would reload the composition for
 * nothing. An image repair reaches a model the route declares, because a
 * route-wide default cannot narrow one model — a catalog route with no `models`
 * list has no entry to edit, and the caller keeps that repair in memory only.
 * @param route - the route's configured profile, when it is declared.
 * @param model - the model id the refused request named.
 * @param repair - the repair the refusal answered.
 * @returns the fields to merge on the route, or undefined to write nothing.
 */
export function repairSettingsPatch<M extends { readonly id: string; readonly input?: readonly PiAiModality[] }>(
  route: { readonly compat?: object; readonly models?: readonly M[] } | undefined,
  model: string,
  repair: PiAiRepair,
): PiAiRepairPatch<M> | undefined {
  if (route === undefined) return undefined
  if (repair.compat !== undefined) {
    const stated = route.compat as Record<string, unknown> | undefined
    const missing = Object.entries(repair.compat).filter(([field, value]) => stated?.[field] !== value)
    if (missing.length === 0) return undefined
    return { compat: Object.fromEntries(missing) }
  }
  const models = route.models
  const index = models?.findIndex(entry => entry.id === model) ?? -1
  const entry = models?.[index]
  if (models === undefined || entry === undefined) return undefined
  if (entry.input?.length === 1 && entry.input[0] === 'text') return undefined
  return { models: models.map((candidate, at) => at === index ? { ...candidate, input: ['text'] as const } : candidate) }
}
