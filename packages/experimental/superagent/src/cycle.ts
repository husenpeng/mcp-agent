/**
 * One intake cycle: read the bot service, admit each event, and either start a
 * ticket or let an existing one continue. This is the deterministic half of the
 * supervisor; the judgement that decides how far work may go runs after it.
 */
import { accept } from './index.ts'
import { admit, mandateFor } from './policy.ts'
import { pollFeishu, toTrigger } from './source.ts'
import { releaseRequest } from './supervise.ts'
import type { Admission, Policy } from './policy.ts'
import type { IntakeOutcome } from './engine.ts'
import type { Supervisor } from './executor.ts'
import type { BotGateway } from './source.ts'
import type { SuperagentStore } from './store.ts'
import type { MandateId, MandateScope, ThreadRef, Ticket, TicketId, Trigger } from './types.ts'

/** What one cycle did with one event. */
export type CycleVerdict =
  | { readonly kind: 'accepted'; readonly tickets: readonly Ticket[]; readonly trigger: Trigger }
  | { readonly kind: 'declined'; readonly reason: string; readonly trigger: Trigger }
  | { readonly kind: 'continued'; readonly reached: readonly TicketId[]; readonly trigger: Trigger }
  | { readonly kind: 'refused'; readonly admission: Admission; readonly trigger: Trigger }

/** What one cycle read and decided. */
export interface CycleResult {
  /** Cursor the next cycle continues from. */
  readonly nextCursor: number
  /** One verdict per event, oldest first. */
  readonly verdicts: readonly CycleVerdict[]
  /** What the engine did with each event's trigger. */
  readonly outcomes: readonly IntakeOutcome[]
}

/** What one cycle needs to run. */
export interface CycleRequest {
  readonly store: SuperagentStore
  readonly gateway: BotGateway
  readonly policy: Policy
  /** Cursor the caller last processed. */
  readonly cursor: number
  /** Most events to read in one cycle. */
  readonly limit: number
  /** Identity to give the next ticket. */
  readonly nextTicketId: () => TicketId
  /** Identity to give the next mandate. */
  readonly nextMandateId: () => MandateId
  /** How far accepted work may go; defaults to a change. */
  readonly scope?: MandateScope
  /** The agent's own open id, when the deployment knows it. */
  readonly botOpenId?: string
  /** Session that supervises the accepted work; it may read every Session the work uses. */
  readonly supervisor: string
  /**
   * Model step that decides what a request becomes. Without it a request opens
   * one ticket named by its text; with it, one ticket per piece it plans.
   */
  readonly judge?: Supervisor
}

/**
 * Read one page of events and act on each. An admitted event with no live
 * ticket on its thread starts one; an admitted event that reached a ticket
 * continues that work; anything refused is recorded with its reason.
 * @param request - store, gateway, policy, cursor, and identity sources.
 * @returns the next cursor and what each event became.
 */
export async function runCycle(request: CycleRequest): Promise<CycleResult> {
  const polled = await pollFeishu(
    request.store,
    request.gateway,
    request.cursor,
    request.limit,
    request.botOpenId,
  )
  const verdicts: CycleVerdict[] = []
  for (const [index, event] of polled.events.entries()) {
    const trigger = toTrigger(event, request.botOpenId)
    const outcome = polled.outcomes[index] as IntakeOutcome
    const admission = admit(request.policy, trigger)
    if (!admission.admitted) {
      verdicts.push({ kind: 'refused', admission, trigger })
      continue
    }
    if (outcome.outcome === 'duplicate' || outcome.reached.length > 0) {
      verdicts.push({ kind: 'continued', reached: outcome.reached, trigger })
      continue
    }
    // The release lane belongs to a person; no model turn decides it.
    if (releaseRequest(trigger.text)) {
      verdicts.push({ kind: 'declined', reason: 'a person owns the release', trigger })
      continue
    }
    const judge = request.judge
    const decision = judge === undefined
      ? undefined
      : await judge.supervise({ trigger, policyVersion: request.policy.version })
    if (decision !== undefined && !decision.accepted) {
      verdicts.push({ kind: 'declined', reason: decision.reason ?? 'declined', trigger })
      continue
    }
    const plans = decision?.plans ?? [{ subject: subjectOf(trigger), scope: request.scope ?? 'change' }]
    const tickets = plans.map(plan => accept(request.store, {
      id: request.nextTicketId(),
      subject: plan.subject,
      mandate: mandateFor(request.nextMandateId(), request.policy, admission, trigger, plan.scope),
      thread: trigger.threads[0] as ThreadRef,
      supervisor: request.supervisor,
    }))
    verdicts.push({ kind: 'accepted', tickets, trigger })
  }
  return { nextCursor: polled.nextCursor, verdicts, outcomes: polled.outcomes }
}

/**
 * The subject a ticket carries, taken from the request text.
 * @param trigger - the event that started the work.
 * @returns a one-line subject, bounded so a long message cannot flood a list.
 */
export function subjectOf(trigger: Trigger): string {
  const line = trigger.text.replaceAll(/\s+/gu, ' ').trim()
  return line.length <= 120 ? line : `${line.slice(0, 119)}…`
}
