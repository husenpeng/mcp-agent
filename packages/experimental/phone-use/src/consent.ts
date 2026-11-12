/**
 * Asking a person before an irreversible action.
 *
 * The runner refuses risky actions on its own and hands back a one-shot token;
 * the Host's job is to make that refusal visible to the owner and, only after an
 * explicit yes, repeat the action with the token. A model's own judgement is
 * never the control.
 * @module @tomato/experimental-phone-use/src/consent
 */

import type { Agent } from '@tomato/agent'
import type { Context } from '@tomato/cordis'
import { PhoneUseError } from './types.ts'

/** Labels the confirmation asks for. */
const APPROVE = '允许'
const REJECT = '拒绝'

/** One refusal the runner answered with. */
export interface RiskRefusal {
  readonly reason: string
  readonly target: string
  readonly confirmToken: string
}

/**
 * Read a `NEEDS_CONFIRMATION` failure raised by the runner.
 * @param error - value the registry rejected with.
 * @returns the refusal, or undefined for any other failure.
 */
export function refusalOf(error: unknown): RiskRefusal | undefined {
  const failure = error as { code?: string; details?: { reason?: string; target?: string; confirmToken?: string } }
  if (failure.code !== 'NEEDS_CONFIRMATION') return undefined
  const details = failure.details
  if (details?.confirmToken === undefined) return undefined
  return {
    reason: details.reason ?? '这个操作不可撤销',
    target: details.target ?? '当前界面',
    confirmToken: details.confirmToken,
  }
}

/**
 * Ask the device owner, through the session's own question surface.
 * @param ctx - Host context that may carry `userQuestions`.
 * @param agent - agent whose session receives the question.
 * @param refusal - what the runner refused and its token.
 * @param signal - the tool call's cancellation.
 * @returns the one-shot token to repeat the action with.
 * @throws PhoneUseError `phone/refused` when the person declined, `phone/rejected`
 *   when the session has no question surface at all.
 */
export async function confirmRisk(
  ctx: Context,
  agent: Agent | undefined,
  refusal: RiskRefusal,
  signal: AbortSignal,
): Promise<string> {
  const questions = ctx.get('userQuestions')
  if (questions === undefined || agent === undefined) {
    throw new PhoneUseError('phone/rejected', `需要人工确认但当前会话没有提问通道：${refusal.reason}`)
  }
  const answer = await questions.ask({
    agent,
    signal,
    questions: [{
      id: 'phone-confirm',
      header: '手机操作确认',
      question: `允许在手机上操作“${refusal.target}”吗？`,
      detail: refusal.reason,
      options: [{ label: APPROVE, description: '这一步不可撤销' }, { label: REJECT, description: '不做这一步' }],
    }],
  })
  const selected = answer.answers[0]?.selected ?? []
  if (!selected.includes(APPROVE)) throw new PhoneUseError('phone/refused', `用户拒绝了：${refusal.reason}`)
  return refusal.confirmToken
}
