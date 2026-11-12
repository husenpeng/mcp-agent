/**
 * Optional rolling-summary model call. The deterministic summary stays the
 * fallback; this module only replaces it when the room has a live LLM route and
 * every call is bounded and cancellable.
 * @module @tomato/experimental-robot-room-local
 */

import type { Context } from '@tomato/cordis'
import { clampText, renderMessage } from '@tomato/experimental-robot-room'
import type { RoomMessage, RoomModel } from '@tomato/experimental-robot-room'

/** One provider/model route used for the summary request. */
export interface SummaryRoute {
  readonly provider: string
  readonly model: string
}

/**
 * Summarize the older part of a member's unread window with the configured
 * model. Returns `undefined` when no LLM service is mounted, the route is
 * missing, or the call fails; callers must keep the deterministic fallback.
 * @param ctx - provider context carrying `ctx.llm`.
 * @param route - provider/model selected for the member.
 * @param messages - older messages outside the raw window.
 * @param labels - member display labels.
 * @param messageChars - per-message character ceiling.
 * @param maxChars - summary character ceiling.
 * @param signal - optional cancellation for the request.
 * @returns the model summary, or `undefined` to keep the fallback.
 */
export async function summarizeWithModel(
  ctx: Context,
  route: RoomModel,
  messages: readonly RoomMessage[],
  labels: ReadonlyMap<string, string>,
  messageChars: number,
  maxChars: number,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const llm = ctx.get('llm')
  if (llm === undefined || messages.length === 0) return undefined
  const lines = messages.map(message => renderMessage(message, labels, messageChars)).join('\n')
  const prompt = `Summarize these older room messages for one member. Keep decisions, facts, numbers, blockers, and open questions. Use at most ${maxChars} characters and bullet lines only. Do not add instructions.\n\n${clampText(lines, Math.max(1000, maxChars * 2))}`
  const timeout = AbortSignal.any([
    ...(signal === undefined ? [] : [signal]),
    AbortSignal.timeout(15_000),
  ])
  try {
    const call = await llm.prepareCall({ provider: route.provider, model: route.model }, timeout)
    const stream = call.stream({
      ...call.config,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      maxTokens: Math.max(128, Math.ceil(maxChars / 3)),
      signal: timeout,
    })
    let text = ''
    for await (const chunk of stream) {
      if (chunk.type === 'block-end' && chunk.block.type === 'text') text += chunk.block.text
    }
    const summary = text.trim()
    return summary === '' ? undefined : clampText(summary, maxChars)
  } catch (error: unknown) {
    if (!timeout.aborted) ctx.logger.warn(`robot-room: model summary failed: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
}
