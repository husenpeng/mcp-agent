/**
 * Single structured model call: prepareCall -> stream -> parse.
 * Follows the capture.ts pattern exactly.
 * @module @tomato/memory-dream/call
 */

import { BlockAssembler, createUserMessage } from '@tomato/llm'
import type { Context } from '@tomato/cordis'
import type { Message } from '@tomato/llm'
import { deadline } from '@tomato/timeout'
/** Most reply characters one run record keeps, so an empty plan stays explainable. */
export const MAX_LOGGED_REPLY_CHARS = 2000

import { DREAM_SYSTEM } from './prompt.ts'
import { parseDreamPlan, validatePlanOps } from './plan.ts'
import type { DreamPlan } from './types.ts'

/** Result of one dream model call. */
export interface DreamCallResult {
  readonly status: 'planned' | 'empty' | 'failed'
  readonly plan?: DreamPlan | undefined
  readonly reason?: string | undefined
  /** Raw reply text, bounded, so an empty plan stays explainable. */
  readonly reply?: string | undefined
  readonly usage?: { readonly inputTokens: number; readonly outputTokens: number } | undefined
}

/** Options for one dream call. */
export interface DreamCallOptions {
  readonly provider: string
  readonly model: string
  readonly maxTokens: number
  readonly timeoutMs: number
  readonly input: string
  readonly knownIds: ReadonlySet<string>
  readonly maxPlanOps: number
  readonly signal: AbortSignal
}

/**
 * Make one bounded model call to consolidate memory.
 * @param ctx - context carrying `ctx.llm`.
 * @param options - call configuration.
 * @returns the parsed and validated plan, or a failure reason.
 */
export async function dreamCall(ctx: Context, options: DreamCallOptions): Promise<DreamCallResult> {
  const { provider, model, maxTokens, timeoutMs, input, knownIds, maxPlanOps, signal } = options

  let reply: string
  let usage: { inputTokens: number; outputTokens: number } | undefined
  try {
    using callDeadline = deadline(signal, timeoutMs, 'MEMORY_DREAM_TIMEOUT')
    const call = await ctx.llm.prepareCall({ provider, model, maxTokens, temperature: 0 }, callDeadline.signal)
    const messages: Message[] = [createUserMessage({
      content: [{ type: 'text', text: input }],
      source: { kind: 'experimental-memory-dream' },
    })]
    const assembler = new BlockAssembler()
    for await (const chunk of call.stream({
      ...call.config,
      messages,
      system: DREAM_SYSTEM,
      signal: callDeadline.signal,
    })) {
      assembler.push(chunk)
    }
    const finish = assembler.finish
    if (finish.kind === 'error' || finish.kind === 'aborted') {
      return { status: 'failed', reason: finish.failure.message }
    }
    if (finish.kind === 'max-tokens') {
      return { status: 'failed', reason: 'model reply truncated at max-tokens; reduce chunk size or maxPlanOps' }
    }
    reply = assembler.blocks().flatMap(block => block.type === 'text' ? [block.text] : []).join('\n')
    const rawUsage = assembler.usage
    if (rawUsage !== undefined) {
      usage = {
        inputTokens: rawUsage.inputTokens + (rawUsage.cacheReadTokens ?? 0),
        outputTokens: rawUsage.outputTokens,
      }
    }
  } catch (error: unknown) {
    signal.throwIfAborted()
    return { status: 'failed', reason: error instanceof Error ? error.message : String(error) }
  }

  const plan = parseDreamPlan(reply)
  if (plan === undefined) {
    return { status: 'empty', reason: 'no valid JSON plan in reply', reply: reply.slice(0, MAX_LOGGED_REPLY_CHARS) }
  }

  const totalOps = plan.merges.length + plan.proposals.length + plan.promotions.length
    + plan.pins.length + plan.unpins.length + plan.prunes.length
  if (totalOps === 0) {
    return { status: 'empty', plan, usage, reply: reply.slice(0, MAX_LOGGED_REPLY_CHARS) }
  }

  const validated = validatePlanOps(plan, knownIds, maxPlanOps)
  return { status: 'planned', plan: validated, usage, reply: reply.slice(0, MAX_LOGGED_REPLY_CHARS) }
}
