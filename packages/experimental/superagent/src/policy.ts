/**
 * Admission: the deterministic part of an acceptance. A policy states which
 * actors may originate work on which source, and a request must address the
 * agent. The model's judgement comes after admission; it never overrides it.
 */
import type { Mandate, MandateId, MandateScope, MandateStrength, ThreadRef, Trigger } from './types.ts'

/** One source's part of the policy. */
export interface SourcePolicy {
  /** Source this part governs, such as `feishu`. */
  readonly source: string
  /** Actor identities, in that source's own namespace, that may originate work. */
  readonly allowedActors: readonly string[]
}

/** The versioned rules every acceptance is judged under. */
export interface Policy {
  /** Changes when the rules change; recorded in each mandate. */
  readonly version: string
  /** Per-source rules. A source with no part admits nobody. */
  readonly sources: readonly SourcePolicy[]
}

/** Why a trigger was admitted, or why it was not. */
export type Admission =
  | { readonly admitted: true; readonly strength: MandateStrength; readonly rule: string }
  | { readonly admitted: false; readonly reason: AdmissionReason }

/** Stable reasons a trigger is not admitted, so a refusal is recorded rather than dropped. */
export type AdmissionReason = 'bot-authored' | 'unknown-source' | 'actor-not-allowed' | 'not-addressed'

/** One admission that let a trigger through. */
export type Admitted = Extract<Admission, { readonly admitted: true }>

/**
 * Judge one trigger against the policy.
 * @param policy - current rules.
 * @param trigger - normalized event to judge.
 * @returns the admission, carrying the rule that decided it.
 */
export function admit(policy: Policy, trigger: Trigger): Admission {
  if (!trigger.human) return { admitted: false, reason: 'bot-authored' }
  const part = policy.sources.find(source => source.source === trigger.source)
  if (part === undefined) return { admitted: false, reason: 'unknown-source' }
  if (!part.allowedActors.includes(trigger.actor)) return { admitted: false, reason: 'actor-not-allowed' }
  if (trigger.addressed === undefined) return { admitted: false, reason: 'not-addressed' }
  return { admitted: true, strength: 'explicit', rule: `${trigger.source}:${trigger.addressed}` }
}

/**
 * Record why one admitted trigger may become work. The mandate is immutable and
 * names the policy version it was judged under, so a later policy change can be
 * told apart from the rules that actually applied.
 * @param id - identity the engine gives the mandate.
 * @param policy - rules in force when the trigger was judged.
 * @param admission - the admission it earned.
 * @param trigger - the event that was admitted.
 * @param scope - how far the work may go.
 * @returns the mandate to attach to the ticket.
 */
export function mandateFor(
  id: MandateId,
  policy: Policy,
  admission: Admitted,
  trigger: Trigger,
  scope: MandateScope,
): Mandate {
  return {
    id,
    policyVersion: policy.version,
    scope,
    strength: admission.strength,
    matchedRules: [admission.rule],
    sender: trigger.actor,
    thread: trigger.threads[0] as ThreadRef,
    at: trigger.at,
  }
}
