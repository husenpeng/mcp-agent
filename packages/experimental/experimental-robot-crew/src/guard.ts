/**
 * Crew loop protection: one bounded state machine per run that counts
 * activations, A2A messages, approximate tokens, and wall clock, refuses
 * duplicate or over-deep messages, and trips the run on no progress. Pure
 * counters with an injected clock so the policy is testable without timers.
 * @module @tomato/experimental-robot-crew
 */

import type { CrewA2aRefusal, CrewA2aSpec, CrewGuardSpec, CrewTripReason } from './types.ts'

/** Guard limits a run enforces. */
export type GuardLimits = CrewGuardSpec

/** Admission result for one candidate A2A message. */
export type GuardVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly refusal: CrewA2aRefusal; readonly detail: string }

/** Why and where the guard stopped the run. */
export interface GuardTrip {
  /** Exceeded limit. */
  readonly reason: CrewTripReason
  /** One sentence naming the exact limit and the observed value. */
  readonly detail: string
}

/** Current counters, safe to persist on the run record. */
export interface GuardSnapshot {
  /** Complete activations. */
  readonly steps: number
  /** Delivered A2A messages. */
  readonly messages: number
  /** Approximate model tokens. */
  readonly tokens: number
  /** Wall-clock milliseconds since the guard started. */
  readonly elapsedMs: number
  /** Set once the guard tripped. */
  readonly trip?: GuardTrip
}

/**
 * Normalize one output for repetition detection.
 * @param text - raw node output.
 * @returns lowercase word multiset text.
 */
function words(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/u).filter(word => word.length > 0))
}

/**
 * Jaccard similarity of two texts, used to recognize a step that repeats what
 * the previous step already said.
 * @param left - first text.
 * @param right - second text.
 * @returns `0` for no shared words, `1` for identical word sets.
 */
export function similarity(left: string, right: string): number {
  const a = words(left)
  const b = words(right)
  if (a.size === 0 && b.size === 0) return 1
  let shared = 0
  for (const word of a) if (b.has(word)) shared += 1
  return shared / (a.size + b.size - shared)
}

/** Similarity at or above which two step outputs count as the same work. */
export const NO_PROGRESS_SIMILARITY = 0.85

/** One A2A admission request. */
export interface MessageAdmission {
  /** Sender node id or `orchestrator`. */
  readonly from: string
  /** Receiver node id. */
  readonly to: string
  /** Intent the receiver must admit. */
  readonly intent: 'request' | 'delegate' | 'event'
  /** Signature from {@link a2aSignature}. */
  readonly signature: string
  /** Forwarding depth of the candidate. */
  readonly hop: number
  /** Peer and intent admission from the specification. */
  readonly a2a: CrewA2aSpec
  /** Node ids the receiver is allowed to call when `a2a.peers` is empty. */
  readonly knownNodes: ReadonlySet<string>
}

/**
 * Counters and refusals for one crew run. Create one per run; never reuse it
 * across runs, because every counter is a ceiling for that run alone.
 */
export class CrewLoopGuard {
  private steps = 0
  private messages = 0
  private tokens = 0
  private readonly signatures = new Map<string, number>()
  private readonly outputs: string[] = []
  private readonly startedAt: number
  private tripped: GuardTrip | undefined

  /**
   * @param limits - ceilings this run enforces.
   * @param now - clock; supplied so tests stay deterministic.
   */
  constructor(
    private readonly limits: GuardLimits,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.startedAt = now()
  }

  /**
   * Admit or refuse one A2A message before it is delivered.
   * @param input - candidate message and the specification's admission rules.
   * @returns the verdict; a refusal never throws.
   */
  admitMessage(input: MessageAdmission): GuardVerdict {
    if (this.tripped !== undefined) {
      return { ok: false, refusal: 'scope', detail: `the run already tripped on ${this.tripped.reason}` }
    }
    if (input.from === input.to) {
      return { ok: false, refusal: 'self', detail: `node "${input.to}" cannot message itself` }
    }
    if (!input.knownNodes.has(input.to)) {
      return { ok: false, refusal: 'unknown-peer', detail: `node "${input.to}" is not part of this crew` }
    }
    const peers = input.a2a.peers
    if (peers.length > 0 && !peers.includes(input.to)) {
      return { ok: false, refusal: 'scope', detail: `node "${input.to}" is outside the declared peer list` }
    }
    const intents = input.a2a.intents
    if (intents.length > 0 && !intents.includes(input.intent)) {
      return { ok: false, refusal: 'intent', detail: `intent "${input.intent}" is not accepted by this crew` }
    }
    if (input.hop > this.limits.maxHops) {
      return { ok: false, refusal: 'hops', detail: `forwarding depth ${input.hop} exceeds the limit of ${this.limits.maxHops}` }
    }
    if (this.messages >= this.limits.maxMessages) {
      return { ok: false, refusal: 'messages', detail: `the run already delivered ${this.messages} messages` }
    }
    const seen = this.signatures.get(input.signature) ?? 0
    if (seen >= this.limits.maxDuplicates) {
      return {
        ok: false,
        refusal: 'duplicate',
        detail: `the same message reached "${input.to}" ${seen} time${seen === 1 ? '' : 's'}`,
      }
    }
    this.signatures.set(input.signature, seen + 1)
    this.messages += 1
    return { ok: true }
  }

  /**
   * Record one finished activation and check for repetition.
   * @param output - the activation's final text.
   * @returns the trip when this step exhausted a limit.
   */
  recordStep(output: string): GuardTrip | undefined {
    this.steps += 1
    if (this.steps > this.limits.maxSteps) {
      return this.trip('steps', `the run reached ${this.steps} activations, over the limit of ${this.limits.maxSteps}`)
    }
    this.outputs.push(output)
    const window = Math.max(2, this.limits.noProgressWindow)
    if (this.outputs.length >= window) {
      const recent = this.outputs.slice(-window)
      const first = recent[0] ?? ''
      const repeated = recent.every(candidate => similarity(candidate, first) >= NO_PROGRESS_SIMILARITY)
      // A short acknowledgement is not evidence of progress either, but an
      // empty result is reported by the orchestrator as a failed step.
      if (repeated && first.trim().length > 40) {
        return this.trip(
          'no-progress',
          `the last ${window} steps produced near-identical output (${Math.round(similarity(recent.at(-1) ?? '', first) * 100)}% overlap)`,
        )
      }
    }
    return undefined
  }

  /**
   * Add approximate model tokens for one activation.
   * @param tokens - positive token estimate.
   * @returns the trip when this addition exhausted the token ceiling.
   */
  recordTokens(tokens: number): GuardTrip | undefined {
    this.tokens += Math.max(0, Math.round(tokens))
    if (this.tokens > this.limits.tokens) {
      return this.trip('tokens', `the run used about ${this.tokens} tokens, over the budget of ${this.limits.tokens}`)
    }
    return undefined
  }

  /**
   * Check the time-based limits before starting the next activation.
   * @returns the trip when the run exceeded its wall clock, otherwise `undefined`.
   */
  check(): GuardTrip | undefined {
    if (this.tripped !== undefined) return this.tripped
    const elapsed = this.now() - this.startedAt
    if (elapsed > this.limits.wallClockMs) {
      return this.trip('wall-clock', `the run took ${Math.round(elapsed / 1000)}s, over the limit of ${Math.round(this.limits.wallClockMs / 1000)}s`)
    }
    return undefined
  }

  /** Current counters and the trip, when one was reached. */
  snapshot(): GuardSnapshot {
    return {
      steps: this.steps,
      messages: this.messages,
      tokens: this.tokens,
      elapsedMs: Math.max(0, this.now() - this.startedAt),
      ...this.tripped === undefined ? {} : { trip: this.tripped },
    }
  }

  private trip(reason: CrewTripReason, detail: string): GuardTrip {
    this.tripped ??= Object.freeze({ reason, detail })
    return this.tripped
  }
}
