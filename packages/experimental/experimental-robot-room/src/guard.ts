/**
 * Room loop protection and A2A admission: one bounded state machine per
 * episode that counts turns, messages, depth, tokens, wall clock, per-member
 * rates and pending requests, refuses duplicates and ping-pong pairs, and trips
 * the breaker when the room stops making progress. Pure counters with an
 * injected clock.
 * @module @tomato/experimental-robot-room
 */

import type {
  AdmissionVerdict, BreakerState, RefusalCode, RoomMemberId, RoomMemberSpec, RoomSpec, TripReason,
} from './types.ts'
import type { RoomGuardSnapshot } from './types.ts'
import { grantFor, remaining, softLimitCrossed } from './budget.ts'
import { roomSignature } from './protocol.ts'

/** Similarity at or above which two outputs count as the same work. */
export const NO_PROGRESS_SIMILARITY = 0.85

/** Consecutive outputs a no-progress check needs. */
const MAX_RECENT_OUTPUTS = 10

/** One A2A candidate before admission. */
export interface A2aCandidate {
  /** Sender member. */
  readonly from: RoomMemberId
  /** Receivers. */
  readonly to: readonly RoomMemberId[]
  /** Intent. */
  readonly intent: 'request' | 'delegate' | 'handoff' | 'inform' | 'reply'
  /** Task text. */
  readonly task: string
  /** Optional context. */
  readonly context?: string
  /** Causal depth from the human message. */
  readonly depth: number
  /** Tokens granted to each receiver. */
  readonly grantTokens: number
  /** Precomputed signature; derived when omitted. */
  readonly signature?: string
}

/** Remaining budgets the caller supplies at admission time. */
export interface AdmissionBudgets {
  /** Tokens remaining in the episode. */
  readonly episodeRemaining: number
  /** Tokens remaining for the sender. */
  readonly senderRemaining: number
  /** Tokens remaining per receiver. */
  readonly memberRemaining: ReadonlyMap<RoomMemberId, number>
}

/** One human message before routing. */
export interface HumanCandidate {
  /** Message text. */
  readonly text: string
  /** Members explicitly addressed. */
  readonly mentions: readonly RoomMemberId[]
}

/** Human routing result. */
export interface HumanRoute {
  /** Members the message wakes, capped by `routing.maxFanout`. */
  readonly targets: readonly RoomMemberId[]
  /** Why these targets were chosen. */
  readonly reason: string
}

/** One guard trip. */
export interface GuardTrip {
  /** Exceeded limit. */
  readonly reason: TripReason
  /** One sentence naming the observed value and the limit. */
  readonly detail: string
}

/** Complete guard state a provider may persist and restore. */
export interface RoomGuardState {
  /** Counters and breaker. */
  readonly snapshot: RoomGuardSnapshot
  /** Epoch milliseconds the episode opened. */
  readonly startedAt: number
  /** Duplicate signature counts. */
  readonly signatures: ReadonlyMap<string, number>
  /** Pair alternation state. */
  readonly pairs: ReadonlyMap<string, { readonly alternations: number; readonly brokenUntil?: number }>
  /** Unanswered requests by member. */
  readonly pending: ReadonlyMap<RoomMemberId, number>
}

/** Effective limits after a one-episode relaxation. */
interface EffectiveLimits {
  readonly maxDepth: number
  readonly episodeTurns: number
  readonly episodeMessages: number
  readonly episodeTokens: number
  readonly wallClockMs: number
  readonly pingPongLimit: number
}

/** One per-member token bucket. */
interface Bucket {
  tokens: number
  updatedAt: number
}

/** One unordered pair's alternation state. */
interface PairState {
  alternations: number
  brokenUntil?: number
}

/** Words used for repetition detection. */
function words(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/u).filter(word => word.length > 0))
}

/**
 * Jaccard similarity of two texts.
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

/**
 * Whether a member's wake rule matches a human message.
 * @param member - member to check.
 * @param text - message text.
 * @param mentioned - whether the member was mentioned.
 * @returns whether the member should wake.
 */
export function wakeMatches(member: RoomMemberSpec, text: string, mentioned: boolean): boolean {
  if (!member.enabled || member.role === 'observer') return false
  if (mentioned) return true
  const rule = member.wake
  if (rule.kind === 'all-human') return true
  if (rule.kind === 'keywords') {
    const lowered = text.toLowerCase()
    return rule.keywords.some(keyword => lowered.includes(keyword.toLowerCase()))
  }
  return false
}

/**
 * Route one human message to its wake targets.
 * @param spec - room specification.
 * @param candidate - message text and mentions.
 * @returns the targets and why they were chosen.
 */
export function routeHuman(spec: RoomSpec, candidate: HumanCandidate): HumanRoute {
  const mentioned = candidate.mentions.filter((id, index, all) => all.indexOf(id) === index)
  const members = spec.members.filter(member => member.enabled && member.role !== 'observer')
  const addressed = mentioned.flatMap(id => members.filter(member => member.id === id))
  if (addressed.length > 0) {
    return { targets: addressed.slice(0, spec.routing.maxFanout).map(member => member.id), reason: 'explicit mention' }
  }
  if (spec.routing.humanDefault === 'mentioned') return { targets: [], reason: 'no member was mentioned' }
  if (spec.routing.humanDefault === 'coordinator') {
    const coordinator = members.find(member => member.id === spec.routing.coordinator)
    return coordinator === undefined
      ? { targets: [], reason: 'the room has no coordinator' }
      : { targets: [coordinator.id], reason: 'routed to the coordinator' }
  }
  const eligible = members.filter(member => wakeMatches(member, candidate.text, false))
  return { targets: eligible.slice(0, spec.routing.maxFanout).map(member => member.id), reason: 'matched every eligible wake rule' }
}

/**
 * One room's guard. Create one per room; counters restart on every episode,
 * while the breaker, rate buckets, and member days survive across episodes.
 */
export class RoomGuard {
  private breaker: BreakerState = 'closed'
  private tripReason: TripReason | undefined
  private relaxed = false
  private turns = 0
  private messages = 0
  private tokens = 0
  private depth = 0
  private startedAt = 0
  private readonly signatures = new Map<string, number>()
  private readonly pairs = new Map<string, PairState>()
  private readonly buckets = new Map<RoomMemberId, Bucket>()
  private readonly pending = new Map<RoomMemberId, number>()
  private readonly recent: string[] = []

  /**
   * @param spec - room specification whose limits this guard enforces.
   * @param now - clock; supplied so tests stay deterministic.
   */
  constructor(private readonly spec: RoomSpec, private readonly now: () => number = () => Date.now()) {}

  /** Effective limits for the current episode. */
  private effective(): EffectiveLimits {
    const limits = this.spec.guard
    if (!this.relaxed) return limits
    const bump = (value: number): number => Math.ceil(value * 1.5)
    return {
      ...limits,
      episodeTurns: bump(limits.episodeTurns),
      episodeMessages: bump(limits.episodeMessages),
      episodeTokens: bump(limits.episodeTokens),
      pingPongLimit: limits.pingPongLimit + 2,
    }
  }

  /**
   * Start one episode and reset its counters.
   * @param at - epoch milliseconds the human message was recorded.
   */
  beginEpisode(at: number = this.now()): void {
    this.turns = 0
    this.messages = 0
    this.tokens = 0
    this.depth = 0
    this.startedAt = at
    this.relaxed = false
    this.signatures.clear()
    this.pairs.clear()
    this.recent.length = 0
  }

  /**
   * Admit or refuse one A2A candidate. Every check runs before any counter
   * changes, so a refusal leaves the room untouched.
   * @param candidate - sender, receivers, intent, depth, and grant.
   * @param budgets - remaining episode, sender, and receiver budgets.
   * @returns the verdict; a refusal names the first failed check.
   */
  admit(candidate: A2aCandidate, budgets: AdmissionBudgets): AdmissionVerdict {
    const limits = this.effective()
    const sender = this.spec.members.find(member => member.id === candidate.from)
    if (sender === undefined || !sender.enabled) {
      return refuse('not-member', `member "${candidate.from}" is not enabled in this room`)
    }
    if (this.breaker === 'open') {
      return refuse('breaker-open', `the room is tripped on ${this.tripReason ?? 'an earlier limit'}`)
    }
    if (sender.role === 'observer') return refuse('acl', `observer "${sender.id}" cannot send A2A`)
    if (candidate.to.length === 0) return refuse('unknown-peer', 'the message names no receiver')
    if (candidate.to.length > this.spec.routing.maxFanout) {
      return refuse('fanout', `the message names ${candidate.to.length} receivers, over the limit of ${this.spec.routing.maxFanout}`)
    }
    const receivers: RoomMemberSpec[] = []
    for (const id of candidate.to) {
      if (id === sender.id) return refuse('self', `member "${sender.id}" cannot message itself`)
      const receiver = this.spec.members.find(member => member.id === id)
      if (receiver === undefined || !receiver.enabled) return refuse('unknown-peer', `member "${id}" is not enabled in this room`)
      receivers.push(receiver)
    }
    const allowed = sender.a2a.canAddress
    if (allowed !== '*' && !receivers.every(receiver => allowed.includes(receiver.id))) {
      return refuse('acl', `member "${sender.id}" may not address one of the receivers`)
    }
    if (!receivers.every(receiver => receiver.a2a.accepts.includes(candidate.intent))) {
      return refuse('intent', `the receiver does not accept intent "${candidate.intent}"`)
    }
    if (candidate.depth > limits.maxDepth) {
      return refuse('depth', `depth ${candidate.depth} exceeds the limit of ${limits.maxDepth}`)
    }
    if (this.turns >= limits.episodeTurns) {
      return refuse('episode-turns', `the episode already spent ${this.turns} turns, over the limit of ${limits.episodeTurns}`)
    }
    if (this.messages >= limits.episodeMessages) {
      return refuse('episode-messages', `the episode already holds ${this.messages} messages, over the limit of ${limits.episodeMessages}`)
    }
    if (this.tokens >= limits.episodeTokens) {
      return refuse('episode-tokens', `the episode already spent ${this.tokens} tokens, over the limit of ${limits.episodeTokens}`)
    }
    if (this.now() - this.startedAt > limits.wallClockMs) {
      const ran = Math.round((this.now() - this.startedAt) / 1000)
      const max = Math.round(limits.wallClockMs / 1000)
      return refuse('episode-time', `the episode ran ${ran}s, over the limit of ${max}s`)
    }
    const bucket = this.bucketOf(sender.id)
    if (bucket.tokens < 1) {
      return refuse('rate', `member "${sender.id}" is over its ${this.spec.guard.memberTurnsPerMinute}-turns-per-minute rate`)
    }
    if (candidate.intent !== 'reply') {
      for (const receiver of receivers) {
        const waiting = this.pending.get(receiver.id) ?? 0
        if (waiting >= this.spec.guard.maxPendingPerMember) {
          return refuse('pending-limit', `member "${receiver.id}" already holds ${waiting} unanswered requests`)
        }
      }
    }
    const signature = candidate.signature
      ?? roomSignature({
        from: sender.id,
        to: candidate.to,
        intent: candidate.intent,
        task: candidate.task,
        ...candidate.context === undefined ? {} : { context: candidate.context },
      })
    const seen = this.signatures.get(signature) ?? 0
    if (seen >= this.spec.guard.maxDuplicates) {
      return refuse('duplicate', `the same message already reached the room ${seen} time${seen === 1 ? '' : 's'}`)
    }
    const target = receivers[0]
    if (target === undefined) return refuse('unknown-peer', 'the message names no receiver')
    const pair = this.pairOf(sender.id, target.id)
    if (pair.brokenUntil !== undefined && pair.brokenUntil > this.now()) {
      return refuse('ping-pong', `the pair "${sender.id}" and "${target.id}" is paused until ${new Date(pair.brokenUntil).toISOString()}`)
    }
    if (pair.alternations >= limits.pingPongLimit) {
      pair.brokenUntil = this.now() + 10 * 60 * 1000
      const detail = `the pair "${sender.id}" and "${target.id}" alternated ${pair.alternations} times, `
        + `over the limit of ${limits.pingPongLimit}`
      return refuse('ping-pong', detail)
    }
    if (candidate.grantTokens < 0) return refuse('grant', 'a grant cannot be negative')
    const needsGrant = candidate.intent === 'request' || candidate.intent === 'delegate' || candidate.intent === 'handoff'
    if (needsGrant) {
      if (candidate.grantTokens <= 0) return refuse('grant', 'a request must grant its receiver a positive token budget')
      const cap = grantFor({
        senderRemaining: budgets.senderRemaining,
        episodeRemaining: budgets.episodeRemaining,
        memberTurnCap: sender.budget.turnInputTokens,
      })
      if (candidate.grantTokens > cap) {
        return refuse('grant', `the grant ${candidate.grantTokens} exceeds what the sender may delegate (${cap})`)
      }
      for (const receiver of receivers) {
        if ((budgets.memberRemaining.get(receiver.id) ?? 0) <= 0) {
          return refuse('grant', `member "${receiver.id}" has no daily budget left`)
        }
      }
    }
    this.consume(sender.id)
    this.messages += 1
    this.depth = Math.max(this.depth, candidate.depth)
    this.signatures.set(signature, seen + 1)
    this.alternate(pair)
    if (candidate.intent !== 'reply') {
      for (const receiver of receivers) this.pending.set(receiver.id, (this.pending.get(receiver.id) ?? 0) + 1)
    }
    return { ok: true }
  }

  /**
   * Record one finished turn and check the turn, token, and progress limits.
   * @param input - member, measured tokens, and final text.
   * @returns the trip when this turn exhausted a limit.
   */
  recordTurn(input: { readonly member: RoomMemberId; readonly tokens: number; readonly output: string }): GuardTrip | undefined {
    const limits = this.effective()
    this.turns += 1
    this.tokens += Math.max(0, Math.round(input.tokens))
    this.recent.push(input.output)
    if (this.recent.length > MAX_RECENT_OUTPUTS) this.recent.shift()
    if (this.turns > limits.episodeTurns) {
      return this.trip('episode-turns', `the episode reached ${this.turns} turns, over the limit of ${limits.episodeTurns}`)
    }
    if (this.tokens > limits.episodeTokens) {
      return this.trip('episode-tokens', `the episode used about ${this.tokens} tokens, over the budget of ${limits.episodeTokens}`)
    }
    if (this.messages > limits.episodeMessages) {
      return this.trip('episode-messages', `the episode holds ${this.messages} messages, over the limit of ${limits.episodeMessages}`)
    }
    const window = Math.max(2, this.spec.guard.noProgressWindow)
    if (this.recent.length >= window) {
      const recent = this.recent.slice(-window)
      const first = recent[0] ?? ''
      const repeated = recent.every(candidate => similarity(candidate, first) >= this.spec.guard.noProgressSimilarity)
      if (repeated && first.trim().length > 40) {
        const overlap = Math.round(similarity(recent.at(-1) ?? '', first) * 100)
        return this.trip('no-progress', `the last ${window} turns produced near-identical output (${overlap}% overlap)`)
      }
    }
    return undefined
  }

  /**
   * Record one message that did not pass through {@link admit}, such as a human
   * message or a system notice.
   * @param count - messages to add.
   * @returns the trip when the message count exhausted the limit.
   */
  recordMessage(count = 1): GuardTrip | undefined {
    this.messages += count
    const limits = this.effective()
    return this.messages > limits.episodeMessages
      ? this.trip('episode-messages', `the episode holds ${this.messages} messages, over the limit of ${limits.episodeMessages}`)
      : undefined
  }

  /**
   * Check time-based limits before the next wake.
   * @returns the trip when the episode is over its wall clock or already tripped.
   */
  check(): GuardTrip | undefined {
    if (this.breaker === 'open') return this.trip(this.tripReason ?? 'episode-time', 'the room is already tripped')
    const limits = this.effective()
    const elapsed = this.now() - this.startedAt
    if (elapsed > limits.wallClockMs) {
      const took = Math.round(elapsed / 1000)
      const max = Math.round(limits.wallClockMs / 1000)
      return this.trip('episode-time', `the episode took ${took}s, over the limit of ${max}s`)
    }
    return undefined
  }

  /** Open the breaker with a reason. The first trip wins. */
  trip(reason: TripReason, detail: string): GuardTrip {
    this.breaker = 'open'
    this.tripReason ??= reason
    return { reason: this.tripReason, detail }
  }

  /** Move an open breaker to half-open after an operator resumes the room. */
  resume(): void {
    if (this.breaker === 'open') {
      this.breaker = 'half-open'
      this.tripReason = undefined
    }
  }

  /** Close a half-open breaker after one healthy turn. */
  settle(): void {
    if (this.breaker === 'half-open') this.breaker = 'closed'
  }

  /** Raise the episode limits by 50% for the current episode only. */
  relaxOnce(): void {
    this.relaxed = true
  }

  /**
   * Remove one unanswered request once a reply settles.
   * @param member - member that owed the reply.
   */
  settlePending(member: RoomMemberId): void {
    const waiting = this.pending.get(member) ?? 0
    if (waiting <= 0) return
    if (waiting === 1) this.pending.delete(member)
    else this.pending.set(member, waiting - 1)
  }

  /**
   * Unanswered requests a member currently holds.
   * @param member - member to read.
   * @returns the count.
   */
  pendingOf(member: RoomMemberId): number {
    return this.pending.get(member) ?? 0
  }

  /**
   * Tokens a member may still spend in the episode.
   * @param episodeLimit - configured episode ceiling.
   * @returns the remaining amount.
   */
  episodeRemaining(episodeLimit: number): number {
    return remaining(episodeLimit, this.tokens)
  }

  /**
   * Whether the episode crossed the soft ratio of a limit.
   * @param limit - episode ceiling.
   * @param ratio - soft ratio.
   * @returns whether the soft limit is reached.
   */
  softLimit(limit: number, ratio: number): boolean {
    return softLimitCrossed(this.tokens, limit, ratio)
  }

  /** Complete state a provider may persist. */
  export(): RoomGuardState {
    return {
      snapshot: this.snapshot(),
      startedAt: this.startedAt,
      signatures: new Map(this.signatures),
      pairs: new Map([...this.pairs].map(([key, pair]) => [key, {
        alternations: pair.alternations,
        ...pair.brokenUntil === undefined ? {} : { brokenUntil: pair.brokenUntil },
      }])),
      pending: new Map(this.pending),
    }
  }

  /**
   * Restore a persisted guard. Counters and maps are replaced; the clock stays
   * the instance's own.
   * @param state - state previously produced by {@link export}.
   */
  restore(state: RoomGuardState): void {
    this.breaker = state.snapshot.breaker
    this.tripReason = state.snapshot.reason
    this.turns = state.snapshot.turns
    this.messages = state.snapshot.messages
    this.tokens = state.snapshot.tokens
    this.depth = state.snapshot.depth
    this.startedAt = state.startedAt
    this.relaxed = false
    this.signatures.clear()
    for (const [key, value] of state.signatures) this.signatures.set(key, value)
    this.pairs.clear()
    for (const [key, pair] of state.pairs) this.pairs.set(key, {
      alternations: pair.alternations,
      ...pair.brokenUntil === undefined ? {} : { brokenUntil: pair.brokenUntil },
    })
    this.pending.clear()
    for (const [member, value] of state.pending) this.pending.set(member, value)
    this.recent.length = 0
  }

  /** Current counters and breaker state. */
  snapshot(): RoomGuardSnapshot {
    return {
      breaker: this.breaker,
      ...this.tripReason === undefined ? {} : { reason: this.tripReason },
      turns: this.turns,
      messages: this.messages,
      tokens: this.tokens,
      elapsedMs: Math.max(0, this.now() - this.startedAt),
      depth: this.depth,
    }
  }

  /** Tokens remaining for one member's day, given its daily ceiling and spend. */
  static memberRemaining(dailyTokens: number, spent: number): number {
    return remaining(dailyTokens, spent)
  }

  private bucketOf(member: RoomMemberId): Bucket {
    const existing = this.buckets.get(member)
    const now = this.now()
    if (existing === undefined) {
      const bucket = { tokens: this.spec.guard.memberBurst, updatedAt: now }
      this.buckets.set(member, bucket)
      return bucket
    }
    const elapsed = Math.max(0, now - existing.updatedAt)
    const refill = (elapsed / 60_000) * this.spec.guard.memberTurnsPerMinute
    existing.tokens = Math.min(this.spec.guard.memberBurst, existing.tokens + refill)
    existing.updatedAt = now
    return existing
  }

  private consume(member: RoomMemberId): void {
    const bucket = this.bucketOf(member)
    bucket.tokens = Math.max(0, bucket.tokens - 1)
  }

  private pairOf(left: RoomMemberId, right: RoomMemberId): PairState {
    const key = [left, right].sort().join('|')
    const existing = this.pairs.get(key)
    if (existing !== undefined) return existing
    const pair: PairState = { alternations: 0 }
    this.pairs.set(key, pair)
    return pair
  }

  private alternate(pair: PairState): void {
    pair.alternations += 1
  }
}

/** Build one refusal verdict. */
function refuse(refusal: RefusalCode, detail: string): AdmissionVerdict {
  return { ok: false, refusal, detail }
}
