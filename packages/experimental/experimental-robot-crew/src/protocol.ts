/**
 * A2A envelope construction and signature: one protocol identifier, one
 * immutable envelope, and the normalized signature the loop guard deduplicates.
 * Pure; no transport, no lifecycle.
 * @module @tomato/experimental-robot-crew
 */

import { A2A_PROTOCOL } from './types.ts'
import type { A2aEnvelope, A2aIntent, CrewRunId } from './types.ts'

/** Longest task or payload text one envelope may carry. */
export const A2A_MAX_TEXT = 12_000

/** Input accepted by {@link createEnvelope}. */
export interface EnvelopeInput {
  /** Envelope identity, normally a fresh UUID. */
  readonly id: string
  /** Run the envelope belongs to. */
  readonly run: CrewRunId
  /** Sender node id or `orchestrator`. */
  readonly from: string
  /** Receiver node id. */
  readonly to: string
  /** Intent the receiver admits. */
  readonly intent: A2aIntent
  /** Task the receiver must perform. */
  readonly task: string
  /** Context extracted from the sender's flow memory. */
  readonly payload: string
  /** Forwarding depth. */
  readonly hop: number
  /** Envelope this one answers. */
  readonly replyTo?: string
  /** Creation time; supplied so tests stay deterministic. */
  readonly at?: number
}

/**
 * Bound one text field to the protocol limit, keeping the head and the tail so
 * a truncated task still names its own success condition.
 * @param text - unbounded text.
 * @returns text no longer than {@link A2A_MAX_TEXT}.
 */
export function clampText(text: string): string {
  const normalized = text.trim()
  if (normalized.length <= A2A_MAX_TEXT) return normalized
  const half = Math.floor(A2A_MAX_TEXT / 2) - 16
  return `${normalized.slice(0, half)}\n…\n${normalized.slice(-half)}`
}

/**
 * Build one immutable A2A envelope.
 * @param input - envelope fields; `at` defaults to now.
 * @returns the frozen envelope.
 * @throws when the hop is not a positive integer.
 */
export function createEnvelope(input: EnvelopeInput): A2aEnvelope {
  if (!Number.isInteger(input.hop) || input.hop < 1) throw new Error('an A2A envelope hop must be a positive integer')
  const envelope: A2aEnvelope = {
    id: input.id,
    protocol: A2A_PROTOCOL,
    run: input.run,
    from: input.from,
    to: input.to,
    intent: input.intent,
    task: clampText(input.task),
    payload: clampText(input.payload),
    hop: input.hop,
    ...input.replyTo === undefined ? {} : { replyTo: input.replyTo },
    at: input.at ?? Date.now(),
  }
  return Object.freeze(envelope)
}

/**
 * Normalize text for deduplication: lowercase, punctuation removed, whitespace
 * collapsed. Two tasks a person would read as the same message share a signature.
 * @param text - raw task or payload text.
 * @returns the normalized form.
 */
export function normalizeA2aText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .replace(/[\p{P}\p{S}]+/gu, '')
    .trim()
}

/**
 * Signature the loop guard counts duplicates by. The target participates, so
 * the same question to two different peers is not a duplicate.
 * @param input - sender, receiver, intent, task, and payload.
 * @returns one stable signature string.
 */
export function a2aSignature(input: {
  readonly from: string
  readonly to: string
  readonly intent: A2aIntent
  readonly task: string
  readonly payload: string
}): string {
  return `${input.from}>${input.to}:${input.intent}:${normalizeA2aText(input.task)}:${normalizeA2aText(input.payload)}`
}

/**
 * Whether a value is an A2A envelope this protocol admits. Used at the
 * persistence boundary only; in-process callers pass typed envelopes.
 * @param value - untrusted stored value.
 * @returns whether the value carries a supported protocol version and fields.
 */
export function isEnvelope(value: unknown): value is A2aEnvelope {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<A2aEnvelope>
  return candidate.protocol === A2A_PROTOCOL
    && typeof candidate.id === 'string'
    && typeof candidate.from === 'string'
    && typeof candidate.to === 'string'
    && typeof candidate.task === 'string'
    && typeof candidate.payload === 'string'
    && typeof candidate.hop === 'number'
    && (candidate.intent === 'request' || candidate.intent === 'delegate' || candidate.intent === 'event')
}
