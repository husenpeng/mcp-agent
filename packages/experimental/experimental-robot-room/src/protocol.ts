/**
 * A2A v2 envelope construction and the normalized signature the guard
 * deduplicates. Pure; no transport and no lifecycle.
 * @module @tomato/experimental-robot-room
 */

import type { A2aEnvelopeV2, A2aIntent, RoomId, RoomMemberId, RoomEpisodeId, ReplyExpectation, ReplyStatus } from './types.ts'

/** Protocol identifier carried by every v2 envelope. */
export const A2A_PROTOCOL_V2 = 'tomato-a2a/2'

/** Longest task text one envelope may carry. */
export const A2A_MAX_TASK = 4000

/** Longest context text one envelope may carry. */
export const A2A_MAX_CONTEXT = 8000

/** Input accepted by {@link createEnvelopeV2}. */
export interface RoomEnvelopeInput {
  /** Envelope identity, normally a fresh UUID. */
  readonly id: string
  /** Room identity. */
  readonly room: RoomId
  /** Episode identity. */
  readonly episode: RoomEpisodeId
  /** Sender. */
  readonly from: RoomMemberId
  /** Receivers. */
  readonly to: readonly RoomMemberId[]
  /** Intent. */
  readonly intent: A2aIntent
  /** Task outcome. */
  readonly task: string
  /** Sender context. */
  readonly context?: string
  /** Referenced artifacts. */
  readonly artifacts?: readonly string[]
  /** Expected reply. */
  readonly expect?: ReplyExpectation
  /** Envelope being answered. */
  readonly replyTo?: string
  /** Reply status. */
  readonly status?: ReplyStatus
  /** Causal depth; at least 1. */
  readonly depth: number
  /** Tokens granted to the receiver. */
  readonly grantTokens: number
  /** Epoch milliseconds deadline. */
  readonly deadline: number
  /** Envelope visibility. */
  readonly visibility?: 'room' | 'private'
}

/**
 * Bound one text field to a protocol limit, keeping the head and the tail so a
 * truncated task still names its own success condition.
 * @param text - unbounded text.
 * @param limit - maximum characters.
 * @returns text no longer than `limit`.
 */
export function clampText(text: string, limit: number): string {
  const normalized = text.trim()
  if (normalized.length <= limit) return normalized
  const half = Math.max(1, Math.floor(limit / 2) - 16)
  return `${normalized.slice(0, half)}\n…\n${normalized.slice(-half)}`
}

/**
 * Normalize text for duplicate detection: lowercase, punctuation removed,
 * whitespace collapsed. Two messages a person would read as the same share a
 * signature.
 * @param text - raw text.
 * @returns the normalized form.
 */
export function normalizeRoomText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .replace(/[\p{P}\p{S}]+/gu, '')
    .trim()
}

/**
 * Signature the guard counts duplicates by. The receiver participates, so the
 * same question to two peers is not a duplicate.
 * @param input - sender, receivers, intent, task, and context.
 * @returns one stable signature string.
 */
export function roomSignature(input: {
  readonly from: RoomMemberId
  readonly to: readonly RoomMemberId[]
  readonly intent: A2aIntent
  readonly task: string
  readonly context?: string
}): string {
  const receivers = [...input.to].sort().join(',')
  return `${input.from}>${receivers}:${input.intent}:${normalizeRoomText(input.task)}:${normalizeRoomText(input.context ?? '')}`
}

/**
 * Build one immutable A2A v2 envelope.
 * @param input - envelope fields.
 * @returns the frozen envelope.
 * @throws when a required field is empty or a number is out of range.
 */
export function createEnvelopeV2(input: RoomEnvelopeInput): A2aEnvelopeV2 {
  if (input.id.trim() === '') throw new Error('an A2A envelope needs an id')
  if (input.to.length === 0) throw new Error('an A2A envelope needs at least one receiver')
  if (!Number.isInteger(input.depth) || input.depth < 1) throw new Error('an A2A envelope depth must be a positive integer')
  if (!Number.isFinite(input.grantTokens) || input.grantTokens < 0) throw new Error('an A2A envelope grant must be a non-negative number')
  if (!Number.isFinite(input.deadline) || input.deadline <= 0) throw new Error('an A2A envelope deadline must be a positive timestamp')
  const envelope: A2aEnvelopeV2 = Object.freeze({
    protocol: A2A_PROTOCOL_V2,
    id: input.id,
    room: input.room,
    episode: input.episode,
    from: input.from,
    to: Object.freeze([...input.to]),
    intent: input.intent,
    task: clampText(input.task, A2A_MAX_TASK),
    context: clampText(input.context ?? '', A2A_MAX_CONTEXT),
    artifacts: Object.freeze([...(input.artifacts ?? [])]),
    ...input.expect === undefined ? {} : { expect: input.expect },
    ...input.replyTo === undefined ? {} : { replyTo: input.replyTo },
    ...input.status === undefined ? {} : { status: input.status },
    depth: input.depth,
    grantTokens: input.grantTokens,
    deadline: input.deadline,
    signature: roomSignature({
      from: input.from,
      to: input.to,
      intent: input.intent,
      task: input.task,
      ...input.context === undefined ? {} : { context: input.context },
    }),
    visibility: input.visibility ?? 'room',
  })
  return envelope
}

/**
 * Whether a value carries a supported v2 envelope.
 * @param value - untrusted stored value.
 * @returns whether the value is a v2 envelope.
 */
export function isEnvelopeV2(value: unknown): value is A2aEnvelopeV2 {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<A2aEnvelopeV2>
  return candidate.protocol === A2A_PROTOCOL_V2
    && typeof candidate.id === 'string'
    && Array.isArray(candidate.to)
    && candidate.to.length > 0
    && typeof candidate.task === 'string'
    && typeof candidate.context === 'string'
    && typeof candidate.depth === 'number'
    && typeof candidate.grantTokens === 'number'
    && typeof candidate.deadline === 'number'
    && typeof candidate.signature === 'string'
    && (candidate.intent === 'request' || candidate.intent === 'delegate' || candidate.intent === 'handoff'
      || candidate.intent === 'inform' || candidate.intent === 'reply')
}
