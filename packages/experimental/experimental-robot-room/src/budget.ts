/**
 * Token budgets: the grant a request may carry, the preflight that refuses a
 * wake before it spends, and the soft-limit check. Pure arithmetic with no
 * provider calls.
 * @module @tomato/experimental-robot-room
 */

/** Limits one turn is checked against. */
export interface TurnBudgetLimits {
  /** Input tokens the member allows for one turn. */
  readonly turnInputTokens: number
  /** Output tokens the member allows for one turn. */
  readonly turnOutputTokens: number
  /** Tokens remaining in the episode. */
  readonly episodeRemaining: number
  /** Tokens remaining in the member's day. */
  readonly dailyRemaining: number
}

/** One preflight decision. */
export type PreflightVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly detail: string }

/**
 * Estimate tokens in one text. Stable and cheap, not a meter; the provider
 * replaces it with measured usage when the adapter reports it.
 * @param text - text to estimate.
 * @returns a positive token estimate.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3))
}

/**
 * Tokens one request may grant its receiver. A grant never exceeds half of the
 * sender's remaining episode budget, so each delegation depth gives strictly
 * less than its parent.
 * @param input - sender and episode remaining budgets.
 * @returns the grant, at least `1` when any budget remains.
 */
export function grantFor(input: {
  readonly senderRemaining: number
  readonly episodeRemaining: number
  readonly memberTurnCap: number
}): number {
  const remaining = Math.max(0, Math.min(input.senderRemaining, input.episodeRemaining))
  if (remaining <= 0) return 0
  return Math.max(1, Math.floor(Math.min(remaining / 2, input.memberTurnCap)))
}

/**
 * Refuse a wake before it starts when the known prompt plus the expected output
 * cannot fit the turn, episode, or member-day limit.
 * @param input - estimated prompt, expected output, and remaining limits.
 * @returns the verdict; a refusal names the smallest exhausted limit.
 */
export function preflight(input: {
  readonly estimatedPromptTokens: number
  readonly expectedOutputTokens: number
  readonly limits: TurnBudgetLimits
}): PreflightVerdict {
  const { estimatedPromptTokens: prompt, expectedOutputTokens: output, limits } = input
  const needed = Math.max(0, prompt) + Math.max(0, output)
  if (needed <= 0) return { ok: true }
  if (prompt > limits.turnInputTokens) {
    return { ok: false, detail: `the prompt needs ${prompt} input tokens, over the turn limit of ${limits.turnInputTokens}` }
  }
  if (output > limits.turnOutputTokens) {
    return { ok: false, detail: `the expected answer needs ${output} output tokens, over the turn limit of ${limits.turnOutputTokens}` }
  }
  if (needed > limits.episodeRemaining) {
    return { ok: false, detail: `this turn needs ${needed} tokens, over the episode remaining ${limits.episodeRemaining}` }
  }
  if (needed > limits.dailyRemaining) {
    return { ok: false, detail: `this turn needs ${needed} tokens, over the member daily remaining ${limits.dailyRemaining}` }
  }
  return { ok: true }
}

/**
 * Whether a used amount crossed the soft ratio of a limit.
 * @param used - amount spent.
 * @param limit - ceiling.
 * @param ratio - soft ratio in `(0, 1)`.
 * @returns whether the soft limit was reached.
 */
export function softLimitCrossed(used: number, limit: number, ratio: number): boolean {
  return limit > 0 && used / limit >= ratio
}

/**
 * Remaining tokens after a spend, never below zero.
 * @param limit - ceiling.
 * @param used - amount already spent.
 * @returns the remaining amount.
 */
export function remaining(limit: number, used: number): number {
  return Math.max(0, limit - used)
}
